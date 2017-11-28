/**
 * @license
 * three.ar.js
 * Copyright (c) 2017 Google
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * @license
 * gl-preserve-state
 * Copyright (c) 2016, Brandon Jones.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('three')) :
	typeof define === 'function' && define.amd ? define(['exports', 'three'], factory) :
	(factory((global['three-ar'] = {}),global.THREE));
}(this, (function (exports,three) { 'use strict';

var global$1 = typeof global !== "undefined" ? global :
            typeof self !== "undefined" ? self :
            typeof window !== "undefined" ? window : {};

var noop = function noop() {};
var opacityRemap = function opacityRemap(mat) {
  if (mat.opacity === 0) {
    mat.opacity = 1;
  }
};
var loadObj = function loadObj(objPath, materialCreator, OBJLoader) {
  return new Promise(function (resolve, reject) {
    var loader = new OBJLoader();
    if (materialCreator) {
      Object.keys(materialCreator.materials).forEach(function (k) {
        return opacityRemap(materialCreator.materials[k]);
      });
      loader.setMaterials(materialCreator);
    }
    loader.load(objPath, resolve, noop, reject);
  });
};
var loadMtl = function loadMtl(mtlPath, MTLLoader) {
  return new Promise(function (resolve, reject) {
    var loader = new MTLLoader();
    loader.setTexturePath(mtlPath.substr(0, mtlPath.lastIndexOf('/') + 1));
    loader.setMaterialOptions({ ignoreZeroRGBs: true });
    loader.load(mtlPath, resolve, noop, reject);
  });
};

var colors = ['#F44336', '#E91E63', '#9C27B0', '#673AB7', '#3F51B5', '#2196F3', '#03A9F4', '#00BCD4', '#009688', '#4CAF50', '#8BC34A', '#CDDC39', '#FFEB3B', '#FFC107', '#FF9800'].map(function (hex) {
  return new three.Color(hex);
});
var LEARN_MORE_LINK = 'https://developers.google.com/ar/develop/web/getting-started';
var UNSUPPORTED_MESSAGE = 'This augmented reality experience requires\n  WebARonARCore or WebARonARKit, experimental browsers from Google\n  for Android and iOS. Learn more at the <a href="' + LEARN_MORE_LINK + '">Google Developers site</a>.';
var ARUtils = Object.create(null);
ARUtils.isTango = function (display) {
  return display && display.displayName.toLowerCase().includes('tango');
};
var isTango = ARUtils.isTango;
ARUtils.isARKit = function (display) {
  return display && display.displayName.toLowerCase().includes('arkit');
};
var isARKit = ARUtils.isARKit;
ARUtils.isARDisplay = function (display) {
  return isARKit(display) || isTango(display);
};
var isARDisplay = ARUtils.isARDisplay;
ARUtils.getARDisplay = function () {
  return new Promise(function (resolve, reject) {
    if (!navigator.getVRDisplays) {
      resolve(null);
      return;
    }
    navigator.getVRDisplays().then(function (displays) {
      if (!displays && displays.length === 0) {
        resolve(null);
        return;
      }
      var _iteratorNormalCompletion = true;
      var _didIteratorError = false;
      var _iteratorError = undefined;
      try {
        for (var _iterator = displays[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
          var display = _step.value;
          if (isARDisplay(display)) {
            resolve(display);
            return;
          }
        }
      } catch (err) {
        _didIteratorError = true;
        _iteratorError = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion && _iterator.return) {
            _iterator.return();
          }
        } finally {
          if (_didIteratorError) {
            throw _iteratorError;
          }
        }
      }
      resolve(null);
    });
  });
};

ARUtils.loadModel = function () {
  var config = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
  return new Promise(function (resolve, reject) {
    var mtlPath = config.mtlPath,
        objPath = config.objPath;
    var OBJLoader = config.OBJLoader || (global$1.THREE ? global$1.THREE.OBJLoader : null);
    var MTLLoader = config.MTLLoader || (global$1.THREE ? global$1.THREE.MTLLoader : null);
    if (!config.objPath) {
      reject(new Error('`objPath` must be specified.'));
      return;
    }
    if (!OBJLoader) {
      reject(new Error('Missing OBJLoader as third argument, or window.THREE.OBJLoader existence'));
      return;
    }
    if (config.mtlPath && !MTLLoader) {
      reject(new Error('Missing MTLLoader as fourth argument, or window.THREE.MTLLoader existence'));
      return;
    }
    var p = Promise.resolve();
    if (mtlPath) {
      p = loadMtl(mtlPath, MTLLoader);
    }
    p.then(function (materialCreator) {
      if (materialCreator) {
        materialCreator.preload();
      }
      return loadObj(objPath, materialCreator, OBJLoader);
    }).then(resolve, reject);
  });
};

var model = new three.Matrix4();
var tempPos = new three.Vector3();
var tempQuat = new three.Quaternion();
var tempScale = new three.Vector3();
ARUtils.placeObjectAtHit = function (object, hit) {
  var easing = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 1;
  var applyOrientation = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : false;
  if (!hit || !hit.modelMatrix) {
    throw new Error('placeObjectAtHit requires a VRHit object');
  }
  model.fromArray(hit.modelMatrix);
  model.decompose(tempPos, tempQuat, tempScale);
  if (easing === 1) {
    object.position.copy(tempPos);
    if (applyOrientation) {
      object.quaternion.copy(tempQuat);
    }
  } else {
    object.position.lerp(tempPos, easing);
    if (applyOrientation) {
      object.quaternion.slerp(tempQuat, easing);
    }
  }
};
var placeObjectAtHit = ARUtils.placeObjectAtHit;
ARUtils.getRandomPaletteColor = function () {
  return colors[Math.floor(Math.random() * colors.length)];
};
var getRandomPaletteColor = ARUtils.getRandomPaletteColor;
ARUtils.displayUnsupportedMessage = function (customMessage) {
  var element = document.createElement('div');
  element.id = 'webgl-error-message';
  element.style.fontFamily = 'monospace';
  element.style.fontSize = '13px';
  element.style.fontWeight = 'normal';
  element.style.textAlign = 'center';
  element.style.background = '#fff';
  element.style.border = '1px solid black';
  element.style.color = '#000';
  element.style.padding = '1.5em';
  element.style.width = '400px';
  element.style.margin = '5em auto 0';
  element.innerHTML = typeof customMessage === 'string' ? customMessage : UNSUPPORTED_MESSAGE;
  document.body.appendChild(element);
};

var vertexShader = "precision mediump float;precision mediump int;uniform mat4 modelViewMatrix;uniform mat4 modelMatrix;uniform mat4 projectionMatrix;attribute vec3 position;varying vec3 vPosition;void main(){vPosition=(modelMatrix*vec4(position,1.0)).xyz;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}";

var fragmentShader = "precision highp float;varying vec3 vPosition;\n#define countX 7.0\n#define countY 4.0\n#define gridAlpha 0.75\nuniform float dotRadius;uniform vec3 dotColor;uniform vec3 lineColor;uniform vec3 backgroundColor;uniform float alpha;float Circle(in vec2 p,float r){return length(p)-r;}float Line(in vec2 p,in vec2 a,in vec2 b){vec2 pa=p-a;vec2 ba=b-a;float t=clamp(dot(pa,ba)/dot(ba,ba),0.0,1.0);vec2 pt=a+t*ba;return length(pt-p);}float Union(float a,float b){return min(a,b);}void main(){vec2 count=vec2(countX,countY);vec2 size=vec2(1.0)/count;vec2 halfSize=size*0.5;vec2 uv=mod(vPosition.xz*1.5,size)-halfSize;float dots=Circle(uv-vec2(halfSize.x,0.0),dotRadius);dots=Union(dots,Circle(uv+vec2(halfSize.x,0.0),dotRadius));dots=Union(dots,Circle(uv+vec2(0.0,halfSize.y),dotRadius));dots=Union(dots,Circle(uv-vec2(0.0,halfSize.y),dotRadius));float lines=Line(uv,vec2(0.0,halfSize.y),-vec2(halfSize.x,0.0));lines=Union(lines,Line(uv,vec2(0.0,-halfSize.y),-vec2(halfSize.x,0.0)));lines=Union(lines,Line(uv,vec2(0.0,-halfSize.y),vec2(halfSize.x,0.0)));lines=Union(lines,Line(uv,vec2(0.0,halfSize.y),vec2(halfSize.x,0.0)));lines=Union(lines,Line(uv,vec2(-halfSize.x,halfSize.y),vec2(halfSize.x,halfSize.y)));lines=Union(lines,Line(uv,vec2(-halfSize.x,-halfSize.y),vec2(halfSize.x,-halfSize.y)));lines=Union(lines,Line(uv,vec2(-halfSize.x,0.0),vec2(halfSize.x,0.0)));lines=clamp(smoothstep(0.0,0.0035,lines),0.0,1.0);dots=clamp(smoothstep(0.0,0.001,dots),0.0,1.0);float result=Union(dots,lines);gl_FragColor=vec4(mix(backgroundColor+mix(dotColor,lineColor,dots),backgroundColor,result),mix(gridAlpha,alpha,result));}";

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) {
  return typeof obj;
} : function (obj) {
  return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
};





var asyncGenerator = function () {
  function AwaitValue(value) {
    this.value = value;
  }

  function AsyncGenerator(gen) {
    var front, back;

    function send(key, arg) {
      return new Promise(function (resolve, reject) {
        var request = {
          key: key,
          arg: arg,
          resolve: resolve,
          reject: reject,
          next: null
        };

        if (back) {
          back = back.next = request;
        } else {
          front = back = request;
          resume(key, arg);
        }
      });
    }

    function resume(key, arg) {
      try {
        var result = gen[key](arg);
        var value = result.value;

        if (value instanceof AwaitValue) {
          Promise.resolve(value.value).then(function (arg) {
            resume("next", arg);
          }, function (arg) {
            resume("throw", arg);
          });
        } else {
          settle(result.done ? "return" : "normal", result.value);
        }
      } catch (err) {
        settle("throw", err);
      }
    }

    function settle(type, value) {
      switch (type) {
        case "return":
          front.resolve({
            value: value,
            done: true
          });
          break;

        case "throw":
          front.reject(value);
          break;

        default:
          front.resolve({
            value: value,
            done: false
          });
          break;
      }

      front = front.next;

      if (front) {
        resume(front.key, front.arg);
      } else {
        back = null;
      }
    }

    this._invoke = send;

    if (typeof gen.return !== "function") {
      this.return = undefined;
    }
  }

  if (typeof Symbol === "function" && Symbol.asyncIterator) {
    AsyncGenerator.prototype[Symbol.asyncIterator] = function () {
      return this;
    };
  }

  AsyncGenerator.prototype.next = function (arg) {
    return this._invoke("next", arg);
  };

  AsyncGenerator.prototype.throw = function (arg) {
    return this._invoke("throw", arg);
  };

  AsyncGenerator.prototype.return = function (arg) {
    return this._invoke("return", arg);
  };

  return {
    wrap: function (fn) {
      return function () {
        return new AsyncGenerator(fn.apply(this, arguments));
      };
    },
    await: function (value) {
      return new AwaitValue(value);
    }
  };
}();





var classCallCheck = function (instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
};

var createClass = function () {
  function defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];
      descriptor.enumerable = descriptor.enumerable || false;
      descriptor.configurable = true;
      if ("value" in descriptor) descriptor.writable = true;
      Object.defineProperty(target, descriptor.key, descriptor);
    }
  }

  return function (Constructor, protoProps, staticProps) {
    if (protoProps) defineProperties(Constructor.prototype, protoProps);
    if (staticProps) defineProperties(Constructor, staticProps);
    return Constructor;
  };
}();







var get = function get(object, property, receiver) {
  if (object === null) object = Function.prototype;
  var desc = Object.getOwnPropertyDescriptor(object, property);

  if (desc === undefined) {
    var parent = Object.getPrototypeOf(object);

    if (parent === null) {
      return undefined;
    } else {
      return get(parent, property, receiver);
    }
  } else if ("value" in desc) {
    return desc.value;
  } else {
    var getter = desc.get;

    if (getter === undefined) {
      return undefined;
    }

    return getter.call(receiver);
  }
};

var inherits = function (subClass, superClass) {
  if (typeof superClass !== "function" && superClass !== null) {
    throw new TypeError("Super expression must either be null or a function, not " + typeof superClass);
  }

  subClass.prototype = Object.create(superClass && superClass.prototype, {
    constructor: {
      value: subClass,
      enumerable: false,
      writable: true,
      configurable: true
    }
  });
  if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass;
};











var possibleConstructorReturn = function (self, call) {
  if (!self) {
    throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
  }

  return call && (typeof call === "object" || typeof call === "function") ? call : self;
};





var slicedToArray = function () {
  function sliceIterator(arr, i) {
    var _arr = [];
    var _n = true;
    var _d = false;
    var _e = undefined;

    try {
      for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) {
        _arr.push(_s.value);

        if (i && _arr.length === i) break;
      }
    } catch (err) {
      _d = true;
      _e = err;
    } finally {
      try {
        if (!_n && _i["return"]) _i["return"]();
      } finally {
        if (_d) throw _e;
      }
    }

    return _arr;
  }

  return function (arr, i) {
    if (Array.isArray(arr)) {
      return arr;
    } else if (Symbol.iterator in Object(arr)) {
      return sliceIterator(arr, i);
    } else {
      throw new TypeError("Invalid attempt to destructure non-iterable instance");
    }
  };
}();

var DEFAULT_MATERIAL = new three.RawShaderMaterial({
  side: three.DoubleSide,
  transparent: true,
  uniforms: {
    dotColor: {
      value: new three.Color(0xffffff)
    },
    lineColor: {
      value: new three.Color(0x707070)
    },
    backgroundColor: {
      value: new three.Color(0x404040)
    },
    dotRadius: {
      value: 0.006666666667
    },
    alpha: {
      value: 0.4
    }
  },
  vertexShader: vertexShader,
  fragmentShader: fragmentShader
});
var ARPlanes = function (_Object3D) {
  inherits(ARPlanes, _Object3D);
  function ARPlanes(vrDisplay) {
    classCallCheck(this, ARPlanes);
    var _this = possibleConstructorReturn(this, (ARPlanes.__proto__ || Object.getPrototypeOf(ARPlanes)).call(this));
    _this.addPlane_ = function (plane) {
      var planeObj = _this.createPlane(plane);
      if (planeObj) {
        _this.add(planeObj);
        _this.planes.set(plane.identifier, planeObj);
      }
    };
    _this.removePlane_ = function (identifier) {
      var existing = _this.planes.get(identifier);
      if (existing) {
        _this.remove(existing);
      }
      _this.planes.delete(identifier);
    };
    _this.onPlaneAdded_ = function (event) {
      event.planes.forEach(function (plane) {
        return _this.addPlane_(plane);
      });
    };
    _this.onPlaneUpdated_ = function (event) {
      var _iteratorNormalCompletion = true;
      var _didIteratorError = false;
      var _iteratorError = undefined;
      try {
        for (var _iterator = event.planes[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
          var plane = _step.value;
          _this.removePlane_(plane.identifier);
          _this.addPlane_(plane);
        }
      } catch (err) {
        _didIteratorError = true;
        _iteratorError = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion && _iterator.return) {
            _iterator.return();
          }
        } finally {
          if (_didIteratorError) {
            throw _iteratorError;
          }
        }
      }
    };
    _this.onPlaneRemoved_ = function (event) {
      var _iteratorNormalCompletion2 = true;
      var _didIteratorError2 = false;
      var _iteratorError2 = undefined;
      try {
        for (var _iterator2 = event.planes[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
          var plane = _step2.value;
          _this.removePlane_(plane.identifier);
        }
      } catch (err) {
        _didIteratorError2 = true;
        _iteratorError2 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion2 && _iterator2.return) {
            _iterator2.return();
          }
        } finally {
          if (_didIteratorError2) {
            throw _iteratorError2;
          }
        }
      }
    };
    _this.vrDisplay = vrDisplay;
    _this.planes = new Map();
    _this.materials = new Map();
    return _this;
  }
  createClass(ARPlanes, [{
    key: 'enable',
    value: function enable() {
      this.vrDisplay.getPlanes().forEach(this.addPlane_);
      this.vrDisplay.addEventListener('planesadded', this.onPlaneAdded_);
      this.vrDisplay.addEventListener('planesupdated', this.onPlaneUpdated_);
      this.vrDisplay.addEventListener('planesremoved', this.onPlaneRemoved_);
    }
  }, {
    key: 'disable',
    value: function disable() {
      this.vrDisplay.removeEventListener('planesadded', this.onPlaneAdded_);
      this.vrDisplay.removeEventListener('planesupdated', this.onPlaneUpdated_);
      this.vrDisplay.removeEventListener('planesremoved', this.onPlaneRemoved_);
      var _iteratorNormalCompletion3 = true;
      var _didIteratorError3 = false;
      var _iteratorError3 = undefined;
      try {
        for (var _iterator3 = this.planes.keys()[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
          var identifier = _step3.value;
          this.removePlane_(identifier);
        }
      } catch (err) {
        _didIteratorError3 = true;
        _iteratorError3 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion3 && _iterator3.return) {
            _iterator3.return();
          }
        } finally {
          if (_didIteratorError3) {
            throw _iteratorError3;
          }
        }
      }
      this.materials.clear();
    }
  }, {
    key: 'createPlane',
    value: function createPlane(plane) {
      if (plane.vertices.length == 0) {
        return null;
      }
      var geo = new three.Geometry();
      for (var pt = 0; pt < plane.vertices.length / 3; pt++) {
        geo.vertices.push(new three.Vector3(plane.vertices[pt * 3], plane.vertices[pt * 3 + 1], plane.vertices[pt * 3 + 2]));
      }
      for (var face = 0; face < geo.vertices.length - 2; face++) {
        geo.faces.push(new three.Face3(0, face + 1, face + 2));
      }
      var material = void 0;
      if (this.materials.has(plane.identifier)) {
        material = this.materials.get(plane.identifier);
      } else {
        var color = getRandomPaletteColor();
        material = DEFAULT_MATERIAL.clone();
        material.uniforms.backgroundColor.value = color;
        this.materials.set(plane.identifier, material);
      }
      var planeObj = new three.Mesh(geo, material);
      var mm = plane.modelMatrix;
      planeObj.matrixAutoUpdate = false;
      planeObj.matrix.set(mm[0], mm[4], mm[8], mm[12], mm[1], mm[5], mm[9], mm[13], mm[2], mm[6], mm[10], mm[14], mm[3], mm[7], mm[11], mm[15]);
      this.add(planeObj);
      return planeObj;
    }
  }, {
    key: 'size',
    value: function size() {
      return this.planes.size;
    }
  }]);
  return ARPlanes;
}(three.Object3D);

var DEFAULTS = {
  open: true,
  showLastHit: true,
  showPoseStatus: true,
  showPlanes: false
};
var SUCCESS_COLOR = '#00ff00';
var FAILURE_COLOR = '#ff0077';
var PLANES_POLLING_TIMER = 500;
var THROTTLE_SPEED = 500;
var cachedVRDisplayMethods = new Map();
function throttle(fn, timer, scope) {
  var lastFired = void 0;
  var timeout = void 0;
  return function () {
    for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }
    var current = +new Date();
    var until = void 0;
    if (lastFired) {
      until = lastFired + timer - current;
    }
    if (until == undefined || until < 0) {
      lastFired = current;
      fn.apply(scope, args);
    } else if (until >= 0) {
      clearTimeout(timeout);
      timeout = setTimeout(function () {
        lastFired = current;
        fn.apply(scope, args);
      }, until);
    }
  };
}
var ARDebug = function () {
  function ARDebug(vrDisplay, scene, config) {
    classCallCheck(this, ARDebug);
    if (typeof config === 'undefined' && scene && scene.type !== 'Scene') {
      config = scene;
      scene = null;
    }
    this.config = Object.assign({}, DEFAULTS, config);
    this.vrDisplay = vrDisplay;
    this._view = new ARDebugView({ open: this.config.open });
    if (this.config.showLastHit && this.vrDisplay.hitTest) {
      this._view.addRow('hit-test', new ARDebugHitTestRow(vrDisplay));
    }
    if (this.config.showPoseStatus && this.vrDisplay.getFrameData) {
      this._view.addRow('pose-status', new ARDebugPoseRow(vrDisplay));
    }
    if (this.config.showPlanes && this.vrDisplay.getPlanes) {
      if (!scene) {
        console.warn('ARDebug `{ showPlanes: true }` option requires ' + 'passing in a THREE.Scene as the second parameter ' + 'in the constructor.');
      } else {
        this._view.addRow('show-planes', new ARDebugPlanesRow(vrDisplay, scene));
      }
    }
  }
  createClass(ARDebug, [{
    key: 'open',
    value: function open() {
      this._view.open();
    }
  }, {
    key: 'close',
    value: function close() {
      this._view.close();
    }
  }, {
    key: 'getElement',
    value: function getElement() {
      return this._view.getElement();
    }
  }]);
  return ARDebug;
}();
var ARDebugView = function () {
  function ARDebugView() {
    var config = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    classCallCheck(this, ARDebugView);
    this.rows = new Map();
    this.el = document.createElement('div');
    this.el.style.backgroundColor = '#333';
    this.el.style.padding = '5px';
    this.el.style.fontFamily = 'Roboto, Ubuntu, Arial, sans-serif';
    this.el.style.color = 'rgb(165, 165, 165)';
    this.el.style.position = 'absolute';
    this.el.style.right = '20px';
    this.el.style.top = '0px';
    this.el.style.width = '200px';
    this.el.style.fontSize = '12px';
    this.el.style.zIndex = 9999;
    this._rowsEl = document.createElement('div');
    this._rowsEl.style.transitionProperty = 'max-height';
    this._rowsEl.style.transitionDuration = '0.5s';
    this._rowsEl.style.transitionDelay = '0s';
    this._rowsEl.style.transitionTimingFunction = 'ease-out';
    this._rowsEl.style.overflow = 'hidden';
    this._controls = document.createElement('div');
    this._controls.style.fontSize = '13px';
    this._controls.style.fontWeight = 'bold';
    this._controls.style.paddingTop = '5px';
    this._controls.style.textAlign = 'center';
    this._controls.style.cursor = 'pointer';
    this._controls.addEventListener('click', this.toggleControls.bind(this));
    config.open ? this.open() : this.close();
    this.el.appendChild(this._rowsEl);
    this.el.appendChild(this._controls);
  }
  createClass(ARDebugView, [{
    key: 'toggleControls',
    value: function toggleControls() {
      if (this._isOpen) {
        this.close();
      } else {
        this.open();
      }
    }
  }, {
    key: 'open',
    value: function open() {
      this._rowsEl.style.maxHeight = '100px';
      this._isOpen = true;
      this._controls.textContent = 'Close ARDebug';
      var _iteratorNormalCompletion = true;
      var _didIteratorError = false;
      var _iteratorError = undefined;
      try {
        for (var _iterator = this.rows[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
          var _ref = _step.value;
          var _ref2 = slicedToArray(_ref, 2);
          var row = _ref2[1];
          row.enable();
        }
      } catch (err) {
        _didIteratorError = true;
        _iteratorError = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion && _iterator.return) {
            _iterator.return();
          }
        } finally {
          if (_didIteratorError) {
            throw _iteratorError;
          }
        }
      }
    }
  }, {
    key: 'close',
    value: function close() {
      this._rowsEl.style.maxHeight = '0px';
      this._isOpen = false;
      this._controls.textContent = 'Open ARDebug';
      var _iteratorNormalCompletion2 = true;
      var _didIteratorError2 = false;
      var _iteratorError2 = undefined;
      try {
        for (var _iterator2 = this.rows[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
          var _ref3 = _step2.value;
          var _ref4 = slicedToArray(_ref3, 2);
          var row = _ref4[1];
          row.disable();
        }
      } catch (err) {
        _didIteratorError2 = true;
        _iteratorError2 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion2 && _iterator2.return) {
            _iterator2.return();
          }
        } finally {
          if (_didIteratorError2) {
            throw _iteratorError2;
          }
        }
      }
    }
  }, {
    key: 'getElement',
    value: function getElement() {
      return this.el;
    }
  }, {
    key: 'addRow',
    value: function addRow(id, row) {
      this.rows.set(id, row);
      if (this._isOpen) {
        row.enable();
      }
      this._rowsEl.appendChild(row.getElement());
    }
  }]);
  return ARDebugView;
}();
var ARDebugRow = function () {
  function ARDebugRow(title) {
    classCallCheck(this, ARDebugRow);
    this.el = document.createElement('div');
    this.el.style.width = '100%';
    this.el.style.borderTop = '1px solid rgb(54, 54, 54)';
    this.el.style.borderBottom = '1px solid #14171A';
    this.el.style.position = 'relative';
    this.el.style.padding = '3px 0px';
    this.el.style.overflow = 'hidden';
    this._titleEl = document.createElement('span');
    this._titleEl.style.fontWeight = 'bold';
    this._titleEl.textContent = title;
    this._dataEl = document.createElement('span');
    this._dataEl.style.position = 'absolute';
    this._dataEl.style.left = '40px';
    this._dataElText = document.createTextNode('');
    this._dataEl.appendChild(this._dataElText);
    this.el.appendChild(this._titleEl);
    this.el.appendChild(this._dataEl);
    this._throttledWriteToDOM = throttle(this._writeToDOM, THROTTLE_SPEED, this);
  }
  createClass(ARDebugRow, [{
    key: 'enable',
    value: function enable() {
      throw new Error('Implement in child class');
    }
  }, {
    key: 'disable',
    value: function disable() {
      throw new Error('Implement in child class');
    }
  }, {
    key: 'getElement',
    value: function getElement() {
      return this.el;
    }
  }, {
    key: 'update',
    value: function update(value, isSuccess, renderImmediately) {
      if (renderImmediately) {
        this._writeToDOM(value, isSuccess);
      } else {
        this._throttledWriteToDOM(value, isSuccess);
      }
    }
  }, {
    key: '_writeToDOM',
    value: function _writeToDOM(value, isSuccess) {
      this._dataElText.nodeValue = value;
      this._dataEl.style.color = isSuccess ? SUCCESS_COLOR : FAILURE_COLOR;
    }
  }]);
  return ARDebugRow;
}();
var ARDebugHitTestRow = function (_ARDebugRow) {
  inherits(ARDebugHitTestRow, _ARDebugRow);
  function ARDebugHitTestRow(vrDisplay) {
    classCallCheck(this, ARDebugHitTestRow);
    var _this = possibleConstructorReturn(this, (ARDebugHitTestRow.__proto__ || Object.getPrototypeOf(ARDebugHitTestRow)).call(this, 'Hit'));
    _this.vrDisplay = vrDisplay;
    _this._onHitTest = _this._onHitTest.bind(_this);
    _this._nativeHitTest = cachedVRDisplayMethods.get('hitTest') || _this.vrDisplay.hitTest;
    cachedVRDisplayMethods.set('hitTest', _this._nativeHitTest);
    _this._didPreviouslyHit = null;
    return _this;
  }
  createClass(ARDebugHitTestRow, [{
    key: 'enable',
    value: function enable() {
      this.vrDisplay.hitTest = this._onHitTest;
    }
  }, {
    key: 'disable',
    value: function disable() {
      this.vrDisplay.hitTest = this._nativeHitTest;
    }
  }, {
    key: '_hitToString',
    value: function _hitToString(hit) {
      var mm = hit.modelMatrix;
      return mm[12].toFixed(2) + ', ' + mm[13].toFixed(2) + ', ' + mm[14].toFixed(2);
    }
  }, {
    key: '_onHitTest',
    value: function _onHitTest(x, y) {
      var hits = this._nativeHitTest.call(this.vrDisplay, x, y);
      var t = (parseInt(performance.now(), 10) / 1000).toFixed(1);
      var didHit = hits && hits.length;
      var value = (didHit ? this._hitToString(hits[0]) : 'MISS') + ' @ ' + t + 's';
      this.update(value, didHit, didHit !== this._didPreviouslyHit);
      this._didPreviouslyHit = didHit;
      return hits;
    }
  }]);
  return ARDebugHitTestRow;
}(ARDebugRow);
var ARDebugPoseRow = function (_ARDebugRow2) {
  inherits(ARDebugPoseRow, _ARDebugRow2);
  function ARDebugPoseRow(vrDisplay) {
    classCallCheck(this, ARDebugPoseRow);
    var _this2 = possibleConstructorReturn(this, (ARDebugPoseRow.__proto__ || Object.getPrototypeOf(ARDebugPoseRow)).call(this, 'Pose'));
    _this2.vrDisplay = vrDisplay;
    _this2._onGetFrameData = _this2._onGetFrameData.bind(_this2);
    _this2._nativeGetFrameData = cachedVRDisplayMethods.get('getFrameData') || _this2.vrDisplay.getFrameData;
    cachedVRDisplayMethods.set('getFrameData', _this2._nativeGetFrameData);
    _this2.update('Looking for position...', false, true);
    _this2._initialPose = false;
    return _this2;
  }
  createClass(ARDebugPoseRow, [{
    key: 'enable',
    value: function enable() {
      this.vrDisplay.getFrameData = this._onGetFrameData;
    }
  }, {
    key: 'disable',
    value: function disable() {
      this.vrDisplay.getFrameData = this._nativeGetFrameData;
    }
  }, {
    key: '_poseToString',
    value: function _poseToString(pose) {
      return pose[0].toFixed(2) + ', ' + pose[1].toFixed(2) + ', ' + pose[2].toFixed(2);
    }
  }, {
    key: '_onGetFrameData',
    value: function _onGetFrameData(frameData) {
      var results = this._nativeGetFrameData.call(this.vrDisplay, frameData);
      var pose = frameData && frameData.pose && frameData.pose.position;
      var isValidPose = pose && typeof pose[0] === 'number' && typeof pose[1] === 'number' && typeof pose[2] === 'number' && !(pose[0] === 0 && pose[1] === 0 && pose[2] === 0);
      if (!this._initialPose && !isValidPose) {
        return results;
      }
      var renderImmediately = isValidPose !== this._lastPoseValid;
      if (isValidPose) {
        this.update(this._poseToString(pose), true, renderImmediately);
      } else if (!isValidPose && this._lastPoseValid !== false) {
        this.update('Position lost', false, renderImmediately);
      }
      this._lastPoseValid = isValidPose;
      this._initialPose = true;
      return results;
    }
  }]);
  return ARDebugPoseRow;
}(ARDebugRow);
var ARDebugPlanesRow = function (_ARDebugRow3) {
  inherits(ARDebugPlanesRow, _ARDebugRow3);
  function ARDebugPlanesRow(vrDisplay, scene) {
    classCallCheck(this, ARDebugPlanesRow);
    var _this3 = possibleConstructorReturn(this, (ARDebugPlanesRow.__proto__ || Object.getPrototypeOf(ARDebugPlanesRow)).call(this, 'Planes'));
    _this3.vrDisplay = vrDisplay;
    _this3.planes = new ARPlanes(_this3.vrDisplay);
    _this3._onPoll = _this3._onPoll.bind(_this3);
    _this3.update('Looking for planes...', false, true);
    if (scene) {
      scene.add(_this3.planes);
    }
    return _this3;
  }
  createClass(ARDebugPlanesRow, [{
    key: 'enable',
    value: function enable() {
      if (this._timer) {
        this.disable();
      }
      this._timer = setInterval(this._onPoll, PLANES_POLLING_TIMER);
      this.planes.enable();
    }
  }, {
    key: 'disable',
    value: function disable() {
      clearInterval(this._timer);
      this._timer = null;
      this.planes.disable();
    }
  }, {
    key: '_planesToString',
    value: function _planesToString(count) {
      return count + ' plane' + (count === 1 ? '' : 's') + ' found';
    }
  }, {
    key: '_onPoll',
    value: function _onPoll() {
      var planeCount = this.planes.size();
      if (this._lastPlaneCount !== planeCount) {
        this.update(this._planesToString(planeCount), planeCount > 0, true);
      }
      this._lastPlaneCount = planeCount;
    }
  }]);
  return ARDebugPlanesRow;
}(ARDebugRow);

var frameData = void 0;
var ARPerspectiveCamera = function (_PerspectiveCamera) {
  inherits(ARPerspectiveCamera, _PerspectiveCamera);
  function ARPerspectiveCamera(vrDisplay, fov, aspect, near, far) {
    classCallCheck(this, ARPerspectiveCamera);
    var _this = possibleConstructorReturn(this, (ARPerspectiveCamera.__proto__ || Object.getPrototypeOf(ARPerspectiveCamera)).call(this, fov, aspect, near, far));
    _this.isARPerpsectiveCamera = true;
    _this.vrDisplay = vrDisplay;
    _this.updateProjectionMatrix();
    if (!vrDisplay || !vrDisplay.capabilities.hasPassThroughCamera) {
      console.warn('ARPerspectiveCamera does not a VRDisplay with\n                    a pass through camera. Using supplied values and defaults\n                    instead of device camera intrinsics');
    }
    return _this;
  }
  createClass(ARPerspectiveCamera, [{
    key: 'updateProjectionMatrix',
    value: function updateProjectionMatrix() {
      var projMatrix = this.getProjectionMatrix();
      if (!projMatrix) {
        get(ARPerspectiveCamera.prototype.__proto__ || Object.getPrototypeOf(ARPerspectiveCamera.prototype), 'updateProjectionMatrix', this).call(this);
        return;
      }
      this.projectionMatrix.fromArray(projMatrix);
    }
  }, {
    key: 'getProjectionMatrix',
    value: function getProjectionMatrix() {
      if (this.vrDisplay && this.vrDisplay.getFrameData) {
        if (!frameData) {
          frameData = new VRFrameData();
        }
        this.vrDisplay.getFrameData(frameData);
        return frameData.leftProjectionMatrix;
      }
      return null;
    }
  }]);
  return ARPerspectiveCamera;
}(three.PerspectiveCamera);

var ARReticle = function (_Mesh) {
  inherits(ARReticle, _Mesh);
  function ARReticle(vrDisplay) {
    var innerRadius = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0.02;
    var outerRadius = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 0.05;
    var color = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 0xff0077;
    var easing = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : 0.25;
    classCallCheck(this, ARReticle);
    var geometry = new three.RingGeometry(innerRadius, outerRadius, 36, 64);
    var material = new three.MeshBasicMaterial({ color: color });
    geometry.applyMatrix(new three.Matrix4().makeRotationX(three.Math.degToRad(-90)));
    var _this = possibleConstructorReturn(this, (ARReticle.__proto__ || Object.getPrototypeOf(ARReticle)).call(this, geometry, material));
    _this.visible = false;
    _this.easing = easing;
    _this.applyOrientation = true;
    _this.vrDisplay = vrDisplay;
    _this._planeDir = new three.Vector3();
    return _this;
  }
  createClass(ARReticle, [{
    key: 'update',
    value: function update() {
      var x = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 0.5;
      var y = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0.5;
      if (!this.vrDisplay || !this.vrDisplay.hitTest) {
        return;
      }
      var hit = this.vrDisplay.hitTest(x, y);
      if (hit && hit.length > 0) {
        this.visible = true;
        placeObjectAtHit(this, hit[0], this.applyOrientation, this.easing);
      }
    }
  }]);
  return ARReticle;
}(three.Mesh);

var vertexSource = "attribute vec3 aVertexPosition;attribute vec2 aTextureCoord;varying vec2 vTextureCoord;void main(void){gl_Position=vec4(aVertexPosition,1.0);vTextureCoord=aTextureCoord;}";

var fragmentSource = "\n#extension GL_OES_EGL_image_external : require\nprecision mediump float;varying vec2 vTextureCoord;uniform samplerExternalOES uSampler;void main(void){gl_FragColor=texture2D(uSampler,vTextureCoord);}";

function WGLUPreserveGLState(gl, bindings, callback) {
  if (!bindings) {
    callback(gl);
    return;
  }
  var boundValues = [];
  var activeTexture = null;
  for (var i = 0; i < bindings.length; ++i) {
    var binding = bindings[i];
    switch (binding) {
      case gl.TEXTURE_BINDING_2D:
      case gl.TEXTURE_BINDING_CUBE_MAP:
        var textureUnit = bindings[++i];
        if (textureUnit < gl.TEXTURE0 || textureUnit > gl.TEXTURE31) {
          console.error("TEXTURE_BINDING_2D or TEXTURE_BINDING_CUBE_MAP must be followed by a valid texture unit");
          boundValues.push(null, null);
          break;
        }
        if (!activeTexture) {
          activeTexture = gl.getParameter(gl.ACTIVE_TEXTURE);
        }
        gl.activeTexture(textureUnit);
        boundValues.push(gl.getParameter(binding), null);
        break;
      case gl.ACTIVE_TEXTURE:
        activeTexture = gl.getParameter(gl.ACTIVE_TEXTURE);
        boundValues.push(null);
        break;
      default:
        boundValues.push(gl.getParameter(binding));
        break;
    }
  }
  callback(gl);
  for (var i = 0; i < bindings.length; ++i) {
    var binding = bindings[i];
    var boundValue = boundValues[i];
    switch (binding) {
      case gl.ACTIVE_TEXTURE:
        break;
      case gl.ARRAY_BUFFER_BINDING:
        gl.bindBuffer(gl.ARRAY_BUFFER, boundValue);
        break;
      case gl.COLOR_CLEAR_VALUE:
        gl.clearColor(boundValue[0], boundValue[1], boundValue[2], boundValue[3]);
        break;
      case gl.COLOR_WRITEMASK:
        gl.colorMask(boundValue[0], boundValue[1], boundValue[2], boundValue[3]);
        break;
      case gl.CURRENT_PROGRAM:
        gl.useProgram(boundValue);
        break;
      case gl.ELEMENT_ARRAY_BUFFER_BINDING:
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, boundValue);
        break;
      case gl.FRAMEBUFFER_BINDING:
        gl.bindFramebuffer(gl.FRAMEBUFFER, boundValue);
        break;
      case gl.RENDERBUFFER_BINDING:
        gl.bindRenderbuffer(gl.RENDERBUFFER, boundValue);
        break;
      case gl.TEXTURE_BINDING_2D:
        var textureUnit = bindings[++i];
        if (textureUnit < gl.TEXTURE0 || textureUnit > gl.TEXTURE31)
          break;
        gl.activeTexture(textureUnit);
        gl.bindTexture(gl.TEXTURE_2D, boundValue);
        break;
      case gl.TEXTURE_BINDING_CUBE_MAP:
        var textureUnit = bindings[++i];
        if (textureUnit < gl.TEXTURE0 || textureUnit > gl.TEXTURE31)
          break;
        gl.activeTexture(textureUnit);
        gl.bindTexture(gl.TEXTURE_CUBE_MAP, boundValue);
        break;
      case gl.VIEWPORT:
        gl.viewport(boundValue[0], boundValue[1], boundValue[2], boundValue[3]);
        break;
      case gl.BLEND:
      case gl.CULL_FACE:
      case gl.DEPTH_TEST:
      case gl.SCISSOR_TEST:
      case gl.STENCIL_TEST:
        if (boundValue) {
          gl.enable(binding);
        } else {
          gl.disable(binding);
        }
        break;
      default:
        console.log("No GL restore behavior for 0x" + binding.toString(16));
        break;
    }
    if (activeTexture) {
      gl.activeTexture(activeTexture);
    }
  }
}
var glPreserveState = WGLUPreserveGLState;

function getShader(gl, str, type) {
  var shader = void 0;
  if (type == 'fragment') {
    shader = gl.createShader(gl.FRAGMENT_SHADER);
  } else if (type == 'vertex') {
    shader = gl.createShader(gl.VERTEX_SHADER);
  } else {
    return null;
  }
  gl.shaderSource(shader, str);
  gl.compileShader(shader);
  var result = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
  if (!result) {
    alert(gl.getShaderInfoLog(shader));
    return null;
  }
  return shader;
}
function getProgram(gl, vs, fs) {
  var vertexShader = getShader(gl, vs, 'vertex');
  var fragmentShader = getShader(gl, fs, 'fragment');
  if (!fragmentShader) {
    return null;
  }
  var shaderProgram = gl.createProgram();
  gl.attachShader(shaderProgram, vertexShader);
  gl.attachShader(shaderProgram, fragmentShader);
  gl.linkProgram(shaderProgram);
  var result = gl.getProgramParameter(shaderProgram, gl.LINK_STATUS);
  if (!result) {
    alert('Could not initialise arview shaders');
  }
  return shaderProgram;
}
function combineOrientations(screenOrientation, seeThroughCameraOrientation) {
  var seeThroughCameraOrientationIndex = 0;
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
  var screenOrientationIndex = 0;
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
  var ret = screenOrientationIndex - seeThroughCameraOrientationIndex;
  if (ret < 0) {
    ret += 4;
  }
  return ret % 4;
}
var ARVideoRenderer = function () {
  function ARVideoRenderer(vrDisplay, gl) {
    classCallCheck(this, ARVideoRenderer);
    this.vrDisplay = vrDisplay;
    this.gl = gl;
    if (this.vrDisplay) {
      this.passThroughCamera = vrDisplay.getPassThroughCamera();
      this.program = getProgram(gl, vertexSource, fragmentSource);
    }
    gl.useProgram(this.program);
    this.vertexPositionAttribute = gl.getAttribLocation(this.program, 'aVertexPosition');
    this.textureCoordAttribute = gl.getAttribLocation(this.program, 'aTextureCoord');
    this.samplerUniform = gl.getUniformLocation(this.program, 'uSampler');
    this.vertexPositionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexPositionBuffer);
    var vertices = [-1.0, 1.0, 0.0, -1.0, -1.0, 0.0, 1.0, 1.0, 0.0, 1.0, -1.0, 0.0];
    var f32Vertices = new Float32Array(vertices);
    gl.bufferData(gl.ARRAY_BUFFER, f32Vertices, gl.STATIC_DRAW);
    this.vertexPositionBuffer.itemSize = 3;
    this.vertexPositionBuffer.numItems = 12;
    this.textureCoordBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.textureCoordBuffer);
    var textureCoords = null;
    if (this.vrDisplay) {
      var u = this.passThroughCamera.width / this.passThroughCamera.textureWidth;
      var v = this.passThroughCamera.height / this.passThroughCamera.textureHeight;
      textureCoords = [[0.0, 0.0, 0.0, v, u, 0.0, u, v], [u, 0.0, 0.0, 0.0, u, v, 0.0, v], [u, v, u, 0.0, 0.0, v, 0.0, 0.0], [0.0, v, u, v, 0.0, 0.0, u, 0.0]];
    } else {
      textureCoords = [[0.0, 0.0, 0.0, 1.0, 1.0, 0.0, 1.0, 1.0], [1.0, 0.0, 0.0, 0.0, 1.0, 1.0, 0.0, 1.0], [1.0, 1.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0], [0.0, 1.0, 1.0, 1.0, 0.0, 0.0, 1.0, 0.0]];
    }
    this.f32TextureCoords = [];
    for (var i = 0; i < textureCoords.length; i++) {
      this.f32TextureCoords.push(new Float32Array(textureCoords[i]));
    }
    this.combinedOrientation = combineOrientations(screen.orientation.angle, this.passThroughCamera.orientation);
    gl.bufferData(gl.ARRAY_BUFFER, this.f32TextureCoords[this.combinedOrientation], gl.STATIC_DRAW);
    this.textureCoordBuffer.itemSize = 2;
    this.textureCoordBuffer.numItems = 8;
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    this.indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
    var indices = [0, 1, 2, 2, 1, 3];
    var ui16Indices = new Uint16Array(indices);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, ui16Indices, gl.STATIC_DRAW);
    this.indexBuffer.itemSize = 1;
    this.indexBuffer.numItems = 6;
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
    this.texture = gl.createTexture();
    gl.useProgram(null);
    this.projectionMatrix = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
    this.mvMatrix = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
    return this;
  }
  createClass(ARVideoRenderer, [{
    key: 'render',
    value: function render() {
      var _this = this;
      var gl = this.gl;
      var bindings = [gl.ARRAY_BUFFER_BINDING, gl.ELEMENT_ARRAY_BUFFER_BINDING, gl.CURRENT_PROGRAM];
      glPreserveState(gl, bindings, function () {
        gl.useProgram(_this.program);
        gl.bindBuffer(gl.ARRAY_BUFFER, _this.vertexPositionBuffer);
        gl.enableVertexAttribArray(_this.vertexPositionAttribute);
        gl.vertexAttribPointer(_this.vertexPositionAttribute, _this.vertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);
        gl.bindBuffer(gl.ARRAY_BUFFER, _this.textureCoordBuffer);
        var combinedOrientation = combineOrientations(screen.orientation.angle, _this.passThroughCamera.orientation);
        if (combinedOrientation !== _this.combinedOrientation) {
          _this.combinedOrientation = combinedOrientation;
          gl.bufferData(gl.ARRAY_BUFFER, _this.f32TextureCoords[_this.combinedOrientation], gl.STATIC_DRAW);
        }
        gl.enableVertexAttribArray(_this.textureCoordAttribute);
        gl.vertexAttribPointer(_this.textureCoordAttribute, _this.textureCoordBuffer.itemSize, gl.FLOAT, false, 0, 0);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_EXTERNAL_OES, _this.texture);
        gl.texImage2D(gl.TEXTURE_EXTERNAL_OES, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, _this.passThroughCamera);
        gl.uniform1i(_this.samplerUniform, 0);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, _this.indexBuffer);
        gl.drawElements(gl.TRIANGLES, _this.indexBuffer.numItems, gl.UNSIGNED_SHORT, 0);
      });
    }
  }]);
  return ARVideoRenderer;
}();
var ARView = function () {
  function ARView(vrDisplay, renderer) {
    classCallCheck(this, ARView);
    this.vrDisplay = vrDisplay;
    if (isARKit(this.vrDisplay)) {
      return;
    }
    this.renderer = renderer;
    this.gl = renderer.context;
    this.videoRenderer = new ARVideoRenderer(vrDisplay, this.gl);
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    window.addEventListener('resize', this.onWindowResize.bind(this), false);
  }
  createClass(ARView, [{
    key: 'onWindowResize',
    value: function onWindowResize() {
      this.width = window.innerWidth;
      this.height = window.innerHeight;
    }
  }, {
    key: 'render',
    value: function render() {
      if (isARKit(this.vrDisplay)) {
        return;
      }
      var gl = this.gl;
      var dpr = window.devicePixelRatio;
      var width = this.width * dpr;
      var height = this.height * dpr;
      if (gl.viewportWidth !== width) {
        gl.viewportWidth = width;
      }
      if (gl.viewportHeight !== height) {
        gl.viewportHeight = height;
      }
      this.gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
      this.videoRenderer.render();
    }
  }]);
  return ARView;
}();

(function () {
  if (window.webarSpeechRecognitionInstance) {
    var addEventHandlingToObject = function addEventHandlingToObject(object) {
      object.listeners = {};
      object.addEventListener = function (eventType, callback) {
        if (!callback) {
          return this;
        }
        var listeners = this.listeners[eventType];
        if (!listeners) {
          this.listeners[eventType] = listeners = [];
        }
        if (listeners.indexOf(callback) < 0) {
          listeners.push(callback);
        }
        return this;
      };
      object.removeEventListener = function (eventType, callback) {
        if (!callback) {
          return this;
        }
        var listeners = this.listeners[eventType];
        if (listeners) {
          var i = listeners.indexOf(callback);
          if (i >= 0) {
            this.listeners[eventType] = listeners.splice(i, 1);
          }
        }
        return this;
      };
      object.callEventListeners = function (eventType, event) {
        if (!event) {
          event = { target: this };
        }
        if (!event.target) {
          event.target = this;
        }
        event.type = eventType;
        var onEventType = 'on' + eventType;
        if (typeof this[onEventType] === 'function') {
          this[onEventType](event);
        }
        var listeners = this.listeners[eventType];
        if (listeners) {
          for (var i = 0; i < listeners.length; i++) {
            var typeofListener = _typeof(listeners[i]);
            if (typeofListener === 'object') {
              listeners[i].handleEvent(event);
            } else if (typeofListener === 'function') {
              listeners[i](event);
            }
          }
        }
        return this;
      };
    };
    addEventHandlingToObject(window.webarSpeechRecognitionInstance);
    window.webkitSpeechRecognition = function () {
      return window.webarSpeechRecognitionInstance;
    };
  }
})();

if (typeof window !== 'undefined' && _typeof(window.THREE) === 'object') {
  window.THREE.ARDebug = ARDebug;
  window.THREE.ARPerspectiveCamera = ARPerspectiveCamera;
  window.THREE.ARReticle = ARReticle;
  window.THREE.ARUtils = ARUtils;
  window.THREE.ARView = ARView;
}

exports.ARDebug = ARDebug;
exports.ARPerspectiveCamera = ARPerspectiveCamera;
exports.ARReticle = ARReticle;
exports.ARUtils = ARUtils;
exports.ARView = ARView;

Object.defineProperty(exports, '__esModule', { value: true });

})));
