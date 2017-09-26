var Network = {

	default_dataType: "arraybuffer",
	protocol: null,

	withCredentials: false, //for CORS urls: not sure which one is the best for every case so I leave it configurable

	/**
	* A front-end for XMLHttpRequest so it is simpler and more cross-platform
	*
	* @method request
	* @param {Object} request object with the fields for the request: 
    *			dataType: result type {text,xml,json,binary,arraybuffer,image}, data: object with form fields, callbacks supported: {success, error, progress}
	* @return {XMLHttpRequest} the XMLHttpRequest of the petition
	*/
	request: function(request)
	{
		if(typeof(request) === "string")
			throw("LS.Network.request expects object, not string. Use LS.Network.requestText or LS.Network.requestJSON");

		//change protocol when working over https
		var url = request.url;
		if( this.protocol === null )
			this.protocol = LS.ResourcesManager.getProtocol( location.href );
		var protocol = LS.ResourcesManager.getProtocol( url );
		if( this.protocol == "https" && protocol && protocol != "https" )
			url = "https" + url.substr( url.indexOf(":") );

		//update dataType
		var dataType = request.dataType || this.default_dataType;
		if(dataType == "json") //parse it locally
			dataType = "text";
		else if(dataType == "xml") //parse it locally
			dataType = "text";
		else if (dataType == "binary")
		{
			//request.mimeType = "text/plain; charset=x-user-defined";
			dataType = "arraybuffer";
			request.mimeType = "application/octet-stream";
		}	
		else if(dataType == "image") //special case: images are loaded using regular images request
		{
			var img = new Image();
			img.onload = function() {
				if(request.success)
					request.success.call(this);
			};
			img.onerror = request.error;
			img.src = url;
			return img;
		}

		//regular case, use AJAX call
        var xhr = new XMLHttpRequest();
        xhr.open(request.data ? 'POST' : 'GET', url, true);
		xhr.withCredentials = this.withCredentials; //if true doesnt work
		if(request.withCredentials !== undefined)
			xhr.withCredentials = request.withCredentials;
        if(dataType)
            xhr.responseType = dataType;
        if (request.mimeType)
            xhr.overrideMimeType( request.mimeType );
		if(request.nocache)
			xhr.setRequestHeader('Cache-Control', 'no-cache');
        xhr.onload = function(load)
		{
			var response = this.response;
			if(this.status && this.status != 200) //status 0 is when working with local files
			{
				var err = "Error " + this.status;
				if(request.error)
					request.error(err);
				return;
			}
	
			//parse input
			if(request.dataType == "json") //chrome doesnt support json format
			{
				try
				{
					response = JSON.parse(response);
				}
				catch (err)
				{
					if(request.error)
						request.error(err);
				}
			}
			else if(request.dataType == "xml")
			{
				try
				{
					var xmlparser = new DOMParser();
					response = xmlparser.parseFromString(response,"text/xml");
				}
				catch (err)
				{
					if(request.error)
						request.error(err);
				}
			}

			//call callback
			if(LS.catch_errors)
			{
				try
				{
					if(request.success)
						request.success.call(this, response, request.url );
					LEvent.trigger(xhr,"done",response);
				}
				catch (err)
				{
					LEvent.trigger(LS,"code_error",err);
				}
			}
			else
			{
				if(request.success)
					request.success.call(this, response, request.url );
				LEvent.trigger(xhr,"done",response);
			}
		};
        xhr.onerror = function(err) {
			if(request.error)
				request.error(err);
			LEvent.trigger(this,"fail", err);
		}

		if( request.uploadProgress )
		{
			xhr.upload.addEventListener("progress", function(e){
				var progress = 0;
				if (e.lengthComputable)
					progress = e.loaded / e.total;
				request.uploadProgress( e, progress );
			}, false);
		}

		if( request.progress )
			xhr.addEventListener( "progress", function(e){
				var progress = 0;
				if (e.lengthComputable)
					progress = e.loaded / e.total;
				request.progress( e, progress );
			});

        xhr.send(request.data);

		return xhr;
	},

	/**
	* retrieve a text file from url (you can bind LEvents to done and fail)
	* @method requestText
	* @param {string} url
	* @param {object} params form params
	* @param {function} callback( data )
	*/
	requestText: function(url, data, callback, callback_error)
	{
		if(typeof(data) == "function")
		{
			callback = data;
			data = null;
		}
		return LS.Network.request({url:url, dataType:"text", success: callback, error: callback_error});
	},

	/**
	* retrieve a JSON file from url (you can bind LEvents to done and fail)
	* @method requestJSON
	* @param {string} url
	* @param {object} params form params
	* @param {function} callback( json )
	*/
	requestJSON: function(url, data, callback, callback_error)
	{
		if(typeof(data) == "function")
		{
			callback = data;
			data = null;
		}
		return LS.Network.request({url:url, data:data, dataType:"json", success: callback, error: callback_error });
	},

	/**
	* retrieve a file from url (you can bind LEvents to done and fail)
	* @method requestFile
	* @param {string} url
	* @param {object} params form params
	* @param {function} callback( file )
	*/
	requestFile: function(url, data, callback, callback_error)
	{
		if(typeof(data) == "function")
		{
			callback = data;
			data = null;
		}
		return LS.Network.request({url:url, data:data, success: callback, error: callback_error });
	},

	/**
	* Request script and inserts it in the DOM
	* @method requestScript
	* @param {String} url could be an array with urls to load in order
	* @param {Function} on_complete
	* @param {Function} on_error
	* @param {Function} on_progress (if several files are required, on_progress is called after every file is added to the DOM)
	**/
	requestScript: function( url, on_complete, on_error, on_progress )
	{
		if( !url )
			throw("No url");

		if( LS._block_scripts )
		{
			console.error("Safety: LS.block_scripts enabled, cannot request script");
			return;
		}

		if( url.constructor === String )
			url = [url];

		var total = url.length;
		var size = total;
		for( var i in url )
		{
			var script = document.createElement('script');
			script.num = i;
			script.type = 'text/javascript';
			script.src = url[i];
			script.async = false;
			//if( script.src.substr(0,5) == "blob:") //local scripts could contain utf-8
				script.charset = "UTF-8";
			script.onload = function(e) { 
				total--;
				if(total)
				{
					if(on_progress)
						on_progress(this.src, this.num);
				}
				else if(on_complete)
					on_complete();
			};
			if(on_error)
				script.onerror = function(err) { 
					on_error(err, this.src, this.num );
				}
			document.getElementsByTagName('head')[0].appendChild( script );
		}
	},

	requestFont: function( name, url )
	{
		if(!name || !url)
			throw("LS.Network.requestFont: Wrong font name or url");

		var fonts = this._loaded_fonts;
		if(!fonts)
			fonts = this._loaded_fonts = {};

		if(fonts[name] == url)
			return;
		fonts[name] = url;

		var style = document.getElementById("ls_fonts");
		if(!style)
		{
			style = document.createElement("style");
			style.id = "ls_fonts";
			style.setAttribute("type","text/css");
			document.head.appendChild(style);
		}
		var str = "";
		for(var i in fonts)
		{
			var url = fonts[i];
			str += "@font-face {\n" +
					"\tfont-family: \""+i+"\";\n" + 
					"\tsrc: url('"+url+"');\n" + 
			"}\n";
		}
		style.innerHTML = str;
	}

	//NOT TESTED: to load script asyncronously, not finished. similar to require.js
	/*
	requireScript: function(files, on_complete)
	{
		if(typeof(files) == "string")
			files = [files];

		//store for the callback
		var last = files[ files.length - 1];
		if(on_complete)
		{
			if(!ResourcesManager._waiting_callbacks[ last ])
				ResourcesManager._waiting_callbacks[ last ] = [on_complete];
			else
				ResourcesManager._waiting_callbacks[ last ].push(on_complete);
		}
		require_file(files);

		function require_file(files)
		{
			//avoid require twice a file
			var url = files.shift(1); 
			while( ResourcesManager._required_files[url] && url )
				url = files.shift(1);

			ResourcesManager._required_files[url] = true;

			LS.Network.request({
				url: url,
				success: function(response)
				{
					eval(response);
					if( ResourcesManager._waiting_callbacks[ url ] )
						for(var i in ResourcesManager._waiting_callbacks[ url ])
							ResourcesManager._waiting_callbacks[ url ][i]();
					require_file(files);
				}
			});
		}
	},
	_required_files: {},
	_waiting_callbacks: {}
	*/
};

LS.Network = Network;