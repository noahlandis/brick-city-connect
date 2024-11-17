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

let waitingUser = null; // Holds the socket ID of the waiting user (if any)
let connectedPairs = {}; // To track connected pairs

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  socket.on('join-room', () => {
    console.log(`User ${socket.id} is looking for a partner.`);

    if (waitingUser) {
      // There's a user waiting; pair them with the current user
      const partnerSocketId = waitingUser;
      waitingUser = null; // Reset the waiting user

      const partnerSocket = io.sockets.sockets.get(partnerSocketId);

      if (partnerSocket) {
        console.log(`User ${socket.id} has joined with ${partnerSocketId}.`);
        socket.emit('user-connected', partnerSocketId);
        partnerSocket.emit('user-connected', socket.id);

        // Store the connection
        connectedPairs[socket.id] = partnerSocketId;
        connectedPairs[partnerSocketId] = socket.id;
      } else {
        // Partner socket is no longer available; set current user as waiting
        console.log(`Waiting user ${partnerSocketId} disconnected; ${socket.id} is now waiting.`);
        waitingUser = socket.id;
      }
    } else {
      // No one is waiting; set current user as waiting
      console.log(`User ${socket.id} is waiting.`);
      waitingUser = socket.id;
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);

    // If the disconnected user was the waiting user, reset waitingUser
    if (waitingUser === socket.id) {
      waitingUser = null;
    }

    // Notify the connected partner, if any
    const partnerId = connectedPairs[socket.id];
    if (partnerId) {
      const partnerSocket = io.sockets.sockets.get(partnerId);
      if (partnerSocket) {
        partnerSocket.emit('user-disconnected', socket.id);

        // Remove partner's connection
        delete connectedPairs[partnerId];

        // Since there's only one waiting spot, check if we can pair the partner with the waiting user
        if (waitingUser) {
          const waitingSocketId = waitingUser;
          waitingUser = null;

          if (io.sockets.sockets.get(waitingSocketId)) {
            // Pair the partner with the waiting user
            connectedPairs[partnerId] = waitingSocketId;
            connectedPairs[waitingSocketId] = partnerId;

            partnerSocket.emit('user-connected', waitingSocketId);
            io.sockets.sockets.get(waitingSocketId).emit('user-connected', partnerId);

            console.log(`User ${partnerId} is now connected with user ${waitingSocketId}`);
          } else {
            // Waiting user disconnected; set partner as waiting
            waitingUser = partnerId;
            console.log(`Waiting user disconnected; ${partnerId} is now waiting.`);
          }
        } else {
          // No one is waiting; set partner as waiting
          waitingUser = partnerId;
          console.log(`No one is waiting; ${partnerId} is now waiting.`);
        }
      }
      delete connectedPairs[socket.id];
    }
  });

  socket.on('leave-room', () => {
    console.log('User left the room:', socket.id);

    // If the user was the waiting user, reset waitingUser
    if (waitingUser === socket.id) {
      waitingUser = null;
    }

    // Notify the connected partner, if any
    const partnerId = connectedPairs[socket.id];
    if (partnerId) {
      const partnerSocket = io.sockets.sockets.get(partnerId);
      if (partnerSocket) {
        partnerSocket.emit('user-disconnected', socket.id);

        // Remove partner's connection
        delete connectedPairs[partnerId];

        // Since there's only one waiting spot, check if we can pair the partner with the waiting user
        if (waitingUser) {
          const waitingSocketId = waitingUser;
          waitingUser = null;

          if (io.sockets.sockets.get(waitingSocketId)) {
            // Pair the partner with the waiting user
            connectedPairs[partnerId] = waitingSocketId;
            connectedPairs[waitingSocketId] = partnerId;

            partnerSocket.emit('user-connected', waitingSocketId);
            io.sockets.sockets.get(waitingSocketId).emit('user-connected', partnerId);

            console.log(`User ${partnerId} is now connected with user ${waitingSocketId}`);
          } else {
            // Waiting user disconnected; set partner as waiting
            waitingUser = partnerId;
            console.log(`Waiting user disconnected; ${partnerId} is now waiting.`);
          }
        } else {
          // No one is waiting; set partner as waiting
          waitingUser = partnerId;
          console.log(`No one is waiting; ${partnerId} is now waiting.`);
        }
      }
      delete connectedPairs[socket.id];
    }
  });

  socket.on('next', () => {
    if (!waitingUser || waitingUser === socket.id) {
      return;
    }
    console.log('User requested next:', socket.id);

    // The partner of the user who pressed next
    const partnerId = connectedPairs[socket.id];

    // Remove the old connection
    if (partnerId) {
      const partnerSocket = io.sockets.sockets.get(partnerId);

      // Notify both users that they are disconnected
      socket.emit('user-disconnected', partnerId);
      if (partnerSocket) {
        partnerSocket.emit('user-disconnected', socket.id);
      }

      // Remove the connection from connectedPairs
      delete connectedPairs[socket.id];
      delete connectedPairs[partnerId];

      // Check if there's a waiting user
      if (waitingUser) {
        // Pair the old partner with the waiting user
        const waitingSocketId = waitingUser;
        waitingUser = null;

        if (io.sockets.sockets.get(waitingSocketId)) {
          connectedPairs[partnerId] = waitingSocketId;
          connectedPairs[waitingSocketId] = partnerId;

          if (partnerSocket) {
            partnerSocket.emit('user-connected', waitingSocketId);
          }
          io.sockets.sockets.get(waitingSocketId).emit('user-connected', partnerId);

          console.log(`User ${partnerId} is now connected with user ${waitingSocketId}`);
        } else {
          // Waiting user disconnected; set partner as waiting
          waitingUser = partnerId;
          console.log(`Waiting user disconnected; ${partnerId} is now waiting.`);
        }
      } else {
        // No one is waiting; set the old partner as waiting
        waitingUser = partnerId;
        console.log(`No one is waiting; ${partnerId} is now waiting.`);
      }


      // If there's a waiting user and it's not the user who pressed 'next'
      if (waitingUser && waitingUser !== socket.id) {
        const waitingSocketId = waitingUser;
        waitingUser = null;

        if (io.sockets.sockets.get(waitingSocketId)) {
          connectedPairs[socket.id] = waitingSocketId;
          connectedPairs[waitingSocketId] = socket.id;

          socket.emit('user-connected', waitingSocketId);
          io.sockets.sockets.get(waitingSocketId).emit('user-connected', socket.id);

          console.log(`User ${socket.id} is now connected with user ${waitingSocketId}`);
        } else {
          // Waiting user disconnected; set current user as waiting
          waitingUser = socket.id;
          console.log(`Waiting user disconnected; ${socket.id} is now waiting.`);
        }
      } else if (!waitingUser) {
        // No one is waiting; current user becomes waiting
        waitingUser = socket.id;
        console.log(`No one is waiting; ${socket.id} is now waiting.`);
      } else {
        // The waiting spot is occupied by the old partner
        console.log(`Waiting spot occupied by ${partnerId}; ${socket.id} cannot become waiting.`);


        // Overwrite waitingUser
        waitingUser = socket.id;
        console.log(`${socket.id} overwrites the waiting spot and is now waiting.`);
      }
    } else {
      // User who pressed 'next' had no partner
      // Try to pair with waiting user
      if (waitingUser) {
        const waitingSocketId = waitingUser;
        waitingUser = null;

        if (io.sockets.sockets.get(waitingSocketId)) {
          connectedPairs[socket.id] = waitingSocketId;
          connectedPairs[waitingSocketId] = socket.id;

          socket.emit('user-connected', waitingSocketId);
          io.sockets.sockets.get(waitingSocketId).emit('user-connected', socket.id);

          console.log(`User ${socket.id} is now connected with user ${waitingSocketId}`);
        } else {
          // Waiting user disconnected; set current user as waiting
          waitingUser = socket.id;
          console.log(`Waiting user disconnected; ${socket.id} is now waiting.`);
        }
      } else {
        // No one is waiting; set current user as waiting
        waitingUser = socket.id;
        console.log(`No one is waiting; ${socket.id} is now waiting.`);
      }
    }
  });
});

server.listen(3000, () => {
  console.log('Server is running on port 3000');
});
