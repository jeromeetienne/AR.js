var ARjs = ARjs || {}

function arSession_usage_example(){
	var arSession = new ARjs.Session({
		scene: scene,
		renderer: renderer,
		camera: camera,
		sourceParameters: sourceParameters,
		contextParameters: contextParameters
	})
	
	var arAnchor = new ARjs.Anchor(arSession, parameters)


	var intersects = asSession.hitTest(mouseX, mouseY)
	// intersects is an array of ARjs.HitTestingResult = function(position, quaternion, scale){}
	// similar intersects that three.js raycasting
	arAnchor.applyHitTestResult(intersects[0])
}

/**
 * define a ARjs.Session
 * 
 * @param {Object} parameters - parameters for this session
 */
ARjs.Session = function(parameters){
	var _this = this

	this.renderer = parameters.renderer
	this.camera = parameters.camera
	this.scene = parameters.scene

	//////////////////////////////////////////////////////////////////////////////
	//		init arSource
	//////////////////////////////////////////////////////////////////////////////
	var arSource = _this.arSource = new THREEx.ArToolkitSource(parameters.sourceParameters)

	arSource.init(function onReady(){
		arSource.onResize2(arContext, renderer, camera)
	})
	
	// handle resize
	window.addEventListener('resize', function(){
		arSource.onResize2(arContext, renderer, camera)
	})	
	
	//////////////////////////////////////////////////////////////////////////////
	//		init arContext
	//////////////////////////////////////////////////////////////////////////////
	
	// create atToolkitContext
	var arContext = _this.arContext = new THREEx.ArToolkitContext(parameters.contextParameters)
	
	// initialize it
	_this.arContext.init()
	
	arContext.addEventListener('initialized', function(event){
		arSource.onResize2(arContext, renderer, camera)
	})
	
	// update artoolkit on every frame
	onRenderFcts.push(function(){
		if( arSource.ready === false )	return
		
		arContext.update( arSource.domElement )
	})
}

//////////////////////////////////////////////////////////////////////////////
//		Hit Testing
//////////////////////////////////////////////////////////////////////////////

/**
 * Test the real world for intersections.
 * 
 * @param {Number} mouseX - position X of the hit [-1, +1]
 * @param {Number} mouseY - position Y of the hit [-1, +1]
 * @return {[ARjs.Session.HitTestResult]} - array of HitTestResult
 */
ARjs.Session.prototype.hitTest = function(mouseX, mouseY){
	// TODO use clickability
	return []
}

/**
 * Contains the result of arSession.hitTest.
 * 
 * @param {THREE.Vector3} position - position to use
 * @param {THREE.Quaternion} quaternion - quaternion to use
 * @param {THREE.Vector3} scale - scale
 * @return {[type]} [description]
 */
ARjs.Session.HitTestResult = function(position, quaternion, scale){
	this.position = position
	this.quaternion = quaternion
	this.scale = scale
}
