var ARjs = ARjs || {}
ARjs.Utils = {}

/**
 * Create a default rendering camera for this trackingBackend. They may be modified later. to fit physical camera parameters
 * 
 * @param {string} trackingBackend - the tracking to user
 * @return {THREE.Camera} the created camera
 */
ARjs.Utils.createDefaultCamera = function(trackingMethod, vrDisplay){
	var trackingBackend = this.parseTrackingMethod(trackingMethod).trackingBackend
	// Create a camera
	if( trackingBackend === 'artoolkit' ){
		var camera = new THREE.Camera();
	}else if( trackingBackend === 'aruco' ){
		var camera = new THREE.PerspectiveCamera(42, window.innerWidth / window.innerHeight, 0.01, 100);
	}else if( trackingBackend === 'tango' ){
		var camera = new THREE.PerspectiveCamera(42, window.innerWidth / window.innerHeight, 0.01, 100);
	}else if( trackingBackend === 'arcore' ){
		var camera = new THREE.ARPerspectiveCamera(
                        vrDisplay,
                        42,
                        window.innerWidth / window.innerHeight,
                        vrDisplay.depthNear,
                        vrDisplay.depthFar
                );
		// var camera = new THREE.PerspectiveCamera(42, window.innerWidth / window.innerHeight, 0.01, 100);
	}else console.assert(false, 'unknown trackingBackend: '+trackingBackend)

	return camera
}

/**
 * test if the code is running on tango
 * 
 * @return {boolean} - true if running on tango, false otherwise
 */
ARjs.Utils.isTango = function(){
	// FIXME: this test is super bad
	var isTango = navigator.userAgent.match('Chrome/57.0.2987.5') !== null ? true : false
	return isTango
}


/**
 * test if the code is running on arcore
 * 
 * @return {boolean} - true if running on arcore, false otherwise
 */
ARjs.Utils.isARCore = function(){

	var isARKit = navigator.userAgent.match('AppleWebKit/604.1.38') !== null ? true : false
	if( isARKit === true )	return isARKit
	
	// return true
	// FIXME: this test is super bad
	var isARCore = navigator.userAgent.match('Build/OPR6.170623.012') !== null ? true : false
	return isARCore
}


/**
 * parse tracking method
 * 
 * @param {String} trackingMethod - the tracking method to parse
 * @return {Object} - various field of the tracking method
 */
ARjs.Utils.parseTrackingMethod = function(trackingMethod){

	// honor trackingMethod 'best'
	if( trackingMethod === 'best' ){
		if(  ARjs.Utils.isARCore() ){
			trackingMethod = 'arcore'	
		}else if(  ARjs.Utils.isTango() ){
			trackingMethod = 'tango'
		}else{
			trackingMethod = 'area-artoolkit'
		}
	}	

	if( trackingMethod.startsWith('area-') ){
		return {
			trackingBackend : trackingMethod.replace('area-', ''),
			markersAreaEnabled : true,
		}
	}else{
		return {
			trackingBackend : trackingMethod,
			markersAreaEnabled : false,
		}
	}
}
