import { FilesetResolver, ImageSegmenter } from '@mediapipe/tasks-vision';

let animationFrameId = null; 
let imageSegmenter = null;

// We'll store references to the video, canvas, background, and 2D contexts
let videoEl = null;
let canvasEl = null;
let canvasCtx = null;

let backgroundImage = null;
let tempCanvas = null;
let tempCtx = null;

/**
 * Start segmenting the video frame by frame; if the segmenter doesn't exist,
 * create it. Then run `segment()` which animates the segmentation.
 */
export async function startSegmenting(videoElement, canvasElement) {
  try {
    // Stop any existing loop
    stopSegmenting();

    // Save references
    videoEl = videoElement;
    canvasEl = canvasElement;
    canvasCtx = canvasEl.getContext('2d');

    // Prepare temp canvas for capturing the raw video
    if (!tempCanvas) {
      tempCanvas = document.createElement('canvas');
      tempCtx = tempCanvas.getContext('2d');
    }

    // Load background image once
    if (!backgroundImage) {
      backgroundImage = new Image();
      backgroundImage.src = '/rit.jpg'; 
    }

    // If the segmenter doesn't exist, create it
    if (!imageSegmenter) {
      console.log('Creating new ImageSegmenter...');
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
    } else {
      console.log('Segmenter already exists...');
    }

    // Start the segmentation loop
    segmentLoop();
  } catch (error) {
    console.error('Error creating image segmenter:', error);
    return null;
  }
}

/**
 * The animation loop calls segmentForVideo on each frame
 */
function segmentLoop() {
  function processFrame() {
    if (!imageSegmenter || !videoEl) return;
    imageSegmenter.segmentForVideo(videoEl, performance.now(), handleSegmentationResult);
    animationFrameId = requestAnimationFrame(processFrame);
  }
  animationFrameId = requestAnimationFrame(processFrame);
}

/**
 * This callback is invoked each frame with the segmentation result
 * (e.g. the confidence masks).
 */
function handleSegmentationResult(result) {
  if (!videoEl || !canvasEl) return;

  const width = videoEl.videoWidth;
  const height = videoEl.videoHeight;

  // If video not ready or zero dimensions, skip
  if (!width || !height) return;

  // Make sure our canvas matches the video size
  canvasEl.width = width;
  canvasEl.height = height;

  // Also match our temp canvas
  tempCanvas.width = width;
  tempCanvas.height = height;

  // Draw the background image to the main canvas
  // (This forms the "base" we will composite on top of)
  canvasCtx.drawImage(backgroundImage, 0, 0, width, height);

  // Draw the current video frame to the temp canvas
  tempCtx.drawImage(videoEl, 0, 0, width, height);
  const videoFrame = tempCtx.getImageData(0, 0, width, height);

  // Get the first confidence mask
  const confidenceMask = result.confidenceMasks[0];
  const maskData = confidenceMask.getAsFloat32Array();

  // Get an ImageData snapshot of our background-laden main canvas
  // We'll overwrite the "person pixels" from the video
  let outputFrame = canvasCtx.getImageData(0, 0, width, height);
  let outputData = outputFrame.data;
  let videoData = videoFrame.data;

  // Threshold for deciding if a pixel belongs to person or background
  const alphaThreshold = 0.5;

  for (let i = 0; i < maskData.length; i++) {
    const maskVal = maskData[i]; // 0..1
    const px = i * 4;

    if (maskVal > alphaThreshold) {
      // We consider this pixel to be "person"
      outputData[px] = videoData[px];       // R
      outputData[px + 1] = videoData[px + 1]; // G
      outputData[px + 2] = videoData[px + 2]; // B
      outputData[px + 3] = videoData[px + 3]; // A
    }
    // Else: we keep the background from outputFrame (already drawn)
  }

  // Put the composited result back on the main canvas
  canvasCtx.putImageData(outputFrame, 0, 0);
}

/**
 * Stop segmenting the video frame by frame
 */
export function stopSegmenting() {
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
  }
}
