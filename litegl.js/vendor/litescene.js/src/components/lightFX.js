//TODO

/**
* LightFX create volumetric and flare effects to the light
* @class LightFX
* @constructor
* @param {Object} object to configure from
*/

/* DISABLED
function LightFX(o)
{
	this.enabled = true;
	this.test_visibility = true;

	this.volume_visibility = 0;
	this.volume_radius = 1;
	this.volume_density = 1;

	this.glare_visibility = 1;
	this.glare_size = vec2.fromValues(0.2,0.2);
	this.glare_texture = null;

	//for caching purposes
	this._uniforms = {};

	if(o) 
		this.configure(o);
}

LightFX["@glare_texture"] = { type:"texture" };
LightFX["@glare_size"] = { type:"vec2", step: 0.001 };
LightFX["@glare_visibility"] = { type:"number", step: 0.001 };

LightFX.icon = "mini-icon-lightfx.png";

LightFX.prototype.onAddedToNode = function(node)
{
	LEvent.bind(node, "collectRenderInstances", this.onCollectInstances, this);
}

LightFX.prototype.onRemovedFromNode = function(node)
{
	LEvent.unbind(node, "collectRenderInstances", this.onCollectInstances, this);
}

LightFX.prototype.onCollectInstances = function(e,instances)
{
	if(!this.enabled) return;

	var light = this._root.light;
	if(light && !light.enabled)
		return;

	if(this.volume_visibility && light)
		instances.push( this.getVolumetricRenderInstance(light) );

	if(this.glare_visibility)
	{
		var ri = this.getGlareRenderInstance(light);
		if(ri)
			instances.push( ri );
	}
}

//not finished
LightFX.prototype.getVolumetricRenderInstance = function()
{
	//sphere
	if(!this._volumetric_mesh)
	{
		this._volumetric_mesh = GL.Mesh.sphere();
	}

	var RI = this._volumetric_render_instance;
	if(!RI)
		this._volumetric_render_instance = RI = new LS.RenderInstance(this._root, this);

	RI.flags = RenderInstance.ALPHA; //reset and set
	
	//material
	var mat = this._volumetric_material;
	if(!mat)
		mat = this._volumetric_material = new LS.Material({shader_name:"volumetric_light", blending: Material.ADDITIVE_BLENDING });
	vec3.copy( mat.color, light.color );
	mat.opacity = this.volume_visibility;
	RI.material = mat;

	//do not need to update
	RI.matrix.set( this._root.transform._global_matrix );
	//mat4.identity( RI.matrix );
	//mat4.setTranslation( RI.matrix, this.getPosition() ); 

	mat4.multiplyVec3( RI.center, RI.matrix, light.position );
	mat4.scale( RI.matrix, RI.matrix, [this.volume_radius,this.volume_radius,this.volume_radius]);

	var volume_info = vec4.create();
	volume_info.set(RI.center);
	volume_info[3] = this.volume_radius * 0.5;
	RI.uniforms["u_volume_info"] = volume_info;
	RI.uniforms["u_volume_density"] = this.volume_density;
	
	RI.setMesh( this._mesh, gl.TRIANGLES );
	RI.flags = RI_CULL_FACE | RI_BLEND | RI_DEPTH_TEST;

	return RI;
}

LightFX.prototype.getGlareRenderInstance = function(light)
{
	if(!this.glare_texture)
		return null;

	var RI = this._glare_render_instance;
	if(!RI)
	{
		this._glare_render_instance = RI = new RenderInstance(this._root, this);
		RI.setMesh( GL.Mesh.plane({size:1}), gl.TRIANGLES );
		RI.priority = 1;
		RI.onPreRender = LightFX.onGlarePreRender;
	}
	
	//RI.flags = RI_2D_FLAGS;
	if(light)
		vec3.copy( RI.center, light.getPosition() );
	else
		vec3.copy( RI.center, this._root.transform.getGlobalPosition() );
	RI.pos2D = vec3.create();
	RI.scale_2D = this.glare_size;
	RI.test_visibility = this.test_visibility;

	//debug
	//RI.matrix.set( this._root.transform._global_matrix );

	var mat = this._glare_material;
	if(!mat)
		mat = this._glare_material = new Material({ blending: Material.ADDITIVE_BLENDING });
	if(light)
	{
		vec3.scale( mat.color, light.color, this.glare_visibility * light.intensity );
		mat.setTexture("color", this.glare_texture);
	}
	RI.setMaterial( mat );
	RI.flags |= RI_BLEND;
	
	return RI;
}

//render on RenderInstance
LightFX.onGlarePreRender = function( render_settings )
{
	if( LS.Renderer._current_pass != "color" )
		return; 

	//project point to 2D in normalized space
	mat4.projectVec3( this.pos2D, LS.Renderer._viewprojection_matrix, this.center );
	this.pos2D[0] = this.pos2D[0] * 2 - 1;
	this.pos2D[1] = this.pos2D[1] * 2 - 1;
	this.pos2D[2] = 0; //reset Z
	//this.material.opacity = 1 / (2*vec3.distance(this.pos2D, [0,0,0])); //attenuate by distance

	var center = this.center;
	var eye = LS.Renderer._current_camera.getEye();
	var scene = LS.Renderer._current_scene;
	var dir = vec3.sub(vec3.create(), eye, center );
	var dist = vec3.length(dir);
	vec3.scale(dir,dir,1/dist);


	var coll = 0;
	
	if(this.test_visibility)
		coll = LS.Physics.raycast( center, dir, { max_distance: dist } );

	if(coll.length)
	{
		this.material.opacity -= 0.05;
		if(this.material.opacity < 0.0)
			this.material.opacity = 0.0;
	}
	else
	{
		this.material.opacity += 0.05;
		if(this.material.opacity > 1.0)
			this.material.opacity = 1;
	}
}

LightFX.prototype.getResources = function (res)
{
	if(this.glare_texture)
		res[ this.glare_texture ] = Texture;
	return res;
}

LightFX.prototype.onResourceRenamed = function (old_name, new_name, resource)
{
	if(this.glare_texture == old_name)
		this.glare_texture = new_name;
}

*/

//LS.registerComponent(LightFX);

