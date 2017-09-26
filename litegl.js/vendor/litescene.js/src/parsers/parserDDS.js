var parserDDS = { 
	extension: "dds",
	type: "image",
	dataType:"arraybuffer",
	resource: "Texture",
	format: "binary",

	parse: function(data, options)
	{
		if(!data || data.constructor !== ArrayBuffer)
			throw( "ParserDDS: data must be ArrayBuffer");
		var ext = gl.getExtension("WEBKIT_WEBGL_compressed_texture_s3tc");
		var texture = new GL.Texture(0,0, options);
		if(!window.DDS)
			throw("dds.js script must be included, not found");
		DDS.loadDDSTextureFromMemoryEx(gl,ext, data, texture, true);
		//console.log( DDS.getDDSTextureFromMemoryEx(data) );
		//texture.texture_type = texture.handler.texture_type;
		//texture.width = texture.handler.width;
		//texture.height = texture.handler.height;
		//texture.bind();
		return texture;
	}
};

LS.Formats.addSupportedFormat( "dds", parserDDS );