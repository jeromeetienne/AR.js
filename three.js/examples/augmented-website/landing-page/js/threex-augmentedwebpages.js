var THREEx = THREEx || {}

THREEx.AugmentedWebpages = {}
THREEx.AugmentedWebpages.baseURL = '../../../'
	
// TODO find a better name
THREEx.AugmentedWebpages.buildAreaFileFromResolution = function(trackingBackend, resolutionW, resolutionH){
	// create the base file
	var file = {
		meta : {
			createdBy : "AR.js - Augmented Webpages",
			createdAt : new Date().toJSON(),
		},
		arBackend : trackingBackend,
		subMarkersControls : [
			// empty for now...
		]
	}
	
	var whiteMargin = 0.1
	var markerImageSize = 0.4 * resolutionH
	var outterMarkerSize = markerImageSize * (1 - 2*whiteMargin)
	
	var deltaX = (resolutionW - markerImageSize)/2 / outterMarkerSize
	var deltaZ = (resolutionH - markerImageSize)/2 / outterMarkerSize

	var subMarkerControls = buildSubMarkerControls('center', 0, 0)
	file.subMarkersControls.push(subMarkerControls)

	var subMarkerControls = buildSubMarkerControls('topleft', -deltaX, -deltaZ)
	file.subMarkersControls.push(subMarkerControls)
	
	var subMarkerControls = buildSubMarkerControls('topright', +deltaX, -deltaZ)
	file.subMarkersControls.push(subMarkerControls)

	var subMarkerControls = buildSubMarkerControls('bottomleft', -deltaX, +deltaZ)
	file.subMarkersControls.push(subMarkerControls)
	
	var subMarkerControls = buildSubMarkerControls('bottomright', +deltaX, +deltaZ)
	file.subMarkersControls.push(subMarkerControls)
		
	return file
	
	//////////////////////////////////////////////////////////////////////////////
	//		Code Separator
	//////////////////////////////////////////////////////////////////////////////

	function buildSubMarkerControls(layout, positionX, positionZ){
		// create subMarkersControls
		var subMarkersControls = {
			parameters: {},
			poseMatrix: new THREE.Matrix4().makeTranslation(positionX, 0, positionZ).toArray(),
		}
		// fill the parameters
		if( trackingBackend === 'artoolkit' ){
			layout2MarkerParametersArtoolkit(subMarkersControls.parameters, layout)
		}else if( trackingBackend === 'aruco' ){
			layout2MarkerParametersAruco(subMarkersControls.parameters, layout)
		}else console.assert(false)
		// return subMarkersControls
		return subMarkersControls
	}

	function layout2MarkerParametersArtoolkit(parameters, layout){
		var layout2PatternUrl = {
			'center' : THREEx.AugmentedWebpages.baseURL + 'examples/marker-training/examples/pattern-files/pattern-hiro.patt',
			'topleft' : THREEx.AugmentedWebpages.baseURL + 'examples/marker-training/examples/pattern-files/pattern-letterA.patt',
			'topright' : THREEx.AugmentedWebpages.baseURL + 'examples/marker-training/examples/pattern-files/pattern-letterB.patt',
			'bottomleft' : THREEx.AugmentedWebpages.baseURL + 'examples/marker-training/examples/pattern-files/pattern-letterC.patt',
			'bottomright' : THREEx.AugmentedWebpages.baseURL + 'examples/marker-training/examples/pattern-files/pattern-letterF.patt',
		}

		console.assert(layout2PatternUrl[layout])
		parameters.type = 'pattern'
		parameters.patternUrl = layout2PatternUrl[layout]
	}

	function layout2MarkerParametersAruco(parameters, layout){
		var layout2Barcode = {
			'center' : 1001,
			'topleft' : 1002,
			'topright' : 1003,
			'bottomleft' : 1004,
			'bottomright' : 1005,
		}
		console.assert(layout2Barcode[layout])
		parameters.type = 'barcode'
		parameters.barcodeValue = layout2Barcode[layout]
	}
}
