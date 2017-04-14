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
		markersControls : []
	}

	this.markersControls.forEach(function(markerControls){
		
		var matrix = markerControls.object3d.matrix.clone()
		// TODO here compute the matrix based on the statistic you got
		
		data.markerControls.push({
			parameters : {
				// TODO here be more generic, what about bar code
				type: markerControls.parameters.type,
				patternUrl: markerControls.parameters.patternUrl,
			},
			pose : matrix,
		})
	})

	return data
}

//////////////////////////////////////////////////////////////////////////////
//		Code Separator
//////////////////////////////////////////////////////////////////////////////

/**
 * What to do when a image source is fully processed
 */
THREEx.ArMultiMakersLearning.prototype._onSourceProcessed = function(){
	// here collect the statistic on relative positioning 

	var positionsSum = new THREE.Vector3

	var visibleMarkerControls = this.markersControls.filter(function(markerControls){
		return markerControls.object3d.visible === true
	})

	var countVisible = visibleMarkerControls.length

	console.log('countVisible', countVisible)
	for(var i = 0; i < visibleMarkerControls.length-1; i++){
		var markerControls1 = visibleMarkerControls[i]
		for(var j = i+1; j < visibleMarkerControls.length; j++){
			var markerControls2 = visibleMarkerControls[j]

			// decompose the matrix1 into .position, .quaternion, .scale
			var position1 = new THREE.Vector3()
			markerControls1.object3d.matrix.decompose(position1, new THREE.Quaternion(), new THREE.Vector3)

			// decompose the matrix1 into .position, .quaternion, .scale
			var position2 = new THREE.Vector3()
			markerControls2.object3d.matrix.decompose(position2, new THREE.Quaternion(), new THREE.Vector3)
			
			var relativePosition1to2 = position2.sub(position1)
			console.log('relativePosition1to2', relativePosition1to2)
			
			
			console.log('couple', i, j)
		}
	}
}
