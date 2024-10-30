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

        // make sure socket id isn't already in the waitingUsers array
        if (!waitingUsers.includes(socket.id)) {
          waitingUsers.push(socket.id);
        }
      }

    });

    socket.on('next', (remoteUser) => {
   
      // the next functionality can only work if we have someone (other than us) in the waiting list
      if (waitingUsers.length === 0 || waitingUsers.includes(socket.id)) {
        return;
      }


      // shut the video stream off for both users
      socket.emit('user-disconnected', socket.id);
      const remoteSocket = io.sockets.sockets.get(remoteUser);

      // connect the remote user (user whose partner pressed next) to the next user in the waiting list
      const partnerSocketId = waitingUsers.shift();
      waitingUsers.push(socket.id);

      const partnerSocket = io.sockets.sockets.get(partnerSocketId);
      remoteSocket.emit('user-connected', partnerSocketId);
      partnerSocket.emit('user-connected', remoteUser);
      

      // we add that pressed 'next' to the waiting list
      

     

    });

    socket.on('leave-room', (remoteUser) => {
      console.log('this user left the room', socket.id);
      socket.emit('user-disconnected', socket.id);

      // If we have a remote user, it means we still have to add the partner back into the waiting list
      if (remoteUser) {
        console.log('remoteUser is still in the room:', remoteUser);
        // if there's a waiting user, we connect the two users left in the room, for instance if pairings A-B and C-D, if A and C leave, we connect B-D
        if (waitingUsers.length > 0) {
          const partnerSocketId = waitingUsers.shift();
          const partnerSocket = io.sockets.sockets.get(partnerSocketId);
          console.log('user already in the room, connecting...');
          partnerSocket.emit('user-connected', remoteUser);
        }
        else {
          // there's nobody to connect to in this case, we need to add the user to the waitingUsers
          if (!waitingUsers.includes(remoteUser)) {
            waitingUsers.push(remoteUser);
          }
        }
      } else {
        // we clear the waiting list since now there are no users left in the room
        console.log('no users left in the room, clearing waiting list...');
        waitingUsers = []
      }
      

      
    });

});

server.listen(3000, () => {
    console.log('Server is running on port 3000');
});
