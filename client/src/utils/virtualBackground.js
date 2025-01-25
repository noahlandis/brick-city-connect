import { FilesetResolver, ImageSegmenter } from '@mediapipe/tasks-vision';

let animationFrameId = null;  // Store the animation frame ID to allow cancellation if needed
let imageSegmenter = null;    // Store the single ImageSegmenter instance
let backgroundImage = null;   // Will hold the loaded background image
let backgroundSrcCached = null; // Track what background was last loaded

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
  // Pixel-by-pixel, we set alpha=0 for background
  for (let i = 0; i < maskData.length; i++) {
    const personConfidence = maskData[i]; // typically 0..1
    // If confidence < 0.5, treat as background => transparent
    if (personConfidence < 0.5) {
      frameData[i * 4 + 3] = 0; // set alpha channel to 0
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
