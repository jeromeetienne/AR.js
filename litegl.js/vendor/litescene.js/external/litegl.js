//packer version
//litegl.js by Javi Agenjo 2014 @tamat (tamats.com)
//forked from lightgl.js by Evan Wallace (madebyevan.com)
"use strict";

(function(global){

var GL = global.GL = {};


//polyfill
global.requestAnimationFrame = global.requestAnimationFrame || global.mozRequestAnimationFrame || global.webkitRequestAnimationFrame || function(callback) { setTimeout(callback, 1000 / 60); };

GL.blockable_keys = {"Up":true,"Down":true,"Left":true,"Right":true};

//some consts
GL.LEFT_MOUSE_BUTTON = 1;
GL.MIDDLE_MOUSE_BUTTON = 2;
GL.RIGHT_MOUSE_BUTTON = 3;
GL.last_context_id = 0;


//Define WEBGL ENUMS as statics (more to come in WebGL 2)
//sometimes we need some gl enums before having the gl context, solution: define them globally because the specs says they are constant)

GL.COLOR_BUFFER_BIT = 16384;
GL.DEPTH_BUFFER_BIT = 256;
GL.STENCIL_BUFFER_BIT = 1024;

GL.TEXTURE_2D = 3553;
GL.TEXTURE_CUBE_MAP = 34067;
GL.TEXTURE_3D = 32879;

GL.TEXTURE_MAG_FILTER = 10240;
GL.TEXTURE_MIN_FILTER = 10241;
GL.TEXTURE_WRAP_S = 10242;
GL.TEXTURE_WRAP_T = 10243;

GL.BYTE = 5120;
GL.UNSIGNED_BYTE = 5121;
GL.SHORT = 5122;
GL.UNSIGNED_SHORT = 5123;
GL.INT = 5124;
GL.UNSIGNED_INT = 5125;
GL.FLOAT = 5126;
GL.HALF_FLOAT_OES = 36193; //webgl 1.0 only

//webgl2 formats
GL.HALF_FLOAT = 5131; 
GL.DEPTH_COMPONENT16 = 33189;
GL.DEPTH_COMPONENT24 = 33190;
GL.DEPTH_COMPONENT32F = 36012;

GL.FLOAT_VEC2 = 35664;
GL.FLOAT_VEC3 = 35665;
GL.FLOAT_VEC4 = 35666;
GL.INT_VEC2 = 35667;
GL.INT_VEC3 = 35668;
GL.INT_VEC4 = 35669;
GL.BOOL = 35670;
GL.BOOL_VEC2 = 35671;
GL.BOOL_VEC3 = 35672;
GL.BOOL_VEC4 = 35673;
GL.FLOAT_MAT2 = 35674;
GL.FLOAT_MAT3 = 35675;
GL.FLOAT_MAT4 = 35676;

GL.SAMPLER_2D = 35678;
GL.SAMPLER_3D = 35679;
GL.SAMPLER_CUBE = 35680;

GL.DEPTH_COMPONENT = 6402;
GL.ALPHA = 6406;
GL.RGB = 6407;
GL.RGBA = 6408;
GL.LUMINANCE = 6409;
GL.LUMINANCE_ALPHA = 6410;
GL.DEPTH_STENCIL = 34041;
GL.UNSIGNED_INT_24_8_WEBGL = 34042;

//webgl2 formats
GL.R8 = 33321;
GL.R16F = 33325;
GL.R32F = 33326;
GL.R8UI = 33330;
GL.RG8 = 33323;
GL.RG16F = 33327;
GL.RG32F = 33328;
GL.RGB8 = 32849;
GL.SRGB8 = 35905;
GL.RGB565 = 36194;
GL.R11F_G11F_B10F = 35898;
GL.RGB9_E5 = 35901;
GL.RGB16F = 34843;
GL.RGB32F = 34837;
GL.RGB8UI = 36221;
GL.RGBA8 = 32856;
GL.RGB5_A1 = 32855;
GL.RGBA16F = 34842;
GL.RGBA32F = 34836;
GL.RGBA8UI = 36220;
GL.RGBA16I = 36232;
GL.RGBA16UI = 36214;
GL.RGBA32I = 36226;
GL.RGBA32UI = 36208;

GL.NEAREST = 9728;
GL.LINEAR = 9729;
GL.NEAREST_MIPMAP_NEAREST = 9984;
GL.LINEAR_MIPMAP_NEAREST = 9985;
GL.NEAREST_MIPMAP_LINEAR = 9986;
GL.LINEAR_MIPMAP_LINEAR = 9987;

GL.REPEAT = 10497;
GL.CLAMP_TO_EDGE = 33071;
GL.MIRRORED_REPEAT = 33648;

GL.ZERO = 0;
GL.ONE = 1;
GL.SRC_COLOR = 768;
GL.ONE_MINUS_SRC_COLOR = 769;
GL.SRC_ALPHA = 770;
GL.ONE_MINUS_SRC_ALPHA = 771;
GL.DST_ALPHA = 772;
GL.ONE_MINUS_DST_ALPHA = 773;
GL.DST_COLOR = 774;
GL.ONE_MINUS_DST_COLOR = 775;
GL.SRC_ALPHA_SATURATE = 776;
GL.CONSTANT_COLOR = 32769;
GL.ONE_MINUS_CONSTANT_COLOR = 32770;
GL.CONSTANT_ALPHA = 32771;
GL.ONE_MINUS_CONSTANT_ALPHA = 32772;

GL.VERTEX_SHADER = 35633;
GL.FRAGMENT_SHADER = 35632;

GL.FRONT = 1028;
GL.BACK = 1029;
GL.FRONT_AND_BACK = 1032;

GL.NEVER = 512;
GL.LESS = 513;
GL.EQUAL = 514;
GL.LEQUAL = 515;
GL.GREATER = 516;
GL.NOTEQUAL = 517;
GL.GEQUAL = 518;
GL.ALWAYS = 519;

GL.KEEP = 7680;
GL.REPLACE = 7681;
GL.INCR = 7682;
GL.DECR = 7683;
GL.INCR_WRAP = 34055;
GL.DECR_WRAP = 34056;
GL.INVERT = 5386;

GL.STREAM_DRAW = 35040;
GL.STATIC_DRAW = 35044;
GL.DYNAMIC_DRAW = 35048;

GL.ARRAY_BUFFER = 34962;
GL.ELEMENT_ARRAY_BUFFER = 34963;

GL.POINTS = 0;
GL.LINES = 1;
GL.LINE_LOOP = 2;
GL.LINE_STRIP = 3;
GL.TRIANGLES = 4;
GL.TRIANGLE_STRIP = 5;
GL.TRIANGLE_FAN = 6;

GL.CW = 2304;
GL.CCW = 2305;

GL.CULL_FACE = 2884;
GL.DEPTH_TEST = 2929;
GL.BLEND = 3042;

GL.temp_vec3 = vec3.create();
GL.temp2_vec3 = vec3.create();
GL.temp_vec4 = vec4.create();
GL.temp_quat = quat.create();
GL.temp_mat3 = mat3.create();
GL.temp_mat4 = mat4.create();


global.DEG2RAD = 0.0174532925;
global.RAD2DEG = 57.295779578552306;
global.EPSILON = 0.000001;

/**
* Tells if one number is power of two (used for textures)
* @method isPowerOfTwo
* @param {v} number
* @return {boolean}
*/
global.isPowerOfTwo = GL.isPowerOfTwo = function isPowerOfTwo(v)
{
	return ((Math.log(v) / Math.log(2)) % 1) == 0;
}

//Global Scope
//better array conversion to string for serializing
var typed_arrays = [ Uint8Array, Int8Array, Uint16Array, Int16Array, Uint32Array, Int32Array, Float32Array, Float64Array ];
function typedToArray(){ 
	return Array.prototype.slice.call(this);
}
typed_arrays.forEach( function(v) { 
	if(!v.prototype.toJSON)
		Object.defineProperty( v.prototype, "toJSON", {
			value: typedToArray,
			enumerable: false
		});
});



/**
* Get current time in milliseconds
* @method getTime
* @return {number}
*/
if(typeof(performance) != "undefined")
  global.getTime = performance.now.bind(performance);
else
  global.getTime = Date.now.bind( Date );
GL.getTime = global.getTime;


global.isFunction = function isFunction(obj) {
  return !!(obj && obj.constructor && obj.call && obj.apply);
}

global.isArray = function isArray(obj) {
  return (obj && obj.constructor === Array );
  //var str = Object.prototype.toString.call(obj);
  //return str == '[object Array]' || str == '[object Float32Array]';
}

global.isNumber = function isNumber(obj) {
  return (obj != null && obj.constructor === Number );
}

global.getClassName = function getClassName(obj)
{
	if (!obj)
		return;

	//from function info, but not standard
	if(obj.name)
		return obj.name;

	//from sourcecode
	if(obj.toString) {
		var arr = obj.toString().match(
			/function\s*(\w+)/);
		if (arr && arr.length == 2) {
			return arr[1];
		}
	}
}

/**
* clone one object recursively, only allows objects containing number,strings,typed-arrays or other objects
* @method cloneObject
* @param {Object} object 
* @param {Object} target if omited an empty object is created
* @return {Object}
*/
global.cloneObject = GL.cloneObject = function(o, t)
{
	if(o.constructor !== Object)
		throw("cloneObject only can clone pure javascript objects, not classes");

	t = t || {};

	for(var i in o)
	{
		var v = o[i];
		if(v === null)
		{
			t[i] = null;
			continue;
		}

		switch(v.constructor)
		{
			case Int8Array:
			case Uint8Array:
			case Int16Array:
			case Uint16Array:
			case Int32Array:
			case Uint32Array:
			case Float32Array:
			case Float64Array:
				t[i] = new v.constructor(v);
				break;
			case Boolean:
			case Number:
			case String:
				t[i] = v;
				break;
			case Array:
				t[i] = v.concat(); //content is not cloned
				break;
			case Object:
				t[i] = GL.cloneObject(v);
				break;
		}
	}

	return t;
}


/* SLOW because accepts booleans
function isNumber(obj) {
  var str = Object.prototype.toString.call(obj);
  return str == '[object Number]' || str == '[object Boolean]';
}
*/

//given a regular expression, a text and a callback, it calls the function every time it finds it
global.regexMap = function regexMap(regex, text, callback) {
  var result;
  while ((result = regex.exec(text)) != null) {
    callback(result);
  }
}

global.createCanvas = GL.createCanvas = function createCanvas(width, height) {
    var canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    return canvas;
}

global.cloneCanvas = GL.cloneCanvas = function cloneCanvas(c) {
    var canvas = document.createElement('canvas');
    canvas.width = c.width;
    canvas.height = c.height;
    var ctx = canvas.getContext("2d");
    ctx.drawImage(c,0,0);
    return canvas;
}

if(typeof(Image) != "undefined") //not existing inside workers
{
	Image.prototype.getPixels = function()
	{
		var canvas = document.createElement('canvas');
		canvas.width = this.width;
		canvas.height = this.height;
		var ctx = canvas.getContext("2d");
		ctx.drawImage(this,0,0);
		return ctx.getImageData(0, 0, this.width, this.height).data;
	}
}

if(!String.prototype.hasOwnProperty("replaceAll")) 
	Object.defineProperty(String.prototype, "replaceAll", {
		value: function(words){
			var str = this;
			for(var i in words)
				str = str.split(i).join(words[i]);
			return str;
		},
		enumerable: false
	});	

/*
String.prototype.replaceAll = function(words){
	var str = this;
	for(var i in words)
		str = str.split(i).join(words[i]);
    return str;
};
*/

//used for hashing keys
if(!String.prototype.hasOwnProperty("hashCode")) 
	Object.defineProperty(String.prototype, "hashCode", {
		value: function(){
			var hash = 0, i, c, l;
			if (this.length == 0) return hash;
			for (i = 0, l = this.length; i < l; ++i) {
				c  = this.charCodeAt(i);
				hash  = ((hash<<5)-hash)+c;
				hash |= 0; // Convert to 32bit integer
			}
			return hash;
		},
		enumerable: false
	});	

//avoid errors when Typed array is expected and regular array is found
//Array.prototype.subarray = Array.prototype.slice;
if(!Array.prototype.hasOwnProperty("subarray"))
	Object.defineProperty(Array.prototype, "subarray", { value: Array.prototype.slice, enumerable: false });


// remove all properties on obj, effectively reverting it to a new object (to reduce garbage)
global.wipeObject = function wipeObject(obj)
{
  for (var p in obj)
  {
    if (obj.hasOwnProperty(p))
      delete obj[p];
  }
};

//copy methods from origin to target
global.extendClass = GL.extendClass = function extendClass( target, origin ) {
	for(var i in origin) //copy class properties
	{
		if(target.hasOwnProperty(i))
			continue;
		target[i] = origin[i];
	}

	if(origin.prototype) //copy prototype properties
	{
		var prop_names = Object.getOwnPropertyNames( origin.prototype );
		for(var i = 0; i < prop_names.length; ++i) //only enumerables
		{
			var name = prop_names[i];
			//if(!origin.prototype.hasOwnProperty(name)) 
			//	continue;

			if(target.prototype.hasOwnProperty(name)) //avoid overwritting existing ones
				continue;

			//copy getters 
			if(origin.prototype.__lookupGetter__(name))
				target.prototype.__defineGetter__(name, origin.prototype.__lookupGetter__(name));
			else 
				target.prototype[name] = origin.prototype[name];

			//and setters
			if(origin.prototype.__lookupSetter__(name))
				target.prototype.__defineSetter__(name, origin.prototype.__lookupSetter__(name));
		}
	}

	if(!target.hasOwnProperty("superclass")) 
		Object.defineProperty(target, "superclass", {
			get: function() { return origin },
			enumerable: false
		});	
}



//simple http request
global.HttpRequest = GL.request = function HttpRequest(url,params, callback, error, options)
{
	var async = true;
	if(options && options.async !== undefined)
		async = options.async;

	if(params)
	{
		var params_str = null;
		var params_arr = [];
		for(var i in params)
			params_arr.push(i + "=" + params[i]);
		params_str = params_arr.join("&");
		url = url + "?" + params_str;
	}

	var xhr = new XMLHttpRequest();
	xhr.open('GET', url, async);
	xhr.onload = function(e)
	{
		var response = this.response;
		var type = this.getResponseHeader("Content-Type");
		if(this.status != 200)
		{
			LEvent.trigger(xhr,"fail",this.status);
			if(error)
				error(this.status);
			return;
		}

		LEvent.trigger(xhr,"done",this.response);
		if(callback)
			callback(this.response);
		return;
	}

	xhr.onerror = function(err)
	{
		LEvent.trigger(xhr,"fail",err);
	}
	
	if(options)
	{
		for(var i in options)
			xhr[i] = options[i];
		if(options.binary)
			xhr.responseType = "arraybuffer";
	}

	xhr.send();

	return xhr;
}

//cheap simple promises
if( global.XMLHttpRequest )
{
	if( !XMLHttpRequest.prototype.hasOwnProperty("done") )
		Object.defineProperty( XMLHttpRequest.prototype, "done", { enumerable: false, value: function(callback)
		{
		  LEvent.bind(this,"done", function(e,err) { callback(err); } );
		  return this;
		}});

	if( !XMLHttpRequest.prototype.hasOwnProperty("fail") )
		Object.defineProperty( XMLHttpRequest.prototype, "fail", { enumerable: false, value: function(callback)
		{
		  LEvent.bind(this,"fail", function(e,err) { callback(err); } );
		  return this;
		}});
}

global.getFileExtension = function getFileExtension(url)
{
	var question = url.indexOf("?");
	if(question != -1)
		url = url.substr(0,question);
	var point = url.lastIndexOf(".");
	if(point == -1) 
		return "";
	return url.substr(point+1).toLowerCase();
} 


//allows to pack several (text)files inside one single file (useful for shaders)
//every file must start with \filename.ext  or /filename.ext
global.loadFileAtlas = GL.loadFileAtlas = function loadFileAtlas(url, callback, sync)
{
	var deferred_callback = null;

	HttpRequest(url, null, function(data) {
		var files = GL.processFileAtlas(data); 
		if(callback)
			callback(files);
		if(deferred_callback)
			deferred_callback(files);
	}, alert, sync);

	return { done: function(callback) { deferred_callback = callback; } };
}

//This parses a text file that contains several text files (they are separated by "\filename"), and returns an object with every file separatly
global.processFileAtlas = GL.processFileAtlas = function(data, skip_trim)
{
	var lines = data.split("\n");
	var files = {};

	var current_file_lines = [];
	var current_file_name = "";
	for(var i = 0, l = lines.length; i < l; i++)
	{
		var line = skip_trim ? lines[i] : lines[i].trim();
		if(!line.length)
			continue;
		if( line[0] != "\\")
		{
			current_file_lines.push(line);
			continue;
		}

		if( current_file_lines.length )
			files[ current_file_name ] = current_file_lines.join("\n");
		current_file_lines.length = 0;
		current_file_name = line.substr(1);
	}

	if( current_file_lines.length )
		files[ current_file_name ] = current_file_lines.join("\n");

	return files;
}

global.typedArrayToArray = function(array)
{
	var r = [];
	r.length = array.length;
	for(var i = 0; i < array.length; i++)
		r[i] = array[i];
	return r;
}

global.RGBToHex = function(r, g, b) { 
	r = Math.min(255, r*255)|0;
	g = Math.min(255, g*255)|0;
	b = Math.min(255, b*255)|0;
	return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

global.hexColorToRGBA = (function() {
	//to change the color: from http://www.w3schools.com/cssref/css_colorsfull.asp
	var string_colors = {
		white: [1,1,1],
		black: [0,0,0],
		gray: [0.501960813999176, 0.501960813999176, 0.501960813999176],
		red: [1,0,0],
		orange: [1, 0.6470588445663452, 0],
		pink: [1, 0.7529411911964417, 0.7960784435272217],
		green: [0, 0.501960813999176, 0],
		lime: [0,1,0],
		blue: [0,0,1],
		violet: [0.9333333373069763, 0.5098039507865906, 0.9333333373069763],
		magenta: [1,0,1],
		cyan: [0,1,1],
		yellow: [1,1,0],
		brown: [0.6470588445663452, 0.16470588743686676, 0.16470588743686676],
		silver: [0.7529411911964417, 0.7529411911964417, 0.7529411911964417],
		gold: [1, 0.843137264251709, 0],
		transparent: [0,0,0,0]
	};

	function hue2rgb( p, q, t ){
		if(t < 0) t += 1;
		if(t > 1) t -= 1;
		if(t < 1/6) return p + (q - p) * 6 * t;
		if(t < 1/2) return q;
		if(t < 2/3) return p + (q - p) * (2/3 - t) * 6;
		return p;
	}

	function hslToRgb( h, s, l, out ){
		var r, g, b;
		out = out || vec3.create();
		if(s == 0){
			r = g = b = l; // achromatic
		}else{
			var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
			var p = 2 * l - q;
			r = hue2rgb(p, q, h + 1/3);
			g = hue2rgb(p, q, h);
			b = hue2rgb(p, q, h - 1/3);
		}
		out[0] = r;
		out[1] = g;
		out[2] = b;
		return out;
	}

	return function( hex, color, alpha )
	{
	alpha = (alpha === undefined ? 1 : alpha);
	color = color || new Float32Array(4);
	color[3] = alpha;

	if(typeof(hex) != "string")
		return color;


	//for those hardcoded colors
	var col = string_colors[hex];
	if( col !== undefined )
	{
		color.set( col );
		if(color.length == 3)
			color[3] = alpha;
		else
			color[3] *= alpha;
		return color;
	}

	//rgba colors
	var pos = hex.indexOf("rgba(");
	if(pos != -1)
	{
		var str = hex.substr(5);
		str = str.split(",");
		color[0] = parseInt( str[0] ) / 255;
		color[1] = parseInt( str[1] ) / 255;
		color[2] = parseInt( str[2] ) / 255;
		color[3] = parseFloat( str[3] ) * alpha;
		return color;
	}

	var pos = hex.indexOf("hsla(");
	if(pos != -1)
	{
		var str = hex.substr(5);
		str = str.split(",");
		hslToRgb( parseInt( str[0] ) / 360, parseInt( str[1] ) / 100, parseInt( str[2] ) / 100, color );
		color[3] = parseFloat( str[3] ) * alpha;
		return color;
	}

	color[3] = alpha;

	//rgb colors
	var pos = hex.indexOf("rgb(");
	if(pos != -1)
	{
		var str = hex.substr(3);
		str = str.split(",");
		color[0] = parseInt( str[0] ) / 255;
		color[1] = parseInt( str[1] ) / 255;
		color[2] = parseInt( str[2] ) / 255;
		return color;
	}

	var pos = hex.indexOf("hsl(");
	if(pos != -1)
	{
		var str = hex.substr(5);
		str = str.split(",");
		hslToRgb( parseInt( str[0] ) / 360, parseInt( str[1] ) / 100, parseInt( str[2] ) / 100, color );
		return color;
	}


	//the rest
	// Expand shorthand form (e.g. "03F") to full form (e.g. "0033FF")
	var shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
	hex = hex.replace(shorthandRegex, function(m, r, g, b) {
		return r + r + g + g + b + b;
	});

	var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
	if(!result)
		return color;

	color[0] = parseInt(result[1], 16) / 255;
	color[1] = parseInt(result[2], 16) / 255;
	color[2] = parseInt(result[3], 16) / 255;
	return color;
	}
})();
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

/* this file adds some extra functions to gl-matrix library */
if(typeof(glMatrix) == "undefined")
	throw("You must include glMatrix on your project");

Math.clamp = function(v,a,b) { return (a > v ? a : (b < v ? b : v)); }

var V3 = vec3.create;
var M4 = vec3.create;


vec3.ZERO = vec3.fromValues(0,0,0);
vec3.FRONT = vec3.fromValues(0,0,-1);
vec3.UP = vec3.fromValues(0,1,0);
vec3.RIGHT = vec3.fromValues(1,0,0);

vec2.rotate = function(out,vec,angle_in_rad)
{
	var x = vec[0], y = vec[1];
	var cos = Math.cos(angle_in_rad);
	var sin = Math.sin(angle_in_rad);
	out[0] = x * cos - y * sin;
	out[1] = x * sin + y * cos;
	return out;
}

vec3.zero = function(a)
{
	a[0] = a[1] = 0.0;
	return a;
}

//for signed angles
vec2.perpdot = function(a,b)
{
	return a[1] * b[0] + -a[0] * b[1];
}

vec2.computeSignedAngle = function( a, b )
{
	return Math.atan2( vec2.perpdot(a,b), vec2.dot(a,b) );
}

vec2.random = function(vec)
{
	vec[0] = Math.random();
	vec[1] = Math.random();
	return vec;
}

vec3.zero = function(a)
{
	a[0] = a[1] = a[2] = 0.0;
	return a;
}

vec3.minValue = function(a)
{
	if(a[0] < a[1] && a[0] < a[2]) return a[0];
	if(a[1] < a[2]) return a[1];
	return a[2];
}

vec3.maxValue = function(a)
{
	if(a[0] > a[1] && a[0] > a[2]) return a[0];
	if(a[1] > a[2]) return a[1];
	return a[2];
}

vec3.minValue = function(a)
{
	if(a[0] < a[1] && a[0] < a[2]) return a[0];
	if(a[1] < a[2]) return a[1];
	return a[2];
}

vec3.addValue = function(out,a,v)
{
	out[0] = a[0] + v;
	out[1] = a[1] + v;
	out[2] = a[2] + v;
}

vec3.subValue = function(out,a,v)
{
	out[0] = a[0] - v;
	out[1] = a[1] - v;
	out[2] = a[2] - v;
}

vec3.toArray = function(vec)
{
	return [vec[0],vec[1],vec[2]];
}

vec3.rotateX = function(out,vec,angle_in_rad)
{
	var y = vec[1], z = vec[2];
	var cos = Math.cos(angle_in_rad);
	var sin = Math.sin(angle_in_rad);

	out[0] = vec[0];
	out[1] = y * cos - z * sin;
	out[2] = y * sin + z * cos;
	return out;
}

vec3.rotateY = function(out,vec,angle_in_rad)
{
	var x = vec[0], z = vec[2];
	var cos = Math.cos(angle_in_rad);
	var sin = Math.sin(angle_in_rad);

	out[0] = x * cos - z * sin;
	out[1] = vec[1];
	out[2] = x * sin + z * cos;
	return out;
}

vec3.rotateZ = function(out,vec,angle_in_rad)
{
	var x = vec[0], y = vec[1];
	var cos = Math.cos(angle_in_rad);
	var sin = Math.sin(angle_in_rad);

	out[0] = x * cos - y * sin;
	out[1] = x * sin + y * cos;
	out[2] = vec[2];
	return out;
}

vec3.angle = function( a, b )
{
	return Math.acos( vec3.dot(a,b) );
}

vec3.random = function(vec)
{
	vec[0] = Math.random();
	vec[1] = Math.random();
	vec[2] = Math.random();
	return vec;
}

//converts a polar coordinate (radius, lat, long) to (x,y,z)
vec3.polarToCartesian = function(out, v)
{
	var r = v[0];
	var lat = v[1];
	var lon = v[2];
	out[0] = r * Math.cos(lat) * Math.sin(lon);
	out[1] = r * Math.sin(lat);
	out[2] = r * Math.cos(lat) * Math.cos(lon);
	return out;
}

vec3.reflect = function(out, v, n)
{
	var x = v[0]; var y = v[1]; var z = v[2];
	vec3.scale( out, n, -2 * vec3.dot(v,n) );
	out[0] += x;
	out[1] += y;
	out[2] += z;
	return out;
}

/* VEC4 */
vec4.random = function(vec)
{
	vec[0] = Math.random();
	vec[1] = Math.random();
	vec[2] = Math.random();
	vec[3] = Math.random();	
	return vec;
}

vec4.toArray = function(vec)
{
	return [vec[0],vec[1],vec[2],vec[3]];
}


/** MATRIX ********************/
mat3.IDENTITY = mat3.create();
mat4.IDENTITY = mat4.create();

mat4.toArray = function(mat)
{
	return [mat[0],mat[1],mat[2],mat[3],mat[4],mat[5],mat[6],mat[7],mat[8],mat[9],mat[10],mat[11],mat[12],mat[13],mat[14],mat[15]];
}

mat4.setUpAndOrthonormalize = function(out, m, up)
{
	if(m != out)
		mat4.copy(out,m);
	var right = out.subarray(0,3);
	vec3.normalize(out.subarray(4,7),up);
	var front = out.subarray(8,11);
	vec3.cross( right, up, front );
	vec3.normalize( right, right );
	vec3.cross( front, right, up );
	vec3.normalize( front, front );
}

mat4.multiplyVec3 = function(out, m, a) {
    var x = a[0], y = a[1], z = a[2];
    out[0] = m[0] * x + m[4] * y + m[8] * z + m[12];
    out[1] = m[1] * x + m[5] * y + m[9] * z + m[13];
    out[2] = m[2] * x + m[6] * y + m[10] * z + m[14];
    return out;
};

//from https://github.com/hughsk/from-3d-to-2d/blob/master/index.js
//m should be a projection matrix (or a VP or MVP)
//projects vector from 3D to 2D and returns the value in normalized screen space
mat4.projectVec3 = function(out, m, a)
{
	var ix = a[0];
	var iy = a[1];
	var iz = a[2];

	var ox = m[0] * ix + m[4] * iy + m[8] * iz + m[12];
	var oy = m[1] * ix + m[5] * iy + m[9] * iz + m[13];
	var oz = m[2] * ix + m[6] * iy + m[10] * iz + m[14];
	var ow = m[3] * ix + m[7] * iy + m[11] * iz + m[15];

	out[0] = (ox / ow + 1) / 2;
	out[1] = (oy / ow + 1) / 2;
	out[2] = (oz / ow + 1) / 2;
	return out;
};


//from https://github.com/hughsk/from-3d-to-2d/blob/master/index.js
vec3.project = function(out, vec,  mvp, viewport) {
	viewport = viewport || gl.viewport_data;

	var m = mvp;

	var ix = vec[0];
	var iy = vec[1];
	var iz = vec[2];

	var ox = m[0] * ix + m[4] * iy + m[8] * iz + m[12]
	var oy = m[1] * ix + m[5] * iy + m[9] * iz + m[13]
	var ow = m[3] * ix + m[7] * iy + m[11] * iz + m[15]

	var projx =     (ox / ow + 1) / 2;
	var projy = 1 - (oy / ow + 1) / 2;

	out[0] = projx * viewport[2] + viewport[0];
	out[1] = projy * viewport[3] + viewport[1];
	out[2] = ow;
	return out;
};

var unprojectMat = mat4.create();
var unprojectVec = vec4.create();

vec3.unproject = function (out, vec, viewprojection, viewport) {

	var m = unprojectMat;
	var v = unprojectVec;
	
	v[0] = (vec[0] - viewport[0]) * 2.0 / viewport[2] - 1.0;
	v[1] = (vec[1] - viewport[1]) * 2.0 / viewport[3] - 1.0;
	v[2] = 2.0 * vec[2] - 1.0;
	v[3] = 1.0;
	
	if(!mat4.invert(m,viewprojection)) 
		return null;
	
	vec4.transformMat4(v, v, m);
	if(v[3] === 0.0) 
		return null;

	out[0] = v[0] / v[3];
	out[1] = v[1] / v[3];
	out[2] = v[2] / v[3];
	
	return out;
};

//without translation
mat4.rotateVec3 = function(out, m, a) {
    var x = a[0], y = a[1], z = a[2];
    out[0] = m[0] * x + m[4] * y + m[8] * z;
    out[1] = m[1] * x + m[5] * y + m[9] * z;
    out[2] = m[2] * x + m[6] * y + m[10] * z;
    return out;
};

mat4.fromTranslationFrontTop = function (out, pos, front, top)
{
	vec3.cross(out.subarray(0,3), front, top);
	out.set(top,4);
	out.set(front,8);
	out.set(pos,12);
	return out;
}


mat4.translationMatrix = function (v)
{
	var out = mat4.create();
	out[12] = v[0];
	out[13] = v[1];
	out[14] = v[2];
	return out;
}

mat4.setTranslation = function (out, v)
{
	out[12] = v[0];
	out[13] = v[1];
	out[14] = v[2];
	return out;
}


mat4.getTranslation = function (out, matrix)
{
	out[0] = matrix[12];
	out[1] = matrix[13];
	out[2] = matrix[14];
	return out;
}

//returns the matrix without rotation
mat4.toRotationMat4 = function (out, mat) {
	mat4.copy(out,mat);
	out[12] = out[13] = out[14] = 0.0;
	return out;
};

mat4.swapRows = function(out, mat, row, row2)
{
	if(out != mat)
	{
		mat4.copy(out, mat);
		out[4*row] = mat[4*row2];
		out[4*row+1] = mat[4*row2+1];
		out[4*row+2] = mat[4*row2+2];
		out[4*row+3] = mat[4*row2+3];
		out[4*row2] = mat[4*row];
		out[4*row2+1] = mat[4*row+1];
		out[4*row2+2] = mat[4*row+2];
		out[4*row2+3] = mat[4*row+3];
		return out;
	}

	var temp = new Float32Array(matrix.subarray(row*4,row*5));
	matrix.set( matrix.subarray(row2*4,row2*5), row*4 );
	matrix.set( temp, row2*4 );
	return out;
}

//used in skinning
mat4.scaleAndAdd = function(out, mat, mat2, v)
{
	out[0] = mat[0] + mat2[0] * v; 	out[1] = mat[1] + mat2[1] * v; 	out[2] = mat[2] + mat2[2] * v; 	out[3] = mat[3] + mat2[3] * v;
	out[4] = mat[4] + mat2[4] * v; 	out[5] = mat[5] + mat2[5] * v; 	out[6] = mat[6] + mat2[6] * v; 	out[7] = mat[7] + mat2[7] * v;
	out[8] = mat[8] + mat2[8] * v; 	out[9] = mat[9] + mat2[9] * v; 	out[10] = mat[10] + mat2[10] * v; 	out[11] = mat[11] + mat2[11] * v;
	out[12] = mat[12] + mat2[12] * v;  out[13] = mat[13] + mat2[13] * v; 	out[14] = mat[14] + mat2[14] * v; 	out[15] = mat[15] + mat2[15] * v;
	return out;
}

quat.fromAxisAngle = function(axis, rad)
{
	var out = quat.create();
    rad = rad * 0.5;
    var s = Math.sin(rad);
    out[0] = s * axis[0];
    out[1] = s * axis[1];
    out[2] = s * axis[2];
    out[3] = Math.cos(rad);
    return out;
}

/*
quat.toEuler = function(out, quat) {
	var q = quat;
	var heading, attitude, bank;

	if( (q[0]*q[1] + q[2]*q[3]) == 0.5 )
	{
		heading = 2 * Math.atan2(q[0],q[3]);
		bank = 0;
		attitude = 0; //¿?
	}
	else if( (q[0]*q[1] + q[2]*q[3]) == 0.5 )
	{
		heading = -2 * Math.atan2(q[0],q[3]);
		bank = 0;
		attitude = 0; //¿?
	}
	else
	{
		heading = Math.atan2( 2*(q[1]*q[3] - q[0]*q[2]) , 1 - 2 * (q[1]*q[1] - q[2]*q[2]) );
		attitude = Math.asin( 2*(q[0]*q[1] - q[2]*q[3]) );
		bank = Math.atan2( 2*(q[0]*q[3] - q[1]*q[2]), 1 - 2*(q[0]*q[0] - q[2]*q[2]) );
	}

	if(!out)
		out = vec3.create();
	vec3.set(out, heading, attitude, bank);
	return out;
}
*/

/*
//FROM https://en.wikipedia.org/wiki/Conversion_between_quaternions_and_Euler_angles
//doesnt work well
quat.toEuler = function(out, q)
{
    var yaw = Math.atan2(2*q[0]*q[3] + 2*q[1]*q[2], 1 - 2*q[2]*q[2] - 2*q[3]*q[3]);
    var pitch = Math.asin(2*q[0]*q[2] - 2*q[3]*q[1]);
    var roll = Math.atan2(2*q[0]*q[1] + 2*q[2]*q[3], 1 - 2*q[1]*q[1] - 2*q[2]*q[2]);
	if(!out)
		out = vec3.create();
	vec3.set(out, yaw, pitch, roll);
	return out;
}

quat.fromEuler = function(out, vec) {
	var yaw = vec[0];
	var pitch = vec[1];
	var roll = vec[2];

	var C1 = Math.cos(yaw*0.5);
	var C2 = Math.cos(pitch*0.5);
	var C3 = Math.cos(roll*0.5);
	var S1 = Math.sin(yaw*0.5);
	var S2 = Math.sin(pitch*0.5);
	var S3 = Math.sin(roll*0.5);

	var x = C1*C2*C3 + S1*S2*S3;
	var y = S1*C2*C3 - C1*S2*S3;
	var z = C1*S2*C3 + S1*C2*S3;
	var w = C1*C2*S3 - S1*S2*C3;

	quat.set(out, x,y,z,w );
	quat.normalize(out,out); //necessary?
	return out;
}
*/

quat.toEuler = function(out, q)
{
    var heading = Math.atan2(2*q[1]*q[3] - 2*q[0]*q[2], 1 - 2*q[1]*q[1] - 2*q[2]*q[2]);
    var attitude = Math.asin(2*q[0]*q[1] + 2*q[2]*q[3]);
    var bank = Math.atan2(2*q[0]*q[3] - 2*q[1]*q[2], 1 - 2*q[0]*q[0] - 2*q[2]*q[2]);
	if(!out)
		out = vec3.create();
	vec3.set(out, heading, attitude, bank);
	return out;
}

quat.fromEuler = function(out, vec) {
	var heading = vec[0];
	var attitude = vec[1];
	var bank = vec[2];

	var C1 = Math.cos(heading); //yaw
	var C2 = Math.cos(attitude); //pitch
	var C3 = Math.cos(bank); //roll
	var S1 = Math.sin(heading);
	var S2 = Math.sin(attitude);
	var S3 = Math.sin(bank);

	var w = Math.sqrt(1.0 + C1 * C2 + C1*C3 - S1 * S2 * S3 + C2*C3) * 0.5;
	if(w == 0.0)
	{
		w = 0.000001;
		//quat.set(out, 0,0,0,1 );
		//return out;
	}

	var x = (C2 * S3 + C1 * S3 + S1 * S2 * C3) / (4.0 * w);
	var y = (S1 * C2 + S1 * C3 + C1 * S2 * S3) / (4.0 * w);
	var z = (-S1 * S3 + C1 * S2 * C3 + S2) /(4.0 * w);
	quat.set(out, x,y,z,w );
	quat.normalize(out,out);
	return out;
};


//not tested
quat.fromMat4 = function(out,m)
{
	var trace = m[0] + m[5] + m[10];
	if ( trace > 0.0 )
	{
		var s = Math.sqrt( trace + 1.0 );
		out[3] = s * 0.5;//w
		var recip = 0.5 / s;
		out[0] = ( m[9] - m[6] ) * recip; //2,1  1,2
		out[1] = ( m[2] - m[8] ) * recip; //0,2  2,0
		out[2] = ( m[4] - m[1] ) * recip; //1,0  0,1
	}
	else
	{
		var i = 0;
		if( m[5] > m[0] )
		 i = 1;
		if( m[10] > m[i*4+i] )
		 i = 2;
		var j = ( i + 1 ) % 3;
		var k = ( j + 1 ) % 3;
		var s = Math.sqrt( m[i*4+i] - m[j*4+j] - m[k*4+k] + 1.0 );
		out[i] = 0.5 * s;
		var recip = 0.5 / s;
		out[3] = ( m[k*4+j] - m[j*4+k] ) * recip;//w
		out[j] = ( m[j*4+i] + m[i*4+j] ) * recip;
		out[k] = ( m[k*4+i] + m[i*4+k] ) * recip;
	}
	quat.normalize(out,out);
}

quat.fromMat4.lookAt = (function(){ 
	var axis = vec3.create();
	
	return function( out, forwardVector, up )
	{
		var dot = vec3.dot( vec3.FRONT, forwardVector );

		if ( Math.abs( dot - (-1.0)) < 0.000001 )
		{
			out.set( vec3.UP );
			out[3] = Math.PI;
			return out;
		}
		if ( Math.abs(dot - 1.0) < 0.000001 )
		{
			return quat.identity( out );
		}

		var rotAngle = Math.acos( dot );
		vec3.cross( axis, vec3.FRONT, forwardVector );
		vec3.normalize( axis, axis );
		quat.setAxisAngle( out, axis, rotAngle );
		return out;
	}
})();




/**
* @namespace GL
*/

/**
* Indexer used to reuse vertices among a mesh
* @class Indexer
* @constructor
*/
GL.Indexer = function Indexer() {
  this.unique = [];
  this.indices = [];
  this.map = {};
}
GL.Indexer.prototype = {
	add: function(obj) {
    var key = JSON.stringify(obj);
    if (!(key in this.map)) {
      this.map[key] = this.unique.length;
      this.unique.push(obj);
    }
    return this.map[key];
  }
};

/**
* A data buffer to be stored in the GPU
* @class Buffer
* @constructor
* @param {Number} target gl.ARRAY_BUFFER, ELEMENT_ARRAY_BUFFER
* @param {ArrayBufferView} data the data in typed-array format
* @param {number} spacing number of numbers per component (3 per vertex, 2 per uvs...), default 3
* @param {enum} stream_type default gl.STATIC_DRAW (other: gl.DYNAMIC_DRAW, gl.STREAM_DRAW 
*/
GL.Buffer = function Buffer( target, data, spacing, stream_type, gl ) {
	if(GL.debug)
		console.log("GL.Buffer created");

	if(gl !== null)
		gl = gl || global.gl;

	this.buffer = null; //webgl buffer
	this.target = target; //GL.ARRAY_BUFFER, GL.ELEMENT_ARRAY_BUFFER
	this.gl = gl;
	this.attribute = null; //name of the attribute in the shader ("a_vertex","a_normal","a_coord",...)

	//optional
	this.data = data;
	this.spacing = spacing || 3;

	if(this.data && this.gl)
		this.upload(stream_type);
}

/**
* Applies an action to every vertex in this buffer
* @method forEach
* @param {function} callback to be called for every vertex (or whatever is contained in the buffer)
*/
GL.Buffer.prototype.forEach = function(callback)
{
	var d = this.data;
	for (var i = 0, s = this.spacing, l = d.length; i < l; i += s)
	{
		callback(d.subarray(i,i+s),i);
	}
	return this; //to concatenate
}

/**
* Applies a mat4 transform to every triplets in the buffer (assuming they are points)
* No upload is performed (to ensure efficiency in case there are several operations performed)
* @method applyTransform
* @param {mat4} mat
*/
GL.Buffer.prototype.applyTransform = function(mat)
{
	var d = this.data;
	for (var i = 0, s = this.spacing, l = d.length; i < l; i += s)
	{
		var v = d.subarray(i,i+s);
		vec3.transformMat4(v,v,mat);
	}
	return this; //to concatenate
}

/**
* Uploads the buffer data (stored in this.data) to the GPU
* @method upload
* @param {number} stream_type default gl.STATIC_DRAW (other: gl.DYNAMIC_DRAW, gl.STREAM_DRAW 
*/
GL.Buffer.prototype.upload = function( stream_type ) { //default gl.STATIC_DRAW (other: gl.DYNAMIC_DRAW, gl.STREAM_DRAW )
	var spacing = this.spacing || 3; //default spacing	
	var gl = this.gl;
	if(!gl)
		return;

	if(!this.data)
		throw("No data supplied");

	var data = this.data;
	if(!data.buffer)
		throw("Buffers must be typed arrays");

	//I store some stuff inside the WebGL buffer instance, it is supported
	this.buffer = this.buffer || gl.createBuffer();
	if(!this.buffer)
		return; //if the context is lost...

	this.buffer.length = data.length;
	this.buffer.spacing = spacing;

	//store the data format
	switch( data.constructor )
	{
		case Int8Array: this.buffer.gl_type = gl.BYTE; break;
		case Uint8ClampedArray: 
		case Uint8Array: this.buffer.gl_type = gl.UNSIGNED_BYTE; break;
		case Int16Array: this.buffer.gl_type = gl.SHORT; break;
		case Uint16Array: this.buffer.gl_type = gl.UNSIGNED_SHORT; break;
		case Int32Array: this.buffer.gl_type = gl.INT; break;
		case Uint32Array: this.buffer.gl_type = gl.UNSIGNED_INT; break;
		case Float32Array: this.buffer.gl_type = gl.FLOAT; break;
		default: throw("unsupported buffer type");
	}

	gl.bindBuffer(this.target, this.buffer);
	gl.bufferData(this.target, data , stream_type || this.stream_type || gl.STATIC_DRAW);
};
//legacy
GL.Buffer.prototype.compile = GL.Buffer.prototype.upload;


/**
* Assign data to buffer and uploads it (it allows range)
* @method setData
* @param {ArrayBufferView} data in Float32Array format usually
* @param {number} offset offset in bytes
*/
GL.Buffer.prototype.setData = function( data, offset )
{
	if(!data.buffer)
		throw("Data must be typed array");
	offset = offset || 0;

	if(!this.data)
	{
		this.data = data;
		this.upload();
		return;
	}
	else if( this.data.length < data.length )
		throw("buffer is not big enough, you cannot set data to a smaller buffer");

	if(this.data != data)
	{
		if(this.data.length == data.length)
		{
			this.data.set( data );
			this.upload();
			return;
		}

		//upload just part of it
		var new_data_view = new Uint8Array( data.buffer, data.buffer.byteOffset, data.buffer.byteLength );
		var data_view = new Uint8Array( this.data.buffer );
		data_view.set( new_data_view, offset );
		this.uploadRange( offset, new_data_view.length );
	}

};


/**
* Uploads part of the buffer data (stored in this.data) to the GPU
* @method uploadRange
* @param {number} start offset in bytes
* @param {number} size sizes in bytes
*/
GL.Buffer.prototype.uploadRange = function(start, size)
{
	if(!this.data)
		throw("No data stored in this buffer");

	var data = this.data;
	if(!data.buffer)
		throw("Buffers must be typed arrays");

	var view = new Uint8Array( this.data.buffer, start, size );

	var gl = this.gl;
	gl.bindBuffer(this.target, this.buffer);
	gl.bufferSubData(this.target, start, view );
};

/**
* Clones one buffer (it allows to share the same data between both buffers)
* @method clone
* @param {boolean} share if you want that both buffers share the same data (default false)
* return {GL.Buffer} buffer cloned
*/
GL.Buffer.prototype.clone = function(share)
{
	var buffer = new GL.Buffer();
	if(share)
	{
		for(var i in this)
			buffer[i] = this[i];
	}
	else
	{
		if(this.target)
			buffer.target = this.target;
		if(this.gl)
			buffer.gl = this.gl;
		if(this.spacing)
			buffer.spacing = this.spacing;
		if(this.data) //clone data
		{
			buffer.data = new global[ this.data.constructor ]( this.data );
			buffer.upload();
		}
	}
	return buffer;
}


GL.Buffer.prototype.toJSON = function()
{
	if(!this.data)
	{
		console.error("cannot serialize a mesh without data");
		return null;
	}

	return {
		data_type: getClassName(this.data),
		data: this.data.toJSON(),
		target: this.target,
		attribute: this.attribute,
		spacing: this.spacing
	};
}

GL.Buffer.prototype.fromJSON = function(o)
{
	var data_type = global[ o.data_type ] || Float32Array;
	this.data = new data_type( o.data ); //cloned
	this.target = o.target;
	this.spacing = o.spacing || 3;
	this.attribute = o.attribute;
	this.upload( GL.STATIC_DRAW );
}

/**
* Deletes the content from the GPU and destroys the handler
* @method delete
*/
GL.Buffer.prototype.delete = function()
{
	var gl = this.gl;
	gl.deleteBuffer( this.buffer );
	this.buffer = null;
}

/**
* Base class for meshes, it wraps several buffers and some global info like the bounding box
* @class Mesh
* @param {Object} vertexBuffers object with all the vertex streams
* @param {Object} indexBuffers object with all the indices streams
* @param {Object} options
* @param {WebGLContext} gl [Optional] gl context where to create the mesh
* @constructor
*/
global.Mesh = GL.Mesh = function Mesh( vertexbuffers, indexbuffers, options, gl )
{
	if(GL.debug)
		console.log("GL.Mesh created");

	if( gl !== null )
	{
		gl = gl || global.gl;
		this.gl = gl;
	}

	//used to avoid problems with resources moving between different webgl context
	this._context_id = gl.context_id; 

	this.vertexBuffers = {};
	this.indexBuffers = {};

	this.info = null; //here you can store extra info, like groups, which is an array of { name, start, length, material }
	this.bounding = null; //here you can store a AABB in BBox format

	if(vertexbuffers || indexbuffers)
		this.addBuffers( vertexbuffers, indexbuffers, options ? options.stream_type : null );

	if(options)
		for(var i in options)
			this[i] = options[i];
};

Mesh.common_buffers = {
	"vertices": { spacing:3, attribute: "a_vertex"},
	"vertices2D": { spacing:2, attribute: "a_vertex2D"},
	"normals": { spacing:3, attribute: "a_normal"},
	"coords": { spacing:2, attribute: "a_coord"},
	"coords1": { spacing:2, attribute: "a_coord1"},
	"coords2": { spacing:2, attribute: "a_coord2"},
	"colors": { spacing:4, attribute: "a_color"}, 
	"tangents": { spacing:3, attribute: "a_tangent"},
	"bone_indices": { spacing:4, attribute: "a_bone_indices", type: Uint8Array },
	"weights": { spacing:4, attribute: "a_weights"},
	"extra": { spacing:1, attribute: "a_extra"},
	"extra2": { spacing:2, attribute: "a_extra2"},
	"extra3": { spacing:3, attribute: "a_extra3"},
	"extra4": { spacing:4, attribute: "a_extra4"}
};

Mesh.default_datatype = Float32Array;


/**
* Adds buffer to mesh
* @method addBuffer
* @param {string} name
* @param {Buffer} buffer 
*/

Mesh.prototype.addBuffer = function(name, buffer)
{
	if(buffer.target == gl.ARRAY_BUFFER)
		this.vertexBuffers[name] = buffer;
	else
		this.indexBuffers[name] = buffer;

	if(!buffer.attribute)
		buffer.attribute = GL.Mesh.common_buffers[name].attribute;
}


/**
* Adds vertex and indices buffers to a mesh
* @method addBuffers
* @param {Object} vertexBuffers object with all the vertex streams
* @param {Object} indexBuffers object with all the indices streams
* @param {enum} stream_type default gl.STATIC_DRAW (other: gl.DYNAMIC_DRAW, gl.STREAM_DRAW )
*/
Mesh.prototype.addBuffers = function( vertexbuffers, indexbuffers, stream_type )
{
	var num_vertices = 0;

	if(this.vertexBuffers["vertices"])
		num_vertices = this.vertexBuffers["vertices"].data.length / 3;

	for(var i in vertexbuffers)
	{
		var data = vertexbuffers[i];
		if(!data) 
			continue;
		
		if( data.constructor == GL.Buffer )
		{
			data = data.data;
		}
		else if( typeof(data[0]) != "number") //linearize: (transform Arrays in typed arrays)
		{
			var newdata = [];
			for (var j = 0, chunk = 10000; j < data.length; j += chunk) {
			  newdata = Array.prototype.concat.apply(newdata, data.slice(j, j + chunk));
			}
			data = newdata;
		}

		var stream_info = GL.Mesh.common_buffers[i];

		//cast to typed float32 if no type is specified
		if(data.constructor === Array)
		{
			var datatype = GL.Mesh.default_datatype;
			if(stream_info && stream_info.type)
				datatype = stream_info.type;
			data = new datatype( data );
		}

		//compute spacing
		if(i == "vertices")
			num_vertices = data.length / 3;
		var spacing = data.length / num_vertices;
		if(stream_info && stream_info.spacing)
			spacing = stream_info.spacing;

		//add and upload
		var attribute = "a_" + i;
		if(stream_info && stream_info.attribute)
			attribute = stream_info.attribute;
		this.createVertexBuffer( i, attribute, spacing, data, stream_type );
	}

	if(indexbuffers)
		for(var i in indexbuffers)
		{
			var data = indexbuffers[i];
			if(!data) continue;

			if( data.constructor == GL.Buffer )
			{
				data = data.data;
			}
			if( typeof(data[0]) != "number") //linearize
			{
				newdata = [];
				for (var i = 0, chunk = 10000; i < data.length; i += chunk) {
				  newdata = Array.prototype.concat.apply(newdata, data.slice(i, i + chunk));
				}
				data = newdata;
			}

			//cast to typed
			if(data.constructor === Array)
			{
				var datatype = Uint16Array;
				if(num_vertices > 256*256)
					datatype = Uint32Array;
				data = new datatype( data );
			}

			this.createIndexBuffer( i, data );
		}
}

/**
* Creates a new empty buffer and attachs it to this mesh
* @method createVertexBuffer
* @param {String} name "vertices","normals"...
* @param {String} attribute name of the stream in the shader "a_vertex","a_normal",... [optional, if omitted is used the common_buffers]
* @param {number} spacing components per vertex [optional, if ommited is used the common_buffers, if not found then uses 3 ]
* @param {ArrayBufferView} buffer_data the data in typed array format [optional, if ommited it created an empty array of getNumVertices() * spacing]
* @param {enum} stream_type [optional, default = gl.STATIC_DRAW (other: gl.DYNAMIC_DRAW, gl.STREAM_DRAW ) ]
*/

Mesh.prototype.createVertexBuffer = function(name, attribute, buffer_spacing, buffer_data, stream_type ) {

	var common = GL.Mesh.common_buffers[name]; //generic info about a buffer with the same name

	if (!attribute && common)
		attribute = common.attribute;

	if (!attribute)
		throw("Buffer added to mesh without attribute name");

	if (!buffer_spacing && common)
	{
		if(common && common.spacing)
			buffer_spacing = common.spacing;
		else
			buffer_spacing = 3;
	}

	if(!buffer_data)
	{
		var num = this.getNumVertices();
		if(!num)
			throw("Cannot create an empty buffer in a mesh without vertices (vertices are needed to know the size)");
		buffer_data = new (GL.Mesh.default_datatype)(num * buffer_spacing);
	}

	if(!buffer_data.buffer)
		throw("Buffer data MUST be typed array");

	//used to ensure the buffers are held in the same gl context as the mesh
	var buffer = this.vertexBuffers[name] = new GL.Buffer( gl.ARRAY_BUFFER, buffer_data, buffer_spacing, stream_type, this.gl );
	buffer.name = name;
	buffer.attribute = attribute;

	return buffer;
}

/**
* Removes a vertex buffer from the mesh
* @method removeVertexBuffer
* @param {String} name "vertices","normals"...
* @param {Boolean} free if you want to remove the data from the GPU
*/
Mesh.prototype.removeVertexBuffer = function(name, free) {
	var buffer = this.vertexBuffers[name];
	if(!buffer)
		return;
	if(free)
		buffer.delete();
	delete this.vertexBuffers[name];
}

/**
* Returns a vertex buffer
* @method getVertexBuffer
* @param {String} name of vertex buffer
* @return {Buffer} the buffer
*/
Mesh.prototype.getVertexBuffer = function(name)
{
	return this.vertexBuffers[name];
}


/**
* Creates a new empty index buffer and attachs it to this mesh
* @method createIndexBuffer
* @param {String} name 
* @param {Typed array} data 
* @param {enum} stream_type gl.STATIC_DRAW, gl.DYNAMIC_DRAW, gl.STREAM_DRAW
*/
Mesh.prototype.createIndexBuffer = function(name, buffer_data, stream_type) {
	//(target, data, spacing, stream_type, gl)

	//cast to typed
	if(buffer_data.constructor === Array)
	{
		var datatype = Uint16Array;
		var vertices = this.vertexBuffers["vertices"];
		if(vertices)
		{
			var num_vertices = vertices.data.length / 3;
			if(num_vertices > 256*256)
				datatype = Uint32Array;
			buffer_data = new datatype( buffer_data );
		}
	}

	var buffer = this.indexBuffers[name] = new GL.Buffer(gl.ELEMENT_ARRAY_BUFFER, buffer_data, 0, stream_type, this.gl );
	return buffer;
}

/**
* Returns a vertex buffer
* @method getBuffer
* @param {String} name of vertex buffer
* @return {Buffer} the buffer
*/
Mesh.prototype.getBuffer = function(name)
{
	return this.vertexBuffers[name];
}

/**
* Returns a index buffer
* @method getIndexBuffer
* @param {String} name of index buffer
* @return {Buffer} the buffer
*/
Mesh.prototype.getIndexBuffer = function(name)
{
	return this.indexBuffers[name];
}

/**
* Removes an index buffer from the mesh
* @method removeIndexBuffer
* @param {String} name "vertices","normals"...
* @param {Boolean} free if you want to remove the data from the GPU
*/
Mesh.prototype.removeIndexBuffer = function(name, free) {
	var buffer = this.indexBuffers[name];
	if(!buffer)
		return;
	if(free)
		buffer.delete();
	delete this.indexBuffers[name];
}


/**
* Uploads data inside buffers to VRAM.
* @method upload
* @param {number} buffer_type gl.STATIC_DRAW, gl.DYNAMIC_DRAW, gl.STREAM_DRAW
*/
Mesh.prototype.upload = function(buffer_type) {
	for (var attribute in this.vertexBuffers) {
		var buffer = this.vertexBuffers[attribute];
		//buffer.data = this[buffer.name];
		buffer.upload(buffer_type);
	}

	for (var name in this.indexBuffers) {
		var buffer = this.indexBuffers[name];
		//buffer.data = this[name];
		buffer.upload();
	}
}

//LEGACY, plz remove
Mesh.prototype.compile = Mesh.prototype.upload;


Mesh.prototype.deleteBuffers = function()
{
	for(var i in this.vertexBuffers)
	{
		var buffer = this.vertexBuffers[i];
		buffer.delete();
	}
	this.vertexBuffers = {};

	for(var i in this.indexBuffers)
	{
		var buffer = this.indexBuffers[i];
		buffer.delete();
	}
	this.indexBuffers = {};
}

Mesh.prototype.delete = Mesh.prototype.deleteBuffers;

Mesh.prototype.bindBuffers = function( shader )
{
	// enable attributes as necessary.
	for (var name in this.vertexBuffers)
	{
		var buffer = this.vertexBuffers[ name ];
		var attribute = buffer.attribute || name;
		var location = shader.attributes[ attribute ];
		if (location == null || !buffer.buffer) 
			continue; 
		gl.bindBuffer(gl.ARRAY_BUFFER, buffer.buffer);
		gl.enableVertexAttribArray(location);
		gl.vertexAttribPointer(location, buffer.buffer.spacing, buffer.buffer.gl_type, false, 0, 0);
	}
}

Mesh.prototype.unbindBuffers = function( shader )
{
	// disable attributes
	for (var name in this.vertexBuffers)
	{
		var buffer = this.vertexBuffers[ name ];
		var attribute = buffer.attribute || name;
		var location = shader.attributes[ attribute ];
		if (location == null || !buffer.buffer)
			continue; //ignore this buffer
		gl.disableVertexAttribArray( shader.attributes[attribute] );
	}
}

/**
* Creates a clone of the mesh, the datarrays are cloned too
* @method clone
*/
Mesh.prototype.clone = function( gl )
{
	var gl = gl || global.gl;
	var vbs = {};
	var ibs = {};

	for(var i in this.vertexBuffers)
	{
		var b = this.vertexBuffers[i];
		vbs[i] = new b.data.constructor( b.data ); //clone
	}
	for(var i in this.indexBuffers)
	{
		var b = this.indexBuffers[i];
		ibs[i] = new b.data.constructor( b.data ); //clone
	}

	return new GL.Mesh( vbs, ibs, undefined, gl );
}

/**
* Creates a clone of the mesh, but the data-arrays are shared between both meshes (useful for sharing a mesh between contexts)
* @method clone
*/
Mesh.prototype.cloneShared = function( gl )
{
	var gl = gl || global.gl;
	return new GL.Mesh( this.vertexBuffers, this.indexBuffers, undefined, gl );
}


/**
* Creates an object with the info of the mesh (useful to transfer to workers)
* @method toObject
*/
Mesh.prototype.toObject = function()
{
	var vbs = {};
	var ibs = {};

	for(var i in this.vertexBuffers)
	{
		var b = this.vertexBuffers[i];
		vbs[i] = { 
			spacing: b.spacing,
			data: new b.data.constructor( b.data ) //clone
		}; 
	}
	for(var i in this.indexBuffers)
	{
		var b = this.indexBuffers[i];
		ibs[i] = { 
			data: new b.data.constructor( b.data ) //clone
		}
	}

	return { 
		vertexBuffers: vbs, 
		indexBuffers: ibs,
		info: this.info ? cloneObject( this.info ) : null,
		bounding: this.bounding ? this.bounding.toJSON() : null
	};
}


Mesh.prototype.toJSON = function()
{
	var r = {
		vertexBuffers: {},
		indexBuffers: {},
		info: this.info ? cloneObject( this.info ) : null,
		bounding: this.bounding ? this.bounding.toJSON() : null
	};

	for(var i in this.vertexBuffers)
		r.vertexBuffers[i] = this.vertexBuffers[i].toJSON();

	for(var i in this.indexBuffers)
		r.indexBuffers[i] = this.indexBuffers[i].toJSON();

	return r;
}

Mesh.prototype.fromJSON = function(o)
{
	this.vertexBuffers = {};
	this.indexBuffers = {};

	for(var i in o.vertexBuffers)
	{
		if(!o.vertexBuffers[i])
			continue;
		var buffer = new GL.Buffer();
		buffer.fromJSON( o.vertexBuffers[i] );
		if(!buffer.attribute && GL.Mesh.common_buffers[i])
			buffer.attribute = GL.Mesh.common_buffers[i].attribute;
		this.vertexBuffers[i] = buffer;
	}

	for(var i in o.indexBuffers)
	{
		if(!o.indexBuffers[i])
			continue;
		var buffer = new GL.Buffer();
		buffer.fromJSON( o.indexBuffers[i] );
		this.indexBuffers[i] = buffer;
	}

	if(o.info)
		this.info = cloneObject( o.info );
	if(o.bounding)
		this.bounding = new Float32Array(o.bounding);
}


/**
* Computes some data about the mesh
* @method generateMetadata
*/
Mesh.prototype.generateMetadata = function()
{
	var metadata = {};

	var vertices = this.vertexBuffers["vertices"].data;
	var triangles = this.indexBuffers["triangles"].data;

	metadata.vertices = vertices.length / 3;
	if(triangles)
		metadata.faces = triangles.length / 3;
	else
		metadata.faces = vertices.length / 9;

	metadata.indexed = !!this.metadata.faces;
	this.metadata = metadata;
}

//never tested
/*
Mesh.prototype.draw = function(shader, mode, range_start, range_length)
{
	if(range_length == 0) return;

	// Create and enable attribute pointers as necessary.
	var length = 0;
	for (var attribute in this.vertexBuffers) {
	  var buffer = this.vertexBuffers[attribute];
	  var location = shader.attributes[attribute] ||
		gl.getAttribLocation(shader.program, attribute);
	  if (location == -1 || !buffer.buffer) continue;
	  shader.attributes[attribute] = location;
	  gl.bindBuffer(gl.ARRAY_BUFFER, buffer.buffer);
	  gl.enableVertexAttribArray(location);
	  gl.vertexAttribPointer(location, buffer.buffer.spacing, gl.FLOAT, false, 0, 0);
	  length = buffer.buffer.length / buffer.buffer.spacing;
	}

	//range rendering
	var offset = 0;
	if(arguments.length > 3) //render a polygon range
		offset = range_start * (this.indexBuffer ? this.indexBuffer.constructor.BYTES_PER_ELEMENT : 1); //in bytes (Uint16 == 2 bytes)

	if(arguments.length > 4)
		length = range_length;
	else if (this.indexBuffer)
		length = this.indexBuffer.buffer.length - offset;

	// Disable unused attribute pointers.
	for (var attribute in shader.attributes) {
	  if (!(attribute in this.vertexBuffers)) {
		gl.disableVertexAttribArray(shader.attributes[attribute]);
	  }
	}

	// Draw the geometry.
	if (length && (!this.indexBuffer || indexBuffer.buffer)) {
	  if (this.indexBuffer) {
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer.buffer);
		gl.drawElements(mode, length, gl.UNSIGNED_SHORT, offset);
	  } else {
		gl.drawArrays(mode, offset, length);
	  }
	}

	return this;
}
*/

/**
* Creates a new index stream with wireframe 
* @method computeWireframe
*/
Mesh.prototype.computeWireframe = function() {
	var index_buffer = this.indexBuffers["triangles"];

	var vertices = this.vertexBuffers["vertices"].data;
	var num_vertices = (vertices.length/3);

	if(!index_buffer) //unindexed
	{
		var num_triangles = num_vertices / 3;
		var buffer = num_vertices > 256*256 ? new Uint32Array( num_triangles * 6 ) : new Uint16Array( num_triangles * 6 );
		for(var i = 0; i < num_vertices; i += 3)
		{
			buffer[i*2] = i;
			buffer[i*2+1] = i+1;
			buffer[i*2+2] = i+1;
			buffer[i*2+3] = i+2;
			buffer[i*2+4] = i+2;
			buffer[i*2+5] = i;
		}

	}
	else //indexed
	{
		var data = index_buffer.data;

		var indexer = new GL.Indexer();
		for (var i = 0; i < data.length; i+=3) {
		  var t = data.subarray(i,i+3);
		  for (var j = 0; j < t.length; j++) {
			var a = t[j], b = t[(j + 1) % t.length];
			indexer.add([Math.min(a, b), Math.max(a, b)]);
		  }
		}

		//linearize
		var unique = indexer.unique;
		var buffer = num_vertices > 256*256 ? new Uint32Array( unique.length * 2 ) : new Uint16Array( unique.length * 2 );
		for(var i = 0, l = unique.length; i < l; ++i)
			buffer.set(unique[i],i*2);
	}

	//create stream
	this.createIndexBuffer('wireframe', buffer);
	return this;
}


/**
* Multiplies every normal by -1 and uploads it
* @method flipNormals
* @param {enum} stream_type default gl.STATIC_DRAW (other: gl.DYNAMIC_DRAW, gl.STREAM_DRAW)
*/
Mesh.prototype.flipNormals = function( stream_type  ) {
	var normals_buffer = this.vertexBuffers["normals"];
	if(!normals_buffer)
		return;
	var data = normals_buffer.data;
	var l = data.length;
	for(var i = 0; i < l; ++i)
		data[i] *= -1;
	normals_buffer.upload( stream_type );

	//reverse indices too
	if( !this.indexBuffers["triangles"] )
		this.computeIndices(); //create indices

	var triangles_buffer = this.indexBuffers["triangles"];
	var data = triangles_buffer.data;
	var l = data.length;
	for(var i = 0; i < l; i += 3)
	{
		var tmp = data[i];
		data[i] = data[i+1];
		data[i+1] = tmp;
		//the [i+2] stays the same
	}
	triangles_buffer.upload( stream_type );
}


/**
* Compute indices for a mesh where vertices are shared
* @method computeIndices
*/
Mesh.prototype.computeIndices = function() {

	//cluster by distance
	var new_vertices = [];
	var new_normals = [];
	var new_coords = [];

	var indices = [];

	var old_vertices_buffer = this.vertexBuffers["vertices"];
	var old_normals_buffer = this.vertexBuffers["normals"];
	var old_coords_buffer = this.vertexBuffers["coords"];

	var old_vertices_data = old_vertices_buffer.data;

	var old_normals_data = null;
	if( old_normals_buffer )
		old_normals_data = old_normals_buffer.data;

	var old_coords_data = null;
	if( old_coords_buffer )
		old_coords_data = old_coords_buffer.data;


	var indexer = {};

	var l = old_vertices_data.length / 3;
	for(var i = 0; i < l; ++i)
	{
		var v = old_vertices_data.subarray( i*3,(i+1)*3 );
		var key = (v[0] * 1000)|0;

		//search in new_vertices
		var j = 0;
		var candidates = indexer[key];
		if(candidates)
		{
			var l2 = candidates.length;
			for(; j < l2; j++)
			{
				var v2 = new_vertices[ candidates[j] ];
				//same vertex
				if( vec3.sqrDist( v, v2 ) < 0.01 )
				{
					indices.push(j);
					break;
				}
			}
		}

		/*
		var l2 = new_vertices.length;
		for(var j = 0; j < l2; j++)
		{
			//same vertex
			if( vec3.sqrDist( v, new_vertices[j] ) < 0.001 )
			{
				indices.push(j);
				break;
			}
		}
		*/

		if(candidates && j != l2)
			continue;

		var index = j;
		new_vertices.push(v);
		if( indexer[ key ] )
			indexer[ key ].push( index );
		else
			indexer[ key ] = [ index ];

		if(old_normals_data)
			new_normals.push( old_normals_data.subarray(i*3, (i+1)*3) );
		if(old_coords_data)
			new_coords.push( old_coords_data.subarray(i*2, (i+1)*2) );
		indices.push(index);
	}

	this.vertexBuffers = {}; //erase all

	//new buffers
	this.createVertexBuffer( 'vertices', GL.Mesh.common_buffers["vertices"].attribute, 3, linearizeArray( new_vertices ) );	
	if(old_normals_data)
		this.createVertexBuffer( 'normals', GL.Mesh.common_buffers["normals"].attribute, 3, linearizeArray( new_normals ) );	
	if(old_coords_data)
		this.createVertexBuffer( 'coords', GL.Mesh.common_buffers["coords"].attribute, 2, linearizeArray( new_coords ) );	

	this.createIndexBuffer( "triangles", indices );
}

/**
* Breaks the indices
* @method explodeIndices
*/
Mesh.prototype.explodeIndices = function( buffer_name ) {

	buffer_name = buffer_name || "triangles";

	var indices_buffer = this.getIndexBuffer( buffer_name );
	if(!indices_buffer)
		return;

	var indices = indices_buffer.data;

	//cluster by distance
	var new_vertices = new Float32Array(indices.length * 3);
	var new_normals = null;
	var new_coords = null;

	var old_vertices_buffer = this.vertexBuffers["vertices"];
	var old_vertices = old_vertices_buffer.data;

	var old_normals_buffer = this.vertexBuffers["normals"];
	var old_normals = null;
	if(old_normals_buffer)
	{
		old_normals = old_normals_buffer.data;
		new_normals = new Float32Array(indices.length * 3);
	}

	var old_coords_buffer = this.vertexBuffers["coords"];
	var old_coords = null;
	if( old_coords_buffer )
	{
		old_coords = old_coords_buffer.data;
		new_coords = new Float32Array(indices.length * 2);
	}

	for(var i = 0, l = indices.length; i < l; ++i)
	{
		var index = indices[i];
		new_vertices.set( old_vertices.subarray( index*3, index*3 + 3 ), i*3 );
		if(old_normals)
			new_normals.set( old_normals.subarray( index*3, index*3 + 3 ), i*3 );
		if(old_coords)
			new_coords.set( old_coords.subarray( index*2, index*2 + 2 ), i*2 );
	}

	//erase all
	this.vertexBuffers = {}; 

	//new buffers
	this.createVertexBuffer( 'vertices', GL.Mesh.common_buffers["vertices"].attribute, 3, new_vertices );	
	if(new_normals)
		this.createVertexBuffer( 'normals', GL.Mesh.common_buffers["normals"].attribute, 3, new_normals );	
	if(new_coords)
		this.createVertexBuffer( 'coords', GL.Mesh.common_buffers["coords"].attribute, 2, new_coords );	

	delete this.indexBuffers[ buffer_name ];
}



/**
* Creates a stream with the normals
* @method computeNormals
* @param {enum} stream_type default gl.STATIC_DRAW (other: gl.DYNAMIC_DRAW, gl.STREAM_DRAW)
*/
Mesh.prototype.computeNormals = function( stream_type  ) {
	var vertices_buffer = this.vertexBuffers["vertices"];
	if(!vertices_buffer)
		return console.error("Cannot compute normals of a mesh without vertices");

	var vertices = this.vertexBuffers["vertices"].data;
	var num_vertices = vertices.length / 3;

	//create because it is faster than filling it with zeros
	var normals = new Float32Array( vertices.length );

	var triangles = null;
	if(this.indexBuffers["triangles"])
		triangles = this.indexBuffers["triangles"].data;

	var temp = GL.temp_vec3;
	var temp2 = GL.temp2_vec3;

	var i1,i2,i3,v1,v2,v3,n1,n2,n3;

	//compute the plane normal
	var l = triangles ? triangles.length : vertices.length;
	for (var a = 0; a < l; a+=3)
	{
		if(triangles)
		{
			i1 = triangles[a];
			i2 = triangles[a+1];
			i3 = triangles[a+2];

			v1 = vertices.subarray(i1*3,i1*3+3);
			v2 = vertices.subarray(i2*3,i2*3+3);
			v3 = vertices.subarray(i3*3,i3*3+3);

			n1 = normals.subarray(i1*3,i1*3+3);
			n2 = normals.subarray(i2*3,i2*3+3);
			n3 = normals.subarray(i3*3,i3*3+3);
		}
		else
		{
			v1 = vertices.subarray(a*3,a*3+3);
			v2 = vertices.subarray(a*3+3,a*3+6);
			v3 = vertices.subarray(a*3+6,a*3+9);

			n1 = normals.subarray(a*3,a*3+3);
			n2 = normals.subarray(a*3+3,a*3+6);
			n3 = normals.subarray(a*3+6,a*3+9);
		}

		vec3.sub( temp, v2, v1 );
		vec3.sub( temp2, v3, v1 );
		vec3.cross( temp, temp, temp2 );
		vec3.normalize(temp,temp);

		//save
		vec3.add( n1, n1, temp );
		vec3.add( n2, n2, temp );
		vec3.add( n3, n3, temp );
	}

	//normalize if vertices are shared
	if(triangles)
	for (var a = 0, l = normals.length; a < l; a+=3)
	{
		var n = normals.subarray(a,a+3);
		vec3.normalize(n,n);
	}

	var normals_buffer = this.vertexBuffers["normals"];

	if(normals_buffer)
	{
		normals_buffer.data = normals;
		normals_buffer.upload( stream_type );
	}
	else
		return this.createVertexBuffer('normals', GL.Mesh.common_buffers["normals"].attribute, 3, normals );
	return normals_buffer;
}


/**
* Creates a new stream with the tangents
* @method computeTangents
*/
Mesh.prototype.computeTangents = function()
{
	var vertices_buffer = this.vertexBuffers["vertices"];
	if(!vertices_buffer)
		return console.error("Cannot compute tangents of a mesh without vertices");

	var normals_buffer = this.vertexBuffers["normals"];
	if(!normals_buffer)
		return console.error("Cannot compute tangents of a mesh without normals");

	var uvs_buffer = this.vertexBuffers["coords"];
	if(!uvs_buffer)
		return console.error("Cannot compute tangents of a mesh without uvs");

	var triangles_buffer = this.indexBuffers["triangles"];
	if(!triangles_buffer)
		return console.error("Cannot compute tangents of a mesh without indices");

	var vertices = vertices_buffer.data;
	var normals = normals_buffer.data;
	var uvs = uvs_buffer.data;
	var triangles = triangles_buffer.data;

	if(!vertices || !normals || !uvs) return;

	var num_vertices = vertices.length / 3;

	var tangents = new Float32Array(num_vertices * 4);
	
	//temporary (shared)
	var tan1 = new Float32Array(num_vertices*3*2);
	var tan2 = tan1.subarray(num_vertices*3);

	var a,l;
	var sdir = vec3.create();
	var tdir = vec3.create();
	var temp = vec3.create();
	var temp2 = vec3.create();

	for (a = 0, l = triangles.length; a < l; a+=3)
	{
		var i1 = triangles[a];
		var i2 = triangles[a+1];
		var i3 = triangles[a+2];

		var v1 = vertices.subarray(i1*3,i1*3+3);
		var v2 = vertices.subarray(i2*3,i2*3+3);
		var v3 = vertices.subarray(i3*3,i3*3+3);

		var w1 = uvs.subarray(i1*2,i1*2+2);
		var w2 = uvs.subarray(i2*2,i2*2+2);
		var w3 = uvs.subarray(i3*2,i3*2+2);

		var x1 = v2[0] - v1[0];
		var x2 = v3[0] - v1[0];
		var y1 = v2[1] - v1[1];
		var y2 = v3[1] - v1[1];
		var z1 = v2[2] - v1[2];
		var z2 = v3[2] - v1[2];

		var s1 = w2[0] - w1[0];
		var s2 = w3[0] - w1[0];
		var t1 = w2[1] - w1[1];
		var t2 = w3[1] - w1[1];

		var r;
		var den = (s1 * t2 - s2 * t1);
		if ( Math.abs(den) < 0.000000001 )
		  r = 0.0;
		else
		  r = 1.0 / den;

		vec3.copy(sdir, [(t2 * x1 - t1 * x2) * r, (t2 * y1 - t1 * y2) * r, (t2 * z1 - t1 * z2) * r] );
		vec3.copy(tdir, [(s1 * x2 - s2 * x1) * r, (s1 * y2 - s2 * y1) * r, (s1 * z2 - s2 * z1) * r] );

		vec3.add( tan1.subarray( i1*3, i1*3+3), tan1.subarray( i1*3, i1*3+3), sdir);
		vec3.add( tan1.subarray( i2*3, i2*3+3), tan1.subarray( i2*3, i2*3+3), sdir);
		vec3.add( tan1.subarray( i3*3, i3*3+3), tan1.subarray( i3*3, i3*3+3), sdir);

		vec3.add( tan2.subarray( i1*3, i1*3+3), tan2.subarray( i1*3, i1*3+3), tdir);
		vec3.add( tan2.subarray( i2*3, i2*3+3), tan2.subarray( i2*3, i2*3+3), tdir);
		vec3.add( tan2.subarray( i3*3, i3*3+3), tan2.subarray( i3*3, i3*3+3), tdir);
	}

	for (a = 0, l = vertices.length; a < l; a+=3)
	{
		var n = normals.subarray(a,a+3);
		var t = tan1.subarray(a,a+3);

		// Gram-Schmidt orthogonalize
		vec3.subtract(temp, t, vec3.scale(temp, n, vec3.dot(n, t) ) );
		vec3.normalize(temp,temp);

		// Calculate handedness
		var w = ( vec3.dot( vec3.cross(temp2, n, t), tan2.subarray(a,a+3) ) < 0.0) ? -1.0 : 1.0;
		tangents.set([temp[0], temp[1], temp[2], w],(a/3)*4);
	}

	this.createVertexBuffer('tangents', Mesh.common_buffers["tangents"].attribute, 4, tangents );
}

/**
* Creates texture coordinates using a triplanar aproximation
* @method computeTextureCoordinates
*/
Mesh.prototype.computeTextureCoordinates = function( stream_type )
{
	var vertices_buffer = this.vertexBuffers["vertices"];
	if(!vertices_buffer)
		return console.error("Cannot compute uvs of a mesh without vertices");

	this.explodeIndices( "triangles" );

	var vertices = vertices_buffer.data;
	var num_vertices = vertices.length / 3;

	var uvs_buffer = this.vertexBuffers["coords"];
	var uvs = new Float32Array( num_vertices * 2 );

	var triangles_buffer = this.indexBuffers["triangles"];
	var triangles = null;
	if( triangles_buffer )
		triangles = triangles_buffer.data;

	var plane_normal = vec3.create();
	var side1 = vec3.create();
	var side2 = vec3.create();

	var bbox = this.getBoundingBox();
	var bboxcenter = BBox.getCenter( bbox );
	var bboxhs = vec3.create();
	bboxhs.set( BBox.getHalfsize( bbox ) ); //careful, this is a reference
	vec3.scale( bboxhs, bboxhs, 2 );

	var num = triangles ? triangles.length : vertices.length/3;

	for (var a = 0; a < num; a+=3)
	{
		if(triangles)
		{
			var i1 = triangles[a];
			var i2 = triangles[a+1];
			var i3 = triangles[a+2];

			var v1 = vertices.subarray(i1*3,i1*3+3);
			var v2 = vertices.subarray(i2*3,i2*3+3);
			var v3 = vertices.subarray(i3*3,i3*3+3);

			var uv1 = uvs.subarray(i1*2,i1*2+2);
			var uv2 = uvs.subarray(i2*2,i2*2+2);
			var uv3 = uvs.subarray(i3*2,i3*2+2);
		}
		else
		{
			var v1 = vertices.subarray((a)*3,(a)*3+3);
			var v2 = vertices.subarray((a+1)*3,(a+1)*3+3);
			var v3 = vertices.subarray((a+2)*3,(a+2)*3+3);

			var uv1 = uvs.subarray((a)*2,(a)*2+2);
			var uv2 = uvs.subarray((a+1)*2,(a+1)*2+2);
			var uv3 = uvs.subarray((a+2)*2,(a+2)*2+2);
		}

		vec3.sub(side1, v1, v2 );
		vec3.sub(side2, v1, v3 );
		vec3.cross( plane_normal, side1, side2 );
		//vec3.normalize( plane_normal, plane_normal ); //not necessary

		plane_normal[0] = Math.abs( plane_normal[0] );
		plane_normal[1] = Math.abs( plane_normal[1] );
		plane_normal[2] = Math.abs( plane_normal[2] );

		if( plane_normal[0] > plane_normal[1] && plane_normal[0] > plane_normal[2])
		{
			//X
			uv1[0] = (v1[2] - bboxcenter[2]) / bboxhs[2];
			uv1[1] = (v1[1] - bboxcenter[1]) / bboxhs[1];
			uv2[0] = (v2[2] - bboxcenter[2]) / bboxhs[2];
			uv2[1] = (v2[1] - bboxcenter[1]) / bboxhs[1];
			uv3[0] = (v3[2] - bboxcenter[2]) / bboxhs[2];
			uv3[1] = (v3[1] - bboxcenter[1]) / bboxhs[1];
		}
		else if ( plane_normal[1] > plane_normal[2])
		{
			//Y
			uv1[0] = (v1[0] - bboxcenter[0]) / bboxhs[0];
			uv1[1] = (v1[2] - bboxcenter[2]) / bboxhs[2];
			uv2[0] = (v2[0] - bboxcenter[0]) / bboxhs[0];
			uv2[1] = (v2[2] - bboxcenter[2]) / bboxhs[2];
			uv3[0] = (v3[0] - bboxcenter[0]) / bboxhs[0];
			uv3[1] = (v3[2] - bboxcenter[2]) / bboxhs[2];
		}
		else
		{
			//Z
			uv1[0] = (v1[0] - bboxcenter[0]) / bboxhs[0];
			uv1[1] = (v1[1] - bboxcenter[1]) / bboxhs[1];
			uv2[0] = (v2[0] - bboxcenter[0]) / bboxhs[0];
			uv2[1] = (v2[1] - bboxcenter[1]) / bboxhs[1];
			uv3[0] = (v3[0] - bboxcenter[0]) / bboxhs[0];
			uv3[1] = (v3[1] - bboxcenter[1]) / bboxhs[1];
		}
	}

	if(uvs_buffer)
	{
		uvs_buffer.data = uvs;
		uvs_buffer.upload( stream_type );
	}
	else
		this.createVertexBuffer('coords', Mesh.common_buffers["coords"].attribute, 2, uvs );
}


/**
* Computes bounding information
* @method getVertexNumber
* @param {typed Array} vertices array containing all the vertices
*/
Mesh.prototype.getNumVertices = function() {
	var b = this.vertexBuffers["vertices"];
	if(!b) return 0;
	return b.data.length / b.spacing;
}


/**
* Computes bounding information
* @method Mesh.computeBounding
* @param {typed Array} vertices array containing all the vertices
*/
Mesh.computeBounding = function( vertices, bb ) {

	if(!vertices)
		return;

	var min = vec3.clone( vertices.subarray(0,3) );
	var max = vec3.clone( vertices.subarray(0,3) );
	var v;
	for(var i = 3; i < vertices.length; i+=3)
	{
		v = vertices.subarray(i,i+3);
		vec3.min( min,v, min);
		vec3.max( max,v, max);
	}

	if( isNaN(min[0]) || isNaN(min[1]) || isNaN(min[2]) ||
		isNaN(max[0]) || isNaN(max[1]) || isNaN(max[2]) )
	{
		min[0] = min[1] = min[2] = 0;
		max[0] = max[1] = max[2] = 0;
		console.warn("Warning: GL.Mesh has NaN values in vertices");
	}

	var center = vec3.add( vec3.create(), min,max );
	vec3.scale( center, center, 0.5);
	var half_size = vec3.subtract( vec3.create(), max, center );

	return BBox.setCenterHalfsize( bb || BBox.create(), center, half_size );
}

/**
* returns the bounding box, if it is not computed, then computes it
* @method getBoundingBox
* @return {BBox} bounding box
*/
Mesh.prototype.getBoundingBox = function()
{
	if(!this.bounding)
		this.updateBounding();
	return this.bounding;
}

/**
* Update bounding information of this mesh
* @method updateBounding
*/
Mesh.prototype.updateBounding = function() {
	var vertices = this.vertexBuffers["vertices"];
	if(!vertices)
		return;
	this.bounding = GL.Mesh.computeBounding( vertices.data, this.bounding );
}


/**
* forces a bounding box to be set
* @method setBounding
* @param {vec3} center center of the bounding box
* @param {vec3} half_size vector from the center to positive corner
*/
Mesh.prototype.setBounding = function(center, half_size) {
	this.bounding = BBox.setCenterHalfsize( this.bounding || BBox.create(), center, half_size );	
}


/**
* Remove all local memory from the streams (leaving it only in the VRAM) to save RAM
* @method freeData
*/
Mesh.prototype.freeData = function()
{
	for (var attribute in this.vertexBuffers)
	{
		this.vertexBuffers[attribute].data = null;
		delete this[ this.vertexBuffers[attribute].name ]; //delete from the mesh itself
	}
	for (var name in this.indexBuffers)
	{
		this.indexBuffers[name].data = null;
		delete this[ this.indexBuffers[name].name ]; //delete from the mesh itself
	}
}

Mesh.prototype.configure = function( o, options )
{
	var v = {};
	var i = {};
	options = options || {};

	for(var j in o)
	{
		if(!o[j])
			continue;

		if(j == "vertexBuffers")
		{
			for(i in o[j])
				v[i] = o[j][i];
			continue;
		}
		
		if(j == "indexBuffers")
		{
			for(i in o[j])
				i[i] = o[j][i];
			continue;
		}

		if(j == "indices" || j == "lines" ||  j == "wireframe" || j == "triangles")
			i[j] = o[j];
		else if(GL.Mesh.common_buffers[j])
			v[j] = o[j];
		else
			options[j] = o[j];
	}

	this.addBuffers( v, i, options.stream_type );

	for(var i in options)
		this[i] = options[i];		

	if(!this.bounding)
		this.updateBounding();
}

/**
* Returns the amount of memory used by this mesh in bytes (sum of all buffers)
* @method getMemory
* @return {number} bytes
*/
Mesh.prototype.totalMemory = function()
{
	var num = 0|0;

	for (var name in this.vertexBuffers)
		num += this.vertexBuffers[name].data.buffer.byteLength;
	for (var name in this.indexBuffers)
		num += this.indexBuffers[name].data.buffer.byteLength;

	return num;
}

/**
* returns a low poly version of the mesh that takes much less memory (but breaks tiling of uvs and smoothing groups)
* @method simplify
* @return {Mesh} simplified mesh
*/
Mesh.prototype.simplify = function()
{
	//compute bounding box
	var bb = this.getBoundingBox();
	var min = BBox.getMin( bb );
	var halfsize = BBox.getHalfsize( bb );
	var range = vec3.scale( vec3.create(), halfsize, 2 );

	var newmesh = new GL.Mesh();
	var temp = vec3.create();

	for(var i in this.vertexBuffers)
	{
		//take every vertex and normalize it to the bounding box
		var buffer = this.vertexBuffers[i];
		var data = buffer.data;

		var new_data = new Float32Array( data.length );

		if(i == "vertices")
		{
			for(var j = 0, l = data.length; j < l; j+=3 )
			{
				var v = data.subarray(j,j+3);
				vec3.sub( temp, v, min );
				vec3.div( temp, temp, range );
				temp[0] = Math.round(temp[0] * 256) / 256;
				temp[1] = Math.round(temp[1] * 256) / 256;
				temp[2] = Math.round(temp[2] * 256) / 256;
				vec3.mul( temp, temp, range );
				vec3.add( temp, temp, min );
				new_data.set( temp, j );
			}
		}
		else
		{
		}

		newmesh.addBuffer();
	}

	//search for repeated vertices
		//compute the average normal and coord
	//reindex the triangles
	//return simplified mesh	
}

/**
* Static method for the class Mesh to create a mesh from a list of common streams
* @method Mesh.load
* @param {Object} buffers object will all the buffers
* @param {Object} options [optional]
* @param {Mesh} output_mesh [optional] mesh to store the mesh, otherwise is created
* @param {WebGLContext} gl [optional] if omitted, the global.gl is used
*/
Mesh.load = function( buffers, options, output_mesh, gl ) {
	options = options || {};
	if(options.no_gl)
		gl = null;
	var mesh = output_mesh || new GL.Mesh(null,null,null,gl);
	mesh.configure( buffers, options );
	return mesh;
}

/**
* Returns a mesh with all the meshes merged (you can apply transforms individually to every buffer)
* @method Mesh.mergeMeshes
* @param {Array} meshes array containing object like { mesh:, matrix:, texture_matrix: }
* @param {Object} options { only_data: to get the mesh data without uploading it }
* @return {GL.Mesh|Object} the mesh in GL.Mesh format or Object format (if options.only_data is true)
*/
Mesh.mergeMeshes = function( meshes, options )
{
	options = options || {};

	var vertex_buffers = {};
	var index_buffers = {};
	var offsets = {}; //tells how many positions indices must be offseted
	var vertex_offsets = [];
	var current_vertex_offset = 0;
	var groups = [];

	//vertex buffers
	//compute size
	for(var i = 0; i < meshes.length; ++i)
	{
		var mesh_info = meshes[i];
		var mesh = mesh_info.mesh;
		var offset = current_vertex_offset;
		vertex_offsets.push( offset );
		var length = mesh.vertexBuffers["vertices"].data.length / 3;
		current_vertex_offset += length;

		for(var j in mesh.vertexBuffers)
		{
			if(!vertex_buffers[j])
				vertex_buffers[j] = mesh.vertexBuffers[j].data.length;
			else
				vertex_buffers[j] += mesh.vertexBuffers[j].data.length;
		}

		for(var j in mesh.indexBuffers)
		{
			if(!index_buffers[j])
				index_buffers[j] = mesh.indexBuffers[j].data.length;
			else
				index_buffers[j] += mesh.indexBuffers[j].data.length;
		}

		//groups
		var group = {
			name: "mesh_" + i,
			start: offset,
			length: length,
			material: ""
		};

		groups.push( group );
	}

	//allocate
	for(var j in vertex_buffers)
	{
		var datatype = options[j];
		if(datatype === null)
		{
			delete vertex_buffers[j];
			continue;
		}

		if(!datatype)
			datatype = Float32Array;

		vertex_buffers[j] = new datatype( vertex_buffers[j] );
		offsets[j] = 0;
	}

	for(var j in index_buffers)
	{
		index_buffers[j] = new Uint32Array( index_buffers[j] );
		offsets[j] = 0;
	}

	//store
	for(var i = 0; i < meshes.length; ++i)
	{
		var mesh_info = meshes[i];
		var mesh = mesh_info.mesh;
		var offset = 0;
		var length = 0;

		for(var j in mesh.vertexBuffers)
		{
			if(!vertex_buffers[j])
				continue;

			if(j == "vertices")
				length = mesh.vertexBuffers[j].data.length / 3;

			vertex_buffers[j].set( mesh.vertexBuffers[j].data, offsets[j] );

			//apply transform
			if(mesh_info[ j + "_matrix"] )
			{
				var matrix = mesh_info[ j + "_matrix" ];
				if(matrix.length == 16)
					apply_transform( vertex_buffers[j], offsets[j], mesh.vertexBuffers[j].data.length, matrix )
				else if(matrix.length == 9)
					apply_transform2D( vertex_buffers[j], offsets[j], mesh.vertexBuffers[j].data.length, matrix )
			}

			offsets[j] += mesh.vertexBuffers[j].data.length;
		}

		for(var j in mesh.indexBuffers)
		{
			index_buffers[j].set( mesh.indexBuffers[j].data, offsets[j] );
			apply_offset( index_buffers[j], offsets[j], mesh.indexBuffers[j].data.length, vertex_offsets[i] );
			offsets[j] += mesh.indexBuffers[j].data.length;
		}
	}

	//useful functions
	function apply_transform( array, start, length, matrix )
	{
		var l = start + length;
		for(var i = start; i < l; i+=3)
		{
			var v = array.subarray(i,i+3);
			vec3.transformMat4( v, v, matrix );
		}
	}

	function apply_transform2D( array, start, length, matrix )
	{
		var l = start + length;
		for(var i = start; i < l; i+=2)
		{
			var v = array.subarray(i,i+2);
			vec2.transformMat3( v, v, matrix );
		}
	}

	function apply_offset( array, start, length, offset )
	{
		var l = start + length;
		for(var i = start; i < l; ++i)
			array[i] += offset;
	}

	var extra = { info: { groups: groups } };

	//return
	if( typeof(gl) != "undefined" || options.only_data )
		return new GL.Mesh( vertex_buffers,index_buffers, extra );
	return { 
		vertexBuffers: vertex_buffers, 
		indexBuffers: index_buffers, 
		info: { groups: groups } 
	};
}



//Here we store all basic mesh parsers (OBJ, STL) and encoders
Mesh.parsers = {};
Mesh.encoders = {};

/**
* Returns am empty mesh and loads a mesh and parses it using the Mesh.parsers, by default only OBJ is supported
* @method Mesh.fromOBJ
* @param {Array} meshes array containing all the meshes
*/
Mesh.fromURL = function(url, on_complete, gl, options)
{
	options = options || {};
	gl = gl || global.gl;
	var mesh = new GL.Mesh(undefined,undefined,undefined,gl);
	mesh.ready = false;

	HttpRequest( url, null, function(data) {
		var pos = url.lastIndexOf(".");
		var ext = url.substr(pos+1);
		mesh.parse( data, ext );
		delete mesh["ready"];
		if(on_complete)
			on_complete.call(mesh,mesh, url);
	}, function(err){
		if(on_complete)
			on_complete(null);
	},options);
	return mesh;
}

/**
* given some data an information about the format, it search for a parser in Mesh.parsers and tries to extract the mesh information
* Only obj supported now
* @method parse
* @param {*} data could be string or ArrayBuffer
* @param {String} format parser file format name (p.e. "obj")
* @return {?} depending on the parser
*/
Mesh.prototype.parse = function( data, format )
{
	format = format.toLowerCase();
	var parser = GL.Mesh.parsers[ format ];
	if(parser)
		return parser.call(null, data, {mesh: this});
	throw("GL.Mesh.parse: no parser found for format " + format );
}

/**
* It returns the mesh data encoded in the format specified
* Only obj supported now
* @method encode
* @param {String} format to encode the data to (p.e. "obj")
* @return {?} String with the info
*/
Mesh.prototype.encode = function( format, options )
{
	format = format.toLowerCase();
	var encoder = GL.Mesh.encoders[ format ];
	if(encoder)
		return encoder.call(null, this, options );
	throw("GL.Mesh.encode: no encoder found for format " + format );
}

/**
* Returns a shared mesh containing a quad to be used when rendering to the screen
* Reusing the same quad helps not filling the memory
* @method getScreenQuad
* @return {GL.Mesh} the screen quad
*/
Mesh.getScreenQuad = function(gl)
{
	gl = gl || global.gl;
	var mesh = gl.meshes[":screen_quad"];
	if(mesh)
		return mesh;

	var vertices = new Float32Array([0,0,0, 1,1,0, 0,1,0,  0,0,0, 1,0,0, 1,1,0 ]);
	var coords = new Float32Array([0,0, 1,1, 0,1,  0,0, 1,0, 1,1 ]);
	mesh = new GL.Mesh({ vertices: vertices, coords: coords}, undefined, undefined, gl);
	return gl.meshes[":screen_quad"] = mesh;
}

function linearizeArray( array, typed_array_class )
{
	if(array.constructor === typed_array_class)
		return array;
	if(array.constructor !== Array)
	{
		typed_array_class = typed_array_class || Float32Array;
		return new typed_array_class(array);
	}

	typed_array_class = typed_array_class || Float32Array;
	var components = array[0].length;
	var size = array.length * components;
	var buffer = new typed_array_class(size);

	for (var i=0; i < array.length;++i)
		for(var j=0; j < components; ++j)
			buffer[i*components + j] = array[i][j];
	return buffer;
}

/**
* @class Mesh
*/

/**
* Returns a planar mesh (you can choose how many subdivisions)
* @method Mesh.plane
* @param {Object} options valid options: detail, detailX, detailY, size, width, heigth, xz (horizontal plane)
*/
Mesh.plane = function(options, gl) {
	options = options || {};
	options.triangles = [];
	var mesh = {};
	var detailX = options.detailX || options.detail || 1;
	var detailY = options.detailY || options.detail || 1;
	var width = options.width || options.size || 1;
	var height = options.height || options.size || 1;
	var xz = options.xz;
	width *= 0.5;
	height *= 0.5;

	var triangles = [];
	var vertices = [];
	var coords = [];
	var normals = [];

	var N = vec3.fromValues(0,0,1);
	if(xz) 
		N.set([0,1,0]);

	for (var y = 0; y <= detailY; y++) {
		var t = y / detailY;
		for (var x = 0; x <= detailX; x++) {
		  var s = x / detailX;
		  if(xz)
			  vertices.push((2 * s - 1) * width, 0, -(2 * t - 1) * height);
		  else
			  vertices.push((2 * s - 1) * width, (2 * t - 1) * height, 0);
		  coords.push(s, t);
		  normals.push(N[0],N[1],N[2]);
		  if (x < detailX && y < detailY) {
			var i = x + y * (detailX + 1);
			if(xz) //horizontal
			{
				triangles.push(i + 1, i + detailX + 1, i);
				triangles.push(i + 1, i + detailX + 2, i + detailX + 1);
			}
			else //vertical
			{
				triangles.push(i, i + 1, i + detailX + 1);
				triangles.push(i + detailX + 1, i + 1, i + detailX + 2);
			}
		  }
		}
	}

	var bounding = BBox.fromCenterHalfsize( [0,0,0], xz ? [width,0,height] : [width,height,0] );
	var mesh_info = {vertices:vertices, normals: normals, coords: coords, triangles: triangles };
	return GL.Mesh.load( mesh_info, { bounding: bounding }, gl);
};

/**
* Returns a 2D Mesh (be careful, stream is vertices2D, used for 2D engines )
* @method Mesh.plane2D
*/
Mesh.plane2D = function(options, gl) {
	var vertices = new Float32Array([-1,1, 1,-1, 1,1, -1,1, -1,-1, 1,-1]);
	var coords = new Float32Array([0,1, 1,0, 1,1, 0,1, 0,0, 1,0]);

	if(options && options.size)
	{
		var s = options.size * 0.5;
		for(var i = 0; i < vertices.length; ++i)
			vertices[i] *= s;
	}
	return new GL.Mesh( {vertices2D: vertices, coords: coords },null,gl );
};

/**
* Returns a point mesh 
* @method Mesh.point
* @param {Object} options no options
*/
Mesh.point = function(options) {
	return new GL.Mesh( {vertices: [0,0,0]} );
}

/**
* Returns a cube mesh 
* @method Mesh.cube
* @param {Object} options valid options: size 
*/
Mesh.cube = function(options, gl) {
	options = options || {};
	var halfsize = (options.size || 1) * 0.5;

	var buffers = {};
	//[[-1,1,-1],[-1,-1,+1],[-1,1,1],[-1,1,-1],[-1,-1,-1],[-1,-1,+1],[1,1,-1],[1,1,1],[1,-1,+1],[1,1,-1],[1,-1,+1],[1,-1,-1],[-1,1,1],[1,-1,1],[1,1,1],[-1,1,1],[-1,-1,1],[1,-1,1],[-1,1,-1],[1,1,-1],[1,-1,-1],[-1,1,-1],[1,-1,-1],[-1,-1,-1],[-1,1,-1],[1,1,1],[1,1,-1],[-1,1,-1],[-1,1,1],[1,1,1],[-1,-1,-1],[1,-1,-1],[1,-1,1],[-1,-1,-1],[1,-1,1],[-1,-1,1]]
	buffers.vertices = new Float32Array([-1,1,-1,-1,-1,+1, -1,1,1,-1,1,-1, -1,-1,-1,-1,-1,+1, 1,1,-1,1,1,1,1,-1,+1,1,1,-1,1,-1,+1,1,-1,-1,-1,1,1,1,-1,1,1,1,1,-1,1,1,-1,-1,1,1,-1,1,-1,1,-1,1,1,-1,1,-1,-1,-1,1,-1,1,-1,-1,-1,-1,-1,-1,1,-1,1,1,1,1,1,-1,-1,1,-1,-1,1,1,1,1,1,-1,-1,-1,1,-1,-1,1,-1,1,-1,-1,-1,1,-1,1,-1,-1,1]);
	for(var i = 0, l = buffers.vertices.length; i < l; ++i)
		buffers.vertices[i] *= halfsize;

	//[[-1,0,0],[-1,0,0],[-1,0,0],[-1,0,0],[-1,0,0],[-1,0,0],[1,0,0],[1,0,0],[1,0,0],[1,0,0],[1,0,0],[1,0,0],[0,0,1],[0,0,1],[0,0,1],[0,0,1],[0,0,1],[0,0,1],[0,0,-1],[0,0,-1],[0,0,-1],[0,0,-1],[0,0,-1],[0,0,-1],[0,1,0],[0,1,0],[0,1,0],[0,1,0],[0,1,0],[0,1,0],[0,-1,0],[0,-1,0],[0,-1,0],[0,-1,0],[0,-1,0],[0,-1,0]]
	//[[0,1],[1,0],[1,1],[0,1],[0,0],[1,0],[1,1],[0,1],[0,0],[1,1],[0,0],[1,0],[0,1],[1,0],[1,1],[0,1],[0,0],[1,0],[1,1],[0,1],[0,0],[1,1],[0,0],[1,0],[0,1],[1,0],[1,1],[0,1],[0,0],[1,0],[1,1],[0,1],[0,0],[1,1],[0,0],[1,0]];
	buffers.normals = new Float32Array([-1,0,0,-1,0,0,-1,0,0,-1,0,0,-1,0,0,-1,0,0,1,0,0,1,0,0,1,0,0,1,0,0,1,0,0,1,0,0,0,0,1,0,0,1,0,0,1,0,0,1,0,0,1,0,0,1,0,0,-1,0,0,-1,0,0,-1,0,0,-1,0,0,-1,0,0,-1,0,1,0,0,1,0,0,1,0,0,1,0,0,1,0,0,1,0,0,-1,0,0,-1,0,0,-1,0,0,-1,0,0,-1,0,0,-1,0]);
	buffers.coords = new Float32Array([0,1,1,0,1,1,0,1,0,0,1,0,1,1,0,1,0,0,1,1,0,0,1,0,0,1,1,0,1,1,0,1,0,0,1,0,1,1,0,1,0,0,1,1,0,0,1,0,0,1,1,0,1,1,0,1,0,0,1,0,1,1,0,1,0,0,1,1,0,0,1,0]);

	if(options.wireframe)
		buffers.wireframe = new Uint16Array([0,2, 2,5, 5,4, 4,0,   6,7, 7,10, 10,11, 11,6, 0,6, 2,7, 5,10, 4,11  ]);
	options.bounding = BBox.fromCenterHalfsize( [0,0,0], [halfsize,halfsize,halfsize] );
	return GL.Mesh.load(buffers, options, gl);
}


/**
* Returns a cube mesh of a given size
* @method Mesh.cube
* @param {Object} options valid options: size, sizex, sizey, sizez
*/
Mesh.box = function(options, gl) {
	options = options || {};
	var sizex = options.sizex || 1;
	var sizey = options.sizey || 1;
	var sizez = options.sizez || 1;
	sizex *= 0.5;
	sizey *= 0.5;
	sizez *= 0.5;

	var buffers = {};
	//[[-1,1,-1],[-1,-1,+1],[-1,1,1],[-1,1,-1],[-1,-1,-1],[-1,-1,+1],[1,1,-1],[1,1,1],[1,-1,+1],[1,1,-1],[1,-1,+1],[1,-1,-1],[-1,1,1],[1,-1,1],[1,1,1],[-1,1,1],[-1,-1,1],[1,-1,1],[-1,1,-1],[1,1,-1],[1,-1,-1],[-1,1,-1],[1,-1,-1],[-1,-1,-1],[-1,1,-1],[1,1,1],[1,1,-1],[-1,1,-1],[-1,1,1],[1,1,1],[-1,-1,-1],[1,-1,-1],[1,-1,1],[-1,-1,-1],[1,-1,1],[-1,-1,1]]
	buffers.vertices = new Float32Array([-1,1,-1,-1,-1,+1,-1,1,1,-1,1,-1,-1,-1,-1,-1,-1,+1,1,1,-1,1,1,1,1,-1,+1,1,1,-1,1,-1,+1,1,-1,-1,-1,1,1,1,-1,1,1,1,1,-1,1,1,-1,-1,1,1,-1,1,-1,1,-1,1,1,-1,1,-1,-1,-1,1,-1,1,-1,-1,-1,-1,-1,-1,1,-1,1,1,1,1,1,-1,-1,1,-1,-1,1,1,1,1,1,-1,-1,-1,1,-1,-1,1,-1,1,-1,-1,-1,1,-1,1,-1,-1,1]);
	//for(var i in options.vertices) for(var j in options.vertices[i]) options.vertices[i][j] *= size;
	for(var i = 0, l = buffers.vertices.length; i < l; i+=3) 
	{
		buffers.vertices[i] *= sizex;
		buffers.vertices[i+1] *= sizey;
		buffers.vertices[i+2] *= sizez;
	}

	//[[-1,0,0],[-1,0,0],[-1,0,0],[-1,0,0],[-1,0,0],[-1,0,0],[1,0,0],[1,0,0],[1,0,0],[1,0,0],[1,0,0],[1,0,0],[0,0,1],[0,0,1],[0,0,1],[0,0,1],[0,0,1],[0,0,1],[0,0,-1],[0,0,-1],[0,0,-1],[0,0,-1],[0,0,-1],[0,0,-1],[0,1,0],[0,1,0],[0,1,0],[0,1,0],[0,1,0],[0,1,0],[0,-1,0],[0,-1,0],[0,-1,0],[0,-1,0],[0,-1,0],[0,-1,0]]
	//[[0,1],[1,0],[1,1],[0,1],[0,0],[1,0],[1,1],[0,1],[0,0],[1,1],[0,0],[1,0],[0,1],[1,0],[1,1],[0,1],[0,0],[1,0],[1,1],[0,1],[0,0],[1,1],[0,0],[1,0],[0,1],[1,0],[1,1],[0,1],[0,0],[1,0],[1,1],[0,1],[0,0],[1,1],[0,0],[1,0]];
	buffers.normals = new Float32Array([-1,0,0,-1,0,0,-1,0,0,-1,0,0,-1,0,0,-1,0,0,1,0,0,1,0,0,1,0,0,1,0,0,1,0,0,1,0,0,0,0,1,0,0,1,0,0,1,0,0,1,0,0,1,0,0,1,0,0,-1,0,0,-1,0,0,-1,0,0,-1,0,0,-1,0,0,-1,0,1,0,0,1,0,0,1,0,0,1,0,0,1,0,0,1,0,0,-1,0,0,-1,0,0,-1,0,0,-1,0,0,-1,0,0,-1,0]);
	buffers.coords = new Float32Array([0,1,1,0,1,1,0,1,0,0,1,0,1,1,0,1,0,0,1,1,0,0,1,0,0,1,1,0,1,1,0,1,0,0,1,0,1,1,0,1,0,0,1,1,0,0,1,0,0,1,1,0,1,1,0,1,0,0,1,0,1,1,0,1,0,0,1,1,0,0,1,0]);

	if(options.wireframe)
		buffers.wireframe = new Uint16Array([0,2, 2,5, 5,4, 4,0,   6,7, 7,10, 10,11, 11,6, 0,6, 2,7, 5,10, 4,11  ]);

	options.bounding = BBox.fromCenterHalfsize( [0,0,0], [sizex,sizey,sizez] );

	return GL.Mesh.load(buffers, options, gl);
}

/**
* Returns a circle mesh 
* @method Mesh.circle
* @param {Object} options valid options: size,radius, xz = in xz plane, otherwise xy plane
*/
Mesh.circle = function( options, gl ) {
	options = options || {};
	var size = options.size || options.radius || 1;
	var slices = Math.ceil(options.slices || 24);
	var xz = options.xz || false;
	var empty = options.empty || false;
	if(slices < 3) slices = 3;
	var delta = (2 * Math.PI) / slices;

	var center = vec3.create();
	var A = vec3.create();
	var N = vec3.fromValues(0,0,1);
	var uv_center = vec2.fromValues(0.5,0.5);
	var uv = vec2.create();

	if(xz) N.set([0,1,0]);

	var index = xz ? 2 : 1;

	var vertices = new Float32Array(3 * (slices + 1));
	var normals = new Float32Array(3 * (slices + 1));
	var coords = new Float32Array(2 * (slices + 1));
	var triangles = null;

	//the center is always the same
	vertices.set(center, 0);
	normals.set(N, 0);
	coords.set(uv_center, 0);

	var sin = 0;
	var cos = 0;

	//compute vertices
	for(var i = 0; i < slices; ++i )
	{
		sin = Math.sin( delta * i );
		cos = Math.cos( delta * i );

		A[0] = sin * size;
		A[index] = cos * size;
		uv[0] = sin * 0.5 + 0.5;
		uv[1] = cos * 0.5 + 0.5;
		vertices.set(A, i * 3 + 3);
		normals.set(N, i * 3 + 3);
		coords.set(uv, i * 2 + 2);
	}

	if(empty)
	{
		vertices = vertices.subarray(3);
		normals = vertices.subarray(3);
		coords = vertices.subarray(2);
		triangles = null;
	}
	else
	{
		var triangles = new Uint16Array(3 * slices);
		var offset = 2;
		var offset2 = 1;
		if(xz)
		{
			offset = 1;
			offset2 = 2;
		}

		//compute indices
		for(var i = 0; i < slices-1; ++i )
		{
			triangles[i*3] = 0;
			triangles[i*3+1] = i+offset;
			triangles[i*3+2] = i+offset2;
		}

		triangles[i*3] = 0;
		if(xz)
		{
			triangles[i*3+1] = i+1;
			triangles[i*3+2] = 1;
		}
		else
		{
			triangles[i*3+1] = 1;
			triangles[i*3+2] = i+1;
		}
	}

	options.bounding = BBox.fromCenterHalfsize( [0,0,0], xz ? [size,0,size] : [size,size,0] );

	var buffers = {vertices: vertices, normals: normals, coords: coords, triangles: triangles};

	if(options.wireframe)
	{
		var wireframe = new Uint16Array(slices*2);
		for(var i = 0; i < slices; i++)
		{
			wireframe[i*2] = i;
			wireframe[i*2+1] = i+1;
		}
		wireframe[0] = slices;
		buffers.wireframe = wireframe;
	}

	return GL.Mesh.load( buffers, options, gl );
}

/**
* Returns a cube mesh 
* @method Mesh.cylinder
* @param {Object} options valid options: radius, height, subdivisions 
*/
Mesh.cylinder = function( options, gl ) {
	options = options || {};
	var radius = options.radius || options.size || 1;
	var height = options.height || options.size || 2;
	var subdivisions = options.subdivisions || 64;

	var vertices = new Float32Array(subdivisions * 6 * 3 * 2 );
	var normals = new Float32Array(subdivisions * 6 * 3 * 2 );
	var coords = new Float32Array(subdivisions * 6 * 2 * 2 );
	//not indexed because caps have different normals and uvs so...

	var delta = 2*Math.PI / subdivisions;
	var normal = null;
	for(var i = 0; i < subdivisions; ++i)
	{
		var angle = i * delta;

		normal = [ Math.sin(angle), 0, Math.cos(angle)];
		vertices.set([ normal[0]*radius, height*0.5, normal[2]*radius], i*6*3);
		normals.set(normal, i*6*3 );
		coords.set([i/subdivisions,1], i*6*2 );

		normal = [ Math.sin(angle), 0, Math.cos(angle)];
		vertices.set([ normal[0]*radius, height*-0.5, normal[2]*radius], i*6*3 + 3);
		normals.set(normal, i*6*3 + 3);
		coords.set([i/subdivisions,0], i*6*2 + 2);

		normal = [ Math.sin(angle+delta), 0, Math.cos(angle+delta)];
		vertices.set([ normal[0]*radius, height*-0.5, normal[2]*radius], i*6*3 + 6);
		normals.set(normal, i*6*3 + 6);
		coords.set([(i+1)/subdivisions,0], i*6*2 + 4);

		normal = [ Math.sin(angle+delta), 0, Math.cos(angle+delta)];
		vertices.set([ normal[0]*radius, height*0.5, normal[2]*radius], i*6*3 + 9);
		normals.set(normal, i*6*3 + 9);
		coords.set([(i+1)/subdivisions,1], i*6*2 + 6);

		normal = [ Math.sin(angle), 0, Math.cos(angle)];
		vertices.set([ normal[0]*radius, height*0.5, normal[2]*radius], i*6*3 + 12);
		normals.set(normal, i*6*3 + 12);
		coords.set([i/subdivisions,1], i*6*2 + 8);

		normal = [ Math.sin(angle+delta), 0, Math.cos(angle+delta)];
		vertices.set([ normal[0]*radius, height*-0.5, normal[2]*radius], i*6*3 + 15);
		normals.set(normal, i*6*3 + 15);
		coords.set([(i+1)/subdivisions,0], i*6*2 + 10);
	}

	var pos = i*6*3;
	var pos_uv = i*6*2;

	//caps
	if( options.caps === false )
	{
		vertices = vertices.subarray(0,pos);
		normals = normals.subarray(0,pos);
		coords = coords.subarray(0,pos_uv);
	}
	else
	{
		var top_center = vec3.fromValues(0,height*0.5,0);
		var bottom_center = vec3.fromValues(0,height*-0.5,0);
		var up = vec3.fromValues(0,1,0);
		var down = vec3.fromValues(0,-1,0);
		for(var i = 0; i < subdivisions; ++i)
		{
			var angle = i * delta;

			var uv = vec3.fromValues( Math.sin(angle), 0, Math.cos(angle) );
			var uv2 = vec3.fromValues( Math.sin(angle+delta), 0, Math.cos(angle+delta) );

			vertices.set([ uv[0]*radius, height*0.5, uv[2]*radius], pos + i*6*3);
			normals.set(up, pos + i*6*3 );
			coords.set( [ -uv[0] * 0.5 + 0.5,uv[2] * 0.5 + 0.5], pos_uv + i*6*2 );

			vertices.set([ uv2[0]*radius, height*0.5, uv2[2]*radius], pos + i*6*3 + 3);
			normals.set(up, pos + i*6*3 + 3 );
			coords.set( [ -uv2[0] * 0.5 + 0.5,uv2[2] * 0.5 + 0.5], pos_uv + i*6*2 + 2 );

			vertices.set( top_center, pos + i*6*3 + 6 );
			normals.set(up, pos + i*6*3 + 6);
			coords.set([0.5,0.5], pos_uv + i*6*2 + 4);
			
			//bottom
			vertices.set([ uv2[0]*radius, height*-0.5, uv2[2]*radius], pos + i*6*3 + 9);
			normals.set(down, pos + i*6*3 + 9);
			coords.set( [ uv2[0] * 0.5 + 0.5,uv2[2] * 0.5 + 0.5], pos_uv + i*6*2 + 6);

			vertices.set([ uv[0]*radius, height*-0.5, uv[2]*radius], pos + i*6*3 + 12);
			normals.set(down, pos + i*6*3 + 12 );
			coords.set( [ uv[0] * 0.5 + 0.5,uv[2] * 0.5 + 0.5], pos_uv + i*6*2 + 8 );

			vertices.set( bottom_center, pos + i*6*3 + 15 );
			normals.set( down, pos + i*6*3 + 15);
			coords.set( [0.5,0.5], pos_uv + i*6*2 + 10);
		}
	}

	var buffers = {
		vertices: vertices,
		normals: normals,
		coords: coords
	}
	options.bounding = BBox.fromCenterHalfsize( [0,0,0], [radius,height*0.5,radius] );

	return Mesh.load( buffers, options, gl );
}

/**
* Returns a cone mesh 
* @method Mesh.cone
* @param {Object} options valid options: radius, height, subdivisions 
*/
Mesh.cone = function( options, gl ) {
	options = options || {};
	var radius = options.radius || options.size || 1;
	var height = options.height || options.size || 2;
	var subdivisions = options.subdivisions || 64;

	var vertices = new Float32Array(subdivisions * 3 * 3 * 2);
	var normals = new Float32Array(subdivisions * 3 * 3 * 2);
	var coords = new Float32Array(subdivisions * 2 * 3 * 2);
	//not indexed because caps have different normals and uvs so...

	var delta = 2*Math.PI / subdivisions;
	var normal = null;
	var normal_y = radius / height;
	var up = [0,1,0];

	for(var i = 0; i < subdivisions; ++i)
	{
		var angle = i * delta;

		normal = [ Math.sin(angle+delta*0.5), normal_y, Math.cos(angle+delta*0.5)];
		vec3.normalize(normal,normal);
		//normal = up;
		vertices.set([ 0, height, 0] , i*6*3);
		normals.set(normal, i*6*3 );
		coords.set([i/subdivisions,1], i*6*2 );

		normal = [ Math.sin(angle), normal_y, Math.cos(angle)];
		vertices.set([ normal[0]*radius, 0, normal[2]*radius], i*6*3 + 3);
		vec3.normalize(normal,normal);
		normals.set(normal, i*6*3 + 3);
		coords.set([i/subdivisions,0], i*6*2 + 2);

		normal = [ Math.sin(angle+delta), normal_y, Math.cos(angle+delta)];
		vertices.set([ normal[0]*radius, 0, normal[2]*radius], i*6*3 + 6);
		vec3.normalize(normal,normal);
		normals.set(normal, i*6*3 + 6);
		coords.set([(i+1)/subdivisions,0], i*6*2 + 4);
	}

	var pos = 0;//i*3*3;
	var pos_uv = 0;//i*3*2;

	//cap
	var bottom_center = vec3.fromValues(0,0,0);
	var down = vec3.fromValues(0,-1,0);
	for(var i = 0; i < subdivisions; ++i)
	{
		var angle = i * delta;

		var uv = vec3.fromValues( Math.sin(angle), 0, Math.cos(angle) );
		var uv2 = vec3.fromValues( Math.sin(angle+delta), 0, Math.cos(angle+delta) );

		//bottom
		vertices.set([ uv2[0]*radius, 0, uv2[2]*radius], pos + i*6*3 + 9);
		normals.set(down, pos + i*6*3 + 9);
		coords.set( [ uv2[0] * 0.5 + 0.5,uv2[2] * 0.5 + 0.5], pos_uv + i*6*2 + 6);

		vertices.set([ uv[0]*radius, 0, uv[2]*radius], pos + i*6*3 + 12);
		normals.set(down, pos + i*6*3 + 12 );
		coords.set( [ uv[0] * 0.5 + 0.5,uv[2] * 0.5 + 0.5], pos_uv + i*6*2 + 8 );

		vertices.set( bottom_center, pos + i*6*3 + 15 );
		normals.set( down, pos + i*6*3 + 15);
		coords.set( [0.5,0.5], pos_uv + i*6*2 + 10);
	}

	var buffers = {
		vertices: vertices,
		normals: normals,
		coords: coords
	}
	options.bounding = BBox.fromCenterHalfsize( [0,height*0.5,0], [radius,height*0.5,radius] );

	return Mesh.load( buffers, options, gl );
}

/**
* Returns a sphere mesh 
* @method Mesh.sphere
* @param {Object} options valid options: radius, lat, long, subdivisions, hemi
*/
Mesh.sphere = function( options, gl ) {
	options = options || {};
	var radius = options.radius || options.size || 1;
	var latitudeBands = options.lat || options.subdivisions || 16;
	var longitudeBands = options["long"] || options.subdivisions || 16;

	var vertexPositionData = new Float32Array( (latitudeBands+1)*(longitudeBands+1)*3 );
	var normalData = new Float32Array( (latitudeBands+1)*(longitudeBands+1)*3 );
	var textureCoordData = new Float32Array( (latitudeBands+1)*(longitudeBands+1)*2 );
	var indexData = new Uint16Array( latitudeBands*longitudeBands*6 );
	var latRange = options.hemi ? Math.PI * 0.5 : Math.PI;

	var i = 0, iuv = 0;
	for (var latNumber = 0; latNumber <= latitudeBands; latNumber++)
	{
		var theta = latNumber * latRange / latitudeBands;
		var sinTheta = Math.sin(theta);
		var cosTheta = Math.cos(theta);

		for (var longNumber = 0; longNumber <= longitudeBands; longNumber++)
		{
			var phi = longNumber * 2 * Math.PI / longitudeBands;
			var sinPhi = Math.sin(phi);
			var cosPhi = Math.cos(phi);

			var x = cosPhi * sinTheta;
			var y = cosTheta;
			var z = sinPhi * sinTheta;
			var u = 1- (longNumber / longitudeBands);
			var v = (1 - latNumber / latitudeBands);

			vertexPositionData.set([radius * x,radius * y,radius * z],i);
			normalData.set([x,y,z],i);
			textureCoordData.set([u,v], iuv );
			i += 3;
			iuv += 2;
		}
	}

	i=0;
	for (var latNumber = 0; latNumber < latitudeBands; latNumber++)
	{
		for (var longNumber = 0; longNumber < longitudeBands; longNumber++)
		{
			var first = (latNumber * (longitudeBands + 1)) + longNumber;
			var second = first + longitudeBands + 1;

			indexData.set([second,first,first + 1], i);
			indexData.set([second + 1,second,first + 1], i+3);
			i += 6;
		}
	}

	var buffers = {
		vertices: vertexPositionData,
		normals: normalData,
		coords: textureCoordData,
		triangles: indexData
	};

	if(options.wireframe)
	{
		var wireframe = new Uint16Array(longitudeBands*latitudeBands*4);
		var pos = 0;
		for(var i = 0; i < latitudeBands; i++)
		{
			for(var j = 0; j < longitudeBands; j++)
			{
				wireframe[pos] = i*(longitudeBands+1) + j;
				wireframe[pos + 1] = i*(longitudeBands+1) + j + 1;
				pos += 2;
			}
			wireframe[pos - longitudeBands*2] = i*(longitudeBands+1) + j;
		}

		for(var i = 0; i < longitudeBands; i++)
		for(var j = 0; j < latitudeBands; j++)
		{
			wireframe[pos] = j*(longitudeBands+1) + i;
			wireframe[pos + 1] = (j+1)*(longitudeBands+1) + i;
			pos += 2;
		}
		buffers.wireframe = wireframe;
	}

	if(options.hemi)
		options.bounding = BBox.fromCenterHalfsize( [0,radius*0.5,0], [radius,radius*0.5,radius], radius );
	else
		options.bounding = BBox.fromCenterHalfsize( [0,0,0], [radius,radius,radius], radius );
	return GL.Mesh.load( buffers, options, gl );
}

/**
* Returns a grid mesh (must be rendered using gl.LINES)
* @method Mesh.grid
* @param {Object} options valid options: size, lines
*/
Mesh.grid = function( options, gl )
{
	options = options || {};
	var num_lines = options.lines || 11;
	if(num_lines < 0) 
		num_lines = 1;
	var size = options.size || 10;

	var vertexPositionData = new Float32Array( num_lines*2*2*3 );
	var hsize = size * 0.5;
	var pos = 0;
	var x = -hsize;
	var delta = size / (num_lines-1);

	for(var i = 0; i < num_lines; i++)
	{
		vertexPositionData[ pos ] = x;
		vertexPositionData[ pos+2 ] = -hsize;
		vertexPositionData[ pos+3 ] = x;
		vertexPositionData[ pos+5 ] = hsize;

		vertexPositionData[ pos+6 ] = hsize;
		vertexPositionData[ pos+8 ] = x
		vertexPositionData[ pos+9 ] = -hsize;
		vertexPositionData[ pos+11 ] = x

		x += delta;
		pos += 12;
	}

	return new GL.Mesh({vertices: vertexPositionData}, options, gl );
}


/**
* Returns a icosahedron mesh (useful to create spheres by subdivision)
* @method Mesh.icosahedron
* @param {Object} options valid options: radius, subdivisions (max: 6)
*/
Mesh.icosahedron = function( options, gl ) {
	options = options || {};
	var radius = options.radius || options.size || 1;
	var subdivisions = options.subdivisions === undefined ? 0 : options.subdivisions;
	if(subdivisions > 6) //dangerous
		subdivisions = 6;

	var t = (1.0 + Math.sqrt(5)) / 2.0;
	var vertices = [-1,t,0, 1,t,0, -1,-t,0, 1,-t,0,
					0,-1,t, 0,1,t, 0,-1,-t, 0,1,-t,
					t,0,-1, t,0,1, -t,0,-1, -t,0,1];
	var normals = [];
	var coords = [];
	var indices = [0,11,5, 0,5,1, 0,1,7, 0,7,10, 0,10,11, 1,5,9, 5,11,4, 11,10,2, 10,7,6, 7,1,8, 3,9,4, 3,4,2, 3,2,6, 3,6,8, 3,8,9, 4,9,5, 2,4,11, 6,2,10, 8,6,7, 9,8,1 ];

	//normalize
	var l = vertices.length;
	for(var i = 0; i < l; i+=3)
	{
		var mod = Math.sqrt( vertices[i]*vertices[i] + vertices[i+1]*vertices[i+1] + vertices[i+2]*vertices[i+2] );
		var normalx = vertices[i] / mod;
		var normaly = vertices[i+1] / mod;
		var normalz = vertices[i+2] / mod;
		normals.push( normalx, normaly, normalz );
		coords.push( Math.atan2( normalx, normalz ), Math.acos( normaly ) );
		vertices[i] *= radius/mod;
		vertices[i+1] *= radius/mod;
		vertices[i+2] *= radius/mod;
	}

	var middles = {};

	//A,B = index of vertex in vertex array
	function middlePoint( A, B )
	{
		var key = indices[A] < indices[B] ? indices[A] + ":"+indices[B] : indices[B]+":"+indices[A];
		var r = middles[key];
		if(r)
			return r;
		var index = vertices.length / 3;
		vertices.push(( vertices[ indices[A]*3] + vertices[ indices[B]*3   ]) * 0.5,
					(vertices[ indices[A]*3+1] + vertices[ indices[B]*3+1 ]) * 0.5,
					(vertices[ indices[A]*3+2] + vertices[ indices[B]*3+2 ]) * 0.5);

		var mod = Math.sqrt( vertices[index*3]*vertices[index*3] + vertices[index*3+1]*vertices[index*3+1] + vertices[index*3+2]*vertices[index*3+2] );
		var normalx = vertices[index*3] / mod;
		var normaly = vertices[index*3+1] / mod;
		var normalz = vertices[index*3+2] / mod;
		normals.push( normalx, normaly, normalz );
		coords.push( (Math.atan2( normalx, normalz ) / Math.PI) * 0.5, (Math.acos( normaly ) / Math.PI) );
		vertices[index*3] *= radius/mod;
		vertices[index*3+1] *= radius/mod;
		vertices[index*3+2] *= radius/mod;

		middles[key] = index;
		return index;
	}

	for (var iR = 0; iR < subdivisions; ++iR )
	{
		var new_indices = [];
		var l = indices.length;
		for(var i = 0; i < l; i+=3)
		{
			var MA = middlePoint( i, i+1 );
			var MB = middlePoint( i+1, i+2);
			var MC = middlePoint( i+2, i);
			new_indices.push(indices[i], MA, MC);
			new_indices.push(indices[i+1], MB, MA);
			new_indices.push(indices[i+2], MC, MB);
			new_indices.push(MA, MB, MC);
		}
		indices = new_indices;
	}

	options.bounding = BBox.fromCenterHalfsize( [0,0,0], [radius,radius,radius], radius );

	return new GL.Mesh.load({vertices: vertices, coords: coords, normals: normals, triangles: indices},options,gl);
}
/**
* @namespace GL
*/

/**
* Texture class to upload images to the GPU, default is gl.TEXTURE_2D, gl.RGBA of gl.UNSIGNED_BYTE with filters set to gl.LINEAR and wrap to gl.CLAMP_TO_EDGE <br/>
	There is a list of options <br/>
	========================== <br/>
	- texture_type: gl.TEXTURE_2D, gl.TEXTURE_CUBE_MAP, default gl.TEXTURE_2D <br/>
	- format: gl.RGB, gl.RGBA, gl.DEPTH_COMPONENT, default gl.RGBA <br/>
	- type: gl.UNSIGNED_BYTE, gl.UNSIGNED_SHORT, gl.HALF_FLOAT_OES, gl.FLOAT, default gl.UNSIGNED_BYTE <br/>
	- filter: filtering for mag and min: gl.NEAREST or gl.LINEAR, default gl.NEAREST <br/>
	- magFilter: magnifying filter: gl.NEAREST, gl.LINEAR, default gl.NEAREST <br/>
	- minFilter: minifying filter: gl.NEAREST, gl.LINEAR, gl.LINEAR_MIPMAP_LINEAR, default gl.NEAREST <br/>
	- wrap: texture wrapping: gl.CLAMP_TO_EDGE, gl.REPEAT, gl.MIRROR, default gl.CLAMP_TO_EDGE (also accepts wrapT and wrapS for separate settings) <br/>
	- pixel_data: ArrayBufferView with the pixel data to upload to the texture, otherwise the texture will be black <br/>
	- premultiply_alpha : multiply the color by the alpha value when uploading, default FALSE <br/>
	- no_flip : do not flip in Y, default TRUE <br/>
	- anisotropic : number of anisotropic fetches, default 0 <br/>

	check for more info about formats: https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/texImage2D

* @class Texture
* @param {number} width texture width (any supported but Power of Two allows to have mipmaps), 0 means no memory reserved till its filled
* @param {number} height texture height (any supported but Power of Two allows to have mipmaps), 0 means no memory reserved till its filled
* @param {Object} options Check the list in the description
* @constructor
*/

global.Texture = GL.Texture = function Texture( width, height, options, gl ) {
	options = options || {};

	//used to avoid problems with resources moving between different webgl context
	gl = gl || global.gl;
	this.gl = gl;
	this._context_id = gl.context_id; 

	//round sizes
	width = parseInt(width); 
	height = parseInt(height);

	if(GL.debug)
		console.log("GL.Texture created: ",width,height);

	//create texture handler
	this.handler = gl.createTexture();

	//set settings
	this.width = width;
	this.height = height;
	if(options.depth) //for texture_3d
		this.depth = options.depth; 
	this.texture_type = options.texture_type || gl.TEXTURE_2D; //or gl.TEXTURE_CUBE_MAP
	this.format = options.format || Texture.DEFAULT_FORMAT; //gl.RGBA (if gl.DEPTH_COMPONENT remember type: gl.UNSIGNED_SHORT)
	this.internalFormat = options.internalFormat; //LUMINANCE, and weird formats with bits
	this.type = options.type || Texture.DEFAULT_TYPE; //gl.UNSIGNED_BYTE, gl.UNSIGNED_SHORT, gl.FLOAT or gl.HALF_FLOAT_OES (or gl.HIGH_PRECISION_FORMAT which could be half or float)
	this.magFilter = options.magFilter || options.filter || Texture.DEFAULT_MAG_FILTER;
	this.minFilter = options.minFilter || options.filter || Texture.DEFAULT_MIN_FILTER;
	this.wrapS = options.wrap || options.wrapS || Texture.DEFAULT_WRAP_S; 
	this.wrapT = options.wrap || options.wrapT || Texture.DEFAULT_WRAP_T;
	this.data = null; //where the data came from

	//precompute the max amount of texture units
	if(!Texture.MAX_TEXTURE_IMAGE_UNITS)
		Texture.MAX_TEXTURE_IMAGE_UNITS = gl.getParameter( gl.MAX_TEXTURE_IMAGE_UNITS );

	this.has_mipmaps = false;

	if( this.format == gl.DEPTH_COMPONENT && gl.webgl_version == 1 && !gl.extensions["WEBGL_depth_texture"] )
		throw("Depth Texture not supported");
	if( this.type == gl.FLOAT && !gl.extensions["OES_texture_float"] && gl.webgl_version == 1 )
		throw("Float Texture not supported");
	if( this.type == gl.HALF_FLOAT_OES)
	{
		if( !gl.extensions["OES_texture_half_float"] && gl.webgl_version == 1 )
			throw("Half Float Texture extension not supported.");
		else if( gl.webgl_version > 1 )
		{
			console.warn("using HALF_FLOAT_OES in WebGL2 is deprecated, suing HALF_FLOAT instead");
			this.type = this.format == gl.RGB ? gl.RGB16F : gl.RGBA16F;
		}
	}
	if( (!isPowerOfTwo(this.width) || !isPowerOfTwo(this.height)) && //non power of two
		( (this.minFilter != gl.NEAREST && this.minFilter != gl.LINEAR) || //uses mipmaps
		(this.wrapS != gl.CLAMP_TO_EDGE || this.wrapT != gl.CLAMP_TO_EDGE) ) ) //uses wrap
	{
		if(!options.ignore_pot)
			throw("Cannot use texture-wrap or mipmaps in Non-Power-of-Two textures");
		else
		{
			this.minFilter = this.magFilter = gl.LINEAR;
			this.wrapS = this.wrapT = gl.CLAMP_TO_EDGE;
		}
	}

	//empty textures are allowed to be created
	if(!width || !height)
		return;

	//because sometimes the internal format is not so obvious
	if(!this.internalFormat)
		this.computeInternalFormat();

	//this is done because in some cases the user binds a texture to slot 0 and then creates a new one, which overrides slot 0
	gl.activeTexture( gl.TEXTURE0 + Texture.MAX_TEXTURE_IMAGE_UNITS - 1);
	//I use an invalid gl enum to say this texture is a depth texture, ugly, I know...
	gl.bindTexture( this.texture_type, this.handler);
	gl.texParameteri( this.texture_type, gl.TEXTURE_MAG_FILTER, this.magFilter );
	gl.texParameteri( this.texture_type, gl.TEXTURE_MIN_FILTER, this.minFilter );
	gl.texParameteri( this.texture_type, gl.TEXTURE_WRAP_S, this.wrapS );
	gl.texParameteri( this.texture_type, gl.TEXTURE_WRAP_T, this.wrapT );

	if(options.anisotropic && gl.extensions["EXT_texture_filter_anisotropic"])
		gl.texParameterf( GL.TEXTURE_2D, gl.extensions["EXT_texture_filter_anisotropic"].TEXTURE_MAX_ANISOTROPY_EXT, options.anisotropic);

	var pixel_data = options.pixel_data;
	if(pixel_data && !pixel_data.buffer)
	{
		pixel_data = new (this.type == gl.FLOAT ? Float32Array : Uint8Array)( pixel_data );
		this.data = pixel_data;
	}

	//gl.TEXTURE_1D is not supported by WebGL...

	//here we create all **********************************
	if(this.texture_type == GL.TEXTURE_2D)
	{
		//create the texture
		gl.texImage2D( GL.TEXTURE_2D, 0, this.internalFormat, width, height, 0, this.format, this.type, pixel_data || null );

		//generate empty mipmaps (necessary?)
		if ( GL.isPowerOfTwo(width) && GL.isPowerOfTwo(height) && options.minFilter && options.minFilter != gl.NEAREST && options.minFilter != gl.LINEAR)
		{
			gl.generateMipmap( this.texture_type );
			this.has_mipmaps = true;
		}
	}
	else if(this.texture_type == GL.TEXTURE_CUBE_MAP)
	{
		gl.texImage2D( gl.TEXTURE_CUBE_MAP_POSITIVE_X, 0, this.internalFormat, this.width, this.height, 0, this.format, this.type, pixel_data || null );
		gl.texImage2D( gl.TEXTURE_CUBE_MAP_POSITIVE_Y, 0, this.internalFormat, this.width, this.height, 0, this.format, this.type, pixel_data || null );
		gl.texImage2D( gl.TEXTURE_CUBE_MAP_POSITIVE_Z, 0, this.internalFormat, this.width, this.height, 0, this.format, this.type, pixel_data || null );
		gl.texImage2D( gl.TEXTURE_CUBE_MAP_NEGATIVE_X, 0, this.internalFormat, this.width, this.height, 0, this.format, this.type, pixel_data || null );
		gl.texImage2D( gl.TEXTURE_CUBE_MAP_NEGATIVE_Y, 0, this.internalFormat, this.width, this.height, 0, this.format, this.type, pixel_data || null );
		gl.texImage2D( gl.TEXTURE_CUBE_MAP_NEGATIVE_Z, 0, this.internalFormat, this.width, this.height, 0, this.format, this.type, pixel_data || null );
	}
	else if(this.texture_type == GL.TEXTURE_3D)
	{
		if(this.gl.webgl_version == 1)
			throw("TEXTURE_3D not supported in WebGL 1. Enable WebGL 2 in the context by pasing webgl2:true");
		if(!options.depth)
			throw("3d texture depth must be set in the options.depth");
		gl.texImage3D( GL.TEXTURE_3D, 0, this.internalFormat, width, height, options.depth, 0, this.format, this.type, pixel_data || null );
	}
	gl.bindTexture(this.texture_type, null); //disable
	gl.activeTexture(gl.TEXTURE0);
}

Texture.DEFAULT_TYPE = GL.UNSIGNED_BYTE;
Texture.DEFAULT_FORMAT = GL.RGBA;
Texture.DEFAULT_MAG_FILTER = GL.LINEAR;
Texture.DEFAULT_MIN_FILTER = GL.LINEAR;
Texture.DEFAULT_WRAP_S = GL.CLAMP_TO_EDGE;
Texture.DEFAULT_WRAP_T = GL.CLAMP_TO_EDGE;

//used for render to FBOs
Texture.framebuffer = null;
Texture.renderbuffer = null;
Texture.loading_color = new Uint8Array([0,0,0,0]);
Texture.use_renderbuffer_pool = true; //should improve performance

//because usually you dont want to specify the internalFormat, this tries to guess it from its format
//check https://webgl2fundamentals.org/webgl/lessons/webgl-data-textures.html for more info
Texture.prototype.computeInternalFormat = function()
{
	this.internalFormat = this.format; //default

	//automatic selection of internal format for depth textures to avoid problems between webgl1 and 2
	if( this.format == GL.DEPTH_COMPONENT )
	{
		this.minFilter = this.magFilter = GL.NEAREST;

		if( gl.webgl_version == 2 ) 
		{
			if( this.type == GL.UNSIGNED_SHORT )
				this.internalFormat = GL.DEPTH_COMPONENT16;
			else if( this.type == GL.UNSIGNED_INT )
				this.internalFormat = GL.DEPTH_COMPONENT24;
			else if( this.type == GL.FLOAT )
				this.internalFormat = GL.DEPTH_COMPONENT32F;
			else 
				throw("unsupported type for a depth texture");
		}
		else if( gl.webgl_version == 1 )
		{
			if( this.type == GL.FLOAT )
				throw("WebGL 1.0 does not support float depth textures");
			this.internalFormat = GL.DEPTH_COMPONENT;
		}
	}
	else if( this.format == gl.RGBA )
	{
		if( gl.webgl_version == 2 ) 
		{
			if( this.type == GL.FLOAT )
				this.internalFormat = GL.RGBA32F;
			else if( this.type == GL.HALF_FLOAT )
				this.internalFormat = GL.RGBA16F;
			else if( this.type == GL.HALF_FLOAT_OES )
			{
				console.warn("webgl 2 does not use HALF_FLOAT_OES, converting to HALF_FLOAT")
				this.type = GL.HALF_FLOAT;
				this.internalFormat = GL.RGBA16F;
			}
			/*
			else if( this.type == GL.UNSIGNED_SHORT )
			{
				this.internalFormat = GL.RGBA16UI;
				this.format = gl.RGBA_INTEGER;
			}
			else if( this.type == GL.UNSIGNED_INT )
			{
				this.internalFormat = GL.RGBA32UI;
				this.format = gl.RGBA_INTEGER;
			}
			*/
		}
		else if( gl.webgl_version == 1 )
		{
			if( this.type == GL.HALF_FLOAT )
			{
				console.warn("webgl 1 does not use HALF_FLOAT, converting to HALF_FLOAT_OES")
				this.type = GL.HALF_FLOAT_OES;
			}
		}
	}
}

/**
* Free the texture memory from the GPU, sets the texture handler to null
* @method delete
*/
Texture.prototype.delete = function()
{
	gl.deleteTexture( this.handler );
	this.handler = null;
}

Texture.prototype.getProperties = function()
{
	return {
		width: this.width,
		height: this.height,
		type: this.type,
		format: this.format,
		texture_type: this.texture_type,
		magFilter: this.magFilter,
		minFilter: this.minFilter,
		wrapS: this.wrapS,
		wrapT: this.wrapT
	};
}

Texture.prototype.hasSameProperties = function(t)
{
	if(!t)
		return false;
	return t.width == this.width && 
		t.height == this.height &&
		t.type == this.type &&
		t.format == this.format &&
		t.texture_type == this.texture_type;
}

Texture.prototype.hasSameSize = function(t)
{
	if(!t)
		return false;
	return t.width == this.width && t.height == this.height;
}
//textures cannot be stored in JSON
Texture.prototype.toJSON = function()
{
	return "";
}


/**
* Returns if depth texture is supported by the GPU
* @method isDepthSupported
* @return {Boolean} true if supported
*/
Texture.isDepthSupported = function()
{
	return gl.extensions["WEBGL_depth_texture"] != null;
}

/**
* Binds the texture to one texture unit
* @method bind
* @param {number} unit texture unit
* @return {number} returns the texture unit
*/
Texture.prototype.bind = function( unit ) {
	if(unit == undefined)
		unit = 0;
	var gl = this.gl;

	//TODO: if the texture is not uploaded, must be upload now

	//bind
	gl.activeTexture(gl.TEXTURE0 + unit);
	gl.bindTexture( this.texture_type, this.handler );
	return unit;
}

/**
* Unbinds the texture 
* @method unbind
* @param {number} unit texture unit
* @return {number} returns the texture unit
*/
Texture.prototype.unbind = function(unit) {
	if(unit === undefined)
		unit = 0;
	var gl = this.gl;
	gl.activeTexture(gl.TEXTURE0 + unit );
	gl.bindTexture(this.texture_type, null);
}


Texture.prototype.setParameter = function(param,value) {
	this.bind(0);
	this.gl.texParameteri( this.texture_type, param, value );
	switch(param)
	{
		case this.gl.TEXTURE_MAG_FILTER: this.magFilter = value; break;
		case this.gl.TEXTURE_MIN_FILTER: this.minFilter = value; break;
		case this.gl.TEXTURE_WRAP_S: this.wrapS = value; break;
		case this.gl.TEXTURE_WRAP_T: this.wrapT = value; break;
	}
}

/**
* Unbinds the texture 
* @method Texture.setUploadOptions
* @param {Object} options a list of options to upload the texture
* - premultiply_alpha : multiply the color by the alpha value, default FALSE
* - no_flip : do not flip in Y, default TRUE
*/
Texture.setUploadOptions = function(options, gl)
{
	gl = gl || global.gl;

	if(options) //options that are not stored in the texture should be passed again to avoid reusing unknown state
	{
		gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, !!(options.premultiply_alpha) );
		gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, !(options.no_flip) );
	}
	else
	{
		gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false );
		gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true );
	}
	gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
}

/**
* Given an Image/Canvas/Video it uploads it to the GPU
* @method uploadImage
* @param {Image} img
* @param {Object} options [optional] upload options (premultiply_alpha, no_flip)
*/
Texture.prototype.uploadImage = function( image, options )
{
	this.bind();
	var gl = this.gl;
	if(!image)
		throw("uploadImage parameter must be Image");

	Texture.setUploadOptions(options, gl);

	try {
		gl.texImage2D( gl.TEXTURE_2D, 0, this.format, this.format, this.type, image );
		this.width = image.videoWidth || image.width;
		this.height = image.videoHeight || image.height;
		this.data = image;
	} catch (e) {
		if (location.protocol == 'file:') {
			throw 'image not loaded for security reasons (serve this page over "http://" instead)';
		} else {
			throw 'image not loaded for security reasons (image must originate from the same ' +
			'domain as this page or use Cross-Origin Resource Sharing)';
		}
	}

	//TODO: add expand transparent pixels option

	//generate mipmaps
	if (this.minFilter && this.minFilter != gl.NEAREST && this.minFilter != gl.LINEAR) {
		gl.generateMipmap(this.texture_type);
		this.has_mipmaps = true;
	}
	gl.bindTexture(this.texture_type, null); //disable
}

/**
* Uploads data to the GPU (data must have the appropiate size)
* @method uploadData
* @param {ArrayBuffer} data
* @param {Object} options [optional] upload options (premultiply_alpha, no_flip)
*/
Texture.prototype.uploadData = function(data, options )
{
	var gl = this.gl;
	this.bind();
	Texture.setUploadOptions(options, gl);

	if( this.texture_type == GL.TEXTURE_2D )
		gl.texImage2D(this.texture_type, 0, this.format, this.width, this.height, 0, this.format, this.type, data);
	else if( this.texture_type == GL.TEXTURE_3D )
		gl.texImage3D(this.texture_type, 0, this.format, this.width, this.height, this.depth, 0, this.format, this.type, data);
	else
		throw("cannot uploadData for this texture type");

	this.data = data; //should I clone it?

	if (this.minFilter && this.minFilter != gl.NEAREST && this.minFilter != gl.LINEAR) {
		gl.generateMipmap(texture.texture_type);
		this.has_mipmaps = true;
	}
	gl.bindTexture(this.texture_type, null); //disable
}

//When creating cubemaps this is helpful

/*THIS WORKS old
Texture.cubemap_camera_parameters = [
	{ type:"posX", dir: vec3.fromValues(-1,0,0), 	up: vec3.fromValues(0,1,0),	right: vec3.fromValues(0,0,-1) },
	{ type:"negX", dir: vec3.fromValues(1,0,0),		up: vec3.fromValues(0,1,0),	right: vec3.fromValues(0,0,1) },
	{ type:"posY", dir: vec3.fromValues(0,-1,0), 	up: vec3.fromValues(0,0,-1), right: vec3.fromValues(1,0,0) },
	{ type:"negY", dir: vec3.fromValues(0,1,0),		up: vec3.fromValues(0,0,1),	right: vec3.fromValues(-1,0,0) },
	{ type:"posZ", dir: vec3.fromValues(0,0,-1), 	up: vec3.fromValues(0,1,0),	right: vec3.fromValues(1,0,0) },
	{ type:"negZ", dir: vec3.fromValues(0,0,1),		up: vec3.fromValues(0,1,0),	right: vec3.fromValues(-1,0,0) }
];
*/

//THIS works
Texture.cubemap_camera_parameters = [
	{ type:"posX", dir: vec3.fromValues(1,0,0), 	up: vec3.fromValues(0,1,0),	right: vec3.fromValues(0,0,-1) },
	{ type:"negX", dir: vec3.fromValues(-1,0,0),	up: vec3.fromValues(0,1,0),	right: vec3.fromValues(0,0,1) },
	{ type:"posY", dir: vec3.fromValues(0,1,0), 	up: vec3.fromValues(0,0,-1), right: vec3.fromValues(1,0,0) },
	{ type:"negY", dir: vec3.fromValues(0,-1,0),	up: vec3.fromValues(0,0,1),	right: vec3.fromValues(1,0,0) },
	{ type:"posZ", dir: vec3.fromValues(0,0,1), 	up: vec3.fromValues(0,1,0),	right: vec3.fromValues(1,0,0) },
	{ type:"negZ", dir: vec3.fromValues(0,0,-1),	up: vec3.fromValues(0,1,0),	right: vec3.fromValues(-1,0,0) }
];



/**
* Render to texture using FBO, just pass the callback to a rendering function and the content of the texture will be updated
* If the texture is a cubemap, the callback will be called six times, once per face, the number of the face is passed as a second parameter
* for further info about how to set up the propper cubemap camera, check the GL.Texture.cubemap_camera_parameters with the direction and up vector for every face.
*
* Keep in mind that it tries to reuse the last renderbuffer for the depth, and if it cannot (different size) it creates a new one (throwing the old)
* @method drawTo
* @param {Function} callback function that does all the rendering inside this texture
*/
Texture.prototype.drawTo = function(callback, params)
{
	var gl = this.gl;

	//if(this.format == gl.DEPTH_COMPONENT)
	//	throw("cannot use drawTo in depth textures, use Texture.drawToColorAndDepth");

	var v = gl.getViewport();
	var now = GL.getTime();

	var old_fbo = gl.getParameter( gl.FRAMEBUFFER_BINDING );

	var framebuffer = gl._framebuffer = gl._framebuffer || gl.createFramebuffer();
	gl.bindFramebuffer( gl.FRAMEBUFFER, framebuffer );

	//this code allows to reuse old renderbuffers instead of creating and destroying them for every frame
	var renderbuffer = null;

	if( Texture.use_renderbuffer_pool ) //create a renderbuffer pool
	{
		if(!gl._renderbuffers_pool)
			gl._renderbuffers_pool = {};
		//generate unique key for this renderbuffer
		var key = this.width + ":" + this.height;

		//reuse or create new one
		if( gl._renderbuffers_pool[ key ] ) //Reuse old
		{
			renderbuffer = gl._renderbuffers_pool[ key ];
			renderbuffer.time = now;
			gl.bindRenderbuffer(gl.RENDERBUFFER, renderbuffer );
		}
		else
		{
			//create temporary buffer
			gl._renderbuffers_pool[ key ] = renderbuffer = gl.createRenderbuffer();
			renderbuffer.time = now;
			renderbuffer.width = this.width;
			renderbuffer.height = this.height;
			gl.bindRenderbuffer( gl.RENDERBUFFER, renderbuffer );

			//destroy after one minute 
			setTimeout( inner_check_destroy.bind(renderbuffer), 1000*60 );
		}
	}
	else
	{
		renderbuffer = gl._renderbuffer = gl._renderbuffer || gl.createRenderbuffer();
		renderbuffer.width = this.width;
		renderbuffer.height = this.height;
		gl.bindRenderbuffer( gl.RENDERBUFFER, renderbuffer );
	}


	//bind render buffer for depth or color
	if( this.format === gl.DEPTH_COMPONENT )
		gl.renderbufferStorage( gl.RENDERBUFFER, gl.RGBA4, this.width, this.height);
	else
		gl.renderbufferStorage( gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, this.width, this.height);


	//clears memory from unused buffer
	function inner_check_destroy()
	{
		if( GL.getTime() - this.time >= 1000*60 )
		{
			console.log("Buffer cleared");
			gl.deleteRenderbuffer( gl._renderbuffers_pool[ key ] );
			delete gl._renderbuffers_pool[ key ];
		}
		else
			setTimeout( inner_check_destroy.bind(this), 1000*60 );
	}


	//create to store depth
	/*
	if (this.width != renderbuffer.width || this.height != renderbuffer.height ) {
	  renderbuffer.width = this.width;
	  renderbuffer.height = this.height;
	  gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, this.width, this.height);
	}
	*/

	gl.viewport(0, 0, this.width, this.height);

	//if(gl._current_texture_drawto)
	//	throw("Texture.drawTo: Cannot use drawTo from inside another drawTo");

	gl._current_texture_drawto = this;
	gl._current_fbo_color = framebuffer;
	gl._current_fbo_depth = renderbuffer;

	if(this.texture_type == gl.TEXTURE_2D)
	{
		if( this.format !== gl.DEPTH_COMPONENT )
		{
			gl.framebufferTexture2D( gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.handler, 0 );
			gl.framebufferRenderbuffer( gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, renderbuffer );
		}
		else
		{
			gl.framebufferRenderbuffer( gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.RENDERBUFFER, renderbuffer );
			gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.TEXTURE_2D,  this.handler, 0);
		}
		callback(this, params);
	}
	else if(this.texture_type == gl.TEXTURE_CUBE_MAP)
	{
		//bind the fixed ones out of the loop to save calls
		if( this.format !== gl.DEPTH_COMPONENT )
			gl.framebufferRenderbuffer( gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, renderbuffer );
		else
			gl.framebufferRenderbuffer( gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.RENDERBUFFER, renderbuffer );

		//for every face of the cubemap
		for(var i = 0; i < 6; i++)
		{
			if( this.format !== gl.DEPTH_COMPONENT )
				gl.framebufferTexture2D( gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_CUBE_MAP_POSITIVE_X + i, this.handler, 0);
			else
				gl.framebufferTexture2D( gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.TEXTURE_CUBE_MAP_POSITIVE_X + i,  this.handler, 0 );
			callback(this,i, params);
		}
	}

	this.data = null;

	gl._current_texture_drawto = null;
	gl._current_fbo_color = null;
	gl._current_fbo_depth = null;

	gl.bindFramebuffer( gl.FRAMEBUFFER, old_fbo );
	gl.bindRenderbuffer(gl.RENDERBUFFER, null);
	gl.viewport(v[0], v[1], v[2], v[3]);

	return this;
}

/**
* Static version of drawTo meant to be used with several buffers
* @method drawToColorAndDepth
* @param {Texture} color_texture
* @param {Texture} depth_texture
* @param {Function} callback
*/
Texture.drawTo = function( color_textures, callback, depth_texture )
{
	var w = -1,
		h = -1,
		type = null;

	if(!color_textures && !depth_texture)
		throw("Textures missing in drawTo");

	if(color_textures && color_textures.length)
	{
		for(var i = 0; i < color_textures.length; i++)
		{
			var t = color_textures[i];
			if(w == -1) 
				w = t.width;
			else if(w != t.width)
				throw("Cannot use Texture.drawTo if textures have different dimensions");
			if(h == -1) 
				h = t.height;
			else if(h != t.height)
				throw("Cannot use Texture.drawTo if textures have different dimensions");
			if(type == null) //first one defines the type
				type = t.type;
			else if (type != t.type)
				throw("Cannot use Texture.drawTo if textures have different data type, all must have the same type");
		}
	}
	else
	{
		w = depth_texture.width;
		h = depth_texture.height;
	}

	var ext = gl.extensions["WEBGL_draw_buffers"];
	if(!ext && color_textures && color_textures.length > 1)
		throw("Rendering to several textures not supported");

	var v = gl.getViewport();
	gl._framebuffer =  gl._framebuffer || gl.createFramebuffer();
	gl.bindFramebuffer( gl.FRAMEBUFFER,  gl._framebuffer );

	gl.viewport( 0, 0, w, h );

	var renderbuffer = null;
	if( depth_texture && depth_texture.format !== gl.DEPTH_COMPONENT || depth_texture.type != gl.UNSIGNED_INT )
		throw("Depth texture must be of format: gl.DEPTH_COMPONENT and type: gl.UNSIGNED_INT");

	if( depth_texture )
	{
		gl.framebufferTexture2D( gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.TEXTURE_2D, depth_texture.handler, 0);
	}
	else //create a temporary depth renderbuffer
	{
		//create renderbuffer for depth
		renderbuffer = gl._renderbuffer = gl._renderbuffer || gl.createRenderbuffer();
		renderbuffer.width = w;
		renderbuffer.height = h;
		gl.bindRenderbuffer(gl.RENDERBUFFER, renderbuffer );
		gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, w, h);

		gl.framebufferRenderbuffer( gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, renderbuffer );
	}

	if( color_textures )
	{
		var order = []; //draw_buffers request the use of an array with the order of the attachments
		for(var i = 0; i < color_textures.length; i++)
		{
			var t = color_textures[i];
			gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0 + i, gl.TEXTURE_2D, t.handler, 0);
			order.push( gl.COLOR_ATTACHMENT0 + i );
		}

		if(color_textures.length > 1)
			ext.drawBuffersWEBGL( order );
	}
	else //create temporary color render buffer
	{
		var color_renderbuffer = this._color_renderbuffer = this._color_renderbuffer || gl.createRenderbuffer();
		color_renderbuffer.width = w;
		color_renderbuffer.height = h;

		gl.bindRenderbuffer( gl.RENDERBUFFER, color_renderbuffer );
		gl.renderbufferStorage( gl.RENDERBUFFER, gl.RGBA4, w, h );

		gl.framebufferRenderbuffer( gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.RENDERBUFFER, color_renderbuffer );
	}

	var complete = gl.checkFramebufferStatus( gl.FRAMEBUFFER );
	if(complete !== gl.FRAMEBUFFER_COMPLETE)
		throw("FBO not complete: " + complete);

	callback();

	//clear data
	if(color_textures.length)
		for(var i = 0; i < color_textures.length; ++i)
			color_textures[i].data = null;

	gl.bindFramebuffer(gl.FRAMEBUFFER, null);

	gl.viewport(v[0], v[1], v[2], v[3]);
}

/**
* Similar to drawTo but it also stores the depth in a depth texture
* @method drawToColorAndDepth
* @param {Texture} color_texture
* @param {Texture} depth_texture
* @param {Function} callback
*/
Texture.drawToColorAndDepth = function( color_texture, depth_texture, callback ) {
	var gl = color_texture.gl; //static function

	if(depth_texture.width != color_texture.width || depth_texture.height != color_texture.height)
		throw("Different size between color texture and depth texture");

	var v = gl.getViewport();

	gl._framebuffer =  gl._framebuffer || gl.createFramebuffer();

	gl.bindFramebuffer( gl.FRAMEBUFFER,  gl._framebuffer);

	gl.viewport(0, 0, color_texture.width, color_texture.height);

	gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, color_texture.handler, 0);
	gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT,  gl.TEXTURE_2D, depth_texture.handler, 0);

	callback();

	color_texture.data = null;
	depth_texture.data = null;

	gl.bindFramebuffer(gl.FRAMEBUFFER, null);

	gl.viewport(v[0], v[1], v[2], v[3]);
}



/**
* Copy content of one texture into another
* TODO: check using copyTexImage2D
* @method copyTo
* @param {GL.Texture} target_texture
* @param {GL.Shader} [shader=null] optional shader to apply while copying
* @param {Object} [uniforms=null] optional uniforms for the shader
*/
Texture.prototype.copyTo = function( target_texture, shader, uniforms ) {
	var that = this;
	var gl = this.gl;

	//save state
	var previous_fbo = gl.getParameter( gl.FRAMEBUFFER_BINDING );
	var viewport = gl.getViewport(); 

	if(!shader)
		shader = this.texture_type == gl.TEXTURE_2D ? GL.Shader.getScreenShader() : GL.Shader.getCubemapCopyShader();

	//render
	gl.disable( gl.BLEND );
	gl.disable( gl.DEPTH_TEST );
	if(shader && uniforms)
		shader.uniforms( uniforms );

	//reuse fbo
	var fbo = gl.__copy_fbo;
	if(!fbo)
		fbo = gl.__copy_fbo = gl.createFramebuffer();
	gl.bindFramebuffer( gl.FRAMEBUFFER, fbo );

	gl.viewport(0,0,target_texture.width, target_texture.height);
	if(this.texture_type == gl.TEXTURE_2D)
	{
		if(this.format !== gl.DEPTH_COMPONENT && this.format !== gl.DEPTH_STENCIL )
		{
			gl.framebufferTexture2D( gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, target_texture.handler, 0);
			this.toViewport( shader );
		}
		else //copying a depth texture is harder
		{
			var color_renderbuffer = gl._color_renderbuffer = gl._color_renderbuffer || gl.createRenderbuffer();
			var w = color_renderbuffer.width = target_texture.width;
			var h = color_renderbuffer.height = target_texture.height;
			
			//attach color render buffer
			gl.bindRenderbuffer( gl.RENDERBUFFER, color_renderbuffer );
			gl.renderbufferStorage( gl.RENDERBUFFER, gl.RGBA4, w, h );
			gl.framebufferRenderbuffer( gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.RENDERBUFFER, color_renderbuffer );

			//attach depth texture
			var attachment_point = target_texture.format == gl.DEPTH_STENCIL ? gl.DEPTH_STENCIL_ATTACHMENT : gl.DEPTH_ATTACHMENT;
			gl.framebufferTexture2D( gl.FRAMEBUFFER, attachment_point, gl.TEXTURE_2D, target_texture.handler, 0);

			var complete = gl.checkFramebufferStatus( gl.FRAMEBUFFER );
			if(complete !== gl.FRAMEBUFFER_COMPLETE)
				throw("FBO not complete: " + complete);

			//enable depth test?
			gl.enable( gl.DEPTH_TEST );
			gl.depthFunc( gl.ALWAYS );
			gl.colorMask( false,false,false,false );
			//call shader that overwrites depth values
			shader = GL.Shader.getCopyDepthShader();
			this.toViewport( shader );
			gl.colorMask( true,true,true,true );
			gl.disable( gl.DEPTH_TEST );
			gl.depthFunc( gl.LEQUAL );
			gl.framebufferRenderbuffer( gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.RENDERBUFFER, null );
			gl.framebufferTexture2D( gl.FRAMEBUFFER, attachment_point, gl.TEXTURE_2D, null, 0);
		}
	}
	else if(this.texture_type == gl.TEXTURE_CUBE_MAP)
	{
		shader.uniforms({u_texture: 0});
		var rot_matrix = GL.temp_mat3;
		for(var i = 0; i < 6; i++)
		{
			gl.framebufferTexture2D( gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_CUBE_MAP_POSITIVE_X + i, target_texture.handler, 0);
			var face_info = GL.Texture.cubemap_camera_parameters[ i ];
			mat3.identity( rot_matrix );
			rot_matrix.set( face_info.right, 0 );
			rot_matrix.set( face_info.up, 3 );
			rot_matrix.set( face_info.dir, 6 );
			//mat3.invert(rot_matrix,rot_matrix);
			this.toViewport( shader,{ u_rotation: rot_matrix });
		}
	}
	
	//restore previous state
	gl.setViewport(viewport); //restore viewport
	gl.bindFramebuffer( gl.FRAMEBUFFER, previous_fbo ); //restore fbo

	//generate mipmaps when needed
	if (target_texture.minFilter && target_texture.minFilter != gl.NEAREST && target_texture.minFilter != gl.LINEAR) {
		target_texture.bind();
		gl.generateMipmap(target_texture.texture_type);
		target_texture.has_mipmaps = true;
	}

	target_texture.data = null;
	gl.bindTexture( target_texture.texture_type, null ); //disable
	return this;
}

/**
* Render texture in a quad to full viewport size
* @method toViewport
* @param {Shader} shader to apply, otherwise a default textured shader is applied [optional]
* @param {Object} uniforms for the shader if needed [optional]
*/
Texture.prototype.toViewport = function(shader, uniforms)
{
	shader = shader || Shader.getScreenShader();
	var mesh = Mesh.getScreenQuad();
	this.bind(0);
	//shader.uniforms({u_texture: 0}); //never changes
	if(uniforms)
		shader.uniforms(uniforms);
	shader.draw( mesh, gl.TRIANGLES );
}

/**
* Fills the texture with a constant color (uses gl.clear)
* @method fill
* @param {vec4} color rgba
* @param {boolean} skip_mipmaps if true the mipmaps wont be updated
*/
Texture.prototype.fill = function(color, skip_mipmaps )
{
	var old_color = gl.getParameter( gl.COLOR_CLEAR_VALUE );
	gl.clearColor( color[0], color[1], color[2], color[3] );
	this.drawTo( function() {
		gl.clear( gl.COLOR_BUFFER_BIT );	
	});
	gl.clearColor( old_color[0], old_color[1], old_color[2], old_color[3] );

	if (!skip_mipmaps && this.minFilter && this.minFilter != gl.NEAREST && this.minFilter != gl.LINEAR ) {
		this.bind();
		gl.generateMipmap( this.texture_type );
		this.has_mipmaps = true;
	}
}

/**
* Render texture in a quad of specified area
* @method renderQuad
* @param {number} x
* @param {number} y
* @param {number} width
* @param {number} height
*/
Texture.prototype.renderQuad = (function() {
	//static variables: less garbage
	var identity = mat3.create();
	var pos = vec2.create();
	var size = vec2.create();
	var white = vec4.fromValues(1,1,1,1);

	return (function(x,y,w,h, shader, uniforms)
	{
		pos[0] = x;	pos[1] = y;
		size[0] = w; size[1] = h;

		shader = shader || Shader.getQuadShader(this.gl);
		var mesh = Mesh.getScreenQuad(this.gl);
		this.bind(0);
		shader.uniforms({u_texture: 0, u_position: pos, u_color: white, u_size: size, u_viewport: gl.viewport_data.subarray(2,4), u_transform: identity });
		if(uniforms)
			shader.uniforms(uniforms);
		shader.draw( mesh, gl.TRIANGLES );
	});
})();


/**
* Applies a blur filter of four pixels to the texture (be careful using it, it is slow)
* @method applyBlur
* @param {Number} offsetx scalar that multiplies the offset when fetching pixels horizontally (default 1)
* @param {Number} offsety scalar that multiplies the offset when fetching pixels vertically (default 1)
* @param {Number} intensity scalar that multiplies the result (default 1)
* @param {Texture} temp_texture blur needs a temp texture, if not supplied it will create a new one each time!
* @param {Texture} output_texture [optional] if not passed the output is the own texture
* @return {Texture} returns the temp_texture in case you want to reuse it
*/
Texture.prototype.applyBlur = function( offsetx, offsety, intensity, temp_texture, output_texture )
{
	var that = this;
	var gl = this.gl;
	if(offsetx === undefined)
		offsetx = 1;
	if(offsety === undefined)
		offsety = 1;
	offsetx = offsetx / this.width;
	offsety = offsety / this.height;
	gl.disable( gl.DEPTH_TEST );
	gl.disable( gl.BLEND );

	if(this === output_texture && this.texture_type === gl.TEXTURE_CUBE_MAP )
		throw("cannot use applyBlur in a texture with itself when blurring a CUBE_MAP");

	if(output_texture && this.texture_type !== output_texture.texture_type )
		throw("cannot use applyBlur with textures of different texture_type");

	var result_texture = null;

	//save state
	var current_fbo = gl.getParameter( gl.FRAMEBUFFER_BINDING );
	var viewport = gl.getViewport(); 

	//reuse fbo
	var fbo = gl.__copy_fbo;
	if(!fbo)
		fbo = gl.__copy_fbo = gl.createFramebuffer();
	gl.bindFramebuffer( gl.FRAMEBUFFER, fbo );
	gl.viewport(0,0, this.width, this.height);

	if( this.texture_type === gl.TEXTURE_2D )
	{
		var shader = GL.Shader.getBlurShader();

		if(!temp_texture)
			temp_texture = new GL.Texture( this.width, this.height, this.getProperties() );

		gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, temp_texture.handler, 0);
		this.toViewport( shader, {u_texture: 0, u_intensity: intensity, u_offset: [0, offsety ] });

		output_texture = output_texture || this;
		gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, output_texture.handler, 0);
		temp_texture.toViewport( shader, {u_intensity: intensity, u_offset: [offsetx, 0] });

		result_texture = temp_texture;
	}
	else if( this.texture_type === gl.TEXTURE_CUBE_MAP )
	{
		//var weights = new Float32Array([ 0.16/0.98, 0.15/0.98, 0.12/0.98, 0.09/0.98, 0.05/0.98 ]);
		//var weights = new Float32Array([ 0.05/0.98, 0.09/0.98, 0.12/0.98, 0.15/0.98, 0.16/0.98, 0.15/0.98, 0.12/0.98, 0.09/0.98, 0.05/0.98, 0.0 ]); //extra 0 to avoid mat3

		var shader = GL.Shader.getCubemapBlurShader();
		shader.uniforms({u_texture: 0, u_intensity: intensity, u_offset: [ offsetx, offsety ] });
		this.bind(0);
		var mesh = Mesh.getScreenQuad();
		mesh.bindBuffers( shader );
		shader.bind();

		if(!output_texture)
			output_texture = new GL.Texture( this.width, this.height, this.getProperties() );

		var rot_matrix = GL.temp_mat3;
		for(var i = 0; i < 6; ++i)
		{
			gl.framebufferTexture2D( gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_CUBE_MAP_POSITIVE_X + i, output_texture.handler, 0);
			var face_info = GL.Texture.cubemap_camera_parameters[ i ];
			mat3.identity(rot_matrix);
			rot_matrix.set( face_info.right, 0 );
			rot_matrix.set( face_info.up, 3 );
			rot_matrix.set( face_info.dir, 6 );
			//mat3.invert(rot_matrix,rot_matrix);
			shader._setUniform( "u_rotation", rot_matrix );
			gl.drawArrays( gl.TRIANGLES, 0, 6 );
		}

		mesh.unbindBuffers( shader );
		result_texture = output_texture;
	}

	//restore previous state
	gl.setViewport(viewport); //restore viewport
	gl.bindFramebuffer( gl.FRAMEBUFFER, current_fbo ); //restore fbo

	output_texture.data = null;

	//generate mipmaps when needed
	if (output_texture.minFilter && output_texture.minFilter != gl.NEAREST && output_texture.minFilter != gl.LINEAR) {
		output_texture.bind();
		gl.generateMipmap(output_texture.texture_type);
		output_texture.has_mipmaps = true;
	}

	gl.bindTexture(output_texture.texture_type, null); //disable
	return result_texture;
}


/**
* Loads and uploads a texture from a url
* @method Texture.fromURL
* @param {String} url
* @param {Object} options
* @param {Function} on_complete
* @return {Texture} the texture
*/
Texture.fromURL = function( url, options, on_complete, gl ) {
	gl = gl || global.gl;

	options = options || {};
	options = Object.create(options); //creates a new options using the old one as prototype

	var texture = options.texture || new GL.Texture(1, 1, options, gl);

	if(url.length < 64)
		texture.url = url;
	texture.bind();
	var default_color = options.temp_color || Texture.loading_color;
	//Texture.setUploadOptions(options);
	gl.pixelStorei(gl.UNPACK_ALIGNMENT, 4);
	var temp_color = options.type == gl.FLOAT ? new Float32Array(default_color) : new Uint8Array(default_color);
	gl.texImage2D( gl.TEXTURE_2D, 0, texture.format, texture.width, texture.height, 0, texture.format, texture.type, temp_color );
	gl.bindTexture( texture.texture_type, null ); //disable
	texture.ready = false;

	var ext = null;
	if( options.extension ) //to force format
		ext = options.extension;

	if(!ext && url.length < 512) //avoid base64 urls
	{
		var base = url;
		var pos = url.indexOf("?");
		if(pos != -1)
			base = url.substr(0,pos);
		pos = base.lastIndexOf(".");
		if(pos != -1)
			ext = base.substr(pos+1).toLowerCase();
	}

	if( ext == "dds")
	{
		var ext = gl.getExtension("WEBKIT_WEBGL_compressed_texture_s3tc") || gl.getExtension("WEBGL_compressed_texture_s3tc");
		var new_texture = new GL.Texture(0,0, options, gl);
		DDS.loadDDSTextureEx(gl, ext, url, new_texture.handler, true, function(t) {
			texture.texture_type = t.texture_type;
			texture.handler = t;
			delete texture["ready"]; //texture.ready = true;
			if(on_complete)
				on_complete(texture, url);
		});
	}
	else if( ext == "tga" )
	{
		HttpRequest( url, null, function(data) {
			var img_data = GL.Texture.parseTGA(data);
			if(!img_data)
				return;
			options.texture = texture;
			texture = GL.Texture.fromMemory( img_data.width, img_data.height, img_data.pixels, options );
			delete texture["ready"]; //texture.ready = true;
			if(on_complete)
				on_complete( texture, url );
		},null,{ binary: true });
	}
	else //png,jpg,webp,...
	{
		var image = new Image();
		image.src = url;
		var that = this;
		image.onload = function()
		{
			options.texture = texture;
			GL.Texture.fromImage(this, options);
			delete texture["ready"]; //texture.ready = true;
			if(on_complete)
				on_complete(texture, url);
		}
		image.onerror = function()
		{
			if(on_complete)
				on_complete(null);
		}
	}

	return texture;
};

Texture.parseTGA = function(data)
{
	if(!data || data.constructor !== ArrayBuffer)
		throw( "TGA: data must be ArrayBuffer");
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
	if(	(header[5] & (1<<4)) == 0) //hack, needs swap
	{
		//TGA comes in BGR format so we swap it, this is slooooow
		for(var i = 0; i < img.imageSize; i+= img.bytesPerPixel)
		{
			var temp = img.pixels[i];
			img.pixels[i] = img.pixels[i+2];
			img.pixels[i+2] = temp;
		}
		header[5] |= 1<<4; //mark as swaped
		img.format = img.bpp == 32 ? "RGBA" : "RGB";
	}
	else
		img.format = img.bpp == 32 ? "RGBA" : "RGB";
	//some extra bytes to avoid alignment problems
	//img.pixels = new Uint8Array( img.imageSize + 14);
	//img.pixels.set( data.subarray(18,18+img.imageSize), 0);
	img.flipY = true;
	//img.format = img.bpp == 32 ? "BGRA" : "BGR";
	//trace("TGA info: " + img.width + "x" + img.height );
	return img;
}

/**
* Create a texture from an Image
* @method Texture.fromImage
* @param {Image} image
* @param {Object} options
* @return {Texture} the texture
*/
Texture.fromImage = function( image, options ) {
	options = options || {};

	var texture = options.texture || new GL.Texture( image.width, image.height, options);
	texture.uploadImage( image, options );

	texture.bind();
	gl.texParameteri(texture.texture_type, gl.TEXTURE_MAG_FILTER, texture.magFilter );
	gl.texParameteri(texture.texture_type, gl.TEXTURE_MIN_FILTER, texture.minFilter );
	gl.texParameteri(texture.texture_type, gl.TEXTURE_WRAP_S, texture.wrapS );
	gl.texParameteri(texture.texture_type, gl.TEXTURE_WRAP_T, texture.wrapT );

	if (GL.isPowerOfTwo(texture.width) && GL.isPowerOfTwo(texture.height) )
	{
		if( options.minFilter && options.minFilter != gl.NEAREST && options.minFilter != gl.LINEAR)
		{
			texture.bind();
			gl.generateMipmap(texture.texture_type);
			texture.has_mipmaps = true;
		}
	}
	else
	{
		//no mipmaps supported
		gl.texParameteri(texture.texture_type, gl.TEXTURE_MIN_FILTER, GL.LINEAR );
		gl.texParameteri(texture.texture_type, gl.TEXTURE_WRAP_S, GL.CLAMP_TO_EDGE );
		gl.texParameteri(texture.texture_type, gl.TEXTURE_WRAP_T, GL.CLAMP_TO_EDGE );
		texture.has_mipmaps = false;
	}
	gl.bindTexture(texture.texture_type, null); //disable
	texture.data = image;
	if(options.keep_image)
		texture.img = image;
	return texture;
};

/**
* Create a texture from a Video
* @method Texture.fromVideo
* @param {Video} video
* @param {Object} options
* @return {Texture} the texture
*/
Texture.fromVideo = function(video, options) {
	options = options || {};

	var texture = options.texture || new GL.Texture(video.videoWidth, video.videoHeight, options);
	texture.bind();
	texture.uploadImage( video, options );
	if (options.minFilter && options.minFilter != gl.NEAREST && options.minFilter != gl.LINEAR) {
		texture.bind();
		gl.generateMipmap(texture.texture_type);
		texture.has_mipmaps = true;
		texture.data = video;
	}
	gl.bindTexture(texture.texture_type, null); //disable
	return texture;
};

/**
* Create a clone of a texture
* @method Texture.fromTexture
* @param {Texture} old_texture
* @param {Object} options
* @return {Texture} the texture
*/
Texture.fromTexture = function( old_texture, options) {
	options = options || {};
	var texture = new GL.Texture( old_texture.width, old_texture.height, options );
	old_texture.copyTo( texture );
	return texture;
};

Texture.prototype.clone = function( options )
{
	var old_options = this.getProperties();
	if(options)
		for(var i in options)
			old_options[i] = options[i];
	return Texture.fromTexture( this, old_options);
}

/**
* Create a texture from an ArrayBuffer containing the pixels
* @method Texture.fromTexture
* @param {number} width
* @param {number} height
* @param {ArrayBuffer} pixels
* @param {Object} options
* @return {Texture} the texture
*/
Texture.fromMemory = function( width, height, pixels, options) //format in options as format
{
	options = options || {};

	var texture = options.texture || new GL.Texture(width, height, options);
	Texture.setUploadOptions(options);
	texture.bind();

	try {
		gl.texImage2D( gl.TEXTURE_2D, 0, texture.format, width, height, 0, texture.format, texture.type, pixels );
		texture.width = width;
		texture.height = height;
		texture.data = pixels;
	} catch (e) {
		if (location.protocol == 'file:') {
		  throw 'image not loaded for security reasons (serve this page over "http://" instead)';
		} else {
		  throw 'image not loaded for security reasons (image must originate from the same ' +
			'domain as this page or use Cross-Origin Resource Sharing)';
		}
	}
	if (options.minFilter && options.minFilter != gl.NEAREST && options.minFilter != gl.LINEAR) {
		gl.generateMipmap(gl.TEXTURE_2D);
		texture.has_mipmaps = true;
	}
	gl.bindTexture(texture.texture_type, null); //disable
	return texture;
};

/**
* Create a texture from an ArrayBuffer containing the pixels
* @method Texture.fromDDSInMemory
* @param {ArrayBuffer} DDS data
* @param {Object} options
* @return {Texture} the texture
*/
Texture.fromDDSInMemory = function(data, options) //format in options as format
{
	options = options || {};

	var texture = options.texture || new GL.Texture(0, 0, options);
	GL.Texture.setUploadOptions(options);
	texture.bind();

	var ext = gl.getExtension("WEBKIT_WEBGL_compressed_texture_s3tc") || gl.getExtension("WEBGL_compressed_texture_s3tc");
	DDS.loadDDSTextureFromMemoryEx(gl, ext, data, texture, true );

	gl.bindTexture(texture.texture_type, null); //disable
	return texture;
};

/**
* Create a generative texture from a shader ( must GL.Shader.getScreenShader as reference for the shader )
* @method Texture.fromShader
* @param {number} width
* @param {number} height
* @param {Shader} shader
* @param {Object} options
* @return {Texture} the texture
*/
Texture.fromShader = function(width, height, shader, options) {
	options = options || {};
	
	var texture = new GL.Texture( width, height, options );
	//copy content
	texture.drawTo(function() {
		gl.disable( gl.BLEND ); 
		gl.disable( gl.DEPTH_TEST );
		gl.disable( gl.CULL_FACE );
		var mesh = Mesh.getScreenQuad();
		shader.draw( mesh );
	});

	return texture;
};

/**
* Create a cubemap texture from a set of 6 images
* @method Texture.cubemapFromImages
* @param {Array} images
* @param {Object} options
* @return {Texture} the texture
*/
Texture.cubemapFromImages = function(images, options) {
	options = options || {};
	if(images.length != 6)
		throw "missing images to create cubemap";

	var width = images[0].width;
	var height = images[0].height;
	options.texture_type = gl.TEXTURE_CUBE_MAP;

	var texture = null;
	
	if(options.texture)
	{
		texture = options.texture;
		texture.width = width;
		texture.height = height;
	}
	else
		texture = new GL.Texture( width, height, options );

	Texture.setUploadOptions(options);
	texture.bind();

	try {

		for(var i = 0; i < 6; i++)
			gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_X+i, 0, texture.format, texture.format, texture.type, images[i]);
		texture.data = images;
	} catch (e) {
		if (location.protocol == 'file:') {
		  throw 'image not loaded for security reasons (serve this page over "http://" instead)';
		} else {
		  throw 'image not loaded for security reasons (image must originate from the same ' +
			'domain as this page or use Cross-Origin Resource Sharing)';
		}
	}
	if (options.minFilter && options.minFilter != gl.NEAREST && options.minFilter != gl.LINEAR) {
		gl.generateMipmap(gl.TEXTURE_CUBE_MAP);
		texture.has_mipmaps = true;
	}

	texture.unbind();
	return texture;
};

/**
* Create a cubemap texture from a single image that contains all six images 
* If it is a cross, it must be horizontally aligned, and options.is_cross must be equal to the column where the top and bottom are located (usually 1 or 2)
* otherwise it assumes the 6 images are arranged vertically, in the order of OpenGL: +X, -X, +Y, -Y, +Z, -Z
* @method Texture.cubemapFromImage
* @param {Image} image
* @param {Object} options
* @return {Texture} the texture
*/
Texture.cubemapFromImage = function( image, options ) {
	options = options || {};

	if(image.width != (image.height / 6) && image.height % 6 != 0 && !options.faces)
	{
		console.error( "Cubemap image not valid, only 1x6 (vertical) or 6x3 (cross) formats. Check size:", image.width, image.height );
		return null;
	}

	var width = image.width;
	var height = image.height;
	
	if(options.is_cross !== undefined)
	{
		options.faces = Texture.generateCubemapCrossFacesInfo(image.width, options.is_cross);
		width = height = image.width / 4;
	}
	else if(options.faces)
	{
		width = options.width || options.faces[0].width;
		height = options.height || options.faces[0].height;
	}
	else
		height /= 6;

	if(width != height)
	{
		console.log("Texture not valid, width and height for every face must be square");
		return null;
	}

	var size = width;
	options.no_flip = true;

	var images = [];
	for(var i = 0; i < 6; i++)
	{
		var canvas = createCanvas( size, size );
		var ctx = canvas.getContext("2d");
		if(options.faces)
			ctx.drawImage(image, options.faces[i].x, options.faces[i].y, options.faces[i].width || size, options.faces[i].height || size, 0,0, size, size );
		else
			ctx.drawImage(image, 0, height*i, width, height, 0,0, size, size );
		images.push(canvas);
		//document.body.appendChild(canvas); //debug
	}

	var texture = Texture.cubemapFromImages(images, options);
	if(options.keep_image)
		texture.img = image;
	return texture;
};

/**
* Given the width and the height of an image, and in which column is the top and bottom sides of the cubemap, it gets the info to pass to Texture.cubemapFromImage in options.faces
* @method Texture.generateCubemapCrossFaces
* @param {number} width of the CROSS image (not the side image)
* @param {number} column the column where the top and the bottom is located
* @return {Object} object to pass to Texture.cubemapFromImage in options.faces
*/
Texture.generateCubemapCrossFacesInfo = function(width, column)
{
	if(column === undefined)
		column = 1;
	var s = width / 4;

	return [
		{ x: 2*s, y: s, width: s, height: s }, //+x
		{ x: 0, y: s, width: s, height: s }, //-x
		{ x: column*s, y: 0, width: s, height: s }, //+y
		{ x: column*s, y: 2*s, width: s, height: s }, //-y
		{ x: s, y: s, width: s, height: s }, //+z
		{ x: 3*s, y: s, width: s, height: s } //-z
	];
}

/**
* Create a cubemap texture from a single image url that contains the six images
* if it is a cross, it must be horizontally aligned, and options.is_cross must be equal to the column where the top and bottom are located (usually 1 or 2)
* otherwise it assumes the 6 images are arranged vertically.
* @method Texture.cubemapFromURL
* @param {Image} image
* @param {Object} options
* @param {Function} on_complete callback
* @return {Texture} the texture
*/
Texture.cubemapFromURL = function(url, options, on_complete) {
	options = options || {};
	options.texture_type = gl.TEXTURE_CUBE_MAP;
	var texture = options.texture || new GL.Texture(1, 1, options);
	options = Object.create(options); //creates a new options using the old one as prototype

	texture.bind();
	Texture.setUploadOptions(options);
	var default_color = options.temp_color || [0,0,0,255];
	var temp_color = options.type == gl.FLOAT ? new Float32Array(default_color) : new Uint8Array(default_color);

	for(var i = 0; i < 6; i++)
		gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_X+i, 0, texture.format, 1, 1, 0, texture.format, texture.type, temp_color);
	gl.bindTexture(texture.texture_type, null); //disable
	texture.ready = false;

	var image = new Image();
	image.src = url;
	var that = this;
	image.onload = function()
	{
		options.texture = texture;
		texture = GL.Texture.cubemapFromImage(this, options);
		if(texture)
			delete texture["ready"]; //texture.ready = true;
		if(on_complete)
			on_complete(texture);
	}

	return texture;	
};

/**
* returns an ArrayBuffer with the pixels in the texture, they are fliped in Y
* @method getPixels
* @param {enum} type gl.UNSIGNED_BYTE or gl.FLOAT, if omited then the one in the texture is read
* @param {bool} force_rgba if yo want to force the output to have 4 components per pixel (useful to transfer to canvas)
* @return {ArrayBuffer} the data ( Uint8Array or Float32Array )
*/
Texture.prototype.getPixels = function( type, force_rgba, cubemap_face )
{
	var gl = this.gl;
	var v = gl.getViewport();
	var old_fbo = gl.getParameter( gl.FRAMEBUFFER_BINDING );

	type = type || this.type;

	if(this.format == gl.DEPTH_COMPONENT)
		throw("cannot use getPixels in depth textures");

	gl.disable( gl.DEPTH_TEST );

	//reuse fbo
	var fbo = gl.__copy_fbo;
	if(!fbo)
		fbo = gl.__copy_fbo = gl.createFramebuffer();
	gl.bindFramebuffer( gl.FRAMEBUFFER, fbo );

	var buffer = null;

	gl.viewport(0, 0, this.width, this.height);

	if(this.texture_type == gl.TEXTURE_2D)
		gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.handler, 0);
	else if(this.texture_type == gl.TEXTURE_CUBE_MAP)
		gl.framebufferTexture2D( gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_CUBE_MAP_POSITIVE_X + (cubemap_face || 0), this.handler, 0);

	var channels = this.format == gl.RGB ? 3 : 4;
	if(force_rgba)
		channels = 4;
	channels = 4; //WEBGL DOES NOT SUPPORT READING 3 CHANNELS ONLY, YET...
	//type = gl.UNSIGNED_BYTE; //WEBGL DOES NOT SUPPORT READING FLOAT seems, YET...

	if(type == gl.UNSIGNED_BYTE)
		buffer = new Uint8Array( this.width * this.height * channels );
	else //half float and float forced to float
		buffer = new Float32Array( this.width * this.height * channels );

	gl.readPixels( 0,0, this.width, this.height, channels == 3 ? gl.RGB : gl.RGBA, type, buffer ); //NOT SUPPORTED FLOAT or RGB BY WEBGL YET

	//restore
	gl.bindFramebuffer(gl.FRAMEBUFFER, old_fbo );
	gl.viewport(v[0], v[1], v[2], v[3]);
	return buffer;
}


/**
* Copy texture content to a canvas
* @method toCanvas
* @param {Canvas} canvas must have the same size, if different the canvas will be resized
* @param {boolean} flip_y optional, flip vertically
* @param {Number} max_size optional, if it is supplied the canvas wont be bigger of max_size (the image will be scaled down)
*/
Texture.prototype.toCanvas = function( canvas, flip_y, max_size )
{
	max_size = max_size || 8192;
	var gl = this.gl;

	var w = Math.min( this.width, max_size );
	var h = Math.min( this.height, max_size );

	//cross
	if(this.texture_type == gl.TEXTURE_CUBE_MAP)
	{
		w = w * 4;
		h = h * 3;
	}

	canvas = canvas || createCanvas( w, h );
	if(canvas.width != w) 
		canvas.width = w;
	if(canvas.height != h)
		canvas.height = h;

	var buffer = null;
	if(this.texture_type == gl.TEXTURE_2D )
	{
		if(this.width != w || this.height != h ) //resize image to fit the canvas
		{
			//create a temporary texture
			var temp = new GL.Texture(w,h,{ format: gl.RGBA, filter: gl.NEAREST });
			this.copyTo( temp );	
			buffer = temp.getPixels( gl.UNSIGNED_BYTE, true );
		}
		else
			buffer = this.getPixels( gl.UNSIGNED_BYTE, true );

		var ctx = canvas.getContext("2d");
		var pixels = ctx.getImageData(0,0,w,h);
		pixels.data.set( buffer );
		ctx.putImageData(pixels,0,0);

		if(flip_y)
		{
			var temp = createCanvas(w,h);
			var temp_ctx = temp.getContext("2d");
			temp_ctx.translate(0,temp.height);
			temp_ctx.scale(1,-1);
			temp_ctx.drawImage( canvas, 0, 0, temp.width, temp.height );
			ctx.drawImage( temp, 0, 0 );
		}
	}
	else if(this.texture_type == gl.TEXTURE_CUBE_MAP )
	{
		var temp_canvas = createCanvas( this.width, this.height );
		var temp_ctx = temp_canvas.getContext("2d");
		var info = GL.Texture.generateCubemapCrossFacesInfo( canvas.width, 1 );
		var ctx = canvas.getContext("2d");
		ctx.fillStyle = "black";
		ctx.fillRect(0,0,canvas.width, canvas.height );

		for(var i = 0; i < 6; i++)
		{
			buffer = this.getPixels( gl.UNSIGNED_BYTE, true, i );
			var pixels = temp_ctx.getImageData(0,0, temp_canvas.width, temp_canvas.height );
			pixels.data.set( buffer );
			temp_ctx.putImageData(pixels,0,0);
			ctx.drawImage( temp_canvas, info[i].x, info[i].y, temp_canvas.width, temp_canvas.height );
		}
	}

	return canvas;
}


/**
* returns the texture file in binary format 
* @method toBinary
* @return {ArrayBuffer} the arraybuffer of the file containing the image
*/
Texture.binary_extension = "png";
Texture.prototype.toBinary = function(flip_y, type)
{
	//dump to canvas
	var canvas = this.toCanvas(null,flip_y);
	//use the slow method (because its sync)
	var data = canvas.toDataURL( type );
	var index = data.indexOf(",");
	var base64_data = data.substr(index+1);
	var binStr = atob( base64_data );
	var len = binStr.length,
	arr = new Uint8Array(len);
	for (var i=0; i<len; ++i ) {
		arr[i] = binStr.charCodeAt(i);
	}
	return arr;
}

/**
* returns a Blob containing all the data from the texture
* @method toBlob
* @return {Blob} the blob containing the data
*/
Texture.prototype.toBlob = function(flip_y, type)
{
	var arr = this.toBinary( flip_y );
	var blob = new Blob( [arr], {type: type || 'image/png'} );
	return blob;
}

//faster depending on the browser
Texture.prototype.toBlobAsync = function(flip_y, type, callback)
{
	//dump to canvas
	var canvas = this.toCanvas(null,flip_y);

	//some browser support a fast way to blob a canvas
	if(canvas.toBlob)
	{
		canvas.toBlob( callback, type );
		return;
	}

	//use the slow method
	var blob = this.toBlob( flip_y, type );
	if(callback)
		callback(blob);
}


/**
* returns a base64 String containing all the data from the texture
* @method toBase64
* @param {boolean} flip_y if you want to flip vertically the image, WebGL saves the images upside down
* @return {String} the data in base64 format
*/
Texture.prototype.toBase64 = function( flip_y )
{
	var w = this.width;
	var h = this.height;

	//Read pixels form WebGL
	var buffer = this.getPixels();

	//dump to canvas so we can encode it
	var canvas = createCanvas(w,h);
	var ctx = canvas.getContext("2d");
	var pixels = ctx.getImageData(0,0,w,h);
	pixels.data.set( buffer );
	ctx.putImageData(pixels,0,0);

	if(flip_y)
	{
		var temp_canvas = createCanvas(w,h);
		var temp_ctx = temp_canvas.getContext("2d");
		temp_ctx.translate(0,h);
		temp_ctx.scale(1,-1);
		temp_ctx.drawImage( canvas, 0, 0);
		canvas = temp_canvas;
	}

	//create an image
	var img = canvas.toDataURL("image/png"); //base64 string
	return img;
}

/**
* generates some basic metadata about the image
* @method generateMetadata
* @return {Object}
*/
Texture.prototype.generateMetadata = function()
{
	var metadata = {};
	metadata.width = this.width;
	metadata.height = this.height;
	this.metadata = metadata;
}

Texture.compareFormats = function(a,b)
{
	if(!a || !b) 
		return false;
	if(a == b) 
		return true;

	if( a.width != b.width || 
		a.height != b.height || 
		a.type != b.type || //gl.UNSIGNED_BYTE
		a.format != b.format || //gl.RGB
		a.texture_type != b.texture_type) //gl.TEXTURE_2D
		return false;
	return true;
}

/**
* blends texture A and B and stores the result in OUT
* @method blend
* @param {Texture} a
* @param {Texture} b
* @param {Texture} out [optional]
* @return {Object}
*/
Texture.blend = function( a, b, factor, out )
{
	if(!a || !b) 
		return false;
	if(a == b) 
	{
		if(out)
			a.copyTo(out);
		else
			a.toViewport();
		return true;
	}

	gl.disable( gl.BLEND );
	gl.disable( gl.DEPTH_TEST );
	gl.disable( gl.CULL_FACE );

	var shader = GL.Shader.getBlendShader();
	var mesh = GL.Mesh.getScreenQuad();
	b.bind(1);
	shader.uniforms({u_texture: 0, u_texture2: 1, u_factor: factor});

	if(out)
	{
		out.drawTo( function(){
			if(a == out || b == out)
				throw("Blend output cannot be the same as the input");
			a.bind(0);
			shader.draw( mesh, gl.TRIANGLES );
		});
		return true;
	}

	a.bind(0);
	shader.draw( mesh, gl.TRIANGLES );
	return true;
}


/**
* returns a white texture of 1x1 pixel 
* @method Texture.getWhiteTexture
* @return {Texture} the white texture
*/
Texture.getWhiteTexture = function( gl )
{
	gl = gl || global.gl;
	var tex = gl.textures[":white"];
	if(tex)
		return tex;

	var color = new Uint8Array([255,255,255,255]);
	return gl.textures[":white"] = new GL.Texture(1,1,{ pixel_data: color });
}

/**
* returns a black texture of 1x1 pixel 
* @method Texture.getBlackTexture
* @return {Texture} the black texture
*/
Texture.getBlackTexture = function( gl )
{
	gl = gl || global.gl;
	var tex = gl.textures[":black"];
	if(tex)
		return tex;
	var color = new Uint8Array([0,0,0,255]);
	return gl.textures[":black"] = new GL.Texture(1,1,{ pixel_data: color });
}


/**
* Returns a texture from the texture pool, if none matches the specifications it creates one
* @method Texture.getTemporary
* @param {Number} width the texture width
* @param {Number} height the texture height
* @param {Object} options to specifiy texture_type,type,format
* @param {WebGLContext} gl [optional]
* @return {Texture} the textures that matches this settings
*/
Texture.getTemporary = function( width, height, options, gl )
{
	gl = gl || global.gl;

	if(!gl._texture_pool)
		gl._texture_pool = [];

	var result = null;

	var texture_type = GL.TEXTURE_2D;
	var type = Texture.DEFAULT_TYPE;
	var format = Texture.DEFAULT_FORMAT;

	if(options)
	{
		if(options.texture_type)
			texture_type = options.texture_type;
		if(options.type)
			type = options.type;
		if(options.format)
			format = options.format;
	}

	// 64bits key: 0x0000 type width height
	var key = (type&0xFFFF) + ((width&0xFFFF)<<16) + ((height&0xFFFF)<<32);

	//iterate
	var pool = gl._texture_pool;
	for(var i = 0; i < pool.length; ++i)
	{
		var tex = pool[i];
		if( tex._key != key || tex.texture_type != texture_type || tex.format != format )
			continue;
		pool.splice(i,1); //remove from the pool
		tex._pool = 0;
		return tex;
	}

	//not found, create it
	var tex = new GL.Texture( width, height, { type: type, texture_type: texture_type, format: format });
	tex._key = key;
	tex._pool = 0;
	return tex;
}

/**
* Given a texture it adds it to the texture pool so it can be reused in the future
* @method Texture.releaseTemporary
* @param {GL.Texture} tex
* @param {WebGLContext} gl [optional]
*/

Texture.releaseTemporary = function( tex, gl )
{
	gl = gl || global.gl;

	if(!gl._texture_pool)
		gl._texture_pool = [];

	//if pool is greater than zero means this texture is already inside
	if( tex._pool > 0 )
		console.warn("this texture is already in the textures pool");

	var pool = gl._texture_pool;
	if(!pool)
		pool = gl._texture_pool = [];
	tex._pool = getTime();
	pool.push( tex );

	//do not store too much textures in the textures pool
	if( pool.length > 15 )
	{
		pool.sort( function(a,b) { return b._pool - a._pool } ); //sort by time
		//pool.sort( function(a,b) { return a._key - b._key } ); //sort by size
		var tex = pool.pop(); //free the last one
		tex._pool = 0;
		tex.delete();
	}
}

//returns the next power of two bigger than size
Texture.nextPOT = function( size )
{
	return Math.pow( 2, Math.ceil( Math.log(size) / Math.log(2) ) );
}

/** 
* FBO for FrameBufferObjects, FBOs are used to store the render inside one or several textures 
* Supports multibuffer and depthbuffer texture, useful for deferred rendering
* @namespace GL
* @class FBO
* @param {Array} color_textures an array containing the color textures, if not supplied a render buffer will be used
* @param {GL.Texture} depth_texture the depth texture, if not supplied a render buffer will be used
* @param {Bool} stencil create a stencil buffer?
* @constructor
*/
function FBO( textures, depth_texture, stencil, gl )
{
	gl = gl || global.gl;
	this.gl = gl;
	this._context_id = gl.context_id; 

	if(textures && textures.constructor !== Array)
		throw("FBO textures must be an Array");

	this.handler = null;
	this.width = -1;
	this.height = -1;
	this.color_textures = [];
	this.depth_texture = null;
	this.stencil = !!stencil;

	this._stencil_enabled = false;
	this._num_binded_textures = 0;

	//assign textures
	if((textures && textures.length) || depth_texture)
		this.setTextures( textures, depth_texture );

	//save state
	this._old_fbo_handler = null;
	this._old_viewport = new Float32Array(4);
}

GL.FBO = FBO;

/**
* Changes the textures binded to this FBO
* @method setTextures
* @param {Array} color_textures an array containing the color textures, if not supplied a render buffer will be used
* @param {GL.Texture} depth_texture the depth texture, if not supplied a render buffer will be used
* @param {Boolean} skip_disable it doenst try to go back to the previous FBO enabled in case there was one
*/
FBO.prototype.setTextures = function( color_textures, depth_texture, skip_disable )
{
	//test depth
	if( depth_texture && depth_texture.constructor === GL.Texture )
	{
		if( depth_texture.format !== GL.DEPTH_COMPONENT && 
			depth_texture.format !== GL.DEPTH_STENCIL && 
			depth_texture.format !== GL.DEPTH_COMPONENT16 && 
			depth_texture.format !== GL.DEPTH_COMPONENT24 &&
			depth_texture.format !== GL.DEPTH_COMPONENT32F )
			throw("FBO Depth texture must be of format: gl.DEPTH_COMPONENT, gl.DEPTH_STENCIL or gl.DEPTH_COMPONENT16/24/32F (only in webgl2)");

		if( depth_texture.type != GL.UNSIGNED_SHORT && 
			depth_texture.type != GL.UNSIGNED_INT && 
			depth_texture.type != GL.UNSIGNED_INT_24_8_WEBGL &&
			depth_texture.type != GL.FLOAT)
			throw("FBO Depth texture must be of type: gl.UNSIGNED_SHORT, gl.UNSIGNED_INT, gl.UNSIGNED_INT_24_8_WEBGL");
	}

	//test if is already binded
	var same = this.depth_texture == depth_texture;
	if( same && color_textures )
	{
		if( color_textures.constructor !== Array )
			throw("FBO: color_textures parameter must be an array containing all the textures to be binded in the color");
		if( color_textures.length == this.color_textures.length )
		{
			for(var i = 0; i < color_textures.length; ++i)
				if( color_textures[i] != this.color_textures[i] )
				{
					same = false;
					break;
				}
		}
		else
			same = false;
	}

	if(this._stencil_enabled !== this.stencil)
		same = false;
		
	if(same)
		return;

	//copy textures in place
	this.color_textures.length = color_textures ? color_textures.length : 0;
	if(color_textures)
		for(var i = 0; i < color_textures.length; ++i)
			this.color_textures[i] = color_textures[i];
	this.depth_texture = depth_texture;

	//update GPU FBO
	this.update( skip_disable );
}

/**
* Updates the FBO with the new set of textures and buffers
* @method update
* @param {Boolean} skip_disable it doenst try to go back to the previous FBO enabled in case there was one
*/
FBO.prototype.update = function( skip_disable )
{
	//save state to restore afterwards
	this._old_fbo_handler = gl.getParameter( gl.FRAMEBUFFER_BINDING );

	if(!this.handler)
		this.handler = gl.createFramebuffer();

	var w = -1,
		h = -1,
		type = null;

	var color_textures = this.color_textures;
	var depth_texture = this.depth_texture;

	//compute the W and H (and check they have the same size)
	if(color_textures && color_textures.length)
		for(var i = 0; i < color_textures.length; i++)
		{
			var t = color_textures[i];
			if(t.constructor !== GL.Texture)
				throw("FBO can only bind instances of GL.Texture");
			if(w == -1) 
				w = t.width;
			else if(w != t.width)
				throw("Cannot bind textures with different dimensions");
			if(h == -1) 
				h = t.height;
			else if(h != t.height)
				throw("Cannot bind textures with different dimensions");
			if(type == null) //first one defines the type
				type = t.type;
			else if (type != t.type)
				throw("Cannot bind textures to a FBO with different pixel formats");
			if (t.texture_type != gl.TEXTURE_2D)
				throw("Cannot bind a Cubemap to a FBO");
		}
	else
	{
		w = depth_texture.width;
		h = depth_texture.height;
	}

	this.width = w;
	this.height = h;

	gl.bindFramebuffer( gl.FRAMEBUFFER, this.handler );

	//draw_buffers allow to have more than one color texture binded in a FBO
	var ext = gl.extensions["WEBGL_draw_buffers"];
	if( gl.webgl_version == 1 && !ext && color_textures && color_textures.length > 1)
		throw("Rendering to several textures not supported by your browser");

	var target = gl.webgl_version == 1 ? gl.FRAMEBUFFER : gl.DRAW_FRAMEBUFFER;

	gl.framebufferRenderbuffer( target, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, null );
	gl.framebufferRenderbuffer( target, gl.DEPTH_STENCIL_ATTACHMENT, gl.RENDERBUFFER, null );
	//detach color too?

	//bind a buffer for the depth
	if( depth_texture && depth_texture.constructor === GL.Texture )
	{
		if(gl.webgl_version == 1 && !gl.extensions["WEBGL_depth_texture"] )
			throw("Rendering to depth texture not supported by your browser");

		if(this.stencil && depth_texture.format !== gl.DEPTH_STENCIL )
			console.warn("Stencil cannot be enabled if there is a depth texture with a DEPTH_STENCIL format");

		if( depth_texture.format == gl.DEPTH_STENCIL )
			gl.framebufferTexture2D( target, gl.DEPTH_STENCIL_ATTACHMENT, gl.TEXTURE_2D, depth_texture.handler, 0);
		else
			gl.framebufferTexture2D( target, gl.DEPTH_ATTACHMENT, gl.TEXTURE_2D, depth_texture.handler, 0);
	}
	else //create a renderbuffer to store depth
	{
		var depth_renderbuffer = null;
		
		//allows to reuse a renderbuffer between FBOs
		if( depth_texture && depth_texture.constructor === WebGLRenderbuffer && depth_texture.width == w && depth_texture.height == h ) 
			depth_renderbuffer = this._depth_renderbuffer = depth_texture;
		else
		{
			//create one
			depth_renderbuffer = this._depth_renderbuffer = this._depth_renderbuffer || gl.createRenderbuffer();
			depth_renderbuffer.width = w;
			depth_renderbuffer.height = h;
		}
		
		gl.bindRenderbuffer( gl.RENDERBUFFER, depth_renderbuffer );
		if(this.stencil)
		{
			gl.renderbufferStorage( gl.RENDERBUFFER, gl.DEPTH_STENCIL, w, h );
			gl.framebufferRenderbuffer( target, gl.DEPTH_STENCIL_ATTACHMENT, gl.RENDERBUFFER, depth_renderbuffer );
		}
		else
		{
			gl.renderbufferStorage( gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, w, h );
			gl.framebufferRenderbuffer( target, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, depth_renderbuffer );
		}
	}

	//bind buffers for the colors
	if(color_textures && color_textures.length)
	{
		this.order = []; //draw_buffers request the use of an array with the order of the attachments
		for(var i = 0; i < color_textures.length; i++)
		{
			var t = color_textures[i];

			//not a bug, gl.COLOR_ATTACHMENT0 + i because COLOR_ATTACHMENT is sequential numbers
			gl.framebufferTexture2D( target, gl.COLOR_ATTACHMENT0 + i, gl.TEXTURE_2D, t.handler, 0 );
			this.order.push( gl.COLOR_ATTACHMENT0 + i );
		}
	}
	else //create renderbuffer to store color
	{
		var color_renderbuffer = this._color_renderbuffer = this._color_renderbuffer || gl.createRenderbuffer();
		color_renderbuffer.width = w;
		color_renderbuffer.height = h;
		gl.bindRenderbuffer( gl.RENDERBUFFER, color_renderbuffer );
		gl.renderbufferStorage( gl.RENDERBUFFER, gl.RGBA4, w, h );
		gl.framebufferRenderbuffer( target, gl.COLOR_ATTACHMENT0, gl.RENDERBUFFER, color_renderbuffer );
	}

	//detach old ones (only if is reusing a FBO with a different set of textures)
	var num = color_textures ? color_textures.length : 0;
	for(var i = num; i < this._num_binded_textures; ++i)
		gl.framebufferTexture2D( target, gl.COLOR_ATTACHMENT0 + i, gl.TEXTURE_2D, null, 0);
	this._num_binded_textures = num;

	this._stencil_enabled = this.stencil;

	/* does not work, must be used with the depth_stencil
	if(this.stencil && !depth_texture)
	{
		var stencil_buffer = this._stencil_buffer = this._stencil_buffer || gl.createRenderbuffer();
		stencil_buffer.width = w;
		stencil_buffer.height = h;
		gl.bindRenderbuffer( gl.RENDERBUFFER, stencil_buffer );
		gl.renderbufferStorage( gl.RENDERBUFFER, gl.STENCIL_INDEX8, w, h);
		gl.framebufferRenderbuffer( gl.FRAMEBUFFER, gl.STENCIL_ATTACHMENT, gl.RENDERBUFFER, stencil_buffer );
		this._stencil_enabled = true;
	}
	else
	{
		this._stencil_buffer = null;
		this._stencil_enabled = false;
	}
	*/

	//when using more than one texture you need to use the multidraw extension
	if(color_textures && color_textures.length > 1)
	{
		if( ext )
			ext.drawBuffersWEBGL( this.order );
		else
			gl.drawBuffers( this.order );
	}

	//check completion
	var complete = gl.checkFramebufferStatus( target );
	if(complete !== gl.FRAMEBUFFER_COMPLETE)
		throw("FBO not complete: " + complete);

	//restore state
	gl.bindTexture(gl.TEXTURE_2D, null);
	gl.bindRenderbuffer(gl.RENDERBUFFER, null);
	if(!skip_disable)
		gl.bindFramebuffer( target, this._old_fbo_handler );
}

/**
* Enables this FBO (from now on all the render will be stored in the textures attached to this FBO
* It stores the previous viewport to restore it afterwards, and changes it to full FBO size
* @method bind
* @param {boolean} keep_old keeps the previous FBO is one was attached to restore it afterwards
*/
FBO.prototype.bind = function( keep_old )
{
	if(!this.color_textures.length && !this.depth_texture)
		throw("FBO: no textures attached to FBO");
	this._old_viewport.set( gl.viewport_data );

	if(keep_old)
		this._old_fbo_handler = gl.getParameter( gl.FRAMEBUFFER_BINDING );
	else
		this._old_fbo_handler = null;

	if(this._old_fbo_handler != this.handler )
		gl.bindFramebuffer( gl.FRAMEBUFFER, this.handler );

	//mark them as in use in the FBO
	for(var i = 0; i < this.color_textures.length; ++i)
		this.color_textures[i]._in_current_fbo = true;
	if(this.depth_texture)
		this.depth_texture._in_current_fbo = true;

	gl.viewport( 0,0, this.width, this.height );
}

/**
* Disables this FBO, if it was binded with keep_old then the old FBO is enabled, otherwise it will render to the screen
* Restores viewport to previous
* @method unbind
*/
FBO.prototype.unbind = function()
{
	gl.bindFramebuffer( gl.FRAMEBUFFER, this._old_fbo_handler );
	this._old_fbo_handler = null;
	gl.setViewport( this._old_viewport );

	//mark the textures as no longer in use
	for(var i = 0; i < this.color_textures.length; ++i)
		this.color_textures[i]._in_current_fbo = false;
	if(this.depth_texture)
		this.depth_texture._in_current_fbo = false;
}

//binds another FBO without switch back to previous (faster)
FBO.prototype.switchTo = function( next_fbo )
{
	next_fbo._old_fbo_handler = this._old_fbo_handler;
	next_fbo._old_viewport.set( this._old_viewport );
	gl.bindFramebuffer( gl.FRAMEBUFFER, next_fbo.handler );
	this._old_fbo_handler = null;
	gl.viewport( 0,0, this.width, this.height );

	//mark the textures as no longer in use
	for(var i = 0; i < this.color_textures.length; ++i)
		this.color_textures[i]._in_current_fbo = false;
	if(this.depth_texture)
		this.depth_texture._in_current_fbo = false;

	//mark them as in use in the FBO
	for(var i = 0; i < next_fbo.color_textures.length; ++i)
		next_fbo.color_textures[i]._in_current_fbo = true;
	if(next_fbo.depth_texture)
		next_fbo.depth_texture._in_current_fbo = true;
}

FBO.prototype.delete = function()
{
	gl.deleteFramebuffer( this.handler );
	this.handler = null;
}



/**
* @namespace GL
*/

/**
* Shader class to upload programs to the GPU
* @class Shader
* @constructor
* @param {String} vertexSource (it also allows to pass a compiled vertex shader)
* @param {String} fragmentSource (it also allows to pass a compiled fragment shader)
* @param {Object} macros (optional) precompiler macros to be applied when compiling
*/
global.Shader = GL.Shader = function Shader( vertexSource, fragmentSource, macros )
{
	if(GL.debug)
		console.log("GL.Shader created");

	if( !vertexSource || !fragmentSource )
		throw("GL.Shader source code parameter missing");

	//used to avoid problems with resources moving between different webgl context
	this._context_id = global.gl.context_id; 
	var gl = this.gl = global.gl;

	//expand macros
	var extra_code = Shader.expandMacros( macros );

	var final_vertexSource = vertexSource.constructor === String ? Shader.injectCode( extra_code, vertexSource, gl ) : vertexSource;
	var final_fragmentSource = fragmentSource.constructor === String ? Shader.injectCode( extra_code, fragmentSource, gl ) : fragmentSource;

	this.program = gl.createProgram();

	var vs = vertexSource.constructor === String ? GL.Shader.compileSource( gl.VERTEX_SHADER, final_vertexSource ) : vertexSource;
	var fs = fragmentSource.constructor === String ? GL.Shader.compileSource( gl.FRAGMENT_SHADER, final_fragmentSource ) : fragmentSource;

	gl.attachShader( this.program, vs, gl );
	gl.attachShader( this.program, fs, gl );
	gl.linkProgram(this.program);
	if (!gl.getProgramParameter(this.program, gl.LINK_STATUS)) {
		throw 'link error: ' + gl.getProgramInfoLog(this.program);
	}

	this.vs_shader = vs;
	this.fs_shader = fs;

	//Extract info from the shader
	this.attributes = {}; 
	this.uniformInfo = {};
	this.samplers = {};

	//extract info about the shader to speed up future processes
	this.extractShaderInfo();
}

Shader.expandMacros = function(macros)
{
	var extra_code = ""; //add here preprocessor directives that should be above everything
	if(macros)
		for(var i in macros)
			extra_code += "#define " + i + " " + (macros[i] ? macros[i] : "") + "\n";
	return extra_code;
}

//this is done to avoid problems with the #version which must be in the first line
Shader.injectCode = function( inject_code, code, gl )
{
	var index = code.indexOf("\n");
	var version = ( gl ? "#define WEBGL" + gl.webgl_version + "\n" : "");
	var first_line = code.substr(0,index).trim();
	if( first_line.indexOf("#version") == -1 )
		return version + inject_code + code;
	return first_line + "\n" + version + inject_code + code.substr(index);
}


/**
* Compiles one single shader source (could be gl.VERTEX_SHADER or gl.FRAGMENT_SHADER) and returns the webgl shader handler 
* Used internaly to compile the vertex and fragment shader.
* It throws an exception if there is any error in the code
* @method Shader.compileSource
* @param {Number} type could be gl.VERTEX_SHADER or gl.FRAGMENT_SHADER
* @param {String} source the source file to compile
* @return {WebGLShader} the handler from webgl
*/
Shader.compileSource = function( type, source, gl, shader )
{
	gl = gl || global.gl;
	shader = shader || gl.createShader(type);
	gl.shaderSource(shader, source);
	gl.compileShader(shader);
	if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
		throw (type == gl.VERTEX_SHADER ? "Vertex" : "Fragment") + ' shader compile error: ' + gl.getShaderInfoLog(shader);
	}
	return shader;
}

Shader.parseError = function( error_str, vs_code, fs_code )
{
	if(!error_str)
		return null;

	var t = error_str.split(" ");
	var nums = t[5].split(":");

	return {
		type: t[0],
		line_number: parseInt( nums[1] ),
		line_pos: parseInt( nums[0] ),
		line_code: ( t[0] == "Fragment" ? fs_code : vs_code ).split("\n")[ parseInt( nums[1] ) ],
		err: error_str
	};
}

/**
* It updates the code inside one shader
* @method updateShader
* @param {String} vertexSource 
* @param {String} fragmentSource 
* @param {Object} macros [optional]
*/
Shader.prototype.updateShader = function( vertexSource, fragmentSource, macros )
{
	var gl = this.gl || global.gl;

	//expand macros
	var extra_code = Shader.expandMacros( macros );

	if(this.program)
		this.program = gl.createProgram();

	var extra_code = Shader.expandMacros( macros );

	var final_vertexSource = vertexSource.constructor === String ? Shader.injectCode( extra_code, vertexSource, gl ) : vertexSource;
	var final_fragmentSource = fragmentSource.constructor === String ? Shader.injectCode( extra_code, fragmentSource, gl ) : fragmentSource;

	var vs = vertexSource.constructor === String ? GL.Shader.compileSource( gl.VERTEX_SHADER, final_vertexSource ) : vertexSource;
	var fs = fragmentSource.constructor === String ? GL.Shader.compileSource( gl.FRAGMENT_SHADER, final_fragmentSource ) : fragmentSource;

	gl.attachShader( this.program, vs, gl );
	gl.attachShader( this.program, fs, gl );
	gl.linkProgram( this.program );
	if (!gl.getProgramParameter(this.program, gl.LINK_STATUS)) {
		throw 'link error: ' + gl.getProgramInfoLog( this.program );
	}

	//store shaders separated
	this.vs_shader = vs;
	this.fs_shader = fs;

	//Extract info from the shader
	this.attributes = {}; 
	this.uniformInfo = {};
	this.samplers = {};

	//extract info about the shader to speed up future processes
	this.extractShaderInfo();
}

/**
* It extract all the info about the compiled shader program, all the info about uniforms and attributes.
* This info is stored so it works faster during rendering.
* @method extractShaderInfo
*/
Shader.prototype.extractShaderInfo = function()
{
	var gl = this.gl;
	
	var l = gl.getProgramParameter( this.program, gl.ACTIVE_UNIFORMS );

	//extract uniforms info
	for(var i = 0; i < l; ++i)
	{
		var data = gl.getActiveUniform( this.program, i);
		if(!data) break;

		var uniformName = data.name;

		//arrays have uniformName[0], strip the [] (also data.size tells you if it is an array)
		var pos = uniformName.indexOf("["); 
		if(pos != -1)
		{
			var pos2 = uniformName.indexOf("]."); //leave array of structs though
			if(pos2 == -1)
				uniformName = uniformName.substr(0,pos);
		}

		//store texture samplers
		if(data.type == gl.SAMPLER_2D || data.type == gl.SAMPLER_CUBE)
			this.samplers[ uniformName ] = data.type;
		
		//get which function to call when uploading this uniform
		var func = Shader.getUniformFunc(data);
		var is_matrix = false;
		if(data.type == gl.FLOAT_MAT2 || data.type == gl.FLOAT_MAT3 || data.type == gl.FLOAT_MAT4)
			is_matrix = true;


		//save the info so the user doesnt have to specify types when uploading data to the shader
		this.uniformInfo[ uniformName ] = { type: data.type, func: func, size: data.size, is_matrix: is_matrix, loc: gl.getUniformLocation(this.program, uniformName) };
	}

	//extract attributes info
	for(var i = 0, l = gl.getProgramParameter(this.program, gl.ACTIVE_ATTRIBUTES); i < l; ++i)
	{
		var data = gl.getActiveAttrib( this.program, i);
		if(!data) break;
		var func = Shader.getUniformFunc(data);
		this.uniformInfo[ data.name ] = { 
			type: data.type,
			func: func,
			size: data.size,
			loc: null 
		}; //gl.getAttribLocation( this.program, data.name )
		this.attributes[ data.name ] = gl.getAttribLocation(this.program, data.name );	
	}
}

/**
* Returns if this shader has a uniform with the given name
* @method hasUniform
* @param {String} name name of the uniform
* @return {Boolean}
*/
Shader.prototype.hasUniform = function(name)
{
	return this.uniformInfo[name];
}

/**
* Returns if this shader has an attribute with the given name
* @method hasAttribute
* @param {String} name name of the attribute
* @return {Boolean}
*/
Shader.prototype.hasAttribute = function(name)
{
	return this.attributes[name];
}


/**
* Tells you which function to call when uploading a uniform according to the data type in the shader
* Used internally from extractShaderInfo to optimize calls 
* @method Shader.getUniformFunc
* @param {Object} data info about the uniform
* @return {Function}
*/
Shader.getUniformFunc = function( data )
{
	var func = null;
	switch (data.type)
	{
		case GL.FLOAT: 		
			if(data.size == 1)
				func = gl.uniform1f; 
			else
				func = gl.uniform1fv; 
			break;
		case GL.FLOAT_MAT2: func = gl.uniformMatrix2fv; break;
		case GL.FLOAT_MAT3:	func = gl.uniformMatrix3fv; break;
		case GL.FLOAT_MAT4:	func = gl.uniformMatrix4fv; break;
		case GL.FLOAT_VEC2: func = gl.uniform2fv; break;
		case GL.FLOAT_VEC3: func = gl.uniform3fv; break;
		case GL.FLOAT_VEC4: func = gl.uniform4fv; break;

		case GL.UNSIGNED_INT: 
		case GL.INT: 	  
			if(data.size == 1)
				func = gl.uniform1i; 
			else
				func = gl.uniform1iv; 
			break;
		case GL.INT_VEC2: func = gl.uniform2iv; break;
		case GL.INT_VEC3: func = gl.uniform3iv; break;
		case GL.INT_VEC4: func = gl.uniform4iv; break;

		case GL.SAMPLER_2D:
		case GL.SAMPLER_3D:
		case GL.SAMPLER_CUBE:
			func = gl.uniform1i; break;
		default: func = gl.uniform1f; break;
	}	
	return func;
}

/**
* Create a shader from two urls. While the system is fetching the two urls, the shader contains a dummy shader that renders black.
* @method Shader.fromURL
* @param {String} vs_path the url to the vertex shader
* @param {String} fs_path the url to the fragment shader
* @param {Function} on_complete [Optional] a callback to call once the shader is ready.
* @return {Shader}
*/
Shader.fromURL = function( vs_path, fs_path, on_complete )
{
	//create simple shader first
	var vs_code = "\n\
			precision highp float;\n\
			attribute vec3 a_vertex;\n\
			attribute mat4 u_mvp;\n\
			void main() { \n\
				gl_Position = u_mvp * vec4(a_vertex,1.0); \n\
			}\n\
		";
	var fs_code = "\n\
			precision highp float;\n\
			void main() {\n\
				gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);\n\
			}\n\
			";
	
	var shader = new GL.Shader(vs_code, fs_code);
	shader.ready = false;

	var true_vs = null;
	var true_fs = null;

	HttpRequest( vs_path, null, function(vs_code) {
		true_vs = vs_code;
		if(true_fs)
			compileShader();
	});

	HttpRequest( fs_path, null, function(fs_code) {
		true_fs = fs_code;
		if(true_vs)
			compileShader();
	});

	function compileShader()
	{
		var true_shader = new GL.Shader(true_vs, true_fs);
		for(var i in true_shader)
			shader[i] = true_shader[i];
		shader.ready = true;
	}

	return shader;
}

/**
* enables the shader (calls useProgram)
* @method bind
*/
Shader.prototype.bind = function()
{
	var gl = this.gl;
	gl.useProgram( this.program );
	gl._current_shader = this;
}

/**
* Returns the location of a uniform or attribute
* @method getLocation
* @param {String} name
* @return {WebGLUniformLocation} location
*/
Shader.prototype.getLocation = function( name )
{
	var info = this.uniformInfo[name];
	if(info)
		return this.uniformInfo[name].loc;
	return null;
}

/**
* Uploads a set of uniforms to the Shader. You dont need to specify types, they are infered from the shader info.
* @method uniforms
* @param {Object} uniforms
*/
Shader._temp_uniform = new Float32Array(16);

Shader.prototype.uniforms = function(uniforms) {
	var gl = this.gl;
	gl.useProgram(this.program);
	gl._current_shader = this;

	for (var name in uniforms)
	{
		var info = this.uniformInfo[ name ];
		if (!info)
			continue;
		this._setUniform( name, uniforms[name] );
		//this.setUniform( name, uniforms[name] );
		//this._assing_uniform(uniforms, name, gl );
	}

	return this;
}//uniforms

Shader.prototype.uniformsArray = function(array) {
	var gl = this.gl;
	gl.useProgram( this.program );
	gl._current_shader = this;

	for(var i = 0, l = array.length; i < l; ++i)
	{
		var uniforms = array[i];
		for (var name in uniforms)
			this._setUniform( name, uniforms[name] );
			//this._assing_uniform(uniforms, name, gl );
	}

	return this;
}

/**
* Uploads a uniform to the Shader. You dont need to specify types, they are infered from the shader info. Shader must be binded!
* @method setUniform
* @param {string} name
* @param {*} value
*/
Shader.prototype.setUniform = (function(){
	var temps = [];
	for(var i = 2; i <= 16; ++i)
		temps[i] = new Float32Array(i);

	return (function(name, value)
	{
		if(	this.gl._current_shader != this )
			this.bind();

		var info = this.uniformInfo[name];
		if (!info)
			return;

		if(info.loc === null)
			return;

		if(value == null) //strict?
			return;

		if(value.constructor === Array)
		{
			var v = temps[ value.length ]; //reuse same container
			if(v)
			{
				v.set(value);
				value = v;
			}
			else
				value = new Float32Array( value );  //garbage generated...
		}

		if(info.is_matrix)
			info.func.call( this.gl, info.loc, false, value );
		else
			info.func.call( this.gl, info.loc, value );
	});
})();

//skips enabling shader
Shader.prototype._setUniform = (function(){
	var temps = [];
	for(var i = 2; i <= 16; ++i)
		temps[i] = new Float32Array(i);

	return (function(name, value)
	{
		var info = this.uniformInfo[ name ];
		if (!info)
			return;

		if(info.loc === null)
			return;

		//if(info.loc.constructor !== Function)
		//	return;

		if(value == null) 
			return;

		if(value.constructor === Array)
		{
			var v = temps[ value.length ]; //reuse same container
			if(v)
			{
				v.set(value);
				value = v;
			}
			else
				value = new Float32Array( value );  //garbage generated...
		}

		if(info.is_matrix)
			info.func.call( this.gl, info.loc, false, value );
		else
			info.func.call( this.gl, info.loc, value );
	});
})();

/**
* Renders a mesh using this shader, remember to use the function uniforms before to enable the shader
* @method draw
* @param {Mesh} mesh
* @param {number} mode could be gl.LINES, gl.POINTS, gl.TRIANGLES, gl.TRIANGLE_STRIP, gl.TRIANGLE_FAN
* @param {String} index_buffer_name the name of the index buffer, if not provided triangles will be assumed
*/
Shader.prototype.draw = function(mesh, mode, index_buffer_name ) {
	index_buffer_name = index_buffer_name === undefined ? (mode == gl.LINES ? 'lines' : 'triangles') : index_buffer_name;
	this.drawBuffers(mesh.vertexBuffers,
	  index_buffer_name ? mesh.indexBuffers[ index_buffer_name ] : null,
	  arguments.length < 2 ? gl.TRIANGLES : mode);
}

/**
* Renders a range of a mesh using this shader
* @method drawRange
* @param {Mesh} mesh
* @param {number} mode could be gl.LINES, gl.POINTS, gl.TRIANGLES, gl.TRIANGLE_STRIP, gl.TRIANGLE_FAN
* @param {number} start first primitive to render
* @param {number} length number of primitives to render
* @param {String} index_buffer_name the name of the index buffer, if not provided triangles will be assumed
*/
Shader.prototype.drawRange = function(mesh, mode, start, length, index_buffer_name )
{
	index_buffer_name = index_buffer_name === undefined ? (mode == gl.LINES ? 'lines' : 'triangles') : index_buffer_name;

	this.drawBuffers(mesh.vertexBuffers,
	  index_buffer_name ? mesh.indexBuffers[ index_buffer_name ] : null,
	  mode, start, length);
}

/**
* Renders a range of a mesh using this shader
* @method drawBuffers
* @param {Object} vertexBuffers an object containing all the buffers
* @param {IndexBuffer} indexBuffer
* @param {number} mode could be gl.LINES, gl.POINTS, gl.TRIANGLES, gl.TRIANGLE_STRIP, gl.TRIANGLE_FAN
* @param {number} range_start first primitive to render
* @param {number} range_length number of primitives to render
*/

//this two variables are a hack to avoid memory allocation on drawCalls
var temp_attribs_array = new Uint8Array(16);
var temp_attribs_array_zero = new Uint8Array(16); //should be filled with zeros always

Shader.prototype.drawBuffers = function( vertexBuffers, indexBuffer, mode, range_start, range_length )
{
	if(range_length == 0)
		return;

	var gl = this.gl;

	gl.useProgram(this.program); //this could be removed assuming every shader is called with some uniforms 

	// enable attributes as necessary.
	var length = 0;
	var attribs_in_use = temp_attribs_array; //hack to avoid garbage
	attribs_in_use.set( temp_attribs_array_zero ); //reset

	for (var name in vertexBuffers)
	{
		var buffer = vertexBuffers[name];
		var attribute = buffer.attribute || name;
		//precompute attribute locations in shader
		var location = this.attributes[attribute];// || gl.getAttribLocation(this.program, attribute);

		if (location == null || !buffer.buffer) //-1 changed for null
			continue; //ignore this buffer

		attribs_in_use[location] = 1; //mark it as used

		//this.attributes[attribute] = location;
		gl.bindBuffer(gl.ARRAY_BUFFER, buffer.buffer);
		gl.enableVertexAttribArray(location);

		gl.vertexAttribPointer(location, buffer.buffer.spacing, buffer.buffer.gl_type, false, 0, 0);
		length = buffer.buffer.length / buffer.buffer.spacing;
	}

	//range rendering
	var offset = 0; //in bytes
	if(range_start > 0) //render a polygon range
		offset = range_start; //in bytes (Uint16 == 2 bytes)

	if (indexBuffer)
		length = indexBuffer.buffer.length - offset;

	if(range_length > 0 && range_length < length) //to avoid problems
		length = range_length;

	var BYTES_PER_ELEMENT = (indexBuffer && indexBuffer.data) ? indexBuffer.data.constructor.BYTES_PER_ELEMENT : 1;
	offset *= BYTES_PER_ELEMENT;

	// Force to disable buffers in this shader that are not in this mesh
	for (var attribute in this.attributes)
	{
		var location = this.attributes[attribute];
		if (!(attribs_in_use[location])) {
			gl.disableVertexAttribArray(this.attributes[attribute]);
		}
	}

	// Draw the geometry.
	if (length && (!indexBuffer || indexBuffer.buffer)) {
	  if (indexBuffer) {
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer.buffer);
		gl.drawElements( mode, length, indexBuffer.buffer.gl_type, offset); //gl.UNSIGNED_SHORT
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
	  } else {
		gl.drawArrays(mode, offset, length);
	  }
	}

	return this;
}


/**
* Given a source code with the directive #import it expands it inserting the code using Shader.files to fetch for import files.
* Warning: Imports are evaluated only the first inclusion, the rest are ignored to avoid double inclusion of functions
*          Also, imports cannot have other imports inside.
* @method Shader.expandImports
* @param {String} code the source code
* @param {Object} files [Optional] object with files to import from (otherwise Shader.files is used)
* @return {String} the code with the lines #import removed and replaced by the code
*/
Shader.expandImports = function(code, files)
{
	files = files || Shader.files;

	var already_imported = {}; //avoid to import two times the same code
	if( !files )
		throw("Shader.files not initialized, assign files there");

	var replace_import = function(v)
	{
		var token = v.split("\"");
		var id = token[1];
		if( already_imported[id] )
			return "//already imported: " + id + "\n";
		var file = files[id];
		already_imported[ id ] = true;
		if(file)
			return file + "\n";
		return "//import code not found: " + id + "\n";
	}

	//return code.replace(/#import\s+\"(\w+)\"\s*\n/g, replace_import );
	return code.replace(/#import\s+\"([a-zA-Z0-9_\.]+)\"\s*\n/g, replace_import );
}

Shader.dumpErrorToConsole = function(err, vscode, fscode)
{
	console.error(err);
	var msg = err.msg;
	var code = null;
	if(err.indexOf("Fragment") != -1)
		code = fscode;
	else
		code = vscode;

	var lines = code.split("\n");
	for(var i in lines)
		lines[i] = i + "| " + lines[i];

	console.groupCollapsed("Shader code");
	console.log( lines.join("\n") );
	console.groupEnd();
}

Shader.convertTo100 = function(code,type)
{
	//in VERTEX
		//change in for attribute
		//change out for varying
		//add #extension GL_OES_standard_derivatives
	//in FRAGMENT
		//change in for varying 
		//remove out vec4 _gl_FragColor
		//rename _gl_FragColor for gl_FragColor
	//in both
		//change #version 300 es for #version 100
		//replace 'texture(' for 'texture2D('
}


Shader.convertTo300 = function(code,type)
{
	//in VERTEX
		//change attribute for in
		//change varying for out
		//remove #extension GL_OES_standard_derivatives
	//in FRAGMENT
		//change varying for in
		//rename gl_FragColor for _gl_FragColor
		//rename gl_FragData[0] for _gl_FragColor
		//add out vec4 _gl_FragColor
	//in both
		//replace texture2D for texture
}

//helps to check if a variable value is valid to an specific uniform in a shader
Shader.validateValue = function( value, uniform_info )
{
	if(value === null || value === undefined)
		return false;

	switch (uniform_info.type)
	{
		//used to validate shaders
		case GL.INT: 
		case GL.FLOAT: 
		case GL.SAMPLER_2D: 
		case GL.SAMPLER_CUBE: 
			return isNumber(value);
		case GL.INT_VEC2: 
		case GL.FLOAT_VEC2:
			return value.length === 2;
		case GL.INT_VEC3: 
		case GL.FLOAT_VEC3:
			return value.length === 3;
		case GL.INT_VEC4: 
		case GL.FLOAT_VEC4:
		case GL.FLOAT_MAT2:
			 return value.length === 4;
		case GL.FLOAT_MAT3:
			 return value.length === 8;
		case GL.FLOAT_MAT4:
			 return value.length === 16;
	}
	return true;
}

//**************** SHADERS ***********************************

Shader.SCREEN_VERTEX_SHADER = "\n\
			precision highp float;\n\
			attribute vec3 a_vertex;\n\
			attribute vec2 a_coord;\n\
			varying vec2 v_coord;\n\
			void main() { \n\
				v_coord = a_coord; \n\
				gl_Position = vec4(a_coord * 2.0 - 1.0, 0.0, 1.0); \n\
			}\n\
			";

Shader.SCREEN_FRAGMENT_SHADER = "\n\
			precision highp float;\n\
			uniform sampler2D u_texture;\n\
			varying vec2 v_coord;\n\
			void main() {\n\
				gl_FragColor = texture2D(u_texture, v_coord);\n\
			}\n\
			";

//used in createFX
Shader.SCREEN_FRAGMENT_FX = "\n\
			precision highp float;\n\
			uniform sampler2D u_texture;\n\
			varying vec2 v_coord;\n\
			#ifdef FX_UNIFORMS\n\
				FX_UNIFORMS\n\
			#endif\n\
			void main() {\n\
				vec2 uv = v_coord;\n\
				vec4 color = texture2D(u_texture, uv);\n\
				#ifdef FX_CODE\n\
					FX_CODE ;\n\
				#endif\n\
				gl_FragColor = color;\n\
			}\n\
			";

Shader.SCREEN_COLORED_FRAGMENT_SHADER = "\n\
			precision highp float;\n\
			uniform sampler2D u_texture;\n\
			uniform vec4 u_color;\n\
			varying vec2 v_coord;\n\
			void main() {\n\
				gl_FragColor = u_color * texture2D(u_texture, v_coord);\n\
			}\n\
			";

Shader.BLEND_FRAGMENT_SHADER = "\n\
			precision highp float;\n\
			uniform sampler2D u_texture;\n\
			uniform sampler2D u_texture2;\n\
			uniform float u_factor;\n\
			varying vec2 v_coord;\n\
			void main() {\n\
				gl_FragColor = mix( texture2D(u_texture, v_coord), texture2D(u_texture2, v_coord), u_factor);\n\
			}\n\
			";

Shader.SCREEN_FLAT_FRAGMENT_SHADER = "\n\
			precision highp float;\n\
			uniform vec4 u_color;\n\
			void main() {\n\
				gl_FragColor = u_color;\n\
			}\n\
			";

//used to paint quads
Shader.QUAD_VERTEX_SHADER = "\n\
			precision highp float;\n\
			attribute vec3 a_vertex;\n\
			attribute vec2 a_coord;\n\
			varying vec2 v_coord;\n\
			uniform vec2 u_position;\n\
			uniform vec2 u_size;\n\
			uniform vec2 u_viewport;\n\
			uniform mat3 u_transform;\n\
			void main() { \n\
				vec3 pos = vec3(u_position + vec2(a_coord.x,1.0 - a_coord.y)  * u_size, 1.0);\n\
				v_coord = a_coord; \n\
				pos = u_transform * pos;\n\
				pos.z = 0.0;\n\
				//normalize\n\
				pos.x = (2.0 * pos.x / u_viewport.x) - 1.0;\n\
				pos.y = -((2.0 * pos.y / u_viewport.y) - 1.0);\n\
				gl_Position = vec4(pos, 1.0); \n\
			}\n\
			";

Shader.QUAD_FRAGMENT_SHADER = "\n\
			precision highp float;\n\
			uniform sampler2D u_texture;\n\
			uniform vec4 u_color;\n\
			varying vec2 v_coord;\n\
			void main() {\n\
				gl_FragColor = u_color * texture2D(u_texture, v_coord);\n\
			}\n\
			";

//used to render partially a texture
Shader.QUAD2_FRAGMENT_SHADER = "\n\
			precision highp float;\n\
			uniform sampler2D u_texture;\n\
			uniform vec4 u_color;\n\
			uniform vec4 u_texture_area;\n\
			varying vec2 v_coord;\n\
			void main() {\n\
			    vec2 uv = vec2( mix(u_texture_area.x, u_texture_area.z, v_coord.x), 1.0 - mix(u_texture_area.w, u_texture_area.y, v_coord.y) );\n\
				gl_FragColor = u_color * texture2D(u_texture, uv);\n\
			}\n\
			";

Shader.PRIMITIVE2D_VERTEX_SHADER = "\n\
			precision highp float;\n\
			attribute vec3 a_vertex;\n\
			uniform vec2 u_viewport;\n\
			uniform mat3 u_transform;\n\
			void main() { \n\
				vec3 pos = a_vertex;\n\
				pos = u_transform * pos;\n\
				pos.z = 0.0;\n\
				//normalize\n\
				pos.x = (2.0 * pos.x / u_viewport.x) - 1.0;\n\
				pos.y = -((2.0 * pos.y / u_viewport.y) - 1.0);\n\
				gl_Position = vec4(pos, 1.0); \n\
			}\n\
			";

Shader.FLAT_VERTEX_SHADER = "\n\
			precision highp float;\n\
			attribute vec3 a_vertex;\n\
			uniform mat4 u_mvp;\n\
			void main() { \n\
				gl_Position = u_mvp * vec4(a_vertex,1.0); \n\
			}\n\
			";

Shader.FLAT_FRAGMENT_SHADER = "\n\
			precision highp float;\n\
			uniform vec4 u_color;\n\
			void main() {\n\
				gl_FragColor = u_color;\n\
			}\n\
			";

/**
* Allows to create a simple shader meant to be used to process a texture, instead of having to define the generic Vertex & Fragment Shader code
* @method Shader.createFX
* @param {string} code string containg code, like "color = color * 2.0;"
* @param {string} [uniforms=null] string containg extra uniforms, like "uniform vec3 u_pos;"
*/
Shader.createFX = function(code, uniforms, shader)
{
	//remove comments
	code = GL.Shader.removeComments( code, true ); //remove comments and breaklines to avoid problems with the macros
	var macros = {
		FX_CODE: code,
		FX_UNIFORMS: uniforms || ""
	}
	if(!shader)
		return new GL.Shader( GL.Shader.SCREEN_VERTEX_SHADER, GL.Shader.SCREEN_FRAGMENT_FX, macros );
	shader.updateShader( GL.Shader.SCREEN_VERTEX_SHADER, GL.Shader.SCREEN_FRAGMENT_FX, macros );
	return shader;
}

Shader.removeComments = function(code, one_line)
{
	if(!code)
		return "";

	var rx = /(\/\*([^*]|[\r\n]|(\*+([^*\/]|[\r\n])))*\*+\/)|(\/\/.*)/g;
	var code = code.replace( rx ,"");
	var lines = code.split("\n");
	var result = [];
	for(var i = 0; i < lines.length; ++i)
	{
		var line = lines[i]; 
		var pos = line.indexOf("//");
		if(pos != -1)
			line = lines[i].substr(0,pos);
		line = line.trim();
		if(line.length)
			result.push(line);
	}
	return result.join( one_line ? "" : "\n" );
}

/**
* Renders a fullscreen quad with this shader applied
* @method toViewport
* @param {object} uniforms
*/
Shader.prototype.toViewport = function(uniforms)
{
	var mesh = GL.Mesh.getScreenQuad();
	if(uniforms)
		this.uniforms(uniforms);
	this.draw( mesh );
}

//Now some common shaders everybody needs

/**
* Returns a shader ready to render a textured quad in fullscreen, use with Mesh.getScreenQuad() mesh
* shader params sampler2D u_texture
* @method Shader.getScreenShader
*/
Shader.getScreenShader = function(gl)
{
	gl = gl || global.gl;
	var shader = gl.shaders[":screen"];
	if(shader)
		return shader;
	shader = gl.shaders[":screen"] = new GL.Shader( Shader.SCREEN_VERTEX_SHADER, Shader.SCREEN_FRAGMENT_SHADER );
	return shader.uniforms({u_texture:0}); //do it the first time so I dont have to do it every time
}

/**
* Returns a shader ready to render a colored textured quad in fullscreen, use with Mesh.getScreenQuad() mesh
* shader params vec4 u_color and sampler2D u_texture
* @method Shader.getColoredScreenShader
*/
Shader.getColoredScreenShader = function(gl)
{
	gl = gl || global.gl;
	var shader = gl.shaders[":colored_screen"];
	if(shader)
		return shader;
	shader = gl.shaders[":colored_screen"] = new GL.Shader( Shader.SCREEN_VERTEX_SHADER, Shader.SCREEN_COLORED_FRAGMENT_SHADER );
	return shader.uniforms({u_texture:0, u_color: vec4.fromValues(1,1,1,1) }); //do it the first time so I dont have to do it every time
}

/**
* Returns a shader ready to render a quad with transform, use with Mesh.getScreenQuad() mesh
* shader must have: u_position, u_size, u_viewport, u_transform (mat3)
* @method Shader.getQuadShader
*/
Shader.getQuadShader = function(gl)
{
	gl = gl || global.gl;
	var shader = gl.shaders[":quad"];
	if(shader)
		return shader;
	return gl.shaders[":quad"] = new GL.Shader( Shader.QUAD_VERTEX_SHADER, Shader.QUAD_FRAGMENT_SHADER );
}

/**
* Returns a shader ready to render part of a texture into the viewport
* shader must have: u_position, u_size, u_viewport, u_transform, u_texture_area (vec4)
* @method Shader.getPartialQuadShader
*/
Shader.getPartialQuadShader = function(gl)
{
	gl = gl || global.gl;
	var shader = gl.shaders[":quad2"];
	if(shader)
		return shader;
	return gl.shaders[":quad2"] = new GL.Shader( Shader.QUAD_VERTEX_SHADER, Shader.QUAD2_FRAGMENT_SHADER );
}

/**
* Returns a shader that blends two textures
* shader must have: u_factor, u_texture, u_texture2
* @method Shader.getBlendShader
*/
Shader.getBlendShader = function(gl)
{
	gl = gl || global.gl;
	var shader = gl.shaders[":blend"];
	if(shader)
		return shader;
	return gl.shaders[":blend"] = new GL.Shader( Shader.SCREEN_VERTEX_SHADER, Shader.BLEND_FRAGMENT_SHADER );
}

/**
* Returns a shader used to apply gaussian blur to one texture in one axis (you should use it twice to get a gaussian blur)
* shader params are: vec2 u_offset, float u_intensity
* @method Shader.getBlurShader
*/
Shader.getBlurShader = function(gl)
{
	gl = gl || global.gl;
	var shader = gl.shaders[":blur"];
	if(shader)
		return shader;

	var shader = new GL.Shader( Shader.SCREEN_VERTEX_SHADER,"\n\
			precision highp float;\n\
			varying vec2 v_coord;\n\
			uniform sampler2D u_texture;\n\
			uniform vec2 u_offset;\n\
			uniform float u_intensity;\n\
			void main() {\n\
			   vec4 sum = vec4(0.0);\n\
			   sum += texture2D(u_texture, v_coord + u_offset * -4.0) * 0.05/0.98;\n\
			   sum += texture2D(u_texture, v_coord + u_offset * -3.0) * 0.09/0.98;\n\
			   sum += texture2D(u_texture, v_coord + u_offset * -2.0) * 0.12/0.98;\n\
			   sum += texture2D(u_texture, v_coord + u_offset * -1.0) * 0.15/0.98;\n\
			   sum += texture2D(u_texture, v_coord) * 0.16/0.98;\n\
			   sum += texture2D(u_texture, v_coord + u_offset * 4.0) * 0.05/0.98;\n\
			   sum += texture2D(u_texture, v_coord + u_offset * 3.0) * 0.09/0.98;\n\
			   sum += texture2D(u_texture, v_coord + u_offset * 2.0) * 0.12/0.98;\n\
			   sum += texture2D(u_texture, v_coord + u_offset * 1.0) * 0.15/0.98;\n\
			   gl_FragColor = u_intensity * sum;\n\
			}\n\
			");
	return gl.shaders[":blur"] = shader;
}

//shader to copy a depth texture into another one
Shader.getCopyDepthShader = function(gl)
{
	gl = gl || global.gl;
	var shader = gl.shaders[":copy_depth"];
	if(shader)
		return shader;

	var shader = new GL.Shader( Shader.SCREEN_VERTEX_SHADER,"\n\
			#extension GL_EXT_frag_depth : enable\n\
			precision highp float;\n\
			varying vec2 v_coord;\n\
			uniform sampler2D u_texture;\n\
			void main() {\n\
			   gl_FragDepthEXT = texture2D( u_texture, v_coord ).x;\n\
			   gl_FragColor = vec4(1.0);\n\
			}\n\
			");
	return gl.shaders[":copy_depth"] = shader;
}

//shader to copy a cubemap into another 
Shader.getCubemapCopyShader = function(gl)
{
	gl = gl || global.gl;
	var shader = gl.shaders[":copy_cubemap"];
	if(shader)
		return shader;

	var shader = new GL.Shader( Shader.SCREEN_VERTEX_SHADER,"\n\
			precision highp float;\n\
			varying vec2 v_coord;\n\
			uniform samplerCube u_texture;\n\
			uniform mat3 u_rotation;\n\
			void main() {\n\
				vec2 uv = vec2( v_coord.x, 1.0 - v_coord.y );\n\
				vec3 dir = vec3( uv - vec2(0.5), 0.5 );\n\
				dir = u_rotation * dir;\n\
			   gl_FragColor = textureCube( u_texture, dir );\n\
			}\n\
			");
	return gl.shaders[":copy_cubemap"] = shader;
}

//shader to blur a cubemap
Shader.getCubemapBlurShader = function(gl)
{
	gl = gl || global.gl;
	var shader = gl.shaders[":blur_cubemap"];
	if(shader)
		return shader;

	var shader = new GL.Shader( Shader.SCREEN_VERTEX_SHADER,"\n\
			#ifndef NUM_SAMPLES\n\
				#define NUM_SAMPLES 4\n\
			#endif\n\
			\n\
			precision highp float;\n\
			varying vec2 v_coord;\n\
			uniform samplerCube u_texture;\n\
			uniform mat3 u_rotation;\n\
			uniform vec2 u_offset;\n\
			uniform float u_intensity;\n\
			void main() {\n\
				vec4 sum = vec4(0.0);\n\
				vec2 uv = vec2( v_coord.x, 1.0 - v_coord.y ) - vec2(0.5);\n\
				vec3 dir = vec3(0.0);\n\
				vec4 color = vec4(0.0);\n\
				for( int x = -2; x <= 2; x++ )\n\
				{\n\
					for( int y = -2; y <= 2; y++ )\n\
					{\n\
						dir.xy = uv + vec2( u_offset.x * float(x), u_offset.y * float(y)) * 0.5;\n\
						dir.z = 0.5;\n\
						dir = u_rotation * dir;\n\
						color = textureCube( u_texture, dir );\n\
						color.xyz = color.xyz * color.xyz;/*linearize*/\n\
						sum += color;\n\
					}\n\
				}\n\
				sum /= 25.0;\n\
			   gl_FragColor = vec4( sqrt( sum.xyz ), sum.w ) ;\n\
			}\n\
			");
	return gl.shaders[":blur_cubemap"] = shader;
}

//shader to do FXAA (antialiasing)
Shader.FXAA_FUNC = "\n\
	uniform vec2 u_viewportSize;\n\
	uniform vec2 u_iViewportSize;\n\
	#define FXAA_REDUCE_MIN   (1.0/ 128.0)\n\
	#define FXAA_REDUCE_MUL   (1.0 / 8.0)\n\
	#define FXAA_SPAN_MAX     8.0\n\
	\n\
	/* from mitsuhiko/webgl-meincraft based on the code on geeks3d.com */\n\
	vec4 applyFXAA(sampler2D tex, vec2 fragCoord)\n\
	{\n\
		vec4 color = vec4(0.0);\n\
		/*vec2 u_iViewportSize = vec2(1.0 / u_viewportSize.x, 1.0 / u_viewportSize.y);*/\n\
		vec3 rgbNW = texture2D(tex, (fragCoord + vec2(-1.0, -1.0)) * u_iViewportSize).xyz;\n\
		vec3 rgbNE = texture2D(tex, (fragCoord + vec2(1.0, -1.0)) * u_iViewportSize).xyz;\n\
		vec3 rgbSW = texture2D(tex, (fragCoord + vec2(-1.0, 1.0)) * u_iViewportSize).xyz;\n\
		vec3 rgbSE = texture2D(tex, (fragCoord + vec2(1.0, 1.0)) * u_iViewportSize).xyz;\n\
		vec3 rgbM  = texture2D(tex, fragCoord  * u_iViewportSize).xyz;\n\
		vec3 luma = vec3(0.299, 0.587, 0.114);\n\
		float lumaNW = dot(rgbNW, luma);\n\
		float lumaNE = dot(rgbNE, luma);\n\
		float lumaSW = dot(rgbSW, luma);\n\
		float lumaSE = dot(rgbSE, luma);\n\
		float lumaM  = dot(rgbM,  luma);\n\
		float lumaMin = min(lumaM, min(min(lumaNW, lumaNE), min(lumaSW, lumaSE)));\n\
		float lumaMax = max(lumaM, max(max(lumaNW, lumaNE), max(lumaSW, lumaSE)));\n\
		\n\
		vec2 dir;\n\
		dir.x = -((lumaNW + lumaNE) - (lumaSW + lumaSE));\n\
		dir.y =  ((lumaNW + lumaSW) - (lumaNE + lumaSE));\n\
		\n\
		float dirReduce = max((lumaNW + lumaNE + lumaSW + lumaSE) * (0.25 * FXAA_REDUCE_MUL), FXAA_REDUCE_MIN);\n\
		\n\
		float rcpDirMin = 1.0 / (min(abs(dir.x), abs(dir.y)) + dirReduce);\n\
		dir = min(vec2(FXAA_SPAN_MAX, FXAA_SPAN_MAX), max(vec2(-FXAA_SPAN_MAX, -FXAA_SPAN_MAX), dir * rcpDirMin)) * u_iViewportSize;\n\
		\n\
		vec3 rgbA = 0.5 * (texture2D(tex, fragCoord * u_iViewportSize + dir * (1.0 / 3.0 - 0.5)).xyz + \n\
			texture2D(tex, fragCoord * u_iViewportSize + dir * (2.0 / 3.0 - 0.5)).xyz);\n\
		vec3 rgbB = rgbA * 0.5 + 0.25 * (texture2D(tex, fragCoord * u_iViewportSize + dir * -0.5).xyz + \n\
			texture2D(tex, fragCoord * u_iViewportSize + dir * 0.5).xyz);\n\
		\n\
		return vec4(rgbA,1.0);\n\
		float lumaB = dot(rgbB, luma);\n\
		if ((lumaB < lumaMin) || (lumaB > lumaMax))\n\
			color = vec4(rgbA, 1.0);\n\
		else\n\
			color = vec4(rgbB, 1.0);\n\
		return color;\n\
	}\n\
";

/**
* Returns a shader to apply FXAA antialiasing
* params are vec2 u_viewportSize, vec2 u_iViewportSize or you can call shader.setup()
* @method Shader.getFXAAShader
*/
Shader.getFXAAShader = function(gl)
{
	gl = gl || global.gl;
	var shader = gl.shaders[":fxaa"];
	if(shader)
		return shader;

	var shader = new GL.Shader( Shader.SCREEN_VERTEX_SHADER,"\n\
			precision highp float;\n\
			varying vec2 v_coord;\n\
			uniform sampler2D u_texture;\n\
			" + Shader.FXAA_FUNC + "\n\
			\n\
			void main() {\n\
			   gl_FragColor = applyFXAA( u_texture, v_coord * u_viewportSize) ;\n\
			}\n\
			");

	var viewport = vec2.fromValues( gl.viewport_data[2], gl.viewport_data[3] );
	var iviewport = vec2.fromValues( 1/gl.viewport_data[2], 1/gl.viewport_data[3] );

	shader.setup = function() {
		viewport[0] = gl.viewport_data[2];
		viewport[1] = gl.viewport_data[3];
		iviewport[0] = 1/gl.viewport_data[2];
		iviewport[1] = 1/gl.viewport_data[3];
		this.uniforms({ u_viewportSize: viewport, u_iViewportSize: iviewport });	
	}
	return gl.shaders[":fxaa"] = shader;
}

/**
* Returns a flat shader (useful to render lines)
* @method Shader.getFlatShader
*/
Shader.getFlatShader = function(gl)
{
	gl = gl || global.gl;
	var shader = gl.shaders[":flat"];
	if(shader)
		return shader;

	var shader = new GL.Shader( Shader.FLAT_VERTEX_SHADER,Shader.FLAT_FRAGMENT_SHADER);
	shader.uniforms({u_color:[1,1,1,1]});
	return gl.shaders[":flat"] = shader;
}

/**
* The global scope that contains all the classes from LiteGL and also all the enums of WebGL so you dont need to create a context to use the values.
* @class GL
*/

/**
* creates a new WebGL context (it can create the canvas or use an existing one)
* @method create
* @param {Object} options supported are: 
* - width
* - height
* - canvas
* - container (string or element)
* @return {WebGLRenderingContext} webgl context with all the extra functions (check gl in the doc for more info)
*/
GL.create = function(options) {
	options = options || {};
	var canvas = null;
	if(options.canvas)
	{
		if(typeof(options.canvas) == "string")
		{
			canvas = document.getElementById( options.canvas );
			if(!canvas) throw("Canvas element not found: " + options.canvas );
		}
		else 
			canvas = options.canvas;
	}
	else
	{
		var root = null;
		if(options.container)
			root = options.container.constructor === String ? document.querySelector( options.container ) : options.container;
		if(root && !options.width)
		{
			var rect = root.getBoundingClientRect();
			options.width = rect.width;
			options.height = rect.height;
		}

		canvas = createCanvas(  options.width || 800, options.height || 600 );
		if(root)
			root.appendChild(canvas);
	}

	if (!('alpha' in options)) options.alpha = false;


	/**
	* the webgl context returned by GL.create, its a WebGLRenderingContext with some extra methods added
	* @class gl
	*/
	var gl = null;

	var seq = null;
	if(options.version == 2)	
		seq = ['webgl2','experimental-webgl2'];
	else if(options.version == 1 || options.version === undefined) //default
		seq = ['webgl','experimental-webgl'];
	else if(options.version === 0) //latest
		seq = ['webgl2','experimental-webgl2','webgl','experimental-webgl'];

	if(!seq)
		throw 'Incorrect WebGL version, must be 1 or 2';

	var context_options = {
		alpha: options.alpha === undefined ? true : options.alpha,
		depth: options.depth === undefined ? true : options.depth,
		stencil: options.stencil === undefined ? true : options.stencil,
		antialias: options.antialias === undefined ? true : options.antialias,
		premultipliedAlpha: options.premultipliedAlpha === undefined ? true : options.premultipliedAlpha,
		preserveDrawingBuffer: options.preserveDrawingBuffer === undefined ? true : options.preserveDrawingBuffer
	};

	for(var i = 0; i < seq.length; ++i)
	{
		try { gl = canvas.getContext( seq[i], context_options ); } catch (e) {}
		if(gl)
			break;
	}

	if (!gl)
	{
		if( canvas.getContext( "webgl" ) )
			throw 'WebGL supported but not with those parameters';
		throw 'WebGL not supported';
	}

	//context globals
	gl.webgl_version = gl.constructor.name === "WebGL2RenderingContext" ? 2 : 1;
	global.gl = gl;
	canvas.is_webgl = true;
	canvas.gl = gl;
	gl.context_id = this.last_context_id++;

	//get some common extensions for webgl 1
	gl.extensions = {};
	gl.extensions["OES_standard_derivatives"] = gl.derivatives_supported = gl.getExtension('OES_standard_derivatives') || false;
	gl.extensions["WEBGL_depth_texture"] = gl.getExtension("WEBGL_depth_texture") || gl.getExtension("WEBKIT_WEBGL_depth_texture") || gl.getExtension("MOZ_WEBGL_depth_texture");
	gl.extensions["OES_element_index_uint"] = gl.getExtension("OES_element_index_uint");
	gl.extensions["WEBGL_draw_buffers"] = gl.getExtension("WEBGL_draw_buffers");
	gl.extensions["EXT_shader_texture_lod"] = gl.getExtension("EXT_shader_texture_lod");
	gl.extensions["EXT_sRGB"] = gl.getExtension("EXT_sRGB");
	gl.extensions["EXT_texture_filter_anisotropic"] = gl.getExtension("EXT_texture_filter_anisotropic") || gl.getExtension("WEBKIT_EXT_texture_filter_anisotropic") || gl.getExtension("MOZ_EXT_texture_filter_anisotropic");
	gl.extensions["EXT_frag_depth"] = gl.getExtension("EXT_frag_depth") || gl.getExtension("WEBKIT_EXT_frag_depth") || gl.getExtension("MOZ_EXT_frag_depth");
	gl.extensions["WEBGL_lose_context"] = gl.getExtension("WEBGL_lose_context") || gl.getExtension("WEBKIT_WEBGL_lose_context") || gl.getExtension("MOZ_WEBGL_lose_context");

	//for float textures
	gl.extensions["OES_texture_float_linear"] = gl.getExtension("OES_texture_float_linear");
	if(gl.extensions["OES_texture_float_linear"])
		gl.extensions["OES_texture_float"] = gl.getExtension("OES_texture_float");
	gl.extensions["EXT_color_buffer_float"] = gl.getExtension("EXT_color_buffer_float");

	//for half float textures in webgl 1 require extension
	gl.extensions["OES_texture_half_float_linear"] = gl.getExtension("OES_texture_half_float_linear");
	if(gl.extensions["OES_texture_half_float_linear"])
		gl.extensions["OES_texture_half_float"] = gl.getExtension("OES_texture_half_float");

	if( gl.webgl_version == 1 )
		gl.HIGH_PRECISION_FORMAT = gl.extensions["OES_texture_half_float"] ? GL.HALF_FLOAT_OES : (gl.extensions["OES_texture_float"] ? GL.FLOAT : GL.UNSIGNED_BYTE); //because Firefox dont support half float
	else
		gl.HIGH_PRECISION_FORMAT = GL.HALF_FLOAT_OES;

	gl.max_texture_units = gl.getParameter(gl.MAX_TEXTURE_IMAGE_UNITS);

	//viewport hack to retrieve it without using getParameter (which is slow and generates garbage)
	if(!gl._viewport_func)
	{
		gl._viewport_func = gl.viewport;
		gl.viewport_data = new Float32Array([0,0,gl.canvas.width,gl.canvas.height]); //32000 max viewport, I guess its fine
		gl.viewport = function(a,b,c,d) { var v = this.viewport_data; v[0] = a|0; v[1] = b|0; v[2] = c|0; v[3] = d|0; this._viewport_func(a,b,c,d); }
		gl.getViewport = function(v) { 
			if(v) { v[0] = gl.viewport_data[0]; v[1] = gl.viewport_data[1]; v[2] = gl.viewport_data[2]; v[3] = gl.viewport_data[3]; return v; }
			return new Float32Array( gl.viewport_data );
		};
		gl.setViewport = function( v, flip_y ) {
			gl.viewport_data.set(v);
			if(flip_y)
				gl.viewport_data[1] = this.drawingBufferHeight-v[1]-v[3];
			this._viewport_func(v[0],gl.viewport_data[1],v[2],v[3]);
		};
	}
	else
		console.warn("Creating LiteGL context over the same canvas twice");
	
	//just some checks
	if(typeof(glMatrix) == "undefined")
		throw("glMatrix not found, LiteGL requires glMatrix to be included");

	var last_click_time = 0;

	//some global containers, use them to reuse assets
	gl.shaders = {};
	gl.textures = {};
	gl.meshes = {};

	/**
	* sets this context as the current global gl context (in case you have more than one)
	* @method makeCurrent
	*/
	gl.makeCurrent = function()
	{
		global.gl = this;
	}

	/**
	* executes callback inside this webgl context
	* @method execute
	* @param {Function} callback
	*/
	gl.execute = function(callback)
	{
		var old_gl = global.gl;
		global.gl = this;
		callback();
		global.gl = old_gl;
	}


	/**
	* Launch animation loop (calls gl.onupdate and gl.ondraw every frame)
	* example: gl.ondraw = function(){ ... }   or  gl.onupdate = function(dt) { ... }
	* @method animate
	*/
	gl.animate = function(v) {
		if(v === false)
		{
			global.cancelAnimationFrame( this._requestFrame_id );
			this._requestFrame_id = null;
			return;
		}

		var post = global.requestAnimationFrame;
		var time = getTime();
		var context = this;

		//loop only if browser tab visible
		function loop() {
			if(gl.destroyed) //to stop rendering once it is destroyed
				return;

			context._requestFrame_id = post(loop); //do it first, in case it crashes

			var now = getTime();
			var dt = (now - time) * 0.001;

			if (context.onupdate) 
				context.onupdate(dt);
			LEvent.trigger(gl,"update",dt);
			if (context.ondraw)
			{
				//make sure the ondraw is called using this gl context (in case there is more than one)
				var old_gl = global.gl;
				global.gl = context;
				//call ondraw
				context.ondraw();
				LEvent.trigger(gl,"draw");
				//restore old context
				global.gl = old_gl;
			}
			time = now;
		}
		this._requestFrame_id = post(loop); //launch main loop
	}	

	//store binded to be able to remove them if destroyed
	/*
	var _binded_events = [];
	function addEvent(object, type, callback)
	{
		_binded_events.push(object,type,callback);
	}
	*/

	/**
	* Destroy this WebGL context (removes also the Canvas from the DOM)
	* @method destroy
	*/
	gl.destroy = function() {
		//unbind global events
		if(onkey_handler)
		{
			document.removeEventListener("keydown", onkey_handler );
			document.removeEventListener("keyup", onkey_handler );
		}

		if(this.canvas.parentNode)
			this.canvas.parentNode.removeChild(this.canvas);
		this.destroyed = true;
		if(global.gl == this)
			global.gl = null;
	}

	var mouse = gl.mouse = {
		buttons: 0, //this should always be up-to-date with mouse state
		left_button: false,
		middle_button: false,
		right_button: false,
		position: new Float32Array(2),
		x:0, //in canvas coordinates
		y:0,
		deltax: 0,
		deltay: 0,
		clientx:0, //in client coordinates
		clienty:0,
		isInsideRect: function(x,y,w,h, flip_y )
		{
			var mouse_y = this.y;
			if(flip_y)
				mouse_y = gl.canvas.height - mouse_y;
			if( this.x > x && this.x < x + w &&
				mouse_y > y && mouse_y < y + h)
				return true;
			return false;
		},
		isButtonPressed: function(num)
		{
			return this.buttons & (1<<GL.RIGHT_MOUSE_BUTTON);
		}
	};

	/**
	* Tells the system to capture mouse events on the canvas. 
	* This will trigger onmousedown, onmousemove, onmouseup, onmousewheel callbacks assigned in the gl context
	* example: gl.onmousedown = function(e){ ... }
	* The event is a regular MouseEvent with some extra parameters
	* @method captureMouse
	* @param {boolean} capture_wheel capture also the mouse wheel
	*/
	gl.captureMouse = function(capture_wheel, translate_touchs ) {

		canvas.addEventListener("mousedown", onmouse);
		canvas.addEventListener("mousemove", onmouse);
		if(capture_wheel)
		{
			canvas.addEventListener("mousewheel", onmouse, false);
			canvas.addEventListener("wheel", onmouse, false);
			//canvas.addEventListener("DOMMouseScroll", onmouse, false); //deprecated or non-standard
		}
		//prevent right click context menu
		canvas.addEventListener("contextmenu", function(e) { e.preventDefault(); return false; });

		if( translate_touchs )
			this.captureTouch( true );
	}

	function onmouse(e) {
		var old_mouse_mask = gl.mouse.buttons;
		GL.augmentEvent(e, canvas);
		e.eventType = e.eventType || e.type; //type cannot be overwritten, so I make a clone to allow me to overwrite
		var now = getTime();

		//gl.mouse info
		mouse.dragging = e.dragging;
		mouse.position[0] = e.canvasx;
		mouse.position[1] = e.canvasy;
		mouse.x = e.canvasx;
		mouse.y = e.canvasy;
		mouse.clientx = e.mousex;
		mouse.clienty = e.mousey;
		mouse.left_button = !!(mouse.buttons & (1<<GL.LEFT_MOUSE_BUTTON));
		mouse.middle_button = !!(mouse.buttons & (1<<GL.MIDDLE_MOUSE_BUTTON));
		mouse.right_button = !!(mouse.buttons & (1<<GL.RIGHT_MOUSE_BUTTON));

		if(e.eventType == "mousedown")
		{
			if(old_mouse_mask == 0) //no mouse button was pressed till now
			{
				canvas.removeEventListener("mousemove", onmouse);
				var doc = canvas.ownerDocument;
				doc.addEventListener("mousemove", onmouse);
				doc.addEventListener("mouseup", onmouse);
			}
			last_click_time = now;

			if(gl.onmousedown)
				gl.onmousedown(e);
			LEvent.trigger(gl,"mousedown");
		}
		else if(e.eventType == "mousemove")
		{ 
			if(gl.onmousemove)
				gl.onmousemove(e); 
			LEvent.trigger(gl,"mousemove",e);
		} 
		else if(e.eventType == "mouseup")
		{
			if(gl.mouse.buttons == 0) //no more buttons pressed
			{
				canvas.addEventListener("mousemove", onmouse);
				var doc = canvas.ownerDocument;
				doc.removeEventListener("mousemove", onmouse);
				doc.removeEventListener("mouseup", onmouse);
			}
			e.click_time = now - last_click_time;
			//last_click_time = now; //commented to avoid reseting click time when unclicking two mouse buttons

			if(gl.onmouseup)
				gl.onmouseup(e);
			LEvent.trigger(gl,"mouseup",e);
		}
		else if((e.eventType == "mousewheel" || e.eventType == "wheel" || e.eventType == "DOMMouseScroll"))
		{ 
			e.eventType = "mousewheel";
			if(e.type == "wheel")
				e.wheel = -e.deltaY; //in firefox deltaY is 1 while in Chrome is 120
			else
				e.wheel = (e.wheelDeltaY != null ? e.wheelDeltaY : e.detail * -60);

			//from stack overflow
			//firefox doesnt have wheelDelta
			e.delta = e.wheelDelta !== undefined ? (e.wheelDelta/40) : (e.deltaY ? -e.deltaY/3 : 0);
			//console.log(e.delta);
			if(gl.onmousewheel)
				gl.onmousewheel(e);

			LEvent.trigger(gl, "mousewheel", e);
		}

		if(gl.onmouse)
			gl.onmouse(e);

		if(e.eventType != "mousemove")
			e.stopPropagation();
		e.preventDefault();
		return false;
	}

	var translate_touches = false;

	gl.captureTouch = function( translate_to_mouse_events )
	{
		translate_touches = translate_to_mouse_events;

		canvas.addEventListener("touchstart", ontouch, true);
		canvas.addEventListener("touchmove", ontouch, true);
		canvas.addEventListener("touchend", ontouch, true);
		canvas.addEventListener("touchcancel", ontouch, true);   

		canvas.addEventListener('gesturestart', ongesture );
		canvas.addEventListener('gesturechange', ongesture );
		canvas.addEventListener('gestureend', ongesture );
	}

	//translates touch events in mouseevents
	function ontouch( e )
	{
		var touches = e.changedTouches,
			first = touches[0],
			type = "";

		if( gl.ontouch && gl.ontouch(e) === false )
			return;

		if( LEvent.trigger( gl, e.type, e ) === false )
			return;

		if(!translate_touches)
			return;

		//ignore secondary touches
        if(e.touches.length && e.changedTouches[0].identifier !== e.touches[0].identifier)
        	return;
        	
		if(touches > 1)
			return;

		 switch(e.type)
		{
			case "touchstart": type = "mousedown"; break;
			case "touchmove":  type = "mousemove"; break;        
			case "touchend":   type = "mouseup"; break;
			default: return;
		}

		var simulatedEvent = document.createEvent("MouseEvent");
		simulatedEvent.initMouseEvent(type, true, true, window, 1,
								  first.screenX, first.screenY,
								  first.clientX, first.clientY, false,
								  false, false, false, 0/*left*/, null);
		simulatedEvent.originalEvent = simulatedEvent;
		simulatedEvent.is_touch = true;
		first.target.dispatchEvent( simulatedEvent );
		e.preventDefault();
	}

	function ongesture(e)
	{
		e.eventType = e.type;

		if(gl.ongesture && gl.ongesture(e) === false )
			return;

		if( LEvent.trigger( gl, e.type, e ) === false )
			return;

		e.preventDefault();
	}

	var keys = gl.keys = {};

	/**
	* Tells the system to capture key events on the canvas. This will trigger onkey
	* @method captureKeys
	* @param {boolean} prevent_default prevent default behaviour (like scroll on the web, etc)
	* @param {boolean} only_canvas only caches keyboard events if they happen when the canvas is in focus
	*/
	var onkey_handler = null;
	gl.captureKeys = function( prevent_default, only_canvas ) {
		if(onkey_handler) 
			return;
		gl.keys = {};

		var target = only_canvas ? gl.canvas : document;

		document.addEventListener("keydown", inner );
		document.addEventListener("keyup", inner );
		function inner(e) { onkey(e, prevent_default); }
		onkey_handler = inner;
	}



	function onkey(e, prevent_default)
	{
		//trace(e);
		e.eventType = e.type; //type cannot be overwritten, so I make a clone to allow me to overwrite

		var target_element = e.target.nodeName.toLowerCase();
		if(target_element === "input" || target_element === "textarea" || target_element === "select")
			return;

		e.character = String.fromCharCode(e.keyCode).toLowerCase();
		var prev_state = false;
		var key = GL.mapKeyCode(e.keyCode);
		if(!key) //this key doesnt look like an special key
			key = e.character;

		//regular key
		if (!e.altKey && !e.ctrlKey && !e.metaKey) {
			if (key) 
				gl.keys[key] = e.type == "keydown";
			prev_state = gl.keys[e.keyCode];
			gl.keys[e.keyCode] = e.type == "keydown";
		}

		//avoid repetition if key stays pressed
		if(prev_state != gl.keys[e.keyCode])
		{
			if(e.type == "keydown" && gl.onkeydown) 
				gl.onkeydown(e);
			else if(e.type == "keyup" && gl.onkeyup) 
				gl.onkeyup(e);
			LEvent.trigger(gl, e.type, e);
		}

		if(gl.onkey)
			gl.onkey(e);

		if(prevent_default && (e.isChar || GL.blockable_keys[e.keyIdentifier || e.key ]) )
			e.preventDefault();
	}

	//gamepads
	gl.gamepads = null;
	/*
	function onButton(e, pressed)
	{
		console.log(e);
		if(pressed && gl.onbuttondown)
			gl.onbuttondown(e);
		else if(!pressed && gl.onbuttonup)
			gl.onbuttonup(e);
		if(gl.onbutton)
			gl.onbutton(e);
		LEvent.trigger(gl, pressed ? "buttondown" : "buttonup", e );
	}
	function onGamepad(e)
	{
		console.log(e);
		if(gl.ongamepad) 
			gl.ongamepad(e);
	}
	*/

	/**
	* Tells the system to capture gamepad events on the canvas. 
	* @method captureGamepads
	*/
	gl.captureGamepads = function()
	{
		var getGamepads = navigator.getGamepads || navigator.webkitGetGamepads || navigator.mozGetGamepads; 
		if(!getGamepads) return;
		this.gamepads = getGamepads.call(navigator);

		//only in firefox, so I cannot rely on this
		/*
		window.addEventListener("gamepadButtonDown", function(e) { onButton(e, true); }, false);
		window.addEventListener("MozGamepadButtonDown", function(e) { onButton(e, true); }, false);
		window.addEventListener("WebkitGamepadButtonDown", function(e) { onButton(e, true); }, false);
		window.addEventListener("gamepadButtonUp", function(e) { onButton(e, false); }, false);
		window.addEventListener("MozGamepadButtonUp", function(e) { onButton(e, false); }, false);
		window.addEventListener("WebkitGamepadButtonUp", function(e) { onButton(e, false); }, false);
		window.addEventListener("gamepadconnected", onGamepad, false);
		window.addEventListener("gamepaddisconnected", onGamepad, false);
		*/

	}

	/**
	* returns the detected gamepads on the system
	* @method getGamepads
	* @param {bool} skip_mapping if set to true it returns the basic gamepad, otherwise it returns a class with mapping info to XBOX controller
	*/
	gl.getGamepads = function(skip_mapping)
	{
		//gamepads
		var getGamepads = navigator.getGamepads || navigator.webkitGetGamepads || navigator.mozGetGamepads; 
		if(!getGamepads)
			return;
		var gamepads = getGamepads.call(navigator);
		if(!this.gamepads)
			this.gamepads = [];
		for(var i = 0; i < 4; i++)
		{
			var gamepad = gamepads[i]; //current state

			if(gamepad && !skip_mapping)
				addGamepadXBOXmapping(gamepad);

			var old_gamepad = this.gamepads[i]; //old state

			//launch connected gamepads events
			if(!old_gamepad && gamepad)
			{
				var event = new CustomEvent("gamepadconnected");
				event.eventType = event.type;
				event.gamepad = gamepad;;
				if(this.ongamepadconnected)
					this.ongamepadconnected(event);
				LEvent.trigger(gl,"gamepadconnected",event);
			}
			else if(old_gamepad && !gamepad)
			{
				var event = new CustomEvent("gamepaddisconnected");
				event.eventType = event.type;
				event.gamepad = old_gamepad;
				if(this.ongamepaddisconnected)
					this.ongamepaddisconnected(event);
				LEvent.trigger(gl,"gamepaddisconnected",event);
			}

			//seek buttons changes to trigger events
			if(gamepad)
			{
				for(var j = 0; j < gamepad.buttons.length; ++j)
				{
					var button = gamepad.buttons[j];
					if( button.pressed && (!old_gamepad || !old_gamepad.buttons[j].pressed))
					{
						var event = new CustomEvent("gamepadButtonDown");
						event.eventType = event.type;
						event.button = button;
						event.which = j;
						event.gamepad = gamepad;
						if(gl.onbuttondown)
							gl.onbuttondown(event);
						LEvent.trigger(gl,"buttondown",event);
					}
					else if( !button.pressed && (old_gamepad && old_gamepad.buttons[j].pressed))
					{
						var event = new CustomEvent("gamepadButtonUp");
						event.eventType = event.type;
						event.button = button;
						event.which = j;
						event.gamepad = gamepad;
						if(gl.onbuttondown)
							gl.onbuttondown(event);
						LEvent.trigger(gl,"buttonup",event);
					}
				}
			}
		}
		this.gamepads = gamepads;
		return gamepads;
	}

	function addGamepadXBOXmapping(gamepad)
	{
		//xbox controller mapping
		var xbox = { axes:[], buttons:{}, hat: ""};
		xbox.axes["lx"] = gamepad.axes[0];
		xbox.axes["ly"] = gamepad.axes[1];
		xbox.axes["rx"] = gamepad.axes[2];
		xbox.axes["ry"] = gamepad.axes[3];
		xbox.axes["triggers"] = gamepad.axes[4];

		for(var i = 0; i < gamepad.buttons.length; i++)
		{
			switch(i) //I use a switch to ensure that a player with another gamepad could play
			{
				case 0: xbox.buttons["a"] = gamepad.buttons[i].pressed; break;
				case 1: xbox.buttons["b"] = gamepad.buttons[i].pressed; break;
				case 2: xbox.buttons["x"] = gamepad.buttons[i].pressed; break;
				case 3: xbox.buttons["y"] = gamepad.buttons[i].pressed; break;
				case 4: xbox.buttons["lb"] = gamepad.buttons[i].pressed; break;
				case 5: xbox.buttons["rb"] = gamepad.buttons[i].pressed; break;
				case 6: xbox.buttons["lt"] = gamepad.buttons[i].pressed; break;
				case 7: xbox.buttons["rt"] = gamepad.buttons[i].pressed; break;
				case 8: xbox.buttons["back"] = gamepad.buttons[i].pressed; break;
				case 9: xbox.buttons["start"] = gamepad.buttons[i].pressed; break;
				case 10: xbox.buttons["ls"] = gamepad.buttons[i].pressed; break;
				case 11: xbox.buttons["rs"] = gamepad.buttons[i].pressed; break;
				case 12: if( gamepad.buttons[i].pressed) xbox.hat += "up"; break;
				case 13: if( gamepad.buttons[i].pressed) xbox.hat += "down"; break;
				case 14: if( gamepad.buttons[i].pressed) xbox.hat += "left"; break;
				case 15: if( gamepad.buttons[i].pressed) xbox.hat += "right"; break;
				case 16: xbox.buttons["home"] = gamepad.buttons[i].pressed; break;
				default:
			}
		}
		gamepad.xbox = xbox;
	}

	/**
	* launches de canvas in fullscreen mode
	* @method fullscreen
	*/
	gl.fullscreen = function()
	{
		var canvas = this.canvas;
		if(canvas.requestFullScreen)
			canvas.requestFullScreen();
		else if(canvas.webkitRequestFullScreen)
			canvas.webkitRequestFullScreen();
		else if(canvas.mozRequestFullScreen)
			canvas.mozRequestFullScreen();
		else
			console.error("Fullscreen not supported");
	}

	/**
	* returns a canvas with a snapshot of an area
	* this is safer than using the canvas itself due to internals of webgl
	* @method snapshot
	* @param {Number} startx viewport x coordinate
	* @param {Number} starty viewport y coordinate from bottom
	* @param {Number} areax viewport area width
	* @param {Number} areay viewport area height
	* @return {Canvas} canvas
	*/
	gl.snapshot = function(startx, starty, areax, areay, skip_reverse)
	{
		var canvas = createCanvas(areax,areay);
		var ctx = canvas.getContext("2d");
		var pixels = ctx.getImageData(0,0,canvas.width,canvas.height);

		var buffer = new Uint8Array(areax * areay * 4);
		gl.readPixels(startx, starty, canvas.width, canvas.height, gl.RGBA,gl.UNSIGNED_BYTE, buffer);

		pixels.data.set( buffer );
		ctx.putImageData(pixels,0,0);

		if(skip_reverse)
			return canvas;

		//flip image 
		var final_canvas = createCanvas(areax,areay);
		var ctx = final_canvas.getContext("2d");
		ctx.translate(0,areay);
		ctx.scale(1,-1);
		ctx.drawImage(canvas,0,0);

		return final_canvas;
	}

	//from https://webgl2fundamentals.org/webgl/lessons/webgl1-to-webgl2.html
	function getAndApplyExtension( gl, name ) {
		var ext = gl.getExtension(name);
		if (!ext) {
			return false;
		}
		var suffix = name.split("_")[0];
		var prefix = suffix = '_';
		var suffixRE = new RegExp(suffix + '$');
		var prefixRE = new RegExp('^' + prefix);
		for (var key in ext) {
			var val = ext[key];
			if (typeof(val) === 'function') {
				// remove suffix (eg: bindVertexArrayOES -> bindVertexArray)
				var unsuffixedKey = key.replace(suffixRE, '');
				if (key.substing)
					gl[unprefixedKey] = ext[key].bind(ext);
			} else {
				var unprefixedKey = key.replace(prefixRE, '');
				gl[unprefixedKey] = ext[key];
			}
		}
	}


	//mini textures manager
	var loading_textures = {};
	/**
	* returns a texture and caches it inside gl.textures[]
	* @method loadTexture
	* @param {String} url
	* @param {Object} options (same options as when creating a texture)
	* @param {Function} callback function called once the texture is loaded
	* @return {Texture} texture
	*/
	gl.loadTexture = function(url, options, on_load)
	{
		if(this.textures[ url ])
			return this.textures[url];

		if( loading_textures[url] )
			return null;

		var img = new Image();
		img.url = url;
		img.onload = function()
		{
			var texture = GL.Texture.fromImage(this, options);
			texture.img = this;
			gl.textures[this.url] = texture;
			delete loading_textures[this.url];
			if(on_load)
				on_load(texture);
		} 
		img.src = url;
		loading_textures[url] = true;
		return null;
	}

	/**
	* draws a texture to the viewport
	* @method drawTexture
	* @param {Texture} texture
	* @param {number} x in viewport coordinates 
	* @param {number} y in viewport coordinates 
	* @param {number} w in viewport coordinates 
	* @param {number} h in viewport coordinates 
	* @param {number} tx texture x in texture coordinates
	* @param {number} ty texture y in texture coordinates
	* @param {number} tw texture width in texture coordinates
	* @param {number} th texture height in texture coordinates
	*/
	gl.drawTexture = (function() {
		//static variables: less garbage
		var identity = mat3.create();
		var pos = vec2.create();
		var size = vec2.create();
		var area = vec4.create();
		var white = vec4.fromValues(1,1,1,1);
		var viewport = vec2.create();
		var _uniforms = {u_texture: 0, u_position: pos, u_color: white, u_size: size, u_texture_area: area, u_viewport: viewport, u_transform: identity };

		return (function(texture, x,y, w,h, tx,ty, tw,th, shader, uniforms)
		{
			pos[0] = x;	pos[1] = y;
			if(w === undefined)
				w = texture.width;
			if(h === undefined)
				h = texture.height;
			size[0] = w;
			size[1] = h;

			if(tx === undefined) tx = 0;
			if(ty === undefined) ty = 0;
			if(tw === undefined) tw = texture.width;
			if(th === undefined) th = texture.height;

			area[0] = tx / texture.width;
			area[1] = ty / texture.height;
			area[2] = (tx + tw) / texture.width;
			area[3] = (ty + th) / texture.height;

			viewport[0] = this.viewport_data[2];
			viewport[1] = this.viewport_data[3];

			shader = shader || Shader.getPartialQuadShader(this);
			var mesh = Mesh.getScreenQuad(this);
			texture.bind(0);
			shader.uniforms( _uniforms );
			if( uniforms )
				shader.uniforms( uniforms );
			shader.draw( mesh, gl.TRIANGLES );
		});
	})();

	gl.canvas.addEventListener("webglcontextlost", function(e) {
		e.preventDefault();
		gl.context_lost = true;
		if(gl.onlosecontext)
			gl.onlosecontext(e);
	}, false);

	/**
	* use it to reset the the initial gl state
	* @method gl.reset
	*/
	gl.reset = function()
	{
		//viewport
		gl.viewport(0,0, this.canvas.width, this.canvas.height );

		//flags
		gl.disable( gl.BLEND );
		gl.disable( gl.CULL_FACE );
		gl.disable( gl.DEPTH_TEST );
		gl.frontFace( gl.CCW );

		//texture
		gl._current_texture_drawto = null;
		gl._current_fbo_color = null;
		gl._current_fbo_depth = null;
	}

	gl.dump = function()
	{
		console.log("userAgent: ", navigator.userAgent );
		console.log("Supported extensions:");
		var extensions = gl.getSupportedExtensions();
		console.log( extensions.join(",") );
		var info = [ "VENDOR", "VERSION", "MAX_VERTEX_ATTRIBS", "MAX_VARYING_VECTORS", "MAX_VERTEX_UNIFORM_VECTORS", "MAX_VERTEX_TEXTURE_IMAGE_UNITS", "MAX_FRAGMENT_UNIFORM_VECTORS", "MAX_TEXTURE_SIZE", "MAX_TEXTURE_IMAGE_UNITS" ];
		console.log("WebGL info:");
		for(var i in info)
			console.log(" * " + info[i] + ": " + gl.getParameter( gl[info[i]] ));
		console.log("*************************************************")
	}

	//Reset state
	gl.reset();

	//Return
	return gl;
}

GL.mapKeyCode = function(code)
{
	var named = {
		8: 'BACKSPACE',
		9: 'TAB',
		13: 'ENTER',
		16: 'SHIFT',
		17: 'CTRL',
		27: 'ESCAPE',
		32: 'SPACE',
		37: 'LEFT',
		38: 'UP',
		39: 'RIGHT',
		40: 'DOWN'
	};
	return named[code] || (code >= 65 && code <= 90 ? String.fromCharCode(code) : null);
}

//add useful info to the event
GL.dragging = false;
GL.last_pos = [0,0];

//adds extra info to the MouseEvent (coordinates in canvas axis, deltas and button state)
GL.augmentEvent = function(e, root_element)
{
	var offset_left = 0;
	var offset_top = 0;
	var b = null;

	root_element = root_element || e.target || gl.canvas;
	b = root_element.getBoundingClientRect();
		
	e.mousex = e.clientX - b.left;
	e.mousey = e.clientY - b.top;
	e.canvasx = e.mousex;
	e.canvasy = b.height - e.mousey;
	e.deltax = 0;
	e.deltay = 0;
	
	if(e.type == "mousedown")
	{
		this.dragging = true;
		gl.mouse.buttons |= (1 << e.which); //enable
	}
	else if (e.type == "mousemove")
	{
	}
	else if (e.type == "mouseup")
	{
		gl.mouse.buttons = gl.mouse.buttons & ~(1 << e.which);
		if(gl.mouse.buttons == 0)
			this.dragging = false;
	}

	if( e.movementX !== undefined && !GL.isMobile() ) //pointer lock (mobile gives always zero)
	{
		//console.log( e.movementX )
		e.deltax = e.movementX;
		e.deltay = e.movementY;
	}
	else
	{
		e.deltax = e.mousex - this.last_pos[0];
		e.deltay = e.mousey - this.last_pos[1];
	}
	this.last_pos[0] = e.mousex;
	this.last_pos[1] = e.mousey;

	//insert info in event
	e.dragging = this.dragging;
	e.buttons_mask = gl.mouse.buttons;
	e.leftButton = !!(gl.mouse.buttons & (1<<GL.LEFT_MOUSE_BUTTON));
	e.middleButton = !!(gl.mouse.buttons & (1<<GL.MIDDLE_MOUSE_BUTTON));
	e.rightButton = !!(gl.mouse.buttons & (1<<GL.RIGHT_MOUSE_BUTTON));
	e.isButtonPressed = function(num) { return this.buttons_mask & (1<<num); }
}

/**
* Tells you if the app is running on a mobile device (iOS or Android)
* @method isMobile
* @return {boolean} true if is running on a iOS or Android device
*/
GL.isMobile = function()
{
	if(this.mobile !== undefined)
		return this.mobile;

	if(!global.navigator) //server side js?
		return this.mobile = false;

	if( (navigator.userAgent.match(/iPhone/i)) || 
		(navigator.userAgent.match(/iPod/i)) || 
		(navigator.userAgent.match(/iPad/i)) || 
		(navigator.userAgent.match(/Android/i))) {
		return this.mobile = true;
	}
	return this.mobile = false;
}
/**
* @namespace 
*/

/**
* LEvent is a lightweight events library focused in low memory footprint and fast delivery.
* It works by creating a property called "__levents" inside the object that has the bindings, and storing arrays with all the bindings.
* @class LEvent
* @constructor
*/

var LEvent = global.LEvent = GL.LEvent = {

	/**
	* Binds an event to an instance
	* @method LEvent.bind
	* @param {Object} instance where to attach the event
	* @param {String} event_name string defining the event name
	* @param {function} callback function to call when the event is triggered
	* @param {Object} target_instance [Optional] instance to call the function (use this instead of .bind method to help removing events)
	**/
	bind: function( instance, event_type, callback, target_instance )
	{
		if(!instance) 
			throw("cannot bind event to null");
		if(!callback) 
			throw("cannot bind to null callback");
		if(instance.constructor === String ) 
			throw("cannot bind event to a string");

		var events = instance.__levents;
		if(!events)
		{
			Object.defineProperty( instance, "__levents", {value: {}, enumerable: false });
			events = instance.__levents;
		}

		if( events.hasOwnProperty( event_type ) )
			events[event_type].push([callback,target_instance]);
		else
			events[event_type] = [[callback,target_instance]];
		if( instance.onLEventBinded )
			instance.onLEventBinded( event_type, callback, target_instance );
	},

	/**
	* Unbinds an event from an instance
	* @method LEvent.unbind
	* @param {Object} instance where the event is binded
	* @param {String} event_name string defining the event name
	* @param {function} callback function that was binded
	* @param {Object} target_instance [Optional] target_instance that was binded
	**/
	unbind: function( instance, event_type, callback, target_instance )
	{
		if(!instance) 
			throw("cannot unbind event to null");
		if(!callback) 
			throw("cannot unbind from null callback");
		if(instance.constructor === String ) 
			throw("cannot bind event to a string");

		var events = instance.__levents;
		if(!events)
			return;

		if(!events.hasOwnProperty( event_type ))
			return;

		for(var i = 0, l = events[event_type].length; i < l; ++i)
		{
			var v = events[event_type][i];
			if(v[0] === callback && v[1] === target_instance)
			{
				events[event_type].splice( i, 1 );
				break;
			}
		}

		if (events[event_type].length == 0)
			delete events[event_type];

		if( instance.onLEventUnbinded )
			instance.onLEventUnbinded( event_type, callback, target_instance );
	},

	/**
	* Unbinds all events from an instance (or the ones that match certain target_instance)
	* @method LEvent.unbindAll
	* @param {Object} instance where the events are binded
	* @param {Object} target_instance [Optional] target_instance of the events to remove
	**/
	unbindAll: function( instance, target_instance, callback )
	{
		if(!instance) 
			throw("cannot unbind events in null");

		var events = instance.__levents;
		if(!events)
			return;

		if( instance.onLEventUnbindAll )
			instance.onLEventUnbindAll( target_instance, callback );

		if(!target_instance) //remove all
		{
			delete instance.__levents;
			return;
		}

		//remove only the target_instance
		//for every property in the instance
		for(var i in events)
		{
			var array = events[i];
			for(var j = array.length - 1; j >= 0; --j) //iterate backwards to avoid problems after removing
			{
				if( array[j][1] != target_instance || (callback && callback !== array[j][0]) ) 
					continue;

				array.splice(j,1);//remove
			}
		}
	},

	/**
	* Unbinds all callbacks associated to one specific event from this instance
	* @method LEvent.unbindAll
	* @param {Object} instance where the events are binded
	* @param {String} event name of the event you want to remove all binds
	**/
	unbindAllEvent: function( instance, event_type )
	{
		if(!instance) 
			throw("cannot unbind events in null");

		var events = instance.__levents;
		if(!events)
			return;
		delete events[ event_type ];
		if( instance.onLEventUnbindAll )
			instance.onLEventUnbindAll( event_type, target_instance, callback );
		return;
	},

	/**
	* Tells if there is a binded callback that matches the criteria
	* @method LEvent.isBind
	* @param {Object} instance where the are the events binded
	* @param {String} event_name string defining the event name
	* @param {function} callback the callback
	* @param {Object} target_instance [Optional] instance binded to callback
	**/
	isBind: function( instance, event_type, callback, target_instance )
	{
		if(!instance)
			throw("LEvent cannot have null as instance");

		var events = instance.__levents;
		if( !events )
			return;

		if( !events.hasOwnProperty(event_type) ) 
			return false;

		for(var i = 0, l = events[event_type].length; i < l; ++i)
		{
			var v = events[event_type][i];
			if(v[0] === callback && v[1] === target_instance)
				return true;
		}
		return false;
	},

	/**
	* Tells if there is any callback binded to this event
	* @method LEvent.hasBind
	* @param {Object} instance where the are the events binded
	* @param {String} event_name string defining the event name
	* @return {boolean} true is there is at least one
	**/
	hasBind: function( instance, event_type )
	{
		if(!instance)
			throw("LEvent cannot have null as instance");
		var events = instance.__levents;
		if(!events || !events.hasOwnProperty( event_type ) || !events[event_type].length) 
			return false;
		return true;
	},

	/**
	* Tells if there is any callback binded to this object pointing to a method in the target object
	* @method LEvent.hasBindTo
	* @param {Object} instance where there are the events binded
	* @param {Object} target instance to check to
	* @return {boolean} true is there is at least one
	**/
	hasBindTo: function( instance, target )
	{
		if(!instance)
			throw("LEvent cannot have null as instance");
		var events = instance.__levents;

		//no events binded
		if(!events) 
			return false;

		for(var j in events)
		{
			var binds = events[j];
			for(var i = 0; i < binds.length; ++i)
			{
				if(binds[i][1] === target) //one found
					return true;
			}
		}

		return false;
	},

	/**
	* Triggers and event in an instance
	* @method LEvent.trigger
	* @param {Object} instance that triggers the event
	* @param {String} event_name string defining the event name
	* @param {*} parameters that will be received by the binded function
	* @param {bool} reverse_order trigger in reverse order (binded last get called first)
	**/
	trigger: function( instance, event_type, params, reverse_order )
	{
		if(!instance) 
			throw("cannot trigger event from null");
		if(instance.constructor === String ) 
			throw("cannot bind event to a string");

		var events = instance.__levents;
		if( !events || !events.hasOwnProperty(event_type) )
			return true;

		var inst = events[event_type];
		if( reverse_order )
		{
			for(var i = inst.length - 1; i >= 0; --i)
			{
				var v = inst[i];
				if( v && v[0].call(v[1], event_type, params) == false)// || event.stop)
					return false; //stopPropagation
			}
		}
		else
		{
			for(var i = 0, l = inst.length; i < l; ++i)
			{
				var v = inst[i];
				if( v && v[0].call(v[1], event_type, params) == false)// || event.stop)
					return false; //stopPropagation
			}
		}

		return true;
	},

	/**
	* Triggers and event to every element in an array
	* @method LEvent.triggerArray
	* @param {Array} array contains all instances to triggers the event
	* @param {String} event_name string defining the event name
	* @param {*} parameters that will be received by the binded function
	* @param {bool} reverse_order trigger in reverse order (binded last get called first)
	**/
	triggerArray: function( instances, event_type, params, reverse_order )
	{
		for(var i = 0, l = instances.length; i < l; ++i)
		{
			var instance = instances[i];
			if(!instance) 
				throw("cannot trigger event from null");
			if(instance.constructor === String ) 
				throw("cannot bind event to a string");

			var events = instance.__levents;
			if( !events || !events.hasOwnProperty( event_type ) )
				continue;

			if( reverse_order )
			{
				for(var j = events[event_type].length - 1; j >= 0; --j)
				{
					var v = events[event_type][j];
					if( v[0].call(v[1], event_type, params) == false)// || event.stop)
						break; //stopPropagation
				}
			}
			else
			{
				for(var j = 0, ll = events[event_type].length; j < ll; ++j)
				{
					var v = events[event_type][j];
					if( v[0].call(v[1], event_type, params) == false)// || event.stop)
						break; //stopPropagation
				}
			}
		}

		return true;
	},

	extendObject: function( object )
	{
		object.bind = function( event_type, callback, instance ){
			return LEvent.bind( this, event_type, callback, instance );
		};

		object.trigger = function( event_type, params ){
			return LEvent.trigger( this, event_type, params );
		};

		object.unbind = function( event_type, callback, target_instance )
		{
			return LEvent.unbind( this, event_type, callback, instance );
		};

		object.unbindAll = function( target_instance, callback )
		{
			return LEvent.unbindAll( this, target_instance, callback );
		};
	},

	/**
	* Adds the methods to bind, trigger and unbind to this class prototype
	* @method LEvent.extendClass
	* @param {Object} constructor
	**/
	extendClass: function( constructor )
	{
		this.extendObject( constructor.prototype );
	}
};
/* geometric utilities */
global.CLIP_INSIDE = GL.CLIP_INSIDE = 0;
global.CLIP_OUTSIDE = GL.CLIP_OUTSIDE = 1;
global.CLIP_OVERLAP = GL.CLIP_OVERLAP = 2;

/**
* @namespace
*/


/**
* Computational geometry algorithms, is a static class
* @class geo
*/

global.geo = {

	/**
	* Returns a float4 containing the info about a plane with normal N and that passes through point P
	* @method createPlane
	* @param {vec3} P
	* @param {vec3} N
	* @return {vec4} plane values
	*/
	createPlane: function(P,N)
	{
		return new Float32Array([N[0],N[1],N[2],-vec3.dot(P,N)]);
	},

	/**
	* Computes the distance between the point and the plane
	* @method distancePointToPlane
	* @param {vec3} point
	* @param {vec4} plane
	* @return {Number} distance
	*/
	distancePointToPlane: function(point, plane)
	{
		return (vec3.dot(point,plane) + plane[3])/Math.sqrt(plane[0]*plane[0] + plane[1]*plane[1] + plane[2]*plane[2]);
	},

	/**
	* Computes the square distance between the point and the plane
	* @method distance2PointToPlane
	* @param {vec3} point
	* @param {vec4} plane
	* @return {Number} distance*distance
	*/
	distance2PointToPlane: function(point, plane)
	{
		return (vec3.dot(point,plane) + plane[3])/(plane[0]*plane[0] + plane[1]*plane[1] + plane[2]*plane[2]);
	},

	/**
	* Projects a 3D point on a 3D line
	* @method projectPointOnLine
	* @param {vec3} P
	* @param {vec3} A line start
	* @param {vec3} B line end
	* @param {vec3} result to store result (optional)
	* @return {vec3} projectec point
	*/
	projectPointOnLine: function( P, A, B, result )
	{
		result = result || vec3.create();
		//A + dot(AP,AB) / dot(AB,AB) * AB
		var AP = vec3.fromValues( P[0] - A[0], P[1] - A[1], P[2] - A[2]);
		var AB = vec3.fromValues( B[0] - A[0], B[1] - A[1], B[2] - A[2]);
		var div = vec3.dot(AP,AB) / vec3.dot(AB,AB);
		result[0] = A[0] + div[0] * AB[0];
		result[1] = A[1] + div[1] * AB[1];
		result[2] = A[2] + div[2] * AB[2];
		return result;
	},

	/**
	* Projects a 2D point on a 2D line
	* @method project2DPointOnLine
	* @param {vec2} P
	* @param {vec2} A line start
	* @param {vec2} B line end
	* @param {vec2} result to store result (optional)
	* @return {vec2} projectec point
	*/
	project2DPointOnLine: function( P, A, B, result )
	{
		result = result || vec2.create();
		//A + dot(AP,AB) / dot(AB,AB) * AB
		var AP = vec2.fromValues(P[0] - A[0], P[1] - A[1]);
		var AB = vec2.fromValues(B[0] - A[0], B[1] - A[1]);
		var div = vec2.dot(AP,AB) / vec2.dot(AB,AB);
		result[0] = A[0] + div[0] * AB[0];
		result[1] = A[1] + div[1] * AB[1];
		return result;
	},

	/**
	* Projects point on plane
	* @method projectPointOnPlane
	* @param {vec3} point
	* @param {vec3} P plane point
	* @param {vec3} N plane normal
	* @param {vec3} result to store result (optional)
	* @return {vec3} projectec point
	*/
	projectPointOnPlane: function(point, P, N, result)
	{
		result = result || vec3.create();
		var v = vec3.subtract( vec3.create(), point, P );
		var dist = vec3.dot(v,N);
		return vec3.subtract( result, point , vec3.scale( vec3.create(), N, dist ) );
	},

	/**
	* Finds the reflected point over a plane (useful for reflecting camera position when rendering reflections)
	* @method reflectPointInPlane
	* @param {vec3} point point to reflect
	* @param {vec3} P point where the plane passes
	* @param {vec3} N normal of the plane
	* @return {vec3} reflected point
	*/
	reflectPointInPlane: function(point, P, N)
	{
		var d = -1 * (P[0] * N[0] + P[1] * N[1] + P[2] * N[2]);
		var t = -(d + N[0]*point[0] + N[1]*point[1] + N[2]*point[2]) / (N[0]*N[0] + N[1]*N[1] + N[2]*N[2]);
		//trace("T:" + t);
		//var closest = [ point[0]+t*N[0], point[1]+t*N[1], point[2]+t*N[2] ];
		//trace("Closest:" + closest);
		return vec3.fromValues( point[0]+t*N[0]*2, point[1]+t*N[1]*2, point[2]+t*N[2]*2 );
	},

	/**
	* test a ray plane collision and retrieves the collision point
	* @method testRayPlane
	* @param {vec3} start ray start
	* @param {vec3} direction ray direction
	* @param {vec3} P point where the plane passes	
	* @param {vec3} N normal of the plane
	* @param {vec3} result collision position
	* @return {boolean} returns if the ray collides the plane or the ray is parallel to the plane
	*/
	testRayPlane: function(start, direction, P, N, result)
	{
		var D = vec3.dot( P, N );
		var numer = D - vec3.dot(N, start);
		var denom = vec3.dot(N, direction);
		if( Math.abs(denom) < EPSILON) return false;
		var t = (numer / denom);
		if(t < 0.0) return false; //behind the ray
		if(result)
			vec3.add( result,  start, vec3.scale( result, direction, t) );

		return true;
	},

	/**
	* test collision between segment and plane and retrieves the collision point
	* @method testSegmentPlane
	* @param {vec3} start segment start
	* @param {vec3} end segment end
	* @param {vec3} P point where the plane passes	
	* @param {vec3} N normal of the plane
	* @param {vec3} result collision position
	* @return {boolean} returns if the segment collides the plane or it is parallel to the plane
	*/
	testSegmentPlane: (function() { 
		var temp = vec3.create();
		return function(start, end, P, N, result)
		{
			var D = vec3.dot( P, N );
			var numer = D - vec3.dot(N, start);
			var direction = vec3.sub( temp, end, start );
			var denom = vec3.dot(N, direction);
			if( Math.abs(denom) < EPSILON)
				return false; //parallel 
			var t = (numer / denom);
			if(t < 0.0)
				return false; //behind the start
			if(t > 1.0)
				return false; //after the end
			if(result)
				vec3.add( result,  start, vec3.scale( result, direction, t) );
			return true;
		};
	})(),

	/**
	* test a ray sphere collision and retrieves the collision point
	* @method testRaySphere
	* @param {vec3} start ray start
	* @param {vec3} direction ray direction (normalized)
	* @param {vec3} center center of the sphere
	* @param {number} radius radius of the sphere
	* @param {vec3} result collision position
	* @param {number} max_dist not fully tested
	* @return {boolean} returns if the ray collides the sphere
	*/
	testRaySphere: (function() { 
		var temp = vec3.create();
		return function(start, direction, center, radius, result, max_dist)
		{
			// sphere equation (centered at origin) x2+y2+z2=r2
			// ray equation x(t) = p0 + t*dir
			// substitute x(t) into sphere equation
			// solution below:

			// transform ray origin into sphere local coordinates
			var orig = vec3.subtract( temp , start, center);

			var a = direction[0]*direction[0] + direction[1]*direction[1] + direction[2]*direction[2];
			var b = 2*orig[0]*direction[0] + 2*orig[1]*direction[1] + 2*orig[2]*direction[2];
			var c = orig[0]*orig[0] + orig[1]*orig[1] + orig[2]*orig[2] - radius*radius;
			//return quadraticFormula(a,b,c,t0,t1) ? 2 : 0;

			var q = b*b - 4*a*c; 
			if( q < 0.0 )
				return false;

			if(result)
			{
				var sq = Math.sqrt(q);
				var d = 1 / (2*a);
				var r1 = ( -b + sq ) * d;
				var r2 = ( -b - sq ) * d;
				var t = r1 < r2 ? r1 : r2;
				if(t > max_dist)
					return false;
				vec3.add(result, start, vec3.scale( result, direction, t ) );
			}
			return true;//real roots
		};
	})(),

	/**
	* test a ray cylinder collision and retrieves the collision point
	* @method testRaySphere
	* @param {vec3} start ray start
	* @param {vec3} direction ray direction
	* @param {vec3} p center of the cylinder
	* @param {number} q height of the cylinder
	* @param {number} r radius of the cylinder
	* @param {vec3} result collision position
	* @return {boolean} returns if the ray collides the cylinder
	*/
	testRayCylinder: function(start, direction, p, q, r, result)
	{
		var sa = vec3.clone(start);
		var sb = vec3.add(vec3.create(), start, vec3.scale( vec3.create(), direction, 100000) );
		var t = 0;
		var d = vec3.subtract(vec3.create(),q,p);
		var m = vec3.subtract(vec3.create(),sa,p);
		var n = vec3.subtract(vec3.create(),sb,sa);
		//var n = vec3.create(direction);

		var md = vec3.dot(m, d);
		var nd = vec3.dot(n, d);
		var dd = vec3.dot(d, d);

		// Test if segment fully outside either endcap of cylinder
		if (md < 0.0 && md + nd < 0.0) return false; // Segment outside ’p’ side of cylinder
		if (md > dd && md + nd > dd) return false; // Segment outside ’q’ side of cylinder

		var nn = vec3.dot(n, n);
		var mn = vec3.dot(m, n);
		var a = dd * nn - nd * nd; 
		var k = vec3.dot(m,m) - r*r;
		var c = dd * k - md * md;

		if (Math.abs(a) < EPSILON) 
		{
			// Segment runs parallel to cylinder axis
			if (c > 0.0) return false;
			// ’a’ and thus the segment lie outside cylinder
			// Now known that segment intersects cylinder; figure out how it intersects
			if (md < 0.0) t = -mn/nn;
			// Intersect segment against ’p’ endcap
			else if (md > dd)
				t=(nd-mn)/nn;
			// Intersect segment against ’q’ endcap
			else t = 0.0;
			// ’a’ lies inside cylinder
			if(result) vec3.add(result, sa, vec3.scale(vec3.create(), n,t) );
			return true;
		}
		var b = dd * mn - nd * md;
		var discr = b*b - a*c;
		if (discr < 0.0) 
			return false;
		// No real roots; no intersection
		t = (-b - Math.sqrt(discr)) / a;
		if (t < 0.0 || t > 1.0) 
			return false;
		// Intersection lies outside segment
		if(md+t*nd < 0.0)
		{
			// Intersection outside cylinder on ’p’ side
			if (nd <= 0.0) 
				return false;
			// Segment pointing away from endcap
			t = -md / nd;
			// Keep intersection if Dot(S(t) - p, S(t) - p) <= r^2
			if(result) vec3.add(result, sa, vec3.scale(vec3.create(), n,t) );

			return k+2*t*(mn+t*nn) <= 0.0;
		} else if (md+t*nd>dd)
		{
			// Intersection outside cylinder on ’q’ side
			if (nd >= 0.0) return false; //Segment pointing away from endcap
			t = (dd - md) / nd;
			// Keep intersection if Dot(S(t) - q, S(t) - q) <= r^2
			if(result) vec3.add(result, sa, vec3.scale(vec3.create(), n,t) );
			return k+dd - 2*md+t*(2*(mn - nd)+t*nn) <= 0.0;
		}
		// Segment intersects cylinder between the endcaps; t is correct
		if(result) vec3.add(result, sa, vec3.scale(vec3.create(), n,t) );
		return true;
	},


	/**
	* test a ray bounding-box collision and retrieves the collision point, the BB must be Axis Aligned
	* @method testRayBox
	* @param {vec3} start ray start
	* @param {vec3} direction ray direction
	* @param {vec3} minB minimum position of the bounding box
	* @param {vec3} maxB maximim position of the bounding box
	* @param {vec3} result collision position
	* @return {boolean} returns if the ray collides the box
	*/
	testRayBox: (function() { 
	
		var quadrant = new Float32Array(3);
		var candidatePlane = new Float32Array(3);
		var maxT = new Float32Array(3);
	
	return function(start, direction, minB, maxB, result, max_dist)
	{
		//#define NUMDIM	3
		//#define RIGHT		0
		//#define LEFT		1
		//#define MIDDLE	2

		max_dist = max_dist || Number.MAX_VALUE;

		var inside = true;
		var i = 0|0;
		var whichPlane;
		
		quadrant.fill(0);
		maxT.fill(0);
		candidatePlane.fill(0);

		/* Find candidate planes; this loop can be avoided if
		rays cast all from the eye(assume perpsective view) */
		for (i=0; i < 3; ++i)
			if(start[i] < minB[i]) {
				quadrant[i] = 1;
				candidatePlane[i] = minB[i];
				inside = false;
			}else if (start[i] > maxB[i]) {
				quadrant[i] = 0;
				candidatePlane[i] = maxB[i];
				inside = false;
			}else	{
				quadrant[i] = 2;
			}

		/* Ray origin inside bounding box */
		if(inside)	{
			if(result)
				vec3.copy(result, start);
			return true;
		}


		/* Calculate T distances to candidate planes */
		for (i = 0; i < 3; ++i)
			if (quadrant[i] != 2 && direction[i] != 0.)
				maxT[i] = (candidatePlane[i] - start[i]) / direction[i];
			else
				maxT[i] = -1.;

		/* Get largest of the maxT's for final choice of intersection */
		whichPlane = 0;
		for (i = 1; i < 3; i++)
			if (maxT[whichPlane] < maxT[i])
				whichPlane = i;

		/* Check final candidate actually inside box */
		if (maxT[whichPlane] < 0.) return false;
		if (maxT[whichPlane] > max_dist) return false; //NOT TESTED

		for (i = 0; i < 3; ++i)
			if (whichPlane != i) {
				var res = start[i] + maxT[whichPlane] * direction[i];
				if (res < minB[i] || res > maxB[i])
					return false;
				if(result)
					result[i] = res;
			} else {
				if(result)
					result[i] = candidatePlane[i];
			}
		return true;				/* ray hits box */
	}
	})(),	

	/**
	* test a ray bounding-box collision, it uses the  BBox class and allows to use non-axis aligned bbox
	* @method testRayBBox
	* @param {vec3} origin ray origin
	* @param {vec3} direction ray direction
	* @param {BBox} box in BBox format
	* @param {mat4} model transformation of the BBox [optional]
	* @param {vec3} result collision position in world space unless in_local is true
	* @return {boolean} returns if the ray collides the box
	*/
	testRayBBox: (function(){ 
	var inv = mat4.create();	
	var end = vec3.create();
	var origin2 = vec3.create();
	return function( origin, direction, box, model, result, max_dist, in_local )
	{
		if(!origin || !direction || !box)
			throw("parameters missing");
		if(model)
		{
			mat4.invert( inv, model );
			vec3.add( end, origin, direction );
			origin = vec3.transformMat4( origin2, origin, inv);
			vec3.transformMat4( end, end, inv );
			vec3.sub( end, end, origin );
			direction = vec3.normalize( end, end );
		}
		var r = this.testRayBox( origin, direction, box.subarray(6,9), box.subarray(9,12), result, max_dist );
		if(!in_local && model && result)
			vec3.transformMat4(result, result, model);
		return r;
	}
	})(),

	/**
	* test if a 3d point is inside a BBox
	* @method testPointBBox
	* @param {vec3} point
	* @param {BBox} bbox
	* @return {boolean} true if it is inside
	*/
	testPointBBox: function(point, bbox) {
		if(point[0] < bbox[6] || point[0] > bbox[9] ||
			point[1] < bbox[7] || point[0] > bbox[10] ||
			point[2] < bbox[8] || point[0] > bbox[11])
			return false;
		return true;
	},

	/**
	* test if a BBox overlaps another BBox
	* @method testBBoxBBox
	* @param {BBox} a
	* @param {BBox} b
	* @return {boolean} true if it overlaps
	*/
	testBBoxBBox: function(a, b) 
	{
		var tx =  Math.abs( b[0] - a[0]);
		if (tx > (a[3] + b[3]))
			return false; //outside
		var ty =  Math.abs(b[1] - a[1]);
		if (ty > (a[4] + b[4]))
			return false; //outside
		var tz =  Math.abs( b[2] - a[2]);
		if (tz > (a[5] + b[5]) )
			return false; //outside

		var vmin = BBox.getMin(b);
		if ( geo.testPointBBox(vmin, a) )
		{
			var vmax = BBox.getMax(b);
			if (geo.testPointBBox(vmax, a))
			{
				return true;// INSIDE;// this instance contains b
			}
		}

		return true; //OVERLAP; // this instance  overlaps with b
	},

	/**
	* test if a sphere overlaps a BBox
	* @method testSphereBBox
	* @param {vec3} point
	* @param {float} radius
	* @param {BBox} bounding_box
	* @return {boolean} true if it overlaps
	*/
	testSphereBBox: function(center, radius, bbox) 
	{
		// arvo's algorithm from gamasutra
		// http://www.gamasutra.com/features/19991018/Gomez_4.htm

		var s, d = 0.0;
		//find the square of the distance
		//from the sphere to the box
		var vmin = BBox.getMin( bbox );
		var vmax = BBox.getMax( bbox );
		for(var i = 0; i < 3; ++i) 
		{ 
			if( center[i] < vmin[i] )
			{
				s = center[i] - vmin[i];
				d += s*s; 
			}
			else if( center[i] > vmax[i] )
			{ 
				s = center[i] - vmax[i];
				d += s*s; 
			}
		}
		//return d <= r*r

		var radiusSquared = radius * radius;
		if (d <= radiusSquared)
		{
			return true;
			/*
			// this is used just to know if it overlaps or is just inside, but I dont care
			// make an aabb aabb test with the sphere aabb to test inside state
			var halfsize = vec3.fromValues( radius, radius, radius );
			var sphere_bbox = BBox.fromCenterHalfsize( center, halfsize );
			if ( geo.testBBoxBBox(bbox, sphere_bbox) )
				return INSIDE;
			return OVERLAP;	
			*/
		}

		return false; //OUTSIDE;
	},

	closestPointBetweenLines: function(a0,a1, b0,b1, p_a, p_b)
	{
		var u = vec3.subtract( vec3.create(), a1, a0 );
		var v = vec3.subtract( vec3.create(), b1, b0 );
		var w = vec3.subtract( vec3.create(), a0, b0 );

		var a = vec3.dot(u,u);         // always >= 0
		var b = vec3.dot(u,v);
		var c = vec3.dot(v,v);         // always >= 0
		var d = vec3.dot(u,w);
		var e = vec3.dot(v,w);
		var D = a*c - b*b;        // always >= 0
		var sc, tc;

		// compute the line parameters of the two closest points
		if (D < EPSILON) {          // the lines are almost parallel
			sc = 0.0;
			tc = (b>c ? d/b : e/c);    // use the largest denominator
		}
		else {
			sc = (b*e - c*d) / D;
			tc = (a*e - b*d) / D;
		}

		// get the difference of the two closest points
		if(p_a)	vec3.add(p_a, a0, vec3.scale(vec3.create(),u,sc));
		if(p_b)	vec3.add(p_b, b0, vec3.scale(vec3.create(),v,tc));

		var dP = vec3.add( vec3.create(), w, vec3.subtract( vec3.create(), vec3.scale(vec3.create(),u,sc) , vec3.scale(vec3.create(),v,tc)) );  // =  L1(sc) - L2(tc)
		return vec3.length(dP);   // return the closest distance
	},

	/**
	* extract frustum planes given a view-projection matrix
	* @method extractPlanes
	* @param {mat4} viewprojection matrix
	* @return {Float32Array} returns all 6 planes in a float32array[24]
	*/
	extractPlanes: function(vp, planes)
	{
		var planes = planes || new Float32Array(4*6);

		//right
		planes.set( [vp[3] - vp[0], vp[7] - vp[4], vp[11] - vp[8], vp[15] - vp[12] ], 0); 
		normalize(0);

		//left
		planes.set( [vp[3] + vp[0], vp[ 7] + vp[ 4], vp[11] + vp[ 8], vp[15] + vp[12] ], 4);
		normalize(4);

		//bottom
		planes.set( [ vp[ 3] + vp[ 1], vp[ 7] + vp[ 5], vp[11] + vp[ 9], vp[15] + vp[13] ], 8);
		normalize(8);

		//top
		planes.set( [ vp[ 3] - vp[ 1], vp[ 7] - vp[ 5], vp[11] - vp[ 9], vp[15] - vp[13] ],12);
		normalize(12);

		//back
		planes.set( [ vp[ 3] - vp[ 2], vp[ 7] - vp[ 6], vp[11] - vp[10], vp[15] - vp[14] ],16);
		normalize(16);

		//front
		planes.set( [ vp[ 3] + vp[ 2], vp[ 7] + vp[ 6], vp[11] + vp[10], vp[15] + vp[14] ],20);
		normalize(20);

		return planes;

		function normalize(pos)
		{
			var N = planes.subarray(pos,pos+3);
			var l = vec3.length(N);
			if(l === 0) return;
			l = 1.0 / l;
			planes[pos] *= l;
			planes[pos+1] *= l;
			planes[pos+2] *= l;
			planes[pos+3] *= l;
		}
	},

	/**
	* test a BBox against the frustum
	* @method frustumTestBox
	* @param {Float32Array} planes frustum planes
	* @param {BBox} boundindbox in BBox format
	* @return {enum} CLIP_INSIDE, CLIP_OVERLAP, CLIP_OUTSIDE
	*/
	frustumTestBox: function(planes, box)
	{
		var flag = 0, o = 0;

		flag = planeBoxOverlap(planes.subarray(0,4),box);
		if (flag == CLIP_OUTSIDE) return CLIP_OUTSIDE; o+= flag;
		flag =  planeBoxOverlap(planes.subarray(4,8),box);
		if (flag == CLIP_OUTSIDE) return CLIP_OUTSIDE; o+= flag;
		flag =  planeBoxOverlap(planes.subarray(8,12),box);
		if (flag == CLIP_OUTSIDE) return CLIP_OUTSIDE; o+= flag;
		flag =  planeBoxOverlap(planes.subarray(12,16),box);
		if (flag == CLIP_OUTSIDE) return CLIP_OUTSIDE; o+= flag;
		flag =  planeBoxOverlap(planes.subarray(16,20),box);
		if (flag == CLIP_OUTSIDE) return CLIP_OUTSIDE; o+= flag;
		flag =  planeBoxOverlap(planes.subarray(20,24),box);
		if (flag == CLIP_OUTSIDE) return CLIP_OUTSIDE; o+= flag;

		return o == 0 ? CLIP_INSIDE : CLIP_OVERLAP;
	},

	/**
	* test a Sphere against the frustum
	* @method frustumTestSphere
	* @param {vec3} center sphere center
	* @param {number} radius sphere radius
	* @return {enum} CLIP_INSIDE, CLIP_OVERLAP, CLIP_OUTSIDE
	*/

	frustumTestSphere: function(planes, center, radius)
	{
		var dist;
		var overlap = false;

		dist = distanceToPlane( planes.subarray(0,4), center );
		if( dist < -radius ) return CLIP_OUTSIDE;
		else if(dist >= -radius && dist <= radius)	overlap = true;
		dist = distanceToPlane( planes.subarray(4,8), center );
		if( dist < -radius ) return CLIP_OUTSIDE;
		else if(dist >= -radius && dist <= radius)	overlap = true;
		dist = distanceToPlane( planes.subarray(8,12), center );
		if( dist < -radius ) return CLIP_OUTSIDE;
		else if(dist >= -radius && dist <= radius)	overlap = true;
		dist = distanceToPlane( planes.subarray(12,16), center );
		if( dist < -radius ) return CLIP_OUTSIDE;
		else if(dist >= -radius && dist <= radius)	overlap = true;
		dist = distanceToPlane( planes.subarray(16,20), center );
		if( dist < -radius ) return CLIP_OUTSIDE;
		else if(dist >= -radius && dist <= radius)	overlap = true;
		dist = distanceToPlane( planes.subarray(20,24), center );
		if( dist < -radius ) return CLIP_OUTSIDE;
		else if(dist >= -radius && dist <= radius)	overlap = true;
		return overlap ? CLIP_OVERLAP : CLIP_INSIDE;
	},


	/**
	* test if a 2d point is inside a 2d polygon
	* @method testPoint2DInPolygon
	* @param {Array} poly array of 2d points
	* @param {vec2} point
	* @return {boolean} true if it is inside
	*/
	testPoint2DInPolygon: function(poly, pt) {
    for(var c = false, i = -1, l = poly.length, j = l - 1; ++i < l; j = i)
        ((poly[i][1] <= pt[1] && pt[1] < poly[j][1]) || (poly[j][1] <= pt[1] && pt[1] < poly[i][1]))
        && (pt[0] < (poly[j][0] - poly[i][0]) * (pt[1] - poly[i][1]) / (poly[j][1] - poly[i][1]) + poly[i][0])
        && (c = !c);
    return c;
	}
};

/**
* BBox is a class to create BoundingBoxes but it works as glMatrix, creating Float32Array with the info inside instead of objects
* The bounding box is stored as center,halfsize,min,max,radius (total of 13 floats)
* @class BBox
*/
global.BBox = GL.BBox = {
	center:0,
	halfsize:3,
	min:6,
	max:9,
	radius:12,
	data_length: 13,
	
	corners: new Float32Array([1,1,1,  1,1,-1,  1,-1,1,  1,-1,-1,  -1,1,1,  -1,1,-1,  -1,-1,1,  -1,-1,-1 ]),
	tmp_corners: new Float32Array(24), //to avoid GC

	/**
	* create an empty bbox
	* @method create
	* @return {BBox} returns a float32array with the bbox
	*/
	create: function()
	{
		return new Float32Array(13);
	},

	/**
	* create an bbox copy from another one
	* @method clone
	* @return {BBox} returns a float32array with the bbox
	*/
	clone: function(bb)
	{
		return new Float32Array(bb);
	},

	/**
	* copy one bbox into another
	* @method copy
	* @param {BBox} out where to store the result
	* @param {BBox} where to read the bbox
	* @return {BBox} returns out
	*/
	copy: function(out,bb)
	{
		out.set(bb);
		return out;
	},	

	/**
	* create a bbox from one point
	* @method fromPoint
	* @param {vec3} point
	* @return {BBox} returns a float32array with the bbox
	*/
	fromPoint: function(point)
	{
		var bb = this.create();
		bb.set(point, 0); //center
		bb.set(point, 6); //min
		bb.set(point, 9); //max
		return bb;
	},

	/**
	* create a bbox from min and max points
	* @method fromMinMax
	* @param {vec3} min
	* @param {vec3} max
	* @return {BBox} returns a float32array with the bbox
	*/
	fromMinMax: function(min,max)
	{
		var bb = this.create();
		this.setMinMax(bb, min, max);
		return bb;
	},

	/**
	* create a bbox from center and halfsize
	* @method fromCenterHalfsize
	* @param {vec3} center
	* @param {vec3} halfsize
	* @return {BBox} returns a float32array with the bbox
	*/
	fromCenterHalfsize: function(center, halfsize)
	{
		var bb = this.create();
		this.setCenterHalfsize(bb, center, halfsize);
		return bb;
	},

	/**
	* create a bbox from a typed-array containing points
	* @method fromPoints
	* @param {Float32Array} points
	* @return {BBox} returns a float32array with the bbox
	*/
	fromPoints: function(points)
	{
		var bb = this.create();
		this.setFromPoints(bb, points);
		return bb;	
	},

	/**
	* set the values to a BB from a set of points
	* @method setFromPoints
	* @param {BBox} out where to store the result
	* @param {Float32Array} points
	* @return {BBox} returns a float32array with the bbox
	*/
	setFromPoints: function(bb, points)
	{
		var min = bb.subarray(6,9);
		var max = bb.subarray(9,12);

		min.set( points.subarray(0,3) );
		max.set( min );

		var v = 0;
		for(var i = 3, l = points.length; i < l; i+=3)
		{
			v = points.subarray(i,i+3);
			vec3.min( min, v, min);
			vec3.max( max, v, max);
		}

		var center = vec3.add( bb.subarray(0,3), min, max );
		vec3.scale( center, center, 0.5);
		vec3.subtract( bb.subarray(3,6), max, center );
		bb[12] = vec3.length(bb.subarray(3,6)); //radius		
		return bb;
	},

	/**
	* set the values to a BB from min and max
	* @method setMinMax
	* @param {BBox} out where to store the result
	* @param {vec3} min
	* @param {vec3} max
	* @return {BBox} returns out
	*/
	setMinMax: function(bb, min, max)
	{
		bb[6] = min[0];
		bb[7] = min[1];
		bb[8] = min[2];
		bb[9] = max[0];
		bb[10] = max[1];
		bb[11] = max[2];

		//halfsize
		var halfsize = bb.subarray(3,6); 
		vec3.sub( halfsize, max, min ); //range
		vec3.scale( halfsize, halfsize, 0.5 );

		//center
		bb[0] = max[0] - halfsize[0];
		bb[1] = max[1] - halfsize[1];
		bb[2] = max[2] - halfsize[2];

		bb[12] = vec3.length(bb.subarray(3,6)); //radius
		return bb;
	},

	/**
	* set the values to a BB from center and halfsize
	* @method setCenterHalfsize
	* @param {BBox} out where to store the result
	* @param {vec3} min
	* @param {vec3} max
	* @param {number} radius [optional] (the minimum distance from the center to the further point)
	* @return {BBox} returns out
	*/
	setCenterHalfsize: function(bb, center, halfsize, radius)
	{
		bb[0] = center[0];
		bb[1] = center[1];
		bb[2] = center[2];
		bb[3] = halfsize[0];
		bb[4] = halfsize[1];
		bb[5] = halfsize[2];

		vec3.sub(bb.subarray(6,9), bb.subarray(0,3), bb.subarray(3,6) );
		vec3.add(bb.subarray(9,12), bb.subarray(0,3), bb.subarray(3,6) );
		if(radius)
			bb[12] = radius;
		else
			bb[12] = vec3.length(halfsize);
		return bb;
	},

	/**
	* Apply a matrix transformation to the BBox (applies to every corner and recomputes the BB)
	* @method setCenterHalfsize
	* @param {BBox} out where to store the result
	* @param {BBox} bb bbox you want to transform
	* @param {mat4} mat transformation
	* @return {BBox} returns out
	*/
	transformMat4: function(out, bb, mat)
	{
		var center = bb; //.subarray(0,3); AVOID GC
		var halfsize = bb.subarray(3,6);
		var corners = this.tmp_corners;
		corners.set( this.corners );

		for(var i = 0; i < 8; ++i)		
		{
			var corner = corners.subarray(i*3, i*3+3);
			vec3.multiply( corner, halfsize, corner );
			vec3.add( corner, corner, center );
			mat4.multiplyVec3(corner, mat, corner);
		}

		return this.setFromPoints(out, corners);
	},


	/**
	* Computes the eight corners of the BBox and returns it
	* @method getCorners
	* @param {BBox} bb the bounding box
	* @param {Float32Array} result optional, should be 8 * 3
	* @return {Float32Array} returns the 8 corners
	*/
	getCorners: function(bb, result)
	{
		var center = bb; //.subarray(0,3); AVOID GC
		var halfsize = bb.subarray(3,6);

		var corners = null;
		if(result)
		{
			result.set(this.corners);
			corners = result;
		}
		else
			corners = new Float32Array( this.corners );

		for(var i = 0; i < 8; ++i)		
		{
			var corner = corners.subarray(i*3, i*3+3);
			vec3.multiply( corner, halfsize, corner );
			vec3.add( corner, corner, center );
		}

		return corners;
	},	

	merge: function( out, a, b )
	{
		var min = out.subarray(6,9);
		var max = out.subarray(9,12);
		vec3.min( min, a.subarray(6,9), b.subarray(6,9) );
		vec3.max( max, a.subarray(9,12), b.subarray(9,12) );
		return BBox.setMinMax( out, min, max );
	},

	extendToPoint: function( out, p )
	{
		if( p[0] < out[6] )	out[6] = p[0];
		else if( p[0] > out[9] ) out[9] = p[0];

		if( p[1] < out[7] )	out[7] = p[1];
		else if( p[1] > out[10] ) out[10] = p[1];


		if( p[2] < out[8] )	out[8] = p[2];
		else if( p[2] > out[11] ) out[11] = p[2];

		//recompute 
		var min = out.subarray(6,9);
		var max = out.subarray(9,12);
		var center = vec3.add( out.subarray(0,3), min, max );
		vec3.scale( center, center, 0.5);
		vec3.subtract( out.subarray(3,6), max, center );
		out[12] = vec3.length( out.subarray(3,6) ); //radius		
		return out;
	},

	getCenter: function(bb) { return bb.subarray(0,3); },
	getHalfsize: function(bb) { return bb.subarray(3,6); },
	getMin: function(bb) { return bb.subarray(6,9); },
	getMax: function(bb) { return bb.subarray(9,12); },
	getRadius: function(bb) { return bb[12]; }	
}

global.distanceToPlane = GL.distanceToPlane = function distanceToPlane(plane, point)
{
	return vec3.dot(plane,point) + plane[3];
}

global.planeBoxOverlap = GL.planeBoxOverlap = function planeBoxOverlap(plane, box)
{
	var n = plane; //.subarray(0,3); 
	var d = plane[3];
	//hack, to avoif GC I use indices directly
	var center = box; //.subarray(0,3);
	var halfsize = box; //.subarray(3,6);

	var tmp = vec3.fromValues(
		Math.abs( halfsize[3] * n[0] ),
		Math.abs( halfsize[4] * n[1] ),
		Math.abs( halfsize[5] * n[2] )
	);

	var radius = tmp[0]+tmp[1]+tmp[2];
	var distance = vec3.dot(n,center) + d;

	if (distance <= - radius) return CLIP_OUTSIDE;
	else if (distance <= radius) return CLIP_OVERLAP;
	else return CLIP_INSIDE;
}

/**
* @namespace GL
*/

/**
*   Octree generator for fast ray triangle collision with meshes
*	Dependencies: glmatrix.js (for vector and matrix operations)
* @class Octree
* @constructor
* @param {Mesh} mesh object containing vertices buffer (indices buffer optional)
*/

global.Octree = GL.Octree = function Octree( mesh )
{
	this.root = null;
	this.total_depth = 0;
	this.total_nodes = 0;
	if(mesh)
	{
		this.buildFromMesh(mesh);
		this.total_nodes = this.trim();
	}
}

Octree.MAX_NODE_TRIANGLES_RATIO = 0.1;
Octree.MAX_OCTREE_DEPTH = 8;
Octree.OCTREE_MARGIN_RATIO = 0.01;
Octree.OCTREE_MIN_MARGIN = 0.1;

var octree_tested_boxes = 0;
var octree_tested_triangles = 0;

Octree.prototype.buildFromMesh = function(mesh)
{
	this.total_depth = 0;
	this.total_nodes = 0;

	var vertices = mesh.getBuffer("vertices").data;
	var triangles = mesh.getIndexBuffer("triangles");
	if(triangles) 
		triangles = triangles.data; //get the internal data

	var root = this.computeAABB(vertices);
	this.root = root;
	this.total_nodes = 1;
	this.total_triangles = triangles ? triangles.length / 3 : vertices.length / 9;
	this.max_node_triangles = this.total_triangles * Octree.MAX_NODE_TRIANGLES_RATIO;

	var margin = vec3.create();
	vec3.scale( margin, root.size, Octree.OCTREE_MARGIN_RATIO );
	if(margin[0] < Octree.OCTREE_MIN_MARGIN) margin[0] = Octree.OCTREE_MIN_MARGIN;
	if(margin[1] < Octree.OCTREE_MIN_MARGIN) margin[1] = Octree.OCTREE_MIN_MARGIN;
	if(margin[2] < Octree.OCTREE_MIN_MARGIN) margin[2] = Octree.OCTREE_MIN_MARGIN;

	vec3.sub(root.min, root.min, margin);
	vec3.add(root.max, root.max, margin);

	root.faces = [];
	root.inside = 0;


	//indexed
	if(triangles)
	{
		for(var i = 0; i < triangles.length; i+=3)
		{
			var face = new Float32Array([vertices[triangles[i]*3], vertices[triangles[i]*3+1],vertices[triangles[i]*3+2],
						vertices[triangles[i+1]*3], vertices[triangles[i+1]*3+1],vertices[triangles[i+1]*3+2],
						vertices[triangles[i+2]*3], vertices[triangles[i+2]*3+1],vertices[triangles[i+2]*3+2]]);
			this.addToNode(face,root,0);
		}
	}
	else
	{
		for(var i = 0; i < vertices.length; i+=9)
		{
			var face = new Float32Array( vertices.subarray(i,i+9) );
			this.addToNode(face,root,0);
		}
	}

	return root;
}

Octree.prototype.addToNode = function(face,node, depth)
{
	node.inside += 1;

	//has children
	if(node.c)
	{
		var aabb = this.computeAABB(face);
		var added = false;
		for(var i in node.c)
		{
			var child = node.c[i];
			if (Octree.isInsideAABB(aabb,child))
			{
				this.addToNode(face,child, depth+1);
				added = true;
				break;
			}
		}
		if(!added)
		{
			if(node.faces == null)
				node.faces = [];
			node.faces.push(face);
		}
	}
	else //add till full, then split
	{
		if(node.faces == null) node.faces = [];
		node.faces.push(face);

		//split
		if(node.faces.length > this.max_node_triangles && depth < Octree.MAX_OCTREE_DEPTH)
		{
			this.splitNode(node);
			if(this.total_depth < depth + 1)
				this.total_depth = depth + 1;

			var faces = node.faces.concat();
			node.faces = null;

			//redistribute all nodes
			for(var i in faces)
			{
				var face = faces[i];
				var aabb = this.computeAABB(face);
				var added = false;
				for(var j in node.c)
				{
					var child = node.c[j];
					if (Octree.isInsideAABB(aabb,child))
					{
						this.addToNode(face,child, depth+1);
						added = true;
						break;
					}
				}
				if (!added)
				{
					if(node.faces == null)
						node.faces = [];
					node.faces.push(face);
				}
			}
		}
	}
};

Octree.prototype.octree_pos_ref = [[0,0,0],[0,0,1],[0,1,0],[0,1,1],[1,0,0],[1,0,1],[1,1,0],[1,1,1]];

Octree.prototype.splitNode = function(node)
{
	node.c = [];
	var half = [(node.max[0] - node.min[0]) * 0.5, (node.max[1] - node.min[1]) * 0.5, (node.max[2] - node.min[2]) * 0.5];

	for(var i in this.octree_pos_ref)
	{
		var ref = this.octree_pos_ref[i];

		var newnode = {};
		this.total_nodes += 1;

		newnode.min = [ node.min[0] + half[0] * ref[0],  node.min[1] + half[1] * ref[1],  node.min[2] + half[2] * ref[2]];
		newnode.max = [newnode.min[0] + half[0], newnode.min[1] + half[1], newnode.min[2] + half[2]];
		newnode.faces = null;
		newnode.inside = 0;
		node.c.push(newnode);
	}
}

Octree.prototype.computeAABB = function(vertices)
{
	var min = new Float32Array([ vertices[0], vertices[1], vertices[2] ]);
	var max = new Float32Array([ vertices[0], vertices[1], vertices[2] ]);

	for(var i = 0; i < vertices.length; i+=3)
	{
		for(var j = 0; j < 3; j++)
		{
			if(min[j] > vertices[i+j]) 
				min[j] = vertices[i+j];
			if(max[j] < vertices[i+j]) 
				max[j] = vertices[i+j];
		}
	}

	return {min: min, max: max, size: vec3.sub( vec3.create(), max, min) };
}

//remove empty nodes
Octree.prototype.trim = function(node)
{
	node = node || this.root;
	if(!node.c)
		return 1;

	var num = 1;
	var valid = [];
	var c = node.c;
	for(var i = 0; i < c.length; ++i)
	{
		if(c[i].inside)
		{
			valid.push(c[i]);
			num += this.trim(c[i]);
		}
	}
	node.c = valid;
	return num;
}

/**
* Test collision between ray and triangles in the octree
* @method testRay
* @param {vec3} origin ray origin position
* @param {vec3} direction ray direction position
* @param {number} dist_min
* @param {number} dist_max
* @return {HitTest} object containing pos and normal
*/
Octree.prototype.testRay = (function(){ 
	var origin_temp = vec3.create();
	var direction_temp = vec3.create();
	var min_temp = vec3.create();
	var max_temp = vec3.create();

	return function(origin, direction, dist_min, dist_max)
	{
		octree_tested_boxes = 0;
		octree_tested_triangles = 0;

		if(!this.root)
		{
			throw("Error: octree not build");
		}

		origin_temp.set( origin );
		direction_temp.set( direction );
		min_temp.set( this.root.min );
		max_temp.set( this.root.max );

		var test = Octree.hitTestBox( origin_temp, direction_temp, min_temp, max_temp );
		if(!test) //no collision with mesh bounding box
			return null;

		var test = Octree.testRayInNode( this.root, origin_temp, direction_temp );
		if(test != null)
		{
			var pos = vec3.scale( vec3.create(), direction, test.t );
			vec3.add( pos, pos, origin );
			test.pos = pos;
			return test;
		}

		return null;
	}
})();

/**
* test collision between sphere and the triangles in the octree (only test if there is any vertex inside the sphere)
* @method testSphere
* @param {vec3} origin sphere center
* @param {number} radius
* @return {Boolean} true if the sphere collided with the mesh
*/
Octree.prototype.testSphere = function( origin, radius )
{
	origin = vec3.clone(origin);
	octree_tested_boxes = 0;
	octree_tested_triangles = 0;

	if(!this.root)
		throw("Error: octree not build");

	//better to use always the radius squared, because all the calculations are going to do that
	var rr = radius * radius;

	if( !Octree.testSphereBox( origin, rr, vec3.clone(this.root.min), vec3.clone(this.root.max) ) )
		return false; //out of the box

	return Octree.testSphereInNode( this.root, origin, rr );
}

//WARNING: cannot use static here, it uses recursion
Octree.testRayInNode = function( node, origin, direction )
{
	var test = null;
	var prev_test = null;
	octree_tested_boxes += 1;

	//test faces
	if(node.faces)
		for(var i = 0, l = node.faces.length; i < l; ++i)
		{
			var face = node.faces[i];
			octree_tested_triangles += 1;
			test = Octree.hitTestTriangle( origin, direction, face.subarray(0,3) , face.subarray(3,6), face.subarray(6,9) );
			if (test==null)
				continue;
			test.face = face;
			if(prev_test)
				prev_test.mergeWith( test );
			else
				prev_test = test;
		}

	//WARNING: cannot use statics here, this function uses recursion
	var child_min = vec3.create();
	var child_max = vec3.create();

	//test children nodes faces
	var child;
	if(node.c)
		for(var i = 0; i < node.c.length; ++i)
		{
			child = node.c[i];
			child_min.set( child.min );
			child_max.set( child.max );

			//test with node box
			test = Octree.hitTestBox( origin, direction, child_min, child_max );
			if( test == null )
				continue;

			//nodebox behind current collision, then ignore node
			if(prev_test && test.t > prev_test.t)
				continue;

			//test collision with node
			test = Octree.testRayInNode( child, origin, direction );
			if(test == null)
				continue;

			if(prev_test)
				prev_test.mergeWith( test );
			else
				prev_test = test;
		}

	return prev_test;
}

//WARNING: cannot use static here, it uses recursion
Octree.testSphereInNode = function( node, origin, radius2 )
{
	var test = null;
	var prev_test = null;
	octree_tested_boxes += 1;

	//test faces
	if(node.faces)
		for(var i = 0, l = node.faces.length; i < l; ++i)
		{
			var face = node.faces[i];
			octree_tested_triangles += 1;
			if( Octree.testSphereTriangle( origin, radius2, face.subarray(0,3) , face.subarray(3,6), face.subarray(6,9) ) )
				return true;
		}

	//WARNING: cannot use statics here, this function uses recursion
	var child_min = vec3.create();
	var child_max = vec3.create();

	//test children nodes faces
	var child;
	if(node.c)
		for(var i = 0; i < node.c.length; ++i)
		{
			child = node.c[i];
			child_min.set( child.min );
			child_max.set( child.max );

			//test with node box
			if( !Octree.testSphereBox( origin, radius2, child_min, child_max ) )
				continue;

			//test collision with node content
			if( Octree.testSphereInNode( child, origin, radius2 ) )
				return true;
		}

	return false;
}

//test if one bounding is inside or overlapping another bounding
Octree.isInsideAABB = function(a,b)
{
	if(a.min[0] < b.min[0] || a.min[1] < b.min[1] || a.min[2] < b.min[2] ||
		a.max[0] > b.max[0] || a.max[1] > b.max[1] || a.max[2] > b.max[2])
		return false;
	return true;
}


Octree.hitTestBox = (function(){ 
	var tMin = vec3.create();
	var tMax = vec3.create();
	var inv = vec3.create();
	var t1 = vec3.create();
	var t2 = vec3.create();
	var tmp = vec3.create();
	var epsilon = 1.0e-6;
	var eps = vec3.fromValues( epsilon,epsilon,epsilon );
	
	return function( origin, ray, box_min, box_max ) {
		vec3.subtract( tMin, box_min, origin );
		vec3.subtract( tMax, box_max, origin );
		
		if(	vec3.maxValue(tMin) < 0 && vec3.minValue(tMax) > 0)
			return new HitTest(0,origin,ray);

		inv[0] = 1/ray[0];	inv[1] = 1/ray[1];	inv[2] = 1/ray[2];
		vec3.multiply(tMin, tMin, inv);
		vec3.multiply(tMax, tMax, inv);
		vec3.min(t1, tMin, tMax);
		vec3.max(t2, tMin, tMax);
		var tNear = vec3.maxValue(t1);
		var tFar = vec3.minValue(t2);

		if (tNear > 0 && tNear < tFar) {
			var hit = vec3.add( vec3.create(), vec3.scale(tmp, ray, tNear ), origin);
			vec3.add( box_min, box_min, eps);
			vec3.subtract(box_min, box_min, eps);
			return new HitTest(tNear, hit, vec3.fromValues(
			  (hit[0] > box_max[0]) - (hit[0] < box_min[0]),
			  (hit[1] > box_max[1]) - (hit[1] < box_min[1]),
			  (hit[2] > box_max[2]) - (hit[2] < box_min[2]) ));
		}

		return null;
	}
})();

Octree.hitTestTriangle = (function(){ 
	
	var AB = vec3.create();
	var AC = vec3.create();
	var toHit = vec3.create();
	var tmp = vec3.create();
	
	return function(origin, ray, A, B, C) {
		vec3.subtract( AB, B, A );
		vec3.subtract( AC, C, A );
		var normal = vec3.cross( vec3.create(), AB, AC ); //returned
		vec3.normalize( normal, normal );
		if( vec3.dot(normal,ray) > 0)
			return null; //ignore backface

		var t = vec3.dot(normal, vec3.subtract( tmp, A, origin )) / vec3.dot(normal,ray);

	    if (t > 0)
		{
			var hit = vec3.scale(vec3.create(), ray, t); //returned
			vec3.add(hit, hit, origin);
			vec3.subtract( toHit, hit, A );
			var dot00 = vec3.dot(AC,AC);
			var dot01 = vec3.dot(AC,AB);
			var dot02 = vec3.dot(AC,toHit);
			var dot11 = vec3.dot(AB,AB);
			var dot12 = vec3.dot(AB,toHit);
			var divide = dot00 * dot11 - dot01 * dot01;
			var u = (dot11 * dot02 - dot01 * dot12) / divide;
			var v = (dot00 * dot12 - dot01 * dot02) / divide;
			if (u >= 0 && v >= 0 && u + v <= 1)
				return new HitTest(t, hit, normal);
		}
	    return null;
	};
})();

//from http://realtimecollisiondetection.net/blog/?p=103
//radius must be squared
Octree.testSphereTriangle = (function(){ 
	
	var A = vec3.create();
	var B = vec3.create();
	var C = vec3.create();
	var AB = vec3.create();
	var AC = vec3.create();
	var BC = vec3.create();
	var CA = vec3.create();
	var V = vec3.create();
	
	return function( P, rr, A_, B_, C_ ) {
		vec3.sub( A, A_, P );
		vec3.sub( B, B_, P );
		vec3.sub( C, C_, P );

		vec3.sub( AB, B, A );
		vec3.sub( AC, C, A );

		vec3.cross( V, AB, AC );
		var d = vec3.dot( A, V );
		var e = vec3.dot( V, V );
		var sep1 = d * d > rr * e;
		var aa = vec3.dot(A, A);
		var ab = vec3.dot(A, B);
		var ac = vec3.dot(A, C);
		var bb = vec3.dot(B, B);
		var bc = vec3.dot(B, C);
		var cc = vec3.dot(C, C);
		var sep2 = (aa > rr) & (ab > aa) & (ac > aa);
		var sep3 = (bb > rr) & (ab > bb) & (bc > bb);
		var sep4 = (cc > rr) & (ac > cc) & (bc > cc);

		var d1 = ab - aa;
		var d2 = bc - bb;
		var d3 = ac - cc;

		vec3.sub( BC, C, B );
		vec3.sub( CA, A, C );

		var e1 = vec3.dot(AB, AB);
		var e2 = vec3.dot(BC, BC);
		var e3 = vec3.dot(CA, CA);

		var Q1 = vec3.scale(vec3.create(), A, e1); vec3.sub( Q1, Q1, vec3.scale(vec3.create(), AB, d1) );
		var Q2 = vec3.scale(vec3.create(), B, e2); vec3.sub( Q2, Q2, vec3.scale(vec3.create(), BC, d2) );
		var Q3 = vec3.scale(vec3.create(), C, e3); vec3.sub( Q3, Q3, vec3.scale(vec3.create(), CA, d3) );

		var QC = vec3.scale( vec3.create(), C, e1 ); QC = vec3.sub( QC, QC, Q1 );
		var QA = vec3.scale( vec3.create(), A, e2 ); QA = vec3.sub( QA, QA, Q2 );
		var QB = vec3.scale( vec3.create(), B, e3 ); QB = vec3.sub( QB, QB, Q3 );

		var sep5 = ( vec3.dot(Q1, Q1) > rr * e1 * e1) & (vec3.dot(Q1, QC) > 0 );
		var sep6 = ( vec3.dot(Q2, Q2) > rr * e2 * e2) & (vec3.dot(Q2, QA) > 0 );
		var sep7 = ( vec3.dot(Q3, Q3) > rr * e3 * e3) & (vec3.dot(Q3, QB) > 0 );

		var separated = sep1 | sep2 | sep3 | sep4 | sep5 | sep6 | sep7
		return !separated;
	};
})();

Octree.testSphereBox = function( center, radius2, box_min, box_max ) {

	// arvo's algorithm from gamasutra
	// http://www.gamasutra.com/features/19991018/Gomez_4.htm
	var s, d = 0.0;
	//find the square of the distance
	//from the sphere to the box
	for(var i = 0; i < 3; ++i) 
	{ 
		if( center[i] < box_min[i] )
		{
			s = center[i] - box_min[i];
			d += s*s; 
		}
		else if( center[i] > box_max[i] )
		{ 
			s = center[i] - box_max[i];
			d += s*s; 
		}
	}
	//return d <= r*r

	if (d <= radius2)
	{
		return true;
		/*
		// this is used just to know if it overlaps or is just inside, but I dont care
		// make an aabb aabb test with the sphere aabb to test inside state
		var halfsize = vec3.fromValues( radius, radius, radius );
		var sphere_bbox = BBox.fromCenterHalfsize( center, halfsize );
		if ( geo.testBBoxBBox(bbox, sphere_bbox) )
			return INSIDE;
		return OVERLAP;	
		*/
	}

	return false; //OUTSIDE;
};
// Provides a convenient raytracing interface.

// ### new GL.HitTest([t, hit, normal])
// 
// This is the object used to return hit test results. If there are no
// arguments, the constructed argument represents a hit infinitely far
// away.
global.HitTest = GL.HitTest = function HitTest(t, hit, normal) {
  this.t = arguments.length ? t : Number.MAX_VALUE;
  this.hit = hit;
  this.normal = normal;
  this.face = null;
}

// ### .mergeWith(other)
// 
// Changes this object to be the closer of the two hit test results.
HitTest.prototype = {
  mergeWith: function(other) {
    if (other.t > 0 && other.t < this.t) {
      this.t = other.t;
      this.hit = other.hit;
      this.normal = other.normal;
	  this.face = other.face;
    }
  }
};

// ### new GL.Raytracer()
// 
// This will read the current modelview matrix, projection matrix, and viewport,
// reconstruct the eye position, and store enough information to later generate
// per-pixel rays using `getRayForPixel()`.
// 
// Example usage:
// 
//     var tracer = new GL.Raytracer();
//     var ray = tracer.getRayForPixel(
//       gl.canvas.width / 2,
//       gl.canvas.height / 2);
//       var result = GL.Raytracer.hitTestSphere(
//       tracer.eye, ray, new GL.Vector(0, 0, 0), 1);

global.Raytracer = GL.Raytracer = function Raytracer( viewprojection_matrix, viewport ) {
	this.viewport = vec4.create();
	this.ray00 = vec3.create();
	this.ray10 = vec3.create();
	this.ray01 = vec3.create();
	this.ray11 = vec3.create();
	this.eye = vec3.create();
	this.setup( viewprojection_matrix, viewport );
}

Raytracer.prototype.setup = function( viewprojection_matrix, viewport )
{
	viewport = viewport || gl.viewport_data;
	this.viewport.set( viewport );

	var minX = viewport[0], maxX = minX + viewport[2];
	var minY = viewport[1], maxY = minY + viewport[3];

	vec3.set( this.ray00, minX, minY, 1 );
	vec3.set( this.ray10, maxX, minY, 1 );
	vec3.set( this.ray01, minX, maxY, 1 );
	vec3.set( this.ray11, maxX, maxY, 1 );
	vec3.unproject( this.ray00, this.ray00, viewprojection_matrix, viewport);
	vec3.unproject( this.ray10, this.ray10, viewprojection_matrix, viewport);
	vec3.unproject( this.ray01, this.ray01, viewprojection_matrix, viewport);
	vec3.unproject( this.ray11, this.ray11, viewprojection_matrix, viewport);
	var eye = this.eye;
	vec3.unproject(eye, eye, viewprojection_matrix, viewport);
	vec3.subtract(this.ray00, this.ray00, eye);
	vec3.subtract(this.ray10, this.ray10, eye);
	vec3.subtract(this.ray01, this.ray01, eye);
	vec3.subtract(this.ray11, this.ray11, eye);
}

  // ### .getRayForPixel(x, y)
  // 
  // Returns the ray originating from the camera and traveling through the pixel `x, y`.
Raytracer.prototype.getRayForPixel = (function(){ 
	var ray0 = vec3.create();
	var ray1 = vec3.create();
	return function(x, y, out) {
		out = out || vec3.create();
		x = (x - this.viewport[0]) / this.viewport[2];
		y = 1 - (y - this.viewport[1]) / this.viewport[3];
		vec3.lerp(ray0, this.ray00, this.ray10, x);
		vec3.lerp(ray1, this.ray01, this.ray11, x);
		vec3.lerp( out, ray0, ray1, y)
		return vec3.normalize( out, out );
	}
})();

// ### GL.Raytracer.hitTestBox(origin, ray, min, max)
// 
// Traces the ray starting from `origin` along `ray` against the axis-aligned box
// whose coordinates extend from `min` to `max`. Returns a `HitTest` with the
// information or `null` for no intersection.
// 
// This implementation uses the [slab intersection method](http://www.siggraph.org/education/materials/HyperGraph/raytrace/rtinter3.htm).
var _hittest_inv = mat4.create();
Raytracer.hitTestBox = function(origin, ray, min, max, model) {
  var _hittest_v3 = new Float32Array(10*3); //reuse memory to speedup
  
  if(model)
  {
	var inv = mat4.invert( _hittest_inv, model );
	origin = mat4.multiplyVec3( _hittest_v3.subarray(3,6), inv, origin );
	ray = mat4.rotateVec3( _hittest_v3.subarray(6,9), inv, ray );
  }

  var tMin = vec3.subtract( _hittest_v3.subarray(9,12), min, origin );
  vec3.divide( tMin, tMin, ray );

  var tMax = vec3.subtract( _hittest_v3.subarray(12,15), max, origin );
  vec3.divide( tMax, tMax, ray );

  var t1 = vec3.min( _hittest_v3.subarray(15,18), tMin, tMax);
  var t2 = vec3.max( _hittest_v3.subarray(18,21), tMin, tMax);

  var tNear = vec3.maxValue(t1);
  var tFar = vec3.minValue(t2);

  if (tNear > 0 && tNear <= tFar) {
    var epsilon = 1.0e-6;
	var hit = vec3.scale( _hittest_v3.subarray(21,24), ray, tNear);
	vec3.add( hit, origin, hit );

    vec3.addValue(_hittest_v3.subarray(24,27), min, epsilon);
    vec3.subValue(_hittest_v3.subarray(27,30), max, epsilon);

    return new HitTest(tNear, hit, vec3.fromValues(
      (hit[0] > max[0]) - (hit[0] < min[0]),
      (hit[1] > max[1]) - (hit[1] < min[1]),
      (hit[2] > max[2]) - (hit[2] < min[2])
    ));
  }

  return null;
};




// ### GL.Raytracer.hitTestSphere(origin, ray, center, radius)
// 
// Traces the ray starting from `origin` along `ray` against the sphere defined
// by `center` and `radius`. Returns a `HitTest` with the information or `null`
// for no intersection.
Raytracer.hitTestSphere = function(origin, ray, center, radius) {
  var offset = vec3.subtract( vec3.create(), origin,center);
  var a = vec3.dot(ray,ray);
  var b = 2 * vec3.dot(ray,offset);
  var c = vec3.dot(offset,offset) - radius * radius;
  var discriminant = b * b - 4 * a * c;

  if (discriminant > 0) {
    var t = (-b - Math.sqrt(discriminant)) / (2 * a), hit = vec3.add(vec3.create(),origin, vec3.scale(vec3.create(), ray, t));
    return new HitTest(t, hit, vec3.scale( vec3.create(), vec3.subtract(vec3.create(), hit,center), 1.0/radius));
  }

  return null;
};


// ### GL.Raytracer.hitTestTriangle(origin, ray, a, b, c)
// 
// Traces the ray starting from `origin` along `ray` against the triangle defined
// by the points `a`, `b`, and `c`. Returns a `HitTest` with the information or
// `null` for no intersection.
Raytracer.hitTestTriangle = function(origin, ray, a, b, c) {
  var ab = vec3.subtract(vec3.create(), b,a );
  var ac = vec3.subtract(vec3.create(), c,a );
  var normal = vec3.cross( vec3.create(), ab,ac);
  vec3.normalize( normal, normal );
  var t = vec3.dot(normal, vec3.subtract( vec3.create(), a,origin)) / vec3.dot(normal,ray);

  if (t > 0) {
    var hit = vec3.add( vec3.create(), origin, vec3.scale(vec3.create(), ray,t));
    var toHit = vec3.subtract( vec3.create(), hit, a);
    var dot00 = vec3.dot(ac,ac);
    var dot01 = vec3.dot(ac,ab);
    var dot02 = vec3.dot(ac,toHit);
    var dot11 = vec3.dot(ab,ab);
    var dot12 = vec3.dot(ab,toHit);
    var divide = dot00 * dot11 - dot01 * dot01;
    var u = (dot11 * dot02 - dot01 * dot12) / divide;
    var v = (dot00 * dot12 - dot01 * dot02) / divide;
    if (u >= 0 && v >= 0 && u + v <= 1) return new HitTest(t, hit, normal);
  }

  return null;
};
//***** OBJ parser adapted from SpiderGL implementation *****************
/**
* Parses a OBJ string and returns an object with the info ready to be passed to GL.Mesh.load
* @method Mesh.parseOBJ
* @param {String} data all the OBJ info to be parsed
* @param {Object} options
* @return {Object} mesh information (vertices, coords, normals, indices)
*/

Mesh.parseOBJ = function(text, options)
{
	options = options || {};

	//final arrays (packed, lineal [ax,ay,az, bx,by,bz ...])
	var positionsArray = [ ];
	var texcoordsArray = [ ];
	var normalsArray   = [ ];
	var indicesArray   = [ ];

	//unique arrays (not packed, lineal)
	var positions = [ ];
	var texcoords = [ ];
	var normals   = [ ];
	var facemap   = { };
	var index     = 0;

	var line = null;
	var f   = null;
	var pos = 0;
	var tex = 0;
	var nor = 0;
	var x   = 0.0;
	var y   = 0.0;
	var z   = 0.0;
	var tokens = null;

	var hasPos = false;
	var hasTex = false;
	var hasNor = false;

	var parsingFaces = false;
	var indices_offset = 0;
	var negative_offset = -1; //used for weird objs with negative indices
	var max_index = 0;

	var skip_indices = options.noindex ? options.noindex : (text.length > 10000000 ? true : false);
	//trace("SKIP INDICES: " + skip_indices);
	var flip_axis = options.flipAxis;
	var flip_normals = (flip_axis || options.flipNormals);

	//used for mesh groups (submeshes)
	var group = null;
	var groups = [];
	var materials_found = {};

	var V_CODE = 1;
	var VT_CODE = 2;
	var VN_CODE = 3;
	var F_CODE = 4;
	var G_CODE = 5;
	var O_CODE = 6;
	var codes = { v: V_CODE, vt: VT_CODE, vn: VN_CODE, f: F_CODE, g: G_CODE, o: O_CODE };


	var lines = text.split("\n");
	var length = lines.length;
	for (var lineIndex = 0;  lineIndex < length; ++lineIndex) {
		line = lines[lineIndex].replace(/[ \t]+/g, " ").replace(/\s\s*$/, ""); //trim

		if (line[0] == "#") continue;
		if(line == "") continue;

		tokens = line.split(" ");
		var code = codes[ tokens[0] ];

		if(parsingFaces && code == V_CODE) //another mesh?
		{
			indices_offset = index;
			parsingFaces = false;
			//trace("multiple meshes: " + indices_offset);
		}

		//read and parse numbers
		if( code <= VN_CODE ) //v,vt,vn
		{
			x = parseFloat(tokens[1]);
			y = parseFloat(tokens[2]);
			if( code != VT_CODE )
			{
				if(tokens[3] == '\\') //super weird case, OBJ allows to break lines with slashes...
				{
					//HACK! only works if the var is the thirth position...
					++lineIndex;
					line = lines[lineIndex].replace(/[ \t]+/g, " ").replace(/\s\s*$/, ""); //better than trim
					z = parseFloat(line);
				}
				else
					z = parseFloat(tokens[3]);
			}
		}

		if (code == V_CODE) {
			if(flip_axis) //maya and max notation style
				positions.push(-1*x,z,y);
			else
				positions.push(x,y,z);
		}
		else if (code == VT_CODE) {
			texcoords.push(x,y);
		}
		else if (code == VN_CODE) {

			if(flip_normals)  //maya and max notation style
				normals.push(-y,-z,x);
			else
				normals.push(x,y,z);
		}
		else if (code == F_CODE) {
			parsingFaces = true;

			if (tokens.length < 4) continue; //faces with less that 3 vertices? nevermind

			//for every corner of this polygon
			var polygon_indices = [];
			for (var i=1; i < tokens.length; ++i) 
			{
				if (!(tokens[i] in facemap) || skip_indices) 
				{
					f = tokens[i].split("/");

					if (f.length == 1) { //unpacked
						pos = parseInt(f[0]) - 1;
						tex = pos;
						nor = pos;
					}
					else if (f.length == 2) { //no normals
						pos = parseInt(f[0]) - 1;
						tex = parseInt(f[1]) - 1;
						nor = -1;
					}
					else if (f.length == 3) { //all three indexed
						pos = parseInt(f[0]) - 1;
						tex = parseInt(f[1]) - 1;
						nor = parseInt(f[2]) - 1;
					}
					else {
						console.err("Problem parsing: unknown number of values per face");
						return false;
					}

					if(i > 3 && skip_indices) //break polygon in triangles
					{
						//first
						var pl = positionsArray.length;
						positionsArray.push( positionsArray[pl - (i-3)*9], positionsArray[pl - (i-3)*9 + 1], positionsArray[pl - (i-3)*9 + 2]);
						positionsArray.push( positionsArray[pl - 3], positionsArray[pl - 2], positionsArray[pl - 1]);
						pl = texcoordsArray.length;
						texcoordsArray.push( texcoordsArray[pl - (i-3)*6], texcoordsArray[pl - (i-3)*6 + 1]);
						texcoordsArray.push( texcoordsArray[pl - 2], texcoordsArray[pl - 1]);
						pl = normalsArray.length;
						normalsArray.push( normalsArray[pl - (i-3)*9], normalsArray[pl - (i-3)*9 + 1], normalsArray[pl - (i-3)*9 + 2]);
						normalsArray.push( normalsArray[pl - 3], normalsArray[pl - 2], normalsArray[pl - 1]);
					}

					//add new vertex
					x = 0.0;
					y = 0.0;
					z = 0.0;
					if ((pos * 3 + 2) < positions.length) {
						hasPos = true;
						x = positions[pos*3+0];
						y = positions[pos*3+1];
						z = positions[pos*3+2];
					}
					positionsArray.push(x,y,z);

					//add new texture coordinate
					x = 0.0;
					y = 0.0;
					if ((tex * 2 + 1) < texcoords.length) {
						hasTex = true;
						x = texcoords[tex*2+0];
						y = texcoords[tex*2+1];
					}
					texcoordsArray.push(x,y);

					//add new normal
					x = 0.0;
					y = 0.0;
					z = 1.0;
					if(nor != -1)
					{
						if ((nor * 3 + 2) < normals.length) {
							hasNor = true;
							x = normals[nor*3+0];
							y = normals[nor*3+1];
							z = normals[nor*3+2];
						}
						
						normalsArray.push(x,y,z);
					}

					//Save the string "10/10/10" and tells which index represents it in the arrays
					if(!skip_indices)
						facemap[tokens[i]] = index++;
				}//end of 'if this token is new (store and index for later reuse)'

				//store key for this triplet
				if(!skip_indices)
				{
					var final_index = facemap[tokens[i]];
					polygon_indices.push(final_index);
					if(max_index < final_index)
						max_index = final_index;
				}
			} //end of for every token on a 'f' line

			//polygons (not just triangles)
			if(!skip_indices)
			{
				for(var iP = 2; iP < polygon_indices.length; iP++)
				{
					indicesArray.push( polygon_indices[0], polygon_indices[iP-1], polygon_indices[iP] );
					//indicesArray.push( [polygon_indices[0], polygon_indices[iP-1], polygon_indices[iP]] );
				}
			}
		}
		else if (code == G_CODE || tokens[0] == "usemtl") {
			negative_offset = positions.length / 3 - 1;

			if(tokens.length > 1)
			{
				if(group != null)
				{
					group.length = indicesArray.length - group.start;
					if(group.length > 0)
						groups.push(group);
				}

				group = {
					name: tokens[1],
					start: indicesArray.length,
					length: -1,
					material: ""
				};
			}
		}
		else if (tokens[0] == "usemtl") {
			if(group)
				group.material = tokens[1];
		}
		/*
		else if (tokens[0] == "o" || tokens[0] == "s") {
			//ignore
		}
		else
		{
			//console.log("unknown code: " + line);
		}
		*/
	}

	if(!positions.length)
	{
		console.error("OBJ doesnt have vertices, maybe the file is not a OBJ");
		return null;
	}

	if(group && (indicesArray.length - group.start) > 1)
	{
		group.length = indicesArray.length - group.start;
		groups.push(group);
	}

	//deindex streams
	if((max_index > 256*256 || skip_indices ) && indicesArray.length > 0)
	{
		console.log("Deindexing mesh...")
		var finalVertices = new Float32Array(indicesArray.length * 3);
		var finalNormals = normalsArray && normalsArray.length ? new Float32Array(indicesArray.length * 3) : null;
		var finalTexCoords = texcoordsArray && texcoordsArray.length ? new Float32Array(indicesArray.length * 2) : null;
		for(var i = 0; i < indicesArray.length; i += 1)
		{
			finalVertices.set( positionsArray.slice( indicesArray[i]*3,indicesArray[i]*3 + 3), i*3 );
			if(finalNormals)
				finalNormals.set( normalsArray.slice( indicesArray[i]*3,indicesArray[i]*3 + 3 ), i*3 );
			if(finalTexCoords)
				finalTexCoords.set( texcoordsArray.slice(indicesArray[i]*2,indicesArray[i]*2 + 2 ), i*2 );
		}
		positionsArray = finalVertices;
		if(finalNormals)
			normalsArray = finalNormals;
		if(finalTexCoords)
			texcoordsArray = finalTexCoords;
		indicesArray = null;
	}

	//Create final mesh object
	var mesh = {};

	//create typed arrays
	if (hasPos)
		mesh.vertices = new Float32Array(positionsArray);
	if (hasNor && normalsArray.length > 0)
		mesh.normals = new Float32Array(normalsArray);
	if (hasTex && texcoordsArray.length > 0)
		mesh.coords = new Float32Array(texcoordsArray);
	if (indicesArray && indicesArray.length > 0)
		mesh.triangles = new Uint16Array(indicesArray);

	var info = {};
	if(groups.length > 1)
		info.groups = groups;
	mesh.info = info;

	var final_mesh = null;
	
	final_mesh = Mesh.load(mesh, null, options.mesh);
	final_mesh.updateBounding();
	return final_mesh;
}

Mesh.parsers["obj"] = Mesh.parseOBJ.bind( Mesh );

Mesh.encoders["obj"] = function( mesh, options )
{
	//store vertices
	var verticesBuffer = mesh.getBuffer("vertices");
	if(!verticesBuffer)
		return null;

	var result = "# Generated with liteGL.js by Javi Agenjo\n\n";

	var vertices = verticesBuffer.data;
	for (var i = 0; i < vertices.length; i+=3)
		result += "v " + vertices[i].toFixed(4) + " " + vertices[i+1].toFixed(4) + " " + vertices[i+2].toFixed(4) + "\n";

	//store normals
	var normalsBuffer = mesh.getBuffer("normals");
	if(normalsBuffer)
	{
		result += "\n";
		var normals = normalsBuffer.data;
		for (var i = 0; i < normals.length; i+=3)
			result += "vn " + normals[i].toFixed(4) + " " + normals[i+1].toFixed(4) + " " + normals[i+2].toFixed(4) + "\n";
	}
	
	//store uvs
	var coordsBuffer = mesh.getBuffer("coords");
	if(coordsBuffer)
	{
		result += "\n";
		var coords = coordsBuffer.data;
		for (var i = 0; i < coords.length; i+=2)
			result += "vt " + coords[i].toFixed(4) + " " + coords[i+1].toFixed(4) + " " + " 0.0000\n";
	}

	result += "\ng mesh\n";

	//store faces
	var indicesBuffer = mesh.getIndexBuffer("triangles");
	if(indicesBuffer)
	{
		var indices = indicesBuffer.data;
		for (var i = 0; i < indices.length; i+=3)
			result += "f " + (indices[i]+1) + "/" + (indices[i]+1) + "/" + (indices[i]+1) + " " + (indices[i+1]+1) + "/" + (indices[i+1]+1) + "/" + (indices[i+1]+1) + " " + (indices[i+2]+1) + "/" + (indices[i+2]+1) + "/" + (indices[i+2]+1) + "\n";
	}
	else //no indices
	{
		for (var i = 0; i < (vertices.length / 3); i+=3)
			result += "f " + (i+1) + "/" + (i+1) + "/" + (i+1) + " " + (i+2) + "/" + (i+2) + "/" + (i+2) + " " + (i+3) + "/" + (i+3) + "/" + (i+3) + "\n";
	}
	
	return result;
}


//footer.js
})( typeof(window) != "undefined" ? window : (typeof(self) != "undefined" ? self : global ) );
