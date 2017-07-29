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
	location.href = learnerBaseURL + '#' + JSON.stringify(learnerParameters)
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
			createdBy : "AR.js Default Marker "+ARjs.Context.REVISION,
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
