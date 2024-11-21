import React, { useEffect, useRef } from 'react';
import io from 'socket.io-client';
import Peer from 'peerjs';
import { useNavigate } from 'react-router-dom';

function Chat() {
  const navigate = useNavigate();
  const socket = io('http://localhost:3000');
  const peer = new Peer();
  const localVideoRef = useRef(null);

  useEffect(() => {
    // Start local video stream immediately
    startLocalStream();

    return () => {
      // Stop stream on cleanup
      stopLocalStream();
    };
  }, []);

  function startLocalStream() {
    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then((stream) => {
        localVideoRef.current.srcObject = stream;

        // Monitor video track
        stream.getVideoTracks().forEach((track) => {
          track.onended = handleTrackDisabled; // Handle camera turned off
          track.onmute = handleTrackDisabled;  // Handle camera muted
        });

        // Monitor audio track
        stream.getAudioTracks().forEach((track) => {
          track.onended = handleTrackDisabled; // Handle mic turned off
          track.onmute = handleTrackDisabled;  // Handle mic muted
        });
      })
      .catch(error => {
        console.error('Error accessing media devices:', error);
        handleTrackDisabled();
      });
  }

  function stopLocalStream() {
    if (localVideoRef.current && localVideoRef.current.srcObject) {
      localVideoRef.current.srcObject.getTracks().forEach((track) => track.stop());
      localVideoRef.current.srcObject = null;
    }
  }

  function handleTrackDisabled() {
    console.log('Track disabled (camera/mic turned off or muted)');
    navigate('/'); // Redirect to home
  }

  return (
    <div>
      <h1>Chat</h1>
      <video ref={localVideoRef} autoPlay muted />
    </div>
  );
}

export default Chat;
