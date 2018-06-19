var THREEx = THREEx || {}

THREEx.ArToolkitContext = function(parameters){
	var _this = this
	
	_this._updatedAt = null
	
	// handle default parameters
	this.parameters = {
		// debug - true if one should display artoolkit debug canvas, false otherwise
		debug: parameters.debug !== undefined ? parameters.debug : false,
		// type of source - ['webcam', 'image', 'video']
		sourceType : parameters.sourceType !== undefined ? parameters.sourceType : 'webcam',
		// url of the source - valid if sourceType = image|video
		sourceUrl : parameters.sourceUrl !== undefined ? parameters.sourceUrl : null,
		// the mode of detection - ['color', 'color_and_matrix', 'mono', 'mono_and_matrix']
		detectionMode: parameters.detectionMode !== undefined ? parameters.detectionMode : 'color_and_matrix',
		// type of matrix code - valid iif detectionMode end with 'matrix' - [3x3, 3x3_HAMMING63, 3x3_PARITY65, 4x4, 4x4_BCH_13_9_3, 4x4_BCH_13_5_5]
		matrixCodeType: parameters.matrixCodeType !== undefined ? parameters.matrixCodeType : '3x3',
		
		// url of the camera parameters
		cameraParametersUrl: parameters.cameraParametersUrl !== undefined ? parameters.cameraParametersUrl : THREEx.ArToolkitContext.baseURL + 'parameters/camera_para.dat',

		// tune the maximum rate of pose detection in the source image
		maxDetectionRate: parameters.maxDetectionRate !== undefined ? parameters.maxDetectionRate : 60,

		// resolution of at which we detect pose in the source image
		imageWidth: parameters.imageWidth !== undefined ? parameters.imageWidth : 640,
		imageHeight: parameters.imageHeight !== undefined ? parameters.imageHeight : 480,
		// resolution displayed for the source 
		displayWidth: parameters.displayWidth !== undefined ? parameters.displayWidth : 640,
		displayHeight: parameters.displayHeight !== undefined ? parameters.displayHeight : 480,
	}
	
        this.srcElement = null
	this.arController = null;
	this._proxy = null;
        this.cameraParameters = null
	this._arMarkersControls = []
}

THREEx.ArToolkitContext.baseURL = '../'

//////////////////////////////////////////////////////////////////////////////
//		Code Separator
//////////////////////////////////////////////////////////////////////////////
THREEx.ArToolkitContext.prototype.initSource = function(onReady){
	var _this = this

        if( this.parameters.sourceType === 'image' ){
                var srcElement = this._initSourceImage(onSourceReady)                        
        }else if( this.parameters.sourceType === 'video' ){
                var srcElement = this._initSourceVideo(onSourceReady)                        
        }else if( this.parameters.sourceType === 'webcam' ){
                var srcElement = this._initSourceWebcam(onSourceReady)                        
        }else{
                console.assert(false)
        }

	// attach
        this.srcElement = srcElement
        this.srcElement.style.position = 'absolute'
        this.srcElement.style.top = '0px'
        this.srcElement.style.zIndex = '-2'	

	return
        function onSourceReady(){
                console.log('ready')
                _this._onSourceReady(function onCompleted(){
                        console.log('completed')
			onReady && onReady()
                })
        }
} 

THREEx.ArToolkitContext.prototype._initSourceImage = function(onReady) {
	// TODO make it static
        var srcElement = document.createElement('img')
	document.body.appendChild(srcElement)
	srcElement.src = this.parameters.sourceUrl

	srcElement.width = this.parameters.imageWidth
	srcElement.height = this.parameters.imageHeight
	srcElement.style.width = this.parameters.displayWidth+'px'
	srcElement.style.height = this.parameters.displayHeight+'px'

	setTimeout(function(){
		onReady && onReady()
	}, 0)
	return srcElement                
}

THREEx.ArToolkitContext.prototype._initSourceVideo = function(onReady) {
	// TODO make it static
	var srcElement = document.createElement('video');
	document.body.appendChild(srcElement)
	srcElement.src = this.parameters.sourceUrl

	srcElement.style.objectFit = 'initial'

	srcElement.autoplay = true;
	srcElement.webkitPlaysinline = true;
	srcElement.controls = false;
	srcElement.loop = true;

	// trick to trigger the video on android
	document.body.addEventListener('click', function(){
		srcElement.play()
	})

	srcElement.width = this.parameters.imageWidth
	srcElement.height = this.parameters.imageHeight
	srcElement.style.width = this.parameters.displayWidth+'px'
	srcElement.style.height = this.parameters.displayHeight+'px'
	
	// wait until the video stream is ready
	var interval = setInterval(function() {
		if (!srcElement.videoWidth)	return;
		onReady()
		clearInterval(interval)
	}, 1000/100);
	return srcElement
}

THREEx.ArToolkitContext.prototype._initSourceWebcam = function(onReady) {
	var _this = this
	// TODO make it static
	navigator.getUserMedia  = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;

	var srcElement = document.createElement('video');
	document.body.appendChild(srcElement);
	srcElement.style.width = this.parameters.displayWidth+'px'
	srcElement.style.height = this.parameters.displayHeight+'px'


	if (navigator.getUserMedia == false )	console.log("navigator.getUserMedia not present in your browser");

	navigator.mediaDevices.enumerateDevices().then(function(devices) {
                // define getUserMedia() constraints
                var constraints = {
			audio: false,
			video: {
				mandatory: {
					maxWidth: _this.parameters.imageWidth,
					maxHeight: _this.parameters.imageHeight
		    		}
		  	}
                }

		devices.forEach(function(device) {
			if( device.kind !== 'videoinput' )	return
			// console.log(device.kind + ": " + device.label +
			// " id = " + device.deviceId);
			// console.log(device)
			constraints.video.optional = [{sourceId: device.deviceId}]
		});

		// OLD API
                // it it finds the videoSource 'environment', modify constraints.video
                // for (var i = 0; i != sourceInfos.length; ++i) {
                //         var sourceInfo = sourceInfos[i];
                //         if(sourceInfo.kind == "video" && sourceInfo.facing == "environment") {
                //                 constraints.video.optional = [{sourceId: sourceInfo.id}]
                //         }
                // }

		navigator.getUserMedia(constraints, function success(stream) {
			console.log('success', stream);
			srcElement.src = window.URL.createObjectURL(stream);
			// to start the video, when it is possible to start it only on userevent. like in android
			document.body.addEventListener('click', function(){
				srcElement.play();
			})
			srcElement.play();
		
			// wait until the video stream is ready
			var interval = setInterval(function() {
				if (!srcElement.videoWidth)	return;
				onReady()
				clearInterval(interval)
			}, 1000/100);
		}, function(error) {
			console.log("Can't access user media", error);
			alert("Can't access user media :()");
		});
	}).catch(function(err) {
		console.log(err.name + ": " + err.message);
	});

	return srcElement
}


THREEx.ArToolkitContext.prototype.onResize = function(){
	var screenWidth = window.innerWidth
	var screenHeight = window.innerHeight
	// compute sourceWidth, sourceHeight
	if( this.srcElement.nodeName === "IMG" ){
		var sourceWidth = this.srcElement.naturalWidth
		var sourceHeight = this.srcElement.naturalHeight
	}else if( this.srcElement.nodeName === "VIDEO" ){
		var sourceWidth = this.srcElement.videoWidth
		var sourceHeight = this.srcElement.videoHeight
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
		this.srcElement.style.width = newWidth+'px'
		this.srcElement.style.marginLeft = -(newWidth-screenWidth)/2+'px'
		
		// init style.height/.marginTop to normal value
		this.srcElement.style.height = screenHeight+'px'
		this.srcElement.style.marginTop = '0px'

	}else{
		// compute newHeight and set .height/.marginTop
		var newHeight = 1 / (sourceAspect / screenWidth)
		this.srcElement.style.height = newHeight+'px'
		this.srcElement.style.marginTop = -(newHeight-screenHeight)/2+'px'
		
		// init style.width/.marginLeft to normal value
		this.srcElement.style.width = screenWidth+'px'
		this.srcElement.style.marginLeft = '0px'
	}
}


//////////////////////////////////////////////////////////////////////////////
//		Code Separator
//////////////////////////////////////////////////////////////////////////////
THREEx.ArToolkitContext.prototype._onSourceReady = function(onCompleted){
        var _this = this
	
	this.onResize()
	
	var width = this.parameters.imageWidth
	var height = this.parameters.imageHeight

        console.log('ArToolkitContext: _onSourceReady width', width, 'height', height)
        _this.cameraParameters = new ARCameraParam(_this.parameters.cameraParametersUrl, function() {
        	// init controller
                var arController = new ARController(width, height, _this.cameraParameters);
                _this.arController = arController
		
		_this._proxy = new ARProxy(arController, '../../../../../../data/data/camera_para.dat', function() { console.log("got new", arguments); });
		// _this._proxy.processingDone = true;
		_this._proxy.addEventListener('load', function(ev) {
			console.log('ARController loaded', ev);

			// honor this.parameters.debug
	                if( _this.parameters.debug === true ){
				arController.debugSetup();
				arController.canvas.style.position = 'absolute'
				arController.canvas.style.top = '0px'
				arController.canvas.style.opacity = '0.6'
				arController.canvas.style.pointerEvents = 'none'
				arController.canvas.style.zIndex = '-1'
			}

			// setPatternDetectionMode
			var detectionModes = {
				'color'			: artoolkit.AR_TEMPLATE_MATCHING_COLOR,
				'color_and_matrix'	: artoolkit.AR_TEMPLATE_MATCHING_COLOR_AND_MATRIX,
				'mono'			: artoolkit.AR_TEMPLATE_MATCHING_MONO,
				'mono_and_matrix'	: artoolkit.AR_TEMPLATE_MATCHING_MONO_AND_MATRIX,
			}
			var detectionMode = detectionModes[_this.parameters.detectionMode]
			console.assert(detectionMode !== undefined)
			arController.setPatternDetectionMode(detectionMode);

			// setMatrixCodeType
			var matrixCodeTypes = {
				'3x3'		: artoolkit.AR_MATRIX_CODE_3x3,
				'3x3_HAMMING63'	: artoolkit.AR_MATRIX_CODE_3x3_HAMMING63,
				'3x3_PARITY65'	: artoolkit.AR_MATRIX_CODE_3x3_PARITY65,
				'4x4'		: artoolkit.AR_MATRIX_CODE_4x4,
				'4x4_BCH_13_9_3': artoolkit.AR_MATRIX_CODE_4x4_BCH_13_9_3,
				'4x4_BCH_13_5_5': artoolkit.AR_MATRIX_CODE_4x4_BCH_13_5_5,
			}
			var matrixCodeType = matrixCodeTypes[_this.parameters.matrixCodeType]
			console.assert(matrixCodeType !== undefined)
			arController.setMatrixCodeType(matrixCodeType);

			// console.warn('arController fully initialized')

			// notify
	                onCompleted && onCompleted()                
		})
        })		
}

////////////////////////////////////////////////////////////////////////////////
//          Code Separator
////////////////////////////////////////////////////////////////////////////////
THREEx.ArToolkitContext.prototype.update = function(){
	// be sure arController is fully initialized
        var arController = this.arController
        if (!arController) return false;

	// honor this.parameters.maxDetectionRate
	var present = performance.now()
	if( this._updatedAt !== null && present - this._updatedAt < 1000/this.parameters.maxDetectionRate ){
		return false
	}
	this._updatedAt = present

	// TODO put this in arToolkitContext
	// var video = arToolkitContext.srcElement
	// if( video.currentTime === lastTime ){
	// 	console.log('skip this frame')
	// 	return
	// }
	// lastTime = video.currentTime
	
	// if( video.readyState < video.HAVE_CURRENT_DATA ) {
	// 	console.log('skip this frame')
	// 	return
	// }

	// arToolkitContext.srcElement.addEventListener('timeupdate', function(){
	// 	console.log('timeupdate', arguments, Date())
	// })


	// mark all markers to invisible before processing this frame
	this._arMarkersControls.forEach(function(artoolkitMarker){
		artoolkitMarker.object3d.visible = false
	})

	// process this frame
	// arController.process(this.srcElement)
	this._proxy.process(this.srcElement)

	// return true as we processed the frame
	return true;
}

////////////////////////////////////////////////////////////////////////////////
//          Code Separator
////////////////////////////////////////////////////////////////////////////////
THREEx.ArToolkitContext.prototype.addMarker = function(arMarkerControls){
	console.assert(arMarkerControls instanceof THREEx.ArMarkerControls)
	this._arMarkersControls.push(arMarkerControls)
}

THREEx.ArToolkitContext.prototype.removeMarker = function(arMarkerControls){
	console.assert(arMarkerControls instanceof THREEx.ArMarkerControls)
	// console.log('remove marker for', arMarkerControls)
	var index = this.arMarkerControlss.indexOf(artoolkitMarker);
	console.assert(index !== index )
	this._arMarkersControls.splice(index, 1)
}
