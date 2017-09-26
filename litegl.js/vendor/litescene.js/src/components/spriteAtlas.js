function SpriteAtlas( o )
{
	this.enabled = true;
	this.texture = null;
	this.areas = [];

	this._sprites = [];
	this._max_sprites = 256;

	if(o)
		this.configure(o);
}

SpriteAtlas.icon = "mini-icon-teapot.png";

SpriteAtlas["@texture"] = { type:"texture" };
SpriteAtlas["@areas"] = { type: "texture_areas" };

SpriteAtlas.plane_vertices = [vec3.fromValues(-0.5,0.5,0),vec3.fromValues(0.5,-0.5,0),vec3.fromValues(0.5,0.5,0),vec3.fromValues(-0.5,-0.5,0)];
SpriteAtlas.plane_normal = vec3.fromValues(0,0,1);

SpriteAtlas.prototype.onAddedToNode = function( node )
{
	LEvent.bind( node, "collectRenderInstances", this.onCollectInstances, this);
}

SpriteAtlas.prototype.onRemovedFromNode = function( node )
{
	LEvent.unbind( node, "collectRenderInstances", this.onCollectInstances, this);
}

SpriteAtlas.prototype.createMesh = function ()
{
	if( this._mesh_maxsprites == this._max_sprites )
		return;

	//buffers
	var vertices = new Float32Array( this._max_sprites * 4 * 3); //6 vertex per particle x 3 floats per vertex
	var normals = new Float32Array( this._max_sprites * 4 * 3); //6 vertex per particle x 3 floats per vertex
	var coords = new Float32Array( this._max_sprites * 4 * 2);
	var colors = new Float32Array( this._max_sprites * 4 * 4);
	var indices = new Uint16Array( this._max_sprites * 6);

	//this._default_vertices = new Float32Array([-0.5,0.5,0 , -0.5,-0.5,0, 0.5,0.5,0, 0.5,-0.5,0 ]);
	//var default_indices = [0,1,2,0,3,1];
	var default_coords = new Float32Array([0,0, 1,1, 1,0, 0,1 ]);
	var default_color = new Float32Array([ 1,1,1,1, 1,1,1,1, 1,1,1,1, 1,1,1,1 ]);

	//set to constant values
	for(var i = 0, l = this._max_sprites; i < l; ++i)
	{
		coords.set( default_coords , i*4*2);
		colors.set( default_color , i*4*4);

		indices[i*6] = i*4;
		indices[i*6+1] = i*4+1;
		indices[i*6+2] = i*4+2;
		indices[i*6+3] = i*4;
		indices[i*6+4] = i*4+3;
		indices[i*6+5] = i*4+1;
	}

	this._mesh = new GL.Mesh();
	this._mesh.addBuffers({ vertices: vertices, normals: normals, coords: coords, colors: colors }, {triangles: indices}, gl.STREAM_DRAW);
	this._mesh_maxsprites = this._max_sprites;
}

SpriteAtlas.prototype.updateMesh = function()
{
	if(!this._mesh)
		this.createMesh();

	var mesh = this._mesh;
	var vertices_array = SpriteAtlas.plane_vertices;
	var N =  SpriteAtlas.plane_normal;

	var vertices_buffer = mesh.getBuffer("vertices");
	var normals_buffer = mesh.getBuffer("normals");
	var coords_buffer = mesh.getBuffer("coords");
	var vertices = vertices_buffer.data;
	var normals = normals_buffer.data;
	var coords = coords_buffer.data;

	var pos = 0;

	for(var i = 0, l = Math.min(this._sprites.length, this._max_sprites); i < l; ++i)
	{
		var sprite = this._sprites[i];
		if(!sprite.enabled)
			continue;

		//collect positions for every sprite
		var matrix = null;
		if(sprite.matrix)
			matrix = sprite.matrix;
		else if( sprite._root && sprite._root.transform)
			matrix = sprite._root.transform._global_matrix;
		else
			continue;

		mat4.rotateVec3( temp_vec3, matrix, N );

		for(var j = 0; j < 4; ++j)
		{
			var v_index = pos*4*3 + j*3;
			var vertex = vertices.subarray(v_index, v_index + 3);
			vertex.set( vertices_array[j] );
			vertex[0] *= sprite._size[0]; vertex[1] *= sprite._size[1];
			vec3.transformMat4( vertex, vertex, matrix );
			normals.set( temp_vec3, v_index );
		}

		//var default_coords = new Float32Array([0,0, 1,1, 1,0, 0,1 ]);
		var area = sprite._area;
		var ax = area[0]; var ay = area[1]; var aw = area[2]; var ah = area[3];
		coords.set( [ax,ay, ax + aw,ay + ah, ax + aw,ay, ax,ay + ah ], pos*4*2);

		pos += 1;
	}

	if(pos)
	{
		//TODO: upload range only
		vertices_buffer.upload();
		normals_buffer.upload();
		coords_buffer.upload();
	}

	this._last_index = pos * 6;
}

//MeshRenderer.prototype.getRenderInstance = function(options)
SpriteAtlas.prototype.onCollectInstances = function(e, instances)
{
	if(!this.enabled)
		return;

	var node = this._root;
	if(!this._root)
		return;

	if(!this._sprites.length)
		return;

	//Mesh
	this.updateMesh();
	var mesh = this._mesh;

	if(!this._last_index)
		return;

	//RI
	var RI = this._render_instance;
	if(!RI)
	{
		this._render_instance = RI = new LS.RenderInstance(this._root, this);
		RI.setMesh( mesh, gl.TRIANGLES );
	}

	//material
	if(!this._material)
		this._material = new LS.StandardMaterial({ shader_name: "lowglobal", flags: { two_sided: true } });
	this._material.setTexture( "COLOR", this.texture );
	RI.setMaterial( this._material ); //sets material and blend modes in render instance

	//flags
	RI.setRange(0, this._last_index);

	//opaque RIs
	instances.push(RI);
}

//attach sprites to this atlas
SpriteAtlas.prototype.addSprite = function( sprite )
{
	var index = this._sprites.indexOf( sprite );
	if(index == -1)
		this._sprites.push( sprite );
}

SpriteAtlas.prototype.removeSprite = function( sprite )
{
	var index = this._sprites.indexOf( sprite );
	if(index != -1)
		this._sprites.splice( index, 1 );
}


SpriteAtlas.prototype.getResources = function( res )
{
	if(typeof(this.texture) == "string")
		res[this.texture] = GL.Texture;
	return res;
}

SpriteAtlas.prototype.onResourceRenamed = function( old_name, new_name, resource )
{
	if( this.texture == old_name )
		this.texture = new_name;
}

LS.registerComponent( SpriteAtlas );

SpriteAtlas.Area = function SpriteAtlasArea()
{
	this._start = vec2.create();
	this._size = vec2.create();
}