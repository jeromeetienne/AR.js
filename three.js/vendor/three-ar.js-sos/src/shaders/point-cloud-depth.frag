// Copyright 2017 Google Inc. All Rights Reserved.
// Licensed under the Apache License, Version 2.0 (the 'License');
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an 'AS IS' BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

precision mediump float;
precision mediump int;

varying float zDepth;
uniform vec3 nearColor;
uniform vec3 farColor;
uniform float range;
uniform bool useHSVInterpolation;

#pragma glslify: rgb2hsv = require(glsl-y-hsv/rgb2hsv)
#pragma glslify: lerpHSV = require(glsl-y-hsv/lerpHSV)
#pragma glslify: hsv2rgb = require(glsl-y-hsv/hsv2rgb)
#pragma glslify: map = require(./map.glsl)

void main() {
  float dist = clamp(map(zDepth, 0.0, range, 0.0, 1.0), 0.0, 1.0);
  if (useHSVInterpolation == true) {
    gl_FragColor = vec4(hsv2rgb(lerpHSV(rgb2hsv(nearColor), rgb2hsv(farColor), dist)), 1.0);
  }
  else {
    gl_FragColor = vec4(mix(nearColor, farColor, dist), 1.0);
  }
}
