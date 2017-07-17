(function() {
  /**
   * Tracker utility.
   * @constructor
   * @extends {tracking.EventEmitter}
   */
  tracking.Tracker = function() {
    tracking.Tracker.base(this, 'constructor');
  };

  tracking.inherits(tracking.Tracker, tracking.EventEmitter);

  /**
   * Tracks the pixels on the array. This method is called for each video
   * frame in order to emit `track` event.
   * @param {Uint8ClampedArray} pixels The pixels data to track.
   * @param {number} width The pixels canvas width.
   * @param {number} height The pixels canvas height.
   */
  tracking.Tracker.prototype.track = function() {};
}());
