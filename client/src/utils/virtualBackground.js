// virtualBackground.js
import { FilesetResolver, ImageSegmenter } from '@mediapipe/tasks-vision';

let animationFrameId = null;
let imageSegmenter = null;
let gl = null;              // WebGL context
let backgroundTexture = null;
let videoTexture = null;
let maskTexture = null;
let program = null;
let positionBuffer = null;
let uResolutionLoc = null;

// Vertex/fragment shaders for background compositing
const VERTEX_SHADER_SOURCE = `
  attribute vec2 a_position;
  varying vec2 v_texCoord;

  void main() {
    // Map from [0..1] or [-1..1], depending on your approach
    v_texCoord = (a_position + 1.0) * 0.5;
    gl_Position = vec4(a_position, 0, 1);
  }
`;

const FRAGMENT_SHADER_SOURCE = `
  precision mediump float;
  varying vec2 v_texCoord;

  uniform sampler2D u_bgTex;     // background texture
  uniform sampler2D u_videoTex;  // video texture
  uniform sampler2D u_maskTex;   // segmentation mask

  void main() {
    vec4 bgColor = texture2D(u_bgTex, v_texCoord);
    vec4 videoColor = texture2D(u_videoTex, v_texCoord);

    // Single-channel mask in the RED channel
    float mask = texture2D(u_maskTex, v_texCoord).r; 

    // Simple lerp: mix background & video based on mask
    // mask ~ 1 => use video; mask ~ 0 => use background
    gl_FragColor = mix(bgColor, videoColor, mask);
  }
`;

export async function startSegmenting(videoElement, canvasElement) {
  try {
    // 1) Stop any existing loop so we don't double-run
    stopSegmenting();

    // 2) Initialize segmenter if not done
    if (!imageSegmenter) {
      console.log("Creating the segmenter for the first time...");
      const vision = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
      );
      imageSegmenter = await ImageSegmenter.createFromOptions(vision, {
        baseOptions: { modelAssetPath: '/model/selfie_segmenter_landscape.tflite' },
        runningMode: 'LIVE_STREAM',
        outputCategoryMask: false,
        outputConfidenceMasks: true,
      });
    } else {
      console.log("Segmenter already exists.");
    }

    // 3) Setup WebGL if not done
    if (!gl) {
      gl = canvasElement.getContext('webgl', { alpha: false });
      if (!gl) {
        console.error('WebGL not supported');
        return;
      }
      initWebGL(gl);
      await loadBackgroundTexture(gl, '/rit.jpg');
    }

    // 4) Start the segmentation loop
    segmentLoop(videoElement);
  } catch (error) {
    console.error('Error creating image segmenter:', error);
    return null;
  }
}

/**
 * The main segmentation loop, called each frame.
 */
function segmentLoop(videoElement) {
  async function processFrame() {
    // 1) Run Mediapipe segmentation
    await imageSegmenter.segmentForVideo(
      videoElement,
      performance.now(),
      handleSegmentationResult
    );

    animationFrameId = requestAnimationFrame(processFrame);
  }

  processFrame();
}

export function stopSegmenting() {
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
  }
}

/**
 * Called by segmentForVideo each frame with the segmentation result:
 * result.confidenceMasks[0] is a float array representing how likely each pixel is foreground.
 */
function handleSegmentationResult(result) {
  if (!gl) return;

  // 1) Upload the current video frame to a texture
  updateVideoTexture(gl, videoTexture);

  // 2) Upload the segmentation mask
  if (result.confidenceMasks && result.confidenceMasks.length > 0) {
    let maskData = result.confidenceMasks[0];
    updateMaskTexture(gl, maskTexture, maskData, result.width, result.height);
  }

  // 3) Draw the final composited frame
  drawComposite(gl);
}

/**
 * Initialize WebGL objects: compile shaders, link program, create buffers, create empty textures, etc.
 */
function initWebGL(gl) {
  // Create & compile shaders
  const vertShader = createShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER_SOURCE);
  const fragShader = createShader(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER_SOURCE);

  // Link program
  program = createProgram(gl, vertShader, fragShader);
  gl.useProgram(program);

  // Create a buffer with a full-screen quad
  positionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  const positions = new Float32Array([
    -1, -1,  // lower-left
     1, -1,  // lower-right
    -1,  1,  // upper-left
     1,  1,  // upper-right
  ]);
  gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);

  // Look up attribute location
  const positionLoc = gl.getAttribLocation(program, 'a_position');
  gl.enableVertexAttribArray(positionLoc);
  gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, 0, 0);

  // Create background/video/mask textures
  backgroundTexture = createTexture(gl);
  videoTexture = createTexture(gl);
  maskTexture = createTexture(gl, gl.RED);

  // In fragment shader: uniform sampler2D u_bgTex, u_videoTex, u_maskTex
  const bgTexLoc = gl.getUniformLocation(program, 'u_bgTex');
  const videoTexLoc = gl.getUniformLocation(program, 'u_videoTex');
  const maskTexLoc = gl.getUniformLocation(program, 'u_maskTex');

  // We bind them to texture units 0,1,2
  gl.uniform1i(bgTexLoc, 0);
  gl.uniform1i(videoTexLoc, 1);
  gl.uniform1i(maskTexLoc, 2);

  gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
  gl.clearColor(0,0,0,1);
}

/**
 * Load the background image into backgroundTexture
 */
async function loadBackgroundTexture(gl, url) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = '';  // if needed
    image.onload = () => {
      // Bind & upload to backgroundTexture (texture unit 0)
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, backgroundTexture);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA,
        gl.RGBA, gl.UNSIGNED_BYTE, image);
      gl.generateMipmap(gl.TEXTURE_2D);
      resolve();
    };
    image.onerror = reject;
    image.src = url;
  });
}

/**
 * Upload the current HTMLVideoElement frame to the videoTexture (texture unit 1)
 */
function updateVideoTexture(gl, tex) {
  if (!tex) return;
  gl.activeTexture(gl.TEXTURE1);
  gl.bindTexture(gl.TEXTURE_2D, tex);
  // We assume the video is playing
  // Note: If the video is not same size as the canvas, consider scaling
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA,
                gl.RGBA, gl.UNSIGNED_BYTE,
                document.querySelector('video[muted]')); 
  // or pass the actual <video> element reference
}

/**
 * Upload the float32 segmentation mask to maskTexture (texture unit 2)
 */
function updateMaskTexture(gl, tex, maskData, width, height) {
  if (!tex) return;
  gl.activeTexture(gl.TEXTURE2);
  gl.bindTexture(gl.TEXTURE_2D, tex);

  // maskData is a Float32Array
  // We upload it as RED channel (1 component)
  gl.texImage2D(
    gl.TEXTURE_2D, 
    0, 
    gl.R32F,          // internal format
    width, height, 
    0, 
    gl.RED,           // format
    gl.FLOAT,         // type
    maskData.canvas   // if MediaPipe uses OffscreenCanvas, or maskData.g[0]
                      // You might need to clarify how the raw float array is accessed
                      // Alternatively: maskData.data or maskData as typed array
  );
  // If above doesn't work directly, you can do
  // gl.texImage2D(gl.TEXTURE_2D, 0, gl.RED, width, height, 0, gl.RED, gl.FLOAT, maskData);

  // Set filtering to handle float textures
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
}

/**
 * Draw the composite of background + video + mask
 */
function drawComposite(gl) {
  gl.clear(gl.COLOR_BUFFER_BIT);
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
}

/**
 * Helper to create a texture with default parameters (RGBA by default).
 */
function createTexture(gl, internalFormat = gl.RGBA) {
  const tex = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

  // Allocate empty texture initially
  gl.texImage2D(gl.TEXTURE_2D, 0, internalFormat, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
  return tex;
}

/**
 * Create and compile a shader
 */
function createShader(gl, type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  const success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
  if (!success) {
    console.error(gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

/**
 * Link vertex & fragment shaders into a program
 */
function createProgram(gl, vertShader, fragShader) {
  const prog = gl.createProgram();
  gl.attachShader(prog, vertShader);
  gl.attachShader(prog, fragShader);
  gl.linkProgram(prog);

  const success = gl.getProgramParameter(prog, gl.LINK_STATUS);
  if (!success) {
    console.error(gl.getProgramInfoLog(prog));
    gl.deleteProgram(prog);
    return null;
  }
  return prog;
}
