import React, { useEffect, useRef, useState } from 'react';
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
      // stop stream on cleanup
      stopLocalStream();
    };
  }, []);

  function startLocalStream() {
    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then((stream) => {
        localVideoRef.current.srcObject = stream;
      })
      .catch(error => {
        console.error('Error accessing media devices:', error);
        navigate('/');
      });
  }

  function stopLocalStream() {
    if (localVideoRef.current && localVideoRef.current.srcObject) {
      localVideoRef.current.srcObject.getTracks().forEach((track) => track.stop());
      localVideoRef.current.srcObject = null;
    }
  }


  return (
    <div>
      <h1>Chat</h1>
      <video ref={localVideoRef} autoPlay muted />
    </div>
  );
}

export default Chat;
