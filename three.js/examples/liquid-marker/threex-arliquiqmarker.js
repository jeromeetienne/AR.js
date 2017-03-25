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
	var geometry = new THREE.PlaneGeometry(2,2,16-1,32*2-1)
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
                        intensity: {
                                value: 1.0                       
                        },
                        time: {
                                value: 0
                        },
		},
		defines: {
			updateInShaderEnabled: 1,
		},
	});
	var object3d = new THREE.Mesh( geometry, material );
        object3d.rotation.x = -Math.PI/2
	this.object3d = object3d

        // to get wireframe - it helps visualising the curve during debug
        // object3d.material.wireframe = true
        // object3d.material.uniforms.texture.value = null

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
	uniform float intensity;

	void main(){
                // pass the UV to the fragment
                #if (updateInShaderEnabled == 1)
		        vUv = transformUvToMarkerSpace(uv);
                #else
		        vUv = uv;
                #endif

                vPosition = position;

                vec4 mvPosition = vec4( position, 1.0 );

                mvPosition.z = 1.0 * intensity;

                float radius = length(position)*5.0;
                float height0 = tanh(radius - 2.0)-1.0;
                mvPosition.z *= height0;

                float length = length(position)*15.0;
                float height = 0.1 * 2.0 / sqrt(length*10.0);
                mvPosition.z *= sin( time*8.0 + length ) * height;

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
