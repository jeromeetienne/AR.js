;(function(){
	var arToolkitSourceOptions = {
		// to read from the webcam 
		// sourceType : 'webcam',
		
		// to read from an image
		// sourceType : 'image',
		// sourceUrl : '../../data/images/img.jpg',		

		// to read from a video
		sourceType : 'video',
		sourceUrl : '../../data/videos/headtracking.mp4',		

		// sourceWidth: 80*3,
		// sourceHeight: 60*3,
		displayWidth : 640,
		displayHeight : 480,
	}	
	var arToolKitContextOptions = {
		cameraParametersUrl: '../../data/data/camera_para.dat',
		detectionMode: 'mono',
		// sourceWidth: 80*3,
		// sourceHeight: 60*3,
		// sourceWidth: arToolkitSourceOptions.sourceWidth,
		// sourceHeight: arToolkitSourceOptions.sourceHeight,
	}
	var arMarkerControlsOptions = {
		type : 'pattern',
		// patternUrl : '../../data/data/patt.hiro',
		patternUrl : '../../data/data/patt.kanji',
		// as we controls the camera 
		changeMatrixMode: 'cameraTransformMatrix'
	}
	// to init arToolKitFrameData immediatly
	var arToolKitFrameData = new ARToolKitFrameData(arToolkitSourceOptions, arToolKitContextOptions, arMarkerControlsOptions)
	// update arToolKitFrameData on every frame
	requestAnimationFrame(function loop(){
		requestAnimationFrame(loop)
		arToolKitFrameData.update()
	})

	// install webvr-polyfill with ArToolkitFrameDataProvider as positional tracking
	var webvrPolyfill = new WebVRPolyfill().install()
	webvrPolyfill.setFrameDataProvider(arToolKitFrameData)	
	
	// // handle resize
	// window.addEventListener('resize', function(){
	// 	// handle arToolkitSource resize
	// 	arToolkitSource.onResize(renderer.domElement)		
	// })
	
	// TODO find a better way to handle the camera
	// it should simply be in the webvr data
	// - this is needed to fix the weird projection matrix of artoolkit
	requestAnimationFrame(function loop(){
		requestAnimationFrame(loop)
		
		// var aScene = document.querySelector('a-scene')
		// if( aScene === null || aScene.camera === undefined )	return
		// var camera = aScene.camera

		// console.log('window.camera', window.camera)
		var camera = window.camera
		if( camera === undefined )	return
		
		camera.projectionMatrix.copy(arToolKitFrameData._camera.projectionMatrix)

		// console.log('window.camera', window.camera)
		// if( window.camera === undefined )	return
		// window.camera.projectionMatrix.copy(arToolKitFrameData._camera.projectionMatrix)
	})
})()
