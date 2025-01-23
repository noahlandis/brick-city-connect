import { FilesetResolver, ImageSegmenter } from '@mediapipe/tasks-vision';

let animationFrameId = null; // Store the animation frame ID to allow cancellation if needed

export async function initializeImageSegmenter() {
  try {
    const vision = await FilesetResolver.forVisionTasks('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm');
    const imageSegmenter = await ImageSegmenter.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath: '/model/selfie_segmenter_landscape.tflite',
      },
      runningMode: 'LIVE_STREAM',
      outputCategoryMask: false,
      outputConfidenceMasks: true,
      resultListener: handleSegmentationResult,
    });
    return imageSegmenter;
  } catch (error) {
    console.error('Error creating image segmenter:', error);
    return null;
  }
}

export function segment(imageSegmenter, videoElement) {
  if (!imageSegmenter || !videoElement) {
    console.warn('Segmenter or video element not available.');
    return;
  }

  function processFrame() {
    imageSegmenter.segmentForVideo(videoElement, performance.now(), handleSegmentationResult);

    // Schedule the next frame
    animationFrameId = requestAnimationFrame(processFrame);
  }

  // Start processing frames
  animationFrameId = requestAnimationFrame(processFrame);
}

function handleSegmentationResult(result) {
  console.log('Segmentation result:', result);
  // Handle background replacement logic here if necessary
}

export function stopSegmenting() {
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
  }
}
