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


/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// identity function for calling harmony imports with the correct context
/******/ 	__webpack_require__.i = function(value) { return value; };
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, {
/******/ 				configurable: false,
/******/ 				enumerable: true,
/******/ 				get: getter
/******/ 			});
/******/ 		}
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 7);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.displayUnsupportedMessage = exports.placeObjectAtHit = exports.loadBlocksModel = exports.getARDisplay = exports.isARDisplay = exports.isARKit = exports.isTango = undefined;

var _loaders = __webpack_require__(8);

var LEARN_MORE_LINK = 'https://developers.google.com/ar/develop/web/getting-started'; /*
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

var UNSUPPORTED_MESSAGE = 'This augmented reality experience requires WebARonARCore or WebARonARKit: experimental browsers from Google, available Android and iOS. Learn more <a href="' + LEARN_MORE_LINK + '">here</a>.';

THREE.ARUtils = Object.create(null);

THREE.ARUtils.isTango = function (display) {
  return display && display.displayName.toLowerCase().includes('tango');
};
var isTango = exports.isTango = THREE.ARUtils.isTango;

THREE.ARUtils.isARKit = function (display) {
  return display && display.displayName.toLowerCase().includes('arkit');
};
var isARKit = exports.isARKit = THREE.ARUtils.isARKit;

THREE.ARUtils.isARDisplay = function (display) {
  return isARKit(display) || isTango(display);
};
var isARDisplay = exports.isARDisplay = THREE.ARUtils.isARDisplay;

/**
 * Returns a promise that resolves to either to a VRDisplay with
 * AR capabilities, or null if no valid AR devices found on the platform.
 *
 * @return {Promise<VRDisplay?>}
 */
THREE.ARUtils.getARDisplay = function () {
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
var getARDisplay = exports.getARDisplay = THREE.ARUtils.getARDisplay;

/**
 * Takes a path for an OBJ model and optionally a path for an MTL
 * texture and returns a promise resolving to a THREE.Mesh loaded with
 * the appropriate material. Can be used on downloaded models from Blocks.
 *
 * @param {string} objPath
 * @param {string} mtlPath
 * @return {THREE.Mesh}
 */
THREE.ARUtils.loadBlocksModel = function (objPath, mtlPath) {
  return new Promise(function (resolve, reject) {
    if (!THREE.OBJLoader || !THREE.MTLLoader) {
      reject(new Error('Must include THREE.OBJLoader and THREE.MTLLoader'));
      return;
    }

    var p = Promise.resolve();

    if (mtlPath) {
      p = (0, _loaders.loadMtl)(mtlPath);
    }

    p.then(function (materials) {
      if (materials) {
        materials.preload();
      }
      return (0, _loaders.loadObj)(objPath, materials);
    }).then(function (obj) {
      var model = obj.children[0];
      model.geometry.applyMatrix(new THREE.Matrix4().makeRotationY(THREE.Math.degToRad(-90)));

      return model;
    }).then(resolve, reject);
  });
};
var loadBlocksModel = exports.loadBlocksModel = THREE.ARUtils.loadBlocksModel;

var model = new THREE.Matrix4();
var tempPos = new THREE.Vector3();
var tempQuat = new THREE.Quaternion();
var tempScale = new THREE.Vector3();

/**
 * Takes a THREE.Object3D and a VRHit and positions and optionally orients
 * the object according to the transform of the VRHit. Can provide an
 * easing value between 0 and 1 corresponding to the lerp between the
 * object's current position/orientation, and the position/orientation of the
 * hit.
 *
 * @param {THREE.Object3D} object
 * @param {VRHit} hit
 * @param {number} easing
 * @param {boolean} applyOrientation
 */
THREE.ARUtils.placeObjectAtHit = function (object, hit) {
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
var placeObjectAtHit = exports.placeObjectAtHit = THREE.ARUtils.placeObjectAtHit;

/**
 * Injects a DOM element into the current page prompting the user that
 * their browser does not support these AR features.
 */
THREE.ARUtils.displayUnsupportedMessage = function () {
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
  element.innerHTML = UNSUPPORTED_MESSAGE;
  document.body.appendChild(element);
};
var displayUnsupportedMessage = exports.displayUnsupportedMessage = THREE.ARUtils.displayUnsupportedMessage;

/***/ }),
/* 1 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

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

var DEFAULTS = {
  open: true,
  showLastHit: true,
  showPoseStatus: true
};

var SUCCESS_COLOR = '#00ff00';
var FAILURE_COLOR = '#ff0077';

// A cache to store original native VRDisplay methods
// since WebARonARKit does not provide a VRDisplay.prototype[method],
// and assuming the first time ARDebug proxies a method is the
// 'native' version, this caches the correct method if we proxy a method twice
var cachedVRDisplayMethods = new Map();

/**
 * A throttle function to limit number of DOM writes
 * in the ARDebug view.
 *
 * @param {Function} fn
 * @param {number} timer
 * @param {Object} scope
 *
 * @return {Function}
 */
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
/**
 * Class for creating a mesh that fires raycasts and lerps
 * a 3D object along the surface
 */

var ARDebug = function () {
  /**
   * @param {VRDisplay} vrDisplay
   * @param {Object} config
   * @param {boolean} config.open
   * @param {boolean} config.showLastHit
   * @param {boolean} config.showPoseStatus
   */
  function ARDebug(vrDisplay) {
    var config = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

    _classCallCheck(this, ARDebug);

    this.config = Object.assign({}, config, DEFAULTS);
    this.vrDisplay = vrDisplay;

    this._view = new ARDebugView({ open: this.config.open });

    if (this.config.showLastHit && this.vrDisplay.hitTest) {
      this._view.addRow('hit-test', new ARDebugHitTestRow(vrDisplay));
    }

    if (this.config.showPoseStatus && this.vrDisplay.getFrameData) {
      this._view.addRow('pose-status', new ARDebugPoseRow(vrDisplay));
    }
  }

  /**
   * Opens the debug panel.
   */


  _createClass(ARDebug, [{
    key: 'open',
    value: function open() {
      this._view.open();
    }

    /**
     * Closes the debug panel.
     */

  }, {
    key: 'close',
    value: function close() {
      this._view.close();
    }

    /**
     * Returns the root DOM element for the panel.
     *
     * @return {HTMLElement}
     */

  }, {
    key: 'getElement',
    value: function getElement() {
      return this._view.getElement();
    }
  }]);

  return ARDebug;
}();

/**
 * An implementation that interfaces with the DOM, used
 * by ARDebug
 */


var ARDebugView = function () {
  /**
   * @param {Object} config
   * @param {boolean} config.open
   */
  function ARDebugView() {
    var config = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

    _classCallCheck(this, ARDebugView);

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

    // Initialize the view as open or closed
    config.open ? this.open() : this.close();

    this.el.appendChild(this._rowsEl);
    this.el.appendChild(this._controls);
  }

  /**
   * Toggles between open and close modes.
   */


  _createClass(ARDebugView, [{
    key: 'toggleControls',
    value: function toggleControls() {
      if (this._isOpen) {
        this.close();
      } else {
        this.open();
      }
    }

    /**
     * Opens the debugging panel.
     */

  }, {
    key: 'open',
    value: function open() {
      // Use max-height with large value to transition
      // to/from a non-specific height (like auto/100%)
      // https://stackoverflow.com/a/8331169
      // @TODO investigate a more complete solution with correct timing,
      // via something like http://n12v.com/css-transition-to-from-auto/
      this._rowsEl.style.maxHeight = '100px';
      this._isOpen = true;
      this._controls.textContent = 'Close ARDebug';
      var _iteratorNormalCompletion = true;
      var _didIteratorError = false;
      var _iteratorError = undefined;

      try {
        for (var _iterator = this.rows[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
          var _step$value = _slicedToArray(_step.value, 2),
              row = _step$value[1];

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

    /**
     * Closes the debugging panel.
     */

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
          var _step2$value = _slicedToArray(_step2.value, 2),
              row = _step2$value[1];

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

    /**
     * Returns the ARDebugView root element.
     *
     * @return {HTMLElement}
     */

  }, {
    key: 'getElement',
    value: function getElement() {
      return this.el;
    }

    /**
     * Adds a row to the ARDebugView.
     *
     * @param {string} id
     * @param {ARDebugRow} row
     */

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

/**
 * A class that implements features being a row in the ARDebugView.
 */


var ARDebugRow = function () {
  /**
   * @param {string} title
   */
  function ARDebugRow(title) {
    _classCallCheck(this, ARDebugRow);

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

    // Create a text element to update so we can avoid
    // forced reflows when updating
    // https://stackoverflow.com/a/17203046
    this._dataElText = document.createTextNode('');
    this._dataEl.appendChild(this._dataElText);

    this.el.appendChild(this._titleEl);
    this.el.appendChild(this._dataEl);

    this.update = throttle(this.update, 500, this);
  }

  /**
   * Enables the proxying and inspection functionality of
   * this row. Should be implemented by child class.
   */


  _createClass(ARDebugRow, [{
    key: 'enable',
    value: function enable() {
      throw new Error('Implement in child class');
    }

    /**
     * Disables the proxying and inspection functionality of
     * this row. Should be implemented by child class.
     */

  }, {
    key: 'disable',
    value: function disable() {
      throw new Error('Implement in child class');
    }

    /**
     * Returns the ARDebugRow's root element.
     *
     * @return {HTMLElement}
     */

  }, {
    key: 'getElement',
    value: function getElement() {
      return this.el;
    }

    /**
     * Updates the row's value.
     *
     * @param {string} value
     * @param {boolean} isSuccess
     */

  }, {
    key: 'update',
    value: function update(value, isSuccess) {
      this._dataElText.nodeValue = value;
      this._dataEl.style.color = isSuccess ? SUCCESS_COLOR : FAILURE_COLOR;
    }
  }]);

  return ARDebugRow;
}();

/**
 * The ARDebugRow subclass for displaying hit information
 * by wrapping `vrDisplay.hitTest` and displaying the results.
 */


var ARDebugHitTestRow = function (_ARDebugRow) {
  _inherits(ARDebugHitTestRow, _ARDebugRow);

  /**
   * @param {VRDisplay} vrDisplay
   */
  function ARDebugHitTestRow(vrDisplay) {
    _classCallCheck(this, ARDebugHitTestRow);

    var _this = _possibleConstructorReturn(this, (ARDebugHitTestRow.__proto__ || Object.getPrototypeOf(ARDebugHitTestRow)).call(this, 'Hit'));

    _this.vrDisplay = vrDisplay;
    _this._onHitTest = _this._onHitTest.bind(_this);

    // Store the native hit test, or proxy the native `hitTest` call with our own
    _this._nativeHitTest = cachedVRDisplayMethods.get('hitTest') || _this.vrDisplay.hitTest;
    cachedVRDisplayMethods.set('hitTest', _this._nativeHitTest);

    _this._didPreviouslyHit = null;
    return _this;
  }

  /**
   * Enables the tracking of hit test information.
   */


  _createClass(ARDebugHitTestRow, [{
    key: 'enable',
    value: function enable() {
      this.vrDisplay.hitTest = this._onHitTest;
    }

    /**
     * Disables the tracking of hit test information.
     */

  }, {
    key: 'disable',
    value: function disable() {
      this.vrDisplay.hitTest = this._nativeHitTest;
    }

    /**
     * @param {VRHit} hit
     * @return {string}
     */

  }, {
    key: '_hitToString',
    value: function _hitToString(hit) {
      var mm = hit.modelMatrix;
      return mm[12].toFixed(2) + ', ' + mm[13].toFixed(2) + ', ' + mm[14].toFixed(2);
    }

    /**
     * @param {number} x
     * @param {number} y
     * @return {VRHit?}
     */

  }, {
    key: '_onHitTest',
    value: function _onHitTest(x, y) {
      var hits = this._nativeHitTest.call(this.vrDisplay, x, y);

      var t = (parseInt(performance.now(), 10) / 1000).toFixed(1);
      var didHit = hits && hits.length;

      this.update((didHit ? this._hitToString(hits[0]) : 'MISS') + ' @ ' + t + 's', didHit);
      this._didPreviouslyHit = didHit;
      return hits;
    }
  }]);

  return ARDebugHitTestRow;
}(ARDebugRow);

/**
 * The ARDebugRow subclass for displaying pose information
 * by wrapping `vrDisplay.getFrameData` and displaying the results.
 */


var ARDebugPoseRow = function (_ARDebugRow2) {
  _inherits(ARDebugPoseRow, _ARDebugRow2);

  /**
   * @param {VRDisplay} vrDisplay
   */
  function ARDebugPoseRow(vrDisplay) {
    _classCallCheck(this, ARDebugPoseRow);

    var _this2 = _possibleConstructorReturn(this, (ARDebugPoseRow.__proto__ || Object.getPrototypeOf(ARDebugPoseRow)).call(this, 'Pose'));

    _this2.vrDisplay = vrDisplay;
    _this2._onGetFrameData = _this2._onGetFrameData.bind(_this2);

    // Store the native hit test, or proxy the native `hitTest` call with our own
    _this2._nativeGetFrameData = cachedVRDisplayMethods.get('getFrameData') || _this2.vrDisplay.getFrameData;
    cachedVRDisplayMethods.set('getFrameData', _this2._nativeGetFrameData);

    _this2.update('Looking for position...');
    _this2._initialPose = false;
    return _this2;
  }

  /**
   * Enables displaying and pulling getFrameData
   */


  _createClass(ARDebugPoseRow, [{
    key: 'enable',
    value: function enable() {
      this.vrDisplay.getFrameData = this._onGetFrameData;
    }

    /**
     * Disables displaying and pulling getFrameData
     */

  }, {
    key: 'disable',
    value: function disable() {
      this.vrDisplay.getFrameData = this._nativeGetFrameData;
    }

    /**
     * @param {VRPose} pose
     * @return {string}
     */

  }, {
    key: '_poseToString',
    value: function _poseToString(pose) {
      return pose[0].toFixed(2) + ', ' + pose[1].toFixed(2) + ', ' + pose[2].toFixed(2);
    }

    /**
     * Wrapper around getFrameData
     *
     * @param {VRFrameData} frameData
     * @return {boolean}
     */

  }, {
    key: '_onGetFrameData',
    value: function _onGetFrameData(frameData) {
      var results = this._nativeGetFrameData.call(this.vrDisplay, frameData);
      var pose = frameData && frameData.pose && frameData.pose.position;
      // Ensure we have a valid pose; while the pose SHOULD be null when not
      // provided by the VRDisplay, on WebARonARCore, the xyz values of position
      // are all 0 -- mark this as an invalid pose
      var isValidPose = pose && typeof pose[0] === 'number' && typeof pose[1] === 'number' && typeof pose[2] === 'number' && !(pose[0] === 0 && pose[1] === 0 && pose[2] === 0);

      // If we haven't received a pose yet, and still don't have a valid pose
      // leave the message how it is
      if (!this._initialPose && !isValidPose) {
        return results;
      }

      if (isValidPose) {
        this.update(this._poseToString(pose), true);
      } else if (!isValidPose && this._lastPoseValid !== false) {
        this.update('Position lost', false);
      }

      this._lastPoseValid = isValidPose;
      this._initialPose = true;

      return results;
    }
  }]);

  return ARDebugPoseRow;
}(ARDebugRow);

THREE.ARDebug = ARDebug;
exports.default = ARDebug;

/***/ }),
/* 2 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

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

// Reuse the frame data for getting the projection matrix
var frameData = void 0;

/**
 * Class extending a THREE.PerspectiveCamera, attempting
 * to use the projection matrix provided from an AR-enabled
 * VRDisplay. If no AR-enabled VRDisplay found, uses provided
 * parameters.
 */

var ARPerspectiveCamera = function (_THREE$PerspectiveCam) {
  _inherits(ARPerspectiveCamera, _THREE$PerspectiveCam);

  /**
   * @param {VRDisplay} vrDisplay
   * @param {number} fov
   * @param {number} aspect
   * @param {number} near
   * @param {number} far
   */
  function ARPerspectiveCamera(vrDisplay, fov, aspect, near, far) {
    _classCallCheck(this, ARPerspectiveCamera);

    var _this = _possibleConstructorReturn(this, (ARPerspectiveCamera.__proto__ || Object.getPrototypeOf(ARPerspectiveCamera)).call(this, fov, aspect, near, far));

    _this.isARPerpsectiveCamera = true;
    _this.vrDisplay = vrDisplay;
    _this.updateProjectionMatrix();

    if (!vrDisplay || !vrDisplay.capabilities.hasPassThroughCamera) {
      console.warn("ARPerspectiveCamera does not a VRDisplay with\n                    a pass through camera. Using supplied values and defaults\n                    instead of device camera intrinsics");
    }
    return _this;
  }

  /**
   * Updates the underlying `projectionMatrix` property from
   * the AR-enabled VRDisplay, or falls back to
   * THREE.PerspectiveCamera.prototype.updateProjectionMatrix
   */


  _createClass(ARPerspectiveCamera, [{
    key: "updateProjectionMatrix",
    value: function updateProjectionMatrix() {
      var projMatrix = this.getProjectionMatrix();
      if (!projMatrix) {
        _get(ARPerspectiveCamera.prototype.__proto__ || Object.getPrototypeOf(ARPerspectiveCamera.prototype), "updateProjectionMatrix", this).call(this);
        return;
      }

      this.projectionMatrix.fromArray(projMatrix);
    }

    /**
     * Gets the projection matrix from AR-enabled VRDisplay
     * if possible.
     * @return {!Float32Array}
     */

  }, {
    key: "getProjectionMatrix",
    value: function getProjectionMatrix() {
      if (this.vrDisplay && this.vrDisplay.getFrameData) {
        if (!frameData) {
          frameData = new VRFrameData();
        }
        this.vrDisplay.getFrameData(frameData);

        // Can use either left or right projection matrix
        return frameData.leftProjectionMatrix;
      }
      return null;
    }
  }]);

  return ARPerspectiveCamera;
}(THREE.PerspectiveCamera);

THREE.ARPerspectiveCamera = ARPerspectiveCamera;
exports.default = ARPerspectiveCamera;

/***/ }),
/* 3 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _ARUtils = __webpack_require__(0);

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; } /*
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

/**
 * Class for creating a mesh that fires raycasts and lerps
 * a 3D object along the surface
 */
var ARReticle = function (_THREE$Mesh) {
  _inherits(ARReticle, _THREE$Mesh);

  /**
   * @param {VRDisplay} vrDisplay
   * @param {number} innerRadius
   * @param {number} outerRadius
   * @param {number} color
   * @param {number} easing
   */
  function ARReticle(vrDisplay) {
    var innerRadius = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0.02;
    var outerRadius = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 0.05;
    var color = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 0xff0077;
    var easing = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : 0.25;

    _classCallCheck(this, ARReticle);

    var geometry = new THREE.RingGeometry(innerRadius, outerRadius, 36, 64);
    var material = new THREE.MeshBasicMaterial({ color: color });

    // Orient the geometry so it's position is flat on a horizontal surface
    geometry.applyMatrix(new THREE.Matrix4().makeRotationX(THREE.Math.degToRad(-90)));

    var _this = _possibleConstructorReturn(this, (ARReticle.__proto__ || Object.getPrototypeOf(ARReticle)).call(this, geometry, material));

    _this.visible = false;

    _this.easing = easing;
    _this.applyOrientation = true;
    _this.vrDisplay = vrDisplay;
    _this._planeDir = new THREE.Vector3();
    return _this;
  }

  /**
   * Attempt to fire a raycast from normalized screen coordinates
   * x and y and lerp the reticle to the position.
   *
   * @param {number} x
   * @param {number} y
   */


  _createClass(ARReticle, [{
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
        (0, _ARUtils.placeObjectAtHit)(this, hit[0], this.applyOrientation, this.easing);
      }
    }
  }]);

  return ARReticle;
}(THREE.Mesh);

THREE.ARReticle = ARReticle;
exports.default = ARReticle;

/***/ }),
/* 4 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }(); /*
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

var _ARUtils = __webpack_require__(0);

var _arview = __webpack_require__(6);

var _arview2 = _interopRequireDefault(_arview);

var _arview3 = __webpack_require__(5);

var _arview4 = _interopRequireDefault(_arview3);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * Creates and load a shader from a string, type specifies either 'vertex' or 'fragment'
 *
 * @param {WebGLRenderingContext} gl
 * @param {string} str
 * @param {string} type
 * @return {!WebGLShader}
 */
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

/**
 * Creates a shader program from vertex and fragment shader sources
 *
 * @param {WebGLRenderingContext} gl
 * @param {string} vs
 * @param {string} fs
 * @return {!WebGLProgram}
 */
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

/**
 * Calculate the correct orientation depending on the device and the camera
 * orientations.
 *
 * @param {number} screenOrientation
 * @param {number} seeThroughCameraOrientation
 * @return {number}
 */
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

/**
 * Renders the ar camera's video texture
 */

var ARVideoRenderer = function () {
  /**
   * @param {VRDisplay} vrDisplay
   * @param {WebGLRenderingContext} gl
   */
  function ARVideoRenderer(vrDisplay, gl) {
    _classCallCheck(this, ARVideoRenderer);

    this.vrDisplay = vrDisplay;
    this.gl = gl;
    if (this.vrDisplay) {
      this.passThroughCamera = vrDisplay.getPassThroughCamera();
      this.program = getProgram(gl, _arview2.default, _arview4.default);
    }

    gl.useProgram(this.program);

    // Setup a quad
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
    // Precalculate different texture UV coordinates depending on the possible
    // orientations of the device depending if there is a VRDisplay or not
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
    // Store the current combined orientation to check if it has changed
    // during the update calls and use the correct texture coordinates.
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

    // The projection matrix will be based on an identify orthographic camera
    this.projectionMatrix = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
    this.mvMatrix = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
    return this;
  }

  /**
   * Renders the quad
   */


  _createClass(ARVideoRenderer, [{
    key: 'render',
    value: function render() {
      var gl = this.gl;
      gl.useProgram(this.program);
      gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexPositionBuffer);
      gl.enableVertexAttribArray(this.vertexPositionAttribute);
      gl.vertexAttribPointer(this.vertexPositionAttribute, this.vertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);

      gl.bindBuffer(gl.ARRAY_BUFFER, this.textureCoordBuffer);

      // Check the current orientation of the device combined with the
      // orientation of the VRSeeThroughCamera to determine the correct UV
      // coordinates to be used.
      var combinedOrientation = combineOrientations(screen.orientation.angle, this.passThroughCamera.orientation);
      if (combinedOrientation !== this.combinedOrientation) {
        this.combinedOrientation = combinedOrientation;
        gl.bufferData(gl.ARRAY_BUFFER, this.f32TextureCoords[this.combinedOrientation], gl.STATIC_DRAW);
      }
      gl.enableVertexAttribArray(this.textureCoordAttribute);
      gl.vertexAttribPointer(this.textureCoordAttribute, this.textureCoordBuffer.itemSize, gl.FLOAT, false, 0, 0);

      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_EXTERNAL_OES, this.texture);
      // Update the content of the texture in every frame.
      gl.texImage2D(gl.TEXTURE_EXTERNAL_OES, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, this.passThroughCamera);
      gl.uniform1i(this.samplerUniform, 0);

      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);

      gl.drawElements(gl.TRIANGLES, this.indexBuffer.numItems, gl.UNSIGNED_SHORT, 0);

      // Disable enabled states to allow other render calls to correctly work
      gl.bindTexture(gl.TEXTURE_EXTERNAL_OES, null);
      gl.disableVertexAttribArray(this.vertexPositionAttribute);
      gl.disableVertexAttribArray(this.textureCoordAttribute);
      gl.bindBuffer(gl.ARRAY_BUFFER, null);
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
      gl.useProgram(null);
    }
  }]);

  return ARVideoRenderer;
}();

/**
 * A helper class that takes a VRDisplay with AR capabilities
 * and renders the see through camera to the passed in WebGLRenderer's
 * context.
 */


var ARView = function () {
  /**
   * @param {VRDisplay} vrDisplay
   * @param {THREE.WebGLRenderer} renderer
   */
  function ARView(vrDisplay, renderer) {
    _classCallCheck(this, ARView);

    this.vrDisplay = vrDisplay;
    if ((0, _ARUtils.isARKit)(this.vrDisplay)) {
      return;
    }
    this.renderer = renderer;
    this.gl = renderer.context;

    this.videoRenderer = new ARVideoRenderer(vrDisplay, this.gl);
    this.renderer.resetGLState();

    // Cache the width/height so we're not potentially forcing
    // a reflow if there's been a style invalidation
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    window.addEventListener('resize', this.onWindowResize.bind(this), false);
  }

  /**
   * Updates the stored width/height of window on resize.
   */


  _createClass(ARView, [{
    key: 'onWindowResize',
    value: function onWindowResize() {
      this.width = window.innerWidth;
      this.height = window.innerHeight;
    }

    /**
     * Renders the see through camera to the passed in renderer
     */

  }, {
    key: 'render',
    value: function render() {
      if ((0, _ARUtils.isARKit)(this.vrDisplay)) {
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
      this.renderer.resetGLState();
    }
  }]);

  return ARView;
}();

THREE.ARView = ARView;
exports.default = ARView;

/***/ }),
/* 5 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


module.exports = "// Copyright 2017 Google Inc. All Rights Reserved.\n// Licensed under the Apache License, Version 2.0 (the 'License');\n// you may not use this file except in compliance with the License.\n// You may obtain a copy of the License at\n//\n// http://www.apache.org/licenses/LICENSE-2.0\n//\n// Unless required by applicable law or agreed to in writing, software\n// distributed under the License is distributed on an 'AS IS' BASIS,\n// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.\n// See the License for the specific language governing permissions and\n// limitations under the License.\n\n#extension GL_OES_EGL_image_external : require\n\nprecision mediump float;\n#define GLSLIFY 1\n\nvarying vec2 vTextureCoord;\n\nuniform samplerExternalOES uSampler;\n\nvoid main(void) {\n  gl_FragColor = texture2D(uSampler, vTextureCoord);\n}\n";

/***/ }),
/* 6 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


module.exports = "#define GLSLIFY 1\n// Copyright 2017 Google Inc. All Rights Reserved.\n// Licensed under the Apache License, Version 2.0 (the 'License');\n// you may not use this file except in compliance with the License.\n// You may obtain a copy of the License at\n//\n// http://www.apache.org/licenses/LICENSE-2.0\n//\n// Unless required by applicable law or agreed to in writing, software\n// distributed under the License is distributed on an 'AS IS' BASIS,\n// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.\n// See the License for the specific language governing permissions and\n// limitations under the License.\n\nattribute vec3 aVertexPosition;\nattribute vec2 aTextureCoord;\n\nvarying vec2 vTextureCoord;\n\nvoid main(void) {\n  gl_Position = vec4(aVertexPosition, 1.0);\n  vTextureCoord = aTextureCoord;\n}\n";

/***/ }),
/* 7 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var _ARDebug = __webpack_require__(1);

var _ARDebug2 = _interopRequireDefault(_ARDebug);

var _ARPerspectiveCamera = __webpack_require__(2);

var _ARPerspectiveCamera2 = _interopRequireDefault(_ARPerspectiveCamera);

var _ARReticle = __webpack_require__(3);

var _ARReticle2 = _interopRequireDefault(_ARReticle);

var _ARUtils = __webpack_require__(0);

var _ARUtils2 = _interopRequireDefault(_ARUtils);

var _ARView = __webpack_require__(4);

var _ARView2 = _interopRequireDefault(_ARView);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/***/ }),
/* 8 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
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

/**
 * This module contains promisified loaders for internal use for
 * exposed ARUtils.
 */

var noop = function noop() {};

var loadObj = exports.loadObj = function loadObj(objPath, materials) {
  return new Promise(function (resolve, reject) {
    var loader = new THREE.OBJLoader();

    if (materials) {
      loader.setMaterials(materials);
    }

    loader.load(objPath, resolve, noop, reject);
  });
};

var loadMtl = exports.loadMtl = function loadMtl(mtlPath) {
  return new Promise(function (resolve, reject) {
    var loader = new THREE.MTLLoader();
    var pathChunks = mtlPath.split('/');

    if (pathChunks.length >= 2) {
      loader.setTexturePath(pathChunks[pathChunks.length - 2]);
    }

    loader.load(mtlPath, resolve, noop, reject);
  });
};

/***/ })
/******/ ]);