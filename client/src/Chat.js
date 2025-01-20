import React, { useEffect, useRef, useState } from 'react';
import io from 'socket.io-client';
import Peer from 'peerjs';
import { useNavigate } from 'react-router-dom';
import Bugsnag from '@bugsnag/js';
import { useAuth } from './contexts/AuthContext';
import { FilesetResolver, ImageSegmenter } from '@mediapipe/tasks-vision';

// Add these shader constants at the top of the file
const vertexShaderSource = `
  attribute vec4 a_position;
  attribute vec2 a_texCoord;
  varying vec2 v_texCoord;
  void main() {
    gl_Position = a_position;
    v_texCoord = a_texCoord;
  }
`;

const fragmentShaderSource = `
  precision mediump float;
  uniform sampler2D u_image;
  uniform sampler2D u_mask;
  uniform sampler2D u_background;
  uniform bool u_useBackground;
  varying vec2 v_texCoord;
  
  void main() {
    vec4 color = texture2D(u_image, v_texCoord);
    float mask = texture2D(u_mask, v_texCoord).r;
    vec4 backgroundColor = texture2D(u_background, v_texCoord);
    
    vec3 finalColor = u_useBackground ? mix(backgroundColor.rgb, color.rgb, mask) : color.rgb;
    gl_FragColor = vec4(finalColor, 1.0);
  }
`;

function Chat() {
  const navigate = useNavigate();
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const { user } = useAuth();
  const localUserRef = useRef(null);
  const socketRef = useRef(null);
  const imageSegmenterRef = useRef(null);
  const canvasRef = useRef(null);
  const glRef = useRef(null);
  const programRef = useRef(null);
  const textureRef = useRef(null);
  const maskTextureRef = useRef(null);
  const backgroundTextureRef = useRef(null);
  const backgroundImageRef = useRef(null);
  const canvasStreamRef = useRef(null);

  const [isStreamReady, setIsStreamReady] = useState(false);
  const [backgroundImage, setBackgroundImage] = useState(null);
  const [useBackground, setUseBackground] = useState(false);

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
      initializeSegmenter();
      initWebGL();
      // Create canvas stream after WebGL is initialized
      canvasStreamRef.current = canvasRef.current.captureStream();
      // Add audio track from original stream to canvas stream
      const audioTrack = localVideoRef.current.srcObject.getAudioTracks()[0];
      if (audioTrack) {
        canvasStreamRef.current.addTrack(audioTrack);
      }
      joinChat();
    }
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
      socketRef.current.emit('join-chat', localPeerID);
    });

    localUserRef.current.on('error', (error) => {
      Bugsnag.notify(error);
    });

    socketRef.current.on('leave-chat', () => {
      console.log('user left');
      leaveChat();
    });

    // initiate call - update to use canvas stream
    socketRef.current.on('match-found', (remotePeerID) => {
      console.log("call initiated");
      const call = localUserRef.current.call(remotePeerID, canvasStreamRef.current);
      handleRemoteCall(call);
    });

    // answer call - update to use canvas stream
    localUserRef.current.on('call', (call) => {
      console.log("call received");
      call.answer(canvasStreamRef.current);
      handleRemoteCall(call);
    });
  }

  // handle call events
  function handleRemoteCall(call) {

    // their local stream -> our remote stream
    call.on('stream', (remoteStream) => {
      remoteVideoRef.current.srcObject = remoteStream;
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
        
        // Wait for the video to be properly loaded before marking stream as ready
        localVideoRef.current.onloadedmetadata = () => {
          localVideoRef.current.play()
            .then(() => {
              console.log("Video is playing");
              setIsStreamReady(true);
            })
            .catch(error => console.error("Error playing video:", error));
        };

        // Monitor video track
        stream.getVideoTracks().forEach((track) => {
          track.onended = leaveChat;
          track.onmute = leaveChat;
        });
      })
      .catch((error) => {
        console.error('Error accessing media devices:', error);
        leaveChat();
      });
  }

  function stopLocalStream() {
    if (localVideoRef.current && localVideoRef.current.srcObject) {
      localVideoRef.current.srcObject.getTracks().forEach((track) => track.stop());
      localVideoRef.current.srcObject = null;
    }
  }

  function leaveChat() {
    navigate('/'); // Redirect to home
  }

  async function initializeSegmenter() {
    try {
      const vision = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
      );

      imageSegmenterRef.current = await ImageSegmenter.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: `/models/selfie_segmenter_landscape.tflite`,
        },
        runningMode: "LIVE_STREAM",
        outputCategoryMask: false,
        outputConfidenceMasks: true,
        resultListener: handleSegmentationResult

      });
      // Only start segmenter after initialization is complete
      startSegmenter();
    } catch (error) {
      console.error("Error initializing segmenter", error);
    }
  }

  function startSegmenter() {
    // Check if video is ready before starting the render loop
    if (!localVideoRef.current || !localVideoRef.current.videoWidth) {
      console.log("Video not ready yet");
      return;
    }

    let animationFrameId;
    console.log("segmenting");
    function renderLoop() {
      if (localVideoRef.current && localVideoRef.current.videoWidth) {
        try {
          imageSegmenterRef.current.segmentForVideo(localVideoRef.current, performance.now(), handleSegmentationResult);
          animationFrameId = requestAnimationFrame(renderLoop);
        } catch (error) {
          console.error("Error in render loop:", error);
          cancelAnimationFrame(animationFrameId);
        }
      }
    }
    renderLoop();
  }

  function handleSegmentationResult(result) {
    if (!glRef.current || !result || !result.confidenceMasks || !result.confidenceMasks[0]) return;

    const gl = glRef.current;
    const program = programRef.current;

    // Update video texture
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, textureRef.current);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, localVideoRef.current);

    // Update mask texture
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, maskTextureRef.current);
    gl.texImage2D(
      gl.TEXTURE_2D, 
      0, 
      gl.LUMINANCE, 
      result.confidenceMasks[0].width,
      result.confidenceMasks[0].height, 
      0,
      gl.LUMINANCE,
      gl.UNSIGNED_BYTE,
      result.confidenceMasks[0].getAsUint8Array()
    );

    // Draw
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }

  // Add this new function to set up WebGL
  function initWebGL() {
    const canvas = canvasRef.current;
    const gl = canvas.getContext('webgl');
    if (!gl) {
      console.error('WebGL not supported');
      return;
    }
    glRef.current = gl;

    // Create shaders
    const vertexShader = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vertexShader, vertexShaderSource);
    gl.compileShader(vertexShader);

    const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fragmentShader, fragmentShaderSource);
    gl.compileShader(fragmentShader);

    // Create program
    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    gl.useProgram(program);
    programRef.current = program;

    // Set up position buffer
    const positions = [
      -1, -1,
       1, -1,
      -1,  1,
       1,  1,
    ];
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

    // Update texture coordinates to flip the image vertically
    const texCoords = [
      0.0, 1.0,  // bottom-left
      1.0, 1.0,  // bottom-right
      0.0, 0.0,  // top-left
      1.0, 0.0,  // top-right
    ];
    const texCoordBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(texCoords), gl.STATIC_DRAW);

    // Set up texture
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    textureRef.current = texture;

    // Add another texture for the mask
    const maskTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, maskTexture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    maskTextureRef.current = maskTexture;

    // Add background texture
    const backgroundTexture = gl.createTexture();
    gl.activeTexture(gl.TEXTURE2);
    gl.bindTexture(gl.TEXTURE_2D, backgroundTexture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    backgroundTextureRef.current = backgroundTexture;

    // Set up attributes
    const positionLocation = gl.getAttribLocation(program, 'a_position');
    const texCoordLocation = gl.getAttribLocation(program, 'a_texCoord');

    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
    gl.enableVertexAttribArray(texCoordLocation);
    gl.vertexAttribPointer(texCoordLocation, 2, gl.FLOAT, false, 0, 0);

    // Set up texture units
    gl.uniform1i(gl.getUniformLocation(program, 'u_image'), 0);
    gl.uniform1i(gl.getUniformLocation(program, 'u_mask'), 1);
    gl.uniform1i(gl.getUniformLocation(program, 'u_background'), 2);

    // After setting up other uniforms, add the background toggle uniform with false as default
    gl.uniform1i(gl.getUniformLocation(program, 'u_useBackground'), false);

    // Load the background image
    loadBackgroundImage();
  }

  // Add new function to load background image
  function loadBackgroundImage() {
    const image = new Image();
    image.src = '/rit.jpg'; // Make sure to place rit.jpg in the public folder
    image.onload = () => {
      backgroundImageRef.current = image;
      if (glRef.current && programRef.current) {
        updateBackgroundTexture();
      }
    };
  }

  function updateBackgroundTexture() {
    if (!glRef.current || !backgroundImageRef.current) return;
    
    const gl = glRef.current;
    gl.activeTexture(gl.TEXTURE2);
    gl.bindTexture(gl.TEXTURE_2D, backgroundTextureRef.current);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, backgroundImageRef.current);
  }

  // Add new function to handle background toggle
  function toggleBackground() {
    setUseBackground(!useBackground);
    if (glRef.current && programRef.current) {
      const gl = glRef.current;
      gl.useProgram(programRef.current);
      gl.uniform1i(gl.getUniformLocation(programRef.current, 'u_useBackground'), !useBackground);
    }
  }

  return (
    <div>
      <h1>Chat</h1>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        gap: '20px',
        margin: '20px 0'
      }}>
        <div>
          <video
            ref={localVideoRef}
            autoPlay
            muted
            playsInline
            webkit-playsinline="true"
            style={{ display: 'none' }}
          />
          <canvas
            ref={canvasRef}
            width="640"
            height="480"
            style={{ 
              backgroundColor: 'transparent',
              maxWidth: '100%',
              height: 'auto'
            }}
          />
        </div>
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          webkit-playsinline="true"
          style={{
            maxWidth: '640px',
            height: 'auto'
          }}
        />
      </div>
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        gap: '10px'
      }}>
        <button onClick={() => socketRef.current.emit('next')}>Next</button>
        <button onClick={() => leaveChat()}>Leave</button>
        <button onClick={toggleBackground}>
          {useBackground ? 'Disable' : 'Enable'} Background
        </button>
      </div>
    </div>
  );
}

export default Chat;
