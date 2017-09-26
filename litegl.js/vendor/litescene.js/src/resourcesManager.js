/**
* Static class that contains all the resources loaded, parsed and ready to use.
* It also contains the parsers and methods in charge of processing them
*
* @class ResourcesManager
* @constructor
*/

// **** RESOURCES MANANGER *********************************************
// Resources should follow the text structure:
// + id: number, if stored in remote server
// + resource_type: string ("Mesh","Texture",...) or if omitted the classname will be used
// + filename: string (this string will be used to get the filetype)
// + fullpath: the full path to reach the file on the server (folder + filename)
// + preview: img url
// + toBinary: generates a binary version to store on the server
// + serialize: generates an stringifible object to store on the server

// + _original_data: ArrayBuffer with the bytes form the original file
// + _original_file: File with the original file where this res came from

var ResourcesManager = {

	path: "", //url to retrieve resources relative to the index.html
	proxy: "", //url to retrieve resources outside of this host
	ignore_cache: false, //change to true to ignore client cache
	free_data: false, //free all data once it has been uploaded to the VRAM
	keep_files: false, //keep the original files inside the resource (used mostly in the editor)
	keep_urls: false, //keep the local URLs of loaded files
	allow_base_files: false, //allow to load files that are not in a subfolder

	scene_external_repository: null, //this is used by some scenes to specify where are the resources located

	//some containers
	resources: {}, //filename associated to a resource (texture,meshes,audio,script...)
	meshes: {}, //loadead meshes
	textures: {}, //loadead textures
	materials: {}, //shared materials (indexed by name)
	materials_by_uid: {}, //shared materials (indexed by uid)

	resources_not_found: {}, //resources that will be skipped because they werent found
	resources_being_loaded: {}, //resources waiting to be loaded
	resources_being_processed: {}, //used to avoid loading stuff that is being processes
	resources_renamed_recently: {}, //used to find resources with old names
	num_resources_being_loaded: 0,
	MAX_TEXTURE_SIZE: 4096,

	resource_pre_callbacks: {}, //used to extract resource info from a file ->  "obj":callback
	resource_post_callbacks: {}, //used to post process a resource type -> "Mesh":callback
	resource_once_callbacks: {}, //callback called once

	virtual_file_systems: {}, //protocols associated to urls  "VFS":"../"
	skip_proxy_extensions: ["mp3","wav","ogg"], //this file formats should not be passed through the proxy
	force_nocache_extensions: ["js","glsl","json"], //this file formats should be reloaded without using the cache
	nocache_files: {}, //this is used by the editor to avoid using cached version of recently loaded files

	valid_resource_name_reg: /^[A-Za-z\d\s\/\_\-\.]+$/,

	/**
	* Returns a string to append to any url that should use the browser cache (when updating server info)
	*
	* @method getNoCache
	* @param {Boolean} force force to return a nocache string ignoring the default configuration
	* @return {String} a string to attach to a url so the file wont be cached
	*/

	getNoCache: function(force) { return (!this.ignore_cache && !force) ? "" : "nocache=" + getTime() + Math.floor(Math.random() * 1000); },

	/**
	* Resets all the resources cached, so it frees the memory
	*
	* @method reset
	*/
	reset: function()
	{
		this.resources = {};
		this.meshes = {};
		this.textures = {};
		this.materials = {};
		this.materials_by_uid = {};

		this.scene_external_repository = null;
	},

	/**
	* Resources need to be parsed once the data has been received, some formats could be parsed using native functions (like images) others 
	* require to pass the data through a series of functions (extract raw content, parse it, upload it to the GPU...
	* Registering a resource preprocessor the data will be converted once it is in memory 
	*
	* @method registerResourcePreProcessor
	* @param {String} fileformats the extension of the formats that this function will parse
	* @param {Function} callback the function to call once the data must be processed, if the process is async it must return true
	* @param {string} data_type 
	* @param {string} resource_type 
	*/
	registerResourcePreProcessor: function( fileformats, callback, data_type, resource_type )
	{
		if(!fileformats)
			return;

		var ext = fileformats.split(",");
		for(var i in ext)
		{
			var extension = ext[i].toLowerCase();
			this.resource_pre_callbacks[ extension ] = callback;
		}
	},

	/**
	* Some resources require to be post-processed right after being parsed to validate, extend, register (meshes need to have the AABB computed...)
	* This job could be done inside the parser but it is better to do it separatedly so it can be reused among different parsers.
	*
	* @method registerResourcePostProcessor
	* @param {String} resource_type the name of the class of the resource
	* @param {Function} callback the function to call once the data has been processed
	*/
	registerResourcePostProcessor: function(resource_type, callback)
	{
		this.resource_post_callbacks[ resource_type ] = callback;
	},

	/**
	* Returns the filename extension from an url
	*
	* @method getExtension
	* @param {String} fullpath url or filename
	* @param {boolean} complex_extension [optional] returns the extension from the first dot, otherwise only the part from last dot
	* @return {String} filename extension
	*/
	getExtension: function( fullpath, complex_extension )
	{
		if(!fullpath)
			return "";
		var question = fullpath.indexOf("?");
		if(question != -1)
			fullpath = fullpath.substr(0,question);

		var point = complex_extension ? fullpath.indexOf(".") : fullpath.lastIndexOf(".");
		if(point == -1)
			return "";
		return fullpath.substr(point+1).toLowerCase().trim();
	},

	/**
	* Returns the url without the extension
	*
	* @method removeExtension
	* @param {String} fullpath url or filename
	* @param {boolean} complex_extension [optional] removes the extension from the first dot, otherwise only the part from last dot
	* @return {String} url without extension
	*/
	removeExtension: function( fullpath, complex_extension )
	{
		if(!fullpath)
			return "";
		var question = fullpath.indexOf("?");
		if(question != -1)
			fullpath = fullpath.substr(0,question);
		var point = complex_extension ? fullpath.indexOf(".") : fullpath.lastIndexOf(".");
		if(point == -1)
			return fullpath;
		return fullpath.substr(0,point);
	},

	/**
	* Returns the filename from a full path
	*
	* @method getFilename
	* @param {String} fullpath
	* @return {String} filename extension
	*/
	getFilename: function( fullpath )
	{
		if(!fullpath)
			return "";
		var pos = fullpath.lastIndexOf("/");
		//if(pos == -1) return fullpath;
		var question = fullpath.lastIndexOf("?");
		question = (question == -1 ? fullpath.length : (question - 1) ) - pos;
		return fullpath.substr(pos+1,question);
	},	

	/**
	* Returns the folder from a fullpath
	*
	* @method getFolder
	* @param {String} fullpath
	* @return {String} folder name
	*/
	getFolder: function(fullpath)
	{
		if(!fullpath)
			return "";
		var pos = fullpath.lastIndexOf("/");
		return fullpath.substr(0,pos);
	},	

	/**
	* Returns the filename without the folder or the extension
	*
	* @method getBasename
	* @param {String} fullpath
	* @return {String} filename extension
	*/
	getBasename: function( fullpath )
	{
		if(!fullpath)
			return "";

		var name = this.getFilename(fullpath);
		var pos = name.indexOf(".");
		if(pos == -1)
			return name;
		return name.substr(0,pos);
	},

	/**
	* Returns the url protocol (http, https) or empty string if no protocol was found
	*
	* @method getProtocol
	* @param {String} url
	* @return {String} protocol
	*/
	getProtocol: function( url )
	{
		if(!url)
			return "";

		var pos = url.substr(0,10).indexOf(":");
		var protocol = "";
		if(pos != -1)
			protocol = url.substr(0,pos);
		return protocol;
	},

	/**
	* Cleans resource name (removing double slashes to avoid problems) 
	* It is slow, so use it only in changes, not in getters
	*
	* @method cleanFullpath
	* @param {String} fullpath
	* @return {String} fullpath cleaned
	*/
	cleanFullpath: function(fullpath)
	{
		if(!fullpath)
			return "";

		if( fullpath.indexOf("//") == -1 )
		{
			if(fullpath.charCodeAt(0) == 47) // the '/' char
				return fullpath.substr(1);
			return fullpath;
		}

		//clean up the filename (to avoid problems with //)
		if(fullpath.indexOf("://") == -1)
			return fullpath.split("/").filter(function(v){ return !!v; }).join("/");
		return fullpath;
	},

	/**
	* Loads all the resources in the Object (it uses an object to store not only the filename but also the type)
	*
	* @method loadResources
	* @param {Object} resources contains all the resources, associated with its type
	* @param {Object}[options={}] options to apply to the loaded resources
	* @return {number} the actual amount of resources being loaded (this differs fromt he resources passed because some could be already in memory)
	*/
	loadResources: function(res, options )
	{
		if(!res)
			return;

		for(var i in res)
		{
			if( !i || i[0] == ":" || i[0] == "_" )
				continue;
			this.load( i, options );
		}

		this._total_resources_to_load = this.num_resources_being_loaded;
		LEvent.trigger( this, "start_loading_resources", this._total_resources_to_load );
		if(!this._total_resources_to_load) //all resources were already in memory
			LEvent.trigger( this, "end_loading_resources" );
		return this._total_resources_to_load;
	},	

	/**
	* Set the base path where all the resources will be fetched (unless they have absolute URL)
	* By default it will use the website home address
	*
	* @method setPath
	* @param {String} url
	*/
	setPath: function( url )
	{
		this.path = url;
	},

	/**
	* Set a proxy url where all non-local resources will be requested, allows to fetch assets to other servers.
	* request will be in this form: proxy_url + "/" + url_with_protocol: ->   http://myproxy.com/google.com/images/...
	*
	* @method setProxy
	* @param {String} proxy_url
	*/
	setProxy: function( proxy_url )
	{
		if(!proxy_url)
		{
			this.proxy = null;
			return;
		}

		if( proxy_url.indexOf("@") != -1 )
			this.proxy = "http://" + proxy_url.replace("@", window.location.host );
		else
			this.proxy = proxy_url;
	},

	/**
	* transform a url to a full url taking into account proxy, virtual file systems and external_repository
	* used only when requesting a resource to be loaded
	*
	* @method getFullURL
	* @param {String} url
	* @param {Object} options
	* @return {String} full url
	*/
	getFullURL: function( url, options )
	{
		if(!url)
			return null;

		var pos = url.substr(0,10).indexOf(":");
		var protocol = "";
		if(pos != -1)
			protocol = url.substr(0,pos);

		var resources_path = this.path;

		//from scene.external_repository
		if(this.scene_external_repository) 
			resources_path = this.scene_external_repository;

		if(options && options.force_local_url)
			resources_path = ".";

		//used special repository
		if(options && options.external_repository)
			resources_path = options.external_repository;

		if(protocol)
		{
			switch(protocol)
			{
				//external urls
				case 'http':
				case 'https':
					var full_url = url;
					var extension = this.getExtension( url ).toLowerCase();
					if(this.proxy && this.skip_proxy_extensions.indexOf( extension ) == -1 && (!options || (options && !options.ignore_proxy)) ) //proxy external files
						return this.proxy + url; //this.proxy + url.substr(pos+3); //"://"
					return full_url;
					break;
				case 'blob':
					return url; //special case for local urls like URL.createObjectURL
				case '': //strange case
					return url;
					break;
				default:
					if(url[0] == ":" || url[0] == "_") //local resource
						return url;
					//test for virtual file system address
					var root_path = this.virtual_file_systems[ protocol ] || resources_path;
					return root_path + "/" + url.substr(pos+1);
			}
		}
		else
			return resources_path + "/" + url;
	},

	/**
	* Allows to associate a resource path like "vfs:myfile.png" to an url according to the value before the ":".
	* This way we can have alias for different folders where the assets are stored.
	* P.e:   "e","http://domain.com"  -> will transform "e:myfile.png" in "http://domain.com/myfile.png"
	*
	* @method registerFileSystem
	* @param {String} name the filesystem name (the string before the colons in the path)
	* @param {String} url the url to attach before 
	*/
	registerFileSystem: function(name, url)
	{
		this.virtual_file_systems[ name ] = url;
	},

	/**
	* Returns the resource if it has been loaded, if you want to force to load it, use load
	*
	* @method getResource
	* @param {String} url where the resource is located (if its a relative url it depends on the path attribute)
	* @param {Function} constructor [optional] allows to specify the class expected for this resource, if the resource doesnt match, it returns null
	* @return {*} the resource
	*/
	getResource: function( url, constructor )
	{
		if(!url)
			return null;
		url = this.cleanFullpath( url );
		if(!constructor)
			return this.resources[ url ];
		
		var res = this.resources[ url ];
		if(res && res.constructor === constructor )
			return res;
		return null;
	},

	/**
	* Returns the resource type ("Mesh","Texture","Material","SceneNode",...) of a given resource
	*
	* @method getResourceType
	* @param {*} resource
	* @return {String} the type in string format
	*/
	getResourceType: function( resource )
	{
		if(!resource)
			return null;
		if(resource.object_class)
			return resource.object_class;
		if(resource.constructor.resource_type)
			return resource.constructor.resource_type;
		return LS.getObjectClassName( resource );
	},

	/**
	* Returns an object containig all the resources and its data (used to export resources)
	*
	* @method getResourcesData
	* @param {Array} resource_names an array containing the resources names
	* @param {bool} allow_files [optional] used to allow to retrieve the data in File or Blob, otherwise only String and ArrayBuffer is supported
	* @return {Object} object with name:data
	*/
	getResourcesData: function( resource_names, allow_files )
	{
		var result = {};

		for(var i = 0; i < resource_names.length; ++i)
		{
			var res_name = resource_names[i];
			var resource = LS.ResourcesManager.resources[ res_name ];
			if(!resource)
				continue;

			var data = null;
			if(resource._original_data) //must be string or bytes
				data = resource._original_data;
			else
			{
				var data_info = LS.Resource.getDataToStore( resource );
				data = data_info.data;
			}

			if(!data)
			{
				console.warn("Wrong data in resource");
				continue;
			}

			if(data.constructor === Blob || data.constructor === File)
			{
				if( !allow_files && (!data.data || data.data.constructor !== ArrayBuffer) )
				{
					console.warn("Not support to store File or Blob, please, use ArrayBuffer");
					continue;
				}
				data = data.data; //because files have an arraybuffer with the data if it was read
			}

			result[ res_name ] = data;
		}

		return result;
	},

	/**
	* Marks the resource as modified, used in editor to know when a resource data should be updated
	*
	* @method resourceModified
	* @param {Object} resource
	*/
	resourceModified: function( resource )
	{
		if(!resource)
			return;

		if(resource.constructor === String)
		{
			console.warn("resourceModified parameter must be a resource, not a string");
			return;
		}

		//if the file has been modified we cannot keep using the original data
		delete resource._original_data;
		delete resource._original_file;

		if( resource.remotepath )
			resource._modified = true;

		LEvent.trigger(this, "resource_modified", resource );

		//TODO: from_prefab and from_pack should be the sabe property
		if(resource.from_pack)
		{
			if (resource.from_pack.constructor === String)
			{
				var pack = LS.ResourcesManager.getResource( resource.from_pack );
				if(pack)
					this.resourceModified(pack);
			}
		}
		if(resource.from_prefab)
		{
			if (resource.from_prefab.constructor === String)
			{
				var prefab = LS.ResourcesManager.getResource( resource.from_prefab );
				if(prefab)
					this.resourceModified(prefab);
			}
		}


	},

	/**
	* Unmarks the resource as modified
	*
	* @method resourceSaved
	* @param {Object} resource
	*/
	resourceSaved: function(resource)
	{
		if(!resource)
			return;
		delete resource._modified;
		resource.remotepath = resource.fullpath;
		LEvent.trigger(this, "resource_saved", resource );
	},

	/**
	* Loads a generic resource, the type will be infered from the extension, if it is json or wbin it will be processed
	* Do not use to load regular files (txts, csv, etc), instead use the LS.Network methods
	*
	* @method load
	* @param {String} url where the resource is located (if its a relative url it depends on the path attribute)
	* @param {Object}[options={}] options to apply to the loaded resource when processing it { force: to force a reload }
	* @param {Function} [on_complete=null] callback when the resource is loaded and cached, params: callback( resource, url  ) //( url, resource, options )
	* @param {Boolean} [force_load=false] if true it will load the resource, even if it already exists
	*/
	load: function( url, options, on_complete, force_load )
	{
		if(!url)
			return console.error("LS.ResourcesManager.load requires url");

		//parameter swap...
		if(options && options.constructor === Function && !on_complete )
		{
			on_complete = options;
			options = null;
		}

		//if we already have it, then nothing to do
		var resource = this.resources[url];
		if( resource != null && !resource.is_preview && (!options || !options.force) && !force_load )
		{
			if(on_complete)
				on_complete(resource,url);
			return true;
		}

		options = options || {};

		//extract the filename extension
		var extension = this.getExtension( url );
		if(!extension && !this.resources[url] ) //unknown file type and didnt came from a pack or prefab
		{
			console.warn("Cannot load a file without extension: " + url );
			return false;
		}

		if( this.resources_not_found[url] )
			return;

		//if it is already being loaded, then add the callback and wait
		if(this.resources_being_loaded[url])
		{
			this.resources_being_loaded[url].push( {options: options, callback: on_complete} );
			return;
		}

		if(this.resources_being_processed[url])
			return; //nothing to load, just waiting for the callback to process it

		if(!this.allow_base_files && url.indexOf("/") == -1)
		{
			if(!this._parsing_local_file) //to avoid showing this warning when parsing scenes with local resources
				console.warn("Cannot load resource, filename has no folder and LS.ResourcesManager.allow_base_files is set to false: ", url );
			return; //this is not a valid file to load
		}

		//otherwise we have to load it
		//set the callback
		this.resources_being_loaded[url] = [{options: options, callback: on_complete}];

		LEvent.trigger( LS.ResourcesManager, "resource_loading", url );
		//send an event if we are starting to load (used for loading icons)
		//if(this.num_resources_being_loaded == 0)
		//	LEvent.trigger( LS.ResourcesManager,"start_loading_resources", url );
		this.num_resources_being_loaded++;
		var full_url = this.getFullURL(url);

		//which type?
		var format_info = LS.Formats.getFileFormatInfo( extension );
		if(format_info && format_info.has_preview && !options.is_preview )
			LEvent.trigger( this, "load_resource_preview", url );

		//create the ajax request
		var settings = {
			url: full_url,
			success: function(response){
				LS.ResourcesManager.processResource( url, response, options, LS.ResourcesManager._resourceLoadedEnd, true );
			},
			error: function(err) { 	
				LS.ResourcesManager._resourceLoadedError(url,err);
			},
			progress: function(e) { 
				var partial_load = 0;
				if(e.total) //sometimes we dont have the total so we dont know the amount
					partial_load = e.loaded / e.total;
				if( LEvent.hasBind(  LS.ResourcesManager, "resource_loading_progress" ) ) //used to avoid creating objects during loading
					LEvent.trigger( LS.ResourcesManager, "resource_loading_progress", { url: url, event: e, progress: partial_load } );
				if( LEvent.hasBind(  LS.ResourcesManager, "loading_resources_progress" ) ) //used to avoid creating objects during loading
					LEvent.trigger( LS.ResourcesManager, "loading_resources_progress", 1.0 - (LS.ResourcesManager.num_resources_being_loaded - partial_load) / LS.ResourcesManager._total_resources_to_load );
			}
		};

		//force no cache by request
		settings.nocache = this.ignore_cache || this.force_nocache_extensions[ extension ] || this.nocache_files[ url ];

		//in case we need to force a response format 
		var format_info = LS.Formats.supported[ extension ];
		if( format_info && format_info.dataType ) //force dataType, otherwise it will be set by http server
			settings.dataType = format_info.dataType;

		//send the REQUEST
		LS.Network.request( settings ); //ajax call
		return false;
	},

	/**
	* Takes some resource data and transforms it to a resource (and Object ready to be used by the engine) and REGISTERs it in the ResourcesManager.
	* In most cases the process involves parsing and uploading to the GPU
	* It is called for every single resource that comes from an external source (URL) right after being loaded
	*
	* @method processResource
	* @param {String} url where the resource is located (if its a relative url it depends on the path attribute)
	* @param {*} data the data of the resource (could be string, arraybuffer, image... )
	* @param {Object}[options={}] options to apply to the loaded resource
	* @param {Function} on_complete once the resource is ready
	*/
	processResource: function( url, data, options, on_complete, was_loaded )
	{
		options = options || {};

		if(options && options.constructor !== Object)
			throw("processResource options must be object");
		if( data === null || data === undefined )
			throw("No data found when processing resource: " + url);

		var resource = null;
		var extension = this.getExtension( url );
		//get all the info about this file format
		var format_info = null;
		
		if(extension)
			format_info = LS.Formats.supported[ extension ];

		//callback to embede a parameter, ugly but I dont see a work around to create this
		var process_final = function( url, resource, options ){
			if(!resource)
			{
				LS.ResourcesManager._resourceLoadedEnd( url, null ); //to remove it from loading 
				return;
			}

			//convert format
			if( format_info && format_info.convert_to && extension != format_info.convert_to )
			{
				url += "." + format_info.convert_to;
				resource.filename += "." + format_info.convert_to;
				if( resource.fullpath )
					resource.fullpath += "." + format_info.convert_to;
				if(options.filename)
					options.filename += "." + format_info.convert_to;
			}

			//apply last changes
			LS.ResourcesManager.processFinalResource( url, resource, options, on_complete, was_loaded );

			//Keep original file inside the resource in case we want to save it
			if(LS.ResourcesManager.keep_files && (data.constructor == ArrayBuffer || data.constructor == String) && (!resource._original_data && !resource._original_file) )
				resource._original_data = data;
		}

		//this.resources_being_loaded[url] = [];
		this.resources_being_processed[url] = true;

		//no extension, then or it is a JSON, or an object with object_class or a WBin
		if(!extension)
			return this.processDataResource( url, data, options, process_final );


		// PRE-PROCESSING Stage (transform raw data in a resource) 
		// *******************************************************

		//special preprocessor
		var preprocessor_callback = this.resource_pre_callbacks[ extension.toLowerCase() ];
		if( preprocessor_callback )
		{
			//this callback should return the resource or true if it is processing it
			var resource = preprocessor_callback( url, data, options, process_final );
			if(resource === true)
				return;
			if( resource )
				process_final( url, resource, options );
			else //resource is null
			{
				this._resourceLoadedError( url, "Resource couldnt be processed" );
				return;
			}
		}
		else if( format_info && (format_info.type || format_info.parse) ) //or you can rely on the format info parser
		{
			var resource = null;
			switch( format_info.type )
			{
				case "scene":
					resource = LS.ResourcesManager.processScene( url, data, options, process_final );
					break;
				case "mesh":
					resource = LS.ResourcesManager.processTextMesh( url, data, options, process_final );
					break;
				case "texture":
				case "image":
					resource = LS.ResourcesManager.processImage( url, data, options, process_final );
					break;
				case "data":
				default:
					if( format_info.parse )
					{
						//console.warn("Fallback to default parser");
						var resource = format_info.parse( data );
						if(resource)
							process_final( url, resource, options );
					}
					else
						console.warn("Format Info without parse function");
			}

			//we have a resource
			if( resource && resource !== true )
				process_final( url, resource, options );
		}
		else //or just store the resource as a plain data buffer
		{
			var resource = null;
			//has this resource an special class specified?
			if(format_info && format_info.resourceClass)
				resource = new format_info.resourceClass();
			else //otherwise create a generic LS.Resource (they store data or scripts)
			{
				//if we already have a LS.Resource, reuse it (this is to avoid garbage and solve a problem with the editor
				var old_res = this.resources[url];
				if( old_res && old_res.constructor === LS.Resource )
				{
					resource = old_res;
					delete resource._original_data;
					delete resource._original_file;
					resource._modified = false;
				}
				else
					resource = new LS.Resource();
			}

			if(resource.setData)
				resource.setData(data, true)
			else
				throw("Resource without setData, cannot assign");

			if(resource)
			{
				resource.filename = resource.fullpath = url;
				process_final( url, resource, options );
			}
		}
	},

	/**
	* Takes a resource instance, and adds some extra properties and register it
	*
	* @method processFinalResource
	* @param {String} url where the resource is located (if its a relative url it depends on the path attribute)
	* @param {*} the resource class
	* @param {Object}[options={}] options to apply to the loaded resource
	* @param {Function} on_complete once the resource is ready
	*/
	processFinalResource: function( fullpath, resource, options, on_complete, was_loaded )
	{
		if(!resource || resource.constructor === String)
			return LS.ResourcesManager._resourceLoadedError( fullpath, "error processing the resource" );

		//EXTEND add properties as basic resource ********************************
		resource.filename = fullpath;
		if(options.filename) //used to overwrite
			resource.filename = options.filename;
		if(!options.is_local)
			resource.fullpath = fullpath;
		else
			fullpath = resource.fullpath = resource.filename;
		if(options.from_prefab)
			resource.from_prefab = options.from_prefab;
		if(options.from_pack)
			resource.from_pack = options.from_pack;
		if(was_loaded)
			resource.remotepath = fullpath; //it was url but is the same as fullpath?
		if(options.is_preview)
			resource.is_preview = true;

		//Remove from temporal containers
		if( LS.ResourcesManager.resources_being_processed[ fullpath ] )
			delete LS.ResourcesManager.resources_being_processed[ fullpath ];

		//Load associated resources (some resources like LS.Prefab or LS.SceneTree have other resources associated that must be loaded too)
		if(resource.getResources)
			ResourcesManager.loadResources( resource.getResources({}) );

		//REGISTER adds to containers *******************************************
		LS.ResourcesManager.registerResource( fullpath, resource );
		if(options.preview_of)
			LS.ResourcesManager.registerResource( options.preview_of, resource );

		//POST-PROCESS is done from inside registerResource, this way we ensure that every registered resource
		//has been post-processed, not only the loaded ones.

		//READY ***************************************
		if(on_complete)
			on_complete( fullpath, resource, options );
	},

	/**
	* Stores the resource inside the manager containers. This way it will be retrieveble by anybody who needs it.
	*
	* @method registerResource
	* @param {String} filename fullpath 
	* @param {Object} resource 
	*/
	registerResource: function( filename, resource )
	{
		if(!filename || !resource)
			throw("registerResource missing filename or resource");

		//test filename is valid (alphanumeric with spaces, dot or underscore and dash and slash
		if( this.valid_resource_name_reg.test( filename ) == false )
			console.warn( "invalid filename for resource: ", filename );

		//clean up the filename (to avoid problems with //)
		filename = this.cleanFullpath( filename );

		if( this.resources[ filename ] === resource )
			return; //already registered

		if(resource.is_preview && this.resources[ filename ] )
			return; //previews cannot overwrite resources

		resource.filename = filename; //filename is a given name
		//resource.fullpath = filename; //fullpath only if they are in the server

		//Compute resource type
		if(!resource.object_class)
			resource.object_class = LS.getObjectClassName( resource );
		var type = resource.object_class;
		if(resource.constructor.resource_type)
			type = resource.constructor.resource_type;

		//Add to global container
		this.resources[ filename ] = resource;

		//POST-PROCESS resources extra final action (done here to ensure any registered resource is post-processed)
		var post_callback = this.resource_post_callbacks[ type ];
		if(post_callback)
			post_callback( filename, resource );

		//send message to inform new resource is available
		if(!resource.is_preview)
			LEvent.trigger(this,"resource_registered", resource);

		LS.GlobalScene.requestFrame(); //render scene
	},	

	/**
	* removes the resources from all the containers
	*
	* @method unregisterResource
	* @param {String} filename 
	* @return {boolean} true is removed, false if not found
	*/
	unregisterResource: function(filename)
	{
		var resource = this.resources[filename];

		if(!resource)
			return false; //not found

		delete this.resources[filename];

		//ugly: too hardcoded, maybe implement unregister_callbacks
		if( this.meshes[filename] )
			delete this.meshes[ filename ];
		if( this.textures[filename] )
			delete this.textures[ filename ];
		if( this.materials[filename] )
			delete this.materials[ filename ];

		if(resource.constructor === LS.Pack || resource.constructor === LS.Prefab)
			resource.setResourcesLink(null);

		LEvent.trigger(this,"resource_unregistered", resource);
		LS.GlobalScene.requestFrame(); //render scene
		return true;
	},

	/**
	* Used to load files and get them as File (or Blob)
	* @method getURLasFile
	* @param {String} filename 
	* @return {File} the file
	*/
	getURLasFile: function( url, on_complete )
	{
		var oReq = new XMLHttpRequest();
		oReq.open("GET", this.getFullURL(url), true);
		oReq.responseType = "blob";
		oReq.onload = function(oEvent) {
		  var blob = oReq.response;
		  if(on_complete)
			  on_complete(blob, url);
		};
		oReq.send();
	},

	/**
	* Changes the name of a resource and sends an event to all components to change it accordingly
	* @method renameResource
	* @param {String} old_name 
	* @param {String} new_name
	* @param {Boolean} [skip_event=false] ignore sending an event to all components to rename the resource
	* @return {boolean} if the file was found
	*/
	renameResource: function( old_name, new_name, skip_event )	
	{
		var res = this.resources[ old_name ];
		if(!res)
			return false;

		if(this.resources[ new_name ])
			console.warn("There is a resource already with this name, overwritting it: " + new_name );

		res.filename = new_name;
		if(res.fullpath)
			res.fullpath = new_name;

		this.resources[new_name] = res;
		delete this.resources[ old_name ];

		//inform everybody in the scene
		if(!skip_event)
			LS.GlobalScene.sendResourceRenamedEvent( old_name, new_name, res );

		//inform prefabs and packs...
		for(var i in this.resources)
		{
			var alert_res = this.resources[i];
			if( alert_res != res && alert_res.onResourceRenamed )
				alert_res.onResourceRenamed( old_name, new_name, res );
		}

		//ugly: too hardcoded
		if( this.meshes[old_name] ) {
			delete this.meshes[ old_name ];
			this.meshes[ new_name ] = res;
		}
		if( this.textures[old_name] ) {
			delete this.textures[ old_name ];
			this.textures[ new_name ] = res;
		}
		if( this.materials[old_name] ) {
			delete this.materials[ old_name ];
			this.materials[ new_name ] = res;
		}

		//in case somebody needs to know where a resource has gone
		this.resources_renamed_recently[ old_name ] = new_name;

		if(!skip_event)
			LEvent.trigger( LS.ResourcesManager, "resource_renamed", [ old_name, new_name, res ] );
		return true;
	},

	/**
	* Tells if it is loading resources (or an specific resource)
	*
	* @method isLoading
	* @return {Boolean}
	*/
	isLoading: function( fullpath )
	{
		if(!fullpath)
			return this.num_resources_being_loaded > 0;
		if(this.resources_being_loaded[ fullpath ] || this.resources_being_processed[ fullpath ])
			return true;
		return false;
	},	

	/**
	* forces to try to reload again resources not found
	*
	* @method isLoading
	* @return {Boolean}
	*/
	clearNotFoundResources: function()
	{
		this.resources_not_found = {};
	},

	computeImageMetadata: function(texture)
	{
		var metadata = { width: texture.width, height: texture.height };
		return metadata;
	},

	/**
	* returns a mesh resource if it is loaded
	*
	* @method getMesh
	* @param {String} filename 
	* @return {Mesh}
	*/
	getMesh: function(name) {
		if(!name)
			return null;
		if(name.constructor === String)
			return this.meshes[name];
		if(name.constructor === GL.Mesh)
			return name;
		return null;
	},

	/**
	* returns a texture resource if it is loaded
	*
	* @method getTexture
	* @param {String} filename could be a texture itself in which case returns the same texture
	* @return {Texture} 
	*/
	getTexture: function(name) {
		if(!name)
			return null;
		if(name.constructor === String)
			return this.textures[name];
		if(name.constructor === GL.Texture)
			return name;
		return null;
	},

	getMaterial: function( name_or_id )
	{
		if(!name_or_id)
			return;
		if(name_or_id[0] == "@")
			return this.materials_by_uid[ name_or_id ];
		return this.materials[ name_or_id ];
	},

	/**
	* Binds a callback for when a resource is loaded (in case you need to do something special)
	*
	* @method onceLoaded
	* @param {String} fullpath of the resource you want to get the notification once is loaded
	* @param {Function} callback the function to call, it will be called as callback( fullpath, resource )
	* @return (number) index of the position in the array, use this index to cancel the event 
	*/
	onceLoaded: function( fullpath, callback )
	{
		var array = this.resource_once_callbacks[ fullpath ];
		if(!array)
		{
			this.resource_once_callbacks[ fullpath ] = [ callback ];
			return;
		}

		//avoid repeating
		if( array.indexOf( callback ) != -1 )
			return;

		array.push( callback );
		return array.length - 1;
	},

	/**
	* Cancels the binding of a onceLoaded
	*
	* @method cancelOnceLoaded
	* @param {String} fullpath fullpath of the resource you want to cancel the binding
	* @param {number} index the index of the callback to cancel (as it was returned by onceLoaded)
	*/
	cancelOnceLoaded: function( fullpath, index )
	{
		var array = this.resource_once_callbacks[ fullpath ];
		if(!array)
			return;
		array[ index ] = null;
	},

	//*************************************

	//Called after a resource has been loaded and processed
	_resourceLoadedEnd: function(url,res)
	{
		if( LS.ResourcesManager.debug )
			console.log("RES: " + url + " ---> " + LS.ResourcesManager.num_resources_being_loaded);

		if(res)
		{
			//trigger all associated load callbacks
			var callbacks_array = LS.ResourcesManager.resources_being_loaded[url];
			if(callbacks_array)
				for(var i = 0; i < callbacks_array.length; ++i )
				{
					if( callbacks_array[i].callback != null )
						callbacks_array[i].callback( res, url );
				}

			//triggers 'once' callbacks
			var callbacks_array = LS.ResourcesManager.resource_once_callbacks[url];
			if(callbacks_array)
			{
				for(var i = 0; i < callbacks_array.length; ++i)
					if(callbacks_array[i]) //could be null if it has been canceled
						callbacks_array[i](url, res);
				delete LS.ResourcesManager.resource_once_callbacks[url];
			}
		}

		//two pases, one for launching, one for removing
		if( LS.ResourcesManager.resources_being_loaded[url] )
		{
			delete LS.ResourcesManager.resources_being_loaded[url];
			LS.ResourcesManager.num_resources_being_loaded--;
			if(res)
				LEvent.trigger( LS.ResourcesManager, "resource_loaded", url );
			else
				LEvent.trigger( LS.ResourcesManager, "resource_problem_loading", url );
			LEvent.trigger( LS.ResourcesManager, "loading_resources_progress", 1.0 - LS.ResourcesManager.num_resources_being_loaded / LS.ResourcesManager._total_resources_to_load );
			if( LS.ResourcesManager.num_resources_being_loaded == 0)
			{
				LEvent.trigger( LS.ResourcesManager, "end_loading_resources", true);
				LS.ResourcesManager._total_resources_to_load = 0;
			}
		}

		//request frame
		LS.GlobalScene.requestFrame(); 
	},

	_resourceLoadedError: function( url, error )
	{
		console.log("Error loading " + url);
		delete LS.ResourcesManager.resources_being_loaded[url];
		delete LS.ResourcesManager.resource_once_callbacks[url];
		LS.ResourcesManager.resources_not_found[url] = true;
		LEvent.trigger( LS.ResourcesManager, "resource_not_found", url);
		LS.ResourcesManager.num_resources_being_loaded--;
		if( LS.ResourcesManager.num_resources_being_loaded == 0 )
			LEvent.trigger( LS.ResourcesManager, "end_loading_resources", false);
			//$(ResourcesManager).trigger("end_loading_resources");
	}
};

LS.RM = LS.ResourcesManager = ResourcesManager;

LS.getTexture = function( name_or_texture ) {
	return LS.ResourcesManager.getTexture( name_or_texture );
}	


// Resources readers and processors *********************************************
// When loading resources there are two stages:
// * Pre-process: extract from a container, parse raw data and transform it in a LS resource class (Texture,Mesh,SceneNode,Resource, ...)
// * Post-processed: validate, add extra metadata, and register
// This actions depend on the resource type, and format, and it is open so future formats are easy to implement.

//global formats: take a file and extract info
LS.ResourcesManager.registerResourcePreProcessor("wbin", function( filename, data, options) {

	//WBin will detect there is a class name inside the data and do the conversion to the specified class (p.e. a Prefab or a Mesh)
	var data = WBin.load( data, false, filename );
	return data;
},"binary");

LS.ResourcesManager.registerResourcePreProcessor("json", function(filename, data, options) {
	var resource = data;
	if( data.constructor === String )
	{
		try
		{
			data = JSON.parse( data );
		}
		catch (err)
		{
			console.error("invalid JSON");
			return null;
		}
	}

	var class_name = data.object_class || data.object_type; //object_type for LEGACY

	if( class_name && !data.is_data )
	{
		var ctor = LS.Classes[ class_name ] || window[ class_name ];
		if(ctor)
		{
			if(ctor.prototype.configure)
			{
				resource = new ctor();
				resource.configure( data );
			}
			else
				resource = new ctor( data );
		}
		else
		{
			console.error( "JSON object_class class not found: " + class_name );
			return null;
		}
	}
	else
	{
		//unknown JSON, create a resource
		resource = new LS.Resource();
		resource.filename = filename;
		resource._data = data;
		resource.type = "json";
		resource.category = "json";
	}
	return resource;
});

//global formats: take a file and extract info
LS.ResourcesManager.registerResourcePreProcessor("zip", function( filename, data, options ) {
	
	if(!global.JSZip)
		throw("JSZip not found. To use ZIPs you must have the JSZip.js library included in the website.");

	var zip = new JSZip();
	zip.loadAsync( data ).then(function(zip){
		zip.forEach(function (relativePath, file){
			if(file.dir)
				return; //ignore folders
			var ext = LS.ResourcesManager.getExtension( relativePath );
			var format = LS.Formats.supported[ ext ];
			file.async( format && format.dataType == "text" ? "string" : "arraybuffer").then( function(filedata){
				if( relativePath == "scene.json" && (!options || !options.to_memory) )
					LS.GlobalScene.configure( JSON.parse( filedata ) );
				else
					LS.ResourcesManager.processResource( relativePath, filedata );
			});
		});
	});

	return true;

},"binary");

//For resources without file extension (JSONs and WBINs)
LS.ResourcesManager.processDataResource = function( url, data, options, callback )
{
	//JSON?
	if( data.constructor === String )
		data = JSON.parse(data);

	//WBIN?
	if(data.constructor == ArrayBuffer)
	{
		resource = WBin.load(data);
		if(callback)
			callback(url, resource, options);
		return resource;
	}

	//JS OBJECT?
	var class_name = data.object_class;
	if(class_name && LS.Classes[class_name] )
	{
		var ctor = LS.Classes[class_name];
		var resource = null;
		if(ctor.prototype.configure)
		{
			resource = new LS.Classes[class_name]();
			resource.configure( data );
		}
		else
			resource = new LS.Classes[class_name]( data );
		if(callback)
			callback(url, resource, options);
		return resource;
	}

	console.warn("Resource Class name unknown: " + class_name );
	return false;
}

//Images ********

//Takes image data in some raw format and transforms it in regular image data, then converts it to GL.Texture
LS.ResourcesManager.processImage = function( filename, data, options, callback ) {

	var extension = LS.ResourcesManager.getExtension(filename);
	var mimetype = "application/octet-stream";
	if(extension == "jpg" || extension == "jpeg")
		mimetype = "image/jpg";
	else if(extension == "webp")
		mimetype = "image/webp";
	else if(extension == "gif")
		mimetype = "image/gif";
	else if(extension == "png")
		mimetype = "image/png";
	else {
		var format = LS.Formats.supported[ extension ];
		if(format.mimetype)
			mimetype = format.mimetype;
		else
		{
			var texture = this.processImageNonNative( filename, data, options );
			inner_on_texture( texture );
			return;
		}
	}

	//blob and load
	var blob = new Blob([data],{type: mimetype});
	var objectURL = URL.createObjectURL( blob );

	//regular image
	var image = new Image();
	image.src = objectURL;
	image.real_filename = filename; //hard to get the original name from the image
	image.onload = function()
	{
		var filename = this.real_filename;
		var texture = LS.ResourcesManager.processTexture( filename, this, options );
		inner_on_texture( texture );
	}
	image.onerror = function(err){
		URL.revokeObjectURL(objectURL); //free memory
		if(callback)
			callback( filename, null, options );
		console.error("Error while loading image, file is not native image format: " + filename); //error if image is not an image I guess
	}

	function inner_on_texture( texture )
	{
		if(texture)
		{
			//LS.ResourcesManager.registerResource( filename, texture ); //this is done already by processResource
			if(LS.ResourcesManager.keep_files)
				texture._original_data = data;
		}

		if( !LS.ResourcesManager.keep_urls )
			URL.revokeObjectURL( objectURL ); //free memory
		else
			texture._local_url = objectURL; //used in strange situations

		if(callback)
			callback(filename,texture,options);
	}

	return true;
}

//Similar to processImage but for non native file formats
LS.ResourcesManager.processImageNonNative = function( filename, data, options ) {

	//clone because DDS changes the original data
	var cloned_data = new Uint8Array(data).buffer;
	var texture_data = LS.Formats.parse( filename, cloned_data, options );

	if(!texture_data)
	{
		console.error("Cannot parse image format");
		return null;
	}

	if(texture_data.constructor == GL.Texture)
	{
		var texture = texture_data;
		texture.filename = filename;
		texture._original_data = cloned_data;
		return texture;
	}

	//texture in object format
	var texture = LS.ResourcesManager.processTexture( filename, texture_data );
	return texture;
}

//Takes one image (or canvas or object with width,height,pixels) as input and creates a GL.Texture
LS.ResourcesManager.processTexture = function(filename, img, options)
{
	if(img.width == (img.height / 6) || filename.indexOf("CUBECROSS") != -1) //cubemap
	{
		var cubemap_options = { wrapS: gl.MIRROR, wrapT: gl.MIRROR, magFilter: gl.LINEAR, minFilter: gl.LINEAR_MIPMAP_LINEAR };
		if( filename.indexOf("CUBECROSSL") != -1 )
			cubemap_options.is_cross = 1;
		var texture = GL.Texture.cubemapFromImage( img, cubemap_options );
		if(!texture) //happens if the image is not a cubemap
			return;
		texture.img = img;
	}
	else //regular texture
	{
		var default_mag_filter = gl.LINEAR;
		var default_wrap = gl.REPEAT;
		//var default_min_filter = img.width == img.height ? gl.LINEAR_MIPMAP_LINEAR : gl.LINEAR;
		var default_min_filter = gl.LINEAR_MIPMAP_LINEAR;
		if( !isPowerOfTwo(img.width) || !isPowerOfTwo(img.height) )
		{
			default_min_filter = gl.LINEAR;
			default_wrap = gl.CLAMP_TO_EDGE; 
		}
		var texture = null;

		//from TGAs...
		if(img.pixels) //not a real image, just an object with width,height and a buffer with all the pixels
			texture = GL.Texture.fromMemory(img.width, img.height, img.pixels, { format: (img.bpp == 24 ? gl.RGB : gl.RGBA), no_flip: img.flipY, wrapS: default_wrap, wrapT: default_wrap, magFilter: default_mag_filter, minFilter: default_min_filter });
		else //default format is RGBA (because particles have alpha)
			texture = GL.Texture.fromImage(img, { format: gl.RGBA,  wrapS: default_wrap, wrapT: default_wrap, magFilter: default_mag_filter, minFilter: default_min_filter });
		if(!texture)
			return;
		texture.img = img;
	}

	texture.filename = filename;
	texture.generateMetadata(); //useful
	return texture;
}

//Transform text mesh data in a regular GL.Mesh
LS.ResourcesManager.processTextMesh = function( filename, data, options ) {

	var mesh_data = LS.Formats.parse( filename, data, options );

	if(mesh_data == null)
	{
		console.error("Error parsing mesh: " + filename);
		return null;
	}

	var mesh = GL.Mesh.load(mesh_data);
	return mesh;
}

//this is called when loading a scene from a format that is not the regular serialize of our engine (like from ASE, G3DJ, BVH,...)
//converts scene data in a SceneNode
LS.ResourcesManager.processScene = function( filename, data, options ) {
	//options = options || {};

	var scene_data = LS.Formats.parse( filename, data, options );

	if(scene_data == null)
	{
		console.error("Error parsing scene: " + filename);
		return null;
	}

	LS.ResourcesManager._parsing_local_file = true;

	//resources (meshes, textures...)
	for(var i in scene_data.meshes)
	{
		var mesh = scene_data.meshes[i];
		LS.ResourcesManager.processResource( i, mesh );
	}

	//used for anims mostly
	for(var i in scene_data.resources)
	{
		var res = scene_data.resources[i];
		LS.ResourcesManager.processResource(i,res);
	}

	for(var i in scene_data.materials)
	{
		var material = scene_data.materials[i];
		LS.ResourcesManager.processResource(i,material);
	}

	var node = new LS.SceneNode();
	node.configure( scene_data.root );

	//make it a pack or prefab
	if(options && options.filename)
	{
		var ext = LS.RM.getExtension( options.filename );
		if(ext != "json")
			options.filename += ".json";
	}

	LS.ResourcesManager._parsing_local_file = false;

	return node;
}

// Post processors **********************************************************************************
// Take a resource already processed and does some final actions (like validate, register or compute metadata)

LS.ResourcesManager.registerResourcePostProcessor("Mesh", function(filename, mesh ) {

	mesh.object_class = "Mesh"; //useful
	if(mesh.metadata)
	{
		mesh.metadata = {};
		mesh.generateMetadata(); //useful
	}
	if(!mesh.bounding || mesh.bounding.length != BBox.data_length)
	{
		mesh.bounding = null; //remove bad one (just in case)
		mesh.updateBounding();
	}
	if(!mesh.getBuffer("normals"))
		mesh.computeNormals();

	if(LS.ResourcesManager.free_data) //free buffers to reduce memory usage
		mesh.freeData();

	LS.ResourcesManager.meshes[filename] = mesh;
});

LS.ResourcesManager.registerResourcePostProcessor("Texture", function( filename, texture ) {
	//store in appropiate container
	LS.ResourcesManager.textures[filename] = texture;
});

LS.ResourcesManager.registerResourcePostProcessor("Material", function( filename, material ) {
	//store in appropiate containers
	LS.ResourcesManager.materials[filename] = material;
	LS.ResourcesManager.materials_by_uid[ material.uid ] = material;
	if(material.prepare)
		material.prepare( LS.GlobalScene );
});

LS.ResourcesManager.registerResourcePostProcessor("Pack", function( filename, pack ) {
	//flag contents to specify where do they come from
	pack.flagResources();
});

LS.ResourcesManager.registerResourcePostProcessor("Prefab", function( filename, prefab ) {
	//apply to nodes in the scene that use this prefab
	prefab.applyToNodes();
});

LS.ResourcesManager.registerResourcePostProcessor("ShaderCode", function( filename, shader_code ) {
	//apply to materials that are using this ShaderCode
	shader_code.applyToMaterials();
});

