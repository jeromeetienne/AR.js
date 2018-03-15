function ARToolKitFrameData(arToolKitContextOptions, arMarkerControlsOptions){
	var _this = this
	_this.started = false;

	// Create a camera and a marker root object for your Three.js scene.
	var camera = new THREE.Camera();
_this._camera = camera


	// create arToolkitContext
	var arToolkitContext = new THREEx.ArToolkitContext(arToolKitContextOptions)
	// update the camera projectionMatrix
	arToolkitContext.addEventListener( 'ready', function ( event ) {
	        var projectionMatrix = arToolkitContext.arController.getCameraMatrix();
	        camera.projectionMatrix.fromArray(projectionMatrix);
		
		_this.started = true
	})
	// update artoolkit on every frame
	this.update = function(){
		arToolkitContext.update()		
	}

	// init controls for camera
	var markerControls = new THREEx.ArMarkerControls(arToolkitContext, camera, arMarkerControlsOptions)

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
};
