function googlInit(){
	
	var timerId = setInterval(function(){
		if( gapi.client === undefined )	return
		clearInterval(timerId)
		timerId = null

		gapi.client.setApiKey('AIzaSyDehQAfFZ9COHDLsvg8tIv7m4I4ySIc0e4');
		gapi.client.load('urlshortener', 'v1', function() { 
			console.log('urlshortener loaded')
			// TODO do a callback here 
			updateArAppURL()
		})
	}, 1000/10)
	
}

function googlMinify(longURL, onComplete){
	var request = gapi.client.urlshortener.url.insert({
		'resource': {
			'longUrl': longURL
		}
	});
	request.execute(function(response) {
		var shortURL = response.id
		if (response.id != null) {
			onComplete(shortURL)
		}else{
			onComplete(longURL)
			console.error("Error: creating short url", response.error);
		}
	});
}
