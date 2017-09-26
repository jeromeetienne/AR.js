/**
 * @fileoverview dds - Utilities for loading DDS texture files
 * @author Brandon Jones
 * @version 0.1
 */

/*
 * Copyright (c) 2012 Brandon Jones
 *
 * This software is provided 'as-is', without any express or implied
 * warranty. In no event will the authors be held liable for any damages
 * arising from the use of this software.
 *
 * Permission is granted to anyone to use this software for any purpose,
 * including commercial applications, and to alter it and redistribute it
 * freely, subject to the following restrictions:
 *
 *    1. The origin of this software must not be misrepresented; you must not
 *    claim that you wrote the original software. If you use this software
 *    in a product, an acknowledgment in the product documentation would be
 *    appreciated but is not required.
 *
 *    2. Altered source versions must be plainly marked as such, and must not
 *    be misrepresented as being the original software.
 *
 *    3. This notice may not be removed or altered from any source
 *    distribution.
 */

var DDS = (function () {

    "use strict";
    
    // All values and structures referenced from:
    // http://msdn.microsoft.com/en-us/library/bb943991.aspx/
    var DDS_MAGIC = 0x20534444;
    
    var DDSD_CAPS = 0x1,
        DDSD_HEIGHT = 0x2,
        DDSD_WIDTH = 0x4,
        DDSD_PITCH = 0x8,
        DDSD_PIXELFORMAT = 0x1000,
        DDSD_MIPMAPCOUNT = 0x20000,
        DDSD_LINEARSIZE = 0x80000,
        DDSD_DEPTH = 0x800000;

    var DDSCAPS_COMPLEX = 0x8,
        DDSCAPS_MIPMAP = 0x400000,
        DDSCAPS_TEXTURE = 0x1000;
        
    var DDSCAPS2_CUBEMAP = 0x200,
        DDSCAPS2_CUBEMAP_POSITIVEX = 0x400,
        DDSCAPS2_CUBEMAP_NEGATIVEX = 0x800,
        DDSCAPS2_CUBEMAP_POSITIVEY = 0x1000,
        DDSCAPS2_CUBEMAP_NEGATIVEY = 0x2000,
        DDSCAPS2_CUBEMAP_POSITIVEZ = 0x4000,
        DDSCAPS2_CUBEMAP_NEGATIVEZ = 0x8000,
        DDSCAPS2_VOLUME = 0x200000;

    var DDPF_ALPHAPIXELS = 0x1,
        DDPF_ALPHA = 0x2,
        DDPF_FOURCC = 0x4,
        DDPF_RGB = 0x40,
        DDPF_YUV = 0x200,
        DDPF_LUMINANCE = 0x20000;

    function fourCCToInt32(value) {
        return value.charCodeAt(0) +
            (value.charCodeAt(1) << 8) +
            (value.charCodeAt(2) << 16) +
            (value.charCodeAt(3) << 24);
    }

    function int32ToFourCC(value) {
        return String.fromCharCode(
            value & 0xff,
            (value >> 8) & 0xff,
            (value >> 16) & 0xff,
            (value >> 24) & 0xff
        );
    }

    var FOURCC_DXT1 = fourCCToInt32("DXT1");
    var FOURCC_DXT3 = fourCCToInt32("DXT3");
    var FOURCC_DXT5 = fourCCToInt32("DXT5");

    var headerLengthInt = 31; // The header length in 32 bit ints

    // Offsets into the header array
    var off_magic = 0;

    var off_size = 1;
    var off_flags = 2;
    var off_height = 3;
    var off_width = 4;

    var off_mipmapCount = 7;

    var off_pfFlags = 20;
    var off_pfFourCC = 21;
    var off_caps = 27;
    
    // Little reminder for myself where the above values come from
    /*DDS_PIXELFORMAT {
        int32 dwSize; // offset: 19
        int32 dwFlags;
        char[4] dwFourCC;
        int32 dwRGBBitCount;
        int32 dwRBitMask;
        int32 dwGBitMask;
        int32 dwBBitMask;
        int32 dwABitMask; // offset: 26
    };
    
    DDS_HEADER {
        int32 dwSize; // 1
        int32 dwFlags;
        int32 dwHeight;
        int32 dwWidth;
        int32 dwPitchOrLinearSize;
        int32 dwDepth;
        int32 dwMipMapCount; // offset: 7
        int32[11] dwReserved1;
        DDS_PIXELFORMAT ddspf; // offset 19
        int32 dwCaps; // offset: 27
        int32 dwCaps2;
        int32 dwCaps3;
        int32 dwCaps4;
        int32 dwReserved2; // offset 31
    };*/

    /**
     * Transcodes DXT into RGB565.
     * Optimizations:
     * 1. Use integer math to compute c2 and c3 instead of floating point
     *    math.  Specifically:
     *      c2 = 5/8 * c0 + 3/8 * c1
     *      c3 = 3/8 * c0 + 5/8 * c1
     *    This is about a 40% performance improvement.  It also appears to
     *    match what hardware DXT decoders do, as the colors produced
     *    by this integer math match what hardware produces, while the
     *    floating point in dxtToRgb565Unoptimized() produce slightly
     *    different colors (for one GPU this was tested on).
     * 2. Unroll the inner loop.  Another ~10% improvement.
     * 3. Compute r0, g0, b0, r1, g1, b1 only once instead of twice.
     *    Another 10% improvement.
     * 4. Use a Uint16Array instead of a Uint8Array.  Another 10% improvement.
     * @author Evan Parker
     * @param {Uint16Array} src The src DXT bits as a Uint16Array.
     * @param {number} srcByteOffset
     * @param {number} width
     * @param {number} height
     * @return {Uint16Array} dst
     */
    function dxtToRgb565(src, src16Offset, width, height) {
        var c = new Uint16Array(4);
        var dst = new Uint16Array(width * height);
        var nWords = (width * height) / 4;
        var m = 0;
        var dstI = 0;
        var i = 0;
        var r0 = 0, g0 = 0, b0 = 0, r1 = 0, g1 = 0, b1 = 0;
    
        var blockWidth = width / 4;
        var blockHeight = height / 4;
        for (var blockY = 0; blockY < blockHeight; blockY++) {
            for (var blockX = 0; blockX < blockWidth; blockX++) {
                i = src16Offset + 4 * (blockY * blockWidth + blockX);
                c[0] = src[i];
                c[1] = src[i + 1];
                r0 = c[0] & 0x1f;
                g0 = c[0] & 0x7e0;
                b0 = c[0] & 0xf800;
                r1 = c[1] & 0x1f;
                g1 = c[1] & 0x7e0;
                b1 = c[1] & 0xf800;
                // Interpolate between c0 and c1 to get c2 and c3.
                // Note that we approximate 1/3 as 3/8 and 2/3 as 5/8 for
                // speed.  This also appears to be what the hardware DXT
                // decoder in many GPUs does :)
                c[2] = ((5 * r0 + 3 * r1) >> 3)
                    | (((5 * g0 + 3 * g1) >> 3) & 0x7e0)
                    | (((5 * b0 + 3 * b1) >> 3) & 0xf800);
                c[3] = ((5 * r1 + 3 * r0) >> 3)
                    | (((5 * g1 + 3 * g0) >> 3) & 0x7e0)
                    | (((5 * b1 + 3 * b0) >> 3) & 0xf800);
                m = src[i + 2];
                dstI = (blockY * 4) * width + blockX * 4;
                dst[dstI] = c[m & 0x3];
                dst[dstI + 1] = c[(m >> 2) & 0x3];
                dst[dstI + 2] = c[(m >> 4) & 0x3];
                dst[dstI + 3] = c[(m >> 6) & 0x3];
                dstI += width;
                dst[dstI] = c[(m >> 8) & 0x3];
                dst[dstI + 1] = c[(m >> 10) & 0x3];
                dst[dstI + 2] = c[(m >> 12) & 0x3];
                dst[dstI + 3] = c[(m >> 14)];
                m = src[i + 3];
                dstI += width;
                dst[dstI] = c[m & 0x3];
                dst[dstI + 1] = c[(m >> 2) & 0x3];
                dst[dstI + 2] = c[(m >> 4) & 0x3];
                dst[dstI + 3] = c[(m >> 6) & 0x3];
                dstI += width;
                dst[dstI] = c[(m >> 8) & 0x3];
                dst[dstI + 1] = c[(m >> 10) & 0x3];
                dst[dstI + 2] = c[(m >> 12) & 0x3];
                dst[dstI + 3] = c[(m >> 14)];
            }
        }
        return dst;
    }

    function BGRtoRGB( byteArray )
	{
		for(var j = 0, l = byteArray.length, tmp = 0; j < l; j+=4) //BGR fix
		{
			tmp = byteArray[j];
			byteArray[j] = byteArray[j+2];
			byteArray[j+2] = tmp;
		}
	}

    function flipDXT( width, blockBytes, byteArray )
	{
		//TODO
		//var row = Uint8Array(width);
	}


    /**
     * Parses a DDS file from the given arrayBuffer and uploads it into the currently bound texture
     *
     * @param {WebGLRenderingContext} gl WebGL rendering context
     * @param {WebGLCompressedTextureS3TC} ext WEBGL_compressed_texture_s3tc extension object
     * @param {TypedArray} arrayBuffer Array Buffer containing the DDS files data
     * @param {boolean} [loadMipmaps] If false only the top mipmap level will be loaded, otherwise all available mipmaps will be uploaded
     *
     * @returns {number} Number of mipmaps uploaded, 0 if there was an error
     */
    function uploadDDSLevels(gl, ext, arrayBuffer, loadMipmaps) {
        var header = new Int32Array(arrayBuffer, 0, headerLengthInt),
            fourCC, blockBytes, internalFormat,
            width, height, dataLength, dataOffset, is_cubemap,
            rgb565Data, byteArray, mipmapCount, i, face;

        if(header[off_magic] != DDS_MAGIC) {
            console.error("Invalid magic number in DDS header");
            return 0;
        }
        
        if(!header[off_pfFlags] & DDPF_FOURCC) {
            console.error("Unsupported format, must contain a FourCC code");
            return 0;
        }

        fourCC = header[off_pfFourCC];
        switch(fourCC) {
            case FOURCC_DXT1:
                blockBytes = 8;
                internalFormat = ext ? ext.COMPRESSED_RGB_S3TC_DXT1_EXT : null;
                break;

			/*
            case FOURCC_DXT1:
                blockBytes = 8;
                internalFormat = ext ? ext.COMPRESSED_RGBA_S3TC_DXT1_EXT : null;
                break;
			*/

            case FOURCC_DXT3:
                blockBytes = 16;
                internalFormat = ext ? ext.COMPRESSED_RGBA_S3TC_DXT3_EXT : null;
                break;

            case FOURCC_DXT5:
                blockBytes = 16;
                internalFormat = ext ? ext.COMPRESSED_RGBA_S3TC_DXT5_EXT : null;
                break;

            default:
				blockBytes = 4;
				fourCC = null;
				internalFormat = gl.RGBA;
                //console.error("Unsupported FourCC code:", int32ToFourCC(fourCC), fourCC);
                //return null;
        }

        mipmapCount = 1;
        if(header[off_flags] & DDSD_MIPMAPCOUNT && loadMipmaps !== false) {
            mipmapCount = Math.max(1, header[off_mipmapCount]);
        }

        width = header[off_width];
        height = header[off_height];
        dataOffset = header[off_size] + 4;
		is_cubemap = !!(header[off_caps+1] & DDSCAPS2_CUBEMAP);

		if(is_cubemap)
		{
			//console.error("Cubemaps not supported in DDS");
			//return null;

			for(face = 0; face < 6; ++face)
			{
				width = header[off_width];
				height = header[off_height];
				for(var i = 0; i < mipmapCount; ++i) {
					if(fourCC)
					{
						dataLength = Math.max( 4, width )/4 * Math.max( 4, height )/4 * blockBytes;
						byteArray = new Uint8Array(arrayBuffer, dataOffset, dataLength);
						flipDXT( width, blockBytes, byteArray );
						gl.compressedTexImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_X + face, i, internalFormat, width, height, 0, byteArray);
					}
					else
					{
						gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false );
						dataLength = width * height * blockBytes;
						byteArray = new Uint8Array(arrayBuffer, dataOffset, dataLength);
						BGRtoRGB(byteArray);
						gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_X + face, i, internalFormat, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, byteArray);
					}
					dataOffset += dataLength;
					width *= 0.5;
					height *= 0.5;
				}
			}
		}
		else //2d texture
		{
			if(ext) {
				gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true );
				for(var i = 0; i < mipmapCount; ++i) {
					if(fourCC)
					{
						dataLength = Math.max( 4, width )/4 * Math.max( 4, height )/4 * blockBytes;
						byteArray = new Uint8Array(arrayBuffer, dataOffset, dataLength);
						gl.compressedTexImage2D(gl.TEXTURE_2D, i, internalFormat, width, height, 0, byteArray);
					}
					else
					{
						dataLength = width * height * blockBytes;
						byteArray = new Uint8Array(arrayBuffer, dataOffset, dataLength);
						BGRtoRGB(byteArray);
						gl.texImage2D(gl.TEXTURE_2D, i, internalFormat, width, height, 0, internalFormat, gl.UNSIGNED_BYTE, byteArray);
					}
					dataOffset += dataLength;
					width *= 0.5;
					height *= 0.5;
				}
			} else {
				if(fourCC == FOURCC_DXT1) {
					dataLength = Math.max( 4, width )/4 * Math.max( 4, height )/4 * blockBytes;
					byteArray = new Uint16Array(arrayBuffer);
					//Decompress
					rgb565Data = dxtToRgb565(byteArray, dataOffset / 2, width, height);
					gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, width, height, 0, gl.RGB, gl.UNSIGNED_SHORT_5_6_5, rgb565Data);
					if(loadMipmaps) {
						gl.generateMipmap(gl.TEXTURE_2D);
					}
				} else {
					console.error("No manual decoder for", int32ToFourCC(fourCC), "and no native support");
					return 0;
				}
			}
		}

        return mipmapCount;
    }

    /**
     * Parses a DDS file from the given arrayBuffer and uploads it into the currently bound texture
     *
     * @param {WebGLRenderingContext} gl WebGL rendering context
     * @param {WebGLCompressedTextureS3TC} ext WEBGL_compressed_texture_s3tc extension object
     * @param {TypedArray} arrayBuffer Array Buffer containing the DDS files data
     * @param {boolean} [loadMipmaps] If false only the top mipmap level will be loaded, otherwise all available mipmaps will be uploaded
     *
     * @returns {number} Number of mipmaps uploaded, 0 if there was an error
     */
    function getDDSLevels( arrayBuffer, compressed_not_supported )
	{
        var header = new Int32Array(arrayBuffer, 0, headerLengthInt),
            fourCC, blockBytes, internalFormat,
            width, height, dataLength, dataOffset, is_cubemap,
            rgb565Data, byteArray, mipmapCount, i, face;

        if(header[off_magic] != DDS_MAGIC) {
            console.error("Invalid magic number in DDS header");
            return 0;
        }
        
        if(!header[off_pfFlags] & DDPF_FOURCC) {
            console.error("Unsupported format, must contain a FourCC code");
            return 0;
        }

        fourCC = header[off_pfFourCC];
        switch(fourCC) {
            case FOURCC_DXT1:
                blockBytes = 8;
                internalFormat = "COMPRESSED_RGB_S3TC_DXT1_EXT";
                break;

            case FOURCC_DXT3:
                blockBytes = 16;
                internalFormat = "COMPRESSED_RGBA_S3TC_DXT3_EXT";
                break;

            case FOURCC_DXT5:
                blockBytes = 16;
                internalFormat = "COMPRESSED_RGBA_S3TC_DXT5_EXT";
                break;

            default:
				blockBytes = 4;
				internalFormat = "RGBA";
                //console.error("Unsupported FourCC code:", int32ToFourCC(fourCC), fourCC);
                //return null;
        }

        mipmapCount = 1;
        if(header[off_flags] & DDSD_MIPMAPCOUNT && loadMipmaps !== false) {
            mipmapCount = Math.max(1, header[off_mipmapCount]);
        }

        width = header[off_width];
        height = header[off_height];
        dataOffset = header[off_size] + 4;
		is_cubemap = !!(header[off_caps+1] & DDSCAPS2_CUBEMAP);

		var buffers = [];

		if(is_cubemap)
		{
			for(var face = 0; face < 6; ++face)
			{
				width = header[off_width];
				height = header[off_height];
				for(var i = 0; i < mipmapCount; ++i)
				{
					if(fourCC)
					{
						dataLength = Math.max( 4, width )/4 * Math.max( 4, height )/4 * blockBytes;
						byteArray = new Uint8Array(arrayBuffer, dataOffset, dataLength);
						buffers.push({ tex: "TEXTURE_CUBE_MAP", face: face, mipmap: i, internalFormat: internalFormat, width: width, height: height, offset: 0, dataOffset: dataOffset, dataLength: dataLength });
					}
					else
					{
						dataLength = width * height * blockBytes;
						byteArray = new Uint8Array(arrayBuffer, dataOffset, dataLength);
						BGRtoRGB(byteArray);
						buffers.push({ tex: "TEXTURE_CUBE_MAP", face: face, mipmap: i, internalFormat: internalFormat, width: width, height: height, offset: 0, type: "UNSIGNED_BYTE", dataOffset: dataOffset, dataLength: dataLength });
					}
					dataOffset += dataLength;
					width *= 0.5;
					height *= 0.5;
				}
			}
		}
		else //2d texture
		{
			if(!compressed_not_supported)
			{
				for(var i = 0; i < mipmapCount; ++i) {
					dataLength = Math.max( 4, width )/4 * Math.max( 4, height )/4 * blockBytes;
					byteArray = new Uint8Array(arrayBuffer, dataOffset, dataLength);
					//gl.compressedTexImage2D(gl.TEXTURE_2D, i, internalFormat, width, height, 0, byteArray);
					buffers.push({ tex: "TEXTURE_2D", mipmap: i, internalFormat: internalFormat, width: width, height: height, offset: 0, type: "UNSIGNED_BYTE", dataOffset: dataOffset, dataLength: dataLength });
					dataOffset += dataLength;
					width *= 0.5;
					height *= 0.5;
				}
			} else {
				if(fourCC == FOURCC_DXT1)
				{
					dataLength = Math.max( 4, width )/4 * Math.max( 4, height )/4 * blockBytes;
					byteArray = new Uint16Array(arrayBuffer);
					rgb565Data = dxtToRgb565(byteArray, dataOffset / 2, width, height);
					//gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, width, height, 0, gl.RGB, gl.UNSIGNED_SHORT_5_6_5, rgb565Data);
					buffers.push({ tex: "TEXTURE_2D", mipmap: 0, internalFormat: "RGB", width: width, height: height, offset: 0, format:"RGB", type: "UNSIGNED_SHORT_5_6_5", data: rgb565Data });
				} else {
					console.error("No manual decoder for", int32ToFourCC(fourCC), "and no native support");
					return 0;
				}
			}
		}

        return buffers;
    }

    /**
     * Creates a texture from the DDS file at the given URL. Simple shortcut for the most common use case
     *
     * @param {WebGLRenderingContext} gl WebGL rendering context
     * @param {WebGLCompressedTextureS3TC} ext WEBGL_compressed_texture_s3tc extension object
     * @param {string} src URL to DDS file to be loaded
     * @param {function} [callback] callback to be fired when the texture has finished loading
     *
     * @returns {WebGLTexture} New texture that will receive the DDS image data
     */
    function loadDDSTextureEx(gl, ext, src, texture, loadMipmaps, callback) {
        var xhr = new XMLHttpRequest();
        
        xhr.open('GET', src, true);
        xhr.responseType = "arraybuffer";
        xhr.onload = function() {
            if(this.status == 200) {
				var header = new Int32Array(this.response, 0, headerLengthInt)
				var is_cubemap = !!(header[off_caps+1] & DDSCAPS2_CUBEMAP);
				var tex_type = is_cubemap ? gl.TEXTURE_CUBE_MAP : gl.TEXTURE_2D;
                gl.bindTexture(tex_type, texture);
                var mipmaps = uploadDDSLevels(gl, ext, this.response, loadMipmaps);
                gl.texParameteri(tex_type, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
                gl.texParameteri(tex_type, gl.TEXTURE_MIN_FILTER, mipmaps > 1 ? gl.LINEAR_MIPMAP_LINEAR : gl.LINEAR);
                gl.bindTexture(tex_type, null);
				texture.texture_type = tex_type;
				texture.width = header[off_width];
				texture.height = header[off_height];
            }

            if(callback) {
                callback(texture);
            }
        };
        xhr.send(null);

        return texture;
    }

    /**
     * Creates a texture from the DDS file at the given ArrayBuffer.
     *
     * @param {WebGLRenderingContext} gl WebGL rendering context
     * @param {WebGLCompressedTextureS3TC} ext WEBGL_compressed_texture_s3tc extension object
     * @param {ArrayBuffer} data containing the DDS file
     * @param {Texture} texture from GL.Texture
     * @returns {WebGLTexture} New texture that will receive the DDS image data
     */
    function loadDDSTextureFromMemoryEx(gl, ext, data, texture, loadMipmaps) {
		var header = new Int32Array(data, 0, headerLengthInt)
		var is_cubemap = !!(header[off_caps+1] & DDSCAPS2_CUBEMAP);
		var tex_type = is_cubemap ? gl.TEXTURE_CUBE_MAP : gl.TEXTURE_2D;

		var handler = texture.handler || texture;

		gl.bindTexture(tex_type, texture.handler);

		//upload data
		var mipmaps = uploadDDSLevels(gl, ext, data, loadMipmaps);

		gl.texParameteri(tex_type, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
		gl.texParameteri(tex_type, gl.TEXTURE_MIN_FILTER, mipmaps > 1 ? gl.LINEAR_MIPMAP_LINEAR : gl.LINEAR);
        if(is_cubemap)
        {
            gl.texParameteri(tex_type, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE );
            gl.texParameteri(tex_type, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE );
        }

		gl.bindTexture(tex_type, null); //unbind
		if(texture.handler)
		{
			texture.texture_type = tex_type;
			texture.width = header[off_width];
			texture.height = header[off_height];
		}
        return texture;
    }

    /**
     * Extracts the texture info from a DDS file at the given ArrayBuffer.
     *
     * @param {ArrayBuffer} data containing the DDS file
     *
     * @returns {Object} contains mipmaps and properties
     */
    function getDDSTextureFromMemoryEx(data) {
		var header = new Int32Array(data, 0, headerLengthInt)
		var is_cubemap = !!(header[off_caps+1] & DDSCAPS2_CUBEMAP);
		var tex_type = is_cubemap ? "TEXTURE_CUBE_MAP" : "TEXTURE_2D";
		var buffers = getDDSLevels(data);

		var texture = {
			type: tex_type,
			buffers: buffers,
			data: data,
			width: header[off_width],
			height: header[off_height]
		};

        return texture;
    }

    /**
     * Creates a texture from the DDS file at the given URL. Simple shortcut for the most common use case
     *
     * @param {WebGLRenderingContext} gl WebGL rendering context
     * @param {WebGLCompressedTextureS3TC} ext WEBGL_compressed_texture_s3tc extension object
     * @param {string} src URL to DDS file to be loaded
     * @param {function} [callback] callback to be fired when the texture has finished loading
     *
     * @returns {WebGLTexture} New texture that will receive the DDS image data
     */
    function loadDDSTexture(gl, ext, src, callback) {
        var texture = gl.createTexture();
        var ext = gl.getExtension("WEBGL_compressed_texture_s3tc");
        loadDDSTextureEx(gl, ext, src, texture, true, callback);
        return texture;
    }

    return {
        dxtToRgb565: dxtToRgb565,
        uploadDDSLevels: uploadDDSLevels,
        loadDDSTextureEx: loadDDSTextureEx,
        loadDDSTexture: loadDDSTexture,
		loadDDSTextureFromMemoryEx: loadDDSTextureFromMemoryEx,
		getDDSTextureFromMemoryEx: getDDSTextureFromMemoryEx
    };

})();

if(typeof(global) != "undefined")
	global.DDS = DDS;
