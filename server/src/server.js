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
let userWaitingToSkip = null; 

/**
 * Attempts to match a user with the waiting user. 
 * If there is no waiting user, the passed in socket becomes the waiting user
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

/**
 * Attempts to rematch sockets. 
 * 
 * When one socket is passed as an argument, this will cause the socket to swap places with the waiting user. 
 * The passed socket will become the waiting user, and the previous waiting user will match with the passed socket's partner.
 * Example: 
 * A-B connect (C is waiting) 
 * closeConnectionAndRematch(A) 
 * B-C connect (A is waiting)
 * 
 * When two sockets are passed as the arguments, they will exchange partners
 * Example:
 * A-B connect
 * C-D connect
 * closeConnectionAndRematch(A, C)
 * A-C connect
 * B-D connect
 * @param  {...any} sockets - The sockets we are trying to rematch
 */
function closeConnectionAndRematch(...sockets) {
    // we close the connections both to remove stail peerJS connections and to shut down the old remote stream
    sockets.forEach(s => s.emit('close-connection'));
  
    // attempt to match partners
    sockets.forEach(s => {
      if (s.partnerSocket) {
        attemptToMatchUser(s.partnerSocket);
      }
    });
  
    // attempt to match the sockets themselves
    sockets.forEach(s => attemptToMatchUser(s));
}

/**
 * Attempts to find a new match for the passed socket.
 * In the event of a new user joining, this will simply be the socket joining.
 * If a socket leaves, their partner socket should be passed in so their partner can find a new match.
 * 
 * If there's a userWaitingToSkip, the passed socket will be guaranteed to find a new match and the userWaitingToSkip will become the waiting user.
 * @param {*} socket - The socket to try and find a new match when the user leaves or joins.
 */
function handleUserLeaveAndJoin(socket) {
  attemptToMatchUser(socket);
  if (userWaitingToSkip) {
      closeConnectionAndRematch(userWaitingToSkip)
      userWaitingToSkip = null;
  }
}

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  socket.on('join-chat', (userID) => {
    // we always store the userID as this identifies the peer to call to start the video stream
    socket.userID = userID;
    handleUserLeaveAndJoin(socket);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    if (socket === userWaitingToSkip) {
      userWaitingToSkip = null;
    }
    if (socket === waitingUser) { // if the user is the one waiting, we reset since the waiting user is the one who disconnected
      waitingUser = null;
    } 
    else if (socket.partnerSocket) { // the user is not the waiting user, so we try to find a match for the user left in the call
      handleUserLeaveAndJoin(socket.partnerSocket);
    }
  });


  socket.on('next', () => {
    // if the user is already the waiting user or the user waiting to skip, we dont want to do anything
    if (socket === waitingUser || userWaitingToSkip == socket) {
      console.log("can't skip user, no users to match with");
      return;
    }

    if (!waitingUser) {     
      if (userWaitingToSkip && userWaitingToSkip.partnerSocket != socket) { // if we already have a user who expressed intent to skip (who is in another call than the user who pressed next), we exchange partners with that user
        console.log("we should try and match ", userWaitingToSkip.id, "and ", socket.id);
        closeConnectionAndRematch(socket, userWaitingToSkip);
        userWaitingToSkip = null;
      } else { // since we only have one user who expressed intent to skip, we'll mark them as wanting to skip. This way, they can find a new partner when either a user in a different call wants to skip, or make them wait if a new user joins
        console.log("adding ", socket.id, "is now the userWaitingToSkip");
        userWaitingToSkip = socket;
      }
    } else {
      // since there is no waiting user, we just make the user who pressed next the waiting user
      closeConnectionAndRematch(socket);
    }
  });

});

server.listen(3000, () => {
  console.log('Server is running on port 3000');
});
