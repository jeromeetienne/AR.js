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

var CircularBuffer = require('./circular-buffer');
var Task = require('./task');

exports.inject = function(wait, getTime) {
  return {
    /**
     * Creates a ThrottledQueue. The queue stores tasks, which will be executed
     * asynchronously, at a controlled rate.
     *
     * @param {number} limit The maximum number of tasks that can be executed
     *     over one period.
     * @param {number} period The time period (ms) over which limit is
     *     enforceable.
     * @return {ThrottledQueue}
     */
    create: function(limit, period) {
      var me = {};
      var queue = Task.withValue();
      var recentTimes = CircularBuffer.create(limit);

      /**
       * Adds a task to the work queue.
       *
       * @param {function(): Task<T>} doSomething Starts the task. This function
       *     will be called when the rate limit allows.
       * @return {Task<T>} The delayed task.
       * @template T
       */
      me.add = function(doSomething) {
        // Return a separate task from the queue, so that cancelling a task
        // doesn't propagate back and cancel the whole queue.
        var waitForMyTurn = Task
            .start(function(resolve) {
              queue.finally(resolve);
            })
            .thenDo(function() {
              var lastTime = recentTimes.item(limit - 1);
              if (lastTime == undefined) return;
              return wait(Math.max(lastTime + period - getTime(), 0));
            })
            .thenDo(function() {
              recentTimes.insert(getTime());
            });

        queue = queue.thenDo(function() {
          return Task.start(function(resolve) {
            waitForMyTurn.finally(resolve);
          });
        });

        return waitForMyTurn.thenDo(doSomething);
      };

      return me;
    }
  };
};
