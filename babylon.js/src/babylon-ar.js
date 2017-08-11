// @namespace
var ARjs = ARjs || {}

ARjs.Babylon = function(){}

ARjs.Babylon.createCamera = function(scene){
	var babylonCamera = new BABYLON.ArcRotateCamera("blabla",  0, 0, 0, new BABYLON.Vector3(0, 0, -1), scene);

	// hard code a fov which is kinda ok
	// scene.activeCamera.fovmode = BABYLON.Camera.fovmode_HORIZONTAL_FIXED;
	// scene.activeCamera.fov = 2*22 / 180*Math.PI

	return babylonCamera
}

ARjs.Babylon.updateCamera = function(babylonCamera, threeCamera){
	var projectionMatrixArr = threeCamera.projectionMatrix.toArray()
	var babylonMatrix = BABYLON.Matrix.FromArray(projectionMatrixArr)
	babylonCamera.freezeProjectionMatrix(babylonMatrix)
}

ARjs.Babylon.updateObjectPose = function(babylonObject3D, threeObject3D){

	threeObject3D.updateMatrixWorld()

	// console.log('camera position', threeObject3D.position)

	// var threejsPosition = threeObject3D.position.clone()
	// babylonObject3D.position.x =  threejsPosition.x
	// babylonObject3D.position.y =  threejsPosition.y
	// babylonObject3D.position.z =  threejsPosition.z

	// var threejsUp = new THREE.Vector3(0,1,0)
	// // threeObject3D.localToWorld(threejsUp)
	// babylonObject3D.upVector.x = threejsUp.x
	// babylonObject3D.upVector.y = threejsUp.y
	// babylonObject3D.upVector.z = threejsUp.z

	// // set target
	// var threejsTarget = new THREE.Vector3(0,0,-1)
	// threeObject3D.localToWorld(threejsTarget)
	// babylonObject3D.setTarget(new BABYLON.Vector3(
	// 	threejsTarget.x,
	// 	threejsTarget.y,
	// 	threejsTarget.z
	// ))

	// use modelViewMatrix
	var modelViewMatrix = threeObject3D.matrix
	babylonObject3D._computedViewMatrix = new BABYLON.Matrix.FromArray(modelViewMatrix.toArray());
	babylonObject3D._computedViewMatrix.m.set(modelViewMatrix.toArray());
	babylonObject3D._computedViewMatrix.invert()	
}
