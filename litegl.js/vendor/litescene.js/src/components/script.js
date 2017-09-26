
/** Script is the component in charge of executing scripts to control the behaviour of the application.
* Script must be coded in Javascript and they have full access to all the engine, so one script could replace the behaviour of any part of the engine.
* Scripts are executed inside their own context, the context is local to the script so any variable defined in the context that is not attached to the context wont be accessible from other parts of the engine.
* To interact with the engine Scripts must bind callback to events so the callbacks will be called when those events are triggered, however, there are some generic methods that will be called
* @class Script
* @constructor
* @param {Object} object to configure from
*/
function Script(o)
{
	this.enabled = true;
	this.code = this.constructor.templates["script"];
	this._blocked_functions = new Set(); //used to block functions that has errors
	this._name = "";

	this._script = new LScript();

	//this are the methods that will be in the prototype of the script context by default
	this._script.extra_methods = {
		getComponent: (function(type,index) { 
			if(!arguments.length)
				return this;
			if(!this._root)
				return null;
			return this._root.getComponent(type,index)
			}).bind(this),
		getLocator: function() { return this.getComponent().getLocator() + "/context"; },
		createProperty: LS.Component.prototype.createProperty,
		createAction: LS.Component.prototype.createAction,
		bind: LS.Component.prototype.bind,
		unbind: LS.Component.prototype.unbind,
		unbindAll: LS.Component.prototype.unbindAll
	};

	this._script.onerror = this.onError.bind(this);
	this._script.exported_functions = [];
	this._last_error = null;
	this._breakpoint_on_call = false;

	if(o)
		this.configure(o);
}

Script.secure_module = false; //this module is not secure (it can execute code)
Script.block_execution = false; //avoid executing code
Script.catch_important_exceptions = true; //catch exception during parsing, otherwise configuration could fail

Script.icon = "mini-icon-script.png";
Script.templates = {
	"script":"//@unnamed\n//defined: component, node, scene, transform, globals\nthis.onStart = function()\n{\n}\n\nthis.onUpdate = function(dt)\n{\n\t//node.scene.refresh();\n}"
};

Script["@code"] = {type:'script'};

//used to determine to which object to bind
Script.BIND_TO_COMPONENT = 1;
Script.BIND_TO_NODE = 2;
Script.BIND_TO_SCENE = 3;
Script.BIND_TO_RENDERER = 4;

//Here we specify which methods of the script will be automatically binded to events in the system
//This way developing is much more easy as you dont have to bind or unbind anything
Script.API_functions = {};
Script.API_events_to_function = {};

Script.defineAPIFunction = function( func_name, target, event, info ) {
	event = event || func_name;
	target = target || Script.BIND_TO_SCENE;
	var data = { name: func_name, target: target, event: event, info: info };
	Script.API_functions[ func_name ] = data;
	Script.API_events_to_function[ event ] = data;
}

//init
Script.defineAPIFunction( "onStart", Script.BIND_TO_SCENE, "start" );
Script.defineAPIFunction( "onFinish", Script.BIND_TO_SCENE, "finish" );
Script.defineAPIFunction( "onPrefabReady", Script.BIND_TO_NODE, "prefabReady" );
//behaviour
Script.defineAPIFunction( "onUpdate", Script.BIND_TO_SCENE, "update" );
Script.defineAPIFunction( "onNodeClicked", Script.BIND_TO_NODE, "node_clicked" );
Script.defineAPIFunction( "onClicked", Script.BIND_TO_NODE, "clicked" );
//rendering
Script.defineAPIFunction( "onSceneRender", Script.BIND_TO_SCENE, "beforeRender" );
Script.defineAPIFunction( "onCollectRenderInstances", Script.BIND_TO_NODE, "collectRenderInstances" ); //TODO: move to SCENE
Script.defineAPIFunction( "onRender", Script.BIND_TO_SCENE, "beforeRenderInstances" );
Script.defineAPIFunction( "onAfterRender", Script.BIND_TO_SCENE, "afterRenderInstances" );
Script.defineAPIFunction( "onAfterSceneRender", Script.BIND_TO_SCENE, "afterRender" );
Script.defineAPIFunction( "onRenderHelpers", Script.BIND_TO_SCENE, "renderHelpers" );
Script.defineAPIFunction( "onRenderGUI", Script.BIND_TO_SCENE, "renderGUI" );
Script.defineAPIFunction( "onEnableFrameContext", Script.BIND_TO_SCENE, "enableFrameContext" );
Script.defineAPIFunction( "onShowFrameContext", Script.BIND_TO_SCENE, "showFrameContext" );
//input
Script.defineAPIFunction( "onMouseDown", Script.BIND_TO_SCENE, "mousedown" );
Script.defineAPIFunction( "onMouseMove", Script.BIND_TO_SCENE, "mousemove" );
Script.defineAPIFunction( "onMouseUp", Script.BIND_TO_SCENE, "mouseup" );
Script.defineAPIFunction( "onMouseWheel", Script.BIND_TO_SCENE, "mousewheel" );
Script.defineAPIFunction( "onKeyDown", Script.BIND_TO_SCENE, "keydown" );
Script.defineAPIFunction( "onKeyUp", Script.BIND_TO_SCENE, "keyup" );
Script.defineAPIFunction( "onGamepadConnected", Script.BIND_TO_SCENE, "gamepadconnected" );
Script.defineAPIFunction( "onGamepadDisconnected", Script.BIND_TO_SCENE, "gamepaddisconnected" );
Script.defineAPIFunction( "onButtonDown", Script.BIND_TO_SCENE, "buttondown" );
Script.defineAPIFunction( "onButtonUp", Script.BIND_TO_SCENE, "buttonup" );
//global
Script.defineAPIFunction( "onFileDrop", Script.BIND_TO_SCENE, "fileDrop" );
//dtor
Script.defineAPIFunction( "onDestroy", Script.BIND_TO_NODE, "destroy" );


Script.coding_help = "For a complete guide check: <a href='https://github.com/jagenjo/litescene.js/blob/master/guides/scripting.md' target='blank'>Scripting Guide</a>";

Script.active_scripts = {};

Object.defineProperty( Script.prototype, "context", {
	set: function(v){ 
		console.error("Script: context cannot be assigned");
	},
	get: function() { 
		if(this._script)
				return this._script._context;
		return null;
	},
	enumerable: false //if it was enumerable it would be serialized
});

Object.defineProperty( Script.prototype, "name", {
	set: function(v){ 
		console.error("Script: name cannot be assigned, add to the first line //@name");
	},
	get: function() { 
		return this._name;
	},
	enumerable: false //if it was enumerable it would be serialized
});

Script.prototype.configure = function(o)
{
	if(o.uid)
		this.uid = o.uid;
	if(o.enabled !== undefined)
		this.enabled = o.enabled;
	if(o.code !== undefined)
		this.code = o.code;

	if(this._root && this._root.scene)
		this.processCode();

	//do this before processing the code if you want the script to overwrite the vars
	if(o.properties)
		 this.setContextProperties( o.properties );
}

Script.prototype.serialize = function()
{
	return {
		object_class: "Script",
		uid: this.uid,
		enabled: this.enabled,
		code: this.code,
		properties: LS.cloneObject( this.getContextProperties() )
	};
}

Script.prototype.getContext = function()
{
	if(this._script)
		return this._script._context;
	return null;
}

Script.prototype.getCode = function()
{
	return this.code;
}

Script.prototype.setCode = function( code, skip_events )
{
	this.code = code;
	this._blocked_functions.clear();
	this.processCode( skip_events );
}

/**
* Force to reevaluate the code (only for special situations)
* @method reload
*/
Script.prototype.reload = function()
{
	this.processCode();
}

/**
* This is the method in charge of compiling the code and executing the constructor, which also creates the context.
* It is called everytime the code is modified, that implies that the context is created when the component is configured.
* @method processCode
*/
Script.prototype.processCode = function( skip_events )
{
	this._blocked_functions.clear();
	this._script.code = this.code;

	//extract name
	this._name = "";
	if(this.code)
	{
		var line = this.code.substr(0,128);
		if(line.indexOf("//@") == 0)
		{
			var last = line.indexOf("\n");
			if(last == -1)
				last = undefined;
			this._name = line.substr(3,last - 3).trim();
		}
	}

	if(!this._root || LS.Script.block_execution )
		return true;

	//unbind old stuff
	if(this._script && this._script._context)
		this._script._context.unbindAll();

	//save old state
	var old = this._stored_properties || this.getContextProperties();

	//compiles and executes the context
	var ret = this._script.compile({component:this, node: this._root, scene: this._root.scene, transform: this._root.transform, globals: LS.Globals });
	if(!skip_events)
		this.hookEvents();

	this.setContextProperties( old );
	this._stored_properties = null;

	//execute some starter functions
	if( this._script._context && !this._script._context._initialized )
	{
		if( this._root && this._script._context.onAddedToNode)
			this._script._context.onAddedToNode( this._root );

		if( this._root && this._root.scene )
		{
			if( this._script._context.onAddedToScene )
				this._script._context.onAddedToScene( this._root.scene );

			if( this._script._context.onBind )
				this._script._context.onBind( this._root.scene );

			if( this._root.scene._state === LS.PLAYING && this._script._context.start )
				this._script._context.start();
		}

		this._script._context._initialized = true; //avoid initializing it twice
	}

	if( this._name && this._root && this._root.scene )
		LS.Script.active_scripts[ this._name ] = this;

	return ret;
}

Script.prototype.getContextProperties = function()
{
	var ctx = this.getContext();
	if(!ctx)
		return;
	return LS.cloneObject( ctx );
}

Script.prototype.setContextProperties = function( properties )
{
	if(!properties)
		return;
	var ctx = this.getContext();
	if(!ctx) //maybe the context hasnt been crated yet
	{
		this._stored_properties = properties;
		return;
	}

	//to copy we use the clone in target method
	LS.cloneObject( properties, ctx, false, true );
}

//used for graphs
Script.prototype.setProperty = function(name, value)
{
	var ctx = this.getContext();

	if( ctx && ctx[name] !== undefined )
	{
		if(ctx[name].set)
			ctx[name](value);
		else
			ctx[name] = value;
	}
	else if(this[name])
		this[name] = value;
}


Script.prototype.getPropertiesInfo = function()
{
	var ctx = this.getContext();

	if(!ctx)
		return {enabled:"boolean"};

	var attrs = LS.getObjectProperties( ctx );
	attrs.enabled = "boolean";
	return attrs;
}

/*
Script.prototype.getPropertyValue = function( property )
{
	var ctx = this.getContext();
	if(!ctx)
		return;

	return ctx[ property ];
}

Script.prototype.setPropertyValue = function( property, value )
{
	var context = this.getContext();
	if(!context)
		return;

	if( context[ property ] === undefined )
		return;

	if(context[ property ] && context[ property ].set)
		context[ property ].set( value );
	else
		context[ property ] = value;

	return true;
}
*/

//used for animation tracks
Script.prototype.getPropertyInfoFromPath = function( path )
{
	if(path[0] != "context")
		return;

	var context = this.getContext();

	if(path.length == 1)
		return {
			name:"context",
			node: this._root,
			target: context,
			type: "object",
			value: context
		};

	var varname = path[1];
	if(!context || context[ varname ] === undefined )
		return;

	var value = context[ varname ];
	var extra_info = context[ "@" + varname ];
	if(!extra_info)
		extra_info = context.constructor[ "@" + varname ];

	var type = "";
	if(extra_info)
		type = extra_info.type;

	if(!type && value !== null && value !== undefined)
	{
		if(value.constructor === String)
			type = "string";
		else if(value.constructor === Boolean)
			type = "boolean";
		else if(value.length)
			type = "vec" + value.length;
		else if(value.constructor === Number)
			type = "number";
		else if(value.constructor === Function)
			type = "function";
	}

	if(type == "function")
		value = varname; //just to avoid doing assignments of functions

	return {
		node: this._root,
		target: context,
		name: varname,
		value: value,
		type: type
	};
}

Script.prototype.setPropertyValueFromPath = function( path, value, offset )
{
	offset = offset || 0;

	if( path.length < (offset+1) )
		return;

	if(path[offset] != "context" )
		return;

	var context = this.getContext();
	var varname = path[offset+1];
	if(!context || context[ varname ] === undefined )
		return;

	if( context[ varname ] === undefined )
		return;

	//cannot assign functions this way
	if( context[ varname ] && context[ varname ].constructor == Function )
		return;

	if(context[ varname ] && context[ varname ].set)
		context[ varname ].set( value );
	else
		context[ varname ] = value;
	return true;
}

/**
* This check if the context has API functions that should be called, if thats the case, it binds events automatically
* This way we dont have to bind manually all the methods.
* @method hookEvents
*/
Script.prototype.hookEvents = function()
{
	var node = this._root;
	if(!node)
		throw("hooking events of a Script without a node");
	var scene = node.scene || LS.GlobalScene; //hack

	//script context
	var context = this.getContext();
	if(!context)
		return;

	//hook events
	for(var i in LS.Script.API_functions)
	{
		var func_name = i;
		var event_info = LS.Script.API_functions[ func_name ];

		var target = null;
		switch( event_info.target )
		{
			case Script.BIND_TO_COMPONENT: target = this; break;
			case Script.BIND_TO_NODE: target = node; break;
			case Script.BIND_TO_SCENE: target = scene; break;
			case Script.BIND_TO_RENDERER: target = LS.Renderer; break;
		}
		if(!target)
			throw("Script event without target?");

		//check if this function exist
		if( context[ func_name ] && context[ func_name ].constructor === Function )
		{
			if( !LEvent.isBind( target, event_info.event, this.onScriptEvent, this )  )
				LEvent.bind( target, event_info.event, this.onScriptEvent, this );
		}
		else //if it doesnt ensure we are not binding the event
			LEvent.unbind( target, event_info.event, this.onScriptEvent, this );
	}
}

/**
* Called every time an event should be redirected to one function in the script context
* @method onScriptEvent
*/
Script.prototype.onScriptEvent = function(event_type, params)
{
	if(!this.enabled)
		return;

	var event_info = LS.Script.API_events_to_function[ event_type ];
	if(!event_info)
		return; //????
	if(this._breakpoint_on_call)
	{
		this._breakpoint_on_call = false;
		{{debugger}} //stops the execution if the console is open
	}

	if( this._blocked_functions.has( event_info.name ) ) //prevent calling code with errors
		return;

	var r = this._script.callMethod( event_info.name, params, undefined, this );
	return r;
}

Script.prototype.onAddedToNode = function( node )
{
	if(!node.script)
		node.script = this;
}

Script.prototype.onRemovedFromNode = function( node )
{
	if(node.script == this)
		delete node.script;
}

Script.prototype.onAddedToScene = function( scene )
{
	if( this._name )
		LS.Script.active_scripts[ this._name ] = this;

	//avoid to parse it again
	if(this._script && this._script._context && this._script._context._initialized )
	{
		if(this._script._context.onBind)
			this._script._context.onBind();
		return;
	}

	if( !this.constructor.catch_important_exceptions )
	{
		this.processCode();
		return;
	}

	//catch
	try
	{
		//careful, if the code saved had an error, do not block the flow of the configure or the rest will be lost
		this.processCode();
	}
	catch (err)
	{
		console.error(err);
	}


}

Script.prototype.onRemovedFromScene = function(scene)
{
	if( this._name && LS.Script.active_scripts[ this._name ] == this )
		delete LS.Script.active_scripts[ this._name ];

	//ensures no binded events
	LEvent.unbindAll( scene, this );
	if( this._context )
	{
		LEvent.unbindAll( scene, this._context, this );
		if(this._script._context.onUnbind )
			this._script._context.onUnbind( scene );
		if(this._script._context.onRemovedFromScene )
			this._context.onRemovedFromScene( scene );
	}
}

//used in editor
Script.prototype.getComponentTitle = function()
{
	return this.name; //name is a getter that reads the name from the code comment
}

Script.prototype.toInfoString = function()
{
	if(!this._root)
		return LS.getObjectClassName( this );
	return LS.getObjectClassName( this ) + " in node " + this._root.name;
}


//TODO stuff ***************************************
/*
Script.prototype.onAddedToProject = function( project )
{
	try
	{
		//just in case the script saved had an error, do not block the flow
		this.processCode();
	}
	catch (err)
	{
		console.error(err);
	}
}

Script.prototype.onRemovedFromProject = function( project )
{
	//ensures no binded events
	if(this._context)
		LEvent.unbindAll( project, this._context, this );

	//unbind evends
	LEvent.unbindAll( project, this );
}
*/
//*******************************

Script.prototype.onError = function(e)
{
	var scene = this._root.scene;
	if(!scene)
		return;

	e.script = this;
	e.node = this._root;
	this._blocked_functions.add( e.method_name );

	LEvent.trigger( this, "code_error",e);
	LEvent.trigger( scene, "code_error",e);
	LEvent.trigger( LS, "code_error",e);

	//conditional this?
	console.log("app finishing due to error in script");
	scene.finish();
}

//called from the editor?
Script.prototype.onCodeChange = function(code)
{
	this.processCode();
}

Script.prototype.getResources = function(res)
{
	var ctx = this.getContext();

	for(var i in ctx)
	{
		var value = ctx[i];
		var info = ctx.constructor[ "@" + i];
		if( !value || !info )
			continue;
		if( info.type == LS.TYPES.RESOURCE || info.type == LS.TYPES.TEXTURE || info.type == LS.TYPES.MESH )
			res[ value ] = true;
	}

	if(ctx && ctx.onGetResources )
		ctx.onGetResources( res );
}

Script.prototype.onResourceRenamed = function( old_name, new_name, resource )
{
	var ctx = this.getContext();
	if(ctx && ctx.onResourceRenamed )
		ctx.onResourceRenamed( old_name, new_name, resource );
}

LS.registerComponent( Script );
LS.Script = Script;

//*****************

function ScriptFromFile(o)
{
	this.enabled = true;
	this._filename = "";
	this._name = "";

	this._script = new LScript();
	this._blocked_functions = new Set(); //used to block functions that has errors

	this._script.extra_methods = {
		getComponent: (function() { return this; }).bind(this),
		getLocator: function() { return this.getComponent().getLocator() + "/context"; },
		createProperty: LS.Component.prototype.createProperty,
		createAction: LS.Component.prototype.createAction,
		bind: LS.Component.prototype.bind,
		unbind: LS.Component.prototype.unbind,
		unbindAll: LS.Component.prototype.unbindAll
	};

	this._script.onerror = this.onError.bind(this);
	this._script.exported_functions = [];//this.constructor.exported_callbacks;
	this._last_error = null;

	if(o)
		this.configure(o);
}

ScriptFromFile.coding_help = Script.coding_help;

Object.defineProperty( ScriptFromFile.prototype, "filename", {
	set: function(v){ 
		if(v) //to avoid double slashes
			v = LS.ResourcesManager.cleanFullpath( v );
		this._filename = v;
		this.processCode();
	},
	get: function() { 
		return this._filename;
	},
	enumerable: true
});

Object.defineProperty( ScriptFromFile.prototype, "context", {
	set: function(v){ 
		console.error("ScriptFromFile: context cannot be assigned");
	},
	get: function() { 
		if(this._script)
				return this._script._context;
		return null;
	},
	enumerable: false //if it was enumerable it would be serialized
});

Object.defineProperty( ScriptFromFile.prototype, "name", {
	set: function(v){ 
		console.error("Script: name cannot be assigned, set the first line with //@name");
	},
	get: function() { 
		return this._name;
	},
	enumerable: false //if it was enumerable it would be serialized
});

ScriptFromFile.prototype.onAddedToScene = function( scene )
{
	//avoid to parse it again
	if(this._script && this._script._context && this._script._context._initialized )
	{
		if( this._script._context.onBind )
			this._script._context.onBind( scene );
		if( this._script._context.onAddedToScene )
			this._script._context.onAddedToScene( scene );

		return;
	}

	if( !this.constructor.catch_important_exceptions )
	{
		this.processCode();
		return;
	}

	//catch
	try
	{
		//careful, if the code saved had an error, do not block the flow of the configure or the rest will be lost
		this.processCode();
	}
	catch (err)
	{
		console.error(err);
	}
}

/**
* Force to reevaluate the code (only for special situations like remove codes)
* @method reload
* @param {Function} [on_complete=null] 
*/
ScriptFromFile.prototype.reload = function( on_complete )
{
	if(!this.filename)
		return;
	var that = this;
	LS.ResourcesManager.load( this.filename, null, function( res, url ){
		if( url != that.filename )
			return;
		that.processCode();
		if(on_complete)
			on_complete(that);
	}, true);
}


ScriptFromFile.prototype.processCode = function( skip_events, on_complete )
{
	var that = this;
	if(!this.filename)
		return;

	var script_resource = LS.ResourcesManager.getResource( this.filename );
	if(!script_resource)
	{
		LS.ResourcesManager.load( this.filename, null, function( res, url ){
			if( url != that.filename )
				return;
			that.processCode( skip_events );
			if(on_complete)
				on_complete(that);
		});
		return;
	}

	var code = script_resource.data;
	if( code === undefined)
	{
		this._name = "";
		return;
	}

	if( this._script.code == code )
		return;

	// ****** CODE PROCESSED ***********************

	//extract name
	this._name = "";
	if(code)
	{
		var line = code.substr(0,128);
		if(line.indexOf("//@") == 0)
		{
			var last = line.indexOf("\n");
			if(last == -1)
				last = undefined;
			this._name = line.substr(3,last - 3).trim();
		}
	}

	if(!this._root || LS.Script.block_execution )
		return true;

	//assigned inside because otherwise if it gets modified before it is attached to the scene tree then it wont be compiled
	this._script.code = code;

	//unbind old stuff
	if( this._script && this._script._context )
		this._script._context.unbindAll();

	//compiles and executes the context
	var old = this._stored_properties || this.getContextProperties();
	var ret = this._script.compile({component:this, node: this._root, scene: this._root.scene, transform: this._root.transform, globals: LS.Globals });
	if(!skip_events)
		this.hookEvents();
	this.setContextProperties( old );
	this._stored_properties = null;

	//try to catch up with all the events missed while loading the script
	if( this._script._context && !this._script._context._initialized )
	{
		if( this._root && this._script._context.onAddedToNode)
			this._script._context.onAddedToNode( this._root );

		if( this._root && this._root.scene )
		{
			if( this._script._context.onAddedToScene )
				this._script._context.onAddedToScene( this._root.scene );

			if( this._script._context.onBind )
				this._script._context.onBind( this._root.scene );

			if( this._root.scene._state === LS.PLAYING && this._script._context.start )
				this._script._context.start();
		}

		this._script._context._initialized = true; //avoid initializing it twice
	}

	if( this._name && this._root && this._root.scene )
		LS.Script.active_scripts[ this._name ] = this;

	if(on_complete)
		on_complete(this);

	return ret;
}

ScriptFromFile.prototype.configure = function(o)
{
	if(o.uid)
		this.uid = o.uid;
	if(o.enabled !== undefined)
		this.enabled = o.enabled;
	if(o.filename !== undefined)
		this.filename = o.filename;
	if(o.properties)
		 this.setContextProperties( o.properties );

	if(this._root && this._root.scene)
		this.processCode();
}

ScriptFromFile.prototype.serialize = function()
{
	return {
		object_class: "ScriptFromFile",
		uid: this.uid,
		enabled: this.enabled,
		filename: this.filename,
		properties: LS.cloneObject( this.getContextProperties() )
	};
}


ScriptFromFile.prototype.getResources = function(res)
{
	if(this.filename)
		res[this.filename] = LS.Resource;

	//script resources
	var ctx = this.getContext();
	if(!ctx || !ctx.getResources )
		return;
	ctx.getResources( res );
}

ScriptFromFile.prototype.onResourceRenamed = function (old_name, new_name, resource)
{
	if(this.filename == old_name)
		this.filename = new_name;
}

ScriptFromFile.prototype.getCodeResource = function()
{
	return LS.ResourcesManager.getResource( this.filename );
}


ScriptFromFile.prototype.getCode = function()
{
	var script_resource = LS.ResourcesManager.getResource( this.filename );
	if(!script_resource)
		return "";
	return script_resource.data;
}

ScriptFromFile.prototype.setCode = function( code, skip_events )
{
	var script_resource = LS.ResourcesManager.getResource( this.filename );
	if(!script_resource)
		return "";
	script_resource.data = code;
	this.processCode( skip_events );
}

ScriptFromFile.updateComponents = function( script, skip_events )
{
	if( !script )
		return;

	var fullpath = script.fullpath || script.filename;
	var scene = LS.GlobalScene;
	var components = scene.findNodeComponents( LS.ScriptFromFile );
	for(var i = 0; i < components.length; ++i)
	{
		var compo = components[i];
		if( compo.filename == fullpath )
			compo.processCode(skip_events);
	}
}

LS.extendClass( ScriptFromFile, Script );

LS.registerComponent( ScriptFromFile );
LS.ScriptFromFile = ScriptFromFile;

