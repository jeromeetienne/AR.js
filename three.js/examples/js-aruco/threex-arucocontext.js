var THREEx = THREEx || {}

THREEx.ArucoContext = function(markerSize){
        this.canvas = document.createElement('canvas');
        this.canvas.width = 80*8
        this.canvas.height = 60*8
        
        // experiment with imageSmoothingEnabled
        var imageSmoothingEnabled = false
        var context = this.canvas.getContext('2d');
	context.mozImageSmoothingEnabled = imageSmoothingEnabled;
	context.webkitImageSmoothingEnabled = imageSmoothingEnabled;
	context.msImageSmoothingEnabled = imageSmoothingEnabled;
	context.imageSmoothingEnabled = imageSmoothingEnabled;	
                
        this.detector = new AR.Detector();
        this.posit = new POS.Posit(markerSize, this.canvas.width);
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
        
        // compute the pose for each detectedMarkers
        detectedMarkers.forEach(function(detectedMarker){
                // debugger
                var markerCorners = detectedMarker.corners;

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
                detectedMarker.pose = _this.posit.pose(poseCorners);
        })	
        
	return detectedMarkers
};

THREEx.ArucoContext.updateObject3D = function(object3D, detectedMarker){
	var rotation = detectedMarker.pose.bestRotation
	var translation = detectedMarker.pose.bestTranslation
	
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
