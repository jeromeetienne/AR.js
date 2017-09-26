
/**
* This class contains all the info about a resource and it works as a template for any resource class
* Keep in mind that there are many resource classes like Meshes or Textures that DONT INHERIT FROM THIS CLASS.
* This class is used mainly to generic file resources like text files (scripts, csvs, etc)
*
* @class Resource
* @constructor
*/

function Resource()
{
	this.filename = null; //name of file without folder or path
	this.fullpath = null; //contains the unique name as is to be used to fetch it by the resources manager
	this.remotepath = null; //the string to fetch this resource in internet (local resources do not have this name)
	this._data = null;
	//this.type = 0;
}

//Resource.DATA = 1;
//Resource.SCRIPT = 2;

Object.defineProperty( Resource.prototype, "data", {
	set: function(v){ 
		this._data = v;
		this._modified = true;
	},
	get: function() { 
		return this._data;
	},
	enumerable: true
});

/** makes this resource available by registering in the resources manager
* @method rename
*/
Resource.prototype.register = function()
{
	LS.ResourcesManager.registerResource( this.fullpath || this.filename, this );
}

/** Renames the resource and ensures the resources manager is updated accordingly
* @method rename
* @param {String} new_filename the new filename
*/
Resource.prototype.rename = function( new_filename )
{
	LS.ResourcesManager.renameResource( this.fullpath || this.filename, new_filename );
}

Object.defineProperty( Resource.prototype, "uid", { 
	get: function(){ return this.fullpath || this.filename },
	set: function(v){},
	enumerable: true
});

/**
* Static method: Returns an object with a representation of the resource internal data
* The order to obtain that object is:
* 0. checks if getDataToStore function in resource
* 1. test for _original_file (File or Blob)
* 2. test for _original_data (ArrayBuffer)
* 3. toBinary() (ArrayBuffer)
* 4. toBlob() (Blob)
* 5. toBase64() (String)
* 6. serialize() (Object in JSON format)
* 7. data property 
* 8. JSON.stringify(...)
*
* @method Resource.getDataToStore
* @param {Object} resource 
* @param {Boolean} allow_blob [optional] 
* @return {Object} it has two fields: data and encoding
*/
Resource.getDataToStore = function( resource, allow_blob )
{
	var data = null;
	var encoding = "text";
	var extension = "";

	//get the data
	if (resource.getDataToStore) //function
	{
		data = resource.getDataToStore();
		if(data && data.constructor == ArrayBuffer)
			encoding = "binary";
	}
	else if (resource._original_file) //file
	{
		data = resource._original_file;
		if(data && data.constructor !== File && data.constructor !== Blob)
			console.warn("Resource._original_file is not File or Blob");
		encoding = "file";
	}
	else if( resource._original_data ) //file in ArrayBuffer format
	{
		data = resource._original_data;
		if( data && data.constructor === ArrayBuffer )
			encoding = "binary";
	}
	else if(resource.toBinary) //a function to compute the ArrayBuffer format
	{
		data = resource.toBinary();
		encoding = "binary";
		if(resource.constructor.binary_extension) //special case, textures are in PNG to keep alpha
			extension = resource.constructor.binary_extension;
		else
			extension = "wbin";
	}
	else if(resource.toBlob && allow_blob) //a blob (Canvas should have this)
	{
		data = resource.toBlob();
		encoding = "file";
	}
	else if(resource.toBase64) //a base64 string
	{
		data = resource.toBase64();
		encoding = "base64";
	}
	else if(resource.serialize) //a json object
	{
		var obj = resource.serialize();
		//remove inner stuff from the editor
		delete obj.filename;
		delete obj.fullpath;
		delete obj.remotepath;
		delete obj.preview_url; //just in case is an old resource
		//convert to string
		data = JSON.stringify( obj );
	}
	else if(resource.data) //regular string data
		data = resource.data;
	else
		data = JSON.stringify( resource );

	if(data.buffer && data.buffer.constructor == ArrayBuffer)
		data = data.buffer; //store the data in the arraybuffer

	return { data:data, encoding: encoding, extension: extension };
}

//used in the coding pad to assign content to generic text files
Resource.prototype.getData = function()
{
	return this._data;
}

Resource.prototype.setData = function( v, skip_modified_flag )
{
	//remove old file
	if( this._original_data )
		this._original_data = null;
	this._data = v;
	if(!skip_modified_flag)
		this._modified = true;
}

Resource.prototype.getDataToStore = function()
{
	var data = this.data || "";
	if(data.constructor === Object )
		data = JSON.stringify( data );
	return data;
}

/** Clone the resource
* @method clone
* @return {LS.Resource} the clone of the resource
*/
Resource.prototype.clone = function()
{
	var r = new LS.Resource();
	r._data = this._data;
	return r;
}

/** Returns a string representing to which category this resource belongs
* @method getCategory
*/
Resource.prototype.getCategory = function()
{
	var filename = this.fullpath || this.filename;
	var ext = LS.ResourcesManager.getExtension( filename );
	if(ext == "js")
		return "Script";
	return "Data";
}

/** When dropping this resource into a SceneNode
* @method assignToNode
*/
Resource.prototype.assignToNode = function(node)
{
	if(!node) 
		return false;

	var filename = this.fullpath || this.filename;
	var category = this.getCategory();

	if( category == "Script" )
	{
		var script_component = new LS.Components.ScriptFromFile({ filename: filename });
		node.addComponent( script_component );
	}

	return true;
}

/** Parses the resource data as subfiles (subfiles are fragments of the code identified by a slash followed by name string), used by ShaderCode
* @method getAsSubfiles
* @return {Object} the object that contains every subfile
*/
Resource.prototype.getAsSubfiles = function()
{
	if(!this._data)
		return null;
	return GL.processFileAtlas( this._data );
}

/** Parses the resource as HTML code and returns a HTMLElement containing the html code
* @method getAsHTML
* @return {HTMLElement} the root HTMLElement that contains the code
*/
Resource.prototype.getAsHTML = function()
{
	if(!this._data || this._data.constructor !== String)
		return null;

	var container = document.createElement("div");
	container.innerHTML = this._data;
	return container;
}

/** Used by the editor to know if it can be edited in the text editor
* @method hasEditableText
*/
Resource.prototype.hasEditableText = function()
{
	return this._data && this._data.constructor === String;
}

Resource.hasPreview = false; //should this resource use a preview image?

LS.Resource = Resource;
LS.registerResourceClass( Resource );