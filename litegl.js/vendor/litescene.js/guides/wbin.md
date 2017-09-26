# WBin

WBin is a file format to store binary data, it is simple to use, to parse and supports any binary data (from meshes, to textures, or animation).

It is similar to the WAD format, it stores a table that says the name of every chunk of data and the position and lenth inside the data block.
It also contains info about the type of data stored in that chunk (String, JSON Object, Float32Array, ...) so it can be retrieved back to the original container.

It can be used without LiteScene as an standalone binary coder/decoder.

## Why another format?

LiteScene can handle many file formats, it has parsers for TGA, DAE, DDS, OBJ and STL built in.
But parsing files is a waste of time when you want to launch your app as fast as possible.

To avoid having to parse files LS allows to store data in a ready-to-use binary format, this means that all the vertex data for the meshes
(which is the one that consumes most of space) is stored in plain float buffers.

This makes files very fast to parse and smaller than regular ASCII file formats but bigger than some format that include some layer of compression (like bounding box normalized 16bits floats).

The problem with local decompression is that it can take much time to perform in JS.
Using WBIN the files wont be compressed by us but they can be compressed from the server side using standard HTTP GZIP compression if you set your server to support compression for WBIN files.

Also not having compression leaves the file format very simple.

## How it works? ##

You pass the WBin class with a JS object that contains properties, and every property will be stored inside the WBin.
If it is a typed array then it is stored as a byte block, if it is an object it is stored as a JSON String, 

## File format ##

The file has a header, then a series of lumps (every lump has a block of data associated, lumps could be strings, arrays, objects, or even other wbins).

**Header**: (64 bytes total)
- **FOURCC**: 4 bytes with "WBIN"
- **Version**: 4 bytes for Float32, represents WBin version used to store
- **Flags**: 2 bytes to store flags (first byte reserved, second is free to use)
- **Num. lumps**: 2 bytes number with the total amount of lumps in this wbin (max 65536)
- **ClassName**: 32 bytes to store a classname, used to know info about the object stored
- extra space for future improvements

**Lump header**: (64 bytes total)
- **start**: 4 bytes (Uint32), where the lump start in the binary area
- **length**: 4 bytes (Uint32), size of the lump
- **code**: 2 bytes to represent data type using code table (Uint8Array, Float32Array, ...)
- **name**: 54 bytes name for the lump

**Lump binary**: one single block with all the binary data...

The lump code gives info to restore the data back to its original form, here is the table of types:

- **ArrayBuffer**: "AB"
- **Int8Array**: "I1"
- **Uint8Array**: "i1"
- **Int16Array**: "I2"
- **Uint16Array**: "i2"
- **Int32Array**: "I4"
- **Uint32Array**: "i4"
- **Float32Array**: "F4"
- **Float64Array**: "F8"
- **Object**: "OB"
- **WideObject**: "WO" Object that contains string with wide chars
- **String**: "ST"
- **WideString**: "WS" String with wide chars
- **Number**: "NU" Numbers are encoded using a 64 float
- **null**: "00"

## Usage ##

To create a WBin file from a JSON object:

```javascript
//wbin_data is not a class, is a Uint8Array
var wbin_data = WBin.create(my_object);

//restore the data
var object = WBin.load( wbin_data );
``` 

You can also pass an object of an specific class if that class has a method called ```toBinary``` and ```fromBinary```

```javascript
var my_object = new MyClass();
var wbin_data = WBin.create( my_object ); //this will invoke my_object.toBinary()

//my new object will instance MyClass and call the method fromBinary passing the object with every data chunk (not the binary)
var my_new_object = WBin.load( wbin_data );
```

