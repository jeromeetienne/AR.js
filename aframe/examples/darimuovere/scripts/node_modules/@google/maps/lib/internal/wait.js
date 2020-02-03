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

var Task = require('./task');

exports.inject = function(setTimeout, clearTimeout) {
  /**
   * Returns a task that waits for the given delay.
   * @param  {number} delayMs
   * @return {Task<undefined>}
   */
  return function wait(delayMs) {
    return Task.start(function(resolve) {
      var id = setTimeout(resolve, delayMs);
      return function cancel() {
        clearTimeout(id);
      };
    });
  }
};
