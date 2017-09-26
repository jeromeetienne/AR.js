function Path()
{
	this.points = [];
	this.closed = false;
	this.type = Path.LINE;
}

Path.LINE = 1;
Path.SPLINE = 2;
Path.BEZIER = 3;

Path.prototype.addPoint = function(p)
{
	var pos = vec3.create();
	pos[0] = p[0];
	pos[1] = p[1];
	if(p.length > 2)
		pos[2] = p[2];
	this.points.push( pos );
}

Path.prototype.getSegments = function()
{
	var l = this.points.length;

	switch(this.type)
	{
		case Path.LINE: 
			if(l < 2) 
				return 0;
			return l - 1; 
			break;
		case Path.SPLINE:
			if(l < 3) 
				return 0;
			return (((l-1)/3)|0); 
			break;
	}
	return 0;
}

Path.prototype.computePoint = function(f, out)
{
	switch(this.type)
	{
		case Path.LINE: return this.getLinearPoint(f,out); break;
		case Path.SPLINE: 
		default:
			return this.getSplinePoint(f,out); break;
	}
	//throw("Impossible path type");
}


Path.prototype.getLinearPoint = function(f, out)
{
	out = out || vec3.create();
	var l = this.points.length;
	if(l < 2)
		return out;

	if(f <= 0)
		return vec3.copy(out, this.points[0]);
	if(f >= 1)
		return vec3.copy(out, this.points[l-1]);

	var v = ((l-1) * f);
	var i = v|0;
	var fract = v-i;
	var p = this.points[ i ];
	var p2 = this.points[ i+1 ];
	return vec3.lerp(out, p, p2, fract);
}

Path.prototype.getSplinePoint = function(f, out)
{
	out = out || vec3.create();
	var l = this.points.length;
	if(l < 4)
		return out;
	l = (((l-1)/3)|0) * 3 + 1; //take only useful points
	if(f <= 0)
		return vec3.copy(out, this.points[0]);
	if(f >= 1)
		return vec3.copy(out, this.points[l-1]);

	var v = ((l-1)/3*f); 
	var i = v|0;//spline number
	var t = v-i;//weight
	var p = this.points[ i ];
	var p1 = this.points[ i+1 ];
	var p2 = this.points[ i+2 ];
	var p3 = this.points[ i+3 ];

	var b1 = (1-t)*(1-t)*(1-t);
	var b2 = 3*t*(1-t)*(1-t);
	var b3 = 3*t*t*(1-t);
	var b4 = t*t*t;

	out[0] = p[0] * b1 + p1[0] * b2 + p2[0] * b3 + p3[0] * b4;
	out[1] = p[1] * b1 + p1[1] * b2 + p2[1] * b3 + p3[1] * b4;
	out[2] = p[2] * b1 + p1[2] * b2 + p2[2] * b3 + p3[2] * b4;
	return out;
}

/*
Path.prototype.getSplinePoint = function(f, out)
{
	out = out || vec3.create();
	var l = this.points.length;
	if(l < 4)
		return out;
	l = (((l-1)/3)|0) * 3 + 1; //take only useful points
	if(f <= 0)
		return vec3.copy(out, this.points[0]);
	if(f >= 1)
		return vec3.copy(out, this.points[l-1]);

	var v = ((l-1)/3*f); 
	var i = v|0;//spline number
	var fract = v-i;//weight
	var p = this.points[ i ];
	var p1 = this.points[ i+1 ];
	var p2 = this.points[ i+2 ];
	var p3 = this.points[ i+3 ];
	var w = fract;
	var w2 = w*w;
	var w3 = w2*w;
	out[0] = Path.interpolate( p[0], p1[0], p2[0], p3[0], w,w2,w3 );
	out[1] = Path.interpolate( p[1], p1[1], p2[1], p3[1], w,w2,w3 );
	out[2] = Path.interpolate( p[2], p1[2], p2[2], p3[2], w,w2,w3 );
	return out;
}

//catmull-rom
Path.interpolate = function ( p0, p1, p2, p3, t, t2, t3 ) {
	var v0 = ( p2 - p0 ) * 0.5;
	var v1 = ( p3 - p1 ) * 0.5;
	return ( 2 * ( p1 - p2 ) + v0 + v1 ) * t3 + ( - 3 * ( p1 - p2 ) - 2 * v0 - v1 ) * t2 + v0 * t + p1;
};

*/


Path.prototype.samplePoints = function( n )
{
	if(n <= 0)
	{
		var segments = this.getSegments();
		if(this.type == LS.Path.LINE)
			n = segments + 1;
		else
			n = segments * 20;
	}

	var result = Array(n);
	for(var i = 0; i < n; i++)
		result[i] = this.computePoint(i/(n-1));
	return result;
}

Path.prototype.samplePointsTyped = function( n, out )
{
	if(out && out.length < (n * 3))
		n = Math.floor(out.length / 3);

	if(n <= 0)
	{
		var segments = this.getSegments();
		if(this.type == LS.Path.LINE)
			n = segments + 1;
		else
			n = segments * 20;
	}

	out = out || new Float32Array( n * 3 );
	for(var i = 0; i < n; i++)
		this.computePoint(i/(n-1),out.subarray(i*3,i*3+3));
	return out;
}


Path.prototype.serialize = function()
{
	var o = {};
	var points = Array( this.points.length * 3 );
	for(var i = 0; i < this.points.length; i++)
	{
		var p = this.points[i];
		points[i*3] = p[0];
		points[i*3+1] = p[1];
		points[i*3+2] = p[2];
	}

	o.points = points;
	o.type = this.type;
	o.closed = this.closed;
	return o;
}

Path.prototype.configure = function(o)
{
	this.type = o.type;
	this.closed = o.closed;

	if(o.points)
	{
		this.points.length = o.points.length / 3;
		var points = o.points;
		for(var i = 0; i < this.points.length; i++)
			this.points[i] = vec3.fromValues( points[i*3], points[i*3+1], points[i*3+2] );
	}
}


LS.Path = Path;