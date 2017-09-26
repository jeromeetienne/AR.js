/**
* Samples a curve and returns the resulting value 
*
* @namespace LS
* @method getCurveValueAt
* @param {Array} values 
* @param {number} minx min x value
* @param {number} maxx max x value
* @param {number} defaulty default y value
* @param {number} x the position in the curve to sample
* @return {number}
*/
LS.getCurveValueAt = function(values,minx,maxx,defaulty, x)
{
	if(x < minx || x > maxx)
		return defaulty;

	var last = [ minx, defaulty ];
	var f = 0;
	for(var i = 0; i < values.length; i += 1)
	{
		var v = values[i];
		if(x == v[0]) return v[1];
		if(x < v[0])
		{
			f = (x - last[0]) / (v[0] - last[0]);
			return last[1] * (1-f) + v[1] * f;
		}
		last = v;
	}

	v = [ maxx, defaulty ];
	f = (x - last[0]) / (v[0] - last[0]);
	return last[1] * (1-f) + v[1] * f;
}

/**
* Resamples a full curve in values (useful to upload to GPU array)
*
* @namespace LS
* @method resampleCurve
* @param {Array} values 
* @param {number} minx min x value
* @param {number} maxx max x value
* @param {number} defaulty default y value
* @param {number} numsamples
* @return {Array}
*/

LS.resampleCurve = function(values,minx,maxx,defaulty, samples)
{
	var result = [];
	result.length = samples;
	var delta = (maxx - minx) / samples;
	for(var i = 0; i < samples; i++)
		result[i] = LS.getCurveValueAt(values,minx,maxx,defaulty, minx + delta * i);
	return result;
}

//work in progress to create a new kind of property called attribute which comes with extra info
//valid options are { type: "number"|"string"|"vec2"|"vec3"|"color"|"Texture"...  , min, max, step }
if( !Object.prototype.hasOwnProperty("defineAttribute") )
{
	Object.defineProperty( Object.prototype, "defineAttribute", {
		value: function( name, value, options ) {
			if(options && typeof(options) == "string")
				options = { type: options };

			var root = this;
			if(typeof(this) != "function")
			{
				this[name] = value;
				root = this.constructor;
			}
			Object.defineProperty( root, "@" + name, {
				value: options || {},
				enumerable: false
			});
		},
		enumerable: false
	});

	Object.defineProperty( Object.prototype, "getAttribute", {
		value: function( name ) {
			var v = "@" + name;
			if(this.hasOwnProperty(v))
				return this[v];
			if(this.constructor && this.constructor.hasOwnProperty(v))
				return this.constructor[v];
			return null;
		},
		enumerable: false
	});
}



function toArray(v) { return Array.apply( [], v ); }

/*
Object.defineProperty(Object.prototype, "merge", { 
    value: function(v) {
        for(var i in v)
			this[i] = v[i];
		return this;
    },
    configurable: false,
    writable: false,
	enumerable: false  // uncomment to be explicit, though not necessary
});
*/

//used for hashing keys:TODO move from here somewhere else
if( !String.prototype.hasOwnProperty( "hashCode" ) )
{
	Object.defineProperty( String.prototype, "hashCode", {
		value: function(){
			var hash = 0, i, c, l;
			if (this.length == 0) return hash;
			for (i = 0, l = this.length; i < l; ++i) {
				c  = this.charCodeAt(i);
				hash  = ((hash<<5)-hash)+c;
				hash |= 0; // Convert to 32bit integer
			}
			return hash;
		},
		enumerable: false
	});
}

Object.equals = function( x, y ) {
  if ( x === y ) return true;
    // if both x and y are null or undefined and exactly the same

  if ( ! ( x instanceof Object ) || ! ( y instanceof Object ) ) return false;
    // if they are not strictly equal, they both need to be Objects

  if ( x.constructor !== y.constructor ) return false;
    // they must have the exact same prototype chain, the closest we can do is
    // test there constructor.

  for ( var p in x ) {
    if ( ! x.hasOwnProperty( p ) ) continue;
      // other properties were tested using x.constructor === y.constructor

    if ( ! y.hasOwnProperty( p ) ) return false;
      // allows to compare x[ p ] and y[ p ] when set to undefined

    if ( x[ p ] === y[ p ] ) continue;
      // if they have the same strict value or identity then they are equal

    if ( typeof( x[ p ] ) !== "object" ) return false;
      // Numbers, Strings, Functions, Booleans must be strictly equal

    if ( ! Object.equals( x[ p ],  y[ p ] ) ) return false;
      // Objects and Arrays must be tested recursively
  }

  for ( p in y ) {
    if ( y.hasOwnProperty( p ) && ! x.hasOwnProperty( p ) ) return false;
      // allows x[ p ] to be set to undefined
  }
  return true;
}