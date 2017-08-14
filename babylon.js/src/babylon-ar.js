// @namespace
var ARjs = ARjs || {}

ARjs.Babylon = {}
ARjs.Babylon.Session = function(arProfile, canvasElement){
	// init renderer
	var renderer	= new THREE.WebGLRenderer({
		antialias: true,
		alpha: true
	})
	renderer.setClearColor(new THREE.Color('lightgrey'), 0)
	renderer.setSize( 640, 480 )
	renderer.domElement.style.position = 'absolute'
	renderer.domElement.style.top = '0px'
	renderer.domElement.style.left = '0px'
// NOTE: can i avoid to have a renderer ?


	// init scene and camera
	var scene	= new THREE.Scene()

	var trackingMethod = 'area-artoolkit'

	//////////////////////////////////////////////////////////////////////////////////
	//		Initialize the camera
	//////////////////////////////////////////////////////////////////////////////////

	var camera = ARjs.Utils.createDefaultCamera(trackingMethod)
	scene.add(camera)

	//////////////////////////////////////////////////////////////////////////////
	//		build ARjs.Session
	//////////////////////////////////////////////////////////////////////////////
// NOTE: this goes directly in 
	var arSession = new ARjs.Session({
		scene: scene,
		renderer: renderer,
		camera: camera,
		sourceParameters: arProfile.sourceParameters,
		contextParameters: arProfile.contextParameters		
	})

	//////////////////////////////////////////////////////////////////////////////
	//		Code Separator
	//////////////////////////////////////////////////////////////////////////////


	this.update = function(){

		arSession.update()		
		scene.updateMatrixWorld()

		// resize babylon canvas - put that in bARSession
		arSession.arSource.copyElementSizeTo(canvasElement)
	}

	this._renderer = renderer
	this._scene = scene
	this._camera = camera
	this._arSession = arSession

}

ARjs.Babylon.Session.prototype.updateAnchor = function(arAnchor, babylonCamera){
	var threejsCamera = this._camera

	arAnchor.update()
	ARjs.Babylon.updateObjectPose(babylonCamera, threejsCamera)

	this.updateProjectionMatrix(babylonCamera)
}

ARjs.Babylon.Session.prototype.updateProjectionMatrix = function(babylonCamera){
	var projectionMatrixArr = this._camera.projectionMatrix.toArray()
	var babylonMatrix = BABYLON.Matrix.FromArray(projectionMatrixArr)
	babylonCamera.freezeProjectionMatrix(babylonMatrix)
}

//////////////////////////////////////////////////////////////////////////////
//		Code Separator
//////////////////////////////////////////////////////////////////////////////

ARjs.Babylon.createCamera = function(scene){
	var babylonCamera = new BABYLON.ArcRotateCamera("blabla",  0, 0, 0, new BABYLON.Vector3(0, 0, -1), scene);

	// hard code a fov which is kinda similar to default camera
	// scene.activeCamera.fovmode = BABYLON.Camera.fovmode_HORIZONTAL_FIXED;
	// scene.activeCamera.fov = 2*22 / 180*Math.PI

	return babylonCamera
}

ARjs.Babylon.updateCamera = function(babylonCamera, threeCamera){
	var projectionMatrixArr = threeCamera.projectionMatrix.toArray()
	var babylonMatrix = BABYLON.Matrix.FromArray(projectionMatrixArr)
	babylonCamera.freezeProjectionMatrix(babylonMatrix)
}

ARjs.Babylon.updateObjectPose = function(babylonObject3D, threeObject3D){
	threeObject3D.updateMatrixWorld()

	// use modelViewMatrix
	var modelViewMatrix = threeObject3D.matrix
	babylonObject3D._computedViewMatrix = new BABYLON.Matrix.FromArray(modelViewMatrix.toArray());
	babylonObject3D._computedViewMatrix.invert()	
}

// function initRenderThreejs
ARjs.Babylon._addThreejsDebug = function(bARSession, arAnchor){
	// array of functions for the rendering loop
	var onRenderFcts= [];

	//////////////////////////////////////////////////////////////////////////////////
	//		add an object in the scene
	//////////////////////////////////////////////////////////////////////////////////
	
	var scene = bARSession._scene
	var renderer = bARSession._renderer
	var camera = bARSession._camera
	
	var arWorldRoot = arAnchor.object3d
	
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
