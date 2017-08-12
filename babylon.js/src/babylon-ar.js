// @namespace
var ARjs = ARjs || {}

ARjs.Babylon = function(){}

ARjs.Babylon.createCamera = function(scene){
	var babylonCamera = new BABYLON.ArcRotateCamera("blabla",  0, 0, 0, new BABYLON.Vector3(0, 0, -1), scene);

	// hard code a fov which is kinda similar to default camera
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

	// use modelViewMatrix
	var modelViewMatrix = threeObject3D.matrix
	babylonObject3D._computedViewMatrix = new BABYLON.Matrix.FromArray(modelViewMatrix.toArray());
	babylonObject3D._computedViewMatrix.invert()	
}
