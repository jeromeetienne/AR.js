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
		profile : {
			type: 'string',	
			default: 'default',
		},

		// old parameters
		debug : {		type: 'boolean',	default: null},
		detectionMode : {	type: 'string',		},
		matrixCodeType : {	type: 'string',		},
		cameraParametersUrl : {	type: 'string',		},
		maxDetectionRate : {	type: 'number',		},
		sourceType : {		type: 'string',		},
		sourceUrl : {		type: 'string',		},
		sourceWidth : {		type: 'number',		},
		sourceHeight : {	type: 'number',		},
		displayWidth : {	type: 'number',		},
		displayHeight : {	type: 'number',		},
		canvasWidth : {		type: 'number',		},
		canvasHeight : {	type: 'number',		},
	},
	
	//////////////////////////////////////////////////////////////////////////////
	//		Code Separator
	//////////////////////////////////////////////////////////////////////////////
	
	
	init: function () {
		var _this = this
// TODO support pattern/barcode 
// smoothed by default
// support type='area'
// support for profile
		var artoolkitProfile = new THREEx.ArToolkitProfile()
		artoolkitProfile.sourceWebcam()
		artoolkitProfile.trackingBackend(this.data.trackingBackend)
		
		// artoolkitProfile.set()

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

		// honor this.data.areaLearningIcon
		if( this.data.areaLearningIcon === true ){
			// <img style='position: fixed; bottom: 16px; left: 16px; z-index:1' src="../../three.js/examples/multi-markers/examples/images/record-start.png" width='64px'  height='64px'>
			var imgElement = document.createElement('img')
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
		preset: {
			type: 'string',
		},
		markerhelpers : {	// IIF preset === 'area'
			type: 'boolean',
			default: false,
		}
	},
	init: function () {
		var _this = this
		// actually init arMarkerControls
		var artoolkitContext = this.el.sceneEl.systems.arjs.arToolkitContext
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
			if( this.data.markerhelpers === true ){
				this._multiMarkerControls.subMarkersControls.forEach(function(subMarkerControls){
					// add an helper to visuable each sub-marker
					var markerHelper = new THREEx.ArMarkerHelper(subMarkerControls)
					subMarkerControls.object3d.add( markerHelper.object3d )		
				})				
			}
		}else if( this.data.type === 'pattern' || this.data.type === 'barcode' ){
			this._arMarkerControls = new THREEx.ArMarkerControls(artoolkitContext, this._markerRoot, this.data)
		}else 	console.assert(false)

		// build a smoothedControls
		this.arSmoothedControls = new THREEx.ArSmoothedControls(this.el.object3D)
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
