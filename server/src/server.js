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

let waitingUser = null; 

/**
 * Attempts to match a user with the waiting user. If there is no waiting user, the passed in socket becomes the waiting user
 * @param {*} socket - The socket (user) we are trying to match
 */
function attemptToMatchUser(socket) {
  if (waitingUser) { // since we have a waiting user, we can match them
    console.log('match found. Matching', socket.id, 'with', waitingUser.id);

    // we store a reference to the partner sockets for each user, so when a user leaves, we can tell their partner to find a new match
    socket.partnerSocket = waitingUser;
    waitingUser.partnerSocket = socket;
    waitingUser.emit('match-found', socket.userID);

    // since they were matched, there's no longer a waiting user
    waitingUser = null;
  } else { // we couldn't find a match, so this user is now waiting
    console.log("couldn't find match: ", socket.id, " is now waiting");
    socket.partnerSocket = null; // this line isn't needed for logic to work, but still good for state clarity. 
    waitingUser = socket;
  }

}

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  socket.on('join-chat', (userID) => {
    // we always store the userID as this identifies the peer to call to start the video stream
    socket.userID = userID;
    attemptToMatchUser(socket);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);

    if (socket === waitingUser) { // if the user is the one waiting, we reset since the waiting user is the one who disconnected
      waitingUser = null;
    } 
    else if (socket.partnerSocket) { // the user is not the waiting user, so we try to find a match for the user left in the call
      attemptToMatchUser(socket.partnerSocket);
    }
  });

});

server.listen(3000, () => {
  console.log('Server is running on port 3000');
});
