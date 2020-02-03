/**
 * @license
 * Copyright 2016 Google Inc. All Rights Reserved.
 *
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

exports.parseArgs = function(argv) {
  var parsed = {};
  var argv = argv || process.argv.slice(2);
  for (var i = 0; i < argv.length; i += 2) {
    var value = argv[i + 1];
    try {
      value = JSON.parse(value);
    } catch (e) {
    }
    var field = argv[i].replace(/^-*/g, '');
    var existing = parsed[field];
    if (Array.isArray(existing)) {
      value = existing.concat(value);
    } else if (existing != undefined) {
      value = [existing, value];
    }
    parsed[field] = value;
  }
  return parsed;
};

exports.callback = function(error, response) {
  if (error) {
    console.log("Error:", error.message != undefined ? error.message : error);
  } else {
    console.log(JSON.stringify(response.json, null, 4));
  }
};
