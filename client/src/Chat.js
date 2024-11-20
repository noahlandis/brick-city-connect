import React, { useEffect, useRef, useState } from 'react';
import io from 'socket.io-client';
import Peer from 'peerjs';
import { useNavigate } from 'react-router-dom';

function Chat() {
  const navigate = useNavigate();
  const [peerId, setPeerId] = useState('');
  const peerRef = useRef({}); // Use an object to store both peer and localStream
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const [remotePeerId, setRemotePeerId] = useState('');
  const socketRef = useRef(null);
  const [currentCall, setCurrentCall] = useState(null);

  useEffect(() => {
    // Initialize Socket.IO inside useEffect
    socketRef.current = io(process.env.REACT_APP_SERVER_URL);

    // Wait for the socket to connect
    socketRef.current.on('connect', () => {
      console.log('Socket connected with ID:', socketRef.current.id);

      // Start local video stream
      navigator.mediaDevices
        .getUserMedia({ video: true, audio: true })
        .then((stream) => {
          // Display your own video stream
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = stream;
          }

          // Store the stream and initialize PeerJS
          initializePeer(stream);
        })
        .catch((error) =>
          console.error('Error accessing media devices:', error)
        );

      // Set up Socket.IO event listeners
      socketRef.current.on('user-connected', (userId) => {
        console.log('Remote user connected with ID:', userId);
        setRemotePeerId(userId);

        if (peerRef.current.peer && peerRef.current.localStream) {
          // Initiate a call to the remote peer using our local stream
          const call = peerRef.current.peer.call(
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

      socketRef.current.on('user-disconnected', (userId) => {
        console.log('Remote user disconnected with ID:', userId);
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = null;
        }
        console.log('Waiting for partner to reconnect...');
        setRemotePeerId('');
      });
    });

    // Clean up function
    return () => {
      // Clean up PeerJS connection and socket listeners
      if (currentCall) {
        currentCall.close();
      }
      if (peerRef.current.peer) {
        peerRef.current.peer.destroy();
      }
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  const initializePeer = (stream) => {
    // Store the local stream
    peerRef.current.localStream = stream;

    // Initialize PeerJS with the socket ID
    if (!socketRef.current.id) {
      console.error('Socket ID not available');
      return;
    }

    peerRef.current.peer = new Peer(socketRef.current.id, {
      debug: 2,
    });

    peerRef.current.peer.on('open', (id) => {
      console.log('My peer ID is: ' + id);
      setPeerId(id);
      // Join the room after peer connection is established
      joinRoom(id);
    });

    peerRef.current.peer.on('error', (error) => {
      console.error('PeerJS error:', error);
    });

    // Handle incoming calls
    peerRef.current.peer.on('call', (call) => {
      // Answer the call with the local stream
      call.answer(peerRef.current.localStream);

      // Handle the remote stream
      console.log('Incoming call from ' + call.peer);
      handleRemoteStream(call);
      setRemotePeerId(call.peer);
    });
  };

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

export default Chat;
