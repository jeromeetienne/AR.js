var THREEx = THREEx || {}

THREEx.HitTesterTango = function(){
}

THREEx.HitTesterTango.tangoPickingPointCloud = function(artoolkitContext, mouseX, mouseY){
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
