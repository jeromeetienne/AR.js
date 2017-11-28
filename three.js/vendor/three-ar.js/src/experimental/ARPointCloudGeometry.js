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

import { BufferGeometry, BufferAttribute } from 'three';

const MAX_FLOAT32_VALUE = 3.4028e38;

/**
 * Renders a VRPointCloud.
 */
class ARPointCloudGeometry extends BufferGeometry {
  /**
   * @param {VRDisplay} vrDisplay
   * @param {VRPointCloud} pointCloud
   */
  constructor(vrDisplay, pointCloud) {
    super();
    if (!vrDisplay) {
      return;
    }

    this._vrDisplay = vrDisplay;
    this._numberOfPointsInLastPointCloud = 0;
    this._pointCloud = pointCloud || new window.VRPointCloud();

    vrDisplay.getPointCloud(this._pointCloud, false, 0, false);

    const points = this._pointCloud.points;
    const colors = new Float32Array(points.length);

    for (let i = 0; i < points.length; i += 3) {
      points[i] = points[i + 1] = points[i + 2] = MAX_FLOAT32_VALUE;
      colors[i] = colors[i + 1] = colors[i + 2] = 1;
    }

    this._positions = new BufferAttribute(points, 3);
    this.addAttribute('position', this._positions);
    this._colors = new BufferAttribute(colors, 3);
    this.addAttribute('color', this._colors);

    this.computeBoundingSphere();
    this.frustumCulled = false;
  }

  /**
   * @param {boolean} updateGeometry
   */
  update(updateGeometry) {
    if (!this._vrDisplay) {
      return;
    }
    this._vrDisplay.getPointCloud(this._pointCloud, !updateGeometry, 0, true);
    if (this._pointCloud.numberOfPoints > 0) {
      this._positions.needsUpdate = true;
    }
  }

  /**
   * @return {VRPointCloud}
   */
  getPointCloud() {
    return this._pointCloud;
  }
}

if (typeof window !== 'undefined' && typeof window.THREE === 'object') {
  window.THREE.ARPointCloudGeometry = ARPointCloudGeometry;
}
export default ARPointCloudGeometry;
