//****************************************************************************

/**
* The SceneNode class represents and object in the scene
* Is the base class for all objects in the scene as meshes, lights, cameras, and so
*
* @class SceneNode
* @param {String} name the name for this node (otherwise a random one is computed)
* @constructor
*/

function SceneNode( name )
{
	if(name && name.constructor !== String)
	{
		name = null;
		console.warn("SceneNode constructor first parameter must be a String with the name");
	}

	//Generic identifying info
	this._name = name || ("node_" + (Math.random() * 10000).toFixed(0)); //generate random number
	this._uid = LS.generateUId("NODE-");
	this._classList = {}; //to store classes
	this.layers = 3|0; //32 bits for layers (force to int)
	this.node_type = null; //used to store a string defining the node info

	//more generic info
	this._prefab = null;
	this._material = null;

	//from Componentcontainer
	this._components = []; //used for logic actions
	this._missing_components = null; //used to store state of component that couldnt be created

	//from CompositePattern
	this._parentNode = null;
	this._children = null;
	this._in_tree = null;

	//flags
	this.flags = {
		visible: true,
		is_static: false,
		selectable: true
	};

	this.init(false,true);

	/** Fired here (from Transform) when the node transform changes
	 * @event transformChanged
	 */
}

SceneNode.prototype.init = function( keep_components, keep_info )
{
	if(!keep_info)
	{
		this.layers = 3|0; //32 bits for layers (force to int)
		this._name = name || ("node_" + (Math.random() * 10000).toFixed(0)); //generate random number
		this._uid = LS.generateUId("NODE-");
		this._classList = {};

		//material
		this._material = null;
		this.extra = {}; //for extra info
		this.node_type = null;

		//flags
		this.flags = {
			visible: true,
			is_static: false,
			selectable: true
		};
	}

	//Basic components
	if(!keep_components)
	{
		if( this._components && this._components.length )
			console.warn("SceneNode.init() should not be called if it contains components, call clear instead");
		this._components = []; //used for logic actions
		this._missing_components = null;
		this.addComponent( new LS.Transform() );
	}
}

//get methods from other classes
LS.extendClass( SceneNode, ComponentContainer ); //container methods
LS.extendClass( SceneNode, CompositePattern ); //container methods

/**
* changes the node name
* @method setName
* @param {String} new_name the new name
* @return {Object} returns true if the name changed
*/

Object.defineProperty( SceneNode.prototype, 'name', {
	set: function(name)
	{
		this.setName( name );
	},
	get: function(){
		return this._name;
	},
	enumerable: true
});

Object.defineProperty( SceneNode.prototype, 'fullname', {
	set: function(name)
	{
		throw("You cannot set fullname, it depends on the parent nodes");
	},
	get: function(){
		return this.getPathName();
	},
	enumerable: false
});

//Changing the UID  has lots of effects (because nodes are indexed by UID in the scene)
//If you want to catch the event of the uid_change, remember, the previous uid is stored in LS.SceneNode._last_uid_changed (it is not passed in the event)
Object.defineProperty( SceneNode.prototype, 'uid', {
	set: function(uid)
	{
		if(!uid)
			return;

		//valid uid?
		if(uid[0] != LS._uid_prefix)
		{
			console.warn("Invalid UID, renaming it to: " + uid );
			uid = LS._uid_prefix + uid;
		}

		//no changes?
		if(uid == this._uid)
			return;

		SceneNode._last_uid_changed = this._uid; //hack, in case we want the previous uid of a node 

		//update scene tree indexing
		if( this._in_tree && this._in_tree._nodes_by_uid[ this.uid ] )
			delete this._in_tree._nodes_by_uid[ this.uid ];
		this._uid = uid;
		if( this._in_tree )
			this._in_tree._nodes_by_uid[ this.uid ] = this;
		//events
		LEvent.trigger( this, "uid_changed", uid );
		if(this._in_tree)
			LEvent.trigger( this._in_tree, "node_uid_changed", this );
	},
	get: function(){
		return this._uid;
	},
	enumerable: true
});


Object.defineProperty( SceneNode.prototype, 'visible', {
	set: function(v)
	{
		this.flags.visible = v;
	},
	get: function(){
		return this.flags.visible;
	},
	enumerable: true
});

Object.defineProperty( SceneNode.prototype, 'is_static', {
	set: function(v)
	{
		this.flags.is_static = v;
	},
	get: function(){
		return this.flags.is_static;
	},
	enumerable: true
});

Object.defineProperty( SceneNode.prototype, 'material', {
	set: function(v)
	{
		if( this._material == v )
			return;

		this._material = v;
		if(v)
		{
			if(v.constructor === String)
				return;
			if(v._root && v._root != this) //has root and its not me
				console.warn( "Cannot assign a material of one SceneNode to another, you must clone it or register it" )
			else
				v._root = this; //link
		}
		LEvent.trigger( this, "materialChanged" );
	},
	get: function(){
		return this._material;
	},
	enumerable: true
});

Object.defineProperty( SceneNode.prototype, 'prefab', {
	set: function(name)
	{
		this._prefab = name;
		if(!this._prefab)
			return;
		var prefab = LS.RM.getResource(name);
		var that = this;
		if(prefab)
			this.reloadFromPrefab();
		else 
			LS.ResourcesManager.load( name, function(){
				that.reloadFromPrefab();
			});
	},
	get: function(){
		return this._prefab;
	},
	enumerable: true
});

SceneNode.prototype.clear = function()
{
	this.removeAllComponents();
	this.removeAllChildren();
	this.init();
}

SceneNode.prototype.setName = function(new_name)
{
	if(this._name == new_name) 
		return true; //no changes

	//check that the name is valid (doesnt have invalid characters)
	if(!LS.validateName(new_name))
		return false;

	var scene = this._in_tree;
	if(!scene)
	{
		this._name = new_name;
		return true;
	}

	//remove old link
	if( this._name )
		delete scene._nodes_by_name[ this._name ];

	//assign name
	this._name = new_name;

	//we already have another node with this name
	if( new_name && !scene._nodes_by_name[ new_name ] )
		scene._nodes_by_name[ this._name ] = this;

	/**
	 * Node changed name
	 *
	 * @event name_changed
	 * @param {String} new_name
	 */
	LEvent.trigger( this, "name_changed", new_name );
	if(scene)
		LEvent.trigger( scene, "node_name_changed", this );
	return true;
}

Object.defineProperty( SceneNode.prototype, 'classList', {
	get: function() { return this._classList },
	set: function(v) {},
	enumerable: false
});

/**
* @property className {String}
*/
Object.defineProperty( SceneNode.prototype, 'className', {
	get: function() {
			var keys = null;
			if(Object.keys)
				keys = Object.keys(this._classList); 
			else
			{
				keys = [];
				for(var k in this._classList)
					keys.push(k);
			}
			return keys.join(" ");
		},
	set: function(v) { 
		this._classList = {};
		if(!v)
			return;
		var t = v.split(" ");
		for(var i in t)
			this._classList[ t[i] ] = true;
	},
	enumerable: true
});

/**
* Destroys this node
* @method destroy
* @param {number} time [optional] time in seconds to wait till destroying the node
**/
SceneNode.prototype.destroy = function( time )
{
	if(time && time.constructor === Number && time > 0)
	{
		setTimeout( this.destroy.bind(this,0), time * 0.001 );
		return;
	}

	LEvent.trigger( this, "destroy" );
	this.removeAllComponents();
	if(this.children)
		while(this.children.length)
			this.children[0].destroy();
	if(this._parentNode)
		this._parentNode.removeChild( this );
}

/**
* Returns the locator string of this node
* @method getLocator
* @param {string} property_name [optional] you can pass the name of a property in this node to get the locator of that one
* @return {String} the locator string of this node
**/
SceneNode.prototype.getLocator = function( property_name )
{
	if(!property_name)
		return this.uid;
	return this.uid + "/" + property_name;
}

/**
* Returns and object with info about a property given a locator
* @method getPropertyInfo
* @param {string} locator
* @return {Object} object with { node, target, name, value and type }
**/
SceneNode.prototype.getPropertyInfo = function( locator )
{
	var path = locator.split("/");
	return this.getPropertyInfoFromPath(path);
}

/**
* Returns and object with info about a property given a locator in path format
* @method getPropertyInfoFromPath
* @param {Array} path a locator in path format (split by /)
* @return {Object} object with { node, target, name, value and type }
**/
SceneNode.prototype.getPropertyInfoFromPath = function( path )
{
	var target = this;
	var varname = path[0];

	if(path.length == 0)
	{
		return {
			node: this,
			target: null,
			name: "",
			value: this,
			type: "node" //node because thats the global type for nodes
		};
	}
    else if(path.length == 1) //compo or //var
	{
		if(path[0][0] == "@")
		{
			target = this.getComponentByUId( path[0] );
			return {
				node: this,
				target: target,
				name: target ? LS.getObjectClassName( target ) : "",
				type: "component",
				value: target
			};
		}
		else if (path[0] == "material")
		{
			target = this.getMaterial();
			return {
				node: this,
				target: target,
				name: target ? LS.getObjectClassName( target ) : "",
				type: "material",
				value: target
			};
		}

		var target = this.getComponent( path[0] );
		if(target)
		{
			return {
				node: this,
				target: target,
				name: target ? LS.getObjectClassName( target ) : "",
				type: "component",
				value: target
			};
		}

		//special cases for a node
		switch(path[0])
		{
			case "matrix":
			case "x":
			case "y": 
			case "z": 
			case "position":
			case "rotX":
			case "rotY":
			case "rotZ":
				target = this.transform;
				varname = path[0];
				break;
			default: 
				target = this;
				varname = path[0];
			break;
		}
	}
    else if(path.length > 1) //compo/var
	{
		if(path[0][0] == "@")
		{
			varname = path[1];
			target = this.getComponentByUId( path[0] );
		}
		else if (path[0] == "material")
		{
			target = this.getMaterial();
			varname = path[1];
		}
		else if (path[0] == "flags")
		{
			target = this.flags;
			varname = path[1];
		}
		else
		{
			target = this.getComponent( path[0] );
			varname = path[1];
		}

		if(!target)
			return null;
	}
	else //¿?
	{
	}

	if(!target) //unknown target
		return null;

	//this was moved to Component.prototype.getPropertyInfoFromPath  (if any errors check cases)
	if( target != this && target.getPropertyInfoFromPath ) //avoid weird recursion
		return target.getPropertyInfoFromPath( path.slice(1) );

	return null;
}

/**
* Returns the value of a property given a locator in string format
* @method getPropertyValue
* @param {String} locaator
* @return {*} the value of that property
**/
SceneNode.prototype.getPropertyValue = function( locator )
{
	var path = locator.split("/");
	return this.getPropertyValueFromPath(path);
}

/**
* Returns the value of a property given a locator in path format
* @method getPropertyValueFromPath
* @param {Array} locator in path format (array)
* @return {*} the value of that property
**/
SceneNode.prototype.getPropertyValueFromPath = function( path )
{
	var target = this;
	var varname = path[0];

	if(path.length == 0)
		return null
    else if(path.length == 1) //compo or //var
	{
		if(path[0][0] == "@")
			return this.getComponentByUId( path[0] );
		else if (path[0] == "material")
			return this.getMaterial();
		var target = this.getComponent( path[0] );
		if(target)
			return target;

		switch(path[0])
		{
			case "matrix":
			case "x":
			case "y": 
			case "z": 
			case "position":
			case "rotX":
			case "rotY":
			case "rotZ":
				target = this.transform;
				varname = path[0];
				break;
			default: 
				target = this;
				varname = path[0];
			break;
		}
	}
    else if(path.length > 1) //compo/var
	{
		if(path[0][0] == "@")
		{
			varname = path[1];
			target = this.getComponentByUId( path[0] );
		}
		else if (path[0] == "material")
		{
			target = this.getMaterial();
			varname = path[1];
		}
		else if (path[0] == "flags")
		{
			target = this.flags;
			varname = path[1];
		}
		else
		{
			target = this.getComponent( path[0] );
			varname = path[1];
		}

		if(!target)
			return null;
	}
	else //¿?
	{
	}

	var v = undefined;

	if( target.getPropertyValueFromPath && target != this )
	{
		var r = target.getPropertyValueFromPath( path.slice(1) );
		if(r)
			return r;
	}

	//to know the value of a property of the given target
	if( target.getPropertyValue )
		v = target.getPropertyValue( varname );

	//special case when the component doesnt specify any locator info but the property referenced does
	//used in TextureFX
	if (v === undefined && path.length > 2 && target[ varname ] && target[ varname ].getPropertyValueFromPath )
	{
		var r = target[ varname ].getPropertyValueFromPath( path.slice(2) );
		if(r)
		{
			r.node = this;
			return r;
		}
	}

	if(v === undefined && target[ varname ] === undefined )
		return null;
	return v !== undefined ? v : target[ varname ];
}

/**
* assigns a value to a property given the locator for that property
* @method setPropertyValue
* @param {String} locator
* @param {*} value
**/
SceneNode.prototype.setPropertyValue = function( locator, value )
{
	var path = locator.split("/");
	return this.setPropertyValueFromPath(path, value, 0);
}

/**
* given a locator in path mode (array) and a value, it searches for the corresponding value and applies it
* @method setPropertyValueFromPath
* @param {Array} path
* @param {*} value
* @param {Number} [optional] offset used to skip the firsst positions in the array
**/
SceneNode.prototype.setPropertyValueFromPath = function( path, value, offset )
{
	offset = offset || 0;

	var target = null;
	var varname = path[offset];

	if(path.length > (offset+1))
	{
		if(path[offset][0] == "@")
		{
			varname = path[offset+1];
			target = this.getComponentByUId( path[offset] );
		}
		else if( path[offset] == "material" )
		{
			target = this.getMaterial();
			varname = path[offset+1];
		}
		else if( path[offset] == "flags" )
		{
			target = this.flags;
			varname = path[offset+1];
		}
		else 
		{
			target = this.getComponent( path[offset] );
			varname = path[offset+1];
		}

		if(!target)
			return null;
	}
	else { //special cases 
		switch ( path[offset] )
		{
			case "matrix": target = this.transform; break;
			case "position":
			case "rotation":
			case "x":
			case "y":
			case "z":
			case "xrotation": 
			case "yrotation": 
			case "zrotation": 
				target = this.transform; 
				varname = path[offset];
				break;
			case "translate.X": target = this.transform; varname = "x"; break;
			case "translate.Y": target = this.transform; varname = "y"; break;
			case "translate.Z": target = this.transform; varname = "z"; break;
			case "rotateX.ANGLE": target = this.transform; varname = "pitch"; break;
			case "rotateY.ANGLE": target = this.transform; varname = "yaw"; break;
			case "rotateZ.ANGLE": target = this.transform; varname = "roll"; break;
			default: target = this; //null
		}
	}

	if(!target)
		return null;

	if(target.setPropertyValueFromPath && target != this)
		if( target.setPropertyValueFromPath( path, value, offset+1 ) === true )
			return target;
	
	if(target.setPropertyValue  && target != this)
		if( target.setPropertyValue( varname, value ) === true )
			return target;

	if( target[ varname ] === undefined )
		return;

	//special case when the component doesnt specify any locator info but the property referenced does
	//used in TextureFX
	if ( path.length > 2 && target[ varname ] && target[ varname ].setPropertyValueFromPath )
		return target[ varname ].setPropertyValueFromPath( path, value, offset+2 );

	//disabled because if the vars has a setter it wont be called using the array.set
	//if( target[ varname ] !== null && target[ varname ].set )
	//	target[ varname ].set( value );
	//else
		target[ varname ] = value;

	return target;
}

/**
* Returns all the resources used by this node and its components (you can include the resources from the children too)
* @method getResources
* @param {Object} res object where to store the resources used (in "res_name":LS.TYPE format)
* @param {Boolean} include_children if you want to add also the resources used by the children nodes
* @return {Object} the same object passed is returned 
**/
SceneNode.prototype.getResources = function( res, include_children )
{
	//resources in components
	for(var i in this._components)
		if( this._components[i].getResources )
			this._components[i].getResources( res );

	//res in material
	if(this.material)
	{
		if( this.material.constructor === String )
		{
			if(this.material[0] != ":") //not a local material, then its a reference
			{
				res[this.material] = LS.Material;
			}
		}

		var mat = this.getMaterial();
		if(mat)
			mat.getResources( res );
	}

	//prefab
	if(this.prefab)
		res[ this.prefab ] = LS.Prefab;

	//propagate
	if(include_children)
		for(var i in this._children)
			this._children[i].getResources(res, true);

	return res;
}

SceneNode.prototype.getTransform = function() {
	return this.transform;
}

//Helpers

SceneNode.prototype.getMesh = function( use_lod_mesh ) {
	var mesh = this.mesh;
	var mesh_renderer = this.getComponent( LS.Components.MeshRenderer );
	if(!mesh && mesh_renderer)
	{
		if(use_lod_mesh)
			mesh = mesh_renderer.lod_mesh;
		if(!mesh)
			mesh = mesh_renderer.mesh;
	}
	if(!mesh)
		return null;
	if(mesh.constructor === String)
		return LS.ResourcesManager.meshes[mesh];
	return mesh;
}

//Light component
SceneNode.prototype.getLight = function() {
	return this.light;
}

//Camera component
SceneNode.prototype.getCamera = function() {
	return this.camera;
}

/**
* Simple way to assign a mesh to a node, it created a MeshRenderer component or reuses and existing one and assigns the mesh
* @method setMesh
* @param {string} mesh_name the name of the mesh (path to the file)
* @param {Number} submesh_id if you want to assign a submesh
**/
SceneNode.prototype.setMesh = function(mesh_name, submesh_id)
{
	var component = this.getComponent( LS.Components.MeshRenderer );
	if(component)
		component.configure({ mesh: mesh_name, submesh_id: submesh_id });
	else
		this.addComponent( new LS.MeshRenderer({ mesh: mesh_name, submesh_id: submesh_id }) );
}

SceneNode.prototype.loadAndSetMesh = function(mesh_filename, options)
{
	options = options || {};

	if( LS.ResourcesManager.meshes[mesh_filename] || !mesh_filename )
	{
		this.setMesh( mesh_filename );
		if(options.on_complete) options.on_complete( LS.ResourcesManager.meshes[mesh_filename] ,this);
		return;
	}

	var that = this;
	var loaded = LS.ResourcesManager.load(mesh_filename, options, function(mesh){
		that.setMesh(mesh.filename);
		that.loading -= 1;
		if(that.loading == 0)
		{
			LEvent.trigger(that,"resource_loaded",that);
			delete that.loading;
		}
		if(options.on_complete)
			options.on_complete(mesh,that);
	});

	if(!loaded)
	{
		if(!this.loading)
		{
			this.loading = 1;

			LEvent.trigger(this,"resource_loading");
		}
		else
			this.loading += 1;
	}
}

SceneNode.prototype.getMaterial = function()
{
	if (!this.material)
		return null;
	if(this.material.constructor === String)
	{
		if( !this._in_tree )
			return null;
		if( this.material[0] == "@" )//uid
			return LS.ResourcesManager.materials_by_uid[ this.material ];
		return LS.ResourcesManager.materials[ this.material ];
	}
	return this.material;
}

/**
* Apply prefab info (skipping the root components) to node, so all children will be removed and components lost and overwritten
* It is called from prefab.applyToNodes when a prefab is loaded in memory
* @method reloadFromPrefab
**/
SceneNode.prototype.reloadFromPrefab = function()
{
	if(!this.prefab)
		return;

	var prefab = LS.ResourcesManager.resources[ this.prefab ];
	if(!prefab)
		return;

	if( prefab.constructor !== LS.Prefab )
		throw("prefab must be a LS.Prefab class");

	//apply info
	this.removeAllChildren();
	this.init( true, true ); //keep components, keep_info
	var prefab_data = prefab.prefab_data;
	
	//remove all but children info (prefabs overwrite only children info)
	prefab_data = { children: prefab.prefab_data.children };

	//uid data is already removed from the prefab
	this.configure( prefab_data );

	//load secondary resources 
	var resources = this.getResources( {}, true );
	LS.ResourcesManager.loadResources( resources );

	LEvent.trigger( this, "prefabReady", prefab );
}


/**
* Assigns this node to one layer
* @method setLayer
* @param {number|String} the index of the layer or the name (according to scene.layer_names)
* @param {boolean} value 
*/
SceneNode.prototype.setLayer = function( num_or_name, value )
{
	if( num_or_name == null )
		throw("setLayer expects layer");

	var num;

	if(num_or_name.constructor === String)
	{
		var scene = this.scene || LS.GlobalScene;
		var layer_num = scene.layer_names.indexOf( num_or_name );
		if(layer_num == -1)
		{
			console.error("Layer with name:",num_or_name,"not found in scene");
			return;
		}
		num = layer_num;
	}
	else
		num = num_or_name;

	var f = 1<<num;
	this.layers = (this.layers & (~f));
	if(value)
		this.layers |= f;
}

/**
* checks if this node is in the given layer
* @method isInLayer
* @param {number|String} index of layer or name according to scene.layer_names
* @return {boolean} true if belongs to this layer
*/
SceneNode.prototype.isInLayer = function( num_or_name )
{
	if( num_or_name == null )
		throw("setLayer expects layer");

	var num;

	if(num_or_name.constructor === String)
	{
		var scene = this.scene || LS.GlobalScene;
		var layer_num = scene.layer_names.indexOf( num_or_name );
		if(layer_num == -1)
		{
			console.error("Layer with name:",num_or_name,"not found in scene");
			return;
		}
		num = layer_num;
	}
	else
		num = num_or_name;

	return (this.layers & (1<<num)) !== 0;
}

SceneNode.prototype.getLayers = function()
{
	var r = [];
	if(!this.scene)
		return r;

	for(var i = 0; i < 32; ++i)
	{
		if( this.layers & (1<<i) )
			r.push( this.scene.layer_names[i] || ("layer"+i) );
	}
	return r;
}

/**
* Returns the root node of the prefab incase it is inside a prefab, otherwise null
* @method insidePrefab
* @return {Object} returns the node where the prefab starts
*/
SceneNode.prototype.insidePrefab = function()
{
	var aux = this;
	while( aux )
	{
		if(aux.prefab)
			return aux;
		aux = aux._parentNode;
	}
	return null;
}

/**
* remember clones this node and returns the new copy (you need to add it to the scene to see it)
* @method clone
* @return {Object} returns a cloned version of this node
*/
SceneNode.prototype.clone = function()
{
	var scene = this._in_tree;

	var new_name = scene ? scene.generateUniqueNodeName( this._name ) : this._name ;
	var newnode = new LS.SceneNode( new_name );
	var info = this.serialize();

	//remove all uids from nodes and components
	LS.clearUIds( info );

	info.uid = LS.generateUId("NODE-");
	newnode.configure( info );

	return newnode;
}

/**
* Configure this node from an object containing the info
* @method configure
* @param {Object} info the object with all the info (comes from the serialize method)
*/
SceneNode.prototype.configure = function(info)
{
	//identifiers parsing
	if (info.name)
		this.setName(info.name);
	else if (info.id)
		this.setName(info.id);
	if(info.layers !== undefined)
		this.layers = info.layers;

	if (info.uid)
		this.uid = info.uid;

	if (info.className && info.className.constructor == String)	
		this.className = info.className;

	if(info.node_type)
	{
		this.node_type = info.node_type;
		if(info.node_type == "JOINT")
			this._is_bone = true;
	}

	//some helpers (mostly for when loading from js object that come from importers or code)
	if(info.camera)
		this.addComponent( new LS.Camera( info.camera ) );

	if(info.light)
		this.addComponent( new LS.Light( info.light ) );

	//in case more than one mesh in on e node
	if(info.meshes)
	{
		for(var i = 0; i < info.meshes.length; ++i)
			this.addMeshComponents( info.meshes[i], info );
	}
	else if(info.mesh)
		this.addMeshComponents( info.mesh, info );

	//transform in matrix format could come from importers so we leave it
	if((info.position || info.model || info.transform) && !this.transform)
		this.addComponent( new LS.Transform() );
	if(info.position) 
		this.transform.position = info.position;
	if(info.model) 
		this.transform.fromMatrix( info.model ); 
	if(info.transform) 
		this.transform.configure( info.transform ); 

	//first the no components
	if(info.material)
	{
		var mat_classname = info.material.material_class;
		if(!mat_classname) 
			mat_classname = "StandardMaterial";
		var constructor = LS.MaterialClasses[mat_classname];
		if(constructor)
			this.material = typeof(info.material) == "string" ? info.material : new constructor( info.material );
		else
			console.warn("Material not found: " + mat_classname );
	}

	if(info.flags) //merge
		for(var i in info.flags)
			this.flags[i] = info.flags[i];
	
	//add animation tracks player
	if(info.animations)
	{
		this.animations = info.animations;
		this.addComponent( new LS.Components.PlayAnimation({animation:this.animations}) );
	}

	//extra user info
	if(info.extra)
		this.extra = info.extra;

	if(info.editor)
		this._editor = info.editor;


	if(info.comments)
		this.comments = info.comments;

	//restore components
	if(info.components)
		this.configureComponents( info );

	if(info.prefab && !this._is_root)  //is_root because in some weird situations the prefab was set to the root node
		this.prefab = info.prefab; //assign and calls this.reloadFromPrefab();
	else //configure children if it is not a prefab
		this.configureChildren(info);

	LEvent.trigger(this,"configure",info);
}

//adds components according to a mesh
SceneNode.prototype.addMeshComponents = function( mesh_id, extra_info )
{
	extra_info = extra_info || {};

	if(!mesh_id)
		return;

	if( mesh_id.constructor !== String )
	{
		extra_info = mesh_id;
		mesh_id = extra_info.mesh;
		if(!mesh_id)
		{
			console.warn("Mesh info without mesh id");
			return null;
		}
	}

	var mesh = LS.ResourcesManager.meshes[ mesh_id ];

	if(!mesh)
	{
		console.warn( "SceneNode mesh not found: " + mesh_id );
		return;
	}

	var mesh_render_config = { mesh: mesh_id };

	if(extra_info.submesh_id !== undefined)
		mesh_render_config.submesh_id = extra_info.submesh_id;
	if(extra_info.morph_targets !== undefined)
		mesh_render_config.morph_targets = extra_info.morph_targets;
	if(extra_info.material !== undefined)
		mesh_render_config.material = extra_info.material;

	var compo = new LS.Components.MeshRenderer( mesh_render_config );

	//parsed meshes have info about primitive
	if( mesh.primitive === "line_strip" )
	{
		compo.primitive = 3;
		delete mesh.primitive;
	}

	//add MeshRenderer
	this.addComponent( compo );

	//skinning
	if(mesh && mesh.bones)
	{
		compo = new LS.Components.SkinDeformer();
		this.addComponent( compo );
	}

	//morph targets
	if( mesh && mesh.morph_targets )
	{
		var compo = new LS.Components.MorphDeformer( { morph_targets: mesh.morph_targets } );
		this.addComponent( compo );
	}

}

/**
* Serializes this node by creating an object with all the info
* it contains info about the components too
* @method serialize
* @param {bool} ignore_prefab serializing wont returns children if it is a prefab, if you set this to ignore_prefab it will return all the info
* @return {Object} returns the object with the info
*/
SceneNode.prototype.serialize = function( ignore_prefab )
{
	var o = {
		object_class: "SceneNode"
	};

	if(this._name) 
		o.name = this._name;
	if(this.uid) 
		o.uid = this.uid;
	if(this.className) 
		o.className = this.className;
	o.layers = this.layers;

	//work in progress
	if(this.node_type)
		o.node_type = this.node_type;

	//modules
	if(this.mesh && typeof(this.mesh) == "string") 
		o.mesh = this.mesh; //do not save procedural meshes
	if(this.submesh_id != null) 
		o.submesh_id = this.submesh_id;
	if(this.material) 
		o.material = typeof(this.material) == "string" ? this.material : this.material.serialize();
	if(this.prefab && !ignore_prefab && !this._is_root ) 
		o.prefab = this.prefab;

	if(this.flags) 
		o.flags = LS.cloneObject(this.flags);

	//extra user info
	if(this.extra) 
		o.extra = this.extra;
	if(this.comments) 
		o.comments = this.comments;

	if(this._children && (!this.prefab || ignore_prefab) )
		o.children = this.serializeChildren();

	if(this._editor)
		o.editor = this._editor;

	//save components
	this.serializeComponents(o);

	//extra serializing info
	LEvent.trigger(this,"serialize",o);

	return o;
}

//used to recompute matrix so when parenting one node it doesnt lose its global transformation
SceneNode.prototype._onChildAdded = function( child_node, recompute_transform )
{
	if(recompute_transform && this.transform)
	{
		var M = child_node.transform.getGlobalMatrix(); //get son transform
		var M_parent = this.transform.getGlobalMatrix(); //parent transform
		mat4.invert(M_parent,M_parent);
		child_node.transform.fromMatrix( mat4.multiply(M_parent,M_parent,M) );
		child_node.transform.getGlobalMatrix(); //refresh
	}
	//link transform
	if(this.transform)
		child_node.transform._parent = this.transform;
}

SceneNode.prototype._onChangeParent = function( future_parent, recompute_transform )
{
	if(recompute_transform && future_parent.transform)
	{
		var M = this.transform.getGlobalMatrix(); //get son transform
		var M_parent = future_parent.transform.getGlobalMatrix(); //parent transform
		mat4.invert(M_parent,M_parent);
		this.transform.fromMatrix( mat4.multiply(M_parent,M_parent,M) );
	}
	//link transform
	if(future_parent.transform)
		this.transform._parent = future_parent.transform;
}

SceneNode.prototype._onChildRemoved = function( node, recompute_transform, remove_components )
{
	if(this.transform)
	{
		//unlink transform
		if(node.transform)
		{
			if(recompute_transform)
			{
				var m = node.transform.getGlobalMatrix();
				node.transform._parent = null;
				node.transform.fromMatrix(m);
			}
			else
				node.transform._parent = null;
		}
	}

	if( remove_components )
		node.removeAllComponents();
}

//Computes the bounding box from the render instance of this node
//doesnt take into account children
SceneNode.prototype.getBoundingBox = function( bbox, only_instances )
{
	bbox = bbox || BBox.create();
	var render_instances = this._instances;
	if(render_instances)
		for(var i = 0; i < render_instances.length; ++i)
		{
			if(i == 0)
				bbox.set( render_instances[i].aabb );
			else
				BBox.merge( bbox, bbox, render_instances[i].aabb );
		}

	if(only_instances)
		return bbox;

	if( (!render_instances || render_instances.length == 0) && this.transform )
		return BBox.fromPoint( this.transform.getGlobalPosition() );

	return bbox;
}

LS.SceneNode = SceneNode;
LS.Classes.SceneNode = SceneNode;
