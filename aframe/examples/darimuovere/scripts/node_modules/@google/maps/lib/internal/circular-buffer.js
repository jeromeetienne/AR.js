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

exports.create = function(size) {
  var items = [];
  var current = 0;

  return {
    /**
     * Inserts an item into the circular buffer. The new item will have index 0,
     * and all other items will have their index incremented.
     */
    insert: function(item) {
      current = (current + 1) % size;
      items[current] = item;
    },
    /**
     * Returns the i-th item from the buffer. i=0 is the most-recently-inserted
     * item. i=1 is the second-most-recently-inserted item. Returns undefined if
     * i+1 items have not yet been inserted.
     */
    item: function(i) {
      return items[(current - i + size) % size];
    }
  };
};
