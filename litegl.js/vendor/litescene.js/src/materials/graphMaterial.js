function GraphMaterial(o)
{
	this.uid = LS.generateUId("MAT-");
	this._dirty = true;

	this.shader_name = "surface";

	this.graph = new LGraph();

	//this.shader_name = null; //default shader
	this.color = new Float32Array([1.0,1.0,1.0]);
	this.opacity = 1.0;
	this.blend_mode = Blend.NORMAL;

	this.vs_code = "";
	this.code = "void surf(in Input IN, inout SurfaceOutput o) {\n\
	o.Albedo = vec3(1.0) * IN.color.xyz;\n\
	o.Normal = IN.worldNormal;\n\
	o.Emission = vec3(0.0);\n\
	o.Specular = 1.0;\n\
	o.Gloss = 40.0;\n\
	o.Reflectivity = 0.0;\n\
	o.Alpha = IN.color.a;\n}\n";

	this._uniforms = {};
	this._macros = {};

	this.properties = []; //array of configurable properties
	this.textures = {};
	if(o) 
		this.configure(o);

	this.flags = 0;

	this.computeCode();
}

GraphMaterial.icon = "mini-icon-material.png";

GraphMaterial.prototype.onCodeChange = function()
{
	this.computeCode();
}

GraphMaterial.prototype.getCode = function()
{
	return this.code;
}

GraphMaterial.prototype.computeCode = function()
{
	var uniforms_code = "";
	for(var i in this.properties)
	{
		var code = "uniform ";
		var prop = this.properties[i];
		switch(prop.type)
		{
			case 'number': code += "float "; break;
			case 'vec2': code += "vec2 "; break;
			case 'vec3': code += "vec3 "; break;
			case 'vec4':
			case 'color':
			 	code += "vec4 "; break;
			case 'texture': code += "sampler2D "; break;
			case 'cubemap': code += "samplerCube "; break;
			default: continue;
		}
		code += prop.name + ";";
		uniforms_code += code;
	}

	var lines = this.code.split("\n");
	for(var i in lines)
		lines[i] = lines[i].split("//")[0]; //remove comments

	this.surf_code = uniforms_code + lines.join("");
}

// RENDERING METHODS
GraphMaterial.prototype.onModifyMacros = function(macros)
{
	if(this._ps_uniforms_code)
	{
		if(macros.USE_PIXEL_SHADER_UNIFORMS)
			macros.USE_PIXEL_SHADER_UNIFORMS += this._ps_uniforms_code;
		else
			macros.USE_PIXEL_SHADER_UNIFORMS = this._ps_uniforms_code;
	}

	if(this._ps_functions_code)
	{
		if(macros.USE_PIXEL_SHADER_FUNCTIONS)
			macros.USE_PIXEL_SHADER_FUNCTIONS += this._ps_functions_code;
		else
			macros.USE_PIXEL_SHADER_FUNCTIONS = this._ps_functions_code;
	}

	if(this._ps_code)
	{
		if(macros.USE_PIXEL_SHADER_CODE)
			macros.USE_PIXEL_SHADER_CODE += this._ps_code;
		else
			macros.USE_PIXEL_SHADER_CODE = this._ps_code;	
	}

	macros.USE_SURFACE_SHADER = this.surf_code;
}

GraphMaterial.prototype.fillSurfaceShaderMacros = function(scene)
{
	var macros = {};
	this._macros = macros;
}


GraphMaterial.prototype.fillSurfaceUniforms = function( scene, options )
{
	var samplers = [];

	for(var i in this.properties)
	{
		var prop = this.properties[i];
		if(prop.type == "texture" || prop.type == "cubemap")
		{
			var texture = LS.getTexture( prop.value );
			if(!texture) continue;
			samplers[prop.name] = texture;
		}
		else
			this._uniforms[ prop.name ] = prop.value;
	}

	this._uniforms.u_material_color = new Float32Array([this.color[0], this.color[1], this.color[2], this.opacity]);
	this._samplers = samplers;
}

GraphMaterial.prototype.configure = function(o) { 
	LS.cloneObject(o, this);
	this.computeCode();
}

/**
* gets all the properties and its types
* @method getProperties
* @return {Object} object with name:type
*/
GraphMaterial.prototype.getProperties = function()
{
	var o = {
		color:"vec3",
		opacity:"number",
		shader_name: "string",
		blend_mode: "number",
		code: "string"
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
GraphMaterial.prototype.onResourceRenamed = function (old_name, new_name, resource)
{
	//global
	Material.prototype.onResourceRenamed.call( this, old_name, new_name, resource );

	//specific
	for(var i in this.properties)
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
GraphMaterial.prototype.getProperty = function(name)
{
	if(this[name])
		return this[name];

	if( name.substr(0,4) == "tex_")
		return this.textures[ name.substr(4) ];

	for(var i in this.properties)
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
GraphMaterial.prototype.setProperty = function(name, value)
{
	//redirect to base material
	if( Material.prototype.setProperty.call(this,name,value) )
		return true;

	for(var i in this.properties)
	{
		var prop = this.properties[i];
		if(prop.name != name)
			continue;
		prop.value = value;
		return true;
	}

	return false;
}


GraphMaterial.prototype.getTextureChannels = function()
{
	var channels = [];

	for(var i in this.properties)
	{
		var prop = this.properties[i];
		if(prop.type != "texture" && prop.type != "cubemap")
			continue;
		channels.push(prop.name);
	}

	return channels;
}

/**
* Assigns a texture to a channel
* @method setTexture
* @param {Texture} texture
* @param {String} channel default is COLOR
*/
GraphMaterial.prototype.setTexture = function(texture, channel, uvs) {

	for(var i in this.properties)
	{
		var prop = this.properties[i];
		if(prop.type != "texture" && prop.type != "cubemap")
			continue;
		if(channel && prop.name != channel) //assign to the channel or if there is no channel just to the first one
			continue;

		prop.value = texture;
		if(this.textures)
			this.textures[channel] = texture;
		if(!channel)
			break;
	}

	if(!texture) return;
	if(texture.constructor == String && texture[0] != ":")
		ResourcesManager.load(texture);
}



LS.registerMaterialClass(GraphMaterial);
LS.GraphMaterial = GraphMaterial;


/*

			struct Input {
				vec4 color;
				vec3 vertex;
				vec3 normal;
				vec2 uv;
				vec2 uv1;

				vec3 camPos;
				vec3 viewDir;
				vec3 worldPos;
				vec3 worldNormal;
				vec4 screenPos;
			};

			struct SurfaceOutput {
				vec3 Albedo;
				vec3 Normal;
				vec3 Emission;
				float Specular;
				float Gloss;
				float Alpha;
				float Reflectivity;
			};


*/