import React, { useEffect, useRef, useState } from 'react';
import io from 'socket.io-client';
import Peer from 'peerjs';

const socket = io('http://localhost:3000');

function Room() {
    const [peerId, setPeerId] = useState('');
    const [remotePeerId, setRemotePeerId] = useState('');
    const peerRef = useRef(null);
    const localVideoRef = useRef(null);
    const remoteVideoRef = useRef(null);

    useEffect(() => {
        // Initialize PeerJS: basically, a peer-to-peer library that generates random IDs for each client
        peerRef.current = new Peer();

        // Get the peer ID from PeerJS
        peerRef.current.on('open', (id) => {
            console.log('My peer ID is: ' + id);
            setPeerId(id);
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

            // Handle the remote stream: incoming call
            handleRemoteStream(call);
        });

        // Listen for the 'user-connected' event, this gets triggered after the joinRoom function emits the 'join-room' event
        socket.on('user-connected', (userId) => {
            console.log('Remote user connected with ID:', userId);
            setRemotePeerId(userId);

            // Initiate a call to the remote peer using our local
            const call = peerRef.current.call(userId, peerRef.current.localStream);

            // Handle the remote stream: outgoing call
            handleRemoteStream(call);
        });

        return () => {
            // Clean up PeerJS connection
            if (peerRef.current) {
                peerRef.current.destroy();
            }
        };
    }, []);

    // Function to handle the remote stream
    const handleRemoteStream = (call) => {
        // This code sets the local stream (passed from the other peer) as our remote stream. So their local stream -> our remote stream
        call.on('stream', (remoteStream) => {
            if (remoteVideoRef.current) {
                remoteVideoRef.current.srcObject = remoteStream;
            }
        });
    };

    const joinRoom = () => {
        if (peerId) {
            // Join the room with the room ID and peer ID. For now, hardcoding the room ID to '1'
            socket.emit('join-room', '1', peerId);
            console.log('Joined room with peer ID:', peerId);
        } else {
            console.log('Peer ID not yet available');
        }
    };

    return (
        <div>
            <h1>Room Component</h1>
            <p>Your Peer ID: {peerId}</p>
            <button onClick={joinRoom}>Join Room</button>

            <div>
                <h2>Local Video</h2>
                <video ref={localVideoRef} autoPlay playsInline muted style={{ width: '300px', border: '2px solid black' }}></video>
            </div>

            <div>
                <h2>Remote Video</h2>
                <video ref={remoteVideoRef} autoPlay playsInline style={{ width: '300px', border: '2px solid black' }}></video>
            </div>
        </div>
    );
}

export default Room;
