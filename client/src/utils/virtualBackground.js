import { FilesetResolver, ImageSegmenter } from '@mediapipe/tasks-vision';

/**
 * Global/Module-level variables for our WebGL pipeline.
 */
let gl = null;
let offscreenCanvas = null;
let program = null;
let positionBuffer = null;
let texCoordBuffer = null;
let videoTexture = null;
let backgroundTexture = null;
let maskTexture = null;
let videoFrameSize = { width: 640, height: 480 }; // you can adjust
let backgroundImage = null;

let animationFrameId = null;
let segmenter = null;
let isSegmenting = false;

let backgroundLoaded = false;

/**
 * Initialize the MediaPipe image segmenter, using your model.
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
      outputConfidenceMasks: true,
      // We'll manually call handleSegmentationResult for each frame
      // by passing it to segmentForVideo(...).
    });
    return imageSegmenter;
  } catch (error) {
    console.error('Error creating image segmenter:', error);
    return null;
  }
}

/**
 * This function is called when the user selects a background.
 * It:
 *   - Loads the background image
 *   - Creates an offscreen canvas + WebGL context
 *   - Creates the textures and GPU resources
 *   - Starts the requestAnimationFrame loop that calls `segmentForVideo`
 *   - Returns a new stream (canvas + original audio track) to be displayed
 */
export function segment(imageSegmenter, originalStream, backgroundImagePath) {
  if (!imageSegmenter) {
    console.warn('No image segmenter available.');
    return originalStream; // fallback
  }
  // Store references
  segmenter = imageSegmenter;
  isSegmenting = true;

  // Create an offscreen canvas for compositing
  offscreenCanvas = document.createElement('canvas');
  offscreenCanvas.width = videoFrameSize.width;
  offscreenCanvas.height = videoFrameSize.height;

  // Create WebGL context
  gl = offscreenCanvas.getContext('webgl');
  if (!gl) {
    console.error('WebGL not supported');
    return originalStream; // fallback
  }

  initWebGLResources();
  loadBackgroundImage(backgroundImagePath);

  // We'll create a new MediaStream from the offscreen canvas (video) plus the original audio track
  const processedStream = offscreenCanvas.captureStream(30); // 30 FPS
  const newStream = new MediaStream();

  // Add the composited video track
  processedStream.getVideoTracks().forEach((track) => newStream.addTrack(track));
  // Add the original audio track(s)
  originalStream.getAudioTracks().forEach((track) => newStream.addTrack(track));

  // Start animation loop
  function renderLoop() {
    if (!isSegmenting) return;

    // Request the next frame
    animationFrameId = requestAnimationFrame(renderLoop);

    // Ask MediaPipe to do segmentation on the current video frame
    // We'll retrieve that from the originalStream's video track in a hidden <video> element.
    // But for simplicity, let's create a temporary <video> if needed:
    updateVideoTextureAndSegment(originalStream);
  }
  renderLoop();

  return newStream;
}

/**
 * Stop the segmentation process.
 */
export function stopSegmenting() {
  isSegmenting = false;
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
  }
  // Clean up WebGL resources if you want
  cleanupWebGL();
}

/**
 * For each frame, we draw the raw video into a hidden <video> (or we can do it off a "captured" approach).
 * Then we pass that <video> to segmenter.segmentForVideo() which calls handleSegmentationResult internally.
 */
function updateVideoTextureAndSegment(originalStream) {
  // If we haven't loaded background yet, or user has turned off segmentation:
  if (!backgroundLoaded || !segmenter || !isSegmenting) return;

  // We need a temporary <video> that is playing the originalStream
  // so that we can pass it to the segmenter. In your code, you might already have a <video>.
  // If so, just reference that. Here, let's do a quick approach:
  const tempVideo = getOrCreateHiddenVideoForStream(originalStream);
  if (tempVideo.readyState < 2) {
    // Not ready to draw
    return;
  }

  // Actually call the segmenter
  segmenter.segmentForVideo(tempVideo, performance.now(), handleSegmentationResult);
}

/**
 * Whenever the segmenter finishes, we get a segmentation result. We then update our maskTexture
 * with the confidence mask and draw the final composite to the offscreen canvas.
 */
function handleSegmentationResult(result) {
    if (!gl || !program) return;
  
    const confidenceMap = result.confidenceMasks?.[0];
    if (!confidenceMap) return;
  
    // The raw float data is in confidenceMap.g[0]
    // Typically it's a float in [0..1], but can be very small or near zero.
    const floatData = confidenceMap.g[0];
    const width = confidenceMap.width;   // 640
    const height = confidenceMap.height; // 480
    if (!width || !height || !floatData) return;
  
    // Convert [0..1] float values to 8-bit [0..255].
    const u8Data = new Uint8Array(floatData.length);
    for (let i = 0; i < floatData.length; i++) {
      // clamp so we don't exceed 255 or go below 0
      const clampedVal = Math.max(0, Math.min(1, floatData[i]));
      u8Data[i] = Math.floor(clampedVal * 255);
    }
  
    // Now bind your texture (maskTexture), and do texImage2D:
    gl.bindTexture(gl.TEXTURE_2D, maskTexture);
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.ALPHA,    // internalFormat
      width,
      height,
      0,           // border
      gl.ALPHA,    // format
      gl.UNSIGNED_BYTE,
      u8Data
    );
  
    // Then call your draw code, update your video texture, etc.
    updateVideoTexture();
    drawComposite();
  }

/**
 * Initialize minimal WebGL resources: buffers, shaders, program, textures.
 */
function initWebGLResources() {
  // Create buffers for a full-screen quad
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
    0, 0,
    1, 0,
    0, 1,
    1, 1
  ]);
  gl.bufferData(gl.ARRAY_BUFFER, texCoords, gl.STATIC_DRAW);

  // Compile shaders
  const vertexSrc = `
    attribute vec2 a_position;
    attribute vec2 a_texCoord;
    varying vec2 v_texCoord;
    void main() {
      gl_Position = vec4(a_position, 0.0, 1.0);
      v_texCoord = a_texCoord;
    }
  `;
  const fragmentSrc = `
    precision mediump float;
    varying vec2 v_texCoord;
    uniform sampler2D u_video;
    uniform sampler2D u_background;
    uniform sampler2D u_mask;

    void main() {
      // video color
      vec4 videoColor = texture2D(u_video, v_texCoord);
      // background color
      vec4 bgColor = texture2D(u_background, v_texCoord);
      // mask is in the alpha channel
      float maskVal = texture2D(u_mask, v_texCoord).a;
      // Soft mix
      vec4 outColor = mix(bgColor, videoColor, maskVal);
      gl_FragColor = outColor;
    }
  `;

  const vs = createShader(gl, gl.VERTEX_SHADER, vertexSrc);
  const fs = createShader(gl, gl.FRAGMENT_SHADER, fragmentSrc);
  program = createProgram(gl, vs, fs);

  // Create textures
  videoTexture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, videoTexture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

  backgroundTexture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, backgroundTexture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

  maskTexture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, maskTexture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

  gl.bindTexture(gl.TEXTURE_2D, null);
}

/**
 * Load the chosen background image into the backgroundTexture once.
 */
function loadBackgroundImage(path) {
  backgroundImage = new Image();
  backgroundImage.src = path;
  backgroundImage.onload = function () {
    gl.bindTexture(gl.TEXTURE_2D, backgroundTexture);
    // Fill or crop if sizes differ
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      backgroundImage
    );
    backgroundLoaded = true;
  };
}

/**
 * Update the videoTexture by drawing from the hidden <video> that plays the original stream.
 */
function updateVideoTexture() {
  // get the hidden <video> that is playing
  const tempVideo = document.getElementById('hidden-video-for-webgl');
  if (!tempVideo || tempVideo.readyState < 2) return;

  gl.bindTexture(gl.TEXTURE_2D, videoTexture);
  gl.texImage2D(
    gl.TEXTURE_2D,
    0,
    gl.RGBA,
    gl.RGBA,
    gl.UNSIGNED_BYTE,
    tempVideo
  );
}

/**
 * The final draw step combining video + background + mask.
 */
function drawComposite() {
  gl.viewport(0, 0, offscreenCanvas.width, offscreenCanvas.height);
  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT);

  gl.useProgram(program);

  // Bind the quad positions
  const posLoc = gl.getAttribLocation(program, 'a_position');
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.enableVertexAttribArray(posLoc);
  gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

  // Bind the quad texcoords
  const texLoc = gl.getAttribLocation(program, 'a_texCoord');
  gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
  gl.enableVertexAttribArray(texLoc);
  gl.vertexAttribPointer(texLoc, 2, gl.FLOAT, false, 0, 0);

  // Set the texture units
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
 * Cleanup to free GPU resources (optional).
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
 * We create it once if it doesn't exist, so that we can feed frames into
 * the segmenter. (MediaPipe requires a <video> in "LIVE_STREAM" mode.)
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
