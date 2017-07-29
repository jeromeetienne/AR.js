// @namespace
var ARjs = ARjs || {}

/**
 * Create an anchor in the real world
 * 
 * @param {ARjs.Session} arSession - the session on which we create the anchor
 * @param {Object} markerParameters - parameter of this anchor
 */
ARjs.HitTester = function(arSession){
	var _this = this
	var arContext = arSession.arContext
	var trackingBackend = arContext.parameters.trackingBackend

	this._arSession = arSession
	this._hitTesterPlane = null
	this._hitTesterTango = null

	if( trackingBackend === 'tango' ){
		_this._hitTesterTango = new THREEx.HitTesterTango(arContext)
	}else{
		_this._hitTesterPlane = new THREEx.HitTesterPlane(arSession.arSource.domElement)
	}
}

//////////////////////////////////////////////////////////////////////////////
//		update function
//////////////////////////////////////////////////////////////////////////////
/**
 * update
 * 
 * @param {THREE.Camera} camera   - the camera to use
 * @param {THREE.Object3D} object3d - 
 */
ARjs.HitTester.prototype.update = function (camera, pickingRoot, changeMatrixMode) {
	if( this._hitTesterTango !== null ){
		this._hitTesterTango.update()
	}else if( this._hitTesterPlane !== null ){
		this._hitTesterPlane.update(camera, pickingRoot, changeMatrixMode)
	}else console.assert(false)
}

//////////////////////////////////////////////////////////////////////////////
//		actual hit testing
//////////////////////////////////////////////////////////////////////////////

/**
 * Test the real world for intersections directly from a DomEvent
 * 
 * @param {Number} mouseX - position X of the hit [-1, +1]
 * @param {Number} mouseY - position Y of the hit [-1, +1]
 * @return {[ARjs.HitTester.Result]} - array of result
 */
ARjs.HitTester.prototype.testDomEvent = function(domEvent){
	var trackingBackend = this._arSession.arContext.parameters.trackingBackend
	var arSource = this._arSession.arSource
	
	if( trackingBackend === 'tango' ){
        	var mouseX = domEvent.pageX / window.innerWidth
        	var mouseY = domEvent.pageY / window.innerHeight
	}else{		
		// FIXME should not use css!!!
		var mouseX = domEvent.layerX / parseInt(arSource.domElement.style.width)
		var mouseY = domEvent.layerY / parseInt(arSource.domElement.style.height)
	}

	return this.test(mouseX, mouseY)
}

/**
 * Test the real world for intersections.
 * 
 * @param {Number} mouseX - position X of the hit [0, +1]
 * @param {Number} mouseY - position Y of the hit [0, +1]
 * @return {[ARjs.HitTester.Result]} - array of result
 */
ARjs.HitTester.prototype.test = function(mouseX, mouseY){
	var arContext = this._arSession.arContext
	var trackingBackend = arContext.parameters.trackingBackend
	var hitTestResults = []

	var result = null
	if( trackingBackend === 'tango' ){
		var result = this._hitTesterTango.test(mouseX, mouseY)
	}else{
		var result = this._hitTesterPlane.test(mouseX, mouseY)
	}
			
	// if no result is found, return now
	if( result === null )	return hitTestResults

	// build a ARjs.HitTester.Result
	var hitTestResult = new ARjs.HitTester.Result(result.position, result.quaternion, result.scale)
	hitTestResults.push(hitTestResult)
	
	return hitTestResults
}

//////////////////////////////////////////////////////////////////////////////
//		ARjs.HitTester.Result
//////////////////////////////////////////////////////////////////////////////
/**
 * Contains the result of ARjs.HitTester.test()
 * 
 * @param {THREE.Vector3} position - position to use
 * @param {THREE.Quaternion} quaternion - quaternion to use
 * @param {THREE.Vector3} scale - scale
 */
ARjs.HitTester.Result = function(position, quaternion, scale){
	this.position = position
	this.quaternion = quaternion
	this.scale = scale
}
