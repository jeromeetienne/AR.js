//////////////////////////////////////////////////////////////////////////////
//		Code Separator
//////////////////////////////////////////////////////////////////////////////

AFRAME.registerSystem('artoolkit', {
	schema: {
                debug : {
                        type: 'boolean',
                        default: false
                },
		detectionMode : {
			type: 'string',
			default: 'color_and_matrix',
		},
		matrixCodeType : {
			type: 'string',
			default: '3x3',
		},
		cameraParametersUrl : {
			type: 'string',
			default: '../../data/data/camera_para.dat'
		},
		maxDetectionRate : {
			type: 'number',
			default: 60
		},
                sourceType : {
                        type: 'string',
                        default: 'webcam',        
                },
                sourceUrl : {
                        type: 'string',
                },
		sourceWidth : {
			type: 'number',
			default: 640
		},
		sourceHeight : {
			type: 'number',
			default: 480
		},
		displayWidth : {
			type: 'number',
			default: 640
		},
		displayHeight : {
			type: 'number',
			default: 480
		},
	},

	//////////////////////////////////////////////////////////////////////////////
	//		Code Separator
	//////////////////////////////////////////////////////////////////////////////


	init: function () {
		var _this = this
		////////////////////////////////////////////////////////////////////////////////
		//          handle arToolkitSource
		////////////////////////////////////////////////////////////////////////////////

		var arToolkitSource = new THREEx.ArToolkitSource(this.data)
		this.arToolkitSource = arToolkitSource
		arToolkitSource.init(function onReady(){
			// handle resize of renderer
			onResize()
			
			// kludge to write a 'resize' event
			var startedAt = Date.now()
			function tick(){
				if( Date.now() - startedAt > 2*1000 )	return 
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

			// ugly kludge to get resize on aframe... not even sure it works
			arToolkitSource.onResize(document.body)		
			arToolkitSource.domElement.style.marginLeft = '0px'
			
			var buttonElement = document.querySelector('.a-enter-vr')
			if( buttonElement ){
				buttonElement.style.position = 'fixed'
			}
		}
		////////////////////////////////////////////////////////////////////////////////
		//          initialize arToolkitContext
		////////////////////////////////////////////////////////////////////////////////
		
		// create atToolkitContext
		var arToolkitContext = new THREEx.ArToolkitContext(this.data)
		this.arToolkitContext = arToolkitContext
		// initialize it
		arToolkitContext.init(function onCompleted(){
			// // copy projection matrix to camera
                        // var projectionMatrix = arToolkitContext.arController.getCameraMatrix();
                        // _this.sceneEl.camera.projectionMatrix.fromArray(projectionMatrix);
		})
	},
	
        tick : function(now, delta){
		if( this.arToolkitSource.ready === false )	return
// console.log('tick')
		// update projectionMatrix
		// NOTE: is it because the projectionMatrix is set in arToolkitContext.init is overwritten by a-frames
                var projectionMatrix = this.arToolkitContext.arController.getCameraMatrix();
                this.sceneEl.camera.projectionMatrix.fromArray(projectionMatrix);

		this.arToolkitContext.update( this.arToolkitSource.domElement )
	},
});


//////////////////////////////////////////////////////////////////////////////
//		Code Separator
//////////////////////////////////////////////////////////////////////////////
AFRAME.registerComponent('artoolkitmarker', {
        dependencies: ['artoolkit'],
	schema: {
		size: {
			type: 'number',
			default: 1
		},
		type: {
			type: 'string',
			default : 'unknown',
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
		}
	},
	init: function () {
		var artoolkitContext = this.el.sceneEl.systems.artoolkit.arToolkitContext
		this.arMarkerControls = new THREEx.ArMarkerControls(artoolkitContext, this.el.object3D, this.data)
	},
	remove : function(){
		this.arMarkerControls.dispose()
	},
	update: function () {
		// FIXME this mean to change the recode in trackBarcodeMarkerId ?
        	// var markerRoot = this.el.object3D;
        	// markerRoot.userData.size = this.data.size;
	},
});

//////////////////////////////////////////////////////////////////////////////
//                define some primitives shortcuts
//////////////////////////////////////////////////////////////////////////////

AFRAME.registerPrimitive('a-marker', AFRAME.utils.extendDeep({}, AFRAME.primitives.getMeshMixin(), {
        defaultComponents: {
                artoolkitmarker: {},
        },
        mappings: {
                'type': 'artoolkitmarker.type',
                'size': 'artoolkitmarker.size',
                'url': 'artoolkitmarker.patternUrl',
                'value': 'artoolkitmarker.barcodeValue',
        }
}));

AFRAME.registerPrimitive('a-marker-camera', AFRAME.utils.extendDeep({}, AFRAME.primitives.getMeshMixin(), {
        defaultComponents: {
                artoolkitmarker: {
			changeMatrixMode: 'cameraTransformMatrix'
		},
        },
        mappings: {
                'type': 'artoolkitmarker.type',
                'size': 'artoolkitmarker.size',
                'url': 'artoolkitmarker.patternUrl',
                'value': 'artoolkitmarker.barcodeValue',
        }
}));
