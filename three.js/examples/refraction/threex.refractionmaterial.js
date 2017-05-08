var THREEx = THREEx || {}


THREEx.RefractionMaterial = function(videoTexture){
	var material = new THREE.ShaderMaterial( {
		uniforms: {
			texture: { value: videoTexture },
			// pull to see the throshold: 0.7-ish solid glass/water ('upsidevdown'), 0.8+ thinner glass ('magnifying glass')
			refractionRatio: { value: 0.9 },
			color: { value: new THREE.Color('lightblue') },
			// refractionRatio: { type: 'f', value: 0.8 },
			// experiment to adjust offset to video-plane. set to 1 for no effect
			distance: { value: 1 },
			opacity: { value: 1 },
		},
		vertexShader: THREEx.RefractionMaterial.vertexShader,
		fragmentShader: THREEx.RefractionMaterial.fragmentShader,
		transparent: true,
		side: THREE.DoubleSide,
	});
	
	return material
}


THREEx.RefractionMaterial.insertDatGUI = function(gui, material){
	
	var folder = gui.addFolder('Refraction material');
	folder.open()
	
	folder.addColor({
		color : '#'+material.uniforms.color.value.getHexString()
	}, 'color').onChange( function( colorValue  ){
		colorValue = colorValue.replace( '#','0x' );
		material.uniforms.color.value.setHex(colorValue);
	});

	folder.add(material.uniforms.refractionRatio, 'value', 0, 1).name('refractionRatio');
	folder.add(material.uniforms.distance, 'value', 0, 4).name('distance');
	folder.add(material.uniforms.opacity, 'value', 0, 1).name('opacity');	
}

//////////////////////////////////////////////////////////////////////////////
//		Shader
//////////////////////////////////////////////////////////////////////////////

// Refraction shader
// http://http.developer.nvidia.com/CgTutorial/cg_tutorial_chapter07.html
// https://www.clicktorelease.com/code/streetViewReflectionMapping/#51.50700703827454,-0.12791916931155356
// todo: fresnel effects etc.
// todo: we know *more* than the typical shader, since we have the marker plane info! we could almost raytrace to geom-plane!
THREEx.RefractionMaterial.vertexShader = `
varying vec3 vRefract;
uniform float refractionRatio;

void main() {
	vec4 mPosition = modelMatrix * vec4( position, 1.0 );

	vec3 nWorld = normalize( mat3( modelMatrix[0].xyz, modelMatrix[1].xyz, modelMatrix[2].xyz ) * normal );

	vRefract = normalize( refract( normalize( mPosition.xyz - cameraPosition ), nWorld, refractionRatio ) );

	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}
`


THREEx.RefractionMaterial.fragmentShader = `
uniform sampler2D texture;
varying vec3 vRefract;
// experiment with distance to the video plane. should do real ray-plane-intersection!
uniform float distance;
uniform float opacity;
uniform vec3 color;

void main(void) {
	// 2d video plane lookup
	// todo: ! here we could raytrace the ray into the _markerplane_! we know this ('reasonable area around the marker')
	vec2 p = vec2(vRefract.x*distance + 0.5, vRefract.y*distance + 0.5);

	vec3 texel = texture2D( texture, p ).rgb;
	texel *= color;
	gl_FragColor = vec4( texel, opacity );
}
`
