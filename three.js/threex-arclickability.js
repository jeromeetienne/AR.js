var THREEx = THREEx || {}

// TODO this is useless - prefere arjs-hittester.js

/**
 * - maybe support .onClickFcts in each object3d
 * - seems an easy light layer for clickable object
 * - up to 
 */
THREEx.ARClickability = function(sourceElement){
	this._sourceElement = sourceElement
	// Create cameraPicking
	var fullWidth = parseInt(sourceElement.style.width)
	var fullHeight = parseInt(sourceElement.style.height)
	this._cameraPicking = new THREE.PerspectiveCamera(42, fullWidth / fullHeight, 0.1, 100);	

console.warn('THREEx.ARClickability works only in modelViewMatrix')
console.warn('OBSOLETE OBSOLETE! instead use THREEx.HitTesterPlane or THREEx.HitTesterTango')
}

THREEx.ARClickability.prototype.onResize = function(){
	var sourceElement = this._sourceElement
	var cameraPicking = this._cameraPicking
	
	var fullWidth = parseInt(sourceElement.style.width)
	var fullHeight = parseInt(sourceElement.style.height)
	cameraPicking.aspect = fullWidth / fullHeight;
	cameraPicking.updateProjectionMatrix();
}

THREEx.ARClickability.prototype.computeIntersects = function(domEvent, objects){
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

THREEx.ARClickability.prototype.update = function(){

}

//////////////////////////////////////////////////////////////////////////////
//		Code Separator
//////////////////////////////////////////////////////////////////////////////

THREEx.ARClickability.tangoPickingPointCloud = function(artoolkitContext, mouseX, mouseY){
	
// THIS IS CRAP!!!! use THREEx.HitTesterTango
	
	var vrDisplay = artoolkitContext._tangoContext.vrDisplay
        if (vrDisplay === null ) return null
        var pointAndPlane = vrDisplay.getPickingPointAndPlaneInPointCloud(mouseX, mouseY)
        if( pointAndPlane == null ) {
                console.warn('Could not retrieve the correct point and plane.')
                return null
        }
	
	// FIXME not sure what this is
	var boundingSphereRadius = 0.01	
	
	// the bigger the number the likeliest it crash chromium-webar

        // Orient and position the model in the picking point according
        // to the picking plane. The offset is half of the model size.
        var object3d = new THREE.Object3D
        THREE.WebAR.positionAndRotateObject3DWithPickingPointAndPlaneInPointCloud(
                pointAndPlane, object3d, boundingSphereRadius
        )
	object3d.rotateZ(-Math.PI/2)

	// return the result
	var result = {}
	result.position = object3d.position
	result.quaternion = object3d.quaternion
	return result
}
