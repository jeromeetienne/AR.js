// @namespace
var ARjs = ARjs || {}

/**
 * Create an anchor in the real world
 * 
 * @param {ARjs.Session} arSession - the session on which we create the anchor
 * @param {Object} markerParameters - parameter of this anchor
 */
ARjs.HitTester = function(arSession){
	this.arSession = arSession
}

/**
 * Test the real world for intersections.
 * 
 * @param {Number} mouseX - position X of the hit [-1, +1]
 * @param {Number} mouseY - position Y of the hit [-1, +1]
 * @return {[ARjs.HitTester.Result]} - array of result
 */
ARjs.HitTester.prototype.test = function(mouseX, mouseY){
	var arContext = this.arSession.arContext
	var hitTestResults = []

	var result = THREEx.ARClickability.tangoPickingPointCloud(arContext, mouseX, mouseY)
	if( result !== null ){
		var scale = new THREE.Vector3(1,1,1).multiplyScalar(0.1)
		var hitTestResult = new ARjs.HitTester.Result(result.position, result.quaternion, scale)
		hitTestResults.push(hitTestResult)
	}
			
	// TODO use clickability
	return hitTestResults
}

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
