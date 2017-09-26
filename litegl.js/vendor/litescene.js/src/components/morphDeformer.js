function MorphDeformer(o)
{
	this.enabled = true;
	this.mode = MorphDeformer.AUTOMATIC;

	this.morph_targets = [];

	if(global.gl)
	{
		if(MorphDeformer.max_supported_vertex_attribs === undefined)
			MorphDeformer.max_supported_vertex_attribs = gl.getParameter( gl.MAX_VERTEX_ATTRIBS );
		if(MorphDeformer.max_supported_morph_targets === undefined)
			MorphDeformer.max_supported_morph_targets = (gl.getParameter( gl.MAX_VERTEX_ATTRIBS ) - 6) / 2;
	}

	if(o)
		this.configure(o);
}

MorphDeformer.AUTOMATIC = 0;
MorphDeformer.CPU = 1;
MorphDeformer.STREAMS = 2;
MorphDeformer.TEXTURES = 3;

MorphDeformer.icon = "mini-icon-teapot.png";
MorphDeformer.force_GPU  = true; //used to avoid to recompile the shader when all morphs are 0
MorphDeformer["@mode"] = { type:"enum", values: {"automatic": MorphDeformer.AUTOMATIC, "CPU": MorphDeformer.CPU, "streams": MorphDeformer.STREAMS, "textures": MorphDeformer.TEXTURES }};

MorphDeformer.prototype.onAddedToNode = function(node)
{
	LEvent.bind( node, "collectRenderInstances", this.onCollectInstances, this );
}

MorphDeformer.prototype.onRemovedFromNode = function(node)
{
	LEvent.unbind( node, "collectRenderInstances", this.onCollectInstances, this );

	//disable
	if( this._last_RI )
		this.disableMorphingGPU( this._last_RI );
	this._last_RI = null;
}

MorphDeformer.prototype.getResources = function(res)
{
	if(this.morph_targets.length)
		for(var i = 0; i < this.morph_targets.length; ++i)
			if( this.morph_targets[i].mesh )
				res[ this.morph_targets[i].mesh ] = GL.Mesh;
}

MorphDeformer.prototype.onResourceRenamed = function (old_name, new_name, resource)
{
	if(this.morph_targets.length)
		for(var i = 0; i < this.morph_targets.length; ++i)
			if( this.morph_targets[i].mesh == old_name )
				this.morph_targets[i].mesh = new_name;
}

MorphDeformer.prototype.onCollectInstances = function( e, render_instances )
{
	if(!render_instances.length || MorphDeformer.max_supported_vertex_attribs < 16)
		return;

	var morph_RI = this.enabled ? render_instances[ render_instances.length - 1] : null;
	
	if( morph_RI != this._last_RI && this._last_RI )
		this.disableMorphingGPU( this._last_RI );
	this._last_RI = morph_RI;

	if( !morph_RI || !morph_RI.mesh)
		return;

	this._valid_morphs = this.computeValidMorphs( this._valid_morphs );

	//grab the RI created previously and modified
	//this.applyMorphTargets( last_RI );

	if(this.mode === MorphDeformer.AUTOMATIC )
	{
		if( this._morph_texture_supported === undefined )
			this._morph_texture_supported = (gl.extensions["OES_texture_float"] !== undefined && gl.getParameter( gl.MAX_VERTEX_TEXTURE_IMAGE_UNITS ) > 1);

		if( this._valid_morphs.length == 0 && !MorphDeformer.force_GPU )
			return;

		if( this._valid_morphs.length <= 4 ) //use GPU
			this.applyMorphTargetsByGPU( morph_RI, this._valid_morphs );
		else if( this._morph_texture_supported ) //use GPU with textures
			this.applyMorphUsingTextures( morph_RI, this._valid_morphs );
		else
			this.applyMorphBySoftware( morph_RI, this._valid_morphs );
	}
	else
	{
		switch( this.mode )
		{
			case MorphDeformer.STREAMS: this.applyMorphTargetsByGPU( morph_RI, this._valid_morphs ); break;
			case MorphDeformer.TEXTURES: this.applyMorphUsingTextures( morph_RI, this._valid_morphs ); break;
			default: this.applyMorphBySoftware( morph_RI, this._valid_morphs ); break;
		}
	}
}

//gather morph targets data
MorphDeformer.prototype.computeValidMorphs = function( valid_morphs )
{
	valid_morphs = valid_morphs || [];
	valid_morphs.length = 0;

	//sort by weight
	var morph_targets = this.morph_targets.concat();
	morph_targets.sort( function(a,b) { return Math.abs(b.weight) - Math.abs(a.weight);  } );

	//collect
	for(var i = 0; i < morph_targets.length; ++i)
	{
		var morph = morph_targets[i];
		if(!morph.mesh || Math.abs(morph.weight) < 0.001)
			continue;
		var morph_mesh = LS.ResourcesManager.resources[ morph.mesh ];
		if(!morph_mesh || morph_mesh.constructor !== GL.Mesh)
			continue;
		valid_morphs.push( { name: morph.mesh, weight: morph.weight, mesh: morph_mesh } );
	}

	return valid_morphs;
}

//add to the RI the info to apply the morphs using streams in the GPU
MorphDeformer.prototype.applyMorphTargetsByGPU = function( RI, valid_morphs )
{
	var base_mesh = RI.mesh;

	var base_vertices_buffer = base_mesh.vertexBuffers["vertices"];
	var streams_code = "";
	var morphs_buffers = {};
	var morphs_weights = [];

	//collect (max 4 if using streams)
	for(var i = 0; i < valid_morphs.length && i < 4; ++i)
	{
		var morph = valid_morphs[i];
		var morph_mesh = morph.mesh;

		var vertices_buffer = morph_mesh.vertexBuffers["vertices"];
		if(!vertices_buffer || vertices_buffer.data.length != base_vertices_buffer.data.length)
			continue;

		var normals_buffer = morph_mesh.vertexBuffers["normals"];
		if(!normals_buffer)
			continue;

		var vertices_cloned = vertices_buffer.clone(true);
		var normals_cloned = normals_buffer.clone(true);
		vertices_cloned.attribute = null;
		normals_cloned.attribute = null;

		morphs_buffers["a_vertex_morph" + i ] = vertices_cloned;
		morphs_buffers["a_normal_morph" + i ] = normals_cloned;

		morphs_weights.push( morph.weight );
	}

	//add buffers
	RI.vertex_buffers = {};
	for(var i in base_mesh.vertexBuffers)
		RI.vertex_buffers[i] = base_mesh.vertexBuffers[i];
	for(var i in morphs_buffers)
		RI.vertex_buffers[i] = morphs_buffers[i];

	RI.query.macros["USE_MORPHING_STREAMS"] = "";

	if(RI.query.macros["USE_MORPHING_TEXTURE"] !== undefined)
	{
		delete RI.query.macros["USE_MORPHING_TEXTURE"];
		delete RI.uniforms["u_morph_vertices_texture"];
		delete RI.uniforms["u_morph_normals_texture"];
		RI.samplers[ LS.Renderer.MORPHS_TEXTURE_SLOT ] = null;
		RI.samplers[ LS.Renderer.MORPHS_TEXTURE2_SLOT ] = null;
	}

	var weights = this._stream_weights;
	if(!weights)
		weights = this._stream_weights = new Float32Array( 4 );
	else if( !weights.fill ) //is an Array?
	{
		for(var i = 0; i < weights.length; ++i)
			weights[i] = 0;
	}
	else
		weights.fill(0); //fill first because morphs_weights could have zero length
	weights.set( morphs_weights );
	RI.uniforms["u_morph_weights"] = weights;

	//SHADER BLOCK
	RI.addShaderBlock( MorphDeformer.shader_block );
	RI.addShaderBlock( LS.MorphDeformer.morphing_streams_block, { u_morph_weights: weights } );
	RI.removeShaderBlock( LS.MorphDeformer.morphing_texture_block );
}

MorphDeformer.prototype.applyMorphUsingTextures = function( RI, valid_morphs )
{
	var base_mesh = RI.mesh;
	var base_vertices_buffer = base_mesh.vertexBuffers["vertices"];
	var base_normals_buffer = base_mesh.vertexBuffers["normals"];

	//create textures for the base mesh
	if(!base_vertices_buffer._texture)
		base_vertices_buffer._texture = this.createGeometryTexture( base_vertices_buffer );
	if(!base_normals_buffer._texture)
		base_normals_buffer._texture = this.createGeometryTexture( base_normals_buffer );

	//LS.RM.textures[":debug_base_vertex"] = base_vertices_buffer._texture;
	//LS.RM.textures[":debug_base_normal"] = base_normals_buffer._texture;


	var morphs_textures = [];

	//create the texture container where all will be merged
	if(!this._morphtarget_vertices_texture || this._morphtarget_vertices_texture.height != base_vertices_buffer._texture.height )
	{
		this._morphtarget_vertices_texture = new GL.Texture( base_vertices_buffer._texture.width, base_vertices_buffer._texture.height, { format: gl.RGB, type: gl.FLOAT, filter: gl.NEAREST, wrap: gl.CLAMP_TO_EDGE, no_flip: true });
		this._morphtarget_normals_texture = new GL.Texture( base_normals_buffer._texture.width, base_normals_buffer._texture.height, { format: gl.RGB, type: gl.FLOAT, filter: gl.NEAREST, wrap: gl.CLAMP_TO_EDGE, no_flip: true });

		//used in the shader
		this._texture_size = vec4.fromValues( this._morphtarget_vertices_texture.width, this._morphtarget_vertices_texture.height, 
			1 / this._morphtarget_vertices_texture.width, 1 / this._morphtarget_vertices_texture.height );

		//LS.RM.textures[":debug_morph_vertex"] = this._morphtarget_vertices_texture;
		//LS.RM.textures[":debug_morph_normal"] = this._morphtarget_normals_texture;
	}

	//prepare morph targets
	for(var i = 0; i < valid_morphs.length; ++i)
	{
		var morph = valid_morphs[i];
		var morph_mesh = morph.mesh;

		var vertices_buffer = morph_mesh.vertexBuffers["vertices"];
		if(!vertices_buffer || vertices_buffer.data.length != base_vertices_buffer.data.length)
			continue;

		var normals_buffer = morph_mesh.vertexBuffers["normals"];
		if(!normals_buffer)
			continue;

		//create texture
		if(!vertices_buffer._texture)
			vertices_buffer._texture = this.createGeometryTexture( vertices_buffer );
		if(!normals_buffer._texture)
			normals_buffer._texture = this.createGeometryTexture( normals_buffer );

		//LS.RM.textures[":debug_morph_vertex_" + i] = vertices_buffer._texture;
		//LS.RM.textures[":debug_morph_normal_" + i] = normals_buffer._texture;

		morphs_textures.push( { weight: morph.weight, vertices: vertices_buffer._texture, normals: normals_buffer._texture } );
	}

	//blend all morphs targets in one texture

	var shader = this.getMorphTextureShader();
	shader.uniforms({ u_base_texture: 0, u_morph_texture: 1 });

	gl.disable( gl.DEPTH_TEST );
	gl.enable( gl.BLEND );
	gl.blendFunc( gl.ONE, gl.ONE );

	base_vertices_buffer._texture.bind(0);
	var quad_mesh = GL.Mesh.getScreenQuad();

	this._morphtarget_vertices_texture.drawTo( function(){
		gl.clearColor( 0,0,0,0 );
		gl.clear( gl.COLOR_BUFFER_BIT );
		for(var i = 0; i < morphs_textures.length; ++i )
		{
			var stream_texture = morphs_textures[i].vertices;
			stream_texture.bind(1);
			shader.uniforms({ u_weight: morphs_textures[i].weight });
			shader.draw( quad_mesh, gl.TRIANGLES );
		}
	});

	base_normals_buffer._texture.bind(0);

	this._morphtarget_normals_texture.drawTo( function(){
		gl.clearColor( 0,0,0,0 );
		gl.clear( gl.COLOR_BUFFER_BIT );
		for(var i = 0; i < morphs_textures.length; ++i )
		{
			var stream_texture = morphs_textures[i].normals;
			stream_texture.bind(1);
			shader.uniforms({ u_weight: morphs_textures[i].weight });
			shader.draw( quad_mesh, gl.TRIANGLES );
		}
	});

	gl.disable( gl.BLEND );

	//create sequence numbers buffer of the same size
	var num_verts = base_vertices_buffer.data.length / 3;
	if(!this._ids_buffer || this._ids_buffer.data.length != num_verts )
	{
		var ids_data = new Float32Array( num_verts );
		for(var i = 0; i < num_verts; ++i)
			ids_data[i] = i;
		this._ids_buffer = new GL.Buffer( gl.ARRAY_BUFFER, ids_data, 1, gl.STATIC_DRAW );
		this._ids_buffer.attribute = "a_morphing_ids";
	}

	//modify the RI to have the displacement texture
	RI.uniforms["u_morph_vertices_texture"] = LS.Renderer.MORPHS_TEXTURE_SLOT;
	RI.samplers[ LS.Renderer.MORPHS_TEXTURE_SLOT ] = this._morphtarget_vertices_texture;

	RI.uniforms["u_morph_normals_texture"] = LS.Renderer.MORPHS_TEXTURE2_SLOT;
	RI.samplers[ LS.Renderer.MORPHS_TEXTURE2_SLOT ] = this._morphtarget_normals_texture;

	RI.uniforms["u_morph_texture_size"] = this._texture_size;

	//add the ids (the texture with 0,1,2, 3,4,5, ...)
	RI.vertex_buffers["a_morphing_ids"] = this._ids_buffer;

	//enable the algorithm
	delete RI.query.macros["USE_MORPHING_STREAMS"];
	RI.query.macros["USE_MORPHING_TEXTURE"] = "";

	//SHADER BLOCK
	RI.addShaderBlock( MorphDeformer.shader_block );
	RI.addShaderBlock( LS.MorphDeformer.morphing_texture_block, { 
				u_morph_vertices_texture: LS.Renderer.MORPHS_TEXTURE_SLOT, 
				u_morph_normals_texture: LS.Renderer.MORPHS_TEXTURE2_SLOT, 
				u_morph_texture_size: this._texture_size 
			});
	RI.removeShaderBlock( LS.MorphDeformer.morphing_streams_block );
}


MorphDeformer.prototype.disableMorphingGPU = function( RI )
{
	if( !RI || !RI.query )
		return;
	
	if ( RI.query.macros["USE_MORPHING_STREAMS"] !== undefined )
	{
		delete RI.query.macros["USE_MORPHING_STREAMS"];
		delete RI.uniforms["u_morph_weights"];
	}

	if( RI.query.macros["USE_MORPHING_TEXTURE"] !== undefined )
	{
		delete RI.query.macros["USE_MORPHING_TEXTURE"];
		RI.samplers[ LS.Renderer.MORPHS_TEXTURE_SLOT ] = null;
		RI.samplers[ LS.Renderer.MORPHS_TEXTURE2_SLOT ] = null;
		delete RI.uniforms["u_morph_vertices_texture"];
		delete RI.uniforms["u_morph_normals_texture"];
	}

	RI.removeShaderBlock( MorphDeformer.shader_block );
	RI.removeShaderBlock( LS.MorphDeformer.morphing_streams_block );
	RI.removeShaderBlock( LS.MorphDeformer.morphing_texture_block );
}

MorphDeformer.prototype.applyMorphBySoftware = function( RI, valid_morphs )
{
	var base_mesh = RI.mesh;
	var base_vertices_buffer = base_mesh.vertexBuffers["vertices"];

	this.disableMorphingGPU( RI ); //disable GPU version

	var key = ""; //used to avoid computing the mesh every frame

	//collect
	for(var i = 0; i < valid_morphs.length; ++i)
	{
		var morph = valid_morphs[i];
		key += morph.name + "|" + morph.weight.toFixed(2) + "|";
	}

	//to avoid recomputing if nothing has changed
	if(key == this._last_key)
	{
		//change the RI
		if(this._final_vertices_buffer)
			RI.vertex_buffers["vertices"] = this._final_vertices_buffer;
		if(this._final_normals_buffer)
			RI.vertex_buffers["normals"] = this._final_normals_buffer;
		return; 
	}
	this._last_key = key;

	var base_vertices_buffer = base_mesh.vertexBuffers["vertices"];
	var base_vertices = base_vertices_buffer.data;
	var base_normals_buffer = base_mesh.vertexBuffers["normals"];
	var base_normals = base_normals_buffer.data;

	//create final buffers
	if(!this._final_vertices || this._final_vertices.length != base_vertices.length )
	{
		this._final_vertices = new Float32Array( base_vertices.length );
		this._final_vertices_buffer = new GL.Buffer( gl.ARRAY_BUFFER, this._final_vertices, 3, gl.STREAM_DRAW );
		this._final_vertices_buffer.attribute = "a_vertex";
	}

	if(!this._final_normals || this._final_normals.length != base_normals.length )
	{
		this._final_normals = new Float32Array( base_normals.length );
		this._final_normals_buffer = new GL.Buffer( gl.ARRAY_BUFFER, this._final_normals, 3, gl.STREAM_DRAW );
		this._final_normals_buffer.attribute = "a_normal";
	}

	var vertices = this._final_vertices;
	var normals = this._final_normals;

	vertices.set( base_vertices );
	normals.set( base_normals );

	var morphs_vertices = [];
	var morphs_normals = [];
	var morphs_weights = [];
	var num_morphs = valid_morphs.length;

	for(var i = 0; i < valid_morphs.length; ++i)
	{
		var morph = valid_morphs[i];
		morphs_vertices.push( morph.mesh.vertexBuffers["vertices"].data );
		morphs_normals.push( morph.mesh.vertexBuffers["normals"].data );
		morphs_weights.push( morph.weight );
	}

	//fill them 
	for(var i = 0, l = vertices.length; i < l; i += 3)
	{
		var v = vertices.subarray(i,i+3);
		var n = normals.subarray(i,i+3);

		for(var j = 0; j < num_morphs; ++j)
		{
			var m_v = morphs_vertices[j];
			var m_n = morphs_normals[j];
			var w = morphs_weights[j];
			v[0] += (m_v[i] - base_vertices[i]) * w;
			v[1] += (m_v[i+1] - base_vertices[i+1]) * w;
			v[2] += (m_v[i+2] - base_vertices[i+2]) * w;
			n[0] += (m_n[i] - base_normals[i]) * w;
			n[1] += (m_n[i+1] - base_normals[i+1]) * w;
			n[2] += (m_n[i+2] - base_normals[i+2]) * w;
		}
	}

	this._final_vertices_buffer.upload(  gl.STREAM_DRAW );
	this._final_normals_buffer.upload(  gl.STREAM_DRAW );

	//change the RI
	RI.vertex_buffers["vertices"] = this._final_vertices_buffer;
	RI.vertex_buffers["normals"] = this._final_normals_buffer;

}




MorphDeformer._blend_shader_fragment_code = "\n\
	precision highp float;\n\
	uniform sampler2D u_base_texture;\n\
	uniform sampler2D u_morph_texture;\n\
	uniform float u_weight;\n\
	varying vec2 v_coord;\n\
	void main() {\n\
		gl_FragColor = u_weight * ( texture2D(u_morph_texture, v_coord) - texture2D(u_base_texture, v_coord) );\n\
		gl_FragColor.w = 1.0;\n\
	}\n\
";

MorphDeformer.prototype.getMorphTextureShader  = function()
{
	if(!this._blend_shader)
		this._blend_shader = new GL.Shader( Shader.SCREEN_VERTEX_SHADER, MorphDeformer._blend_shader_fragment_code );
	return this._blend_shader;
}

MorphDeformer.prototype.createGeometryTexture = function( data_buffer )
{
	var stream_data = data_buffer.data;
	var buffer = stream_data.buffer;

	var max_texture_size = gl.getParameter( gl.MAX_TEXTURE_SIZE );

	var num_floats = stream_data.length; 
	var num_vertex = num_floats / 3;
	var width = Math.min( max_texture_size, num_vertex );
	var height = Math.ceil( num_vertex / width );

	var buffer_padded = new Float32Array( width * height * 3 );
	buffer_padded.set( stream_data );
	
	var texture = new GL.Texture( width, height, { format: gl.RGB, type: gl.FLOAT, filter: gl.NEAREST, wrap: gl.CLAMP_TO_EDGE, pixel_data: buffer_padded, no_flip: true });
	return texture;
}

MorphDeformer.prototype.setMorphMesh = function(index, value)
{
	if(index >= this.morph_targets.length)
		return;
	this.morph_targets[index].mesh = value;
}

MorphDeformer.prototype.setMorphWeight = function(index, value)
{
	if(index >= this.morph_targets.length)
		return;
	this.morph_targets[index].weight = value;
}

MorphDeformer.prototype.getPropertyInfoFromPath = function( path )
{
	if(path[0] != "morphs")
		return;

	if(path.length == 1)
		return {
			node: this._root,
			target: this.morph_targets,
			type: "object"
		};

	var num = parseInt( path[1] );
	if(num >= this.morph_targets.length)
		return;

	var varname = path[2];
	if(varname != "mesh" && varname != "weight")
		return;

	return {
		node: this._root,
		target: this.morph_targets[num],
		name: varname,
		value: this.morph_targets[num][ varname ] !== undefined ? this.morph_targets[num][ varname ] : null,
		type: varname == "mesh" ? "mesh" : "number"
	};
}

MorphDeformer.prototype.setPropertyValueFromPath = function( path, value, offset )
{
	offset = offset || 0;

	if( path.length < (offset+1) )
		return;

	if( path[offset] != "morphs" )
		return;

	var num = parseInt( path[offset+1] );
	if(num >= this.morph_targets.length)
		return;

	var varname = path[offset+2];
	this.morph_targets[num][ varname ] = value;
}

//used for graphs
MorphDeformer.prototype.setProperty = function(name, value)
{
	if( name == "enabled" )
		this.enabled = value;
	else if( name.substr(0,5) == "morph" )
	{
		name = name.substr(5);
		var t = name.split("_");
		var num = parseInt( t[0] );
		if( num < this.morph_targets.length )
		{
			if( t[1] == "weight" )
				this.morph_targets[ num ].weight = value;
			else if( t[1] == "mesh" )
				this.morph_targets[ num ].mesh = value;
		}
	}
}


MorphDeformer.prototype.getPropertiesInfo = function()
{
	var properties = {
		enabled: "boolean"
	};

	for(var i = 0; i < this.morph_targets.length; i++)
	{
		properties[ "morph" + i + "_weight" ] = "number";
		properties[ "morph" + i + "_mesh" ] = "Mesh";
	}

	return properties;
}

MorphDeformer.prototype.optimizeMorphTargets = function()
{
	for(var i = 0; i < this.morph_targets.length; ++i)
	{
		var morph = this.morph_targets[i];
		var mesh = LS.ResourcesManager.meshes[ morph.mesh ];
		if(!mesh)
			continue;
		
		//remove data not used 
		mesh.removeVertexBuffer("coords", true);
		mesh.removeIndexBuffer("triangles", true);
		mesh.removeIndexBuffer("wireframe", true);

		LS.ResourcesManager.resourceModified( mesh );
	}

	console.log("Morph targets optimized");
}


LS.registerComponent( MorphDeformer );
LS.MorphDeformer = MorphDeformer;

//SHADER BLOCKS ******************************************

MorphDeformer.morph_streams_enabled_shader_code = "\n\
	\n\
	//max vertex attribs are 16 usually, so 10 are available after using 6 for V,N,UV,UV2,BW,BI\n\
	attribute vec3 a_vertex_morph0;\n\
	attribute vec3 a_normal_morph0;\n\
	attribute vec3 a_vertex_morph1;\n\
	attribute vec3 a_normal_morph1;\n\
	attribute vec3 a_vertex_morph2;\n\
	attribute vec3 a_normal_morph2;\n\
	attribute vec3 a_vertex_morph3;\n\
	attribute vec3 a_normal_morph3;\n\
	\n\
	uniform vec4 u_morph_weights;\n\
	\n\
	void applyMorphing( inout vec4 position, inout vec3 normal )\n\
	{\n\
		vec3 original_vertex = position.xyz;\n\
		vec3 original_normal = normal.xyz;\n\
		\n\
		if(u_morph_weights[0] != 0.0)\n\
		{\n\
			position.xyz += (a_vertex_morph0 - original_vertex) * u_morph_weights[0]; normal.xyz += (a_normal_morph0 - original_normal) * u_morph_weights[0];\n\
		}\n\
		if(u_morph_weights[1] != 0.0)\n\
		{\n\
			position.xyz += (a_vertex_morph1 - original_vertex) * u_morph_weights[1]; normal.xyz += (a_normal_morph1 - original_normal) * u_morph_weights[1];\n\
		}\n\
		if(u_morph_weights[2] != 0.0)\n\
		{\n\
			position.xyz += (a_vertex_morph2 - original_vertex) * u_morph_weights[2]; normal.xyz += (a_normal_morph2 - original_normal) * u_morph_weights[2];\n\
		}\n\
		if(u_morph_weights[3] != 0.0)\n\
		{\n\
			position.xyz += (a_vertex_morph3 - original_vertex) * u_morph_weights[3]; normal.xyz += (a_normal_morph3 - original_normal) * u_morph_weights[3];\n\
		}\n\
	}\n\
";

MorphDeformer.morph_texture_enabled_shader_code = "\n\
	\n\
	attribute float a_morphing_ids;\n\
	\n\
	uniform sampler2D u_morph_vertices_texture;\n\
	uniform sampler2D u_morph_normals_texture;\n\
	uniform vec4 u_morph_texture_size;\n\
	\n\
	uniform vec4 u_morph_weights;\n\
	\n\
	void applyMorphing( inout vec4 position, inout vec3 normal )\n\
	{\n\
		vec2 coord;\n\
		coord.x = ( mod( a_morphing_ids, u_morph_texture_size.x ) + 0.5 ) / u_morph_texture_size.x;\n\
		coord.y = 1.0 - ( floor( a_morphing_ids / u_morph_texture_size.x ) + 0.5 ) / u_morph_texture_size.y;\n\
		position.xyz += texture2D( u_morph_vertices_texture, coord ).xyz;\n\
		normal.xyz += texture2D( u_morph_normals_texture, coord ).xyz;\n\
	}\n\
";

MorphDeformer.morph_enabled_shader_code = "\n\
	\n\
	#pragma shaderblock morphing_mode\n\
";


MorphDeformer.morph_disabled_shader_code = "\nvoid applyMorphing( inout vec4 position, inout vec3 normal ) {}\n";

// ShaderBlocks used to inject to shader in runtime
var morphing_block = new LS.ShaderBlock("morphing");
morphing_block.addCode( GL.VERTEX_SHADER, MorphDeformer.morph_enabled_shader_code, MorphDeformer.morph_disabled_shader_code );
morphing_block.register();
MorphDeformer.shader_block = morphing_block;

var morphing_streams_block = new LS.ShaderBlock("morphing_streams");
morphing_streams_block.defineContextMacros( { "morphing_mode": "morphing_streams"} );
morphing_streams_block.addCode( GL.VERTEX_SHADER, MorphDeformer.morph_streams_enabled_shader_code, MorphDeformer.morph_disabled_shader_code );
morphing_streams_block.register();
MorphDeformer.morphing_streams_block = morphing_streams_block;

var morphing_texture_block = new LS.ShaderBlock("morphing_texture");
morphing_texture_block.defineContextMacros( { "morphing_mode": "morphing_texture"} );
morphing_texture_block.addCode( GL.VERTEX_SHADER, MorphDeformer.morph_texture_enabled_shader_code, MorphDeformer.morph_disabled_shader_code );
morphing_texture_block.register();
MorphDeformer.morphing_texture_block = morphing_texture_block;