// virtualBackground.js
import { FilesetResolver, ImageSegmenter } from '@mediapipe/tasks-vision';

/**
 * Module-level variables for WebGL pipeline
 */
let gl = null;
let offscreenCanvas = null;
let program = null;
let positionBuffer = null;
let texCoordBuffer = null;
let videoTexture = null;
let backgroundTexture = null;
let maskTexture = null;

let videoFrameSize = { width: 640, height: 480 };
let backgroundImage = null;
let backgroundLoaded = false;

let animationFrameId = null;
let segmenter = null;
let isSegmenting = false;

/**
 * Helper to check if a numeric value is a power of two.
 */
function isPowerOfTwo(value) {
  // 0,1 => special cases. Usually, we want strictly >1, but
  // for standard usage, this will do the basic bit trick:
  return (value & (value - 1)) === 0;
}

/**
 * Checks if an Image instance has power-of-two dimensions.
 */
function isImagePowerOfTwo(image) {
  return isPowerOfTwo(image.width) && isPowerOfTwo(image.height);
}

/** 
 * Returns a promise that resolves to a MediaPipe `ImageSegmenter` instance. 
 */
export async function initializeImageSegmenter() {
  try {
    const vision = await FilesetResolver.forVisionTasks(
      'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
    );

    const imageSegmenter = await ImageSegmenter.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath: '/model/selfie_segmenter_landscape.tflite',
      },
      runningMode: 'LIVE_STREAM',
      outputCategoryMask: false,
      outputConfidenceMasks: true
    });
    return imageSegmenter;
  } catch (error) {
    console.error('Error creating image segmenter:', error);
    return null;
  }
}

/**
 * Begin segmentation:
 *  - Create offscreen canvas + WebGL context
 *  - Load background image into a texture
 *  - Start rendering & calling segmenter
 *  - Return a new MediaStream (with original audio + composited video)
 */
export function startVirtualBackground(
  imageSegmenter,       // The MediaPipe segmenter
  originalStream,        // The user's camera (or screen) stream
  backgroundImagePath,   // Path or URL to background image
  width = 640,
  height = 480
) {
  if (!imageSegmenter) {
    console.warn('No image segmenter provided, returning original stream.');
    return originalStream;
  }
  segmenter = imageSegmenter;
  isSegmenting = true;

  videoFrameSize = { width, height };

  // 1) Create an offscreen canvas for compositing
  offscreenCanvas = document.createElement('canvas');
  offscreenCanvas.width = width;
  offscreenCanvas.height = height;

  // 2) Create the WebGL context
  gl = offscreenCanvas.getContext('webgl', { alpha: false });
  if (!gl) {
    console.error('WebGL not supported, returning original stream.');
    return originalStream;
  }

  // 3) Init GPU resources (shaders, buffers, textures)
  initWebGLResources();

  // 4) Load the chosen background
  loadBackgroundImage(backgroundImagePath);

  // 5) Create a new MediaStream from the composited canvas + original audio
  const processedStream = offscreenCanvas.captureStream(30);
  const newStream = new MediaStream();
  // Add the composited video track
  processedStream.getVideoTracks().forEach((track) => newStream.addTrack(track));
  // Add the original audio track(s)
  originalStream.getAudioTracks().forEach((track) => newStream.addTrack(track));

  // 6) Start the animation loop
  function renderLoop() {
    if (!isSegmenting) return;
    animationFrameId = requestAnimationFrame(renderLoop);
    // Run segmentation each frame
    updateVideoTextureAndSegment(originalStream);
  }
  renderLoop();

  return newStream;
}

/**
 * Stops the segmentation loop and cleans up resources.
 */
export function stopVirtualBackground() {
  isSegmenting = false;
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
  }
  cleanupWebGL();
}

/**
 * On each frame, call the segmenter on the current video, then handle the result.
 */
function updateVideoTextureAndSegment(originalStream) {
  if (!backgroundLoaded || !segmenter || !isSegmenting) return;

  // Use or create the hidden <video> for reading the frames
  const tempVideo = getOrCreateHiddenVideoForStream(originalStream);
  if (tempVideo.readyState < 2) return; // Not ready yet

  // Call segmenter
  segmenter.segmentForVideo(tempVideo, performance.now(), handleSegmentationResult);
}

/**
 * Called each time the segmenter finishes. We update our maskTexture
 * and then composite background + video into offscreenCanvas.
 */
function handleSegmentationResult(result) {
  if (!gl || !program) return;

  const confidenceMap = result.confidenceMasks?.[0];
  if (!confidenceMap) return;

  const floatData = confidenceMap.g[0];
  const { width, height } = confidenceMap;
  if (!floatData || !width || !height) return;

  // Convert float [0..1] => 8-bit [0..255]
  const u8Data = new Uint8Array(floatData.length);
  for (let i = 0; i < floatData.length; i++) {
    // Example of feathering the edges by applying a slight exponent
    const val = Math.pow(Math.max(0, Math.min(1, floatData[i])), 0.8);
    u8Data[i] = Math.floor(val * 255);
  }

  // Update mask texture
  gl.bindTexture(gl.TEXTURE_2D, maskTexture);
  gl.texImage2D(
    gl.TEXTURE_2D,
    0,
    gl.ALPHA,  // store in alpha channel
    width,
    height,
    0,
    gl.ALPHA,
    gl.UNSIGNED_BYTE,
    u8Data
  );

  // Update the video texture with the current frame
  updateVideoTexture();

  // Composite final
  drawComposite();
}

/** 
 * Creates buffers, compiles shaders, and creates empty textures. 
 */
function initWebGLResources() {
  // 1) Create buffers for a full-screen quad
  positionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  const vertices = new Float32Array([
    -1, -1,
     1, -1,
    -1,  1,
     1,  1
  ]);
  gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

  texCoordBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
  const texCoords = new Float32Array([
    0, 1,
    1, 1,
    0, 0,
    1, 0
  ]);
  gl.bufferData(gl.ARRAY_BUFFER, texCoords, gl.STATIC_DRAW);

  // 2) Shaders
  const vertexSrc = `
    attribute vec2 a_position;
    attribute vec2 a_texCoord;
    varying vec2 v_texCoord;
    void main() {
      gl_Position = vec4(a_position, 0.0, 1.0);
      v_texCoord = a_texCoord;
    }
  `;
  // We blend background + video based on mask alpha
  const fragmentSrc = `
    precision mediump float;
    varying vec2 v_texCoord;
    uniform sampler2D u_video;
    uniform sampler2D u_background;
    uniform sampler2D u_mask;

    void main() {
      vec4 videoColor = texture2D(u_video, v_texCoord);
      vec4 bgColor = texture2D(u_background, v_texCoord);
      float maskVal = texture2D(u_mask, v_texCoord).a;

      // Mix background (when mask=0) and video (when mask=1)
      gl_FragColor = mix(bgColor, videoColor, maskVal);
    }
  `;

  const vs = createShader(gl, gl.VERTEX_SHADER, vertexSrc);
  const fs = createShader(gl, gl.FRAGMENT_SHADER, fragmentSrc);
  program = createProgram(gl, vs, fs);

  // 3) Create textures with proper parameters
  videoTexture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, videoTexture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  // Important for NPOT textures:
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

  backgroundTexture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, backgroundTexture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  // Important for NPOT textures:
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

  maskTexture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, maskTexture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  // Also must clamp for NPOT
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

  // Unbind
  gl.bindTexture(gl.TEXTURE_2D, null);
}

/**
 * Load the background image into backgroundTexture once.
 */
function loadBackgroundImage(path) {
  backgroundImage = new Image();
  backgroundImage.crossOrigin = 'anonymous';
  backgroundImage.src = path;
  backgroundImage.onload = function () {
    // Bind background texture and upload image
    gl.bindTexture(gl.TEXTURE_2D, backgroundTexture);
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      backgroundImage
    );

    // If the image is power-of-two, we can generate mipmaps
    if (isImagePowerOfTwo(backgroundImage)) {
      gl.generateMipmap(gl.TEXTURE_2D);
    } 
    // If not POT, we simply do not call generateMipmap

    backgroundLoaded = true;
  };
  backgroundImage.onerror = function (err) {
    console.error('Failed to load background image:', err);
  };
}

/**
 * Update the videoTexture by pulling from the hidden <video> element.
 */
function updateVideoTexture() {
  const tempVideo = document.getElementById('hidden-video-for-webgl');
  if (!tempVideo || tempVideo.readyState < 2) return;

  gl.bindTexture(gl.TEXTURE_2D, videoTexture);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, tempVideo);
}

/**
 * Draw background + video + mask to offscreenCanvas.
 */
function drawComposite() {
  gl.viewport(0, 0, offscreenCanvas.width, offscreenCanvas.height);
  gl.clearColor(0, 0, 0, 1);
  gl.clear(gl.COLOR_BUFFER_BIT);

  gl.useProgram(program);

  // Setup position buffer
  const posLoc = gl.getAttribLocation(program, 'a_position');
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.enableVertexAttribArray(posLoc);
  gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

  // Setup texCoord buffer
  const texLoc = gl.getAttribLocation(program, 'a_texCoord');
  gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
  gl.enableVertexAttribArray(texLoc);
  gl.vertexAttribPointer(texLoc, 2, gl.FLOAT, false, 0, 0);

  // Samplers
  const uVideo = gl.getUniformLocation(program, 'u_video');
  const uBg = gl.getUniformLocation(program, 'u_background');
  const uMask = gl.getUniformLocation(program, 'u_mask');

  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, videoTexture);
  gl.uniform1i(uVideo, 0);

  gl.activeTexture(gl.TEXTURE1);
  gl.bindTexture(gl.TEXTURE_2D, backgroundTexture);
  gl.uniform1i(uBg, 1);

  gl.activeTexture(gl.TEXTURE2);
  gl.bindTexture(gl.TEXTURE_2D, maskTexture);
  gl.uniform1i(uMask, 2);

  // Draw
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
}

/**
 * Cleanup to free GPU resources (optional if you plan on reusing).
 */
function cleanupWebGL() {
  if (!gl) return;
  if (videoTexture) gl.deleteTexture(videoTexture);
  if (backgroundTexture) gl.deleteTexture(backgroundTexture);
  if (maskTexture) gl.deleteTexture(maskTexture);
  if (positionBuffer) gl.deleteBuffer(positionBuffer);
  if (texCoordBuffer) gl.deleteBuffer(texCoordBuffer);
  if (program) gl.deleteProgram(program);

  videoTexture = null;
  backgroundTexture = null;
  maskTexture = null;
  positionBuffer = null;
  texCoordBuffer = null;
  program = null;
  gl = null;
  offscreenCanvas = null;
  backgroundImage = null;
  backgroundLoaded = false;
}

/**
 * Minimal helper to compile a shader.
 */
function createShader(gl, type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  const ok = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
  if (!ok) {
    console.warn(gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

/**
 * Minimal helper to link a program.
 */
function createProgram(gl, vs, fs) {
  const prog = gl.createProgram();
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.linkProgram(prog);
  const ok = gl.getProgramParameter(prog, gl.LINK_STATUS);
  if (!ok) {
    console.warn(gl.getProgramInfoLog(prog));
    gl.deleteProgram(prog);
    return null;
  }
  return prog;
}

/**
 * Return a hidden <video> element that is playing the given stream.
 * We reuse or create it once, so it can provide frames to the segmenter.
 */
function getOrCreateHiddenVideoForStream(stream) {
  let hiddenVideo = document.getElementById('hidden-video-for-webgl');
  if (!hiddenVideo) {
    hiddenVideo = document.createElement('video');
    hiddenVideo.id = 'hidden-video-for-webgl';
    hiddenVideo.style.display = 'none';
    hiddenVideo.autoplay = true;
    hiddenVideo.playsInline = true;
    hiddenVideo.muted = true; // no audio needed
    document.body.appendChild(hiddenVideo);
  }
  if (hiddenVideo.srcObject !== stream) {
    hiddenVideo.srcObject = stream;
  }
  return hiddenVideo;
}
