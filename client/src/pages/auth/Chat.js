import React, { useEffect, useRef, useState } from 'react';
import io from 'socket.io-client';
import Peer from 'peerjs';
import { useNavigate } from 'react-router-dom';
import Bugsnag from '@bugsnag/js';
import { useAuth } from '../../contexts/AuthContext';
import { ERROR_CODES } from '../../utils/constants';
import { Box, Typography, CircularProgress, useTheme, useMediaQuery, Button, Snackbar, Select, MenuItem} from '@mui/material';
import ShuffleIcon from '@mui/icons-material/Shuffle';
import { startSegmenting, stopSegmenting } from '../../utils/virtualBackground';
import Backgrounds from '../../components/Backgrounds';

function Chat() {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [showSnackbar, setShowSnackbar] = useState(false);
  const { user } = useAuth();
  const socketRef = useRef(null);
  const localUserRef = useRef(null);
  const [isLoadingPartner, setIsLoadingPartner] = useState(true);
  const [isStreamReady, setIsStreamReady] = useState(false);
  const dataConnectionRef = useRef(null);
  // video and background state for local user
  const localVideoRef = useRef(null);
  const localCanvasRef = useRef(null);
  const [localBackground, setLocalBackground] = useState('none');
  const localBackgroundRef = useRef('none');

  // video and background state for remote user
  const remoteVideoRef = useRef(null);
  const remoteCanvasRef = useRef(null);
  const [remoteBackground, setRemoteBackground] = useState('none');


  // we track if remote video is actually ready (has width/height > 0)
  const [isRemoteStreamReady, setIsRemoteStreamReady] = useState(false);

  useEffect(() => {
    // Start local video stream and set up chat when ready
    startLocalStream();

    return () => {
      // Stop stream on cleanup, **check if this is needed**
      stopLocalStream();
      stopSegmenting();
      stopSegmenting(false);

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

  // whenever the local background changes, we start or stop segmenting accordingly
  useEffect(() => {
    console.log("background changed to", localBackground);
    localBackgroundRef.current = localBackground;
    if (localBackground !== 'none' && localVideoRef.current && localCanvasRef.current && isStreamReady) {
      startSegmenting(localVideoRef.current, localCanvasRef.current, localBackground);
    } else {
      stopSegmenting();
    }

    // send the background to the remote user
    if (dataConnectionRef.current && dataConnectionRef.current.open) {
      dataConnectionRef.current.send(localBackground);
    }
  }, [localBackground, isStreamReady]);


  // whenever the remoteBackground changes, attempt to (re)start remote segmentation
  useEffect(() => {
    console.log("Remote background changed to", remoteBackground);
    // Only start segmenting if we actually have a loaded remote video
    if (
      remoteBackground !== 'none' &&
      isRemoteStreamReady && 
      remoteVideoRef.current && 
      remoteCanvasRef.current
    ) {
      startSegmenting(remoteVideoRef.current, remoteCanvasRef.current, remoteBackground, false);
    } else {
      // if it's "none" or stream not ready yet, just stop
      stopSegmenting(false);
    }
  }, [remoteBackground, isRemoteStreamReady]);


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

    localUserRef.current.on('connection', (conn) => {
      // this is when we are the reciever of the data connection from the remote user
      console.log("Data connection recieved");
      handleDataConnection(conn);
    });

    localUserRef.current.on('error', (error) => {
      Bugsnag.notify(error);
    });

    socketRef.current.on('leave-chat', () => {
      console.log('user left');
      leaveChat();
    });

    socketRef.current.on('waiting-to-skip', () => {
      setShowSnackbar(true);
    });

    // initiate call
    socketRef.current.on('match-found', (remotePeerID) => {
      console.log("call initiated");
      console.log("local background ref", localBackgroundRef.current);

      // we also open a data connection so we can tell the remote user what background we're currently using
      const dataConn = localUserRef.current.connect(remotePeerID);
      handleDataConnection(dataConn);

      // call the remote user with our local stream
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
      remoteVideoRef.current.addEventListener('loadedmetadata', () => {
        remoteVideoRef.current.play();
        if (
          remoteVideoRef.current.videoWidth > 0 && 
          remoteVideoRef.current.videoHeight > 0
        ) {
          setIsRemoteStreamReady(true);
        }
      });
      setIsLoadingPartner(false);
    });

    // this fires when a user presses 'next' and the user gets put in the waiting room. We do this to stop the remote video stream, and so we're not storing a stale connection in our peer object 
    socketRef.current.on('close-connection', () => {
      call.close();
      if (dataConnectionRef.current) {
        dataConnectionRef.current.close();
        stopSegmenting(false);
        setRemoteBackground('none');
      }
    });

    call.on('close', function () {
      console.log("closing call");
      // check if this is needed or we can just call remoteVideoRef.current.srcObject = null
      if (remoteVideoRef.current && remoteVideoRef.current.srcObject) {
        remoteVideoRef.current.srcObject.getTracks().forEach((track) => track.stop());
        remoteVideoRef.current.srcObject = null;
        setIsLoadingPartner(true);
        setIsRemoteStreamReady(false);
      }
    });

    call.on('error', (error) => {
      Bugsnag.notify(error);
    });
  }

  function handleDataConnection(conn) {
    dataConnectionRef.current = conn;
    conn.on('open', () => {
      console.log('Data connection opened with peer:', conn.peer);
      console.log("your background is ", localBackgroundRef.current);
      conn.send(localBackgroundRef.current);
    });
    conn.on('data', (background) => {
      setRemoteBackground(background);
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

        localVideoRef.current.addEventListener('loadedmetadata', () => {
          localVideoRef.current.play();
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

  // Add a function to handle background selection
  const handleBackgroundSelect = (selectedBackground) => {
    if (!selectedBackground.locked) {
      setLocalBackground(selectedBackground.url || 'none');
    }
  };

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
              display: localBackground === 'none' ? 'block' : 'none',
            }}
          />
          <canvas
            ref={localCanvasRef}
            width={640}
            height={480}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              display: localBackground !== 'none' ? 'block' : 'none',
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
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              display: remoteBackground === 'none' ? 'block' : 'none',
            }}
          />
          <canvas
            ref={remoteCanvasRef}
            width={640}
            height={480}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              display: remoteBackground !== 'none' ? 'block' : 'none',
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
      {/* Background Selector */}
    
        <Backgrounds onSelect={handleBackgroundSelect} selectedBackground={localBackground} />
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
          disabled={isLoadingPartner}
          sx={{
            flex: '0.8',
            backgroundColor: '#F76902',
            '&:hover': {
              backgroundColor: '#d55a02',
            },
          }}
        >
          Next
        </Button>
      </Box>
      <Snackbar
        open={showSnackbar}
        autoHideDuration={2000}
        onClose={() => setShowSnackbar(false)}
        message="You'll be matched with the next available user"
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      />
    </Box>
  );
}

export default Chat;
