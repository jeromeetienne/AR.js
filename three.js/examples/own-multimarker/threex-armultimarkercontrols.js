var THREEx = THREEx || {}



THREEx.ArMultiMarkerControls = function(object3d, markersControls, markersPose){
	var _this = this

	// copy parameters
	this.object3d = object3d
	this.markersControls = markersControls
	this.markersPose = markersPose

	// listen to arToolkitContext event 'sourceProcessed'
	// - after we fully processed one image, aka when we know all detected poses in it
	var arToolkitContext = markersControls[0].context
	arToolkitContext.addEventListener('sourceProcessed', function(){
		_this._onSourceProcessed()
	})
}

Object.assign( THREEx.ArMultiMarkerControls.prototype, THREE.EventDispatcher.prototype );

//////////////////////////////////////////////////////////////////////////////
//		Code Separator
//////////////////////////////////////////////////////////////////////////////
THREEx.ArMultiMarkerControls.fromJSON = function(arToolkitContext, scene, markerRoot, jsonData){
	var multiMarkerFile = JSON.parse(jsonData)
	// declare the parameters
	var markersControls = []
	var markerPoses = []

	// prepare the parameters
	multiMarkerFile.markersControls.forEach(function(item){
		// create a markerRoot
		var object3d = new THREE.Object3D()
		scene.add(object3d)

		// create markerControls for our object3d
		var markerControls = new THREEx.ArMarkerControls(arToolkitContext, object3d, item.parameters)

		if( true ){
			// add an helper to visuable each sub-marker
			var markerHelper = new THREEx.ArMarkerHelper(markerControls)
			markerControls.object3d.add( markerHelper.object3d )			
		}
		
		// store it in the parameters
		markersControls.push(markerControls)
		markerPoses.push(new THREE.Matrix4().fromArray(item.poseMatrix))
	})
	// create a new THREEx.ArMultiMarkerControls
	var multiMarkerControls = new THREEx.ArMultiMarkerControls(markerRoot, markersControls, markerPoses)

	// return it
	return multiMarkerControls	
}

//////////////////////////////////////////////////////////////////////////////
//		Code Separator
//////////////////////////////////////////////////////////////////////////////

/**
 * What to do when a image source is fully processed
 */
THREEx.ArMultiMarkerControls.prototype._onSourceProcessed = function(){
	var _this = this
	var positionsSum = new THREE.Vector3
	var quaternionSum = new THREE.Quaternion(0,0,0,0)
	var scalesSum = new THREE.Vector3
	var countVisible = 0

	this.markersControls.forEach(function(markerControls, markerIndex){
		
		var object3d = markerControls.object3d
		// if this marker is not visible, ignore it
		if( object3d.visible === false )	return

		// transformation matrix of this.object3d according to this sub-markers
		var matrix = object3d.matrix.clone()
		var markerPose = _this.markersPose[markerIndex]
		matrix.multiply(markerPose)

		// decompose the matrix into .position, .quaternion, .scale
		var position = new THREE.Vector3
		var quaternion = new THREE.Quaternion()
		var scale = new THREE.Vector3
		matrix.decompose(position, quaternion, scale)

		// http://wiki.unity3d.com/index.php/Averaging_Quaternions_and_Vectors
		countVisible++
		positionsSum.add(position)
		scalesSum.add(scale)

		// from http://wiki.unity3d.com/index.php/Averaging_Quaternions_and_Vectors
		if( _this.markersControls[0].object3d.quaternion.dot(quaternion) > 0 ){
			quaternion = new THREE.Quaternion(-quaternion.x, -quaternion.y, -quaternion.z, -quaternion.w)
		}

		quaternionSum.x += quaternion.x
		quaternionSum.y += quaternion.y
		quaternionSum.z += quaternion.z
		quaternionSum.w += quaternion.w
	})

	// if at least one sub-marker has been detected, make the average of all detected markers
	if( countVisible > 0 ){

		// average position
		var targetPosition = new THREE.Vector3().copy( positionsSum ).multiplyScalar( 1/countVisible )
		// average quaternion
		var targetQuaternion = new THREE.Quaternion().copy(quaternionSum)
		targetQuaternion.x /= countVisible
		targetQuaternion.y /= countVisible
		targetQuaternion.z /= countVisible
		targetQuaternion.w /= countVisible
		// average scale
		var targetScale = new THREE.Vector3().copy( scalesSum ).multiplyScalar( 1/countVisible )


		var lerpPosition = 0.3
		var lerpQuaternion = 0.6
		var lerpScale = 0.6
		var position = _this.object3d.position.clone().lerp(targetPosition, lerpPosition)
		var quaternion = _this.object3d.quaternion.clone().slerp(targetQuaternion, lerpQuaternion)
		var scale = _this.object3d.scale.clone().lerp(targetScale, lerpScale)
		_this.object3d.position.copy(position)
		_this.object3d.scale.copy(scale)
		_this.object3d.quaternion.copy(quaternion)

		// _this.object3d.position.copy(targetPosition)
		// _this.object3d.quaternion.copy(targetQuaternion)
		// _this.object3d.scale.copy(targetScale)
	}
	
	// honor _this.object3d.visible
	if( countVisible > 0 ){
		_this.object3d.visible = true
		// dispatchEvent
		_this.dispatchEvent( { type: 'markerFound' } );		
	}else{
		_this.object3d.visible = false			
	}
}
