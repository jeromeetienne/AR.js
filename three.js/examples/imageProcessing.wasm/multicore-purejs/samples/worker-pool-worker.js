self.addEventListener('message', function(imageBuffer){
	var imageArray = new Uint8Array(imageBuffer.data.imageBuffer);

	var oldValue = imageArray[0];
	console.log('inworker: waiting for value to differ from ' + oldValue)
	// while(imageArray[0] === oldValue) {}
	for(var i = 0; i < imageArray.byteLength; i+=4){
		imageArray[i] = 255 - imageArray[i];
		imageArray[i+3] = 255;
	}

	console.log('inworker: value updated!')
	self.postMessage('completed')
})
