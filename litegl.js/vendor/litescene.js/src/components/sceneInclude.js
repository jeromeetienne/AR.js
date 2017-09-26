function SceneInclude( o )
{
	this.enabled = true;
	this.include_instances = true;
	this.include_cameras = true;
	this.include_lights = true;
	this._frame_fx = false;
	this._frame_fx_binded = false;

	this.send_events = true;

	this._scene_path = null;
	this._scene_is_ready = false;

	if( LS.SceneTree ) //this is because in some cases (debug mode) this component will be registered before the SceneTree exists
	{
		this._scene = new LS.SceneTree();
		this._scene.root.removeAllComponents();
		LEvent.bind( this._scene, "requestFrame", function(){ 
			if(this._root.scene)
				this._root.scene.requestFrame();
		}, this );
	}

	if(o)
		this.configure(o);
}

SceneInclude.max_recursive_level = 32;
SceneInclude.recursive_level = 0;

//which events from the scene should be propagated to the included scene...
SceneInclude.propagable_events = ["finish","beforeRenderMainPass","beforeRenderInstances","afterRenderInstances","readyToRender","renderGUI","renderHelpers"];
SceneInclude.fx_propagable_events = ["enableFrameContext","showFrameContext"];

Object.defineProperty( SceneInclude.prototype, "scene_path", {
	set: function(v){ 
		if(this._scene_path == v)
			return;
		this._scene_path = v;
		if(this._root.scene)
			this.reloadScene();
	},
	get: function(){ return this._scene_path; },
	enumerable: true
});

Object.defineProperty( SceneInclude.prototype, "frame_fx", {
	set: function(v){ 
		if(this._frame_fx == v)
			return;
		this._frame_fx = v;
		this.updateBindings();
	},
	get: function(){ return this._frame_fx; },
	enumerable: true
});


SceneInclude["@scene_path"] = { type: LS.TYPES.SCENE, widget: "resource" };

SceneInclude.icon = "mini-icon-teapot.png";


SceneInclude.prototype.onAddedToScene = function(scene)
{
	//bind events
	LEvent.bind( scene, "collectData", this.onCollectData, this );
	LEvent.bind( scene, "start", this.onStart, this );
	LEvent.bind( scene, "update", this.onUpdate, this );

	for(var i in SceneInclude.propagable_events)
		LEvent.bind( scene, SceneInclude.propagable_events[i], this.onEvent, this );
	this.updateBindings();

	if(this._scene_path)
		this.reloadScene();

}

SceneInclude.prototype.onRemovedFromScene = function(scene)
{
	LEvent.unbind( scene, "collectData", this.onCollectData, this );
	LEvent.unbind( scene, "start", this.onStart, this );
	LEvent.unbind( scene, "update", this.onUpdate, this );

	//unbind all
	var events = SceneInclude.propagable_events.concat( SceneInclude.fx_propagable_events );
	for(var i in events)
		LEvent.unbind( scene, events[i], this.onEvent, this );
}

//we need special functions for this events because they need function calls, not events
SceneInclude.prototype.onStart = function()
{
	SceneInclude.recursive_level += 1;
	if(	this._scene_is_ready && SceneInclude.recursive_level < SceneInclude.max_recursive_level )
		this._scene.start();
	SceneInclude.recursive_level -= 1;
}

SceneInclude.prototype.onUpdate = function(e, dt)
{
	SceneInclude.recursive_level += 1;
	if(this.send_events && SceneInclude.recursive_level < SceneInclude.max_recursive_level )
		this._scene.update(dt);
	SceneInclude.recursive_level -= 1;
}

//propagate events
SceneInclude.prototype.onEvent = function(e,p)
{
	if(!this.enabled || !this.send_events || !this._scene_path)
		return;

	SceneInclude.recursive_level += 1;
	if(SceneInclude.recursive_level < SceneInclude.max_recursive_level )
		LEvent.trigger( this._scene, e, p );
	SceneInclude.recursive_level -= 1;
}

SceneInclude.prototype.updateBindings = function()
{
	var scene = this._root.scene;
	if(!scene)
		return;

	//update frameFX bindings
	if(this._frame_fx && !this._frame_fx_binded)
	{
		for(var i in SceneInclude.fx_propagable_events)
			LEvent.bind( scene, SceneInclude.fx_propagable_events[i], this.onEvent, this );
		this._frame_fx_binded = true;
	}

	if(!this._frame_fx && this._frame_fx_binded)
	{
		for(var i in SceneInclude.fx_propagable_events)
			LEvent.unbind( scene, SceneInclude.fx_propagable_events[i], this.onEvent, this );
		this._frame_fx_binded = false;
	}
}

//collect data
SceneInclude.prototype.onCollectData = function()
{
	if(!this.enabled || !this._scene_path || !this._scene_is_ready)
		return;

	var scene = this._root.scene;
	var inner_scene = this._scene;

	SceneInclude.recursive_level += 1;
	if(SceneInclude.recursive_level < SceneInclude.max_recursive_level )
		inner_scene.collectData();
	SceneInclude.recursive_level -= 1;

	var mat = null;
	
	if( this._root.transform )
	{
		mat = this._root.transform.getGlobalMatrix();
	}
	

	//merge all the data
	if( this.include_instances )
	{
		scene._instances.push.apply( scene._instances, inner_scene._instances);
		scene._colliders.push.apply( scene._colliders, inner_scene._colliders);

		if(mat)
			for(var i = 0; i < inner_scene._instances.length; ++i)
			{
				var ri = inner_scene._instances[i];
				ri.applyTransform( mat );	
			}
	}
	if( this.include_lights )
	{
		//cannot apply transform here, we will be modifying the inner lights state
		scene._lights.push.apply( scene._lights, inner_scene._lights);
	}
	if( this.include_cameras )
	{
		scene._cameras.push.apply( scene._cameras, inner_scene._cameras);
	}
}

SceneInclude.prototype.load = function()
{
	this.reloadScene();
}

SceneInclude.prototype.unload = function()
{
	this._scene_is_ready = false;
	this._scene.clear();
}


SceneInclude.prototype.reloadScene = function()
{
	this._scene_is_ready = false;

	SceneInclude.recursive_level += 1;
	if(SceneInclude.recursive_level < SceneInclude.max_recursive_level )
		this._scene.loadFromResources( this._scene_path, inner.bind(this) );
	SceneInclude.recursive_level -= 1;

	function inner()
	{
		console.log("SceneInclude: scene loaded");
		this._scene_is_ready = true;
		if(this._root.scene._state == LS.PLAYING )
			this._scene.start();
	}
}

SceneInclude.prototype.getPropertyInfoFromPath = function( path )
{
	if( !path.length || path[0] != "custom" )
		return null;

	var custom = this._scene.root.custom;
	if(!custom)
		return null;

	var varname = path[1];
	var property = custom._properties_by_name[ varname ];
	if(!property)
		return null;

	return {
		node: this._root,
		target: property,
		name: "value",
		value: property.value,
		type: property.type
	};
}

SceneInclude.prototype.setPropertyValueFromPath = function( path, value, offset )
{
	offset = offset || 0;

	if( !path.length || path[offset] != "custom" )
		return null;

	var custom = this._scene.root.custom;
	if(!custom)
		return null;
	custom.setPropertyValueFromPath( path, value, offset + 1 );
}

//returns which events can trigger this component
SceneInclude.prototype.getEvents = function()
{
	return { "loaded": "event", "unloaded": "event" };
}

//returns which actions can be triggered in this component
SceneInclude.prototype.getEventActions = function()
{
	return { "load": "function", "unload": "function" };
}

SceneInclude.prototype.getResources = function(res)
{
	if(this._scene_path)
		res[ this._scene_path ] = LS.SceneTree;
	return res;
}

SceneInclude.prototype.onResourceRenamed = function( old_name, new_name, resource )
{
	if(old_name == this._scene_path)
		this._scene_path = new_name;
}

LS.registerComponent( SceneInclude );