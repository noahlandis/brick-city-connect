import React, { useEffect, useRef, useState } from 'react';
import io from 'socket.io-client';
import Peer from 'peerjs';
import { useNavigate } from 'react-router-dom';
import Bugsnag from '@bugsnag/js';
import { useAuth } from '../../contexts/AuthContext';
import { ERROR_CODES } from '../../utils/constants';
import {
  Box,
  Typography,
  CircularProgress,
  useTheme,
  useMediaQuery,
  Button,
  Snackbar,
  Select,
  MenuItem
} from '@mui/material';
import ShuffleIcon from '@mui/icons-material/Shuffle';
import { startSegmenting, stopSegmenting } from '../../utils/virtualBackground';

function Chat() {
  const navigate = useNavigate();
  const theme = useTheme();
  const localVideoRef = useRef(null);
  const localCanvasRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const remoteCanvasRef = useRef(null);
  const { user } = useAuth();
  const localUserRef = useRef(null);
  const socketRef = useRef(null);
  const [isStreamReady, setIsStreamReady] = useState(false);
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [isLoadingPartner, setIsLoadingPartner] = useState(true);
  const [showSnackbar, setShowSnackbar] = useState(false);
  const [localBackground, setLocalBackground] = useState('none');
  const [remoteBackground, setRemoteBackground] = useState('none');
  const dataConnectionRef = useRef(null);

  useEffect(() => {
    // Start local video stream and set up chat when ready
    startLocalStream();

    return () => {
      // Stop stream on cleanup
      stopLocalStream();
      stopSegmenting(); // Stop any ongoing segmentation

      // Destroy the peer
      if (localUserRef.current) {
        localUserRef.current.destroy();
      }
      // Disconnect socket if needed
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (isStreamReady) {
      joinChat();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isStreamReady]);

  // Whenever background changes, start or stop segmentation accordingly
  useEffect(() => {
    console.log('background changed to', localBackground);
    if (localBackground !== 'none' && localVideoRef.current && localCanvasRef.current && isStreamReady) {
      // Start segmentation and pass the video, the canvas, and path to the background image
      applyBackground(localVideoRef.current, localCanvasRef.current, localBackground);
    } else {
      // No background => show raw video, stop segmentation
      console.log('background is none, stopping segmenting');
      setLocalBackground('none');
      stopSegmenting();
    }

    if (dataConnectionRef.current && dataConnectionRef.current.open) {
      dataConnectionRef.current.send(localBackground);
    }
  }, [localBackground, isStreamReady]);

  function applyBackground(video, canvas, background, isLocal = true) {
    startSegmenting(video, canvas, background, isLocal);
  }

  function handleDataConnection(conn) {
    console.log("your current connections are", localUserRef.current.connections);
    dataConnectionRef.current = conn;
    conn.on('open', () => {
      console.log('Data connection opened with peer:', conn.peer);
    });
    conn.on('data', (background) => {
      if (background !== 'none') {
        console.log('received background', background);
        applyBackground(remoteVideoRef.current, remoteCanvasRef.current, background, false);
        setRemoteBackground(background);
      } else {
        console.log("we should stop segmenting");
        setRemoteBackground('none');
        stopSegmenting(false);
      }
    });
  }


  function joinChat() {
    socketRef.current = io(process.env.REACT_APP_SERVER_URL, {
      transports: ['websocket'],
      upgrade: false,
    });

    localUserRef.current = new Peer();

    // Once the peer is open, we join the chat
    localUserRef.current.on('open', (localPeerID) => {
      console.log('local user id', localPeerID);
      socketRef.current.emit('join-chat', localPeerID, user.username);
    });

    localUserRef.current.on('connection', (conn) => {
      console.log('Data connection received');
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
      console.log('call initiated');

      console.log("Data connection initiated");
      const dataConn = localUserRef.current.connect(remotePeerID);
      handleDataConnection(dataConn);

      const call = localUserRef.current.call(remotePeerID, localVideoRef.current.srcObject);
      handleRemoteCall(call);
    });

    // answer call
    localUserRef.current.on('call', (call) => {
      console.log('call received');
      call.answer(localVideoRef.current.srcObject);
      handleRemoteCall(call);
    });
  }

  function handleRemoteCall(call) {
    call.on('stream', (remoteStream) => {
      remoteVideoRef.current.srcObject = remoteStream;
      remoteVideoRef.current.addEventListener('loadedmetadata', () => {
        remoteVideoRef.current.play();
      });
      setIsLoadingPartner(false);
    });

    socketRef.current.on('close-connection', () => {
      call.close();
      if (dataConnectionRef.current) {
        dataConnectionRef.current.close();
        stopSegmenting(false);
        setRemoteBackground('none');
      }
    });

    call.on('close', function () {
      console.log('closing call');
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
    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((stream) => {
        localVideoRef.current.srcObject = stream;

        // Monitor video track
        stream.getVideoTracks().forEach((track) => {
          track.onended = () => leaveChat(ERROR_CODES.MEDIA_PERMISSION_DENIED); // camera turned off
          track.onmute = () => leaveChat(ERROR_CODES.MEDIA_PERMISSION_DENIED); // camera muted
        });

        // Monitor audio track
        stream.getAudioTracks().forEach((track) => {
          track.onended = () => leaveChat(ERROR_CODES.MEDIA_PERMISSION_DENIED); // mic turned off
          track.onmute = () => leaveChat(ERROR_CODES.MEDIA_PERMISSION_DENIED);  // mic muted
        });

        localVideoRef.current.addEventListener('loadedmetadata', () => {
          localVideoRef.current.play();
        });
        
        setIsStreamReady(true);
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
    <Box
      sx={{
        width: '97%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
      }}
    >
      {/* Video Container */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          gap: 2,
          width: '100%',
          flex: 1,
        }}
      >
        {/* Local Video + Canvas for compositing */}
        <Box
          sx={{
            flex: 1,
            position: 'relative',
            borderRadius: 2,
            overflow: 'hidden',
            backgroundColor: 'black',
          }}
        >
          <video
            ref={localVideoRef}
            autoPlay
            muted
            playsInline
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
        <Box
          sx={{
            flex: 1,
            position: 'relative',
            borderRadius: 2,
            overflow: 'hidden',
            backgroundColor: 'black',
          }}
        >
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
            <Box
              sx={{
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
              }}
            >
              <CircularProgress sx={{ color: '#F76902' }} />
              <Typography variant="h6">Finding a match...</Typography>
            </Box>
          )}
        </Box>
      </Box>

      {/* Buttons Container */}
      <Box
        sx={{
          display: 'flex',
          gap: 2,
          width: '100%',
        }}
      >
        <Select label="Background" value={localBackground} onChange={(e) => setLocalBackground(e.target.value)}>
          <MenuItem value="none">None</MenuItem>
          <MenuItem value="/rit.jpg">Any (Use rit.jpg)</MenuItem>
        </Select>
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