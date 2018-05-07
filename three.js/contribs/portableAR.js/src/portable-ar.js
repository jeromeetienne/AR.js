var PortableARjs = function(options){
	// sanity check
	console.assert(arguments.length <= 1)
	// handle default options
	options = options || {}
	options.debugUI = options.debugUI !== undefined ? options.debugUI : false
	options.renderThreejs = options.renderThreejs !== undefined ? options.renderThreejs : false
	this.options = options
	this._paused = false
	
	//////////////////////////////////////////////////////////////////////////////
	//		create arjsProfile
	//////////////////////////////////////////////////////////////////////////////
	
	var trackingMethod = 'area-artoolkit'
	var arjsProfile = new ARjs.Profile()
		.sourceWebcam()
		.trackingMethod(trackingMethod)
		.changeMatrixMode('cameraTransformMatrix')
		.defaultMarker()
		.checkIfValid()

	//////////////////////////////////////////////////////////////////////////////
	//		init three.js scene/camera
	//////////////////////////////////////////////////////////////////////////////
	// init scene and camera
	var threejsScene= new THREE.Scene()

	var threejsCamera = ARjs.Utils.createDefaultCamera(trackingMethod)
	threejsScene.add(threejsCamera)

	//////////////////////////////////////////////////////////////////////////////
	//		init three.js renderer - never rendered except if options.renderThreejs === true
	//////////////////////////////////////////////////////////////////////////////
	// init threejsRenderer
	// NOTE: can i avoid to have a renderer ?
	var threejsRenderer	= new THREE.WebGLRenderer({
		antialias: true,
		alpha: true
	})
	threejsRenderer.setClearColor(new THREE.Color('lightgrey'), 0)
	threejsRenderer.setSize( 640, 480 )
	threejsRenderer.domElement.style.position = 'absolute'
	threejsRenderer.domElement.style.top = '0px'
	threejsRenderer.domElement.style.left = '0px'


	//////////////////////////////////////////////////////////////////////////////
	//		build ARjs.Session
	//////////////////////////////////////////////////////////////////////////////

	var arjsSession = new ARjs.Session({
		scene: threejsScene,
		renderer: threejsRenderer,
		camera: threejsCamera,
		sourceParameters: arjsProfile.sourceParameters,
		contextParameters: arjsProfile.contextParameters		
	})
	this._arjsSession = arjsSession

	////////////////////////////////////////////////////////////////////////////////
	//          Create a ARjs.Anchor
	////////////////////////////////////////////////////////////////////////////////
	var arjsAnchor = new ARjs.Anchor(arjsSession, arjsProfile.defaultMarkerParameters)
	this._arjsAnchor = arjsAnchor

	this.cameraProjectionMatrix = []
	this.cameraTransformMatrix = []

	//////////////////////////////////////////////////////////////////////////////
	//		add options
	//////////////////////////////////////////////////////////////////////////////

	// add debugUI
	if( this.options.debugUI === true ){
		this._initOptionsDebugUI(arjsSession, arjsAnchor)
	}

	// add three.js debug
	if( this.options.renderThreejs === true ){
		this._initOptionRenderThreejs(treejsRenderer, threejsScene, threejsCamera, arjsAnchor)
	}

}

PortableARjs.prototype.update = function (canvasEl) {
	// honor this._paused 
	if( this._paused === true )	return

	// update arjsSession
	this._arjsSession.update()

	// update the arjsAnchor
	this._arjsAnchor.update()

	// resize babylon canvas
	this._arjsSession.arSource.copyElementSizeTo(canvasEl)

	// copy camera projectionMatrix and transformMatrix
	var threejsCamera = this._arjsSession.parameters.camera
	this.cameraProjectionMatrix = threejsCamera.projectionMatrix.toArray()
	this.cameraTransformMatrix = threejsCamera.matrix.toArray()
};

PortableARjs.prototype.pause = function (canvasEl) {
	// if it is already paused, do nothing
	if( this._paused === true )	return

	this._paused = true
	
	
}
PortableARjs.prototype.unpause = function (canvasEl) {
	// if it is already not paused, do nothing
	if( this._paused === false )	return

	this._paused = false
}

//////////////////////////////////////////////////////////////////////////////
//		Code Separator
//////////////////////////////////////////////////////////////////////////////

PortableARjs.prototype._initOptionsDebugUI = function(arjsSession, arjsAnchor){
	// create arjsDebugUIContainer if needed
	if( document.querySelector('#arjsDebugUIContainer') === null ){
		var domElement = document.createElement('div')
		domElement.id = 'arjsDebugUIContainer'
		domElement.setAttribute('style', 'position: fixed; bottom: 10px; width:100%; text-align: center; z-index: 1;color: grey;')
		document.body.appendChild(domElement)
	}


	var sessionDebugUI = new ARjs.SessionDebugUI(arjsSession)
	document.querySelector('#arjsDebugUIContainer').appendChild(sessionDebugUI.domElement)

	var anchorDebugUI = new ARjs.AnchorDebugUI(arjsAnchor)
	document.querySelector('#arjsDebugUIContainer').appendChild(anchorDebugUI.domElement)		
}

//////////////////////////////////////////////////////////////////////////////
//		Code Separator
//////////////////////////////////////////////////////////////////////////////

// function initRenderThreejs
PortableARjs.prototype._initOptionRenderThreejs = function(renderer, scene, camera, arjsAnchor){
	// array of functions for the rendering loop
	var onRenderFcts= [];

	var arWorldRoot = arjsAnchor.object3d

	//////////////////////////////////////////////////////////////////////////////////
	//		add an object in the scene
	//////////////////////////////////////////////////////////////////////////////////
	
	// add a torus knot	
	var geometry	= new THREE.CubeGeometry(1,1,1)
	var material	= new THREE.MeshNormalMaterial({
		transparent : true,
		opacity: 0.5,
		side: THREE.DoubleSide
	}) 
	var mesh	= new THREE.Mesh( geometry, material )
	mesh.position.y	= geometry.parameters.height/2
	arWorldRoot.add( mesh )
	
	var geometry	= new THREE.TorusKnotGeometry(0.3,0.1,64,16)
	var material	= new THREE.MeshNormalMaterial() 
	var mesh	= new THREE.Mesh( geometry, material )
	mesh.position.y	= 0.5
	arWorldRoot.add( mesh )
	
	onRenderFcts.push(function(delta){
		mesh.rotation.x += Math.PI*delta
	})
	
	//////////////////////////////////////////////////////////////////////////////////
	//		render the whole thing on the page
	//////////////////////////////////////////////////////////////////////////////////
	
	if( true ){
		document.body.appendChild( renderer.domElement )
		onRenderFcts.push(function(){
			renderer.render( scene, camera )
		})		
	}

	// run the rendering loop
	var lastTimeMsec= null
	requestAnimationFrame(function animate(nowMsec){
		// keep looping
		requestAnimationFrame( animate )
		// measure time
		lastTimeMsec	= lastTimeMsec || nowMsec-1000/60
		var deltaMsec	= Math.min(200, nowMsec - lastTimeMsec)
		lastTimeMsec	= nowMsec
		// call each update function
		onRenderFcts.forEach(function(onRenderFct){
			onRenderFct(deltaMsec/1000, nowMsec/1000)
		})
	})	
}
