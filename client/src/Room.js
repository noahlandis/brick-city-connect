import React, { useEffect, useRef, useState } from 'react';
import io from 'socket.io-client';
import Peer from 'peerjs';
import { useNavigate } from 'react-router-dom';

const socket = io('http://localhost:3000');

function Room() {
    const navigate = useNavigate();
    const [userID, setUserID] = useState('');
    const userRef = useRef(null);
    const localVideoRef = useRef(null);
    const remoteVideoRef = useRef(null);
    const [remoteUserID, setRemoteUserID] = useState(null);

    useEffect(() => {
        // Initialize PeerJS
        userRef.current = new Peer();

        userRef.current.on('open', (id) => {
            console.log('My peer ID is: ' + id);
            setUserID(id);
            // Join the room immediately after getting the peer ID
            findPair();
        });

        // Start local video stream immediately
        // Make sure browser allows for video and audio usage
        navigator.mediaDevices.getUserMedia({ video: true, audio: true })
            .then((stream) => {
                // Display your own video stream
                if (localVideoRef.current) {
                    localVideoRef.current.srcObject = stream;
                }

                // Store the stream in a ref for later use
                userRef.current.localStream = stream;
            })
            .catch(error => console.error('Error accessing media devices:', error));

        // Whenever we are called, we pass our local stream to the other peer
        userRef.current.on('call', (call) => {
            // Answer the call by passing our local stream to the other peer
            call.answer(userRef.current.localStream);

            // Handle the remote stream: incoming call, this happens when you join a room that a user is already in
            console.log('Incoming call from ' + call.peer);
            handleRemoteStream(call);
            setRemoteUserID(call.peer);
        });

        // Listen for the 'user-connected' event, this gets triggered after the joinRoom function emits the 'join-room' event
        socket.on('pair-found', (pairUserID) => {
            console.log('Remote user connected with ID:', pairUserID);
            setRemoteUserID(pairUserID);

            // Ensure peerRef.current exists before making a call
            if (userRef.current && userRef.current.localStream) {
                // Initiate a call to the remote peer using our local stream
                const call = userRef.current.call(pairUserID, userRef.current.localStream);

                // Handle the remote stream: outgoing call, this happens when a user joins a room that you're already in
                console.log('Outgoing call to ' + pairUserID);
                handleRemoteStream(call);
            } else {
                console.error('PeerJS instance or local stream not available');
            }
        });

        socket.on('user-disconnected', () => {
            console.log('Remote user disconnected');
            if (remoteVideoRef.current) {
                remoteVideoRef.current.srcObject = null;
            }
            setRemoteUserID(null);
            findPair();
        });

        return () => {
            // Clean up PeerJS connection and socket listeners
            if (userRef.current) {
                userRef.current.destroy();
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
            if (remoteVideoRef.current) {
                remoteVideoRef.current.srcObject = remoteStream;
            }
        });

        call.on('close', () => {
            if (remoteVideoRef.current) {
                remoteVideoRef.current.srcObject = null;
            }
            setRemoteUserID(null);
        });
    };

    const findPair = () => {
        socket.emit('find-pair');
    };

    const nextCall = () => {
        socket.emit('next-call');
    };

    return (
        <div>
            <h1>Video Chat Room</h1>
            <p>Your Peer ID: {userID}</p>
            <button onClick={() => nextCall()}>Next</button>

            <div>
                <h2>Local Video</h2>
                <video ref={localVideoRef} autoPlay playsInline muted style={{ width: '300px', border: '2px solid black' }}></video>
            </div>

            <div>
                <h2>Remote Video</h2>
                <video ref={remoteVideoRef} autoPlay playsInline style={{ width: '300px', border: '2px solid black' }}></video>
            </div>
            <div>You're chatting with {remoteUserID || 'no one at the moment'}</div>
        </div>
    );
}

export default Room;
