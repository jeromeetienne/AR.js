// @namespace
var ARjs = ARjs || {}

/**
 * Create an anchor in the real world
 * 
 * @param {ARjs.Session} arSession - the session on which we create the anchor
 * @param {Object} markerParameters - parameter of this anchor
 */
ARjs.Anchor = function(arSession, markerParameters){
	var _this = this
	var arContext = arSession.arContext
	var scene = arSession.scene
	var camera = arSession.camera

	var markerRoot = new THREE.Group
	scene.add(markerRoot)

	if( markerParameters.changeMatrixMode === 'modelViewMatrix' ){
		var markerControls = new THREEx.ArMarkerControls(arContext, markerRoot, markerParameters)		
	}else if( markerParameters.changeMatrixMode === 'cameraTransformMatrix' ){
		var markerControls = new THREEx.ArMarkerControls(arContext, camera, markerParameters)
	}else console.assert(false)

// FIXME tango - the pickability is on the marker
// - aka handle the object positioning in a special function of ArMarkerControls
// - arkitanchor is like ArMarkerControls
// - make it generic to work on plane too, if the marker is markerBased


	// build a smoothedControls
	var smoothedRoot = new THREE.Group()
	scene.add(smoothedRoot)
	var smoothedControls = new THREEx.ArSmoothedControls(smoothedRoot)
	
	this.object3d = new THREE.Group()
	// markerRoot.add(arWorldRoot)
	smoothedRoot.add(this.object3d)	


	this.update = function(){
		// update scene.visible if the marker is seen
		if( markerParameters.changeMatrixMode === 'cameraTransformMatrix' ){
			_this.object3d.visible = smoothedRoot.visible
		}
		
		// update smoothedControls
		smoothedControls.update(markerRoot)
	}

}


/**
 * Apply ARjs.Session.HitTestResult to the controlled object3d
 * 
 * @param {ARjs.Session.HitTestResult} hitTestResult - the result to apply
 */
ARjs.Anchor.prototype.applyHitTestResult = function(hitTestResult){
	this.object3d.position.copy(hitTestResult.position)
	this.object3d.quaternion.copy(hitTestResult.quaternion)
	this.object3d.scale.copy(hitTestResult.scale)

	this.object3d.updateMatrix()
}
