/**
* Reads animation tracks from an Animation resource and applies the properties to the objects referenced
* @class PlayAnimation
* @constructor
* @param {String} object to configure from
*/


function PlayAnimation(o)
{
	this.enabled = true;

	this._animation = "";
	this._take = "default";

	/**
	* the root node locator where to apply the animation, is none is specified it is applied using the scene root node
	* if a "@" is set, then only to this node and its children
	* @property root_node {String}
	*/
	this.root_node = "@";
	this.playback_speed = 1.0;

	/**
	* how to play the animation, options are:
    *   PlayAnimation.LOOP
	*	PlayAnimation.PINGPONG
	*	PlayAnimation.ONCE
	*	PlayAnimation.PAUSED
	* @property mode {Number}
	*/
	this.mode = PlayAnimation.LOOP;
	this.playing = true;
	this.current_time = 0;
	this.blend_time = 0;
	this.range = null;

	this._last_time = 0;

	this._use_blend_animation = false;
	this._blend_animation = null;
	this._blend_take = null;
	this._blend_current_time = 0;
	this._blend_remaining_time = 0;
	this._blend_updated_frame = -1; //used to avoid reseting time when animation and track are changed continuously

	this.disabled_tracks = {};

	if(o)
		this.configure(o);
}

PlayAnimation.LOOP = 1;
PlayAnimation.PINGPONG = 2;
PlayAnimation.ONCE = 3;
PlayAnimation.PAUSED = 4;

PlayAnimation.MODES = {"loop":PlayAnimation.LOOP, "pingpong":PlayAnimation.PINGPONG, "once":PlayAnimation.ONCE, "paused":PlayAnimation.PAUSED };

PlayAnimation["@animation"] = { widget: "animation" };
PlayAnimation["@root_node"] = { type: "node" };
PlayAnimation["@mode"] = { type:"enum", values: PlayAnimation.MODES };
PlayAnimation["@current_time"] = { type: LS.TYPES.NUMBER, min: 0, units:"s" };
PlayAnimation["@blend_time"] = { type: LS.TYPES.NUMBER, min: 0, units:"s" };
PlayAnimation["@take"] = { type: "enum", values: function(){
	var anim = this.instance.getAnimation();
	if(!anim)
		return ["default"];
	var takes = anim.takes;
	var result = [];
	for(var i in takes)
		result.push(i);
	return result;
}};

/**
* the name of the LS.Animation resource where the takes and tracks are stored
* @property animation {String}
*/
Object.defineProperty( PlayAnimation.prototype, "animation", {
	set: function(v){
		if(v == this._animation)
			return;
		this._blend_animation = this._animation;
		this._animation = v;
		if(this.blend_time)
		{
			if(!this._root || !this._root.scene)
				return;

			this._use_blend_animation = true;
			if( this._root.scene.frame != this._blend_updated_frame )
			{
				this._blend_current_time = this.current_time;
				this._blend_remaining_time = this.blend_time;
				this._blend_updated_frame = this._root.scene.frame;
			}
		}
	},
	get: function()
	{
		return this._animation;
	},
	enumerable: true
});

/**
* the name of the LS.Animation.Take to play from the LS.Animation
* A take representes a set of tracks
* @property take {String}
*/
Object.defineProperty( PlayAnimation.prototype, "take", {
	set: function(v){
		if(v == this._take)
			return;
		this._blend_take = this._take;
		this._take = v;
		if(this.blend_time)
		{
			if(!this._root || !this._root.scene)
				return;
			this._use_blend_animation = true;
			if( this._root.scene.frame != this._blend_updated_frame )
			{
				this._blend_current_time = this.current_time;
				this._blend_remaining_time = this.blend_time;
				this._blend_updated_frame = this._root.scene.frame;
			}
		}
	},
	get: function()
	{
		return this._take;
	},
	enumerable: true
});

PlayAnimation.prototype.configure = function(o)
{
	if(o.play) //LEGACY
		delete o.play;

	if(o.enabled !== undefined)
		this.enabled = !!o.enabled;
	if(o.range) 
		this.range = o.range.concat();
	if(o.mode !== undefined) 
		this.mode = o.mode;
	if(o.animation)
		this._animation = o.animation;
	if(o.take)
		this._take = o.take;
	if(o.playback_speed != null)
		this.playback_speed = parseFloat( o.playback_speed );
	if(o.root_node !== undefined)
		this.root_node = o.root_node;
	if(o.playing !== undefined)
		this.playing = o.playing;
	if(o.blend_time !== undefined)
		this.blend_time = o.blend_time;
}


PlayAnimation.icon = "mini-icon-clock.png";

PlayAnimation.prototype.onAddedToScene = function(scene)
{
	LEvent.bind( scene, "update", this.onUpdate, this);
}


PlayAnimation.prototype.onRemovedFromScene = function(scene)
{
	LEvent.unbind( scene, "update", this.onUpdate, this);
}

PlayAnimation.prototype.onUpdate = function(e, dt)
{
	if(!this.enabled)
		return;

	if(!this.playing)
		return;

	if( this.mode != PlayAnimation.PAUSED )
		this.current_time += dt * this.playback_speed;

	this.onUpdateAnimation( dt );

	if( this._use_blend_animation )
		this.onUpdateBlendAnimation( dt );
}

PlayAnimation.prototype.onUpdateAnimation = function(dt)
{
	var animation = this.getAnimation();
	if(!animation) 
		return;

	var take = animation.takes[ this.take ];
	if(!take) 
		return;

	var time = this.current_time;

	var start_time = 0;
	var duration = take.duration;
	var end_time = duration;

	if(this.range)
	{
		start_time = this.range[0];
		end_time = this.range[1];
		duration = end_time - start_time;
	}

	if(time > end_time)
	{
		switch( this.mode )
		{
			case PlayAnimation.ONCE: 
				time = end_time; 
				//time = start_time; //reset after
				LEvent.trigger( this, "end_animation" );
				this.playing = false;
				break;
			case PlayAnimation.PINGPONG:
				if( ((time / duration)|0) % 2 == 0 ) //TEST THIS
					time = this.current_time % duration; 
				else
					time = duration - (this.current_time % duration);
				break;
			case PlayAnimation.PINGPONG:
				time = end_time; 
				break;
			case PlayAnimation.LOOP: 
			default: 
				time = ((this.current_time - start_time) % duration) + start_time;
				LEvent.trigger( this, "animation_loop" );
				break;
		}
	}
	else if(time < start_time)
		time = start_time;

	this.applyAnimation( take, time, this._last_time );

	this._last_time = time; //TODO, add support for pingpong events in tracks
	//take.actionPerSample( this.current_time, this._processSample.bind( this ), { disabled_tracks: this.disabled_tracks } );

	var scene = this._root.scene;
	if(scene)
		scene.requestFrame();
}

PlayAnimation.prototype.onUpdateBlendAnimation = function( dt )
{
	var animation = this.getAnimation( this._blend_animation || this._animation || "" );
	if(!animation) 
		return;

	var take = animation.takes[ this._blend_take || this._take || "default" ];
	if(!take) 
		return;

	this._blend_current_time += dt;
	this._blend_remaining_time -= dt;

	if( this._blend_remaining_time <= 0 )
		this._use_blend_animation = false; //next frame it will stop

	var time = this._blend_current_time * this.playback_speed;

	var start_time = 0;
	var duration = take.duration;
	var end_time = duration;

	if(this.range)
	{
		start_time = this.range[0];
		end_time = this.range[1];
		duration = end_time - start_time;
	}

	if(time > end_time)
	{
		switch( this.mode )
		{
			case PlayAnimation.ONCE: 
				time = end_time; 
				this._use_blend_animation = false;
				break;
			case PlayAnimation.PINGPONG:
				if( ((time / duration)|0) % 2 == 0 ) //TEST THIS
					time = this._blend_current_time % duration; 
				else
					time = duration - (this._blend_current_time % duration);
				break;
			case PlayAnimation.PINGPONG:
				time = end_time; 
				break;
			case PlayAnimation.LOOP: 
			default: 
				time = ((this._blend_current_time - start_time) % duration) + start_time;
				break;
		}
	}
	else if(time < start_time)
		time = start_time;

	this.applyAnimation( take, time, null, this._blend_remaining_time / this.blend_time );

	var scene = this._root.scene;
	if(scene)
		scene.requestFrame();
}

/**
* returns the current animation or an animation with a given name
* @method getAnimation
* @param {String} name [optional] the name of the animation, if omited then uses the animation set in the component
* @return {LS.Animation} the animation container
*/
PlayAnimation.prototype.getAnimation = function( name )
{
	name = name === undefined ? this.animation : name;

	if(!name || name[0] == "@") 
		return this._root.scene.animation;
	var anim = LS.ResourcesManager.getResource( name );
	if( anim && anim.constructor === LS.Animation )
		return anim;
	return null;
}

/**
* returns the current animation or an animation with a given name
* @method getTake
* @param {String} take_name [optional] if not specified then it uses the current take
* @return {Number} the duration of the take, or -1 if the take was not found or the animation is not loaded
*/
PlayAnimation.prototype.getTake = function( take_name )
{
	var animation = this.getAnimation();
	if(!animation) 
		return null;
	take_name = take_name || this.take;
	var take = animation.takes[ take_name ];
	if(take) 
		return take;
	return null;
}

/**
* Gets the duration of the current take in the current animation
* @method getDuration
* @return {Number} the duration of the take, or -1 if the take was not found or the animation is not loaded
*/
PlayAnimation.prototype.getDuration = function()
{
	var take = this.getTake();
	if(take) 
		return take.duration;
	return -1;
}

/**
* Resets the time to zero and starts playing the current take of the animation
* It also triggers a "start_animation" event
* @method play
*/
PlayAnimation.prototype.play = function()
{
	if(!this._root || !this._root.scene)
		console.error("cannot play an animation if the component doesnt belong to a node in a scene");

	this.playing = true;

	this.current_time = 0;
	if(this.range)
		this.current_time = this.range[0];
	this._last_time = this.current_time;
	LEvent.trigger( this, "start_animation" );

	//this.applyAnimation( take, this.current_time );
}

/**
* Pauses the animation
* @method pause
*/
PlayAnimation.prototype.pause = function()
{
	this.playing = false;
}

/**
* Stops the animation and sets the time to zero
* @method stop
*/
PlayAnimation.prototype.stop = function()
{
	this.playing = false;

	this.current_time = 0;
	if(this.range)
		this.current_time = this.range[0];
	this._last_time = this.current_time;
	//this.applyAnimation( take, this.current_time );
}

/**
* Starts playing the animation but only using a range of it
* @method playRange
* @param {Number} start start time
* @param {Number} end end time
*/
PlayAnimation.prototype.playRange = function( start, end )
{
	this.playing = true;
	this.current_time = start;
	this._last_time = this.current_time;
	this.range = [ start, end ];
}

/**
* applys the animation to the scene nodes
* @method applyAnimation
* @param {String} take the name of the take
* @param {Number} time the time where to sample the tracks
* @param {Number} last_time [optional] the last time that was applied, (used to trigger events)
* @param {Number} weight [optional] the weight of this animation (used for blending animation), if ommited 1 is used
*/
PlayAnimation.prototype.applyAnimation = function( take, time, last_time, weight )
{
	if( last_time === undefined )
		last_time = time;

	var root_node = null;
	if(this.root_node && this._root.scene)
	{
		if(this.root_node == "@")
			root_node = this._root;
		else
			root_node = this._root.scene.getNode( this.root_node );
	}
	take.applyTracks( time, last_time, undefined, root_node, this._root.scene, weight );
}

PlayAnimation.prototype._processSample = function(nodename, property, value, options)
{
	var scene = this._root.scene;
	if(!scene)
		return;
	var node = scene.getNode(nodename);
	if(!node) 
		return;
		
	var trans = node.transform;

	switch(property)
	{
		case "translate.X": if(trans) trans.position[0] = value; break;
		case "translate.Y": if(trans) trans.position[1] = value; break;
		case "translate.Z": if(trans) trans.position[2] = value; break;
		//NOT TESTED
		/*
		case "rotateX.ANGLE": if(trans) trans.rotation[0] = value * DEG2RAD; break;
		case "rotateY.ANGLE": if(trans) trans.rotation[1] = value * DEG2RAD; break;
		case "rotateZ.ANGLE": if(trans) trans.rotation[2] = value * DEG2RAD; break;
		*/
		case "matrix": if(trans) trans.fromMatrix(value); break;
		default: break;
	}
	
	if(node.transform)
		node.transform.updateMatrix();
}

PlayAnimation.prototype.getResources = function(res)
{
	if(this.animation)
		res[ this.animation ] = LS.Animation;
}

PlayAnimation.prototype.onResourceRenamed = function (old_name, new_name, resource)
{
	if(this.animation == old_name)
		this.animation = new_name;
}

//returns which events can trigger this component
PlayAnimation.prototype.getEvents = function()
{
	return { "start_animation": "event", "end_animation": "event" };
}

//returns which actions can be triggered in this component
PlayAnimation.prototype.getEventActions = function()
{
	return { "play": "function","pause": "function","stop": "function" };
}


LS.registerComponent( PlayAnimation );