var THREEx = THREEx || {}

THREEx.ArMarkerHelper = function(markerControls){
	this.object3d = new THREE.Group

	var mesh = new THREE.AxisHelper()
	this.object3d.add(mesh)

	// var text = markerControls.id
	// debugger
	var text = markerControls.parameters.patternUrl.slice(-1).toUpperCase();

	var canvas = document.createElement( 'canvas' );
	canvas.width =  64;
	canvas.height = 64;

	var context = canvas.getContext( '2d' );
	var texture = new THREE.CanvasTexture( canvas );

	// put the text in the sprite
	context.font = '48px monospace';
	context.fillStyle = 'rgba(192,192,255, 0.5)';
	context.fillRect( 0, 0, canvas.width, canvas.height );
	context.fillStyle = 'darkblue';
	context.fillText(text, canvas.width/4, 3*canvas.height/4 )
	texture.needsUpdate = true

	// var geometry = new THREE.CubeGeometry(1, 1, 1)
	var geometry = new THREE.PlaneGeometry(1, 1)
	var material = new THREE.MeshBasicMaterial({
		map: texture, 
		transparent: true
	});
	var mesh = new THREE.Mesh(geometry, material)
	mesh.rotation.x = -Math.PI/2

	this.object3d.add(mesh)
	
}
