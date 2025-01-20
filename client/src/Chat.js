import React, { useEffect, useRef, useState } from 'react';
import io from 'socket.io-client';
import Peer from 'peerjs';
import { useNavigate } from 'react-router-dom';
import Bugsnag from '@bugsnag/js';
import { useAuth } from './contexts/AuthContext';
import { FilesetResolver, ImageSegmenter } from '@mediapipe/tasks-vision';
function Chat() {
  const navigate = useNavigate();
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const { user } = useAuth();
  const localUserRef = useRef(null);
  const socketRef = useRef(null);
  const imageSegmenterRef = useRef(null);

  const [isStreamReady, setIsStreamReady] = useState(false);

  useEffect(() => {
    // Start local video stream and set up chat when ready
    startLocalStream();

    return () => {
      // Stop stream on cleanup, **check if this is needed before pushing to staging**
      stopLocalStream();

      // When a user leaves the page, we destroy the peer. This has the side effect of executing call.close(), so we don't need to manually call it here
      if (localUserRef.current) {
        localUserRef.current.destroy();
      }

      // This ensures we tell the server that we've disconnected if we leave the page
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
    // we don't want this to run every render, just on mount so we ignore the eslint warning
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (isStreamReady) {
      initializeSegmenter();
      joinChat();
    }
  }, [isStreamReady]);

  function joinChat() {
    // Initialize socket
    socketRef.current = io(process.env.REACT_APP_SERVER_URL, {
      transports: ['websocket'],
      upgrade: false,
    });

    // Initialize peer
    localUserRef.current = new Peer();

    // Once the peer is open, we join the chat
    localUserRef.current.on('open', (localPeerID) => {
      console.log('local user id', localPeerID);
      socketRef.current.emit('join-chat', localPeerID, user.username);
    });

    localUserRef.current.on('error', (error) => {
      Bugsnag.notify(error);
    });

    socketRef.current.on('leave-chat', () => {
      console.log('user left');
      leaveChat();
    });

    // initiate call
    socketRef.current.on('match-found', (remotePeerID) => {
      console.log("call initiated");
      const call = localUserRef.current.call(remotePeerID, localVideoRef.current.srcObject);
      handleRemoteCall(call);
    });

    // answer call
    localUserRef.current.on('call', (call) => {
      console.log("call recieved");
      call.answer(localVideoRef.current.srcObject);
      handleRemoteCall(call);
    });
  }

  // handle call events
  function handleRemoteCall(call) {

    // their local stream -> our remote stream
    call.on('stream', (remoteStream) => {
      remoteVideoRef.current.srcObject = remoteStream;
    });

    // this fires when a user presses 'next' and the user gets put in the waiting room. We do this to stop the remote video stream, and so we're not storing a stale connection in our peer object 
    socketRef.current.on('close-connection', () => {
      call.close();
    });

    call.on('close', function () {
      console.log("closing call");
      // check if this is needed or we can just call remoteVideoRef.current.srcObject = null
      if (remoteVideoRef.current && remoteVideoRef.current.srcObject) {
        remoteVideoRef.current.srcObject.getTracks().forEach((track) => track.stop());
        remoteVideoRef.current.srcObject = null;
      }
    });

    call.on('error', (error) => {
      Bugsnag.notify(error);
    });
  }

  function startLocalStream() {
    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then((stream) => {
        localVideoRef.current.srcObject = stream;
        
        // Wait for the video to be properly loaded before marking stream as ready
        localVideoRef.current.onloadedmetadata = () => {
          localVideoRef.current.play()
            .then(() => {
              console.log("Video is playing");
              setIsStreamReady(true);
            })
            .catch(error => console.error("Error playing video:", error));
        };

        // Monitor video track
        stream.getVideoTracks().forEach((track) => {
          track.onended = leaveChat;
          track.onmute = leaveChat;
        });
      })
      .catch((error) => {
        console.error('Error accessing media devices:', error);
        leaveChat();
      });
  }

  function stopLocalStream() {
    if (localVideoRef.current && localVideoRef.current.srcObject) {
      localVideoRef.current.srcObject.getTracks().forEach((track) => track.stop());
      localVideoRef.current.srcObject = null;
    }
  }

  function leaveChat() {
    navigate('/'); // Redirect to home
  }

  async function initializeSegmenter() {
    try {
      const vision = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
      );

      imageSegmenterRef.current = await ImageSegmenter.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: `/models/selfie_segmenter_landscape.tflite`,
        },
        runningMode: "LIVE_STREAM",
        outputCategoryMask: false,
        outputConfidenceMasks: true,
        resultListener: handleSegmentationResult

      });
      // Only start segmenter after initialization is complete
      startSegmenter();
    } catch (error) {
      console.error("Error initializing segmenter", error);
    }
  }

  function startSegmenter() {
    // Check if video is ready before starting the render loop
    if (!localVideoRef.current || !localVideoRef.current.videoWidth) {
      console.log("Video not ready yet");
      return;
    }

    let animationFrameId;
    console.log("segmenting");
    function renderLoop() {
      if (localVideoRef.current && localVideoRef.current.videoWidth) {
        try {
          imageSegmenterRef.current.segmentForVideo(localVideoRef.current, performance.now(), handleSegmentationResult);
          animationFrameId = requestAnimationFrame(renderLoop);
        } catch (error) {
          console.error("Error in render loop:", error);
          cancelAnimationFrame(animationFrameId);
        }
      }
    }
    renderLoop();
  }

  function handleSegmentationResult(result) {
   
  }

  return (
    <div>
      <h1>Chat</h1>
      <video
        ref={localVideoRef}
        autoPlay
        muted
        playsInline
        webkit-playsinline="true"
      />
      <video
        ref={remoteVideoRef}
        autoPlay
        playsInline
        webkit-playsinline="true"
      />
      <button onClick={() => {
        socketRef.current.emit('next');
      }}>
        Next
      </button>
      <button onClick={() => {
        leaveChat();
      }}>Leave</button>
    </div>
  );
}

export default Chat;

