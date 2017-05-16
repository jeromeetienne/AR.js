var THREEx = THREEx || {}

THREEx.DemoContent = function(){
	this._onRenderFcts = []
	
	
}

THREEx.DemoContent.baseURL = '../'

//////////////////////////////////////////////////////////////////////////////
//		Code Separator
//////////////////////////////////////////////////////////////////////////////
THREEx.DemoContent.prototype.update = function (delta) {
	this._onRenderFcts.forEach(function(onRenderFct){
		onRenderFct(delta)
	})
}

THREEx.DemoContent.prototype.createMarkerScene = function (sceneName) {

	if( sceneName === 'torus' ){
		return this._createTorus()
	}else if( sceneName === 'glassTorus' ){
		return this._createGlassTorus()
	}else if( sceneName === 'holeTorus' ){
		return this._createHoleTorus()
	}else if( sceneName === 'holePortal' ){
		return this._createHolePortal()
	}else if( sceneName === 'holePool' ){
		return this._createHolePool()
	}else{
		console.assert(false)
	}
	return null
}

//////////////////////////////////////////////////////////////////////////////
//		Code Separator
//////////////////////////////////////////////////////////////////////////////
THREEx.DemoContent.prototype._createHolePool = function () {
	var _this = this
	
	var markerScene = new THREE.Group
	// markerScene.scale.set(1,1,1).multiplyScalar(1.2)
	markerScene.rotation.x = -Math.PI/2
	
	markerScene.position.y = 0.5


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
		// add outter cube - invisibility cloak
		var geometry = new THREE.BoxGeometry(1,1,1);
		geometry.faces.splice(8, 2); // make hole by removing top two triangles (is this assumption stable?)
		var material = THREEx.HoleInTheWall.buildTransparentMaterial()

		var mesh = new THREE.Mesh( geometry, material);
		mesh.scale.set(1,1,1).multiplyScalar(1.02)
		markerScene.add(mesh)		
	}
	function buildWater(){
		var geometry = new THREE.PlaneGeometry(1, 1)
		var material = new THREE.MeshPhongMaterial({
			transparent: true,
			opacity: 0.5,
			map: new THREE.TextureLoader().load(THREEx.DemoContent.baseURL + 'examples/hole-in-the-wall/images/water.jpg')
		})
		var mesh = new THREE.Mesh(geometry, material);
		mesh.position.z = 0.4;
		markerScene.add(mesh)
	}
	function buildPoolWalls(){
		var innerGeom = new THREE.BoxGeometry(1,1,1);
		innerGeom.faces.splice(8, 2); // remove top (though this is a backside material)
		innerGeom.elementsNeedUpdate = true;
		var material = new THREE.MeshBasicMaterial({
			side: THREE.BackSide,
			map: new THREE.TextureLoader().load(THREEx.DemoContent.baseURL + 'examples/hole-in-the-wall/images/mosaic-256x256.jpg')
		})
		var poolMesh = new THREE.Mesh(innerGeom, material);
		markerScene.add(poolMesh)
		
		// proper orientation for the uv 
		var faceTransforms = [{	faceIndex : 0,
				angle: -Math.PI/2,
			},{
				faceIndex : 1,
				angle: -Math.PI/2,
			},{
				faceIndex : 2,
				angle: Math.PI/2,
			},{
				faceIndex : 3,
				angle: Math.PI/2,
			},{
				faceIndex : 4,
				angle: Math.PI,
			},{
				faceIndex : 5,
				angle: Math.PI,
			}]
		
		faceTransforms.forEach(function(faceTransforms){
			poolMesh.geometry.faceVertexUvs[0][faceTransforms.faceIndex].forEach(function(uv){
				var tmp = uv.clone().sub(new THREE.Vector2(0.5, 0.5))

				uv.x = tmp.x * Math.cos(faceTransforms.angle) - tmp.y * Math.sin(faceTransforms.angle)
				uv.y = tmp.x * Math.sin(faceTransforms.angle) + tmp.y * Math.cos(faceTransforms.angle)

				uv.add(new THREE.Vector2(0.5, 0.5))
			})			
		})
		
	}
	
	//////////////////////////////////////////////////////////////////////////////
	//		create duck
	//////////////////////////////////////////////////////////////////////////////
	function createDuck(){
		new THREE.GLTFLoader().load( THREEx.DemoContent.baseURL + 'examples/hole-in-the-wall/models/duck/glTF-MaterialsCommon/duck.gltf', function(gltf) {
			var duck = gltf.scene;
			markerScene.add( duck );
			
			duck.rotateX(Math.PI/2)
			duck.scale.set(1,1,1).multiplyScalar(0.2)
			duck.position.z = 0.35;
			
			_this._onRenderFcts.push(function(delta){
				var present = Date.now()/1000

				var angle = present*Math.PI * 0.2
				var radius = 0.3 + 0.02*Math.sin(present*Math.PI)
				duck.position.x = Math.cos(angle) * radius
				duck.position.y = Math.sin(angle) * radius
				duck.rotation.y = angle + Math.PI/2

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
			map: new THREE.TextureLoader().load(THREEx.DemoContent.baseURL + 'examples/hole-in-the-wall/images/fish-texture.png'),
			side: THREE.DoubleSide
		}); 
		var nFishes = 6
		for( var i = 0; i < nFishes; i++ ){
			;(function(index){
				var fish	= new THREE.Mesh( geometry, material );
				markerScene.add( fish );		

				fish.position.z = 0.0 + 0.3 * Math.random();
				// fish.scale.set(1,1,1).multiplyScalar(0.4)

				fish.rotation.x = -Math.PI/2;
				fish.rotation.z= Math.PI
				
				var initialAngle = Math.random() * Math.PI*0.0 + Math.PI*2*(index/nFishes * 2)
				var initialRadius = 0.25 + 0.2 * Math.random()
				var speed = -0.5+ Math.random() * 0.4

				_this._onRenderFcts.push(function(delta){
					var present = Date.now()/1000
				
					var angle = present*Math.PI * speed + initialAngle
					var radius = initialRadius + 0.01*Math.sin(present*Math.PI)
					fish.position.x = Math.cos(angle) * radius
					fish.position.y = Math.sin(angle) * radius
					
					fish.rotation.y = -angle + Math.PI/2 + Math.PI

					var angle = present*Math.PI * 0.5
					fish.rotation.x = -Math.PI/2 + Math.sin(angle)*Math.PI/8;
				})
			})(i)
		}		
	}
}

//////////////////////////////////////////////////////////////////////////////
//		Code Separator
//////////////////////////////////////////////////////////////////////////////
THREEx.DemoContent.prototype._createHolePortal = function () {
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
	var material = new THREE.MeshBasicMaterial( {
		map: new THREE.TextureLoader().load( THREEx.DemoContent.baseURL + 'examples/hole-in-the-wall/images/32211336474_380b67d014_k.jpg' ),
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
THREEx.DemoContent.prototype._createHoleTorus = function () {

	var markerScene = new THREE.Group

	
	var proxy = new THREE.Group
	markerScene.add(proxy)
	// proxy.scale.set(1,1,1).multiplyScalar(1.2)
	// proxy.rotation.x = -Math.PI/2
	proxy.position.z = -0.5 * proxy.scale.x

	// add outter cube - invisibility cloak
	var geometry = new THREE.BoxGeometry(1,1,1);
	geometry.faces.splice(8, 2); // make hole by removing top two triangles (is this assumption stable?)
	var material = THREEx.HoleInTheWall.buildTransparentMaterial()	
	var mesh = new THREE.Mesh( geometry, material);
	mesh.scale.set(1,1,1).multiplyScalar(1.01)
	proxy.add(mesh)

	// add the inner box
	var geometry	= new THREE.BoxGeometry(1,1,1);
	var material	= new THREE.MeshNormalMaterial({
		side: THREE.BackSide
	}); 
	var mesh	= new THREE.Mesh( geometry, material );
	proxy.add( mesh );

	// add the torus knot
	var geometry	= new THREE.TorusKnotGeometry(0.25,0.1,32,32);
	var material	= new THREE.MeshNormalMaterial(); 
	var mesh	= new THREE.Mesh( geometry, material );
	proxy.add( mesh );
	
	this._onRenderFcts.push(function(delta){
		mesh.rotation.x += 0.1
	})
	return markerScene
}

//////////////////////////////////////////////////////////////////////////////
//		Code Separator
//////////////////////////////////////////////////////////////////////////////
THREEx.DemoContent.prototype._createGlassTorus = function () {
	var markerScene = new THREE.Group()
		
	var geometry = new THREE.TorusGeometry(0.3,0.15,16,32);	
	var geometry = new THREE.TorusGeometry(0.3,0.15,16*4,32*4);	
	// var geometry	= new THREE.TorusKnotGeometry(0.3,0.1,64,16);

	var videoTexture = new THREE.VideoTexture(arToolkitSource.domElement)
	videoTexture.minFilter = THREE.NearestFilter
	videoTexture.wrapS = videoTexture.wrapT = THREE.ClampToEdgeWrapping;
	var material = new THREEx.RefractionMaterial(videoTexture)

	// var material	= new THREE.MeshNormalMaterial(); 
	var mesh	= new THREE.Mesh( geometry, material );
	mesh.position.y	= 0.5
	markerScene.add( mesh );
	
	this._onRenderFcts.push(function(delta){
		// mesh.rotation.x += delta * Math.PI * 0.1
		mesh.rotation.y += delta * Math.PI * 0.5
	})

	return markerScene
}

//////////////////////////////////////////////////////////////////////////////
//		Code Separator
//////////////////////////////////////////////////////////////////////////////

THREEx.DemoContent.prototype._createTorus = function () {
	var markerScene = new THREE.Group()

	var mesh = new THREE.AxisHelper()
	markerScene.add(mesh)
	
	// add a torus knot	
	var geometry	= new THREE.CubeGeometry(1,1,1);
	var material	= new THREE.MeshNormalMaterial({
		transparent : true,
		opacity: 0.5,
		side: THREE.DoubleSide
	}); 
	var mesh	= new THREE.Mesh( geometry, material );
	mesh.position.z	= geometry.parameters.height/2
	markerScene.add(mesh)
	
	var geometry	= new THREE.TorusKnotGeometry(0.3,0.1,64,16);
	var material	= new THREE.MeshNormalMaterial(); 
	var mesh	= new THREE.Mesh( geometry, material );
	mesh.position.z	= 0.5
	markerScene.add( mesh );
	
	this._onRenderFcts.push(function(delta){
		mesh.rotation.x += delta * Math.PI
	})	
	
	return markerScene
};
