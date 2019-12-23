// @namespace
var ARjs = ARjs || {}

/**
 * Create an debug UI for an ARjs.Anchor
 *
 * @param {ARjs.Anchor} arAnchor - the anchor to user
 */
ARjs.SessionDebugUI = function (arSession) {
    var trackingBackend = arSession.arContext.parameters.trackingBackend

    this.domElement = document.createElement('div')
    this.domElement.style.color = 'rgba(0,0,0,0.9)'
    this.domElement.style.backgroundColor = 'rgba(127,127,127,0.5)'
    this.domElement.style.display = 'block'
    this.domElement.style.padding = '0.5em'
    this.domElement.style.position = 'fixed'
    this.domElement.style.left = '5px'
    this.domElement.style.bottom = '10px'
    this.domElement.style.textAlign = 'right'

    //////////////////////////////////////////////////////////////////////////////
    //		current-tracking-backend
    //////////////////////////////////////////////////////////////////////////////

    var domElement = document.createElement('span')
    domElement.style.display = 'block'
    domElement.innerHTML = '<b>trackingBackend</b> : ' + trackingBackend
    this.domElement.appendChild(domElement)
}

/**
 * Url of augmented-website service - if === '' then dont include augmented-website link
 * @type {String}
 */
ARjs.SessionDebugUI.AugmentedWebsiteURL = 'https://webxr.io/augmented-website'

//////////////////////////////////////////////////////////////////////////////
//		ARjs.AnchorDebugUI
//////////////////////////////////////////////////////////////////////////////

/**
 * Create an debug UI for an ARjs.Anchor
 *
 * @param {ARjs.Anchor} arAnchor - the anchor to user
 */
ARjs.AnchorDebugUI = function (arAnchor) {
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
    //		current-tracking-backend
    //////////////////////////////////////////////////////////////////////////////

    var domElement = document.createElement('span')
    domElement.style.display = 'block'
    domElement.style.padding = '0.5em'
    domElement.style.color = 'rgba(0,0,0,0.9)'
    domElement.style.backgroundColor = 'rgba(127,127,127,0.5)'
    domElement.style.position = 'fixed'
    domElement.style.left = '5px'
    domElement.style.bottom = '40px'

    this.domElement.appendChild(domElement)
    domElement.innerHTML = '<b>markersAreaEnabled</b> :' + arAnchor.parameters.markersAreaEnabled

    //////////////////////////////////////////////////////////////////////////////
    //		toggle-marker-helper
    //////////////////////////////////////////////////////////////////////////////

    if (arAnchor.parameters.markersAreaEnabled) {
        var domElement = document.createElement('button')
        domElement.style.display = 'block'
        this.domElement.style.padding = '0.5em'
        this.domElement.style.position = 'fixed'
        this.domElement.style.textAlign = 'left'
        this.domElement.appendChild(domElement)

        domElement.id = 'buttonToggleMarkerHelpers'
        domElement.innerHTML = 'toggle-marker-helper'
        domElement.href = 'javascript:void(0)'

        var subMarkerHelpersVisible = false
        domElement.addEventListener('click', function () {
            subMarkerHelpersVisible = subMarkerHelpersVisible ? false : true
            arAnchor.markersArea.setSubMarkersVisibility(subMarkerHelpersVisible)
        })
    }

    //////////////////////////////////////////////////////////////////////////////
    //		Learn-new-marker-area
    //////////////////////////////////////////////////////////////////////////////

    if (arAnchor.parameters.markersAreaEnabled) {
        var domElement = document.createElement('button')
        domElement.style.display = 'block'
        this.domElement.appendChild(domElement)

        domElement.id = 'buttonMarkersAreaLearner'
        domElement.innerHTML = 'Learn-new-marker-area'
        domElement.href = 'javascript:void(0)'

        domElement.addEventListener('click', function () {
            if (ARjs.AnchorDebugUI.MarkersAreaLearnerURL !== null) {
                var learnerURL = ARjs.AnchorDebugUI.MarkersAreaLearnerURL
            } else {
                var learnerURL = ARjs.Context.baseURL + 'examples/multi-markers/examples/learner.html'
            }
            ARjs.MarkersAreaUtils.navigateToLearnerPage(learnerURL, trackingBackend)
        })
    }

    //////////////////////////////////////////////////////////////////////////////
    //		Reset-marker-area
    //////////////////////////////////////////////////////////////////////////////

    if (arAnchor.parameters.markersAreaEnabled) {
        var domElement = document.createElement('button')
        domElement.style.display = 'block'
        this.domElement.appendChild(domElement)

        domElement.id = 'buttonMarkersAreaReset'
        domElement.innerHTML = 'Reset-marker-area'
        domElement.href = 'javascript:void(0)'

        domElement.addEventListener('click', function () {
            ARjs.MarkersAreaUtils.storeDefaultMultiMarkerFile(trackingBackend)
            location.reload()
        })
    }
}

/**
 * url for the markers-area learner. if not set, take the default one
 * @type {String}
 */
ARjs.AnchorDebugUI.MarkersAreaLearnerURL = null
