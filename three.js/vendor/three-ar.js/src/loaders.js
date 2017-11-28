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

const noop = function() {};

// remaps opacity from 0 to 1
const opacityRemap = function(mat) {
  if (mat.opacity === 0) {
    mat.opacity = 1;
  }
};

export const loadObj = (objPath, materialCreator, OBJLoader) => new Promise((resolve, reject) => {
  const loader = new OBJLoader();

  if (materialCreator) {
    Object.keys(materialCreator.materials).forEach(k => opacityRemap(materialCreator.materials[k]));
    loader.setMaterials(materialCreator);
  }

  loader.load(objPath, resolve, noop, reject);
});

export const loadMtl = (mtlPath, MTLLoader) => new Promise((resolve, reject) => {
  const loader = new MTLLoader();

  loader.setTexturePath(mtlPath.substr(0, mtlPath.lastIndexOf('/') + 1));
  // remaps ka, kd, & ks values of 0,0,0 -> 1,1,1
  loader.setMaterialOptions({ ignoreZeroRGBs: true });

  loader.load(mtlPath, resolve, noop, reject);
});
