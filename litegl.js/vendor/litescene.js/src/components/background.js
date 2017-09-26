
function BackgroundRenderer(o)
{
	this.enabled = true;
	this.texture = null;

	this.createProperty( "color", vec3.fromValues(1,1,1), "color" );
	this.opacity = 1.0;
	this.blend_mode = Blend.NORMAL;

	//this._color = vec3.fromValues(1,1,1);
	this.material_name = null;

	if(o)
		this.configure(o);
}

BackgroundRenderer.icon = "mini-icon-bg.png";
BackgroundRenderer["@texture"] = { type: "texture" };
BackgroundRenderer["@material_name"] = { type: "material" };
BackgroundRenderer["@blend_mode"] = { type: "enum", values: LS.Blend };
BackgroundRenderer["@opacity"] = { type: "number", step: 0.01 };

/*
Object.defineProperty( BackgroundRenderer.prototype, 'color', {
	get: function() { return this._color; },
	set: function(v) { this._color.set(v);},
	enumerable: true
});
*/

BackgroundRenderer.prototype.onAddedToNode = function(node)
{
	LEvent.bind(node, "collectRenderInstances", this.onCollectInstances, this);
}

BackgroundRenderer.prototype.onRemovedFromNode = function(node)
{
	LEvent.unbind(node, "collectRenderInstances", this.onCollectInstances, this);
}

BackgroundRenderer.prototype.getResources = function(res)
{
	if(typeof(this.texture) == "string")
		res[this.texture] = GL.Texture;
	return res;
}

BackgroundRenderer.prototype.onResourceRenamed = function (old_name, new_name, resource)
{
	if(this.texture == old_name)
		this.texture = new_name;
}

BackgroundRenderer.prototype.onCollectInstances = function(e, instances)
{
	if(!this.enabled)
		return;

	var mat = null;

	if( this.material_name )
		mat = LS.ResourcesManager.materials[ this.material_name ];

	if(!mat)
	{
		var texture = this.texture;
		if(!texture) 
			return;
		if(texture.constructor === String)
			texture = LS.ResourcesManager.textures[ texture ];

		if(!this._material)
			mat = this._material = new LS.StandardMaterial({shader: "lowglobal", 
				queue: LS.RenderQueue.BACKGROUND, 
				flags: {
					cast_shadows: false,
					ignore_lights: true,
					two_sided: true,
					depth_test: false,
					ignore_frustum: true
				},
				use_scene_ambient:false
			});
		else
			mat = this._material;

		mat.setTexture("color", texture);
		mat.color.set( this.color );
		mat.opacity = this.opacity;
		mat.blend_mode = this.blend_mode;
	}

	var mesh = this._mesh;
	if(!mesh)
		mesh = this._mesh = GL.Mesh.plane({size:2});

	var RI = this._render_instance;
	if(!RI)
		this._render_instance = RI = new LS.RenderInstance( this._root, this );

	RI.setMesh( mesh );
	RI.setMaterial( mat );

	instances.push(RI);
}

//disabled till the viewprojection matrix issue is fixed
//LS.registerComponent( BackgroundRenderer );