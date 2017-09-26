/**
* The SceneTree contains all the info about the Scene and nodes
*
* @class SceneTree
* @constructor
*/

function SceneTree()
{
	this.uid = LS.generateUId("TREE-");

	this._root = new LS.SceneNode("root");
	this._root.removeAllComponents();
	this._root._is_root  = true;
	this._root._in_tree = this;
	this._nodes = [ this._root ];
	this._nodes_by_name = {"root":this._root};
	this._nodes_by_uid = {};
	this._nodes_by_uid[ this._root.uid ] = this._root;
	this._components_by_uid = {};

	//used to stored info when collecting from nodes
	this._instances = [];
	this._lights = [];
	this._cameras = [];
	this._colliders = [];

	//MOST OF THE PARAMETERS ARE CREATED IN init() METHOD

	//in case the resources base path are located somewhere else, if null the default is used
	this.external_repository = null;

	//work in progress, not finished yet. This will contain all the objects
	this._spatial_container = new LS.SpatialContainer();

	this.external_scripts = []; //external scripts that must be loaded before initializing the scene (mostly libraries used by this scene)
	this.global_scripts = []; //scripts that are located in the resources folder and must be loaded before launching the app
	this.preloaded_resources = {}; //resources that must be loaded, appart from the ones in the components

	//track with global animations of the scene
	this.animation = null;

	//FEATURES NOT YET FULLY IMPLEMENTED
	this._paths = []; //FUTURE FEATURE: to store splines I think
	this._local_resources = {}; //used to store resources that go with the scene

	this.layer_names = ["main","secondary"];

	LEvent.bind( this, "treeItemAdded", this.onNodeAdded, this );
	LEvent.bind( this, "treeItemRemoved", this.onNodeRemoved, this );

	this._shaderblock_info = null;

	this.init();
}

//LS.extendClass( SceneTree, ComponentContainer ); //scene could also have components

Object.defineProperty( SceneTree.prototype, "root", {
	enumerable: true,
	get: function() {
		return this._root;
	},
	set: function(v) {
		throw("Root node cannot be replaced");
	}
});

Object.defineProperty( SceneTree.prototype, "time", {
	enumerable: true,
	get: function() {
		return this._time;
	},
	set: function(v) {
		throw("Cannot set time directly");
	}
});

Object.defineProperty( SceneTree.prototype, "state", {
	enumerable: true,
	get: function() {
		return this._state;
	},
	set: function(v) {
		throw("Cannot set state directly, use start, finish, pause, unpause");
	}
});

Object.defineProperty( SceneTree.prototype, "globalTime", {
	enumerable: true,
	get: function() {
		return this._global_time;
	},
	set: function(v) {
		throw("Cannot set global_time directly");
	}
});

Object.defineProperty( SceneTree.prototype, "frame", {
	enumerable: true,
	get: function() {
		return this._frame;
	},
	set: function(v) {
		throw("Cannot set frame directly");
	}
});

//Some useful events
SceneTree.supported_events = ["start","update","finish","clear","beforeReload","change","afterRender","configure","nodeAdded","nodeChangeParent","nodeComponentRemoved","reload","renderPicking","scene_loaded","serialize"];

//methods

/**
* This initializes the content of the scene.
* Call it to clear the scene content
*
* @method init
* @return {Boolean} Returns true on success
*/
SceneTree.prototype.init = function()
{
	this.id = "";
	//this.materials = {}; //shared materials cache: moved to LS.RM.resources
	this.external_repository = null;

	this.global_scripts = [];
	this.external_scripts = [];
	this.preloaded_resources = {};

	this._root.removeAllComponents();
	this._root.uid = LS.generateUId("NODE-");

	this._nodes = [ this._root ];
	this._nodes_by_name = { "root": this._root };
	this._nodes_by_uid = {};
	this._nodes_by_uid[ this._root.uid ] = this._root;
	this._components_by_uid = {};

	//WIP
	this._spatial_container.clear();

	//default components
	this.info = new LS.Components.GlobalInfo();
	this._root.addComponent( this.info );
	this._root.addComponent( new LS.Camera({ eye:[0,100,100], center:[0,0,0]} ) );
	this._root.addComponent( new LS.Light({ position: vec3.fromValues(100,100,100), target: vec3.fromValues(0,0,0) }) );

	this._frame = 0;
	this._last_collect_frame = -1; //force collect
	this._state = LS.STOPPED;

	this._time = 0;
	this._global_time = 0; //in seconds
	this._start_time = 0; //in seconds
	this._last_dt = 1/60; //in seconds
	this._must_redraw = true;

	if(this.selected_node) 
		delete this.selected_node;

	this.layer_names = ["main","secondary"];
	this.animation = null;
	this._local_resources = {}; //not used yet
	this.extra = {};

	this._renderer = LS.Renderer;
}

/**
* Clears the scene using the init function
* and trigger a "clear" LEvent
*
* @method clear
*/
SceneTree.prototype.clear = function()
{
	//remove all nodes to ensure no lose callbacks are left
	while(this._root._children && this._root._children.length)
		this._root.removeChild(this._root._children[0], false, true ); //recompute_transform, remove_components

	//remove scene components
	this._root.processActionInComponents("onRemovedFromNode",this); //send to components
	this._root.processActionInComponents("onRemovedFromScene",this); //send to components

	this.init();
	/**
	 * Fired when the whole scene is cleared
	 *
	 * @event clear
	 */
	LEvent.trigger(this,"clear");
	LEvent.trigger(this,"change");
}

/**
* Configure the Scene using an object (the object can be obtained from the function serialize)
* Inserts the nodes, configure them, and change the parameters
* ATTENTION: Destroys all previously existing info
*
* @method configure
* @param {Object} scene_info the object containing all the info about the nodes and config of the scene
*/
SceneTree.prototype.configure = function( scene_info )
{
	if(!scene_info || scene_info.constructor === String)
		throw("SceneTree configure requires object");

	this._root.removeAllComponents(); //remove light, camera, skybox

	//this._components = [];
	//this.camera = this.light = null; //legacy

	if(scene_info.uid)
		this.uid = scene_info.uid;

	if((scene_info.object_class || scene_info.object_type) != "SceneTree") //legacy
		console.warn("Warning: object set to scene doesnt look like a propper one.", scene_info);

	if(scene_info.external_repository)
		this.external_repository = scene_info.external_repository;

	//extra info that the user wanted to save (comments, etc)
	if(scene_info.extra)
		this.extra = scene_info.extra;

	//this clears all the nodes
	if(scene_info.root)
	{
		this._spatial_container.clear(); // is this necessary?
		this._root.configure( scene_info.root );
	}

	if( scene_info.global_scripts )
		this.global_scripts = scene_info.global_scripts.concat();

	if( scene_info.external_scripts )
		this.external_scripts = scene_info.external_scripts.concat();

	if( scene_info.preloaded_resources )
		this.preloaded_resources = LS.cloneObject( scene_info.preloaded_resources );

	if( scene_info.layer_names )
		this.layer_names = scene_info.layer_names.concat();

	if(scene_info.animation)
		this.animation = new LS.Animation( scene_info.animation );

	//if(scene_info.components)
	//	this.configureComponents( scene_info );

	if(scene_info.editor)
		this._editor = scene_info.editor;

	/**
	 * Fired after the scene has been configured
	 * @event configure
	 * @param {Object} scene_info contains all the info to do the configuration
	 */
	LEvent.trigger(this,"configure",scene_info);
	/**
	 * Fired when something changes in the scene
	 * @event change
	 * @param {Object} scene_info contains all the info to do the configuration
	 */
	LEvent.trigger(this,"change");
}

/**
* Creates and object containing all the info about the scene and nodes.
* The oposite of configure.
* It calls the serialize method in every node
*
* @method serialize
* @return {Object} return a JS Object with all the scene info
*/

SceneTree.prototype.serialize = function()
{
	var o = {};

	o.uid = this.uid;
	o.object_class = LS.getObjectClassName(this);

	o.external_repository = this.external_repository;

	//o.nodes = [];
	o.extra = this.extra || {};

	//add nodes
	o.root = this.root.serialize();

	if(this.animation)
		o.animation = this.animation.serialize();

	o.layer_names = this.layer_names.concat();
	o.global_scripts = this.global_scripts.concat();
	o.external_scripts = this.external_scripts.concat();
	o.preloaded_resources = LS.cloneObject( this.preloaded_resources );

	if( this._editor )
		o.editor = this._editor;

	//this.serializeComponents( o );

	/**
	 * Fired after the scene has been serialized to an object
	 * @event serialize
	 * @param {Object} object to store the persistent info
	 */
	LEvent.trigger(this,"serialize",o);

	return o;
}


/**
* Assigns a scene from a JSON description (or WBIN,ZIP)
*
* @method setFromJSON
* @param {String} data JSON object containing the scene
* @param {Function}[on_complete=null] the callback to call when the scene is ready
* @param {Function}[on_error=null] the callback to call if there is a  loading error
* @param {Function}[on_progress=null] it is called while loading the scene info (not the associated resources)
* @param {Function}[on_resources_loaded=null] it is called when all the resources had been loaded
* @param {Function}[on_scripts_loaded=null] the callback to call when the loading is complete but before assigning the scene
*/

SceneTree.prototype.setFromJSON = function( data, on_complete, on_error, on_progress, on_resources_loaded, on_scripts_loaded )
{
	if(!data)
		return;

	var that = this;

	if(data.constructor === String)
	{
		try
		{
			data = JSON.parse( data );
		}
		catch (err)
		{
			console.log("Error: " + err );
			return;
		}
	}

	var scripts = LS.SceneTree.getScriptsList( data, true );

	//check JSON for special scripts
	if ( scripts.length )
		this.loadScripts( scripts, function(){ inner_success( data ); }, inner_error );
	else
		inner_success( data );


	function inner_success( response )
	{
		if(on_scripts_loaded)
			on_scripts_loaded(that,response);

		that.init();
		that.configure(response);
		that.loadResources( inner_all_loaded );
		/**
		 * Fired when the scene has been loaded but before the resources
		 * @event load
		 */
		LEvent.trigger(that,"load");

		if(!LS.ResourcesManager.isLoading())
			inner_all_loaded();

		if(on_complete)
			on_complete(that);
	}

	function inner_all_loaded()
	{
		if(on_resources_loaded)
			on_resources_loaded(that);
		/**
		 * Fired after all resources have been loaded
		 * @event loadCompleted
		 */
		LEvent.trigger( that, "loadCompleted");
	}

	function inner_error(err,script_url)
	{
		console.error("Error loading script: " + script_url);
		if(on_error)
			on_error(err);
	}
}


/**
* Loads a scene from a relative url pointing to a JSON description (or WBIN,ZIP)
* Warning: this url is not passed through the LS.ResourcesManager so the url is absolute
*
* @method load
* @param {String} url where the JSON object containing the scene is stored
* @param {Function}[on_complete=null] the callback to call when the loading is complete
* @param {Function}[on_error=null] the callback to call if there is a  loading error
* @param {Function}[on_progress=null] it is called while loading the scene info (not the associated resources)
* @param {Function}[on_resources_loaded=null] it is called when all the resources had been loaded
*/

SceneTree.prototype.load = function( url, on_complete, on_error, on_progress, on_resources_loaded, on_loaded )
{
	if(!url)
		return;

	var that = this;

	var extension = LS.ResourcesManager.getExtension( url );

	//request scene file using our own library
	LS.Network.request({
		url: url,
		nocache: true,
		dataType: extension == "json" ? "json" : "binary",
		success: extension == "json" ? inner_json_loaded : inner_pack_loaded,
		progress: on_progress,
		error: inner_error
	});

	/**
	 * Fired before loading scene
	 * @event beforeLoad
	 */
	LEvent.trigger(this,"beforeLoad");

	function inner_pack_loaded( response )
	{
		//process pack
		LS.ResourcesManager.processResource( url, response, null, inner_pack_processed );
	}

	function inner_pack_processed( pack_url, pack )
	{
		if(!pack || !pack._data || !pack._data["scene.json"] )
		{
			console.error("Error loading PACK, doesnt look like it has a valid scene inside");
			return;
		}

		var scene = JSON.parse( pack._data["scene.json"] );

		inner_json_loaded( scene );
	}

	function inner_json_loaded( response )
	{
		var scripts = LS.SceneTree.getScriptsList( response, true );

		//check JSON for special scripts
		if ( scripts.length )
			that.loadScripts( scripts, function(){ inner_success(response); }, on_error );
		else
			inner_success( response );
	}

	function inner_success( response )
	{
		if(on_loaded)
			on_loaded(that, url);

		that.init();
		that.configure(response);

		if(on_complete)
			on_complete(that, url);

		that.loadResources( inner_all_loaded );
		/**
		 * Fired when the scene has been loaded but before the resources
		 * @event load
		 */
		LEvent.trigger(that,"load");

		if(!LS.ResourcesManager.isLoading())
			inner_all_loaded();
	}

	function inner_all_loaded()
	{
		if(on_resources_loaded)
			on_resources_loaded(that, url);
		/**
		 * Fired after all resources have been loaded
		 * @event loadCompleted
		 */
		LEvent.trigger(that,"loadCompleted");
	}

	function inner_error(e)
	{
		var err_code = (e && e.target) ? e.target.status : 0;
		console.warn("Error loading scene: " + url + " -> " + err_code);
		if(on_error)
			on_error(url, err_code, e);
	}
}


/**
* Loads a scene from a relative url pointing to a JSON description (or WBIN,ZIP)
* It uses the resources folder as the root folder (in comparison with the regular load function)
*
* @method loadFromResources
* @param {String} url where the JSON object containing the scene is stored
* @param {Function}[on_complete=null] the callback to call when the loading is complete
* @param {Function}[on_error=null] the callback to call if there is a  loading error
* @param {Function}[on_progress=null] it is called while loading the scene info (not the associated resources)
* @param {Function}[on_resources_loaded=null] it is called when all the resources had been loaded
*/
SceneTree.prototype.loadFromResources = function( url, on_complete, on_error, on_progress, on_resources_loaded )
{
	url = LS.ResourcesManager.getFullURL( url );
	this.load( url, on_complete, on_error, on_progress, on_resources_loaded );
}



/**
* Static method, returns a list of all the scripts that must be loaded, in order and with the full path
*
* @method SceneTree.getScriptsList
* @param {SceneTree|Object} scene the object containing info about the scripts (could be a scene or a JSON object)
* @param {Boolean} allow_local if we allow local resources
* @param {Boolean} full_paths if true it will return the full path to every resource
*/
SceneTree.getScriptsList = function( scene, allow_local, full_paths )
{
	if(!scene)
		throw("SceneTree.getScriptsList: scene cannot be null");

	var scripts = [];
	if ( scene.external_scripts && scene.external_scripts.length )
		scripts = scripts.concat( scene.external_scripts );
	if ( scene.global_scripts && scene.global_scripts.length )
	{
		for(var i in scene.global_scripts)
		{
			var script_url = scene.global_scripts[i];
			if(!script_url || LS.ResourcesManager.getExtension( script_url ) != "js" )
				continue;

			var res = LS.ResourcesManager.getResource( script_url );
			if(res)
			{
				if( allow_local )
					script_url = LS.ResourcesManager.cleanFullpath( script_url );
			}

			if(full_paths)
				script_url = LS.ResourcesManager.getFullURL( script_url );

			scripts.push( script_url );
		}
	}
	return scripts;
}

//reloads external and global scripts taking into account if they come from wbins
SceneTree.prototype.loadScripts = function( scripts, on_complete, on_error, force_reload )
{
	//get a list of scripts (they cannot be fullpaths)
	scripts = scripts || LS.SceneTree.getScriptsList( this, true );

	if(!scripts.length)
	{
		if(on_complete)
			on_complete();
		return;
	}

	if( LS._block_scripts )
	{
		console.error("Safety: LS.block_scripts enabled, cannot request script");
		return;
	}

	//All this is to allow the use of scripts that are in memory (they came packed inside a WBin with the scene)
	var final_scripts = [];
	var revokable = [];

	for(var i in scripts)
	{
		var script_url = scripts[i];
		var res = LS.ResourcesManager.getResource( script_url );
		if(!res || force_reload)
		{
			final_scripts.push( LS.ResourcesManager.getFullURL( script_url ) );
			continue;
		}

		var blob = new Blob([res.data],{encoding:"UTF-8", type: 'text/plain;charset=UTF-8'});
		var objectURL = URL.createObjectURL( blob );
		final_scripts.push( objectURL );
		revokable.push( objectURL );
	}

	LS.Network.requestScript( final_scripts, inner_complete, on_error );

	function inner_complete()
	{
		//revoke urls created
		for(var i in revokable)
			URL.revokeObjectURL( revokable[i] );

		if(on_complete)
			on_complete();
	}
}

//used to ensure that components use the right class when the class comes from a global script
SceneTree.prototype.checkComponentsCodeModification = function()
{
	for(var i = 0; i < this._nodes.length; ++i )
	{
		//current components
		var node = this._nodes[i];
		for(var j = 0; j < node._components.length; ++j)
		{
			var compo = node._components[j];
			var class_name = LS.getObjectClassName( compo );
			var current_class = LS.Components[ class_name ];
			if( current_class == compo.constructor )
				continue;
			//replace class instance in-place
			var data = compo.serialize();

			var new_compo = new current_class( data );

			var index = node.getIndexOfComponent( compo );
			node.removeComponent( compo );
			
			node.addComponent( new_compo, index );
			console.log("Class replaced: " + class_name );
		}

		//missing
		if(node._missing_components && node._missing_components.length)
		{
			var still_missing = [];
			for(var j = 0; j < node._missing_components.length; ++j)
			{
				var compo_info = node._missing_components[j];
				var class_name = compo_info[0];
				var current_class = LS.Components[ class_name ];
				if(!current_class)
				{
					still_missing.push(compo_info);
					continue; //still missing
				}
				var new_compo = new current_class( compo_info[1] );
				node.addComponent( new_compo );
				console.log("Missing repaired: " + class_name );
			}
			node._missing_components = still_missing.length ? still_missing : null;
		}
	}
}

SceneTree.prototype.appendScene = function(scene)
{
	//clone: because addNode removes it from scene.nodes array
	var nodes = scene.root.childNodes;

	/*
	//bring materials
	for(var i in scene.materials)
		this.materials[i] = scene.materials[i];
	*/
	
	//add every node one by one
	for(var i in nodes)
	{
		var node = nodes[i];
		var new_node = new LS.SceneNode( node.id );
		this.root.addChild( new_node );
		new_node.configure( node.constructor == LS.SceneNode ? node.serialize() : node  );
	}
}

SceneTree.prototype.getCamera = function()
{
	var camera = this._root.camera;
	if(camera) 
		return camera;

	if(this._cameras && this._cameras.length)
		return this._cameras[0];

	this.collectData(); //slow
	return this._cameras[0];
}

/**
* Returns an array with all the cameras enabled in the scene
*
* @method getActiveCameras
* @param {boolean} force [optional] if you want to collect the cameras again, otherwise it returns the last ones collected
* @return {Array} cameras
*/
SceneTree.prototype.getActiveCameras = function( force )
{
	if(force)
		LEvent.trigger(this, "collectCameras", this._cameras );
	return this._cameras;
}

/**
* Returns an array with all the cameras in the scene (even if they are disabled)
*
* @method getAllCameras
* @return {Array} cameras
*/
SceneTree.prototype.getAllCameras = function()
{
	var cameras = [];
	for(var i = 0; i < this._nodes.length; ++i)
	{
		var node = this._nodes[i];
		var node_cameras = node.getComponents( LS.Components.Camera );
		if(node_cameras && node_cameras.length)
			cameras = cameras.concat( node_cameras );
	}
	return cameras;
}

SceneTree.prototype.getLight = function()
{
	return this._root.light;
}

/**
* Returns an array with all the lights enabled in the scene
*
* @method getActiveLights
* @param {boolean} force [optional] if you want to collect the lights again, otherwise it returns the last ones collected
* @return {Array} lights
*/
SceneTree.prototype.getActiveLights = function( force )
{
	if(force)
		LEvent.trigger(this, "collectLights", this._lights );
	return this._lights;
}

SceneTree.prototype.onNodeAdded = function(e,node)
{
	//remove from old scene
	if(node._in_tree && node._in_tree != this)
		throw("Cannot add a node from other scene, clone it");

	if( node._name && !this._nodes_by_name[ node._name ] )
		this._nodes_by_name[ node._name ] = node;

	/*
	//generate unique id
	if(node.id && node.id != -1)
	{
		if(this._nodes_by_id[node.id] != null)
			node.id = node.id + "_" + (Math.random() * 1000).toFixed(0);
		this._nodes_by_id[node.id] = node;
	}
	*/

	//store by uid
	if(!node.uid || this._nodes_by_uid[ node.uid ])
		node._uid = LS.generateUId("NODE-");
	//if( this._nodes_by_uid[ node.uid ] )
	//	console.warn("There are more than one node with the same UID: ", node.uid );
	this._nodes_by_uid[ node.uid ] = node;

	//store nodes linearly
	this._nodes.push(node);

	node.processActionInComponents("onAddedToScene",this); //send to components
	for(var i = 0; i < node._components.length; ++i)
		if(node._components[i].uid)
			this._components_by_uid[ node._components[i].uid ] = node._components[i];
		else
			console.warn("component without uid?", node._components[i].uid );

	/**
	 * Fired when a new node is added to this scene
	 *
	 * @event nodeAdded
	 * @param {LS.SceneNode} node
	 */
	LEvent.trigger(this,"nodeAdded", node);
	LEvent.trigger(this,"change");
}

SceneTree.prototype.onNodeRemoved = function(e,node)
{
	var pos = this._nodes.indexOf(node);
	if(pos == -1) 
		return;

	this._nodes.splice(pos,1);
	if(node._name && this._nodes_by_name[ node._name ] == node )
		delete this._nodes_by_name[ node._name ];
	if(node.uid)
		delete this._nodes_by_uid[ node.uid ];

	//node.processActionInComponents("onRemovedFromNode",node);
	node.processActionInComponents("onRemovedFromScene",this); //send to components
	for(var i = 0; i < node._components.length; ++i)
		delete this._components_by_uid[ node._components[i].uid ];

	/**
	 * Fired after a node has been removed
	 *
	 * @event nodeRemoved
	 * @param {LS.SceneNode} node
	 */
	LEvent.trigger(this,"nodeRemoved", node);
	LEvent.trigger(this,"change");
	return true;
}

/**
* all nodes are stored in an array, this function recomputes the array so they are in the right order in case one has changed order
*
* @method recomputeNodesArray
*/
SceneTree.prototype.recomputeNodesArray = function()
{
	var nodes = this._nodes;
	var pos = 0;
	inner( this._root );

	function inner(node)
	{
		nodes[pos] = node;
		pos+=1;
		if(!node._children || !node._children.length)
			return;
		for(var i = 0; i < node._children.length; ++i)
			inner( node._children[i] );
	}
}

//WIP
SceneTree.prototype.attachSceneElement = function( element )
{
	this._spatial_container.add( element );
}

SceneTree.prototype.detachSceneElement = function( element )
{
	this._spatial_container.remove( element );
}


/**
* Returns the array containing all the nodes in the scene
*
* @method getNodes
* @param {bool} recompute [optional] in case you want to rearrange the nodes
* @return {Array} array containing every SceneNode in the scene
*/
SceneTree.prototype.getNodes = function( recompute )
{
	if(recompute)
		this.recomputeNodesArray();
	return this._nodes;
}

/**
* retrieves a Node based on the name, path ( name|childname|etc ) or uid
*
* @method getNode
* @param {String} name node name to search
* @return {Object} the node or null if it didnt find it
*/
SceneTree.prototype.getNode = function( name )
{
	if(name == "")
		return this.root;
	if(!name || name.constructor !== String)
		return null;
	if(name.charAt(0) == LS._uid_prefix)
		return this._nodes_by_uid[ name ];

	// the | char is used to specify a node child of another node
	if( name.indexOf("|") != -1)
	{
		var tokens = name.split("|");
		var node = this.root; //another option could be to start in this._nodes_by_name[ tokens[0] ]
		for(var i = 0; i < tokens.length && node; ++i)
			node = node.getChildByName( tokens[i] );
		return node;
	}

	return this._nodes_by_name[ name ];
}

/**
* retrieves a Node that matches that name. It is fast because they are stored in an object.
* If more than one object has the same name, the first one added to the tree is returned
*
* @method getNodeByName
* @param {String} name name of the node
* @return {Object} the node or null if it didnt find it
*/
SceneTree.prototype.getNodeByName = function( name )
{
	return this._nodes_by_name[ name ];
}

/**
* retrieves a Node based on a given uid. It is fast because they are stored in an object
*
* @method getNodeByUId
* @param {String} uid uid of the node
* @return {Object} the node or null if it didnt find it
*/
SceneTree.prototype.getNodeByUId = function( uid )
{
	return this._nodes_by_uid[ uid ];
}

/**
* retrieves a Node by its index
*
* @method getNodeByIndex
* @param {Number} node index
* @return {Object} returns the node at the 'index' position in the nodes array
*/
SceneTree.prototype.getNodeByIndex = function(index)
{
	return this._nodes[ index ];
}

//for those who are more traditional
SceneTree.prototype.getElementById = SceneTree.prototype.getNode;

/**
* retrieves a node array filtered by the filter function
*
* @method filterNodes
* @param {function} filter a callback function that receives every node and must return true or false
* @return {Array} array containing the nodes that passes the filter
*/
SceneTree.prototype.filterNodes = function( filter )
{
	var r = [];
	for(var i = 0; i < this._nodes.length; ++i)
		if( filter(this._nodes[i]) )
			r.push(this._nodes[i]);
	return r;
}

/**
* searches the component with this uid, it iterates through all the nodes and components (slow)
*
* @method findComponentByUId
* @param {String} uid uid of the node
* @return {Object} component or null
*/
SceneTree.prototype.findComponentByUId = function(uid)
{
	for(var i = 0; i < this._nodes.length; ++i)
	{
		var compo = this._nodes[i].getComponentByUId( uid );
		if(compo)
			return compo;
	}
	return null;
}

/**
* searches the material with this uid, it iterates through all the nodes (slow)
*
* @method findMaterialByUId
* @param {String} uid uid of the material
* @return {Object} Material or null
*/
SceneTree.prototype.findMaterialByUId = function(uid)
{
	if(LS.RM.materials[uid])
		return LS.RM.materials[uid];

	for(var i = 0; i < this._nodes.length; ++i)
	{
		var material = this._nodes[i].getMaterial();
		if(material && material.uid == uid)
			return material;
	}

	return null;
}


/**
* Returns information of a node component property based on the locator of that property
* Locators are in the form of "{NODE_UID}/{COMPONENT_UID}/{property_name}"
*
* @method getPropertyInfo
* @param {String} locator locator of the property
* @return {Object} object with node, component, name, and value
*/
SceneTree.prototype.getPropertyInfo = function( property_uid )
{
	var path = property_uid.split("/");

	var start = path[0].substr(0,5);

	//for global materials
	if( start == "@MAT-")
	{
		var material = LS.RM.materials_by_uid[ path[0] ];
		if(!material)
			return null;
		return material.getPropertyInfoFromPath( path.slice(1) );
	}

	//for components
	if( start == "@COMP")
	{
		var comp = this.findComponentByUId( path[0] );
		if(!comp)
			return null;
		if(path.length == 1)
			return {
				node: comp.root,
				target: comp,
				name: comp ? LS.getObjectClassName( comp ) : "",
				type: "component",
				value: comp
			};
		return comp.getPropertyInfoFromPath( path.slice(1) );
	}

	//for regular locators
	var node = this.getNode( path[0] );
	if(!node)
		return null;

	return node.getPropertyInfoFromPath( path.slice(1) );
}

/**
* Returns information of a node component property based on the locator of that property
* Locators are in the form of "{NODE_UID}/{COMPONENT_UID}/{property_name}"
*
* @method getPropertyInfoFromPath
* @param {Array} path
* @return {Object} object with node, component, name, and value
*/
SceneTree.prototype.getPropertyInfoFromPath = function( path )
{
	if(path[0].substr(0,5) == "@MAT-")
	{
		var material = LS.RM.materials_by_uid[ path[0] ];
		if(!material)
			return null;
		return material.getPropertyInfoFromPath( path.slice(1) );
	}

	var node = this.getNode( path[0] );
	if(!node)
		return null;
	return node.getPropertyInfoFromPath( path.slice(1) );
}


/**
* Assigns a value to the property of a component in a node based on the locator of that property
* Locators are in the form of "{NODE_UID}/{COMPONENT_UID}/{property_name}"
*
* @method getPropertyValue
* @param {String} locator locator of the property
* @param {*} value the value to assign
* @param {SceneNode} root [Optional] if you want to limit the locator to search inside a node
* @return {Component} the target where the action was performed
*/
SceneTree.prototype.getPropertyValue = function( locator, root_node )
{
	var path = property_uid.split("/");

	if(path[0].substr(0,5) == "@MAT-")
	{
		var material = LS.RM.materials_by_uid[ path[0] ];
		if(!material)
			return null;
		return material.getPropertyValueFromPath( path.slice(1) );
	}

	var node = this.getNode( path[0] );
	if(!node)
		return null;
	return node.getPropertyValueFromPath( path.slice(1) );
}

SceneTree.prototype.getPropertyValueFromPath = function( path )
{
	if(path[0].substr(0,5) == "@MAT-")
	{
		var material = LS.RM.materials_by_uid[ path[0] ];
		if(!material)
			return null;
		return material.getPropertyValueFromPath( path.slice(1) );
	}
	var node = this.getNode( path[0] );
	if(!node)
		return null;
	return node.getPropertyValueFromPath( path.slice(1) );
}

/**
* Assigns a value to the property of a component in a node based on the locator of that property
* Locators are in the form of "{NODE_UID}/{COMPONENT_UID}/{property_name}"
*
* @method setPropertyValue
* @param {String} locator locator of the property
* @param {*} value the value to assign
* @param {SceneNode} root [Optional] if you want to limit the locator to search inside a node
* @return {Component} the target where the action was performed
*/
SceneTree.prototype.setPropertyValue = function( locator, value, root_node )
{
	var path = locator.split("/");
	this.setPropertyValueFromPath( path, value, root_node, 0 );
}

/**
* Assigns a value to the property of a component in a node based on the locator that property
* Locators are in the form of "{NODE_UID}/{COMPONENT_UID}/{property_name}"
*
* @method setPropertyValueFromPath
* @param {Array} path a property locator split by "/"
* @param {*} value the value to assign
* @param {SceneNode} root_node [optional] the root node where you want to search the locator (this is to limit the locator to a branch of the scene tree)
* @param {Number} offset [optional] used to avoir generating garbage, instead of slicing the array every time, we pass the array index
* @return {Component} the target where the action was performed
*/
SceneTree.prototype.setPropertyValueFromPath = function( path, value, root_node, offset )
{
	offset = offset || 0;
	if(path.length < (offset+1))
		return;

	if(path[offset].substr(0,5) == "@MAT-")
	{
		var material = LS.RM.materials_by_uid[ path[offset] ];
		if(!material)
			return null;
		return material.setPropertyValueFromPath( path, value, offset + 1 );
	}

	//get node
	var node = root_node ? root_node.findNode( path[offset] ) : this.getNode( path[offset] );
	if(!node)
		return null;

	return node.setPropertyValueFromPath( path, value, offset + 1 );
}


/**
* Returns the resources used by the scene
* includes the nodes, components, preloads and global_scripts
* doesn't include external_scripts
*
* @method getResources
* @param {Object} resources [optional] object with resources
* @param {Boolean} as_array [optional] returns data in array format instead of object format
* @param {Boolean} skip_in_pack [optional] skips resources that come from a pack
* @param {Boolean} skip_local [optional] skips resources whose name starts with ":" (considered local resources)
* @return {Object|Array} the resources in object format (or if as_array is true, then an array)
*/
SceneTree.prototype.getResources = function( resources, as_array, skip_in_pack, skip_local )
{
	resources = resources || {};

	//resources that must be preloaded (because they will be used in the future)
	if(this.preloaded_resources)
		for(var i in this.preloaded_resources)
			resources[ i ] = true;

	//global scripts
	for(var i = 0; i < this.global_scripts.length; ++i)
		if( this.global_scripts[i] )
			resources[ this.global_scripts[i] ] = true;

	//resources from nodes
	for(var i = 0; i < this._nodes.length; ++i)
		this._nodes[i].getResources( resources );

	//remove the resources that belong to packs or prefabs
	if(skip_in_pack)
		for(var i in resources)
		{
			var resource = LS.ResourcesManager.resources[i];
			if(!resource)
				continue;
			if(resource && (resource.from_prefab || resource.from_pack))
				delete resources[i];
		}

	//remove the resources that are local (generated by the system)
	if(skip_local)
		for(var i in resources)
		{
			if(i[0] == ":")
				delete resources[i];
		}

	//check if any resource requires another resource (a material that requires textures)
	for(var i in resources)
	{
		var resource = LS.ResourcesManager.resources[i];
		if(!resource)
			continue;
		if(resource.getResources)
			resource.getResources(resources);
	}

	//return as object
	if(!as_array)
		return resources;

	//return as array
	var r = [];
	for(var i in resources)
		r.push(i);
	return r;
}

/**
* Loads all the resources of all the nodes in this scene
* it sends a signal to every node to get all the resources info
* and load them in bulk using the ResourceManager
*
* @method loadResources
* @param {Function} on_complete called when the load of all the resources is complete
*/
SceneTree.prototype.loadResources = function( on_complete )
{
	var resources = this.getResources();

	//used for scenes with special repository folders
	var options = {};
	if( this.external_repository )
		options.external_repository = this.external_repository;

	//count resources
	var num_resources = 0;
	for(var i in resources)
		++num_resources;

	//load them
	if(num_resources == 0)
	{
		if(on_complete)
			on_complete();
		return;
	}

	LEvent.bind( LS.ResourcesManager, "end_loading_resources", on_loaded );
	LS.ResourcesManager.loadResources( resources );

	function on_loaded()
	{
		LEvent.unbind( LS.ResourcesManager, "end_loading_resources", on_loaded );
		if(on_complete)
			on_complete();
	}
}

/**
* Adds a resource that must be loaded when the scene is loaded
*
* @method addPreloadResource
* @param {String} fullpath the name of the resource
*/
SceneTree.prototype.addPreloadResource = function( fullpath )
{
	this.preloaded_resources[ fullpath ] = true;
}

/**
* Remove a resource from the list of resources to preload
*
* @method removePreloadResource
* @param {String} fullpath the name of the resource
*/
SceneTree.prototype.removePreloadResource = function( fullpath )
{
	delete this.preloaded_resources[ fullpath ];
}


/**
* start the scene (triggers an "start" event)
*
* @method start
* @param {Number} dt delta time
*/
SceneTree.prototype.start = function()
{
	if(this._state == LS.PLAYING)
		return;

	this._state = LS.PLAYING;
	this._start_time = getTime() * 0.001;
	/**
	 * Fired when the nodes need to be initialized
	 *
	 * @event init
	 * @param {LS.SceneTree} scene
	 */
	LEvent.trigger(this,"init",this);
	this.triggerInNodes("init");
	/**
	 * Fired when the scene is starting to play
	 *
	 * @event start
	 * @param {LS.SceneTree} scene
	 */
	LEvent.trigger(this,"start",this);
	this.triggerInNodes("start");
}

/**
* pauses the scene (triggers an "pause" event)
*
* @method pause
*/
SceneTree.prototype.pause = function()
{
	if( this._state != LS.PLAYING )
		return;

	this._state = LS.PAUSED;
	/**
	 * Fired when the scene pauses (mostly in the editor)
	 *
	 * @event pause
	 * @param {LS.SceneTree} scene
	 */
	LEvent.trigger(this,"pause",this);
	this.triggerInNodes("pause");
	this.purgeResidualEvents();
}

/**
* unpauses the scene (triggers an "unpause" event)
*
* @method unpause
*/
SceneTree.prototype.unpause = function()
{
	if(this._state != LS.PAUSED)
		return;

	this._state = LS.PLAYING;
	/**
	 * Fired when the scene unpauses (mostly in the editor)
	 *
	 * @event unpause
	 * @param {LS.SceneTree} scene
	 */
	LEvent.trigger(this,"unpause",this);
	this.triggerInNodes("unpause");
	this.purgeResidualEvents();
}


/**
* stop the scene (triggers an "finish" event)
*
* @method finish
* @param {Number} dt delta time
*/
SceneTree.prototype.finish = function()
{
	if(this._state == LS.STOPPED)
		return;

	this._state = LS.STOPPED;
	/**
	 * Fired when the scene stops playing
	 *
	 * @event finish
	 * @param {LS.SceneTree} scene
	 */
	LEvent.trigger(this,"finish",this);
	this.triggerInNodes("finish");
	this.purgeResidualEvents();
}


/**
* renders the scene using the assigned renderer
*
* @method render
*/
SceneTree.prototype.render = function(options)
{
	this._renderer.render(this, options);
}

/**
* This methods crawls the whole tree and collects all the useful info (cameras, lights, render instances, colliders, etc)
* Mostly rendering stuff but also some collision info.
* TO DO: refactor this so it doesnt redo the same task in every frame, only if changes are made
* @method collectData
*/
SceneTree.prototype.collectData = function()
{
	//var nodes = scene.nodes;
	var nodes = this.getNodes();

	var instances = this._instances;
	var lights = this._lights;
	var cameras = this._cameras;
	var colliders = this._colliders;

	//empty containers
	instances.length = 0;
	lights.length = 0;
	cameras.length = 0;
	colliders.length = 0;

	//TODO: move some of the node events to scene events

	//collect render instances, lights and cameras
	for(var i = 0, l = nodes.length; i < l; ++i)
	{
		var node = nodes[i];

		//skip stuff inside invisible nodes
		if(node.flags.visible == false) 
			continue;

		//compute global matrix: shouldnt it be already computed?
		if(node.transform)
			node.transform.updateGlobalMatrix();

		if(!node._instances)
			node._instances = [];
		else
			node._instances.length = 0;

		//get render instances: remember, triggers only support one parameter
		LEvent.trigger( node,"collectRenderInstances", node._instances );
		LEvent.trigger( node,"collectPhysicInstances", colliders );

		instances.push.apply(instances, node._instances); //push inside
	}

	//we also collect from the scene itself 
	LEvent.trigger( this, "collectRenderInstances", instances );
	LEvent.trigger( this, "collectPhysicInstances", colliders );
	LEvent.trigger( this, "collectLights", lights );
	LEvent.trigger( this, "collectCameras", cameras );

	//before processing (in case somebody wants to add some data to the containers)
	LEvent.trigger( this, "collectData" );

	//for each render instance collected
	for(var i = 0, l = instances.length; i < l; ++i)
	{
		var instance = instances[i];
		//compute the axis aligned bounding box
		if(instance.use_bounding) //no test if render_settings?
			instance.updateAABB();
	}

	//for each physics instance collected
	for(var i = 0, l = colliders.length; i < l; ++i)
	{
		var collider = colliders[i];
		collider.updateAABB();
	}

	//remember when was last time I collected to avoid repeating it
	this._last_collect_frame = this._frame;
}

//instead of recollect everything, we can reuse the info from previous frame, but objects need to be updated
//WIP: NOT USED YET
SceneTree.prototype.updateCollectedData = function()
{
	var nodes = this._nodes;
	var instances = this._instances;
	var lights = this._lights;
	var cameras = this._cameras;
	var colliders = this._colliders;

	//update matrices
	for(var i = 0, l = nodes.length; i < l; ++i)
		if(nodes[i].transform)
			nodes[i].transform.updateGlobalMatrix();
	
	//render instances: just update them
	for(var i = 0, l = instances.length; i < l; ++i)
	{
		var instance = instances[i];
		if(instance.flags & RI_IGNORE_AUTOUPDATE)
			instance.update();
		//compute the axis aligned bounding box
		if(!(instance.flags & RI_IGNORE_FRUSTUM))
			instance.updateAABB();
	}

	//before processing (in case somebody wants to add some data to the containers)
	LEvent.trigger( this, "updateCollectData" );

	//lights
	for(var i = 0, l = lights.length; i < l; ++i)
	{
	}

	//cameras
	for(var i = 0, l = cameras.length; i < l; ++i)
	{
	}

	//colliders
	for(var i = 0, l = colliders.length; i < l; ++i)
	{
		var collider = colliders[i];
		collider.updateAABB();
	}

}

SceneTree.prototype.update = function(dt)
{
	/**
	 * Fired before doing an update
	 *
	 * @event beforeUpdate
	 * @param {LS.SceneTree} scene
	 */
	LEvent.trigger(this,"beforeUpdate", this);

	this._global_time = getTime() * 0.001;
	//this._time = this._global_time - this._start_time;
	this._time += dt;
	this._last_dt = dt;

	/**
	 * Fired while updating
	 *
	 * @event update
	 * @param {number} dt
	 */
	LEvent.trigger(this,"update", dt);
	//this.triggerInNodes("update",dt, true); //REMOVED

	/**
	 * Fired after updating the scene
	 *
	 * @event afterUpdate
	 */
	LEvent.trigger(this,"afterUpdate", this);
}

/**
* triggers an event to all nodes in the scene
* this is slow if the scene has too many nodes, thats why we use bindings
*
* @method triggerInNodes
* @param {String} event_type event type name
* @param {Object} data data to send associated to the event
*/

SceneTree.prototype.triggerInNodes = function(event_type, data)
{
	LEvent.triggerArray( this._nodes, event_type, data);
}

/**
* generate a unique node name given a prefix
*
* @method generateUniqueNodeName
* @param {String} prefix the prefix, if not given then "node" is used
* @return {String} a node name that it is not in the scene
*/
SceneTree.prototype.generateUniqueNodeName = function(prefix)
{
	prefix = prefix || "node";
	var i = 1;

	var pos = prefix.lastIndexOf("_");
	if(pos)
	{
		var n = prefix.substr(pos+1);
		if( parseInt(n) )
		{
			i = parseInt(n);
			prefix = prefix.substr(0,pos);
		}
	}

	var node_name = prefix + "_" + i;
	while( this.getNode(node_name) != null )
		node_name = prefix + "_" + (i++);
	return node_name;
}

/**
* Marks that this scene must be rendered again
*
* @method requestFrame
*/
SceneTree.prototype.requestFrame = function()
{
	this._must_redraw = true;
	LEvent.trigger( this, "requestFrame" );
}

SceneTree.prototype.refresh = SceneTree.prototype.requestFrame; //DEPRECATED

/**
* returns current scene time (remember that scene time remains freezed if the scene is not playing)
*
* @method getTime
* @return {Number} scene time in seconds
*/
SceneTree.prototype.getTime = function()
{
	return this._time;
}

//This is ugly but sometimes if scripts fail there is a change the could get hooked to the scene forever
//so this way we remove any event that belongs to a component thats doesnt belong to this scene tree
SceneTree.prototype.purgeResidualEvents = function()
{
	if(!this.__events)
		return;

	//crawl all 
	for(var i in this.__events)
	{
		var event = this.__events[i];
		if(!event)
			continue;
		var to_keep = [];
		for(var j = 0; j < event.length; ++j)
		{
			var inst = event[j][1];
			if(inst && LS.isClassComponent( inst.constructor ) )
			{
				//no attached node or node not attached to any scene
				if(!inst._root || inst._root.scene !== this )
				{
					console.warn("Event attached to the Scene belongs to a removed node, purged. Event:",i,"Class:", LS.getObjectClassName( inst ) );
					continue; //skip keeping it, so it will no longer exist
				}
			}
			to_keep.push(event[j]);
		}
		this.__events[i] = to_keep;
	}
}

/**
* returns an array with the name of all the layers given a layers mask
*
* @method getLayerNames
* @param {Number} layers a number with the enabled layers in bit mask format, if ommited all layers are returned
* @return {Array} array of strings with the layer names
*/
SceneTree.prototype.getLayerNames = function(layers)
{
	var r = [];

	for(var i = 0; i < 32; ++i)
	{
		if( layers === undefined || layers & (1<<i) )
			r.push( this.layer_names[i] || ("layer"+i) );
	}
	return r;
}

/**
* returns an array with all the components in the scene and scenenodes that matches this class
*
* @method findNodeComponents
* @param {String||Component} type the type of the components to search (could be a string with the name or the class itself)
* @return {Array} array with the components found
*/
SceneTree.prototype.findNodeComponents = function( type )
{
	if(!type)
		return;

	var find_component = null;
	if(type.constructor === String)
		find_component = LS.Components[ type ];
	else
		find_component = type;
	if(!find_component)
		return;

	var result = [];
	var nodes = this._nodes;
	for(var i = 0; i < nodes.length; ++i)
	{
		var node = nodes[i];
		var components = node._components;
		for(var j = 0; j < components.length; ++j)
			if( components[j].constructor === find_component )
				result.push( components[j] );
	}
	return result;
}

/**
* Allows to instantiate a prefab from the fullpath of the resource
*
* @method instantiate
* @param {String} prefab_url the filename to the resource containing the prefab
* @param {vec3} position where to instantiate
* @param {quat} rotation the orientation
* @param {SceneNode} parent [optional] if no parent then scene.root will be used
* @return {SceneNode} the resulting prefab node
*/
SceneTree.prototype.instantiate = function( prefab_url, position, rotation, parent )
{
	if(!prefab_url || prefab_url.constructor !== String)
		throw("prefab must be the url to the prefab");

	var node = new LS.SceneNode();
	if(position && position.length === 3)
		node.transform.position = position;
	if(rotation && rotation.length === 4)
		node.transform.rotation = rotation;

	parent = parent || this.root;
	parent.addChild( node );

	node.prefab = prefab_url;

	return node;
}

/**
* returns a pack containing all the scene and resources, used to save a scene to harddrive
*
* @method toPack
* @param {String} fullpath a given fullpath name, it will be assigned to the scene with the appropiate extension
* @param {Array} resources [optional] array with all the resources to add, if no array is given it will get the active resources in this scene
* @return {LS.Pack} the pack
*/
SceneTree.prototype.toPack = function( fullpath, resources )
{
	fullpath = fullpath || "unnamed_scene";

	//change name to valid name
	var basename = LS.RM.removeExtension( fullpath, true );
	var final_fullpath = basename + ".SCENE.wbin";

	//extract json info
	var scene_json = JSON.stringify( this.serialize() );

	//get all resources
	if(!resources)
		resources = this.getResources( null, true, true, true );

	//create pack
	var pack = LS.Pack.createPack( LS.RM.getFilename( final_fullpath ), resources, { "scene.json": scene_json } );
	pack.fullpath = final_fullpath;
	pack.category = "SceneTree";

	return pack;
}

//WIP: this is in case we have static nodes in the scene
SceneTree.prototype.updateStaticObjects = function()
{
	var old = LS.allow_static;
	LS.allow_static = false;
	this.collectData();
	LS.allow_static = old;
}

//tells to all the components, nodes, materials, etc, that one resource has changed its name so they can update it inside
SceneTree.prototype.sendResourceRenamedEvent = function( old_name, new_name, resource )
{
	//scene globals that use resources
	for(var i = 0; i < this.external_scripts.length; i++)
	{
		if(this.external_scripts[i] == old_name)
			this.external_scripts[i] = new_name;
	}

	for(var i = 0; i < this.global_scripts.length; i++)
	{
		if(this.global_scripts[i] == old_name)
			this.global_scripts[i] = new_name;
	}

	for(var i in this.preloaded_resources)
	{
		if(i == old_name)
		{
			delete this.preloaded_resources[old_name];
			this.preloaded_resources[ new_name ] = true;
		}
	}

	//to nodes
	var nodes = this._nodes.concat();

	//for every node
	for(var i = 0; i < nodes.length; i++)
	{
		//nodes
		var node = nodes[i];

		//prefabs
		if( node.prefab && node.prefab === old_name )
			node.prefab = new_name; //does this launch a reload prefab? dont know

		//components
		for(var j = 0; j < node._components.length; j++)
		{
			var component = node._components[j];
			if(component.onResourceRenamed)
				component.onResourceRenamed( old_name, new_name, resource )
		}

		//materials
		if( node.material )
		{
			if( node.material == old_name )
				node.material = new_name;
			else
			{
				var material = node.getMaterial();
				if( material && material.onResourceRenamed )
				{
					var modified = material.onResourceRenamed( old_name, new_name, resource );
					if(modified) //we need this to remove material._original_data or anything that could interfiere
						LS.RM.resourceModified( material );
				}
				else
					console.warn("sendResourceRenamedEvent: Material not found or it didnt have a onResourceRenamed");
			}
		}
	}
}


/**
* Creates and returns an scene animation track
*
* @method createAnimation
* @return {LS.Animation} the animation track
*/
SceneTree.prototype.createAnimation = function()
{
	if(this.animation)
		return this.animation;
	this.animation = new LS.Animation();
	this.animation.name = LS.Animation.DEFAULT_SCENE_NAME;
	this.animation.createTake( "default", LS.Animation.DEFAULT_DURATION );
	return this.animation;
}

LS.SceneTree = SceneTree;
LS.Classes.SceneTree = SceneTree;

