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

/**
 * What to do when a image source is fully processed
 */
THREEx.ArMultiMarkerControls.prototype._onSourceProcessed = function(){
	var _this = this
	var stats = {
		countVisible: 0,
		position : {
			sum: new THREE.Vector3(0,0,0),
			average: new THREE.Vector3(0,0,0),
		},
		quaternion : {
			sum: new THREE.Quaternion(0,0,0,0),
			average: new THREE.Quaternion(0,0,0,0),
		},
		scale : {
			sum: new THREE.Vector3(0,0,0),
			average: new THREE.Vector3(0,0,0),
		},
	}

	var firstQuaternion = _this.markersControls[0].object3d.quaternion

	this.markersControls.forEach(function(markerControls, markerIndex){
		
		var markerObject3d = markerControls.object3d
		// if this marker is not visible, ignore it
		if( markerObject3d.visible === false )	return

		// transformation matrix of this.object3d according to this sub-markers
		var matrix = markerObject3d.matrix.clone()
		var markerPose = _this.markersPose[markerIndex]
		matrix.multiply(new THREE.Matrix4().getInverse(markerPose))

		// decompose the matrix into .position, .quaternion, .scale
		var position = new THREE.Vector3
		var quaternion = new THREE.Quaternion()
		var scale = new THREE.Vector3
		matrix.decompose(position, quaternion, scale)

		// http://wiki.unity3d.com/index.php/Averaging_Quaternions_and_Vectors
		stats.countVisible++

		THREEx.ArMultiMarkerControls.averageVector3(stats.position.sum, position, stats.countVisible, stats.position.average)
		THREEx.ArMultiMarkerControls.averageQuaternion(stats.quaternion.sum, quaternion, firstQuaternion, stats.countVisible, stats.quaternion.average)
		THREEx.ArMultiMarkerControls.averageVector3(stats.scale.sum, scale, stats.countVisible, stats.scale.average)
	})

	// if at least one sub-marker has been detected, make the average of all detected markers
	if( stats.countVisible > 0 ){
		_this.object3d.position.copy(stats.position.average)
		_this.object3d.quaternion.copy(stats.quaternion.average)
		_this.object3d.scale.copy(stats.scale.average)
	}

	// honor _this.object3d.visible
	if( stats.countVisible > 0 ){
		_this.object3d.visible = true
		// dispatchEvent
		_this.dispatchEvent( { type: 'markerFound' } );		
	}else{
		_this.object3d.visible = false			
	}
}

//////////////////////////////////////////////////////////////////////////////
//		Utility functions
//////////////////////////////////////////////////////////////////////////////

/**
 * from http://wiki.unity3d.com/index.php/Averaging_Quaternions_and_Vectors
 */
THREEx.ArMultiMarkerControls.averageQuaternion = function(quaternionSum, newQuaternion, firstQuaternion, count, quaternionAverage){
	quaternionAverage = quaternionAverage || new THREE.Quaternion()
	// sanity check
	console.assert(firstQuaternion instanceof THREE.Quaternion === true)
	
	// from http://wiki.unity3d.com/index.php/Averaging_Quaternions_and_Vectors
	if( newQuaternion.dot(firstQuaternion) > 0 ){
		newQuaternion = new THREE.Quaternion(-newQuaternion.x, -newQuaternion.y, -newQuaternion.z, -newQuaternion.w)
	}

	quaternionSum.x += newQuaternion.x
	quaternionSum.y += newQuaternion.y
	quaternionSum.z += newQuaternion.z
	quaternionSum.w += newQuaternion.w
	
	quaternionAverage.x = quaternionSum.x/count
	quaternionAverage.y = quaternionSum.y/count
	quaternionAverage.z = quaternionSum.z/count
	quaternionAverage.w = quaternionSum.w/count
	
	quaternionAverage.normalize()

	return quaternionAverage
}


THREEx.ArMultiMarkerControls.averageVector3 = function(vector3Sum, vector3, count, vector3Average){
	vector3Average = vector3Average || new THREE.Vector3()
	
	vector3Sum.x += vector3.x
	vector3Sum.y += vector3.y
	vector3Sum.z += vector3.z
	
	vector3Average.x = vector3Sum.x / count
	vector3Average.y = vector3Sum.y / count
	vector3Average.z = vector3Sum.z / count
	
	return vector3Average
}

//////////////////////////////////////////////////////////////////////////////
//		Code Separator
//////////////////////////////////////////////////////////////////////////////
THREEx.ArMultiMarkerControls.fromJSON = function(arToolkitContext, scene, markerRoot, jsonData){
	var multiMarkerFile = JSON.parse(jsonData)
	// declare the parameters
	var markersControls = []
	var markerPoses = []

	// prepare the parameters
	multiMarkerFile.subMarkersControls.forEach(function(item){
		// create a markerRoot
		var object3d = new THREE.Object3D()
		scene.add(object3d)

		// create markerControls for our object3d
		var subMarkerControls = new THREEx.ArMarkerControls(arToolkitContext, object3d, item.parameters)

		if( false ){
			// add an helper to visuable each sub-marker
			var markerHelper = new THREEx.ArMarkerHelper(subMarkerControls)
			subMarkerControls.object3d.add( markerHelper.object3d )			
		}
		
		// store it in the parameters
		markersControls.push(subMarkerControls)
		markerPoses.push(new THREE.Matrix4().fromArray(item.poseMatrix))
	})
	// create a new THREEx.ArMultiMarkerControls
	var multiMarkerControls = new THREEx.ArMultiMarkerControls(markerRoot, markersControls, markerPoses)

	// return it
	return multiMarkerControls	
}
