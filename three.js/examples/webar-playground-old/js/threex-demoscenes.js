var THREEx = THREEx || {}

THREEx.ARjsDemoScenes = function(camera){
	this._onRenderFcts = []
	
	console.assert(camera)
	this.camera = camera
}

THREEx.ARjsDemoScenes.baseURL = '../'

//////////////////////////////////////////////////////////////////////////////
//		Code Separator
//////////////////////////////////////////////////////////////////////////////
THREEx.ARjsDemoScenes.prototype.update = function (delta) {
	this._onRenderFcts.forEach(function(onRenderFct){
		onRenderFct(delta)
	})
}

THREEx.ARjsDemoScenes.prototype.dispose = function (delta) {
	this._onRenderFcts = []
}

THREEx.ARjsDemoScenes.prototype.createMarkerScene = function (sceneName) {
	var markerScene = null

	if( sceneName === 'torus' ){
		markerScene = this._createTorus()
	}else if( sceneName === 'glassTorus' ){
		markerScene = this._createGlassTorus()
	}else if( sceneName === 'holeTorus' ){
		markerScene = this._createHoleTorus()
	}else if( sceneName === 'holePortal' ){
		markerScene = this._createHolePortal()
	}else if( sceneName === 'holePool' ){
		markerScene = this._createHolePool()
	}else if( sceneName === 'minecraft' ){
		markerScene = this._createMinecraft()
	}else if( sceneName === 'shaddowTorusKnot' ){
		markerScene = this._createShaddowTorusKnot()
	}else if( sceneName === 'holographicMessage' ){
		markerScene = this._createHolographicMessage()
	}else{
		console.assert(false)
	}
	markerScene.userData.sceneType = sceneName
	return markerScene
}
//////////////////////////////////////////////////////////////////////////////
//		Code Separator
//////////////////////////////////////////////////////////////////////////////
THREEx.ARjsDemoScenes.prototype._createHolographicMessage = function () {
	var markerScene = new THREE.Group

 	// var videoURL = THREEx.ArToolkitContext.baseURL + 'examples/webar-playground/vendor/holographic-message/examples/videos/bird_greenscreen.mp4'
	// var videoURL = THREEx.ArToolkitContext.baseURL + 'examples/webar-playground/vendor/holographic-message/examples/videos/Star\ wars\ demo\ Alex.mp4'
	var videoURL = THREEx.ArToolkitContext.baseURL + 'examples/webar-playground/vendor/holographic-message/examples/videos/AndraConnect business\ card.mp4'
	var holograhicMessage = new THREEx.HolographicMessage(videoURL, this.camera)
	this._onRenderFcts.push(function(delta){
		holograhicMessage.update(delta)
	})
	
	markerScene.add(holograhicMessage.object3d)

	return markerScene
}

//////////////////////////////////////////////////////////////////////////////
//		Code Separator
//////////////////////////////////////////////////////////////////////////////
THREEx.ARjsDemoScenes.prototype._createShaddowTorusKnot = function () {
	var markerScene = new THREE.Group

	//////////////////////////////////////////////////////////////////////////////
	//		setup lights
	//////////////////////////////////////////////////////////////////////////////
	var ambient = new THREE.AmbientLight( 0x222222 );
	markerScene.add( ambient );
	
	var directionalLight = new THREE.DirectionalLight( 'white', 0.5);
	directionalLight.position.set( 1, 2, 0.3 ).setLength(2)
	directionalLight.shadow.mapSize.set(128,128)
	directionalLight.shadow.camera.bottom = -0.6
	directionalLight.shadow.camera.top = 0.6
	directionalLight.shadow.camera.right = 0.6
	directionalLight.shadow.camera.left = -0.6
	directionalLight.castShadow = true;
	markerScene.add( directionalLight );

	if( false ){
		var cameraHelper = new THREE.CameraHelper( directionalLight.shadow.camera )
		markerScene.add(cameraHelper)
		this._onRenderFcts.push(function(){
			cameraHelper.update()
		})		
	}
	
	// add a transparent ground-plane shadow-receiver
	var material = new THREE.ShadowMaterial({
		// opacity: 0.7
	});
	material.opacity = 0.7; //! bug in threejs. can't set in constructor

	var geometry = new THREE.PlaneGeometry(3, 3)
	var planeMesh = new THREE.Mesh( geometry, material);
	planeMesh.receiveShadow = true;
	planeMesh.depthWrite = false;
	planeMesh.rotation.x = -Math.PI/2
	markerScene.add(planeMesh);
	
	
	
	
	// add torus knot
	var geometry	= new THREE.TorusKnotGeometry(0.3,0.1,64,16);
	var material	= new THREE.MeshNormalMaterial();
	var material	= new THREE.MeshLambertMaterial();
	var mesh	= new THREE.Mesh( geometry, material );
	mesh.castShadow = true;
	// mesh.receiveShadow = true;
	mesh.position.y	= 0.7
	markerScene.add( mesh );

	// point the directionalLight to the marker
	directionalLight.target = mesh

	this._onRenderFcts.push(function(){
		mesh.rotation.x += 0.04;
	})


		
	return markerScene
}

//////////////////////////////////////////////////////////////////////////////
//		Code Separator
//////////////////////////////////////////////////////////////////////////////
THREEx.ARjsDemoScenes.prototype._createMinecraft = function () {
	var markerScene = new THREE.Group

	// var mesh = new THREE.AxisHelper()
	// markerScene.add(mesh)

	THREEx.MinecraftChar.baseUrl = THREEx.ARjsDemoScenes.baseURL + '../../../aframe/examples/vendor/threex.minecraft/'	
	var character	= new THREEx.MinecraftChar()
	markerScene.add(character.root)


	var headAnims	= new THREEx.MinecraftCharHeadAnimations(character);
	headAnims.start('yes');
	this._onRenderFcts.push(function(delta){
		headAnims.update(delta)	
	})


	// init bodyAnims
	var bodyAnims	= new THREEx.MinecraftCharBodyAnimations(character);
	bodyAnims.start('hiwave');
	this._onRenderFcts.push(function(delta){
		bodyAnims.update(delta)	
	})	
	
	var shadowMesh = createShadowMesh()
	character.root.add(shadowMesh)

	return markerScene
	
	function createShadowMesh(){
		// create texture
		var canvas = document.createElement( 'canvas' );
		canvas.width = 128;
		canvas.height = 128;
		var texture = new THREE.Texture( canvas );
		texture.needsUpdate = true
		// draw on texture
		var context = canvas.getContext( '2d' );
		var gradient = context.createRadialGradient(
			canvas.width / 2,
			canvas.height / 2,
			0,
			canvas.width / 2,
			canvas.height / 2,
			canvas.width / 2
		);
		gradient.addColorStop( 0.2, 'rgba(30,30,30,1)' );
		gradient.addColorStop( 0.4, 'rgba(30,30,30,0.8)' );
		gradient.addColorStop( 0.6, 'rgba(30,30,30,0.5)' );
		gradient.addColorStop( 1, 'rgba(30,30,30,0)' );
		context.fillStyle = gradient;
		context.fillRect( 0, 0, canvas.width, canvas.height );

		// build mesh
		var geometry = new THREE.PlaneBufferGeometry( 1, 1, 3, 3 );
		geometry.scale(0.8,0.8,0.8)
		var material = new THREE.MeshBasicMaterial({
			map: texture,
			transparent: true,
		});
		var mesh = new THREE.Mesh( geometry, material );
		mesh.rotation.x = - Math.PI / 2;

		return mesh
	}
}

//////////////////////////////////////////////////////////////////////////////
//		Code Separator
//////////////////////////////////////////////////////////////////////////////
THREEx.ARjsDemoScenes.prototype._createHolePool = function () {
	var _this = this
	var markerScene = new THREE.Group

	// var mesh = new THREE.AxisHelper()
	// markerScene.add(mesh)
	
	buildCacheMesh()
	buildWater()
	buildPoolWalls()
	createDuck()
	createFishes()
	
	return markerScene
	
	//////////////////////////////////////////////////////////////////////////////
	//		Code Separator
	//////////////////////////////////////////////////////////////////////////////
	function buildCacheMesh(){
		var geometry = new THREE.RingGeometry( 0.5, 5, 32 ).rotateX(-Math.PI/2);
		var material = THREEx.HoleInTheWall.buildTransparentMaterial()
		var mesh = new THREE.Mesh( geometry, material);
		markerScene.add(mesh)		

		// radiusTop, radiusBottom, height
		var geometry = new THREE.CylinderGeometry(0.5, 0.5, 0.05, 32, 1, true)
		var material = new THREE.MeshLambertMaterial( {
			side: THREE.BackSide,
			color: 'lightgrey'
			
		})
		mesh = new THREE.Mesh( geometry, material )
		mesh.position.y = -geometry.parameters.height/2
		markerScene.add( mesh );
	
	}
	function buildWater(){
		// build texture
		var texture = new THREE.TextureLoader().load(THREEx.ARjsDemoScenes.baseURL + 'vendor/hole-in-the-wall/images/water.jpg')
		texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
		var normalMap = new THREE.TextureLoader().load(THREEx.ARjsDemoScenes.baseURL + 'vendor/hole-in-the-wall/images/water-normal.jpeg')
		normalMap.wrapS = normalMap.wrapT = THREE.RepeatWrapping;
		// animate texture
		_this._onRenderFcts.push(function(delta){
			var deltaUV = new THREE.Vector2()
			deltaUV.x = 0.1 * delta
			
			material.normalMap.offset.add(deltaUV)
			material.map.offset.add(deltaUV)
			
			var angle = Date.now()/1000 * Math.PI * 2
			material.normalScale.set(Math.cos(angle),Math.sin(angle))
		})
		// build the mesh
		var geometry = new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI/2)
		var material = new THREE.MeshPhongMaterial({
			transparent: true,
			opacity: 0.6,
			color: 'cyan',
			map: texture,
			normalMap: normalMap
		})
		var mesh = new THREE.Mesh(geometry, material);
		mesh.position.y = -0.05;
		markerScene.add(mesh)
	}
	function buildPoolWalls(){
		var geometry = new THREE.BoxGeometry(1.1,1.1,1.1);
		geometry.faces.splice(4, 2);	// remove top (though this is a backside material)
		geometry.elementsNeedUpdate = true;
		
		var material = new THREE.MeshBasicMaterial({
			side: THREE.BackSide,
			map: new THREE.TextureLoader().load(THREEx.ARjsDemoScenes.baseURL + 'vendor/hole-in-the-wall/images/mosaic-256x256.jpg'),
		})
		var mesh = new THREE.Mesh(geometry, material);
		mesh.position.y = -geometry.parameters.height/2
		markerScene.add(mesh)
	}
	
	//////////////////////////////////////////////////////////////////////////////
	//		create duck
	//////////////////////////////////////////////////////////////////////////////
	function createDuck(){
		new THREE.GLTFLoader().load( THREEx.ARjsDemoScenes.baseURL + 'vendor/hole-in-the-wall/models/duck/glTF-MaterialsCommon/duck.gltf', function(gltf) {
			var duck = gltf.scene;
			markerScene.add( duck );
			
			// duck.rotateX(Math.PI/2)
			duck.scale.set(1,1,1).multiplyScalar(0.2)
			duck.position.y = -0.15;
			
			_this._onRenderFcts.push(function(delta){
				var present = Date.now()/1000

				var angle = present*Math.PI * 0.2
				var radius = 0.3 + 0.02*Math.sin(present*Math.PI)
				duck.position.x = Math.cos(angle) * radius
				duck.position.z = Math.sin(angle) * radius
				duck.rotation.y = -angle - Math.PI/2

				duck.rotation.z = Math.sin(present*Math.PI*1) * Math.PI/15
			})			
		})		
	}
	
	//////////////////////////////////////////////////////////////////////////////
	//		create the fish
	//////////////////////////////////////////////////////////////////////////////
	function createFishes(){
		var geometry	= new THREE.PlaneGeometry(1,0.5).scale(0.4, 0.4, 0.4);
		var material	= new THREE.MeshBasicMaterial({
			alphaTest: 0.1,
			map: new THREE.TextureLoader().load(THREEx.ARjsDemoScenes.baseURL + 'vendor/hole-in-the-wall/images/fish-texture.png'),
			side: THREE.DoubleSide
		}); 
		var nFishes = 6
		for( var i = 0; i < nFishes; i++ ){
			;(function(index){
				var fish	= new THREE.Mesh( geometry, material );
				markerScene.add( fish );		

				fish.position.y = -0.4 + 0.2 * Math.random();
				
				var initialAngle = Math.random() * Math.PI*0.0 + Math.PI*2*(index/nFishes * 2)
				var initialRadius = 0.25 + 0.2 * Math.random()
				var speed = -0.5+ Math.random() * 0.4

				_this._onRenderFcts.push(function(delta){
					var present = Date.now()/1000
				
					var angle = present*Math.PI * speed + initialAngle
					var radius = initialRadius + 0.01*Math.sin(present*Math.PI)
					fish.position.x = Math.cos(angle) * radius
					fish.position.z = Math.sin(angle) * radius
					
					fish.rotation.y = -angle + Math.PI/2

					var angle = present*Math.PI * 0.5
					fish.rotation.x = Math.sin(angle)*Math.PI/8;
				})
			})(i)
		}		
	}
}

//////////////////////////////////////////////////////////////////////////////
//		Code Separator
//////////////////////////////////////////////////////////////////////////////
THREEx.ARjsDemoScenes.prototype._createHolePortal = function () {
	var markerScene = new THREE.Group
	markerScene.rotation.x = -Math.PI/2
	markerScene.scale.set(1,1,1).multiplyScalar(1)

	// markerScene.add( buildSquareCache() )
	markerScene.add( THREEx.HoleInTheWall.buildCircleCache () )
	
	// radiusTop, radiusBottom, height
	var geometry = new THREE.CylinderGeometry(0.5, 0.5, 0.05, 32, 1, true)
	var material = new THREE.MeshLambertMaterial( {
		side: THREE.BackSide,
		// wireframe: true,
		color: 'lightgrey'
		
	})
	mesh = new THREE.Mesh( geometry, material );
	mesh.rotateX(Math.PI/2)
	mesh.position.z = -geometry.parameters.height/2
	markerScene.add( mesh );
	
	// add bounding sphere
	var geometry = new THREE.SphereGeometry( 3, 32, 16, 0, Math.PI, Math.PI, Math.PI);
	geometry.scale( 1, -1, 1 )
	var texture = new THREE.TextureLoader().load( THREEx.ARjsDemoScenes.baseURL + 'vendor/hole-in-the-wall/images/32211336474_380b67d014_k.jpg' )
	var material = new THREE.MeshBasicMaterial( {
		map: texture,
		side: THREE.DoubleSide
	});
	mesh = new THREE.Mesh( geometry, material );
	mesh.position.z = -0.05
	mesh.rotation.z = Math.PI/2
	markerScene.add( mesh );
	
	return markerScene
}


//////////////////////////////////////////////////////////////////////////////
//		Code Separator
//////////////////////////////////////////////////////////////////////////////
THREEx.ARjsDemoScenes.prototype._createHoleTorus = function () {

	var markerScene = new THREE.Group
	markerScene.position.y = -0.5

	// add outter cube - invisibility cloak
	var geometry = new THREE.BoxGeometry(1,1,1);
	geometry.faces.splice(4, 2); // make hole by removing top two triangles (is this assumption stable?)
	var material = THREEx.HoleInTheWall.buildTransparentMaterial()	
	var mesh = new THREE.Mesh( geometry, material);
	mesh.scale.set(1,1,1).multiplyScalar(1.01)
	markerScene.add(mesh)

	// add the inner box
	var geometry	= new THREE.BoxGeometry(1,1,1);
	var material	= new THREE.MeshNormalMaterial({
		side: THREE.BackSide
	}); 
	var mesh	= new THREE.Mesh( geometry, material );
	markerScene.add( mesh );

	// add the torus knot
	var geometry	= new THREE.TorusKnotGeometry(0.25,0.1,32,32);
	var material	= new THREE.MeshNormalMaterial(); 
	var mesh	= new THREE.Mesh( geometry, material );
	markerScene.add( mesh );
	
	this._onRenderFcts.push(function(delta){
		mesh.rotation.x += 0.1
	})
	return markerScene
}

//////////////////////////////////////////////////////////////////////////////
//		Code Separator
//////////////////////////////////////////////////////////////////////////////
THREEx.ARjsDemoScenes.prototype._createGlassTorus = function () {
	var markerScene = new THREE.Group()
	
	// //////////////////////////////////////////////////////////////////////////////
	// //		setup lights
	// //////////////////////////////////////////////////////////////////////////////
	// var ambient = new THREE.AmbientLight( 0x222222 );
	// markerScene.add( ambient );
	// 
	// var directionalLight = new THREE.DirectionalLight( 'white', 0.5);
	// directionalLight.position.set( 1, 2, 1 ).setLength(2)
	// directionalLight.shadow.mapSize.set(256,256)
	// directionalLight.shadow.camera.bottom = -0.6
	// directionalLight.shadow.camera.top = 0.6
	// directionalLight.shadow.camera.right = 0.6
	// directionalLight.shadow.camera.left = -0.6
	// directionalLight.castShadow = true;
	// markerScene.add( directionalLight );
	// 
	// if( false ){
	// 	var cameraHelper = new THREE.CameraHelper( directionalLight.shadow.camera )
	// 	markerScene.add(cameraHelper)
	// 	this._onRenderFcts.push(function(){
	// 		cameraHelper.update()
	// 	})		
	// }
	// 
	// // add a transparent ground-plane shadow-receiver
	// var material = new THREE.ShadowMaterial();
	// material.opacity = 0.45; //! bug in threejs. can't set in constructor
	// 
	// var geometry = new THREE.PlaneGeometry(3, 3)
	// var planeMesh = new THREE.Mesh( geometry, material);
	// planeMesh.receiveShadow = true;
	// planeMesh.depthWrite = false;
	// planeMesh.rotation.x = -Math.PI/2
	// markerScene.add(planeMesh);
		
	//////////////////////////////////////////////////////////////////////////////
	//		Code Separator
	//////////////////////////////////////////////////////////////////////////////
		
	var geometry = new THREE.TorusGeometry(0.3,0.15,16,32);	
	// var geometry = new THREE.TorusGeometry(0.3,0.15,16*4,32*4);	
	// var geometry	= new THREE.TorusKnotGeometry(0.3,0.1,64,16);

	console.warn('using arToolkitSource global to get video stream in glass')
	var videoTexture = new THREE.VideoTexture(arToolkitSource.domElement)
	videoTexture.minFilter = THREE.NearestFilter
	videoTexture.wrapS = videoTexture.wrapT = THREE.ClampToEdgeWrapping;
	var material = new THREEx.RefractionMaterial(videoTexture)

	// var material	= new THREE.MeshNormalMaterial(); 
	var mesh	= new THREE.Mesh( geometry, material );
	// mesh.castShadow = true;
	mesh.position.y	= 0.5
	markerScene.add( mesh );

	// point the directionalLight to the marker
	// directionalLight.target = mesh
	
	this._onRenderFcts.push(function(delta){
		// mesh.rotation.x += delta * Math.PI * 0.1
		mesh.rotation.y += delta * Math.PI * 0.5
	})

	return markerScene
}

//////////////////////////////////////////////////////////////////////////////
//		Code Separator
//////////////////////////////////////////////////////////////////////////////

THREEx.ARjsDemoScenes.prototype._createTorus = function () {
	var markerScene = new THREE.Group()


	
	// add a torus knot	
	var geometry	= new THREE.CubeGeometry(1,1,1);
	var material	= new THREE.MeshNormalMaterial({
		transparent : true,
		opacity: 0.5,
		side: THREE.DoubleSide
	}); 
	var mesh	= new THREE.Mesh( geometry, material );
	mesh.position.y	= geometry.parameters.height/2
	markerScene.add(mesh)
	
	var geometry	= new THREE.TorusKnotGeometry(0.3,0.1,64,16);
	var material	= new THREE.MeshNormalMaterial(); 
	var mesh	= new THREE.Mesh( geometry, material );
	mesh.position.y	= 0.5
	markerScene.add( mesh );
	
	this._onRenderFcts.push(function(delta){
		mesh.rotation.x += delta * Math.PI
	})	
	
	return markerScene
};
