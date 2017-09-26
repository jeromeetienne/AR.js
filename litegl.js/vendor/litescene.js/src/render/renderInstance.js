/**
* RenderInstance contains info of one object to be rendered on the scene.
* It shouldnt contain ids to resources (strings), instead if must contain the direct reference (to mesh, material)
*
* @class RenderInstance
* @namespace LS
* @constructor
*/

function RenderInstance( node, component )
{
	this.uid = LS.generateUId("RINS"); //unique identifier for this RI
	this.layers = 3; //in layer 1 and 2 by default
	this.index = -1; //used to know the rendering order

	//info about the mesh
	this.vertex_buffers = {};
	this.index_buffer = null;
	this.wireframe_index_buffer = null;
	this.range = new Int32Array([0,-1]); //start, offset
	this.primitive = GL.TRIANGLES;

	this.mesh = null; //shouldnt be used (buffers are added manually), but just in case
	this.collision_mesh = null; //in case of raycast

	//where does it come from
	this.node = node;
	this.component = component;
	this.priority = 10; //only used if the RenderQueue is in PRIORITY MODE, instances are rendered from higher to lower priority
	this.sort_mode = RenderInstance.NO_SORT;

	//transformation
	this.matrix = mat4.create();
	this.normal_matrix = mat4.create();
	this.center = vec3.create();

	//for visibility computation
	this.oobb = BBox.create(); //object space bounding box
	this.aabb = BBox.create(); //axis aligned bounding box

	//info about the material
	this.material = null; //the material, cannot be a string
	this.use_bounding = true; //in case it has vertex shader deformers the bounding box is not usable

	//for extra data for the shader
	this.query = new LS.ShaderQuery();
	this.uniforms = {};
	this.samplers = [];

	this.shader_block_flags = 0;
	this.shader_blocks = [];

	this.picking_node = null; //for picking

	//this.deformers = []; //TODO

	//TO DO: instancing
	//this.uniforms_instancing = {};

	//for internal use
	this._camera_visibility = 0; //tells in which camera was visible this instance during the last rendering (using bit operations)
	this._is_visible = false; //used during the rendering to mark if it was seen
	this._dist = 0; //computed during rendering, tells the distance to the current camera
	this._final_query = new LS.ShaderQuery();
}

RenderInstance.NO_SORT = 0;
RenderInstance.SORT_NEAR_FIRST = 1;
RenderInstance.SORT_FAR_FIRST = 2;

RenderInstance.prototype.fromNode = function(node)
{
	if(!node)
		throw("no node");
	this.node = node;
	if(node.transform)
		this.setMatrix( node.transform._global_matrix );
	else
		this.setMatrix( LS.IDENTITY );
	mat4.multiplyVec3( this.center, this.matrix, LS.ZEROS );
	this.layers = node.layers;
}

//set the matrix 
RenderInstance.prototype.setMatrix = function(matrix, normal_matrix)
{
	this.matrix.set( matrix );

	if( normal_matrix )
		this.normal_matrix.set( normal_matrix )
	else
		this.computeNormalMatrix();
}

/**
* Updates the normal matrix using the matrix
*
* @method computeNormalMatrix
*/
RenderInstance.prototype.computeNormalMatrix = function()
{
	var m = mat4.invert(this.normal_matrix, this.matrix);
	if(m)
		mat4.transpose(this.normal_matrix, m);
}

/**
* applies a transformation to the current matrix
*
* @method applyTransform
* @param {mat4} matrix
* @param {mat4} normal_matrix [optional]
*/
RenderInstance.prototype.applyTransform = function( matrix, normal_matrix )
{
	mat4.mul( this.matrix, this.matrix, matrix );
	if( normal_matrix )
		mat4.mul( this.normal_matrix, this.normal_matrix, normal_matrix );
	else
		this.computeNormalMatrix();
}

//set the material and apply material flags to render instance
RenderInstance.prototype.setMaterial = function(material)
{
	this.material = material;
	if(material && material.applyToRenderInstance)
		material.applyToRenderInstance(this);
}

//sets the buffers to render, the primitive, and the bounding
RenderInstance.prototype.setMesh = function(mesh, primitive)
{
	if( primitive == -1 || primitive === undefined )
		primitive = gl.TRIANGLES;
	this.primitive = primitive;

	if(mesh != this.mesh)
	{
		this.mesh = mesh;
		this.vertex_buffers = {};
	}

	if(!this.mesh)
		return;

	//this.vertex_buffers = mesh.vertexBuffers;
	for(var i in mesh.vertexBuffers)
		this.vertex_buffers[i] = mesh.vertexBuffers[i];

	switch(primitive)
	{
		case gl.TRIANGLES: 
			this.index_buffer = mesh.indexBuffers["triangles"]; //works for indexed and non-indexed
			break;
		case gl.LINES: 
			/*
			if(!mesh.indexBuffers["lines"])
				mesh.computeWireframe();
			*/
			this.index_buffer = mesh.indexBuffers["lines"];
			break;
		case 10:  //wireframe
			this.primitive = gl.LINES;
			if(!mesh.indexBuffers["wireframe"])
				mesh.computeWireframe();
			this.index_buffer = mesh.indexBuffers["wireframe"];
			break;

		case gl.POINTS: 
		default:
			this.index_buffer = null;
			break;
	}

	if(mesh.bounding)
	{
		this.oobb.set( mesh.bounding ); //copy
		this.use_bounding = true;
	}
	else
		this.use_bounding = false;
}

RenderInstance.prototype.setRange = function(start, offset)
{
	this.range[0] = start;
	this.range[1] = offset;
}

/**
* Enable flag in the flag bit field
*
* @method enableFlag
* @param {number} flag id
*/
RenderInstance.prototype.enableFlag = function(flag)
{
	this.flags |= flag;
}

/**
* Disable flag in the flag bit field
*
* @method enableFlag
* @param {number} flag id
*/
RenderInstance.prototype.disableFlag = function(flag)
{
	this.flags &= ~flag;
}

/**
* Tells if a flag is enabled
*
* @method enableFlag
* @param {number} flag id
* @return {boolean} flag value
*/
RenderInstance.prototype.isFlag = function(flag)
{
	return (this.flags & flag);
}

/**
* Computes the instance bounding box in world space from the one in local space
*
* @method updateAABB
*/
RenderInstance.prototype.updateAABB = function()
{
	BBox.transformMat4(this.aabb, this.oobb, this.matrix );
}

/**
* Used to update the RI info without having to go through the collectData process, it is faster but some changes may take a while
*
* @method update
*/
RenderInstance.prototype.update = function()
{
	if(!this.node || !this.node.transform)
		return;
	this.setMatrix( this.node.transform._global_matrix );
}

/**
* Calls render taking into account primitive and range
*
* @method render
* @param {Shader} shader
*/
RenderInstance.prototype.render = function(shader, primitive)
{
	//in case no normals found but they are required
	if(shader.attributes["a_normal"] && !this.vertex_buffers["normals"])
	{
		this.mesh.computeNormals();		
		this.vertex_buffers["normals"] = this.mesh.vertexBuffers["normals"];
	}

	//in case no coords found but they are required
	if(shader.attributes["a_coord"] && !this.vertex_buffers["coords"])
	{
		//this.mesh.computeTextureCoordinates();		
		//this.vertex_buffers["coords"] = this.mesh.vertexBuffers["coords"];
	}

	//in case no tangents found but they are required
	if(shader.attributes["a_tangent"] && !this.vertex_buffers["tangents"])
	{
		this.mesh.computeTangents();		
		this.vertex_buffers["tangents"] = this.mesh.vertexBuffers["tangents"];
	}

	//in case no secondary coords found but they are required
	if(shader.attributes["a_coord1"] && !this.vertex_buffers["coords1"])
	{
		this.mesh.createVertexBuffer("coords1",2, vertex_buffers["coords"].data );
		this.vertex_buffers["coords1"] = this.mesh.vertexBuffers["coords1"];
	}

	//in case no secondary coords found but they are required
	if(shader.attributes["a_extra"] && !this.vertex_buffers["extra"])
	{
		this.mesh.createVertexBuffer("a_extra", 1 );
		this.vertex_buffers["extra"] = this.mesh.vertexBuffers["extra"];
	}

	if(shader.attributes["a_extra2"] && !this.vertex_buffers["extra2"])
	{
		this.mesh.createVertexBuffer("a_extra2", 2 );
		this.vertex_buffers["extra2"] = this.mesh.vertexBuffers["extra2"];
	}

	if(shader.attributes["a_extra3"] && !this.vertex_buffers["extra3"])
	{
		this.mesh.createVertexBuffer("a_extra3", 3 );
		this.vertex_buffers["extra3"] = this.mesh.vertexBuffers["extra3"];
	}

	shader.drawBuffers( this.vertex_buffers,
	  this.index_buffer,
	  primitive !== undefined ? primitive : this.primitive,
	  this.range[0], this.range[1] );
}

RenderInstance.prototype.addShaderBlock = function( block, uniforms )
{
	if( block.flag_mask & this.shader_block_flags && uniforms === undefined )
		return;

	for(var i = 0; i < this.shader_blocks.length; ++i)
	{
		if(!this.shader_blocks[i])
			continue;
		if( this.shader_blocks[i].block == block )
		{
			if(uniforms !== undefined)
				this.shader_blocks[i].uniforms = uniforms;
			return i;
		}
	}
	this.shader_blocks.push( { block: block, uniforms: uniforms } );
	this.shader_block_flags |= block.flag_mask;
	return this.shader_blocks.length - 1;
}

RenderInstance.prototype.removeShaderBlock = function( block )
{
	if( ! (block.flag_mask & this.shader_block_flags) )
		return;

	for(var i = 0; i < this.shader_blocks.length; ++i)
	{
		if(!this.shader_blocks[i])
			continue;
		if( this.shader_blocks[i].block !== block )
			continue;

		this.shader_blocks.splice(i,1);
		this.shader_block_flags &= ~block.flag_mask;
		break;
	}
}

//checks the ShaderBlocks attached to this instance and resolves the flags
RenderInstance.prototype.computeShaderBlockFlags = function()
{
	return this.shader_block_flags;

	/*
	var r = 0;
	for(var i = 0; i < this.shader_blocks.length; ++i)
	{
		var shader_block = this.shader_blocks[i];
		if(!shader_block)
			continue;
		var block = this.shader_blocks[i].block;
		r |= block.flag_mask;
	}
	return r;
	*/
}

/*
RenderInstance.prototype.renderInstancing = function( shader )
{
	var instances_info = this.instances_info;

	var matrices = new Float32Array( instances_info.length * 16 );
	for(var j = 0; j < instances_info.length; ++j)
	{
		var matrix = instances_info[j].matrix;
		matrices.set( matrix, j*16 );
	}

	gl.bindBuffer(gl.ARRAY_BUFFER, matricesBuffer );
	gl.bufferData(gl.ARRAY_BUFFER, matrices, gl.STREAM_DRAW);

	// Bind the instance matrices data (mat4 behaves as 4 attributes)
	for(var k = 0; k < 4; ++k)
	{
		gl.enableVertexAttribArray( location+k );
		gl.vertexAttribPointer( location+k, 4, gl.FLOAT , false, 16*4, k*4*4 );
		ext.vertexAttribDivisorANGLE( location+k, 1 ); // This makes it instanced!
	}

	//gl.drawElements( gl.TRIANGLES, length, indexBuffer.buffer.gl_type, 0 ); //gl.UNSIGNED_SHORT
	ext.drawElementsInstancedANGLE( gl.TRIANGLES, length, indexBuffer.buffer.gl_type, 0, batch.length );
	GFX.stats.calls += 1;
	for(var k = 0; k < 4; ++k)
	{
		ext.vertexAttribDivisorANGLE( location+k, 0 );
		gl.disableVertexAttribArray( location+k );
	}
}
*/

RenderInstance.prototype.overlapsSphere = function( center, radius )
{
	//we dont know if the bbox of the instance is valid
	if( !this.use_bounding )
		return true;
	return geo.testSphereBBox( center, radius, this.aabb );
}

/**
* Checks if this object was visible by a camera during the last frame
*
* @method wasVisibleByCamera
* @param {LS.Camera} camera [optional] if a camera is supplied it checks if it was visible by that camera, otherwise tells you if it was visible by any camera
* @return {Boolean} true if it was visible by the camera (or any camera if no camera supplied), false otherwise
*/
RenderInstance.prototype.wasVisibleByCamera = function( camera )
{
	if(!camera)
		return this._camera_visibility != 0;
	return (this._camera_visibility | (1<<(camera._rendering_index))) ? true : false;
}

LS.RenderInstance = RenderInstance;