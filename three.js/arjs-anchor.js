// @namespace
var ARjs = ARjs || {}

/**
 * Create an anchor in the real world
 * 
 * @param {ARjs.Session} arSession - the session on which we create the anchor
 * @param {Object} markerParameters - parameter of this anchor
 */
ARjs.Anchor = function(arSession, markerParameters){
	var arContext = arSession.arContext

	var markerRoot = new THREE.Group
	scene.add(markerRoot)

	if( markerParameters.changeMatrixMode === 'modelViewMatrix' ){
		var markerControls = new THREEx.ArMarkerControls(arContext, markerRoot, markerParameters		
	}else if( markerParameters.changeMatrixMode === 'cameraTransformMatrix' ){
		var markerControls = new THREEx.ArMarkerControls(arContext, camera, markerParameters)
	}else console.assert(false)

// FIXME tango - the pickability is on the marker
// - aka handle the object positioning in a special function of ArMarkerControls
// - arkitanchor is like ArMarkerControls
// - make it generic to work on plane too, if the marker is markerBased
// - rename it ArAnchorControls ?
// - thus it is clear it isnt a marker - good for arkit and tango

	// if( changeMatrixMode === 'cameraTransformMatrix' ){
	// 	onRenderFcts.push(function(){
	// 		// update scene.visible if the marker is seen
	// 		arWorldRoot.visible = smoothedRoot.visible
	// 	})
	// }
	
	// build a smoothedControls
	var smoothedRoot = new THREE.Group()
	scene.add(smoothedRoot)
	var smoothedControls = new THREEx.ArSmoothedControls(smoothedRoot)
	// onRenderFcts.push(function(delta){
	// 	smoothedControls.update(markerRoot)
	// })
	
	this.update = function(){
		if( markerParameters.changeMatrixMode === 'cameraTransformMatrix' ){
			onRenderFcts.push(function(){
				// update scene.visible if the marker is seen
				arWorldRoot.visible = smoothedRoot.visible
			})
		}
		
		smoothedControls.update(markerRoot)
	}

	// var arWorldRoot = smoothedRoot
	this.object3d = new THREE.Group()
	// markerRoot.add(arWorldRoot)
	smoothedRoot.add(this.object3d)	
}


/**
 * Apply ARjs.Session.HitTestResult to the controlled object3d
 * 
 * @param {ARjs.Session.HitTestResult} hitTestResult - the result to apply
 */
ARjs.Anchor.prototype.applyHitTestResult = function(hitTestResult){
	this.object3d.position.copy(this.object3d.position)
	this.object3d.quaternion.copy(this.object3d.quaternion)
	this.object3d.scale.copy(this.object3d.scale)

	this.object3d.computeMatrix()
}
