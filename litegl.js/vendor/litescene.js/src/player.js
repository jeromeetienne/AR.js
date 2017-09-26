/**
* Player class allows to handle the app context easily without having to glue manually all events
	There is a list of options
	==========================
	- canvas: the canvas where the scene should be rendered, if not specified one will be created
	- container_id: string with container id where to create the canvas, width and height will be those from the container
	- width: the width for the canvas in case it is created without a container_id
	- height: the height for the canvas in case it is created without a container_id
	- resources: string with the path to the resources folder
	- shaders: string with the url to the shaders.xml file
	- proxy: string with the url where the proxy is located (useful to avoid CORS)
	- filesystems: object that contains the virtual file systems info { "VFS":"http://litefileserver.com/" } ...
	- redraw: boolean to force to render the scene constantly (useful for animated scenes)
	- autoresize: boolean to automatically resize the canvas when the window is resized
	- autoplay: boolean to automatically start playing the scene once the load is completed
	- loadingbar: boolean to show a loading bar
	- debug: boolean allows to render debug info like nodes and skeletons

	Optional callbacks to attach
	============================
	- onPreDraw: executed before drawing a frame (in play mode)
	- onDraw: executed after drawing a frame (in play mode)
	- onPreUpdate(dt): executed before updating the scene (delta_time as parameter)
	- onUpdate(dt): executed after updating the scene (delta_time as parameter)
	- onDrawLoading: executed when loading
	- onMouse(e): when a mouse event is triggered
	- onKey(e): when a key event is triggered
* @namespace LS
* @class Player
* @constructor
* @param {Object} options settings for the webgl context creation
*/
function Player(options)
{
	options = options || {};
	this.options = options;

	if(!options.canvas)
	{
		var container = options.container;
		if(options.container_id)
			container = document.getElementById(options.container_id);

		if(!container)
		{
			console.log("No container specified in LS.Player, using BODY as container");
			container = document.body;
		}

		//create canvas
		var canvas = document.createElement("canvas");
		canvas.width = container.offsetWidth;
		canvas.height = container.offsetHeight;
		if(!canvas.width) canvas.width = options.width || 1;
		if(!canvas.height) canvas.height = options.height || 1;
		container.appendChild(canvas);
		options.canvas = canvas;
	}

	this.debug = false;

	this.gl = GL.create(options); //create or reuse
	this.canvas = this.gl.canvas;
	this.render_settings = new LS.RenderSettings(); //this will be replaced by the scene ones.
	this.scene = LS.GlobalScene;
	this._file_drop_enabled = false; //use enableFileDrop

	LS.ShadersManager.init( options.shaders || "data/shaders.xml" );
	if(!options.shaders)
		console.warn("LS: no shaders folder specified, using default file.");

	LS.Renderer.init();

	//this will repaint every frame and send events when the mouse clicks objects
	this.state = LS.Player.STOPPED;

	if( this.gl.ondraw )
		throw("There is already a litegl attached to this context");

	//set options
	this.configure( options );

	//bind all the events 
	this.gl.ondraw = LS.Player.prototype._ondraw.bind(this);
	this.gl.onupdate = LS.Player.prototype._onupdate.bind(this);

	var mouse_event_callback = LS.Player.prototype._onmouse.bind(this);
	this.gl.onmousedown = mouse_event_callback;
	this.gl.onmousemove = mouse_event_callback;
	this.gl.onmouseup = mouse_event_callback;
	this.gl.onmousewheel = mouse_event_callback;

	var key_event_callback = LS.Player.prototype._onkey.bind(this);
	this.gl.onkeydown = key_event_callback;
	this.gl.onkeyup = key_event_callback;

	var touch_event_callback = LS.Player.prototype._ontouch.bind(this);
	this.gl.ontouch = touch_event_callback;

	var gamepad_event_callback = LS.Player.prototype._ongamepad.bind(this);
	this.gl.ongamepadconnected = gamepad_event_callback;
	this.gl.ongamepaddisconnected = gamepad_event_callback;
	this.gl.ongamepadButtonDown = gamepad_event_callback;
	this.gl.ongamepadButtonUp = gamepad_event_callback;

	//capture input
	gl.captureMouse(true);
	gl.captureKeys(true);
	gl.captureTouch(true);
	gl.captureGamepads(true);

	LS.Input.init();

	if(options.enableFileDrop !== false)
		this.setFileDrop(true);

	//launch render loop
	gl.animate();
}

Object.defineProperty( Player.prototype, "file_drop_enabled", {
	set: function(v)
	{
		this.setFileDrop(v);
	},
	get: function()
	{
		return this._file_drop_enabled;
	},
	enumerable: true
});

/**
* Loads a config file for the player, it could also load an scene if the config specifies one
* @method loadConfig
* @param {String} url url to the JSON file containing the config
* @param {Function} on_complete callback trigged when the config is loaded
* @param {Function} on_scene_loaded callback trigged when the scene and the resources are loaded (in case the config contains a scene to load)
*/
Player.prototype.loadConfig = function( url, on_complete, on_scene_loaded )
{
	var that = this;
	LS.Network.requestJSON( url, inner );
	function inner( data )
	{
		that.configure( data, on_scene_loaded );
		if(on_complete)
			on_complete(data);
	}
}

Player.prototype.configure = function( options, on_scene_loaded )
{
	var that = this;

	this.autoplay = options.autoplay !== undefined ? options.autoplay : true;
	if(options.debug)
		this.enableDebug();
	else
		this.enableDebug(false);

	if(options.resources !== undefined)
		LS.ResourcesManager.setPath( options.resources );

	if(options.proxy)
		LS.ResourcesManager.setProxy( options.proxy );
	if(options.filesystems)
	{
		for(var i in options.filesystems)
			LS.ResourcesManager.registerFileSystem( i, options.filesystems[i] );
	}

	if(options.allow_base_files)
		LS.ResourcesManager.allow_base_files = options.allow_base_files;

	if(options.autoresize && !this._resize_callback)
	{
		this._resize_callback = (function(){
			this.canvas.width = this.canvas.parentNode.offsetWidth;
			this.canvas.height = this.canvas.parentNode.offsetHeight;
		}).bind(this)
		window.addEventListener("resize",this._resize_callback);
	}

	if(options.loadingbar)
	{
		if(!this.loading)
			this.enableLoadingBar();
	}
	else if(options.loadingbar === false)
		this.loading = null;	

	this.force_redraw = options.redraw || false;
	if(options.debug_render)
		this.setDebugRender(true);

	if(options.scene_url)
		this.loadScene( options.scene_url, on_scene_loaded );
}

Player.STOPPED = 0;
Player.PLAYING = 1;
Player.PAUSED = 2;

/**
* Loads an scene and triggers start
* @method loadScene
* @param {String} url url to the JSON file containing all the scene info
* @param {Function} on_complete callback trigged when the scene and the resources are loaded
*/
Player.prototype.loadScene = function(url, on_complete, on_progress)
{
	var that = this;
	var scene = this.scene;
	if(this.loading)
		this.loading.visible = true;

	scene.load( url, null, null, inner_progress, inner_start );

	function inner_start()
	{
		//start playing once loaded the json
		if(that.autoplay)
			that.play();
		//console.log("Scene playing");
		if(	that.loading )
			that.loading.visible = false;
		if(on_complete)
			on_complete();
	}

	function inner_progress(e)
	{
		if(that.loading == null)
			return;
		var partial_load = 0;
		if(e.total) //sometimes we dont have the total so we dont know the amount
			partial_load = e.loaded / e.total;
		that.loading.scene_loaded = partial_load;
		if(on_progress)
			on_progress(partial_load);
	}
}

/**
* loads Scene from object or JSON taking into account external and global scripts
* @method setScene
* @param {Object} scene
* @param {Function} on_complete callback trigged when the scene and the resources are loaded
*/
Player.prototype.setScene = function( scene_info, on_complete, on_before_play )
{
	var that = this;
	var scene = this.scene;

	//reset old scene
	if(this.state == LS.Player.PLAYING)
		this.stop();
	scene.clear();

	if(scene_info && scene_info.constructor === String )
		scene_info = JSON.parse(scene_info);

	var scripts = LS.SceneTree.getScriptsList( scene_info );

	if( scripts && scripts.length )
	{
		scene.clear();
		scene.loadScripts( scripts, inner_external_ready );
	}
	else
		inner_external_ready();

	function inner_external_ready()
	{
		scene.configure( scene_info );
		scene.loadResources( inner_all_resources_loaded );
	}

	function inner_all_resources_loaded()
	{
		if( LS.ShadersManager.ready )
			inner_all_loaded();
		else
			LS.ShadersManager.on_ready = inner_all_loaded;
	}

	function inner_all_loaded()
	{
		if( on_before_play )
			on_before_play( scene );
		if(that.autoplay)
			that.play();
		scene._must_redraw = true;
		console.log("Scene playing");
		if(on_complete)
			on_complete( scene );
	}
}

/**
* Pauses the execution. This will launch a "paused" event and stop calling the update method
* @method pause
*/
Player.prototype.pause = function()
{
	this.state = LS.Player.PAUSED;
}

/**
* Starts the scene. This will launch a "start" event and start calling the update for every frame
* @method play
*/
Player.prototype.play = function()
{
	if(this.state == LS.Player.PLAYING)
		return;
	if(this.debug)
		console.log("Start");
	this.state = LS.Player.PLAYING;
	LS.Input.reset(); //this force some events to be sent
	LS.GUI.reset(); //clear GUI
	this.scene.start();
}

/**
* Stops the scene. This will launch a "finish" event and stop calling the update 
* @method stop
*/
Player.prototype.stop = function()
{
	this.state = LS.Player.STOPPED;
	this.scene.finish();
	LS.GUI.reset(); //clear GUI
}

/**
* Clears the current scene
* @method clear
*/
Player.prototype.clear = function()
{
	LS.Input.reset(); //this force some events to be sent
	LS.GUI.reset(); //clear GUI
	this.scene.clear();
}

/**
* Enable the functionality to catch files droped in the canvas so script can catch the "fileDrop" event (onFileDrop in the Script components).
* @method setFileDrop
* @param {boolean} v true if you want to allow file drop (true by default)
*/
Player.prototype.setFileDrop = function(v)
{
	if(this._file_drop_enabled == v)
		return;

	var that = this;
	var element = this.canvas;

	if(!v)
	{
		element.removeEventListener("dragenter", this._onDrag );
		return;
	}

	this._file_drop_enabled = v;
	this._onDrag = onDrag.bind(this);
	this._onDrop = onDrop.bind(this);
	this._onDragStop = onDragStop.bind(this);

	element.addEventListener("dragenter", this._onDrag );

	function onDragStop(evt)
	{
		evt.stopPropagation();
		evt.preventDefault();
	}

	function onDrag(evt)
	{
		element.addEventListener("dragexit", this._onDragStop );
		element.addEventListener("dragover", this._onDragStop );
		element.addEventListener("drop", this._onDrop );
		evt.stopPropagation();
		evt.preventDefault();
		/*
		if(evt.type == "dragenter" && callback_enter)
			callback_enter(evt, this);
		if(evt.type == "dragexit" && callback_exit)
			callback_exit(evt, this);
		*/
	}

	function onDrop(evt)
	{
		evt.stopPropagation();
		evt.preventDefault();

		element.removeEventListener("dragexit", this._onDragStop );
		element.removeEventListener("dragover", this._onDragStop );
		element.removeEventListener("drop", this._onDrop );

		if( evt.dataTransfer.files.length )
		{
			for(var i = 0; i < evt.dataTransfer.files.length; ++i )
			{
				var file = evt.dataTransfer.files[i];
				var r = this._onfiledrop(file,evt);
				if(r === false)
				{
					evt.stopPropagation();
					evt.stopImmediatePropagation();
				}
			}
		}
	}
}

Player.prototype.enableLoadingBar = function()
{
	this.loading = {
		visible: true,
		scene_loaded: 0,
		resources_loaded: 0
	};
	LEvent.bind( LS.ResourcesManager, "start_loading_resources", (function(e,v){ 
		if(!this.loading)
			return;
		this.loading.resources_loaded = 0.0; 
	}).bind(this) );
	LEvent.bind( LS.ResourcesManager, "loading_resources_progress", (function(e,v){ 
		if(!this.loading)
			return;
		if( this.loading.resources_loaded < v )
			this.loading.resources_loaded = v;
	}).bind(this) );
	LEvent.bind( LS.ResourcesManager, "end_loading_resources", (function(e,v){ 
		if(!this.loading)
			return;
		this._total_loading = undefined; 
		this.loading.resources_loaded = 1; 
		this.loading.visible = false;
	}).bind(this) );
}

Player.prototype._onfiledrop = function( file, evt )
{
	return LEvent.trigger( LS.GlobalScene, "fileDrop", { file: file, event: evt } );
}

//called by the render loop to draw every frame
Player.prototype._ondraw = function()
{
	var scene = this.scene;

	if(this.state == LS.Player.PLAYING)
	{
		if(this.onPreDraw)
			this.onPreDraw();

		if(scene._must_redraw || this.force_redraw )
		{
			scene.render( scene.info ? scene.info.render_settings : this.render_settings );
		}

		if(this.onDraw)
			this.onDraw();
	}

	if(this.loading && this.loading.visible )
	{
		this.renderLoadingBar( this.loading );
		LEvent.trigger( this.scene, "render_loading" );
		if(this.onDrawLoading)
			this.onDrawLoading();
	}
}

Player.prototype._onupdate = function(dt)
{
	if(this.state != LS.Player.PLAYING)
		return;

	LS.Tween.update(dt);
	LS.Input.update(dt);

	if(this.onPreUpdate)
		this.onPreUpdate(dt);

	this.scene.update(dt);

	if(this.onUpdate)
		this.onUpdate(dt);

}

//input
Player.prototype._onmouse = function(e)
{
	//send to the input system (if blocked ignore it)
	if( LS.Input.onMouse(e) == true )
		return;

	//console.log(e);
	if(this.state != LS.Player.PLAYING)
		return;

	LEvent.trigger( this.scene, e.eventType || e.type, e, true );

	//hardcoded event handlers in the player
	if(this.onMouse)
		this.onMouse(e);
}

//input
Player.prototype._ontouch = function(e)
{
	//console.log(e);
	if(this.state != LS.Player.PLAYING)
		return;

	if( LEvent.trigger( this.scene, e.eventType || e.type, e, true ) === false )
		return false;

	//hardcoded event handlers in the player
	if(this.onTouch)
		this.onTouch(e);
}

Player.prototype._onkey = function(e)
{
	//send to the input system
	LS.Input.onKey(e);

	if(this.state != LS.Player.PLAYING)
		return;

	//hardcoded event handlers in the player
	if(this.onKey)
	{
		var r = this.onKey(e);
		if(r)
			return;
	}

	LEvent.trigger( this.scene, e.eventType || e.type, e );
}

Player.prototype._ongamepad = function(e)
{
	if(this.state != LS.Player.PLAYING)
		return;

	//hardcoded event handlers in the player
	if(this.onGamepad)
	{
		var r = this.onGamepad(e);
		if(r)
			return;
	}

	LEvent.trigger( this.scene, e.eventType || e.type, e );
}

//renders the loading bar, you can replace it in case you want your own loading bar 
Player.prototype.renderLoadingBar = function( loading )
{
	if(!loading)
		return;

	if(!global.enableWebGLCanvas)
		return;

	if(!gl.canvas.canvas2DtoWebGL_enabled)
		enableWebGLCanvas( gl.canvas );

	gl.start2D();

	var y = 0;//gl.drawingBufferHeight - 6;
	gl.fillColor = [0,0,0,1];
	gl.fillRect( 0, y, gl.drawingBufferWidth, 8);
	//scene
	gl.fillColor = loading.bar_color || [0.5,0.9,1.0,1.0];
	gl.fillRect( 0, y, gl.drawingBufferWidth * loading.scene_loaded, 4 );
	//resources
	gl.fillColor = loading.bar_color || [0.9,0.5,1.0,1.0];
	gl.fillRect( 0, y + 4, gl.drawingBufferWidth * loading.resources_loaded, 4 );
	gl.finish2D();
}

Player.prototype.enableDebug = function(v)
{
	this.debug = !!v;
	LS.Script.catch_important_exceptions = !v;
	LS.catch_exceptions = !v;
}

/**
* Enable a debug renderer that shows gizmos for most of the things on the scene
* @method setDebugRender
* @param {boolean} v true if you want the debug render
*/
Player.prototype.setDebugRender = function(v)
{
	if(!this.debug_render)
	{
		if(!v)
			return;
		this.debug_render = new LS.DebugRender();
	}

	if(v)
		this.debug_render.enable();
	else
		this.debug_render.disable();
}


LS.Player = Player;
