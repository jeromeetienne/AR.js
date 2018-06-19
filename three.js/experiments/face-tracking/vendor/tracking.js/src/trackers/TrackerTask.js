(function() {
  /**
   * TrackerTask utility.
   * @constructor
   * @extends {tracking.EventEmitter}
   */
  tracking.TrackerTask = function(tracker) {
    tracking.TrackerTask.base(this, 'constructor');

    if (!tracker) {
      throw new Error('Tracker instance not specified.');
    }

    this.setTracker(tracker);
  };

  tracking.inherits(tracking.TrackerTask, tracking.EventEmitter);

  /**
   * Holds the tracker instance managed by this task.
   * @type {tracking.Tracker}
   * @private
   */
  tracking.TrackerTask.prototype.tracker_ = null;

  /**
   * Holds if the tracker task is in running.
   * @type {boolean}
   * @private
   */
  tracking.TrackerTask.prototype.running_ = false;

  /**
   * Gets the tracker instance managed by this task.
   * @return {tracking.Tracker}
   */
  tracking.TrackerTask.prototype.getTracker = function() {
    return this.tracker_;
  };

  /**
   * Returns true if the tracker task is in running, false otherwise.
   * @return {boolean}
   * @private
   */
  tracking.TrackerTask.prototype.inRunning = function() {
    return this.running_;
  };

  /**
   * Sets if the tracker task is in running.
   * @param {boolean} running
   * @private
   */
  tracking.TrackerTask.prototype.setRunning = function(running) {
    this.running_ = running;
  };

  /**
   * Sets the tracker instance managed by this task.
   * @return {tracking.Tracker}
   */
  tracking.TrackerTask.prototype.setTracker = function(tracker) {
    this.tracker_ = tracker;
  };

  /**
   * Emits a `run` event on the tracker task for the implementers to run any
   * child action, e.g. `requestAnimationFrame`.
   * @return {object} Returns itself, so calls can be chained.
   */
  tracking.TrackerTask.prototype.run = function() {
    var self = this;

    if (this.inRunning()) {
      return;
    }

    this.setRunning(true);
    this.reemitTrackEvent_ = function(event) {
      self.emit('track', event);
    };
    this.tracker_.on('track', this.reemitTrackEvent_);
    this.emit('run');
    return this;
  };

  /**
   * Emits a `stop` event on the tracker task for the implementers to stop any
   * child action being done, e.g. `requestAnimationFrame`.
   * @return {object} Returns itself, so calls can be chained.
   */
  tracking.TrackerTask.prototype.stop = function() {
    if (!this.inRunning()) {
      return;
    }

    this.setRunning(false);
    this.emit('stop');
    this.tracker_.removeListener('track', this.reemitTrackEvent_);
    return this;
  };
}());
