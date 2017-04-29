var THREEx = THREEx || {}

THREEx.ArMultiMakersLearning = function(subMarkersControls){
	var _this = this

	// Init variables
	this.subMarkersControls = subMarkersControls
	this.enabled = true
		
	// listen to arToolkitContext event 'sourceProcessed'
	// - after we fully processed one image, aka when we know all detected poses in it
	var originSubControls = this.subMarkersControls[0]
	var arToolkitContext = originSubControls.context
	arToolkitContext.addEventListener('sourceProcessed', function(){
		_this._onSourceProcessed()
	})
}


//////////////////////////////////////////////////////////////////////////////
//		statistic collection
//////////////////////////////////////////////////////////////////////////////

/**
 * What to do when a image source is fully processed
 */
THREEx.ArMultiMakersLearning.prototype._onSourceProcessed = function(){
	var originQuaternion = this.subMarkersControls[0].object3d.quaternion
	// here collect the statistic on relative positioning 
	
	// honor this.enabled
	if( this.enabled === false )	return

	// keep only the visible markers
	var visibleMarkerControls = this.subMarkersControls.filter(function(markerControls){
		return markerControls.object3d.visible === true
	})

	var countVisible = Object.keys(visibleMarkerControls).length

	var positionDelta = new THREE.Vector3()
	var quaternionDelta = new THREE.Quaternion()
	var scaleDelta = new THREE.Vector3()
	var tmpMatrix = new THREE.Matrix4()
	
	// go thru all the visibleMarkerControls
	for(var i = 0; i < countVisible; i++){
		var markerControls1 = visibleMarkerControls[i]
		for(var j = 0; j < countVisible; j++){
			var markerControls2 = visibleMarkerControls[j]

			// if markerControls1 is markerControls2, then skip it
			if( i === j )	continue


			//////////////////////////////////////////////////////////////////////////////
			//		create data in markerControls1.object3d.userData if needed
			//////////////////////////////////////////////////////////////////////////////
			// create seenCouples for markerControls1 if needed
			if( markerControls1.object3d.userData.seenCouples === undefined ){
				markerControls1.object3d.userData.seenCouples = {}
			}
			var seenCouples = markerControls1.object3d.userData.seenCouples
			// create the multiMarkerPosition average if needed`
			if( seenCouples[markerControls2.id] === undefined ){
				// console.log('create seenCouples between', markerControls1.id, 'and', markerControls2.id)
				seenCouples[markerControls2.id] = {
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
			}

			
			//////////////////////////////////////////////////////////////////////////////
			//		Compute markerControls2 position relative to markerControls1
			//////////////////////////////////////////////////////////////////////////////
			
			// compute markerControls2 position/quaternion/scale in relation with markerControls1
			tmpMatrix.getInverse(markerControls1.object3d.matrix)
			tmpMatrix.multiply(markerControls2.object3d.matrix)
			tmpMatrix.decompose(positionDelta, quaternionDelta, scaleDelta)
			
			//////////////////////////////////////////////////////////////////////////////
			//		update statistics
			//////////////////////////////////////////////////////////////////////////////
			var stats = seenCouples[markerControls2.id]
			// update the count
			stats.count++

			// update the average of position/rotation/scale
			THREEx.ArMultiMarkerControls.averageVector3(stats.position.sum, positionDelta, stats.count, stats.position.average)
			THREEx.ArMultiMarkerControls.averageQuaternion(stats.quaternion.sum, quaternionDelta, originQuaternion, stats.count, stats.quaternion.average)
			THREEx.ArMultiMarkerControls.averageVector3(stats.scale.sum, scaleDelta, stats.count, stats.scale.average)
		}
	}
}

//////////////////////////////////////////////////////////////////////////////
//		Compute markers transformation matrix from current stats
//////////////////////////////////////////////////////////////////////////////

THREEx.ArMultiMakersLearning.prototype._computeAverageMatrix = function(){
	var _this = this
	var originSubControls = this.subMarkersControls[0]
	var originSeenCouples = originSubControls.object3d.userData.seenCouples || {}
	
	// special case of originSubControls averageMatrix
	originSubControls.object3d.userData.averageMatrix = new THREE.Matrix4()
	
	// var originMatrixInverse = new THREE.Matrix4().getInverse(originSubControls.object3d.userData.averageMatrix)
	var originMatrixInverse =  new THREE.Matrix4().getInverse(originSubControls.object3d.matrix)
	
	// go thru all the originSeenCouples
	Object.keys(originSeenCouples).forEach(function(otherSubControlsID){
		// otherSubControlsID are string here, as they are keys from objects, converting them to Number
		otherSubControlsID = parseInt(otherSubControlsID)
		
		if( originSubControls.id === otherSubControlsID )	return
				
		// build averageMatrix
		var seenCoupleStats = originSeenCouples[otherSubControlsID]
		var averageMatrix = new THREE.Matrix4()
		averageMatrix.compose(seenCoupleStats.position.average, seenCoupleStats.quaternion.average, seenCoupleStats.scale.average)

		// store averageMatrix in otherSubControls
		var otherSubControls = getSubControlsByID(otherSubControlsID)
		otherSubControls.object3d.userData.averageMatrix = averageMatrix
	})
	
	return
	
	// get a _this.subMarkersControls based on markerControls.id
	function getSubControlsByID(controlsID){
		// debugger
		for(var i = 0; i < _this.subMarkersControls.length; i++){
			var subMarkerControls = _this.subMarkersControls[i]
			if( subMarkerControls.id === controlsID ){
				return subMarkerControls
			}
		}
		return null
	}
}

//////////////////////////////////////////////////////////////////////////////
//		JSON file building
//////////////////////////////////////////////////////////////////////////////

THREEx.ArMultiMakersLearning.prototype.toJSON = function(){

	// compute the average matrix before generating the file
	this._computeAverageMatrix()


	//////////////////////////////////////////////////////////////////////////////
	//		actually build the json
	//////////////////////////////////////////////////////////////////////////////
	var data = {
		meta : {
			createdBy : "AR.js "+THREEx.ArToolkitContext.REVISION,
			createdAt : new Date().toJSON(),
			
		},
		subMarkersControls : []
	}

	var originSubControls = this.subMarkersControls[0]
	var originMatrixInverse = new THREE.Matrix4().getInverse(originSubControls.object3d.matrix)
	this.subMarkersControls.forEach(function(markerControls, index){
		
		var poseMatrix = originMatrixInverse.clone()
		poseMatrix.multiply(markerControls.object3d.matrix)

		var poseMatrix = markerControls.object3d.userData.averageMatrix
		console.assert(poseMatrix instanceof THREE.Matrix4)
		
		data.subMarkersControls.push({
			parameters : {
				// TODO here be more generic, what about bar code
				// - depends on the type of markers
				// - copy them from parameters ?
				type: markerControls.parameters.type,
				patternUrl: markerControls.parameters.patternUrl,
			},
			poseMatrix : poseMatrix.toArray(),
		})
	})

	var strJSON = JSON.stringify(data, null, '\t');
	
	
	//////////////////////////////////////////////////////////////////////////////
	//		round matrix elements to ease readability - for debug
	//////////////////////////////////////////////////////////////////////////////
	var humanReadable = false
	if( humanReadable === true ){
		var tmp = JSON.parse(strJSON)
		tmp.subMarkersControls.forEach(function(markerControls){
			markerControls.poseMatrix = markerControls.poseMatrix.map(function(value){
				var roundingFactor = 100
				return Math.round(value*roundingFactor)/roundingFactor
			})
		})
		strJSON = JSON.stringify(tmp, null, '\t');
	}
	
	return strJSON;	
}

//////////////////////////////////////////////////////////////////////////////
//		utility function
//////////////////////////////////////////////////////////////////////////////
/**
 * reset all collected statistics
 */
THREEx.ArMultiMakersLearning.prototype.resetStats = function(){
	this.subMarkersControls.forEach(function(markerControls){
		delete markerControls.object3d.userData.averageMatrix
		delete markerControls.object3d.userData.seenCouples
	})
}
