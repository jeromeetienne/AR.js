// @namespace
var ARjs = ARjs || {}

ARjs.LiteGL = {}


//////////////////////////////////////////////////////////////////////////////
//		Code Separator
//////////////////////////////////////////////////////////////////////////////
ARjs.LiteGL.Session = function(arProfile, canvasElement){

	// debugger

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
	//		tango specifics
	//////////////////////////////////////////////////////////////////////////////
	
	if( arProfile.contextParameters.trackingBackend === 'tango' ){
		// init tangoVideoMesh
		var tangoVideoMesh = new ARjs.TangoVideoMesh(arSession)
		onRenderFcts.push(function(){
			tangoVideoMesh.update()
		})
	}

	if( arProfile.contextParameters.trackingBackend === 'tango' ){
		// init tangoPointCloud
		var tangoPointCloud = new ARjs.TangoPointCloud(arSession)
		scene.add(tangoPointCloud.object3d)
	}

	
	//////////////////////////////////////////////////////////////////////////////
	//		Code Separator
	//////////////////////////////////////////////////////////////////////////////


	this.update = function(){
		arSession.update()
		scene.updateMatrixWorld()

		// resize babylon canvas - put that in bARSession
		arSession.arSource.copyElementSizeTo(canvasElement)
	}


	this._tangoPointCloud = tangoPointCloud
	this._tangoVideoMesh = tangoVideoMesh
	this._renderer = renderer
	this._scene = scene
	this._camera = camera
	this._arSession = arSession

}


ARjs.LiteGL.Session.prototype.updateAnchor = function(arAnchor, liteglCamera){
	var threejsCamera = this._camera

	arAnchor.update()

	ARjs.LiteGL.updateObjectPose(liteglCamera, threejsCamera)
}

ARjs.LiteGL.Session.prototype.updateProjectionMatrix = function(liteglCamera){
	var projectionMatrixArr = this._camera.projectionMatrix.toArray()
	
	console.warn('updateProjectionMatrix not coded')

	// var babylonMatrix = BABYLON.Matrix.FromArray(projectionMatrixArr)
	// babylonCamera.freezeProjectionMatrix(babylonMatrix)
}

//////////////////////////////////////////////////////////////////////////////
//		Code Separator
//////////////////////////////////////////////////////////////////////////////

ARjs.LiteGL.createCamera = function(scene){
console.warn('ARjs.LiteGL.createCamera not ported to litegl')
	var babylonCamera = new BABYLON.ArcRotateCamera("arjsCamera",  0, 0, 0, new BABYLON.Vector3(0, 0, -1), scene);

	// hard code a fov which is kinda similar to default camera
	// scene.activeCamera.fovmode = BABYLON.Camera.fovmode_HORIZONTAL_FIXED;
	// scene.activeCamera.fov = 2*22 / 180*Math.PI

	return babylonCamera
}

ARjs.LiteGL.updateCamera = function(babylonCamera, threeCamera){
	var projectionMatrixArr = threeCamera.projectionMatrix.toArray()

console.warn('ARjs.LiteGL.updateCamera not ported to litegl')
	// var babylonMatrix = BABYLON.Matrix.FromArray(projectionMatrixArr)
	// babylonCamera.freezeProjectionMatrix(babylonMatrix)
}

ARjs.LiteGL.updateObjectPose = function(liteglObject3D, threeObject3D){
	threeObject3D.updateMatrixWorld()
	
	// var position = new THREE.Vector3()	
	// var quaternion = new THREE.Quaternion()	
	// var scale = new THREE.Vector3()	
	// threeObject3D.matrix.decompose(position, quaternion, scale)


	// var positionArray = position.toArray()
	// liteglObject3D.eye = positionArray
	// liteglObject3D.center = [0,0,0]

	// position.multiplyScalar(200)
	// liteglObject3D.transform.position = position.toArray()
	// liteglObject3D.transform.rotation = quaternion.toArray()
	// liteglObject3D.transform.scaling = scale.toArray()
	
	// var modelViewMatrix = threeObject3D.matrix
	// liteglObject3D.fromViewMatrix(modelViewMatrix.toArray())

	var modelViewMatrix = new THREE.Matrix4()
	modelViewMatrix.getInverse(threeObject3D.matrix)
	liteglObject3D.fromViewMatrix(modelViewMatrix.toArray())

// console.warn('ARjs.LiteGL.updateObjectPose not ported to litegl')
}


//////////////////////////////////////////////////////////////////////////////
//		Debug function to display three.js on top
//////////////////////////////////////////////////////////////////////////////

// function initRenderThreejs
ARjs.LiteGL._addThreejsDebug = function(lARSession, arAnchor){
	// array of functions for the rendering loop
	var onRenderFcts= [];

	//////////////////////////////////////////////////////////////////////////////////
	//		add an object in the scene
	//////////////////////////////////////////////////////////////////////////////////
	
	var scene = lARSession._scene
	var renderer = lARSession._renderer
	var camera = lARSession._camera
	
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
