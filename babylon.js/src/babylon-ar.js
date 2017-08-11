// @namespace
var ARjs = ARjs || {}

ARjs.Babylon = function(){}

ARjs.Babylon.createCamera = function(scene){
	var babylonCamera = new BABYLON.ArcRotateCamera("GlobalRotativeCamera1",  0, 0, 0, new BABYLON.Vector3(0, 0, -1), scene);
	// arcRotateCamera.setPosition(new BABYLON.Vector3(0, 50, 80));
	// arcRotateCamera.setTarget(BABYLON.Vector3.Zero());
	// arcRotateCamera.attachControl(canvas, true);

	scene.activeCamera.fovmode = BABYLON.Camera.fovmode_HORIZONTAL_FIXED;
	scene.activeCamera.fov = 2*22 / 180*Math.PI
	return babylonCamera
}

ARjs.Babylon.updateCamera = function(babylonCamera, threeCamera){
	
}

ARjs.Babylon.updateObjectPose = function(babylonObject3D, threeObject3D){
	var modelViewMatrix = threeObject3D.matrix

	threeObject3D.updateMatrixWorld()
// console.log('camera position', threeObject3D.position)

	var threejsPosition = threeObject3D.position.clone()

	var threejsTarget = new THREE.Vector3(0,0,-1)
	threeObject3D.localToWorld(threejsTarget)


	babylonObject3D.position.x =  threejsPosition.x
	babylonObject3D.position.y =  threejsPosition.y
	babylonObject3D.position.z =  threejsPosition.z

	babylonObject3D.setTarget(new BABYLON.Vector3(
		threejsTarget.x,
		threejsTarget.y,
		threejsTarget.z
	))

		// cameraBabylon.target.x = -threejsTarget.x
		// cameraBabylon.target.y = 0
		// cameraBabylon.target.z = 0
		// cameraBabylon.setPosition()
// debugger
		// cameraBabylon._computedViewMatrix = new BABYLON.Matrix.FromArray(modelViewMatrix.toArray());
		// cameraBabylon._computedViewMatrix.m.set(modelViewMatrix.toArray());
		// cameraBabylon._computedViewMatrix.invert()
	
}
