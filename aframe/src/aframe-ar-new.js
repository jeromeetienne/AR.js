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
		trackingBackend : {
			type: 'string',	
			default: 'artoolkit',			
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

		// setup arProfile
		var arProfile = new THREEx.ArToolkitProfile()
		arProfile.sourceWebcam()
		arProfile.trackingBackend(this.data.trackingBackend)
		arProfile.performance(this.data.performanceProfile)

		// FIXME temporary placeholder - to reevaluate later
		if( this.data.trackingBackend === 'tango' ){
			arProfile.sourceImage(THREEx.ArToolkitContext.baseURL + '../data/images/img.jpg')
		}	

		//////////////////////////////////////////////////////////////////////////////
		//		honor this.data
		//////////////////////////////////////////////////////////////////////////////
		
		// honor this.data and push what has been modified into arProfile
		if( this.data.debug !== false )			arProfile.contextParameters.debug = this.data.debug
		if( this.data.detectionMode !== '' )		arProfile.contextParameters.detectionMode = this.data.detectionMode
		if( this.data.matrixCodeType !== '' )		arProfile.contextParameters.matrixCodeType = this.data.matrixCodeType
		if( this.data.cameraParametersUrl !== '' )	arProfile.contextParameters.cameraParametersUrl = this.data.cameraParametersUrl
		if( this.data.maxDetectionRate !== -1 )		arProfile.contextParameters.maxDetectionRate = this.data.maxDetectionRate

		if( this.data.sourceType !== '' )		arProfile.contextParameters.sourceType = this.data.sourceType
		if( this.data.sourceUrl !== '' )		arProfile.contextParameters.sourceUrl = this.data.sourceUrl
		if( this.data.sourceWidth !== -1 )		arProfile.contextParameters.sourceWidth = this.data.sourceWidth
		if( this.data.sourceHeight !== -1 )		arProfile.contextParameters.sourceHeight = this.data.sourceHeight
		if( this.data.displayWidth !== -1 )		arProfile.contextParameters.displayWidth = this.data.displayWidth
		if( this.data.displayHeight !== -1 )		arProfile.contextParameters.displayHeight = this.data.displayHeight
		if( this.data.canvasWidth !== -1 )		arProfile.contextParameters.canvasWidth = this.data.canvasWidth
		if( this.data.canvasHeight !== -1 )		arProfile.contextParameters.canvasHeight = this.data.canvasHeight

		////////////////////////////////////////////////////////////////////////////////
		//          handle arSource
		////////////////////////////////////////////////////////////////////////////////
		
		var arSource = new THREEx.ArToolkitSource(arProfile.sourceParameters)
		this.arSource = arSource
		arSource.init(function onReady(){
			// handle resize of renderer
			onResize()

			// kludge to write a 'resize' event - use exponentialBackoff delay
			var startedAt = Date.now()
			var exponentialBackoffDelay = 1000/60
			setTimeout(function callback(){
				if( Date.now() - startedAt > 5*1000 )	return 					
				// update delay
				exponentialBackoffDelay *= 1.5;
				exponentialBackoffDelay = Math.min(exponentialBackoffDelay, 1*1000)
				setTimeout(callback, exponentialBackoffDelay)
				// trigger a resize
				window.dispatchEvent(new Event('resize'));
			}, exponentialBackoffDelay)
		})


		// handle resize
		window.addEventListener('resize', onResize)
		function onResize(){
			// console.log(_this.el.sceneEl.camera)
			var camera = _this.el.sceneEl.camera
			var renderer = _this.el.sceneEl.renderer
			arSource.onResize2(arContext, renderer, camera)

			// ugly kludge to get resize on aframe... not even sure it works
			arSource.copyElementSizeTo(document.body)
			
			// change css of 'enter-vr' button
			var buttonElement = document.querySelector('.a-enter-vr')
			if( buttonElement )	buttonElement.style.position = 'fixed'
		}
		////////////////////////////////////////////////////////////////////////////////
		//          initialize arContext
		////////////////////////////////////////////////////////////////////////////////
		// create atToolkitContext
		var arContext = new THREEx.ArToolkitContext(arProfile.contextParameters)
		this.arContext = arContext
		// initialize it
		arContext.init()
		
		arContext.addEventListener('initialized', function(event){
			onResize()
		})
		
		
		// tango only - init cameraMesh
		arContext.addEventListener('initialized', function(event){
			if( _this.data.trackingBackend  !== 'tango' )	return
			var vrDisplay = arContext._tangoContext.vrDisplay
			console.assert(vrDisplay, 'vrDisplay MUST be defined')
			// special case for trackingBackend tango
			if( arContext.parameters.trackingBackend !== 'tango' )	return
			// if vrDisplay isnt for tango do nothing
			if( vrDisplay.displayName !== "Tango VR Device" )	return
			// init videoPlane
			var videoPlane = THREE.WebAR.createVRSeeThroughCameraMesh(vrDisplay)
			sceneOrtho.add(videoPlane)
			onRenderFcts.push(function(){
				// Make sure that the camera is correctly displayed depending on the device and camera orientations.
				THREE.WebAR.updateCameraMeshOrientation(vrDisplay, videoPlane)                        
			})		
		})

		//////////////////////////////////////////////////////////////////////////////
		//		area learning
		//////////////////////////////////////////////////////////////////////////////
		
		// export function to navigateToLearnerPage
		this.navigateToLearnerPage = function(){
			var learnerURL = THREEx.ArToolkitContext.baseURL + 'examples/multi-markers/examples/learner.html'
			THREEx.ArMultiMarkerUtils.navigateToLearnerPage(learnerURL, _this.data.trackingBackend)
		}

		// export function to initAreaLearningButton
		this.initAreaLearningButton = function(){
			// honor arjsSystem.data.areaLearningButton
			if( this.data.areaLearningButton === false )	return

			// if there is already a button, do nothing
			if( document.querySelector('#arjsAreaLearningButton') !== null )	return

			// create the img
			var imgElement = document.createElement('img')
			imgElement.id = 'arjsAreaLearningButton'
			imgElement.style.position = 'fixed'
			imgElement.style.bottom = '16px'
			imgElement.style.left = '16px'
			imgElement.style.width = '48px'
			imgElement.style.height = '48px'
			imgElement.style.zIndex = 1
			imgElement.src = THREEx.ArToolkitContext.baseURL + "examples/multi-markers/examples/images/record-start.png"
			document.body.appendChild(imgElement)
			imgElement.addEventListener('click', function(){
				_this.navigateToLearnerPage()
			})					
		}
		
	},
	
	tick : function(now, delta){
		if( this.arSource.ready === false )	return

		// copy projection matrix to camera
		var camera = this.el.sceneEl.camera
		var renderer = this.el.sceneEl.renderer
		this.arSource.onResize2(this.arContext, renderer, camera)
		
		// update arContext
		this.arContext.update( this.arSource.domElement )
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
		// actually init arMarkerControls
		var arjsSystem = this.el.sceneEl.systems.arjs || this.el.sceneEl.systems.artoolkit

		var artoolkitContext = arjsSystem.arContext
		var scene = this.el.sceneEl.object3D
		
		// honor this.data.preset
		if( this.data.preset === 'hiro' ){
			this.data.type = 'pattern'
			this.data.patternUrl = THREEx.ArToolkitContext.baseURL+'examples/marker-training/examples/pattern-files/pattern-hiro.patt'
		}else if( this.data.preset === 'kanji' ){
			this.data.type = 'pattern'
			this.data.patternUrl = THREEx.ArToolkitContext.baseURL+'examples/marker-training/examples/pattern-files/pattern-kanji.patt'
		}else if( this.data.preset === 'area' ){
			this.data.type = 'area'
		}else {
			console.assert( this.data.preset === '', 'illegal preset value '+this.data.preset)
		}

		// build a smoothedControls
		this._markerRoot = new THREE.Group()
		scene.add(this._markerRoot)

		this._arMarkerControls = null
		this._multiMarkerControls = null 

		// create the controls
		if( this.data.type === 'area' ){
			// if no localStorage.ARjsMultiMarkerFile, then write one with default marker
			if( localStorage.getItem('ARjsMultiMarkerFile') === null ){
				THREEx.ArMultiMarkerUtils.storeDefaultMultiMarkerFile(arjsSystem.data.trackingBackend)
			}
			
			// get multiMarkerFile from localStorage
			console.assert( localStorage.getItem('ARjsMultiMarkerFile') !== null )
			var multiMarkerFile = localStorage.getItem('ARjsMultiMarkerFile')

			// create ArMultiMarkerControls
			this._multiMarkerControls = THREEx.ArMultiMarkerControls.fromJSON(artoolkitContext, scene, this._markerRoot, multiMarkerFile, {
				changeMatrixMode : this.data.changeMatrixMode
			})

			// display THREEx.ArMarkerHelper if needed - useful to debug
			if( this.data.markerhelpers === true ){
				this._multiMarkerControls.subMarkersControls.forEach(function(subMarkerControls){
					// add an helper to visuable each sub-marker
					var markerHelper = new THREEx.ArMarkerHelper(subMarkerControls)
					scene.add( markerHelper.object3d )	
				})	
			}
		}else if( this.data.type === 'pattern' || this.data.type === 'barcode' || this.data.type === 'unknown' ){
			this._arMarkerControls = new THREEx.ArMarkerControls(artoolkitContext, this._markerRoot, this.data)
		}else 	console.assert(false)

		// build a smoothedControls
		this.arSmoothedControls = new THREEx.ArSmoothedControls(this.el.object3D)
		
		

		// honor arjsSystem.data.areaLearningButton
		if( this.data.type === 'area' )	arjsSystem.initAreaLearningButton()
	},
	remove : function(){
		// this._arMarkerControls.dispose()
	},
	update: function () {
		// FIXME this mean to change the recode in trackBarcodeMarkerId ?
		// var markerRoot = this.el.object3D;
		// markerRoot.userData.size = this.data.size;
	},
	tick: function(){
		if( this.data.changeMatrixMode === 'cameraTransformMatrix' ){
			this.el.sceneEl.object3D.visible = this.el.object3D.visible;
		}
		if( this._multiMarkerControls !== null ){
			// update smoothedControls parameters depending on how many markers are visible in multiMarkerControls
			this._multiMarkerControls.updateSmoothedControls(this.arSmoothedControls)			
		}

		// update smoothedControls position
		this.arSmoothedControls.update(this._markerRoot)
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
