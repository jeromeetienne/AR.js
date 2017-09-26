
/**
* @class Mesh
*/

/**
* Returns a planar mesh (you can choose how many subdivisions)
* @method Mesh.plane
* @param {Object} options valid options: detail, detailX, detailY, size, width, heigth, xz (horizontal plane)
*/
Mesh.plane = function(options, gl) {
	options = options || {};
	options.triangles = [];
	var mesh = {};
	var detailX = options.detailX || options.detail || 1;
	var detailY = options.detailY || options.detail || 1;
	var width = options.width || options.size || 1;
	var height = options.height || options.size || 1;
	var xz = options.xz;
	width *= 0.5;
	height *= 0.5;

	var triangles = [];
	var vertices = [];
	var coords = [];
	var normals = [];

	var N = vec3.fromValues(0,0,1);
	if(xz) 
		N.set([0,1,0]);

	for (var y = 0; y <= detailY; y++) {
		var t = y / detailY;
		for (var x = 0; x <= detailX; x++) {
		  var s = x / detailX;
		  if(xz)
			  vertices.push((2 * s - 1) * width, 0, -(2 * t - 1) * height);
		  else
			  vertices.push((2 * s - 1) * width, (2 * t - 1) * height, 0);
		  coords.push(s, t);
		  normals.push(N[0],N[1],N[2]);
		  if (x < detailX && y < detailY) {
			var i = x + y * (detailX + 1);
			if(xz) //horizontal
			{
				triangles.push(i + 1, i + detailX + 1, i);
				triangles.push(i + 1, i + detailX + 2, i + detailX + 1);
			}
			else //vertical
			{
				triangles.push(i, i + 1, i + detailX + 1);
				triangles.push(i + detailX + 1, i + 1, i + detailX + 2);
			}
		  }
		}
	}

	var bounding = BBox.fromCenterHalfsize( [0,0,0], xz ? [width,0,height] : [width,height,0] );
	var mesh_info = {vertices:vertices, normals: normals, coords: coords, triangles: triangles };
	return GL.Mesh.load( mesh_info, { bounding: bounding }, gl);
};

/**
* Returns a 2D Mesh (be careful, stream is vertices2D, used for 2D engines )
* @method Mesh.plane2D
*/
Mesh.plane2D = function(options, gl) {
	var vertices = new Float32Array([-1,1, 1,-1, 1,1, -1,1, -1,-1, 1,-1]);
	var coords = new Float32Array([0,1, 1,0, 1,1, 0,1, 0,0, 1,0]);

	if(options && options.size)
	{
		var s = options.size * 0.5;
		for(var i = 0; i < vertices.length; ++i)
			vertices[i] *= s;
	}
	return new GL.Mesh( {vertices2D: vertices, coords: coords },null,gl );
};

/**
* Returns a point mesh 
* @method Mesh.point
* @param {Object} options no options
*/
Mesh.point = function(options) {
	return new GL.Mesh( {vertices: [0,0,0]} );
}

/**
* Returns a cube mesh 
* @method Mesh.cube
* @param {Object} options valid options: size 
*/
Mesh.cube = function(options, gl) {
	options = options || {};
	var halfsize = (options.size || 1) * 0.5;

	var buffers = {};
	//[[-1,1,-1],[-1,-1,+1],[-1,1,1],[-1,1,-1],[-1,-1,-1],[-1,-1,+1],[1,1,-1],[1,1,1],[1,-1,+1],[1,1,-1],[1,-1,+1],[1,-1,-1],[-1,1,1],[1,-1,1],[1,1,1],[-1,1,1],[-1,-1,1],[1,-1,1],[-1,1,-1],[1,1,-1],[1,-1,-1],[-1,1,-1],[1,-1,-1],[-1,-1,-1],[-1,1,-1],[1,1,1],[1,1,-1],[-1,1,-1],[-1,1,1],[1,1,1],[-1,-1,-1],[1,-1,-1],[1,-1,1],[-1,-1,-1],[1,-1,1],[-1,-1,1]]
	buffers.vertices = new Float32Array([-1,1,-1,-1,-1,+1, -1,1,1,-1,1,-1, -1,-1,-1,-1,-1,+1, 1,1,-1,1,1,1,1,-1,+1,1,1,-1,1,-1,+1,1,-1,-1,-1,1,1,1,-1,1,1,1,1,-1,1,1,-1,-1,1,1,-1,1,-1,1,-1,1,1,-1,1,-1,-1,-1,1,-1,1,-1,-1,-1,-1,-1,-1,1,-1,1,1,1,1,1,-1,-1,1,-1,-1,1,1,1,1,1,-1,-1,-1,1,-1,-1,1,-1,1,-1,-1,-1,1,-1,1,-1,-1,1]);
	for(var i = 0, l = buffers.vertices.length; i < l; ++i)
		buffers.vertices[i] *= halfsize;

	//[[-1,0,0],[-1,0,0],[-1,0,0],[-1,0,0],[-1,0,0],[-1,0,0],[1,0,0],[1,0,0],[1,0,0],[1,0,0],[1,0,0],[1,0,0],[0,0,1],[0,0,1],[0,0,1],[0,0,1],[0,0,1],[0,0,1],[0,0,-1],[0,0,-1],[0,0,-1],[0,0,-1],[0,0,-1],[0,0,-1],[0,1,0],[0,1,0],[0,1,0],[0,1,0],[0,1,0],[0,1,0],[0,-1,0],[0,-1,0],[0,-1,0],[0,-1,0],[0,-1,0],[0,-1,0]]
	//[[0,1],[1,0],[1,1],[0,1],[0,0],[1,0],[1,1],[0,1],[0,0],[1,1],[0,0],[1,0],[0,1],[1,0],[1,1],[0,1],[0,0],[1,0],[1,1],[0,1],[0,0],[1,1],[0,0],[1,0],[0,1],[1,0],[1,1],[0,1],[0,0],[1,0],[1,1],[0,1],[0,0],[1,1],[0,0],[1,0]];
	buffers.normals = new Float32Array([-1,0,0,-1,0,0,-1,0,0,-1,0,0,-1,0,0,-1,0,0,1,0,0,1,0,0,1,0,0,1,0,0,1,0,0,1,0,0,0,0,1,0,0,1,0,0,1,0,0,1,0,0,1,0,0,1,0,0,-1,0,0,-1,0,0,-1,0,0,-1,0,0,-1,0,0,-1,0,1,0,0,1,0,0,1,0,0,1,0,0,1,0,0,1,0,0,-1,0,0,-1,0,0,-1,0,0,-1,0,0,-1,0,0,-1,0]);
	buffers.coords = new Float32Array([0,1,1,0,1,1,0,1,0,0,1,0,1,1,0,1,0,0,1,1,0,0,1,0,0,1,1,0,1,1,0,1,0,0,1,0,1,1,0,1,0,0,1,1,0,0,1,0,0,1,1,0,1,1,0,1,0,0,1,0,1,1,0,1,0,0,1,1,0,0,1,0]);

	if(options.wireframe)
		buffers.wireframe = new Uint16Array([0,2, 2,5, 5,4, 4,0,   6,7, 7,10, 10,11, 11,6, 0,6, 2,7, 5,10, 4,11  ]);
	options.bounding = BBox.fromCenterHalfsize( [0,0,0], [halfsize,halfsize,halfsize] );
	return GL.Mesh.load(buffers, options, gl);
}


/**
* Returns a cube mesh of a given size
* @method Mesh.cube
* @param {Object} options valid options: size, sizex, sizey, sizez
*/
Mesh.box = function(options, gl) {
	options = options || {};
	var sizex = options.sizex || 1;
	var sizey = options.sizey || 1;
	var sizez = options.sizez || 1;
	sizex *= 0.5;
	sizey *= 0.5;
	sizez *= 0.5;

	var buffers = {};
	//[[-1,1,-1],[-1,-1,+1],[-1,1,1],[-1,1,-1],[-1,-1,-1],[-1,-1,+1],[1,1,-1],[1,1,1],[1,-1,+1],[1,1,-1],[1,-1,+1],[1,-1,-1],[-1,1,1],[1,-1,1],[1,1,1],[-1,1,1],[-1,-1,1],[1,-1,1],[-1,1,-1],[1,1,-1],[1,-1,-1],[-1,1,-1],[1,-1,-1],[-1,-1,-1],[-1,1,-1],[1,1,1],[1,1,-1],[-1,1,-1],[-1,1,1],[1,1,1],[-1,-1,-1],[1,-1,-1],[1,-1,1],[-1,-1,-1],[1,-1,1],[-1,-1,1]]
	buffers.vertices = new Float32Array([-1,1,-1,-1,-1,+1,-1,1,1,-1,1,-1,-1,-1,-1,-1,-1,+1,1,1,-1,1,1,1,1,-1,+1,1,1,-1,1,-1,+1,1,-1,-1,-1,1,1,1,-1,1,1,1,1,-1,1,1,-1,-1,1,1,-1,1,-1,1,-1,1,1,-1,1,-1,-1,-1,1,-1,1,-1,-1,-1,-1,-1,-1,1,-1,1,1,1,1,1,-1,-1,1,-1,-1,1,1,1,1,1,-1,-1,-1,1,-1,-1,1,-1,1,-1,-1,-1,1,-1,1,-1,-1,1]);
	//for(var i in options.vertices) for(var j in options.vertices[i]) options.vertices[i][j] *= size;
	for(var i = 0, l = buffers.vertices.length; i < l; i+=3) 
	{
		buffers.vertices[i] *= sizex;
		buffers.vertices[i+1] *= sizey;
		buffers.vertices[i+2] *= sizez;
	}

	//[[-1,0,0],[-1,0,0],[-1,0,0],[-1,0,0],[-1,0,0],[-1,0,0],[1,0,0],[1,0,0],[1,0,0],[1,0,0],[1,0,0],[1,0,0],[0,0,1],[0,0,1],[0,0,1],[0,0,1],[0,0,1],[0,0,1],[0,0,-1],[0,0,-1],[0,0,-1],[0,0,-1],[0,0,-1],[0,0,-1],[0,1,0],[0,1,0],[0,1,0],[0,1,0],[0,1,0],[0,1,0],[0,-1,0],[0,-1,0],[0,-1,0],[0,-1,0],[0,-1,0],[0,-1,0]]
	//[[0,1],[1,0],[1,1],[0,1],[0,0],[1,0],[1,1],[0,1],[0,0],[1,1],[0,0],[1,0],[0,1],[1,0],[1,1],[0,1],[0,0],[1,0],[1,1],[0,1],[0,0],[1,1],[0,0],[1,0],[0,1],[1,0],[1,1],[0,1],[0,0],[1,0],[1,1],[0,1],[0,0],[1,1],[0,0],[1,0]];
	buffers.normals = new Float32Array([-1,0,0,-1,0,0,-1,0,0,-1,0,0,-1,0,0,-1,0,0,1,0,0,1,0,0,1,0,0,1,0,0,1,0,0,1,0,0,0,0,1,0,0,1,0,0,1,0,0,1,0,0,1,0,0,1,0,0,-1,0,0,-1,0,0,-1,0,0,-1,0,0,-1,0,0,-1,0,1,0,0,1,0,0,1,0,0,1,0,0,1,0,0,1,0,0,-1,0,0,-1,0,0,-1,0,0,-1,0,0,-1,0,0,-1,0]);
	buffers.coords = new Float32Array([0,1,1,0,1,1,0,1,0,0,1,0,1,1,0,1,0,0,1,1,0,0,1,0,0,1,1,0,1,1,0,1,0,0,1,0,1,1,0,1,0,0,1,1,0,0,1,0,0,1,1,0,1,1,0,1,0,0,1,0,1,1,0,1,0,0,1,1,0,0,1,0]);

	if(options.wireframe)
		buffers.wireframe = new Uint16Array([0,2, 2,5, 5,4, 4,0,   6,7, 7,10, 10,11, 11,6, 0,6, 2,7, 5,10, 4,11  ]);

	options.bounding = BBox.fromCenterHalfsize( [0,0,0], [sizex,sizey,sizez] );

	return GL.Mesh.load(buffers, options, gl);
}

/**
* Returns a circle mesh 
* @method Mesh.circle
* @param {Object} options valid options: size,radius, xz = in xz plane, otherwise xy plane
*/
Mesh.circle = function( options, gl ) {
	options = options || {};
	var size = options.size || options.radius || 1;
	var slices = Math.ceil(options.slices || 24);
	var xz = options.xz || false;
	var empty = options.empty || false;
	if(slices < 3) slices = 3;
	var delta = (2 * Math.PI) / slices;

	var center = vec3.create();
	var A = vec3.create();
	var N = vec3.fromValues(0,0,1);
	var uv_center = vec2.fromValues(0.5,0.5);
	var uv = vec2.create();

	if(xz) N.set([0,1,0]);

	var index = xz ? 2 : 1;

	var vertices = new Float32Array(3 * (slices + 1));
	var normals = new Float32Array(3 * (slices + 1));
	var coords = new Float32Array(2 * (slices + 1));
	var triangles = null;

	//the center is always the same
	vertices.set(center, 0);
	normals.set(N, 0);
	coords.set(uv_center, 0);

	var sin = 0;
	var cos = 0;

	//compute vertices
	for(var i = 0; i < slices; ++i )
	{
		sin = Math.sin( delta * i );
		cos = Math.cos( delta * i );

		A[0] = sin * size;
		A[index] = cos * size;
		uv[0] = sin * 0.5 + 0.5;
		uv[1] = cos * 0.5 + 0.5;
		vertices.set(A, i * 3 + 3);
		normals.set(N, i * 3 + 3);
		coords.set(uv, i * 2 + 2);
	}

	if(empty)
	{
		vertices = vertices.subarray(3);
		normals = vertices.subarray(3);
		coords = vertices.subarray(2);
		triangles = null;
	}
	else
	{
		var triangles = new Uint16Array(3 * slices);
		var offset = 2;
		var offset2 = 1;
		if(xz)
		{
			offset = 1;
			offset2 = 2;
		}

		//compute indices
		for(var i = 0; i < slices-1; ++i )
		{
			triangles[i*3] = 0;
			triangles[i*3+1] = i+offset;
			triangles[i*3+2] = i+offset2;
		}

		triangles[i*3] = 0;
		if(xz)
		{
			triangles[i*3+1] = i+1;
			triangles[i*3+2] = 1;
		}
		else
		{
			triangles[i*3+1] = 1;
			triangles[i*3+2] = i+1;
		}
	}

	options.bounding = BBox.fromCenterHalfsize( [0,0,0], xz ? [size,0,size] : [size,size,0] );

	var buffers = {vertices: vertices, normals: normals, coords: coords, triangles: triangles};

	if(options.wireframe)
	{
		var wireframe = new Uint16Array(slices*2);
		for(var i = 0; i < slices; i++)
		{
			wireframe[i*2] = i;
			wireframe[i*2+1] = i+1;
		}
		wireframe[0] = slices;
		buffers.wireframe = wireframe;
	}

	return GL.Mesh.load( buffers, options, gl );
}

/**
* Returns a cube mesh 
* @method Mesh.cylinder
* @param {Object} options valid options: radius, height, subdivisions 
*/
Mesh.cylinder = function( options, gl ) {
	options = options || {};
	var radius = options.radius || options.size || 1;
	var height = options.height || options.size || 2;
	var subdivisions = options.subdivisions || 64;

	var vertices = new Float32Array(subdivisions * 6 * 3 * 2 );
	var normals = new Float32Array(subdivisions * 6 * 3 * 2 );
	var coords = new Float32Array(subdivisions * 6 * 2 * 2 );
	//not indexed because caps have different normals and uvs so...

	var delta = 2*Math.PI / subdivisions;
	var normal = null;
	for(var i = 0; i < subdivisions; ++i)
	{
		var angle = i * delta;

		normal = [ Math.sin(angle), 0, Math.cos(angle)];
		vertices.set([ normal[0]*radius, height*0.5, normal[2]*radius], i*6*3);
		normals.set(normal, i*6*3 );
		coords.set([i/subdivisions,1], i*6*2 );

		normal = [ Math.sin(angle), 0, Math.cos(angle)];
		vertices.set([ normal[0]*radius, height*-0.5, normal[2]*radius], i*6*3 + 3);
		normals.set(normal, i*6*3 + 3);
		coords.set([i/subdivisions,0], i*6*2 + 2);

		normal = [ Math.sin(angle+delta), 0, Math.cos(angle+delta)];
		vertices.set([ normal[0]*radius, height*-0.5, normal[2]*radius], i*6*3 + 6);
		normals.set(normal, i*6*3 + 6);
		coords.set([(i+1)/subdivisions,0], i*6*2 + 4);

		normal = [ Math.sin(angle+delta), 0, Math.cos(angle+delta)];
		vertices.set([ normal[0]*radius, height*0.5, normal[2]*radius], i*6*3 + 9);
		normals.set(normal, i*6*3 + 9);
		coords.set([(i+1)/subdivisions,1], i*6*2 + 6);

		normal = [ Math.sin(angle), 0, Math.cos(angle)];
		vertices.set([ normal[0]*radius, height*0.5, normal[2]*radius], i*6*3 + 12);
		normals.set(normal, i*6*3 + 12);
		coords.set([i/subdivisions,1], i*6*2 + 8);

		normal = [ Math.sin(angle+delta), 0, Math.cos(angle+delta)];
		vertices.set([ normal[0]*radius, height*-0.5, normal[2]*radius], i*6*3 + 15);
		normals.set(normal, i*6*3 + 15);
		coords.set([(i+1)/subdivisions,0], i*6*2 + 10);
	}

	var pos = i*6*3;
	var pos_uv = i*6*2;

	//caps
	if( options.caps === false )
	{
		vertices = vertices.subarray(0,pos);
		normals = normals.subarray(0,pos);
		coords = coords.subarray(0,pos_uv);
	}
	else
	{
		var top_center = vec3.fromValues(0,height*0.5,0);
		var bottom_center = vec3.fromValues(0,height*-0.5,0);
		var up = vec3.fromValues(0,1,0);
		var down = vec3.fromValues(0,-1,0);
		for(var i = 0; i < subdivisions; ++i)
		{
			var angle = i * delta;

			var uv = vec3.fromValues( Math.sin(angle), 0, Math.cos(angle) );
			var uv2 = vec3.fromValues( Math.sin(angle+delta), 0, Math.cos(angle+delta) );

			vertices.set([ uv[0]*radius, height*0.5, uv[2]*radius], pos + i*6*3);
			normals.set(up, pos + i*6*3 );
			coords.set( [ -uv[0] * 0.5 + 0.5,uv[2] * 0.5 + 0.5], pos_uv + i*6*2 );

			vertices.set([ uv2[0]*radius, height*0.5, uv2[2]*radius], pos + i*6*3 + 3);
			normals.set(up, pos + i*6*3 + 3 );
			coords.set( [ -uv2[0] * 0.5 + 0.5,uv2[2] * 0.5 + 0.5], pos_uv + i*6*2 + 2 );

			vertices.set( top_center, pos + i*6*3 + 6 );
			normals.set(up, pos + i*6*3 + 6);
			coords.set([0.5,0.5], pos_uv + i*6*2 + 4);
			
			//bottom
			vertices.set([ uv2[0]*radius, height*-0.5, uv2[2]*radius], pos + i*6*3 + 9);
			normals.set(down, pos + i*6*3 + 9);
			coords.set( [ uv2[0] * 0.5 + 0.5,uv2[2] * 0.5 + 0.5], pos_uv + i*6*2 + 6);

			vertices.set([ uv[0]*radius, height*-0.5, uv[2]*radius], pos + i*6*3 + 12);
			normals.set(down, pos + i*6*3 + 12 );
			coords.set( [ uv[0] * 0.5 + 0.5,uv[2] * 0.5 + 0.5], pos_uv + i*6*2 + 8 );

			vertices.set( bottom_center, pos + i*6*3 + 15 );
			normals.set( down, pos + i*6*3 + 15);
			coords.set( [0.5,0.5], pos_uv + i*6*2 + 10);
		}
	}

	var buffers = {
		vertices: vertices,
		normals: normals,
		coords: coords
	}
	options.bounding = BBox.fromCenterHalfsize( [0,0,0], [radius,height*0.5,radius] );

	return Mesh.load( buffers, options, gl );
}

/**
* Returns a cone mesh 
* @method Mesh.cone
* @param {Object} options valid options: radius, height, subdivisions 
*/
Mesh.cone = function( options, gl ) {
	options = options || {};
	var radius = options.radius || options.size || 1;
	var height = options.height || options.size || 2;
	var subdivisions = options.subdivisions || 64;

	var vertices = new Float32Array(subdivisions * 3 * 3 * 2);
	var normals = new Float32Array(subdivisions * 3 * 3 * 2);
	var coords = new Float32Array(subdivisions * 2 * 3 * 2);
	//not indexed because caps have different normals and uvs so...

	var delta = 2*Math.PI / subdivisions;
	var normal = null;
	var normal_y = radius / height;
	var up = [0,1,0];

	for(var i = 0; i < subdivisions; ++i)
	{
		var angle = i * delta;

		normal = [ Math.sin(angle+delta*0.5), normal_y, Math.cos(angle+delta*0.5)];
		vec3.normalize(normal,normal);
		//normal = up;
		vertices.set([ 0, height, 0] , i*6*3);
		normals.set(normal, i*6*3 );
		coords.set([i/subdivisions,1], i*6*2 );

		normal = [ Math.sin(angle), normal_y, Math.cos(angle)];
		vertices.set([ normal[0]*radius, 0, normal[2]*radius], i*6*3 + 3);
		vec3.normalize(normal,normal);
		normals.set(normal, i*6*3 + 3);
		coords.set([i/subdivisions,0], i*6*2 + 2);

		normal = [ Math.sin(angle+delta), normal_y, Math.cos(angle+delta)];
		vertices.set([ normal[0]*radius, 0, normal[2]*radius], i*6*3 + 6);
		vec3.normalize(normal,normal);
		normals.set(normal, i*6*3 + 6);
		coords.set([(i+1)/subdivisions,0], i*6*2 + 4);
	}

	var pos = 0;//i*3*3;
	var pos_uv = 0;//i*3*2;

	//cap
	var bottom_center = vec3.fromValues(0,0,0);
	var down = vec3.fromValues(0,-1,0);
	for(var i = 0; i < subdivisions; ++i)
	{
		var angle = i * delta;

		var uv = vec3.fromValues( Math.sin(angle), 0, Math.cos(angle) );
		var uv2 = vec3.fromValues( Math.sin(angle+delta), 0, Math.cos(angle+delta) );

		//bottom
		vertices.set([ uv2[0]*radius, 0, uv2[2]*radius], pos + i*6*3 + 9);
		normals.set(down, pos + i*6*3 + 9);
		coords.set( [ uv2[0] * 0.5 + 0.5,uv2[2] * 0.5 + 0.5], pos_uv + i*6*2 + 6);

		vertices.set([ uv[0]*radius, 0, uv[2]*radius], pos + i*6*3 + 12);
		normals.set(down, pos + i*6*3 + 12 );
		coords.set( [ uv[0] * 0.5 + 0.5,uv[2] * 0.5 + 0.5], pos_uv + i*6*2 + 8 );

		vertices.set( bottom_center, pos + i*6*3 + 15 );
		normals.set( down, pos + i*6*3 + 15);
		coords.set( [0.5,0.5], pos_uv + i*6*2 + 10);
	}

	var buffers = {
		vertices: vertices,
		normals: normals,
		coords: coords
	}
	options.bounding = BBox.fromCenterHalfsize( [0,height*0.5,0], [radius,height*0.5,radius] );

	return Mesh.load( buffers, options, gl );
}

/**
* Returns a sphere mesh 
* @method Mesh.sphere
* @param {Object} options valid options: radius, lat, long, subdivisions, hemi
*/
Mesh.sphere = function( options, gl ) {
	options = options || {};
	var radius = options.radius || options.size || 1;
	var latitudeBands = options.lat || options.subdivisions || 16;
	var longitudeBands = options["long"] || options.subdivisions || 16;

	var vertexPositionData = new Float32Array( (latitudeBands+1)*(longitudeBands+1)*3 );
	var normalData = new Float32Array( (latitudeBands+1)*(longitudeBands+1)*3 );
	var textureCoordData = new Float32Array( (latitudeBands+1)*(longitudeBands+1)*2 );
	var indexData = new Uint16Array( latitudeBands*longitudeBands*6 );
	var latRange = options.hemi ? Math.PI * 0.5 : Math.PI;

	var i = 0, iuv = 0;
	for (var latNumber = 0; latNumber <= latitudeBands; latNumber++)
	{
		var theta = latNumber * latRange / latitudeBands;
		var sinTheta = Math.sin(theta);
		var cosTheta = Math.cos(theta);

		for (var longNumber = 0; longNumber <= longitudeBands; longNumber++)
		{
			var phi = longNumber * 2 * Math.PI / longitudeBands;
			var sinPhi = Math.sin(phi);
			var cosPhi = Math.cos(phi);

			var x = cosPhi * sinTheta;
			var y = cosTheta;
			var z = sinPhi * sinTheta;
			var u = 1- (longNumber / longitudeBands);
			var v = (1 - latNumber / latitudeBands);

			vertexPositionData.set([radius * x,radius * y,radius * z],i);
			normalData.set([x,y,z],i);
			textureCoordData.set([u,v], iuv );
			i += 3;
			iuv += 2;
		}
	}

	i=0;
	for (var latNumber = 0; latNumber < latitudeBands; latNumber++)
	{
		for (var longNumber = 0; longNumber < longitudeBands; longNumber++)
		{
			var first = (latNumber * (longitudeBands + 1)) + longNumber;
			var second = first + longitudeBands + 1;

			indexData.set([second,first,first + 1], i);
			indexData.set([second + 1,second,first + 1], i+3);
			i += 6;
		}
	}

	var buffers = {
		vertices: vertexPositionData,
		normals: normalData,
		coords: textureCoordData,
		triangles: indexData
	};

	if(options.wireframe)
	{
		var wireframe = new Uint16Array(longitudeBands*latitudeBands*4);
		var pos = 0;
		for(var i = 0; i < latitudeBands; i++)
		{
			for(var j = 0; j < longitudeBands; j++)
			{
				wireframe[pos] = i*(longitudeBands+1) + j;
				wireframe[pos + 1] = i*(longitudeBands+1) + j + 1;
				pos += 2;
			}
			wireframe[pos - longitudeBands*2] = i*(longitudeBands+1) + j;
		}

		for(var i = 0; i < longitudeBands; i++)
		for(var j = 0; j < latitudeBands; j++)
		{
			wireframe[pos] = j*(longitudeBands+1) + i;
			wireframe[pos + 1] = (j+1)*(longitudeBands+1) + i;
			pos += 2;
		}
		buffers.wireframe = wireframe;
	}

	if(options.hemi)
		options.bounding = BBox.fromCenterHalfsize( [0,radius*0.5,0], [radius,radius*0.5,radius], radius );
	else
		options.bounding = BBox.fromCenterHalfsize( [0,0,0], [radius,radius,radius], radius );
	return GL.Mesh.load( buffers, options, gl );
}

/**
* Returns a grid mesh (must be rendered using gl.LINES)
* @method Mesh.grid
* @param {Object} options valid options: size, lines
*/
Mesh.grid = function( options, gl )
{
	options = options || {};
	var num_lines = options.lines || 11;
	if(num_lines < 0) 
		num_lines = 1;
	var size = options.size || 10;

	var vertexPositionData = new Float32Array( num_lines*2*2*3 );
	var hsize = size * 0.5;
	var pos = 0;
	var x = -hsize;
	var delta = size / (num_lines-1);

	for(var i = 0; i < num_lines; i++)
	{
		vertexPositionData[ pos ] = x;
		vertexPositionData[ pos+2 ] = -hsize;
		vertexPositionData[ pos+3 ] = x;
		vertexPositionData[ pos+5 ] = hsize;

		vertexPositionData[ pos+6 ] = hsize;
		vertexPositionData[ pos+8 ] = x
		vertexPositionData[ pos+9 ] = -hsize;
		vertexPositionData[ pos+11 ] = x

		x += delta;
		pos += 12;
	}

	return new GL.Mesh({vertices: vertexPositionData}, options, gl );
}


/**
* Returns a icosahedron mesh (useful to create spheres by subdivision)
* @method Mesh.icosahedron
* @param {Object} options valid options: radius, subdivisions (max: 6)
*/
Mesh.icosahedron = function( options, gl ) {
	options = options || {};
	var radius = options.radius || options.size || 1;
	var subdivisions = options.subdivisions === undefined ? 0 : options.subdivisions;
	if(subdivisions > 6) //dangerous
		subdivisions = 6;

	var t = (1.0 + Math.sqrt(5)) / 2.0;
	var vertices = [-1,t,0, 1,t,0, -1,-t,0, 1,-t,0,
					0,-1,t, 0,1,t, 0,-1,-t, 0,1,-t,
					t,0,-1, t,0,1, -t,0,-1, -t,0,1];
	var normals = [];
	var coords = [];
	var indices = [0,11,5, 0,5,1, 0,1,7, 0,7,10, 0,10,11, 1,5,9, 5,11,4, 11,10,2, 10,7,6, 7,1,8, 3,9,4, 3,4,2, 3,2,6, 3,6,8, 3,8,9, 4,9,5, 2,4,11, 6,2,10, 8,6,7, 9,8,1 ];

	//normalize
	var l = vertices.length;
	for(var i = 0; i < l; i+=3)
	{
		var mod = Math.sqrt( vertices[i]*vertices[i] + vertices[i+1]*vertices[i+1] + vertices[i+2]*vertices[i+2] );
		var normalx = vertices[i] / mod;
		var normaly = vertices[i+1] / mod;
		var normalz = vertices[i+2] / mod;
		normals.push( normalx, normaly, normalz );
		coords.push( Math.atan2( normalx, normalz ), Math.acos( normaly ) );
		vertices[i] *= radius/mod;
		vertices[i+1] *= radius/mod;
		vertices[i+2] *= radius/mod;
	}

	var middles = {};

	//A,B = index of vertex in vertex array
	function middlePoint( A, B )
	{
		var key = indices[A] < indices[B] ? indices[A] + ":"+indices[B] : indices[B]+":"+indices[A];
		var r = middles[key];
		if(r)
			return r;
		var index = vertices.length / 3;
		vertices.push(( vertices[ indices[A]*3] + vertices[ indices[B]*3   ]) * 0.5,
					(vertices[ indices[A]*3+1] + vertices[ indices[B]*3+1 ]) * 0.5,
					(vertices[ indices[A]*3+2] + vertices[ indices[B]*3+2 ]) * 0.5);

		var mod = Math.sqrt( vertices[index*3]*vertices[index*3] + vertices[index*3+1]*vertices[index*3+1] + vertices[index*3+2]*vertices[index*3+2] );
		var normalx = vertices[index*3] / mod;
		var normaly = vertices[index*3+1] / mod;
		var normalz = vertices[index*3+2] / mod;
		normals.push( normalx, normaly, normalz );
		coords.push( (Math.atan2( normalx, normalz ) / Math.PI) * 0.5, (Math.acos( normaly ) / Math.PI) );
		vertices[index*3] *= radius/mod;
		vertices[index*3+1] *= radius/mod;
		vertices[index*3+2] *= radius/mod;

		middles[key] = index;
		return index;
	}

	for (var iR = 0; iR < subdivisions; ++iR )
	{
		var new_indices = [];
		var l = indices.length;
		for(var i = 0; i < l; i+=3)
		{
			var MA = middlePoint( i, i+1 );
			var MB = middlePoint( i+1, i+2);
			var MC = middlePoint( i+2, i);
			new_indices.push(indices[i], MA, MC);
			new_indices.push(indices[i+1], MB, MA);
			new_indices.push(indices[i+2], MC, MB);
			new_indices.push(MA, MB, MC);
		}
		indices = new_indices;
	}

	options.bounding = BBox.fromCenterHalfsize( [0,0,0], [radius,radius,radius], radius );

	return new GL.Mesh.load({vertices: vertices, coords: coords, normals: normals, triangles: indices},options,gl);
}