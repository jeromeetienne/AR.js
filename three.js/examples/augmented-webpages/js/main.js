// goto the proper landing page depending on where you run
var isMobile = 'ontouchstart' in window === true ? true : false
// document.querySelector('#currentPlatform').innerHTML = isMobile ? 'mobile' : 'desktop'

// infoDialog and infoDialog
document.querySelector('#infoButton').addEventListener('click', function(){
	document.querySelector('#infoDialog').showModal()
})
document.querySelector('#infoDialog button').addEventListener('click', function(){
	document.querySelector('#infoDialog').close()
})

// helpDialog and helpDialog
document.querySelector('#helpButton').addEventListener('click', function(){
	document.querySelector('#helpDialog').showModal()
})
document.querySelector('#helpDialog button').addEventListener('click', function(){
	document.querySelector('#helpDialog').close()
})

//////////////////////////////////////////////////////////////////////////////
//		arAppURL
//////////////////////////////////////////////////////////////////////////////
var arAppURL = null
function updateArAppURL(){
	// build arAppURL
	if( location.hash.substring(1) ){
		arAppURL = location.hash.substring(1)
	}else{
		// build url
		// FIXME pass from relative to absolute url in a better way
		arAppURL = location.protocol + '//' + location.host + location.pathname.replace(/[^\/]*$/, '') + 'examples/screenAsPortal/index.html'		
	}
	// add options in arAppURL
	arAppURL = arAppURL + '#' + JSON.stringify({
		trackingBackend: 'artoolkit',
		markerPageResolution: window.innerWidth + 'x' + window.innerHeight,
		// markerPageResolution: 1024 + 'x' + 653,
	})

	// Update arAppURL in the webpage
	document.body.querySelector('#arAppURLView').value = arAppURL
	document.body.querySelector('#arAppURLLink').href = arAppURL	

	// prepare emailURLtoMeLink
	var mailBody = `DO NOT forget the change the recipient email address before sending it :)
	
	The AR.js App is at ${arAppURL}
	`
	var mailtoUrl = 'mailto:your-goes-here-name@example.com?subject=Augmented%20Webpages%20URL&body='+encodeURIComponent(mailBody)
	document.body.querySelector('#emailURLtoMeLink').href = mailtoUrl

	// create qrCode
	;(function(){
	        var container = document.createElement('div')
	        var qrcode = new QRCode(container, {
	                text: arAppURL,
	                width: 256,
	                height: 256,
	                colorDark : '#000000',
	                colorLight : '#ffffff',
	        });
	        var qrCodeImage = container.querySelector('img')
		qrCodeImage.style.width='100%'
		var containerElement = document.body.querySelector('#qrCodeContainer')
		while (containerElement.firstChild){
			containerElement.removeChild(containerElement.firstChild);
		}
		containerElement.appendChild(qrCodeImage)				
	})()
}
updateArAppURL()

window.addEventListener('resize', function(){
	updateArAppURL()
})



//////////////////////////////////////////////////////////////////////////////
//		toggleFullScreen
//////////////////////////////////////////////////////////////////////////////
// from https://stackoverflow.com/questions/21280966/toggle-fullscreen-exit
function setFullScreen(enabled) {
	if ( enabled === true ){
		if (document.documentElement.requestFullscreen) {
			document.documentElement.requestFullscreen();
		} else if (document.documentElement.msRequestFullscreen) {
			document.documentElement.msRequestFullscreen();
		} else if (document.documentElement.mozRequestFullScreen) {
			document.documentElement.mozRequestFullScreen();
		} else if (document.documentElement.webkitRequestFullscreen) {
			document.documentElement.webkitRequestFullscreen(Element.ALLOW_KEYBOARD_INPUT);
		}
	}else if ( enabled === false){
		if (document.exitFullscreen) {
			document.exitFullscreen();
		} else if (document.msExitFullscreen) {
			document.msExitFullscreen();
		} else if (document.mozCancelFullScreen) {
			document.mozCancelFullScreen();
		} else if (document.webkitExitFullscreen) {
			document.webkitExitFullscreen();
		}
	}else console.assert(false)
}

document.addEventListener("webkitfullscreenchange", function( event ) {
	if( isFullscreen() === true ){
		markerPageEnter()
	}else{
		markerPageLeave()
	}
})


function isFullscreen(){
	return document.webkitIsFullScreen
}


//////////////////////////////////////////////////////////////////////////////
//		markerPage
//////////////////////////////////////////////////////////////////////////////

function markerPageEnter(){
	// if( isFullscreen() === false )	setFullScreen(true)		
	setMarkerPageVisibility(true)
}

function markerPageLeave(){
	// if( isFullscreen() === true )	setFullScreen(false)		
	setMarkerPageVisibility(false)
}

function setMarkerPageVisibility(visible){
	if( visible === true ){
		document.querySelector('#markers-page').style.display = 'block'
		document.querySelector('.mdl-layout__container').style.display = 'none'
	}else if( visible === false ){
		document.querySelector('#markers-page').style.display = 'none'
		document.querySelector('.mdl-layout__container').style.display = 'block'
	}else console.assert(false)
}

document.body.addEventListener('keydown', function(event){
	if( event.code !== 'Space' )	return
	markerPageEnter()
})

document.body.addEventListener('keydown', function(event){
	if( event.code !== 'Backspace' )	return
	markerPageLeave()
})

//////////////////////////////////////////////////////////////////////////////
//		markerPage brightness/contrast
//////////////////////////////////////////////////////////////////////////////
var markerPageBrightness = 0
var markerPageOpacity = 0.2
markerPageUpdateBrightnessOpacity()
function markerPageUpdateBrightnessOpacity(){
	// normalize values
	markerPageBrightness = Math.max(0, Math.min(1, markerPageBrightness))
	markerPageOpacity = Math.max(0, Math.min(1, markerPageOpacity))
	
	// update css
	var domElement = document.querySelector('#markers-page .filter')
	var colorRgba = 'rgba(' + Math.round(markerPageBrightness * 255)
			+ ', ' + Math.round(markerPageBrightness * 255)
			+ ', ' + Math.round(markerPageBrightness * 255)
			+ ', ' + (1-markerPageOpacity)
			+ ')'
	domElement.style.backgroundColor = colorRgba
	// debugger
	console.log('colorRgba', colorRgba)

	// update views1
	document.querySelector('#markers-page .currentBrightness').innerHTML = markerPageBrightness.toFixed(3)
	document.querySelector('#markers-page .currentOpacity').innerHTML = markerPageOpacity.toFixed(3)	
}

document.body.addEventListener('keydown', function(event){
	if( event.code === 'ArrowLeft' ){
		markerPageBrightness -= 0.025
	}else if( event.code === 'ArrowRight' ){
		markerPageBrightness += 0.025
	}else if( event.code === 'ArrowUp' ){
		markerPageOpacity += 0.025
	}else if( event.code === 'ArrowDown' ){
		markerPageOpacity -= 0.025		
	}else{
		return
	}
	
	markerPageUpdateBrightnessOpacity()
})


//////////////////////////////////////////////////////////////////////////////
//		markerPageSetTrackingBackend
//////////////////////////////////////////////////////////////////////////////
markerPageSetTrackingBackend('artoolkit')	
function markerPageSetTrackingBackend(trackingBackend){
	// trackingBackend feedback
	document.querySelector('#currentTracking').innerHTML = trackingBackend
	// remove previous classes
	document.body.classList.remove('trackingBackend-artoolkit')			
	document.body.classList.remove('trackingBackend-aruco')
	// set the proper class
	if( trackingBackend === 'artoolkit' ){
		document.body.classList.add('trackingBackend-artoolkit')
	}else if( trackingBackend === 'aruco' ){
		document.body.classList.add('trackingBackend-aruco')			
	}else console.assert(false)
}

function displayResolution(){
	var resolution = window.innerWidth + 'x' + window.innerHeight
	alert('resolution is ' + resolution)
}
