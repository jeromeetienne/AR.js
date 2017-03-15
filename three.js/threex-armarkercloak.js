var THREEx = THREEx || {}
/**
 * - videoTexture
 * - cloakWidth
 * - cloakHeight
 * - cloakSegmentsHeight
 * - remove all mentions of cache, for cloak
 */
THREEx.ArMarkerCloak = function(videoTexture){
        var updateInShaderEnabled = true

        // build cloakMesh
        // TODO if webgl2 use repeat warp, and not multi segment, this will reduce the geometry to draw
	var geometry = new THREE.PlaneGeometry(1.3+0.25,1.85+0.25, 1, 8).translate(0,-0.3,0)
	var material = new THREE.ShaderMaterial( {
		vertexShader: THREEx.ArMarkerCloak.vertexShader,
		fragmentShader: THREEx.ArMarkerCloak.fragmentShader,
		uniforms: {
			texture: {
				value: videoTexture
			},
		},
		defines: {
			updateInShaderEnabled: updateInShaderEnabled ? 1 : 0,
		}
	});

	var cloakMesh = new THREE.Mesh( geometry, material );
	this.object3d = cloakMesh

	//////////////////////////////////////////////////////////////////////////////
	//		Code Separator
	//////////////////////////////////////////////////////////////////////////////

	var xMin = -0.65
	var xMax =  0.65
	var yMin =  0.65 + 0.1
	var yMax =  0.95 + 0.1

	//////////////////////////////////////////////////////////////////////////////
	//		originalsFaceVertexUvs
	//////////////////////////////////////////////////////////////////////////////
        var originalsFaceVertexUvs = [[]]

        // build originalsFaceVertexUvs array
	for(var faceIndex = 0; faceIndex < cloakMesh.geometry.faces.length; faceIndex ++ ){
		originalsFaceVertexUvs[0][faceIndex] = []
		originalsFaceVertexUvs[0][faceIndex][0] = new THREE.Vector2()
		originalsFaceVertexUvs[0][faceIndex][1] = new THREE.Vector2()
		originalsFaceVertexUvs[0][faceIndex][2] = new THREE.Vector2()
        }

	// set values in originalsFaceVertexUvs
	for(var i = 0; i < cloakMesh.geometry.parameters.heightSegments/2; i ++ ){
		// one segment height - even row - normale orientation
		originalsFaceVertexUvs[0][i*4+0][0].set( xMin/2+0.5, yMax/2+0.5 )
		originalsFaceVertexUvs[0][i*4+0][1].set( xMin/2+0.5, yMin/2+0.5 )
		originalsFaceVertexUvs[0][i*4+0][2].set( xMax/2+0.5, yMax/2+0.5 )
		
		originalsFaceVertexUvs[0][i*4+1][0].set( xMin/2+0.5, yMin/2+0.5 )
		originalsFaceVertexUvs[0][i*4+1][1].set( xMax/2+0.5, yMin/2+0.5 )
		originalsFaceVertexUvs[0][i*4+1][2].set( xMax/2+0.5, yMax/2+0.5 )

		// one segment height - odd row - mirror-y orientation
		originalsFaceVertexUvs[0][i*4+2][0].set( xMin/2+0.5, yMin/2+0.5 )
		originalsFaceVertexUvs[0][i*4+2][1].set( xMin/2+0.5, yMax/2+0.5 )
		originalsFaceVertexUvs[0][i*4+2][2].set( xMax/2+0.5, yMin/2+0.5 )
		
		originalsFaceVertexUvs[0][i*4+3][0].set( xMin/2+0.5, yMax/2+0.5 )
		originalsFaceVertexUvs[0][i*4+3][1].set( xMax/2+0.5, yMax/2+0.5 )
		originalsFaceVertexUvs[0][i*4+3][2].set( xMax/2+0.5, yMin/2+0.5 )
	}

        if( updateInShaderEnabled === true ){
                cloakMesh.geometry.faceVertexUvs = originalsFaceVertexUvs
                cloakMesh.geometry.uvsNeedUpdate = true                
        }

	//////////////////////////////////////////////////////////////////////////////
	//		Code Separator
	//////////////////////////////////////////////////////////////////////////////

	var originalOrthoVertices = []
	originalOrthoVertices.push( new THREE.Vector3(xMin, yMax, 0))
	originalOrthoVertices.push( new THREE.Vector3(xMax, yMax, 0))
	originalOrthoVertices.push( new THREE.Vector3(xMin, yMin, 0))
	originalOrthoVertices.push( new THREE.Vector3(xMax, yMin, 0))

	// build debugMesh
        var material = new THREE.MeshNormalMaterial({
		transparent : true,
		opacity: 0.5,
		side: THREE.DoubleSide
	});
        var geometry = new THREE.PlaneGeometry(1,1);
        var orthoMesh = new THREE.Mesh(geometry, material);
	this.orthoMesh = orthoMesh

        //////////////////////////////////////////////////////////////////////////////
        //                Code Separator
        //////////////////////////////////////////////////////////////////////////////

	this.update = function(modelViewMatrix, cameraProjectionMatrix){
                updateOrtho(modelViewMatrix, cameraProjectionMatrix)

                if( updateInShaderEnabled === false ){
                        updateUvs(modelViewMatrix, cameraProjectionMatrix)
                }
	}
        
        return

        // update cloakMesh
	function updateUvs(modelViewMatrix, cameraProjectionMatrix){
		var transformedUv = new THREE.Vector3()
                originalsFaceVertexUvs[0].forEach(function(faceVertexUvs, faceIndex){
                        faceVertexUvs.forEach(function(originalUv, uvIndex){
                                // set transformedUv - from UV coord to clip coord
                                transformedUv.x = originalUv.x * 2.0 - 1.0;
                                transformedUv.y = originalUv.y * 2.0 - 1.0;
                                transformedUv.z = 0
        			// apply modelViewMatrix and projectionMatrix
        			transformedUv.applyMatrix4( modelViewMatrix )
        			transformedUv.applyMatrix4( cameraProjectionMatrix )
        			// apply perspective
        			transformedUv.x /= transformedUv.z
        			transformedUv.y /= transformedUv.z
                                // set back from clip coord to Uv coord
                                transformedUv.x = transformedUv.x / 2.0 + 0.5;
                                transformedUv.y = transformedUv.y / 2.0 + 0.5;
                                // copy the trasnformedUv into the geometry
                                cloakMesh.geometry.faceVertexUvs[0][faceIndex][uvIndex].set(transformedUv.x, transformedUv.y)
                        })
                })
        
                // cloakMesh.geometry.faceVertexUvs = faceVertexUvs
                cloakMesh.geometry.uvsNeedUpdate = true
        }

        // update orthoMesh
	function updateOrtho(modelViewMatrix, cameraProjectionMatrix){
		// compute transformedUvs
		var transformedUvs = []
		originalOrthoVertices.forEach(function(originalOrthoVertices, index){
			var transformedUv = originalOrthoVertices.clone()
			// apply modelViewMatrix and projectionMatrix
			transformedUv.applyMatrix4( modelViewMatrix )
			transformedUv.applyMatrix4( cameraProjectionMatrix )
			// apply perspective
			transformedUv.x /= transformedUv.z
			transformedUv.y /= transformedUv.z
			// store it
			transformedUvs.push(transformedUv)
		})

		// change orthoMesh vertices
		for(var i = 0; i < transformedUvs.length; i++){
			orthoMesh.geometry.vertices[i].copy(transformedUvs[i])
		}
		orthoMesh.geometry.computeBoundingSphere()
		orthoMesh.geometry.verticesNeedUpdate = true
        }

}

//////////////////////////////////////////////////////////////////////////////
//                Shaders
//////////////////////////////////////////////////////////////////////////////

THREEx.ArMarkerCloak.markerSpaceShaderFunction = `    
        vec2 transformUvToMarkerSpace(vec2 originalUv){
                vec3 transformedUv;
                // set transformedUv - from UV coord to clip coord
                transformedUv.x = originalUv.x * 2.0 - 1.0;
                transformedUv.y = originalUv.y * 2.0 - 1.0;
                transformedUv.z = 0.0;

		// apply modelViewMatrix and projectionMatrix
                transformedUv = (projectionMatrix * modelViewMatrix * vec4( transformedUv, 1.0 ) ).xyz;

		// apply perspective
		transformedUv.x /= transformedUv.z;
		transformedUv.y /= transformedUv.z;

                // set back from clip coord to Uv coord
                transformedUv.x = transformedUv.x / 2.0 + 0.5;
                transformedUv.y = transformedUv.y / 2.0 + 0.5;
                
                // return the result
                return transformedUv.xy;
        }
`

THREEx.ArMarkerCloak.vertexShader = THREEx.ArMarkerCloak.markerSpaceShaderFunction + `
	varying vec2 vUv;

	void main(){
                // pass the UV to the fragment
                #if (updateInShaderEnabled == 1)
		        vUv = transformUvToMarkerSpace(uv);
                #else
		        vUv = uv;
                #endif

                // compute gl_Position
		vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );
		gl_Position = projectionMatrix * mvPosition;
	}
`;

THREEx.ArMarkerCloak.fragmentShader = `        
	varying vec2 vUv;
	uniform sampler2D texture;

	void main(void){
		vec3 color = texture2D( texture, vUv ).rgb;

		gl_FragColor = vec4( color, 1.0);
	}
`;
