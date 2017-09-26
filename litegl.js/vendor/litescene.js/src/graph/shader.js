if(typeof(LiteGraph) != "undefined")
{
	function LGraphShaderSurface()
	{
		this.addInput("Albedo","vec3");
		this.addInput("Emission","vec3");
		this.addInput("Normal","vec3");
		this.addInput("Specular","number");
		this.addInput("Gloss","number");
		this.addInput("Reflectivity","number");
		this.addInput("Alpha","number");

		this.properties = {};
	}

	LGraphShaderSurface.title = "Surface";
	LGraphShaderSurface.desc = "Surface properties";
	LGraphShaderSurface.filter = "shader";

	LGraphShaderSurface.prototype.onExecute = function()
	{
	}

	LGraphShaderSurface.prototype.getCode = function(lang)
	{
		var code = "\n";
		if( lang == "glsl" )
		{
			if( this.isInputConnected(0) )
				code += "OUT.Albedo = {{0}};\n";
			if( this.isInputConnected(1) )
				code += "OUT.Emission = {{1}};\n";
			if( this.isInputConnected(2) )
				code += "OUT.Normal = {{2}};\n";
			if( this.isInputConnected(3) )
				code += "OUT.Specular = {{3}};\n";
			if( this.isInputConnected(4) )
				code += "OUT.Gloss = {{4}};\n";
			if( this.isInputConnected(5) )
				code += "OUT.Reflectivity = {{5}};\n";
			if( this.isInputConnected(6) )
				code += "OUT.Alpha = {{6}};\n";
		}

		return code;
	}

	LiteGraph.registerNodeType("shader/surface", LGraphShaderSurface );
	window.LGraphShaderSurface = LGraphShaderSurface;

}