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

function arAppURLUpdatePage(url){
	// Update url in the webpage
	document.body.querySelector('#arAppURLView').value = url
	document.body.querySelector('#arAppURLLink').href = url

	// prepare emailURLtoMeLink
	var mailBody = `DO NOT forget the change the recipient email address before sending it :)
	
	The AR.js App is at ${url}
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
	                text: url,
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
	
	;(function(){
		var urlOptions = {
			trackingBackend: 'artoolkit',
			markerPageResolution: window.innerWidth + 'x' + window.innerHeight,
			firebasePeerID: (typeof(firebasePeerID) !== 'undefined' && firebasePeerID !== null) ? firebasePeerID : undefined,
			arAppURL: 'https://jeromeetienne.github.io/webar-playground/'
		}
		var url = 'app/' + '#' + encodeURIComponent(JSON.stringify(urlOptions));
		document.querySelector('#webARPlaygroundLink').href = url
	})()
	
	
	//////////////////////////////////////////////////////////////////////////////
	//		build urlOptions
	//////////////////////////////////////////////////////////////////////////////
	// build urlOptions
	var urlOptions = {
		trackingBackend: 'artoolkit',
		markerPageResolution: window.innerWidth + 'x' + window.innerHeight,
		firebasePeerID: (typeof(firebasePeerID) !== 'undefined' && firebasePeerID !== null) ? firebasePeerID : undefined,
	}

	// if( typeof(firebasePeerID) !== 'undefined' && firebasePeerID !== null ){
	// 	urlOptions.firebasePeerID = firebasePeerID
	// }
	// 
	// build arAppURL
	if( location.search.substring(1) ){
		urlOptions.arAppURL = location.search.substring(1)
	}else{
		// build url
		// FIXME pass from relative to absolute url in a better way
		// urlOptions.arAppURL = location.protocol + '//' + location.host + location.pathname.replace(/[^\/]*$/, '') + '../vendor/ar.js/three.js/examples/augmented-website/examples/screenAsPortal/index.html'		
		urlOptions.arAppURL = location.protocol + '//' + location.host + location.pathname.replace(/[^\/]*$/, '') + '../screenAsPortal/index.html'		
	}

	//////////////////////////////////////////////////////////////////////////////
	//		build url and update page
	//////////////////////////////////////////////////////////////////////////////

	// build nextUrl
	var tmpLink = document.createElement('a');
	tmpLink.href = 'app/' + '#' + encodeURIComponent(JSON.stringify(urlOptions));
	// tmpLink.href = '../vendor/ar.js/three.js/examples/augmented-website/app/' + '#' + encodeURIComponent(JSON.stringify(urlOptions));
	var nextUrl = tmpLink.href

	// Should this url be shortened
	var shouldShortenUrl = true
	
	// if localhost, then goo.gl refuse to minimise
	var linkElement = document.createElement('a')
	linkElement.href = nextUrl
	if( linkElement.hostname === '127.0.0.1' || linkElement.hostname === 'localhost' ){
		shouldShortenUrl = false
	}

	// is goo.gl available ?
	if( typeof(gapi) === 'undefined' || gapi.client === undefined || gapi.client.urlshortener === undefined ){
		shouldShortenUrl = false
	}
	
	
	if( shouldShortenUrl === false ){
		arAppURLUpdatePage(nextUrl)
	}else{
		googlMinify(nextUrl, function(shortURL){
			arAppURLUpdatePage(shortURL)
		})
	}
}
