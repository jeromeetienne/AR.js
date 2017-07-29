// @namespace
var ARjs = ARjs || {}

// TODO this is a controls... should i give the object3d here ?
// not according to 'no three.js dependancy'

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
	
	this.parameters = markerParameters
	
	// log to debug
	console.log('ARjs.Anchor -', 'changeMatrixMode:', this.parameters.changeMatrixMode, '/ markersAreaEnabled:', markerParameters.markersAreaEnabled)


	var markerRoot = new THREE.Group
	scene.add(markerRoot)

	// set controlledObject depending on changeMatrixMode
	if( markerParameters.changeMatrixMode === 'modelViewMatrix' ){
		var controlledObject = markerRoot
	}else if( markerParameters.changeMatrixMode === 'cameraTransformMatrix' ){
		var controlledObject = camera
	}else console.assert(false)

	if( markerParameters.markersAreaEnabled === false ){
		var markerControls = new THREEx.ArMarkerControls(arContext, controlledObject, markerParameters)		
	}else{
		// sanity check - MUST be a trackingBackend with markers
		console.assert( arContext.parameters.trackingBackend === 'artoolkit' || arContext.parameters.trackingBackend === 'aruco' )
		// for multi marker
		if( localStorage.getItem('ARjsMultiMarkerFile') === null ){
			ARjs.MarkersAreaUtils.storeDefaultMultiMarkerFile(arContext.parameters.trackingBackend)
		}
		
		// get multiMarkerFile from localStorage
		console.assert( localStorage.getItem('ARjsMultiMarkerFile') !== null )
		var multiMarkerFile = localStorage.getItem('ARjsMultiMarkerFile')

		// set controlledObject depending on changeMatrixMode
		if( markerParameters.changeMatrixMode === 'modelViewMatrix' ){
			var parent3D = scene
		}else if( markerParameters.changeMatrixMode === 'cameraTransformMatrix' ){
			var parent3D = camera
		}else console.assert(false)
	
		// build a multiMarkerControls
		var multiMarkerControls = ARjs.MarkersAreaControls.fromJSON(arContext, parent3D, controlledObject, multiMarkerFile)
		
		// honor markerParameters.changeMatrixMode
		multiMarkerControls.parameters.changeMatrixMode = markerParameters.changeMatrixMode

		// create ArMarkerHelper - useful to debug
		var markerHelpers = []
		multiMarkerControls.subMarkersControls.forEach(function(subMarkerControls){
			// add an helper to visuable each sub-marker
			var markerHelper = new THREEx.ArMarkerHelper(subMarkerControls)
			markerHelper.object3d.visible = false
			// subMarkerControls.object3d.add( markerHelper.object3d )		
			subMarkerControls.object3d.add( markerHelper.object3d )		
			// add it to markerHelpers
			markerHelpers.push(markerHelper)
		})
		// define API specific to markersArea
		this.markersArea = {}
		this.markersArea.setSubMarkersVisibility = function(visible){
			markerHelpers.forEach(function(markerHelper){
				markerHelper.object3d.visible = visible
			})
		}
	}
	
	this.object3d = new THREE.Group()
		
	//////////////////////////////////////////////////////////////////////////////
	//		THREEx.ArSmoothedControls
	//////////////////////////////////////////////////////////////////////////////
	
	var shouldBeSmoothed = true
	if( arContext.parameters.trackingBackend === 'tango' ) shouldBeSmoothed = false 

	if( shouldBeSmoothed === true ){
		// build a smoothedControls
		var smoothedRoot = new THREE.Group()
		scene.add(smoothedRoot)
		var smoothedControls = new THREEx.ArSmoothedControls(smoothedRoot)
		smoothedRoot.add(this.object3d)	
	}else{
		markerRoot.add(this.object3d)
	}


	//////////////////////////////////////////////////////////////////////////////
	//		Code Separator
	//////////////////////////////////////////////////////////////////////////////
	this.update = function(){	
		// update scene.visible if the marker is seen
		if( markerParameters.changeMatrixMode === 'cameraTransformMatrix' ){
			_this.object3d.visible = controlledObject.visible
		}
		
		if( smoothedControls !== undefined ){
			// update smoothedControls parameters depending on how many markers are visible in multiMarkerControls
			if( multiMarkerControls !== undefined ){
				multiMarkerControls.updateSmoothedControls(smoothedControls)
			}

			// update smoothedControls
			smoothedControls.update(markerRoot)			
		}
	}
}


/**
 * Apply ARjs.Session.HitTestResult to the controlled object3d
 * 
 * @param {ARjs.HitTester.Result} hitTestResult - the result to apply
 */
ARjs.Anchor.prototype.applyHitTestResult = function(hitTestResult){
	
	
	this.object3d.position.copy(hitTestResult.position)
	this.object3d.quaternion.copy(hitTestResult.quaternion)
	this.object3d.scale.copy(hitTestResult.scale)

	this.object3d.updateMatrix()
}
