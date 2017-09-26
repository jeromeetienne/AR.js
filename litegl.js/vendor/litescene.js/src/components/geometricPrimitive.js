/**
* GeometricPrimitive renders a primitive
* @class GeometricPrimitive
* @constructor
* @param {String} object to configure from
*/

function GeometricPrimitive( o )
{
	this.enabled = true;
	this._size = 10;
	this._subdivisions = 10;
	this._geometry = GeometricPrimitive.CUBE;
	this._custom_mesh = null;
	this._primitive = -1; //GL.POINTS, GL.LINES, GL.TRIANGLES, etc...
	this._point_size = 0.1;

	this._version = 1;
	this._mesh_version = 0;

	if(o)
		this.configure(o);
}

Object.defineProperty( GeometricPrimitive.prototype, 'geometry', {
	get: function() { return this._geometry; },
	set: function(v) { 
		if( this._geometry == v )
			return;
		v = (v === undefined || v === null ? -1 : v|0);
		if( v < 0 || v > 100 )
			return;
		this._geometry = v;
		this._version++;
	},
	enumerable: true
});

Object.defineProperty( GeometricPrimitive.prototype, 'size', {
	get: function() { return this._size; },
	set: function(v) { 
		if( this._size == v )
			return;
		this._size = v;
		this._version++;
	},
	enumerable: true
});

Object.defineProperty( GeometricPrimitive.prototype, 'subdivisions', {
	get: function() { return this._subdivisions; },
	set: function(v) { 
		if( this._subdivisions == v )
			return;
		this._subdivisions = v;
		this._version++;
	},
	enumerable: true
});

Object.defineProperty( GeometricPrimitive.prototype, 'primitive', {
	get: function() { return this._primitive; },
	set: function(v) { 
		v = (v === undefined || v === null ? -1 : v|0);
		if(v != -1 && v != 0 && v!= 1 && v!= 4 && v!= 10)
			return;
		this._primitive = v;
	},
	enumerable: true
});

Object.defineProperty( GeometricPrimitive.prototype, 'point_size', {
	get: function() { return this._point_size; },
	set: function(v) { 
		if( this._point_size == v )
			return;
		this._point_size = v;
	},
	enumerable: true
});

GeometricPrimitive.CUBE = 1;
GeometricPrimitive.PLANE = 2;
GeometricPrimitive.CYLINDER = 3;
GeometricPrimitive.SPHERE = 4;
GeometricPrimitive.CIRCLE = 5;
GeometricPrimitive.HEMISPHERE = 6;
GeometricPrimitive.ICOSAHEDRON = 7;
GeometricPrimitive.CONE = 8;
GeometricPrimitive.QUAD = 9;
GeometricPrimitive.CUSTOM = 100;

//Warning : if you add more primitives, be careful with the setter, it doesnt allow values bigger than 7

GeometricPrimitive.icon = "mini-icon-cube.png";
GeometricPrimitive["@geometry"] = { type:"enum", values: {"Cube":GeometricPrimitive.CUBE, "Plane": GeometricPrimitive.PLANE, "Cylinder":GeometricPrimitive.CYLINDER, "Sphere":GeometricPrimitive.SPHERE, "Cone":GeometricPrimitive.CONE, "Icosahedron":GeometricPrimitive.ICOSAHEDRON, "Circle":GeometricPrimitive.CIRCLE, "Hemisphere":GeometricPrimitive.HEMISPHERE, "Quad": GeometricPrimitive.QUAD, "Custom": GeometricPrimitive.CUSTOM }};
GeometricPrimitive["@primitive"] = {widget:"enum", values: {"Default":-1, "Points": 0, "Lines":1, "Triangles":4, "Wireframe":10 }};
GeometricPrimitive["@subdivisions"] = { type:"number", step:1, min:1, precision: 0 };
GeometricPrimitive["@point_size"] = { type:"number", step:0.001 };

//we bind to onAddedToNode because the event is triggered per node so we know which RIs belong to which node
GeometricPrimitive.prototype.onAddedToNode = function( node )
{
	LEvent.bind( node, "collectRenderInstances", this.onCollectInstances, this);
}

GeometricPrimitive.prototype.onRemovedFromNode = function( node )
{
	LEvent.unbind( node, "collectRenderInstances", this.onCollectInstances, this);
}

GeometricPrimitive.prototype.serialize = function()
{
	var r = LS.Component.prototype.serialize.call(this);
	if(this._geometry == GeometricPrimitive.CUSTOM && this._custom_mesh)
		r.custom_mesh = this._custom_mesh.toJSON();

	return r;
}

GeometricPrimitive.prototype.configure = function(o)
{
	LS.Component.prototype.configure.call(this,o);

	//legacy
	if(this._geometry == GeometricPrimitive.PLANE && o.align_z === false )
		this._geometry = GeometricPrimitive.QUAD;

	if(o.geometry == GeometricPrimitive.CUSTOM && o.custom_mesh)
	{
		if(!this._custom_mesh)
			this._custom_mesh = new GL.Mesh();
		this._custom_mesh.fromJSON( o.custom_mesh );
	}

	this._version++;
}

GeometricPrimitive.prototype.updateMesh = function()
{
	var subdivisions = Math.max(0,this.subdivisions|0);

	switch (this._geometry)
	{
		case GeometricPrimitive.CUBE: 
			this._mesh = GL.Mesh.cube({size: this.size, normals:true,coords:true});
			break;
		case GeometricPrimitive.PLANE:
			this._mesh = GL.Mesh.plane({size: this.size, xz: true, detail: subdivisions, normals:true,coords:true});
			break;
		case GeometricPrimitive.CYLINDER:
			this._mesh = GL.Mesh.cylinder({size: this.size, subdivisions: subdivisions, normals:true,coords:true});
			break;
		case GeometricPrimitive.SPHERE:
			this._mesh = GL.Mesh.sphere({size: this.size, "long": subdivisions, lat: subdivisions, normals:true,coords:true});
			break;
		case GeometricPrimitive.CIRCLE:
			this._mesh = GL.Mesh.circle({size: this.size, slices: subdivisions, normals:true, coords:true});
			break;
		case GeometricPrimitive.HEMISPHERE:
			this._mesh = GL.Mesh.sphere({size: this.size, "long": subdivisions, lat: subdivisions, normals:true, coords:true, hemi: true});
			break;
		case GeometricPrimitive.ICOSAHEDRON:
			this._mesh = GL.Mesh.icosahedron({size: this.size, subdivisions:subdivisions });
			break;
		case GeometricPrimitive.CONE:
			this._mesh = GL.Mesh.cone({radius: this.size, height: this.size, subdivisions:subdivisions });
			break;
		case GeometricPrimitive.QUAD:
			this._mesh = GL.Mesh.plane({size: this.size, xz: false, detail: subdivisions, normals:true, coords:true });
			break;
		case GeometricPrimitive.CUSTOM:
			this._mesh = this._custom_mesh;
			break;
	}

	this._mesh_version = this._version;
}

/**
* Assigns a mesh as custom mesh and sets the geometry to CUSTOM
* @method setCustomMesh
* @param {GL.Mesh} mesh the mesh to use as custom mesh
*/
GeometricPrimitive.prototype.setCustomMesh = function( mesh )
{
	this._geometry = GeometricPrimitive.CUSTOM;
	this._custom_mesh = mesh;
	this._mesh = this._custom_mesh;
}

//GeometricPrimitive.prototype.getRenderInstance = function()
GeometricPrimitive.prototype.onCollectInstances = function(e, instances)
{
	if(!this.enabled)
		return;

	var mesh = null;
	if(!this._root)
		return;

	var RI = this._render_instance;
	if(!RI)
		this._render_instance = RI = new LS.RenderInstance(this._root, this);

	if(!this._mesh || this._version != this._mesh_version )
		this.updateMesh();

	if(!this._mesh) //could happend if custom mesh is null
		return;

	//assigns matrix, layers
	RI.fromNode( this._root );
	RI.setMesh( this._mesh, this._primitive );
	this._root.mesh = this._mesh;
	
	RI.setMaterial( this.material || this._root.getMaterial() );

	//remove one day...
	if(this.primitive == gl.POINTS)
	{
		RI.uniforms.u_point_size = this.point_size;
		RI.query.macros["USE_POINTS"] = "";
	}

	instances.push(RI);
}

LS.registerComponent( GeometricPrimitive );
