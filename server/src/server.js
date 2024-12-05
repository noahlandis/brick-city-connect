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
    socket.userID = userID;
    if (waitingUser) {
      console.log('match found');

      console.log('the id of the waiting user is', waitingUser.userID);
      console.log('the id of the user who joined is', userID);


      // first, we store a reference to the partnerSocket for both users
      socket.partnerSocket = waitingUser;
      waitingUser.partnerSocket = socket;
      // then we emit the match-found event to both users
      socket.emit('match-found', waitingUser.userID);
      waitingUser.emit('match-found', userID);
      // finally, we reset the waitingUser
      waitingUser = null;
    } else {
      console.log('user is waiting since we have nobody to match with');
      waitingUser = socket;
    }
    
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);

    if (socket === waitingUser) {     // if the user is the one waiting, we reset since the waiting user is the one who disconnected
      waitingUser = null;
    } 
    else if (socket.partnerSocket) {  // the user is not the waiting user, they have a partner
      // if there is already a waiting user, we match them
      if (waitingUser) {
        console.log('a waiting user is able to be matched.');
        console.log('the ID of the user still left in the call is', socket.partnerSocket.userID);
        userStillInChat = socket.partnerSocket;
        userStillInChat.partnerSocket = waitingUser;
        waitingUser.partnerSocket = userStillInChat;
        userStillInChat.emit('match-found', waitingUser.userID);
        waitingUser.emit('match-found', userStillInChat.userID);
        waitingUser = null;

       

      }
      else {
        console.log('no waiting user can be matched');
        waitingUser = socket.partnerSocket;

      }
      
    }

    // console.log('the id of the user who left is', socket.userID);
    // console.log('the id of the user still in the chat is', waitingUser.userID);
    
  });

});

server.listen(3000, () => {
  console.log('Server is running on port 3000');
});
