import { FilesetResolver, ImageSegmenter } from '@mediapipe/tasks-vision';

/**
 * Keep track of separate segmentation states for local and remote
 * so that we don't collide or overwrite mask data or animationFrameIds.
 */
const segmentationState = {
  local: {
    segmenter: null,
    animationFrameId: null,
    previousMaskData: null,
    backgroundImage: null
  },
  remote: {
    segmenter: null,
    animationFrameId: null,
    previousMaskData: null,
    backgroundImage: null
  }
};

/**
 * Simple helper to get the correct state object.
 */
function getState(isLocal) {
  return isLocal ? segmentationState.local : segmentationState.remote;
}

/**
 * Loads and returns an HTMLImageElement for the specified src.
 */
function loadImage(src) {
  return new Promise((resolve, reject) => {
    if (!src) {
      return reject(new Error('Background source is null or undefined.'));
    }
    const img = new Image();
    img.src = src;
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
  });
}

/**
 * Start segmenting the video and compositing onto a canvas, using an optional background image.
 *
 * @param {HTMLVideoElement} videoElement
 * @param {HTMLCanvasElement} canvasElement
 * @param {string|null} backgroundSrc  e.g. "/rit.jpg" or null for 'none'
 * @param {boolean} isLocal           Indicates whether this is a local stream
 */
export async function startSegmenting(videoElement, canvasElement, backgroundSrc = null, isLocal = true) {
  const state = getState(isLocal);

  // Stop any existing segmentation loop first
  stopSegmenting(isLocal);

  // If background is 'none' or null, do not even start segmentation
  if (!backgroundSrc || backgroundSrc === 'none') {
    return;
  }

  // Load the background image
  try {
    state.backgroundImage = await loadImage(backgroundSrc);
  } catch (err) {
    console.error(err);
    // fallback: no background
    state.backgroundImage = null;
  }

  // If we have not created a segmenter yet, do so now
  if (!state.segmenter) {
    try {
      const vision = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
      );
      state.segmenter = await ImageSegmenter.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: '/model/selfie_segmenter_landscape.tflite'
        },
        runningMode: 'LIVE_STREAM',
        outputCategoryMask: false,
        outputConfidenceMasks: true
      });
    } catch (error) {
      console.error('Error creating image segmenter:', error);
      return;
    }
  }

  // Begin the segmentation loop
  segmentLoop(state, videoElement, canvasElement);
}

/**
 * Continuously run segmentation on each video frame using requestAnimationFrame.
 */
function segmentLoop(state, videoElement, canvasElement) {
  const { segmenter } = state;
  if (!segmenter || !videoElement || !canvasElement) {
    console.warn('segmentLoop() missing a required element or segmenter.');
    return;
  }

  function processFrame() {
    const nowInMs = performance.now();
    segmenter.segmentForVideo(videoElement, nowInMs, (result) => {
      handleSegmentationResult(
        state,
        result,
        videoElement,
        canvasElement
      );
    });
    state.animationFrameId = requestAnimationFrame(processFrame);
  }

  state.animationFrameId = requestAnimationFrame(processFrame);
}

/**
 * Handle each segmentation result by compositing the person over the background, if any.
 */
function handleSegmentationResult(state, result, videoElement, canvasElement) {
  const ctx = canvasElement.getContext('2d');
  const width = canvasElement.width;
  const height = canvasElement.height;

  // If the video size has changed, update the canvas
  if (videoElement.videoWidth !== width || videoElement.videoHeight !== height) {
    canvasElement.width = videoElement.videoWidth;
    canvasElement.height = videoElement.videoHeight;
  }

  const bgImage = state.backgroundImage;
  if (!bgImage) {
    // No background => just draw raw video
    ctx.clearRect(0, 0, width, height);
    ctx.drawImage(videoElement, 0, 0, width, height);
    return;
  }

  const mask = result?.confidenceMasks?.[0];
  if (!mask) {
    // fallback: no mask => just draw the raw video
    ctx.clearRect(0, 0, width, height);
    ctx.drawImage(videoElement, 0, 0, width, height);
    return;
  }

  // 1) Draw background first
  ctx.drawImage(bgImage, 0, 0, width, height);

  // 2) Draw the person on top, using the mask as alpha
  // Use an offscreen canvas to extract the person
  const offscreen = new OffscreenCanvas(width, height);
  const offCtx = offscreen.getContext('2d');
  offCtx.drawImage(videoElement, 0, 0, width, height);

  const videoFrame = offCtx.getImageData(0, 0, width, height);
  const frameData = videoFrame.data;

  // Access mask data
  const maskData = mask.getAsFloat32Array();

  // Create a new Float32Array for smoothing
  const smoothedMask = new Float32Array(maskData.length);

  if (state.previousMaskData) {
    // Temporal smoothing: blend old mask with new mask
    const smoothingFactor = 0.2; 
    for (let i = 0; i < maskData.length; i++) {
      smoothedMask[i] = maskData[i] * (1 - smoothingFactor) + state.previousMaskData[i] * smoothingFactor;
    }
  } else {
    smoothedMask.set(maskData);
  }

  // Keep a copy for next frame
  state.previousMaskData = new Float32Array(smoothedMask);

  // Spatial smoothing (simple 3x3 blur around each pixel)
  const spatialSmoothing = (x, y) => {
    if (x < 1 || y < 1 || x >= width - 1 || y >= height - 1) {
      return smoothedMask[y * width + x];
    }
    let sum = 0;
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        sum += smoothedMask[(y + dy) * width + (x + dx)];
      }
    }
    return sum / 9;
  };

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = y * width + x;
      const smValue = spatialSmoothing(x, y);

      let alpha = 0;
      if (smValue > 0.5) {
        alpha = 255;
      } else if (smValue > 0.2) {
        alpha = ((smValue - 0.2) / 0.3) * 255;
      }
      frameData[i * 4 + 3] = alpha;
    }
  }

  offCtx.putImageData(videoFrame, 0, 0);

  // Finally, draw the masked person over the background
  ctx.drawImage(offscreen, 0, 0, width, height);
}

/**
 * Stop segmenting the video (cancels the animation loop, resets state).
 * @param {boolean} isLocal
 */
export function stopSegmenting(isLocal = true) {
  const state = getState(isLocal);
  const { animationFrameId } = state;

  // Cancel any ongoing requestAnimationFrame
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
    state.animationFrameId = null;
  }

  // Clear out previous mask data
  state.previousMaskData = null;

  // Optional: If you want to fully reset the segmenter each time,
  // you can close it. This will free memory, but you'll need to
  // create a new one next time.
  //
  // if (segmenter) {
  //   segmenter.close();
  //   state.segmenter = null;
  // }

  // Retain the segmenter if you want to reuse it without reloading,
  // but set the backgroundImage to null so it doesn't try to composite.
  state.backgroundImage = null;
}
