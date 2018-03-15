

//////////////////////////////////////////////////////////////////////////////
//		Code Separator
//////////////////////////////////////////////////////////////////////////////

tracking.LBF.Debug = function(canvas){
	this._canvas = canvas
        this.parameters = {
                jawVisible : true,
                eyeBrowLVisible : true,
                eyeBrowRVisible : true,
                noseVisible : true,
                eyeLVisible : true,
                eyeRVisible : true,
                mouthVisible : true,
        }	
}

tracking.LBF.Debug.prototype.displayFaceBoundingBox = function(boundingBox, faceIndex){
	var context = this._canvas.getContext('2d')
        // display the box
        context.strokeStyle = '#a64ceb';
        context.strokeRect(boundingBox.x, boundingBox.y, boundingBox.width, boundingBox.height);

        // display the size of the box
        context.font = '11px Helvetica';
        context.fillStyle = "#fff";
        context.fillText('idx: '+faceIndex, boundingBox.x + boundingBox.width + 5, boundingBox.y + 11);
        context.fillText('x: ' + boundingBox.x + 'px', boundingBox.x + boundingBox.width + 5, boundingBox.y + 22);
        context.fillText('y: ' + boundingBox.y + 'px', boundingBox.x + boundingBox.width + 5, boundingBox.y + 33);
}
        

tracking.LBF.Debug.prototype.displayLandmarksDot = function(landmarks){
	var _this = this
	var featureNames = Object.keys(tracking.LBF.LandmarkFeatures)
	
        featureNames.forEach(function(featureName){
                if( _this.parameters[featureName+'Visible'] === false )      return
                _this.displayLandmarksFeature(landmarks, featureName)
        })
}
tracking.LBF.Debug.prototype.displayLandmarksFeature = function(landmarks, featureName){
	var context = this._canvas.getContext('2d')
        var displays = {
                jaw : {
                        fillStyle: 'white',
                        closed: false,
                },
                nose : {
                        fillStyle: 'green',
                        closed: true,
                },
                mouth : {
                        fillStyle: 'red',
                        closed: true,
                },
                eyeL : {
                        fillStyle: 'purple',
                        closed: false,
                },
                eyeR : {
                        fillStyle: 'purple',
                        closed: false,
                },
                eyeBrowL : {
                        fillStyle: 'yellow',
                        closed: false,
                },
                eyeBrowR : {
                        fillStyle: 'yellow',
                        closed: false,
                },
        }
        var feature = tracking.LBF.LandmarkFeatures[featureName]
        var display = displays[featureName]

        // draw dots
        context.fillStyle = display.fillStyle
        for(var i = feature.first; i <= feature.last; i++){
                var xy = landmarks[i]
                context.beginPath();
                context.arc(xy[0],xy[1],1,0,2*Math.PI);
                context.fill();                                
        }                
        
        // draw lines
        context.strokeStyle = display.fillStyle
        context.beginPath();
        for(var i = feature.first; i <= feature.last; i++){
                var x = landmarks[i][0]
                var y = landmarks[i][1]
                if( i === 0 ){
                        context.moveTo(x, y)
                }else{
                        context.lineTo(x, y)
                }
        }
        if( display.closed === true ){
                var x = landmarks[feature.first][0]
                var y = landmarks[feature.first][1]
                context.lineTo(x, y)
        }

        context.stroke();

}
