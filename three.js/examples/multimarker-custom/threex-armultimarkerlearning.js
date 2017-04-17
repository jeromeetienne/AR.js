var THREEx = THREEx || {}

THREEx.ArMultiMakersLearning = function(markersControls){
	var _this = this
	this.markersControls = markersControls
		
	// - create all controls with all object3d
	// - provide a score of confidence that can be displayed
	// - it outputs a multiMakerInfo
	//   - an array of makerControlsParameters + pose

	// listen to arToolkitContext event 'sourceProcessed'
	// - after we fully processed one image, aka when we know all detected poses in it
	var arToolkitContext = markersControls[0].context
	arToolkitContext.addEventListener('sourceProcessed', function(){
		_this._onSourceProcessed()
	})
}


//////////////////////////////////////////////////////////////////////////////
//		Code Separator
//////////////////////////////////////////////////////////////////////////////

THREEx.ArMultiMakersLearning.prototype.toJSON = function(){
	var data = {
		meta : {
			createdBy : "AR.js "+THREEx.ArToolkitContext.REVISION,
			createdAt : new Date().toJSON(),
			
		},
		markersControls : []
	}
	var firstMatrixInverse = new THREE.Matrix4().getInverse(this.markersControls[0].object3d.matrix)

	this.markersControls.forEach(function(markerControls, index){
		
		// if( index === 0 ){
		// 	var matrix = new THREE.Matrix4
		// }else{
		// 	var matrix = firstMatrixInverse.clone()
		// 	matrix.multiply(markerControls.object3d.matrix)
		// 	
		// }

		var matrix = markerControls.object3d.matrix.clone()
		matrix.multiply(firstMatrixInverse)
		// TODO here compute the matrix based on the statistic you got
		
		data.markersControls.push({
			parameters : {
				// TODO here be more generic, what about bar code
				type: markerControls.parameters.type,
				patternUrl: markerControls.parameters.patternUrl,
			},
			poseMatrix : matrix.toArray(),
		})
	})

	var strJSON = JSON.stringify(data, null, '\t');
	
	
	if( true ){
		var tmp = JSON.parse(strJSON)
		tmp.markersControls.forEach(function(markerControls){
			markerControls.poseMatrix = markerControls.poseMatrix.map(function(value){
				var roundingFactor = 1000
				return Math.floor(value*roundingFactor)/roundingFactor
			})
		})
		strJSON = JSON.stringify(tmp, null, '\t');
	}
	
	return strJSON;	
}

//////////////////////////////////////////////////////////////////////////////
//		Code Separator
//////////////////////////////////////////////////////////////////////////////

/**
 * What to do when a image source is fully processed
 */
THREEx.ArMultiMakersLearning.prototype._onSourceProcessed = function(){
	// here collect the statistic on relative positioning 

	var visibleMarkerControls = this.markersControls.filter(function(markerControls){
		return markerControls.object3d.visible === true
	})

	var countVisible = visibleMarkerControls.length

	var position1 = new THREE.Vector3()
	var quaternion1 = new THREE.Quaternion()
	var scale1 = new THREE.Vector3()


	var position2 = new THREE.Vector3()
	var quaternion2 = new THREE.Quaternion()
	var scale2 = new THREE.Vector3()
	
	for(var i = 0; i < visibleMarkerControls.length-1; i++){
		var markerControls1 = visibleMarkerControls[i]
		for(var j = 0; j < visibleMarkerControls.length; j++){
			var markerControls2 = visibleMarkerControls[j]

			// decompose the matrix1 into .position, .quaternion, .scale
			markerControls1.object3d.matrix.decompose(position1, quaternion1, scale1)

			// decompose the matrix1 into .position, .quaternion, .scale
			markerControls2.object3d.matrix.decompose(position2, quaternion2, scale2)
			
			var position = position2.sub(position1)
			var quaternion = quaternion1.multiply( quaternion2.inverse() )
			var scale = scale2.sub(scale1)

			//////////////////////////////////////////////////////////////////////////////
			//		create data in markerControls1.object3d.userData
			//////////////////////////////////////////////////////////////////////////////
			// create multiMarkerStats for markerControls1 if needed
			if( markerControls1.object3d.userData.multiMarkerStats === undefined ){
				markerControls1.object3d.userData.multiMarkerStats = []	
			}
			var multiMarkerStats = markerControls1.object3d.userData.multiMarkerStats
			// create the multiMarkerPosition average if needed`
			if( multiMarkerStats[markerControls2.id] === undefined ){
				multiMarkerStats[markerControls2.id] = {
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
			//		update statistics
			//////////////////////////////////////////////////////////////////////////////
			var stats = multiMarkerStats[markerControls2.id]
			// update the count
			stats.count ++

			// update the average of position/rotation/scale
			THREEx.ArMultiMarkerControls.averageVector3(stats.position.sum, position , stats.count, stats.position.average)
			THREEx.ArMultiMarkerControls.averageQuaternion(stats.quaternion.sum, quaternion , stats.count, stats.quaternion.average)
			THREEx.ArMultiMarkerControls.averageVector3(stats.scale.sum, scale , stats.count, stats.scale.average)
		}
	}
}
