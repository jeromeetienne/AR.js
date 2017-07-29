var THREEx = THREEx || {}

// TODO this is useless - prefere arjs-hittester.js

/**
 * - maybe support .onClickFcts in each object3d
 * - seems an easy light layer for clickable object
 * - up to 
 */
THREEx.HitTesterPlane = function(sourceElement){
	this._sourceElement = sourceElement

	// create _pickingScene
	this._pickingScene = new THREE.Scene
	
	// create _pickingPlane
	var geometry = new THREE.PlaneGeometry(20,20,19,19).rotateX(-Math.PI/2)
	// var geometry = new THREE.PlaneGeometry(20,20).rotateX(-Math.PI/2)
	var material = new THREE.MeshBasicMaterial({
		// opacity: 0.5,
		// transparent: true,
		wireframe: true
	})
	// material.visible = false
	this._pickingPlane = new THREE.Mesh(geometry, material)
	this._pickingScene.add(this._pickingPlane)

	// Create pickingCamera
	var fullWidth = parseInt(sourceElement.style.width)
	var fullHeight = parseInt(sourceElement.style.height)
	// TODO hardcoded fov - couch
	this._pickingCamera = new THREE.PerspectiveCamera(42, fullWidth / fullHeight, 0.1, 30);	
}

//////////////////////////////////////////////////////////////////////////////
//		update function
//////////////////////////////////////////////////////////////////////////////

THREEx.HitTesterPlane.prototype.update = function(camera, pickingRoot, changeMatrixMode){

	this.onResize()
	

	if( changeMatrixMode === 'modelViewMatrix' ){
		// set pickingPlane position
		var pickingPlane = this._pickingPlane
		pickingRoot.parent.updateMatrixWorld()
		pickingPlane.matrix.copy(pickingRoot.parent.matrixWorld)
		// set position/quaternion/scale from pickingPlane.matrix
		pickingPlane.matrix.decompose(pickingPlane.position, pickingPlane.quaternion, pickingPlane.scale)
	}else if( changeMatrixMode === 'cameraTransformMatrix' ){
		// set pickingPlane position
		var pickingCamera = this._pickingCamera
		camera.updateMatrixWorld()
		pickingCamera.matrix.copy(camera.matrixWorld)
		// set position/quaternion/scale from pickingCamera.matrix
		pickingCamera.matrix.decompose(pickingCamera.position, pickingCamera.quaternion, pickingCamera.scale)
	}else console.assert(false)


// var position = this._pickingPlane.position
// console.log('pickingPlane position', position.x.toFixed(2), position.y.toFixed(2), position.z.toFixed(2))
// var position = this._pickingCamera.position
// console.log('his._pickingCamera position', position.x.toFixed(2), position.y.toFixed(2), position.z.toFixed(2))
	
}

//////////////////////////////////////////////////////////////////////////////
//		resize camera
//////////////////////////////////////////////////////////////////////////////

THREEx.HitTesterPlane.prototype.onResize = function(){
	var sourceElement = this._sourceElement
	var pickingCamera = this._pickingCamera
	
// FIXME why using css here ??? not even computed style
// should get the size of the elment directly independantly 
	var fullWidth = parseInt(sourceElement.style.width)
	var fullHeight = parseInt(sourceElement.style.height)
	pickingCamera.aspect = fullWidth / fullHeight

	pickingCamera.updateProjectionMatrix()
}

//////////////////////////////////////////////////////////////////////////////
//		Perform test
//////////////////////////////////////////////////////////////////////////////
THREEx.HitTesterPlane.prototype.test = function(mouseX, mouseY){
	// convert mouseX, mouseY to [-1, +1]
	mouseX = (mouseX-0.5)*2
	mouseY =-(mouseY-0.5)*2
	
	this._pickingScene.updateMatrixWorld(true)

	// compute intersections between mouseVector3 and pickingPlane
	var raycaster = new THREE.Raycaster();
	var mouseVector3 = new THREE.Vector3(mouseX, mouseY, 1);
	raycaster.setFromCamera( mouseVector3, this._pickingCamera )
	var intersects = raycaster.intersectObjects( [this._pickingPlane] )

	if( intersects.length === 0 )	return null

	// set new demoRoot position
	var position = this._pickingPlane.worldToLocal( intersects[0].point.clone() )
	// TODO here do a look at the camera ?
	var quaternion = new THREE.Quaternion
	var scale = new THREE.Vector3(1,1,1)//.multiplyScalar(1)
	
	return {
		position : position,
		quaternion : quaternion,
		scale : scale
	}
}

//////////////////////////////////////////////////////////////////////////////
//		render the pickingPlane for debug
//////////////////////////////////////////////////////////////////////////////

THREEx.HitTesterPlane.prototype.renderDebug = function(renderer){
	// render sceneOrtho
	renderer.render( this._pickingScene, this._pickingCamera )
}
