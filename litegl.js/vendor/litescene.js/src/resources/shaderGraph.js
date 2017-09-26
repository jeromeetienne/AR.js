
/**
* ShaderGraph is a resource containing a graph that generates the code associated to a shader
* It is used to define special ways to render scene objects, having full control of the rendering algorithm
* 
* @class ShaderGraph
* @constructor
*/

function ShaderGraph( o )
{
	this._graph = new LiteGraph.Graph();

	this._global_uniforms = {};
	this._compiled_shaders = {};

	this._shaderblock_flags_num = 0; //used to assign flags to dependencies
	this._shaderblock_flags = {};

	this._version = 0;

	if(o)
		this.configure(o);
}

ShaderGraph.help_url = "https://github.com/jagenjo/litescene.js/blob/master/guides/shaders.md";

ShaderGraph.prototype.getDataToStore = function()
{
	return this.serialize();
}

//compile the shader, cache and return
ShaderGraph.prototype.getShader = function( render_mode, block_flags )
{
	if( this._has_error )
		return null;

	render_mode = render_mode || "color";
	block_flags = block_flags || 0;

	//search for a compiled version of the shader (by render_mode and block_flags)
	var shaders_map = this._compiled_shaders[ render_mode ];
	if(shaders_map)
	{
		var shader = shaders_map.get( block_flags );
		if(shader)
			return shader;
	}

	//search for the code
	var code = this._code_parts[ render_mode ];
	if(!code)
		return null;

	var context = {}; //used to store metaprogramming defined vars in the shader

	//compute context defines
	for(var i = 0; i < LS.ShadersManager.num_shaderblocks; ++i)
	{
		if( !(block_flags & 1<<i) ) //is flag enabled
			continue;
		var shader_block = LS.ShadersManager.shader_blocks.get(i);
		if(!shader_block)
			continue; //???
		if(!shader_block.enabled_defines)
			continue;
		for(var j in shader_block.enabled_defines)
			context[ j ] = shader_block.enabled_defines[j];
	}

	//vertex shader code
	var vs_code = null;
	if(render_mode == "fx")
		vs_code = GL.Shader.SCREEN_VERTEX_SHADER;
	else if( !code.vs )
		return null;
	else
		vs_code = code.vs.getFinalCode( GL.VERTEX_SHADER, block_flags, context );

	//fragment shader code
	if( !code.fs )
		return;

	var fs_code = code.fs.getFinalCode( GL.FRAGMENT_SHADER, block_flags, context );

	//no code or code includes something missing
	if(!vs_code || !fs_code) 
	{
		this._has_error = true;
		return null;
	}

	//compile the shader and return it
	var shader = this.compileShader( vs_code, fs_code );
	if(!shader)
		return null;

	//cache as render_mode,flags
	if( !this._compiled_shaders[ render_mode ] )
		this._compiled_shaders[ render_mode ] = new Map();
	this._compiled_shaders[ render_mode ].set( block_flags, shader );

	return shader;
}

ShaderGraph.prototype.compileShader = function( vs_code, fs_code )
{
	if( this._has_error )
		return null;

	if(!LS.catch_exceptions)
		return new GL.Shader( vs_code, fs_code );
	else
	{
		try
		{
			return new GL.Shader( vs_code, fs_code );
		}
		catch(err)
		{
			this._has_error = true;
			LS.ShadersManager.dumpShaderError( this.filename, err, vs_code, fs_code );
			var error_info = GL.Shader.parseError( err, vs_code, fs_code );
			var line = error_info.line_number;
			var lines = this._code.split("\n");
			var code_line = -1;
			if(error_info.line_code)
			{
				var error_line_code = error_info.line_code.trim();
				for(var i = 0; i < lines.length; ++i)
					lines[i] = lines[i].trim();
				code_line = lines.indexOf( error_line_code ); //bug: what if this line is twice in the code?...
			}
			LS.dispatchCodeError( err, code_line, this, "shader" );
		}
	}
	return null;
}

ShaderGraph.prototype.validatePublicUniforms = function( shader )
{
	if(!shader)
		throw("ShaderGraph: Shader cannot be null");

	for( var i in this._global_uniforms )
	{
		var property_info = this._global_uniforms[i];
		var uniform_info = shader.uniformInfo[ property_info.uniform ];
		if(!uniform_info)
		{
			info.disabled = true;
			continue;
		}
	}
}


//makes this resource available 
ShaderGraph.prototype.register = function()
{
	LS.ResourcesManager.registerResource( this.fullpath || this.filename, this );
}

//searches for materials using this ShaderGraph and forces them to be updated (update the properties)
ShaderGraph.prototype.applyToMaterials = function( scene )
{
	scene = scene || LS.GlobalScene;
	var filename = this.fullpath || this.filename;

	//materials in the resources
	for(var i in LS.ResourcesManager.resources)
	{
		var res = LS.ResourcesManager.resources[i];
		if( res.constructor !== LS.ShaderMaterial || res._shader != filename )
			continue;

		res.processShaderCode();
	}

	//embeded materials
	var nodes = scene.getNodes();
	for(var i = 0; i < nodes.length; ++i)
	{
		var node = nodes[i];
		if(node.material && node.material.constructor === LS.ShaderMaterial && node.material._shader == filename )
			node.material.processShaderCode();
	}
}

LS.ShaderGraph = ShaderGraph;
LS.registerResourceClass( ShaderGraph );

