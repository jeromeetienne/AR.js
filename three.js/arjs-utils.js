var ARjs = ARjs || {}
ARjs.Utils = {}

/**
 * Create a default rendering camera for this trackingBackend. They may be modified later. to fit physical camera parameters
 * @param {string} trackingBackend - the tracking to user
 * @return {THREE.Camera} the created camera
 */
ARjs.Utils.createDefaultCamera = function(trackingBackend){
	// Create a camera
	if( trackingBackend === 'artoolkit' ){
		var camera = new THREE.Camera();
	}else if( trackingBackend === 'aruco' ){
		var camera = new THREE.PerspectiveCamera(42, renderer.domElement.width / renderer.domElement.height, 0.01, 100);
	}else if( trackingBackend === 'tango' ){
		var camera = new THREE.PerspectiveCamera(42, renderer.domElement.width / renderer.domElement.height, 0.01, 100);
	}else console.assert(false)

	return camera
}


ARjs.Utils.isTango = function(){
	var isTango = navigator.userAgent.match('Chrome/57.0.2987.5') !== null ? true : false
	return isTango
}
