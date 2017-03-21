var THREEx = THREEx || {}

THREEx.ArToolkitContext = function(parameters){
	var _this = this
	
	_this._updatedAt = null
	
	// handle default parameters
	this.parameters = {
		// debug - true if one should display artoolkit debug canvas, false otherwise
		debug: parameters.debug !== undefined ? parameters.debug : false,
		// the mode of detection - ['color', 'color_and_matrix', 'mono', 'mono_and_matrix']
		detectionMode: parameters.detectionMode !== undefined ? parameters.detectionMode : 'color_and_matrix',
		// type of matrix code - valid iif detectionMode end with 'matrix' - [3x3, 3x3_HAMMING63, 3x3_PARITY65, 4x4, 4x4_BCH_13_9_3, 4x4_BCH_13_5_5]
		matrixCodeType: parameters.matrixCodeType !== undefined ? parameters.matrixCodeType : '3x3',
		
		// url of the camera parameters
		cameraParametersUrl: parameters.cameraParametersUrl !== undefined ? parameters.cameraParametersUrl : THREEx.ArToolkitContext.baseURL + 'parameters/camera_para.dat',

		// tune the maximum rate of pose detection in the source image
		maxDetectionRate: parameters.maxDetectionRate !== undefined ? parameters.maxDetectionRate : 60,
		// resolution of at which we detect pose in the source image
		canvasWidth: parameters.canvasWidth !== undefined ? parameters.canvasWidth : 640,
		canvasHeight: parameters.canvasHeight !== undefined ? parameters.canvasHeight : 480,
		
		// enable image smoothing or not for canvas copy - default to true
		// https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/imageSmoothingEnabled
		imageSmoothingEnabled : parameters.imageSmoothingEnabled !== undefined ? parameters.imageSmoothingEnabled : false,
	}
	
// debugger	
	
	// set this._projectionAxisTransformMatrix to change artoolkit projection matrix axis to match usual webgl one
	this._projectionAxisTransformMatrix = new THREE.Matrix4()
	this._projectionAxisTransformMatrix.multiply(new THREE.Matrix4().makeRotationY(Math.PI))
	this._projectionAxisTransformMatrix.multiply(new THREE.Matrix4().makeRotationZ(Math.PI))

	
        this.arController = null;
        this._cameraParameters = null
	this._arMarkersControls = []
}

THREEx.ArToolkitContext.baseURL = '../'
THREEx.ArToolkitContext.REVISION = '1.0.1-dev'

/**
 * return the projection matrix
 */
THREEx.ArToolkitContext.prototype.getProjectionMatrix = function(srcElement){
	console.assert(this.arController, 'arController MUST be initialized to call this function')
	// get projectionMatrixArr from artoolkit
	var projectionMatrixArr = this.arController.getCameraMatrix();
	var projectionMatrix = new THREE.Matrix4().fromArray(projectionMatrixArr)
		
	// apply context._axisTransformMatrix - change artoolkit axis to match usual webgl one
	projectionMatrix.multiply(this._projectionAxisTransformMatrix)
	
	// return the result
	return projectionMatrix
}

//////////////////////////////////////////////////////////////////////////////
//		Code Separator
//////////////////////////////////////////////////////////////////////////////
THREEx.ArToolkitContext.prototype.init = function(onCompleted){
        var _this = this
	var canvasWidth = this.parameters.canvasWidth
	var canvasHeight = this.parameters.canvasHeight

        // console.log('ArToolkitContext: _onSourceReady width', canvasWidth, 'height', canvasHeight)
        _this._cameraParameters = new ARCameraParam(_this.parameters.cameraParametersUrl, function() {
        	// init controller
                var arController = new ARController(canvasWidth, canvasHeight, _this._cameraParameters);
                _this.arController = arController
                
		arController.ctx.mozImageSmoothingEnabled = _this.parameters.imageSmoothingEnabled;
		arController.ctx.webkitImageSmoothingEnabled = _this.parameters.imageSmoothingEnabled;
		arController.ctx.msImageSmoothingEnabled = _this.parameters.imageSmoothingEnabled;
		arController.ctx.imageSmoothingEnabled = _this.parameters.imageSmoothingEnabled;			
 		
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
	return this
}

////////////////////////////////////////////////////////////////////////////////
//          Code Separator
////////////////////////////////////////////////////////////////////////////////
THREEx.ArToolkitContext.prototype.update = function(srcElement){
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
	this._arMarkersControls.forEach(function(markerControls){
		markerControls.object3d.visible = false
	})

	// process this frame
	arController.process(srcElement)

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
