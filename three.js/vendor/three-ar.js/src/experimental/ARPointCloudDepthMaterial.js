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

import { Color, RawShaderMaterial } from 'three';
import fragmentShader from './shaders/point-cloud-depth.frag';
import vertexShader from './shaders/point-cloud-depth.vert';

const DEFAULT_CONFIG = {
  size: 10.0,
  nearColor: new Color(0xff0000),
  farColor: new Color(0x0000ff),
  range: 5.0,
  useHSVInterpolation: true,
};

/**
 * Class extending a THREE Material to render each point
 * in a VRPointCloud based on depth.
 */
class ARPointCloudDepthMaterial extends RawShaderMaterial {
  /**
   * @param {Object} config
   */
  constructor(config) {
    config = Object.assign({}, DEFAULT_CONFIG, config);
    super({
      vertexShader,
      fragmentShader,
      uniforms: {
        nearColor: {
          value: config.nearColor,
        },
        farColor: {
          value: config.farColor,
        },
        range: {
          value: config.range,
        },
        size: {
          value: config.size,
        },
        useHSVInterpolation: {
          value: config.useHSVInterpolation,
        },
      },
    });

    this.depthWrite = false;
  }
}

if (typeof window !== 'undefined' && typeof window.THREE === 'object') {
  window.THREE.ARPointCloudDepthMaterial = ARPointCloudDepthMaterial;
}
export default ARPointCloudDepthMaterial;
