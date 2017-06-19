var THREEx = THREEx || {}

THREEx.ArucoMarkerGenerator = function(){
	
}

//////////////////////////////////////////////////////////////////////////////
//		Code Separator
//////////////////////////////////////////////////////////////////////////////
THREEx.ArucoMarkerGenerator.createSVG = function(markerId, svgSize){
	var domElement = document.createElement('div');
	domElement.innerHTML = new ArucoMarker(markerId).toSVG(svgSize);	
	return domElement
}

THREEx.ArucoMarkerGenerator.createImage = function(markerId, width){
	// create canvas
	var canvas = this.createCanvas(markerId, width)
	var imageURL = canvas.toDataURL()

	// create imageElement
	var imageElement = document.createElement('img');
	imageElement.src = imageURL

	// return imageElement
	return imageElement;
}

//////////////////////////////////////////////////////////////////////////////
//		Code Separator
//////////////////////////////////////////////////////////////////////////////
THREEx.ArucoMarkerGenerator.createCanvas = function(markerId, width){
	var canvas = document.createElement('canvas');
	var context = canvas.getContext('2d')
	canvas.width = width
	canvas.height = width

	var arucoMarker = new ArucoMarker(markerId)
	var marker = arucoMarker.markerMatrix()
	
	var margin = canvas.width*0.1
	var innerW = width-margin*2
	var squareW = innerW/7
	
	context.fillStyle = 'white'
	context.fillRect(0, 0, canvas.width, canvas.height)
	context.fillStyle = 'black'
	context.fillRect(margin, margin, canvas.width-margin*2, canvas.height-margin*2)

	for(var y = 0; y < 5; y++){
		for(var x = 0; x < 5; x++){
			if (marker[x][y] !== 1) continue
			context.fillStyle = 'white'
			context.fillRect(margin+(x+1)*squareW, margin+(y+1)*squareW, squareW+1, squareW+1)
		}
	}
	
	return canvas
}
