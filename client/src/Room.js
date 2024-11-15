import React, { useEffect, useRef, useState } from 'react';
import io from 'socket.io-client';
import Peer from 'peerjs';
import { useNavigate } from 'react-router-dom';

const socket = io('http://localhost:3000');

function Room() {
    const navigate = useNavigate();
    const [peerId, setPeerId] = useState('');
    const peerRef = useRef(null);
    const localVideoRef = useRef(null);
    const remoteVideoRef = useRef(null);
    const [remotePeerId, setRemotePeerId] = useState('');

    useEffect(() => {
        // Initialize PeerJS
        console.log('my socket id is', socket.id);

        // now we simplify by using the client ID as the peer ID
        peerRef.current = new Peer(socket.id);

        peerRef.current.on('open', (id) => {
            console.log('My peer ID is: ' + id);
            setPeerId(id);
            // Join the room immediately after getting the peer ID
            joinRoom(id);
        });

        // Start local video stream immediately
        navigator.mediaDevices.getUserMedia({ video: true, audio: true })
            .then((stream) => {
                // Display your own video stream
                if (localVideoRef.current) {
                    localVideoRef.current.srcObject = stream;
                }

                // Store the stream in a ref for later use
                peerRef.current.localStream = stream;
            })
            .catch(error => console.error('Error accessing media devices:', error));

        // Whenever we are called, we pass our local stream to the other peer
        peerRef.current.on('call', (call) => {
            // Answer the call by passing our local stream to the other peer
            call.answer(peerRef.current.localStream);

            // Handle the remote stream: incoming call, this happens when you join a room that a user is already in
            console.log('Incoming call from ' + call.peer);
            handleRemoteStream(call);
            setRemotePeerId(call.peer);
        });

        // Listen for the 'user-connected' event, this gets triggered after the joinRoom function emits the 'join-room' event
        socket.on('user-connected', (userId) => {
            console.log('Remote user connected with ID:', userId);
            console.log('Remote peer ID set to:', userId);
            setRemotePeerId(userId);

            // Ensure peerRef.current exists before making a call
            if (peerRef.current && peerRef.current.localStream) {
                // Initiate a call to the remote peer using our local stream
                const call = peerRef.current.call(userId, peerRef.current.localStream);

                // Handle the remote stream: outgoing call, this happens when a user joins a room that you're already in
                console.log('Outgoing call to ' + userId);
                handleRemoteStream(call);
            } else {
                console.error('PeerJS instance or local stream not available');
            }
        });

        socket.on('user-disconnected', (userId) => {
            console.log('Remote user disconnected with ID:', userId);
            if (remoteVideoRef.current) {
                remoteVideoRef.current.srcObject = null;
            }
            console.log('Remote peer ID set to empty string');
            setRemotePeerId('');
        });

        return () => {
            // Clean up PeerJS connection and socket listeners
            if (peerRef.current) {
                peerRef.current.destroy();
            }
            socket.off('user-connected');
            socket.off('user-disconnected');
        };
    }, []);

    // Function to handle the remote stream
    const handleRemoteStream = (call) => {
        if (!call) {
            console.error('Call object is undefined in handleRemoteStream');
            return;
        }
        // This code sets the local stream (passed from the other peer) as our remote stream. So their local stream -> our remote stream
        call.on('stream', (remoteStream) => {
            console.log('Remote stream received');
            if (remoteVideoRef.current) {
                remoteVideoRef.current.srcObject = remoteStream;
            }
        });

        call.on('close', () => {
            console.log('Call closed');
            if (remoteVideoRef.current) {
                remoteVideoRef.current.srcObject = null;     // setRemotePeerId('');
            }
            
        });
    };

    const joinRoom = (id) => {
        if (id) {
            // Join the room with the room ID and peer ID. For now, hardcoding the room ID to '1'
            socket.emit('join-room');
            console.log('Joined room with peer ID:');
        } else {
            console.log('Peer ID not yet available');
        }
    };

    const leaveRoom = (remotePeerId) => {
        navigate('/');
    // we pass the remotePeer Id, because when we leave, we need to kick the other user back into the waiting list
        
        socket.emit('leave-room', remotePeerId);
        console.log('remotePeerId left room:', remotePeerId);
    };

    const next = (remotePeerId) => {
        socket.emit('next', remotePeerId);
        console.log('remotePeerId left room:', remotePeerId);
    }

    return (
        <div>
            <h1>Video Chat Room</h1>
            <p>Your Peer ID: {peerId}</p>
            <button onClick={() => leaveRoom(remotePeerId)}>Leave Room</button>
            <button onClick={() => next(remotePeerId)}>Next</button>

            <div>
                <h2>Local Video</h2>
                <video ref={localVideoRef} autoPlay playsInline muted style={{ width: '300px', border: '2px solid black' }}></video>
            </div>

            <div>
                <h2>Remote Video</h2>
                <video ref={remoteVideoRef} autoPlay playsInline style={{ width: '300px', border: '2px solid black' }}></video>
            </div>
            <div>You're chatting with {remotePeerId || 'no one at the moment'}</div>
        </div>
    );
}

export default Room;
