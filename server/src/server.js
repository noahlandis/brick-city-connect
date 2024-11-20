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
});

let waitingUser = null; 

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
});

server.listen(3000, () => {
  console.log('Server is running on port 3000');
});
