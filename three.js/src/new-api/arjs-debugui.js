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
	this.domElement.style.color = 'rgba(0,0,0,0.9)'
	this.domElement.style.backgroundColor = 'rgba(127,127,127,0.5)'
	this.domElement.style.display = 'inline-block'
	this.domElement.style.padding = '0.5em'
	this.domElement.style.margin = '0.5em'
	this.domElement.style.textAlign = 'left'

	//////////////////////////////////////////////////////////////////////////////
	//		add title
	//////////////////////////////////////////////////////////////////////////////
	// var domElement = document.createElement('div')
	// domElement.style.display = 'block'
	// domElement.style.fontWeight = 'bold'
	// domElement.style.fontSize = '120%'
	// this.domElement.appendChild(domElement)
	// domElement.innerHTML = 'AR.js Session Debug'

	//////////////////////////////////////////////////////////////////////////////
	//		current-tracking-backend
	//////////////////////////////////////////////////////////////////////////////

	var domElement = document.createElement('span')
	domElement.style.display = 'block'
	this.domElement.appendChild(domElement)
	domElement.innerHTML = '<b>trackingBackend</b> : ' +trackingBackend
	
	//////////////////////////////////////////////////////////////////////////////
	//		augmented-websites
	//////////////////////////////////////////////////////////////////////////////
	var domElement = document.createElement('a')
	domElement.innerHTML = 'Share on augmented-websites'
	domElement.style.display = 'block'
	domElement.setAttribute('target', '_blank')
	domElement.href = 'https://webxr.io/augmented-website?'+location.href
	this.domElement.appendChild(domElement)				

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
	this.domElement.style.color = 'rgba(0,0,0,0.9)'
	this.domElement.style.backgroundColor = 'rgba(127,127,127,0.5)'
	this.domElement.style.display = 'inline-block'
	this.domElement.style.padding = '0.5em'
	this.domElement.style.margin = '0.5em'
	this.domElement.style.textAlign = 'left'

	//////////////////////////////////////////////////////////////////////////////
	//		add title
	//////////////////////////////////////////////////////////////////////////////

	// var domElement = document.createElement('div')
	// domElement.style.display = 'block'
	// domElement.style.fontWeight = 'bold'
	// domElement.style.fontSize = '120%'
	// this.domElement.appendChild(domElement)
	// domElement.innerHTML = 'Anchor Marker Debug'

	//////////////////////////////////////////////////////////////////////////////
	//		current-tracking-backend
	//////////////////////////////////////////////////////////////////////////////

	var domElement = document.createElement('span')
	domElement.style.display = 'block'
	this.domElement.appendChild(domElement)
	domElement.innerHTML = '<b>markersAreaEnabled</b> :' +arAnchor.parameters.markersAreaEnabled

	//////////////////////////////////////////////////////////////////////////////
	//		toggle-marker-helper
	//////////////////////////////////////////////////////////////////////////////

	if( arAnchor.parameters.markersAreaEnabled ){
		var domElement = document.createElement('button')
		domElement.style.display = 'block'
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
		domElement.style.display = 'block'
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
		domElement.style.display = 'block'
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
