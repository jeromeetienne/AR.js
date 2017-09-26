/* 
Parser should only be in charge of extracting info from a data chunk (text or binary) and returning in a better way
It shouldnt have any dependency to allow to be used in workers in the future
*/
var Parser = {

	flipAxis: 0,
	merge_smoothgroups: false,
	safe_parsing: false,

	image_extensions: ["png","jpg"], //for images
	nonative_image_extensions: ["tga","dds"], //for images that need parsing
	mesh_extensions: ["obj", "bin","ase","gr2","json","jsmesh"], //for meshes
	scene_extensions: ["dae"], //for scenes
	generic_extensions: ["xml","js","json"], //unknown data container
	xml_extensions: ["xml","dae"], //for sure is XML
	json_extensions: ["js","json"], //for sure is JSON
	binary_extensions: ["bin","tga","dds"], //for sure is binary and needs to be read as a byte array

	parsers: {},

	registerParser: function(parser)
	{
		this.parsers[parser.extension] = parser;
	},

	parse: function(filename,data,options)
	{
		options = options || {};
		var info = this.getFileFormatInfo(filename);
		if(options.extension)
			info.extension = options.extension; //force a format
		var parser = this.parsers[info.extension];
		if(!parser)
		{
			console.error("Parser Error: No parser found for " + info.extension + " format");
			return null;
		}

		var result = null;
		if(!this.safe_parsing)
			result = parser.parse(data,options,filename);
		else
			try
			{
				result = parser.parse(data,options,filename);
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

	//gets raw image information {width,height,pixels:ArrayBuffer} and create a dataurl to use in images
	convertToDataURL: function(img_data)
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
	},

	//takes an string an returns a Uint8Array typed array containing that string
	stringToTypedArray: function(str, fixed_length)
	{
		var r = new Uint8Array( fixed_length ? fixed_length : str.length);
		for(var i = 0; i < str.length; i++)
			r[i] = str.charCodeAt(i);
		return r;
	},

	//takes a typed array with ASCII codes and returns the string
	typedArrayToString: function(typed_array, same_size)
	{
		var r = "";
		for(var i = 0; i < typed_array.length; i++)
			if (typed_array[i] == 0 && !same_size)
				break;
			else
				r += String.fromCharCode( typed_array[i] );
		return r;
	},

	//Returns info about a resource according to its filename
	JSON_FORMAT: "json",
	XML_FORMAT: "xml",
	BINARY_FORMAT: "binary",
	TEXT_FORMAT: "text",
	MESH_DATA: "MESH",
	SCENE_DATA: "SCENE",
	IMAGE_DATA: "IMAGE",
	NONATIVE_IMAGE_DATA: "NONATIVE_IMAGE",
	GENERIC_DATA: "GENERIC",
	
	getFileFormatInfo: function(filename)
	{
		var extension = filename.substr( filename.lastIndexOf(".") + 1).toLowerCase();
		
		var r = {
			filename: filename,
			extension: extension
		};

		//format
		r.format = Parser.TEXT_FORMAT;
		if (this.xml_extensions.indexOf(extension) != -1)
			r.format = Parser.XML_FORMAT;
		else if (this.json_extensions.indexOf(extension) != -1)
			r.format = Parser.JSON_FORMAT;
		else if (this.binary_extensions.indexOf(extension) != -1)
			r.format = Parser.BINARY_FORMAT;

		//data info
		if (this.image_extensions.indexOf(extension) != -1)
			r.type = Parser.IMAGE_DATA;
		else if (this.mesh_extensions.indexOf(extension) != -1)
			r.type = Parser.MESH_DATA;
		else if  (this.scene_extensions.indexOf(extension) != -1)
			r.type = Parser.SCENE_DATA; 
		else if  (this.nonative_image_extensions.indexOf(extension) != -1)
			r.type = Parser.NONATIVE_IMAGE_DATA; 
		else if  (this.generic_extensions.indexOf(extension) != -1)
			r.type = Parser.GENERIC_DATA; //unkinown data, could be anything
		return r;
	}
};













