(function(window, undefined) {
  window.tracking = window.tracking || {};

  /**
   * Inherit the prototype methods from one constructor into another.
   *
   * Usage:
   * <pre>
   * function ParentClass(a, b) { }
   * ParentClass.prototype.foo = function(a) { }
   *
   * function ChildClass(a, b, c) {
   *   tracking.base(this, a, b);
   * }
   * tracking.inherits(ChildClass, ParentClass);
   *
   * var child = new ChildClass('a', 'b', 'c');
   * child.foo();
   * </pre>
   *
   * @param {Function} childCtor Child class.
   * @param {Function} parentCtor Parent class.
   */
  tracking.inherits = function(childCtor, parentCtor) {
    function TempCtor() {
    }
    TempCtor.prototype = parentCtor.prototype;
    childCtor.superClass_ = parentCtor.prototype;
    childCtor.prototype = new TempCtor();
    childCtor.prototype.constructor = childCtor;

    /**
     * Calls superclass constructor/method.
     *
     * This function is only available if you use tracking.inherits to express
     * inheritance relationships between classes.
     *
     * @param {!object} me Should always be "this".
     * @param {string} methodName The method name to call. Calling superclass
     *     constructor can be done with the special string 'constructor'.
     * @param {...*} var_args The arguments to pass to superclass
     *     method/constructor.
     * @return {*} The return value of the superclass method/constructor.
     */
    childCtor.base = function(me, methodName) {
      var args = Array.prototype.slice.call(arguments, 2);
      return parentCtor.prototype[methodName].apply(me, args);
    };
  };

  /**
   * Captures the user camera when tracking a video element and set its source
   * to the camera stream.
   * @param {HTMLVideoElement} element Canvas element to track.
   * @param {object} opt_options Optional configuration to the tracker.
   */
  tracking.initUserMedia_ = function(element, opt_options) {
    window.navigator.mediaDevices.getUserMedia({
      video: true,
      audio: (opt_options && opt_options.audio) ? true : false,
    }).then(function(stream) {
      element.srcObject = stream;
    }).catch(function(err) {
      throw Error('Cannot capture user camera.');
    });
  };

  /**
   * Tests whether the object is a dom node.
   * @param {object} o Object to be tested.
   * @return {boolean} True if the object is a dom node.
   */
  tracking.isNode = function(o) {
    return o.nodeType || this.isWindow(o);
  };

  /**
   * Tests whether the object is the `window` object.
   * @param {object} o Object to be tested.
   * @return {boolean} True if the object is the `window` object.
   */
  tracking.isWindow = function(o) {
    return !!(o && o.alert && o.document);
  };

  /**
   * Selects a dom node from a CSS3 selector using `document.querySelector`.
   * @param {string} selector
   * @param {object} opt_element The root element for the query. When not
   *     specified `document` is used as root element.
   * @return {HTMLElement} The first dom element that matches to the selector.
   *     If not found, returns `null`.
   */
  tracking.one = function(selector, opt_element) {
    if (this.isNode(selector)) {
      return selector;
    }
    return (opt_element || document).querySelector(selector);
  };

  /**
   * Tracks a canvas, image or video element based on the specified `tracker`
   * instance. This method extract the pixel information of the input element
   * to pass to the `tracker` instance. When tracking a video, the
   * `tracker.track(pixels, width, height)` will be in a
   * `requestAnimationFrame` loop in order to track all video frames.
   *
   * Example:
   * var tracker = new tracking.ColorTracker();
   *
   * tracking.track('#video', tracker);
   * or
   * tracking.track('#video', tracker, { camera: true });
   *
   * tracker.on('track', function(event) {
   *   // console.log(event.data[0].x, event.data[0].y)
   * });
   *
   * @param {HTMLElement} element The element to track, canvas, image or
   *     video.
   * @param {tracking.Tracker} tracker The tracker instance used to track the
   *     element.
   * @param {object} opt_options Optional configuration to the tracker.
   */
  tracking.track = function(element, tracker, opt_options) {
    element = tracking.one(element);
    if (!element) {
      throw new Error('Element not found, try a different element or selector.');
    }
    if (!tracker) {
      throw new Error('Tracker not specified, try `tracking.track(element, new tracking.FaceTracker())`.');
    }

    switch (element.nodeName.toLowerCase()) {
      case 'canvas':
        return this.trackCanvas_(element, tracker, opt_options);
      case 'img':
        return this.trackImg_(element, tracker, opt_options);
      case 'video':
        if (opt_options) {
          if (opt_options.camera) {
            this.initUserMedia_(element, opt_options);
          }
        }
        return this.trackVideo_(element, tracker, opt_options);
      default:
        throw new Error('Element not supported, try in a canvas, img, or video.');
    }
  };

  /**
   * Tracks a canvas element based on the specified `tracker` instance and
   * returns a `TrackerTask` for this track.
   * @param {HTMLCanvasElement} element Canvas element to track.
   * @param {tracking.Tracker} tracker The tracker instance used to track the
   *     element.
   * @param {object} opt_options Optional configuration to the tracker.
   * @return {tracking.TrackerTask}
   * @private
   */
  tracking.trackCanvas_ = function(element, tracker) {
    var self = this;
    var task = new tracking.TrackerTask(tracker);
    task.on('run', function() {
      self.trackCanvasInternal_(element, tracker);
    });
    return task.run();
  };

  /**
   * Tracks a canvas element based on the specified `tracker` instance. This
   * method extract the pixel information of the input element to pass to the
   * `tracker` instance.
   * @param {HTMLCanvasElement} element Canvas element to track.
   * @param {tracking.Tracker} tracker The tracker instance used to track the
   *     element.
   * @param {object} opt_options Optional configuration to the tracker.
   * @private
   */
  tracking.trackCanvasInternal_ = function(element, tracker) {
    var width = element.width;
    var height = element.height;
    var context = element.getContext('2d');
    var imageData = context.getImageData(0, 0, width, height);
    tracker.track(imageData.data, width, height);
  };

  /**
   * Tracks a image element based on the specified `tracker` instance. This
   * method extract the pixel information of the input element to pass to the
   * `tracker` instance.
   * @param {HTMLImageElement} element Canvas element to track.
   * @param {tracking.Tracker} tracker The tracker instance used to track the
   *     element.
   * @param {object} opt_options Optional configuration to the tracker.
   * @private
   */
  tracking.trackImg_ = function(element, tracker) {
    var width = element.width;
    var height = element.height;
    var canvas = document.createElement('canvas');

    canvas.width = width;
    canvas.height = height;

    var task = new tracking.TrackerTask(tracker);
    task.on('run', function() {
      tracking.Canvas.loadImage(canvas, element.src, 0, 0, width, height, function() {
        tracking.trackCanvasInternal_(canvas, tracker);
      });
    });
    return task.run();
  };

  /**
   * Tracks a video element based on the specified `tracker` instance. This
   * method extract the pixel information of the input element to pass to the
   * `tracker` instance. The `tracker.track(pixels, width, height)` will be in
   * a `requestAnimationFrame` loop in order to track all video frames.
   * @param {HTMLVideoElement} element Canvas element to track.
   * @param {tracking.Tracker} tracker The tracker instance used to track the
   *     element.
   * @param {object} opt_options Optional configuration to the tracker.
   * @private
   */
  tracking.trackVideo_ = function(element, tracker) {
    var canvas = document.createElement('canvas');
    var context = canvas.getContext('2d');
    var width;
    var height;


// FIXME here the video display size of the analysed size
    var resizeCanvas_ = function() {
      width = element.offsetWidth;
      height = element.offsetHeight;
      canvas.width = width;
      canvas.height = height;
    };
    resizeCanvas_();
    element.addEventListener('resize', resizeCanvas_);


// FIXME: do a process function - it is up to the caller to handle the frequency of detection
// it seems all handled in the tracking.TrackerTask..
// so in short, remove the tracking.TrackerTask from here
// if the user want to use it, it can create it himself
    var requestId;
    var requestAnimationFrame_ = function() {
      requestId = window.requestAnimationFrame(function() {
        if (element.readyState === element.HAVE_ENOUGH_DATA) {
          try {
            // Firefox v~30.0 gets confused with the video readyState firing an
            // erroneous HAVE_ENOUGH_DATA just before HAVE_CURRENT_DATA state,
            // hence keep trying to read it until resolved.
            context.drawImage(element, 0, 0, width, height);
          } catch (err) {}
          tracking.trackCanvasInternal_(canvas, tracker);
        }
        requestAnimationFrame_();
      });
    };

    var task = new tracking.TrackerTask(tracker);
    task.on('stop', function() {
      window.cancelAnimationFrame(requestId);
    });
    task.on('run', function() {
      requestAnimationFrame_();
    });
    return task.run();
  };

  // Browser polyfills
  //===================

  if (!window.URL) {
    window.URL = window.URL || window.webkitURL || window.msURL || window.oURL;
  }

  if (!navigator.getUserMedia) {
    navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia ||
    navigator.mozGetUserMedia || navigator.msGetUserMedia;
  }
}(window));
