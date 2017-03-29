var THREEx = THREEx || {}

THREEx.ArVideoInWebgl = function(videoTexture){	
	var _this = this
	
	//////////////////////////////////////////////////////////////////////////////
	//	plane always in front of the camera, exactly as big as the viewport
	//////////////////////////////////////////////////////////////////////////////
	var geometry = new THREE.PlaneGeometry(2, 2);
	var material = new THREE.MeshBasicMaterial({
		// map : new THREE.TextureLoader().load('images/water.jpg'),
		map : videoTexture,
		// side: THREE.DoubleSide,
		// opacity: 0.5,
		// color: 'pink',
		// transparent: true,
	});
	var seethruPlane = new THREE.Mesh(geometry, material);
	this.object3d = seethruPlane
	// scene.add(seethruPlane);
	
	// arToolkitSource.domElement.style.visibility = 'hidden'

	// TODO extract the fov from the projectionMatrix
	// camera.fov = 43.1
	this.update = function(camera){
		camera.updateMatrixWorld(true)
		
		// get seethruPlane position
		var position = new THREE.Vector3(-0.15,0,-20)	// TODO how come you got that offset on x ???
		var position = new THREE.Vector3(-0,0,-20)	// TODO how come you got that offset on x ???
		seethruPlane.position.copy(position)
		camera.localToWorld(seethruPlane.position)
		
		// get seethruPlane quaternion
		camera.matrixWorld.decompose( camera.position, camera.quaternion, camera.scale );	
		seethruPlane.quaternion.copy( camera.quaternion )
		
		// extract the fov from the projectionMatrix
		var fov = THREE.Math.radToDeg(Math.atan(1/camera.projectionMatrix.elements[5])) *2;
		
		
		var elementWidth = parseFloat( arToolkitSource.domElement.style.width.replace(/px$/,''), 10 )
		var elementHeight = parseFloat( arToolkitSource.domElement.style.height.replace(/px$/,''), 10 )
		
		var aspect = elementWidth / elementHeight
		
		// camera.fov = fov
		// if( vrDisplay.isPresenting ){
		// 	fov *= 2
		// 	aspect *= 2
		// }
		
		// get seethruPlane height relative to fov
		seethruPlane.scale.y = Math.tan(THREE.Math.DEG2RAD * fov/2)*position.length() 
		// get seethruPlane aspect
		seethruPlane.scale.x = seethruPlane.scale.y * aspect
	}

	//////////////////////////////////////////////////////////////////////////////
	//		Code Separator
	//////////////////////////////////////////////////////////////////////////////
	// var video = arToolkitSource.domElement;
	// 
	// window.addEventListener('resize', function(){
	// 	updateSeeThruAspectUv(seethruPlane)	
	// })
	// video.addEventListener('canplaythrough', function(){
	// 	updateSeeThruAspectUv(seethruPlane)
	// })
	// function updateSeeThruAspectUv(plane){
	// 
	// 	// if video isnt yet ready to play
	// 	if( video.videoWidth === 0 || video.videoHeight === 0 )	return
	// 
	// 	var faceVertexUvs = plane.geometry.faceVertexUvs[0]
	// 	var screenAspect = window.innerWidth / window.innerHeight
	// 	var videoAspect = video.videoWidth / video.videoHeight
	// 	
	// 	plane.geometry.uvsNeedUpdate = true
	// 	if( screenAspect >= videoAspect ){
	// 		var actualHeight = videoAspect / screenAspect;
	// 		// faceVertexUvs y 0
	// 		faceVertexUvs[0][1].y = 0.5 - actualHeight/2
	// 		faceVertexUvs[1][0].y = 0.5 - actualHeight/2
	// 		faceVertexUvs[1][1].y = 0.5 - actualHeight/2
	// 		// faceVertexUvs y 1
	// 		faceVertexUvs[0][0].y = 0.5 + actualHeight/2
	// 		faceVertexUvs[0][2].y = 0.5 + actualHeight/2
	// 		faceVertexUvs[1][2].y = 0.5 + actualHeight/2
	// 	}else{
	// 		var actualWidth = screenAspect / videoAspect;
	// 		// faceVertexUvs x 0
	// 		faceVertexUvs[0][0].x = 0.5 - actualWidth/2
	// 		faceVertexUvs[0][1].x = 0.5 - actualWidth/2
	// 		faceVertexUvs[1][0].x = 0.5 - actualWidth/2
	// 		
	// 		// faceVertexUvs x 1
	// 		faceVertexUvs[0][2].x = 0.5 + actualWidth/2
	// 		faceVertexUvs[1][1].x = 0.5 + actualWidth/2
	// 		faceVertexUvs[1][2].x = 0.5 + actualWidth/2
	// 	}
	// }

}
