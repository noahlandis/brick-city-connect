import React, { useEffect, useRef, useState } from 'react';
import io from 'socket.io-client';
import Peer from 'peerjs';
import Bugsnag from '@bugsnag/js';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';

import { ImageSegmenter, FilesetResolver } from "@mediapipe/tasks-vision";

function Chat() {
  const navigate = useNavigate();
  
  // --- References for local video, remote video, and canvas ---
  const rawVideoRef = useRef(null);        // raw webcam feed for processing
  const canvasRef = useRef(null);          // for drawing segmented output
  const remoteVideoRef = useRef(null);     // for remote user's feed
  
  // Socket & Peer references
  const socketRef = useRef(null);
  const localUserRef = useRef(null);

  // Keep track of the user (if you're using AuthContext for user info)
  const { user } = useAuth();

  // States for streaming & segmentation
  const [isStreamReady, setIsStreamReady] = useState(false);
  const [imageSegmenter, setImageSegmenter] = useState(null);
  const [runningMode, setRunningMode] = useState("IMAGE");
  const [backgroundImage, setBackgroundImage] = useState(null);
  
  // Optional: track if segmentation is enabled
  const [segmentationEnabled, setSegmentationEnabled] = useState(true);

  // We'll store the "segmented" MediaStream in a ref so we can pass it into PeerJS
  const segmentedStreamRef = useRef(null);

  /************************************************
   * 1. Load the segmentation model on mount
   ************************************************/
  useEffect(() => {
    const loadSegmenter = async () => {
      try {
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
      } catch (error) {
        console.error("Error initializing ImageSegmenter:", error);
      }
    };

    loadSegmenter();
  }, [runningMode]);

  /************************************************
   * 2. Load background image (for replacement)
   ************************************************/
  useEffect(() => {
    const img = new Image();
    // Make sure 'rit.jpg' is in your public folder or accessible path
    img.src = 'rit.jpg';
    img.onload = () => setBackgroundImage(img);
  }, []);

  /************************************************
   * 3. Start local stream + set up segmentation
   *    Then, once ready, join the chat (PeerJS)
   ************************************************/
  useEffect(() => {
    startLocalStream();

    return () => {
      // Cleanup on unmount
      stopLocalStream();
      if (localUserRef.current) {
        localUserRef.current.destroy();
      }
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Once local stream is ready, connect to the server / peer
  useEffect(() => {
    if (isStreamReady) {
      joinChat();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isStreamReady]);

  /************************************************
   * 4. Start local stream (raw camera)
   *    Then create a "segmented" stream from the canvas
   ************************************************/
  function startLocalStream() {
    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then((stream) => {
        // Show raw camera feed on a hidden video (for processing)
        rawVideoRef.current.srcObject = stream;

        // Make sure track endings cause user to leave
        stream.getTracks().forEach((track) => {
          track.onended = leaveChat;
          track.onmute = leaveChat;
        });

        // We'll wait for onLoadedData in the <video> to begin segmentation,
        // which sets up the segmented stream from the <canvas>.
        setIsStreamReady(true);
      })
      .catch((error) => {
        console.error('Error accessing media devices:', error);
        leaveChat();
      });
  }

  function stopLocalStream() {
    if (rawVideoRef.current && rawVideoRef.current.srcObject) {
      rawVideoRef.current.srcObject.getTracks().forEach((track) => track.stop());
      rawVideoRef.current.srcObject = null;
    }
  }

  /************************************************
   * 5. After we have the local stream, join the chat
   *    (Set up PeerJS, listen for calls, etc.)
   ************************************************/
  function joinChat() {
    socketRef.current = io(process.env.REACT_APP_SERVER_URL, {
      transports: ['websocket'],
      upgrade: false,
    });

    localUserRef.current = new Peer();

    // Once the peer is open, notify server of our peerID
    localUserRef.current.on('open', (localPeerID) => {
      console.log('local user id:', localPeerID);
      socketRef.current.emit('join-chat', localPeerID, user?.username || 'Unknown');
    });

    localUserRef.current.on('error', (error) => {
      Bugsnag.notify(error);
    });

    socketRef.current.on('leave-chat', () => {
      console.log('user left');
      leaveChat();
    });

    // Someone on the server side found a match for us:
    socketRef.current.on('match-found', (remotePeerID) => {
      console.log("call initiated");
      // Use the segmented stream for the call
      const call = localUserRef.current.call(
        remotePeerID,
        segmentedStreamRef.current // <--- pass the canvas-based stream
      );
      handleRemoteCall(call);
    });

    // If we receive a call, answer with our segmented stream
    localUserRef.current.on('call', (call) => {
      console.log("call received");
      call.answer(segmentedStreamRef.current);
      handleRemoteCall(call);
    });
  }

  // Manage remote call
  function handleRemoteCall(call) {
    call.on('stream', (remoteStream) => {
      remoteVideoRef.current.srcObject = remoteStream;
    });

    // If the server tells us to close the connection
    socketRef.current.on('close-connection', () => {
      call.close();
    });

    call.on('close', function () {
      console.log("closing call");
      if (remoteVideoRef.current && remoteVideoRef.current.srcObject) {
        remoteVideoRef.current.srcObject.getTracks().forEach((track) => track.stop());
        remoteVideoRef.current.srcObject = null;
      }
    });

    call.on('error', (error) => {
      Bugsnag.notify(error);
    });
  }

  /************************************************
   * 6. Segmentation logic:
   *    - We draw the raw video frame in a loop
   *    - Then replace background with an image
   *    - Then use canvas.captureStream() to get the final feed
   ************************************************/
  const onVideoLoadedData = () => {
    // Start a requestAnimationFrame loop if segmentation is enabled
    if (segmentationEnabled && imageSegmenter && rawVideoRef.current) {
      if (runningMode === "IMAGE") {
        setRunningMode("VIDEO"); // Switch to VIDEO mode for streaming
        imageSegmenter.setOptions({ runningMode: "VIDEO" });
      }
      predictWebcam(); // start the loop
    }
    
    // Create a MediaStream from the canvas to send via Peer
    // (30 fps is an example frame rate)
    segmentedStreamRef.current = canvasRef.current.captureStream(30);
  };

  const predictWebcam = async () => {
    if (!rawVideoRef.current || !imageSegmenter) return;
    
    const startTimeMs = performance.now();
    // We call segmentForVideo, which will return results to callbackForVideo
    imageSegmenter.segmentForVideo(rawVideoRef.current, startTimeMs, callbackForVideo);
  };

  // This is called for every frame in 'VIDEO' mode
  const callbackForVideo = (result) => {
    if (!canvasRef.current) return;

    if (rawVideoRef.current.videoWidth === 0 || rawVideoRef.current.videoHeight === 0) {
      requestAnimationFrame(predictWebcam); // Try again next frame
      return;
    }

    const canvasCtx = canvasRef.current.getContext('2d');
    const video = rawVideoRef.current;
    
    // First, draw the background image on the canvas
    if (backgroundImage) {
      canvasCtx.drawImage(
        backgroundImage,
        0, 0,
        video.videoWidth, video.videoHeight
      );
    } else {
      // If no background image, just clear with black or something
      canvasCtx.clearRect(0, 0, video.videoWidth, video.videoHeight);
    }

    // Then draw the raw video on top in a hidden buffer, so we can pick out pixels
    // We'll do that by putting the video in a temporary canvas or directly in memory
    // For simplicity, we can do it in the same canvas, but we need the original frame:
    // Step 1: Grab the background from the canvas
    let backgroundFrame = canvasCtx.getImageData(
      0, 0,
      video.videoWidth, video.videoHeight
    );

    // Step 2: Draw the video on top
    canvasCtx.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
    const videoFrame = canvasCtx.getImageData(
      0, 0,
      video.videoWidth, video.videoHeight
    );

    // Now, restore the background first
    canvasCtx.putImageData(backgroundFrame, 0, 0);

    // Get the mask from the result
    const mask = result.categoryMask.getAsFloat32Array();
    const outputFrame = canvasCtx.getImageData(
      0, 0, video.videoWidth, video.videoHeight
    );

    // For each pixel, decide if we keep the original video pixel
    // or the background pixel
    for (let i = 0; i < mask.length; i++) {
      const j = i * 4;
      // mask[i] is in [0,1]. If it's near 1, means it's person.
      // If you want to remove background, we keep the video pixel.
      if (mask[i] > 0.01) {
        // Keep the video pixel
        outputFrame.data[j] = videoFrame.data[j];
        outputFrame.data[j + 1] = videoFrame.data[j + 1];
        outputFrame.data[j + 2] = videoFrame.data[j + 2];
        outputFrame.data[j + 3] = 255; // opaque
      }
      // else we keep the background from outputFrame (which is already drawn from backgroundImage)
    }

    // Finally, put the segmented result on the canvas
    canvasCtx.putImageData(outputFrame, 0, 0);

    // Keep going if segmentation is still enabled
    if (segmentationEnabled) {
      requestAnimationFrame(predictWebcam);
    }
  };

  /************************************************
   * 7. UI actions
   ************************************************/
  function leaveChat() {
    navigate('/'); // Or however you want to exit
  }

  return (
    <div>
      <h1>Video Chat with Background Segmentation</h1>

      {/* Remote video: this is what we receive from PeerJS */}
      <video
        ref={remoteVideoRef}
        autoPlay
        playsInline
        style={{ width: '400px', border: '2px solid black' }}
      />

      {/* Our "local" segmented video: displayed via canvas */}
      <div style={{ position: 'relative', display: 'inline-block' }}>
        <canvas
          ref={canvasRef}
          width="640"
          height="480"
          style={{ border: '2px solid black' }}
        />
        {/* The raw video is hidden; we only see the segmentation result on the canvas */}
        <video
          ref={rawVideoRef}
          autoPlay
          playsInline
          muted
          style={{ display: 'none' }}
          onLoadedData={onVideoLoadedData}
        />
      </div>

      <div>
        <button onClick={() => socketRef.current?.emit('next')}>
          Next
        </button>
        <button onClick={leaveChat}>
          Leave
        </button>
        <button onClick={() => setSegmentationEnabled((prev) => !prev)}>
          {segmentationEnabled ? "Stop Segmentation" : "Start Segmentation"}
        </button>
      </div>
    </div>
  );
}

export default Chat;
