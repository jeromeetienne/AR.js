/* WBin: Javi Agenjo javi.agenjo@gmail.com  Febrary 2014

WBin allows to pack binary information easily
Works similar to WAD file format from ID Software. You have binary lumps with a given name (and a special type code).
First we store a file header, then info about every lump, then a big binary chunk where all the lumps data is located.
The lump headers contain info to the position of the data in the lump binary chunk (positions are relative to the binary chung starting position)

Header: (64 bytes total)
	* FOURCC: 4 bytes with "WBIN"
	* Version: 4 bytes for Float32, represents WBin version used to store
	* Flags: 2 bytes to store flags (first byte reserved, second is free to use)
	* Num. lumps: 2 bytes number with the total amount of lumps in this wbin
	* ClassName: 32 bytes to store a classname, used to know info about the object stored
	* extra space for future improvements

Lump header: (64 bytes total)
	* start: 4 bytes (Uint32), where the lump start in the binary area
	* length: 4 bytes (Uint32), size of the lump
	* code: 2 bytes to represent data type using code table (Uint8Array, Float32Array, ...)
	* name: 54 bytes name for the lump

Lump binary: all the binary data...

*/

/**
* WBin allows to create binary files easily (similar to WAD format). You can pack lots of resources in one file or extract them.
* @class WBin
*/

function WBin()
{
}

WBin.classes = {};//if the WBin contains a class it will be seaerch here first (otherwise it will search in the global scope)

WBin.HEADER_SIZE = 64; //num bytes per header, some are free to future improvements
WBin.FOUR_CC = "WBIN";
WBin.VERSION = 0.3; //use numbers, never strings, fixed size in binary
WBin.CLASSNAME_SIZE = 32; //32 bytes: stores a type for the object stored inside this binary

WBin.LUMPNAME_SIZE = 54; //max size of a lump name, it is big because sometimes some names have urls
WBin.LUMPHEADER_SIZE = 4+4+2+WBin.LUMPNAME_SIZE; //32 bytes: 4 start, 4 length, 2 code, 54 name

WBin.CODES = {
	"ArrayBuffer":"AB", "Int8Array":"I1", "Uint8Array":"i1", "Int16Array":"I2", "Uint16Array":"i2", "Int32Array":"I4", "Uint32Array":"i4",
	"Float32Array":"F4", "Float64Array": "F8", "Object":"OB","WideObject":"WO","String":"ST","WideString":"WS","Number":"NU", "null":"00"
};

WBin.REVERSE_CODES = {};
for(var i in WBin.CODES)
	WBin.REVERSE_CODES[ WBin.CODES[i] ] = i;

WBin.FULL_BINARY = 1; //means this binary should be passed as binary, not as object of chunks

/**
* Allows to check if one Uint8Array contains a WBin file
* @method WBin.isWBin
* @param {UInt8Array} data
* @return {boolean}
*/
WBin.isWBin = function(data)
{
	var fourcc = data.subarray(0,4);
	for(var i = 0; i < fourcc.length; i++)
		if(fourcc[i] != 0 && fourcc[i] != WBin.FOUR_CC.charCodeAt(i))
			return false;
	return true;
}

/**
* Builds a WBin data stream from an object (every property of the object will be considered a lump with data)
* It supports Numbers, Strings and TypedArrays or ArrayBuffer
* @method WBin.create
* @param {Object} origin object containing all the lumps, the key will be used as lump name
* @param {String} origin_class_name [Optional] allows to add a classname to the WBin, this is used to detect which class to instance when extracting it
* @return {Uint8Array} all the bytes
*/
WBin.create = function( origin, origin_class_name )
{
	if(!origin)
		throw("WBin null origin passed");

	var flags = new Uint8Array([0,0]);
	var version = new Uint8Array( new Float32Array( [WBin.VERSION] ).buffer );
	origin_class_name = origin_class_name || "";

	//use class binary creator
	if(origin.toBinary)
	{
		var content = origin.toBinary();
		if(!content)
			return null;

		if(content.constructor == ArrayBuffer)
		{
			flags[0] |= WBin.FULL_BINARY;

			var classname = WBin.getObjectClassName( origin );
			//alloc memory
			var data = new Uint8Array(WBin.HEADER_SIZE + content.length);
			//set fourcc
			data.set(WBin.stringToUint8Array( WBin.FOUR_CC ));
			//set version
			data.set(version, 4);
			//Set flags
			data.set(flags, 8);
			//set classname
			data.set(WBin.stringToUint8Array(classname,WBin.CLASSNAME_SIZE), 14);
			//set data
			data.set(content, WBin.HEADER_SIZE);
			return data;
		}
		else
			origin = content;
	}

	//create 
	var total_size = WBin.HEADER_SIZE;
	var lumps = [];
	var lump_offset = 0;

	//gather lumps
	for(var i in origin)
	{
		var data = origin[i];
		if(data == null)
			continue;

		if(data.constructor === Blob || data.constructor === File)
			throw("Wbin does not allow Blobs or Files as data to store, conver to ArrayBuffer");

		var classname = WBin.getObjectClassName(data);

		var code = WBin.CODES[ classname ];
		if(!code) 
			code = "OB"; //generic

		//class specific actions
		if (code == "NU")
			data = new Float64Array([data]);  //data.toString(); //numbers are stored as strings
		else if(code == "OB")
			data = JSON.stringify(data); //serialize the data

		var data_length = 0;

		//convert any string related data to typed arrays
		if( data && data.constructor == String )
		{
			data = WBin.stringToTypedArray( data );
			if(data.constructor === Uint16Array) //careful when wide characters found (international characters)
				code = (code == "OB") ? "WO" : "WS";
		}

		//typed array
		if(data.buffer && data.buffer.constructor == ArrayBuffer)
		{
			//clone the data, to avoid problems with shared arrays
			data = new Uint8Array( new Uint8Array( data.buffer, data.byteOffset, data.byteLength ) ); 
			data_length = data.byteLength;
		}
		else if(data.constructor == ArrayBuffer) //plain buffer
			data_length = data.byteLength;
		else
			throw("WBin: cannot be anything different to ArrayBuffer");

		var lumpname = i.substring(0,WBin.LUMPNAME_SIZE);
		if(lumpname.length < i.length)
			console.error("Lump name is too long (max is "+WBin.LUMPNAME_SIZE+"), it has been cut down, this could lead to an error in the future");
		lumps.push({code: code, name: lumpname, data: data, start: lump_offset, size: data_length});
		lump_offset += data_length;
		total_size += WBin.LUMPHEADER_SIZE + data_length;
	}

	//construct the final file
	var data = new Uint8Array(total_size);
	//set fourcc
	data.set(WBin.stringToUint8Array( WBin.FOUR_CC ));
	//set version
	data.set(version, 4);
	//set flags
	data.set(flags, 8);	
	//set num lumps
	data.set( new Uint8Array( new Uint16Array([lumps.length]).buffer ), 10);	
	//set origin_class_name
	if(origin_class_name)
		data.set( WBin.stringToUint8Array( origin_class_name, WBin.CLASSNAME_SIZE ), 12);

	var lump_data_start = WBin.HEADER_SIZE + lumps.length * WBin.LUMPHEADER_SIZE;

	//copy lumps to final file
	var nextPos = WBin.HEADER_SIZE;
	for(var j in lumps)
	{
		var lump = lumps[j];
		var buffer = lump.data;

		//create lump header
		var lump_header = new Uint8Array( WBin.LUMPHEADER_SIZE );
		lump_header.set( new Uint8Array( (new Uint32Array([lump.start])).buffer ), 0);
		lump_header.set( new Uint8Array( (new Uint32Array([lump.size])).buffer ), 4);
		lump_header.set( WBin.stringToUint8Array( lump.code, 2), 8);
		lump_header.set( WBin.stringToUint8Array( lump.name, WBin.LUMPNAME_SIZE), 10);

		//copy lump header
		data.set(lump_header,nextPos); 
		nextPos += WBin.LUMPHEADER_SIZE;

		//copy lump data
		var view = new Uint8Array( lump.data );
		data.set(view, lump_data_start + lump.start);
	}

	return data;
}


/**
* Extract the info from a Uint8Array containing WBin info and returns the object with all the lumps.
* If the data contains info about the class to instantiate, the WBin instantiates the class and passes the data to it
* @method WBin.load
* @param {UInt8Array} data_array 
* @param {bool} skip_classname avoid getting the instance of the class specified in classname, and get only the lumps
* @param {String} filename [optional] the filename where this wbin came from (important to mark resources)
* @return {*} Could be an Object with all the lumps or an instance to the class specified in the WBin data
*/
WBin.load = function( data_array, skip_classname, filename )
{
	if(!data_array || ( data_array.constructor !== Uint8Array && data_array.constructor !== ArrayBuffer ) )
		throw("WBin data must be ArrayBuffer or Uint8Array");

	//clone to avoid possible memory aligment problems
	data_array = new Uint8Array(data_array);

	var header = WBin.getHeaderInfo(data_array);
	if(!header)
	{
		console.error("Wrong WBin Header");
		return null;
	}

	if(header.version > (new Float32Array([WBin.VERSION])[0]) ) //all this because sometimes there are precission problems
		console.log("ALERT: WBin version is higher that code version");

	var object = null;

	//lump unpacking
	for(var i in header.lumps)
	{
		if(!object) //we do not create the object unless there is a lump
			object = {};

		var lump = header.lumps[i];
		var lump_data = header.lump_data.subarray( lump.start, lump.start + lump.size );

		if(lump.size != lump_data.length )
			throw("WBin: incorrect wbin lump size");

		var lump_final = null;

		var data_class_name = WBin.REVERSE_CODES[ lump.code ];
		if(!data_class_name)
			throw("WBin: Incorrect data code");

		switch(data_class_name)
		{
			case "null": break;
			case "WideString": 
							lump_data = new Uint16Array( (new Uint8Array( lump_data )).buffer ); //no break
			case "String":	lump_final = WBin.TypedArrayToString( lump_data ); break;
			case "Number": 
					if(header.version < 0.3) //LEGACY: remove
						lump_final = parseFloat( WBin.TypedArrayToString( lump_data ) );
					else
						lump_final = (new Float64Array( lump_data.buffer ))[0];
					break;
			case "WideObject": 
							lump_data = new Uint16Array( (new Uint8Array( lump_data )).buffer ); //no break
			case "Object":	lump_final = JSON.parse( WBin.TypedArrayToString( lump_data ) ); break;
			case "ArrayBuffer": lump_final = new Uint8Array(lump_data).buffer; break; //clone
			default:
				lump_data = new Uint8Array(lump_data); //clone to avoid problems with bytes alignment
				var ctor = WBin.classes[ data_class_name ] || window[ data_class_name ];
				if(!ctor)
					throw("WBin referenced class not found: " + data_class_name );
				if( (lump_data.length / ctor.BYTES_PER_ELEMENT)%1 != 0)
					throw("WBin: size do not match type");
				lump_final = new ctor(lump_data.buffer);
		}
		object[ lump.name ] = lump_final;
	}

	//check if className exists, if it does use internal class parser
	if(!skip_classname && header.classname)
	{
		var ctor = WBin.classes[ header.classname ] || window[ header.classname ];
		if(ctor && ctor.fromBinary)
			return ctor.fromBinary( object, filename );
		else if(ctor && ctor.prototype.fromBinary)
		{
			var inst = new ctor();
			inst.fromBinary( object, filename );
			return inst;
		}
		else
		{
			object["@classname"] = header.classname;
		}
	}	

	return object;
}


/**
* Extract the header info from an ArrayBuffer (it contains version, and lumps info)
* @method WBin.getHeaderInfo
* @param {UInt8Array} data_array 
* @return {Object} Header
*/
WBin.getHeaderInfo = function(data_array)
{
	//check FOURCC
	var fourcc = data_array.subarray(0,4);
	var good_header = true;
	for(var i = 0; i < fourcc.length; i++)
		if(fourcc[i] != 0 && fourcc[i] != WBin.FOUR_CC.charCodeAt(i))
			return null; //wrong fourcc

	var version = WBin.readFloat32( data_array, 4);
	var flags = new Uint8Array( data_array.subarray(8,10) );
	var numlumps = WBin.readUint16(data_array, 10);
	var classname = WBin.TypedArrayToString( data_array.subarray(12,12 + WBin.CLASSNAME_SIZE) );

	var lumps = [];
	for(var i = 0; i < numlumps; ++i)
	{
		var start = WBin.HEADER_SIZE + i * WBin.LUMPHEADER_SIZE;
		var lumpheader = data_array.subarray( start, start + WBin.LUMPHEADER_SIZE );
		var lump = {};
		lump.start = WBin.readUint32(lumpheader,0);
		lump.size  = WBin.readUint32(lumpheader,4);
		lump.code  = WBin.TypedArrayToString(lumpheader.subarray(8,10));
		lump.name  = WBin.TypedArrayToString(lumpheader.subarray(10));
		lumps.push(lump);
	}

	var lump_data = data_array.subarray( WBin.HEADER_SIZE + numlumps * WBin.LUMPHEADER_SIZE );

	return {
		version: version,
		flags: flags,
		classname: classname,
		numlumps: numlumps,
		lumps: lumps,
		lump_data: lump_data
	};
}

WBin.getObjectClassName = function(obj) {
    if (obj && obj.constructor && obj.constructor.toString) {
        var arr = obj.constructor.toString().match(
            /function\s*(\w+)/);
        if (arr && arr.length == 2) {
            return arr[1];
        }
    }
    return undefined;
}

WBin.stringToUint8Array = function(str, fixed_length)
{
	var r = new Uint8Array( fixed_length ? fixed_length : str.length);
	var warning = false;
	for(var i = 0; i < str.length; i++)
	{
		var c = str.charCodeAt(i);
		if(c > 255)
			warning = true;
		r[i] = c;
	}

	if(warning)
		console.warn("WBin: there are characters in the string that cannot be encoded in 1 byte.");
	return r;
}

WBin.TypedArrayToString = function(typed_array, same_size)
{
	var r = "";
	for(var i = 0; i < typed_array.length; i++)
		if (typed_array[i] == 0 && !same_size)
			break;
		else
			r += String.fromCharCode( typed_array[i] );
	//return String.fromCharCode.apply(null,typed_array)
	return r;
}

WBin.stringToTypedArray = function(str, fixed_length)
{
	var r = new Uint8Array( fixed_length ? fixed_length : str.length);
	var warning = false;
	for(var i = 0; i < str.length; i++)
	{
		var c = str.charCodeAt(i);
		if(c > 255)
			warning = true;
		r[i] = c;
	}

	if(!warning)
		return r;

	//convert to 16bits per character
	var r = new Uint16Array( fixed_length ? fixed_length : str.length);
	for(var i = 0; i < str.length; i++)
	{
		var c = str.charCodeAt(i);
		r[i] = c;
	}

	return r;
}

WBin.readUint16 = function( buffer, pos )
{
	var dv = new DataView( buffer.buffer, buffer.byteOffset );
	return dv.getUint16( pos, true );
	/* this may be slow but helps removing Endian problems
	var f = new Uint16Array(1);
	var view = new Uint8Array(f.buffer);
	view.set( buffer.subarray(pos,pos+2) );
	return f[0];
	*/
}

WBin.readUint32 = function(buffer, pos)
{
	var dv = new DataView( buffer.buffer, buffer.byteOffset);
	return dv.getUint32( pos, true );
	/*
	var f = new Uint32Array(1);
	var view = new Uint8Array(f.buffer);
	view.set( buffer.subarray(pos,pos+4) );
	return f[0];
	*/
}

WBin.readFloat32 = function(buffer, pos)
{
	var dv = new DataView( buffer.buffer, buffer.byteOffset );
	return dv.getFloat32( pos, true );
}

/* CANNOT BE DONE, XMLHTTPREQUEST DO NOT ALLOW TO READ PROGRESSIVE BINARY DATA (yet)
//ACCORDING TO THIS SOURCE: http://chimera.labs.oreilly.com/books/1230000000545/ch15.html#XHR_STREAMING

WBin.progressiveLoad = function(url, on_header, on_lump, on_complete, on_error)
{
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);

    //get binary format
	xhr.responseType = "arraybuffer";
  	xhr.overrideMimeType( "application/octet-stream" );

    //get data as it arrives
	xhr.onprogress = function(evt)
    {
		console.log(this.response); //this is null till the last packet
		if (!evt.lengthComputable) return;
		var percentComplete = Math.round(evt.loaded * 100 / evt.total);
		//on_progress( percentComplete );
    }

    xhr.onload = function(load)
	{
		var response = this.response;
		if(on_complete)
			on_complete.call(this, response);
	};
    xhr.onerror = function(err) {
    	console.error(err);
		if(on_error)
			on_error(err);
	}
	//start downloading
    xhr.send();
}
*/

//WBin is not registered in LS here, because WBin is included before LS
//IT is done from LS