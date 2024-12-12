import React, { useEffect, useRef, useState } from 'react';
import io from 'socket.io-client';
import Peer from 'peerjs';
import { useNavigate } from 'react-router-dom';

function Chat() {
  const navigate = useNavigate();
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);

  const localUserRef = useRef(null);
  const socketRef = useRef(null);

  const [isStreamReady, setIsStreamReady] = useState(false);

  useEffect(() => {
    // Start local video stream and set up chat when ready
    startLocalStream();

    return () => {
      // Stop stream on cleanup, **check if this is needed before pushing to staging**
      stopLocalStream();

      if (localUserRef.current) {
        localUserRef.current.destroy();
      }

      // This ensures we tell the server that we've disconnected if we leave the page
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  useEffect(() => {
    if (isStreamReady) {
      joinChat();
    }
  }, [isStreamReady]);

  function joinChat() {
    // Initialize socket
    socketRef.current = io('http://localhost:3000', {
      transports: ['websocket'],
      upgrade: false,
    });

    // Initialize peer
    localUserRef.current = new Peer();

    // Once the peer is open, we join the chat
    localUserRef.current.on('open', (localUserID) => {
      console.log('local user id', localUserID);
      socketRef.current.emit('join-chat', localUserID);
    });

    // initiate call
    socketRef.current.on('match-found', (remoteUserId) => {
      console.log("call initiated");
      const call = localUserRef.current.call(remoteUserId, localVideoRef.current.srcObject);
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

        setIsStreamReady(true); // Mark stream as ready
      })
      .catch((error) => {
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
      <button onClick={() => {
        socketRef.current.emit('next');
      }}>
        Next
      </button>
    </div>
  );
}

export default Chat;


