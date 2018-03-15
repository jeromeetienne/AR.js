var THREEx = THREEx || {}

THREEx.ArMarkerControls = function(context, object3d, parameters){
	var _this = this
	this.context = context
	// handle default parameters
	this.parameters = {
		// size of the marker in meter
		size : parameters.debug !== undefined ? parameters.debug : 1,
		// type of marker - ['pattern', 'barcode', 'unknown' ]
		type : parameters.type !== undefined ? parameters.type : 'unknown',
		// url of the pattern - IIF type='pattern'
		patternUrl : parameters.patternUrl !== undefined ? parameters.patternUrl : null,
		// value of the barcode - IIF type='barcode'
		barcodeValue : parameters.barcodeValue !== undefined ? parameters.barcodeValue : null,
		// change matrix mode - [modelViewMatrix, cameraTransformMatrix]
		changeMatrixMode : parameters.changeMatrixMode !== undefined ? parameters.changeMatrixMode : 'modelViewMatrix',
	}

	// sanity check
	var possibleValues = ['pattern', 'barcode', 'unknown' ]
	console.assert(possibleValues.indexOf(this.parameters.type) !== -1, 'illegal value', this.parameters.type)
	var possibleValues = ['modelViewMatrix', 'cameraTransformMatrix' ]
	console.assert(possibleValues.indexOf(this.parameters.changeMatrixMode) !== -1, 'illegal value', this.parameters.changeMatrixMode)

	this.markerId = null

        // create the marker Root
	this.object3d = object3d || new THREE.Group
	this.object3d.name = 'Marker Root'
	this.object3d.matrixAutoUpdate = false;
	this.object3d.visible = false

	// add this marker to artoolkitsystem
	context.addMarker(this)
	
	// wait for arController to be initialized before going on with the init
	var delayedInitTimerId = setInterval(function(){
		// check if arController is init
		var arController = _this.context.arController
		if( arController === null )	return
		// stop looping if it is init
		clearInterval(delayedInitTimerId)
		delayedInitTimerId = null
		// launch the _postInit
		_this._postInit()
	}, 1000/50)
	return
	
}

THREEx.ArMarkerControls.prototype._postInit = function(){
	var _this = this
	var markerRoot = this.object3d;
	// check if arController is init
	var arController = this.context.arController
	console.assert(arController !== null )

	// start tracking this pattern
	if( _this.parameters.type === 'pattern' ){
                arController.loadMarker(_this.parameters.patternUrl, function(markerId) {
			_this.markerId = markerId
                        arController.trackPatternMarkerId(_this.markerId, _this.parameters.size);
                });				
	}else if( _this.parameters.type === 'barcode' ){
		_this.markerId = _this.parameters.barcodeValue
		arController.trackBarcodeMarkerId(_this.markerId, _this.parameters.size);
	}else if( _this.parameters.type === 'unknown' ){
		_this.markerId = null
	}else{
		console.log(false, 'invalid marker type', _this.parameters.type)
	}

	// listen to the event 
	arController.addEventListener('getMarker', function(event){
		onMarkerFound()
// debugger;
		// if( event.data.type === artoolkit.PATTERN_MARKER && _this.parameters.type === 'pattern' ){
		// 	if( _this.markerId === null )	return
		// 	if( event.data.marker.idPatt === _this.markerId ) onMarkerFound()
		// }else if( event.data.type === artoolkit.BARCODE_MARKER && _this.parameters.type === 'barcode' ){
		// 	// console.log('BARCODE_MARKER idMatrix', event.data.marker.idMatrix, _this.markerId )
		// 	if( _this.markerId === null )	return
		// 	if( event.data.marker.idMatrix === _this.markerId )  onMarkerFound()
		// }else if( event.data.type === artoolkit.UNKNOWN_MARKER && _this.parameters.type === 'unknown'){
		// 	onMarkerFound()
		// }

		function onMarkerFound(){
			// data.matrix is the model view matrix
			var modelViewMatrix = new THREE.Matrix4().fromArray(event.data.matrix)
			markerRoot.visible = true

			if( _this.parameters.changeMatrixMode === 'modelViewMatrix' ){
				markerRoot.matrix.copy(modelViewMatrix)						
			}else if( _this.parameters.changeMatrixMode === 'cameraTransformMatrix' ){
				var cameraTransformMatrix = new THREE.Matrix4().getInverse( modelViewMatrix )
				markerRoot.matrix.copy(cameraTransformMatrix)						
			}else {
				console.assert(false)
			}
			// decompose the matrix into .position, .quaternion, scale
			markerRoot.matrix.decompose(markerRoot.position, markerRoot.quaternion, markerRoot.scale)
		}
	})
}

THREEx.ArMarkerControls.dispose = function(){
	this.context.removeMarker(this)
	
	// TODO remove the event listener if needed
	// unloadMaker ???
}
