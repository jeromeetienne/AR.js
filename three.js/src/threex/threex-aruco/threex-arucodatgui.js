var THREEx	= THREEx || {};


//////////////////////////////////////////////////////////////////////////////
//		monkey patch AR.Detector
//////////////////////////////////////////////////////////////////////////////

AR.Detector.prototype.detect = function(image){
	var opts = this.datGUIOptions

        CV.grayscale(image, this.grey);
        CV.adaptiveThreshold(this.grey, this.thres, opts.adaptativeThreshold.kernelSize, opts.adaptativeThreshold.threshold);
        
        this.contours = CV.findContours(this.thres, this.binary);
        
        this.candidates = this.findCandidates(this.contours, image.width * opts.candidates.minSize, opts.candidates.epsilon, opts.candidates.minLength);
        this.candidates = this.clockwiseCorners(this.candidates);
        this.candidates = this.notTooNear(this.candidates, opts.notTooNear.minDist);
        
        return this.findMarkers(this.grey, this.candidates, opts.findMarkers.warpSize);
};

// make names explicits - make unit explicit too
AR.Detector.prototype.datGUIOptions = {
	adaptativeThreshold : {
		kernelSize: 2,
		threshold: 7,
	},
	candidates: {
		minSize: 0.20,
		epsilon: 0.05,
		minLength: 10,
	},
	notTooNear : {
		minDist: 10,
	},
	findMarkers : {
		warpSize: 49,
	}
}

// see https://github.com/jeromeetienne/threex.geometricglow/blob/master/threex.atmospherematerialdatgui.js

THREEx.addArucoDatGui	= function(arucoContext, datGui){
	var datGUIOptions = arucoContext.detector.datGUIOptions
	var options  = {
		resolution: '640x480',
	}
	var onChange = function(){
		// honor option resolution
		var matches = options.resolution.match(/(\d+)x(\d+)/)
		var width = parseInt(matches[1])
		var height = parseInt(matches[2])
		arucoContext.setSize(width, height)
	}
	onChange();

	datGui.add( options, 'resolution', [ '320x240', '640x480' ]).onChange( onChange )
	
	var folder = datGui.addFolder('Adaptative Threshold')
	folder.open()
	folder.add( arucoContext.detector.datGUIOptions.adaptativeThreshold, 'kernelSize').min(0).step(1)
		.onChange( onChange )
	folder.add( arucoContext.detector.datGUIOptions.adaptativeThreshold, 'threshold').min(0).step(1)
		.onChange( onChange )
	
	var folder = datGui.addFolder('Candidates')
	folder.open()
	folder.add( arucoContext.detector.datGUIOptions.candidates, 'minSize').min(0).max(1)
		.onChange( onChange )
	folder.add( arucoContext.detector.datGUIOptions.candidates, 'epsilon').min(0)
		.onChange( onChange )
	folder.add( arucoContext.detector.datGUIOptions.candidates, 'minLength').min(0).step(1)
		.onChange( onChange )

	var folder = datGui.addFolder('notTooNear')
	folder.open()
	folder.add( arucoContext.detector.datGUIOptions.notTooNear, 'minDist').min(0).step(1)
		.onChange( onChange )
		
	var folder = datGui.addFolder('findMarkers')
	folder.open()
	folder.add( arucoContext.detector.datGUIOptions.findMarkers, 'warpSize').min(0).step(1)
		.onChange( onChange )
}
