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

import ARPlanes from './ARPlanes';

const DEFAULTS = {
  open: true,
  showLastHit: true,
  showPoseStatus: true,
  showPlanes: false,
};

const SUCCESS_COLOR = '#00ff00';
const FAILURE_COLOR = '#ff0077';
const PLANES_POLLING_TIMER = 500;
const THROTTLE_SPEED = 500;

// A cache to store original native VRDisplay methods
// since WebARonARKit does not provide a VRDisplay.prototype[method],
// and assuming the first time ARDebug proxies a method is the
// 'native' version, this caches the correct method if we proxy a method twice
let cachedVRDisplayMethods = new Map();

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
  let lastFired;
  let timeout;

  return (...args) => {
    const current = +new Date();
    let until;

    if (lastFired) {
      until = lastFired + timer - current;
    }

    if (until == undefined || until < 0) {
      lastFired = current;
      fn.apply(scope, args);
    } else if (until >= 0) {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
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
class ARDebug {
  /**
   * @param {VRDisplay} vrDisplay
   * @param {THREE.Scene?} scene
   * @param {Object} config
   * @param {boolean} config.open
   * @param {boolean} config.showLastHit
   * @param {boolean} config.showPoseStatus
   * @param {boolean} config.showPlanes
   */
  constructor(vrDisplay, scene, config) {
    // Make `scene` optional
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
        console.warn('ARDebug `{ showPlanes: true }` option requires ' +
                     'passing in a THREE.Scene as the second parameter ' +
                     'in the constructor.');
      } else {
        this._view.addRow('show-planes', new ARDebugPlanesRow(vrDisplay, scene));
      }
    }
  }

  /**
   * Opens the debug panel.
   */
  open() {
    this._view.open();
  }

  /**
   * Closes the debug panel.
   */
  close() {
    this._view.close();
  }

  /**
   * Returns the root DOM element for the panel.
   *
   * @return {HTMLElement}
   */
  getElement() {
    return this._view.getElement();
  }
}

/**
 * An implementation that interfaces with the DOM, used
 * by ARDebug
 */
class ARDebugView {
  /**
   * @param {Object} config
   * @param {boolean} config.open
   */
  constructor(config = {}) {
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
  toggleControls() {
    if (this._isOpen) {
      this.close();
    } else {
      this.open();
    }
  }

  /**
   * Opens the debugging panel.
   */
  open() {
    // Use max-height with large value to transition
    // to/from a non-specific height (like auto/100%)
    // https://stackoverflow.com/a/8331169
    // @TODO investigate a more complete solution with correct timing,
    // via something like http://n12v.com/css-transition-to-from-auto/
    this._rowsEl.style.maxHeight = '100px';
    this._isOpen = true;
    this._controls.textContent = 'Close ARDebug';
    for (let [, row] of this.rows) {
      row.enable();
    }
  }

  /**
   * Closes the debugging panel.
   */
  close() {
    this._rowsEl.style.maxHeight = '0px';
    this._isOpen = false;
    this._controls.textContent = 'Open ARDebug';
    for (let [, row] of this.rows) {
      row.disable();
    }
  }

  /**
   * Returns the ARDebugView root element.
   *
   * @return {HTMLElement}
   */
  getElement() {
    return this.el;
  }

  /**
   * Adds a row to the ARDebugView.
   *
   * @param {string} id
   * @param {ARDebugRow} row
   */
  addRow(id, row) {
    this.rows.set(id, row);

    if (this._isOpen) {
      row.enable();
    }

    this._rowsEl.appendChild(row.getElement());
  }
}

/**
 * A class that implements features being a row in the ARDebugView.
 */
class ARDebugRow {
  /**
   * @param {string} title
   */
  constructor(title) {
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

    this._throttledWriteToDOM = throttle(this._writeToDOM, THROTTLE_SPEED, this);
  }

  /**
   * Enables the proxying and inspection functionality of
   * this row. Should be implemented by child class.
   */
  enable() {
    throw new Error('Implement in child class');
  }

  /**
   * Disables the proxying and inspection functionality of
   * this row. Should be implemented by child class.
   */
  disable() {
    throw new Error('Implement in child class');
  }

  /**
   * Returns the ARDebugRow's root element.
   *
   * @return {HTMLElement}
   */
  getElement() {
    return this.el;
  }

  /**
   * Updates the row's value. Can be marked to write immediately to render
   * now versus at a throttled rate, for instance on a state change
   * that may be rendered in the future (like slight changes in position).
   *
   * @param {string} value
   * @param {boolean} isSuccess
   * @param {boolean} renderImmediately
   */
  update(value, isSuccess, renderImmediately) {
    if (renderImmediately) {
      this._writeToDOM(value, isSuccess);
    } else {
      this._throttledWriteToDOM(value, isSuccess);
    }
  }

  /**
   * Underlying function called by `update` that does the DOM
   * changes.
   *
   * @param {string} value
   * @param {boolean} isSuccess
   */
  _writeToDOM(value, isSuccess) {
    this._dataElText.nodeValue = value;
    this._dataEl.style.color = isSuccess ? SUCCESS_COLOR : FAILURE_COLOR;
  }
}

/**
 * The ARDebugRow subclass for displaying hit information
 * by wrapping `vrDisplay.hitTest` and displaying the results.
 */
class ARDebugHitTestRow extends ARDebugRow {
  /**
   * @param {VRDisplay} vrDisplay
   */
  constructor(vrDisplay) {
    super('Hit');
    this.vrDisplay = vrDisplay;
    this._onHitTest = this._onHitTest.bind(this);

    // Store the native hit test, or proxy the native `hitTest` call with our own
    this._nativeHitTest = cachedVRDisplayMethods.get('hitTest') || this.vrDisplay.hitTest;
    cachedVRDisplayMethods.set('hitTest', this._nativeHitTest);

    this._didPreviouslyHit = null;
  }

  /**
   * Enables the tracking of hit test information.
   */
  enable() {
    this.vrDisplay.hitTest = this._onHitTest;
  }

  /**
   * Disables the tracking of hit test information.
   */
  disable() {
    this.vrDisplay.hitTest = this._nativeHitTest;
  }

  /**
   * @param {VRHit} hit
   * @return {string}
   */
  _hitToString(hit) {
    const mm = hit.modelMatrix;
    return `${mm[12].toFixed(2)}, ${mm[13].toFixed(2)}, ${mm[14].toFixed(2)}`;
  }

  /**
   * @param {number} x
   * @param {number} y
   * @return {VRHit?}
   */
  _onHitTest(x, y) {
    const hits = this._nativeHitTest.call(this.vrDisplay, x, y);

    const t = (parseInt(performance.now(), 10) / 1000).toFixed(1);
    const didHit = hits && hits.length;
    const value = `${didHit ? this._hitToString(hits[0]) : 'MISS'} @ ${t}s`;

    this.update(value, didHit, didHit !== this._didPreviouslyHit);
    this._didPreviouslyHit = didHit;
    return hits;
  }
}

/**
 * The ARDebugRow subclass for displaying pose information
 * by wrapping `vrDisplay.getFrameData` and displaying the results.
 */
class ARDebugPoseRow extends ARDebugRow {
  /**
   * @param {VRDisplay} vrDisplay
   */
  constructor(vrDisplay) {
    super('Pose');
    this.vrDisplay = vrDisplay;
    this._onGetFrameData = this._onGetFrameData.bind(this);

    // Store the native hit test, or proxy the native `hitTest` call with our own
    this._nativeGetFrameData = cachedVRDisplayMethods.get('getFrameData') ||
                               this.vrDisplay.getFrameData;
    cachedVRDisplayMethods.set('getFrameData', this._nativeGetFrameData);

    this.update('Looking for position...', false, true);
    this._initialPose = false;
  }

  /**
   * Enables displaying and pulling getFrameData
   */
  enable() {
    this.vrDisplay.getFrameData = this._onGetFrameData;
  }

  /**
   * Disables displaying and pulling getFrameData
   */
  disable() {
    this.vrDisplay.getFrameData = this._nativeGetFrameData;
  }

  /**
   * @param {VRPose} pose
   * @return {string}
   */
  _poseToString(pose) {
    return `${pose[0].toFixed(2)}, ${pose[1].toFixed(2)}, ${pose[2].toFixed(2)}`;
  }

  /**
   * Wrapper around getFrameData
   *
   * @param {VRFrameData} frameData
   * @return {boolean}
   */
  _onGetFrameData(frameData) {
    const results = this._nativeGetFrameData.call(this.vrDisplay, frameData);
    const pose = frameData && frameData.pose && frameData.pose.position;
    // Ensure we have a valid pose; while the pose SHOULD be null when not
    // provided by the VRDisplay, on WebARonARCore, the xyz values of position
    // are all 0 -- mark this as an invalid pose
    const isValidPose = pose &&
                        typeof pose[0] === 'number' &&
                        typeof pose[1] === 'number' &&
                        typeof pose[2] === 'number' &&
                        !(pose[0] === 0 && pose[1] === 0 && pose[2] === 0);

    // If we haven't received a pose yet, and still don't have a valid pose
    // leave the message how it is
    if (!this._initialPose && !isValidPose) {
      return results;
    }

    const renderImmediately = isValidPose !== this._lastPoseValid;
    if (isValidPose) {
      this.update(this._poseToString(pose), true, renderImmediately);
    } else if (!isValidPose && this._lastPoseValid !== false) {
      this.update(`Position lost`, false, renderImmediately);
    }

    this._lastPoseValid = isValidPose;
    this._initialPose = true;

    return results;
  }
}

/**
 * The ARDebugRow subclass for displaying planes information
 * by wrapping polling getPlanes, and rendering.
 */
class ARDebugPlanesRow extends ARDebugRow {
  /**
   * @param {VRDisplay} vrDisplay
   * @param {THREE.Scene} scene
   */
  constructor(vrDisplay, scene) {
    super('Planes');
    this.vrDisplay = vrDisplay;
    this.planes = new ARPlanes(this.vrDisplay);
    this._onPoll = this._onPoll.bind(this);
    this.update('Looking for planes...', false, true);
    if (scene) {
      scene.add(this.planes);
    }
  }

  /**
   * Enables displaying and pulling getFrameData
   */
  enable() {
    if (this._timer) {
      this.disable();
    }
    this._timer = setInterval(this._onPoll, PLANES_POLLING_TIMER);

    this.planes.enable();
  }

  /**
   * Disables displaying and pulling getFrameData
   */
  disable() {
    clearInterval(this._timer);
    this._timer = null;

    this.planes.disable();
  }

  /**
   * @param {number} count
   * @return {string}
   */
  _planesToString(count) {
    return `${count} plane${count === 1 ? '' : 's'} found`;
  }

  /**
   * Polling callback while enabled, used to fetch and orchestrate
   * plane rendering.
   */
  _onPoll() {
    const planeCount = this.planes.size();
    // Plane count will change much less often than position or hits;
    // don't even bother throttling to rerender the same information
    // if there are no changes
    if (this._lastPlaneCount !== planeCount) {
      this.update(this._planesToString(planeCount), planeCount > 0, true);
    }
    this._lastPlaneCount = planeCount;
  }
}

export default ARDebug;
