var THREEx = THREEx || {}

THREEx.ArucoMarkerGenerator = function(){
	
}

THREEx.ArucoMarkerGenerator.createSVG = function(markerId, svgSize){
	var domElement = document.createElement('div');
	domElement.innerHTML = new ArucoMarker(markerId).toSVG(svgSize);	
	return domElement
}

THREEx.ArucoMarkerGenerator.createIMG = function(markerId, svgSize){
	// get the svgElement
	var svgElement = THREEx.ArucoMarkerGenerator.createSVG(markerId, svgSize).firstChild

	// build imageURL
	var xml = new XMLSerializer().serializeToString(svgElement);
	var imageURL = 'data:image/svg+xml;base64,' + btoa(xml)

	// create imageElement
	var imageElement = document.createElement('img');
	imageElement.src = imageURL

	// return imageElement
	return imageElement;
}
