// Provides a convenient raytracing interface.

// ### new GL.HitTest([t, hit, normal])
// 
// This is the object used to return hit test results. If there are no
// arguments, the constructed argument represents a hit infinitely far
// away.
global.HitTest = GL.HitTest = function HitTest(t, hit, normal) {
  this.t = arguments.length ? t : Number.MAX_VALUE;
  this.hit = hit;
  this.normal = normal;
  this.face = null;
}

// ### .mergeWith(other)
// 
// Changes this object to be the closer of the two hit test results.
HitTest.prototype = {
  mergeWith: function(other) {
    if (other.t > 0 && other.t < this.t) {
      this.t = other.t;
      this.hit = other.hit;
      this.normal = other.normal;
	  this.face = other.face;
    }
  }
};

// ### new GL.Raytracer()
// 
// This will read the current modelview matrix, projection matrix, and viewport,
// reconstruct the eye position, and store enough information to later generate
// per-pixel rays using `getRayForPixel()`.
// 
// Example usage:
// 
//     var tracer = new GL.Raytracer();
//     var ray = tracer.getRayForPixel(
//       gl.canvas.width / 2,
//       gl.canvas.height / 2);
//       var result = GL.Raytracer.hitTestSphere(
//       tracer.eye, ray, new GL.Vector(0, 0, 0), 1);

global.Raytracer = GL.Raytracer = function Raytracer( viewprojection_matrix, viewport ) {
	this.viewport = vec4.create();
	this.ray00 = vec3.create();
	this.ray10 = vec3.create();
	this.ray01 = vec3.create();
	this.ray11 = vec3.create();
	this.eye = vec3.create();
	this.setup( viewprojection_matrix, viewport );
}

Raytracer.prototype.setup = function( viewprojection_matrix, viewport )
{
	viewport = viewport || gl.viewport_data;
	this.viewport.set( viewport );

	var minX = viewport[0], maxX = minX + viewport[2];
	var minY = viewport[1], maxY = minY + viewport[3];

	vec3.set( this.ray00, minX, minY, 1 );
	vec3.set( this.ray10, maxX, minY, 1 );
	vec3.set( this.ray01, minX, maxY, 1 );
	vec3.set( this.ray11, maxX, maxY, 1 );
	vec3.unproject( this.ray00, this.ray00, viewprojection_matrix, viewport);
	vec3.unproject( this.ray10, this.ray10, viewprojection_matrix, viewport);
	vec3.unproject( this.ray01, this.ray01, viewprojection_matrix, viewport);
	vec3.unproject( this.ray11, this.ray11, viewprojection_matrix, viewport);
	var eye = this.eye;
	vec3.unproject(eye, eye, viewprojection_matrix, viewport);
	vec3.subtract(this.ray00, this.ray00, eye);
	vec3.subtract(this.ray10, this.ray10, eye);
	vec3.subtract(this.ray01, this.ray01, eye);
	vec3.subtract(this.ray11, this.ray11, eye);
}

  // ### .getRayForPixel(x, y)
  // 
  // Returns the ray originating from the camera and traveling through the pixel `x, y`.
Raytracer.prototype.getRayForPixel = (function(){ 
	var ray0 = vec3.create();
	var ray1 = vec3.create();
	return function(x, y, out) {
		out = out || vec3.create();
		x = (x - this.viewport[0]) / this.viewport[2];
		y = 1 - (y - this.viewport[1]) / this.viewport[3];
		vec3.lerp(ray0, this.ray00, this.ray10, x);
		vec3.lerp(ray1, this.ray01, this.ray11, x);
		vec3.lerp( out, ray0, ray1, y)
		return vec3.normalize( out, out );
	}
})();

// ### GL.Raytracer.hitTestBox(origin, ray, min, max)
// 
// Traces the ray starting from `origin` along `ray` against the axis-aligned box
// whose coordinates extend from `min` to `max`. Returns a `HitTest` with the
// information or `null` for no intersection.
// 
// This implementation uses the [slab intersection method](http://www.siggraph.org/education/materials/HyperGraph/raytrace/rtinter3.htm).
var _hittest_inv = mat4.create();
Raytracer.hitTestBox = function(origin, ray, min, max, model) {
  var _hittest_v3 = new Float32Array(10*3); //reuse memory to speedup
  
  if(model)
  {
	var inv = mat4.invert( _hittest_inv, model );
	origin = mat4.multiplyVec3( _hittest_v3.subarray(3,6), inv, origin );
	ray = mat4.rotateVec3( _hittest_v3.subarray(6,9), inv, ray );
  }

  var tMin = vec3.subtract( _hittest_v3.subarray(9,12), min, origin );
  vec3.divide( tMin, tMin, ray );

  var tMax = vec3.subtract( _hittest_v3.subarray(12,15), max, origin );
  vec3.divide( tMax, tMax, ray );

  var t1 = vec3.min( _hittest_v3.subarray(15,18), tMin, tMax);
  var t2 = vec3.max( _hittest_v3.subarray(18,21), tMin, tMax);

  var tNear = vec3.maxValue(t1);
  var tFar = vec3.minValue(t2);

  if (tNear > 0 && tNear <= tFar) {
    var epsilon = 1.0e-6;
	var hit = vec3.scale( _hittest_v3.subarray(21,24), ray, tNear);
	vec3.add( hit, origin, hit );

    vec3.addValue(_hittest_v3.subarray(24,27), min, epsilon);
    vec3.subValue(_hittest_v3.subarray(27,30), max, epsilon);

    return new HitTest(tNear, hit, vec3.fromValues(
      (hit[0] > max[0]) - (hit[0] < min[0]),
      (hit[1] > max[1]) - (hit[1] < min[1]),
      (hit[2] > max[2]) - (hit[2] < min[2])
    ));
  }

  return null;
};




// ### GL.Raytracer.hitTestSphere(origin, ray, center, radius)
// 
// Traces the ray starting from `origin` along `ray` against the sphere defined
// by `center` and `radius`. Returns a `HitTest` with the information or `null`
// for no intersection.
Raytracer.hitTestSphere = function(origin, ray, center, radius) {
  var offset = vec3.subtract( vec3.create(), origin,center);
  var a = vec3.dot(ray,ray);
  var b = 2 * vec3.dot(ray,offset);
  var c = vec3.dot(offset,offset) - radius * radius;
  var discriminant = b * b - 4 * a * c;

  if (discriminant > 0) {
    var t = (-b - Math.sqrt(discriminant)) / (2 * a), hit = vec3.add(vec3.create(),origin, vec3.scale(vec3.create(), ray, t));
    return new HitTest(t, hit, vec3.scale( vec3.create(), vec3.subtract(vec3.create(), hit,center), 1.0/radius));
  }

  return null;
};


// ### GL.Raytracer.hitTestTriangle(origin, ray, a, b, c)
// 
// Traces the ray starting from `origin` along `ray` against the triangle defined
// by the points `a`, `b`, and `c`. Returns a `HitTest` with the information or
// `null` for no intersection.
Raytracer.hitTestTriangle = function(origin, ray, a, b, c) {
  var ab = vec3.subtract(vec3.create(), b,a );
  var ac = vec3.subtract(vec3.create(), c,a );
  var normal = vec3.cross( vec3.create(), ab,ac);
  vec3.normalize( normal, normal );
  var t = vec3.dot(normal, vec3.subtract( vec3.create(), a,origin)) / vec3.dot(normal,ray);

  if (t > 0) {
    var hit = vec3.add( vec3.create(), origin, vec3.scale(vec3.create(), ray,t));
    var toHit = vec3.subtract( vec3.create(), hit, a);
    var dot00 = vec3.dot(ac,ac);
    var dot01 = vec3.dot(ac,ab);
    var dot02 = vec3.dot(ac,toHit);
    var dot11 = vec3.dot(ab,ab);
    var dot12 = vec3.dot(ab,toHit);
    var divide = dot00 * dot11 - dot01 * dot01;
    var u = (dot11 * dot02 - dot01 * dot12) / divide;
    var v = (dot00 * dot12 - dot01 * dot02) / divide;
    if (u >= 0 && v >= 0 && u + v <= 1) return new HitTest(t, hit, normal);
  }

  return null;
};