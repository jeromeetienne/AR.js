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

import { placeObjectAtHit } from './ARUtils';

/**
 * Class for creating a mesh that fires raycasts and lerps
 * a 3D object along the surface
 */
class ARReticle extends THREE.Mesh {
  /**
   * @param {VRDisplay} vrDisplay
   * @param {number} innerRadius
   * @param {number} outerRadius
   * @param {number} color
   * @param {number} easing
   */
  constructor(
    vrDisplay,
    innerRadius = 0.02,
    outerRadius = 0.05,
    color = 0xff0077,
    easing = 0.25
  ) {
    const geometry = new THREE.RingGeometry(innerRadius, outerRadius, 36, 64);
    const material = new THREE.MeshBasicMaterial({ color });

    // Orient the geometry so it's position is flat on a horizontal surface
    geometry.applyMatrix(new THREE.Matrix4().makeRotationX(THREE.Math.degToRad(-90)));

    super(geometry, material);
    this.visible = false;

    this.easing = easing;
    this.applyOrientation = true;
    this.vrDisplay = vrDisplay;
    this._planeDir = new THREE.Vector3();
  }

  /**
   * Attempt to fire a raycast from normalized screen coordinates
   * x and y and lerp the reticle to the position.
   *
   * @param {number} x
   * @param {number} y
   */
  update(x = 0.5, y = 0.5) {
    if (!this.vrDisplay || !this.vrDisplay.hitTest) {
      return;
    }

    const hit = this.vrDisplay.hitTest(x, y);
    if (hit && hit.length > 0) {
      this.visible = true;
      placeObjectAtHit(this, hit[0], this.applyOrientation, this.easing);
    }
  }
}

THREE.ARReticle = ARReticle;
export default ARReticle;
