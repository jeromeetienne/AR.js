//////////////////////////////////////////////////////////////////////////////
//		arAppURL
//////////////////////////////////////////////////////////////////////////////
function arAppURLInit(){

	updateArAppURL()

	window.addEventListener('resize', function(){
		updateArAppURL()
	})
	
	// select input on click - easier user experience
	document.querySelector("#arAppURLView").addEventListener('click', function() {
		this.select();
		document.execCommand('copy');
	})
}

function arAppURLUpdatePage(arAppURL){
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
		// if( arAppURL.length > 190 ){
		// 	console.log('arAppURL too long. cant be encoded in qrCode')
		// 	return			
		// }
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

function updateArAppURL(){
	// build urlOptions
	var urlOptions = {
		trackingBackend: 'artoolkit',
		markerPageResolution: window.innerWidth + 'x' + window.innerHeight,
	}
	if( typeof(firebasePeerID) !== 'undefined' && firebasePeerID !== null ){
		urlOptions.firebasePeerID = firebasePeerID
	}
	// if( typeof(peerjsPeer) !== 'undefined' && peerjsPeer !== null && peerjsPeer.id !== undefined ){
	// 	urlOptions.peerjsPeerID = peerjsPeer.id
	// }
	// build arAppURL
	if( location.hash.substring(1) ){
		var arAppURL = location.hash.substring(1)
	}else{
		// build url
		// FIXME pass from relative to absolute url in a better way
		arAppURL = location.protocol + '//' + location.host + location.pathname.replace(/[^\/]*$/, '') + 'examples/screenAsPortal/index.html'		
	}
	// add options in arAppURL
	arAppURL = arAppURL + '?' + encodeURIComponent(JSON.stringify(urlOptions))

	// arAppURL = 'https://github.com/jeromeetienne/ar.js'

	var shouldShortenUrl = true
	

	var linkElement = document.createElement('a')
	linkElement.href = arAppURL

	// if localhost, then goo.gl refuse to minimise
	if( linkElement.hostname === '127.0.0.1' || linkElement.hostname === 'localhost' ){
		shouldShortenUrl = false
	}

	// is goo.gl available ?
	if( typeof(gapi) === 'undefined' || gapi.client === undefined || gapi.client.urlshortener === undefined ){
		shouldShortenUrl = false
	}
	
	if( shouldShortenUrl === false ){
		arAppURLUpdatePage(arAppURL)
	}else{
		googlMinify(arAppURL, function(shortURL){
			arAppURLUpdatePage(shortURL)
		})
	}
}
