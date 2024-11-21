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
    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then((stream) => {
        localVideoRef.current.srcObject = stream;
      })
      .catch(error => console.error('Error accessing media devices:', error));
  }, []);

  return (
    <div>
      <h1>Chat</h1>
      <video ref={localVideoRef} autoPlay muted />
    </div>
  );
}

export default Chat;
