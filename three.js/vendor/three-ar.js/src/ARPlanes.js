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

import {
  DoubleSide,
  Color,
  Object3D,
  RawShaderMaterial,
  Geometry,
  Vector3,
  Face3,
  Mesh,
} from 'three';

import { getRandomPaletteColor } from './ARUtils';
import vertexShader from './shaders/arplanes.vert';
import fragmentShader from './shaders/arplanes.frag';

const DEFAULT_MATERIAL = new RawShaderMaterial({
  side: DoubleSide,
  transparent: true,
  uniforms: {
    dotColor: {
      value: new Color(0xffffff),
    },
    lineColor: {
      value: new Color(0x707070),
    },
    backgroundColor: {
      value: new Color(0x404040),
    },
    dotRadius: {
      value: 0.006666666667,
    },
    alpha: {
      value: 0.4,
    },
  },
  vertexShader,
  fragmentShader,
});

/**
 * The ARDebugRow subclass for displaying planes information
 * by wrapping polling getPlanes, and rendering.
 */
class ARPlanes extends Object3D {
  /**
   * @param {VRDisplay} vrDisplay
   */
  constructor(vrDisplay) {
    super();
    this.vrDisplay = vrDisplay;

    /**
     * @type {Map<number, Mesh>} A Map from plane identifier to plane visualization object.
     */
    this.planes = new Map();

    /**
     * @type {Map<number, Material} A Map from plane identifier to plane material.
     */
    this.materials = new Map();
  }

  /**
   * Add a new plane visualzation based on the given plane object.
   *
   * @param {Object} plane The plane data to use to create the plane.
   */
  addPlane_ = plane => {
    let planeObj = this.createPlane(plane);
    if (planeObj) {
      this.add(planeObj);
      this.planes.set(plane.identifier, planeObj);
    }
  }

  /**
   * Remove a plane by identifier.
   *
   * @param {number} identifier The identifier of the plane to remove.
   */
  removePlane_ = identifier => {
    let existing = this.planes.get(identifier);
    if (existing) {
      this.remove(existing);
    }
    this.planes.delete(identifier);
  }

  /**
   * Respond to a 'planesadded' event by adding the corresponding planes.
   *
   * @param {Object} event The event from the 'planesadded' handler.
   */
  onPlaneAdded_ = event => {
    event.planes.forEach(plane => this.addPlane_(plane));
  }

  /**
   * Respond to a 'planesupdated' event by updating the corresponding planes.
   *
   * @param {Object} event The event from the 'planesupdated' handler.
   */
  onPlaneUpdated_ = event => {
    for (let plane of event.planes) {
      this.removePlane_(plane.identifier);
      this.addPlane_(plane);
    }
  }

  /**
   * Respond to a 'planesremoved' event by removing the corresponding planes.
   * 
   * @param {Object} event The event from 'planesremoved' handler.
   */
  onPlaneRemoved_ = event => {
    for (let plane of event.planes) {
      this.removePlane_(plane.identifier);
    }
  }

  /**
   * Enable the plane visualization.
   */
  enable() {
    this.vrDisplay.getPlanes().forEach(this.addPlane_);

    this.vrDisplay.addEventListener('planesadded', this.onPlaneAdded_);
    this.vrDisplay.addEventListener('planesupdated', this.onPlaneUpdated_);
    this.vrDisplay.addEventListener('planesremoved', this.onPlaneRemoved_);
  }

  /**
   * Disable the plane visualization.
   */
  disable() {
    this.vrDisplay.removeEventListener('planesadded', this.onPlaneAdded_);
    this.vrDisplay.removeEventListener('planesupdated', this.onPlaneUpdated_);
    this.vrDisplay.removeEventListener('planesremoved', this.onPlaneRemoved_);

    for (let identifier of this.planes.keys()) {
      this.removePlane_(identifier);
    }
    this.materials.clear();
  }

  /**
   * Create and add a new plane visualization based on the given plane.
   *
   * @param {Object} plane The plane object from WebARonARKit. 
   * @return {number} The number of planes.
   */
  createPlane(plane) {
    if (plane.vertices.length == 0) {
      return null;
    }

    const geo = new Geometry();
    // generate vertices
    for (let pt = 0; pt < plane.vertices.length / 3; pt++) {
      geo.vertices.push(
        new Vector3(
          plane.vertices[pt * 3],
          plane.vertices[pt * 3 + 1],
          plane.vertices[pt * 3 + 2]
        )
      );
    }

    // generate faces
    for (let face = 0; face < geo.vertices.length - 2; face++) {
      // this makes a triangle fan, from the first +Y point around
      geo.faces.push(new Face3(0, face + 1, face + 2));
    }

    let material;
    if (this.materials.has(plane.identifier)) {
      // If we have a material stored for this plane already, reuse it
      material = this.materials.get(plane.identifier);
    } else {
      // Otherwise, generate a new color, and assign the color to
      // this plane's ID
      const color = getRandomPaletteColor();
      material = DEFAULT_MATERIAL.clone();
      material.uniforms.backgroundColor.value = color;
      this.materials.set(plane.identifier, material);
    }

    const planeObj = new Mesh(geo, material);

    const mm = plane.modelMatrix;
    planeObj.matrixAutoUpdate = false;
    planeObj.matrix.set(
      mm[0],
      mm[4],
      mm[8],
      mm[12],
      mm[1],
      mm[5],
      mm[9],
      mm[13],
      mm[2],
      mm[6],
      mm[10],
      mm[14],
      mm[3],
      mm[7],
      mm[11],
      mm[15]
    );

    this.add(planeObj);
    return planeObj;
  }

  /**
   * Returns the number of planes.
   *
   * @return {number} The number of planes.
   */
  size() {
    return this.planes.size;
  }
}

export default ARPlanes;
