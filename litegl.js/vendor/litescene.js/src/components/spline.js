/**
* Spline allows to define splines in 3D
* @class Spline
* @constructor
* @param {String} object to configure from
*/

function Spline( o )
{
	this.enabled = true;
	this._render_in_viewport = false;
	this.path = new LS.Path();
	this._type = LS.Path.LINE;
	this._must_update = false;

	if(o)
		this.configure(o);

	this._max_points = 1024;
	this._range = 0;
}

Object.defineProperty( Spline.prototype, 'render_in_viewport', {
	get: function() { return this._render_in_viewport; },
	set: function(v) { 
		if(this._render_in_viewport == v)
			return;
		this._render_in_viewport = v;
		//set events
		if(!this._root || !this._root.scene)
			return;
		if(v)
			LEvent.bind( this._root.scene, "collectRenderInstances", this.onCollectInstances, this );
		else
			LEvent.unbind( this._root.scene, "collectRenderInstances", this.onCollectInstances, this );
	},
	enumerable: true
});

Object.defineProperty( Spline.prototype, 'type', {
	get: function() { return this.path.type; },
	set: function(v) { 
		this.path.type = v;
		this._must_update = true;
	},
	enumerable: true
});


Spline["@type"] = { type: "enum", values: { line: LS.Path.LINE, spline: LS.Path.SPLINE, bezier: LS.Path.BEZIER } };

Spline.prototype.onAddedToScene = function(scene)
{
	if(this._render_in_viewport)
		LEvent.bind( this._root.scene, "collectRenderInstances", this.onCollectInstances, this );
}

Spline.prototype.onRemovedFromScene = function(scene)
{
	if(this._render_in_viewport)
		LEvent.unbind( this._root.scene, "collectRenderInstances", this.onCollectInstances, this );
}

Spline.prototype.onCollectInstances = function(e, instances)
{
	if(!this.enabled)
		return;

	if(!this._root)
		return;

	if(this.path.getSegments() == 0)
		return;

	if(!this._mesh || this._must_update)
		this.updateMesh();

	var RI = this._render_instance;
	if(!RI)
		this._render_instance = RI = new LS.RenderInstance(this._root, this);

	if(this._root.transform)
		this._root.transform.getGlobalMatrix( RI.matrix );
	RI.setMatrix( RI.matrix ); //force normal
	//mat4.multiplyVec3( RI.center, RI.matrix, vec3.create() );
	mat4.getTranslation( RI.center, RI.matrix );
	RI.setMesh( this._mesh, gl.LINE_STRIP );
	RI.setRange( 0, this._range );
	RI.flags = RI_DEFAULT_FLAGS;
	RI.applyNodeFlags();
	RI.setMaterial( this.material || this._root.getMaterial() );

	instances.push(RI);	
}

Spline.prototype.updateMesh = function()
{
	if(!this._mesh)
		this._mesh = GL.Mesh.load( { vertices: new Float32Array( this._max_points * 3 ) } );
	
	var vertices_buffer = this._mesh.getVertexBuffer("vertices");
	var vertices_data = vertices_buffer.data;

	var total = 0;

	if(this.path.type == LS.Path.LINE)
		total = this.path.getSegments() + 1;
	else
		total = this.path.getSegments() * 10; //10 points per segment

	if(total > this._max_points)
		total = this._max_points;

	this.path.samplePointsTyped( total, vertices_data );
	vertices_buffer.upload( gl.STREAM_TYPE );

	this._range = total;

	this._must_update = false;
}

Spline.prototype.addPoint = function( point )
{
	this.path.addPoint( point );
	this._must_update = true;
}

//not finished yet
//LS.registerComponent( Spline );