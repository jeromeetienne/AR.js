// @namespace
var ARjs = ARjs || {}

ARjs.TangoPointCloud = function(arSession){
	var _this = this
	var arContext = arSession.arContext
	this.object3d = new THREE.Group

console.warn('Work only on cameraTransformMatrix - fix me - useless limitation')
	
	arContext.addEventListener('initialized', function(event){
	        var vrPointCloud = arContext._tangoContext.vrPointCloud
	        var geometry = vrPointCloud.getBufferGeometry()
	        var material = new THREE.PointsMaterial({
	                size: 0.01, 
        		// colorWrite: false, // good for occlusion
			depthWrite: false,
	        })
	        var pointsObject = new THREE.Points(geometry, material)
	        // Points are changing all the time so calculating the frustum culling volume is not very convenient.
	        pointsObject.frustumCulled = false;
	        pointsObject.renderDepth = 0;

		_this.object3d.add(pointsObject)
	})
}
