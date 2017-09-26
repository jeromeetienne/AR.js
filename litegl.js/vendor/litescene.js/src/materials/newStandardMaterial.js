//modes
//- per texture
//- texture coordinates
//- vertex color and extras
//- alpha test

//StandardMaterial class **************************
/* Warning: a material is not a component, because it can be shared by multiple nodes */

/**
* StandardMaterial class improves the material class
* @namespace LS
* @class StandardMaterial
* @constructor
* @param {Object} object [optional] to configure from
*/

function newStandardMaterial(o)
{
	Material.call(this,null); //do not pass the data object, it is called later

	this.blend_mode = LS.Blend.NORMAL;

	this.createProperty( "diffuse", new Float32Array([1.0,1.0,1.0]), "color" );
	this.createProperty( "ambient", new Float32Array([1.0,1.0,1.0]), "color" );
	this.createProperty( "emissive", new Float32Array([0,0,0,0]), "color" ); //fourth component to control if emissive is affected by albedo

	this._specular_data = vec4.fromValues( 0.1, 10.0, 0.0, 0.0 ); //specular factor, glossiness, specular_on_top
	this.specular_on_top = false;
	this.specular_on_alpha = false;

	this.backlight_factor = 0;

	this.reflection_factor = 0.0;
	this.reflection_fresnel = 1.0;
	this.reflection_specular = false;

	this.createProperty( "velvet", new Float32Array([0.5,0.5,0.5]), "color" );
	this.velvet_exp = 0.0;
	this.velvet_additive = false;
	this._velvet_info = vec4.create();

	this._detail = new Float32Array([0.0, 10, 10]);

	this.normalmap_factor = 1.0;
	this.normalmap_tangent = true;

	this.displacementmap_factor = 0.1;

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
//		flat_normals: false,
		ignore_frustum: false
	};

	//used for special fx 
	this._uniforms = {
		u_material_color: this._color,
		u_ambient_color: this._ambient,
		u_emissive_color: this._emissive,
		u_specular: this._specular_data,
		u_reflection_info: vec2.create(), //factor and fresnel
		u_velvet_info: vec4.create(),
		u_normal_info: vec2.create(),
		u_detail_info: this._detail,
		u_texture_matrix: this.uvs_matrix
	};

	this._samplers = [];

	this.needsUpdate = true;

	if(o) 
		this.configure(o);
}


Object.defineProperty( newStandardMaterial.prototype, 'detail_factor', {
	get: function() { return this._detail[0]; },
	set: function(v) { this._detail[0] = v; },
	enumerable: true
});

Object.defineProperty( newStandardMaterial.prototype, 'detail_scale', {
	get: function() { return this._detail.subarray(1,3); },
	set: function(v) { this._detail[1] = v[0]; this._detail[2] = v[1]; },
	enumerable: true
});

Object.defineProperty( newStandardMaterial.prototype, 'emissive_extra', {
	get: function() { return this._emissive[3]; },
	set: function(v) { this._emissive[3] = v; },
	enumerable: true
});

Object.defineProperty( newStandardMaterial.prototype, 'specular_factor', {
	get: function() { return this._specular_data[0]; },
	set: function(v) { 
		if( v != null && v.constructor === Number)
			this._specular_data[0] = v;
	},
	enumerable: true
});

Object.defineProperty( newStandardMaterial.prototype, 'specular_gloss', {
	get: function() { return this._specular_data[1]; },
	set: function(v) { this._specular_data[1] = v; },
	enumerable: true
});

newStandardMaterial["@blend_mode"] = { type: "enum", values: LS.Blend };

newStandardMaterial.DETAIL_TEXTURE = "detail";
newStandardMaterial.NORMAL_TEXTURE = "normal";
newStandardMaterial.DISPLACEMENT_TEXTURE = "displacement";
newStandardMaterial.BUMP_TEXTURE = "bump";
newStandardMaterial.REFLECTIVITY_TEXTURE = "reflectivity";
newStandardMaterial.IRRADIANCE_TEXTURE = "irradiance";

newStandardMaterial.prototype.renderInstance = ShaderMaterial.prototype.renderInstance;

newStandardMaterial.prototype.prepare = function( scene )
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

	this._light_mode = this.flags.ignore_lights ? Material.NO_LIGHTS : 1;

	this.fillUniforms( scene ); //update uniforms
}

newStandardMaterial.FLAGS = {
	COLOR_TEXTURE: 1<<1,
	OPACITY_TEXTURE: 1<<2,
	SPECULAR_TEXTURE: 1<<3,
	REFLECTIVITY_TEXTURE: 1<<4,
	AMBIENT_TEXTURE: 1<<5,
	EMISSIVE_TEXTURE: 1<<6,
	DETAIL_TEXTURE: 1<<7,
	NORMAL_TEXTURE: 1<<8,
	DISPLACEMENT_TEXTURE: 1<<9,

	ALPHA_TEST: 1<<16,

	ENVIRONMENT_TEXTURE: 1<<18,
	ENVIRONMENT_CUBEMAP: 1<<19
};	

newStandardMaterial.shader_codes = {};


newStandardMaterial.prototype.getShaderCode = function( instance, render_settings, pass )
{
	var FLAGS = newStandardMaterial.FLAGS;

	//lets check which code flags are active according to the configuration of the shader
	var code_flags = 0;
	var scene = LS.Renderer._current_scene;

	//TEXTURES
	if( this.textures.color )
		code_flags |= FLAGS.COLOR_TEXTURE;
	if( this.textures.opacity )
		code_flags |= FLAGS.OPACITY_TEXTURE;

	//color textures are not necessary 
	if( pass.id == COLOR_PASS )
	{
		if( this.textures.normal )
			code_flags |= FLAGS.NORMAL_TEXTURE;
		if( this.textures.specular )
			code_flags |= FLAGS.SPECULAR_TEXTURE;
		if( this.reflection_factor > 0 )
		{
			//code_flags |= FLAGS.REFLECTION;
			if( this.textures.reflectivity )
				code_flags |= FLAGS.REFLECTIVITY_TEXTURE;
		}
		if( this.textures.emissive )
			code_flags |= FLAGS.EMISSIVE_TEXTURE;
		if( this.textures.ambient )
			code_flags |= FLAGS.AMBIENT_TEXTURE;
		if( this.textures.detail )
			code_flags |= FLAGS.DETAIL_TEXTURE;
	}

	//flags
	if( (this.flags.alpha_test && pass.id == COLOR_PASS) ||
		(this.flags.alpha_test_shadows && pass.id == SHADOW_PASS) )
		code_flags |= FLAGS.ALPHA_TEST;

	//check if we already have this shader created
	var shader_code = LS.newStandardMaterial.shader_codes[ code_flags ];

	//reuse shader codes when possible
	if(shader_code)
		return shader_code;

	//generate code
	var fs_code = "";

	if( code_flags & FLAGS.NORMAL_TEXTURE )
	{
		fs_code += "	vec3 normal_pixel = texture2D( normal_texture, IN.uv ).xyz;\n\
		normal_pixel.xy = vec2(1.0) - normal_pixel.xy;\n\
		if( u_normal_info.y > 0.0 )\n\
			normal_pixel = normalize( perturbNormal( IN.worldNormal, IN.viewDir, IN.uv, normal_pixel ));\n\
		o.Normal = normalize( mix( o.Normal, normal_pixel, u_normal_info.x ) );\n";
	}

	if( code_flags & FLAGS.COLOR_TEXTURE )
	{
		fs_code += "	vec4 tex_color = texture2D( color_texture, IN.uv );\n\
	o.Albedo *= tex_color.xyz;\n\
	o.Alpha *= tex_color.w;\n";
	}
	if( code_flags & FLAGS.OPACITY_TEXTURE )
		fs_code += "	o.Alpha *= texture2D( opacity_texture, IN.uv ).x;\n";
	if( code_flags & FLAGS.SPECULAR_TEXTURE )
	{
		fs_code += "	vec4 spec_info = texture2D( specular_texture, IN.uv );\n\
	o.Specular *= spec_info.x;\n\
	o.Gloss *= spec_info.y;\n";
	}
	if( code_flags & FLAGS.REFLECTIVITY_TEXTURE )
		fs_code += "	o.Reflectivity *= texture2D( reflectivity_texture, IN.uv ).x;\n";
	if( code_flags & FLAGS.EMISSIVE_TEXTURE )
		fs_code += "	o.Emission *= texture2D( emissive_texture, IN.uv ).xyz;\n";
	if( code_flags & FLAGS.AMBIENT_TEXTURE )
		fs_code += "	o.Ambient *= texture2D( ambient_texture, IN.uv ).xyz;\n";
	if( code_flags & FLAGS.DETAIL_TEXTURE )
		fs_code += "	o.Albedo += (texture2D( detail_texture, IN.uv * u_detail_info.yz).xyz - vec3(0.5)) * u_detail_info.x;\n";

	//flags
	if( code_flags & FLAGS.ALPHA_TEST )
		fs_code += "	if(o.Alpha < 0.5) discard;\n";

	//if( code_flags & FLAGS.FLAT_NORMALS )
	//	flat_normals += "";

	//compile shader and cache
	shader_code = new LS.ShaderCode();
	var code = newStandardMaterial.code_template.replace( /{{}}/gi, fs_code );
	shader_code.code = code;
	LS.newStandardMaterial.shader_codes[ code_flags ] = shader_code;
	return shader_code;
}

newStandardMaterial.prototype.fillUniforms = function( scene, options )
{
	var uniforms = this._uniforms;

	uniforms.u_reflection_info[0] = this.reflection_factor;
	uniforms.u_reflection_info[1] = this.reflection_fresnel;
	uniforms.u_backlight_factor = this.backlight_factor;
	uniforms.u_normal_info[0] = this.normalmap_factor;
	uniforms.u_normal_info[1] = this.normalmap_tangent ? 1 : 0;
	uniforms.u_displacementmap_factor = this.displacementmap_factor;
	uniforms.u_velvet_info.set( this._velvet );
	uniforms.u_velvet_info[3] = this.velvet_additive ? this.velvet_exp : -this.velvet_exp;

	//iterate through textures in the material
	var last_texture_slot = 0;
	var samplers = this._samplers;
	samplers.length = 0; //clear
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
		//var uniform_name = i + ( (!texture || texture.texture_type == gl.TEXTURE_2D) ? "_texture" : "_cubemap");
		uniforms[ i + "_texture" ] = slot;
	}
}

newStandardMaterial.prototype.getTextureChannels = function()
{
	return [ Material.COLOR_TEXTURE, Material.OPACITY_TEXTURE, Material.AMBIENT_TEXTURE, Material.SPECULAR_TEXTURE, Material.EMISSIVE_TEXTURE, newStandardMaterial.DETAIL_TEXTURE, newStandardMaterial.NORMAL_TEXTURE, newStandardMaterial.DISPLACEMENT_TEXTURE, newStandardMaterial.BUMP_TEXTURE, newStandardMaterial.REFLECTIVITY_TEXTURE, Material.ENVIRONMENT_TEXTURE, newStandardMaterial.IRRADIANCE_TEXTURE ];
}

/**
* assign a value to a property in a safe way
* @method setProperty
* @param {Object} object to configure from
*/
newStandardMaterial.prototype.setProperty = function(name, value)
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
		case "detail_factor":
		case "emissive_extra":
		//strings
		case "shader_name":
		//bools
		case "specular_on_top":
		case "specular_on_alpha":
		case "normalmap_tangent":
		case "reflection_specular":
		case "use_scene_ambient":
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
		case "emissive": 
		case "velvet":
		case "detail_scale":
			if(this[name].length == value.length)
				this[name].set(value);
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
newStandardMaterial.prototype.getPropertiesInfo = function()
{
	//get from the regular material
	var o = Material.prototype.getPropertiesInfo.call(this);

	//add some more
	o.merge({
		shader_name:  LS.TYPES.STRING,

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

		ambient: LS.TYPES.VEC3,
		emissive: LS.TYPES.VEC3,
		velvet: LS.TYPES.VEC3,
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

newStandardMaterial.prototype.getPropertyInfoFromPath = function( path )
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
		case "detail_factor":
			type = LS.TYPES.NUMBER; break;
		case "ambient":
		case "emissive":
		case "velvet":
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

LS.registerMaterialClass( newStandardMaterial );
LS.newStandardMaterial = newStandardMaterial;

newStandardMaterial.code_template = "\n\
\n\
\n\
\\color.vs\n\
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
uniform vec4 u_background_color;\n\
uniform vec4 u_material_color;\n\
\n\
uniform vec3 u_ambient_color;\n\
uniform vec4 u_emissive_color;\n\
uniform vec4 u_specular;\n\
uniform vec2 u_reflection_info;\n\
uniform vec4 u_velvet_info;\n\
uniform vec2 u_normal_info;\n\
uniform vec3 u_detail_info;\n\
uniform mat3 u_texture_matrix;\n\
\n\
uniform sampler2D color_texture;\n\
uniform sampler2D opacity_texture;\n\
uniform sampler2D specular_texture;\n\
uniform sampler2D ambient_texture;\n\
uniform sampler2D emissive_texture;\n\
uniform sampler2D reflectivity_texture;\n\
uniform sampler2D detail_texture;\n\
uniform sampler2D normal_texture;\n\
\n\
uniform vec4 u_color_texture_settings;\n\
uniform vec4 u_opacity_texture_settings;\n\
uniform vec4 u_specular_texture_settings;\n\
uniform vec4 u_ambient_texture_settings;\n\
uniform vec4 u_emissive_texture_settings;\n\
uniform vec4 u_reflectivity_texture_settings;\n\
uniform vec4 u_normal_texture_settings;\n\
\n\
\n\
#pragma shaderblock \"light\"\n\
#pragma shaderblock \"applyReflection\"\n\
\n\
#pragma snippet \"perturbNormal\"\n\
\n\
void surf(in Input IN, out SurfaceOutput o)\n\
{\n\
	o.Albedo = u_material_color.xyz;\n\
	o.Alpha = u_material_color.a;\n\
	o.Normal = normalize( v_normal );\n\
	o.Specular = u_specular.x;\n\
	o.Gloss = u_specular.y;\n\
	o.Ambient = u_ambient_color;\n\
	o.Emission = u_emissive_color.xyz;\n\
	o.Reflectivity = u_reflection_info.x;\n\
	\n\
	{{}}\n\
	\n\
	if(u_velvet_info.w > 0.0)\n\
		o.Albedo += u_velvet_info.xyz * ( 1.0 - pow( max(0.0, dot( IN.viewDir, o.Normal )), u_velvet_info.w ));\n\
	else if(u_velvet_info.w < 0.0)\n\
		o.Albedo = mix( o.Albedo, u_velvet_info.xyz, 1.0 - pow( max(0.0, dot( IN.viewDir, o.Normal )), abs(u_velvet_info.w) ) );\n\
	if(u_emissive_color.w > 0.0)\n\
		o.Emission *= o.Albedo;\n\
	o.Reflectivity *= max(0.0, pow( 1.0 - clamp(0.0, dot(IN.viewDir,o.Normal),1.0), u_reflection_info.y ));\n\
}\n\
\n\
\n\
void main() {\n\
  Input IN = getInput();\n\
  SurfaceOutput o = getSurfaceOutput();\n\
  surf(IN,o);\n\
  vec4 final_color = vec4(0.0);\n\
  Light LIGHT = getLight();\n\
  final_color.xyz = computeLight( o, IN, LIGHT );\n\
  final_color.a = o.Alpha;\n\
  final_color = applyReflection( IN, o, final_color );\n\
  gl_FragColor = final_color;\n\
}\n\
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
uniform sampler2D color_texture;\n\
uniform sampler2D opacity_texture;\n\
\n\
#pragma snippet \"input\"\n\
#pragma snippet \"surface\"\n\
\n\
void surf(in Input IN, out SurfaceOutput o)\n\
{\n\
	o.Albedo = u_material_color.xyz;\n\
	o.Alpha = u_material_color.a;\n\
	\n\
	{{}}\n\
}\n\
\n\
void main() {\n\
  Input IN = getInput();\n\
  SurfaceOutput o = getSurfaceOutput();\n\
  surf(IN,o);\n\
  gl_FragColor = vec4(o.Albedo,o.Alpha);\n\
}\n\
";