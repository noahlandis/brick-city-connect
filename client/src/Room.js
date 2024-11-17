// Room.js
import React, { useEffect, useRef, useState } from 'react';
import io from 'socket.io-client';
import Peer from 'peerjs';
import { useNavigate } from 'react-router-dom';

function Room() {
  const navigate = useNavigate();
  const [peerId, setPeerId] = useState('');
  const peerRef = useRef(null);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const [remotePeerId, setRemotePeerId] = useState('');
  const socketRef = useRef(null); // Use a ref to store the socket instance
  const [currentCall, setCurrentCall] = useState(null);

  useEffect(() => {
    // Initialize Socket.IO inside useEffect
    socketRef.current = io('http://localhost:3000');

    // Wait for the socket to connect
    socketRef.current.on('connect', () => {
      console.log('Socket connected with ID:', socketRef.current.id);

      // Initialize PeerJS with the socket ID
      peerRef.current = new Peer(socketRef.current.id);

      peerRef.current.on('open', (id) => {
        console.log('My peer ID is: ' + id);
        setPeerId(id);

        // Join the room after getting the peer ID
        joinRoom(id);
      });

      // Start local video stream
      navigator.mediaDevices
        .getUserMedia({ video: true, audio: true })
        .then((stream) => {
          // Display your own video stream
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = stream;
          }

          // Store the stream in a ref for later use
          peerRef.current.localStream = stream;
        })
        .catch((error) =>
          console.error('Error accessing media devices:', error)
        );

      // Handle incoming calls
      peerRef.current.on('call', (call) => {
        // Answer the call by passing our local stream to the other peer
        call.answer(peerRef.current.localStream);

        // Handle the remote stream
        console.log('Incoming call from ' + call.peer);
        handleRemoteStream(call);
        setRemotePeerId(call.peer);
      });

      // Set up Socket.IO event listeners after the socket is connected

      // 'user-connected' event
      socketRef.current.on('user-connected', (userId) => {
        console.log('Remote user connected with ID:', userId);
        console.log('Remote peer ID set to:', userId);
        setRemotePeerId(userId);

        if (peerRef.current && peerRef.current.localStream) {
          // Initiate a call to the remote peer using our local stream
          const call = peerRef.current.call(
            userId,
            peerRef.current.localStream
          );

          // Handle the remote stream
          console.log('Outgoing call to ' + userId);
          handleRemoteStream(call);
        } else {
          console.error('PeerJS instance or local stream not available');
        }
      });

      // 'user-disconnected' event
      socketRef.current.on('user-disconnected', (userId) => {
        console.log('Remote user disconnected with ID:', userId);
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = null;
        }
        console.log('Waiting for partner to reconnect...');
        setRemotePeerId('');
        // Optionally display a message to the user
      });
    });

    // Clean up function
    return () => {
      // Clean up PeerJS connection and socket listeners
      if (currentCall) {
        currentCall.close();
      }
      if (peerRef.current) {
        peerRef.current.destroy();
      }
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  // Function to handle the remote stream
  const handleRemoteStream = (call) => {
    if (!call) {
      console.error('Call object is undefined in handleRemoteStream');
      return;
    }

    // Close any existing call
    if (currentCall) {
      currentCall.close();
      setCurrentCall(null);
    }

    setCurrentCall(call);

    // Set the remote stream
    call.on('stream', (remoteStream) => {
      console.log('Remote stream received');
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = remoteStream;
      }
    });

    call.on('close', () => {
      // Only clear the UI if this is the current active call
      if (call === currentCall) {
        console.log('Current call closed');
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = null;
        }
        setRemotePeerId('');
        setCurrentCall(null);
      }
    });
  };

  const joinRoom = (id) => {
    if (id) {
      socketRef.current.emit('join-room');
      console.log('Joined room with peer ID:', id);
    } else {
      console.log('Peer ID not yet available');
    }
  };

  const leaveRoom = () => {
    navigate('/');
    // Notify the server to handle disconnection
    socketRef.current.emit('leave-room');
    console.log('Left room');
  };

  const next = () => {
    // Notify the server to handle next
    socketRef.current.emit('next');
    console.log('Requested next');
  };

  return (
    <div>
      <h1>Video Chat Room</h1>
      <p>Your Peer ID: {peerId}</p>
      <button onClick={leaveRoom}>Leave Room</button>
      <button onClick={next}>Next</button>

      <div>
        <h2>Local Video</h2>
        <video
          ref={localVideoRef}
          autoPlay
          playsInline
          muted
          style={{ width: '300px', border: '2px solid black' }}
        ></video>
      </div>

      <div>
        <h2>Remote Video</h2>
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          style={{ width: '300px', border: '2px solid black' }}
        ></video>
      </div>
      <div>
        You're chatting with {remotePeerId || 'no one at the moment'}
      </div>
    </div>
  );
}

export default Room;
