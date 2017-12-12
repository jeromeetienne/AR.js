(function() {


  tracking.LandmarksTracker = function() {
    tracking.LandmarksTracker.base(this, 'constructor');
  }

  tracking.inherits(tracking.LandmarksTracker, tracking.ObjectTracker);

  tracking.LandmarksTracker.prototype.track = function(pixels, width, height) {
	 
    var image = {
      'data': pixels,
      'width': width,
      'height': height
    };

    var classifier = tracking.ViolaJones.classifiers['face'];

    var faces = tracking.ViolaJones.detect(pixels, width, height, 
      this.getInitialScale(), this.getScaleFactor(), this.getStepSize(), 
      this.getEdgesDensity(), classifier);

    var landmarks = tracking.LBF.align(pixels, width, height, faces);

    this.emit('track', {
      'data': {
        'faces' : faces,
        'landmarks' : landmarks
      }
    });

  }

}());
