var THREEx	= THREEx || {};

/**
 * [ description]
 * @param  {[type]} skinUrl [description]
 * @return {[type]}         [description]
 */
THREEx.MinecraftChar	= function(skinUrl){
	// set default arguments values
	skinUrl	= skinUrl || (THREEx.MinecraftChar.baseUrl + "images/jetienne.png")

	//////////////////////////////////////////////////////////////////////////////////
	//		comment								//
	//////////////////////////////////////////////////////////////////////////////////	
	var texture	= new THREE.Texture
	texture.magFilter	= THREE.NearestFilter;
	texture.minFilter	= THREE.NearestFilter;
	this.texture	= texture
	this.loadSkin( skinUrl );

	var defaultMaterial = THREEx.MinecraftChar.defaultMaterial || THREE.MeshBasicMaterial
	var material	= new defaultMaterial({
		map	: texture
	});
	var materialTran= new defaultMaterial({
		map		: texture,
		transparent	: true,
		depthWrite	: false,
		side		: THREE.DoubleSide
	})

	//////////////////////////////////////////////////////////////////////////////////
	//		define size constant						//
	//////////////////////////////////////////////////////////////////////////////////
	var sizes	= {};
	sizes.charH	= 1;
	sizes.pixRatio	= 1/32;

	sizes.headH	=  8 * sizes.pixRatio;
	sizes.headW	=  8 * sizes.pixRatio;
	sizes.headD	=  8 * sizes.pixRatio;

	sizes.helmetH	=  9 * sizes.pixRatio;
	sizes.helmetW	=  9 * sizes.pixRatio;
	sizes.helmetD	=  9 * sizes.pixRatio;

	sizes.bodyH	= 12 * sizes.pixRatio;
	sizes.bodyW	=  8 * sizes.pixRatio;
	sizes.bodyD	=  4 * sizes.pixRatio;

	sizes.legH	= 12 * sizes.pixRatio;
	sizes.legW	=  4 * sizes.pixRatio;
	sizes.legD	=  4 * sizes.pixRatio;

	sizes.armH	= 12 * sizes.pixRatio;
	sizes.armW	=  4 * sizes.pixRatio;
	sizes.armD	=  4 * sizes.pixRatio;


	// build model core hierachy
	// - origin between 2 feet
	// - height of full character is 1
	var model	= this;
	model.root	= new THREE.Object3D;

	var group	= new THREE.Object3D()
	group.position.y= sizes.charH - sizes.headH	
	model.headGroup	= group
	model.root.add(model.headGroup)

	// build model.head
	var geometry	= new THREE.CubeGeometry(sizes.headW, sizes.headH, sizes.headD)
	mapUv(geometry, 0, 16, 24, 24, 16)	// left
	mapUv(geometry, 1,  0, 24,  8, 16)	// right
	mapUv(geometry, 2,  8, 32, 16, 24)	// top
	mapUv(geometry, 3, 16, 32, 24, 24)	// bottom
	mapUv(geometry, 4,  8, 24, 16, 16)	// front
	mapUv(geometry, 5, 24, 24, 32, 16)	// back
	var mesh	= new THREE.Mesh(geometry, material)
	mesh.position.y	= sizes.headH/2
	model.head	= mesh
	model.headGroup.add(model.head)


	// build model.helmet
	var geometry	= new THREE.CubeGeometry(sizes.helmetH, sizes.helmetH, sizes.helmetH)
	model.helmet	= new THREE.Mesh(geometry, materialTran)
	model.headGroup.add(model.helmet)
	model.helmet.position.y	= sizes.headH/2
	mapUv(geometry, 0, 48, 24, 56, 16)	// left
	mapUv(geometry, 1, 32, 24, 40, 16)	// right
	mapUv(geometry, 2, 40, 32, 48, 24)	// top
	mapUv(geometry, 3, 48, 32, 56, 24)	// bottom
	mapUv(geometry, 4, 40, 24, 48, 16)	// front
	mapUv(geometry, 5, 56, 24, 64, 16)	// back
	
	
	// build model.body
	var geometry	= new THREE.CubeGeometry(sizes.bodyW, sizes.bodyH, sizes.bodyD)
	model.body	= new THREE.Mesh(geometry, material)
	model.root.add(model.body)
	model.body.position.y	= sizes.legH + sizes.bodyH/2
	mapUv(geometry, 0, 28, 12, 32,  0)	// left
	mapUv(geometry, 1, 16, 12, 20,  0)	// right
	mapUv(geometry, 2, 20, 16, 28, 12)	// top
	mapUv(geometry, 3, 28, 16, 32, 12)	// bottom
	mapUv(geometry, 4, 20, 12, 28,  0)	// front
	mapUv(geometry, 5, 32, 12, 40,  0)	// back

	// build model.armR
	var geometry	= new THREE.CubeGeometry(sizes.armW, sizes.armH, sizes.armD)
	model.armR	= new THREE.Mesh(geometry, material)
	model.root.add(model.armR)
	geometry.applyMatrix( new THREE.Matrix4().makeTranslation(0, -sizes.armH/2 + sizes.armW/2, 0) );
	model.armR.position.x	= -sizes.bodyW/2 - sizes.armW/2
	model.armR.position.y	=  sizes.legH + sizes.bodyH - sizes.armW/2
	mapUv(geometry, 0, 48, 12, 52,  0)	// right
	mapUv(geometry, 1, 40, 12, 44,  0)	// left
	mapUv(geometry, 2, 44, 16, 48, 12)	// top
	mapUv(geometry, 3, 48, 16, 52, 12)	// bottom
	mapUv(geometry, 4, 44, 12, 48,  0)	// front
	mapUv(geometry, 5, 52, 12, 56,  0)	// back

	// build model.armL
	var geometry	= new THREE.CubeGeometry(sizes.armW, sizes.armH, sizes.armD)
	model.armL	= new THREE.Mesh(geometry, material)
	model.root.add(model.armL)
	geometry.applyMatrix( new THREE.Matrix4().makeTranslation(0, -sizes.armH/2 + sizes.armW/2, 0) );
	model.armL.position.x	= sizes.bodyW/2 + sizes.armW/2
	model.armL.position.y	= sizes.legH + sizes.bodyH - sizes.armW/2
	mapUv(geometry, 0, 44, 12, 40,  0)	// right
	mapUv(geometry, 1, 52, 12, 48,  0)	// left
	mapUv(geometry, 2, 44, 16, 48, 12)	// top
	mapUv(geometry, 3, 48, 16, 52, 12)	// bottom
	mapUv(geometry, 4, 48, 12, 44,  0)	// front
	mapUv(geometry, 5, 56, 12, 52,  0)	// back

	// build model.legR
	var geometry	= new THREE.CubeGeometry(sizes.legW, sizes.legH, sizes.legD)
	model.legR	= new THREE.Mesh(geometry, material)
	model.root.add(model.legR)
	geometry.applyMatrix( new THREE.Matrix4().makeTranslation(0, -sizes.legH/2, 0) );
	model.legR.position.x	= -sizes.legW/2
	model.legR.position.y	=  sizes.legH
	mapUv(geometry, 0,  8, 12, 12,  0)	// right
	mapUv(geometry, 1,  0, 12,  4,  0)	// left
	mapUv(geometry, 2,  4, 16,  8, 12)	// top
	mapUv(geometry, 3,  8, 16, 12, 12)	// bottom
	mapUv(geometry, 4,  4, 12,  8,  0)	// front
	mapUv(geometry, 5, 12, 12, 16,  0)	// back

	// build model.legL
	var geometry	= new THREE.CubeGeometry(sizes.legW, sizes.legH, sizes.legD)
	model.legL	= new THREE.Mesh(geometry, material)
	model.root.add(model.legL)
	geometry.applyMatrix( new THREE.Matrix4().makeTranslation(0, -sizes.legH/2, 0) );
	model.legL.position.x	= sizes.legW/2
	model.legL.position.y	= sizes.legH
	mapUv(geometry, 0,  4, 12,  0,  0)	// left
	mapUv(geometry, 1, 12, 12,  8,  0)	// right
	mapUv(geometry, 2,  8, 16,  4, 12)	// top
	mapUv(geometry, 3, 12, 16,  8, 12)	// bottom
	mapUv(geometry, 4,  8, 12,  4,  0)	// front
	mapUv(geometry, 5, 16, 12, 12,  0)	// back

	return
	
	function mapUv(geometry, faceIdx, x1, y1, x2, y2){
		var tileUvW	= 1/64;
		var tileUvH	= 1/32;
		if( geometry.faces[faceIdx] instanceof THREE.Face3 ){
			var UVs		= geometry.faceVertexUvs[0][faceIdx * 2];
			UVs[0].x = x1 * tileUvW;	UVs[0].y = y1 * tileUvH;
			UVs[1].x = x1 * tileUvW;	UVs[1].y = y2 * tileUvH;
			UVs[2].x = x2 * tileUvW;	UVs[2].y = y1 * tileUvH;
			 
			var UVs		= geometry.faceVertexUvs[0][faceIdx * 2 + 1];
			UVs[0].x = x1 * tileUvW;	UVs[0].y = y2 * tileUvH;
			UVs[1].x = x2 * tileUvW;	UVs[1].y = y2 * tileUvH;
			UVs[2].x = x2 * tileUvW;	UVs[2].y = y1 * tileUvH;			
		}else if( geometry.faces[faceIdx] instanceof THREE.Face4 ){
			var UVs                = geometry.faceVertexUvs[0][faceIdx];
			UVs[0].x = x1 * tileUvW;        UVs[0].y = y1 * tileUvH;
			UVs[1].x = x1 * tileUvW;        UVs[1].y = y2 * tileUvH;
			UVs[2].x = x2 * tileUvW;        UVs[2].y = y2 * tileUvH;
			UVs[3].x = x2 * tileUvW;        UVs[3].y = y1 * tileUvH;   			
		}else	console.assert(false)
	}
}


THREEx.MinecraftChar.baseUrl	= '../'
THREEx.MinecraftChar.defaultMaterial	= null
/**
 * Load a skin
 *
 * @param {string} url the url of the skin image
*/
THREEx.MinecraftChar.prototype.loadSkin	= function(url, onLoad){
	var image	= new Image();
	image.onload	= function () {
		this.texture.image		= image;
		this.texture.needsUpdate	= true;
		onLoad	&& onLoad(this)
	}.bind(this);
	image.src = url;
	return this;	// for chained API
}


//////////////////////////////////////////////////////////////////////////////////
//		support for skin Well Known Url					//
//////////////////////////////////////////////////////////////////////////////////

THREEx.MinecraftChar.prototype.loadWellKnownSkin	= function(name, onLoad){
	console.assert(THREEx.MinecraftChar.skinWellKnownUrls[name])
	var url	= THREEx.MinecraftChar.baseUrl + THREEx.MinecraftChar.skinWellKnownUrls[name];
	return this.loadSkin(url, onLoad)
}

THREEx.MinecraftChar.skinWellKnownUrls	= {
	'3djesus'		: 'images/3djesus.png',
	'iron-man'		: 'images/Iron-Man-Minecraft-Skin.png',
	'joker'			: 'images/Joker.png',
	'mario'			: 'images/Mario.png',
	'sonicthehedgehog'	: 'images/Sonicthehedgehog.png',
	'spiderman'		: 'images/Spiderman.png',
	'superman'		: 'images/Superman.png',
	'agentsmith'		: 'images/agentsmith.png',
	'batman'		: 'images/batman.png',
	'char'			: 'images/char.png',
	'god'			: 'images/god.png',
	'jetienne'		: 'images/jetienne.png',
	'martialartist'		: 'images/martialartist.png',
	'robocop'		: 'images/robocop.png',
	'theflash'		: 'images/theflash.png',
	'woody'			: 'images/woody.png',
}
