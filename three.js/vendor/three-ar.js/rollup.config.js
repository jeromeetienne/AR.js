/*
 * Copyright 2016 Google Inc. All Rights Reserved.
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

const fs = require('fs');
const path = require('path');
const rollup = require('rollup');
const commonjs = require('rollup-plugin-commonjs');
const resolve = require('rollup-plugin-node-resolve');
const cleanup = require('rollup-plugin-cleanup');
const babel = require('rollup-plugin-babel');
const glsl = require('rollup-plugin-glsl');
const uglify = require('rollup-plugin-uglify');
const globals = require('rollup-plugin-node-globals');
const banner = fs.readFileSync(path.join(__dirname, 'licenses.txt'));

export default {
  input: 'src/index.js',
  external: ['three'],
  output: {
    file: './dist/three.ar.js',
    format: 'umd',
    name: 'three-ar',
  },
  globals: {
    'three': 'THREE',
  },
  watch: {
    include: 'src/**',
  },
  banner: banner,
  plugins: [
    glsl({
      // TODO require glsl/frag/vert extension
      include: 'src/shaders/*',
      sourceMap: false,
    }),
    babel({
      plugins: ['external-helpers'],
      exclude: 'node_modules/**',
    }),
    globals(),
    resolve(),
    commonjs(),
    cleanup(),
  ],
};
