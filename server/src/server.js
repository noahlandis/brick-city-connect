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

let nextQueue = [];
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
    if (nextQueue.length > 0) {
      console.log("a user is about to skip. There are ", nextQueue.length, " users who are waiting to skip");

      userWaitingToSkip = nextQueue.shift();
      console.log(userWaitingToSkip.id, " was waiting to skip. They should be the next waiting user");
      userWaitingToSkip.emit('close-connection');
      attemptToMatchUser(userWaitingToSkip.partnerSocket);
      attemptToMatchUser(userWaitingToSkip);
      console.log("a user skipped. There are ", nextQueue.length, " users who are waiting to next");
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);

    // if the socket was in the nextQueue, we need to remove it
    nextQueue = nextQueue.filter(s => s !== socket);
    console.log("now the nextQueue length is ", nextQueue.length);


    if (socket === waitingUser) { // if the user is the one waiting, we reset since the waiting user is the one who disconnected
      waitingUser = null;
    } 
    else if (socket.partnerSocket) { // the user is not the waiting user, so we try to find a match for the user left in the call
      attemptToMatchUser(socket.partnerSocket);
    }
  });


  socket.on('next', () => {

    // If there's a waiting user (who isn't the one who pressed next), this means that the user who pressed next can become the waiting user, and the previous waiting user can connect with the user who was in the call with the user who pressed next
    if (socket === waitingUser) {
      console.log("can't skip user, no users to match with");
      return;
    }

    if (nextQueue.includes(socket)) {
      console.log("socket already in queue, returning");
      return;
    }

    if (!waitingUser) {
      // userWaitingToSkip = nextQueue.shift();
      // if (userWaitingToSkip && userWaitingToSkip.partnerSocket === socket) {
      //   console.log("we are in a call with another user who wants to skip");
      //   return;
      // }
      console.log("addding ", socket.id, "to next queue");
      console.log("current queue length", nextQueue.length);
      nextQueue.push(socket);
      console.log("new queue length", nextQueue.length);

      return;
    }

    // this ensures we don't keep stale connections, and the user who pressed next isn't still getting the remote stream from the previous user
    socket.emit('close-connection');

    // because of the previous guard clause (!waitingUser), their partner is guaranteed to find a match.
    attemptToMatchUser(socket.partnerSocket);
    attemptToMatchUser(socket);
  });

});

server.listen(3000, () => {
  console.log('Server is running on port 3000');
});
