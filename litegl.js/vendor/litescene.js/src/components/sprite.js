var temp_vec3 = vec3.create();

function Sprite(o)
{
	this.enabled = true;
	this.texture = null;
	this.blend_mode = LS.Blend.ALPHA;

	this._size = vec2.fromValues(100,100);
	this.frame = null; //string
	this.flip_x = false;
	this.filtering = true;

	this._area = vec4.fromValues(0,0,1,1);

	this._atlas = null; //uid
	this._atlas_component = null; //instance

	if(o)
		this.configure(o);
}

Sprite.icon = "mini-icon-teapot.png";

Sprite["@texture"] = { type:"texture" };
Sprite["@blend_mode"] = { type: "enum", values: LS.Blend };
Sprite["@atlas"] = { type: "component", filter: "SpriteAtlas" };
Sprite["@area"] = { type: "vec4", step: 0.001 };

Object.defineProperty( Sprite.prototype, "size", {
	set: function(v){ this._size.set(v); },
	get: function(){ return this._size; },
	enumerable: true
});

Object.defineProperty( Sprite.prototype, "area", {
	set: function(v){ this._area.set(v); },
	get: function(){ return this._area; },
	enumerable: true
});

Object.defineProperty( Sprite.prototype, "atlas", {
	set: function(v){
		var compo = null;
		if(v && v.constructor === String) //find it by uid
		{
			this._atlas = v;
			var scene = this._root.scene || LS.GlobalScene;
			compo = scene.findComponentByUId( v );
			if(compo && compo.constructor != LS.Components.SpriteAtlas)
			{
				console.warn("Atlas must be of type SpriteAtlas");
				compo = null;
			}
		}
		else //instance
		{
			this._atlas = v ? v.uid : null;
			compo = v;
		}

		//attach to atlas
		if( this._atlas_component && this._atlas_component != compo )
			this._atlas_component.removeSprite( this );
		this._atlas_component = compo;
		if(this._atlas_component)
			this._atlas_component.addSprite( this );
	},
	get: function(){ 
		return this._atlas;
	},
	enumerable: true
});

//we bind to onAddedToNode because the event is triggered per node so we know which RIs belong to which node
Sprite.prototype.onAddedToNode = function( node )
{
	LEvent.bind( node, "collectRenderInstances", this.onCollectInstances, this);

	if( this._atlas_component )
		this._atlas_component.addSprite( this );
}

Sprite.prototype.onRemovedFromNode = function( node )
{
	LEvent.unbind( node, "collectRenderInstances", this.onCollectInstances, this);

	if( this._atlas_component )
		this._atlas_component.removeSprite( this );
}

Sprite.prototype.onAddedToScene = function( scene )
{
	if( this._atlas_component )
		this._atlas_component.addSprite( this );
}

Sprite.prototype.onRemovedFromScene = function( scene )
{
	if( this._atlas_component )
		this._atlas_component.removeSprite( this );
}

//MeshRenderer.prototype.getRenderInstance = function(options)
Sprite.prototype.onCollectInstances = function(e, instances)
{
	if( !this.enabled || this._atlas )
		return;

	var node = this._root;
	if(!this._root)
		return;

	//Mesh
	var mesh = LS.Components.Sprite._mesh;
	if(!mesh)
		mesh = LS.Components.Sprite._mesh = GL.Mesh.plane();

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
	this._material.setTexture( "color", this.texture, { uvs: LS.Material.COORDS_UV_TRANSFORMED, magFilter: this.filtering ? gl.LINEAR : gl.NEAREST } );
	this._material.blend_mode = this.blend_mode;
	RI.setMaterial( this._material ); //sets material and blend modes in render instance

	//Matrix do not need to update
	if( this._root.transform )
		RI.setMatrix( this._root.transform._global_matrix );
	mat4.getTranslation( RI.center, this._root.transform._global_matrix );

	//apply size and flip x 
	temp_vec3[0] = this._size[0] * (this.flip_x ? -1 : 1);
	temp_vec3[1] = this._size[1];
	temp_vec3[2] = 1;
	mat4.scale( RI.matrix, RI.matrix, temp_vec3 );

	//area
	mat3.identity( this._material.uvs_matrix );
	mat3.translate( this._material.uvs_matrix, this._material.uvs_matrix, this._area.subarray(0,2) );
	mat3.scale( this._material.uvs_matrix, this._material.uvs_matrix, this._area.subarray(2,4) );

	instances.push(RI);
}

Sprite.prototype.getResources = function( res )
{
	if(typeof(this.texture) == "string")
		res[this.texture] = GL.Texture;
	return res;
}

Sprite.prototype.onResourceRenamed = function( old_name, new_name, resource )
{
	if( this.texture == old_name )
		this.texture = new_name;
}

LS.registerComponent( Sprite );