var THREEx = THREEx || {}

THREEx.ArMarkerCache = function(videoTexture){
	// build debugMesh
        var material = new THREE.MeshNormalMaterial({
		transparent : true,
		opacity: 0.5,
		side: THREE.DoubleSide
	});
        var geometry = new THREE.PlaneGeometry(1,1);
        var orthoMesh = new THREE.Mesh(geometry, material);
	this.orthoMesh = orthoMesh

        // build cacheMesh
        // TODO if webgl2 use repeat warp, and not multi segment, this will reduce the geometry to draw
	var geometry	= new THREE.PlaneGeometry(1.3+0.5,1.85+0.5, 1, 8);
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
        var originalsFaceVertexUvs = null

        // build faceVertexUvs array
        var faceVertexUvs = [[]]
	for(var faceIndex = 0; faceIndex < cacheMesh.geometry.parameters.heightSegments*2; faceIndex ++ ){
		faceVertexUvs[0][faceIndex] = []
		faceVertexUvs[0][faceIndex][0] = new THREE.Vector2()
		faceVertexUvs[0][faceIndex][1] = new THREE.Vector2()
		faceVertexUvs[0][faceIndex][2] = new THREE.Vector2()
        }

	// set values in faceVertexUvs
	for(var i = 0; i < cacheMesh.geometry.parameters.heightSegments/2; i ++ ){
		// one segment height - even row - normale orientation
		faceVertexUvs[0][i*4+0][0].set( xMin/2+0.5, yMax/2+0.5 )
		faceVertexUvs[0][i*4+0][1].set( xMin/2+0.5, yMin/2+0.5 )
		faceVertexUvs[0][i*4+0][2].set( xMax/2+0.5, yMax/2+0.5 )
		
		faceVertexUvs[0][i*4+1][0].set( xMin/2+0.5, yMin/2+0.5 )
		faceVertexUvs[0][i*4+1][1].set( xMax/2+0.5, yMin/2+0.5 )
		faceVertexUvs[0][i*4+1][2].set( xMax/2+0.5, yMax/2+0.5 )

		// one segment height - odd row - mirror-y orientation
		faceVertexUvs[0][i*4+2][0].set( xMin/2+0.5, yMin/2+0.5 )
		faceVertexUvs[0][i*4+2][1].set( xMin/2+0.5, yMax/2+0.5 )
		faceVertexUvs[0][i*4+2][2].set( xMax/2+0.5, yMin/2+0.5 )
		
		faceVertexUvs[0][i*4+3][0].set( xMin/2+0.5, yMax/2+0.5 )
		faceVertexUvs[0][i*4+3][1].set( xMax/2+0.5, yMax/2+0.5 )
		faceVertexUvs[0][i*4+3][2].set( xMax/2+0.5, yMin/2+0.5 )
	}
        
        originalsFaceVertexUvs = faceVertexUvs

        var updateInShaderEnabled = false
        if( updateInShaderEnabled === false ){
                cacheMesh.geometry.faceVertexUvs = originalsFaceVertexUvs
                cacheMesh.geometry.uvsNeedUpdate = true                
        }else{
                console.assert(false, 'not yet implemented')
        }

	//////////////////////////////////////////////////////////////////////////////
	//		Code Separator
	//////////////////////////////////////////////////////////////////////////////

	var originalUvs = []
	originalUvs.push( new THREE.Vector3(xMin, yMax, 0))
	originalUvs.push( new THREE.Vector3(xMax, yMax, 0))
	originalUvs.push( new THREE.Vector3(xMin, yMin, 0))
	originalUvs.push( new THREE.Vector3(xMax, yMin, 0))

	this.update = function(modelViewMatrix, cameraProjectionMatrix){
                updateOrtho(modelViewMatrix, cameraProjectionMatrix)

                if( updateInShaderEnabled === false ){
                        updateUvs(modelViewMatrix, cameraProjectionMatrix)
                }
	}
        
        return

	function updateUvs(modelViewMatrix, cameraProjectionMatrix){
		// compute transformedUvs
		var transformedUvs = []
		originalUvs.forEach(function(originalUvs, index){
			var transformedUv = originalUvs.clone()
			// apply modelViewMatrix and projectionMatrix
			transformedUv.applyMatrix4( modelViewMatrix )
			transformedUv.applyMatrix4( cameraProjectionMatrix )
			// apply perspective
			transformedUv.x /= transformedUv.z
			transformedUv.y /= transformedUv.z
			// store it
			transformedUvs.push(transformedUv)
		})

		// change cacheMesh UVs
		for(var i = 0; i < cacheMesh.geometry.parameters.heightSegments/2; i ++ ){
			// normale orientation
			cacheMesh.geometry.faceVertexUvs[0][i*4+0][0].copy( convertUvs(0, 1) )
			cacheMesh.geometry.faceVertexUvs[0][i*4+0][1].copy( convertUvs(0, 0) )
			cacheMesh.geometry.faceVertexUvs[0][i*4+0][2].copy( convertUvs(1, 1) )
			
			cacheMesh.geometry.faceVertexUvs[0][i*4+1][0].copy( convertUvs(0, 0) )
			cacheMesh.geometry.faceVertexUvs[0][i*4+1][1].copy( convertUvs(1, 0) )
			cacheMesh.geometry.faceVertexUvs[0][i*4+1][2].copy( convertUvs(1, 1) )

			// swapy orientation
			cacheMesh.geometry.faceVertexUvs[0][i*4+2][0].copy( convertUvs(0, 0) )
			cacheMesh.geometry.faceVertexUvs[0][i*4+2][1].copy( convertUvs(0, 1) )
			cacheMesh.geometry.faceVertexUvs[0][i*4+2][2].copy( convertUvs(1, 0) )
			
			cacheMesh.geometry.faceVertexUvs[0][i*4+3][0].copy( convertUvs(0, 1) )
			cacheMesh.geometry.faceVertexUvs[0][i*4+3][1].copy( convertUvs(1, 1) )
			cacheMesh.geometry.faceVertexUvs[0][i*4+3][2].copy( convertUvs(1, 0) )
		}
		cacheMesh.geometry.uvsNeedUpdate = true
		function convertUvs(x, y){
			if( x === 0 && y === 0 ){
				var transformedUv = transformedUvs[2]
			}else if( x === 0 && y === 1 ){
				var transformedUv = transformedUvs[0]
			}else if( x === 1 && y === 1 ){
				var transformedUv = transformedUvs[1]
			}else if( x === 1 && y === 0 ){
				var transformedUv = transformedUvs[3]
			}else {
				console.assert(false)
			}

			var Uv = new THREE.Vector2()
			Uv.x = transformedUv.x / 2 + 0.5
			Uv.y = transformedUv.y / 2 + 0.5
			
			return Uv
		}
                
        }

        // update orthoMesh
	function updateOrtho(modelViewMatrix, cameraProjectionMatrix){
		// compute transformedUvs
		var transformedUvs = []
		originalUvs.forEach(function(originalUvs, index){
			var transformedUv = originalUvs.clone()
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

THREEx.ArMarkerCache.vertexShader = `    
	varying vec2 vUv;
	void main(){

                // pass the UV to the fragment
		vUv = uv;

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
