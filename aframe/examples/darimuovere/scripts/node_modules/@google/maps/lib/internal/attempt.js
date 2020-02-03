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

exports.inject = function(wait) {
  var Task = require('./task');

  return {
    /**
     * Repeatedly calls the 'do' function, until its result passes the 'until'
     * predicate, or timeout. The 'do' function is retried with exponential
     * backoff.
     *
     * @param {function(): Task<T>} options.do Starts the task to try
     *     repeatedly.
     * @param {function(T): boolean} options.until A predicate that checks
     *     whether the result of options.do was successful.
     * @return {Task<T>}
     * @template T
     */
    attempt: function(options) {
      var doSomething = options['do'];
      var isSuccessful = options.until;
      var interval = options.interval || 500;
      var increment = options.increment || 1.5;
      var jitter = options.jitter || 0.5;

      return Task.withValue().thenDo(function loop() {
        return doSomething().thenDo(function(result) {
          if (isSuccessful(result)) {
            return Task.withValue(result);
          }

          var delay = interval * (1 + jitter * (2 * Math.random() - 1));
          interval *= increment;
          return wait(delay).thenDo(loop);
        });
      });
    }
  };
};
