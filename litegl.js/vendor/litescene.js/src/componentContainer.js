/*
	A component container is someone who could have components attached to it.
	Mostly used for SceneNodes but it could be used for other classes (like SceneTree or Project).
*/

/**
* ComponentContainer class allows to add component based properties to any other class
* @class ComponentContainer
* @constructor
*/
function ComponentContainer()
{
	//this function never will be called (because only the methods are attached to other classes)
	//unless you instantiate this class directly, something that would be weird
	this._components = [];
	this._missing_components = null; //here we store info about components with missing info
	//this._components_by_uid = {}; //TODO
}


/**
* Adds a component to this node.
* @method configureComponents
* @param {Object} info object containing all the info from a previous serialization
*/

ComponentContainer.prototype.configureComponents = function( info )
{
	if(!info.components)
		return;

	var to_configure = [];

	//attach first, configure later
	for(var i = 0, l = info.components.length; i < l; ++i)
	{
		var comp_info = info.components[i];
		var comp_class = comp_info[0];
		var comp = null;

		//special case: this is the only component that comes by default
		if(comp_class == "Transform" && i == 0 && this.transform) 
		{
			comp = this.transform;
		}
		else
		{
			//search for the class
			var classObject = LS.Components[comp_class];
			if(!classObject){
				console.error("Unknown component found: " + comp_class);
				if(!this._missing_components)
					this._missing_components = [];
				comp_info[2] = i; //store index
				this._missing_components.push( comp_info );
				continue;
			}
			//create component
			comp = new classObject(); //comp_info[1]
			//attach to node
			this.addComponent(comp);
		}

		//what about configure the comp after adding it? 
		//comp.configure( comp_info[1] );
		to_configure.push( comp, comp_info[1] );

		//HACK very special case: due to requireScript
		if( comp.constructor === LS.Components.ScriptFromFile )
			comp._filename = comp_info[1].filename;

		//editor stuff
		if( comp_info[1].editor )
			comp._editor = comp_info[1].editor;

		//ensure the component uid is stored, some components may forgot about it
		if( comp_info[1].uid && comp_info[1].uid !== comp.uid )
			comp.uid = comp_info[1].uid;
	}

	//configure components now that all of them are created
	//this is to avoid problems with components that check if the node has other components and if not they create it
	for(var i = 0, l = to_configure.length; i < l; i+=2)
	{
		to_configure[i].configure( to_configure[i+1] );
	}
}

/**
* Adds a component to this node.
* @method serializeComponents
* @param {Object} o container where the components will be stored
*/

ComponentContainer.prototype.serializeComponents = function( o )
{
	if(!this._components)
		return;

	o.components = [];
	for(var i = 0, l = this._components.length; i < l; ++i)
	{
		var comp = this._components[i];
		if( !comp.serialize || comp.skip_serialize )
			continue;
		var obj = comp.serialize();

		if(comp._editor)
			obj.editor = comp._editor;

		//enforce uid storage
		if(comp.hasOwnProperty("_uid") && !obj.uid)
			obj.uid = comp.uid;

		var object_class = LS.getObjectClassName(comp);
		if(LS.debug && object_class != obj.object_class )
			console.warn("Component serialize without object_class:",object_class);
		if(!obj.object_class)
			obj.object_class = object_class; //enforce
		
		o.components.push([ object_class, obj ]);
	}

	//missing components are stored in another container and should be mergen with the rest of the components
	if( this._missing_components && this._missing_components.length )
	{
		//try to copy in place (not perfect but this shouldnt happend very often)
		for(var i = 0; i < this._missing_components.length; ++i )
		{
			var comp_info = this._missing_components[i];
			o.components.splice( comp_info[2] || 0, 0, comp_info );
		}
	}
}

/**
* returns an array with all the components
* @method getComponents
* @return {Array} all the components
*/
ComponentContainer.prototype.getComponents = function( class_type )
{
	if(class_type)
	{
		var result = [];
		if(class_type.constructor === String)
			class_type = LS.Components[class_type];
		for(var i = 0, l = this._components.length; i < l; ++i)
		{
			var compo = this._components[i];
			if( compo.constructor === class_type )
				result.push( compo );
		}
		return result;
	}

	return this._components;
}

/**
* Adds a component to this node. (maybe attach would been a better name)
* @method addComponent
* @param {Object} component
* @return {Object} component added
*/
ComponentContainer.prototype.addComponent = function( component, index )
{
	if(!component)
		throw("addComponent cannot receive null");

	//you may pass a component class instead of an instance
	if(component.constructor === String)
	{
		component = LS.Components[ component ];
		if(!component)
			throw("component class not found: ", arguments[0] );
	}
	if(component.is_component)
		component = new component();
	
	//link component with container
	component._root = this;

	//must have uid
	if( !component.uid )
		component.uid = LS.generateUId("COMP-");

	//not very clean, ComponetContainer shouldnt know about LS.SceneNode, but this is more simple
	if( component.onAddedToNode)
		component.onAddedToNode(this);

	if( this._in_tree )
	{
		if( component.uid )
			this._in_tree._components_by_uid[ component.uid ] = component;
		else
			console.warn("component without uid?", component);
		if(	component.onAddedToScene )
			component.onAddedToScene( this.constructor == LS.SceneTree ? this : this._in_tree );
	}

	//link node with component
	if(!this._components) 
		Object.defineProperty( this, "_components", { value: [], enumerable: false });
	if(this._components.indexOf(component) != -1)
		throw("inserting the same component twice");

	if(index !== undefined && index <= this._components.length )
		this._components.splice(index,0,component);
	else
		this._components.push( component );

	LEvent.trigger( this, "componentAdded", component );

	return component;
}

/**
* Removes a component from this node.
* @method removeComponent
* @param {Object} component
*/
ComponentContainer.prototype.removeComponent = function(component)
{
	if(!component)
		throw("removeComponent cannot receive null");

	//unlink component with container
	component._root = null;

	//not very clean, ComponetContainer shouldnt know about LS.SceneNode, but this is more simple
	if( component.onRemovedFromNode )
		component.onRemovedFromNode(this);

	if( this._in_tree )
	{
		delete this._in_tree._components_by_uid[ component.uid ];
		if(component.onRemovedFromScene)
			component.onRemovedFromScene( this._in_tree );
	}

	//remove all events
	LEvent.unbindAll(this,component);

	//remove from components list
	var pos = this._components.indexOf(component);
	if(pos != -1)
		this._components.splice(pos,1);
	else
		console.warn("removeComponent: Component not found in node");

	LEvent.trigger( this, "componentRemoved", component );
}

/**
* Removes all components from this node.
* @method removeAllComponents
* @param {Object} component
*/
ComponentContainer.prototype.removeAllComponents = function()
{
	while(this._components.length)
		this.removeComponent( this._components[0] );
	this._missing_components = null;
}


/**
* Returns if the container has a component of this class
* @method hasComponent
* @param {String|Class} component_class the component to search for, could be a string or the class itself
* @param {Boolean} search_missing [optional] true if you want to search in the missing components too
*/
ComponentContainer.prototype.hasComponent = function( component_class, search_missing )
{
	if(!this._components && !this._missing_components)
		return false;

	//search in missing components
	if(search_missing && this._missing_components && this._missing_components.length)
	{
		if(component_class.constructor !== String) //weird case
			component_class = LS.getClassName( component_class );
		for(var i = 0, l = this._missing_components.length; i < l; ++i)
			if( this._missing_components[i][0] == component_class )
				return true;
	}

	//string
	if( component_class.constructor === String )
	{
		component_class = LS.Components[ component_class ];
		if(!component_class)
			return false;
	}

	//search in components
	for(var i = 0, l = this._components.length; i < l; ++i)
		if( this._components[i].constructor === component_class )
			return true;
	
	return false;
}


/**
* Returns the first component of this container that is of the same class
* @method getComponent
* @param {Object|String} component_class the class to search a component from (could be the class or the name)
* @param {Number} index [optional] if you want the Nth component of this class
*/
ComponentContainer.prototype.getComponent = function( component_class, index )
{
	if(!this._components || !component_class)
		return null;

	//convert string to class
	if( component_class.constructor === String )
	{
		//special case, locator by name (the locator starts with an underscore if it is meant to be a name)
		if( component_class[0] == "_" ) 
		{
			component_class = component_class.substr(1); //remove underscore
			for(var i = 0, l = this._components.length; i < l; ++i)
			{
				if( this._components[i].name == component_class )
				{
					if(index !== undefined && index > 0)
					{
						index--;
						continue;
					}
					return this._components[i];
				}
			}
			return false;
		}

		//otherwise the string represents the class name
		component_class = LS.Components[ component_class ];
		if(!component_class)
			return;
	}

	//search components
	for(var i = 0, l = this._components.length; i < l; ++i)
	{
		if( this._components[i].constructor === component_class )
		{
			if(index !== undefined && index > 0)
			{
				index--;
				continue;
			}
			return this._components[i];
		}
	}

	return null;
}

/**
* Returns the component with the given uid
* @method getComponentByUId
* @param {string} uid the uid to search 
*/
ComponentContainer.prototype.getComponentByUId = function(uid)
{
	if(!this._components)
		return null;
	for(var i = 0, l = this._components.length; i < l; ++i)
		if( this._components[i].uid == uid )
			return this._components[i];
	return null;
}

/**
* Returns the position in the components array of this component
* @method getIndexOfComponent
* @param {Number} position in the array, -1 if not found
*/
ComponentContainer.prototype.getIndexOfComponent = function(component)
{
	if(!this._components)
		return -1;
	return this._components.indexOf( component );
}

/**
* Returns the component at index position
* @method getComponentByIndex
* @param {Object} component
*/
ComponentContainer.prototype.getComponentByIndex = function(index)
{
	if(!this._components)
		return null;
	return this._components[index];
}

/**
* Changes the order of a component
* @method setComponentIndex
* @param {Object} component
*/
ComponentContainer.prototype.setComponentIndex = function( component, index )
{
	if(!this._components)
		return null;
	if(index < 0)
		index = 0;
	var old_index = this._components.indexOf( component );
	if (old_index == -1)
		return;

	this._components.splice( old_index, 1 );

	/*
	if(index >= old_index)
		index--; 
	*/
	if(index >= this._components.length)
		this._components.push( component );
	else
		this._components.splice( index, 0, component );

}


/**
* Ensures this node has a component of the specified class, if not it creates one and attaches it
* @method requireComponent
* @param {Object|String} component_class the class to search a component from (could be the class or the name)
* @param {Object} data [optional] the object to configure the component from
* @return {Component} the component found or created
*/
ComponentContainer.prototype.requireComponent = function( component_class, data )
{
	if(!component_class)
		throw("no component class specified");

	//convert string to class
	if( component_class.constructor === String )
	{
		component_class = LS.Components[ component_class ];
		if(!component_class)
		{
			console.error("component class not found:", arguments[0] );
			return null;
		}
	}

	//search component
	var l = this._components.length;
	for(var i = 0; i < l; ++i)
	{
		if( this._components[i].constructor === component_class )
			return this._components[i];
	}

	var compo = new component_class();
	this.addComponent(compo, l ); //insert before the latest scripts, to avoid situations where when partially parsed the components the component is attached but not parsed yet
	if(data)
		compo.configure(data);
	return compo;
}

/**
* Ensures this node has a ScriptFromFile component of the specified script url, if not it creates one and attaches it
* @method requireScript
* @param {String} url the url to the script
* @return {Component} the ScriptFromFile component found or created
*/
ComponentContainer.prototype.requireScript = function( url )
{
	if(!url)
		throw("no url specified");

	var component_class = LS.Components.ScriptFromFile;
	url = LS.ResourcesManager.cleanFullpath( url ); //remove double slashes or spaces

	//search component
	var l = this._components.length;
	for(var i = 0; i < l; ++i)
	{
		var comp = this._components[i];
		if( comp.constructor === component_class && comp._filename == url )
			return comp;
	}

	var compo = new component_class();
	compo.filename = url;
	this.addComponent( compo, l );
	return compo;
}

/**
* executes the method with a given name in all the components
* @method processActionInComponents
* @param {String} method_name the name of the function to execute in all components (in string format)
* @param {Array} params array with every parameter that the function may need
* @param {Boolean} skip_scripts [optional] skip scripts
*/
ComponentContainer.prototype.processActionInComponents = function( method_name, params, skip_scripts )
{
	if(this._components && this._components.length)
	{
		for(var i = 0, l = this._components.length; i < l; ++i)
		{
			var comp = this._components[i];
			if( comp[method_name] && comp[method_name].constructor === Function )
			{
				if(!params || params.constructor !== Array)
					comp[method_name].call(comp, params);
				else
					comp[method_name].apply(comp, params);
				continue;
			}

			if(skip_scripts)
				continue;

			if(comp._script)
				comp._script.callMethod( method_name, params, true );
		}
	}
}

/**
* executes the method with a given name in all the components and its children
* @method broadcastMessage
* @param {String} method_name the name of the function to execute in all components (in string format)
* @param {Array} params array with every parameter that the function may need
*/
ComponentContainer.prototype.broadcastMessage = function( method_name, params )
{
	this.processActionInComponents( method_name, params );

	if(this._children && this._children.length )
		for(var i = 0, l = this._children.length; i < l; ++i)
			this._children[i].broadcastMessage( method_name, params );
}

