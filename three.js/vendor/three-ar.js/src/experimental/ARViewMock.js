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

import { Scene, PerspectiveCamera, AxisHelper, GridHelper } from 'three';

/**
 * A helper class that mimics ARView's API to render a scene so that
 * it can be used interchangably with ARView in code to offer easier development
 * on a non-AR device.
 */
class ARViewMock {
  /**
   * @param {THREE.Camera} camera
   */
  constructor(camera) {
    this.scene = new Scene();
    this.camera = camera || new PerspectiveCamera(60,
                                                  window.innerWidth / window.innerHeight,
                                                  0.01,
                                                  100);
    this.axis = new AxisHelper(1);
    this.grid = new GridHelper(20, 20);
    this.scene.add(this.axis);
    this.scene.add(this.grid);
  }

  /**
   * Updates the underlying mesh's orientation if necessary.
   */
  update() {
  }

  /**
   * Renders the see through camera to the passed in renderer
   *
   * @param {THREE.WebGLRenderer} renderer
   */
  render(renderer) {
    renderer.render(this.scene, this.camera);
  }
}

if (typeof window !== 'undefined' && typeof window.THREE === 'object') {
  window.THREE.ARViewMock = ARViewMock;
}
