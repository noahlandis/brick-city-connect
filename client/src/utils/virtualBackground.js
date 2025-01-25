import { FilesetResolver, ImageSegmenter } from '@mediapipe/tasks-vision';

let animationFrameId = null;  // Store the animation frame ID to allow cancellation if needed
let imageSegmenter = null;    // Store the single ImageSegmenter instance
let backgroundImage = null;   // Will hold the loaded background image
let backgroundSrcCached = null; // Track what background was last loaded
let previousMaskData = null;  // Store the previous frame's mask for temporal smoothing

/**
 * Loads and returns an HTMLImageElement for the specified src.
 */
function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    // In React with a "public" folder, the correct path might be "/rit.jpg" if in public root
    img.src = src;
    // If needed, set crossOrigin if the resource is from a different domain
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
  });
}

/**
 * Start segmenting the video and compositing onto a canvas, using an optional background image.
 *
 * @param {HTMLVideoElement} videoElement
 * @param {HTMLCanvasElement} canvasElement
 * @param {string|null} backgroundSrc  e.g. "/rit.jpg" or null for none
 */
export async function startSegmenting(videoElement, canvasElement, backgroundSrc = null) {
  // First, stop any existing segmentation loop
  stopSegmenting();

  // Load or clear the background image if needed
  if (backgroundSrc) {
    // Only load if the src has changed or we haven't loaded anything yet
    if (!backgroundImage || backgroundSrcCached !== backgroundSrc) {
      try {
        backgroundImage = await loadImage(backgroundSrc);
        backgroundSrcCached = backgroundSrc;
      } catch (err) {
        console.error('Failed to load background image:', err);
        backgroundImage = null;
      }
    }
  } else {
    // No background
    backgroundImage = null;
    backgroundSrcCached = null;
  }

  // If we have not yet created the segmenter, create it once
  if (!imageSegmenter) {
    try {
      const vision = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
      );
      imageSegmenter = await ImageSegmenter.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: '/model/selfie_segmenter_landscape.tflite',
        },
        runningMode: 'LIVE_STREAM',
        outputCategoryMask: false,
        outputConfidenceMasks: true,
      });
    } catch (error) {
      console.error('Error creating image segmenter:', error);
      return;
    }
  }

  // Begin the segmentation loop
  segmentLoop(imageSegmenter, videoElement, canvasElement);
}

/**
 * Continuously run segmentation on each video frame using requestAnimationFrame.
 */
function segmentLoop(imageSegmenter, videoElement, canvasElement) {
  if (!imageSegmenter || !videoElement || !canvasElement) {
    console.warn('segmentLoop() missing a required element or segmenter.');
    return;
  }

  function processFrame() {
    const nowInMs = performance.now();
    imageSegmenter.segmentForVideo(videoElement, nowInMs, (result) => {
      handleSegmentationResult(result, videoElement, canvasElement, backgroundImage);
    });
    animationFrameId = requestAnimationFrame(processFrame);
  }

  animationFrameId = requestAnimationFrame(processFrame);
}

/**
 * Handle each segmentation result by compositing the person over the background, if any.
 */
function handleSegmentationResult(result, videoElement, canvasElement, bgImage) {
  const ctx = canvasElement.getContext('2d');
  const width = canvasElement.width;
  const height = canvasElement.height;

  // If no background is chosen, just draw the raw video frame
  if (!bgImage) {
    ctx.clearRect(0, 0, width, height);
    ctx.drawImage(videoElement, 0, 0, width, height);
    return;
  }

  // Get the confidence mask (0 or 1 channels, likely 1 in this case)
  const mask = result?.confidenceMasks?.[0];
  if (!mask) {
    // fallback: no mask => just draw the video
    ctx.clearRect(0, 0, width, height);
    ctx.drawImage(videoElement, 0, 0, width, height);
    return;
  }

  // Draw the background first
  ctx.drawImage(bgImage, 0, 0, width, height);

  // Create an offscreen canvas to draw the video
  const offscreen = new OffscreenCanvas(width, height);
  const offCtx = offscreen.getContext('2d');
  offCtx.drawImage(videoElement, 0, 0, width, height);

  // Get the video frame pixels
  const videoFrame = offCtx.getImageData(0, 0, width, height);
  const frameData = videoFrame.data;

  // Access the mask data as a Float32Array
  const maskData = mask.getAsFloat32Array();
  
  // Create a smoothed version of the mask with temporal smoothing
  const smoothedMask = new Float32Array(maskData.length);
  
  // Apply temporal smoothing if we have a previous frame
  if (previousMaskData) {
    const smoothingFactor = 0.2; // Reduced from 0.3 to make it more responsive
    for (let i = 0; i < maskData.length; i++) {
      smoothedMask[i] = maskData[i] * (1 - smoothingFactor) + previousMaskData[i] * smoothingFactor;
    }
  } else {
    smoothedMask.set(maskData);
  }
  
  // Store current mask for next frame
  previousMaskData = new Float32Array(smoothedMask);

  // Apply spatial smoothing to reduce edge artifacts
  const spatialSmoothing = (x, y) => {
    if (x < 1 || y < 1 || x >= width - 1 || y >= height - 1) return smoothedMask[y * width + x];
    
    let sum = 0;
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        sum += smoothedMask[(y + dy) * width + (x + dx)];
      }
    }
    return sum / 9;
  };

  // Apply the smoothed mask with anti-aliased edges
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = y * width + x;
      const smoothedValue = spatialSmoothing(x, y);
      
      // Adjusted thresholds to be more aggressive about keeping person visible
      let alpha = 0;
      if (smoothedValue > 0.5) {  // Lowered from 0.7
        alpha = 255;
      } else if (smoothedValue > 0.2) {  // Lowered from 0.3
        alpha = (smoothedValue - 0.2) / 0.3 * 255;  // Adjusted range
      }
      
      frameData[i * 4 + 3] = alpha;
    }
  }

  // Put the updated video frame back
  offCtx.putImageData(videoFrame, 0, 0);

  // Draw the person (with masked alpha) on top of the background
  ctx.drawImage(offscreen, 0, 0, width, height);
}

/**
 * Stop segmenting the video (cancels the animation loop).
 */
export function stopSegmenting() {
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
  }
}
