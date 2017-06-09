self.addEventListener('message', function(event) {
	console.log('inWorker: received event', event)
	var sharedArrayBuffer = event.data
	var imageArray = new Uint8Array(sharedArrayBuffer.data)
	console.log('starting working', sharedArrayBuffer.byteLength)
	// debugger
	// for(var i = 0; i < imageArray.byteLength; i+=4){
	// 	imageArray[i] = 255 - imageArray[i]
	// 	console.log('value', imageArray[i])
	// 	imageArray[i+1] = 255 - imageArray[i+1]
	// 	imageArray[i+2] = 255 - imageArray[i+2]
	// 	imageArray[i+3] = 255
	// }

	console.log('stop working', imageArray)

	setTimeout(function(){
		
		self.postMessage('completed')
	}, 1000)
	
}, false);

self.postMessage('started')
