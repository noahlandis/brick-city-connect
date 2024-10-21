import React, { useEffect, useRef, useState } from 'react';
import io from 'socket.io-client';
import Peer from 'peerjs';

const socket = io('http://localhost:3000');


function Room() {
    const [peerId, setPeerId] = useState('');
    const peerRef = useRef(null);

    useEffect(() => {
        // Initialize PeerJS
        peerRef.current = new Peer();

        // we get the peer id from peerjs
        peerRef.current.on('open', (id) => {
            console.log('My peer ID is: ' + id);
            setPeerId(id);
        });

        // we listen for the user-connected event   
        socket.on('user-connected', (userId) => {
            console.log('Remote user connected with ID:', userId);
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
        </div>
    );
}

export default Room;
