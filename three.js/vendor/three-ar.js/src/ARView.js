/*
 * Copyright 2017 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the 'License');
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an 'AS IS' BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { isARKit } from './ARUtils';
import vertexSource from './shaders/arview.vert';
import fragmentSource from './shaders/arview.frag';
import preserveGLState from 'gl-preserve-state';

/**
 * Creates and load a shader from a string, type specifies either 'vertex' or 'fragment'
 *
 * @param {WebGLRenderingContext} gl
 * @param {string} str
 * @param {string} type
 * @return {!WebGLShader}
 */
function getShader(gl, str, type) {
  let shader;
  if (type == 'fragment') {
    shader = gl.createShader(gl.FRAGMENT_SHADER);
  } else if (type == 'vertex') {
    shader = gl.createShader(gl.VERTEX_SHADER);
  } else {
    return null;
  }

  gl.shaderSource(shader, str);
  gl.compileShader(shader);

  const result = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
  if (!result) {
    alert(gl.getShaderInfoLog(shader));
    return null;
  }

  return shader;
}

/**
 * Creates a shader program from vertex and fragment shader sources
 *
 * @param {WebGLRenderingContext} gl
 * @param {string} vs
 * @param {string} fs
 * @return {!WebGLProgram}
 */
function getProgram(gl, vs, fs) {
  const vertexShader = getShader(gl, vs, 'vertex');
  const fragmentShader = getShader(gl, fs, 'fragment');
  if (!fragmentShader) {
    return null;
  }

  const shaderProgram = gl.createProgram();
  gl.attachShader(shaderProgram, vertexShader);
  gl.attachShader(shaderProgram, fragmentShader);
  gl.linkProgram(shaderProgram);

  const result = gl.getProgramParameter(shaderProgram, gl.LINK_STATUS);
  if (!result) {
    alert('Could not initialise arview shaders');
  }

  return shaderProgram;
}

/**
 * Calculate the correct orientation depending on the device and the camera
 * orientations.
 *
 * @param {number} screenOrientation
 * @param {number} seeThroughCameraOrientation
 * @return {number}
 */
function combineOrientations(screenOrientation, seeThroughCameraOrientation) {
  let seeThroughCameraOrientationIndex = 0;
  switch (seeThroughCameraOrientation) {
    case 90:
      seeThroughCameraOrientationIndex = 1;
      break;
    case 180:
      seeThroughCameraOrientationIndex = 2;
      break;
    case 270:
      seeThroughCameraOrientationIndex = 3;
      break;
    default:
      seeThroughCameraOrientationIndex = 0;
      break;
  }
  let screenOrientationIndex = 0;
  switch (screenOrientation) {
    case 90:
      screenOrientationIndex = 1;
      break;
    case 180:
      screenOrientationIndex = 2;
      break;
    case 270:
      screenOrientationIndex = 3;
      break;
    default:
      screenOrientationIndex = 0;
      break;
  }
  let ret = screenOrientationIndex - seeThroughCameraOrientationIndex;
  if (ret < 0) {
    ret += 4;
  }
  return ret % 4;
}

/**
 * Renders the ar camera's video texture
 */
class ARVideoRenderer {
  /**
   * @param {VRDisplay} vrDisplay
   * @param {WebGLRenderingContext} gl
   */
  constructor(vrDisplay, gl) {
    this.vrDisplay = vrDisplay;
    this.gl = gl;
    if (this.vrDisplay) {
      this.passThroughCamera = vrDisplay.getPassThroughCamera();
      this.program = getProgram(gl, vertexSource, fragmentSource);
    }

    gl.useProgram(this.program);

    // Setup a quad
    this.vertexPositionAttribute = gl.getAttribLocation(
      this.program,
      'aVertexPosition'
    );
    this.textureCoordAttribute = gl.getAttribLocation(
      this.program,
      'aTextureCoord'
    );

    this.samplerUniform = gl.getUniformLocation(this.program, 'uSampler');

    this.vertexPositionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexPositionBuffer);
    let vertices = [
      -1.0,
      1.0,
      0.0,
      -1.0,
      -1.0,
      0.0,
      1.0,
      1.0,
      0.0,
      1.0,
      -1.0,
      0.0,
    ];
    let f32Vertices = new Float32Array(vertices);
    gl.bufferData(gl.ARRAY_BUFFER, f32Vertices, gl.STATIC_DRAW);
    this.vertexPositionBuffer.itemSize = 3;
    this.vertexPositionBuffer.numItems = 12;

    this.textureCoordBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.textureCoordBuffer);
    // Precalculate different texture UV coordinates depending on the possible
    // orientations of the device depending if there is a VRDisplay or not
    let textureCoords = null;
    if (this.vrDisplay) {
      let u =
        this.passThroughCamera.width / this.passThroughCamera.textureWidth;
      let v =
        this.passThroughCamera.height / this.passThroughCamera.textureHeight;
      textureCoords = [
        [0.0, 0.0, 0.0, v, u, 0.0, u, v],
        [u, 0.0, 0.0, 0.0, u, v, 0.0, v],
        [u, v, u, 0.0, 0.0, v, 0.0, 0.0],
        [0.0, v, u, v, 0.0, 0.0, u, 0.0],
      ];
    } else {
      textureCoords = [
        [0.0, 0.0, 0.0, 1.0, 1.0, 0.0, 1.0, 1.0],
        [1.0, 0.0, 0.0, 0.0, 1.0, 1.0, 0.0, 1.0],
        [1.0, 1.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0],
        [0.0, 1.0, 1.0, 1.0, 0.0, 0.0, 1.0, 0.0],
      ];
    }

    this.f32TextureCoords = [];
    for (let i = 0; i < textureCoords.length; i++) {
      this.f32TextureCoords.push(new Float32Array(textureCoords[i]));
    }
    // Store the current combined orientation to check if it has changed
    // during the update calls and use the correct texture coordinates.
    this.combinedOrientation = combineOrientations(
      screen.orientation.angle,
      this.passThroughCamera.orientation
    );

    gl.bufferData(
      gl.ARRAY_BUFFER,
      this.f32TextureCoords[this.combinedOrientation],
      gl.STATIC_DRAW
    );
    this.textureCoordBuffer.itemSize = 2;
    this.textureCoordBuffer.numItems = 8;
    gl.bindBuffer(gl.ARRAY_BUFFER, null);

    this.indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
    let indices = [0, 1, 2, 2, 1, 3];
    let ui16Indices = new Uint16Array(indices);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, ui16Indices, gl.STATIC_DRAW);
    this.indexBuffer.itemSize = 1;
    this.indexBuffer.numItems = 6;
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);

    this.texture = gl.createTexture();
    gl.useProgram(null);

    // The projection matrix will be based on an identify orthographic camera
    this.projectionMatrix = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
    this.mvMatrix = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
    return this;
  }

  /**
   * Renders the quad
   */
  render() {
    let gl = this.gl;
    const bindings = [
      gl.ARRAY_BUFFER_BINDING,
      gl.ELEMENT_ARRAY_BUFFER_BINDING,
      gl.CURRENT_PROGRAM,
    ];

    preserveGLState(gl, bindings, () => {
      gl.useProgram(this.program);
      gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexPositionBuffer);
      gl.enableVertexAttribArray(this.vertexPositionAttribute);
      gl.vertexAttribPointer(
        this.vertexPositionAttribute,
        this.vertexPositionBuffer.itemSize,
        gl.FLOAT,
        false,
        0,
        0
      );

      gl.bindBuffer(gl.ARRAY_BUFFER, this.textureCoordBuffer);

      // Check the current orientation of the device combined with the
      // orientation of the VRSeeThroughCamera to determine the correct UV
      // coordinates to be used.
      let combinedOrientation = combineOrientations(
        screen.orientation.angle,
        this.passThroughCamera.orientation
      );
      if (combinedOrientation !== this.combinedOrientation) {
        this.combinedOrientation = combinedOrientation;
        gl.bufferData(
          gl.ARRAY_BUFFER,
          this.f32TextureCoords[this.combinedOrientation],
          gl.STATIC_DRAW
        );
      }
      gl.enableVertexAttribArray(this.textureCoordAttribute);
      gl.vertexAttribPointer(
        this.textureCoordAttribute,
        this.textureCoordBuffer.itemSize,
        gl.FLOAT,
        false,
        0,
        0
      );

      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_EXTERNAL_OES, this.texture);
      // Update the content of the texture in every frame.
      gl.texImage2D(
        gl.TEXTURE_EXTERNAL_OES,
        0,
        gl.RGB,
        gl.RGB,
        gl.UNSIGNED_BYTE,
        this.passThroughCamera
      );
      gl.uniform1i(this.samplerUniform, 0);

      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);

      gl.drawElements(
        gl.TRIANGLES,
        this.indexBuffer.numItems,
        gl.UNSIGNED_SHORT,
        0
      );
    });
  }
}

/**
 * A helper class that takes a VRDisplay with AR capabilities
 * and renders the see through camera to the passed in WebGLRenderer's
 * context.
 */
class ARView {
  /**
   * @param {VRDisplay} vrDisplay
   * @param {THREE.WebGLRenderer} renderer
   */
  constructor(vrDisplay, renderer) {
    this.vrDisplay = vrDisplay;
    if (isARKit(this.vrDisplay)) {
      return;
    }
    this.renderer = renderer;
    this.gl = renderer.context;

    this.videoRenderer = new ARVideoRenderer(vrDisplay, this.gl);

    // Cache the width/height so we're not potentially forcing
    // a reflow if there's been a style invalidation
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    window.addEventListener('resize', this.onWindowResize.bind(this), false);
  }

  /**
   * Updates the stored width/height of window on resize.
   */
  onWindowResize() {
    this.width = window.innerWidth;
    this.height = window.innerHeight;
  }

  /**
   * Renders the see through camera to the passed in renderer
   */
  render() {
    if (isARKit(this.vrDisplay)) {
      return;
    }

    let gl = this.gl;
    let dpr = window.devicePixelRatio;
    let width = this.width * dpr;
    let height = this.height * dpr;

    if (gl.viewportWidth !== width) {
      gl.viewportWidth = width;
    }

    if (gl.viewportHeight !== height) {
      gl.viewportHeight = height;
    }

    this.gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
    this.videoRenderer.render();
  }
}

export default ARView;
