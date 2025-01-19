import React, { useEffect, useRef, useState } from 'react';
import io from 'socket.io-client';
import Peer from 'peerjs';
import { ImageSegmenter, FilesetResolver } from "@mediapipe/tasks-vision";

function Chat() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [webcamRunning, setWebcamRunning] = useState(false);
  const [imageSegmenter, setImageSegmenter] = useState(null);
  const [runningMode, setRunningMode] = useState("IMAGE");
  
  // Define legend colors
  const legendColors = [
    [255, 197, 0, 255], // Vivid Yellow
    [128, 62, 117, 255], // Strong Purple
    // ... rest of the colors ...
  ];

  // Initialize image segmenter
  useEffect(() => {
    const initializeSegmenter = async () => {
      const vision = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.2/wasm"
      );

      const segmenter = await ImageSegmenter.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath:
            "https://storage.googleapis.com/mediapipe-models/image_segmenter/deeplab_v3/float32/1/deeplab_v3.tflite",
          delegate: "GPU"
        },
        runningMode: runningMode,
        outputCategoryMask: true,
        outputConfidenceMasks: false
      });
      
      setImageSegmenter(segmenter);
    };

    initializeSegmenter();
  }, []);

  // Webcam handling
  const enableCam = async () => {
    if (!imageSegmenter) return;

    setWebcamRunning(prev => !prev);
    
    if (!webcamRunning) {
      const constraints = { video: true };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      videoRef.current.srcObject = stream;
    }
  };

  // Video callback function
  const callbackForVideo = (result) => {
    const canvasCtx = canvasRef.current.getContext('2d');
    const video = videoRef.current;
    
    let imageData = canvasCtx.getImageData(
      0,
      0,
      video.videoWidth,
      video.videoHeight
    ).data;

    const mask = result.categoryMask.getAsFloat32Array();
    let j = 0;
    
    for (let i = 0; i < mask.length; ++i) {
      const maskVal = Math.round(mask[i] * 255.0);
      const legendColor = legendColors[maskVal % legendColors.length];
      imageData[j] = (legendColor[0] + imageData[j]) / 2;
      imageData[j + 1] = (legendColor[1] + imageData[j + 1]) / 2;
      imageData[j + 2] = (legendColor[2] + imageData[j + 2]) / 2;
      imageData[j + 3] = (legendColor[3] + imageData[j + 3]) / 2;
      j += 4;
    }

    const uint8Array = new Uint8ClampedArray(imageData.buffer);
    const dataNew = new ImageData(
      uint8Array,
      video.videoWidth,
      video.videoHeight
    );
    canvasCtx.putImageData(dataNew, 0, 0);
    
    if (webcamRunning) {
      requestAnimationFrame(predictWebcam);
    }
  };

  // Prediction function
  const predictWebcam = async () => {
    if (!videoRef.current || !imageSegmenter) return;
    
    const canvasCtx = canvasRef.current.getContext('2d');
    canvasCtx.drawImage(
      videoRef.current,
      0,
      0,
      videoRef.current.videoWidth,
      videoRef.current.videoHeight
    );

    if (runningMode === "IMAGE") {
      setRunningMode("VIDEO");
      await imageSegmenter.setOptions({ runningMode: "VIDEO" });
    }

    const startTimeMs = performance.now();
    imageSegmenter.segmentForVideo(videoRef.current, startTimeMs, callbackForVideo);
  };

  return (
    <div>
      <h2>Webcam Segmentation</h2>
      <button onClick={enableCam}>
        {webcamRunning ? 'Disable Segmentation' : 'Enable Segmentation'}
      </button>
      <div className="webcam">
        <video
          ref={videoRef}
          autoPlay
          style={{ display: 'none' }}
          onLoadedData={predictWebcam}
        />
        <canvas
          ref={canvasRef}
          width="1280px"
          height="720px"
        />
      </div>
    </div>
  );
}

export default Chat;
