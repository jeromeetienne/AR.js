//////////////////////////////////////////////////////////////////////////////
//		Code Separator
//////////////////////////////////////////////////////////////////////////////

AFRAME.registerSystem('arjs', {
	schema: {
		trackingBackend : {
			type: 'string',	
			default: 'artoolkit',			
		},
		areaLearningIcon : {
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

		// setup artoolkitProfile
		var artoolkitProfile = new THREEx.ArToolkitProfile()
		artoolkitProfile.sourceWebcam()
		artoolkitProfile.trackingBackend(this.data.trackingBackend)
		artoolkitProfile.performance(this.data.performanceProfile)

		
		//////////////////////////////////////////////////////////////////////////////
		//		honor this.data
		//////////////////////////////////////////////////////////////////////////////
		
		// honor this.data and push what has been modified into artoolkitProfile
		if( this.data.debug !== false )			artoolkitProfile.contextParameters.debug = this.data.debug
		if( this.data.detectionMode !== '' )		artoolkitProfile.contextParameters.detectionMode = this.data.detectionMode
		if( this.data.matrixCodeType !== '' )		artoolkitProfile.contextParameters.matrixCodeType = this.data.matrixCodeType
		if( this.data.cameraParametersUrl !== '' )	artoolkitProfile.contextParameters.cameraParametersUrl = this.data.cameraParametersUrl
		if( this.data.maxDetectionRate !== -1 )		artoolkitProfile.contextParameters.maxDetectionRate = this.data.maxDetectionRate

		if( this.data.sourceType !== '' )		artoolkitProfile.contextParameters.sourceType = this.data.sourceType
		if( this.data.sourceUrl !== '' )		artoolkitProfile.contextParameters.sourceUrl = this.data.sourceUrl
		if( this.data.sourceWidth !== -1 )		artoolkitProfile.contextParameters.sourceWidth = this.data.sourceWidth
		if( this.data.sourceHeight !== -1 )		artoolkitProfile.contextParameters.sourceHeight = this.data.sourceHeight
		if( this.data.displayWidth !== -1 )		artoolkitProfile.contextParameters.displayWidth = this.data.displayWidth
		if( this.data.displayHeight !== -1 )		artoolkitProfile.contextParameters.displayHeight = this.data.displayHeight
		if( this.data.canvasWidth !== -1 )		artoolkitProfile.contextParameters.canvasWidth = this.data.canvasWidth
		if( this.data.canvasHeight !== -1 )		artoolkitProfile.contextParameters.canvasHeight = this.data.canvasHeight

		////////////////////////////////////////////////////////////////////////////////
		//          handle arToolkitSource
		////////////////////////////////////////////////////////////////////////////////
		
		var arToolkitSource = new THREEx.ArToolkitSource(artoolkitProfile.sourceParameters)
		this.arToolkitSource = arToolkitSource
		arToolkitSource.init(function onReady(){
			// handle resize of renderer
			onResize()
			
// TODO this is crappy
			// kludge to write a 'resize' event
			var startedAt = Date.now()
			function tick(){
				if( Date.now() - startedAt > 10*1000 )	return 
				window.dispatchEvent(new Event('resize'));
				setTimeout(tick, 1000/60)
			}
			setTimeout(tick, 1000/60)
		})
		
		// handle resize
		window.addEventListener('resize', onResize)
		function onResize(){
			// handle arToolkitSource resize
			// var rendererDomElement = _this.sceneEl.renderer ? _this.sceneEl.renderer.domElement : undefined
			// arToolkitSource.onResize(rendererDomElement)	
			
			// var rendererDomElement = _this.sceneEl.renderer ? _this.sceneEl.renderer.domElement : undefined
			// console.log('dd', _this.sceneEl.renderer.domElement)
			
			// ugly kludge to get resize on aframe... not even sure it works
			arToolkitSource.onResize(document.body)		
			
			var buttonElement = document.querySelector('.a-enter-vr')
			if( buttonElement ){
				buttonElement.style.position = 'fixed'
			}
		}
		////////////////////////////////////////////////////////////////////////////////
		//          initialize arToolkitContext
		////////////////////////////////////////////////////////////////////////////////
		
		// create atToolkitContext
		var arToolkitContext = new THREEx.ArToolkitContext(artoolkitProfile.contextParameters)
		this.arToolkitContext = arToolkitContext
		// initialize it
		arToolkitContext.init(function onCompleted(){
			// // copy projection matrix to camera
			// var projectionMatrixArr = arToolkitContext.arController.getCameraMatrix();
			// _this.sceneEl.camera.projectionMatrix.fromArray(projprojectionMatrixArrectionMatrix);
		})
		
		// export function to navigateToLearnerPage
		this.navigateToLearnerPage = function(){
			var learnerURL = THREEx.ArToolkitContext.baseURL + 'examples/multi-markers/examples/learner.html'
			THREEx.ArMultiMarkerUtils.navigateToLearnerPage(learnerURL, _this.data.trackingBackend)
		}
	},
	
	tick : function(now, delta){
		if( this.arToolkitSource.ready === false )	return
		
		// var projectionMatrixArr = this.arToolkitContext.arController.getCameraMatrix();
		// this.sceneEl.camera.projectionMatrix.fromArray(projectionMatrixArr);
		
		// copy projection matrix to camera
		if( this.arToolkitContext.arController !== null ){
			this.sceneEl.camera.projectionMatrix.copy( this.arToolkitContext.getProjectionMatrix() );
		}
		
		this.arToolkitContext.update( this.arToolkitSource.domElement )
	},
});


//////////////////////////////////////////////////////////////////////////////
//		arjsmarker
//////////////////////////////////////////////////////////////////////////////
AFRAME.registerComponent('arjsmarker', {
	dependencies: ['arjs'],
	schema: {
		preset: {
			type: 'string',
		},
		markerHelpers : {	// IIF preset === 'area'
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
		var arjsSystem = this.el.sceneEl.systems.arjs
		var artoolkitContext = arjsSystem.arToolkitContext
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
			// fall through
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
				THREEx.ArMultiMarkerUtils.storeDefaultMultiMarkerFile(this.data.trackingBackend)
			}
			
			// get multiMarkerFile from localStorage
			console.assert( localStorage.getItem('ARjsMultiMarkerFile') !== null )
			var multiMarkerFile = localStorage.getItem('ARjsMultiMarkerFile')

			// create ArMultiMarkerControls
			this._multiMarkerControls = THREEx.ArMultiMarkerControls.fromJSON(artoolkitContext, scene, this._markerRoot, multiMarkerFile, {
				changeMatrixMode : this.data.changeMatrixMode
			})

			// display THREEx.ArMarkerHelper if needed - useful to debug
			if( this.data.markerHelpers === true ){
				this._multiMarkerControls.subMarkersControls.forEach(function(subMarkerControls){
					// add an helper to visuable each sub-marker
					var markerHelper = new THREEx.ArMarkerHelper(subMarkerControls)
					scene.add( markerHelper.object3d )	
				})				
			}
		}else if( this.data.type === 'pattern' || this.data.type === 'barcode' ){
			this._arMarkerControls = new THREEx.ArMarkerControls(artoolkitContext, this._markerRoot, this.data)
		}else 	console.assert(false)

		// build a smoothedControls
		this.arSmoothedControls = new THREEx.ArSmoothedControls(this.el.object3D)
		
		

		// honor arjsSystem.data.areaLearningIcon
		if( this.data.type === 'area' && arjsSystem.data.areaLearningIcon === true && document.querySelector('#arjsAreaLearningButton') === null ){
			// TODO put this function in arjsSystem arjsSystem.initAreaLearningButton()

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
				arjsSystem.navigateToLearnerPage()
			})					
		}
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
		'markerHelpers': 'arjsmarker.markerHelpers',
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
		'markerHelpers': 'arjsmarker.markerHelpers',
	}
}));
