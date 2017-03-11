var THREEx = THREEx || {}

THREEx.ArMarkerCache = function(videoTexture){
	var geometry	= new THREE.PlaneGeometry(1.3,1.85);
	var material	= new THREE.MeshNormalMaterial({
		transparent : true,
		opacity: 0.5,
		side: THREE.DoubleSide
	}); 
	this.object3d = new THREE.Mesh( geometry, material );
	this.object3d.position.y = -0.3
	
	
}
