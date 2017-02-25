function ARToolKitFrameData(arToolKitSourceOptions, arToolKitContextOptions, arMarkerControlsOptions){
	var _this = this
	_this.started = false;

	// Create a camera and a marker root object for your Three.js scene.
	var camera = new THREE.Camera();
_this._camera = camera

	// update artoolkit on every frame
	this.update = function(){
		if( arToolkitSource.ready === false )	return

		arToolkitContext.update( arToolkitSource.domElement )
	}

	this.resetPose = function(){}
	this.dispose = function(){}

        this.updateFrameData = function(dstFrameData){
                dstFrameData.timestamp = Date.now()
		
		camera.projectionMatrix.toArray(dstFrameData.leftProjectionMatrix)
		camera.projectionMatrix.toArray(dstFrameData.rightProjectionMatrix)
		var modelViewMatrix = new THREE.Matrix4().getInverse(camera.matrix)
		modelViewMatrix.toArray(dstFrameData.leftViewMatrix)
		modelViewMatrix.toArray(dstFrameData.rightViewMatrix)

		
		// TODO copy the projection matrixCodeType
		// 

		// Copy position/orientation
                camera.position.toArray(dstFrameData.pose.position)
                camera.quaternion.toArray(dstFrameData.pose.orientation)
        }

	////////////////////////////////////////////////////////////////////////////////
	//          handle arToolkitSource
	////////////////////////////////////////////////////////////////////////////////

	var arToolkitSource = new THREEx.ArToolkitSource(arToolKitSourceOptions)

	arToolkitSource.init(function onReady(){
		// handle resize of renderer
		arToolkitSource.onResize()
	})

	// handle resize
	window.addEventListener('resize', function(){
		// handle arToolkitSource resize
		arToolkitSource.onResize()	
	})

	////////////////////////////////////////////////////////////////////////////////
	//          initialize arToolkitContext
	////////////////////////////////////////////////////////////////////////////////
	

	// create atToolkitContext
	var arToolkitContext = new THREEx.ArToolkitContext(arToolKitContextOptions)
	// initialize it
	arToolkitContext.init(function onCompleted(){
		// copy projection matrix to camera
		var projectionMatrix = arToolkitContext.arController.getCameraMatrix();
		camera.projectionMatrix.fromArray(projectionMatrix);
		
		_this.started = true
	})

	
	////////////////////////////////////////////////////////////////////////////////
	//          initialize markerControls
	////////////////////////////////////////////////////////////////////////////////
		
	// init controls for camera
	var markerControls = new THREEx.ArMarkerControls(arToolkitContext, camera, arMarkerControlsOptions)

	
};
