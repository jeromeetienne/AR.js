var ARjs = ARjs || {}
var THREEx = THREEx || {}

ARjs.MarkersAreaControls = THREEx.ArMultiMarkerControls = function(arToolkitContext, object3d, parameters){
	var _this = this
	THREEx.ArBaseControls.call(this, object3d)
	
	if( arguments.length > 3 )	console.assert('wrong api for', THREEx.ArMultiMarkerControls)

// have a parameters in argument
	this.parameters = {
		// list of controls for each subMarker
		subMarkersControls: parameters.subMarkersControls,
		// list of pose for each subMarker relative to the origin
		subMarkerPoses: parameters.subMarkerPoses,
		// change matrix mode - [modelViewMatrix, cameraTransformMatrix]
		changeMatrixMode : parameters.changeMatrixMode !== undefined ? parameters.changeMatrixMode : 'modelViewMatrix',
	}
	
	this.object3d.visible = false
	// honor obsolete stuff - add a warning to use
	this.subMarkersControls = this.parameters.subMarkersControls
	this.subMarkerPoses = this.parameters.subMarkerPoses

	// listen to arToolkitContext event 'sourceProcessed'
	// - after we fully processed one image, aka when we know all detected poses in it
	arToolkitContext.addEventListener('sourceProcessed', function(){
		_this._onSourceProcessed()
	})
}

ARjs.MarkersAreaControls.prototype = Object.create( THREEx.ArBaseControls.prototype );
ARjs.MarkersAreaControls.prototype.constructor = ARjs.MarkersAreaControls;

//////////////////////////////////////////////////////////////////////////////
//		Code Separator
//////////////////////////////////////////////////////////////////////////////


/**
 * What to do when a image source is fully processed
 */
ARjs.MarkersAreaControls.prototype._onSourceProcessed = function(){
	var _this = this
	var stats = {
		count: 0,
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

	var firstQuaternion = _this.parameters.subMarkersControls[0].object3d.quaternion

	this.parameters.subMarkersControls.forEach(function(markerControls, markerIndex){
		
		var markerObject3d = markerControls.object3d
		// if this marker is not visible, ignore it
		if( markerObject3d.visible === false )	return

		// transformation matrix of this.object3d according to this sub-markers
		var matrix = markerObject3d.matrix.clone()
		var markerPose = _this.parameters.subMarkerPoses[markerIndex]
		matrix.multiply(new THREE.Matrix4().getInverse(markerPose))

		// decompose the matrix into .position, .quaternion, .scale
		var position = new THREE.Vector3
		var quaternion = new THREE.Quaternion()
		var scale = new THREE.Vector3
		matrix.decompose(position, quaternion, scale)

		// http://wiki.unity3d.com/index.php/Averaging_Quaternions_and_Vectors
		stats.count++

		ARjs.MarkersAreaControls.averageVector3(stats.position.sum, position, stats.count, stats.position.average)
		ARjs.MarkersAreaControls.averageQuaternion(stats.quaternion.sum, quaternion, firstQuaternion, stats.count, stats.quaternion.average)
		ARjs.MarkersAreaControls.averageVector3(stats.scale.sum, scale, stats.count, stats.scale.average)
	})

	// honor _this.object3d.visible
	if( stats.count > 0 ){
		_this.object3d.visible = true
	}else{
		_this.object3d.visible = false			
	}

	// if at least one sub-marker has been detected, make the average of all detected markers
	if( stats.count > 0 ){
		// compute modelViewMatrix
		var modelViewMatrix = new THREE.Matrix4()
		modelViewMatrix.compose(stats.position.average, stats.quaternion.average, stats.scale.average)

		// change _this.object3d.matrix based on parameters.changeMatrixMode
		if( this.parameters.changeMatrixMode === 'modelViewMatrix' ){
			_this.object3d.matrix.copy(modelViewMatrix)
		}else if( this.parameters.changeMatrixMode === 'cameraTransformMatrix' ){
			_this.object3d.matrix.getInverse( modelViewMatrix )
		}else {
			console.assert(false)
		}

		// decompose - the matrix into .position, .quaternion, .scale
		_this.object3d.matrix.decompose(_this.object3d.position, _this.object3d.quaternion, _this.object3d.scale)
	}

}

//////////////////////////////////////////////////////////////////////////////
//		Utility functions
//////////////////////////////////////////////////////////////////////////////

/**
 * from http://wiki.unity3d.com/index.php/Averaging_Quaternions_and_Vectors
 */
ARjs.MarkersAreaControls.averageQuaternion = function(quaternionSum, newQuaternion, firstQuaternion, count, quaternionAverage){
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


ARjs.MarkersAreaControls.averageVector3 = function(vector3Sum, vector3, count, vector3Average){
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
//		Utility function
//////////////////////////////////////////////////////////////////////////////

/**
 * compute the center of this multimarker file
 */
ARjs.MarkersAreaControls.computeCenter = function(jsonData){
	var multiMarkerFile = JSON.parse(jsonData)
	var stats = {
		count : 0,
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
	var firstQuaternion = new THREE.Quaternion() // FIXME ???
	
	multiMarkerFile.subMarkersControls.forEach(function(item){
		var poseMatrix = new THREE.Matrix4().fromArray(item.poseMatrix)
		
		var position = new THREE.Vector3
		var quaternion = new THREE.Quaternion
		var scale = new THREE.Vector3
		poseMatrix.decompose(position, quaternion, scale)
		
		// http://wiki.unity3d.com/index.php/Averaging_Quaternions_and_Vectors
		stats.count++

		ARjs.MarkersAreaControls.averageVector3(stats.position.sum, position, stats.count, stats.position.average)
		ARjs.MarkersAreaControls.averageQuaternion(stats.quaternion.sum, quaternion, firstQuaternion, stats.count, stats.quaternion.average)
		ARjs.MarkersAreaControls.averageVector3(stats.scale.sum, scale, stats.count, stats.scale.average)
	})
	
	var averageMatrix = new THREE.Matrix4()
	averageMatrix.compose(stats.position.average, stats.quaternion.average, stats.scale.average)

	return averageMatrix
}

ARjs.MarkersAreaControls.computeBoundingBox = function(jsonData){
	var multiMarkerFile = JSON.parse(jsonData)
	var boundingBox = new THREE.Box3()

	multiMarkerFile.subMarkersControls.forEach(function(item){
		var poseMatrix = new THREE.Matrix4().fromArray(item.poseMatrix)
		
		var position = new THREE.Vector3
		var quaternion = new THREE.Quaternion
		var scale = new THREE.Vector3
		poseMatrix.decompose(position, quaternion, scale)

		boundingBox.expandByPoint(position)
	})

	return boundingBox
}
//////////////////////////////////////////////////////////////////////////////
//		updateSmoothedControls
//////////////////////////////////////////////////////////////////////////////

ARjs.MarkersAreaControls.prototype.updateSmoothedControls = function(smoothedControls, lerpsValues){
	// handle default values
	if( lerpsValues === undefined ){
		// FIXME this parameter format is uselessly cryptic
		// lerpValues = [
		// {lerpPosition: 0.5, lerpQuaternion: 0.2, lerpQuaternion: 0.7}
		// ]
		lerpsValues = [
			[0.1, 0.1, 0.3],
			[0.2, 0.1, 0.4],
			[0.2, 0.2, 0.5],
			[0.3, 0.2, 0.7],
			[0.3, 0.2, 0.7],
		]
	}
	// count how many subMarkersControls are visible
	var nVisible = 0
	this.parameters.subMarkersControls.forEach(function(markerControls, markerIndex){
		var markerObject3d = markerControls.object3d
		if( markerObject3d.visible === true )	nVisible ++
	})

	// find the good lerpValues
	if( lerpsValues[nVisible-1] !== undefined ){
		var lerpValues = lerpsValues[nVisible-1]
	}else{
		var lerpValues = lerpsValues[lerpsValues.length-1]
	}

	// modify lerpValues in smoothedControls
	smoothedControls.parameters.lerpPosition = lerpValues[0]
	smoothedControls.parameters.lerpQuaternion = lerpValues[1]
	smoothedControls.parameters.lerpScale = lerpValues[2]
}


//////////////////////////////////////////////////////////////////////////////
//		Create THREEx.ArMultiMarkerControls from JSON
//////////////////////////////////////////////////////////////////////////////

ARjs.MarkersAreaControls.fromJSON = function(arToolkitContext, parent3D, markerRoot, jsonData, parameters){
	var multiMarkerFile = JSON.parse(jsonData)
	// declare variables
	var subMarkersControls = []
	var subMarkerPoses = []
	// handle default arguments
	parameters = parameters || {}

	// prepare the parameters
	multiMarkerFile.subMarkersControls.forEach(function(item){
		// create a markerRoot
		var markerRoot = new THREE.Object3D()
		parent3D.add(markerRoot)

		// create markerControls for our markerRoot
		var subMarkerControls = new THREEx.ArMarkerControls(arToolkitContext, markerRoot, item.parameters)

// if( true ){
		// store it in the parameters
		subMarkersControls.push(subMarkerControls)
		subMarkerPoses.push(new THREE.Matrix4().fromArray(item.poseMatrix))	
// }else{
// 		// build a smoothedControls
// 		var smoothedRoot = new THREE.Group()
// 		parent3D.add(smoothedRoot)
// 		var smoothedControls = new THREEx.ArSmoothedControls(smoothedRoot, {
// 			lerpPosition : 0.1,
// 			lerpQuaternion : 0.1, 
// 			lerpScale : 0.1,
// 			minVisibleDelay: 0,
// 			minUnvisibleDelay: 0,
// 		})
// 		onRenderFcts.push(function(delta){
// 			smoothedControls.update(markerRoot)	// TODO this is a global
// 		})
// 	
// 
// 		// store it in the parameters
// 		subMarkersControls.push(smoothedControls)
// 		subMarkerPoses.push(new THREE.Matrix4().fromArray(item.poseMatrix))
// }
	})
	
	parameters.subMarkersControls = subMarkersControls
	parameters.subMarkerPoses = subMarkerPoses
	// create a new THREEx.ArMultiMarkerControls
	var multiMarkerControls = new THREEx.ArMultiMarkerControls(arToolkitContext, markerRoot, parameters)

	// return it
	return multiMarkerControls	
}
