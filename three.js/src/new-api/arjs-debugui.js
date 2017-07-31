// @namespace
var ARjs = ARjs || {}

/**
 * Create an debug UI for an ARjs.Anchor
 * 
 * @param {ARjs.Anchor} arAnchor - the anchor to user
 */
ARjs.SessionDebugUI = function(arSession, tangoPointCloud){
	var trackingBackend = arSession.arContext.parameters.trackingBackend

	this.domElement = document.createElement('div')

	//////////////////////////////////////////////////////////////////////////////
	//		current-tracking-backend
	//////////////////////////////////////////////////////////////////////////////

	var domElement = document.createElement('span')
	this.domElement.appendChild(domElement)
	domElement.innerHTML = 'trackingBackend :' +trackingBackend
	
	//////////////////////////////////////////////////////////////////////////////
	//		toggle-point-cloud
	//////////////////////////////////////////////////////////////////////////////

	if( trackingBackend === 'tango' && tangoPointCloud ){
		var domElement = document.createElement('button')
		this.domElement.appendChild(domElement)

		domElement.id= 'buttonTangoTogglePointCloud'
		domElement.innerHTML = 'toggle-point-cloud'
		domElement.href='javascript:void(0)'

		domElement.addEventListener('click', function(){
			var scene = arSession.parameters.scene
	// TODO how tangoPointCloud, get connected here ???
	// in arguments simply ?
			if( tangoPointCloud.object3d.parent ){
				scene.remove(tangoPointCloud.object3d)
			}else{
				scene.add(tangoPointCloud.object3d)			
			}
		})
	}
}

//////////////////////////////////////////////////////////////////////////////
//		ARjs.AnchorDebugUI
//////////////////////////////////////////////////////////////////////////////

/**
 * Create an debug UI for an ARjs.Anchor
 * 
 * @param {ARjs.Anchor} arAnchor - the anchor to user
 */
ARjs.AnchorDebugUI = function(arAnchor){
	var _this = this 
	var arSession = arAnchor.arSession
	var trackingBackend = arSession.arContext.parameters.trackingBackend
	
	this.domElement = document.createElement('div')


	//////////////////////////////////////////////////////////////////////////////
	//		current-tracking-backend
	//////////////////////////////////////////////////////////////////////////////

	var domElement = document.createElement('span')
	this.domElement.appendChild(domElement)
	domElement.innerHTML = 'markersAreaEnabled :' +arAnchor.parameters.markersAreaEnabled

	//////////////////////////////////////////////////////////////////////////////
	//		toggle-marker-helper
	//////////////////////////////////////////////////////////////////////////////

	if( arAnchor.parameters.markersAreaEnabled ){
		var domElement = document.createElement('button')
		this.domElement.appendChild(domElement)

		domElement.id= 'buttonToggleMarkerHelpers'
		domElement.innerHTML = 'toggle-marker-helper'
		domElement.href='javascript:void(0)'

		var subMarkerHelpersVisible = false
		domElement.addEventListener('click', function(){
			subMarkerHelpersVisible = subMarkerHelpersVisible ? false : true
			arAnchor.markersArea.setSubMarkersVisibility(subMarkerHelpersVisible)		
		})
	}
	
	//////////////////////////////////////////////////////////////////////////////
	//		Learn-new-marker-area
	//////////////////////////////////////////////////////////////////////////////

	if( arAnchor.parameters.markersAreaEnabled ){
		var domElement = document.createElement('button')
		this.domElement.appendChild(domElement)
		domElement.id = 'buttonMarkersAreaLearner'
		domElement.innerHTML = 'Learn-new-marker-area'
		domElement.href ='javascript:void(0)'

		domElement.addEventListener('click', function(){
			var learnerBaseURL = ARjs.Context.baseURL + 'examples/multi-markers/examples/learner.html'
			ARjs.MarkersAreaUtils.navigateToLearnerPage(learnerBaseURL, trackingBackend)
		})	
	}

	//////////////////////////////////////////////////////////////////////////////
	//		Reset-marker-area
	//////////////////////////////////////////////////////////////////////////////

	if( arAnchor.parameters.markersAreaEnabled ){
		var domElement = document.createElement('button')
		this.domElement.appendChild(domElement)
		domElement.id = 'buttonMarkersAreaReset'
		domElement.innerHTML = 'Reset-marker-area'
		domElement.href ='javascript:void(0)'

		domElement.addEventListener('click', function(){
			ARjs.MarkersAreaUtils.storeDefaultMultiMarkerFile(trackingBackend)
			location.reload()
		})
	}
}
