var THREEx = THREEx || {}

/**
 * @class
 * 
 * @return {[type]} [description]
 */
THREEx.HitTesterTango = function(arContext){
	this._arContext = arContext
	// seems to be the object bounding sphere for picking
	this.boundingSphereRadius = 0.01
	// default result scale
	this.resultScale = new THREE.Vector3(1,1,1).multiplyScalar(0.1)
}

//////////////////////////////////////////////////////////////////////////////
//		update function
//////////////////////////////////////////////////////////////////////////////

THREEx.HitTesterTango.prototype.update = function(){
}

//////////////////////////////////////////////////////////////////////////////
//		Code Separator
//////////////////////////////////////////////////////////////////////////////
/**
 * do the actual testing
 * 
 * @param {ARjs.Context} arContext - context to use
 * @param {Number} mouseX    - mouse x coordinate in [0, 1]
 * @param {Numer} mouseY    - mouse y coordinate in [0, 1]
 * @return {Object} - result
 */
THREEx.HitTesterTango.prototype.test = function(mouseX, mouseY){
	var vrDisplay = this._arContext._tangoContext.vrDisplay
        if (vrDisplay === null ) return null
	
	if( vrDisplay.displayName !== "Tango VR Device" )	return null
	
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
                pointAndPlane, object3d, this.boundingSphereRadius
        )
	object3d.rotateZ(-Math.PI/2)

	// return the result
	var result = {
		position : object3d.position,
		quaternion : object3d.quaternion,
		scale : this.resultScale,
	}

	return result
}
