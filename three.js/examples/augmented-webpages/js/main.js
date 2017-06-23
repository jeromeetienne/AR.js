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



function displayResolution(){
	var resolution = window.innerWidth + 'x' + window.innerHeight
	alert('resolution is ' + resolution)
}

markersPageInit()
fullscreenInit()
