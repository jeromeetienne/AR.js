
/**
* UnityMaterial allows to use Unity ShaderLab materials
* @namespace LS
* @class UnityMaterial
* @constructor
* @param {Object} object [optional] to configure from
*/
function UnityMaterial( o )
{
	Material.call( this, null );

	this._shader = null;
	this._shader_version = -1;
	this._shader_flags = 0; //?

	this._uniforms = {};
	this._samplers = [];
	this._properties = [];
	this._properties_by_name = {};

	if(o) 
		this.configure(o);
}

Object.defineProperty( UnityMaterial.prototype, "shader", {
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

Object.defineProperty( UnityMaterial.prototype, "properties", {
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

/**
* Makes one shader variable (uniform) public so it can be assigned from the engine (or edited from the editor)
* @method createUniform
* @param {String} name the property name as it should be shown
* @param {String} uniform the uniform name in the shader
* @param {String} type the var type in case we want to edit it (use LS.TYPES)
* @param {*} value
* @param {Object} options an object containing all the possible options (used mostly for widgets)
*/
UnityMaterial.prototype.createUniform = function( name, uniform, type, value, options )
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
UnityMaterial.prototype.createSampler = function( name, uniform, sampler_options, value  )
{
	if(!name || !uniform)
		throw("parameter missing in createSampler");

	var sampler = {
		texture: value
	};

	var prop = { name: name, uniform: uniform, value: sampler, type: "sampler", is_texture: 1, sampler_slot: -1 };

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
UnityMaterial.prototype.createProperty = function( name, value, type, options )
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

//called when preparing materials before rendering the scene
UnityMaterial.prototype.prepare = function( scene )
{
	this.fillUniforms();

	if( this.onPrepare )
		this.onPrepare( scene );
}

//called when filling uniforms from prepare
UnityMaterial.prototype.fillUniforms = function()
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
UnityMaterial.prototype.setProperty = function(name, value)
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
			this._samplers.push( prop.value );
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
UnityMaterial.prototype.processShaderCode = function()
{
	if(!this._shader)
	{
		this._properties.length = 0;
		this._properties_by_name = {};
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
	this._samplers.length = 0;

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
}

//used after changing the code of the ShaderCode and wanting to reload the material keeping the old properties
UnityMaterial.prototype.assignOldProperties = function( old_properties )
{
	//get shader code
	var shader = null;
	var shader_code = this.getShaderCode();
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
UnityMaterial.prototype.renderInstance = function( instance, render_settings, pass )
{
	if(!this.shader)
		return true; //skip rendering

	//get shader code
	var shader_code = LS.ResourcesManager.getResource( this.shader );
	if(!shader_code || shader_code.constructor !== LS.ShaderCode )
		return true; //skip rendering

	//this is in case the shader has been modified in the editor...
	if( shader_code._version !== this._shader_version )
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

	//compute flags
	var block_flags = instance.computeShaderBlockFlags();

	//global stuff
	this.render_state.enable();
	LS.Renderer.bindSamplers( this._samplers );

	if(this.onRenderInstance)
		this.onRenderInstance( instance );

	//add flags related to lights
	var lights = null;

	if( pass.id == COLOR_PASS && this._light_mode !== Material.NO_LIGHTS )
		lights = LS.Renderer.getNearLights( instance );

	if(!lights)
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

		//render
		instance.render( shader );
		renderer._rendercalls += 1;
	
		return true;
	}

	var prev_shader = null;
	for(var i = 0; i < lights.length; ++i)
	{
		var light = lights[i];
		block_flags = light.applyShaderBlockFlags( block_flags, pass, render_settings );

		//extract shader compiled
		var shader = shader_code.getShader( null, block_flags );
		if(!shader)
			continue;

		//light texture like shadowmap and cookie
		LS.Renderer.bindSamplers( light._samplers );

		//assign
		if(prev_shader != shader)
			shader.uniformsArray( [ scene._uniforms, camera._uniforms, render_uniforms, light._uniforms, this._uniforms, instance.uniforms ] );
		else
			shader.uniforms( light._uniforms );
		prev_shader = shader;

		if(i == 1)
		{
			shader.uniforms({ u_ambient_light: LS.ZEROS});
			gl.depthMask( false );
			gl.depthFunc( gl.EQUAL );
			gl.enable( gl.BLEND );
			gl.blendFunc( gl.SRC_ALPHA, gl.ONE );
		}

		//render
		instance.render( shader );
		renderer._rendercalls += 1;
	}

	//optimize this
	gl.disable( gl.BLEND );
	gl.depthMask( true );
	gl.depthFunc( gl.LESS );

	return true;
}

UnityMaterial.prototype.renderShadowInstance = function( instance, render_settings, pass )
{
	return this.renderInstance( instance, render_settings, pass );
}

/**
* Collects all the resources needed by this material (textures)
* @method getResources
* @param {Object} resources object where all the resources are stored
* @return {Texture}
*/
UnityMaterial.prototype.getResources = function ( res )
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


UnityMaterial.prototype.getPropertyInfoFromPath = function( path )
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
UnityMaterial.prototype.getShaderCode = function()
{
	var shader_code = LS.ResourcesManager.getResource( this.shader );
	if(!shader_code || shader_code.constructor !== LS.ShaderCode )
		return null;
	return shader_code;
}

/**
* Takes an input texture and applies the UnityMaterial, the result is shown on the viewport or stored in the output_texture
* The ShaderCode must contain a "fx" method.
* Similar to the method BlitTexture in Unity
* @method applyToTexture
* @param {Texture} input_texture
* @param {Texture} output_texture [optional] where to store the result, if omitted it will be shown in the viewport
*/
UnityMaterial.prototype.applyToTexture = function( input_texture, output_texture )
{
	if( !this.shader || !input_texture )
		return false;

	//get shader code
	var shader_code = this.getShaderCode();
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


LS.registerMaterialClass( UnityMaterial );
LS.UnityMaterial = UnityMaterial;


//Register ShaderBlocks
//TODO?