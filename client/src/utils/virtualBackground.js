import { FilesetResolver, ImageSegmenter } from '@mediapipe/tasks-vision';

let animationFrameId = null; // Store the animation frame ID to allow cancellation if needed
let imageSegmenter = null;

/**
 * Start segmenting the video frame by frame, return confidence masks indicating the likelihood of each pixel being part of the background vs the person.
 * Creates a new segmenter if it doesn't exist, otherwise uses the existing one.
 * @param {HTMLVideoElement} videoElement 
 */
export async function startSegmenting(videoElement) {
    try {
        // we stop the animation loop if one is already running
        stopSegmenting();

        // if the segmenter doesn't exist, we create a new one
        if (!imageSegmenter) {
            console.log("just created the segmenter")
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
        }
        else {
            console.log("segmenter already exists")
        }
        segment(imageSegmenter, videoElement);
    } catch (error) {
        console.error('Error creating image segmenter:', error);
        return null;
    }
}

/**
 * Segment the video frame by frame
 * @param {ImageSegmenter} imageSegmenter 
 * @param {HTMLVideoElement} videoElement 
 */
function segment(imageSegmenter, videoElement) {
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

/**
 * Handle the segmentation result, which is a list of confidence masks indicating the likelihood of each pixel being part of the background vs the person.
 * @param {Object} result 
 */
function handleSegmentationResult(result) {
    console.log('Segmentation result:', result);
    // Handle background replacement logic here if necessary
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