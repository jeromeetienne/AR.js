var THREEx = THREEx || {}

THREEx.ArMarkerCache = function(videoTexture){


        // build cacheMesh
        // TODO if webgl2 use repeat warp, and not multi segment, this will reduce the geometry to draw
	var geometry	= new THREE.PlaneGeometry(1.3+0.5,1.85+0.5, 1, 8);
	// var material	= new THREE.MeshBasicMaterial({
	// 	// transparent : true,
	// 	// opacity: 0.5,
	// 	// side: THREE.DoubleSide,
	// 	map: videoTexture,
	// });
	var material = new THREE.ShaderMaterial( {
		vertexShader: THREEx.ArMarkerCache.vertexShader,
		fragmentShader: THREEx.ArMarkerCache.fragmentShader,
		uniforms: {
			texture: {
				value: videoTexture
			}
		},
	} );

	var cacheMesh = new THREE.Mesh( geometry, material );
	cacheMesh.position.y = -0.3
	this.object3d = cacheMesh
// window.cacheMesh = cacheMesh
	//////////////////////////////////////////////////////////////////////////////
	//		Code Separator
	//////////////////////////////////////////////////////////////////////////////

	var xMin = -0.65
	var xMax =  0.65
	var yMin =  0.65 + 0.1
	var yMax =  0.95 + 0.1

	//////////////////////////////////////////////////////////////////////////////
	//		Code Separator
	//////////////////////////////////////////////////////////////////////////////
        var originalsFaceVertexUvs = [[]]

        // build faceVertexUvs array
        var faceVertexUvs = [[]]
	for(var faceIndex = 0; faceIndex < cacheMesh.geometry.parameters.heightSegments*2; faceIndex ++ ){
		originalsFaceVertexUvs[0][faceIndex] = []
		originalsFaceVertexUvs[0][faceIndex][0] = new THREE.Vector2()
		originalsFaceVertexUvs[0][faceIndex][1] = new THREE.Vector2()
		originalsFaceVertexUvs[0][faceIndex][2] = new THREE.Vector2()
        }

	// set values in originalsFaceVertexUvs
	for(var i = 0; i < cacheMesh.geometry.parameters.heightSegments/2; i ++ ){
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
        
        //////////////////////////////////////////////////////////////////////////////
        //                init orthoMesh
        //////////////////////////////////////////////////////////////////////////////

	// build orthoMesh
        var material = new THREE.MeshNormalMaterial({
		transparent : true,
		opacity: 0.5,
		side: THREE.DoubleSide
	});
        var geometry = new THREE.PlaneGeometry(1,1);
        var orthoMesh = new THREE.Mesh(geometry, material);
	this.orthoMesh = orthoMesh
        
        
	var originalOrthoVertices = []
	originalOrthoVertices.push( new THREE.Vector3(xMin, yMax, 0))
	originalOrthoVertices.push( new THREE.Vector3(xMax, yMax, 0))
	originalOrthoVertices.push( new THREE.Vector3(xMin, yMin, 0))
	originalOrthoVertices.push( new THREE.Vector3(xMax, yMin, 0))
        
	//////////////////////////////////////////////////////////////////////////////
	//		Code Separator
	//////////////////////////////////////////////////////////////////////////////

	this.update = function(modelViewMatrix, cameraProjectionMatrix){
                updateOrtho(modelViewMatrix, cameraProjectionMatrix)
                
                // updateUvs(modelViewMatrix, cameraProjectionMatrix)
	}
        return 


        // update orthoMesh
	function updateUvs(modelViewMatrix, cameraProjectionMatrix){
		var transformedUv = new THREE.Vector3()
                originalsFaceVertexUvs[0].forEach(function(faceVertexUvs, faceIndex){
                        faceVertexUvs.forEach(function(originalUv, uvIndex){
                                // set transformedUv - from UV coord to clip coord
                                transformedUv.x = originalUv.x * 2.0 - 1.0;
                                transformedUv.y = originalUv.y * 2.0 - 1.0;
                                transformedUv.z = 0
        			// apply modelViewMatrix and projectionMatrix to transformedUv
        			transformedUv.applyMatrix4( modelViewMatrix )
        			transformedUv.applyMatrix4( cameraProjectionMatrix )
        			// apply perspective
        			transformedUv.x /= transformedUv.z
        			transformedUv.y /= transformedUv.z
                                // set back from clip coord to Uv coord
                                transformedUv.x = transformedUv.x / 2.0 + 0.5;
                                transformedUv.y = transformedUv.y / 2.0 + 0.5;
                                // copy the trasnformedUv into the geometry
                                cacheMesh.geometry.faceVertexUvs[0][faceIndex][uvIndex].copy(transformedUv)
                        })
                })

                // cacheMesh.geometry.faceVertexUvs = faceVertexUvs
                cacheMesh.geometry.uvsNeedUpdate = true
        }

        // update orthoMesh
	function updateOrtho(modelViewMatrix, cameraProjectionMatrix){
		// compute transformedUvs
		var transformedUvs = []
		originalOrthoVertices.forEach(function(originalVertex, index){
			var transformedVertex = originalVertex.clone()
			// apply modelViewMatrix and projectionMatrix
			transformedVertex.applyMatrix4( modelViewMatrix )
			transformedVertex.applyMatrix4( cameraProjectionMatrix )
			// apply perspective
			transformedVertex.x /= transformedVertex.z
			transformedVertex.y /= transformedVertex.z
			// copy it in orthoMesh.geometry.vertices
			orthoMesh.geometry.vertices[index].copy(transformedVertex)
		})

		orthoMesh.geometry.computeBoundingSphere()
		orthoMesh.geometry.verticesNeedUpdate = true
        }

}

//////////////////////////////////////////////////////////////////////////////
//                Shaders
//////////////////////////////////////////////////////////////////////////////

THREEx.ArMarkerCache.vertexShader = `    
	varying vec2 vUv;
        
        vec2 applyUvTransform(vec2 originalUv){
                vec3 transformedUv;
                // set transformedUv - from UV coord to clip coord
                transformedUv.x = originalUv.x * 2.0 - 1.0;
                transformedUv.y = originalUv.y * 2.0 - 1.0;
                transformedUv.z = 0.0;

		// apply modelViewMatrix and projectionMatrix to transformedUv
		transformedUv = projectionMatrix * modelViewMatrix * vec4( transformedUv, 1.0 );;

		// apply perspective
		transformedUv.x /= transformedUv.z;
		transformedUv.y /= transformedUv.z;

                // set back from clip coord to Uv coord
                transformedUv.x = transformedUv.x / 2.0 + 0.5;
                transformedUv.y = transformedUv.y / 2.0 + 0.5;
                
                return transformedUv.xy;
        }
        
	void main(){
                // pass the UV to the fragment
		vUv = applyUvTransform(uv);

                // compute gl_Position
		vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );
		gl_Position = projectionMatrix * mvPosition;
	}
`;

THREEx.ArMarkerCache.fragmentShader = `
	varying vec2 vUv;
	uniform sampler2D texture;

	void main(void){
		vec3 color = texture2D( texture, vUv ).rgb;

		gl_FragColor = vec4( color, 1.0);
	}
`;
