var THREEx = THREEx || {}

THREEx.HoleInTheWall = {}

//////////////////////////////////////////////////////////////////////////////
//		Build various cache
//////////////////////////////////////////////////////////////////////////////
THREEx.HoleInTheWall.buildSquareCache = function(){
	var container = new THREE.Group
	// add outter cube - invisibility cloak
	var geometry = new THREE.PlaneGeometry(50,50);
	var material = THREEx.HoleInTheWall.buildTransparentMaterial()
// var material = new THREE.MeshNormalMaterial()
	var mesh = new THREE.Mesh( geometry, material);
	mesh.position.x =  geometry.parameters.width/2 + 0.5
	mesh.position.y = -geometry.parameters.height/2 + 0.5
	container.add(mesh)
	
	var mesh = new THREE.Mesh( geometry, material);
	mesh.position.x = -geometry.parameters.width/2 + 0.5
	mesh.position.y = -geometry.parameters.height/2 - 0.5
	container.add(mesh)
	
	var mesh = new THREE.Mesh( geometry, material);
	mesh.position.x = -geometry.parameters.width/2 - 0.5
	mesh.position.y =  geometry.parameters.height/2 - 0.5
	container.add(mesh)
	
	var mesh = new THREE.Mesh( geometry, material);
	mesh.position.x = +geometry.parameters.width/2 - 0.5
	mesh.position.y =  geometry.parameters.height/2 + 0.5
	container.add(mesh)

	return container
}

THREEx.HoleInTheWall.buildCircleCache = function(){
	var geometry = new THREE.RingGeometry( 0.5, 0.7, 32 );	
	var material = THREEx.HoleInTheWall.buildTransparentMaterial()
	// var material = new THREE.MeshNormalMaterial
	var mesh = new THREE.Mesh( geometry, material);
	return mesh
}

//////////////////////////////////////////////////////////////////////////////
//		build transparent material
//////////////////////////////////////////////////////////////////////////////

THREEx.HoleInTheWall.buildTransparentMaterial = function(){
	// if there is a cached version, return it
	if( THREEx.HoleInTheWall.buildTransparentMaterial.material ){
		return THREEx.HoleInTheWall.buildTransparentMaterial.material
	}
	var material = new THREE.MeshBasicMaterial({
		colorWrite: false // only write to z-buf
	})
	// an alternative to reach the same visual - this one seems way slower tho. My guess is it is hitting a slow-path in gpu
	// var material   = new THREE.MeshBasicMaterial();
	// material.color.set('black')
	// material.opacity   = 0;
	// material.blending  = THREE.NoBlending;
	
	// cache the material
	THREEx.HoleInTheWall.buildTransparentMaterial.material = material
	
	return material		
}
THREEx.HoleInTheWall.buildTransparentMaterial.material = null

//////////////////////////////////////////////////////////////////////////////
//		Code Separator
//////////////////////////////////////////////////////////////////////////////

//////////////////////////////////////////////////////////////////////////////
//		Code Separator
//////////////////////////////////////////////////////////////////////////////
THREEx.HoleInTheWall.HolePool = function () {
	var arApplet = new THREE.Group
	// support a renderLoop in this object3d userdata
	var onRenderFcts = arApplet.userData.onRenderFcts = arApplet.userData.onRenderFcts || []
	
	buildCacheMesh()
	buildRing()
	buildPoolWalls()
	buildWater()
	createDuck()
	createFishes()
	
	return arApplet
	
	//////////////////////////////////////////////////////////////////////////////
	//		Code Separator
	//////////////////////////////////////////////////////////////////////////////
	function buildCacheMesh(){
		var geometry = new THREE.RingGeometry( 0.5, 0.85, 32 ).rotateX(-Math.PI/2);
		var material = THREEx.HoleInTheWall.buildTransparentMaterial()
		var mesh = new THREE.Mesh( geometry, material);
		arApplet.add(mesh)		

		// add outter cube - invisibility cloak
		var geometry = new THREE.BoxGeometry(1,1,1);
		geometry.faces.splice(4, 2); // make hole by removing top two triangles (is this assumption stable?)
		var material = THREEx.HoleInTheWall.buildTransparentMaterial()	
		var mesh = new THREE.Mesh( geometry, material);
		mesh.scale.set(1,1,1).multiplyScalar(1.2)
		mesh.position.y = -geometry.parameters.height/2 * mesh.scale.y
		arApplet.add(mesh)
	
	
	
	}
	function buildRing(){
		var geometry = new THREE.TorusGeometry(0.48, 0.02, 4, 32).rotateX(-Math.PI/2);
		var material = new THREE.MeshLambertMaterial()
		mesh = new THREE.Mesh( geometry, material );
		arApplet.add( mesh );
	}
	function buildWater(){
		// build texture
		var texture = new THREE.TextureLoader().load(THREEx.ARAppletBuilder.baseURL + '../hole-in-the-wall/images/water.jpg')
		texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
		var normalMap = new THREE.TextureLoader().load(THREEx.ARAppletBuilder.baseURL + '../hole-in-the-wall/images/water-normal.jpeg')
		normalMap.wrapS = normalMap.wrapT = THREE.RepeatWrapping;
		// animate texture
		onRenderFcts.push(function(delta){
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
		mesh.position.y = -0.04;
		arApplet.add(mesh)
	}
	function buildPoolWalls(){
		var geometry = new THREE.BoxGeometry(1.1,1.1,1.1);
		geometry.faces.splice(4, 2);	// remove top (though this is a backside material)
		geometry.elementsNeedUpdate = true;
		
		var material = new THREE.MeshBasicMaterial({
			side: THREE.BackSide,
			map: new THREE.TextureLoader().load(THREEx.ARAppletBuilder.baseURL + '../hole-in-the-wall/images/mosaic-256x256.jpg'),
		})
		var mesh = new THREE.Mesh(geometry, material);
		mesh.position.y = -geometry.parameters.height/2
		
		mesh.position.y += -0.05	// z-fighting
		arApplet.add(mesh)
	}
	
	//////////////////////////////////////////////////////////////////////////////
	//		create duck
	//////////////////////////////////////////////////////////////////////////////
	function createDuck(){
		var loader = new THREE.GLTFLoader()
		loader.load( THREEx.ARAppletBuilder.baseURL + '../hole-in-the-wall/models/duck/glTF-MaterialsCommon/duck.gltf', function(gltf) {
			var duck = gltf.scene;
			arApplet.add( duck );
			
			// duck.rotateX(Math.PI/2)
			duck.scale.set(1,1,1).multiplyScalar(0.2)
			duck.position.y = -0.1;
			
			onRenderFcts.push(function(delta){
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
			map: new THREE.TextureLoader().load(THREEx.ARAppletBuilder.baseURL + '../hole-in-the-wall/images/fish-texture.png'),
			side: THREE.DoubleSide
		}); 
		var nFishes = 6
		for( var i = 0; i < nFishes; i++ ){
			;(function(index){
				var fish	= new THREE.Mesh( geometry, material );
				arApplet.add( fish );		

				fish.position.y = -0.4 + 0.2 * Math.random();
				
				var initialAngle = Math.random() * Math.PI*0.0 + Math.PI*2*(index/nFishes * 2)
				var initialRadius = 0.25 + 0.2 * Math.random()
				var speed = -0.5+ Math.random() * 0.4

				onRenderFcts.push(function(delta){
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
THREEx.HoleInTheWall.HolePortal = function (imageURL) {
	var markerScene = new THREE.Group
	markerScene.rotation.x = -Math.PI/2
	// to make the landscape appearing with good vertical on the wall
	var isChromiumTango = navigator.userAgent.match('Chrome/57.0.2987.5') !== null ? true : false
	if( isChromiumTango === true )	markerScene.rotation.z = Math.PI/2

// TODO here the cache should be a sphere

	var circleCache = THREEx.HoleInTheWall.buildCircleCache ()
	markerScene.add( circleCache )

	var geometry = new THREE.SphereGeometry( 0.6, 32, 16, 0, Math.PI, Math.PI, Math.PI).scale( 1, -1, 1 );
	var material = THREEx.HoleInTheWall.buildTransparentMaterial()
	mesh = new THREE.Mesh( geometry, material );
	mesh.position.z = -0.03
	mesh.rotation.z = Math.PI/2
	mesh.scale.multiplyScalar(1.05)
	markerScene.add( mesh );
		
	// add 360 texture
	var geometry = new THREE.SphereGeometry( 0.6, 16, 16, 0, Math.PI, Math.PI, Math.PI);
	geometry.faceVertexUvs[0].forEach(function(faceUvs){
		faceUvs.forEach(function(uv){
			uv.x /= 2
		})
	})
	var material = new THREE.MeshBasicMaterial( {
		map: new THREE.TextureLoader().load(imageURL),
	});
	mesh = new THREE.Mesh( geometry, material );
	mesh.position.z = -0.03
	mesh.rotation.z = -Math.PI
	markerScene.add( mesh );
	
	// add ring
	var geometry = new THREE.TorusGeometry(0.48, 0.02, 4, 32)
	var material = new THREE.MeshLambertMaterial()
	mesh = new THREE.Mesh( geometry, material );
	markerScene.add( mesh );
	


	return markerScene
}


//////////////////////////////////////////////////////////////////////////////
//		Code Separator
//////////////////////////////////////////////////////////////////////////////
THREEx.HoleInTheWall.HoleTorus = function () {
	var arApplet = new THREE.Group
	// handle a renderLoop in this object3d userdata
	var onRenderFcts = arApplet.userData.onRenderFcts = arApplet.userData.onRenderFcts || []


	// add outter cube - invisibility cloak
	var geometry = new THREE.BoxGeometry(1,1,1);
	geometry.faces.splice(4, 2); // make hole by removing top two triangles (is this assumption stable?)
	var material = THREEx.HoleInTheWall.buildTransparentMaterial()	
	var mesh = new THREE.Mesh( geometry, material);
	mesh.scale.set(1,1,1).multiplyScalar(1.05)
	mesh.position.y = -geometry.parameters.height/2 * mesh.scale.y
	arApplet.add(mesh)

	// add the inner box
	var geometry	= new THREE.BoxGeometry(1,1,1);
	var material	= new THREE.MeshNormalMaterial({
		side: THREE.BackSide
	}); 
	var mesh	= new THREE.Mesh( geometry, material );
	mesh.position.y = -geometry.parameters.height/2
	arApplet.add( mesh );

	// add the torus knot
	var geometry	= new THREE.TorusKnotGeometry(0.25,0.1,32,32);
	var material	= new THREE.MeshNormalMaterial(); 
	var mesh	= new THREE.Mesh( geometry, material );
	mesh.position.y = -0.5
	arApplet.add( mesh );
	
	onRenderFcts.push(function(delta){
		mesh.rotation.x += 0.1
	})
	return arApplet
}
