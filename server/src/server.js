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

let lobby = []

// this runs every time a user connects to our webpage
io.on('connection', (socket) => {
    console.log('a user connected');

    // Initial finding pair/Next button find pair
    socket.on('find-pair', () => {
      if(lobby.length > 0){
        // Grab socket ID of waiting user
        const lobbyUserSocketID = lobby.shift();

        // Get the socket for the user in the lobby
        const lobbyUserSocket = io.sockets.sockets.get(lobbyUserSocketID);

        if(lobbyUserSocket){
          console.log('Found pair, loading connection.')
          socket.emit('pair-found', lobbyUserSocketID);
          lobbyUserSocket.emit('pair-found', socket.id);
        }
      }else{
        // Add user to lobby to wait for another user to pair
        lobby.push(socket.id);
        console.log('No pair found, waiting for more users.')
      }
    });

    socket.on('next-call', () => {
      socket.emit('user-disconnected');
    });

     // Handle user unexpected disconnect
    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.id}`);

      // Remove the disconnected user from the waiting queue if they were there
      lobby = lobby.filter((id) => id !== socket.id);

      // Notify the partner that the user has disconnected
      socket.broadcast.emit('user-disconnected', socket.id);
    });

});

server.listen(3000, () => {
    console.log('Server is running on port 3000');
});
