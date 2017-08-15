var THREEx = THREEx || {}

var ARjs = ARjs || {}
var THREEx = THREEx || {}

ARjs.MarkersAreaUtils = THREEx.ArMultiMarkerUtils = {}

//////////////////////////////////////////////////////////////////////////////
//		navigateToLearnerPage
//////////////////////////////////////////////////////////////////////////////

/**
 * Navigate to the multi-marker learner page
 * 
 * @param {String} learnerBaseURL  - the base url for the learner
 * @param {String} trackingBackend - the tracking backend to use
 */
ARjs.MarkersAreaUtils.navigateToLearnerPage = function(learnerBaseURL, trackingBackend){
	var learnerParameters = {
		backURL : location.href,
		trackingBackend: trackingBackend,
		markersControlsParameters: ARjs.MarkersAreaUtils.createDefaultMarkersControlsParameters(trackingBackend),
	}
	location.href = learnerBaseURL + '?' + encodeURIComponent(JSON.stringify(learnerParameters))
}

//////////////////////////////////////////////////////////////////////////////
//		DefaultMultiMarkerFile
//////////////////////////////////////////////////////////////////////////////

/**
 * Create and store a default multi-marker file
 * 
 * @param {String} trackingBackend - the tracking backend to use
 */
ARjs.MarkersAreaUtils.storeDefaultMultiMarkerFile = function(trackingBackend){
	var file = ARjs.MarkersAreaUtils.createDefaultMultiMarkerFile(trackingBackend)
	// json.strinfy the value and store it in localStorage
	localStorage.setItem('ARjsMultiMarkerFile', JSON.stringify(file))
}



/**
 * Create a default multi-marker file
 * @param {String} trackingBackend - the tracking backend to use
 * @return {Object} - json object of the multi-marker file
 */
ARjs.MarkersAreaUtils.createDefaultMultiMarkerFile = function(trackingBackend){
	console.assert(trackingBackend)
	if( trackingBackend === undefined )	debugger
	
	// create absoluteBaseURL
	var link = document.createElement('a')
	link.href = ARjs.Context.baseURL
	var absoluteBaseURL = link.href

	// create the base file
	var file = {
		meta : {
			createdBy : 'AR.js ' + ARjs.Context.REVISION + ' - Default Marker',
			createdAt : new Date().toJSON(),
		},
		trackingBackend : trackingBackend,
		subMarkersControls : [
			// empty for now... being filled 
		]
	}
	// add a subMarkersControls
	file.subMarkersControls[0] = {
		parameters: {},
		poseMatrix: new THREE.Matrix4().makeTranslation(0,0, 0).toArray(),
	}
	if( trackingBackend === 'artoolkit' ){
		file.subMarkersControls[0].parameters.type = 'pattern'
		file.subMarkersControls[0].parameters.patternUrl = absoluteBaseURL + 'examples/marker-training/examples/pattern-files/pattern-hiro.patt'
	}else if( trackingBackend === 'aruco' ){
		file.subMarkersControls[0].parameters.type = 'barcode'
		file.subMarkersControls[0].parameters.barcodeValue = 1001
	}else console.assert(false)
	
	// json.strinfy the value and store it in localStorage
	return file
}

//////////////////////////////////////////////////////////////////////////////
//		createDefaultMarkersControlsParameters
//////////////////////////////////////////////////////////////////////////////

/**
 * Create a default controls parameters for the multi-marker learner
 * 
 * @param {String} trackingBackend - the tracking backend to use
 * @return {Object} - json object containing the controls parameters
 */
ARjs.MarkersAreaUtils.createDefaultMarkersControlsParameters = function(trackingBackend){
	// create absoluteBaseURL
	var link = document.createElement('a')
	link.href = ARjs.Context.baseURL
	var absoluteBaseURL = link.href


	if( trackingBackend === 'artoolkit' ){
		// pattern hiro/kanji/a/b/c/f
		var markersControlsParameters = [
			{
				type : 'pattern',
				patternUrl : absoluteBaseURL + 'examples/marker-training/examples/pattern-files/pattern-hiro.patt',
			},
			{
				type : 'pattern',
				patternUrl : absoluteBaseURL + 'examples/marker-training/examples/pattern-files/pattern-kanji.patt',
			},
			{
				type : 'pattern',
				patternUrl : absoluteBaseURL + 'examples/marker-training/examples/pattern-files/pattern-letterA.patt',
			},
			{
				type : 'pattern',
				patternUrl : absoluteBaseURL + 'examples/marker-training/examples/pattern-files/pattern-letterB.patt',
			},
			{
				type : 'pattern',
				patternUrl : absoluteBaseURL + 'examples/marker-training/examples/pattern-files/pattern-letterC.patt',
			},
			{
				type : 'pattern',
				patternUrl : absoluteBaseURL + 'examples/marker-training/examples/pattern-files/pattern-letterF.patt',
			},
		]		
	}else if( trackingBackend === 'aruco' ){
		var markersControlsParameters = [
			{
				type : 'barcode',
				barcodeValue: 1001,
			},
			{
				type : 'barcode',
				barcodeValue: 1002,
			},
			{
				type : 'barcode',
				barcodeValue: 1003,
			},
			{
				type : 'barcode',
				barcodeValue: 1004,
			},
			{
				type : 'barcode',
				barcodeValue: 1005,
			},
			{
				type : 'barcode',
				barcodeValue: 1006,
			},
		]
	}else console.assert(false)
	return markersControlsParameters
}


//////////////////////////////////////////////////////////////////////////////
//		Code Separator
//////////////////////////////////////////////////////////////////////////////
/**
 * generate areaFile
 */
ARjs.MarkersAreaUtils.storeMarkersAreaFileFromResolution = function (trackingBackend, resolutionW, resolutionH) {
	// generate areaFile
	var areaFile = this.buildMarkersAreaFileFromResolution(trackingBackend, resolutionW, resolutionH)
	// store areaFile in localStorage
	localStorage.setItem('ARjsMultiMarkerFile', JSON.stringify(areaFile))
}


//////////////////////////////////////////////////////////////////////////////
//		Code Separator
//////////////////////////////////////////////////////////////////////////////
	
ARjs.MarkersAreaUtils.buildMarkersAreaFileFromResolution = function(trackingBackend, resolutionW, resolutionH){
	// create the base file
	var file = {
		meta : {
			createdBy : 'AR.js - Augmented Website',
			createdAt : new Date().toJSON(),
		},
		trackingBackend : trackingBackend,
		subMarkersControls : [
			// empty for now...
		]
	}
	
	var whiteMargin = 0.1
	if( resolutionW > resolutionH ){
		var markerImageSize = 0.4 * resolutionH
	}else if( resolutionW < resolutionH ){
		var markerImageSize = 0.4 * resolutionW
	}else if( resolutionW === resolutionH ){
		// specific for twitter player - https://dev.twitter.com/cards/types/player
		var markerImageSize = 0.33 * resolutionW
	}else console.assert(false)

	// console.warn('using new markerImageSize computation')
	var actualMarkerSize = markerImageSize * (1 - 2*whiteMargin)
	
	var deltaX = (resolutionW - markerImageSize)/2 / actualMarkerSize
	var deltaZ = (resolutionH - markerImageSize)/2 / actualMarkerSize

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
		console.log('buildSubMarkerControls', layout, positionX, positionZ)
		// create subMarkersControls
		var subMarkersControls = {
			parameters: {},
			poseMatrix: new THREE.Matrix4().makeTranslation(positionX,0, positionZ).toArray(),
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
		// create absoluteBaseURL
		var link = document.createElement('a')
		link.href = ARjs.Context.baseURL
		var absoluteBaseURL = link.href
			
		var layout2PatternUrl = {
			'center' : convertRelativeUrlToAbsolute(absoluteBaseURL + 'examples/marker-training/examples/pattern-files/pattern-hiro.patt'),
			'topleft' : convertRelativeUrlToAbsolute(absoluteBaseURL + 'examples/marker-training/examples/pattern-files/pattern-letterA.patt'),
			'topright' : convertRelativeUrlToAbsolute(absoluteBaseURL + 'examples/marker-training/examples/pattern-files/pattern-letterB.patt'),
			'bottomleft' : convertRelativeUrlToAbsolute(absoluteBaseURL + 'examples/marker-training/examples/pattern-files/pattern-letterC.patt'),
			'bottomright' : convertRelativeUrlToAbsolute(absoluteBaseURL + 'examples/marker-training/examples/pattern-files/pattern-letterF.patt'),
		}
		console.assert(layout2PatternUrl[layout] !== undefined )
		parameters.type = 'pattern'
		parameters.patternUrl = layout2PatternUrl[layout]
		return
		function convertRelativeUrlToAbsolute(relativeUrl){
			var tmpLink = document.createElement('a');
			tmpLink.href = relativeUrl
			return tmpLink.href
		}
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
