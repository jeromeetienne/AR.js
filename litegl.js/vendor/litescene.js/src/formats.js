/**
* Formats is the class where all the info about what is every format, how to parse it, etc, is located
*
* @class LS.Formats
* @param{String} id the id (otherwise a random one is computed)
* @constructor
*/
LS.Formats = {

	//all the supported file formats and their parsers
	supported: {},

	safe_parsing: false, //catch exceptions during parsing
	merge_smoothgroups: false,

	/**
	* Tells the system info about this file format
	* Info should contain fields like type:"image", resource: "Mesh|Texture", format: "text|binary", parse: function, native: true|false
	* 
	* @method addFormat
	*/
	addSupportedFormat: function( extensions, info )
	{
		if( extensions.constructor === String )
			extensions = extensions.split(",");

		for(var i = 0; i < extensions.length; ++i)
		{
			var extension = extensions[i].toLowerCase();
			if( this.supported[ extension ] )
				console.warn("There is already another parser associated to this extension: " + extension);
			this.supported[ extension ] = info;
		}
	},

	/**
	* Parse some data and returns the resulting resource
	* 
	* @method parse
	* @param {string} filename
	* @param {*} data could be a string, binary, arraybuffer, xml...
	* @param {Object} options how the file should be parsed
	* @return {*} the final resource, could be a Texture, a Mesh, or an object
	*/
	parse: function( filename, data, options)
	{
		options = options || {};
		var info = this.getFileFormatInfo( filename );
		if(!info) //unsupported extension
			return null;

		if(options.extension)
			info.extension = options.extension; //force a format
		else
			info.extension = LS.ResourcesManager.getExtension( filename );

		var format = this.supported[ info.extension ];
		if(!format || !format.parse)
		{
			console.error("Parser Error: No parser found for " + info.extension + " format");
			return null;
		}

		var result = null;
		if(!this.safe_parsing)
			result = format.parse( data, options, filename );
		else
			try
			{
				result = format.parse( data, options, filename );
			}
			catch (err)
			{
				console.error("Error parsing content", err );
				return null;
			}
		if(result)
			result.name = filename;
		return result;
	},

	//Returns info about a resource according to its filename
	TEXT_FORMAT: "text",
	JSON_FORMAT: "json",
	XML_FORMAT: "xml",
	BINARY_FORMAT: "binary",

	MESH_DATA: "MESH",
	IMAGE_DATA: "IMAGE",
	NONATIVE_IMAGE_DATA: "NONATIVE_IMAGE",
	SCENE_DATA: "SCENE",
	GENERIC_DATA: "GENERIC",
	
	getFileFormatInfo: function( filename )
	{
		var extension = filename.substr( filename.lastIndexOf(".") + 1).toLowerCase();
		return this.supported[ extension ];
	},

	guessType: function( filename )
	{
		if(!filename)
			return null;

		var ext = LS.RM.getExtension( filename ).toLowerCase();
		var info = this.supported[ ext ];
		if(!info)
			return null;
		return info.resource;
	},

	//Helpers ******************************

	//gets raw image information {width,height,pixels:ArrayBuffer} and create a dataurl to use in images
	convertToDataURL: function( img_data )
	{
		var canvas = document.createElement("canvas");
		canvas.width = img_data.width;
		canvas.height = img_data.height;
		//document.body.appendChild(canvas);
		var ctx = canvas.getContext("2d");
		var pixelsData = ctx.createImageData(img_data.width, img_data.height);
		var num_pixels = canvas.width * canvas.height;

		//flip and copy the pixels
		if(img_data.bytesPerPixel == 3)
		{
			for(var i = 0; i < canvas.width; ++i)
				for(var j = 0; j < canvas.height; ++j)
				{
					var pos = j*canvas.width*4 + i*4;
					var pos2 = (canvas.height - j - 1)*canvas.width*3 + i*3;
					pixelsData.data[pos+2] = img_data.pixels[pos2];
					pixelsData.data[pos+1] = img_data.pixels[pos2+1];
					pixelsData.data[pos+0] = img_data.pixels[pos2+2];
					pixelsData.data[pos+3] = 255;
				}
		}
		else {
			for(var i = 0; i < canvas.width; ++i)
				for(var j = 0; j < canvas.height; ++j)
				{
					var pos = j*canvas.width*4 + i*4;
					var pos2 = (canvas.height - j - 1)*canvas.width*4 + i*4;
					pixelsData.data[pos+0] = img_data.pixels[pos2+2];
					pixelsData.data[pos+1] = img_data.pixels[pos2+1];
					pixelsData.data[pos+2] = img_data.pixels[pos2+0];
					pixelsData.data[pos+3] = img_data.pixels[pos2+3];
				}
		}

		ctx.putImageData(pixelsData,0,0);
		img_data.dataurl = canvas.toDataURL("image/png");
		return img_data.dataurl;
	},

	/* extract important Mesh info from vertices (center, radius, bouding box) */
	computeMeshBounding: function(vertices)
	{
		//compute AABB and useful info
		var min = [vertices[0],vertices[1],vertices[2]];
		var max = [vertices[0],vertices[1],vertices[2]];
		for(var i = 0; i < vertices.length; i += 3)
		{
			var v = [vertices[i],vertices[i+1],vertices[i+2]];
			if (v[0] < min[0]) min[0] = v[0];
			else if (v[0] > max[0]) max[0] = v[0];
			if (v[1] < min[1]) min[1] = v[1];
			else if (v[1] > max[1]) max[1] = v[1];
			if (v[2] < min[2]) min[2] = v[2];
			else if (v[2] > max[2]) max[2] = v[2];
		}

		var center = [(min[0] + max[0]) * 0.5,(min[1] + max[1]) * 0.5, (min[2] + max[2]) * 0.5];
		var halfsize = [ min[0] - center[0], min[1] - center[1], min[2] - center[2]];
		return BBox.setCenterHalfsize( BBox.create(), center, halfsize );
	}
};

//native formats do not need parser
LS.Formats.addSupportedFormat( "png,jpg,jpeg,webp,bmp,gif", { "native": true, dataType: "arraybuffer", resource: "Texture", "resourceClass": GL.Texture, has_preview: true, type: "image" } );
LS.Formats.addSupportedFormat( "wbin", { dataType: "arraybuffer" } );
LS.Formats.addSupportedFormat( "json,js,txt,html,css,csv", { dataType: "text" } );
LS.Formats.addSupportedFormat( "glsl", { dataType: "text", resource: "ShaderCode", "resourceClass": LS.ShaderCode  } );
LS.Formats.addSupportedFormat( "zip", { dataType: "arraybuffer" } );
WBin.classes = LS.Classes; //WBin need to know which classes are accesible to be instantiated right from the WBin data info, in case the class is not a global class


//parsers usually need this
//takes an string an returns a Uint8Array typed array containing that string
function stringToTypedArray(str, fixed_length)
{
	var r = new Uint8Array( fixed_length ? fixed_length : str.length);
	for(var i = 0; i < str.length; i++)
		r[i] = str.charCodeAt(i);
	return r;
}

//takes a typed array with ASCII codes and returns the string
function typedArrayToString(typed_array, same_size)
{
	var r = "";
	for(var i = 0; i < typed_array.length; i++)
		if (typed_array[i] == 0 && !same_size)
			break;
		else
			r += String.fromCharCode( typed_array[i] );
	return r;
}