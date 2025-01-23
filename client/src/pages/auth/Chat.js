import React, { useEffect, useRef, useState } from 'react';
import io from 'socket.io-client';
import Peer from 'peerjs';
import { useNavigate } from 'react-router-dom';
import Bugsnag from '@bugsnag/js';
import { useAuth } from '../../contexts/AuthContext';
import { ERROR_CODES } from '../../utils/constants';
import { Box, Typography, CircularProgress, useTheme, useMediaQuery, Button, Snackbar, Select, MenuItem } from '@mui/material';
import ShuffleIcon from '@mui/icons-material/Shuffle';
import { initializeImageSegmenter, segment, stopSegmenting } from '../../utils/virtualBackground';

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
  const [showSnackbar, setShowSnackbar] = useState(false);
  const [background, setBackground] = useState('none');
  const imageSegmenterRef = useRef(null); // Ref to hold the ImageSegmenter instance

  useEffect(() => {
    startLocalStream();

    return () => {
      stopLocalStream();
      if (localUserRef.current) {
        localUserRef.current.destroy();
      }
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
      stopSegmenting(); // Stop segmentation when the component unmounts
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  useEffect(() => {
    if (isStreamReady) {
      async function setupImageSegmenter() {
        imageSegmenterRef.current = await initializeImageSegmenter();
      }
      setupImageSegmenter();
      joinChat();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isStreamReady]);

  useEffect(() => {
    if (background !== 'none' && imageSegmenterRef.current && localVideoRef.current) {
      segment(imageSegmenterRef.current, localVideoRef.current); // Start segmentation
    } else {
      stopSegmenting(); // Stop segmentation if background is set to "none"
    }
  }, [background]);

  function joinChat() {
    socketRef.current = io(process.env.REACT_APP_SERVER_URL, {
      transports: ['websocket'],
      upgrade: false,
    });
    localUserRef.current = new Peer();
    localUserRef.current.on('open', (localPeerID) => {
      socketRef.current.emit('join-chat', localPeerID, user.username);
    });
    localUserRef.current.on('error', (error) => {
      Bugsnag.notify(error);
    });
    socketRef.current.on('leave-chat', () => leaveChat());
    socketRef.current.on('waiting-to-skip', () => setShowSnackbar(true));
    socketRef.current.on('match-found', (remotePeerID) => {
      const call = localUserRef.current.call(remotePeerID, localVideoRef.current.srcObject);
      handleRemoteCall(call);
    });
    localUserRef.current.on('call', (call) => {
      call.answer(localVideoRef.current.srcObject);
      handleRemoteCall(call);
    });
  }

  function handleRemoteCall(call) {
    call.on('stream', (remoteStream) => {
      remoteVideoRef.current.srcObject = remoteStream;
      setIsLoadingPartner(false);
    });
    socketRef.current.on('close-connection', () => call.close());
    call.on('close', () => {
      if (remoteVideoRef.current?.srcObject) {
        remoteVideoRef.current.srcObject.getTracks().forEach((track) => track.stop());
        remoteVideoRef.current.srcObject = null;
        setIsLoadingPartner(true);
      }
    });
    call.on('error', (error) => Bugsnag.notify(error));
  }

  function startLocalStream() {
    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then((stream) => {
        localVideoRef.current.srcObject = stream;
        setIsStreamReady(true);
      })
      .catch((error) => {
        console.error('Error accessing media devices:', error);
        leaveChat(ERROR_CODES.MEDIA_PERMISSION_DENIED);
      });
  }

  function stopLocalStream() {
    if (localVideoRef.current?.srcObject) {
      localVideoRef.current.srcObject.getTracks().forEach((track) => track.stop());
      localVideoRef.current.srcObject = null;
    }
  }

  function leaveChat(errorCode = null) {
    if (errorCode) {
      navigate(`/?error=${errorCode}`);
    } else {
      navigate('/');
    }
  }

  return (
    <Box sx={{ width: '97%', height: '100%', display: 'flex', flexDirection: 'column', gap: 4 }}>
      <Box sx={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: 2, width: '100%', flex: 1 }}>
        <Box sx={{ flex: 1, position: 'relative', borderRadius: 2, overflow: 'hidden', backgroundColor: 'black' }}>
          <video ref={localVideoRef} autoPlay muted playsInline style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </Box>
        <Box sx={{ flex: 1, position: 'relative', borderRadius: 2, overflow: 'hidden', backgroundColor: 'black' }}>
          <video ref={remoteVideoRef} autoPlay playsInline style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          {isLoadingPartner && (
            <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0, 0, 0, 0.7)', color: 'white', gap: 2 }}>
              <CircularProgress sx={{ color: '#F76902' }} />
              <Typography variant="h6">Finding a match...</Typography>
            </Box>
          )}
        </Box>
      </Box>
      <Box sx={{ display: 'flex', gap: 2, width: '100%' }}>
        <Select label="Background" value={background} onChange={(e) => setBackground(e.target.value)}>
          <MenuItem value="none">None</MenuItem>
          <MenuItem value="Beach">Beach</MenuItem>
          <MenuItem value="Forest">Forest</MenuItem>
          <MenuItem value="City">City</MenuItem>
        </Select>
        <Button variant="outlined" color="error" onClick={() => leaveChat()} sx={{ flex: '0.2' }}>
          Leave Chat
        </Button>
        <Button variant="contained" startIcon={<ShuffleIcon />} onClick={() => socketRef.current.emit('next')} disabled={isLoadingPartner} sx={{ flex: '0.8', backgroundColor: '#F76902', '&:hover': { backgroundColor: '#d55a02' } }}>
          Next
        </Button>
      </Box>
      <Snackbar open={showSnackbar} autoHideDuration={2000} onClose={() => setShowSnackbar(false)} message="You'll be matched with the next available user" anchorOrigin={{ vertical: 'top', horizontal: 'center' }} />
    </Box>
  );
}

export default Chat;
