import React, { useEffect, useRef, useState, useCallback } from 'react';
import io from 'socket.io-client';
import Peer from 'peerjs';
import { useNavigate } from 'react-router-dom';
import Bugsnag from '@bugsnag/js';
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

  // Add a second canvas and GL context for remote video
  const remoteCanvasRef = useRef(null);
  const remoteGlRef = useRef(null);
  const remoteProgramRef = useRef(null);
  const remoteTextureRef = useRef(null);
  const remoteMaskTextureRef = useRef(null);
  const remoteBackgroundTextureRef = useRef(null);
  const remoteImageSegmenterRef = useRef(null);

  const [isStreamReady, setIsStreamReady] = useState(false);
  const [useBackground, setUseBackground] = useState(false);

  // Add leaveChat at the top with other function definitions
  const leaveChat = useCallback(() => {
    navigate('/'); // Redirect to home
  }, [navigate]); // Include navigate as a dependency since it's from useNavigate

  // Define these functions first since they're dependencies
  const loadBackgroundImage = useCallback(() => {
    const image = new Image();
    image.src = '/rit.jpg';
    image.crossOrigin = "anonymous";
    image.onload = () => {
      backgroundImageRef.current = image;
      if (glRef.current && programRef.current) {
        updateBackgroundTexture(glRef.current, backgroundTextureRef.current);
      }
      if (remoteGlRef.current && remoteProgramRef.current) {
        updateBackgroundTexture(remoteGlRef.current, remoteBackgroundTextureRef.current);
      }
    };
  }, []);

  const startSegmenter = useCallback(() => {
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
  }, []);

  // Now define the callbacks that depend on the above functions
  const initWebGLCallback = useCallback(() => {
    // Initialize local canvas WebGL
    const initCanvas = (canvas, glRef, programRef, textureRef, maskTextureRef, backgroundTextureRef) => {
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
    };

    // Initialize both canvases
    initCanvas(canvasRef.current, glRef, programRef, textureRef, maskTextureRef, backgroundTextureRef);
    initCanvas(remoteCanvasRef.current, remoteGlRef, remoteProgramRef, remoteTextureRef, remoteMaskTextureRef, remoteBackgroundTextureRef);
    
    loadBackgroundImage();
  }, [loadBackgroundImage]);

  const initializeSegmenterCallback = useCallback(async () => {
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
      startSegmenter();
    } catch (error) {
      console.error("Error initializing segmenter", error);
    }
  }, [startSegmenter]);

  const joinChatCallback = useCallback(() => {
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
      socketRef.current.emit('join-chat', localPeerID, 'test');
    });

    localUserRef.current.on('error', (error) => {
      Bugsnag.notify(error);
    });

    socketRef.current.on('leave-chat', () => {
      console.log('user left');
      leaveChat();
    });

    // Add listener for background toggle from other user
    socketRef.current.on('background-toggle', (remoteUseBackground) => {
      if (remoteGlRef.current && remoteProgramRef.current) {
        const gl = remoteGlRef.current;
        gl.useProgram(remoteProgramRef.current);
        gl.uniform1i(gl.getUniformLocation(remoteProgramRef.current, 'u_useBackground'), remoteUseBackground);
      }
    });

    // initiate call - update to use original stream
    socketRef.current.on('match-found', (remotePeerID) => {
      console.log("call initiated");
      const call = localUserRef.current.call(remotePeerID, localVideoRef.current.srcObject);
      handleRemoteCall(call);
    });

    // answer call - update to use original stream
    localUserRef.current.on('call', (call) => {
      console.log("call received");
      call.answer(localVideoRef.current.srcObject);
      handleRemoteCall(call);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leaveChat]);

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
      initializeSegmenterCallback();
      initWebGLCallback();
      canvasStreamRef.current = canvasRef.current.captureStream();
      const audioTrack = localVideoRef.current.srcObject.getAudioTracks()[0];
      if (audioTrack) {
        canvasStreamRef.current.addTrack(audioTrack);
      }
      joinChatCallback();
    }
  }, [isStreamReady, initializeSegmenterCallback, initWebGLCallback, joinChatCallback]);

  function handleRemoteCall(call) {
    call.on('stream', (remoteStream) => {
      // Set the remote video source
      remoteVideoRef.current.srcObject = remoteStream;
      
      // Wait for the remote video to be loaded before initializing segmenter
      remoteVideoRef.current.onloadedmetadata = () => {
        remoteVideoRef.current.play()
          .then(() => {
            console.log("Remote video is playing");
            initializeRemoteSegmenter();
          })
          .catch(error => console.error("Error playing remote video:", error));
      };
    });

    socketRef.current.on('close-connection', () => {
      socketRef.current.removeListener('close-connection');
      call.close();
    });

    call.on('close', function () {
      console.log("closing call");
      if (remoteVideoRef.current && remoteVideoRef.current.srcObject) {
        remoteVideoRef.current.srcObject.getTracks().forEach((track) => track.stop());
        remoteVideoRef.current.srcObject = null;
      }
      // Clean up remote segmenter
      if (remoteImageSegmenterRef.current) {
        remoteImageSegmenterRef.current = null;
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

  function handleSegmentationResult(result) {
    if (!glRef.current || !result || !result.confidenceMasks || !result.confidenceMasks[0]) return;

    const gl = glRef.current;
    
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

  function updateBackgroundTexture(gl, backgroundTexture) {
    if (!gl || !backgroundImageRef.current) return;
    
    gl.activeTexture(gl.TEXTURE2);
    gl.bindTexture(gl.TEXTURE_2D, backgroundTexture);
    
    // Simply draw the image normally without flipping
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, backgroundImageRef.current);
  }

  // Update toggleBackground to emit the state change
  function toggleBackground() {
    setUseBackground(!useBackground);
    if (glRef.current && programRef.current) {
      const gl = glRef.current;
      gl.useProgram(programRef.current);
      gl.uniform1i(gl.getUniformLocation(programRef.current, 'u_useBackground'), !useBackground);
      updateBackgroundTexture(gl, backgroundTextureRef.current);  // Refresh background texture
    }
    socketRef.current.emit('background-toggle', !useBackground);
  }

  // Add remote segmenter initialization
  const initializeRemoteSegmenter = useCallback(async () => {
    try {
      const vision = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
      );

      remoteImageSegmenterRef.current = await ImageSegmenter.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: `/models/selfie_segmenter_landscape.tflite`,
        },
        runningMode: "LIVE_STREAM",
        outputCategoryMask: false,
        outputConfidenceMasks: true,
        resultListener: handleRemoteSegmentationResult
      });
      startRemoteSegmenter();
    } catch (error) {
      console.error("Error initializing remote segmenter", error);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Add remote segmentation handler
  function handleRemoteSegmentationResult(result) {
    if (!remoteGlRef.current || !result || !result.confidenceMasks || !result.confidenceMasks[0]) return;

    const gl = remoteGlRef.current;
    
    // Update video texture
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, remoteTextureRef.current);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, remoteVideoRef.current);

    // Update mask texture
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, remoteMaskTextureRef.current);
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

  // Add remote segmenter start function
  const startRemoteSegmenter = useCallback(() => {
    if (!remoteVideoRef.current || !remoteVideoRef.current.videoWidth) {
      console.log("Remote video not ready yet");
      return;
    }

    let animationFrameId;
    console.log("segmenting remote");
    function renderLoop() {
      if (remoteVideoRef.current && remoteVideoRef.current.videoWidth) {
        try {
          remoteImageSegmenterRef.current.segmentForVideo(remoteVideoRef.current, performance.now(), handleRemoteSegmentationResult);
          animationFrameId = requestAnimationFrame(renderLoop);
        } catch (error) {
          console.error("Error in remote render loop:", error);
          cancelAnimationFrame(animationFrameId);
        }
      }
    }
    renderLoop();

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, []);

  return (
    <div>
      <h1>Chat</h1>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        gap: '20px',
        margin: '20px 0'
      }}>
        <div style={{
          width: '640px',
          height: '480px',
          backgroundColor: '#000'
        }}>
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
              width: '100%',
              height: '100%',
              objectFit: 'cover'
            }}
          />
        </div>
        <div style={{
          width: '640px',
          height: '480px',
          backgroundColor: '#000'
        }}>
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            webkit-playsinline="true"
            style={{ display: 'none' }}
          />
          <canvas
            ref={remoteCanvasRef}
            width="640"
            height="480"
            style={{ 
              width: '100%',
              height: '100%',
              objectFit: 'cover'
            }}
          />
        </div>
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