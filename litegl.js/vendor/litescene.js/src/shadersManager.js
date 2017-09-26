/* Basic shader manager 
	- Allows to load all shaders from XML
	- Allows to use a global shader
*/

//************************************
/**
* ShadersManager is the static class in charge of loading, compiling and storing shaders for reuse.
*
* @class ShadersManager
* @namespace LS
* @constructor
*/

var ShadersManager = {

	default_xml_url: "data/shaders.xml",

	snippets: {},//to save source snippets
	shader_blocks: new Map(),//to save shader block
	compiled_programs: {}, //shaders already compiled and ready to use
	compiled_shaders: {}, //every vertex and fragment shader compiled

	global_shaders: {}, //shader codes to be compiled using some macros
	templates: {}, //WIP

	default_shader: null, //a default shader to rely when a shader is not found
	dump_compile_errors: true, //dump errors in console
	on_compile_error: null, //callback 

	num_shaderblocks: 0, //used to know the index

	/**
	* Initializes the shader manager
	*
	* @method init
	* @param {string} url a url to a shaders.xml can be specified to load the shaders
	*/
	init: function(url, ignore_cache)
	{
		//set a default shader 
		this.default_shader = null;

		//storage
		this.compiled_programs = {};
		this.compiled_shaders = {};
		this.global_shaders = {};

		//this.shader_blocks = {};//do not initialize, or we will loose all

		//base intro code for shaders
		this.global_extra_code = String.fromCharCode(10) + "#define WEBGL" + String.fromCharCode(10);
		if( gl.extensions.OES_standard_derivatives )
			this.global_extra_code = "#define STANDARD_DERIVATIVES" + String.fromCharCode(10);

		//compile some shaders
		this.createDefaultShaders();

		//if a shader is not found, the default shader is returned, in this case a flat shader
		this.default_shader = this.get("flat");

		url = url || this.default_xml_url;
		this.last_shaders_url = url;
		this.loadFromXML(url, false, ignore_cache);
	},

	/**
	* Reloads the XML file with the shaders, useful when editing the file
	*
	* @method reloadShaders
	* @param {function} on_complete call when the shaders have been reloaded
	*/
	reloadShaders: function(on_complete)
	{
		this.loadFromXML( this.last_shaders_url, true,true, on_complete);
	},

	/**
	* Resolves a shader query, returns the shader
	*
	* @method resolve
	* @param {ShaderQuery} query
	* @return {GL.Shader} the shader, if not found the default shader is returned
	*/
	resolve: function( query )
	{
		return this.get( query.name, query.macros );
	},

	/**
	* Clears all the compiled shaders
	*
	* @method clearCache
	*/
	clearCache: function()
	{
		this.compiled_programs = {};
		this.compiled_shaders = {};
	},

	/**
	* Returns a compiled shader with this id and this macros
	*
	* @method get
	* @param {string} id
	* @param {string} macros
	* @return {GL.Shader} the shader, if not found the default shader is returned
	*/
	get: function( id, macros )
	{
		if(!id)
			return this.default_shader;

		//if there is no macros, just get the old one
		if(!macros)
		{
			var shader = this.compiled_programs[id];
			if (shader)
				return shader;
		}

		var global = this.global_shaders[id];

		if (global == null)
			return this.default_shader;

		var key = id + ":";
		var extracode = "";

		if(global.num_macros != 0)
		{
			//generate unique key
			for (var macro in macros)
			{
				if (global.macros[ macro ])
				{
					key += macro + "=" + macros[macro] + ":";
					extracode += String.fromCharCode(10) + "#define " + macro + " " + macros[macro] + String.fromCharCode(10); //why not "\n"??????
				}
			}//for macros
		}

		//hash key
		var hashkey = key.hashCode();

		//already compiled
		if (this.compiled_programs[hashkey] != null)
			return this.compiled_programs[hashkey];

		var start_time = 0;
		if (this.debug)
			start_time = getTime();

		//compile and store it
		var vs_code = extracode + global.vs_code;
		var fs_code = extracode + global.fs_code;

		//expand code
		if(global.imports)
		{
			var already_imported = {}; //avoid to import two times the same code to avoid collisions

			var replace_import = function(v)
			{
				var token = v.split("\"");
				var id = token[1];
				if( already_imported[ id ] )
					return "//already imported: " + id + "\n";
				var snippet = ShadersManager.snippets[id];
				already_imported[id] = true;
				if(snippet)
					return snippet.code;
				return "//snippet not found: " + id + "\n";
			}

			vs_code = vs_code.replace(/#import\s+\"(\w+)\"\s*\n/g, replace_import );
			already_imported = {}; //clear
			fs_code	= fs_code.replace(/#import\s+\"(\w+)\"\s*\n/g, replace_import);
		}

		var shader = this.compileShader( vs_code, fs_code, key );
		if(shader)
			shader.global = global;

		if(this.debug)
			console.log("Time creating shader:", (getTime() - start_time).toFixed(3), "ms");

		return this.registerCompiledShader(shader, hashkey, id);
	},

	/**
	* Returns the info of a global shader
	*
	* @method getGlobalShaderInfo
	* @param {string} id
	* @return {Object} shader info (code, macros supported, flags)
	*/
	getGlobalShaderInfo: function(id)
	{
		return this.global_shaders[id];
	},

	/**
	* Compiles a shader, the vertex and fragment shader are cached indepently to speed up compilations but a unique name must be provided
	*
	* @method compileShader
	* @param {string} vs_code the final source code for the vertex shader
	* @param {string} fs_code the final source code for the fragment shader
	* @param {string} name an unique name that should be associated with this shader
	* @return {GL.Shader} shader
	*/
	compileShader: function( vs_code, fs_code, name )
	{
		if(!name)
			throw("compileShader must have a name specified");

		if(!gl)
			return null;
		var shader = null;
		try
		{
			vs_code = this.global_extra_code + vs_code;
			fs_code = this.global_extra_code + fs_code;

			//speed up compilations by caching shaders compiled
			var vs_shader = this.compiled_shaders[name + ":VS"];
			if(!vs_shader)
				vs_shader = this.compiled_shaders[name + ":VS"] = GL.Shader.compileSource(gl.VERTEX_SHADER, vs_code);
			var fs_shader = this.compiled_shaders[name + ":FS"];
			if(!fs_shader)
				fs_shader = this.compiled_shaders[name + ":FS"] = GL.Shader.compileSource(gl.FRAGMENT_SHADER, fs_code);

			var old = getTime();
			shader = new GL.Shader( vs_shader, fs_shader );
			if(this.debug)
				console.log("Shader compile time: ", (getTime() - old).toFixed(3), "ms");
			shader.name = name;
			//console.log("Shader compiled: " + name);
		}
		catch (err)
		{
			if(this.dump_compile_errors)
			{
				this.dumpShaderError(name, err, vs_code, fs_code );
				this.dump_compile_errors = false; //disable so the console dont get overflowed
			}

			if(this.on_compile_error)
				this.on_compile_error(err);

			return null;
		}
		return shader;
	},

	dumpShaderError: function( name, err, vs_code, fs_code )
	{
		console.error("Error compiling shader: " + name);
		console.log(err);
		console.groupCollapsed("Vertex Shader Code");
		//console.log("VS CODE\n************");
		var lines = (this.global_extra_code + vs_code).split("\n");
		for(var i in lines)
			console.log(i + ": " + lines[i]);
		console.groupEnd();

		console.groupCollapsed("Fragment Shader Code");
		//console.log("FS CODE\n************");
		lines = (this.global_extra_code + fs_code).split("\n");
		for(var i in lines)
			console.log(i + ": " + lines[i]);
		console.groupEnd();
	},

	/**
	* Stores a compiled shader program, so it can be reused
	*
	* @method registerCompiledShader
	* @param {GL.Shader} shader the compiled shader
	* @param {string} key unique id 
	* @param {string} id the shader name
	* @return {GL.Shader} shader
	*/
	registerCompiledShader: function(shader, key, id)
	{
		if(shader == null)
		{
			this.compiled_programs[key] = this.default_shader;
			return this.default_shader;
		}

		shader.id = id;
		shader.key = key;
		this.compiled_programs[key] = shader;
		return shader;
	},

	/**
	* Loads shaders code from an XML file
	*
	* @method loadFromXML
	* @param {string} url to the shaders file
	* @param {boolean} reset_old to reset all the existing shaders once loaded
	* @param {boolean} ignore_cache force to ignore web cache 
	* @param {function} on_complete callback once the file has been loaded and processed
	*/
	loadFromXML: function (url, reset_old, ignore_cache, on_complete)
	{
		var nocache = ignore_cache ? "?nocache=" + getTime() + Math.floor(Math.random() * 1000) : "";
		LS.Network.request({
		  url: url + nocache,
		  dataType: 'xml',
		  success: function(response){
				console.log("Shaders XML loaded: " + url);
				if(reset_old)
				{
					LS.ShadersManager.global_shaders = {};
					LS.ShadersManager.compiled_programs = {};
					LS.ShadersManager.compiled_shaders = {};
				}
				LS.ShadersManager.processShadersXML(response);
				if(on_complete)
					on_complete();
		  },
		  error: function(err){
			  console.log("Error parsing Shaders XML: " + err);
			  throw("Error parsing Shaders XML: " + err);
		  }
		});	
	},

	/**
	* extracts all the shaders from the XML doc
	*
	* @method processShadersXML
	* @param {XMLDocument} xml
	*/
	processShadersXML: function(xml)
	{
		//get shaders
		var shaders = xml.querySelectorAll('shader');
		
		for(var i in shaders)
		{
			var shader_element = shaders[i];
			if(!shader_element || !shader_element.attributes) continue;

			var id = shader_element.attributes["id"];
			if(!id) continue;
			id = id.value;

			var vs_code = "";
			var fs_code = "";

			//read all the supported macros
			var macros_str = "";
			var macros_attr = shader_element.attributes["macros"];
			if(macros_attr)
				macros_str += macros_attr.value;

			var macros_xml = shader_element.querySelector("macros");
			if(macros_xml)
				macros_str += macros_xml.textContent;

			var macros_array = macros_str.split(",");
			var macros = {};
			for(var i in macros_array)
				macros[ macros_array[i].trim() ] = true;

			//read the shaders code
			vs_code = shader_element.querySelector("code[type='vertex_shader']").textContent;
			fs_code = shader_element.querySelector("code[type='pixel_shader']").textContent;

			if(!vs_code || !fs_code)
			{
				console.log("no code in shader: " + id);
				continue;
			}

			var options = {};

			var multipass = shader_element.getAttribute("multipass");
			if(multipass)
				options.multipass = (multipass == "1" || multipass == "true");
			var imports = shader_element.getAttribute("imports");
			if(imports)
				options.imports = (imports == "1" || imports == "true");
			var events = shader_element.getAttribute("events");
			if(events)
				options.events = (events == "1" || events == "true");

			LS.ShadersManager.registerGlobalShader( vs_code, fs_code, id, macros, options );
		}

		var snippets = xml.querySelectorAll('snippet');
		for(var i = 0; i < snippets.length; ++i)
		{
			var snippet = snippets[i];
			var id = snippet.getAttribute("id");
			var code = snippet.textContent;
			this.registerSnippet( id, code );
		}

		var templates = xml.querySelectorAll('template');
		for(var i = 0; i < templates.length; ++i)
		{
			var template = templates[i];
			var id = template.getAttribute("id");
			var vs_code = template.querySelector("code[type='vertex_shader']").textContent;
			var fs_code = template.querySelector("code[type='fragment_shader']").textContent;

			var vs_info = this.processTemplateCode( vs_code );
			var fs_info = this.processTemplateCode( fs_code );

			template[id] = {
				id: id,
				vs_info: vs_info,
				fs_info: fs_info
			}

			//console.log( template[id] );
		}

		//we need to notify (LS.Player uses this)
		this.ready = true;
		if(this.on_ready)
			this.on_ready();
		LEvent.trigger( this, "ready" );
	},
	
	//adds source code of a shader that could be compiled if needed
	//id: name
	//macros: supported macros by the shader
	/**
	* extracts all the shaders from the XML doc
	*
	* @method registerGlobalShader
	* @param {string} vs_code
	* @param {string} fs_code
	*/
	registerGlobalShader: function(vs_code, fs_code, id, macros, options )
	{
		//detect macros
		var macros_found = {};
		//TO DO using a regexp

		//count macros
		var num_macros = 0;
		for(var i in macros)
			num_macros += 1;

		//HACK for IE
		if(gl && !gl.extensions["WEBGL_draw_buffers"])
			fs_code = fs_code.replace("#extension GL_EXT_draw_buffers : enable", '');

		var global = { 
			vs_code: vs_code, 
			fs_code: fs_code,
			macros: macros,
			num_macros: num_macros
		};

		//add options
		if(options)
		{
			for(var i in options)
				global[i] = options[i];

			//process code
			if(options.events)
			{
				var replace_events = function(v)
				{
					var token = v.split("\"");
					var id = token[1];
					//console.log("Event: ",id);
					return "";
				}

				global.vs_code = vs_code.replace(/#event\s+\"(\w+)\"\s*\n/g, replace_events );
				global.fs_code = fs_code.replace(/#event\s+\"(\w+)\"\s*\n/g, replace_events);
			}
		}

		this.global_shaders[id] = global;
		LEvent.trigger( LS.ShadersManager, "newShader" );
		return global;
	},

	/*
	registerGlobalShader: function(vs_code, fs_code, id, macros, options )
	{
		//detect macros
		var macros_found = {};
		//TO DO using a regexp

		//count macros
		var num_macros = 0;
		for(var i in macros)
			num_macros += 1;

		var global = { 
			vs_code: vs_code, 
			fs_code: fs_code,
			macros: macros,
			num_macros: num_macros
		};

		//add options
		if(options)
		{
			for(var i in options)
				global[i] = options[i];

				var vs_areas = vs_code.split("#pragma");
				var fs_areas = fs_code.split("#pragma");
				

				global.vs_code = vs_code.replace(/#event\s+\"(\w+)\"\s*\n/g, replace_events );
				global.fs_code = fs_code.replace(/#event\s+\"(\w+)\"\s*\n/g, replace_events);
			}
		}

		this.global_shaders[id] = global;
		LEvent.trigger(ShadersManager,"newShader");
		return global;
	},
	*/


	/**
	* Register a code snippet ready to be used by the #import clause in the shader
	*
	* @method registerSnippet
	* @param {string} id
	* @param {string} code
	*/
	registerSnippet: function(id, code)
	{
		this.snippets[ id ] = { id: id, code: code };
	},

	/**
	* Returns the code of a snipper
	*
	* @method getSnippet
	* @param {string} id
	* @return {string} code
	*/
	getSnippet: function(id)
	{
		return this.snippets[ id ];
	},

	registerShaderBlock: function(id, shader_block)
	{
		var block_id = -1;

		if( this.shader_blocks.get(id) )
		{
			console.warn("There is already a ShaderBlock with that name, replacing it: ", id);
			block_id = this.shader_blocks.get(id).flag_id;
		}
		else
			block_id = this.num_shaderblocks++;
		if(block_id >= 64)
			console.warn("Too many shaderblocks registered, not enought bits in a 64bits variable");

		shader_block.flag_id = block_id;
		shader_block.flag_mask = 1<<block_id;
		this.shader_blocks.set( block_id, shader_block );
		this.shader_blocks.set( id, shader_block );
	},

	getShaderBlock: function( id )
	{
		return this.shader_blocks.get(id);
	},

	//this is global code for default shaders
	common_vscode: "\n\
		precision mediump float;\n\
		attribute vec3 a_vertex;\n\
		attribute vec3 a_normal;\n\
		attribute vec2 a_coord;\n\
		uniform mat4 u_model;\n\
		uniform mat4 u_viewprojection;\n\
	",
	common_fscode: "\n\
		precision mediump float;\n\
	",

	/**
	* Create some default shaders useful for generic situations (flat, texture and screenspace quad)
	*
	* @method createDefaultShaders
	* @param {string} id
	* @return {string} code
	*/
	createDefaultShaders: function()
	{
		//flat
		this.registerGlobalShader(this.common_vscode + '\
			void main() {\
				mat4 mvp = u_viewprojection * u_model;\
				gl_Position = mvp * vec4(a_vertex,1.0);\
			}\
			', this.common_fscode + '\
			uniform vec4 u_material_color;\
			void main() {\
			  gl_FragColor = vec4(u_material_color);\
			}\
		',"flat");

		//flat texture
		this.registerGlobalShader(this.common_vscode + '\
			varying vec2 v_uvs;\
			void main() {\n\
				v_uvs = a_coord;\n\
				mat4 mvp = u_viewprojection * u_model;\
				gl_Position = mvp * vec4(a_vertex,1.0);\
			}\
			', this.common_fscode + '\
			uniform vec4 u_material_color;\
			varying vec2 v_uvs;\
			uniform sampler2D texture;\
			void main() {\
				gl_FragColor = u_material_color * texture2D(texture,v_uvs);\
			}\
		',"texture_flat");

		this.registerGlobalShader(this.common_vscode + '\
			varying vec2 coord;\
			void main() {\
			coord = a_coord;\
			gl_Position = vec4(coord * 2.0 - 1.0, 0.0, 1.0);\
		}\
		', this.common_fscode + '\
			uniform sampler2D texture;\
			uniform vec4 color;\
			varying vec2 coord;\
			void main() {\
			gl_FragColor = texture2D(texture, coord) * color;\
			}\
		',"screen");
	},

	processTemplateCode: function( code )
	{
		//remove comments
		code = code.replace(/(\/\*([\s\S]*?)\*\/)|(\/\/(.*)$)/gm, '');

		var hooks = {};
		var parts = [];
		var current_part = [];

		var lines = code.split("\n");
		for(var i = 0; i < lines.length; i++)
		{
			var line = lines[i].trim();
			if(!line.length)
				continue;//empty line
			if(line[0] != "#")
			{
				current_part.push(line);
				continue;
			}

			var t = line.split(" ");
			if(t[0] == "#pragma")
			{
				switch(t[1])
				{
					case "import":
						if( current_part.length )
						{
							parts.push( [ "code", current_part.join("\n") ] );
							current_part = [];
						}
						parts.push( [ "import", t[3] ] );
						break;
					case "hook": 
						if( current_part.length )
						{
							parts.push( [ "code", current_part.join("\n") ] );
							current_part = [];
						}
						if( hooks[ t[3] ] !== undefined )
							console.warn("Hook already found in shader: " + t[3] );
						hooks[ t[3] ] = parts.length;
						parts.push( [ "hook", t[3] ] );
						break;
					default:
						current_part.push(line); //unknown pragma, pass it
				}
			}
			else
				current_part.push(line); //unknown macro, pass it
		}

		return {
			code: code,
			parts: parts,
			hooks: hooks
		};
	}
};

LS.SM = LS.ShadersManager = ShadersManager;


/**
* ShaderQuery is in charge of specifying info that must be taken into account when compiling a shader
*
* @class ShaderQuery
* @namespace LS
* @constructor
*/
function ShaderQuery( name, macros )
{
	this.name = name;
	this.macros = {}; //macros to add
	this.hooks = {}; //represent points where this shader want to insert code

	if(macros)
		for(var i in macros)
			this.macros[i] = macros[i];
}

ShaderQuery.prototype.clear = function()
{
	this.macros = {};
	this.hooks = {};
}

ShaderQuery.prototype.add = function( query )
{
	if(!query)
		return;

	//add macros
	for(var i in query.macros )
		this.macros[i] = query.macros[i];

	//add hooks
}

ShaderQuery.prototype.setMacro = function( name, value )
{
	this.macros[name] = value || "";
}

ShaderQuery.prototype.resolve = function()
{
	return LS.ShadersManager.resolve(this);
}

//ShaderQuery.prototype.addHook = function

LS.ShaderQuery = ShaderQuery;



// WIP
// A ShaderBlock represents a block of GLSL code that could be requested by a shader in order to obtain a functionality.
// SBs are registered and given a number, then if a shader wants that functionality it could use #pragma shaderblock "sb_name"
// it will be inserted in the material in the line of the pragma
function ShaderBlock( name )
{
	this.dependency_blocks = []; //blocks referenced by this block
	this.flag_id = -1;
	this.flag_mask = 0;
	if(!name)
		throw("ShaderBlock must have a name");
	if(name.indexOf(" ") != -1)
		throw("ShaderBlock name cannot have spaces: " + name);
	this.name = name;
	this.code_map = new Map();
	this.context_macros = null;
}

ShaderBlock.prototype.defineContextMacros = function( macros )
{
	this.context_macros = macros;
}

//shader_type: vertex or fragment shader
ShaderBlock.prototype.addCode = function( shader_type, enabled_code, disabled_code, macros )
{
	enabled_code  = enabled_code || "";
	disabled_code  = disabled_code || "";

	//this.checkDependencies( enabled_code );
	//this.checkDependencies( disabled_code );

	var info = { 
		enabled: new LS.GLSLCode( enabled_code ),
		disabled: new LS.GLSLCode( disabled_code ),
		macros: macros
	};
	this.code_map.set( shader_type, info );
}

//returns the full code of a shaderblock applying all includes, shaderblocks, etc
//shadertype: GL.VERTEX_SHADER = 35633, GL.FRAGMENT_SHADER = 35632
ShaderBlock.prototype.getFinalCode = function( shader_type, block_flags, context )
{
	block_flags = block_flags || 0;
	var code = this.code_map.get( shader_type );
	if(!code)
		return null;
	var glslcode = (block_flags & this.flag_mask) ? code.enabled : code.disabled;
	var finalcode = glslcode.getFinalCode( shader_type, block_flags, context );

	if( code.macros )
	{
		var macros_code = "";
		for(var i in code.macros)
			macros_code += "#define " + i + code.macros[i] + "\n";
		finalcode = macros_code + finalcode;
	}
	return finalcode;
}

ShaderBlock.prototype.register = function()
{
	LS.ShadersManager.registerShaderBlock(this.name, this);
}

ShaderBlock.prototype.checkDependencies = function( code )
{
//TODO
}


LS.ShaderBlock = ShaderBlock;



/**
* Used for parsing GLSL code and precompute info (mostly preprocessor macros)
* @class GLSLCode
* @constructor
* @param {String} code
*/
function GLSLCode( code )
{
	this.code = code;

	this.blocks = [];
	this.pragmas = {};
	this.uniforms = {};
	this.attributes = {};
	this.includes = {};
	this.snippets = {};
	this.shader_blocks = {}; //warning: this not always contain which shaderblocks are in use, because they could be dynamic using pragma define
	this.is_dynamic = false; //means this shader has no variations using pragmas or macros
	if(code)
		this.parse();
}

LS.GLSLCode = GLSLCode;

GLSLCode.pragma_methods = {};

//block types
GLSLCode.CODE = 1;
GLSLCode.PRAGMA = 2;

//pargma types
GLSLCode.INCLUDE = 1;
GLSLCode.SHADERBLOCK = 2;
GLSLCode.SNIPPET = 3;

//given a code with some pragmas, it separates them
GLSLCode.prototype.parse = function()
{
	//remove comments
	var code = this.code.replace(/(\/\*([\s\S]*?)\*\/)|(\/\/(.*)$)/gm, '');

	this.fragments = [];
	this.pragmas = {};
	this.uniforms = {};
	this.streams = {};
	this.includes = {};
	this.snippets = {};
	this.shader_blocks = {};
	this.is_dynamic = false; //means this shader has no variations using pragmas or macros

	var current_fragment = [];
	var lines = code.split("\n");

	//parse
	for(var i = 0; i < lines.length; i++)
	{
		var line = lines[i].trim();
		if(!line.length)
			continue;//empty line

		if(line[0] != "#")
		{
			var words = line.split(" ");
			if( words[0] == "uniform" ) //store which uniforms we found in the code (not used yet)
			{
				var uniform_name = words[2].split(";");
				this.uniforms[ uniform_name[0] ] = words[1];
			}
			else if( words[0] == "attribute" ) //store which streams we found in the code (not used yet)
			{
				var uniform_name = words[2].split(";");
				this.attributes[ uniform_name[0] ] = words[1];
			}
			current_fragment.push(line);
			continue;
		}

		var t = line.split(" ");
		if(t[0] == "#pragma")
		{
			//merge lines and add previous fragment
			var current_fragment_code = current_fragment.join("\n");
			if(current_fragment_code.trim()) //in case is empty this code fragment
				this.fragments.push( { type: GLSLCode.CODE, code: current_fragment_code } ); 

			this.is_dynamic = true;
			this.pragmas[ t[2] ] = true;
			var action = t[1];
			current_fragment.length = 0;
			var pragma_info = { type: GLSLCode.PRAGMA, line: line, action: action, param: t[2] };

			var method = LS.GLSLCode.pragma_methods[ action ];
			if( !method || !method.parse )
			{
				console.warn("#pragma action unknown: ", action );
				continue;
			}
			if( method.parse.call( this, pragma_info, t ) === false )
				continue;
			this.fragments.push( pragma_info ); //add pragma fragment
		}
		else
			current_fragment.push( line ); //add line to current fragment lines
	}

	if(current_fragment.length)
	{
		var current_fragment_code = current_fragment.join("\n");
		if(current_fragment_code.trim()) //in case is empty this code fragment
			this.fragments.push( { type: GLSLCode.CODE, code: current_fragment_code } ); //merge lines and add as fragment
	}

	//done
	return true;
}

GLSLCode.prototype.getFinalCode = function( shader_type, block_flags, context )
{
	if( !this.is_dynamic )
		return this.code;

	var code = "";
	context = context || {};
	var fragments = this.fragments;

	for(var i = 0; i < fragments.length; ++i)
	{
		var fragment = fragments[i];
		if( fragment.type === GLSLCode.CODE ) //regular code
		{
			code += fragment.code;
			continue;
		}

		var pragma_method = GLSLCode.pragma_methods[ fragment.action ];
		if(!pragma_method || !pragma_method.getCode )
			continue;

		var r = pragma_method.getCode.call( this, shader_type, fragment, block_flags, context );
		if( r )
			code += r;
	}

	return code;
}

// PRAGMA METHODS ****************************

GLSLCode.pragma_methods["include"] = {
	parse: function( pragma_info, t )
	{
		if(!t[2])
		{
			console.error("shader include without path");
			return false;
		}

		pragma_info.action_type = GLSLCode.INCLUDE;
		//resolve include
		var include = t[2].substr(1, t[2].length - 2); //safer than JSON.parse
		var fullname = include.split(":");
		var filename = fullname[0];
		var subfile = fullname[1];
		pragma_info.include = filename;
		pragma_info.include_subfile = subfile;
		this.includes[ pragma_info.include ] = true;
	},
	getCode: function( shader_type, fragment, block_flags, context )
	{
		var extra_code = "";

		var filename = fragment.include;
		var ext = LS.ResourcesManager.getExtension( filename );
		if(ext)
		{
			var extra_shadercode = LS.ResourcesManager.getResource( filename, LS.ShaderCode );
			if(!extra_shadercode)
			{
				LS.ResourcesManager.load( filename ); //force load
				return null;
			}
			if(!fragment.include_subfile)
				extra_code = "\n" + extra_shadercode._subfiles[""] + "\n";
			else
			{
				var extra = extra_shadercode._subfiles[ fragment.include_subfile ];
				if(extra === undefined)
					return null;
				extra_code = "\n" + extra + "\n";
			}
		}
		else
		{
			var snippet_code = LS.ShadersManager.getSnippet( filename );
			if( !snippet_code )
				return null; //snippet not found
			extra_code = "\n" + snippet_code.code + "\n";
		}

		return extra_code;
	}
};

GLSLCode.pragma_methods["define"] = {
	parse: function( pragma_info, t )
	{
		var param1 = t[2];
		var param2 = t[3];
		if(!param1 || !param2)
		{
			console.error("#pragma define missing parameters");
			return false;
		}
		pragma_info.define = [ param1, param2.substr(1, param2.length - 2) ];
	},
	getCode: function( shader_type, fragment, block_flags, context )
	{
		context[ fragment.define[0] ] = fragment.define[1];
	}
}

GLSLCode.pragma_methods["shaderblock"] = {
	parse: function( pragma_info, t )
	{
		if(!t[2])
		{
			console.error("#pragma shaderblock without name");
			return false;
		}
		pragma_info.action_type = GLSLCode.SHADERBLOCK;

		var param = t[2];
		if(param[0] == '"') //one means "shaderblock_name", two means shaderblock_var
		{
			pragma_info.shader_block = [1, param.substr(1, param.length - 2)]; //safer than JSON.parse
			this.shader_blocks[ pragma_info.shader_block[1] ] = true;
		}
		else
		{
			pragma_info.shader_block = [2, param];
			if(t[3]) //thirth parameter for default
			{
				pragma_info.shader_block.push( t[3].substr(1, t[3].length - 2) );
				this.shader_blocks[ pragma_info.shader_block[2] ] = true;
			}
		}
	},
	getCode: function( shader_type, fragment, block_flags, context )
	{
		var shader_block_name = fragment.shader_block[1];
		if( fragment.shader_block[0] == 2 ) //is dynamic shaderblock name
		{
			//dynamic shaderblock name
			if( context[ shader_block_name ] ) //search for the name in the context
				shader_block_name = context[ shader_block_name ];
			else 
				shader_block_name = fragment.shader_block[2]; //if not found use the default

			if(!shader_block_name)
			{
				console.error("ShaderBlock: no context var found: " + shader_block_name );
				return null;
			}
		}
		
		var shader_block = LS.ShadersManager.getShaderBlock( shader_block_name );
		if(!shader_block)
		{
			console.error("ShaderCode uses unknown ShaderBlock: ", fragment.shader_block);
			return null;
		}

		var block_code = shader_block.getFinalCode( shader_type, block_flags, context );
		if( !block_code )
			return null;

		//add the define BLOCK_name only if enabled
		if( shader_block.flag_mask & block_flags )
			return "\n#define BLOCK_" + ( shader_block.name.toUpperCase() ) +"\n" + block_code + "\n";
		return block_code + "\n";
	}
};

GLSLCode.pragma_methods["snippet"] = { 
	parse: function( pragma_info, t )
	{
		if(!t[2])
		{
			console.error("#pragma snippet without name");
			return false;
		}
		pragma_info.action_type = GLSLCode.SNIPPET;
		var snippet_name = t[2].substr(1, t[2].length - 2); //safer than JSON.parse
		pragma_info.snippet = snippet_name;
		this.snippets[ snippet_name ] = true;
	},
	getCode: function( shader_type, fragment, block_flags, context )
	{
		var snippet = LS.ShadersManager.getSnippet( fragment.snippet );
		if(!snippet)
		{
			console.error("ShaderCode uses unknown Snippet: ", fragment.snippet);
			return null;
		}

		return "\n" + snippet.code + "\n";
	}
};

//not used
GLSLCode.breakLines = function(lines)
{
	//clean (this helps in case a line contains two instructions, like "uniform float a; uniform float b;"
	var clean_lines = [];
	for(var i = 0; i < lines.length; i++)
	{
		var line = lines[i].trim();
		if(!line)
			continue;
		var pos = line.lastIndexOf(";");
		if(pos == -1 || pos == lines.length - 1)
			clean_lines.push(line);
		else
		{
			var sublines = line.split(";");
			for(var j = 0; j < sublines.length; ++j)
			{
				if(sublines[j])
					clean_lines.push( sublines[j] + ";" );
			}
		}
	}
	return clean_lines;
}

//SNIPPETS ******************************

LS.ShadersManager.registerSnippet("surface","\n\
	//used to store surface shading properties\n\
	struct SurfaceOutput {\n\
		vec3 Albedo;\n\
		vec3 Normal; //separated in case there is a normal map\n\
		vec3 Emission;\n\
		vec3 Ambient;\n\
		float Specular;\n\
		float Gloss;\n\
		float Alpha;\n\
		float Reflectivity;\n\
		vec4 Extra; //for special purposes\n\
	};\n\
	\n\
	SurfaceOutput getSurfaceOutput()\n\
	{\n\
		SurfaceOutput o;\n\
		o.Albedo = u_material_color.xyz;\n\
		o.Alpha = u_material_color.a;\n\
		o.Normal = normalize( v_normal );\n\
		o.Specular = 0.5;\n\
		o.Gloss = 10.0;\n\
		o.Ambient = vec3(1.0);\n\
		o.Emission = vec3(0.0);\n\
		o.Reflectivity = 0.0;\n\
		return o;\n\
	}\n\
");