var THREEx = THREEx || {}

THREEx.ArMultiMakersLearning = function(arToolkitContext, subMarkersControls){
	var _this = this
	this._arToolkitContext = arToolkitContext

	// Init variables
	this.subMarkersControls = subMarkersControls
	this.enabled = true
		
	// listen to arToolkitContext event 'sourceProcessed'
	// - after we fully processed one image, aka when we know all detected poses in it
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

	var count = Object.keys(visibleMarkerControls).length

	var positionDelta = new THREE.Vector3()
	var quaternionDelta = new THREE.Quaternion()
	var scaleDelta = new THREE.Vector3()
	var tmpMatrix = new THREE.Matrix4()
	
	// go thru all the visibleMarkerControls
	for(var i = 0; i < count; i++){
		var markerControls1 = visibleMarkerControls[i]
		for(var j = 0; j < count; j++){
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

THREEx.ArMultiMakersLearning.prototype.computeResult = function(){
	var _this = this
	var originSubControls = this.subMarkersControls[0]

	this.deleteResult()

	// special case of originSubControls averageMatrix
	originSubControls.object3d.userData.result = {
		averageMatrix : new THREE.Matrix4(),
		confidenceFactor: 1,
	}
	// TODO here check if the originSubControls has been seen at least once!!
	
	
	/**
	 * ALGO in pseudo code
	 *
	 * - Set confidenceFactor of origin sub markers as 1
	 *
	 * Start Looping
	 * - For a given sub marker, skip it if it already has a result.
	 * - if no result, check all seen couple and find n ones which has a progress of 1 or more.
	 * - So the other seen sub markers, got a valid transformation matrix. 
	 * - So take local averages position/orientation/scale, compose a transformation matrix. 
	 *   - aka transformation matrix from parent matrix * transf matrix pos/orientation/scale
	 * - Multiple it by the other seen marker matrix. 
	 * - Loop on the array until one pass could not compute any new sub marker
	 */
	
	do{
		var resultChanged = false
		// loop over each subMarkerControls
		this.subMarkersControls.forEach(function(subMarkerControls){

			// if subMarkerControls already has a result, do nothing
			var result = subMarkerControls.object3d.userData.result
			var isLearned = (result !== undefined && result.confidenceFactor >= 1) ? true : false
			if( isLearned === true )	return
			
			// console.log('compute subMarkerControls', subMarkerControls.name())
			var otherSubControlsID = _this._getLearnedCoupleStats(subMarkerControls)
			if( otherSubControlsID === null ){
				// console.log('no learnedCoupleStats')
				return
			}
			
			var otherSubControls = _this._getSubMarkerControlsByID(otherSubControlsID)

			var seenCoupleStats = subMarkerControls.object3d.userData.seenCouples[otherSubControlsID]
			
			var averageMatrix = new THREE.Matrix4()
			averageMatrix.compose(seenCoupleStats.position.average, seenCoupleStats.quaternion.average, seenCoupleStats.scale.average)
				
			var otherAverageMatrix = otherSubControls.object3d.userData.result.averageMatrix

			var matrix = new THREE.Matrix4().getInverse(otherAverageMatrix).multiply(averageMatrix)
			matrix = new THREE.Matrix4().getInverse(matrix)

			console.assert( subMarkerControls.object3d.userData.result === undefined )
			subMarkerControls.object3d.userData.result = {
				averageMatrix: matrix,
				confidenceFactor: 1
			}
			
			resultChanged = true
		})
		// console.log('loop')
	}while(resultChanged === true)
	
	// debugger
	// console.log('json:', this.toJSON())
	// this.subMarkersControls.forEach(function(subMarkerControls){
	// 	var hasResult = subMarkerControls.object3d.userData.result !== undefined
	// 	console.log('marker', subMarkerControls.name(), hasResult ? 'has' : 'has NO', 'result')
	// })
}

//////////////////////////////////////////////////////////////////////////////
//		Utility function
//////////////////////////////////////////////////////////////////////////////

/** 
 * get a _this.subMarkersControls id based on markerControls.id
 */
THREEx.ArMultiMakersLearning.prototype._getLearnedCoupleStats	= function(subMarkerControls){

	// if this subMarkerControls has never been seen with another subMarkerControls
	if( subMarkerControls.object3d.userData.seenCouples === undefined )	return null
	
	var seenCouples = subMarkerControls.object3d.userData.seenCouples
	var coupleControlsIDs = Object.keys(seenCouples).map(Number)

	for(var i = 0; i < coupleControlsIDs.length; i++){
		var otherSubControlsID = coupleControlsIDs[i]
		// get otherSubControls
		var otherSubControls = this._getSubMarkerControlsByID(otherSubControlsID)
			
		// if otherSubControls isnt learned, skip it
		var result = otherSubControls.object3d.userData.result
		var isLearned = (result !== undefined && result.confidenceFactor >= 1) ? true : false
		if( isLearned === false )	continue

		// return this seenCouplesStats
		return otherSubControlsID
	}
	
	// if none is found, return null
	return null
}

/** 
 * get a _this.subMarkersControls based on markerControls.id
 */
THREEx.ArMultiMakersLearning.prototype._getSubMarkerControlsByID	= function(controlsID){

	for(var i = 0; i < this.subMarkersControls.length; i++){
		var subMarkerControls = this.subMarkersControls[i]
		if( subMarkerControls.id === controlsID ){
			return subMarkerControls
		}
	}

	return null
}
 //////////////////////////////////////////////////////////////////////////////
//		JSON file building
//////////////////////////////////////////////////////////////////////////////

THREEx.ArMultiMakersLearning.prototype.toJSON = function(){

	// compute the average matrix before generating the file
	this.computeResult()

	//////////////////////////////////////////////////////////////////////////////
	//		actually build the json
	//////////////////////////////////////////////////////////////////////////////
	var data = {
		meta : {
			createdBy : "Area Learning - AR.js "+THREEx.ArToolkitContext.REVISION,
			createdAt : new Date().toJSON(),
			
		},
		trackingBackend: this._arToolkitContext.parameters.trackingBackend,
		subMarkersControls : [],
	}

	var originSubControls = this.subMarkersControls[0]
	var originMatrixInverse = new THREE.Matrix4().getInverse(originSubControls.object3d.matrix)
	this.subMarkersControls.forEach(function(subMarkerControls, index){
		
		// if a subMarkerControls has no result, ignore it
		if( subMarkerControls.object3d.userData.result === undefined )	return

		var poseMatrix = subMarkerControls.object3d.userData.result.averageMatrix
		console.assert(poseMatrix instanceof THREE.Matrix4)
		

		// build the info
		var info = {
			parameters : {
				// to fill ...
			},
			poseMatrix : poseMatrix.toArray(),
		}
		if( subMarkerControls.parameters.type === 'pattern' ){
			info.parameters.type = subMarkerControls.parameters.type
			info.parameters.patternUrl = subMarkerControls.parameters.patternUrl
		}else if( subMarkerControls.parameters.type === 'barcode' ){
			info.parameters.type = subMarkerControls.parameters.type
			info.parameters.barcodeValue = subMarkerControls.parameters.barcodeValue
		}else console.assert(false)

		data.subMarkersControls.push(info)
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
	this.deleteResult()
	
	this.subMarkersControls.forEach(function(markerControls){
		delete markerControls.object3d.userData.seenCouples
	})
}
/**
 * reset all collected statistics
 */
THREEx.ArMultiMakersLearning.prototype.deleteResult = function(){
	this.subMarkersControls.forEach(function(markerControls){
		delete markerControls.object3d.userData.result
	})
}
