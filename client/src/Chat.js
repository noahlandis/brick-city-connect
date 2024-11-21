import React, { useEffect, useRef } from 'react';
import io from 'socket.io-client';
import Peer from 'peerjs';
import { useNavigate } from 'react-router-dom';

function Chat() {
  const navigate = useNavigate();
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);


  const localUserRef = useRef(null);
  const socketRef = useRef(null);

  useEffect(() => {
    // Start local video stream immediately
    startLocalStream();
    
    joinChat();

    socketRef.current.on('match-found', (remoteUserId) => {
      localUserRef.current.call(remoteUserId, localVideoRef.current.srcObject);
    });

    localUserRef.current.on('call', (call) => {
      call.answer(localVideoRef.current.srcObject);

      // after we answer the call, we get the remote stream
      call.on('stream', (remoteStream) => {
        remoteVideoRef.current.srcObject = remoteStream;
      });
    });


    return () => {
      // Stop stream on cleanup
      stopLocalStream();

      if (localUserRef.current) {
        localUserRef.current.destroy();
      }
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);


  function joinChat() {
    // initialize socket
    socketRef.current = io('http://localhost:3000', {
      transports: ['websocket'],
      upgrade: false
    });

    // initialize peer
    localUserRef.current = new Peer();

    // once the peer is open, we join the chat
    localUserRef.current.on('open', (localUserID) => {
      socketRef.current.emit('join-chat', localUserID);
    });

  }

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
      <video ref={remoteVideoRef} autoPlay />
    </div>
  );
}

export default Chat;
