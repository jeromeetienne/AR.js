function AnimationCurve(o)
{
	this.samples = [];

	if(o)
		this.configure(o);
}

AnimationCurve.prototype.configure = function(o)
{
	this.samples = o.samples;
}

AnimationCurve.prototype.serialize = function()
{
	return {
		samples: this.samples
	};
}

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
AnimationCurve.prototype.getCurveValueAt = function( minx, maxx, defaulty, x )
{
	if(x < minx || x > maxx)
		return defaulty;

	var values = this.samples;

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

AnimationCurve.prototype.resampleCurve = function(minx,maxx,defaulty, samples)
{
	var values = this.samples;
	var result = [];
	result.length = samples;
	var delta = (maxx - minx) / samples;
	for(var i = 0; i < samples; i++)
		result[i] = LS.getCurveValueAt(values,minx,maxx,defaulty, minx + delta * i);
	return result;
}