// server.js
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*', // Adjust if needed for security
  },
  transports: ['websocket'],
  upgrade: false
});

let waitingUser = null; // 

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  socket.on('join-chat', (userID) => {
    if (waitingUser) {
      console.log('match found');
      socket.emit('match-found', waitingUser.userID);
      waitingUser.emit('match-found', userID);
      waitingUser = null;
    } else {
      console.log('user is waiting since we have nobody to match with');
      console.log('the socket id is', socket.id);
      socket.userID = userID;
      waitingUser = socket;
    }
    
  });

});

server.listen(3000, () => {
  console.log('Server is running on port 3000');
});
