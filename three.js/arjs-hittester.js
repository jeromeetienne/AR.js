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
	this.arSession = arSession

	var arContext = this.arSession.arContext
	var trackingBackend = arContext.parameters.trackingBackend

	if( trackingBackend === 'tango' ){
		// Do nothing...
	}else{
		arContext.addEventListener('initialized', function(event){
			_this._arClickability = new THREEx.ARClickability(arSession.arSource.domElement)
			_this._pickingScene = new THREE.Scene
			
			var geometry = new THREE.PlaneGeometry(20,20,19,19).rotateX(-Math.PI/2)
			var geometry = new THREE.PlaneGeometry(20,20).rotateX(-Math.PI/2)
			var material = new THREE.MeshBasicMaterial({
				opacity: 0.5,
				transparent: true,
				wireframe: true
			})
			material.visible = false
			_this._pickingPlane = new THREE.Mesh(geometry, material)
			_this._pickingScene.add(_this._pickingPlane)
		})		
	}


}


ARjs.HitTester.prototype.update = function (camera, object3d) {
	var arContext = this.arSession.arContext
	var trackingBackend = arContext.parameters.trackingBackend

	if( trackingBackend === 'tango' ){
		// Do nothing...
	}else{
		if( arContext.initialized === false )	return

		this._arClickability.onResize()
		
		// // set cameraPicking position
		var cameraPicking = this._arClickability._cameraPicking
		// camera.updateMatrixWorld()
		// cameraPicking.matrix.copy(object3d.matrixWorld)
		// cameraPicking.matrix.decompose(cameraPicking.position, cameraPicking.quaternion, cameraPicking.scale)				


		// set pickingPlane position
		var pickingPlane = this._pickingPlane
		object3d.parent.updateMatrixWorld()
		pickingPlane.matrix.copy(object3d.parent.matrixWorld)
		pickingPlane.matrix.decompose(pickingPlane.position, pickingPlane.quaternion, pickingPlane.scale)				

// var position = pickingPlane.position
// console.log('this._pickingPlane position', position.x.toFixed(2), position.y.toFixed(2), position.z.toFixed(2))
// var position = cameraPicking.position
// console.log('this.cameraPicking position', position.x.toFixed(2), position.y.toFixed(2), position.z.toFixed(2))

	}
}

/**
 * Test the real world for intersections.
 * 
 * @param {Number} mouseX - position X of the hit [-1, +1]
 * @param {Number} mouseY - position Y of the hit [-1, +1]
 * @return {[ARjs.HitTester.Result]} - array of result
 */
ARjs.HitTester.prototype.testDomEvent = function(domEvent){
	var trackingBackend = this.arSession.arContext.parameters.trackingBackend
	var arSource = this.arSession.arSource
	
	if( trackingBackend === 'tango' ){
        	var mouseX = domEvent.pageX / window.innerWidth
        	var mouseY = domEvent.pageY / window.innerHeight
	}else{		
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
	var arContext = this.arSession.arContext
	var trackingBackend = arContext.parameters.trackingBackend
	var hitTestResults = []

	if( trackingBackend === 'tango' ){
		var result = THREEx.ARClickability.tangoPickingPointCloud(arContext, mouseX, mouseY)
		if( result !== null ){
			var scale = new THREE.Vector3(1,1,1).multiplyScalar(0.1)
			var hitTestResult = new ARjs.HitTester.Result(result.position, result.quaternion, scale)
			hitTestResults.push(hitTestResult)
		}		
	}else{
		
		mouseX = (mouseX-0.5)*2
		mouseY =-(mouseY-0.5)*2
		
		this._pickingScene.updateMatrixWorld(true)
		// compute intersections between mouseVector3 and pickingPlane
		var raycaster = new THREE.Raycaster();
		var mouseVector3 = new THREE.Vector3(mouseX, mouseY, 1);
		raycaster.setFromCamera( mouseVector3, this._arClickability._cameraPicking );
		var intersects = raycaster.intersectObjects( [this._pickingPlane] )
	
		// if no intersection occurs, return now
		if( intersects.length > 0 ){
			// console.log('mouseX', mouseX, 'mouseY', mouseY)
			// console.log(intersects[0].point)
			// set new demoRoot position
			var newPosition = this._pickingPlane.worldToLocal( intersects[0].point.clone() )
			// console.log(newPosition)

			var scale = new THREE.Vector3(1,1,1).multiplyScalar(1)
			var hitTestResult = new ARjs.HitTester.Result(newPosition, new THREE.Quaternion, scale)
			hitTestResults.push(hitTestResult)
		}
	}
			
	// TODO use clickability
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
