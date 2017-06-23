//////////////////////////////////////////////////////////////////////////////
//		arAppURL
//////////////////////////////////////////////////////////////////////////////
var arAppURL = null

function arAppURLInit(){

	updateArAppURL()

	window.addEventListener('resize', function(){
		updateArAppURL()
	})
}


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
