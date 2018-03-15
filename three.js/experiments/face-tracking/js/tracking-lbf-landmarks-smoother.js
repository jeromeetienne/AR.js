tracking.LBF.LandmarksSmoother = function(lerpFactor){
	this.lerpedLandmarks = []
	this.lerpFactor = lerpFactor !== undefined ? lerpFactor : 0.7
}

tracking.LBF.LandmarksSmoother.prototype.update = function(newLandmarks){
	var lerpedLandmarks = this.lerpedLandmarks
        var lerpFactor = this.lerpFactor

        // init lerpFacesLandmarks if needed
        for(var i = 0; i < newLandmarks.length; i++){
                if( lerpedLandmarks[i] !== undefined ) continue
                lerpedLandmarks[i] = [
                        newLandmarks[i][0],
                        newLandmarks[i][1],
                ]                        
        }

        // init lerpFacesLandmarks if needed
        for(var i = 0; i < newLandmarks.length; i++){
                lerpedLandmarks[i][0] = newLandmarks[i][0] * lerpFactor  + lerpedLandmarks[i][0] * (1-lerpFactor)
                lerpedLandmarks[i][1] = newLandmarks[i][1] * lerpFactor  + lerpedLandmarks[i][1] * (1-lerpFactor)
        }
}
