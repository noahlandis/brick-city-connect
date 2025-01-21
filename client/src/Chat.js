import React, { useEffect, useRef, useState } from 'react';
import io from 'socket.io-client';
import Peer from 'peerjs';
import { useNavigate } from 'react-router-dom';
import Bugsnag from '@bugsnag/js';
import { useAuth } from './contexts/AuthContext';
import { ERROR_CODES } from './utils/constants';
import { Box, Typography, CircularProgress, useTheme, useMediaQuery, Button} from '@mui/material';
import ShuffleIcon from '@mui/icons-material/Shuffle';


function Chat() {
  const navigate = useNavigate();
  const theme = useTheme();
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const { user } = useAuth();
  const localUserRef = useRef(null);
  const socketRef = useRef(null);
  const [isStreamReady, setIsStreamReady] = useState(false);
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [isLoadingPartner, setIsLoadingPartner] = useState(true);

  useEffect(() => {
    // Start local video stream and set up chat when ready
    startLocalStream();

    return () => {
      // Stop stream on cleanup, **check if this is needed before pushing to staging**
      stopLocalStream();

      // When a user leaves the page, we destroy the peer. This has the side effect of executing call.close(), so we don't need to manually call it here
      if (localUserRef.current) {
        localUserRef.current.destroy();
      }

      // This ensures we tell the server that we've disconnected if we leave the page
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
    // we don't want this to run every render, just on mount so we ignore the eslint warning
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (isStreamReady) {
      joinChat();
    }
    // we don't want this to run every render, just on mount so we ignore the eslint warning
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isStreamReady]);

  function joinChat() {
    // Initialize socket
    socketRef.current = io(process.env.REACT_APP_SERVER_URL, {
      transports: ['websocket'],
      upgrade: false,
    });

    // Initialize peer
    localUserRef.current = new Peer();

    // Once the peer is open, we join the chat
    localUserRef.current.on('open', (localPeerID) => {
      console.log('local user id', localPeerID);
      socketRef.current.emit('join-chat', localPeerID, user.username);
    });

    localUserRef.current.on('error', (error) => {
      Bugsnag.notify(error);
    });

    socketRef.current.on('leave-chat', () => {
      console.log('user left');
      leaveChat();
    });

    // initiate call
    socketRef.current.on('match-found', (remotePeerID) => {
      console.log("call initiated");
      const call = localUserRef.current.call(remotePeerID, localVideoRef.current.srcObject);
      handleRemoteCall(call);
    });

    // answer call
    localUserRef.current.on('call', (call) => {
      console.log("call recieved");
      call.answer(localVideoRef.current.srcObject);
      handleRemoteCall(call);
    });
  }

  // handle call events
  function handleRemoteCall(call) {

    // their local stream -> our remote stream
    call.on('stream', (remoteStream) => {
      remoteVideoRef.current.srcObject = remoteStream;
      setIsLoadingPartner(false);
    });

    // this fires when a user presses 'next' and the user gets put in the waiting room. We do this to stop the remote video stream, and so we're not storing a stale connection in our peer object 
    socketRef.current.on('close-connection', () => {
      call.close();
    });

    call.on('close', function () {
      console.log("closing call");
      // check if this is needed or we can just call remoteVideoRef.current.srcObject = null
      if (remoteVideoRef.current && remoteVideoRef.current.srcObject) {
        remoteVideoRef.current.srcObject.getTracks().forEach((track) => track.stop());
        remoteVideoRef.current.srcObject = null;
        setIsLoadingPartner(true);
      }
    });

    call.on('error', (error) => {
      Bugsnag.notify(error);
    });
  }

  function startLocalStream() {
    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then((stream) => {
        localVideoRef.current.srcObject = stream;

        // Monitor video track
        stream.getVideoTracks().forEach((track) => {
          track.onended = () => leaveChat(ERROR_CODES.MEDIA_PERMISSION_DENIED); // Handle camera turned off
          track.onmute = () => leaveChat(ERROR_CODES.MEDIA_PERMISSION_DENIED);  // Handle camera muted
        });

        // Monitor audio track
        stream.getAudioTracks().forEach((track) => {
          track.onended = () => leaveChat(ERROR_CODES.MEDIA_PERMISSION_DENIED); // Handle mic turned off
          track.onmute = () => leaveChat(ERROR_CODES.MEDIA_PERMISSION_DENIED);  // Handle mic muted
        });

        setIsStreamReady(true); // Mark stream as ready
      })
      .catch((error) => {
        console.error('Error accessing media devices:', error);
        leaveChat(ERROR_CODES.MEDIA_PERMISSION_DENIED);
      });
  }

  function stopLocalStream() {
    if (localVideoRef.current && localVideoRef.current.srcObject) {
      localVideoRef.current.srcObject.getTracks().forEach((track) => track.stop());
      localVideoRef.current.srcObject = null;
    }
  }

  function leaveChat(errorCode = null) {
    if (errorCode) {
      navigate(`/?error=${errorCode}`);
    } else {
      navigate('/'); // Redirect to home
    }
  }

  return (
    <Box sx={{ 
      width: '97%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      gap: 4
    }}>
      {/* Video Container */}
      <Box sx={{
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        gap: 2,
        width: '100%',
        flex: 1,
      }}>
        {/* Local Video */}
        <Box sx={{
          flex: 1,
          position: 'relative',
          borderRadius: 2,
          overflow: 'hidden',
          backgroundColor: 'black',
        }}>
          <video
            ref={localVideoRef}
            autoPlay
            muted
            playsInline
            webkit-playsinline="true"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          />
        </Box>

        {/* Remote Video */}
        <Box sx={{
          flex: 1,
          position: 'relative',
          borderRadius: 2,
          overflow: 'hidden',
          backgroundColor: 'black',
        }}>
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            webkit-playsinline="true"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          />
          {isLoadingPartner && (
            <Box sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'rgba(0, 0, 0, 0.7)',
              color: 'white',
              gap: 2,
            }}>
              <CircularProgress sx={{ color: '#F76902' }} />
              <Typography variant="h6">Finding a match...</Typography>
            </Box>
          )}
        </Box>
      </Box>
      {/* Buttons Container */}
      <Box sx={{
        display: 'flex',
        gap: 2,
        width: '100%'
      }}>
        <Button
          variant="outlined"
          color="error"
          onClick={() => leaveChat()}
          sx={{
            flex: '0.2', // Takes up 20% of the space
          }}
        >
          Leave Chat
        </Button>
        <Button
          variant="contained"
          startIcon={<ShuffleIcon />}
          onClick={() => socketRef.current.emit('next')}
          sx={{
            flex: '0.8', // Takes up 80% of the space
            backgroundColor: '#F76902',
            '&:hover': {
              backgroundColor: '#d55a02',
            }
          }}
        >
          Next
        </Button>
      </Box>
    </Box>
  );
}

export default Chat;


