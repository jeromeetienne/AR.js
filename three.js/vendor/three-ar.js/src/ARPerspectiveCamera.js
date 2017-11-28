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

import { PerspectiveCamera } from 'three';

// Reuse the frame data for getting the projection matrix
let frameData;

/**
 * Class extending a PerspectiveCamera, attempting
 * to use the projection matrix provided from an AR-enabled
 * VRDisplay. If no AR-enabled VRDisplay found, uses provided
 * parameters.
 */
class ARPerspectiveCamera extends PerspectiveCamera {
  /**
   * @param {VRDisplay} vrDisplay
   * @param {number} fov
   * @param {number} aspect
   * @param {number} near
   * @param {number} far
   */
  constructor(vrDisplay, fov, aspect, near, far) {
    super(fov, aspect, near, far);
    this.isARPerpsectiveCamera = true;
    this.vrDisplay = vrDisplay;
    this.updateProjectionMatrix();

    if (!vrDisplay || !vrDisplay.capabilities.hasPassThroughCamera) {
      console.warn(`ARPerspectiveCamera does not a VRDisplay with
                    a pass through camera. Using supplied values and defaults
                    instead of device camera intrinsics`);
    }
  }

  /**
   * Updates the underlying `projectionMatrix` property from
   * the AR-enabled VRDisplay, or falls back to
   * THREE.PerspectiveCamera.prototype.updateProjectionMatrix
   */
  updateProjectionMatrix() {
    const projMatrix = this.getProjectionMatrix();
    if (!projMatrix) {
      super.updateProjectionMatrix();
      return;
    }

    this.projectionMatrix.fromArray(projMatrix);
  }

  /**
   * Gets the projection matrix from AR-enabled VRDisplay
   * if possible.
   * @return {!Float32Array}
   */
  getProjectionMatrix() {
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
}

export default ARPerspectiveCamera;
