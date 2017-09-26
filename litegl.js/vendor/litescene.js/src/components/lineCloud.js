/* lineCloud.js */

function LineCloud(o)
{
	this.enabled = true;
	this.max_lines = 1024;
	this._lines = [];

	//material
	this.global_opacity = 1;
	this.color = vec3.fromValues(1,1,1);
	this.additive_blending = false;

	this.use_node_material = false; 
	this.premultiplied_alpha = false;
	this.in_world_coordinates = false;

	if(o)
		this.configure(o);

	this._last_id = 0;

	if(global.gl)
		this.createMesh();

	/*
	for(var i = 0; i < 2;i++)
	{
		var pos = vec3.random(vec3.create());
		vec3.scale(pos, pos, 100);
		this.addLine( [0,0,0], pos );
	}
	*/

}
LineCloud.icon = "mini-icon-lines.png";
LineCloud["@color"] = { widget: "color" };

Object.defineProperty( LineCloud.prototype, "num_lines", {
	set: function(v) {},
	get: function() { return this._lines.length; },
	enumerable: true
});

LineCloud.prototype.clear = function()
{
	this._lines.length = 0;
}

LineCloud.prototype.reset = LineCloud.prototype.clear;

//Adds a point connect to the last one
LineCloud.prototype.addPoint = function( point, color )
{
	//last
	var start = null;
	var start_color = null;
	if(this._lines.length)
	{
		var last = this._lines[ this._lines.length - 1 ];
		start = new Float32Array( last.subarray(3,6) );
		start_color = new Float32Array( last.subarray(10,14) );
	}
	else
	{
		start = point;
		start_color = color;
	}
	this.addLine( start, point, start_color, color );
}

LineCloud.prototype.addLine = function( start, end, start_color, end_color )
{
	var data = new Float32Array(3+3+4+4);
	data.set(start,0);
	data.set(end,3);

	if(start_color)
		data.set(start_color,6);
	else
		data.set([1,1,1,1],6);

	if(end_color)
		data.set(end_color,10);
	else if(start_color)
		data.set(start_color,10);
	else
		data.set([1,1,1,1],10);

	this._lines.push( data );
	this._must_update = true;

	return this._lines.length - 1;
}

LineCloud.prototype.setLine = function(id, start, end, start_color, end_color )
{
	var data = this._lines[id];

	if(start)
		data.set(start,0);
	if(end)
		data.set(end,3);

	if(start_color)
		data.set(start_color,6);
	if(end_color)
		data.set(end_color,10);

	this._must_update = true;
}

LineCloud.prototype.removeLine = function(id)
{
	this._lines.splice(id,1);
	this._must_update = true;
}


LineCloud.prototype.onAddedToNode = function(node)
{
	LEvent.bind(node, "collectRenderInstances", this.onCollectInstances, this);
}

LineCloud.prototype.onRemovedFromNode = function(node)
{
	LEvent.unbind(node, "collectRenderInstances", this.onCollectInstances, this);
}

LineCloud.prototype.onResourceRenamed = function (old_name, new_name, resource)
{
}

LineCloud.prototype.createMesh = function ()
{
	if( this._mesh_max_lines == this.max_lines) return;

	this._vertices = new Float32Array(this.max_lines * 3 * 2); 
	this._colors = new Float32Array(this.max_lines * 4 * 2);

	this._mesh = new GL.Mesh();
	this._mesh.addBuffers({ vertices:this._vertices, colors: this._colors }, null, gl.STREAM_DRAW);
	this._mesh_max_lines = this.max_lines;
}

LineCloud.prototype.updateMesh = function ()
{
	if( this._mesh_max_lines != this.max_lines)
		this.createMesh();

	//update mesh
	var i = 0, f = 0;
	var vertices = this._vertices;
	var colors = this._colors;

	var lines = this._lines;
	var l = this._lines.length;
	var vl = vertices.length;

	for(var i = 0; i < l; ++i)
	{
		if( i*6 >= vl) break; //too many lines
		var p = lines[i];

		vertices.set(p.subarray(0,6), i * 6);
		colors.set(p.subarray(6,14), i * 8);
	}

	//upload geometry
	this._mesh.vertexBuffers["vertices"].data = vertices;
	this._mesh.vertexBuffers["vertices"].upload();

	this._mesh.vertexBuffers["colors"].data = colors;
	this._mesh.vertexBuffers["colors"].upload();
}

LineCloud._identity = mat4.create();

LineCloud.prototype.onCollectInstances = function(e, instances, options)
{
	if(!this._root) return;

	if(this._lines.length == 0 || !this.enabled)
		return;

	var camera = Renderer._current_camera;

	if(this._must_update)
		this.updateMesh();

	if(!this._material)
	{
		this._material = new Material({ shader_name:"lowglobal" });
	}

	var material = this._material;

	material.color.set(this.color);
	material.opacity = this.global_opacity - 0.01; //try to keep it under 1
	material.blend_mode = this.additive_blending ? Blend.ADD : Blend.ALPHA;
	material.constant_diffuse = true;

	if(!this._mesh)
		return null;

	var RI = this._render_instance;
	if(!RI)
		this._render_instance = RI = new RenderInstance(this._root, this);

	if(this.in_world_coordinates && this._root.transform )
		RI.matrix.set( this._root.transform._global_matrix );
	else
		mat4.copy( RI.matrix, LineCloud._identity );

	var material = (this._root.material && this.use_node_material) ? this._root.getMaterial() : this._material;
	mat4.multiplyVec3(RI.center, RI.matrix, vec3.create());

	RI.setMaterial( material );
	RI.setMesh( this._mesh, gl.LINES );
	var primitives = this._lines.length * 2;
	if(primitives > this._vertices.length / 3)
		primitives = this._vertices.length / 3;
	RI.setRange(0,primitives);

	instances.push(RI);
}


LS.registerComponent( LineCloud );