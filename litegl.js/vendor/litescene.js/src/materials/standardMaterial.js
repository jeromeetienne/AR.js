


//StandardMaterial class **************************
/* Warning: a material is not a component, because it can be shared by multiple nodes */

/**
* StandardMaterial class improves the material class
* @namespace LS
* @class StandardMaterial
* @constructor
* @param {Object} object [optional] to configure from
*/

function StandardMaterial(o)
{
	Material.call(this,null); //do not pass the data object, it is called later

	this.blend_mode = LS.Blend.NORMAL;

	this.shader_name = "global";

	this.createProperty( "diffuse", new Float32Array([1.0,1.0,1.0]), "color" );
	this.createProperty( "ambient", new Float32Array([1.0,1.0,1.0]), "color" );
	this.createProperty( "emissive", new Float32Array([0,0,0,0]), "color" );
	//this.emissive = new Float32Array([0.0,0.0,0.0]);
	this.backlight_factor = 0;

	this._specular_data = vec2.fromValues( 0.1, 10.0 );
	this.specular_on_top = false;
	this.specular_on_alpha = false;
	this.reflection_factor = 0.0;
	this.reflection_fresnel = 1.0;
	this.reflection_additive = false;
	this.reflection_specular = false;
	this.createProperty( "velvet", new Float32Array([0.5,0.5,0.5]), "color" );
	this.velvet_exp = 0.0;
	this.velvet_additive = false;
	this._velvet_info = vec4.create();
	this._detail = new Float32Array([0.0, 10, 10]);
	this._extra_data = vec4.create();

	this.normalmap_factor = 1.0;
	this.normalmap_tangent = true;
	this.displacementmap_factor = 0.1;
	this.bumpmap_factor = 1.0;
	this.use_scene_ambient = true;

	//used to change the render state
	this.flags = {
		alpha_test: false,
		alpha_test_shadows: false,
		two_sided: false,
		flip_normals: false,
		depth_test: true,
		depth_write: true,
		ignore_lights: false,
		cast_shadows: true,
		receive_shadows: true,
		ignore_frustum: false
	};

	//used for special fx 
	this.extra_surface_shader_code = "";

	this._uniforms = {};
	this._samplers = [];

	this.extra_uniforms = {};

	if(o) 
		this.configure(o);
}

Object.defineProperty( StandardMaterial.prototype, 'detail_factor', {
	get: function() { return this._detail[0]; },
	set: function(v) { this._detail[0] = v; },
	enumerable: true
});

Object.defineProperty( StandardMaterial.prototype, 'detail_scale', {
	get: function() { return this._detail.subarray(1,3); },
	set: function(v) { this._detail[1] = v[0]; this._detail[2] = v[1]; },
	enumerable: true
});

Object.defineProperty( StandardMaterial.prototype, 'emissive_extra', {
	get: function() { return this._emissive[3]; },
	set: function(v) { this._emissive[3] = v; },
	enumerable: true
});

Object.defineProperty( StandardMaterial.prototype, 'extra_factor', {
	get: function() { return this._extra_data[3]; },
	set: function(v) { this._extra_data[3] = v; },
	enumerable: true
});

Object.defineProperty( StandardMaterial.prototype, 'extra_color', {
	get: function() { return this._extra_data.subarray(0,3); },
	set: function(v) { this._extra_data.set( v ); },
	enumerable: true
});

Object.defineProperty( StandardMaterial.prototype, 'specular_factor', {
	get: function() { return this._specular_data[0]; },
	set: function(v) { 
		if( v != null && v.constructor === Number)
			this._specular_data[0] = v;
	},
	enumerable: true
});

Object.defineProperty( StandardMaterial.prototype, 'specular_gloss', {
	get: function() { return this._specular_data[1]; },
	set: function(v) { this._specular_data[1] = v; },
	enumerable: true
});

StandardMaterial["@blend_mode"] = { type: "enum", values: LS.Blend };

StandardMaterial.DETAIL_TEXTURE = "detail";
StandardMaterial.NORMAL_TEXTURE = "normal";
StandardMaterial.DISPLACEMENT_TEXTURE = "displacement";
StandardMaterial.BUMP_TEXTURE = "bump";
StandardMaterial.REFLECTIVITY_TEXTURE = "reflectivity";
StandardMaterial.IRRADIANCE_TEXTURE = "irradiance";
StandardMaterial.EXTRA_TEXTURE = "extra";

StandardMaterial.prototype.prepare = function( scene )
{
	var flags = this.flags;

	var render_state = this._render_state;

	//set flags in render state
	render_state.cull_face = !flags.two_sided;
	render_state.front_face = flags.flip_normals ? GL.CW : GL.CCW;
	render_state.depth_test = flags.depth_test;
	render_state.depth_mask = flags.depth_write;

	render_state.blend = this.blend_mode != LS.Blend.NORMAL;
	if( this.blend_mode != LS.Blend.NORMAL )
	{
		var func = LS.BlendFunctions[ this.blend_mode ];
		if(func)
		{
			render_state.blendFunc0 = func[0];
			render_state.blendFunc1 = func[1];
		}
	}

	this.fillShaderQuery( scene ); //update shader macros on this material
	this.fillUniforms( scene ); //update uniforms

	//set up macros
	if( flags.alpha_test )
		this._query.macros.USE_ALPHA_TEST = "0.5";
	else if(this._query.macros["USE_ALPHA_TEST"])
		delete this._query.macros["USE_ALPHA_TEST"];

}

// RENDERING METHODS
StandardMaterial.prototype.fillShaderQuery = function( scene )
{
	var query = this._query;
	query.clear();

	//iterate through textures in the material
	for(var i in this.textures) 
	{
		var texture_info = this.getTextureSampler(i);
		if(!texture_info) continue;
		var texture_uvs = texture_info.uvs || Material.DEFAULT_UVS[i] || "0";

		var texture = Material.getTextureFromSampler( texture_info );
		if(!texture) //loading or non-existant
			continue;

		if(i == "normal")
		{
			if(this.normalmap_factor != 0.0 && (!this.normalmap_tangent || (this.normalmap_tangent && gl.derivatives_supported)) )
			{
				query.macros.USE_NORMAL_TEXTURE = "uvs_" + texture_uvs;
				if(this.normalmap_factor != 0.0)
					query.macros.USE_NORMALMAP_FACTOR = "";
				if(this.normalmap_tangent && gl.derivatives_supported)
					query.macros.USE_TANGENT_NORMALMAP = "";
			}
			continue;
		}
		else if(i == "displacement")
		{
			if(this.displacementmap_factor != 0.0 && gl.derivatives_supported )
			{
				query.macros.USE_DISPLACEMENT_TEXTURE = "uvs_" + texture_uvs;
				if(this.displacementmap_factor != 1.0)
					query.macros.USE_DISPLACEMENTMAP_FACTOR = "";
			}
			continue;
		}
		else if(i == "bump")
		{
			if(this.bump_factor != 0.0 && gl.derivatives_supported )
			{
				query.macros.USE_BUMP_TEXTURE = "uvs_" + texture_uvs;
				if(this.bumpmap_factor != 1.0)
					query.macros.USE_BUMP_FACTOR = "";
			}
			continue;
		}

		query.macros[ "USE_" + i.toUpperCase() + (texture.texture_type == gl.TEXTURE_2D ? "_TEXTURE" : "_CUBEMAP") ] = "uvs_" + texture_uvs;
	}

	if(this.velvet && this.velvet_exp) //first light only
		query.macros.USE_VELVET = "";
	
	if(this.emissive_material) //dont know whats this
		query.macros.USE_EMISSIVE_MATERIAL = "";
	
	if(this.specular_on_top)
		query.macros.USE_SPECULAR_ONTOP = "";
	if(this.specular_on_alpha)
		query.macros.USE_SPECULAR_ON_ALPHA = "";
	if(this.reflection_specular)
		query.macros.USE_SPECULAR_IN_REFLECTION = "";
	if(this.backlight_factor > 0.001)
		query.macros.USE_BACKLIGHT = "";

	if(this.reflection_factor > 0.0) 
		query.macros.USE_REFLECTION = "";

	//extra code
	if(this.extra_surface_shader_code)
	{
		var code = null;
		if(this._last_extra_surface_shader_code != this.extra_surface_shader_code)
		{
			code = Material.processShaderCode( this.extra_surface_shader_code );
			this._last_processed_extra_surface_shader_code = code;
		}
		else
			code = this._last_processed_extra_surface_shader_code;
		if(code)
			query.macros.USE_EXTRA_SURFACE_SHADER_CODE = code;
	}

	//extra macros
	if(this.extra_macros)
		for(var im in this.extra_macros)
			query.macros[im] = this.extra_macros[im];
}

StandardMaterial.prototype.fillUniforms = function( scene, options )
{
	var uniforms = {};
	var samplers = []; //array with the samplers in the binding order

	uniforms.u_material_color = this._color;

	//uniforms.u_ambient_color = node.flags.ignore_lights ? [1,1,1] : [scene.ambient_color[0] * this.ambient[0], scene.ambient_color[1] * this.ambient[1], scene.ambient_color[2] * this.ambient[2]];
	//if(this.use_scene_ambient && scene.info && !this.textures["ambient"])
	//	uniforms.u_ambient_color = vec3.fromValues(scene.info.ambient_color[0] * this.ambient[0], scene.info.ambient_color[1] * this.ambient[1], scene.info.ambient_color[2] * this.ambient[2]);
	//else
	uniforms.u_ambient_color = this.ambient;

	uniforms.u_emissive_color = this.emissive || vec4.create();
	uniforms.u_specular = this._specular_data;
	uniforms.u_reflection_info = vec2.fromValues( (this.reflection_additive ? -this.reflection_factor : this.reflection_factor), this.reflection_fresnel );
	uniforms.u_backlight_factor = this.backlight_factor;
	uniforms.u_normalmap_factor = this.normalmap_factor;
	uniforms.u_displacementmap_factor = this.displacementmap_factor;
	uniforms.u_bumpmap_factor = this.bumpmap_factor;

	this._velvet_info.set( this.velvet );
	this._velvet_info[3] = this.velvet_additive ? this.velvet_exp : -this.velvet_exp;
	uniforms.u_velvet_info = this._velvet_info;

	uniforms.u_detail_info = this._detail;

	uniforms.u_extra_data = this._extra_data;

	uniforms.u_texture_matrix = this.uvs_matrix;

	//iterate through textures in the material
	var last_texture_slot = 0;
	for(var i in this.textures) 
	{
		var sampler = this.getTextureSampler(i);
		if(!sampler)
			continue;

		var texture = sampler.texture;
		if(!texture)
			continue;

		if(texture.constructor === String)
			texture = LS.ResourcesManager.textures[texture];
		else if (texture.constructor != Texture)
			continue;		
		
		if(!texture)  //loading or non-existant
			sampler = { texture: ":missing" };

		var slot = last_texture_slot;
		if( i == "environment" )
			slot = LS.Renderer.ENVIRONMENT_TEXTURE_SLOT;
		else if( i == "irradiance" )
			slot = LS.Renderer.IRRADIANCE_TEXTURE_SLOT;
		else
			last_texture_slot++;

		samplers[ slot ] = sampler;
		var uniform_name = i + ( (!texture || texture.texture_type == gl.TEXTURE_2D) ? "_texture" : "_cubemap");
		uniforms[ uniform_name ] = slot;
	}

	//add extra uniforms
	for(var i in this.extra_uniforms)
		uniforms[i] = this.extra_uniforms[i];

	this._uniforms = uniforms;
	this._samplers = samplers;
}

StandardMaterial.prototype.getTextureChannels = function()
{
	return [ Material.COLOR_TEXTURE, Material.OPACITY_TEXTURE, Material.AMBIENT_TEXTURE, Material.SPECULAR_TEXTURE, Material.EMISSIVE_TEXTURE, StandardMaterial.DETAIL_TEXTURE, StandardMaterial.NORMAL_TEXTURE, StandardMaterial.DISPLACEMENT_TEXTURE, StandardMaterial.BUMP_TEXTURE, StandardMaterial.REFLECTIVITY_TEXTURE, Material.ENVIRONMENT_TEXTURE, StandardMaterial.IRRADIANCE_TEXTURE, StandardMaterial.EXTRA_TEXTURE ];
}

/**
* assign a value to a property in a safe way
* @method setProperty
* @param {Object} object to configure from
*/
StandardMaterial.prototype.setProperty = function(name, value)
{
	//redirect to base material
	if( Material.prototype.setProperty.call(this,name,value) )
		return true;

	//regular
	switch(name)
	{
		//objects
		case "render_state":
		//numbers
		case "specular_factor":
		case "specular_gloss":
		case "backlight_factor":
		case "reflection_factor":
		case "reflection_fresnel":
		case "velvet_exp":
		case "velvet_additive":
		case "normalmap_tangent":
		case "normalmap_factor":
		case "displacementmap_factor":
		case "extra_factor":
		case "detail_factor":
		case "emissive_extra":
		//strings
		//bools
		case "specular_on_top":
		case "specular_on_alpha":
		case "normalmap_tangent":
		case "reflection_specular":
		case "use_scene_ambient":
		case "extra_surface_shader_code":
		case "blend_mode":
			if(value !== null)
				this[name] = value; 
			break;
		case "flags":
			if(value)
			{
				for(var i in value)
					this.flags[i] = value[i];
			}
			break;
		//vectors
		case "ambient":	
		case "diffuse": 
		case "emissive": 
		case "velvet":
		case "detail_scale":
		case "extra_color":
			if(this[name].length == value.length)
				this[name].set(value);
			break;
		case "extra_uniforms":
			this.extra_uniforms = LS.cloneObject(value);
			break;
		default:
			return false;
	}
	return true;
}

/**
* gets all the properties and its types
* @method getPropertiesInfo
* @return {Object} object with name:type
*/
StandardMaterial.prototype.getPropertiesInfo = function()
{
	//get from the regular material
	var o = Material.prototype.getPropertiesInfo.call(this);

	//add some more
	o.merge({
		blend_mode: LS.TYPES.NUMBER,
		specular_factor: LS.TYPES.NUMBER,
		specular_gloss: LS.TYPES.NUMBER,
		backlight_factor: LS.TYPES.NUMBER,
		reflection_factor: LS.TYPES.NUMBER,
		reflection_fresnel: LS.TYPES.NUMBER,
		velvet_exp: LS.TYPES.NUMBER,

		normalmap_factor: LS.TYPES.NUMBER,
		displacementmap_factor: LS.TYPES.NUMBER,
		emissive_extra: LS.TYPES.NUMBER,
		extra_factor: LS.TYPES.NUMBER,
		extra_surface_shader_code: LS.TYPES.STRING,

		ambient: LS.TYPES.VEC3,
		emissive: LS.TYPES.VEC3,
		velvet: LS.TYPES.VEC3,
		extra_color: LS.TYPES.VEC3,
		detail_factor: LS.TYPES.NUMBER,
		detail_scale: LS.TYPES.VEC2,

		specular_on_top: LS.TYPES.BOOLEAN,
		normalmap_tangent: LS.TYPES.BOOLEAN,
		reflection_specular: LS.TYPES.BOOLEAN,
		use_scene_ambient: LS.TYPES.BOOLEAN,
		velvet_additive: LS.TYPES.BOOLEAN
	});

	return o;
}

StandardMaterial.prototype.getPropertyInfoFromPath = function( path )
{
	if( path.length < 1)
		return;

	var info = Material.prototype.getPropertyInfoFromPath.call(this,path);
	if(info)
		return info;

	var varname = path[0];
	var type;

	switch(varname)
	{
		case "blend_mode":
		case "backlight_factor":
		case "reflection_factor":
		case "reflection_fresnel":
		case "velvet_exp":
		case "normalmap_factor":
		case "displacementmap_factor":
		case "emissive_extra":
		case "extra_factor":
		case "detail_factor":
			type = LS.TYPES.NUMBER; break;
		case "extra_surface_shader_code":
			type = LS.TYPES.STRING; break;
		case "ambient":
		case "emissive":
		case "velvet":
		case "extra_color":
			type = LS.TYPES.VEC3; break;
		case "detail_scale":
			type = LS.TYPES.VEC2; break;
		case "specular_on_top":
		case "specular_on_alpha":
		case "normalmap_tangent":
		case "reflection_specular":
		case "use_scene_ambient":
		case "velvet_additive":
			type = LS.TYPES.BOOLEAN; break;
		default:
			return null;
	}

	return {
		node: this._root,
		target: this,
		name: varname,
		value: this[varname],
		type: type
	};
}

LS.registerMaterialClass( StandardMaterial );
LS.StandardMaterial = StandardMaterial;