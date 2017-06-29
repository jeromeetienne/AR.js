var THREEx = THREEx || {}

/**
 * ArToolkitProfile helps you build parameters for artoolkit
 * - it is fully independent of the rest of the code
 * - all the other classes are still expecting normal parameters
 * - you can use this class to understand how to tune your specific usecase
 * - it is made to help people to build parameters without understanding all the underlying details.
 */
THREEx.ArToolkitProfile = function(){
	this.reset()

	this.performance('default')
}


THREEx.ArToolkitProfile.prototype._guessPerformanceLabel = function() {
	var isMobile = navigator.userAgent.match(/Android/i)
			|| navigator.userAgent.match(/webOS/i)
			|| navigator.userAgent.match(/iPhone/i)
			|| navigator.userAgent.match(/iPad/i)
			|| navigator.userAgent.match(/iPod/i)
			|| navigator.userAgent.match(/BlackBerry/i)
			|| navigator.userAgent.match(/Windows Phone/i)
			? true : false 
	if( isMobile === true ){
		return 'phone-normal'
	}
	return 'desktop-normal'
}

//////////////////////////////////////////////////////////////////////////////
//		Code Separator
//////////////////////////////////////////////////////////////////////////////

/**
 * reset all parameters
 */
THREEx.ArToolkitProfile.prototype.reset = function () {
	this.sourceParameters = {
		// to read from the webcam 
		sourceType : 'webcam',
	}

	this.contextParameters = {
		cameraParametersUrl: THREEx.ArToolkitContext.baseURL + '../data/data/camera_para.dat',
		detectionMode: 'mono',
	}
	this.defaultMarkerParameters = {
		type : 'pattern',
		patternUrl : THREEx.ArToolkitContext.baseURL + '../data/data/patt.hiro'
	}
	return this
};

//////////////////////////////////////////////////////////////////////////////
//		Performance
//////////////////////////////////////////////////////////////////////////////



THREEx.ArToolkitProfile.prototype.performance = function(label) {
	if( label === 'default' ){
		label = this._guessPerformanceLabel()
	}

	if( label === 'desktop-fast' ){
		this.contextParameters.sourceWidth = 640*3
		this.contextParameters.sourceHeight = 480*3

		this.contextParameters.maxDetectionRate = 30
	}else if( label === 'desktop-normal' ){
		this.contextParameters.sourceWidth = 640
		this.contextParameters.sourceHeight = 480

		this.contextParameters.maxDetectionRate = 60
	}else if( label === 'phone-normal' ){
		this.contextParameters.sourceWidth = 80*4
		this.contextParameters.sourceHeight = 60*4

		this.contextParameters.maxDetectionRate = 30
	}else if( label === 'phone-slow' ){
		this.contextParameters.sourceWidth = 80*3
		this.contextParameters.sourceHeight = 60*3

		this.contextParameters.maxDetectionRate = 30		
	}else {
		console.assert(false, 'unknonwn label '+label)
	}
}

//////////////////////////////////////////////////////////////////////////////
//		Marker
//////////////////////////////////////////////////////////////////////////////
THREEx.ArToolkitProfile.prototype.kanjiMarker = function () {
	this.contextParameters.detectionMode = 'mono'

	this.defaultMarkerParameters.type = 'pattern'
	this.defaultMarkerParameters.patternUrl = THREEx.ArToolkitContext.baseURL + '../data/data/patt.kanji'
	return this
}

THREEx.ArToolkitProfile.prototype.hiroMarker = function () {
	this.contextParameters.detectionMode = 'mono'

	this.defaultMarkerParameters.type = 'pattern'
	this.defaultMarkerParameters.patternUrl = THREEx.ArToolkitContext.baseURL + '../data/data/patt.hiro'
	return this
}

//////////////////////////////////////////////////////////////////////////////
//		Source
//////////////////////////////////////////////////////////////////////////////
THREEx.ArToolkitProfile.prototype.sourceWebcam = function () {
	this.sourceParameters.sourceType = 'webcam'
	delete this.sourceParameters.sourceUrl
	return this
}


THREEx.ArToolkitProfile.prototype.sourceVideo = function (url) {
	this.sourceParameters.sourceType = 'video'
	this.sourceParameters.sourceUrl = url
	return this
}

THREEx.ArToolkitProfile.prototype.sourceImage = function (url) {
	this.sourceParameters.sourceType = 'image'
	this.sourceParameters.sourceUrl = url
	return this
}
