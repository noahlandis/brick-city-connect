import React, { useEffect, useRef, useState } from 'react';
import io from 'socket.io-client';
import Peer from 'peerjs';
import { useNavigate } from 'react-router-dom';

function Chat() {
  const navigate = useNavigate();
  const socket = io('http://localhost:3000');



  return (
    <div>
      <h1>Chat</h1>
    </div>
  );
}

export default Chat;
