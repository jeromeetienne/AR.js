var THREEx = THREEx || {}


THREEx.ArToolkitProfile = function(){
	this.reset().discoverPerformance()
}


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

THREEx.ArToolkitProfile.prototype.discoverPerformance = function() {
	var isMobile = navigator.userAgent.match(/Android/i)
			|| navigator.userAgent.match(/webOS/i)
			|| navigator.userAgent.match(/iPhone/i)
			|| navigator.userAgent.match(/iPad/i)
			|| navigator.userAgent.match(/iPod/i)
			|| navigator.userAgent.match(/BlackBerry/i)
			|| navigator.userAgent.match(/Windows Phone/i)
			? true : false 
	if( isMobile === true ){
		this.performance('phone-normal')
	}else{
		this.performance('desktop-normal')	
	}
}

THREEx.ArToolkitProfile.prototype.performance = function(label) {
	if( label === 'desktop-fast' ){
		this.sourceParameters.sourceWidth = 640*2
		this.sourceParameters.sourceWidth = 480*2

		this.contextParameters.maxDetectionRate = 60
	}else if( label === 'desktop-normal' ){
		this.sourceParameters.sourceWidth = 640
		this.sourceParameters.sourceWidth = 480

		this.contextParameters.maxDetectionRate = 60
	}else if( label === 'phone-normal' ){
		this.sourceParameters.sourceWidth = 240
		this.sourceParameters.sourceWidth = 180

		this.contextParameters.maxDetectionRate = 30	
	}else if( label === 'phone-slow' ){
		this.sourceParameters.sourceWidth = 240
		this.sourceParameters.sourceWidth = 180

		this.contextParameters.maxDetectionRate = 15		
	}else {
		console.assert(false, 'unknonwn label '+label)
	}
	this.contextParameters.sourceWidth = this.sourceParameters.sourceWidth	
	this.contextParameters.sourceHeight = this.sourceParameters.sourceHeight	
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
