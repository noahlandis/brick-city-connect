import { FilesetResolver, ImageSegmenter } from '@mediapipe/tasks-vision';

export async function initializeImageSegmenter(video) {
    try {
        const vision = await FilesetResolver.forVisionTasks(
            'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
        );
        const imageSegmenter = await ImageSegmenter.createFromOptions(vision, {
            baseOptions: {
                modelAssetPath: `/model/selfie_segmenter_landscape.tflite`,
            },
            runningMode: "LIVE_STREAM",
            outputCategoryMask: false,
            outputConfidenceMasks: true,
            resultListener: handleSegmentationResult
        });
        console.log('Image segmenter initialized');
        segment(imageSegmenter, video);
    } catch (error) {
        console.log('Error creating image segmenter:', error);
    }
}

/**
 * Segment the video frame by frame, return confidence masks indicating the likelihood of each pixel being part of the background vs the person
 * @param {ImageSegmenter} imageSegmenter 
 * @param {HTMLVideoElement} video 
 */
function segment(imageSegmenter, video) {
    function segmentFrame() {
        if (video.readyState === 4) {
            try {
                requestAnimationFrame(() => {
                    imageSegmenter.segmentForVideo(video, performance.now(), handleSegmentationResult);
                    segmentFrame();
                });
            } catch (error) {
                console.log('Error segmenting video:', error);
            }
        }
    }
    segmentFrame();
}

/**
 * Handle the segmentation result
 * @param {Object} result 
 */
function handleSegmentationResult(result) {
    console.log('Segmentation result:', result);
}