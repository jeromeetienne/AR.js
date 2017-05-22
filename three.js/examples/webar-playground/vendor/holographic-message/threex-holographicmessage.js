var THREEx = THREEx || {}

THREEx.HolographicMessage = function(videoURL, camera){
	this._onRenderFcts = []

	var containerMesh = new THREE.Group
	this.object3d = containerMesh
	
	var videoMesh = this._initVideoMesh(videoURL)
	this._initRingMeshes()

	//////////////////////////////////////////////////////////////////////////////
	//		update video mesh
	//////////////////////////////////////////////////////////////////////////////

	// // bill boarding by @blq
	// this._onRenderFcts.push(function(){
	// 	var x = new THREE.Vector3();
	// 	var y = new THREE.Vector3();
	// 	var z = new THREE.Vector3();
	// 	containerMesh.matrixWorld.extractBasis(x, y, z);
	// 	videoMesh.up.copy(y);
	// 	videoMesh.lookAt(camera.position);
	// })
}

//////////////////////////////////////////////////////////////////////////////
//		Utilities functions
//////////////////////////////////////////////////////////////////////////////
THREEx.HolographicMessage.prototype.update = function (delta) {
	this._onRenderFcts.forEach(function(onRenderFct){
		onRenderFct(delta)
	})
}

//////////////////////////////////////////////////////////////////////////////
//		initialisation functions
//////////////////////////////////////////////////////////////////////////////

THREEx.HolographicMessage.prototype._initVideoMesh = function(videoURL){
	//////////////////////////////////////////////////////////////////////////////
	//		create textures
	//////////////////////////////////////////////////////////////////////////////

	var video = document.createElement( 'video' );
	video.src = videoURL
	video.autoplay = true;
	video.webkitPlaysinline = true;
	video.controls = false;
	video.loop = true;
	video.muted = true
	// trick to trigger the video on android
	document.body.addEventListener('click', function onClick(){
		document.body.removeEventListener('click', onClick);
		video.play()
	})

	var videoTexture = new THREE.VideoTexture(video)
	videoTexture.needsUpdate = true		
	videoTexture.minFilter =  THREE.NearestFilter


	//////////////////////////////////////////////////////////////////////////////
	//		create video mesh
	//////////////////////////////////////////////////////////////////////////////
	var geometry = new THREE.PlaneGeometry(1,9/16);
	var material = new THREE.ShaderMaterial({
		uniforms: {
			time: { value: 0.0 },
			opacity: { value: 0.7 },
			tDiffuse: { value: videoTexture },
			distortion: { value: 0 },
			distortion2: { value: 0 },
			speed: { value: 0.0 },
			rollHeight: { value: 0.0 },
			randomSeed: { value: Math.random()*1000 },
		},
		defines: {
			badTvShaderEnabled : 0
		},
		vertexShader: THREEx.HolographicMessage.vertexShader,
		fragmentShader: THREEx.HolographicMessage.fragmentShader,
		side: THREE.DoubleSide,
		// TODO try other blending
	})

	var videoMesh	= new THREE.Mesh( geometry, material );
	this.object3d.add(videoMesh)	
	videoMesh.position.y = 1.0
	// videoMesh.rotation.x = Math.PI/2
	videoMesh.scale.set(1,1,1).multiplyScalar(2.5)
	
	this._onRenderFcts.push(function(delta){
		videoMesh.material.uniforms.time.value += delta
	})
	
	return videoMesh
}

THREEx.HolographicMessage.prototype._initRingMeshes = function(){
	// create geometry and material
	var geometry	= new THREE.PlaneGeometry(1,1);
	var texture = THREEx.HolographicMessage._createRingTexture()
	var material	= new THREE.MeshBasicMaterial({
		map: texture,
		transparent : true,
		opacity: 0.75,
		color: 'cyan',
		side: THREE.DoubleSide
	}); 

	// create lower ring
	var ringLowMesh	= new THREE.Mesh( geometry, material );
	this.object3d.add(ringLowMesh)	
	ringLowMesh.rotation.x = Math.PI/2
	ringLowMesh.position.y = +0.05
	ringLowMesh.scale.set(1,1,1).multiplyScalar(1.2)
	// animate higher ring
	ringLowMesh.rotation.z = Math.random()*2*Math.PI
	this._onRenderFcts.push(function(delta){
		ringLowMesh.rotation.z += 2*Math.PI*delta / 5
	})

	// create higher ring	
	var ringHighMesh	= new THREE.Mesh( geometry, material );
	ringHighMesh.scale.set(1,1,1).multiplyScalar(1.4)
	ringHighMesh.rotation.x = Math.PI/2
	ringHighMesh.position.y = +0.2
	this.object3d.add(ringHighMesh)

	// animate higher ring
	ringHighMesh.rotation.z = Math.random()*2*Math.PI
	this._onRenderFcts.push(function(delta){
		ringHighMesh.rotation.z -= 2*Math.PI*delta / 5
	})
}

THREEx.HolographicMessage._createRingTexture = function(){
	var canvas = document.createElement( 'canvas' );
	canvas.width = 256;
	canvas.height = 256;

	var context = canvas.getContext( '2d' );
	var centerX = canvas.width / 2;
	var centerY = canvas.height / 2;
	var radius = canvas.width / 2 * 0.7;
	context.lineWidth = canvas.width * 0.1;
	context.strokeStyle = '#ffffff';

	var nChunks = 3
	var chunkAngle = 2*Math.PI/nChunks
	var chunkMargin = Math.PI/8
	
	context.beginPath();
	context.arc(centerX, centerY, radius, 0, chunkAngle - chunkMargin, false);
	context.stroke();

	context.beginPath();
	context.arc(centerX, centerY, radius, chunkAngle, 2*chunkAngle - chunkMargin, false);
	context.stroke();

	context.beginPath();
	context.arc(centerX, centerY, radius, 2*chunkAngle, 3*chunkAngle - chunkMargin, false);
	context.stroke();

	var texture = new THREE.Texture( canvas );
	texture.needsUpdate = true
	
	return texture
}

//////////////////////////////////////////////////////////////////////////////
//		Shaders
//////////////////////////////////////////////////////////////////////////////

THREEx.HolographicMessage.vertexShader = `
	varying vec2 vUv;
	void main() {
		vUv = uv;
		gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
	}
`
THREEx.HolographicMessage.fragmentShader = `
	varying vec2 vUv;
	uniform sampler2D tDiffuse;
	uniform float opacity;
	uniform float time;


	//////////////////////////////////////////////////////////////////////////////
	//		Code Separator
	//////////////////////////////////////////////////////////////////////////////
	/* @author Felix Turner / www.airtight.cc / @felixturner
	 *
	 * Bad TV Shader
	 * Simulates a bad TV via horizontal distortion and vertical roll
	 * Uses Ashima WebGl Noise: https://github.com/ashima/webgl-noise
 	 * under The MIT License
 	 */

	uniform float distortion;
	uniform float distortion2;
	uniform float speed;
	uniform float rollHeight;
	uniform float randomSeed;
	
	// Start Ashima 2D Simplex Noise
	
	vec3 mod289(vec3 x) {
		return x - floor(x * (1.0 / 289.0)) * 289.0;
	}
	
	vec2 mod289(vec2 x) {
		return x - floor(x * (1.0 / 289.0)) * 289.0;
	}
	
	vec3 permute(vec3 x) {
		return mod289(((x*34.0)+1.0)*x);
	}
	
	float snoise(vec2 v)
	{
		const vec4 C = vec4(0.211324865405187,  // (3.0-sqrt(3.0))/6.0
		0.366025403784439,  // 0.5*(sqrt(3.0)-1.0)
		-0.577350269189626,  // -1.0 + 2.0 * C.x
		0.024390243902439); // 1.0 / 41.0
		vec2 i  = floor(v + dot(v, C.yy) );
		vec2 x0 = v -   i + dot(i, C.xx);
		
		vec2 i1;
		i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
		vec4 x12 = x0.xyxy + C.xxzz;
		x12.xy -= i1;
		
		i = mod289(i); // Avoid truncation effects in permutation
		vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 ))
		+ i.x + vec3(0.0, i1.x, 1.0 ));
		
		vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
		m = m*m ;
		m = m*m ;
		
		vec3 x = 2.0 * fract(p * C.www) - 1.0;
		vec3 h = abs(x) - 0.5;
		vec3 ox = floor(x + 0.5);
		vec3 a0 = x - ox;
		
		m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
		
		vec3 g;
		g.x  = a0.x  * x0.x  + h.x  * x0.y;
		g.yz = a0.yz * x12.xz + h.yz * x12.yw;
		return 130.0 * dot(m, g);
	}

	vec2 badTvShaderUv(vec2 uv){
		float ty = time*speed;
		float yt = uv.y - ty + randomSeed;

		// smooth distortion
		float offset = snoise(vec2(yt*3.0,0.0))*0.2;
		// boost distortion
		offset = pow( offset*distortion,3.0)/distortion;
		//add fine grain distortion
		offset += snoise(vec2(yt*50.0,0.0))*distortion2*0.001;
		//combine distortion on X with roll on Y
		return vec2( fract(uv.x + offset), fract(uv.y-rollHeight) );		
	}

	//////////////////////////////////////////////////////////////////////////////
	//		Code Separator
	//////////////////////////////////////////////////////////////////////////////

	float rand(float n){return fract(sin(n) * 43758.5453123);}

	void main() {
		
		// read the texture raw
		#if (badTvShaderEnabled == 0)
			vec2 uv = vUv;
		#else
			vec2 uv = badTvShaderUv(vUv);
		#endif

		gl_FragColor = texture2D( tDiffuse, uv );

		// discard anything too green
		if( gl_FragColor.r < 0.5 && gl_FragColor.g > 0.2 ){
			discard;
		}

		// compute level of gray
		float grayLevel = dot(gl_FragColor.rgb, vec3(0.299, 0.587, 0.114));
		gl_FragColor.rgb = vec3(grayLevel, grayLevel, grayLevel);
		
		// pass grayLevel-ish into cyan-ish
		gl_FragColor.rgb *= vec3(0.0, 1.0, 1.0);
		
		// silly glow
		gl_FragColor.rgb *= 1.3;
		
		// do a interlace effect
		float offset = sin(time/3.0);
		if( mod( (vUv.y+offset) * 96.0, 2.0) < 0.5 ){
			gl_FragColor.rgb *= 1.1;
		}else{
			gl_FragColor.rgb *= (1.0/1.1);	
		}
		
		// add a white noise
		gl_FragColor.rgb *= (1.0 + (rand(time+vUv.x + vUv.y)-0.5)*0.3);			
	
		// honor opacity
		gl_FragColor.a = opacity;
	}
`
