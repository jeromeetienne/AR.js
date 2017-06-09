self.importScripts('../../js-aruco/vendor/js-aruco/src/cv.js')

var greyCVImage = new CV.Image()
var thresCVImage = new CV.Image()

function convert2Grayscale(imageBuffer, imageW, imageH){
	var imageArray = new Uint8Array(imageBuffer)

	for(var i = 0; i < imageArray.byteLength; i+=4){
		imageArray[i] = (imageArray[i] * 0.299 + imageArray[i + 1] * 0.587 + imageArray[i + 2] * 0.114 + 0.5) & 0xff;

		imageArray[i+1] = imageArray[i+2] = imageArray[i];
		imageArray[i+3] = 255;
	}
}


function convert2GrayscaleZone(imageBuffer, imageW, imageH, originX, originY, width, height){
	var imageArray = new Uint8Array(imageBuffer)
	for(var y = originY; y < originY+height; y++){
		for(var x = originX; x < originX+width; x++){
			var i = (y * imageW + x)*4
			imageArray[i] = (imageArray[i] * 0.299 + imageArray[i + 1] * 0.587 + imageArray[i + 2] * 0.114 + 0.5) & 0xff;
			// imageArray[i] = (255-imageArray[i]);

			imageArray[i+1] = imageArray[i+2] = imageArray[i];
			imageArray[i+3] = 255;
		}		
	}
}


self.addEventListener('message', function(event){
	// console.log('inworker: processing started!')

	var data = event.data;
	convert2GrayscaleZone(data.imageBuffer, data.imageW, data.imageH, data.originX, data.originY, data.width, data.height)

	// console.log('inworker: processing done!')
	self.postMessage('completed')
})
