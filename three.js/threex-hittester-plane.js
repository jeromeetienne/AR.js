var THREEx = THREEx || {}

// TODO this is useless - prefere arjs-hittester.js

/**
 * - maybe support .onClickFcts in each object3d
 * - seems an easy light layer for clickable object
 * - up to 
 */
THREEx.HitTesterPlane = function(sourceElement){
	this._sourceElement = sourceElement
	// Create cameraPicking
	var fullWidth = parseInt(sourceElement.style.width)
	var fullHeight = parseInt(sourceElement.style.height)
	// TODO hardcoded fov - couch
	this._cameraPicking = new THREE.PerspectiveCamera(42, fullWidth / fullHeight, 0.1, 100);	

console.warn('THREEx.HitTesterPlane works only in modelViewMatrix')
// TODO just push camera in computeIntersects
}

THREEx.HitTesterPlane.prototype.onResize = function(){
	var sourceElement = this._sourceElement
	var cameraPicking = this._cameraPicking
	
	var fullWidth = parseInt(sourceElement.style.width)
	var fullHeight = parseInt(sourceElement.style.height)
	cameraPicking.aspect = fullWidth / fullHeight;
	cameraPicking.updateProjectionMatrix();
}

THREEx.HitTesterPlane.prototype.computeIntersects = function(domEvent, objects){
	var sourceElement = this._sourceElement
	var cameraPicking = this._cameraPicking

	// compute mouse coordinatge with [-1,1]
	var eventCoords = new THREE.Vector3();
	eventCoords.x =   ( domEvent.layerX / parseInt(sourceElement.style.width)  ) * 2 - 1;
	eventCoords.y = - ( domEvent.layerY / parseInt(sourceElement.style.height) ) * 2 + 1;

	// compute intersections between eventCoords and pickingPlane
	var raycaster = new THREE.Raycaster();
	raycaster.setFromCamera( eventCoords, cameraPicking );
	var intersects = raycaster.intersectObjects( objects )
	
	return intersects
}

THREEx.HitTesterPlane.prototype.update = function(){

}
