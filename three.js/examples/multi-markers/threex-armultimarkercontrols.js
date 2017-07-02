var THREEx = THREEx || {}

THREEx.ArMultiMarkerControls = function(arToolkitContext, object3d, subMarkersControls, subMarkerPoses){
	var _this = this

	THREEx.ArBaseControls.call(this, object3d)
	
	this.object3d.visible = false
	// copy parameters
	this.subMarkersControls = subMarkersControls
	this.subMarkerPoses = subMarkerPoses

	// listen to arToolkitContext event 'sourceProcessed'
	// - after we fully processed one image, aka when we know all detected poses in it
	arToolkitContext.addEventListener('sourceProcessed', function(){
		_this._onSourceProcessed()
	})
}

THREEx.ArMultiMarkerControls.prototype = Object.create( THREEx.ArBaseControls.prototype );
THREEx.ArMultiMarkerControls.prototype.constructor = THREEx.ArMultiMarkerControls;

//////////////////////////////////////////////////////////////////////////////
//		Code Separator
//////////////////////////////////////////////////////////////////////////////


/**
 * What to do when a image source is fully processed
 */
THREEx.ArMultiMarkerControls.prototype._onSourceProcessed = function(){
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

	var firstQuaternion = _this.subMarkersControls[0].object3d.quaternion

	this.subMarkersControls.forEach(function(markerControls, markerIndex){
		
		var markerObject3d = markerControls.object3d
		// if this marker is not visible, ignore it
		if( markerObject3d.visible === false )	return

		// transformation matrix of this.object3d according to this sub-markers
		var matrix = markerObject3d.matrix.clone()
		var markerPose = _this.subMarkerPoses[markerIndex]
		matrix.multiply(new THREE.Matrix4().getInverse(markerPose))

		// decompose the matrix into .position, .quaternion, .scale
		var position = new THREE.Vector3
		var quaternion = new THREE.Quaternion()
		var scale = new THREE.Vector3
		matrix.decompose(position, quaternion, scale)

		// http://wiki.unity3d.com/index.php/Averaging_Quaternions_and_Vectors
		stats.count++

		THREEx.ArMultiMarkerControls.averageVector3(stats.position.sum, position, stats.count, stats.position.average)
		THREEx.ArMultiMarkerControls.averageQuaternion(stats.quaternion.sum, quaternion, firstQuaternion, stats.count, stats.quaternion.average)
		THREEx.ArMultiMarkerControls.averageVector3(stats.scale.sum, scale, stats.count, stats.scale.average)
	})

	// if at least one sub-marker has been detected, make the average of all detected markers
	if( stats.count > 0 ){
		_this.object3d.position.copy(stats.position.average)
		_this.object3d.quaternion.copy(stats.quaternion.average)
		_this.object3d.scale.copy(stats.scale.average)
	}

	// honor _this.object3d.visible
	if( stats.count > 0 ){
		_this.object3d.visible = true
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
//		Utility function
//////////////////////////////////////////////////////////////////////////////

/**
 * compute the center of this multimarker file
 */
THREEx.ArMultiMarkerControls.computeCenter = function(jsonData){
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

		THREEx.ArMultiMarkerControls.averageVector3(stats.position.sum, position, stats.count, stats.position.average)
		THREEx.ArMultiMarkerControls.averageQuaternion(stats.quaternion.sum, quaternion, firstQuaternion, stats.count, stats.quaternion.average)
		THREEx.ArMultiMarkerControls.averageVector3(stats.scale.sum, scale, stats.count, stats.scale.average)
	})
	
	var averageMatrix = new THREE.Matrix4()
	averageMatrix.compose(stats.position.average, stats.quaternion.average, stats.scale.average)

	return averageMatrix
}

THREEx.ArMultiMarkerControls.computeBoundingBox = function(jsonData){
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
	
	console.log('ArMultiMarkerControls.computeBoundingBox', multiMarkerFile, boundingBox)
debugger
	return boundingBox
}
//////////////////////////////////////////////////////////////////////////////
//		updateSmoothedControls
//////////////////////////////////////////////////////////////////////////////

THREEx.ArMultiMarkerControls.prototype.updateSmoothedControls = function(smoothedControls, lerpsValues){
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
	this.subMarkersControls.forEach(function(markerControls, markerIndex){
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

THREEx.ArMultiMarkerControls.fromJSON = function(arToolkitContext, scene, markerRoot, jsonData){
	var multiMarkerFile = JSON.parse(jsonData)
	// declare the parameters
	var subMarkersControls = []
	var subMarkerPoses = []

	// prepare the parameters
	multiMarkerFile.subMarkersControls.forEach(function(item){
		// create a markerRoot
		var markerRoot = new THREE.Object3D()
		scene.add(markerRoot)

		// create markerControls for our markerRoot
		var subMarkerControls = new THREEx.ArMarkerControls(arToolkitContext, markerRoot, item.parameters)

if( true ){
		// store it in the parameters
		subMarkersControls.push(subMarkerControls)
		subMarkerPoses.push(new THREE.Matrix4().fromArray(item.poseMatrix))	
}else{
		// build a smoothedControls
		var smoothedRoot = new THREE.Group()
		scene.add(smoothedRoot)
		var smoothedControls = new THREEx.ArSmoothedControls(smoothedRoot, {
			lerpPosition : 0.1,
			lerpQuaternion : 0.1, 
			lerpScale : 0.1,
			minVisibleDelay: 0,
			minUnvisibleDelay: 0,
		})
		onRenderFcts.push(function(delta){
			smoothedControls.update(markerRoot)	// TODO this is a global
		})
	

		// store it in the parameters
		subMarkersControls.push(smoothedControls)
		subMarkerPoses.push(new THREE.Matrix4().fromArray(item.poseMatrix))
}
	})
	// create a new THREEx.ArMultiMarkerControls
	var multiMarkerControls = new THREEx.ArMultiMarkerControls(arToolkitContext, markerRoot, subMarkersControls, subMarkerPoses)

	// return it
	return multiMarkerControls	
}

//////////////////////////////////////////////////////////////////////////////
//		storeDefaultMultiMarkerFile
//////////////////////////////////////////////////////////////////////////////

THREEx.ArMultiMarkerControls.storeDefaultMultiMarkerFile = function(arBackend){
	var file = THREEx.ArMultiMarkerControls.createDefaultMultiMarkerFile(arBackend)
	// json.strinfy the value and store it in localStorage
	localStorage.setItem('ARjsMultiMarkerFile', JSON.stringify(file))
}

THREEx.ArMultiMarkerControls.createDefaultMultiMarkerFile = function(arBackend){
	// create the base file
	var file = {
		meta : {
			createdBy : "AR.js Default Marker "+THREEx.ArToolkitContext.REVISION,
			createdAt : new Date().toJSON(),
		},
		arBackend : arBackend,
		subMarkersControls : [
			// empty for now...
		]
	}
	// add a subMarkersControls
	file.subMarkersControls[0] = {
		parameters: {},
		poseMatrix: new THREE.Matrix4().makeTranslation(0,0, 0).toArray(),
	}
	if( arBackend === 'aruco' ){
		file.subMarkersControls[0].parameters.type = 'barcode'
		file.subMarkersControls[0].parameters.barcodeValue = 1001
	}else if( arBackend === 'artoolkit' ){
		file.subMarkersControls[0].parameters.type = 'pattern'
		file.subMarkersControls[0].parameters.patternUrl = THREEx.ArToolkitContext.baseURL + 'examples/marker-training/examples/pattern-files/pattern-hiro.patt'
	}else console.assert(false)
	
	// json.strinfy the value and store it in localStorage
	return file
}
