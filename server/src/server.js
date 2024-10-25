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


let waitingUsers = [];

// this runs every time a user connects to our webpage
io.on('connection', (socket) => {
    console.log('a user connected');

    // this an event we emit from the front end, we join the room with the id that we get from the front end
    socket.on('join-room', () => {
      console.log(`User ${socket.id} with peer ID is looking for a partner.`);


      if (waitingUsers.length > 0) {
        const partnerSocketId = waitingUsers.shift();
        const partnerSocket = io.sockets.sockets.get(partnerSocketId);

        console.log(`User ${socket.id} has joined with ${partnerSocketId}.`);
        socket.emit('user-connected', partnerSocketId);
        
        


  
      } else {
        console.log(`User ${socket.id} is waiting.`);

        waitingUsers.push(socket.id);
      }

    });

    socket.on('leave-room', (remoteUser) => {
      socket.emit('user-disconnected', socket.id);

      // If we have a remote user, it means we still have to add the partner back into the waiting list
      if (remoteUser) {
        console.log('remoteUser is still in the room:', remoteUser);

        waitingUsers.push(remoteUser);
      } else {
        // we clear the waiting list since now there are no users left in the room
        waitingUsers = [];
      }
      

      
    });

});

server.listen(3000, () => {
    console.log('Server is running on port 3000');
});
