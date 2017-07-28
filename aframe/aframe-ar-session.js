/**
 * - trackingMethod : aruco got perspective issue
 * - a-marker-camera dont put the object on the marker 
 *   - my guess: issue in scene graphe - controlled object
 * - trackingMethod: artoolkit + area-artoolkit seems to work in modelViewMatrix
 * - 
 * 
 */

//////////////////////////////////////////////////////////////////////////////
//		Code Separator
//////////////////////////////////////////////////////////////////////////////

// to keep backward compatibility with deprecated code
// AFRAME.registerComponent('arjs', buildSystemParameter())
// AFRAME.registerComponent('artoolkit', buildSystemParameter())

// function buildSystemParameter(){ return {
// AFRAME.registerSystem('arjs', {
AFRAME.registerSystem('arjs', {
	schema: {
		trackingMethod : {
			type: 'string',	
			default: 'best',			
		},
		debugUIEnabled :{
			type: 'boolean',	
			default: false,			
		},
		areaLearningButton : {
			type: 'boolean',	
			default: true,
		},
		performanceProfile : {
			type: 'string',	
			default: 'default',
		},

		// old parameters
		debug : {
			type: 'boolean',
			default: false
		},
		detectionMode : {
			type: 'string',
			default: '',
		},
		matrixCodeType : {
			type: 'string',
			default: '',
		},
		cameraParametersUrl : {
			type: 'string',
			default: '',
		},
		maxDetectionRate : {
			type: 'number',
			default: -1
		},
		sourceType : {
			type: 'string',
			default: '',
		},
		sourceUrl : {
			type: 'string',
			default: '',
		},
		sourceWidth : {
			type: 'number',
			default: -1
		},
		sourceHeight : {
			type: 'number',
			default: -1
		},
		displayWidth : {
			type: 'number',
			default: -1
		},
		displayHeight : {
			type: 'number',
			default: -1
		},
		canvasWidth : {
			type: 'number',
			default: -1
		},
		canvasHeight : {
			type: 'number',
			default: -1
		},
	},
	
	//////////////////////////////////////////////////////////////////////////////
	//		Code Separator
	//////////////////////////////////////////////////////////////////////////////
	
	
	init: function () {
		var _this = this
		
		
		//////////////////////////////////////////////////////////////////////////////
		//		setup arProfile
		//////////////////////////////////////////////////////////////////////////////

		var arProfile = this._arProfile = new ARjs.Profile()
			.trackingMethod(this.data.trackingMethod)
			.performance(this.data.performanceProfile)
			.defaultMarker()

		//////////////////////////////////////////////////////////////////////////////
		//		honor this.data and setup arProfile with it
		//////////////////////////////////////////////////////////////////////////////

		// honor this.data and push what has been modified into arProfile
		if( this.data.debug !== false )			arProfile.contextParameters.debug = this.data.debug
		if( this.data.detectionMode !== '' )		arProfile.contextParameters.detectionMode = this.data.detectionMode
		if( this.data.matrixCodeType !== '' )		arProfile.contextParameters.matrixCodeType = this.data.matrixCodeType
		if( this.data.cameraParametersUrl !== '' )	arProfile.contextParameters.cameraParametersUrl = this.data.cameraParametersUrl
		if( this.data.maxDetectionRate !== -1 )		arProfile.contextParameters.maxDetectionRate = this.data.maxDetectionRate
		if( this.data.canvasWidth !== -1 )		arProfile.contextParameters.canvasWidth = this.data.canvasWidth
		if( this.data.canvasHeight !== -1 )		arProfile.contextParameters.canvasHeight = this.data.canvasHeight

		if( this.data.sourceType !== '' )		arProfile.sourceParameters.sourceType = this.data.sourceType
		if( this.data.sourceUrl !== '' )		arProfile.sourceParameters.sourceUrl = this.data.sourceUrl
		if( this.data.sourceWidth !== -1 )		arProfile.sourceParameters.sourceWidth = this.data.sourceWidth
		if( this.data.sourceHeight !== -1 )		arProfile.sourceParameters.sourceHeight = this.data.sourceHeight
		if( this.data.displayWidth !== -1 )		arProfile.sourceParameters.displayWidth = this.data.displayWidth
		if( this.data.displayHeight !== -1 )		arProfile.sourceParameters.displayHeight = this.data.displayHeight

		arProfile.checkIfValid()

		//////////////////////////////////////////////////////////////////////////////
		//		Code Separator
		//////////////////////////////////////////////////////////////////////////////

		this._arSession = null

		_this.initialised = false
		this.el.sceneEl.addEventListener('renderstart', function(){
			var sceneEl = _this.el.sceneEl
			var scene = sceneEl.object3D
			var camera = sceneEl.camera
			var renderer = sceneEl.renderer

			//////////////////////////////////////////////////////////////////////////////
			//		build ARjs.Session
			//////////////////////////////////////////////////////////////////////////////
			var arSession = _this._arSession = new ARjs.Session({
				scene: scene,
				renderer: renderer,
				camera: camera,
				sourceParameters: arProfile.sourceParameters,
				contextParameters: arProfile.contextParameters		
			})

			// KLUDGE
			window.addEventListener('resize', onResize)
			function onResize(){
				var arSource = _this._arSession.arSource
				// ugly kludge to get resize on aframe... not even sure it works
				arSource.copyElementSizeTo(document.body)
				
				var buttonElement = document.querySelector('.a-enter-vr')
				if( buttonElement ){
					buttonElement.style.position = 'fixed'
				}
			}

			_this.initialised = true

			//////////////////////////////////////////////////////////////////////////////
			//		tango specifics
			//////////////////////////////////////////////////////////////////////////////
			_this._tangoVideoMesh = null
			_this._tangoPointCloud = null
			if( arProfile.contextParameters.trackingBackend === 'tango' ){
				// init tangoVideoMesh
				var tangoVideoMesh = _this._tangoVideoMesh = new ARjs.TangoVideoMesh(arSession)
				
				// init tangoPointCloud
				var tangoPointCloud = _this._tangoPointCloud = new ARjs.TangoPointCloud(arSession)
				scene.add(tangoPointCloud.object3d)
			}


			//////////////////////////////////////////////////////////////////////////////
			//		honor .debugUIEnabled
			//////////////////////////////////////////////////////////////////////////////
			if( _this.data.debugUIEnabled ){
				document.querySelector('#trackingMethod').innerHTML = _this.data.trackingMethod
				if( arProfile.contextParameters.trackingBackend === 'tango' ){
					document.querySelector('#buttonTangoTogglePointCloud').addEventListener('click', function(){
						if( tangoPointCloud.object3d.parent ){
							scene.remove(tangoPointCloud.object3d)
						}else{
							scene.add(tangoPointCloud.object3d)			
						}
					})
				}else{
					document.querySelector('#buttonTangoTogglePointCloud').style.display = 'none'
				}				
			}
		})

		//////////////////////////////////////////////////////////////////////////////
		//		Code Separator
		//////////////////////////////////////////////////////////////////////////////
// TODO this is crappy - code an exponential backoff - max 1 seconds
		// KLUDGE: kludge to write a 'resize' event
		var startedAt = Date.now()
		var timerId = setInterval(function(){
			if( Date.now() - startedAt > 10*1000 ){
				clearInterval(timerId)
				return 					
			}
			// onResize()
			window.dispatchEvent(new Event('resize'));
		}, 1000/30)
	},
	
	tick : function(now, delta){
		var _this = this
		// skip it if not yet isInitialised
		if( this.initialised === false )	return


		var arSession = this._arSession

		// update arSession
		this._arSession.update()
		
		if( _this._tangoVideoMesh !== null )	_this._tangoVideoMesh.update()

		// copy projection matrix to camera
		// TODO just call a this._arSession.onResize()
		var camera = this.el.sceneEl.camera
		var renderer = this.el.sceneEl.renderer
		var arContext = this._arSession.arContext
		this._arSession.arSource.onResize2(arContext, renderer, camera)
	},
})


//////////////////////////////////////////////////////////////////////////////
//		arjsmarker
//////////////////////////////////////////////////////////////////////////////
AFRAME.registerComponent('arjsmarker', {
	dependencies: ['arjs', 'artoolkit'],
	schema: {
		preset: {
			type: 'string',
		},
		markerhelpers : {	// IIF preset === 'area'
			type: 'boolean',
			default: false,
		},

		// controls parameters
		size: {
			type: 'number',
			default: 1
		},
		type: {
			type: 'string',
		},
		patternUrl: {
			type: 'string',
		},
		barcodeValue: {
			type: 'number'
		},
		changeMatrixMode: {
			type: 'string',
			default : 'modelViewMatrix',
		},
		minConfidence: {
			type: 'number',
			default: 0.6,
		},
	},
	init: function () {
		var _this = this

		// get arjsSystem
		var arjsSystem = this.el.sceneEl.systems.arjs || this.el.sceneEl.systems.artoolkit

		//////////////////////////////////////////////////////////////////////////////
		//		Code Separator
		//////////////////////////////////////////////////////////////////////////////

		_this.initialised = false
		_this._arAnchor = null

		if( _this.data.changeMatrixMode === 'modelViewMatrix' ){
			_this.el.object3D.visible = false
		}else if( _this.data.changeMatrixMode === 'cameraTransformMatrix' ){
 			_this.el.sceneEl.object3D.visible = false
		}else console.assert(false)

		// trick to wait until arjsSystem is initialised
		var startedAt = Date.now()
		var timerId = setInterval(function(){
			// wait until the system is initialised
			if( arjsSystem.initialised === false )	return

			clearInterval(timerId)

			//////////////////////////////////////////////////////////////////////////////
			//		create arAnchor
			//////////////////////////////////////////////////////////////////////////////
			var arProfile = arjsSystem._arProfile
			
			// arProfile.changeMatrixMode('modelViewMatrix')
			arProfile.changeMatrixMode(_this.data.changeMatrixMode)

			var arProfile = arjsSystem._arProfile
			var arSession = arjsSystem._arSession

			var arAnchor = _this._arAnchor = new ARjs.Anchor(arSession, arProfile.defaultMarkerParameters)

			_this.initialised = true

			//////////////////////////////////////////////////////////////////////////////
			//		honor .debugUIEnabled
			//////////////////////////////////////////////////////////////////////////////
			if( arjsSystem.data.debugUIEnabled ){
				if( arAnchor.parameters.markersAreaEnabled ){
					var subMarkerHelpersVisible = false
					document.querySelector('#buttonToggleMarkerHelpers').addEventListener('click', function(){
						subMarkerHelpersVisible = subMarkerHelpersVisible ? false : true
						arAnchor.markersArea.setSubMarkersVisibility(subMarkerHelpersVisible)
					})


					document.querySelector('#buttonMarkersAreaReset').addEventListener('click', function(){
						var trackingBackend = arProfile.contextParameters.trackingBackend
						THREEx.ArMultiMarkerUtils.storeDefaultMultiMarkerFile(trackingBackend)
						location.reload()
					})

					document.querySelector('#buttonMarkersAreaLearner').addEventListener('click', function(){
						var learnerBaseURL = THREEx.ArToolkitContext.baseURL + 'examples/multi-markers/examples/learner.html'
						var trackingBackend = arProfile.contextParameters.trackingBackend
						THREEx.ArMultiMarkerUtils.navigateToLearnerPage(learnerBaseURL, trackingBackend)
					})		
				}else{
					document.querySelector('#buttonToggleMarkerHelpers').style.display = 'none'
					document.querySelector('#buttonMarkersAreaReset').style.display = 'none'
					document.querySelector('#buttonMarkersAreaLearner').style.display = 'none'
				}
			}
		}, 1000/60)
	},
	remove : function(){
	},
	update: function () {
	},
	tick: function(){
		var _this = this
		if( this.initialised === false )	return

		//////////////////////////////////////////////////////////////////////////////
		//		update arAnchor
		//////////////////////////////////////////////////////////////////////////////
		var arjsSystem = this.el.sceneEl.systems.arjs || this.el.sceneEl.systems.artoolkit
		this._arAnchor.update()

		//////////////////////////////////////////////////////////////////////////////
		//		honor pose
		//////////////////////////////////////////////////////////////////////////////
		var arWorldRoot = this._arAnchor.object3d
		arWorldRoot.updateMatrixWorld(true)		
		arWorldRoot.matrixWorld.decompose(this.el.object3D.position, this.el.object3D.quaternion, this.el.object3D.scale)

		//////////////////////////////////////////////////////////////////////////////
		//		honor visibility
		//////////////////////////////////////////////////////////////////////////////
		if( _this._arAnchor.parameters.changeMatrixMode === 'modelViewMatrix' ){
			_this.el.object3D.visible = true
		}else if( _this._arAnchor.parameters.changeMatrixMode === 'cameraTransformMatrix' ){
			_this.el.sceneEl.object3D.visible = true
		}else console.assert(false)

		// TODO visibility of object doesnt work at all
		// - this._arAnchor.object3d.visible doesnt seem to be honored
		// - likely an issue from upstream

		// console.log('arWorldRoot.visible', arWorldRoot.visible)
	}
});

//////////////////////////////////////////////////////////////////////////////
//                define some primitives shortcuts
//////////////////////////////////////////////////////////////////////////////

AFRAME.registerPrimitive('a-marker', AFRAME.utils.extendDeep({}, AFRAME.primitives.getMeshMixin(), {
	defaultComponents: {
		'arjsmarker': {},
	},
	mappings: {
		'type': 'arjsmarker.type',
		'size': 'arjsmarker.size',
		'url': 'arjsmarker.patternUrl',
		'value': 'arjsmarker.barcodeValue',
		'preset': 'arjsmarker.preset',
		'minConfidence': 'arjsmarker.minConfidence',
		'markerhelpers': 'arjsmarker.markerhelpers',
	}
}));

AFRAME.registerPrimitive('a-marker-camera', AFRAME.utils.extendDeep({}, AFRAME.primitives.getMeshMixin(), {
	defaultComponents: {
		'arjsmarker': {
			changeMatrixMode: 'cameraTransformMatrix'
		},
		'camera': true,
	},
	mappings: {
		'type': 'arjsmarker.type',
		'size': 'arjsmarker.size',
		'url': 'arjsmarker.patternUrl',
		'value': 'arjsmarker.barcodeValue',
		'preset': 'arjsmarker.preset',
		'minConfidence': 'arjsmarker.minConfidence',
		'markerhelpers': 'arjsmarker.markerhelpers',
	}
}));
