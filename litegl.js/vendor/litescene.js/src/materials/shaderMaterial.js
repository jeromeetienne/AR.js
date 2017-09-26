
/**
* ShaderMaterial allows to use your own shader from scratch, but you loose some of the benefits of using the dynamic shader system of LS
* @namespace LS
* @class ShaderMaterial
* @constructor
* @param {Object} object [optional] to configure from
*/
function ShaderMaterial( o )
{
	Material.call( this, null );

	this._shader = "";
	this._shader_version = -1;
	this._shader_flags = 0; //?

	this._uniforms = {};
	this._samplers = [];
	this._properties = [];
	this._properties_by_name = {};

	this._passes = {};
	this._light_mode = 0;
	this._primitive = -1;

	this._version = -1;
	this._shader_version = -1;

	if(o) 
		this.configure(o);
}

Object.defineProperty( ShaderMaterial.prototype, "shader", {
	enumerable: true,
	get: function() {
		return this._shader;
	},
	set: function(v) {
		if(v)
			v = LS.ResourcesManager.cleanFullpath(v);
		if(this._shader == v)
			return;
		this._shader = v;
		this.processShaderCode();
	}
});

Object.defineProperty( ShaderMaterial.prototype, "properties", {
	enumerable: true,
	get: function() {
		return this._properties;
	},
	set: function(v) {
		if(!v)
			return;
		this._properties = v;
		this._properties_by_name = {};
		for(var i in this._properties)
		{
			var p = this._properties[i];
			this._properties_by_name[ p.name ] = p;
		}
	}
});

Object.defineProperty( ShaderMaterial.prototype, "enableLights", {
	enumerable: true,
	get: function() {
		return this._light_mode != 0;
	},
	set: function(v) {
		this._light_mode = v ? 1 : 0;
	}
});

Object.defineProperty( ShaderMaterial.prototype, "version", {
	enumerable: false,
	get: function() {
		return this._version;
	},
	set: function(v) {
		console.error("version cannot be set manually");
	}
});

ShaderMaterial.prototype.addPass = function( name, vertex_shader, fragment_shader, macros )
{
	this._passes[ name ] = {
		vertex: vertex_shader,
		fragment: fragment_shader,
		macros: macros
	};
}

//called when preparing materials before rendering the scene
ShaderMaterial.prototype.prepare = function( scene )
{
	this.fillUniforms();

	if( this.onPrepare )
		this.onPrepare( scene );
}

//called when filling uniforms from prepare
ShaderMaterial.prototype.fillUniforms = function()
{
	//gather uniforms & samplers
	var samplers = this._samplers;
	samplers.length = 0;

	this._uniforms.u_material_color = this._color;

	for(var i = 0; i < this._properties.length; ++i)
	{
		var p = this._properties[i];
		if(p.internal) //internal is a property that is not for the shader (is for internal computations)
			continue;

		if(p.is_texture)
		{
			this._uniforms[ p.uniform ] = samplers.length;
			if(p.value)
				samplers.push( p.value );
			else
				samplers.push( " " ); //force missing texture
		}
		else
			this._uniforms[ p.uniform ] = p.value;
	}
}

//assigns a value to a property
ShaderMaterial.prototype.setProperty = function(name, value)
{
	//redirect to base material
	if( Material.prototype.setProperty.call(this,name,value) )
		return true;

	if(name == "shader")
		this.shader = value;
	else if(name == "properties")
	{
		this.properties.length = 0;
		this._properties_by_name = {};
		for(var i = 0; i < value.length; ++i)
		{
			var prop = value[i];
			if(prop.is_texture && prop.value && prop.value.constructor === String)
				prop.value = { texture: prop.value };
			this.properties[i] = prop;
			this._properties_by_name[ prop.name ] = prop;
			//if(prop.is_texture)
			//	this._samplers.push( prop.value );
		}
	}
	else if( this._properties_by_name[ name ] )
	{
		var prop = this._properties_by_name[ name ];
		if( !prop.value || !prop.value.length)
			prop.value = value;
		else
			prop.value.set( value );
	}
	else
		return false;
	return true;
}

//check the ShaderCode associated and applies it to this material (keeping the state of the properties)
ShaderMaterial.prototype.processShaderCode = function()
{
	if(!this._shader)
	{
		this._properties.length = 0;
		this._properties_by_name = {};
		this._passes = {};
		this._samplers.length = 0;
		return false;
	}

	//get shader code
	var shader_code = LS.ResourcesManager.getResource( this.shader );
	if(!shader_code || shader_code.constructor !== LS.ShaderCode )
		return false;

	var old_properties = this._properties_by_name;
	this._properties.length = 0;
	this._properties_by_name = {};
	this._passes = {};
	this._samplers.length = 0;
	this._light_mode = 0;
	this._primitive = -1;

	//reset material properties
	this._queue = LS.RenderQueue.GEOMETRY;
	this.render_state.init();

	//clear old functions
	for(var i in this)
	{
		if(!this.hasOwnProperty(i))
			continue;
		if( this[i] && this[i].constructor === Function )
			delete this[i];
	}

	//apply init 
	if( shader_code._functions.init )
	{
		if(!LS.catch_exceptions)
			shader_code._functions.init.call( this );
		else
		{
			try
			{
				shader_code._functions.init.call( this );
			}
			catch (err)
			{
				LS.dispatchCodeError(err);
			}
		}
	}

	for(var i in shader_code._global_uniforms)
	{
		var global = shader_code._global_uniforms[i];
		if( global.disabled ) //in case this var is not found in the shader
			continue;
		this.createUniform( global.name, global.uniform, global.type, global.value, global.options );
	}

	//restore old values
	this.assignOldProperties( old_properties );

	//set stuff
	//TODO

	this._shader_version = shader_code._version;
	this._version++;
}

//used after changing the code of the ShaderCode and wanting to reload the material keeping the old properties
ShaderMaterial.prototype.assignOldProperties = function( old_properties )
{
	//get shader code
	var shader = null;
	var shader_code = this.getShaderCode(); //no parameters because we just want the render_state and init stuff
	if( shader_code )
		shader = shader_code.getShader();

	for(var i = 0; i < this._properties.length; ++i)
	{
		var new_prop = this._properties[i];

		if(!old_properties[ new_prop.name ])
			continue;
		var old = old_properties[ new_prop.name ];
		if(old.value === undefined)
			continue;


		//validate
		if( !old.internal && shader )
		{
			var uniform_info = shader.uniformInfo[ new_prop.uniform ];
			if(!uniform_info)
				continue;
			if(new_prop.value !== undefined)
			{
				if( !GL.Shader.validateValue( new_prop.value, uniform_info ) )
				{
					new_prop.value = undefined;
					continue;
				}
			}
		}

		//this is to keep current values when coding the shader from the editor
		if( new_prop.value && new_prop.value.set ) //special case for typed arrays avoiding generating GC
		{
			//this is to be careful when an array changes sizes
			if( old.value && old.value.length && new_prop.value.length && old.value.length <= new_prop.value.length)
				new_prop.value.set( old.value );
			else
				new_prop.value = old.value;
		}
		else
			new_prop.value = old.value;
	}
}

//called from LS.Renderer when rendering an instance
ShaderMaterial.prototype.renderInstance = function( instance, render_settings, pass )
{
	//get shader code
	var shader_code = this.getShaderCode( instance, render_settings, pass );
	if(!shader_code || shader_code.constructor !== LS.ShaderCode )
		return true; //skip rendering

	//this is in case the shader has been modified in the editor (reapplies the shadercode to the material)
	if( shader_code._version !== this._shader_version && this.processShaderCode )
		this.processShaderCode();

	//some globals
	var renderer = LS.Renderer;
	var camera = LS.Renderer._current_camera;
	var scene = LS.Renderer._current_scene;
	var model = instance.matrix;

	//node matrix info
	var instance_final_query = instance._final_query;
	var instance_final_samplers = instance._final_samplers;
	var render_uniforms = LS.Renderer._render_uniforms;

	//maybe this two should be somewhere else
	render_uniforms.u_model = model; 
	render_uniforms.u_normal_model = instance.normal_matrix; 

	//compute flags: checks the ShaderBlocks attached to this instance and resolves the flags
	var block_flags = instance.computeShaderBlockFlags();

	//global stuff
	this.render_state.enable();
	LS.Renderer.bindSamplers( this._samplers );
	var global_flags = 0;

	if( pass.id == COLOR_PASS ) //allow reflections only in color pass
	{
		global_flags |= LS.ShaderMaterial.reflection_block.flag_mask;
		if( LS.Renderer._global_textures.environment )
		{
			if( LS.Renderer._global_textures.environment.texture_type == GL.TEXTURE_2D )
				global_flags |= environment_2d_block.flag_mask;
			else
				global_flags |= environment_cubemap_block.flag_mask;
		}
	}

	if(this.onRenderInstance)
		this.onRenderInstance( instance );

	//add flags related to lights
	var lights = null;

	//ignore lights renders the object with illumination
	var ignore_lights = pass.id != COLOR_PASS || render_settings.lights_disabled || this._light_mode === Material.NO_LIGHTS;

	if( !ignore_lights )
		lights = LS.Renderer.getNearLights( instance );

	if( !lights || lights.length == 0 || ignore_lights )
	{
		//extract shader compiled
		var shader = shader_code.getShader( pass.name, block_flags );
		if(!shader)
		{
			//var shader = shader_code.getShader( "surface", block_flags );
			return false;
		}

		//assign
		shader.uniformsArray( [ scene._uniforms, camera._uniforms, render_uniforms, light ? light._uniforms : null, this._uniforms, instance.uniforms ] );

		if( ignore_lights )
			shader.setUniform("u_ambient_light", LS.ONES );

		//render
		instance.render( shader, this._primitive != -1 ? this._primitive : undefined );
		renderer._rendercalls += 1;
	
		return true;
	}

	var prev_shader = null;
	for(var i = 0; i < lights.length; ++i)
	{
		var light = lights[i];
		block_flags = light.applyShaderBlockFlags( block_flags, pass, render_settings );

		//global
		block_flags |= global_flags;

		//extract shader compiled
		var shader = shader_code.getShader( null, block_flags );
		if(!shader)
			continue;

		//light texture like shadowmap and cookie
		LS.Renderer.bindSamplers( light._samplers );

		//light parameters (like index of pass or num passes)
		light._uniforms.u_light_info[2] = i;
		light._uniforms.u_light_info[3] = lights.length;

		//assign
		if(prev_shader != shader)
			shader.uniformsArray( [ scene._uniforms, camera._uniforms, render_uniforms, light._uniforms, this._uniforms, instance.uniforms ] );
		else
			shader.uniforms( light._uniforms );
		prev_shader = shader;

		if(i == 1)
		{
			gl.depthMask( false );
			gl.depthFunc( gl.EQUAL );
			gl.enable( gl.BLEND );
			gl.blendFunc( gl.SRC_ALPHA, gl.ONE );
		}

		//render
		instance.render( shader, this._primitive != -1 ? this._primitive : undefined );
		renderer._rendercalls += 1;
	}

	//optimize this
	gl.disable( gl.BLEND );
	gl.depthMask( true );
	gl.depthFunc( gl.LESS );

	return true;
}

ShaderMaterial.prototype.renderShadowInstance = function( instance, render_settings, pass )
{
	return this.renderInstance( instance, render_settings, pass );
}

ShaderMaterial.prototype.renderPickingInstance = function( instance, render_settings, pass )
{
	//get shader code
	var shader_code = this.getShaderCode( instance, render_settings, pass );
	if(!shader_code || shader_code.constructor !== LS.ShaderCode )
		return;

	//some globals
	var renderer = LS.Renderer;
	var camera = LS.Renderer._current_camera;
	var scene = LS.Renderer._current_scene;
	var model = instance.matrix;
	var node = instance.node;

	//node matrix info
	var instance_final_query = instance._final_query;
	var instance_final_samplers = instance._final_samplers;
	var render_uniforms = LS.Renderer._render_uniforms;

	//maybe this two should be somewhere else
	render_uniforms.u_model = model; 
	render_uniforms.u_normal_model = instance.normal_matrix; 

	//compute flags
	var block_flags = instance.computeShaderBlockFlags();

	//global stuff
	this.render_state.enable();
	LS.Renderer.bindSamplers( this._samplers );

	//extract shader compiled
	var shader = shader_code.getShader( pass.name, block_flags );
	if(!shader)
	{
		shader_code = LS.ShaderMaterial.getDefaultPickingShaderCode();
		shader = shader_code.getShader( pass.name, block_flags );
		if(!shader)
			return false; //??!
	}

	//assign uniforms
	shader.uniformsArray( [ camera._uniforms, render_uniforms, this._uniforms, instance.uniforms ] );

	//set color
	var pick_color = LS.Picking.getNextPickingColor( instance.picking_node || node );
	shader.setUniform("u_material_color", pick_color );

	//render
	instance.render( shader, this._primitive != -1 ? this._primitive : undefined );
	renderer._rendercalls += 1;

	//optimize this
	gl.disable( gl.BLEND );
	gl.depthMask( true );
	gl.depthFunc( gl.LESS );

	return true;
}

ShaderMaterial.prototype.getTextureChannels = function()
{
	var channels = [];

	for(var i in this._properties)
	{
		var p = this._properties[i];
		if(p.is_texture)
			channels.push( p.name );
	}

	return channels;
}

/**
* Collects all the resources needed by this material (textures)
* @method getResources
* @param {Object} resources object where all the resources are stored
* @return {Texture}
*/
ShaderMaterial.prototype.getResources = function ( res )
{
	if(this.shader)
		res[ this.shader ] = LS.ShaderCode;

	for(var i in this._properties)
	{
		var p = this._properties[i];
		if(p.value && p.is_texture)
		{
			if(!p.value)
				continue;
			var name = null;
			if(p.value.texture)
				name = 	p.value.texture;
			else
				name = res[ p.value ];
			if(name && name.constructor === String)
				res[name] = GL.Texture;
		}
	}
	return res;
}


ShaderMaterial.prototype.getPropertyInfoFromPath = function( path )
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

//get shader code
ShaderMaterial.prototype.getShaderCode = function( instance, render_settings, pass )
{
	var shader_code = LS.ResourcesManager.getResource( this.shader );
	if(!shader_code || shader_code.constructor !== LS.ShaderCode )
		return null;

	//this is in case the shader has been modified in the editor (reapplies the shadercode to the material)
	if( shader_code._version !== this._shader_version && this.processShaderCode )
	{
		shader_code._version = this._shader_version;
		this.processShaderCode();
	}

	return shader_code;
}

/**
* Takes an input texture and applies the ShaderMaterial, the result is shown on the viewport or stored in the output_texture
* The ShaderCode must contain a "fx" method.
* Similar to the method BlitTexture in Unity
* @method applyToTexture
* @param {Texture} input_texture
* @param {Texture} output_texture [optional] where to store the result, if omitted it will be shown in the viewport
*/
ShaderMaterial.prototype.applyToTexture = function( input_texture, output_texture )
{
	if( !this.shader || !input_texture )
		return false;

	//get shader code
	var shader_code = this.getShaderCode(); //special use
	if(!shader_code)
		return false;

	//extract shader compiled
	var shader = shader_code.getShader("fx");
	if(!shader)
		return false;

	//global vars
	this.fillUniforms();
	this._uniforms.u_time = LS.GlobalScene._time;
	this._uniforms.u_viewport = gl.viewport_data;

	//bind samplers
	LS.Renderer.bindSamplers( this._samplers );

	gl.disable( gl.DEPTH_TEST );
	gl.disable( gl.CULL_FACE );

	//render
	if(!output_texture)
		input_texture.toViewport( shader, this._uniforms );
	else
		output_texture.drawTo( function(){
			input_texture.toViewport( shader, this._uniforms );
		});
}

/**
* Makes one shader variable (uniform) public so it can be assigned from the engine (or edited from the editor)
* @method createUniform
* @param {String} name the property name as it should be shown
* @param {String} uniform the uniform name in the shader
* @param {String} type the var type in case we want to edit it (use LS.TYPES)
* @param {*} value
* @param {Object} options an object containing all the possible options (used mostly for widgets)
*/
ShaderMaterial.prototype.createUniform = function( name, uniform, type, value, options )
{
	if(!name || !uniform)
		throw("parameter missing in createUniform");

	//
	type = type || "Number";
	if( type.constructor !== String )
		throw("type must be string");

	//cast to typed-array
	value = value || 0;
	if(value && value.length)
		value = new Float32Array( value );//cast them always
	else
	{
		//create a value, otherwise is null
		switch (type)
		{
			case "vec2": value = vec2.create(); break;
			case "color":
			case "vec3": value = vec3.create(); break;
			case "color4":
			case "vec4": value = vec4.create(); break;
			case "mat3": value = mat3.create(); break;
			case "mat4": value = mat4.create(); break;
			default:
		}
	}

	//define info
	var prop = { name: name, uniform: uniform, value: value, type: type, is_texture: 0 };

	//mark as texture (because this need to go to the textures container so they are binded)
	if(type.toLowerCase() == "texture" || type == "sampler2D" || type == "samplerCube" || type == "sampler")
		prop.is_texture = (type == "samplerCube") ? 2 : 1;

	if(prop.is_texture)
	{
		prop.sampler = {};
		prop.type = "sampler";
		prop.sampler_slot = this._samplers.length;
		this._samplers.push( prop.sampler );
	}

	if(options)
		for(var i in options)
			prop[i] = options[i];

	this._properties.push( prop );
	this._properties_by_name[ name ] = prop;
}

/**
* Similar to createUniform but for textures, it helps specifying sampler options
* @method createSampler
* @param {String} name the property name as it should be shown
* @param {String} uniform the uniform name in the shader
* @param {Object} options an object containing all the possible options (used mostly for widgets)
* @param {String} value default value (texture name)
*/
ShaderMaterial.prototype.createSampler = function( name, uniform, sampler_options, value  )
{
	if(!name || !uniform)
		throw("parameter missing in createSampler");

	var type = "sampler";
	if( sampler_options && sampler_options.type )
		type = sampler_options.type;

	var sampler = null;

	//do not overwrite
	if( this._properties_by_name[ name ] )
	{
		var current_prop = this._properties_by_name[ name ];
		if( current_prop.type == type && current_prop.value )
			sampler = current_prop.value;
	}

	if(!sampler)
		sampler = {
			texture: value
		};

	var prop = { name: name, uniform: uniform, value: sampler, type: type, is_texture: 1, sampler_slot: -1 };

	if(sampler_options)
	{
		if(sampler_options.filter)
		{
			sampler.magFilter = sampler_options.filter;
			sampler.minFilter = sampler_options.filter;
			delete sampler_options.filter;
		}

		if(sampler_options.wrap)
		{
			sampler.wrapS = sampler_options.wrap;
			sampler.wrapT = sampler_options.wrap;
			delete sampler_options.wrap;
		}

		for(var i in sampler_options)
			sampler[i] = sampler_options[i];
	}
	prop.sampler_slot = this._samplers.length;
	this._properties.push( prop );
	this._properties_by_name[ name ] = prop;
	this._samplers.push( prop.value );
}

/**
* Creates a property for this material, this property wont be passed to the shader but can be used from source code.
* You must used this function if you want the data to be stored when serializing or changing the ShaderCode
* @method createProperty
* @param {String} name the property name as it should be shown
* @param {*} value the default value
* @param {String} type the data type (use LS.TYPES)
* @param {Object} options an object containing all the possible options (used mostly for widgets)
*/
ShaderMaterial.prototype.createProperty = function( name, value, type, options )
{
	var prop = this._properties_by_name[ name ];
	if(prop && prop.type == type) //already exist with the same type
		return;

	prop = { name: name, type: type, internal: true, value: value };
	if(options)
		for(var i in options)
			prop[i] = options[i];

	this._properties.push( prop );
	this._properties_by_name[ name ] = prop;

	Object.defineProperty( this, name, {
		get: function() { 
			var prop = this._properties_by_name[ name ]; //fetch it because could have been overwritten
			if(prop)
				return prop.value;
		},
		set: function(v) { 
			var prop = this._properties_by_name[ name ]; //fetch it because could have been overwritten
			if(!prop)
				return;
			if(prop.value && prop.value.set) //for typed arrays
				prop.value.set( v );
			else
				prop.value = v;
		},
		enumerable: false, //must not be serialized
		configurable: true //allows to overwrite this property
	});
}

/**
* Event used to inform if one resource has changed its name
* @method onResourceRenamed
* @param {Object} resources object where all the resources are stored
* @return {Boolean} true if something was modified
*/
ShaderMaterial.prototype.onResourceRenamed = function (old_name, new_name, resource)
{
	var v = Material.prototype.onResourceRenamed.call(this, old_name, new_name, resource );
	if( this.shader == old_name)
	{
		this.shader = new_name;
		v = true;
	}

	//change texture also in shader values... (this should be automatic but it is not)
	for(var i = 0; i < this._properties.length; ++i)
	{
		var p = this._properties[i];
		if(p.internal) //internal is a property that is not for the shader (is for internal computations)
			continue;

		if( !p.is_texture || !p.value )
			continue;
		if( p.value.texture != old_name )
			continue;
		p.value.texture = new_name;
		v = true;
	}

	return v;
}

ShaderMaterial.getDefaultPickingShaderCode = function()
{
	if( ShaderMaterial.default_picking_shader_code )
		return ShaderMaterial.default_picking_shader_code;
	var sc = new LS.ShaderCode();
	sc.code = LS.ShaderCode.flat_code;
	ShaderMaterial.default_picking_shader_code = sc;
	return sc;
}

LS.registerMaterialClass( ShaderMaterial );
LS.ShaderMaterial = ShaderMaterial;

//Register ShaderBlocks
//TODO?

//ENVIRONMENT 
var environment_code = "\n\
	#ifdef ENVIRONMENT_TEXTURE\n\
		uniform sampler2D environment_texture;\n\
	#endif\n\
	#ifdef ENVIRONMENT_CUBEMAP\n\
		uniform samplerCube environment_texture;\n\
	#endif\n\
	vec2 polarToCartesian(in vec3 V)\n\
	{\n\
		return vec2( 0.5 - (atan(V.z, V.x) / -6.28318531), asin(V.y) / 1.57079633 * 0.5 + 0.5);\n\
	}\n\
	\n\
	vec3 getEnvironmentColor( vec3 V, float area )\n\
	{\n\
		#ifdef ENVIRONMENT_TEXTURE\n\
			vec2 uvs = polarToCartesian(V);\n\
			return texture2D( environment_texture, uvs ).xyz;\n\
		#endif\n\
		#ifdef ENVIRONMENT_CUBEMAP\n\
			return textureCube( environment_texture, -V ).xyz;\n\
		#endif\n\
		return u_background_color.xyz;\n\
	}\n\
";
var environment_disabled_code = "\n\
	vec3 getEnvironmentColor( vec3 V, float area )\n\
	{\n\
		return u_background_color.xyz;\n\
	}\n\
";

var environment_cubemap_block = new LS.ShaderBlock("environment_cubemap");
environment_cubemap_block.addCode( GL.FRAGMENT_SHADER, environment_code, environment_disabled_code, { ENVIRONMENT_CUBEMAP: "" } );
environment_cubemap_block.defineContextMacros({ENVIRONMENTBLOCK:"environment_cubemap"});
environment_cubemap_block.register();

var environment_2d_block = new LS.ShaderBlock("environment_2D");
environment_2d_block.defineContextMacros({ENVIRONMENTBLOCK:"environment_2D"});
environment_2d_block.addCode( GL.FRAGMENT_SHADER, environment_code, environment_disabled_code, { ENVIRONMENT_TEXTURE: "" } );
environment_2d_block.register();

var environment_block = new LS.ShaderBlock("environment");
environment_block.addCode( GL.FRAGMENT_SHADER, environment_code, environment_disabled_code );
environment_block.register();


var reflection_code = "\n\
	#pragma shaderblock ENVIRONMENTBLOCK \"environment\"\n\
	\n\
	vec4 applyReflection( Input IN, SurfaceOutput o, vec4 final_color )\n\
	{\n\
		vec3 R = reflect( IN.viewDir, o.Normal );\n\
		vec3 bg = vec3(0.0);\n\
		if(u_light_info.z == (u_light_info.w - 1.0))\n\
			bg = getEnvironmentColor( R, 0.0 );\n\
		final_color.xyz = mix( final_color.xyz, bg, clamp( o.Reflectivity, 0.0, 1.0) );\n\
		return final_color;\n\
	}\n\
";

var reflection_disabled_code = "\n\
	vec4 applyReflection( Input IN, SurfaceOutput o, vec4 final_color )\n\
	{\n\
		return final_color;\n\
	}\n\
";

var reflection_block = new LS.ShaderBlock("applyReflection");
ShaderMaterial.reflection_block = reflection_block;
reflection_block.addCode( GL.FRAGMENT_SHADER, reflection_code, reflection_disabled_code );
reflection_block.register();
