// @namespace
var ARjs = ARjs || {}

ARjs.TangoVideoMesh = function(arSession){
	var arContext = arSession.arContext
	var renderer = arSession.renderer

	var videoMesh = null
	var vrDisplay = null

	// Create the see through camera scene and camera
	var sceneOrtho = new THREE.Scene()
	var cameraOrtho = new THREE.OrthographicCamera( -1, 1, 1, -1, 0, 100 )		
this._sceneOrtho = sceneOrtho
this._cameraOrtho = cameraOrtho

	// tango only - init cameraMesh
	arContext.addEventListener('initialized', function(event){
		// sanity check
		console.assert( arContext.parameters.trackingBackend === 'tango' )
		// variable declaration
		vrDisplay = arContext._tangoContext.vrDisplay
		console.assert(vrDisplay, 'vrDisplay MUST be defined')
		// if vrDisplay isnt for tango, do nothing. It may be another vrDisplay (e.g. webvr emulator in chrome)
		if( vrDisplay.displayName !== "Tango VR Device" )	return
		// init videoPlane
		videoMesh = THREE.WebAR.createVRSeeThroughCameraMesh(vrDisplay)
		sceneOrtho.add(videoMesh)
	})
	
	//////////////////////////////////////////////////////////////////////////////
	//		Code Separator
	//////////////////////////////////////////////////////////////////////////////
	
	this.update = function(){
		// sanity check
		console.assert( arContext.parameters.trackingBackend === 'tango' )
		// if not yet initialized, return now
		if( videoMesh === null )	return
		// Make sure that the camera is correctly displayed depending on the device and camera orientations.
		THREE.WebAR.updateCameraMeshOrientation(vrDisplay, videoMesh)                        		
	}
	
	//////////////////////////////////////////////////////////////////////////////
	//		Code Separator
	//////////////////////////////////////////////////////////////////////////////
	
	this.render = function(){
		// sanity check
		console.assert( arContext.parameters.trackingBackend === 'tango' )
		// render sceneOrtho
		renderer.render( sceneOrtho, cameraOrtho )
		// Render the perspective scene
		renderer.clearDepth()		
	}
}
