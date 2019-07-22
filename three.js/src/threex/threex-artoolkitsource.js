var ARjs = ARjs || {}
var THREEx = THREEx || {}

ARjs.Source = THREEx.ArToolkitSource = function(parameters){
	var _this = this

	this.ready = false
        this.domElement = null

	// handle default parameters
	this.parameters = {
		// type of source - ['webcam', 'image', 'video']
		sourceType : 'webcam',
		// url of the source - valid if sourceType = image|video
		sourceUrl : null,

		// Device id of the camera to use (optional)
		deviceId : null,

		// resolution of at which we initialize in the source image
		sourceWidth: 640,
		sourceHeight: 480,
		// resolution displayed for the source
		displayWidth: 640,
		displayHeight: 480,
	}
	//////////////////////////////////////////////////////////////////////////////
	//		setParameters
	//////////////////////////////////////////////////////////////////////////////
	setParameters(parameters)
	function setParameters(parameters){
		if( parameters === undefined )	return
		for( var key in parameters ){
			var newValue = parameters[ key ]

			if( newValue === undefined ){
				console.warn( "THREEx.ArToolkitSource: '" + key + "' parameter is undefined." )
				continue
			}

			var currentValue = _this.parameters[ key ]

			if( currentValue === undefined ){
				console.warn( "THREEx.ArToolkitSource: '" + key + "' is not a property of this material." )
				continue
			}

			_this.parameters[ key ] = newValue
		}
	}
}

//////////////////////////////////////////////////////////////////////////////
//		Code Separator
//////////////////////////////////////////////////////////////////////////////
ARjs.Source.prototype.init = function(onReady, onError){
	var _this = this

        if( this.parameters.sourceType === 'image' ){
                var domElement = this._initSourceImage(onSourceReady, onError)
        }else if( this.parameters.sourceType === 'video' ){
                var domElement = this._initSourceVideo(onSourceReady, onError)
        }else if( this.parameters.sourceType === 'webcam' ){
                // var domElement = this._initSourceWebcamOld(onSourceReady)
                var domElement = this._initSourceWebcam(onSourceReady, onError)
        }else{
                console.assert(false)
        }

	// attach
        this.domElement = domElement
        this.domElement.style.position = 'absolute'
        this.domElement.style.top = '0px'
        this.domElement.style.left = '0px'
		this.domElement.style.zIndex = '-2'
		this.domElement.setAttribute('id', 'arjs-video');

	return this
        function onSourceReady(){
        document.body.appendChild(_this.domElement);
        window.dispatchEvent(new CustomEvent('arjs-video-loaded', {
            detail: {
                component: document.querySelector('#arjs-video'),
            },
        }));

		_this.ready = true

		onReady && onReady()
        }
}

////////////////////////////////////////////////////////////////////////////////
//          init image source
////////////////////////////////////////////////////////////////////////////////


ARjs.Source.prototype._initSourceImage = function(onReady) {
	// TODO make it static
        var domElement = document.createElement('img')
	domElement.src = this.parameters.sourceUrl

	domElement.width = this.parameters.sourceWidth
	domElement.height = this.parameters.sourceHeight
	domElement.style.width = this.parameters.displayWidth+'px'
	domElement.style.height = this.parameters.displayHeight+'px'

	// wait until the video stream is ready
	var interval = setInterval(function() {
		if (!domElement.naturalWidth)	return;
		onReady()
		clearInterval(interval)
	}, 1000/50);

	return domElement
}

////////////////////////////////////////////////////////////////////////////////
//          init video source
////////////////////////////////////////////////////////////////////////////////


ARjs.Source.prototype._initSourceVideo = function(onReady) {
	// TODO make it static
	var domElement = document.createElement('video');
	domElement.src = this.parameters.sourceUrl

	domElement.style.objectFit = 'initial'

	domElement.autoplay = true;
	domElement.webkitPlaysinline = true;
	domElement.controls = false;
	domElement.loop = true;
	domElement.muted = true

	// trick to trigger the video on android
	document.body.addEventListener('click', function onClick(){
		document.body.removeEventListener('click', onClick);
		domElement.play()
	})

	domElement.width = this.parameters.sourceWidth
	domElement.height = this.parameters.sourceHeight
	domElement.style.width = this.parameters.displayWidth+'px'
	domElement.style.height = this.parameters.displayHeight+'px'

	// wait until the video stream is ready
	var interval = setInterval(function() {
		if (!domElement.videoWidth)	return;
		onReady()
		clearInterval(interval)
	}, 1000/50);
	return domElement
}

////////////////////////////////////////////////////////////////////////////////
//          handle webcam source
////////////////////////////////////////////////////////////////////////////////

ARjs.Source.prototype._initSourceWebcam = function(onReady, onError) {
	var _this = this

	// init default value
	onError = onError || function(error){
		alert('Webcam Error\nName: '+error.name + '\nMessage: '+error.message)
		var event = new CustomEvent('camera-error', {error: error});
		window.dispatchEvent(event);
	}

	var domElement = document.createElement('video');
	domElement.setAttribute('autoplay', '');
	domElement.setAttribute('muted', '');
	domElement.setAttribute('playsinline', '');
	domElement.style.width = this.parameters.displayWidth+'px'
	domElement.style.height = this.parameters.displayHeight+'px'

	// check API is available
	if (navigator.mediaDevices === undefined
			|| navigator.mediaDevices.enumerateDevices === undefined
			|| navigator.mediaDevices.getUserMedia === undefined  ){
		if( navigator.mediaDevices === undefined )				var fctName = 'navigator.mediaDevices'
		else if( navigator.mediaDevices.enumerateDevices === undefined )	var fctName = 'navigator.mediaDevices.enumerateDevices'
		else if( navigator.mediaDevices.getUserMedia === undefined )		var fctName = 'navigator.mediaDevices.getUserMedia'
		else console.assert(false)
		onError({
			name: '',
			message: 'WebRTC issue-! '+fctName+' not present in your browser'
		})
		return null
	}

	// get available devices
	navigator.mediaDevices.enumerateDevices().then(function(devices) {
                var userMediaConstraints = {
			audio: false,
			video: {
				facingMode: 'environment',
				width: {
					ideal: _this.parameters.sourceWidth,
					// min: 1024,
					// max: 1920
				},
				height: {
					ideal: _this.parameters.sourceHeight,
					// min: 776,
					// max: 1080
				}
		  	}
		}

		if (null !== _this.parameters.deviceId) {
			userMediaConstraints.video.deviceId = {
				exact: _this.parameters.deviceId
			};
		}

		// get a device which satisfy the constraints
		navigator.mediaDevices.getUserMedia(userMediaConstraints).then(function success(stream) {
			// set the .src of the domElement
            domElement.srcObject = stream;

			var event = new CustomEvent('camera-init', {stream: stream});
			window.dispatchEvent(event);
			// to start the video, when it is possible to start it only on userevent. like in android
			document.body.addEventListener('click', function(){
				domElement.play();
			});
			// domElement.play();

// TODO listen to loadedmetadata instead
			// wait until the video stream is ready
			var interval = setInterval(function() {
				if (!domElement.videoWidth)	return;
				onReady()
				clearInterval(interval)
			}, 1000/50);
		}).catch(function(error) {
			onError({
				name: error.name,
				message: error.message
			});
		});
	}).catch(function(error) {
		onError({
			message: error.message
		});
	});

	return domElement
}

//////////////////////////////////////////////////////////////////////////////
//		Handle Mobile Torch
//////////////////////////////////////////////////////////////////////////////
ARjs.Source.prototype.hasMobileTorch = function(){
	var stream = arToolkitSource.domElement.srcObject
	if( stream instanceof MediaStream === false )	return false

	if( this._currentTorchStatus === undefined ){
		this._currentTorchStatus = false
	}

	var videoTrack = stream.getVideoTracks()[0];

	// if videoTrack.getCapabilities() doesnt exist, return false now
	if( videoTrack.getCapabilities === undefined )	return false

	var capabilities = videoTrack.getCapabilities()

	return capabilities.torch ? true : false
}

/**
 * toggle the flash/torch of the mobile fun if applicable.
 * Great post about it https://www.oberhofer.co/mediastreamtrack-and-its-capabilities/
 */
ARjs.Source.prototype.toggleMobileTorch = function(){
	// sanity check
	console.assert(this.hasMobileTorch() === true)

	var stream = arToolkitSource.domElement.srcObject
	if( stream instanceof MediaStream === false ){
		alert('enabling mobile torch is available only on webcam')
		return
	}

	if( this._currentTorchStatus === undefined ){
		this._currentTorchStatus = false
	}

	var videoTrack = stream.getVideoTracks()[0];
	var capabilities = videoTrack.getCapabilities()

	if( !capabilities.torch ){
		alert('no mobile torch is available on your camera')
		return
	}

	this._currentTorchStatus = this._currentTorchStatus === false ? true : false
	videoTrack.applyConstraints({
		advanced: [{
			torch: this._currentTorchStatus
		}]
	}).catch(function(error){
		console.log(error)
	});
}

ARjs.Source.prototype.domElementWidth = function(){
	return parseInt(this.domElement.style.width)
}
ARjs.Source.prototype.domElementHeight = function(){
	return parseInt(this.domElement.style.height)
}

////////////////////////////////////////////////////////////////////////////////
//          handle resize
////////////////////////////////////////////////////////////////////////////////

ARjs.Source.prototype.onResizeElement = function(){
	var _this = this
	var screenWidth = window.innerWidth
	var screenHeight = window.innerHeight

	// sanity check
	console.assert( arguments.length === 0 )

	// compute sourceWidth, sourceHeight
	if( this.domElement.nodeName === "IMG" ){
		var sourceWidth = this.domElement.naturalWidth
		var sourceHeight = this.domElement.naturalHeight
	}else if( this.domElement.nodeName === "VIDEO" ){
		var sourceWidth = this.domElement.videoWidth
		var sourceHeight = this.domElement.videoHeight
	}else{
		console.assert(false)
	}

	// compute sourceAspect
	var sourceAspect = sourceWidth / sourceHeight
	// compute screenAspect
	var screenAspect = screenWidth / screenHeight

	// if screenAspect < sourceAspect, then change the width, else change the height
	if( screenAspect < sourceAspect ){
		// compute newWidth and set .width/.marginLeft
		var newWidth = sourceAspect * screenHeight
		this.domElement.style.width = newWidth+'px'
		this.domElement.style.marginLeft = -(newWidth-screenWidth)/2+'px'

		// init style.height/.marginTop to normal value
		this.domElement.style.height = screenHeight+'px'
		this.domElement.style.marginTop = '0px'
	}else{
		// compute newHeight and set .height/.marginTop
		var newHeight = 1 / (sourceAspect / screenWidth)
		this.domElement.style.height = newHeight+'px'
		this.domElement.style.marginTop = -(newHeight-screenHeight)/2+'px'

		// init style.width/.marginLeft to normal value
		this.domElement.style.width = screenWidth+'px'
		this.domElement.style.marginLeft = '0px'
	}
}
/*
ARjs.Source.prototype.copyElementSizeTo = function(otherElement){
	otherElement.style.width = this.domElement.style.width
	otherElement.style.height = this.domElement.style.height
	otherElement.style.marginLeft = this.domElement.style.marginLeft
	otherElement.style.marginTop = this.domElement.style.marginTop
}
*/

ARjs.Source.prototype.copyElementSizeTo = function(otherElement){

	if (window.innerWidth > window.innerHeight)
	{
		//landscape
		otherElement.style.width = this.domElement.style.width
		otherElement.style.height = this.domElement.style.height
		otherElement.style.marginLeft = this.domElement.style.marginLeft
		otherElement.style.marginTop = this.domElement.style.marginTop
	}
	else {
		//portrait
		otherElement.style.height = this.domElement.style.height
		otherElement.style.width = (parseInt(otherElement.style.height) * 4/3)+"px";
		otherElement.style.marginLeft = ((window.innerWidth- parseInt(otherElement.style.width))/2)+"px";
		otherElement.style.marginTop = 0;
	}

}

//////////////////////////////////////////////////////////////////////////////
//		Code Separator
//////////////////////////////////////////////////////////////////////////////

ARjs.Source.prototype.copySizeTo = function(){
	console.warn('obsolete function arToolkitSource.copySizeTo. Use arToolkitSource.copyElementSizeTo' )
	this.copyElementSizeTo.apply(this, arguments)
}

//////////////////////////////////////////////////////////////////////////////
//		Code Separator
//////////////////////////////////////////////////////////////////////////////

ARjs.Source.prototype.onResize	= function(arToolkitContext, renderer, camera){
	if( arguments.length !== 3 ){
		console.warn('obsolete function arToolkitSource.onResize. Use arToolkitSource.onResizeElement' )
		return this.onResizeElement.apply(this, arguments)
	}

	var trackingBackend = arToolkitContext.parameters.trackingBackend


	// RESIZE DOMELEMENT
	if( trackingBackend === 'artoolkit' ){

		this.onResizeElement()

		var isAframe = renderer.domElement.dataset.aframeCanvas ? true : false
		if( isAframe === false ){
			this.copyElementSizeTo(renderer.domElement)
		}else{

		}

		if( arToolkitContext.arController !== null ){
			this.copyElementSizeTo(arToolkitContext.arController.canvas)
		}
	}else if( trackingBackend === 'aruco' ){
		this.onResizeElement()
		this.copyElementSizeTo(renderer.domElement)

		this.copyElementSizeTo(arToolkitContext.arucoContext.canvas)
	}else if( trackingBackend === 'tango' ){
		renderer.setSize( window.innerWidth, window.innerHeight )
	}else console.assert(false, 'unhandled trackingBackend '+trackingBackend)


	// UPDATE CAMERA
	if( trackingBackend === 'artoolkit' ){
		if( arToolkitContext.arController !== null ){
			camera.projectionMatrix.copy( arToolkitContext.getProjectionMatrix() );
		}
	}else if( trackingBackend === 'aruco' ){
		camera.aspect = renderer.domElement.width / renderer.domElement.height;
		camera.updateProjectionMatrix();
	}else if( trackingBackend === 'tango' ){
		var vrDisplay = arToolkitContext._tangoContext.vrDisplay
		// make camera fit vrDisplay
		if( vrDisplay && vrDisplay.displayName === "Tango VR Device" ) THREE.WebAR.resizeVRSeeThroughCamera(vrDisplay, camera)
	}else console.assert(false, 'unhandled trackingBackend '+trackingBackend)
}
