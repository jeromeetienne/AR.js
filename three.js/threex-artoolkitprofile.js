var THREEx = THREEx || {}

/**
 * TODO
 * - .setMarkerHiro()
 * - .setMarkerKanji()
 * - .setSourceWebcam()
 * - .setSourceVideo(url)
 * - .setSourceImage(url)
 * - .setPerformance()
 */

THREEx.ArToolkitProfile = function(label){
	if( label === 'guess' )	label = this._guessLabel()
	
	this.reset()
	this.setProfile(label)
}

THREEx.ArToolkitProfile.prototype.reset = function () {
	this.sourceParameters = {}
	this.contextParameters = {}
	this.defaultMarkerParameters = {}
};

THREEx.ArToolkitProfile.prototype._guessLabel = function () {
	// TODO implement this
	return 'desktop'
};

THREEx.ArToolkitProfile.prototype.setProfile = function (label) {
	if( 'desktop' ){
		this.desktopProfile()
	}else if( 'mobile' ){
		this.mobileProfile()
	}else console.assert('false')	
};

THREEx.ArToolkitProfile.prototype.desktopProfile = function () {
	this.sourceParameters = {
		// to read from the webcam 
		sourceType : 'webcam',
		
		// to read from an image
		// sourceType : 'image',
		// sourceUrl : '../../data/images/img.jpg',		

		// to read from a video
		// sourceType : 'video',
		// sourceUrl : '../../data/videos/headtracking.mp4',		

		// sourceWidth: 80*3,
		// sourceHeight: 60*3,
		// 
	}

	this.contextParameters = {
		cameraParametersUrl: THREEx.ArToolkitContext.baseURL + '../data/data/camera_para.dat',
		detectionMode: 'mono',
		maxDetectionRate: 30,
	}
	this.defaultMarkerParameters = {
		type : 'pattern',
		// patternUrl : THREEx.ArToolkitContext.baseURL + '../data/data/patt.hiro'
		patternUrl : THREEx.ArToolkitContext.baseURL + '../data/data/patt.kanji'
	}
}

THREEx.ArToolkitProfile.prototype.mobileProfile = function () {
	this.sourceParameters = {
		// to read from the webcam 
		sourceType : 'webcam',
		
		// to read from an image
		// sourceType : 'image',
		// sourceUrl : '../../data/images/img.jpg',		

		// to read from a video
		// sourceType : 'video',
		// sourceUrl : '../../data/videos/headtracking.mp4',		

		sourceWidth: 80*3,
		sourceHeight: 60*3,
		// 
	}

	this.contextParameters = {
		cameraParametersUrl: THREEx.ArToolkitContext.baseURL + '../data/data/camera_para.dat',
		detectionMode: 'mono',
		maxDetectionRate: 30,
		sourceWidth: this.sourceParameters.sourceWidth,
		sourceHeight: this.sourceParameters.sourceHeight,		
	}
	this.defaultMarkerParameters = {
		type : 'pattern',
		// patternUrl : THREEx.ArToolkitContext.baseURL + '../data/data/patt.hiro'
		patternUrl : THREEx.ArToolkitContext.baseURL + '../data/data/patt.kanji'
	}
}
