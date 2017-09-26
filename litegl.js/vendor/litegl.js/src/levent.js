/**
* @namespace 
*/

/**
* LEvent is a lightweight events library focused in low memory footprint and fast delivery.
* It works by creating a property called "__levents" inside the object that has the bindings, and storing arrays with all the bindings.
* @class LEvent
* @constructor
*/

var LEvent = global.LEvent = GL.LEvent = {

	/**
	* Binds an event to an instance
	* @method LEvent.bind
	* @param {Object} instance where to attach the event
	* @param {String} event_name string defining the event name
	* @param {function} callback function to call when the event is triggered
	* @param {Object} target_instance [Optional] instance to call the function (use this instead of .bind method to help removing events)
	**/
	bind: function( instance, event_type, callback, target_instance )
	{
		if(!instance) 
			throw("cannot bind event to null");
		if(!callback) 
			throw("cannot bind to null callback");
		if(instance.constructor === String ) 
			throw("cannot bind event to a string");

		var events = instance.__levents;
		if(!events)
		{
			Object.defineProperty( instance, "__levents", {value: {}, enumerable: false });
			events = instance.__levents;
		}

		if( events.hasOwnProperty( event_type ) )
			events[event_type].push([callback,target_instance]);
		else
			events[event_type] = [[callback,target_instance]];
		if( instance.onLEventBinded )
			instance.onLEventBinded( event_type, callback, target_instance );
	},

	/**
	* Unbinds an event from an instance
	* @method LEvent.unbind
	* @param {Object} instance where the event is binded
	* @param {String} event_name string defining the event name
	* @param {function} callback function that was binded
	* @param {Object} target_instance [Optional] target_instance that was binded
	**/
	unbind: function( instance, event_type, callback, target_instance )
	{
		if(!instance) 
			throw("cannot unbind event to null");
		if(!callback) 
			throw("cannot unbind from null callback");
		if(instance.constructor === String ) 
			throw("cannot bind event to a string");

		var events = instance.__levents;
		if(!events)
			return;

		if(!events.hasOwnProperty( event_type ))
			return;

		for(var i = 0, l = events[event_type].length; i < l; ++i)
		{
			var v = events[event_type][i];
			if(v[0] === callback && v[1] === target_instance)
			{
				events[event_type].splice( i, 1 );
				break;
			}
		}

		if (events[event_type].length == 0)
			delete events[event_type];

		if( instance.onLEventUnbinded )
			instance.onLEventUnbinded( event_type, callback, target_instance );
	},

	/**
	* Unbinds all events from an instance (or the ones that match certain target_instance)
	* @method LEvent.unbindAll
	* @param {Object} instance where the events are binded
	* @param {Object} target_instance [Optional] target_instance of the events to remove
	**/
	unbindAll: function( instance, target_instance, callback )
	{
		if(!instance) 
			throw("cannot unbind events in null");

		var events = instance.__levents;
		if(!events)
			return;

		if( instance.onLEventUnbindAll )
			instance.onLEventUnbindAll( target_instance, callback );

		if(!target_instance) //remove all
		{
			delete instance.__levents;
			return;
		}

		//remove only the target_instance
		//for every property in the instance
		for(var i in events)
		{
			var array = events[i];
			for(var j = array.length - 1; j >= 0; --j) //iterate backwards to avoid problems after removing
			{
				if( array[j][1] != target_instance || (callback && callback !== array[j][0]) ) 
					continue;

				array.splice(j,1);//remove
			}
		}
	},

	/**
	* Unbinds all callbacks associated to one specific event from this instance
	* @method LEvent.unbindAll
	* @param {Object} instance where the events are binded
	* @param {String} event name of the event you want to remove all binds
	**/
	unbindAllEvent: function( instance, event_type )
	{
		if(!instance) 
			throw("cannot unbind events in null");

		var events = instance.__levents;
		if(!events)
			return;
		delete events[ event_type ];
		if( instance.onLEventUnbindAll )
			instance.onLEventUnbindAll( event_type, target_instance, callback );
		return;
	},

	/**
	* Tells if there is a binded callback that matches the criteria
	* @method LEvent.isBind
	* @param {Object} instance where the are the events binded
	* @param {String} event_name string defining the event name
	* @param {function} callback the callback
	* @param {Object} target_instance [Optional] instance binded to callback
	**/
	isBind: function( instance, event_type, callback, target_instance )
	{
		if(!instance)
			throw("LEvent cannot have null as instance");

		var events = instance.__levents;
		if( !events )
			return;

		if( !events.hasOwnProperty(event_type) ) 
			return false;

		for(var i = 0, l = events[event_type].length; i < l; ++i)
		{
			var v = events[event_type][i];
			if(v[0] === callback && v[1] === target_instance)
				return true;
		}
		return false;
	},

	/**
	* Tells if there is any callback binded to this event
	* @method LEvent.hasBind
	* @param {Object} instance where the are the events binded
	* @param {String} event_name string defining the event name
	* @return {boolean} true is there is at least one
	**/
	hasBind: function( instance, event_type )
	{
		if(!instance)
			throw("LEvent cannot have null as instance");
		var events = instance.__levents;
		if(!events || !events.hasOwnProperty( event_type ) || !events[event_type].length) 
			return false;
		return true;
	},

	/**
	* Tells if there is any callback binded to this object pointing to a method in the target object
	* @method LEvent.hasBindTo
	* @param {Object} instance where there are the events binded
	* @param {Object} target instance to check to
	* @return {boolean} true is there is at least one
	**/
	hasBindTo: function( instance, target )
	{
		if(!instance)
			throw("LEvent cannot have null as instance");
		var events = instance.__levents;

		//no events binded
		if(!events) 
			return false;

		for(var j in events)
		{
			var binds = events[j];
			for(var i = 0; i < binds.length; ++i)
			{
				if(binds[i][1] === target) //one found
					return true;
			}
		}

		return false;
	},

	/**
	* Triggers and event in an instance
	* @method LEvent.trigger
	* @param {Object} instance that triggers the event
	* @param {String} event_name string defining the event name
	* @param {*} parameters that will be received by the binded function
	* @param {bool} reverse_order trigger in reverse order (binded last get called first)
	**/
	trigger: function( instance, event_type, params, reverse_order )
	{
		if(!instance) 
			throw("cannot trigger event from null");
		if(instance.constructor === String ) 
			throw("cannot bind event to a string");

		var events = instance.__levents;
		if( !events || !events.hasOwnProperty(event_type) )
			return true;

		var inst = events[event_type];
		if( reverse_order )
		{
			for(var i = inst.length - 1; i >= 0; --i)
			{
				var v = inst[i];
				if( v && v[0].call(v[1], event_type, params) == false)// || event.stop)
					return false; //stopPropagation
			}
		}
		else
		{
			for(var i = 0, l = inst.length; i < l; ++i)
			{
				var v = inst[i];
				if( v && v[0].call(v[1], event_type, params) == false)// || event.stop)
					return false; //stopPropagation
			}
		}

		return true;
	},

	/**
	* Triggers and event to every element in an array
	* @method LEvent.triggerArray
	* @param {Array} array contains all instances to triggers the event
	* @param {String} event_name string defining the event name
	* @param {*} parameters that will be received by the binded function
	* @param {bool} reverse_order trigger in reverse order (binded last get called first)
	**/
	triggerArray: function( instances, event_type, params, reverse_order )
	{
		for(var i = 0, l = instances.length; i < l; ++i)
		{
			var instance = instances[i];
			if(!instance) 
				throw("cannot trigger event from null");
			if(instance.constructor === String ) 
				throw("cannot bind event to a string");

			var events = instance.__levents;
			if( !events || !events.hasOwnProperty( event_type ) )
				continue;

			if( reverse_order )
			{
				for(var j = events[event_type].length - 1; j >= 0; --j)
				{
					var v = events[event_type][j];
					if( v[0].call(v[1], event_type, params) == false)// || event.stop)
						break; //stopPropagation
				}
			}
			else
			{
				for(var j = 0, ll = events[event_type].length; j < ll; ++j)
				{
					var v = events[event_type][j];
					if( v[0].call(v[1], event_type, params) == false)// || event.stop)
						break; //stopPropagation
				}
			}
		}

		return true;
	},

	extendObject: function( object )
	{
		object.bind = function( event_type, callback, instance ){
			return LEvent.bind( this, event_type, callback, instance );
		};

		object.trigger = function( event_type, params ){
			return LEvent.trigger( this, event_type, params );
		};

		object.unbind = function( event_type, callback, target_instance )
		{
			return LEvent.unbind( this, event_type, callback, instance );
		};

		object.unbindAll = function( target_instance, callback )
		{
			return LEvent.unbindAll( this, target_instance, callback );
		};
	},

	/**
	* Adds the methods to bind, trigger and unbind to this class prototype
	* @method LEvent.extendClass
	* @param {Object} constructor
	**/
	extendClass: function( constructor )
	{
		this.extendObject( constructor.prototype );
	}
};