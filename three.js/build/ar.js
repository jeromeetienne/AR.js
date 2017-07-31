
var THREEx = THREEx || {}

THREEx.ArBaseControls = function(object3d){
	this.id = THREEx.ArBaseControls.id++

	this.object3d = object3d
	this.object3d.matrixAutoUpdate = false;
	this.object3d.visible = false

	// Events to honor
	// this.dispatchEvent({ type: 'becameVisible' })
	// this.dispatchEvent({ type: 'markerVisible' })	// replace markerFound
	// this.dispatchEvent({ type: 'becameUnVisible' })
}

THREEx.ArBaseControls.id = 0

Object.assign( THREEx.ArBaseControls.prototype, THREE.EventDispatcher.prototype );

//////////////////////////////////////////////////////////////////////////////
//		Functions
//////////////////////////////////////////////////////////////////////////////
/**
 * error catching function for update()
 */
THREEx.ArBaseControls.prototype.update = function(){
	console.assert(false, 'you need to implement your own update')
}

/**
 * error catching function for name()
 */
THREEx.ArBaseControls.prototype.name = function(){
	console.assert(false, 'you need to implement your own .name()')
	return 'Not yet implemented - name()'
}
var THREEx = THREEx || {}

// TODO this is useless - prefere arjs-HitTesting.js

/**
 * - maybe support .onClickFcts in each object3d
 * - seems an easy light layer for clickable object
 * - up to 
 */
THREEx.ARClickability = function(sourceElement){
	this._sourceElement = sourceElement
	// Create cameraPicking
	var fullWidth = parseInt(sourceElement.style.width)
	var fullHeight = parseInt(sourceElement.style.height)
	this._cameraPicking = new THREE.PerspectiveCamera(42, fullWidth / fullHeight, 0.1, 100);	

console.warn('THREEx.ARClickability works only in modelViewMatrix')
console.warn('OBSOLETE OBSOLETE! instead use THREEx.HitTestingPlane or THREEx.HitTestingTango')
}

THREEx.ARClickability.prototype.onResize = function(){
	var sourceElement = this._sourceElement
	var cameraPicking = this._cameraPicking
	
	var fullWidth = parseInt(sourceElement.style.width)
	var fullHeight = parseInt(sourceElement.style.height)
	cameraPicking.aspect = fullWidth / fullHeight;
	cameraPicking.updateProjectionMatrix();
}

THREEx.ARClickability.prototype.computeIntersects = function(domEvent, objects){
	var sourceElement = this._sourceElement
	var cameraPicking = this._cameraPicking

	// compute mouse coordinatge with [-1,1]
	var eventCoords = new THREE.Vector3();
	eventCoords.x =   ( domEvent.layerX / parseInt(sourceElement.style.width)  ) * 2 - 1;
	eventCoords.y = - ( domEvent.layerY / parseInt(sourceElement.style.height) ) * 2 + 1;

	// compute intersections between eventCoords and pickingPlane
	var raycaster = new THREE.Raycaster();
	raycaster.setFromCamera( eventCoords, cameraPicking );
	var intersects = raycaster.intersectObjects( objects )
	
	return intersects
}

THREEx.ARClickability.prototype.update = function(){

}

//////////////////////////////////////////////////////////////////////////////
//		Code Separator
//////////////////////////////////////////////////////////////////////////////

THREEx.ARClickability.tangoPickingPointCloud = function(artoolkitContext, mouseX, mouseY){
	
// THIS IS CRAP!!!! use THREEx.HitTestingTango
	
	var vrDisplay = artoolkitContext._tangoContext.vrDisplay
        if (vrDisplay === null ) return null
        var pointAndPlane = vrDisplay.getPickingPointAndPlaneInPointCloud(mouseX, mouseY)
        if( pointAndPlane == null ) {
                console.warn('Could not retrieve the correct point and plane.')
                return null
        }
	
	// FIXME not sure what this is
	var boundingSphereRadius = 0.01	
	
	// the bigger the number the likeliest it crash chromium-webar

        // Orient and position the model in the picking point according
        // to the picking plane. The offset is half of the model size.
        var object3d = new THREE.Object3D
        THREE.WebAR.positionAndRotateObject3DWithPickingPointAndPlaneInPointCloud(
                pointAndPlane, object3d, boundingSphereRadius
        )
	object3d.rotateZ(-Math.PI/2)

	// return the result
	var result = {}
	result.position = object3d.position
	result.quaternion = object3d.quaternion
	return result
}
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
                transparent: true,
		uniforms: {
			texture: {
				value: videoTexture
			},
                        opacity: {
                                value: 0.5
                        }
		},
		defines: {
			updateInShaderEnabled: updateInShaderEnabled ? 1 : 0,
		}
	});

	var cloakMesh = new THREE.Mesh( geometry, material );
        cloakMesh.rotation.x = -Math.PI/2
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

THREEx.ArMarkerCloak.markerSpaceShaderFunction = '\n'+
'        vec2 transformUvToMarkerSpace(vec2 originalUv){\n'+
'                vec3 transformedUv;\n'+
'                // set transformedUv - from UV coord to clip coord\n'+
'                transformedUv.x = originalUv.x * 2.0 - 1.0;\n'+
'                transformedUv.y = originalUv.y * 2.0 - 1.0;\n'+
'                transformedUv.z = 0.0;\n'+
'\n'+
'		// apply modelViewMatrix and projectionMatrix\n'+
'                transformedUv = (projectionMatrix * modelViewMatrix * vec4( transformedUv, 1.0 ) ).xyz;\n'+
'\n'+
'		// apply perspective\n'+
'		transformedUv.x /= transformedUv.z;\n'+
'		transformedUv.y /= transformedUv.z;\n'+
'\n'+
'                // set back from clip coord to Uv coord\n'+
'                transformedUv.x = transformedUv.x / 2.0 + 0.5;\n'+
'                transformedUv.y = transformedUv.y / 2.0 + 0.5;\n'+
'\n'+
'                // return the result\n'+
'                return transformedUv.xy;\n'+
'        }'

THREEx.ArMarkerCloak.vertexShader = THREEx.ArMarkerCloak.markerSpaceShaderFunction +
'	varying vec2 vUv;\n'+
'\n'+
'	void main(){\n'+
'                // pass the UV to the fragment\n'+
'                #if (updateInShaderEnabled == 1)\n'+
'		        vUv = transformUvToMarkerSpace(uv);\n'+
'                #else\n'+
'		        vUv = uv;\n'+
'                #endif\n'+
'\n'+
'                // compute gl_Position\n'+
'		vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );\n'+
'		gl_Position = projectionMatrix * mvPosition;\n'+
'	}';

THREEx.ArMarkerCloak.fragmentShader = '\n'+
'	varying vec2 vUv;\n'+
'	uniform sampler2D texture;\n'+
'	uniform float opacity;\n'+
'\n'+
'	void main(void){\n'+
'		vec3 color = texture2D( texture, vUv ).rgb;\n'+
'\n'+
'		gl_FragColor = vec4( color, opacity);\n'+
'	}'
var THREEx = THREEx || {}

THREEx.ArMarkerControls = function(context, object3d, parameters){
	var _this = this

	THREEx.ArBaseControls.call(this, object3d)

	this.context = context
	// handle default parameters
	this.parameters = {
		// size of the marker in meter
		size : 1,
		// type of marker - ['pattern', 'barcode', 'unknown' ]
		type : 'unknown',
		// url of the pattern - IIF type='pattern'
		patternUrl : null,
		// value of the barcode - IIF type='barcode'
		barcodeValue : null,
		// change matrix mode - [modelViewMatrix, cameraTransformMatrix]
		changeMatrixMode : 'modelViewMatrix',
		// minimal confidence in the marke recognition - between [0, 1] - default to 1
		minConfidence: 0.6,
	}

	// sanity check
	var possibleValues = ['pattern', 'barcode', 'unknown']
	console.assert(possibleValues.indexOf(this.parameters.type) !== -1, 'illegal value', this.parameters.type)
	var possibleValues = ['modelViewMatrix', 'cameraTransformMatrix' ]
	console.assert(possibleValues.indexOf(this.parameters.changeMatrixMode) !== -1, 'illegal value', this.parameters.changeMatrixMode)


        // create the marker Root
	this.object3d = object3d
	this.object3d.matrixAutoUpdate = false;
	this.object3d.visible = false
	
	//////////////////////////////////////////////////////////////////////////////
	//		setParameters
	//////////////////////////////////////////////////////////////////////////////
	setParameters(parameters)
	function setParameters(parameters){
		if( parameters === undefined )	return
		for( var key in parameters ){
			var newValue = parameters[ key ]

			if( newValue === undefined ){
				console.warn( "THREEx.ArMarkerControls: '" + key + "' parameter is undefined." )
				continue
			}

			var currentValue = _this.parameters[ key ]

			if( currentValue === undefined ){
				console.warn( "THREEx.ArMarkerControls: '" + key + "' is not a property of this material." )
				continue
			}

			_this.parameters[ key ] = newValue
		}
	}

	//////////////////////////////////////////////////////////////////////////////
	//		Code Separator
	//////////////////////////////////////////////////////////////////////////////
	// add this marker to artoolkitsystem
	// TODO rename that .addMarkerControls
	context.addMarker(this)

	if( _this.context.parameters.trackingBackend === 'artoolkit' ){
		this._initArtoolkit()
	}else if( _this.context.parameters.trackingBackend === 'aruco' ){
		// TODO create a ._initAruco
		// put aruco second
		this._arucoPosit = new POS.Posit(this.parameters.size, _this.context.arucoContext.canvas.width)
	}else if( _this.context.parameters.trackingBackend === 'tango' ){
		this._initTango()
	}else console.assert(false)
}

THREEx.ArMarkerControls.prototype = Object.create( THREEx.ArBaseControls.prototype );
THREEx.ArMarkerControls.prototype.constructor = THREEx.ArMarkerControls;

THREEx.ArMarkerControls.prototype.dispose = function(){
	this.context.removeMarker(this)

	// TODO remove the event listener if needed
	// unloadMaker ???
}

//////////////////////////////////////////////////////////////////////////////
//		update controls with new modelViewMatrix
//////////////////////////////////////////////////////////////////////////////

/**
 * When you actually got a new modelViewMatrix, you need to perfom a whole bunch 
 * of things. it is done here.
 */
THREEx.ArMarkerControls.prototype.updateWithModelViewMatrix = function(modelViewMatrix){
	var markerObject3D = this.object3d;

	// mark object as visible
	markerObject3D.visible = true

	if( this.context.parameters.trackingBackend === 'artoolkit' ){
		// apply context._axisTransformMatrix - change artoolkit axis to match usual webgl one
		var tmpMatrix = new THREE.Matrix4().copy(this.context._artoolkitProjectionAxisTransformMatrix)
		tmpMatrix.multiply(modelViewMatrix)
		
		modelViewMatrix.copy(tmpMatrix)		
	}else if( this.context.parameters.trackingBackend === 'aruco' ){
		// ...
	}else if( this.context.parameters.trackingBackend === 'tango' ){
		// ...
	}else console.assert(false)


	if( this.context.parameters.trackingBackend !== 'tango' ){

		// change axis orientation on marker - artoolkit say Z is normal to the marker - ar.js say Y is normal to the marker
		var markerAxisTransformMatrix = new THREE.Matrix4().makeRotationX(Math.PI/2)
		modelViewMatrix.multiply(markerAxisTransformMatrix)
	}

	// change markerObject3D.matrix based on parameters.changeMatrixMode
	if( this.parameters.changeMatrixMode === 'modelViewMatrix' ){
		markerObject3D.matrix.copy(modelViewMatrix)
	}else if( this.parameters.changeMatrixMode === 'cameraTransformMatrix' ){
		markerObject3D.matrix.getInverse( modelViewMatrix )
	}else {
		console.assert(false)
	}

	// decompose - the matrix into .position, .quaternion, .scale
	markerObject3D.matrix.decompose(markerObject3D.position, markerObject3D.quaternion, markerObject3D.scale)

	// dispatchEvent
	this.dispatchEvent( { type: 'markerFound' } );
}

//////////////////////////////////////////////////////////////////////////////
//		utility functions
//////////////////////////////////////////////////////////////////////////////

/**
 * provide a name for a marker 
 * - silly heuristic for now
 * - should be improved
 */
THREEx.ArMarkerControls.prototype.name = function(){
	var name = ''
	name += this.parameters.type;
	if( this.parameters.type === 'pattern' ){
		var url = this.parameters.patternUrl
		var basename = url.replace(/^.*\//g, '')
		name += ' - ' + basename
	}else if( this.parameters.type === 'barcode' ){
		name += ' - ' + this.parameters.barcodeValue
	}else{
		console.assert(false, 'no .name() implemented for this marker controls')
	}
	return name
}

//////////////////////////////////////////////////////////////////////////////
//		init for Artoolkit
//////////////////////////////////////////////////////////////////////////////
THREEx.ArMarkerControls.prototype._initArtoolkit = function(){
	var _this = this

	var artoolkitMarkerId = null

	var delayedInitTimerId = setInterval(function(){
		// check if arController is init
		var arController = _this.context.arController
		if( arController === null )	return
		// stop looping if it is init
		clearInterval(delayedInitTimerId)
		delayedInitTimerId = null
		// launch the _postInitArtoolkit
		postInit()
	}, 1000/50)

	return
	
	function postInit(){
		// check if arController is init
		var arController = _this.context.arController
		console.assert(arController !== null )

		// start tracking this pattern
		if( _this.parameters.type === 'pattern' ){
	                arController.loadMarker(_this.parameters.patternUrl, function(markerId) {
				artoolkitMarkerId = markerId
	                        arController.trackPatternMarkerId(artoolkitMarkerId, _this.parameters.size);
	                });
		}else if( _this.parameters.type === 'barcode' ){
			artoolkitMarkerId = _this.parameters.barcodeValue
			arController.trackBarcodeMarkerId(artoolkitMarkerId, _this.parameters.size);
		}else if( _this.parameters.type === 'unknown' ){
			artoolkitMarkerId = null
		}else{
			console.log(false, 'invalid marker type', _this.parameters.type)
		}

		// listen to the event
		arController.addEventListener('getMarker', function(event){
			if( event.data.type === artoolkit.PATTERN_MARKER && _this.parameters.type === 'pattern' ){
				if( artoolkitMarkerId === null )	return
				if( event.data.marker.idPatt === artoolkitMarkerId ) onMarkerFound(event)
			}else if( event.data.type === artoolkit.BARCODE_MARKER && _this.parameters.type === 'barcode' ){
				// console.log('BARCODE_MARKER idMatrix', event.data.marker.idMatrix, artoolkitMarkerId )
				if( artoolkitMarkerId === null )	return
				if( event.data.marker.idMatrix === artoolkitMarkerId )  onMarkerFound(event)
			}else if( event.data.type === artoolkit.UNKNOWN_MARKER && _this.parameters.type === 'unknown'){
				onMarkerFound(event)
			}
		})
		
	}

	function onMarkerFound(event){
		// honor his.parameters.minConfidence
		if( event.data.type === artoolkit.PATTERN_MARKER && event.data.marker.cfPatt < _this.parameters.minConfidence )	return
		if( event.data.type === artoolkit.BARCODE_MARKER && event.data.marker.cfMatt < _this.parameters.minConfidence )	return

		var modelViewMatrix = new THREE.Matrix4().fromArray(event.data.matrix)
		_this.updateWithModelViewMatrix(modelViewMatrix)
	}
}

//////////////////////////////////////////////////////////////////////////////
//		aruco specific
//////////////////////////////////////////////////////////////////////////////
THREEx.ArMarkerControls.prototype._initAruco = function(){
	this._arucoPosit = new POS.Posit(this.parameters.size, _this.context.arucoContext.canvas.width)
}

//////////////////////////////////////////////////////////////////////////////
//		init for Artoolkit
//////////////////////////////////////////////////////////////////////////////
THREEx.ArMarkerControls.prototype._initTango = function(){
	var _this = this
	console.log('init tango ArMarkerControls')
}
var THREEx = THREEx || {}

THREEx.ArMarkerHelper = function(markerControls){
	this.object3d = new THREE.Group

	var mesh = new THREE.AxisHelper()
	this.object3d.add(mesh)

	var text = markerControls.id
	// debugger
	// var text = markerControls.parameters.patternUrl.slice(-1).toUpperCase();

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
var THREEx = THREEx || {}

/**
 * - lerp position/quaternino/scale
 * - minDelayDetected
 * - minDelayUndetected
 * @param {[type]} object3d   [description]
 * @param {[type]} parameters [description]
 */
THREEx.ArSmoothedControls = function(object3d, parameters){
	var _this = this
	
	THREEx.ArBaseControls.call(this, object3d)
	
	// copy parameters
	this.object3d.visible = false
	
	this._lastLerpStepAt = null
	this._visibleStartedAt = null
	this._unvisibleStartedAt = null

	// handle default parameters
	parameters = parameters || {}
	this.parameters = {
		// lerp coeficient for the position - between [0,1] - default to 1
		lerpPosition: 0.8,
		// lerp coeficient for the quaternion - between [0,1] - default to 1
		lerpQuaternion: 0.2,
		// lerp coeficient for the scale - between [0,1] - default to 1
		lerpScale: 0.7,
		// delay for lerp fixed steps - in seconds - default to 1/120
		lerpStepDelay: 1/60,
		// minimum delay the sub-control must be visible before this controls become visible - default to 0 seconds
		minVisibleDelay: 0.0,
		// minimum delay the sub-control must be unvisible before this controls become unvisible - default to 0 seconds
		minUnvisibleDelay: 0.2,
	}
	
	//////////////////////////////////////////////////////////////////////////////
	//		setParameters
	//////////////////////////////////////////////////////////////////////////////
	setParameters(parameters)
	function setParameters(parameters){
		if( parameters === undefined )	return
		for( var key in parameters ){
			var newValue = parameters[ key ]

			if( newValue === undefined ){
				console.warn( "THREEx.ArSmoothedControls: '" + key + "' parameter is undefined." )
				continue
			}

			var currentValue = _this.parameters[ key ]

			if( currentValue === undefined ){
				console.warn( "THREEx.ArSmoothedControls: '" + key + "' is not a property of this material." )
				continue
			}

			_this.parameters[ key ] = newValue
		}
	}
}
	
THREEx.ArSmoothedControls.prototype = Object.create( THREEx.ArBaseControls.prototype );
THREEx.ArSmoothedControls.prototype.constructor = THREEx.ArSmoothedControls;

//////////////////////////////////////////////////////////////////////////////
//		update function
//////////////////////////////////////////////////////////////////////////////

THREEx.ArSmoothedControls.prototype.update = function(targetObject3d){
	var object3d = this.object3d
	var parameters = this.parameters
	var wasVisible = object3d.visible
	var present = performance.now()/1000


	//////////////////////////////////////////////////////////////////////////////
	//		handle object3d.visible with minVisibleDelay/minUnvisibleDelay
	//////////////////////////////////////////////////////////////////////////////
	if( targetObject3d.visible === false )	this._visibleStartedAt = null
	if( targetObject3d.visible === true )	this._unvisibleStartedAt = null

	if( targetObject3d.visible === true && this._visibleStartedAt === null )	this._visibleStartedAt = present
	if( targetObject3d.visible === false && this._unvisibleStartedAt === null )	this._unvisibleStartedAt = present

	if( wasVisible === false && targetObject3d.visible === true ){
		var visibleFor = present - this._visibleStartedAt
		if( visibleFor >= this.parameters.minVisibleDelay ){
			object3d.visible = true
			snapDirectlyToTarget()
		}
		// console.log('visibleFor', visibleFor)
	}

	if( wasVisible === true && targetObject3d.visible === false ){
		var unvisibleFor = present - this._unvisibleStartedAt
		if( unvisibleFor >= this.parameters.minUnvisibleDelay ){
			object3d.visible = false			
		}
	}
	
	//////////////////////////////////////////////////////////////////////////////
	//		apply lerp on positon/quaternion/scale
	//////////////////////////////////////////////////////////////////////////////

	// apply lerp steps - require fix time steps to behave the same no matter the fps
	if( this._lastLerpStepAt === null ){
		applyOneSlerpStep()
		this._lastLerpStepAt = present
	}else{
		var nStepsToDo = Math.floor( (present - this._lastLerpStepAt)/this.parameters.lerpStepDelay )
		for(var i = 0; i < nStepsToDo; i++){
			applyOneSlerpStep()
			this._lastLerpStepAt += this.parameters.lerpStepDelay
		}
	}

	// disable the lerp by directly copying targetObject3d position/quaternion/scale
	if( false ){		
		snapDirectlyToTarget()
	}

	// update the matrix
	this.object3d.updateMatrix()

	//////////////////////////////////////////////////////////////////////////////
	//		honor becameVisible/becameUnVisible event
	//////////////////////////////////////////////////////////////////////////////
	// honor becameVisible event
	if( wasVisible === false && object3d.visible === true ){
		this.dispatchEvent({ type: 'becameVisible' })
	}
	// honor becameUnVisible event
	if( wasVisible === true && object3d.visible === false ){
		this.dispatchEvent({ type: 'becameUnVisible' })
	}
	return

	function snapDirectlyToTarget(){
		object3d.position.copy( targetObject3d.position )
		object3d.quaternion.copy( targetObject3d.quaternion )
		object3d.scale.copy( targetObject3d.scale )
	}	
	
	function applyOneSlerpStep(){
		object3d.position.lerp(targetObject3d.position, parameters.lerpPosition)
		object3d.quaternion.slerp(targetObject3d.quaternion, parameters.lerpQuaternion)
		object3d.scale.lerp(targetObject3d.scale, parameters.lerpScale)
	}
}
var ARjs = ARjs || {}
var THREEx = THREEx || {}

ARjs.Context = THREEx.ArToolkitContext = function(parameters){
	var _this = this
	
	_this._updatedAt = null
	
	// handle default parameters
	this.parameters = {
		// AR backend - ['artoolkit', 'aruco', 'tango']
		trackingBackend: 'artoolkit',
		// debug - true if one should display artoolkit debug canvas, false otherwise
		debug: false,
		// the mode of detection - ['color', 'color_and_matrix', 'mono', 'mono_and_matrix']
		detectionMode: 'mono',
		// type of matrix code - valid iif detectionMode end with 'matrix' - [3x3, 3x3_HAMMING63, 3x3_PARITY65, 4x4, 4x4_BCH_13_9_3, 4x4_BCH_13_5_5]
		matrixCodeType: '3x3',
		
		// url of the camera parameters
		cameraParametersUrl: ARjs.Context.baseURL + 'parameters/camera_para.dat',

		// tune the maximum rate of pose detection in the source image
		maxDetectionRate: 60,
		// resolution of at which we detect pose in the source image
		canvasWidth: 640,
		canvasHeight: 480,
		
		// enable image smoothing or not for canvas copy - default to true
		// https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/imageSmoothingEnabled
		imageSmoothingEnabled : false,
	}
	// parameters sanity check
	console.assert(['artoolkit', 'aruco', 'tango'].indexOf(this.parameters.trackingBackend) !== -1, 'invalid parameter trackingBackend', this.parameters.trackingBackend)
	console.assert(['color', 'color_and_matrix', 'mono', 'mono_and_matrix'].indexOf(this.parameters.detectionMode) !== -1, 'invalid parameter detectionMode', this.parameters.detectionMode)
	
        this.arController = null;
        this.arucoContext = null;
	
	_this.initialized = false


	this._arMarkersControls = []
	
	//////////////////////////////////////////////////////////////////////////////
	//		setParameters
	//////////////////////////////////////////////////////////////////////////////
	setParameters(parameters)
	function setParameters(parameters){
		if( parameters === undefined )	return
		for( var key in parameters ){
			var newValue = parameters[ key ]

			if( newValue === undefined ){
				console.warn( "THREEx.ArToolkitContext: '" + key + "' parameter is undefined." )
				continue
			}

			var currentValue = _this.parameters[ key ]

			if( currentValue === undefined ){
				console.warn( "THREEx.ArToolkitContext: '" + key + "' is not a property of this material." )
				continue
			}

			_this.parameters[ key ] = newValue
		}
	}
}

Object.assign( ARjs.Context.prototype, THREE.EventDispatcher.prototype );

// ARjs.Context.baseURL = '../'
// default to github page
ARjs.Context.baseURL = 'https://jeromeetienne.github.io/AR.js/three.js/'
ARjs.Context.REVISION = '1.0.1-dev'



/**
 * Create a default camera for this trackingBackend
 * @param {string} trackingBackend - the tracking to user
 * @return {THREE.Camera} the created camera
 */
ARjs.Context.createDefaultCamera = function( trackingBackend ){
	console.assert(false, 'use ARjs.Utils.createDefaultCamera instead')
	// Create a camera
	if( trackingBackend === 'artoolkit' ){
		var camera = new THREE.Camera();
	}else if( trackingBackend === 'aruco' ){
		var camera = new THREE.PerspectiveCamera(42, renderer.domElement.width / renderer.domElement.height, 0.01, 100);
	}else if( trackingBackend === 'tango' ){
		var camera = new THREE.PerspectiveCamera(42, renderer.domElement.width / renderer.domElement.height, 0.01, 100);
	}else console.assert(false)
	return camera
}


//////////////////////////////////////////////////////////////////////////////
//		init functions
//////////////////////////////////////////////////////////////////////////////
ARjs.Context.prototype.init = function(onCompleted){
	var _this = this
	if( this.parameters.trackingBackend === 'artoolkit' ){
		this._initArtoolkit(done)
	}else if( this.parameters.trackingBackend === 'aruco' ){
		this._initAruco(done)
	}else if( this.parameters.trackingBackend === 'tango' ){
		this._initTango(done)
	}else console.assert(false)
	return
	
	function done(){
		// dispatch event
		_this.dispatchEvent({
			type: 'initialized'
		});

		_this.initialized = true
		
		onCompleted && onCompleted()
	}

}
////////////////////////////////////////////////////////////////////////////////
//          update function
////////////////////////////////////////////////////////////////////////////////
ARjs.Context.prototype.update = function(srcElement){

	// be sure arController is fully initialized
        if(this.parameters.trackingBackend === 'artoolkit' && this.arController === null) return false;

	// honor this.parameters.maxDetectionRate
	var present = performance.now()
	if( this._updatedAt !== null && present - this._updatedAt < 1000/this.parameters.maxDetectionRate ){
		return false
	}
	this._updatedAt = present

	// mark all markers to invisible before processing this frame
	this._arMarkersControls.forEach(function(markerControls){
		markerControls.object3d.visible = false
	})

	// process this frame
	if(this.parameters.trackingBackend === 'artoolkit'){
		this._updateArtoolkit(srcElement)		
	}else if( this.parameters.trackingBackend === 'aruco' ){
		this._updateAruco(srcElement)
	}else if( this.parameters.trackingBackend === 'tango' ){
		this._updateTango(srcElement)
	}else{
		console.assert(false)
	}

	// dispatch event
	this.dispatchEvent({
		type: 'sourceProcessed'
	});


	// return true as we processed the frame
	return true;
}

////////////////////////////////////////////////////////////////////////////////
//          Add/Remove markerControls
////////////////////////////////////////////////////////////////////////////////
ARjs.Context.prototype.addMarker = function(arMarkerControls){
	console.assert(arMarkerControls instanceof THREEx.ArMarkerControls)
	this._arMarkersControls.push(arMarkerControls)
}

ARjs.Context.prototype.removeMarker = function(arMarkerControls){
	console.assert(arMarkerControls instanceof THREEx.ArMarkerControls)
	// console.log('remove marker for', arMarkerControls)
	var index = this.arMarkerControlss.indexOf(artoolkitMarker);
	console.assert(index !== index )
	this._arMarkersControls.splice(index, 1)
}

//////////////////////////////////////////////////////////////////////////////
//		artoolkit specific
//////////////////////////////////////////////////////////////////////////////
ARjs.Context.prototype._initArtoolkit = function(onCompleted){
        var _this = this

	// set this._artoolkitProjectionAxisTransformMatrix to change artoolkit projection matrix axis to match usual webgl one
	this._artoolkitProjectionAxisTransformMatrix = new THREE.Matrix4()
	this._artoolkitProjectionAxisTransformMatrix.multiply(new THREE.Matrix4().makeRotationY(Math.PI))
	this._artoolkitProjectionAxisTransformMatrix.multiply(new THREE.Matrix4().makeRotationZ(Math.PI))

	// get cameraParameters
        var cameraParameters = new ARCameraParam(_this.parameters.cameraParametersUrl, function(){
        	// init controller
                var arController = new ARController(_this.parameters.canvasWidth, _this.parameters.canvasHeight, cameraParameters);
                _this.arController = arController
                
		// honor this.parameters.imageSmoothingEnabled
		arController.ctx.mozImageSmoothingEnabled = _this.parameters.imageSmoothingEnabled;
		arController.ctx.webkitImageSmoothingEnabled = _this.parameters.imageSmoothingEnabled;
		arController.ctx.msImageSmoothingEnabled = _this.parameters.imageSmoothingEnabled;
		arController.ctx.imageSmoothingEnabled = _this.parameters.imageSmoothingEnabled;			
 		
		// honor this.parameters.debug
                if( _this.parameters.debug === true ){
			arController.debugSetup();
			arController.canvas.style.position = 'absolute'
			arController.canvas.style.top = '0px'
			arController.canvas.style.opacity = '0.6'
			arController.canvas.style.pointerEvents = 'none'
			arController.canvas.style.zIndex = '-1'
		}

		// setPatternDetectionMode
		var detectionModes = {
			'color'			: artoolkit.AR_TEMPLATE_MATCHING_COLOR,
			'color_and_matrix'	: artoolkit.AR_TEMPLATE_MATCHING_COLOR_AND_MATRIX,
			'mono'			: artoolkit.AR_TEMPLATE_MATCHING_MONO,
			'mono_and_matrix'	: artoolkit.AR_TEMPLATE_MATCHING_MONO_AND_MATRIX,
		}
		var detectionMode = detectionModes[_this.parameters.detectionMode]
		console.assert(detectionMode !== undefined)
		arController.setPatternDetectionMode(detectionMode);

		// setMatrixCodeType
		var matrixCodeTypes = {
			'3x3'		: artoolkit.AR_MATRIX_CODE_3x3,
			'3x3_HAMMING63'	: artoolkit.AR_MATRIX_CODE_3x3_HAMMING63,
			'3x3_PARITY65'	: artoolkit.AR_MATRIX_CODE_3x3_PARITY65,
			'4x4'		: artoolkit.AR_MATRIX_CODE_4x4,
			'4x4_BCH_13_9_3': artoolkit.AR_MATRIX_CODE_4x4_BCH_13_9_3,
			'4x4_BCH_13_5_5': artoolkit.AR_MATRIX_CODE_4x4_BCH_13_5_5,
		}
		var matrixCodeType = matrixCodeTypes[_this.parameters.matrixCodeType]
		console.assert(matrixCodeType !== undefined)
		arController.setMatrixCodeType(matrixCodeType);
		

		// set thresholding in artoolkit
		// this seems to be the default
		// arController.setThresholdMode(artoolkit.AR_LABELING_THRESH_MODE_MANUAL)
		// adatative consume a LOT of cpu...
		// arController.setThresholdMode(artoolkit.AR_LABELING_THRESH_MODE_AUTO_ADAPTIVE)
		// arController.setThresholdMode(artoolkit.AR_LABELING_THRESH_MODE_AUTO_OTSU)

		// notify
                onCompleted()                
        })		
	return this
}

/**
 * return the projection matrix
 */
ARjs.Context.prototype.getProjectionMatrix = function(srcElement){
	
	
// FIXME rename this function to say it is artoolkit specific - getArtoolkitProjectMatrix
// keep a backward compatibility with a console.warn
	
	
	if( this.parameters.trackingBackend === 'aruco' ){
		console.assert(false, 'dont call this function with aruco')
	}else if( this.parameters.trackingBackend === 'artoolkit' ){
		console.assert(this.arController, 'arController MUST be initialized to call this function')
		// get projectionMatrixArr from artoolkit
		var projectionMatrixArr = this.arController.getCameraMatrix();
		var projectionMatrix = new THREE.Matrix4().fromArray(projectionMatrixArr)		
	}else console.assert(false)
		
	// apply context._axisTransformMatrix - change artoolkit axis to match usual webgl one
	projectionMatrix.multiply(this._artoolkitProjectionAxisTransformMatrix)
	
	// return the result
	return projectionMatrix
}

ARjs.Context.prototype._updateArtoolkit = function(srcElement){
	this.arController.process(srcElement)
}

//////////////////////////////////////////////////////////////////////////////
//		aruco specific 
//////////////////////////////////////////////////////////////////////////////
ARjs.Context.prototype._initAruco = function(onCompleted){
	this.arucoContext = new THREEx.ArucoContext()
	
	// honor this.parameters.canvasWidth/.canvasHeight
	this.arucoContext.canvas.width = this.parameters.canvasWidth
	this.arucoContext.canvas.height = this.parameters.canvasHeight

	// honor this.parameters.imageSmoothingEnabled
	var context = this.arucoContext.canvas.getContext('2d')
	// context.mozImageSmoothingEnabled = this.parameters.imageSmoothingEnabled;
	context.webkitImageSmoothingEnabled = this.parameters.imageSmoothingEnabled;
	context.msImageSmoothingEnabled = this.parameters.imageSmoothingEnabled;
	context.imageSmoothingEnabled = this.parameters.imageSmoothingEnabled;			

	
	setTimeout(function(){
		onCompleted()
	}, 0)
}


ARjs.Context.prototype._updateAruco = function(srcElement){
	// console.log('update aruco here')
	var _this = this
	var arMarkersControls = this._arMarkersControls
        var detectedMarkers = this.arucoContext.detect(srcElement)
	
	detectedMarkers.forEach(function(detectedMarker){
		var foundControls = null
		for(var i = 0; i < arMarkersControls.length; i++){
			console.assert( arMarkersControls[i].parameters.type === 'barcode' )
			if( arMarkersControls[i].parameters.barcodeValue === detectedMarker.id ){
				foundControls = arMarkersControls[i]
				break;
			}
		}
		if( foundControls === null )	return

		var tmpObject3d = new THREE.Object3D
                _this.arucoContext.updateObject3D(tmpObject3d, foundControls._arucoPosit, foundControls.parameters.size, detectedMarker);
		tmpObject3d.updateMatrix()

		foundControls.updateWithModelViewMatrix(tmpObject3d.matrix)
	})
}

//////////////////////////////////////////////////////////////////////////////
//		tango specific 
//////////////////////////////////////////////////////////////////////////////
ARjs.Context.prototype._initTango = function(onCompleted){
	var _this = this
	// check webvr is available
	if (navigator.getVRDisplays){
		// do nothing
	} else if (navigator.getVRDevices){
		alert("Your browser supports WebVR but not the latest version. See <a href='http://webvr.info'>webvr.info</a> for more info.");
	} else {
		alert("Your browser does not support WebVR. See <a href='http://webvr.info'>webvr.info</a> for assistance.");
	}


	this._tangoContext = {
		vrDisplay: null,
		vrPointCloud: null,
		frameData: new VRFrameData(),
	}
	

	// get vrDisplay
	navigator.getVRDisplays().then(function (vrDisplays){
		if( vrDisplays.length === 0 )	alert('no vrDisplays available')
		var vrDisplay = _this._tangoContext.vrDisplay = vrDisplays[0]

		console.log('vrDisplays.displayName :', vrDisplay.displayName)

		// init vrPointCloud
		if( vrDisplay.displayName === "Tango VR Device" ){
                	_this._tangoContext.vrPointCloud = new THREE.WebAR.VRPointCloud(vrDisplay, true)
		}

		// NOTE it doesnt seem necessary and it fails on tango
		// var canvasElement = document.createElement('canvas')
		// document.body.appendChild(canvasElement)
		// _this._tangoContext.requestPresent([{ source: canvasElement }]).then(function(){
		// 	console.log('vrdisplay request accepted')
		// });

		onCompleted()
	});
}


ARjs.Context.prototype._updateTango = function(srcElement){
	// console.log('update aruco here')
	var _this = this
	var arMarkersControls = this._arMarkersControls
	var tangoContext= this._tangoContext
	var vrDisplay = this._tangoContext.vrDisplay

	// check vrDisplay is already initialized
	if( vrDisplay === null )	return


        // Update the point cloud. Only if the point cloud will be shown the geometry is also updated.
	if( vrDisplay.displayName === "Tango VR Device" ){
	        var showPointCloud = true
		var pointsToSkip = 0
	        _this._tangoContext.vrPointCloud.update(showPointCloud, pointsToSkip, true)                        		
	}


	if( this._arMarkersControls.length === 0 )	return

	// TODO here do a fake search on barcode/1001 ?

	var foundControls = this._arMarkersControls[0]
	
	var frameData = this._tangoContext.frameData

	// read frameData
	vrDisplay.getFrameData(frameData);

	if( frameData.pose.position === null )		return
	if( frameData.pose.orientation === null )	return

	// create cameraTransformMatrix
	var position = new THREE.Vector3().fromArray(frameData.pose.position)
	var quaternion = new THREE.Quaternion().fromArray(frameData.pose.orientation)
	var scale = new THREE.Vector3(1,1,1)
	var cameraTransformMatrix = new THREE.Matrix4().compose(position, quaternion, scale)
	// compute modelViewMatrix from cameraTransformMatrix
	var modelViewMatrix = new THREE.Matrix4()
	modelViewMatrix.getInverse( cameraTransformMatrix )	

	foundControls.updateWithModelViewMatrix(modelViewMatrix)
		
	// console.log('position', position)
	// if( position.x !== 0 ||  position.y !== 0 ||  position.z !== 0 ){		
	// 	console.log('vrDisplay tracking')
	// }else{
	// 	console.log('vrDisplay NOT tracking')
	// }

}
var ARjs = ARjs || {}
var THREEx = THREEx || {}

/**
 * ArToolkitProfile helps you build parameters for artoolkit
 * - it is fully independent of the rest of the code
 * - all the other classes are still expecting normal parameters
 * - you can use this class to understand how to tune your specific usecase
 * - it is made to help people to build parameters without understanding all the underlying details.
 */
ARjs.Profile = THREEx.ArToolkitProfile = function(){
	this.reset()

	this.performance('default')
}


ARjs.Profile.prototype._guessPerformanceLabel = function() {
	var isMobile = navigator.userAgent.match(/Android/i)
			|| navigator.userAgent.match(/webOS/i)
			|| navigator.userAgent.match(/iPhone/i)
			|| navigator.userAgent.match(/iPad/i)
			|| navigator.userAgent.match(/iPod/i)
			|| navigator.userAgent.match(/BlackBerry/i)
			|| navigator.userAgent.match(/Windows Phone/i)
			? true : false 
	if( isMobile === true ){
		return 'phone-normal'
	}
	return 'desktop-normal'
}

//////////////////////////////////////////////////////////////////////////////
//		Code Separator
//////////////////////////////////////////////////////////////////////////////

/**
 * reset all parameters
 */
ARjs.Profile.prototype.reset = function () {
	this.sourceParameters = {
		// to read from the webcam 
		sourceType : 'webcam',
	}

	this.contextParameters = {
		cameraParametersUrl: THREEx.ArToolkitContext.baseURL + '../data/data/camera_para.dat',
		detectionMode: 'mono',
	}
	this.defaultMarkerParameters = {
		type : 'pattern',
		patternUrl : THREEx.ArToolkitContext.baseURL + '../data/data/patt.hiro',
		changeMatrixMode: 'modelViewMatrix',
	}
	return this
};

//////////////////////////////////////////////////////////////////////////////
//		Performance
//////////////////////////////////////////////////////////////////////////////



ARjs.Profile.prototype.performance = function(label) {

	if( label === 'default' ){
		label = this._guessPerformanceLabel()
	}

	if( label === 'desktop-fast' ){
		this.contextParameters.canvasWidth = 640*3
		this.contextParameters.canvasHeight = 480*3

		this.contextParameters.maxDetectionRate = 30
	}else if( label === 'desktop-normal' ){
		this.contextParameters.canvasWidth = 640
		this.contextParameters.canvasHeight = 480

		this.contextParameters.maxDetectionRate = 60
	}else if( label === 'phone-normal' ){
		this.contextParameters.canvasWidth = 80*4
		this.contextParameters.canvasHeight = 60*4

		this.contextParameters.maxDetectionRate = 30
	}else if( label === 'phone-slow' ){
		this.contextParameters.canvasWidth = 80*3
		this.contextParameters.canvasHeight = 60*3

		this.contextParameters.maxDetectionRate = 30		
	}else {
		console.assert(false, 'unknonwn label '+label)
	}
	return this
}

//////////////////////////////////////////////////////////////////////////////
//		Marker
//////////////////////////////////////////////////////////////////////////////


ARjs.Profile.prototype.defaultMarker = function (trackingBackend) {
	trackingBackend = trackingBackend || this.contextParameters.trackingBackend

	if( trackingBackend === 'artoolkit' ){
		this.contextParameters.detectionMode = 'mono'
		this.defaultMarkerParameters.type = 'pattern'
		this.defaultMarkerParameters.patternUrl = THREEx.ArToolkitContext.baseURL + '../data/data/patt.hiro'
	}else if( trackingBackend === 'aruco' ){
		this.contextParameters.detectionMode = 'mono'
		this.defaultMarkerParameters.type = 'barcode'
		this.defaultMarkerParameters.barcodeValue = 1001
	}else if( trackingBackend === 'tango' ){
		// FIXME temporary placeholder - to reevaluate later
		this.defaultMarkerParameters.type = 'barcode'
		this.defaultMarkerParameters.barcodeValue = 1001
	}else console.assert(false)

	return this
}
//////////////////////////////////////////////////////////////////////////////
//		Source
//////////////////////////////////////////////////////////////////////////////
ARjs.Profile.prototype.sourceWebcam = function () {
	this.sourceParameters.sourceType = 'webcam'
	delete this.sourceParameters.sourceUrl
	return this
}

ARjs.Profile.prototype.sourceVideo = function (url) {
	this.sourceParameters.sourceType = 'video'
	this.sourceParameters.sourceUrl = url
	return this
}

ARjs.Profile.prototype.sourceImage = function (url) {
	this.sourceParameters.sourceType = 'image'
	this.sourceParameters.sourceUrl = url
	return this
}

//////////////////////////////////////////////////////////////////////////////
//		trackingBackend
//////////////////////////////////////////////////////////////////////////////
ARjs.Profile.prototype.trackingBackend = function (trackingBackend) {
	console.warn('stop profile.trackingBackend() obsolete function. use .trackingMethod instead')
	this.contextParameters.trackingBackend = trackingBackend
	return this
}

//////////////////////////////////////////////////////////////////////////////
//		trackingBackend
//////////////////////////////////////////////////////////////////////////////
ARjs.Profile.prototype.changeMatrixMode = function (changeMatrixMode) {
	this.defaultMarkerParameters.changeMatrixMode = changeMatrixMode
	return this
}

//////////////////////////////////////////////////////////////////////////////
//		trackingBackend
//////////////////////////////////////////////////////////////////////////////
ARjs.Profile.prototype.trackingMethod = function (trackingMethod) {
	var data = ARjs.Utils.parseTrackingMethod(trackingMethod)
	this.defaultMarkerParameters.markersAreaEnabled = data.markersAreaEnabled
	this.contextParameters.trackingBackend = data.trackingBackend
	
	return this
}

/**
 * check if the profile is valid. Throw an exception is not valid
 */
ARjs.Profile.prototype.checkIfValid = function () {
	if( this.contextParameters.trackingBackend === 'tango' ){
		this.sourceImage(THREEx.ArToolkitContext.baseURL + '../data/images/img.jpg')
	}
	return this
}
var ARjs = ARjs || {}
var THREEx = THREEx || {}

ARjs.Source = THREEx.ArToolkitSource = function(parameters){	
	var _this = this

	this.ready = false
        this.domElement = null

	// handle default parameters
	this.parameters = {
		// type of source - ['webcam', 'image', 'video']
		sourceType : 'webcam',
		// url of the source - valid if sourceType = image|video
		sourceUrl : null,
		
		// resolution of at which we initialize in the source image
		sourceWidth: 640,
		sourceHeight: 480,
		// resolution displayed for the source 
		displayWidth: 640,
		displayHeight: 480,
	}
	//////////////////////////////////////////////////////////////////////////////
	//		setParameters
	//////////////////////////////////////////////////////////////////////////////
	setParameters(parameters)
	function setParameters(parameters){
		if( parameters === undefined )	return
		for( var key in parameters ){
			var newValue = parameters[ key ]

			if( newValue === undefined ){
				console.warn( "THREEx.ArToolkitSource: '" + key + "' parameter is undefined." )
				continue
			}

			var currentValue = _this.parameters[ key ]

			if( currentValue === undefined ){
				console.warn( "THREEx.ArToolkitSource: '" + key + "' is not a property of this material." )
				continue
			}

			_this.parameters[ key ] = newValue
		}
	}	
}

//////////////////////////////////////////////////////////////////////////////
//		Code Separator
//////////////////////////////////////////////////////////////////////////////
ARjs.Source.prototype.init = function(onReady, onError){
	var _this = this

        if( this.parameters.sourceType === 'image' ){
                var domElement = this._initSourceImage(onSourceReady, onError)                        
        }else if( this.parameters.sourceType === 'video' ){
                var domElement = this._initSourceVideo(onSourceReady, onError)                        
        }else if( this.parameters.sourceType === 'webcam' ){
                // var domElement = this._initSourceWebcamOld(onSourceReady)                        
                var domElement = this._initSourceWebcam(onSourceReady, onError)                        
        }else{
                console.assert(false)
        }

	// attach
        this.domElement = domElement
        this.domElement.style.position = 'absolute'
        this.domElement.style.top = '0px'
        this.domElement.style.left = '0px'
        this.domElement.style.zIndex = '-2'

	return this
        function onSourceReady(){
		document.body.appendChild(_this.domElement);

		_this.ready = true

		onReady && onReady()
        }
} 

////////////////////////////////////////////////////////////////////////////////
//          init image source
////////////////////////////////////////////////////////////////////////////////


ARjs.Source.prototype._initSourceImage = function(onReady) {
	// TODO make it static
        var domElement = document.createElement('img')
	domElement.src = this.parameters.sourceUrl

	domElement.width = this.parameters.sourceWidth
	domElement.height = this.parameters.sourceHeight
	domElement.style.width = this.parameters.displayWidth+'px'
	domElement.style.height = this.parameters.displayHeight+'px'

	// wait until the video stream is ready
	var interval = setInterval(function() {
		if (!domElement.naturalWidth)	return;
		onReady()
		clearInterval(interval)
	}, 1000/50);

	return domElement                
}

////////////////////////////////////////////////////////////////////////////////
//          init video source
////////////////////////////////////////////////////////////////////////////////


ARjs.Source.prototype._initSourceVideo = function(onReady) {
	// TODO make it static
	var domElement = document.createElement('video');
	domElement.src = this.parameters.sourceUrl

	domElement.style.objectFit = 'initial'

	domElement.autoplay = true;
	domElement.webkitPlaysinline = true;
	domElement.controls = false;
	domElement.loop = true;
	domElement.muted = true

	// trick to trigger the video on android
	document.body.addEventListener('click', function onClick(){
		document.body.removeEventListener('click', onClick);
		domElement.play()
	})

	domElement.width = this.parameters.sourceWidth
	domElement.height = this.parameters.sourceHeight
	domElement.style.width = this.parameters.displayWidth+'px'
	domElement.style.height = this.parameters.displayHeight+'px'
	
	// wait until the video stream is ready
	var interval = setInterval(function() {
		if (!domElement.videoWidth)	return;
		onReady()
		clearInterval(interval)
	}, 1000/50);
	return domElement
}

////////////////////////////////////////////////////////////////////////////////
//          handle webcam source
////////////////////////////////////////////////////////////////////////////////

ARjs.Source.prototype._initSourceWebcam = function(onReady, onError) {
	var _this = this

	// init default value
	onError = onError || function(error){	
		alert('Webcam Error\nName: '+error.name + '\nMessage: '+error.message)
	}

	var domElement = document.createElement('video');
	domElement.setAttribute('autoplay', '');
	domElement.setAttribute('muted', '');
	domElement.setAttribute('playsinline', '');
	domElement.style.width = this.parameters.displayWidth+'px'
	domElement.style.height = this.parameters.displayHeight+'px'

	// check API is available
	if (navigator.mediaDevices === undefined 
			|| navigator.mediaDevices.enumerateDevices === undefined 
			|| navigator.mediaDevices.getUserMedia === undefined  ){
		onError({
			name: '',
			message: 'WebRTC issue! navigator.mediaDevices.enumerateDevices not present in your browser'
		})
		return
	}

	// get available devices
	navigator.mediaDevices.enumerateDevices().then(function(devices) {
                var userMediaConstraints = {
			audio: false,
			video: {
				facingMode: 'environment',
				width: {
					ideal: _this.parameters.sourceWidth,
					// min: 1024,
					// max: 1920
				},
				height: {
					ideal: _this.parameters.sourceHeight,
					// min: 776,
					// max: 1080
				}
		  	}
                }
		// get a device which satisfy the constraints
		navigator.mediaDevices.getUserMedia(userMediaConstraints).then(function success(stream) {
			// set the .src of the domElement
			domElement.srcObject = stream;
			// to start the video, when it is possible to start it only on userevent. like in android
			document.body.addEventListener('click', function(){
				domElement.play();
			})
			// domElement.play();

// TODO listen to loadedmetadata instead
			// wait until the video stream is ready
			var interval = setInterval(function() {
				if (!domElement.videoWidth)	return;
				onReady()
				clearInterval(interval)
			}, 1000/50);
		}).catch(function(error) {
			onError({
				name: error.name,
				message: error.message
			});
		});
	}).catch(function(error) {
		onError({
			message: error.message
		});
	});

	return domElement
}

//////////////////////////////////////////////////////////////////////////////
//		Handle Mobile Torch
//////////////////////////////////////////////////////////////////////////////
ARjs.Source.prototype.hasMobileTorch = function(){
	var stream = arToolkitSource.domElement.srcObject
	if( stream instanceof MediaStream === false )	return false

	if( this._currentTorchStatus === undefined ){
		this._currentTorchStatus = false
	}

	var videoTrack = stream.getVideoTracks()[0];

	// if videoTrack.getCapabilities() doesnt exist, return false now
	if( videoTrack.getCapabilities === undefined )	return false

	var capabilities = videoTrack.getCapabilities()
	
	return capabilities.torch ? true : false
}

/**
 * toggle the flash/torch of the mobile fun if applicable.
 * Great post about it https://www.oberhofer.co/mediastreamtrack-and-its-capabilities/
 */
ARjs.Source.prototype.toggleMobileTorch = function(){
	// sanity check
	console.assert(this.hasMobileTorch() === true)
		
	var stream = arToolkitSource.domElement.srcObject
	if( stream instanceof MediaStream === false ){
		alert('enabling mobile torch is available only on webcam')
		return
	}

	if( this._currentTorchStatus === undefined ){
		this._currentTorchStatus = false
	}

	var videoTrack = stream.getVideoTracks()[0];
	var capabilities = videoTrack.getCapabilities()
	
	if( !capabilities.torch ){
		alert('no mobile torch is available on your camera')
		return
	}

	this._currentTorchStatus = this._currentTorchStatus === false ? true : false
	videoTrack.applyConstraints({
		advanced: [{
			torch: this._currentTorchStatus
		}]
	}).catch(function(error){
		console.log(error)
	});
}

////////////////////////////////////////////////////////////////////////////////
//          handle resize
////////////////////////////////////////////////////////////////////////////////

ARjs.Source.prototype.onResizeElement = function(mirrorDomElements){
	var _this = this
	var screenWidth = window.innerWidth
	var screenHeight = window.innerHeight

	// compute sourceWidth, sourceHeight
	if( this.domElement.nodeName === "IMG" ){
		var sourceWidth = this.domElement.naturalWidth
		var sourceHeight = this.domElement.naturalHeight
	}else if( this.domElement.nodeName === "VIDEO" ){
		var sourceWidth = this.domElement.videoWidth
		var sourceHeight = this.domElement.videoHeight
	}else{
		console.assert(false)
	}
	
	// compute sourceAspect
	var sourceAspect = sourceWidth / sourceHeight
	// compute screenAspect
	var screenAspect = screenWidth / screenHeight

	// if screenAspect < sourceAspect, then change the width, else change the height
	if( screenAspect < sourceAspect ){
		// compute newWidth and set .width/.marginLeft
		var newWidth = sourceAspect * screenHeight
		this.domElement.style.width = newWidth+'px'
		this.domElement.style.marginLeft = -(newWidth-screenWidth)/2+'px'
		
		// init style.height/.marginTop to normal value
		this.domElement.style.height = screenHeight+'px'
		this.domElement.style.marginTop = '0px'
	}else{
		// compute newHeight and set .height/.marginTop
		var newHeight = 1 / (sourceAspect / screenWidth)
		this.domElement.style.height = newHeight+'px'
		this.domElement.style.marginTop = -(newHeight-screenHeight)/2+'px'
		
		// init style.width/.marginLeft to normal value
		this.domElement.style.width = screenWidth+'px'
		this.domElement.style.marginLeft = '0px'
	}
	
	
	if( arguments.length !== 0 ){
		debugger
		console.warn('use bad signature for arToolkitSource.copyElementSizeTo')
	}
	// honor default parameters
	// if( mirrorDomElements !== undefined )	console.warn('still use the old resize. fix it')
	if( mirrorDomElements === undefined )	mirrorDomElements = []
	if( mirrorDomElements instanceof Array === false )	mirrorDomElements = [mirrorDomElements]	

	// Mirror _this.domElement.style to mirrorDomElements
	mirrorDomElements.forEach(function(domElement){
		_this.copyElementSizeTo(domElement)
	})
}

ARjs.Source.prototype.copyElementSizeTo = function(otherElement){
	otherElement.style.width = this.domElement.style.width
	otherElement.style.height = this.domElement.style.height	
	otherElement.style.marginLeft = this.domElement.style.marginLeft
	otherElement.style.marginTop = this.domElement.style.marginTop
}

//////////////////////////////////////////////////////////////////////////////
//		Code Separator
//////////////////////////////////////////////////////////////////////////////

ARjs.Source.prototype.copySizeTo = function(){
	console.warn('obsolete function arToolkitSource.copySizeTo. Use arToolkitSource.copyElementSizeTo' )
	this.copyElementSizeTo.apply(this, arguments)
}

//////////////////////////////////////////////////////////////////////////////
//		Code Separator
//////////////////////////////////////////////////////////////////////////////

ARjs.Source.prototype.onResize	= function(arToolkitContext, renderer, camera){
	if( arguments.length !== 3 ){
		console.warn('obsolete function arToolkitSource.onResize. Use arToolkitSource.onResizeElement' )
		return this.onResizeElement.apply(this, arguments)
	}

	var trackingBackend = arToolkitContext.parameters.trackingBackend
	

	// RESIZE DOMELEMENT
	if( trackingBackend === 'artoolkit' ){

		this.onResizeElement()
		
		var isAframe = renderer.domElement.dataset.aframeCanvas ? true : false
		if( isAframe === false ){
			this.copyElementSizeTo(renderer.domElement)	
		}else{
			
		}

		if( arToolkitContext.arController !== null ){
			this.copyElementSizeTo(arToolkitContext.arController.canvas)	
		}
	}else if( trackingBackend === 'aruco' ){
		this.onResizeElement()
		this.copyElementSizeTo(renderer.domElement)	

		this.copyElementSizeTo(arToolkitContext.arucoContext.canvas)	
	}else if( trackingBackend === 'tango' ){
		renderer.setSize( window.innerWidth, window.innerHeight )
	}else console.assert(false, 'unhandled trackingBackend '+trackingBackend)


	// UPDATE CAMERA
	if( trackingBackend === 'artoolkit' ){
		if( arToolkitContext.arController !== null ){
			camera.projectionMatrix.copy( arToolkitContext.getProjectionMatrix() );			
		}
	}else if( trackingBackend === 'aruco' ){	
		camera.aspect = renderer.domElement.width / renderer.domElement.height;
		camera.updateProjectionMatrix();			
	}else if( trackingBackend === 'tango' ){
		var vrDisplay = arToolkitContext._tangoContext.vrDisplay
		// make camera fit vrDisplay
		if( vrDisplay && vrDisplay.displayName === "Tango VR Device" ) THREE.WebAR.resizeVRSeeThroughCamera(vrDisplay, camera)
	}else console.assert(false, 'unhandled trackingBackend '+trackingBackend)	
}
var THREEx = THREEx || {}

THREEx.ArVideoInWebgl = function(videoTexture){	
	var _this = this
	
	//////////////////////////////////////////////////////////////////////////////
	//	plane always in front of the camera, exactly as big as the viewport
	//////////////////////////////////////////////////////////////////////////////
	var geometry = new THREE.PlaneGeometry(2, 2);
	var material = new THREE.MeshBasicMaterial({
		// map : new THREE.TextureLoader().load('images/water.jpg'),
		map : videoTexture,
		// side: THREE.DoubleSide,
		// opacity: 0.5,
		// color: 'pink',
		// transparent: true,
	});
	var seethruPlane = new THREE.Mesh(geometry, material);
	this.object3d = seethruPlane
	// scene.add(seethruPlane);
	
	// arToolkitSource.domElement.style.visibility = 'hidden'

	// TODO extract the fov from the projectionMatrix
	// camera.fov = 43.1
	this.update = function(camera){
		camera.updateMatrixWorld(true)
		
		// get seethruPlane position
		var position = new THREE.Vector3(-0,0,-20)	// TODO how come you got that offset on x ???
		var position = new THREE.Vector3(-0,0,-20)	// TODO how come you got that offset on x ???
		seethruPlane.position.copy(position)
		camera.localToWorld(seethruPlane.position)
		
		// get seethruPlane quaternion
		camera.matrixWorld.decompose( camera.position, camera.quaternion, camera.scale );	
		seethruPlane.quaternion.copy( camera.quaternion )
		
		// extract the fov from the projectionMatrix
		var fov = THREE.Math.radToDeg(Math.atan(1/camera.projectionMatrix.elements[5]))*2;
	// console.log('fov', fov)
		
		var elementWidth = parseFloat( arToolkitSource.domElement.style.width.replace(/px$/,''), 10 )
		var elementHeight = parseFloat( arToolkitSource.domElement.style.height.replace(/px$/,''), 10 )
		
		var aspect = elementWidth / elementHeight
		
		// camera.fov = fov
		// if( vrDisplay.isPresenting ){
		// 	fov *= 2
		// 	aspect *= 2
		// }
		
		// get seethruPlane height relative to fov
		seethruPlane.scale.y = Math.tan(THREE.Math.DEG2RAD * fov/2)*position.length() 
		// get seethruPlane aspect
		seethruPlane.scale.x = seethruPlane.scale.y * aspect
	}

	//////////////////////////////////////////////////////////////////////////////
	//		Code Separator
	//////////////////////////////////////////////////////////////////////////////
	// var video = arToolkitSource.domElement;
	// 
	// window.addEventListener('resize', function(){
	// 	updateSeeThruAspectUv(seethruPlane)	
	// })
	// video.addEventListener('canplaythrough', function(){
	// 	updateSeeThruAspectUv(seethruPlane)
	// })
	// function updateSeeThruAspectUv(plane){
	// 
	// 	// if video isnt yet ready to play
	// 	if( video.videoWidth === 0 || video.videoHeight === 0 )	return
	// 
	// 	var faceVertexUvs = plane.geometry.faceVertexUvs[0]
	// 	var screenAspect = window.innerWidth / window.innerHeight
	// 	var videoAspect = video.videoWidth / video.videoHeight
	// 	
	// 	plane.geometry.uvsNeedUpdate = true
	// 	if( screenAspect >= videoAspect ){
	// 		var actualHeight = videoAspect / screenAspect;
	// 		// faceVertexUvs y 0
	// 		faceVertexUvs[0][1].y = 0.5 - actualHeight/2
	// 		faceVertexUvs[1][0].y = 0.5 - actualHeight/2
	// 		faceVertexUvs[1][1].y = 0.5 - actualHeight/2
	// 		// faceVertexUvs y 1
	// 		faceVertexUvs[0][0].y = 0.5 + actualHeight/2
	// 		faceVertexUvs[0][2].y = 0.5 + actualHeight/2
	// 		faceVertexUvs[1][2].y = 0.5 + actualHeight/2
	// 	}else{
	// 		var actualWidth = screenAspect / videoAspect;
	// 		// faceVertexUvs x 0
	// 		faceVertexUvs[0][0].x = 0.5 - actualWidth/2
	// 		faceVertexUvs[0][1].x = 0.5 - actualWidth/2
	// 		faceVertexUvs[1][0].x = 0.5 - actualWidth/2
	// 		
	// 		// faceVertexUvs x 1
	// 		faceVertexUvs[0][2].x = 0.5 + actualWidth/2
	// 		faceVertexUvs[1][1].x = 0.5 + actualWidth/2
	// 		faceVertexUvs[1][2].x = 0.5 + actualWidth/2
	// 	}
	// }

}
var THREEx = THREEx || {}

// TODO this is useless - prefere arjs-HitTesting.js

/**
 * - maybe support .onClickFcts in each object3d
 * - seems an easy light layer for clickable object
 * - up to 
 */
THREEx.HitTestingPlane = function(sourceElement){
	this._sourceElement = sourceElement

	// create _pickingScene
	this._pickingScene = new THREE.Scene
	
	// create _pickingPlane
	var geometry = new THREE.PlaneGeometry(20,20,19,19).rotateX(-Math.PI/2)
	// var geometry = new THREE.PlaneGeometry(20,20).rotateX(-Math.PI/2)
	var material = new THREE.MeshBasicMaterial({
		// opacity: 0.5,
		// transparent: true,
		wireframe: true
	})
	// material.visible = false
	this._pickingPlane = new THREE.Mesh(geometry, material)
	this._pickingScene.add(this._pickingPlane)

	// Create pickingCamera
	var fullWidth = parseInt(sourceElement.style.width)
	var fullHeight = parseInt(sourceElement.style.height)
	// TODO hardcoded fov - couch
	this._pickingCamera = new THREE.PerspectiveCamera(42, fullWidth / fullHeight, 0.1, 30);	
}

//////////////////////////////////////////////////////////////////////////////
//		update function
//////////////////////////////////////////////////////////////////////////////

THREEx.HitTestingPlane.prototype.update = function(camera, pickingRoot, changeMatrixMode){

	this.onResize()
	

	if( changeMatrixMode === 'modelViewMatrix' ){
		// set pickingPlane position
		var pickingPlane = this._pickingPlane
		pickingRoot.parent.updateMatrixWorld()
		pickingPlane.matrix.copy(pickingRoot.parent.matrixWorld)
		// set position/quaternion/scale from pickingPlane.matrix
		pickingPlane.matrix.decompose(pickingPlane.position, pickingPlane.quaternion, pickingPlane.scale)
	}else if( changeMatrixMode === 'cameraTransformMatrix' ){
		// set pickingPlane position
		var pickingCamera = this._pickingCamera
		camera.updateMatrixWorld()
		pickingCamera.matrix.copy(camera.matrixWorld)
		// set position/quaternion/scale from pickingCamera.matrix
		pickingCamera.matrix.decompose(pickingCamera.position, pickingCamera.quaternion, pickingCamera.scale)
	}else console.assert(false)


// var position = this._pickingPlane.position
// console.log('pickingPlane position', position.x.toFixed(2), position.y.toFixed(2), position.z.toFixed(2))
// var position = this._pickingCamera.position
// console.log('his._pickingCamera position', position.x.toFixed(2), position.y.toFixed(2), position.z.toFixed(2))
	
}

//////////////////////////////////////////////////////////////////////////////
//		resize camera
//////////////////////////////////////////////////////////////////////////////

THREEx.HitTestingPlane.prototype.onResize = function(){
	var sourceElement = this._sourceElement
	var pickingCamera = this._pickingCamera
	
// FIXME why using css here ??? not even computed style
// should get the size of the elment directly independantly 
	var fullWidth = parseInt(sourceElement.style.width)
	var fullHeight = parseInt(sourceElement.style.height)
	pickingCamera.aspect = fullWidth / fullHeight

	pickingCamera.updateProjectionMatrix()
}

//////////////////////////////////////////////////////////////////////////////
//		Perform test
//////////////////////////////////////////////////////////////////////////////
THREEx.HitTestingPlane.prototype.test = function(mouseX, mouseY){
	// convert mouseX, mouseY to [-1, +1]
	mouseX = (mouseX-0.5)*2
	mouseY =-(mouseY-0.5)*2
	
	this._pickingScene.updateMatrixWorld(true)

	// compute intersections between mouseVector3 and pickingPlane
	var raycaster = new THREE.Raycaster();
	var mouseVector3 = new THREE.Vector3(mouseX, mouseY, 1);
	raycaster.setFromCamera( mouseVector3, this._pickingCamera )
	var intersects = raycaster.intersectObjects( [this._pickingPlane] )

	if( intersects.length === 0 )	return null

	// set new demoRoot position
	var position = this._pickingPlane.worldToLocal( intersects[0].point.clone() )
	// TODO here do a look at the camera ?
	var quaternion = new THREE.Quaternion
	var scale = new THREE.Vector3(1,1,1)//.multiplyScalar(1)
	
	return {
		position : position,
		quaternion : quaternion,
		scale : scale
	}
}

//////////////////////////////////////////////////////////////////////////////
//		render the pickingPlane for debug
//////////////////////////////////////////////////////////////////////////////

THREEx.HitTestingPlane.prototype.renderDebug = function(renderer){
	// render sceneOrtho
	renderer.render( this._pickingScene, this._pickingCamera )
}
var THREEx = THREEx || {}

/**
 * @class
 * 
 * @return {[type]} [description]
 */
THREEx.HitTestingTango = function(arContext){
	this._arContext = arContext
	// seems to be the object bounding sphere for picking
	this.boundingSphereRadius = 0.01
	// default result scale
	this.resultScale = new THREE.Vector3(1,1,1).multiplyScalar(0.1)
}

//////////////////////////////////////////////////////////////////////////////
//		update function
//////////////////////////////////////////////////////////////////////////////

THREEx.HitTestingTango.prototype.update = function(){
}

//////////////////////////////////////////////////////////////////////////////
//		Code Separator
//////////////////////////////////////////////////////////////////////////////
/**
 * do the actual testing
 * 
 * @param {ARjs.Context} arContext - context to use
 * @param {Number} mouseX    - mouse x coordinate in [0, 1]
 * @param {Numer} mouseY    - mouse y coordinate in [0, 1]
 * @return {Object} - result
 */
THREEx.HitTestingTango.prototype.test = function(mouseX, mouseY){
	var vrDisplay = this._arContext._tangoContext.vrDisplay
        if (vrDisplay === null ) return null
	
	if( vrDisplay.displayName !== "Tango VR Device" )	return null
	
        var pointAndPlane = vrDisplay.getPickingPointAndPlaneInPointCloud(mouseX, mouseY)
        if( pointAndPlane == null ) {
                console.warn('Could not retrieve the correct point and plane.')
                return null
        }
	
	// FIXME not sure what this is
	var boundingSphereRadius = 0.01	
	
	// the bigger the number the likeliest it crash chromium-webar

        // Orient and position the model in the picking point according
        // to the picking plane. The offset is half of the model size.
        var object3d = new THREE.Object3D
        THREE.WebAR.positionAndRotateObject3DWithPickingPointAndPlaneInPointCloud(
                pointAndPlane, object3d, this.boundingSphereRadius
        )
	object3d.rotateZ(-Math.PI/2)

	// return the result
	var result = {
		position : object3d.position,
		quaternion : object3d.quaternion,
		scale : this.resultScale,
	}

	return result
}
// @namespace
var ARjs = ARjs || {}

// TODO this is a controls... should i give the object3d here ?
// not according to 'no three.js dependancy'

/**
 * Create an anchor in the real world
 * 
 * @param {ARjs.Session} arSession - the session on which we create the anchor
 * @param {Object} markerParameters - parameter of this anchor
 */
ARjs.Anchor = function(arSession, markerParameters){
	var _this = this
	var arContext = arSession.arContext
	var scene = arSession.parameters.scene
	var camera = arSession.parameters.camera
	
	this.arSession = arSession
	this.parameters = markerParameters
	
	// log to debug
	console.log('ARjs.Anchor -', 'changeMatrixMode:', this.parameters.changeMatrixMode, '/ markersAreaEnabled:', markerParameters.markersAreaEnabled)


	var markerRoot = new THREE.Group
	scene.add(markerRoot)

	// set controlledObject depending on changeMatrixMode
	if( markerParameters.changeMatrixMode === 'modelViewMatrix' ){
		var controlledObject = markerRoot
	}else if( markerParameters.changeMatrixMode === 'cameraTransformMatrix' ){
		var controlledObject = camera
	}else console.assert(false)

	if( markerParameters.markersAreaEnabled === false ){
		var markerControls = new THREEx.ArMarkerControls(arContext, controlledObject, markerParameters)		
	}else{
		// sanity check - MUST be a trackingBackend with markers
		console.assert( arContext.parameters.trackingBackend === 'artoolkit' || arContext.parameters.trackingBackend === 'aruco' )
		// for multi marker
		if( localStorage.getItem('ARjsMultiMarkerFile') === null ){
			ARjs.MarkersAreaUtils.storeDefaultMultiMarkerFile(arContext.parameters.trackingBackend)
		}
		
		// get multiMarkerFile from localStorage
		console.assert( localStorage.getItem('ARjsMultiMarkerFile') !== null )
		var multiMarkerFile = localStorage.getItem('ARjsMultiMarkerFile')

		// set controlledObject depending on changeMatrixMode
		if( markerParameters.changeMatrixMode === 'modelViewMatrix' ){
			var parent3D = scene
		}else if( markerParameters.changeMatrixMode === 'cameraTransformMatrix' ){
			var parent3D = camera
		}else console.assert(false)
	
		// build a multiMarkerControls
		var multiMarkerControls = ARjs.MarkersAreaControls.fromJSON(arContext, parent3D, controlledObject, multiMarkerFile)
		
		// honor markerParameters.changeMatrixMode
		multiMarkerControls.parameters.changeMatrixMode = markerParameters.changeMatrixMode

		// create ArMarkerHelper - useful to debug
		var markerHelpers = []
		multiMarkerControls.subMarkersControls.forEach(function(subMarkerControls){
			// add an helper to visuable each sub-marker
			var markerHelper = new THREEx.ArMarkerHelper(subMarkerControls)
			markerHelper.object3d.visible = false
			// subMarkerControls.object3d.add( markerHelper.object3d )		
			subMarkerControls.object3d.add( markerHelper.object3d )		
			// add it to markerHelpers
			markerHelpers.push(markerHelper)
		})
		// define API specific to markersArea
		this.markersArea = {}
		this.markersArea.setSubMarkersVisibility = function(visible){
			markerHelpers.forEach(function(markerHelper){
				markerHelper.object3d.visible = visible
			})
		}
	}
	
	this.object3d = new THREE.Group()
		
	//////////////////////////////////////////////////////////////////////////////
	//		THREEx.ArSmoothedControls
	//////////////////////////////////////////////////////////////////////////////
	
	var shouldBeSmoothed = true
	if( arContext.parameters.trackingBackend === 'tango' ) shouldBeSmoothed = false 

	if( shouldBeSmoothed === true ){
		// build a smoothedControls
		var smoothedRoot = new THREE.Group()
		scene.add(smoothedRoot)
		var smoothedControls = new THREEx.ArSmoothedControls(smoothedRoot)
		smoothedRoot.add(this.object3d)	
	}else{
		markerRoot.add(this.object3d)
	}


	//////////////////////////////////////////////////////////////////////////////
	//		Code Separator
	//////////////////////////////////////////////////////////////////////////////
	this.update = function(){	
		// update scene.visible if the marker is seen
		if( markerParameters.changeMatrixMode === 'cameraTransformMatrix' ){
			_this.object3d.visible = controlledObject.visible
		}
		
		if( smoothedControls !== undefined ){
			// update smoothedControls parameters depending on how many markers are visible in multiMarkerControls
			if( multiMarkerControls !== undefined ){
				multiMarkerControls.updateSmoothedControls(smoothedControls)
			}

			// update smoothedControls
			smoothedControls.update(markerRoot)			
		}
	}
}


/**
 * Apply ARjs.Session.HitTestResult to the controlled object3d
 * 
 * @param {ARjs.HitTesting.Result} hitTestResult - the result to apply
 */
ARjs.Anchor.prototype.applyHitTestResult = function(hitTestResult){
	
	
	this.object3d.position.copy(hitTestResult.position)
	this.object3d.quaternion.copy(hitTestResult.quaternion)
	this.object3d.scale.copy(hitTestResult.scale)

	this.object3d.updateMatrix()
}
// @namespace
var ARjs = ARjs || {}

/**
 * Create an debug UI for an ARjs.Anchor
 * 
 * @param {ARjs.Anchor} arAnchor - the anchor to user
 */
ARjs.SessionDebugUI = function(arSession){
	var trackingBackend = arSession.arContext.parameters.trackingBackend

	this.domElement = document.createElement('div')

	//////////////////////////////////////////////////////////////////////////////
	//		current-tracking-backend
	//////////////////////////////////////////////////////////////////////////////

	var domElement = document.createElement('span')
	this.domElement.appendChild(domElement)
	domElement.innerHTML = 'trackingBackend :' +trackingBackend
	
	//////////////////////////////////////////////////////////////////////////////
	//		toggle-point-cloud
	//////////////////////////////////////////////////////////////////////////////

	if( trackingBackend === 'tango' ){
		var domElement = document.createElement('button')
		this.domElement.appendChild(domElement)

		domElement.id= 'buttonTangoTogglePointCloud'
		domElement.innerHTML = 'toggle-point-cloud'
		domElement.href='javascript:void(0)'

		domElement.addEventListener('click', function(){
			// if( tangoPointCloud.object3d.parent ){
			// 	scene.remove(tangoPointCloud.object3d)
			// }else{
			// 	scene.add(tangoPointCloud.object3d)			
			// }
		})
	}
}


/**
 * Create an debug UI for an ARjs.Anchor
 * 
 * @param {ARjs.Anchor} arAnchor - the anchor to user
 */
ARjs.AnchorDebugUI = function(arAnchor){
	var _this = this 
	var arSession = arAnchor.arSession
	var trackingBackend = arSession.arContext.parameters.trackingBackend
	
	this.domElement = document.createElement('div')


	//////////////////////////////////////////////////////////////////////////////
	//		current-tracking-backend
	//////////////////////////////////////////////////////////////////////////////

	var domElement = document.createElement('span')
	this.domElement.appendChild(domElement)
	domElement.innerHTML = 'markersAreaEnabled :' +arAnchor.parameters.markersAreaEnabled

	//////////////////////////////////////////////////////////////////////////////
	//		toggle-marker-helper
	//////////////////////////////////////////////////////////////////////////////

	if( arAnchor.parameters.markersAreaEnabled ){
		var domElement = document.createElement('button')
		this.domElement.appendChild(domElement)

		domElement.id= 'buttonToggleMarkerHelpers'
		domElement.innerHTML = 'toggle-marker-helper'
		domElement.href='javascript:void(0)'

		var subMarkerHelpersVisible = false
		domElement.addEventListener('click', function(){
			subMarkerHelpersVisible = subMarkerHelpersVisible ? false : true
			arAnchor.markersArea.setSubMarkersVisibility(subMarkerHelpersVisible)		
		})
	}

	//////////////////////////////////////////////////////////////////////////////
	//		Reset-marker-area
	//////////////////////////////////////////////////////////////////////////////

	if( arAnchor.parameters.markersAreaEnabled ){
		var domElement = document.createElement('button')
		this.domElement.appendChild(domElement)
		domElement.id = 'buttonMarkersAreaReset'
		domElement.innerHTML = 'Reset-marker-area'
		domElement.href ='javascript:void(0)'

		domElement.addEventListener('click', function(){
			ARjs.MarkersAreaUtils.storeDefaultMultiMarkerFile(trackingBackend)
			location.reload()
		})
	}
	
	//////////////////////////////////////////////////////////////////////////////
	//		Learn-new-marker-area
	//////////////////////////////////////////////////////////////////////////////

	if( arAnchor.parameters.markersAreaEnabled ){
		var domElement = document.createElement('button')
		this.domElement.appendChild(domElement)
		domElement.id = 'buttonMarkersAreaLearner'
		domElement.innerHTML = 'Learn-new-marker-area'
		domElement.href ='javascript:void(0)'

		domElement.addEventListener('click', function(){
			var learnerBaseURL = ARjs.Context.baseURL + 'examples/multi-markers/examples/learner.html'
			ARjs.MarkersAreaUtils.navigateToLearnerPage(learnerBaseURL, trackingBackend)
		})	
	}
}
// @namespace
var ARjs = ARjs || {}

/**
 * Create an anchor in the real world
 * 
 * @param {ARjs.Session} arSession - the session on which we create the anchor
 * @param {Object} markerParameters - parameter of this anchor
 */
ARjs.HitTesting = function(arSession){
	var _this = this
	var arContext = arSession.arContext
	var trackingBackend = arContext.parameters.trackingBackend

	this.enabled = true
	this._arSession = arSession
	this._hitTestingPlane = null
	this._hitTestingTango = null

	if( trackingBackend === 'tango' ){
		_this._hitTestingTango = new THREEx.HitTestingTango(arContext)
	}else{
		_this._hitTestingPlane = new THREEx.HitTestingPlane(arSession.arSource.domElement)
	}
}

//////////////////////////////////////////////////////////////////////////////
//		update function
//////////////////////////////////////////////////////////////////////////////
/**
 * update
 * 
 * @param {THREE.Camera} camera   - the camera to use
 * @param {THREE.Object3D} object3d - 
 */
ARjs.HitTesting.prototype.update = function (camera, pickingRoot, changeMatrixMode) {
	// if it isnt enabled, do nothing
	if( this.enabled === false )	return

	if( this._hitTestingTango !== null ){
		this._hitTestingTango.update()
	}else if( this._hitTestingPlane !== null ){
		this._hitTestingPlane.update(camera, pickingRoot, changeMatrixMode)
	}else console.assert(false)
}

//////////////////////////////////////////////////////////////////////////////
//		actual hit testing
//////////////////////////////////////////////////////////////////////////////

/**
 * Test the real world for intersections directly from a DomEvent
 * 
 * @param {Number} mouseX - position X of the hit [-1, +1]
 * @param {Number} mouseY - position Y of the hit [-1, +1]
 * @return {[ARjs.HitTesting.Result]} - array of result
 */
ARjs.HitTesting.prototype.testDomEvent = function(domEvent){
	var trackingBackend = this._arSession.arContext.parameters.trackingBackend
	var arSource = this._arSession.arSource

	// if it isnt enabled, do nothing
	if( this.enabled === false )	return
	
	if( trackingBackend === 'tango' ){
        	var mouseX = domEvent.pageX / window.innerWidth
        	var mouseY = domEvent.pageY / window.innerHeight
	}else{		
		// FIXME should not use css!!!
		var mouseX = domEvent.layerX / parseInt(arSource.domElement.style.width)
		var mouseY = domEvent.layerY / parseInt(arSource.domElement.style.height)
	}

	return this.test(mouseX, mouseY)
}

/**
 * Test the real world for intersections.
 * 
 * @param {Number} mouseX - position X of the hit [0, +1]
 * @param {Number} mouseY - position Y of the hit [0, +1]
 * @return {[ARjs.HitTesting.Result]} - array of result
 */
ARjs.HitTesting.prototype.test = function(mouseX, mouseY){
	var arContext = this._arSession.arContext
	var trackingBackend = arContext.parameters.trackingBackend
	var hitTestResults = []

	// if it isnt enabled, do nothing
	if( this.enabled === false )	return

	var result = null
	if( trackingBackend === 'tango' ){
		var result = this._hitTestingTango.test(mouseX, mouseY)
	}else{
		var result = this._hitTestingPlane.test(mouseX, mouseY)
	}
			
	// if no result is found, return now
	if( result === null )	return hitTestResults

	// build a ARjs.HitTesting.Result
	var hitTestResult = new ARjs.HitTesting.Result(result.position, result.quaternion, result.scale)
	hitTestResults.push(hitTestResult)
	
	return hitTestResults
}

//////////////////////////////////////////////////////////////////////////////
//		ARjs.HitTesting.Result
//////////////////////////////////////////////////////////////////////////////
/**
 * Contains the result of ARjs.HitTesting.test()
 * 
 * @param {THREE.Vector3} position - position to use
 * @param {THREE.Quaternion} quaternion - quaternion to use
 * @param {THREE.Vector3} scale - scale
 */
ARjs.HitTesting.Result = function(position, quaternion, scale){
	this.position = position
	this.quaternion = quaternion
	this.scale = scale
}
var ARjs = ARjs || {}

/**
 * define a ARjs.Session
 * 
 * @param {Object} parameters - parameters for this session
 */
ARjs.Session = function(parameters){
	var _this = this
	// handle default parameters
	this.parameters = {
		renderer: null,
		camera: null,
		scene: null,
		sourceParameters: {},
		contextParameters: {},
	}

	//////////////////////////////////////////////////////////////////////////////
	//		setParameters
	//////////////////////////////////////////////////////////////////////////////
	setParameters(parameters)
	function setParameters(parameters){
		if( parameters === undefined )	return
		for( var key in parameters ){
			var newValue = parameters[ key ]

			if( newValue === undefined ){
				console.warn( "THREEx.Session: '" + key + "' parameter is undefined." )
				continue
			}

			var currentValue = _this.parameters[ key ]

			if( currentValue === undefined ){
				console.warn( "THREEx.Session: '" + key + "' is not a property of this material." )
				continue
			}

			_this.parameters[ key ] = newValue
		}
	}
	// sanity check
	console.assert(this.parameters.renderer instanceof THREE.WebGLRenderer)
	console.assert(this.parameters.camera instanceof THREE.Camera)
	console.assert(this.parameters.scene instanceof THREE.Scene)
	

	// backward emulation
	Object.defineProperty(this, 'renderer', {get: function(){
		console.warn('use .parameters.renderer renderer')
		return this.parameters.renderer;
	}});
	Object.defineProperty(this, 'camera', {get: function(){
		console.warn('use .parameters.camera instead')
		return this.parameters.camera;
	}});
	Object.defineProperty(this, 'scene', {get: function(){
		console.warn('use .parameters.scene instead')
		return this.parameters.scene;
	}});

	
	// log the version
	console.log('AR.js', ARjs.Context.REVISION, '- trackingBackend:', parameters.contextParameters.trackingBackend)

	//////////////////////////////////////////////////////////////////////////////
	//		init arSource
	//////////////////////////////////////////////////////////////////////////////
	var arSource = _this.arSource = new ARjs.Source(parameters.sourceParameters)

	arSource.init(function onReady(){
		arSource.onResize(arContext, _this.parameters.renderer, _this.parameters.camera)
	})
	
	// handle resize
	window.addEventListener('resize', function(){
		arSource.onResize(arContext, _this.parameters.renderer, _this.parameters.camera)
	})	
	
	//////////////////////////////////////////////////////////////////////////////
	//		init arContext
	//////////////////////////////////////////////////////////////////////////////

	// create atToolkitContext
	var arContext = _this.arContext = new ARjs.Context(parameters.contextParameters)
	
	// initialize it
	_this.arContext.init()
	
	arContext.addEventListener('initialized', function(event){
		arSource.onResize(arContext, _this.parameters.renderer, _this.parameters.camera)
	})
	
	//////////////////////////////////////////////////////////////////////////////
	//		update function
	//////////////////////////////////////////////////////////////////////////////
	// update artoolkit on every frame
	this.update = function(){
		if( arSource.ready === false )	return
		
		arContext.update( arSource.domElement )
	}
}

ARjs.Session.prototype.onResize = function () {
	this.arSource.onResize(this.arContext, this.parameters.renderer, this.parameters.camera)	
};
// @namespace
var ARjs = ARjs || {}

ARjs.TangoPointCloud = function(arSession){
	var _this = this
	var arContext = arSession.arContext
	this.object3d = new THREE.Group

console.warn('Work only on cameraTransformMatrix - fix me - useless limitation')
	
	arContext.addEventListener('initialized', function(event){
	        var vrPointCloud = arContext._tangoContext.vrPointCloud
	        var geometry = vrPointCloud.getBufferGeometry()
	        var material = new THREE.PointsMaterial({
	                size: 0.01, 
        		// colorWrite: false, // good for occlusion
			depthWrite: false,
	        })
	        var pointsObject = new THREE.Points(geometry, material)
	        // Points are changing all the time so calculating the frustum culling volume is not very convenient.
	        pointsObject.frustumCulled = false;
	        pointsObject.renderDepth = 0;

		_this.object3d.add(pointsObject)
	})
}
// @namespace
var ARjs = ARjs || {}

ARjs.TangoVideoMesh = function(arSession){
	var arContext = arSession.arContext
	var renderer = arSession.renderer

	var videoMesh = null
	var vrDisplay = null

	// Create the see through camera scene and camera
	var sceneOrtho = new THREE.Scene()
	var cameraOrtho = new THREE.OrthographicCamera( -1, 1, 1, -1, 0, 100 )		
this._sceneOrtho = sceneOrtho
this._cameraOrtho = cameraOrtho

	// tango only - init cameraMesh
	arContext.addEventListener('initialized', function(event){
		// sanity check
		console.assert( arContext.parameters.trackingBackend === 'tango' )
		// variable declaration
		vrDisplay = arContext._tangoContext.vrDisplay
		console.assert(vrDisplay, 'vrDisplay MUST be defined')
		// if vrDisplay isnt for tango, do nothing. It may be another vrDisplay (e.g. webvr emulator in chrome)
		if( vrDisplay.displayName !== "Tango VR Device" )	return
		// init videoPlane
		videoMesh = THREE.WebAR.createVRSeeThroughCameraMesh(vrDisplay)
		sceneOrtho.add(videoMesh)
	})
	
	//////////////////////////////////////////////////////////////////////////////
	//		Code Separator
	//////////////////////////////////////////////////////////////////////////////
	
	this.update = function(){
		// sanity check
		console.assert( arContext.parameters.trackingBackend === 'tango' )
		// if not yet initialized, return now
		if( videoMesh === null )	return
		// Make sure that the camera is correctly displayed depending on the device and camera orientations.
		THREE.WebAR.updateCameraMeshOrientation(vrDisplay, videoMesh)                        		
	}
	
	//////////////////////////////////////////////////////////////////////////////
	//		Code Separator
	//////////////////////////////////////////////////////////////////////////////
	
	this.render = function(){
		// sanity check
		console.assert( arContext.parameters.trackingBackend === 'tango' )
		// render sceneOrtho
		renderer.render( sceneOrtho, cameraOrtho )
		// Render the perspective scene
		renderer.clearDepth()		
	}
}
var ARjs = ARjs || {}
ARjs.Utils = {}

/**
 * Create a default rendering camera for this trackingBackend. They may be modified later. to fit physical camera parameters
 * 
 * @param {string} trackingBackend - the tracking to user
 * @return {THREE.Camera} the created camera
 */
ARjs.Utils.createDefaultCamera = function(trackingMethod){
	var trackingBackend = this.parseTrackingMethod(trackingMethod).trackingBackend
	// Create a camera
	if( trackingBackend === 'artoolkit' ){
		var camera = new THREE.Camera();
	}else if( trackingBackend === 'aruco' ){
		var camera = new THREE.PerspectiveCamera(42, window.innerWidth / window.innerHeight, 0.01, 100);
	}else if( trackingBackend === 'tango' ){
		var camera = new THREE.PerspectiveCamera(42, window.innerWidth / window.innerHeight, 0.01, 100);
	}else console.assert(false, 'unknown trackingBackend: '+trackingBackend)

	return camera
}

/**
 * test if the code is running on tango
 * 
 * @return {boolean} - true if running on tango, false otherwise
 */
ARjs.Utils.isTango = function(){
	// FIXME: this test is super bad
	var isTango = navigator.userAgent.match('Chrome/57.0.2987.5') !== null ? true : false
	return isTango
}


/**
 * parse tracking method
 * 
 * @param {String} trackingMethod - the tracking method to parse
 * @return {Object} - various field of the tracking method
 */
ARjs.Utils.parseTrackingMethod = function(trackingMethod){

	if( trackingMethod === 'best' ){
		trackingMethod = ARjs.Utils.isTango() ? 'tango' : 'area-artoolkit'
	}	

	if( trackingMethod.startsWith('area-') ){
		return {
			trackingBackend : trackingMethod.replace('area-', ''),
			markersAreaEnabled : true,
		}
	}else{
		return {
			trackingBackend : trackingMethod,
			markersAreaEnabled : false,
		}
	}
}
var ARjs = ARjs || {}
var THREEx = THREEx || {}

ARjs.MarkersAreaControls = THREEx.ArMultiMarkerControls = function(arToolkitContext, object3d, parameters){
	var _this = this
	THREEx.ArBaseControls.call(this, object3d)
	
	if( arguments.length > 3 )	console.assert('wrong api for', THREEx.ArMultiMarkerControls)

// have a parameters in argument
	this.parameters = {
		// list of controls for each subMarker
		subMarkersControls: parameters.subMarkersControls,
		// list of pose for each subMarker relative to the origin
		subMarkerPoses: parameters.subMarkerPoses,
		// change matrix mode - [modelViewMatrix, cameraTransformMatrix]
		changeMatrixMode : parameters.changeMatrixMode !== undefined ? parameters.changeMatrixMode : 'modelViewMatrix',
	}
	
	this.object3d.visible = false
	// honor obsolete stuff - add a warning to use
	this.subMarkersControls = this.parameters.subMarkersControls
	this.subMarkerPoses = this.parameters.subMarkerPoses

	// listen to arToolkitContext event 'sourceProcessed'
	// - after we fully processed one image, aka when we know all detected poses in it
	arToolkitContext.addEventListener('sourceProcessed', function(){
		_this._onSourceProcessed()
	})
}

ARjs.MarkersAreaControls.prototype = Object.create( THREEx.ArBaseControls.prototype );
ARjs.MarkersAreaControls.prototype.constructor = ARjs.MarkersAreaControls;

//////////////////////////////////////////////////////////////////////////////
//		Code Separator
//////////////////////////////////////////////////////////////////////////////


/**
 * What to do when a image source is fully processed
 */
ARjs.MarkersAreaControls.prototype._onSourceProcessed = function(){
	var _this = this
	var stats = {
		count: 0,
		position : {
			sum: new THREE.Vector3(0,0,0),
			average: new THREE.Vector3(0,0,0),
		},
		quaternion : {
			sum: new THREE.Quaternion(0,0,0,0),
			average: new THREE.Quaternion(0,0,0,0),
		},
		scale : {
			sum: new THREE.Vector3(0,0,0),
			average: new THREE.Vector3(0,0,0),
		},
	}

	var firstQuaternion = _this.parameters.subMarkersControls[0].object3d.quaternion

	this.parameters.subMarkersControls.forEach(function(markerControls, markerIndex){
		
		var markerObject3d = markerControls.object3d
		// if this marker is not visible, ignore it
		if( markerObject3d.visible === false )	return

		// transformation matrix of this.object3d according to this sub-markers
		var matrix = markerObject3d.matrix.clone()
		var markerPose = _this.parameters.subMarkerPoses[markerIndex]
		matrix.multiply(new THREE.Matrix4().getInverse(markerPose))

		// decompose the matrix into .position, .quaternion, .scale
		var position = new THREE.Vector3
		var quaternion = new THREE.Quaternion()
		var scale = new THREE.Vector3
		matrix.decompose(position, quaternion, scale)

		// http://wiki.unity3d.com/index.php/Averaging_Quaternions_and_Vectors
		stats.count++

		ARjs.MarkersAreaControls.averageVector3(stats.position.sum, position, stats.count, stats.position.average)
		ARjs.MarkersAreaControls.averageQuaternion(stats.quaternion.sum, quaternion, firstQuaternion, stats.count, stats.quaternion.average)
		ARjs.MarkersAreaControls.averageVector3(stats.scale.sum, scale, stats.count, stats.scale.average)
	})

	// honor _this.object3d.visible
	if( stats.count > 0 ){
		_this.object3d.visible = true
	}else{
		_this.object3d.visible = false			
	}

	// if at least one sub-marker has been detected, make the average of all detected markers
	if( stats.count > 0 ){
		// compute modelViewMatrix
		var modelViewMatrix = new THREE.Matrix4()
		modelViewMatrix.compose(stats.position.average, stats.quaternion.average, stats.scale.average)

		// change _this.object3d.matrix based on parameters.changeMatrixMode
		if( this.parameters.changeMatrixMode === 'modelViewMatrix' ){
			_this.object3d.matrix.copy(modelViewMatrix)
		}else if( this.parameters.changeMatrixMode === 'cameraTransformMatrix' ){
			_this.object3d.matrix.getInverse( modelViewMatrix )
		}else {
			console.assert(false)
		}

		// decompose - the matrix into .position, .quaternion, .scale
		_this.object3d.matrix.decompose(_this.object3d.position, _this.object3d.quaternion, _this.object3d.scale)
	}

}

//////////////////////////////////////////////////////////////////////////////
//		Utility functions
//////////////////////////////////////////////////////////////////////////////

/**
 * from http://wiki.unity3d.com/index.php/Averaging_Quaternions_and_Vectors
 */
ARjs.MarkersAreaControls.averageQuaternion = function(quaternionSum, newQuaternion, firstQuaternion, count, quaternionAverage){
	quaternionAverage = quaternionAverage || new THREE.Quaternion()
	// sanity check
	console.assert(firstQuaternion instanceof THREE.Quaternion === true)
	
	// from http://wiki.unity3d.com/index.php/Averaging_Quaternions_and_Vectors
	if( newQuaternion.dot(firstQuaternion) > 0 ){
		newQuaternion = new THREE.Quaternion(-newQuaternion.x, -newQuaternion.y, -newQuaternion.z, -newQuaternion.w)
	}

	quaternionSum.x += newQuaternion.x
	quaternionSum.y += newQuaternion.y
	quaternionSum.z += newQuaternion.z
	quaternionSum.w += newQuaternion.w
	
	quaternionAverage.x = quaternionSum.x/count
	quaternionAverage.y = quaternionSum.y/count
	quaternionAverage.z = quaternionSum.z/count
	quaternionAverage.w = quaternionSum.w/count
	
	quaternionAverage.normalize()

	return quaternionAverage
}


ARjs.MarkersAreaControls.averageVector3 = function(vector3Sum, vector3, count, vector3Average){
	vector3Average = vector3Average || new THREE.Vector3()
	
	vector3Sum.x += vector3.x
	vector3Sum.y += vector3.y
	vector3Sum.z += vector3.z
	
	vector3Average.x = vector3Sum.x / count
	vector3Average.y = vector3Sum.y / count
	vector3Average.z = vector3Sum.z / count
	
	return vector3Average
}

//////////////////////////////////////////////////////////////////////////////
//		Utility function
//////////////////////////////////////////////////////////////////////////////

/**
 * compute the center of this multimarker file
 */
ARjs.MarkersAreaControls.computeCenter = function(jsonData){
	var multiMarkerFile = JSON.parse(jsonData)
	var stats = {
		count : 0,
		position : {
			sum: new THREE.Vector3(0,0,0),
			average: new THREE.Vector3(0,0,0),						
		},
		quaternion : {
			sum: new THREE.Quaternion(0,0,0,0),
			average: new THREE.Quaternion(0,0,0,0),						
		},
		scale : {
			sum: new THREE.Vector3(0,0,0),
			average: new THREE.Vector3(0,0,0),						
		},
	}
	var firstQuaternion = new THREE.Quaternion() // FIXME ???
	
	multiMarkerFile.subMarkersControls.forEach(function(item){
		var poseMatrix = new THREE.Matrix4().fromArray(item.poseMatrix)
		
		var position = new THREE.Vector3
		var quaternion = new THREE.Quaternion
		var scale = new THREE.Vector3
		poseMatrix.decompose(position, quaternion, scale)
		
		// http://wiki.unity3d.com/index.php/Averaging_Quaternions_and_Vectors
		stats.count++

		ARjs.MarkersAreaControls.averageVector3(stats.position.sum, position, stats.count, stats.position.average)
		ARjs.MarkersAreaControls.averageQuaternion(stats.quaternion.sum, quaternion, firstQuaternion, stats.count, stats.quaternion.average)
		ARjs.MarkersAreaControls.averageVector3(stats.scale.sum, scale, stats.count, stats.scale.average)
	})
	
	var averageMatrix = new THREE.Matrix4()
	averageMatrix.compose(stats.position.average, stats.quaternion.average, stats.scale.average)

	return averageMatrix
}

ARjs.MarkersAreaControls.computeBoundingBox = function(jsonData){
	var multiMarkerFile = JSON.parse(jsonData)
	var boundingBox = new THREE.Box3()

	multiMarkerFile.subMarkersControls.forEach(function(item){
		var poseMatrix = new THREE.Matrix4().fromArray(item.poseMatrix)
		
		var position = new THREE.Vector3
		var quaternion = new THREE.Quaternion
		var scale = new THREE.Vector3
		poseMatrix.decompose(position, quaternion, scale)

		boundingBox.expandByPoint(position)
	})

	return boundingBox
}
//////////////////////////////////////////////////////////////////////////////
//		updateSmoothedControls
//////////////////////////////////////////////////////////////////////////////

ARjs.MarkersAreaControls.prototype.updateSmoothedControls = function(smoothedControls, lerpsValues){
	// handle default values
	if( lerpsValues === undefined ){
		// FIXME this parameter format is uselessly cryptic
		// lerpValues = [
		// {lerpPosition: 0.5, lerpQuaternion: 0.2, lerpQuaternion: 0.7}
		// ]
		lerpsValues = [
			[0.1, 0.1, 0.3],
			[0.2, 0.1, 0.4],
			[0.2, 0.2, 0.5],
			[0.3, 0.2, 0.7],
			[0.3, 0.2, 0.7],
		]
	}
	// count how many subMarkersControls are visible
	var nVisible = 0
	this.parameters.subMarkersControls.forEach(function(markerControls, markerIndex){
		var markerObject3d = markerControls.object3d
		if( markerObject3d.visible === true )	nVisible ++
	})

	// find the good lerpValues
	if( lerpsValues[nVisible-1] !== undefined ){
		var lerpValues = lerpsValues[nVisible-1]
	}else{
		var lerpValues = lerpsValues[lerpsValues.length-1]
	}

	// modify lerpValues in smoothedControls
	smoothedControls.parameters.lerpPosition = lerpValues[0]
	smoothedControls.parameters.lerpQuaternion = lerpValues[1]
	smoothedControls.parameters.lerpScale = lerpValues[2]
}


//////////////////////////////////////////////////////////////////////////////
//		Create THREEx.ArMultiMarkerControls from JSON
//////////////////////////////////////////////////////////////////////////////

ARjs.MarkersAreaControls.fromJSON = function(arToolkitContext, parent3D, markerRoot, jsonData, parameters){
	var multiMarkerFile = JSON.parse(jsonData)
	// declare variables
	var subMarkersControls = []
	var subMarkerPoses = []
	// handle default arguments
	parameters = parameters || {}

	// prepare the parameters
	multiMarkerFile.subMarkersControls.forEach(function(item){
		// create a markerRoot
		var markerRoot = new THREE.Object3D()
		parent3D.add(markerRoot)

		// create markerControls for our markerRoot
		var subMarkerControls = new THREEx.ArMarkerControls(arToolkitContext, markerRoot, item.parameters)

// if( true ){
		// store it in the parameters
		subMarkersControls.push(subMarkerControls)
		subMarkerPoses.push(new THREE.Matrix4().fromArray(item.poseMatrix))	
// }else{
// 		// build a smoothedControls
// 		var smoothedRoot = new THREE.Group()
// 		parent3D.add(smoothedRoot)
// 		var smoothedControls = new THREEx.ArSmoothedControls(smoothedRoot, {
// 			lerpPosition : 0.1,
// 			lerpQuaternion : 0.1, 
// 			lerpScale : 0.1,
// 			minVisibleDelay: 0,
// 			minUnvisibleDelay: 0,
// 		})
// 		onRenderFcts.push(function(delta){
// 			smoothedControls.update(markerRoot)	// TODO this is a global
// 		})
// 	
// 
// 		// store it in the parameters
// 		subMarkersControls.push(smoothedControls)
// 		subMarkerPoses.push(new THREE.Matrix4().fromArray(item.poseMatrix))
// }
	})
	
	parameters.subMarkersControls = subMarkersControls
	parameters.subMarkerPoses = subMarkerPoses
	// create a new THREEx.ArMultiMarkerControls
	var multiMarkerControls = new THREEx.ArMultiMarkerControls(arToolkitContext, markerRoot, parameters)

	// return it
	return multiMarkerControls	
}
var ARjs = ARjs || {}
var THREEx = THREEx || {}

ARjs.MarkersAreaLearning = THREEx.ArMultiMakersLearning = function(arToolkitContext, subMarkersControls){
	var _this = this
	this._arToolkitContext = arToolkitContext

	// Init variables
	this.subMarkersControls = subMarkersControls
	this.enabled = true
		
	// listen to arToolkitContext event 'sourceProcessed'
	// - after we fully processed one image, aka when we know all detected poses in it
	arToolkitContext.addEventListener('sourceProcessed', function(){
		_this._onSourceProcessed()
	})
}


//////////////////////////////////////////////////////////////////////////////
//		statistic collection
//////////////////////////////////////////////////////////////////////////////

/**
 * What to do when a image source is fully processed
 */
ARjs.MarkersAreaLearning.prototype._onSourceProcessed = function(){
	var originQuaternion = this.subMarkersControls[0].object3d.quaternion
	// here collect the statistic on relative positioning 
	
	// honor this.enabled
	if( this.enabled === false )	return

	// keep only the visible markers
	var visibleMarkerControls = this.subMarkersControls.filter(function(markerControls){
		return markerControls.object3d.visible === true
	})

	var count = Object.keys(visibleMarkerControls).length

	var positionDelta = new THREE.Vector3()
	var quaternionDelta = new THREE.Quaternion()
	var scaleDelta = new THREE.Vector3()
	var tmpMatrix = new THREE.Matrix4()
	
	// go thru all the visibleMarkerControls
	for(var i = 0; i < count; i++){
		var markerControls1 = visibleMarkerControls[i]
		for(var j = 0; j < count; j++){
			var markerControls2 = visibleMarkerControls[j]

			// if markerControls1 is markerControls2, then skip it
			if( i === j )	continue


			//////////////////////////////////////////////////////////////////////////////
			//		create data in markerControls1.object3d.userData if needed
			//////////////////////////////////////////////////////////////////////////////
			// create seenCouples for markerControls1 if needed
			if( markerControls1.object3d.userData.seenCouples === undefined ){
				markerControls1.object3d.userData.seenCouples = {}
			}
			var seenCouples = markerControls1.object3d.userData.seenCouples
			// create the multiMarkerPosition average if needed`
			if( seenCouples[markerControls2.id] === undefined ){
				// console.log('create seenCouples between', markerControls1.id, 'and', markerControls2.id)
				seenCouples[markerControls2.id] = {
					count : 0,
					position : {
						sum: new THREE.Vector3(0,0,0),
						average: new THREE.Vector3(0,0,0),						
					},
					quaternion : {
						sum: new THREE.Quaternion(0,0,0,0),
						average: new THREE.Quaternion(0,0,0,0),						
					},
					scale : {
						sum: new THREE.Vector3(0,0,0),
						average: new THREE.Vector3(0,0,0),						
					},
				}
			}

			
			//////////////////////////////////////////////////////////////////////////////
			//		Compute markerControls2 position relative to markerControls1
			//////////////////////////////////////////////////////////////////////////////
			
			// compute markerControls2 position/quaternion/scale in relation with markerControls1
			tmpMatrix.getInverse(markerControls1.object3d.matrix)
			tmpMatrix.multiply(markerControls2.object3d.matrix)
			tmpMatrix.decompose(positionDelta, quaternionDelta, scaleDelta)
			
			//////////////////////////////////////////////////////////////////////////////
			//		update statistics
			//////////////////////////////////////////////////////////////////////////////
			var stats = seenCouples[markerControls2.id]
			// update the count
			stats.count++

			// update the average of position/rotation/scale
			THREEx.ArMultiMarkerControls.averageVector3(stats.position.sum, positionDelta, stats.count, stats.position.average)
			THREEx.ArMultiMarkerControls.averageQuaternion(stats.quaternion.sum, quaternionDelta, originQuaternion, stats.count, stats.quaternion.average)
			THREEx.ArMultiMarkerControls.averageVector3(stats.scale.sum, scaleDelta, stats.count, stats.scale.average)
		}
	}
}

//////////////////////////////////////////////////////////////////////////////
//		Compute markers transformation matrix from current stats
//////////////////////////////////////////////////////////////////////////////

ARjs.MarkersAreaLearning.prototype.computeResult = function(){
	var _this = this
	var originSubControls = this.subMarkersControls[0]

	this.deleteResult()

	// special case of originSubControls averageMatrix
	originSubControls.object3d.userData.result = {
		averageMatrix : new THREE.Matrix4(),
		confidenceFactor: 1,
	}
	// TODO here check if the originSubControls has been seen at least once!!
	
	
	/**
	 * ALGO in pseudo code
	 *
	 * - Set confidenceFactor of origin sub markers as 1
	 *
	 * Start Looping
	 * - For a given sub marker, skip it if it already has a result.
	 * - if no result, check all seen couple and find n ones which has a progress of 1 or more.
	 * - So the other seen sub markers, got a valid transformation matrix. 
	 * - So take local averages position/orientation/scale, compose a transformation matrix. 
	 *   - aka transformation matrix from parent matrix * transf matrix pos/orientation/scale
	 * - Multiple it by the other seen marker matrix. 
	 * - Loop on the array until one pass could not compute any new sub marker
	 */
	
	do{
		var resultChanged = false
		// loop over each subMarkerControls
		this.subMarkersControls.forEach(function(subMarkerControls){

			// if subMarkerControls already has a result, do nothing
			var result = subMarkerControls.object3d.userData.result
			var isLearned = (result !== undefined && result.confidenceFactor >= 1) ? true : false
			if( isLearned === true )	return
			
			// console.log('compute subMarkerControls', subMarkerControls.name())
			var otherSubControlsID = _this._getLearnedCoupleStats(subMarkerControls)
			if( otherSubControlsID === null ){
				// console.log('no learnedCoupleStats')
				return
			}
			
			var otherSubControls = _this._getSubMarkerControlsByID(otherSubControlsID)

			var seenCoupleStats = subMarkerControls.object3d.userData.seenCouples[otherSubControlsID]
			
			var averageMatrix = new THREE.Matrix4()
			averageMatrix.compose(seenCoupleStats.position.average, seenCoupleStats.quaternion.average, seenCoupleStats.scale.average)
				
			var otherAverageMatrix = otherSubControls.object3d.userData.result.averageMatrix

			var matrix = new THREE.Matrix4().getInverse(otherAverageMatrix).multiply(averageMatrix)
			matrix = new THREE.Matrix4().getInverse(matrix)

			console.assert( subMarkerControls.object3d.userData.result === undefined )
			subMarkerControls.object3d.userData.result = {
				averageMatrix: matrix,
				confidenceFactor: 1
			}
			
			resultChanged = true
		})
		// console.log('loop')
	}while(resultChanged === true)
	
	// debugger
	// console.log('json:', this.toJSON())
	// this.subMarkersControls.forEach(function(subMarkerControls){
	// 	var hasResult = subMarkerControls.object3d.userData.result !== undefined
	// 	console.log('marker', subMarkerControls.name(), hasResult ? 'has' : 'has NO', 'result')
	// })
}

//////////////////////////////////////////////////////////////////////////////
//		Utility function
//////////////////////////////////////////////////////////////////////////////

/** 
 * get a _this.subMarkersControls id based on markerControls.id
 */
ARjs.MarkersAreaLearning.prototype._getLearnedCoupleStats	= function(subMarkerControls){

	// if this subMarkerControls has never been seen with another subMarkerControls
	if( subMarkerControls.object3d.userData.seenCouples === undefined )	return null
	
	var seenCouples = subMarkerControls.object3d.userData.seenCouples
	var coupleControlsIDs = Object.keys(seenCouples).map(Number)

	for(var i = 0; i < coupleControlsIDs.length; i++){
		var otherSubControlsID = coupleControlsIDs[i]
		// get otherSubControls
		var otherSubControls = this._getSubMarkerControlsByID(otherSubControlsID)
			
		// if otherSubControls isnt learned, skip it
		var result = otherSubControls.object3d.userData.result
		var isLearned = (result !== undefined && result.confidenceFactor >= 1) ? true : false
		if( isLearned === false )	continue

		// return this seenCouplesStats
		return otherSubControlsID
	}
	
	// if none is found, return null
	return null
}

/** 
 * get a _this.subMarkersControls based on markerControls.id
 */
ARjs.MarkersAreaLearning.prototype._getSubMarkerControlsByID	= function(controlsID){

	for(var i = 0; i < this.subMarkersControls.length; i++){
		var subMarkerControls = this.subMarkersControls[i]
		if( subMarkerControls.id === controlsID ){
			return subMarkerControls
		}
	}

	return null
}
 //////////////////////////////////////////////////////////////////////////////
//		JSON file building
//////////////////////////////////////////////////////////////////////////////

ARjs.MarkersAreaLearning.prototype.toJSON = function(){

	// compute the average matrix before generating the file
	this.computeResult()

	//////////////////////////////////////////////////////////////////////////////
	//		actually build the json
	//////////////////////////////////////////////////////////////////////////////
	var data = {
		meta : {
			createdBy : "Area Learning - AR.js "+THREEx.ArToolkitContext.REVISION,
			createdAt : new Date().toJSON(),
			
		},
		trackingBackend: this._arToolkitContext.parameters.trackingBackend,
		subMarkersControls : [],
	}

	var originSubControls = this.subMarkersControls[0]
	var originMatrixInverse = new THREE.Matrix4().getInverse(originSubControls.object3d.matrix)
	this.subMarkersControls.forEach(function(subMarkerControls, index){
		
		// if a subMarkerControls has no result, ignore it
		if( subMarkerControls.object3d.userData.result === undefined )	return

		var poseMatrix = subMarkerControls.object3d.userData.result.averageMatrix
		console.assert(poseMatrix instanceof THREE.Matrix4)
		

		// build the info
		var info = {
			parameters : {
				// to fill ...
			},
			poseMatrix : poseMatrix.toArray(),
		}
		if( subMarkerControls.parameters.type === 'pattern' ){
			info.parameters.type = subMarkerControls.parameters.type
			info.parameters.patternUrl = subMarkerControls.parameters.patternUrl
		}else if( subMarkerControls.parameters.type === 'barcode' ){
			info.parameters.type = subMarkerControls.parameters.type
			info.parameters.barcodeValue = subMarkerControls.parameters.barcodeValue
		}else console.assert(false)

		data.subMarkersControls.push(info)
	})

	var strJSON = JSON.stringify(data, null, '\t');
	
	
	//////////////////////////////////////////////////////////////////////////////
	//		round matrix elements to ease readability - for debug
	//////////////////////////////////////////////////////////////////////////////
	var humanReadable = false
	if( humanReadable === true ){
		var tmp = JSON.parse(strJSON)
		tmp.subMarkersControls.forEach(function(markerControls){
			markerControls.poseMatrix = markerControls.poseMatrix.map(function(value){
				var roundingFactor = 100
				return Math.round(value*roundingFactor)/roundingFactor
			})
		})
		strJSON = JSON.stringify(tmp, null, '\t');
	}
	
	return strJSON;	
}

//////////////////////////////////////////////////////////////////////////////
//		utility function
//////////////////////////////////////////////////////////////////////////////

/**
 * reset all collected statistics
 */
ARjs.MarkersAreaLearning.prototype.resetStats = function(){
	this.deleteResult()
	
	this.subMarkersControls.forEach(function(markerControls){
		delete markerControls.object3d.userData.seenCouples
	})
}
/**
 * reset all collected statistics
 */
ARjs.MarkersAreaLearning.prototype.deleteResult = function(){
	this.subMarkersControls.forEach(function(markerControls){
		delete markerControls.object3d.userData.result
	})
}
var THREEx = THREEx || {}

var ARjs = ARjs || {}
var THREEx = THREEx || {}

ARjs.MarkersAreaUtils = THREEx.ArMultiMarkerUtils = {}

//////////////////////////////////////////////////////////////////////////////
//		navigateToLearnerPage
//////////////////////////////////////////////////////////////////////////////

/**
 * Navigate to the multi-marker learner page
 * 
 * @param {String} learnerBaseURL  - the base url for the learner
 * @param {String} trackingBackend - the tracking backend to use
 */
ARjs.MarkersAreaUtils.navigateToLearnerPage = function(learnerBaseURL, trackingBackend){
	var learnerParameters = {
		backURL : location.href,
		trackingBackend: trackingBackend,
		markersControlsParameters: ARjs.MarkersAreaUtils.createDefaultMarkersControlsParameters(trackingBackend),
	}
	location.href = learnerBaseURL + '#' + JSON.stringify(learnerParameters)
}

//////////////////////////////////////////////////////////////////////////////
//		DefaultMultiMarkerFile
//////////////////////////////////////////////////////////////////////////////

/**
 * Create and store a default multi-marker file
 * 
 * @param {String} trackingBackend - the tracking backend to use
 */
ARjs.MarkersAreaUtils.storeDefaultMultiMarkerFile = function(trackingBackend){
	var file = ARjs.MarkersAreaUtils.createDefaultMultiMarkerFile(trackingBackend)
	// json.strinfy the value and store it in localStorage
	localStorage.setItem('ARjsMultiMarkerFile', JSON.stringify(file))
}



/**
 * Create a default multi-marker file
 * @param {String} trackingBackend - the tracking backend to use
 * @return {Object} - json object of the multi-marker file
 */
ARjs.MarkersAreaUtils.createDefaultMultiMarkerFile = function(trackingBackend){
	console.assert(trackingBackend)
	if( trackingBackend === undefined )	debugger
	
	// create absoluteBaseURL
	var link = document.createElement('a')
	link.href = ARjs.Context.baseURL
	var absoluteBaseURL = link.href

	// create the base file
	var file = {
		meta : {
			createdBy : "AR.js Default Marker "+ARjs.Context.REVISION,
			createdAt : new Date().toJSON(),
		},
		trackingBackend : trackingBackend,
		subMarkersControls : [
			// empty for now... being filled 
		]
	}
	// add a subMarkersControls
	file.subMarkersControls[0] = {
		parameters: {},
		poseMatrix: new THREE.Matrix4().makeTranslation(0,0, 0).toArray(),
	}
	if( trackingBackend === 'artoolkit' ){
		file.subMarkersControls[0].parameters.type = 'pattern'
		file.subMarkersControls[0].parameters.patternUrl = absoluteBaseURL + 'examples/marker-training/examples/pattern-files/pattern-hiro.patt'
	}else if( trackingBackend === 'aruco' ){
		file.subMarkersControls[0].parameters.type = 'barcode'
		file.subMarkersControls[0].parameters.barcodeValue = 1001
	}else console.assert(false)
	
	// json.strinfy the value and store it in localStorage
	return file
}

//////////////////////////////////////////////////////////////////////////////
//		createDefaultMarkersControlsParameters
//////////////////////////////////////////////////////////////////////////////

/**
 * Create a default controls parameters for the multi-marker learner
 * 
 * @param {String} trackingBackend - the tracking backend to use
 * @return {Object} - json object containing the controls parameters
 */
ARjs.MarkersAreaUtils.createDefaultMarkersControlsParameters = function(trackingBackend){
	// create absoluteBaseURL
	var link = document.createElement('a')
	link.href = ARjs.Context.baseURL
	var absoluteBaseURL = link.href


	if( trackingBackend === 'artoolkit' ){
		// pattern hiro/kanji/a/b/c/f
		var markersControlsParameters = [
			{
				type : 'pattern',
				patternUrl : absoluteBaseURL + 'examples/marker-training/examples/pattern-files/pattern-hiro.patt',
			},
			{
				type : 'pattern',
				patternUrl : absoluteBaseURL + 'examples/marker-training/examples/pattern-files/pattern-kanji.patt',
			},
			{
				type : 'pattern',
				patternUrl : absoluteBaseURL + 'examples/marker-training/examples/pattern-files/pattern-letterA.patt',
			},
			{
				type : 'pattern',
				patternUrl : absoluteBaseURL + 'examples/marker-training/examples/pattern-files/pattern-letterB.patt',
			},
			{
				type : 'pattern',
				patternUrl : absoluteBaseURL + 'examples/marker-training/examples/pattern-files/pattern-letterC.patt',
			},
			{
				type : 'pattern',
				patternUrl : absoluteBaseURL + 'examples/marker-training/examples/pattern-files/pattern-letterF.patt',
			},
		]		
	}else if( trackingBackend === 'aruco' ){
		var markersControlsParameters = [
			{
				type : 'barcode',
				barcodeValue: 1001,
			},
			{
				type : 'barcode',
				barcodeValue: 1002,
			},
			{
				type : 'barcode',
				barcodeValue: 1003,
			},
			{
				type : 'barcode',
				barcodeValue: 1004,
			},
			{
				type : 'barcode',
				barcodeValue: 1005,
			},
			{
				type : 'barcode',
				barcodeValue: 1006,
			},
		]
	}else console.assert(false)
	return markersControlsParameters
}
