var THREEx = THREEx || {}

THREEx.ArucoContext = function(){
        this.canvas = document.createElement('canvas');
        this.canvas.width = 80*4
        this.canvas.height = 60*4
                
        this.detector = new AR.Detector();
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
