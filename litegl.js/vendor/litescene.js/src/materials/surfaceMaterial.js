function SurfaceMaterial( o )
{
	Material.call( this, null );

	this.shader_name = "surface";

	this.blend_mode = LS.Blend.NORMAL;
	this._light_mode = 1;

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

	this._code = "void surf(in Input IN, inout SurfaceOutput o) {\n\
	o.Albedo = vec3(1.0) * IN.color.xyz;\n\
	o.Normal = IN.worldNormal;\n\
	o.Emission = vec3(0.0);\n\
	o.Specular = 1.0;\n\
	o.Gloss = 40.0;\n\
	o.Reflectivity = max(0.0, 0.5 - dot(IN.viewDir,o.Normal));\n\
	o.Alpha = IN.color.a;\n}\n";

	this._uniforms = {};
	this._samplers = [];

	this._mustUpdate = false;

	this.properties = []; //array of configurable properties
	if(o) 
		this.configure(o);

	this.computeCode();
}


SurfaceMaterial.prototype.prepare = StandardMaterial.prototype.prepare;

SurfaceMaterial.icon = "mini-icon-material.png";

SurfaceMaterial.prototype.onCodeChange = function()
{
	this._mustUpdate = true;
	//this.computeCode();
}

Object.defineProperty( SurfaceMaterial.prototype, "code", {
	enumerable: true,
	get: function() {
		return this._code;
	},
	set: function(v) {
		this._code = String(v);
		this._mustUpdate = true;
	}
});

SurfaceMaterial.prototype.getCode = function()
{
	return this._code;
}

SurfaceMaterial.prototype.computeCode = function()
{
	var uniforms_code = "";
	for(var i = 0, l = this.properties.length; i < l; ++i )
	{
		var code = "uniform ";
		var prop = this.properties[i];
		switch(prop.type)
		{
			case 'number': code += "float "; break;
			case 'vec2': code += "vec2 "; break;
			case 'color':
			case 'vec3': code += "vec3 "; break;
			case 'color4':
			case 'vec4': code += "vec4 "; break;
			case 'sampler':
			case 'texture': code += "sampler2D "; break;
			case 'cubemap': code += "samplerCube "; break;
			default: 
				continue;
		}
		code += prop.name + ";\n";
		uniforms_code += code;
	}

	/*
	var lines = this._code.split("\n");
	for(var i = 0, l = lines.length; i < l; ++i )
		lines[i] = lines[i].split("//")[0]; //remove comments
	*/

	this.surf_code = uniforms_code + "\n" + this._code;
	var final_code = LS.SurfaceMaterial.code_template.replace( /{{}}/gi, this.surf_code );
	if(!this._shadercode)
		this._shadercode = new LS.ShaderCode();
	this._shadercode.code = final_code;
	this._mustUpdate = false;
}

SurfaceMaterial.prototype.renderInstance = ShaderMaterial.prototype.renderInstance;

SurfaceMaterial.prototype.getShaderCode = function( instance, render_settings, pass )
{
	if(!this._shadercode || this._mustUpdate )
		this.computeCode();
	return this._shadercode;
}

SurfaceMaterial.prototype.fillUniforms = function( scene, options )
{
	var samplers = this._samplers;
	samplers.length = 0;

	var last_texture_slot = 0;
	for(var i = 0, l = this.properties.length; i < l; ++i )
	{
		var prop = this.properties[i];
		if(prop.type == "texture" || prop.type == "cubemap" || prop.type == "sampler")
		{
			var texture = prop.value;
			samplers[ last_texture_slot ] = texture;
			this._uniforms[ prop.name ] = last_texture_slot;
			last_texture_slot++;
		}
		else
			this._uniforms[ prop.name ] = prop.value;
	}

	this._uniforms.u_material_color = this._color;
}

SurfaceMaterial.prototype.configure = function(o) { 
	if(o.flags !== undefined && o.flags.constructor === Number)
		delete o["flags"]; //LEGACY
	Material.prototype.configure.call( this, o ); //it will call setProperty
	//LS.cloneObject( o, this );
	if(o.properties)
		this.properties = LS.cloneObject( o.properties );
	this.computeCode();
}

/**
* gets all the properties and its types
* @method getPropertiesInfo
* @return {Object} object with name:type
*/
SurfaceMaterial.prototype.getPropertiesInfo = function()
{
	var o = {
		color: LS.TYPES.VEC3,
		opacity: LS.TYPES.NUMBER,
		shader_name: LS.TYPES.STRING,
		blend_mode: LS.TYPES.NUMBER,
		code: LS.TYPES.STRING
	};

	//from this material
	for(var i in this.properties)
	{
		var prop = this.properties[i];
		o[prop.name] = prop.type;
	}	

	return o;
}

/**
* Event used to inform if one resource has changed its name
* @method onResourceRenamed
* @param {Object} resources object where all the resources are stored
* @return {Texture}
*/
SurfaceMaterial.prototype.onResourceRenamed = function (old_name, new_name, resource)
{
	//global
	Material.prototype.onResourceRenamed.call( this, old_name, new_name, resource );

	//specific
	for(var i = 0, l = this.properties.length; i < l; ++i )
	{
		var prop = this.properties[i];
		if( prop.value == old_name)
			prop.value = new_name;
	}
}


/**
* gets all the properties and its types
* @method getProperty
* @return {Object} object with name:type
*/
SurfaceMaterial.prototype.getProperty = function( name )
{
	if(this[name])
		return this[name];

	if( name.substr(0,4) == "tex_")
	{
		var tex = this.textures[ name.substr(4) ];
		if(!tex) return null;
		return tex.texture;
	}

	for(var i = 0, l = this.properties.length; i < l; ++i )
	{
		var prop = this.properties[i];
		if(prop.name == name)
			return prop.value;
	}	

	return null;
}

/**
* assign a value to a property in a safe way
* @method setProperty
* @param {Object} object to configure from
*/
SurfaceMaterial.prototype.setProperty = function(name, value)
{
	//redirect to base material
	if( Material.prototype.setProperty.call(this,name,value) )
		return true;

	if(name == "shader_name")
		this.shader_name = value;

	for(var i = 0, l = this.properties.length; i < l; ++i )
	{
		var prop = this.properties[i];
		if(prop.name != name)
			continue;
		prop.value = value;
		return true;
	}

	if( this[name] !== undefined)
		this[name] = value;
	else
		return false;
	return true;
}

/*
SurfaceMaterial.prototype.setPropertyValueFromPath = function( path, value, offset )
{
	offset = offset || 0;
	if( path.length < (offset+1) )
		return;
	return this.setProperty( path[offset], value );
}
*/

SurfaceMaterial.prototype.getPropertyInfoFromPath = function( path )
{
	if( path.length < 1)
		return;

	var info = Material.prototype.getPropertyInfoFromPath.call(this,path);
	if(info)
		return info;

	var varname = path[0];

	for(var i = 0, l = this.properties.length; i < l; ++i )
	{
		var prop = this.properties[i];
		if(prop.name != varname)
			continue;

		return {
			node: this._root,
			target: this,
			name: prop.name,
			value: prop.value,
			type: prop.type
		};
	}

	return;
}


SurfaceMaterial.prototype.getTextureChannels = function()
{
	var channels = [];

	for(var i = 0, l = this.properties.length; i < l; ++i )
	{
		var prop = this.properties[i];
		if(prop.type != "texture" && prop.type != "cubemap" && prop.type != "sampler" )
			continue;
		channels.push( prop.name );
	}

	return channels;
}

/**
* Assigns a texture to a channel
* @method setTexture
* @param {String} channel 
* @param {Texture} texture
*/
SurfaceMaterial.prototype.setTexture = function( channel, texture, sampler_options ) {
	if(!channel)
		throw("SurfaceMaterial.prototype.setTexture channel must be specified");

	var sampler = null;


	//special case
	if(channel == "environment")
		return Material.prototype.setTexture.call(this, channel, texture, sampler_options );

	for(var i = 0; i < this.properties.length; ++i)
	{
		var prop = this.properties[i];
		if(prop.type != "texture" && prop.type != "cubemap" && prop.type != "sampler")
			continue;

		if(channel && prop.name != channel) //assign to the channel or if there is no channel just to the first one
			continue;

		//assign sampler
		sampler = this.textures[ channel ];
		if(!sampler)
			sampler = this.textures[channel] = { texture: texture, uvs: "0", wrap: 0, minFilter: 0, magFilter: 0 }; //sampler

		if(sampler_options)
			for(var i in sampler_options)
				sampler[i] = sampler_options[i];

		prop.value = prop.type == "sampler" ? sampler : texture;
		break;
	}

	//preload texture
	if(texture && texture.constructor == String && texture[0] != ":")
		LS.ResourcesManager.load( texture );

	return sampler;
}

/**
* Collects all the resources needed by this material (textures)
* @method getResources
* @param {Object} resources object where all the resources are stored
* @return {Texture}
*/
SurfaceMaterial.prototype.getResources = function (res)
{
	for(var i = 0, l = this.properties.length; i < l; ++i )
	{
		var prop = this.properties[i];
		if(prop.type != "texture" && prop.type != "cubemap" && prop.type != "sampler")
			continue;
		if(!prop.value)
			continue;

		var texture = prop.type == "sampler" ? prop.value.texture : prop.value;
		if( typeof( texture ) == "string" )
			res[ texture ] = GL.Texture;
	}

	return res;
}

LS.registerMaterialClass( SurfaceMaterial );
LS.SurfaceMaterial = SurfaceMaterial;

SurfaceMaterial.code_template = "\n\
\n\
\n\
\\color.vs\n\
\n\
precision mediump float;\n\
attribute vec3 a_vertex;\n\
attribute vec3 a_normal;\n\
attribute vec2 a_coord;\n\
\n\
//varyings\n\
varying vec3 v_pos;\n\
varying vec3 v_normal;\n\
varying vec2 v_uvs;\n\
\n\
//matrices\n\
uniform mat4 u_model;\n\
uniform mat4 u_normal_model;\n\
uniform mat4 u_view;\n\
uniform mat4 u_viewprojection;\n\
\n\
//globals\n\
uniform float u_time;\n\
uniform vec4 u_viewport;\n\
uniform float u_point_size;\n\
\n\
#pragma shaderblock \"light\"\n\
#pragma shaderblock \"morphing\"\n\
#pragma shaderblock \"skinning\"\n\
\n\
//camera\n\
uniform vec3 u_camera_eye;\n\
void main() {\n\
	\n\
	vec4 vertex4 = vec4(a_vertex,1.0);\n\
	v_normal = a_normal;\n\
	v_uvs = a_coord;\n\
  \n\
  //deforms\n\
  applyMorphing( vertex4, v_normal );\n\
  applySkinning( vertex4, v_normal );\n\
	\n\
	//vertex\n\
	v_pos = (u_model * vertex4).xyz;\n\
  \n\
  applyLight(v_pos);\n\
  \n\
	//normal\n\
	v_normal = (u_normal_model * vec4(v_normal,0.0)).xyz;\n\
	gl_Position = u_viewprojection * vec4(v_pos,1.0);\n\
}\n\
\n\
\\color.fs\n\
\n\
precision mediump float;\n\
\n\
//varyings\n\
varying vec3 v_pos;\n\
varying vec3 v_normal;\n\
varying vec2 v_uvs;\n\
\n\
//globals\n\
uniform vec3 u_camera_eye;\n\
uniform vec4 u_clipping_plane;\n\
uniform float u_time;\n\
uniform vec4 u_background_color;\n\
uniform vec4 u_material_color;\n\
\n\
#pragma shaderblock \"light\"\n\
#pragma shaderblock \"applyReflection\"\n\
\n\
#pragma snippet \"perturbNormal\"\n\
\n\
{{}}\n\
\n\
void main() {\n\
	Input IN = getInput();\n\
	SurfaceOutput o = getSurfaceOutput();\n\
	surf(IN,o);\n\
	vec4 final_color = vec4(0.0);\n\
	Light LIGHT = getLight();\n\
	final_color.xyz = computeLight( o, IN, LIGHT );\n\
	final_color.a = o.Alpha;\n\
	if( o.Reflectivity > 0.0 )\n\
		final_color = applyReflection( IN, o, final_color );\n\
	\n\
	gl_FragColor = final_color;\n\
}\n\
\n\
\\shadow.vs\n\
\n\
precision mediump float;\n\
attribute vec3 a_vertex;\n\
attribute vec3 a_normal;\n\
attribute vec2 a_coord;\n\
#ifdef USE_COLORS\n\
attribute vec4 a_color;\n\
#endif\n\
\n\
//varyings\n\
varying vec3 v_pos;\n\
varying vec3 v_normal;\n\
varying vec2 v_uvs;\n\
\n\
//matrices\n\
uniform mat4 u_model;\n\
uniform mat4 u_normal_model;\n\
uniform mat4 u_view;\n\
uniform mat4 u_viewprojection;\n\
\n\
//globals\n\
uniform float u_time;\n\
uniform vec4 u_viewport;\n\
uniform float u_point_size;\n\
\n\
#pragma shaderblock \"light\"\n\
#pragma shaderblock \"morphing\"\n\
#pragma shaderblock \"skinning\"\n\
\n\
//camera\n\
uniform vec3 u_camera_eye;\n\
void main() {\n\
	\n\
	vec4 vertex4 = vec4(a_vertex,1.0);\n\
	v_normal = a_normal;\n\
	v_uvs = a_coord;\n\
  \n\
  //deforms\n\
  applyMorphing( vertex4, v_normal );\n\
  applySkinning( vertex4, v_normal );\n\
	\n\
	//vertex\n\
	v_pos = (u_model * vertex4).xyz;\n\
  \n\
  applyLight(v_pos);\n\
  \n\
	//normal\n\
	v_normal = (u_normal_model * vec4(v_normal,0.0)).xyz;\n\
	gl_Position = u_viewprojection * vec4(v_pos,1.0);\n\
}\n\
\\shadow.fs\n\
\n\
precision mediump float;\n\
\n\
//varyings\n\
varying vec3 v_pos;\n\
varying vec3 v_normal;\n\
varying vec2 v_uvs;\n\
\n\
//globals\n\
uniform vec3 u_camera_eye;\n\
uniform vec4 u_clipping_plane;\n\
uniform vec4 u_material_color;\n\
\n\
uniform mat3 u_texture_matrix;\n\
\n\
#pragma snippet \"input\"\n\
#pragma snippet \"surface\"\n\
#pragma snippet \"perturbNormal\"\n\
#define SHADOWMAP\n\
\n\
{{}}\n\
\n\
void main() {\n\
  Input IN = getInput();\n\
  SurfaceOutput o = getSurfaceOutput();\n\
  surf(IN,o);\n\
  gl_FragColor = vec4(o.Albedo,o.Alpha);\n\
}\n\
";