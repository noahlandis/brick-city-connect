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
        // Initialize PeerJS
        peerRef.current = new Peer();

        // Get the peer ID from PeerJS
        peerRef.current.on('open', (id) => {
            console.log('My peer ID is: ' + id);
            setPeerId(id);
        });

        // Listen for the 'call' event when a remote peer calls
        peerRef.current.on('call', (call) => {
            navigator.mediaDevices.getUserMedia({ video: true, audio: true })
                .then((stream) => {
                    // Answer the call and send your stream
                    call.answer(stream);
                    // Display your own video stream
                    if (localVideoRef.current) {
                        localVideoRef.current.srcObject = stream;
                    }

                    // Listen for the remote stream
                    call.on('stream', (remoteStream) => {
                        if (remoteVideoRef.current) {
                            remoteVideoRef.current.srcObject = remoteStream;
                        }
                    });
                })
                .catch(error => console.error('Error accessing media devices:', error));
        });

        // Listen for the 'user-connected' event
        socket.on('user-connected', (userId) => {
            console.log('Remote user connected with ID:', userId);
            setRemotePeerId(userId);

            // Initiate a call to the remote peer
            navigator.mediaDevices.getUserMedia({ video: true, audio: true })
                .then((stream) => {
                    // Display your own video stream
                    if (localVideoRef.current) {
                        localVideoRef.current.srcObject = stream;
                    }

                    const call = peerRef.current.call(userId, stream);

                    // Listen for the remote stream
                    call.on('stream', (remoteStream) => {
                        if (remoteVideoRef.current) {
                            remoteVideoRef.current.srcObject = remoteStream;
                        }
                    });
                })
                .catch(error => console.error('Error accessing media devices:', error));
        });

        return () => {
            // Clean up PeerJS connection
            if (peerRef.current) {
                peerRef.current.destroy();
            }
        };
    }, []);

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
