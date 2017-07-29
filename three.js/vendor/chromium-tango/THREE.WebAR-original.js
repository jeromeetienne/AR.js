/*
 * Copyright 2017 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
* @namespace
*/
var THREE = THREE || require("three");

/**
* The WebAR namespace inside the THREE namespace. This namespace includes different utilities to be able to handle WebAR functionalities on top of the ThreeJS framework/engine in an easier way.
* 
* NOTE: As a coding standard all the variables/functions starting with an underscore '_' are considered as private and should not be used/called outside of the namespace/class they are defined in.
* @namespace
*/
THREE.WebAR = {};

THREE.WebAR.MAX_FLOAT32_VALUE = 3.4028e38;

/**
* A class that allows to manage the point cloud acquisition and representation in ThreeJS. A buffer geometry is generated to represent the point cloud. The point cloud is provided using a VRDisplay instance that shows the capability to do so. The point cloud is actually exposed using a TypedArray. The array includes 3 values per point in the cloud. There are 2 ways of exposing this array:
* 1.- Using a new TypedArray for every frame/update. The advantage is that the TypedArray is always of the correct size depending on the number of points detected. The disadvantage is that there is a performance hit from the creation and copying of the array (and future garbage collection).
* 2.- Using the same reference to a single TypedArray. The advantage is that the performance is as good as it can get with no creation/destruction and copy penalties. The disadvantage is that the size of the array is the biggest possible point cloud provided by the underlying hardware. The non used values are filled with THREE.WebAR.MAX_FLOAT32_VALUE.
* @constructor
* @param {window.VRDisplay} vrDisplay The reference to the VRDisplay instance that is capable of providing the point cloud.
*
* NOTE: The buffer geometry that can be retrieved from instances of this class can be used along with THREE.Point and THREE.PointMaterial to render the point cloud using points. This class represents the vertices colors with the color white.
*/
THREE.WebAR.VRPointCloud = function(vrDisplay) {

  this._vrDisplay = vrDisplay;

  this._numberOfPointsInLastPointCloud = 0;

  this._bufferGeometry = new THREE.BufferGeometry();
  this._bufferGeometry.frustumCulled = false;

  var positions = null;
  if (vrDisplay) {
    this._pointCloud = new VRPointCloud();
    vrDisplay.getPointCloud(this._pointCloud, false, 0, false);
    positions = this._pointCloud.points;
  }
  else {
    positions = new Float32Array(
      [-1, 1, -2, 1, 1, -2, 1, -1, -2, -1, -1, -2 ]);
  }
  var colors = new Float32Array( positions.length );

  var color = new THREE.Color();

  for ( var i = 0; i < colors.length; i += 3 ) {
    if (vrDisplay) {
      positions[ i ]     = THREE.WebAR.MAX_FLOAT32_VALUE;
      positions[ i + 1 ] = THREE.WebAR.MAX_FLOAT32_VALUE;
      positions[ i + 2 ] = THREE.WebAR.MAX_FLOAT32_VALUE;
    }
    color.setRGB( 1, 1, 1 );
    colors[ i ]     = color.r;
    colors[ i + 1 ] = color.g;
    colors[ i + 2 ] = color.b;
  }

  this._positions = new THREE.BufferAttribute( positions, 3 );
  this._bufferGeometry.addAttribute( 'position', this._positions );
  this._colors = new THREE.BufferAttribute( colors, 3 );
  this._bufferGeometry.addAttribute( 'color', this._colors );

  this._bufferGeometry.computeBoundingSphere();

  return this;
};

/**
* Returns the THREE.BufferGeometry instance that represents the points in the pont cloud.
* @return {THREE.BufferGeometry} The buffer geometry that represents the points in the point cloud.
*
* NOTE: A possible way to render the point cloud could be to use the THREE.BufferGeometry instance returned by this method along with THREE.Points and THREE.PointMaterial.

  var pointCloud = new THREE.VRPointCloud(vrDisplay, true);
  var material = new THREE.PointsMaterial( { size: 0.01, vertexColors: THREE.VertexColors } );
  var points = new THREE.Points( pointCloud.getBufferGeometry(), material );
*/
THREE.WebAR.VRPointCloud.prototype.getBufferGeometry = function() {
  return this._bufferGeometry;
};

/**
* Update the point cloud. The THREE.BufferGeometry that this class provides will automatically be updated with the point cloud retrieved by the underlying hardware.
* @param {boolean} updateBufferGeometry A flag to indicate if the underlying THREE.BufferGeometry should also be updated. Updating the THREE.BufferGeometry is very cost innefficient so it is better to only do it if necessary (only if the buffer geometry is going to be rendered for example). If this flag is set to false,  then the underlying point cloud is updated but not buffer geometry that represents it. Updating the point cloud is important to be able to call functions that operate with it, like the getPickingPointAndPlaneInPointCloud function.
* @param {number} pointsToSkip A positive integer from 0-N that specifies the number of points to skip when returning the point cloud. If the updateBufferGeometry flag is activated (true) then this parameter allows to specify the density of the point cloud. A values of 0 means all the detected points need to be returned. A number of 1 means that 1 every other point needs to be skipped and thus, half of the detected points will be retrieved, and so on. If the parameter is not specified, 0 is considered.
* @param {boolean} transformPoints A flag to specify if the points should be transformed in the native side or not. If the points are not transformed in the native side, they should be transformed in the JS side (in a vertex shader for example).
*/
THREE.WebAR.VRPointCloud.prototype.update = function(updateBufferGeometry, pointsToSkip, transformPoints) {
  if (!this._vrDisplay) return;
  this._vrDisplay.getPointCloud(this._pointCloud, 
    !updateBufferGeometry, typeof(pointsToSkip) === "number" ? 
      pointsToSkip : 0, !!transformPoints);
  if (!updateBufferGeometry) return;
  if (this._pointCloud.numberOfPoints > 0) {
    this._positions.needsUpdate = true;
  }
};

/**
* Provides an index based on an orientation angle. The corresponding index to the angle is:
* orientation =   0 <-> index = 0
* orientation =  90 <-> index = 1
* orientation = 180 <-> index = 2
* orientation = 270 <-> index = 3
* @param {number} orientation The orientation angle. Values are: 0, 90, 180, 270.
* @return {number} An index from 0 to 3 that corresponds to the give orientation angle.
*/
THREE.WebAR.getIndexFromOrientation = function(orientation) {
  var index = 0;
  switch (orientation) {
    case 90:
      index = 1;
      break;
    case 180:
      index = 2;
      break;
    case 270:
      index = 3;
      break;
    default:
      index = 0;
      break;
  }
  return index;
};

/**
* Returns an index that is based on the combination between the display orientation and the see through camera orientation. This index will always be device natural orientation independent.
* @param {VRDisplay} vrDisplay The VRDisplay that is capable to provide a correct VRSeeThroughCamera instance.
* @return {number} The index from 0 to 3 that represents the combination of the device and see through camera orientations.
*/
THREE.WebAR.getIndexFromScreenAndSeeThroughCameraOrientations = function(vrDisplay) {
  var screenOrientation = screen.orientation.angle;
  var seeThroughCamera = vrDisplay ? vrDisplay.getSeeThroughCamera() : null;
  var seeThroughCameraOrientation = seeThroughCamera ? 
    seeThroughCamera.orientation : 0;
  var seeThroughCameraOrientationIndex = 
    THREE.WebAR.getIndexFromOrientation(seeThroughCameraOrientation);
  var screenOrientationIndex = 
    THREE.WebAR.getIndexFromOrientation(screenOrientation);
  ret = screenOrientationIndex - seeThroughCameraOrientationIndex;
  if (ret < 0) {
    ret += 4;
  }
  return (ret % 4);
}

/**
* A utility function that helps create a THREE.Mesh instance to be able to show the VRSeeThroughCamera as a background quad with the correct texture coordinates and a THREE.VideoTexture instance.
* @param {VRDisplay} vrDisplay The VRDisplay that is capable to provide a correct VRSeeThroughCamera instance. It can be null/undefined.
* @param {string} fallbackVideoPath The path to a video in case there is no vrDisplay. If this parameter is not provided, a default video at path "../resources/sintel.webm" will be used.
* @return {THREE.Mesh} The THREE.Mesh instance that represents a quad to be able to present the see through camera.
*/
THREE.WebAR.createVRSeeThroughCameraMesh = function(vrDisplay,
  fallbackVideoPath) {
  var video;
  var geometry = new THREE.BufferGeometry();

  // The camera or video and the texture coordinates may vary depending if the vrDisplay has the see through camera.
  if (vrDisplay) {
    var seeThroughCamera = vrDisplay.getSeeThroughCamera();

    if (!seeThroughCamera) 
      throw "ERROR: Could not get the see through camera!";
    
    video = seeThroughCamera;
    // HACK: Needed to tell the THREE.VideoTexture that the video is ready and
    // that the texture needs update.
    video.readyState = 2;
    video.HAVE_CURRENT_DATA = 2;

    // All the possible texture coordinates for the 4 possible orientations.
    // The ratio between the texture size and the camera size is used in order
    // to be compatible with the YUV to RGB conversion option (not recommended
    // but still available).
    var u = seeThroughCamera.width / seeThroughCamera.textureWidth;
    var v = seeThroughCamera.height / seeThroughCamera.textureHeight;
    geometry.WebAR_textureCoords = [
      new Float32Array([ 
        0.0, 0.0,
        0.0, v,
        u, 0.0,
        u, v
      ]),
      new Float32Array([ 
        u, 0.0,
        0.0, 0.0,
        u, v,
        0.0, v
      ]),
      new Float32Array([
        u, v,
        u, 0.0,
        0.0, v,
        0.0, 0.0
      ]),
      new Float32Array([
        0.0, v,
        u, v,
        0.0, 0.0,
        u, 0.0
      ])
    ];
  }
  else {
    var video = document.createElement("video");
    video.src = typeof(fallbackVideoPath) === "string" ? 
      fallbackVideoPath : "../../resources/videos/sintel.webm";
    video.play();

    // All the possible texture coordinates for the 4 possible orientations.
    geometry.WebAR_textureCoords = [
      new Float32Array([0.0, 0.0, 0.0, 1.0, 1.0, 0.0, 1.0, 1.0]),
      new Float32Array([1.0, 0.0, 0.0, 0.0, 1.0, 1.0, 0.0, 1.0]),
      new Float32Array([1.0, 1.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0]),
      new Float32Array([0.0, 1.0, 1.0, 1.0, 0.0, 0.0, 1.0, 0.0])
    ];
  }

  geometry.addAttribute("position", new THREE.BufferAttribute( 
    new Float32Array([
    -1.0,  1.0, 0.0, 
    -1.0, -1.0, 0.0,
     1.0,  1.0, 0.0, 
     1.0, -1.0, 0.0
  ]), 3));

  geometry.setIndex(new THREE.BufferAttribute(
    new Uint16Array([0, 1, 2, 2, 1, 3]), 1));
  geometry.WebAR_textureCoordIndex = 
    THREE.WebAR.getIndexFromScreenAndSeeThroughCameraOrientations(vrDisplay);
  var textureCoords = 
    geometry.WebAR_textureCoords[geometry.WebAR_textureCoordIndex];

  geometry.addAttribute("uv", new THREE.BufferAttribute(
    new Float32Array(textureCoords), 2 ));
  geometry.computeBoundingSphere();

  var videoTexture = new THREE.VideoTexture(video);
  videoTexture.minFilter = THREE.NearestFilter;
  videoTexture.magFilter = THREE.NearestFilter;
  videoTexture.format = THREE.RGBFormat;
  videoTexture.flipY = false;

  // The material is different if the see through camera is provided inside the vrDisplay or not.
  var material;
  if (vrDisplay) {
    var vertexShaderSource = [
      'attribute vec3 position;',
      'attribute vec2 uv;',
      '',
      'uniform mat4 modelViewMatrix;',
      'uniform mat4 projectionMatrix;',
      '',
      'varying vec2 vUV;',
      '',
      'void main(void) {',
      '    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);',
      '    vUV = uv;',
      '}'
    ];

    var fragmentShaderSource = [
      '#extension GL_OES_EGL_image_external : require',
      'precision mediump float;',
      '',
      'varying vec2 vUV;',
      '',
      'uniform samplerExternalOES map;',
      '',
      'void main(void) {',
      '   gl_FragColor = texture2D(map, vUV);',
      '}'
    ];

    material = new THREE.RawShaderMaterial({
      uniforms: {
        map: {type: 't', value: videoTexture},
      },
      vertexShader: vertexShaderSource.join( '\r\n' ),
      fragmentShader: fragmentShaderSource.join( '\r\n' ),
      side: THREE.DoubleSide,
    });
  }
  else {
    material = new THREE.MeshBasicMaterial( 
      {color: 0xFFFFFF, side: THREE.DoubleSide, map: videoTexture } );
  }

  var mesh = new THREE.Mesh(geometry, material);

  return mesh;
};

/**
* Updates the camera mesh texture coordinates depending on the orientation of the current screen and the see through camera.
* @param {VRDisplay} vrDisplay The VRDisplay that holds the VRSeeThroughCamera. If could be null/undefined.
* @param {THREE.Mesh} cameraMesh The ThreeJS mesh that represents the camera quad that needs to be updated/rotated depending on the device and camera orientations. This instance should have been created by calling THREE.WebAR.createVRSeeThroughCameraMesh.
*/
THREE.WebAR.updateCameraMeshOrientation = function(vrDisplay, cameraMesh) {
  var textureCoordIndex = THREE.WebAR.getIndexFromScreenAndSeeThroughCameraOrientations(vrDisplay);
  if (textureCoordIndex != cameraMesh.geometry.WebAR_textureCoordIndex) {
    var uvs = cameraMesh.geometry.getAttribute("uv");
    var textureCoords = 
      cameraMesh.geometry.WebAR_textureCoords[textureCoordIndex];
    cameraMesh.geometry.WebAR_textureCoordIndex = textureCoordIndex;
    for (var i = 0; i < uvs.length; i++) {
      uvs.array[i] = textureCoords[i];
    }
    uvs.needsUpdate = true;
  }
};

/**
* A utility function to create a THREE.Camera instance with as frustum that is obtainer from the underlying vrdisplay see through camera information. This camera can be used to correctly render 3D objects on top of the underlying camera image.
* @param {VRDisplay} vrDisplay - The VRDisplay that is capable to provide a correct VRSeeThroughCamera instance in order to obtain the camera lens information and create the correct projection matrix/frustum. It could be null/undefined.
* @param {number} near The near plane value to be used to create the correct projection matrix frustum.
* @param {number} far The far plane value to be used to create the correct projection matrix frustum.
* @return {THREE.Camera} A camera instance to be used to correctly render a scene on top of the camera video feed.
*/
THREE.WebAR.createVRSeeThroughCamera = function(vrDisplay, near, far) {
  var camera = new THREE.PerspectiveCamera( 60, 
    window.innerWidth / window.innerHeight, near, far );
  if (vrDisplay) {
    THREE.WebAR.resizeVRSeeThroughCamera(vrDisplay, camera);
  }
  return camera;
};

/**
* Recalculate a camera projection matrix depending on the current device and see through camera orientation and specification.
* @param {VRDisplay} vrDisplay The VRDisplay that handles the see through camera.
* @param {THREE.Camera} camera The ThreeJS camera instance to update its projection matrix depending on the current device orientation and see through camera properties.
*/
THREE.WebAR.resizeVRSeeThroughCamera = function(vrDisplay, camera) {
  camera.aspect = window.innerWidth / window.innerHeight;
  if (vrDisplay) {
    var windowWidthBiggerThanHeight = window.innerWidth > window.innerHeight;
    var seeThroughCamera = vrDisplay.getSeeThroughCamera();
    if (seeThroughCamera) {
      var cameraWidthBiggerThanHeight = 
        seeThroughCamera.width > seeThroughCamera.height;
      var swapWidthAndHeight = 
        !(windowWidthBiggerThanHeight && cameraWidthBiggerThanHeight);

      var width = swapWidthAndHeight ? 
        seeThroughCamera.height : seeThroughCamera.width;
      var height = swapWidthAndHeight ? 
        seeThroughCamera.width : seeThroughCamera.height;
      var fx = swapWidthAndHeight ? 
        seeThroughCamera.focalLengthY : seeThroughCamera.focalLengthX;
      var fy = swapWidthAndHeight ? 
        seeThroughCamera.focalLengthX : seeThroughCamera.focalLengthY;
      var cx = swapWidthAndHeight ? 
        seeThroughCamera.pointY : seeThroughCamera.pointX;
      var cy = swapWidthAndHeight ? 
        seeThroughCamera.pointX : seeThroughCamera.pointY;

      var xscale = camera.near / fx;
      var yscale = camera.near / fy;

      var xoffset = (cx - (width / 2.0)) * xscale;
      // Color camera's coordinates has Y pointing downwards so we negate this term.
      var yoffset = -(cy - (height / 2.0)) * yscale;

      var left = xscale * -width / 2.0 - xoffset;
      var right = xscale * width / 2.0 - xoffset;
      var bottom = yscale * -height / 2.0 - yoffset;
      var top = yscale * height / 2.0 - yoffset;

      camera.projectionMatrix.makeFrustum(
        left, right, bottom, top, camera.near, camera.far);

      // Recalculate the fov as threejs is not doing it.
      camera.fov = THREE.Math.radToDeg(
        Math.atan((top * camera.zoom) / camera.near)) * 2.0;
    }
  }
  else {
    camera.updateProjectionMatrix();
  }
}

// Some precalculated private objects to avoid garbage collection
THREE.WebAR._worldUp = new THREE.Vector3(0.0, 1.0, 0.0);
THREE.WebAR._normalY = new THREE.Vector3();
THREE.WebAR._normalZ = new THREE.Vector3();
THREE.WebAR._rotationMatrix = new THREE.Matrix4();
THREE.WebAR._planeNormal = new THREE.Vector3();

THREE.WebAR.rotateObject3D = function(normal1, normal2, object3d) {
  if (normal1 instanceof THREE.Vector3 || normal1 instanceof THREE.Vector4) {
    THREE.WebAR._planeNormal.set(normal1.x, normal1.y, normal1.z);
  }
  else if (normal1 instanceof Float32Array) {
    THREE.WebAR._planeNormal.set(normal1[0], normal1[1], normal1[2]);
  }
  else {
    throw "Unknown normal1 type.";
  }
  if (normal2 instanceof THREE.Vector3 || normal2 instanceof THREE.Vector4) {
    THREE.WebAR._normalZ.set(normal2.x, normal2.y, normal2.z);
  }
  else if (normal1 instanceof Float32Array) {
    THREE.WebAR._normalZ.set(normal2[0], normal2[1], normal2[2]);
  }
  else {
    throw "Unknown normal2 type.";
  }
  THREE.WebAR._normalY.crossVectors(THREE.WebAR._planeNormal, 
    THREE.WebAR._normalZ).normalize();
  THREE.WebAR._rotationMatrix.elements[ 0] = THREE.WebAR._planeNormal.x;
  THREE.WebAR._rotationMatrix.elements[ 1] = THREE.WebAR._planeNormal.y;
  THREE.WebAR._rotationMatrix.elements[ 2] = THREE.WebAR._planeNormal.z;
  THREE.WebAR._rotationMatrix.elements[ 4] = THREE.WebAR._normalZ.x;
  THREE.WebAR._rotationMatrix.elements[ 5] = THREE.WebAR._normalZ.y;
  THREE.WebAR._rotationMatrix.elements[ 6] = THREE.WebAR._normalZ.z;
  THREE.WebAR._rotationMatrix.elements[ 8] = THREE.WebAR._normalY.x;
  THREE.WebAR._rotationMatrix.elements[ 9] = THREE.WebAR._normalY.y;
  THREE.WebAR._rotationMatrix.elements[10] = THREE.WebAR._normalY.z;
  object3d.quaternion.setFromRotationMatrix(THREE.WebAR._rotationMatrix);
};

/**
* Transform a given THREE.Object3D instance to be correctly oriented according to a given plane normal.
* @param {THREE.Vector3|THREE.Vector4|Float32Array} plane A vector that represents the normal of the plane to be used to orient the object3d.
* @param {THREE.Object3D} object3d The object3d to be transformed so it is oriented according to the given plane.
*/
THREE.WebAR.rotateObject3DWithPickingPlane = function(plane, object3d) {
  if (plane instanceof THREE.Vector3 || plane instanceof THREE.Vector4) {
    THREE.WebAR._planeNormal.set(plane.x, plane.y, plane.z);
  }
  else if (plane instanceof Float32Array) {
    THREE.WebAR._planeNormal.set(plane[0], plane[1], plane[2]);
  }
  else {
    throw "Unknown plane type.";
  }
  THREE.WebAR._normalY.set(0.0, 1.0, 0.0);
  var threshold = 0.5;
  if (Math.abs(THREE.WebAR._planeNormal.dot(THREE.WebAR._worldUp)) > 
    threshold) {
    THREE.WebAR._normalY.set(0.0, 0.0, 1.0);
  }
  THREE.WebAR._normalZ.crossVectors(THREE.WebAR._planeNormal, 
    THREE.WebAR._normalY).normalize();
  THREE.WebAR._normalY.crossVectors(THREE.WebAR._normalZ, 
    THREE.WebAR._planeNormal).normalize();
  THREE.WebAR._rotationMatrix.elements[ 0] = THREE.WebAR._planeNormal.x;
  THREE.WebAR._rotationMatrix.elements[ 1] = THREE.WebAR._planeNormal.y;
  THREE.WebAR._rotationMatrix.elements[ 2] = THREE.WebAR._planeNormal.z;
  THREE.WebAR._rotationMatrix.elements[ 4] = THREE.WebAR._normalY.x;
  THREE.WebAR._rotationMatrix.elements[ 5] = THREE.WebAR._normalY.y;
  THREE.WebAR._rotationMatrix.elements[ 6] = THREE.WebAR._normalY.z;
  THREE.WebAR._rotationMatrix.elements[ 8] = THREE.WebAR._normalZ.x;
  THREE.WebAR._rotationMatrix.elements[ 9] = THREE.WebAR._normalZ.y;
  THREE.WebAR._rotationMatrix.elements[10] = THREE.WebAR._normalZ.z;
  object3d.quaternion.setFromRotationMatrix(THREE.WebAR._rotationMatrix);
};

/**
* Transform a given THREE.Object3D instance to be correctly positioned according to a given point position.
* @param {THREE.Vector3|THREE.Vector4|Float32Array} point A vector that represents the position where the object3d should be positioned.
* @param {THREE.Object3D} object3d The object3d to be transformed so it is positioned according to the given point.
*/
THREE.WebAR.positionObject3DWithPickingPoint = function(point, object3d) {
  if (point instanceof THREE.Vector3 || point instanceof THREE.Vector4) {
    object3d.position.set(point.x, point.y, point.z);
  }
  else if (point instanceof Float32Array) {
    object3d.position.set(point[0], point[1], point[2]);
  }
  else {
    throw "Unknown point type.";
  }
};

/**
* Transform a given THREE.Object3D instance to be correctly positioned and oriented according to a given VRPickingPointAndPlane and a scale (half the size of the object3d for example).
* @param {VRPickingPointandPlane} pointAndPlane The point and plane retrieved using the VRDisplay.getPickingPointAndPlaneInPointCloud function.
* @param {THREE.Object3D} object3d The object3d to be transformed so it is positioned and oriented according to the given point and plane.
* @param {number} scale The value the object3d will be positioned in the direction of the normal of the plane to be correctly positioned. Objects usually have their position value referenced as the center of the geometry. In this case, positioning the object in the picking point would lead to have the object3d positioned in the plane, not on top of it. this scale value will allow to correctly position the object in the picking point and in the direction of the normal of the plane. Half the size of the object3d would be a correct value in this case.
*/
THREE.WebAR.positionAndRotateObject3DWithPickingPointAndPlaneInPointCloud = 
  function(pointAndPlane, object3d, scale) {
  THREE.WebAR.rotateObject3DWithPickingPlane(pointAndPlane.plane, object3d);
  THREE.WebAR.positionObject3DWithPickingPoint(pointAndPlane.point, object3d);
  object3d.position.add(THREE.WebAR._planeNormal.multiplyScalar(scale));
};

/**
* Transform a given THREE.Object3D instance to be correctly positioned and oriented according to an axis formed by 2 plane normals, a position and a scale (half the size of the object3d for example).
* @param {VRPickingPointandPlane} pointAndPlane The point and plane retrieved using the VRDisplay.getPickingPointAndPlaneInPointCloud function.
* @param {THREE.Object3D} object3d The object3d to be transformed so it is positioned and oriented according to the given point and plane.
* @param {number} scale The value the object3d will be positioned in the direction of the normal of the plane to be correctly positioned. Objects usually have their position value referenced as the center of the geometry. In this case, positioning the object in the picking point would lead to have the object3d positioned in the plane, not on top of it. this scale value will allow to correctly position the object in the picking point and in the direction of the normal of the plane. Half the size of the object3d would be a correct value in this case.
*/
THREE.WebAR.positionAndRotateObject3D = 
  function(position, normal1, normal2, object3d, scale) {
  THREE.WebAR.rotateObject3D(normal1, normal2, object3d);
  THREE.WebAR.positionObject3DWithPickingPoint(position, object3d);
  object3d.position.add(THREE.WebAR._planeNormal.multiplyScalar(scale));
};

// UMD
(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define(['WebAR'], factory);
  } else if (typeof exports === 'object') {
    module.exports = factory();
  } else {
    root.WebAR = factory();
  }
}(this, function() {
    return THREE.WebAR;
}));
