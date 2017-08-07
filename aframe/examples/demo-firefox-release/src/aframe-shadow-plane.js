//////////////////////////////////////////////////////////////////////////////
//		arjs-hit-testing
//////////////////////////////////////////////////////////////////////////////
AFRAME.registerComponent('shadowonly-plane', {
	schema: {
		width : {
			type: 'number',
			default: 1,
		},
		height : {
			type: 'number',
			default: 1,
		},
		opacity : {
			type: 'number',
			default: 0.7,
		},
	},
	init: function () {
		// add a transparent ground-plane shadow-receiver
		var material = new THREE.ShadowMaterial({
			opacity: this.data.opacity,
			// depthWrite: false,
		})

		var geometry = new THREE.PlaneGeometry(this.data.width, this.data.height)
		
		var mesh = new THREE.Mesh( geometry, material);
		mesh.receiveShadow = true;
		mesh.rotation.x = -Math.PI/2

		this.el.object3D.add(mesh)
	},
})
