var THREEx = THREEx || {}

THREEx.ArucoDebug = function(arucoContext){
	this.arucoContext = arucoContext

// TODO to rename canvasElement into canvas
	this.canvasElement = document.createElement('canvas');
	this.canvasElement.width = this.arucoContext.canvas.width
	this.canvasElement.height = this.arucoContext.canvas.height
}

THREEx.ArucoDebug.prototype.setSize = function (width, height) {
        if( this.canvasElement.width !== width )	this.canvasElement.width = width
        if( this.canvasElement.height !== height )	this.canvasElement.height = height
}


THREEx.ArucoDebug.prototype.clear = function(){
	var canvas = this.canvasElement
	var context = canvas.getContext('2d');
	context.clearRect(0,0,canvas.width, canvas.height)
	
}
	
THREEx.ArucoDebug.prototype.drawContoursContours = function(){
	var contours = this.arucoContext.detector.contours
	var canvas = this.canvasElement
	this.drawContours(contours, 0, 0, canvas.width, canvas.height, function(hole){
		return hole? "magenta": "blue"
	})
}

THREEx.ArucoDebug.prototype.drawContoursPolys = function(){
	var contours = this.arucoContext.detector.polys
	var canvas = this.canvasElement
	this.drawContours(contours, 0, 0, canvas.width, canvas.height, function(){
		return 'green'
	})
}


THREEx.ArucoDebug.prototype.drawContoursCandidates = function(){
	var contours = this.arucoContext.detector.candidates
	var canvas = this.canvasElement
	this.drawContours(contours, 0, 0, canvas.width, canvas.height, function(){
		return 'red'
	})
}

THREEx.ArucoDebug.prototype.drawContours = function(contours, x, y, width, height, fn){
	var i = contours.length, j, contour, point;
	var canvas = this.canvasElement
	var context = canvas.getContext('2d');
	
	context.save();
	while(i --){
		contour = contours[i];
		context.strokeStyle = fn(contour.hole);
		context.beginPath();
		for (j = 0; j < contour.length; ++ j){
			point = contour[j];
			context.moveTo(x + point.x, y + point.y);
			point = contour[(j + 1) % contour.length];
			context.lineTo(x + point.x, y + point.y);
		}
		
		context.stroke();
		context.closePath();
	}
	context.restore();
}

//////////////////////////////////////////////////////////////////////////////
//		Code Separator
//////////////////////////////////////////////////////////////////////////////    

THREEx.ArucoDebug.prototype.drawDetectorGrey = function(){
	var cvImage = arucoContext.detector.grey
        this.drawCVImage( cvImage )
}

THREEx.ArucoDebug.prototype.drawDetectorThreshold = function(){
	var cvImage = arucoContext.detector.thres
        this.drawCVImage( cvImage )
}

//////////////////////////////////////////////////////////////////////////////
//		Code Separator
//////////////////////////////////////////////////////////////////////////////
THREEx.ArucoDebug.prototype.drawCVImage = function(cvImage){
	var detector = this.arucoContext.detector

	var canvas = this.canvasElement
	var context = canvas.getContext('2d');

	var imageData = context.createImageData(canvas.width, canvas.height);
	this.copyCVImage2ImageData(cvImage, imageData)
	context.putImageData( imageData, 0, 0);
}


THREEx.ArucoDebug.prototype.copyCVImage2ImageData = function(cvImage, imageData){
	var i = cvImage.data.length, j = (i * 4) + 3;
	
	while(i --){
		imageData.data[j -= 4] = 255;
		imageData.data[j - 1] = imageData.data[j - 2] = imageData.data[j - 3] = cvImage.data[i];
	}
	
	return imageData;
};

//////////////////////////////////////////////////////////////////////////////
//		Code Separator
//////////////////////////////////////////////////////////////////////////////
THREEx.ArucoDebug.prototype.drawVideo = function(videoElement){
	var canvas = this.canvasElement
	var context = canvas.getContext('2d');
	context.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
}

//////////////////////////////////////////////////////////////////////////////
//		Code Separator
//////////////////////////////////////////////////////////////////////////////
THREEx.ArucoDebug.prototype.drawMarkerIDs = function(markers){
	var canvas = this.canvasElement
	var context = canvas.getContext('2d');
	var corners, corner, x, y, i, j;
	
	context.save();
	context.strokeStyle = "blue";
	context.lineWidth = 1;
	
	for (i = 0; i !== markers.length; ++ i){
		corners = markers[i].corners;
		
		x = Infinity;
		y = Infinity;
		
		for (j = 0; j !== corners.length; ++ j){
			corner = corners[j];
			
			x = Math.min(x, corner.x);
			y = Math.min(y, corner.y);
		}
		context.strokeText(markers[i].id, x, y)
	}
	context.restore();
}

//////////////////////////////////////////////////////////////////////////////
//		Code Separator
//////////////////////////////////////////////////////////////////////////////
THREEx.ArucoDebug.prototype.drawMarkerCorners = function(markers){
	var canvas = this.canvasElement
        var corners, corner, i, j;
        var context = canvas.getContext('2d');
	context.save();
        context.lineWidth = 3;
        
        for (i = 0; i < markers.length; ++ i){
                corners = markers[i].corners;
                
                context.strokeStyle = 'red';
                context.beginPath();
                
                for (j = 0; j < corners.length; ++ j){
                        corner = corners[j];
                        context.moveTo(corner.x, corner.y);
                        corner = corners[(j + 1) % corners.length];
                        context.lineTo(corner.x, corner.y);
                }
                
                context.stroke();
                context.closePath();
                
                context.strokeStyle = 'green';
                context.strokeRect(corners[0].x - 2, corners[0].y - 2, 4, 4);
        }
	context.restore();

}
