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

// This is a utility class that makes it easier to work with asynchronous tasks.
// Here's why I don't just use Promises:
// (a) I don't want to depend on a Promise implementation.
// (b) Promises aren't cancellable (yet?), and I want cancellability.
//
// This is very stripped down, compared to Promises.
// (a) You can only call .thenDo() once. Because there's only one party waiting
//     on the result of a task, cancelling always propagates backwards.
// (b) The argument to .thenDo() must return either undefined or a Task. I don't
//     promote values to Tasks, like what happens with Promises.

var Task = exports;

/**
 * Creates a Task.
 *
 * The `doSomething` function is called immediately, so that it can start
 * whatever work is part of this task.
 *
 * The `doSomething` function is given a resolve function and a reject function,
 * and it should call one of them when the task is finished, to report its
 * result.
 *
 * The `doSomething` function can optionally return a cancel function. This will
 * be called if the task is cancelled.
 *
 * @param  {function(function(T), function(?)): function()} doSomething
 * @return {Task<T>}
 * @template T
 */
Task.start = function(doSomething) {
  var me = {};

  // onFinish should be called as soon as both finished and onFinish are
  // defined. It should be called by the piece of code that just defined either
  // finished or onFinish.
  var finished;
  var onFinish;
  var cleaners = [];

  function finish(err, result) {
    if (!finished) {
      finished = {err: err, result: result};

      if (onFinish) {
        onFinish();
        // To prevent memory leaks, delete our reference to onFinish after
        // calling it.
        onFinish = function() {};
      }

      var cleanup;
      while (cleanup = cleaners.pop()) {
        cleanup();
      }

      if (err === 'cancelled') {
        if (abort) abort();
      }

      abort = null;
    }
  }

  try {
    // doSomething must be called immediately.
    var abort = doSomething(
        function(result) { finish(null, result); },
        function(err)    { finish(err,  null);   });
  } catch (err) {
    finish(err, null);
  }

  /**
   * Cancels the task (unless the task has already finished, in which case
   * this call is ignored).
   *
   * Subsequent tasks created with #thenDo will not be started. However, clean-
   * up code added with #finished will run.
   */
  me.cancel = function() {
    finish('cancelled', null);
  };

  /**
   * Sets the listener that will be called with the result of this task, when
   * finished. This function can be called at most once.
   *
   * @param {function(?, T)} callback
   */
  function setListener(callback) {
    if (onFinish) {
      throw new Error('thenDo/finally called more than once');
    }
    if (finished) {
      onFinish = function() {};
      callback(finished.err, finished.result);
    } else {
      onFinish = function() {
        callback(finished.err, finished.result);
      };
    }
  }

  /**
   * Creates and returns a composite task, consisting of this task and a
   * subsequent task.
   *
   * @param {function(T): ?Task<U>} onResolve A function that will
   *     create a subsequent task. This function will be called
   *     asynchronously, with the result of this task, when it
   *     finishes. The return value must be a Task, or null/undefined.
   * @param {function(?): ?Task<U>} onReject A function that will
   *     create a subsequent task. This function will be called
   *     asynchronously, with the error produced by this task, when it
   *     finishes. The return value must be a Task, or null/undefined.
   * @return {Task<U>} The composite task. Cancelling the composite task cancels
   *     either this task or the subsequent task, depending on whether this
   *     task is finished.
   * @template U
   */
  me.thenDo = function(onResolve, onReject) {
    return compose(me, setListener, onResolve, onReject);
  };

  /**
   * Registers a cleanup function, that will be run when the task finishes,
   * regardless of error or cancellation.
   *
   * @param {function()} cleanup
   * @return {THIS}
   */
  me.finally = function(cleanup) {
    if (!finished) {
      cleaners.push(function() {
        process.nextTick(cleanup);
      });
    } else {
      process.nextTick(cleanup);
    }
    return me;
  };

  return me;
};

/**
 * Creates a Task with the given result.
 */
Task.withValue = function(result) {
  return Task.start(function(resolve) {
    resolve(result);
  });
};

/**
 * Creates a Task with the given error.
 */
Task.withError = function(err) {
  return Task.start(function(resolve, reject) {
    reject(err);
  });
};

/**
 * Returns a new task that races the given tasks. Eventually finishes with the
 * result or error of whichever task finishes first. If any task is cancelled,
 * all of the tasks are cancelled.
 *
 * @param {Array<Task<T>>} tasks
 * @return {Task<T>}
 * @template T
 */
Task.race = function(tasks) {
  return Task.start(function(resolve, reject) {
    function cancelAll() {
      tasks.forEach(function(task) {
        task.cancel();
      });
    }
    tasks.forEach(function(task) {
      task.finally(cancelAll).thenDo(resolve, reject);
    });
    return cancelAll;
  });
};

/**
 * Creates a composite task, which uses the output of the first task to create
 * a subsequent task, and represents the two tasks together.
 *
 * This function is internal-only. It is used by Task.thenDo().
 *
 * @param {Task<T>} firstTask
 * @param {function(function(?, T))} whenFirstTaskFinishes The private
 *     setListener method on the firstTask.
 * @param {function(T): Task<U>} onResolve
 * @param {function(?): Task<U>} onReject
 * @return {Task<U>}
 * @template T, U
 */
function compose(firstTask, whenFirstTaskFinishes, onResolve, onReject) {
  return Task.start(function(resolve, reject) {
    var cancelled;
    var currentTask = firstTask;

    whenFirstTaskFinishes(function(err, result) {
      currentTask = null;
      // createSubsequentTask must be called asynchronously.
      process.nextTick(function() {
        if (cancelled || err === 'cancelled') {
          return reject('cancelled');
        }

        // Start the subsequent task.
        if (err == null) {
          if (!onResolve) {
            return resolve(result);
          }
          try {
            currentTask = onResolve(result);
          } catch (caughtErr) {
            return reject(caughtErr);
          }
        } else {
          if (!onReject) {
            return reject(err);
          }
          try {
            currentTask = onReject(err);
          } catch (caughtErr) {
            return reject(caughtErr);
          }
        }

        // Was a subsequent task returned?
        if (!currentTask) {
          return resolve(undefined);
        }

        currentTask.thenDo(resolve, reject);
      });
    });

    return function cancelCompositeTask() {
      cancelled = true;
      if (currentTask) {
        currentTask.cancel();
      }
    };
  });
}
