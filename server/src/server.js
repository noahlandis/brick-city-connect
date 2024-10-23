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



// this runs every time a user connects to our webpage
io.on('connection', (socket) => {
    console.log('a user connected');

    // this an event we emit from the front end, we join the room with the id that we get from the front end
    socket.on('join-room', (roomId, userId) => {

        // we join the room
        socket.join(roomId);
        console.log('user joined room', roomId, 'with peer ID:', userId);

        // this tells the other user in the room that we joined
        socket.to(roomId).emit('user-connected', userId);
    });

    socket.on('leave-room', (roomId, userId) => {
        socket.leave(roomId);
        console.log('user left room', roomId, 'with peer ID:', userId);
        socket.to(roomId).emit('user-disconnected', userId);
    });

});

server.listen(3000, () => {
    console.log('Server is running on port 3000');
});
