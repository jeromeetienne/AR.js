var parserTGA = { 
	extension: 'tga',
	type: 'image',
	dataType:"arraybuffer",
	format: 'binary',

	parse: function(data, options)
	{
		if(!data || data.constructor !== ArrayBuffer)
			throw( "ParserTGA: data must be ArrayBuffer");

		data = new Uint8Array(data);
		var TGAheader = new Uint8Array( [0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0] );
		var TGAcompare = data.subarray(0,12);
		for(var i = 0; i < TGAcompare.length; i++)
			if(TGAheader[i] != TGAcompare[i])
			{
				console.error("TGA header is not valid");
				return null; //not a TGA
			}

		var header = data.subarray(12,18);

		var img = {};
		img.width = header[1] * 256 + header[0];
		img.height = header[3] * 256 + header[2];
		img.bpp = header[4];
		img.bytesPerPixel = img.bpp / 8;
		img.imageSize = img.width * img.height * img.bytesPerPixel;
		img.pixels = data.subarray(18,18+img.imageSize);
		img.pixels = new Uint8Array( img.pixels ); 	//clone
		var pixels = img.pixels;

		//TGA comes in BGR format so we swap it, this is slooooow
		for(var i = 0, l = img.imageSize, d = img.bytesPerPixel; i < l; i+= d )
		{
			var temp = pixels[i];
			pixels[i] = pixels[i+2];
			pixels[i+2] = temp;
		}
		img.format = img.bpp == 32 ? "RGBA" : "RGB";

		//if(	(header[5] & (1<<4)) == 0) //hack, needs swap
		//{
			//header[5] |= 1<<5; //mark as Y swaped
		//}
		//else
		//	img.format = img.bpp == 32 ? "RGBA" : "RGB";

		//some extra bytes to avoid alignment problems
		//img.pixels = new Uint8Array( img.imageSize + 14);
		//img.pixels.set( data.subarray(18,18+img.imageSize), 0);

		img.flipY = true;
		//img.format = img.bpp == 32 ? "BGRA" : "BGR";
		//trace("TGA info: " + img.width + "x" + img.height );
		return img;
	}
};

LS.Formats.addSupportedFormat( "tga", parserTGA );