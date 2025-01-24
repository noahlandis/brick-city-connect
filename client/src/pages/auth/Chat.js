// Chat.js
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

// --- Import from your virtualBackground.js ---
import {
  initializeImageSegmenter,
  startVirtualBackground,
  stopVirtualBackground
} from '../../utils/virtualBackground';

function Chat() {
  const navigate = useNavigate();
  const theme = useTheme();
  const { user } = useAuth();

  // Refs for video elements
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);

  // Refs for PeerJS + socket
  const localUserRef = useRef(null);
  const socketRef = useRef(null);

  // State variables
  const [isStreamReady, setIsStreamReady] = useState(false);
  const [isLoadingPartner, setIsLoadingPartner] = useState(true);
  const [showSnackbar, setShowSnackbar] = useState(false);
  const [background, setBackground] = useState('none');

  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Store references to the original camera stream and the segmenter
  const [originalStream, setOriginalStream] = useState(null);
  const [segmenter, setSegmenter] = useState(null);

  /**
   * On mount:
   *  1) Load the MediaPipe segmenter (once).
   *  2) Start the local camera stream.
   */
  useEffect(() => {
    let isMounted = true;
    // 1) Initialize segmenter
    (async () => {
      const seg = await initializeImageSegmenter();
      if (isMounted) {
        setSegmenter(seg);
      }
    })();

    // 2) Start local camera
    startLocalStream();

    // Cleanup on unmount
    return () => {
      isMounted = false;
      stopLocalStream();

      // Stop the virtual background if it's running
      stopVirtualBackground();

      // Destroy the Peer when leaving the page
      if (localUserRef.current) {
        localUserRef.current.destroy();
      }

      // Disconnect the socket
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * Once our local stream is ready, join the chat (socket.io and PeerJS).
   */
  useEffect(() => {
    if (isStreamReady) {
      joinChat();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isStreamReady]);

  /**
   * Whenever the user changes the background selection, update the local video:
   *  - If "none", revert to original camera stream
   *  - Otherwise, create a new composited stream with startVirtualBackground
   */
  useEffect(() => {
    if (!originalStream || !segmenter) return;

    // Stop any existing virtual background
    stopVirtualBackground();

    if (background === 'none') {
      // Revert local video to the original camera stream
      localVideoRef.current.srcObject = originalStream;
    } else {
      // Start the virtual background with the selected image
      const newStream = startVirtualBackground(
        segmenter,
        originalStream,
        '/' + background // Adjust path as needed
      );
      localVideoRef.current.srcObject = newStream;
    }
  }, [background, originalStream, segmenter]);

  /**
   * Join chat: set up socket.io and PeerJS logic.
   */
  function joinChat() {
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

    socketRef.current.on('waiting-to-skip', () => {
      setShowSnackbar(true);
    });

    // Initiate call
    socketRef.current.on('match-found', (remotePeerID) => {
      console.log('call initiated');
      // Use the localVideoRef's current stream (which might be VB or original)
      const call = localUserRef.current.call(remotePeerID, localVideoRef.current.srcObject);
      handleRemoteCall(call);
    });

    // Answer call
    localUserRef.current.on('call', (call) => {
      console.log('call received');
      // Answer with local video (VB or original)
      call.answer(localVideoRef.current.srcObject);
      handleRemoteCall(call);
    });
  }

  /**
   * Handle the inbound or outbound call: attach remote stream to our <video>.
   */
  function handleRemoteCall(call) {
    call.on('stream', (remoteStream) => {
      remoteVideoRef.current.srcObject = remoteStream;
      setIsLoadingPartner(false);
    });

    socketRef.current.on('close-connection', () => {
      call.close();
    });

    call.on('close', () => {
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

  /**
   * Acquire user camera + mic, store in originalStream, attach to local video.
   */
  function startLocalStream() {
    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then((stream) => {
        setOriginalStream(stream);
        localVideoRef.current.srcObject = stream; // by default, show original
        setIsStreamReady(true); // Mark stream as ready

        // Monitor video track
        stream.getVideoTracks().forEach((track) => {
          track.onended = () => leaveChat(ERROR_CODES.MEDIA_PERMISSION_DENIED); // camera off
          track.onmute = () => leaveChat(ERROR_CODES.MEDIA_PERMISSION_DENIED);  // camera muted
        });

        // Monitor audio track
        stream.getAudioTracks().forEach((track) => {
          track.onended = () => leaveChat(ERROR_CODES.MEDIA_PERMISSION_DENIED); // mic off
          track.onmute = () => leaveChat(ERROR_CODES.MEDIA_PERMISSION_DENIED);  // mic muted
        });
      })
      .catch((error) => {
        console.error('Error accessing media devices:', error);
        leaveChat(ERROR_CODES.MEDIA_PERMISSION_DENIED);
      });
  }

  /**
   * Stop the original camera/mic if we need to fully terminate.
   */
  function stopLocalStream() {
    if (localVideoRef.current && localVideoRef.current.srcObject) {
      localVideoRef.current.srcObject.getTracks().forEach((track) => track.stop());
      localVideoRef.current.srcObject = null;
    }
  }

  /**
   * Leave the chat, optionally with an error code for redirection.
   */
  function leaveChat(errorCode = null) {
    // Also stop any VB
    stopVirtualBackground();

    if (errorCode) {
      navigate(`/?error=${errorCode}`);
    } else {
      navigate('/'); // Redirect to home
    }
  }

  /**
   * Render the UI
   */
  return (
    <Box
      sx={{ 
        width: '97%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        gap: 4
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
        {/* Local Video */}
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
            webkit-playsinline="true"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
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
            webkit-playsinline="true"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
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

      {/* Buttons & Background Selector */}
      <Box sx={{ display: 'flex', gap: 2, width: '100%' }}>
        <Select
          label="Background"
          value={background}
          onChange={(e) => setBackground(e.target.value)}
        >
          <MenuItem value="none">None</MenuItem>
          <MenuItem value="rit.jpg">RIT</MenuItem>
          <MenuItem value="beach.jpg">Beach</MenuItem>
          <MenuItem value="forest.jpg">Forest</MenuItem>
          <MenuItem value="city.jpg">City</MenuItem>
        </Select>

        <Button
          variant="outlined"
          color="error"
          onClick={() => leaveChat()}
          sx={{
            flex: '0.2',
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
