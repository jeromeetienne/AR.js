var THREEx = THREEx || {}


/**
 * - videoTexture
 * - cloakWidth
 * - cloakHeight
 * - cloakSegmentsHeight
 * - remove all mentions of cache, for cloak
 */
THREEx.ArLiquidMarker = function(videoTexture){
        // build mesh
	var geometry = new THREE.PlaneGeometry(2,2,16*2-1,16*2-1)
	var material = new THREE.ShaderMaterial( {
		vertexShader: THREEx.ArLiquidMarker.vertexShader,
		fragmentShader: THREEx.ArLiquidMarker.fragmentShader,
		uniforms: {
			texture: {
				value: videoTexture
			},
                        opacity: {
                                value: 1
                        },
                        globalIntensity: {
                                value: 1.0                       
                        },
                        time: {
                                value: 0
                        },
		},
		defines: {
			uvToMarkerSpaceEnabled: 1,
		},
	});
	var object3d = new THREE.Mesh( geometry, material );
        object3d.rotation.x = -Math.PI/2
	this.object3d = object3d

        // to get wireframe - it helps visualising the curve during debug
        var debugMaterial = false
        // var debugMaterial = true
        if( debugMaterial ){
                object3d.material.wireframe = true
                object3d.material.uniforms.texture.value = null
        }

	//////////////////////////////////////////////////////////////////////////////
	//		originalsFaceVertexUvs
	//////////////////////////////////////////////////////////////////////////////
        var originalsFaceVertexUvs = [[]]

        // build originalsFaceVertexUvs array
	for(var faceIndex = 0; faceIndex < object3d.geometry.faces.length; faceIndex ++ ){
		originalsFaceVertexUvs[0][faceIndex] = []
		originalsFaceVertexUvs[0][faceIndex][0] = object3d.geometry.faceVertexUvs[0][faceIndex][0].clone()
		originalsFaceVertexUvs[0][faceIndex][1] = object3d.geometry.faceVertexUvs[0][faceIndex][1].clone()
		originalsFaceVertexUvs[0][faceIndex][2] = object3d.geometry.faceVertexUvs[0][faceIndex][2].clone()
                originalsFaceVertexUvs[0][faceIndex].forEach(function(vector2){
                        vector2.sub(new THREE.Vector2(0.5,0.5))
                        vector2.multiplyScalar(0.5 * object3d.geometry.parameters.width)
                        vector2.add(new THREE.Vector2(0.5,0.5))
                })
        }
        object3d.geometry.faceVertexUvs = originalsFaceVertexUvs
        object3d.geometry.uvsNeedUpdate = true                



        //////////////////////////////////////////////////////////////////////////////
        //                Code Separator
        //////////////////////////////////////////////////////////////////////////////
        var startedAt = performance.now()/1000
	this.update = function(){
                object3d.material.uniforms.time.value = performance.now()/1000 - startedAt
	}
}

//////////////////////////////////////////////////////////////////////////////
//                Shaders
//////////////////////////////////////////////////////////////////////////////

THREEx.ArLiquidMarker.vertexShader = THREEx.ArMarkerCloak.markerSpaceShaderFunction +
`
        // https://github.com/dsheets/gloc/blob/master/stdlib/math.glsl
        // Copyright 2012 Ashima Arts <http://ashimaarts.com/>
        // License: BSD-3-Clause <http://www.opensource.org/licenses/BSD-3-Clause>
        // math functions defined in later GLSL specs
        #if 1
        #define TANH(T) \
          T tanh(T x) { \
            T e = exp(2.0*x) ;\
            return ( e-1.0 )/ (e+1.0) ; \
            }

        TANH(float)
        TANH(vec2)
        TANH(vec3)
        TANH(vec4)
        #undef TANH
        #endif
`+`
	varying vec2 vUv;
	varying vec3 vPosition;
	uniform float time;
	uniform float globalIntensity;

	void main(){
                // pass the UV to the fragment
                #if (uvToMarkerSpaceEnabled == 1)
		        vUv = transformUvToMarkerSpace(uv);
                #else
		        vUv = uv;
                #endif

                vPosition = position;

                vec4 mvPosition = vec4( position, 1.0 );

		// honor globalIntensity
                mvPosition.z = globalIntensity;

		// make a maxHeight depending on position
                float radius = pow(length(position)*2.5, 2.0);
                float maxHeight = tanh(radius - 2.0)-1.0;
                mvPosition.z *= maxHeight/3.5;
		// 
                // // mvPosition.z *= sin( time*8.0 );
                // mvPosition.z *= cos( mod(time,1.0)*8.0 );

		// // add a sinusoid
                // float length = length(position)*15.0;
                // float sinAmplitude = 1.0 * 2.0 / sqrt(length*10.0);
                // mvPosition.z *= sin( time*8.0 + length*1.5) * sinAmplitude;

                // float radius = length(position);
		// if( radius <= 0.5 ){
                // 	mvPosition.z = 1.0;
		// }else{
                // 	mvPosition.z = 0.0;	
		// }
        	// mvPosition.z *= 0.1;


                // compute gl_Position
		mvPosition = modelViewMatrix * mvPosition;
		gl_Position = projectionMatrix * mvPosition;
	}
`

THREEx.ArLiquidMarker.fragmentShader = `
	varying vec2 vUv;
	uniform sampler2D texture;
	uniform float opacity;

	void main(void){
		vec3 color = texture2D( texture, vUv ).rgb;
		gl_FragColor = vec4( color, opacity);
	}
`
