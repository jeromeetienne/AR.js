LS.Tween = {
	MAX_EASINGS: 256, //to avoid problems

	EASE_IN_QUAD: 1,
	EASE_OUT_QUAD: 2,
	EASE_IN_OUT_QUAD: 3,
	QUAD: 3,

	EASE_IN_CUBIC: 4,
	EASE_OUT_CUBIC: 5,
	EASE_IN_OUT_CUBIC: 6,
	CUBIC: 6,

	EASE_IN_QUART: 7,
	EASE_OUT_QUART: 8,
	EASE_IN_OUT_QUART: 9,
	QUART: 9,

	EASE_IN_SINE: 10,
	EASE_OUT_SINE: 11,
	EASE_IN_OUT_SINE: 12,
	SINE: 12,

	EASE_IN_EXPO: 13,
	EASE_OUT_EXPO: 14,
	EASE_IN_OUT_EXPO: 15,
	EXPO: 15,

	EASE_IN_BACK: 16,
	EASE_OUT_BACK: 17,
	EASE_IN_OUT_BACK: 18,
	BACK: 18,

	current_easings: [],
	_alife: [], //temporal array

	reset: function()
	{
		this.current_easings = [];
		this._alife = [];
	},

	easeProperty: function( object, property, target, time, easing_function, on_complete, on_progress )
	{
		if( !object )
			throw("ease object cannot be null");
		if( target === undefined )
			throw("target vaue must be defined");
		if(object[property] === undefined)
			throw("property not found in object, must be initialized to a value");

		//cancel previous in case we already have one for this property
		if(this.current_easings.length)
		{
			for(var i = 0; i < this.current_easings.length; ++i)
			{
				var easing = this.current_easings[i];
				if( easing.object !== object || easing.property != property )
					continue;
				this.current_easings.splice(i,1); //remove old one
				break;		
			}
		}

		easing_function = easing_function || this.EASE_IN_OUT_QUAD;

		//clone to avoid problems
		var origin = null;
		
		if(property)
			origin = LS.cloneObject( object[ property ] );
		else
			origin = LS.cloneObject( object );
		target = LS.cloneObject( target );

		//precompute target value size
		var size = 0;
		if(target.constructor === Number)
			size = -1;
		else if(target && target.length !== undefined)
			size = target.length;

		var type = null;
		var type_info = object.constructor["@" + property];
		if( type_info )
			type = type_info.type;

		var data = { 
			object: object, 
			property: property, 
			origin: origin, 
			target: target, 
			current: 0, 
			time: time, 
			easing: easing_function, 
			on_complete: on_complete, 
			on_progress: on_progress, 
			size: size, 
			type: type
		};

		for(var i = 0; i < this.current_easings.length; ++i)
		{
			if( this.current_easings[i].object == object && this.current_easings[i].property == property )
			{
				this.current_easings[i] = data; //replace old easing
				break;
			}
		}

		if(this.current_easings.length >= this.MAX_EASINGS)
		{
			var easing = this.current_easings.shift();
			//TODO: this could be improved applyting the target value right now
		}

		this.current_easings.push( data );
		return data;
	},

	easeObject: function( object, target, time, easing_function, on_complete, on_progress )
	{
		if( !object || !target )
			throw("ease object cannot be null");

		easing_function = easing_function || this.EASE_IN_OUT_QUAD;

		//clone to avoid problems
		var origin = LS.cloneObject( object );
		target = LS.cloneObject( target );

		//precompute size
		var size = 0;
		if(target.length !== undefined)
			size = target.length;

		var data = { object: object, origin: origin, target: target, current: 0, time: time, easing: easing_function, on_complete: on_complete, on_progress: on_progress, size: size };

		for(var i = 0; i < this.current_easings.length; ++i)
		{
			if( this.current_easings[i].object == object )
			{
				this.current_easings[i] = data; //replace old easing
				break;
			}
		}

		if(this.current_easings.length >= this.MAX_EASINGS)
		{
			this.current_easings.shift();
		}

		this.current_easings.push( data );
		return data;
	},

	update: function( dt )
	{
		if( !this.current_easings.length )
			return;

		var easings = this.current_easings;
		var alive = this._alife;
		alive.length = easings.length;
		var pos = 0;

		for(var i = 0, l = easings.length; i < l; ++i)
		{
			var item = easings[i];
			item.current += dt;
			var t = 1;
			if(item.current < item.time)
			{
				t = item.current / item.time;
				alive[ pos ] = item;
				pos += 1;
			}

			var f = this.getEaseFactor( t, item.easing );

			var result = null;

			if(item.size)
			{
				if(item.size == -1) //number
					item.object[ item.property ] = item.target * f + item.origin * ( 1.0 - f );
				else
				{
					var property = item.object[ item.property ];

					if(item.type && item.type == "quat")
						quat.slerp( property, item.origin, item.target, f );
					else
					{
						//regular linear interpolation
						for(var j = 0; j < item.size; ++j)
							property[j] = item.target[j] * f + item.origin[j] * ( 1.0 - f );
					}
				}
				if(item.object.mustUpdate !== undefined)
					item.object.mustUpdate = true;
			}

			if(item.on_progress)
				item.on_progress( item );

			if(t == 1 && item.on_complete)
				item.on_complete( item );
		}

		alive.length = pos; //trim

		this.current_easings = alive;
		this._alife = easings;
	},

	getEaseFactor: function(t,type)
	{
		if(t>1) 
			t = 1;
		else if(t < 0)
			t = 0;
		var s = 1.70158;
		type = type || this.QUAD;
		switch(type)
		{
			case this.EASE_IN_QUAD: return (t*t);
			case this.EASE_OUT_QUAD: return 1-(t*t);
			case this.EASE_IN_OUT_QUAD: { 
				t *= 2;
				if( t < 1 ) return 0.5 * t * t;
				t -= 1;
				return -0.5 * ((t)*(t-2) - 1);
			};

			case this.EASE_IN_CUBIC: return t*t*t;
			case this.EASE_OUT_CUBIC: {
				t -= 1;
				return t*t*t + 1;
			};
			case this.EASE_IN_OUT_CUBIC: {
				t *= 2;
				if( t < 1 )
					return 0.5 * t*t*t;
				t -= 2;
				return 0.5*(t*t*t + 2);
			};

			case this.EASE_IN_QUART: return t*t*t*t;
			case this.EASE_OUT_QUART: {
				t -= 1;
				return -(t*t*t*t - 1);
			}
			case this.EASE_IN_OUT_QUART: {
				t *= 2;
				if( t < 1 ) return 0.5*t*t*t*t;
				else {
					t -= 2;
					return -0.5 * (t*t*t*t - 2);
				}
			}

			case this.EASE_IN_SINE:	return 1-Math.cos( t * Math.PI / 2 );
			case this.EASE_OUT_SINE:	return Math.sin( t * Math.PI / 2 );
			case this.EASE_IN_OUT_SINE: return -0.5 * ( Math.cos( Math.PI * t ) - 1 );

			case this.EASE_IN_EXPO: return t == 0 ? 0 : Math.pow( 2, 10 * (t - 1) );
			case this.EASE_OUT_EXPO: return t == 1 ? 1 : 1 - Math.pow( 2, -10 * t );
			case this.EASE_IN_OUT_EXPO: {
				if( t == 0 ) return 0;
				if( t == 1 ) return 1;
				t *= 2;
				if( t < 1 ) return 0.5 * Math.pow( 2, 10 * (t - 1) );
				return 0.5 * ( -Math.pow( 2, -10 * (t - 1)) + 2);
			}

			case this.EASE_IN_BACK: return t * t * ((s+1)*t - s);
			case this.EASE_OUT_BACK: return (t*t*((s+1)*t + s) + 1);
			case this.EASE_IN_OUT_BACK: {
				t *= 2;
				if( t < 1 ) {
					s *= 1.525;
					return 0.5*(t*t*((s+1)*t - s));
				}
				else {
					t -= 2;
					s *= 1.525;
					return 0.5*(t*t*((s+1)*t+ s) + 2);
				}
			};
		}
		return t;
	}
};
