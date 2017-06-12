var THREEx = THREEx || {}

THREEx.ArToolkitContext = function(parameters){
	var _this = this
	
	_this._updatedAt = null
	
	// handle default parameters
	this.parameters = {
		// AR backend - ['aruco', 'artoolkit']
		arBackend: parameters.arBackend !== undefined ? parameters.arBackend : 'artoolkit',
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
	// parameters sanity check
	console.assert(['aruco', 'artoolkit'].indexOf(this.parameters.arBackend) !== -1, 'invalid parameter arBackend', this.parameters.arBackend)
	console.assert(['color', 'color_and_matrix', 'mono', 'mono_and_matrix'].indexOf(this.parameters.detectionMode) !== -1, 'invalid parameter detectionMode', this.parameters.detectionMode)
	
        this.arController = null;
        this.arucoContext = null;

	this._arMarkersControls = []
}

Object.assign( THREEx.ArToolkitContext.prototype, THREE.EventDispatcher.prototype );

// THREEx.ArToolkitContext.baseURL = '../'
// default to github page
THREEx.ArToolkitContext.baseURL = 'https://jeromeetienne.github.io/AR.js/three.js/'
THREEx.ArToolkitContext.REVISION = '1.0.1-dev'



//////////////////////////////////////////////////////////////////////////////
//		init functions
//////////////////////////////////////////////////////////////////////////////
THREEx.ArToolkitContext.prototype.init = function(onCompleted){
	if( this.parameters.arBackend === 'aruco' ){
		this._initAruco(onCompleted)
	}else if( this.parameters.arBackend === 'artoolkit' ){
		this._initArtoolkit(onCompleted)
	}else console.assert(false)
}

THREEx.ArToolkitContext.prototype._initArtoolkit = function(onCompleted){
        var _this = this

	// set this._artoolkitProjectionAxisTransformMatrix to change artoolkit projection matrix axis to match usual webgl one
	this._artoolkitProjectionAxisTransformMatrix = new THREE.Matrix4()
	this._artoolkitProjectionAxisTransformMatrix.multiply(new THREE.Matrix4().makeRotationY(Math.PI))
	this._artoolkitProjectionAxisTransformMatrix.multiply(new THREE.Matrix4().makeRotationZ(Math.PI))

	// get cameraParameters
        var cameraParameters = new ARCameraParam(_this.parameters.cameraParametersUrl, function() {
        	// init controller
                var arController = new ARController(_this.parameters.canvasWidth, _this.parameters.canvasHeight, cameraParameters);
                _this.arController = arController
                
		// honor this.parameters.imageSmoothingEnabled
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
		

		// set thresholding in artoolkit
		// this seems to be the default
		// arController.setThresholdMode(artoolkit.AR_LABELING_THRESH_MODE_MANUAL)
		// adatative consume a LOT of cpu...
		// arController.setThresholdMode(artoolkit.AR_LABELING_THRESH_MODE_AUTO_ADAPTIVE)
		// arController.setThresholdMode(artoolkit.AR_LABELING_THRESH_MODE_AUTO_OTSU)

		// notify
                onCompleted && onCompleted()                
        })		
	return this
}

THREEx.ArToolkitContext.prototype._initAruco = function(onCompleted){
	this.arucoContext = new THREEx.ArucoContext()
	
	// honor this.parameters.canvasWidth/.canvasHeight
	this.arucoContext.canvas.width = this.parameters.canvasWidth
	this.arucoContext.canvas.height = this.parameters.canvasHeight

	// honor this.parameters.imageSmoothingEnabled
	var context = this.arucoContext.canvas.getContext('2d')
	// context.mozImageSmoothingEnabled = this.parameters.imageSmoothingEnabled;
	context.webkitImageSmoothingEnabled = this.parameters.imageSmoothingEnabled;
	context.msImageSmoothingEnabled = this.parameters.imageSmoothingEnabled;
	context.imageSmoothingEnabled = this.parameters.imageSmoothingEnabled;			

	
	setTimeout(function(){
		onCompleted && onCompleted()
	})
}

/**
 * return the projection matrix
 */
THREEx.ArToolkitContext.prototype.getProjectionMatrix = function(srcElement){
	
	if( this.parameters.arBackend === 'aruco' ){
		console.assert(false, 'dont call this function with aruco')
	}else if( this.parameters.arBackend === 'artoolkit' ){
		console.assert(this.arController, 'arController MUST be initialized to call this function')
		// get projectionMatrixArr from artoolkit
		var projectionMatrixArr = this.arController.getCameraMatrix();
		var projectionMatrix = new THREE.Matrix4().fromArray(projectionMatrixArr)		
	}else console.assert(false)
		
	// apply context._axisTransformMatrix - change artoolkit axis to match usual webgl one
	projectionMatrix.multiply(this._artoolkitProjectionAxisTransformMatrix)
	
	// return the result
	return projectionMatrix
}

////////////////////////////////////////////////////////////////////////////////
//          update function
////////////////////////////////////////////////////////////////////////////////
THREEx.ArToolkitContext.prototype.update = function(srcElement){
	// be sure arController is fully initialized
        if (this.parameters.arBackend === 'artoolkit' && this.arController === null) return false;

	// honor this.parameters.maxDetectionRate
	var present = performance.now()
	if( this._updatedAt !== null && present - this._updatedAt < 1000/this.parameters.maxDetectionRate ){
		return false
	}
	this._updatedAt = present

	// mark all markers to invisible before processing this frame
	this._arMarkersControls.forEach(function(markerControls){
		markerControls.object3d.visible = false
	})

	// process this frame
	if(this.parameters.arBackend === 'artoolkit'){
		this._updateArtoolkit(srcElement)		
	}else if( this.parameters.arBackend === 'aruco' ){
		this._updateAruco(srcElement)
	}else{
		console.assert(false)
	}

	// dispatch event
	this.dispatchEvent({
		type: 'sourceProcessed'
	});


	// return true as we processed the frame
	return true;
}

THREEx.ArToolkitContext.prototype._updateArtoolkit = function(srcElement){
	this.arController.process(srcElement)
}

THREEx.ArToolkitContext.prototype._updateAruco = function(srcElement){
	// console.log('update aruco here')
	var _this = this
	var arMarkersControls = this._arMarkersControls
        var detectedMarkers = this.arucoContext.detect(srcElement)
	
	detectedMarkers.forEach(function(detectedMarker){
		var foundControls = null
		for(var i = 0; i < arMarkersControls.length; i++){
			if( arMarkersControls[i].parameters.barcodeValue === detectedMarker.id ){
				foundControls = arMarkersControls[i]
				break;
			}
		}
		if( foundControls === null )	return

		var tmpObject3d = new THREE.Object3D
                _this.arucoContext.updateObject3D(tmpObject3d, foundControls._arucoPosit, foundControls.parameters.size, detectedMarker);
		tmpObject3d.updateMatrix()

		foundControls.updateWithModelViewMatrix(tmpObject3d.matrix)
	})
}

////////////////////////////////////////////////////////////////////////////////
//          Add/Remove markerControls
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
