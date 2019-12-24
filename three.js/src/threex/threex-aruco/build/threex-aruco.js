var THREEx = THREEx || {}

THREEx.ArucoContext = function(parameters){
	// handle default parameters
	parameters = parameters || {}
	this.parameters = {
		// debug - true if one should display artoolkit debug canvas, false otherwise
		debug: parameters.debug !== undefined ? parameters.debug : false,
		// resolution of at which we detect pose in the source image
		canvasWidth: parameters.canvasWidth !== undefined ? parameters.canvasWidth : 640,
		canvasHeight: parameters.canvasHeight !== undefined ? parameters.canvasHeight : 480,
	}


        this.canvas = document.createElement('canvas');
                
        this.detector = new AR.Detector()
        
        // setup THREEx.ArucoDebug if needed
        this.debug = null
        if( parameters.debug == true ){
                this.debug = new THREEx.ArucoDebug(this)
        }
	
	// honor parameters.canvasWidth/.canvasHeight
	this.setSize(this.parameters.canvasWidth, this.parameters.canvasHeight)
}

THREEx.ArucoContext.prototype.setSize = function (width, height) {
        this.canvas.width = width
        this.canvas.height = height
        if( this.debug !== null ){
                this.debug.setSize(width, height)
        }
}

THREEx.ArucoContext.prototype.detect = function (videoElement) {
	var _this = this
        var canvas = this.canvas
        
        // get imageData from videoElement
        var context = canvas.getContext('2d');
        context.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
        var imageData = context.getImageData(0, 0, canvas.width, canvas.height);
        
        // detect markers in imageData
        var detectedMarkers = this.detector.detect(imageData);
	return detectedMarkers
};

/**
 * crappy function to update a object3d with a detectedMarker - super crappy
 */
THREEx.ArucoContext.prototype.updateObject3D = function(object3D, arucoPosit, markerSize, detectedMarker){
        var markerCorners = detectedMarker.corners;
        var canvas = this.canvas

        // convert the corners
        var poseCorners = new Array(markerCorners.length)
        for (var i = 0; i < markerCorners.length; ++ i){
                var markerCorner = markerCorners[i];        
                poseCorners[i] = {
                        x:  markerCorner.x - (canvas.width / 2),
                        y: -markerCorner.y + (canvas.height/ 2)
                }
        }
        
        // estimate pose from corners
        var pose = arucoPosit.pose(poseCorners);


	var rotation    = pose.bestRotation
	var translation = pose.bestTranslation
	
        object3D.position.x =  translation[0];
        object3D.position.y =  translation[1];
        object3D.position.z = -translation[2];
        
        object3D.rotation.x = -Math.asin(-rotation[1][2]);
        object3D.rotation.y = -Math.atan2(rotation[0][2], rotation[2][2]);
        object3D.rotation.z =  Math.atan2(rotation[1][0], rotation[1][1]);
        
        object3D.scale.x = markerSize;
        object3D.scale.y = markerSize;
        object3D.scale.z = markerSize;
}
var THREEx	= THREEx || {};


//////////////////////////////////////////////////////////////////////////////
//		monkey patch AR.Detector
//////////////////////////////////////////////////////////////////////////////

AR.Detector.prototype.detect = function(image){
	var opts = this.datGUIOptions

        CV.grayscale(image, this.grey);
        CV.adaptiveThreshold(this.grey, this.thres, opts.adaptativeThreshold.kernelSize, opts.adaptativeThreshold.threshold);
        
        this.contours = CV.findContours(this.thres, this.binary);
        
        this.candidates = this.findCandidates(this.contours, image.width * opts.candidates.minSize, opts.candidates.epsilon, opts.candidates.minLength);
        this.candidates = this.clockwiseCorners(this.candidates);
        this.candidates = this.notTooNear(this.candidates, opts.notTooNear.minDist);
        
        return this.findMarkers(this.grey, this.candidates, opts.findMarkers.warpSize);
};

// make names explicits - make unit explicit too
AR.Detector.prototype.datGUIOptions = {
	adaptativeThreshold : {
		kernelSize: 2,
		threshold: 7,
	},
	candidates: {
		minSize: 0.20,
		epsilon: 0.05,
		minLength: 10,
	},
	notTooNear : {
		minDist: 10,
	},
	findMarkers : {
		warpSize: 49,
	}
}

// see https://github.com/jeromeetienne/threex.geometricglow/blob/master/threex.atmospherematerialdatgui.js

THREEx.addArucoDatGui	= function(arucoContext, datGui){
	var datGUIOptions = arucoContext.detector.datGUIOptions
	var options  = {
		resolution: '640x480',
	}
	var onChange = function(){
		// honor option resolution
		var matches = options.resolution.match(/(\d+)x(\d+)/)
		var width = parseInt(matches[1])
		var height = parseInt(matches[2])
		arucoContext.setSize(width, height)
	}
	onChange();

	datGui.add( options, 'resolution', [ '320x240', '640x480' ]).onChange( onChange )
	
	var folder = datGui.addFolder('Adaptative Threshold')
	folder.open()
	folder.add( arucoContext.detector.datGUIOptions.adaptativeThreshold, 'kernelSize').min(0).step(1)
		.onChange( onChange )
	folder.add( arucoContext.detector.datGUIOptions.adaptativeThreshold, 'threshold').min(0).step(1)
		.onChange( onChange )
	
	var folder = datGui.addFolder('Candidates')
	folder.open()
	folder.add( arucoContext.detector.datGUIOptions.candidates, 'minSize').min(0).max(1)
		.onChange( onChange )
	folder.add( arucoContext.detector.datGUIOptions.candidates, 'epsilon').min(0)
		.onChange( onChange )
	folder.add( arucoContext.detector.datGUIOptions.candidates, 'minLength').min(0).step(1)
		.onChange( onChange )

	var folder = datGui.addFolder('notTooNear')
	folder.open()
	folder.add( arucoContext.detector.datGUIOptions.notTooNear, 'minDist').min(0).step(1)
		.onChange( onChange )
		
	var folder = datGui.addFolder('findMarkers')
	folder.open()
	folder.add( arucoContext.detector.datGUIOptions.findMarkers, 'warpSize').min(0).step(1)
		.onChange( onChange )
}
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
