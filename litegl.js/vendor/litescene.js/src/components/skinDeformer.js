
/**
* It applyes skinning to a RenderInstance created by another component (usually MeshRenderer)
* Is in charge of gathering the bone nodes and adding to the RenderInstance the information needed to perform the skinning
* It can do it using shader uniforms (simple way), a matrices texture (complex way), or by directly applying skinning by software (slow but well supported way)
* It also allow to limit the bone search to specific nodes.
*
* @class SkinDeformer
* @constructor
*/
function SkinDeformer( o )
{
	this.enabled = true;
	this.search_bones_in_parent = true;
	this.skeleton_root_node = null;
	this.cpu_skinning = false;
	this.ignore_transform = true;

	this._mesh = null;
	this._last_bones = null;
	//this._skinning_mode = 0;

	//check how many floats can we put in a uniform
	if(!SkinDeformer._initialized && global.gl )
	{
		SkinDeformer.num_supported_uniforms = gl.getParameter( gl.MAX_VERTEX_UNIFORM_VECTORS );
		SkinDeformer.num_supported_textures = gl.getParameter( gl.MAX_VERTEX_TEXTURE_IMAGE_UNITS );
		//check if GPU skinning is supported
		if( SkinDeformer.num_supported_uniforms < SkinDeformer.MAX_BONES*3 && SkinDeformer.num_supported_textures == 0)
			SkinDeformer.gpu_skinning_supported = false;
		SkinDeformer._initialized = true;
	}

	if(o)
		this.configure(o);

	//this._deformer = new LS.Deformer();
}

SkinDeformer.icon = "mini-icon-stickman.png";

SkinDeformer.MAX_BONES = 64;
SkinDeformer.MAX_TEXTURE_BONES = 128; //do not change this, hardcoded in the shader
SkinDeformer.gpu_skinning_supported = true;
SkinDeformer.icon = "mini-icon-stickman.png";
SkinDeformer.apply_to_normals_by_software = false;

SkinDeformer["@skeleton_root_node"] = { type: LS.TYPES.SCENENODE };

SkinDeformer.prototype.onAddedToNode = function(node)
{
	LEvent.bind(node, "collectRenderInstances", this.onCollectInstances, this);
}

SkinDeformer.prototype.onRemovedFromNode = function(node)
{
	LEvent.unbind(node, "collectRenderInstances", this.onCollectInstances, this);
}

//returns the bone node taking into account the scoping of the component
SkinDeformer.prototype.getBoneNode = function( name )
{
	var root_node = this._root;
	var scene = root_node.scene;
	if(!scene)
		return null;

	var node = null;

	if( this.skeleton_root_node )
	{
		root_node = scene.getNode( this.skeleton_root_node );
		if(root_node)
			return root_node.findNodeByName( name );
	}
	else if(this.search_bones_in_parent)
	{
		return root_node.parentNode.findNode( name );
	}
	else
		return scene.getNode( name );
	return null;
}

//returns a reference to the global matrix of the bone
SkinDeformer.prototype.getBoneMatrix = function( name )
{
	var node = this.getBoneNode( name );
	if(!node)
		return null;
	node._is_bone = true;
	return node.transform.getGlobalMatrixRef();
}

//checks the list of bones in mesh.bones and retrieves its matrices
SkinDeformer.prototype.getBoneMatrices = function( ref_mesh )
{
	//bone matrices
	var bones = this._last_bones;

	//reuse bone matrices
	if(!this._last_bones || this._last_bones.length != ref_mesh.bones.length )
	{
		bones = this._last_bones = [];
		for(var i = 0; i < ref_mesh.bones.length; ++i)
			bones[i] = mat4.create();
	}

	for(var i = 0; i < ref_mesh.bones.length; ++i)
	{
		var m = bones[i]; //mat4.create();
		var joint = ref_mesh.bones[i];
		var mat = this.getBoneMatrix( joint[0] ); //get the current matrix from the bone Node transform
		if(!mat)
		{
			mat4.identity( m );
		}
		else
		{
			var inv = joint[1];
			mat4.multiply( m, mat, inv );
			if(ref_mesh.bind_matrix)
				mat4.multiply( m, m, ref_mesh.bind_matrix);
		}

		//bones[i].push( m ); //multiply by the inv bindpose matrix
	}

	return bones;
}

//Adds the deforming data to the last RenderInstance
SkinDeformer.prototype.onCollectInstances = function( e, render_instances )
{
	if(!render_instances.length)
		return;

	if(!this.root)
		return;

	var last_RI;

	//get index
	var index = this.root.getIndexOfComponent(this);
	var prev_comp = this.root.getComponentByIndex( index - 1);
	if(prev_comp)
		last_RI = prev_comp._RI;

	if(!last_RI)
		return;

	//take last one (although maybe using this._root.instances ...)
	//last_RI = render_instances[ render_instances.length - 1];
	
	if(!this.enabled)
	{
		//disable
		this.disableSkinning( last_RI );
		return;
	}

	//grab the RI created previously and modified
	this.applySkinning( last_RI );
}

/*
SkinDeformer.prototype.setBonesToBindPose = function()
{
	//bone matrices
	var bones = this._last_bones;
	if( !bones || !this._mesh || !this._mesh.bones )
		return;

	var mesh = this._mesh;
	var m = mat4.create();

	for(var i = 0; i < mesh.bones.length; ++i)
	{
		var m = bones[i]; //mat4.create();
		var joint = mesh.bones[i];
		var bone_node = this.getBoneNode( joint[0] );
		if(!bone_node)
			continue;
		mat4.invert( m, joint[1] ); //invert first
		if(mesh.bind_matrix)
			mat4.multiply( m, m, mesh.bind_matrix);
		bone_node.transform.matrix = m;
	}
}
*/

//Applies skinning taking into account the options available (using uniforms, a texture or applying it by software)
SkinDeformer.prototype.applySkinning = function(RI)
{
	var mesh = RI.mesh;
	this._mesh = mesh;

	//this mesh doesnt have skinning info
	if(!mesh.getBuffer("vertices") || !mesh.getBuffer("bone_indices"))
		return;

	
	if( SkinDeformer.gpu_skinning_supported && !this.cpu_skinning ) 
	{
		//add skinning
		RI.query.macros["USE_SKINNING"] = "";
		
		//retrieve all the bones
		var bones = this.getBoneMatrices( mesh );
		var bones_size = bones.length * 12;
		if(!bones.length)
		{
			console.warn("SkinDeformer.prototype.applySkinning: Bones not found");
			return;
		}

		var u_bones = this._u_bones;
		if(!u_bones || u_bones.length != bones_size)
			this._u_bones = u_bones = new Float32Array( bones_size );

		//pack the bones in one single array (also skip the last row, is always 0,0,0,1)
		for(var i = 0; i < bones.length; i++)
		{
			mat4.transpose( bones[i], bones[i] );
			u_bones.set( bones[i].subarray(0,12), i * 12, (i+1) * 12 );
		}

		//can we pass the bones as a uniform?
		if( SkinDeformer.num_supported_uniforms >= bones_size )
		{
			//upload the bones as uniform (faster but doesnt work in all GPUs)
			RI.uniforms["u_bones"] = u_bones;
			if(bones.length > SkinDeformer.MAX_BONES)
				RI.query.macros["MAX_BONES"] = bones.length.toString();
			RI.samplers[ LS.Renderer.BONES_TEXTURE_SLOT ] = null;

			RI.addShaderBlock( LS.SkinDeformer.skinning_uniforms_block, { u_bones: u_bones } );
		}
		else if( SkinDeformer.num_supported_textures > 0 ) //upload the bones as a float texture (slower)
		{
			var texture = this._bones_texture;
			if(!texture)
			{
				//TODO: to support more bones you could use a Nx3 texture instead of a 1x(N*3) 
				texture = this._bones_texture = new GL.Texture( 1, SkinDeformer.MAX_TEXTURE_BONES * 3, { format: gl.RGBA, type: gl.FLOAT, filter: gl.NEAREST} ); //3 rows of 4 values per matrix
				texture._data = new Float32Array( texture.width * texture.height * 4 );
			}

			texture._data.set( u_bones );

			texture.uploadData( texture._data, { no_flip: true } );
			LS.RM.textures[":bones_" + this.uid ] = texture; //debug
			RI.uniforms["u_bones"] = LS.Renderer.BONES_TEXTURE_SLOT;
			RI.query.macros["USE_SKINNING_TEXTURE"] = "";
			RI.samplers[ LS.Renderer.BONES_TEXTURE_SLOT ] = texture; //{ texture: texture, magFilter: gl.NEAREST, minFilter: gl.NEAREST, wrap: gl.CLAMP_TO_EDGE };

			RI.addShaderBlock( LS.SkinDeformer.skinning_texture_block, { u_bones: LS.Renderer.BONES_TEXTURE_SLOT } );
		}
		else
			console.error("impossible to get here");

		RI.addShaderBlock( LS.SkinDeformer.skinning_block );
	}
	else //cpu skinning (mega slow)
	{
		if(!this._skinned_mesh || this._skinned_mesh._reference != mesh)
		{
			this._skinned_mesh = new GL.Mesh();
			this._skinned_mesh._reference = mesh;
			var vertex_buffer = mesh.getBuffer("vertices");
			var normal_buffer = mesh.getBuffer("normals");

			//clone 
			for (var i in mesh.vertexBuffers)
				this._skinned_mesh.vertexBuffers[i] = mesh.vertexBuffers[i];
			for (var i in mesh.indexBuffers)
				this._skinned_mesh.indexBuffers[i] = mesh.indexBuffers[i];

			//new ones clonning old ones
			this._skinned_mesh.createVertexBuffer("vertices","a_vertex", 3, new Float32Array( vertex_buffer.data ), gl.STREAM_DRAW );
			if(normal_buffer)
				this._skinned_mesh.createVertexBuffer("normals","a_normal", 3, new Float32Array( normal_buffer.data ), gl.STREAM_DRAW );
		}


		//apply cpu skinning
		this.applySoftwareSkinning( mesh, this._skinned_mesh );

		RI.setMesh( this._skinned_mesh, this.primitive );
		//remove the flags to avoid recomputing shaders
		delete RI.query.macros["USE_SKINNING"]; 
		delete RI.query.macros["USE_SKINNING_TEXTURE"];
		RI.samplers[ LS.Renderer.BONES_TEXTURE_SLOT ] = null;
	}

	if( this.ignore_transform )
	{
		mat4.identity( RI.matrix );
		RI.normal_matrix.set( RI.matrix );
	}
	else
		this._root.transform.getGlobalMatrix( RI.matrix );
	mat4.multiplyVec3( RI.center, RI.matrix, vec3.create() );

	RI.use_bounding = false;
}

SkinDeformer.prototype.disableSkinning = function( RI )
{
	this._mesh = null;

	if( RI.query.macros["USE_SKINNING"] !== undefined )
	{
		delete RI.query.macros["USE_SKINNING"]; 
		delete RI.query.macros["USE_SKINNING_TEXTURE"];
		delete RI.samplers["u_bones"];
	}

	RI.removeShaderBlock( LS.SkinDeformer.skinning_block );
	RI.removeShaderBlock( LS.SkinDeformer.skinning_uniforms_block );
	RI.removeShaderBlock( LS.SkinDeformer.skinning_texture_block );
}

SkinDeformer.prototype.getMesh = function()
{
	return this._mesh;
}

//Takes every vertex and multiplyes it by its bone matrices (slow but it works everywhere)
SkinDeformer.prototype.applySoftwareSkinning = function(ref_mesh, skin_mesh)
{
	var original_vertices = ref_mesh.getBuffer("vertices").data;
	var original_normals = null;
	if(ref_mesh.getBuffer("normals"))
		original_normals = ref_mesh.getBuffer("normals").data;

	var weights = ref_mesh.getBuffer("weights").data;
	var bone_indices = ref_mesh.getBuffer("bone_indices").data;

	var vertices_buffer = skin_mesh.getBuffer("vertices");
	var vertices = vertices_buffer.data;

	var normals_buffer = null;
	var normals = null;

	if(!SkinDeformer.zero_matrix)
		SkinDeformer.zero_matrix = new Float32Array(16);
	var zero_matrix = SkinDeformer.zero_matrix;

	if(original_normals)
	{
		normals_buffer = skin_mesh.getBuffer("normals");
		normals = normals_buffer.data;
	}

	//bone matrices
	var bones = this.getBoneMatrices( ref_mesh );
	if(bones.length == 0) //no bones found
		return null;

	//var factor = this.factor; //for debug

	//apply skinning per vertex
	var temp = vec3.create();
	var ov_temp = vec3.create();
	var temp_matrix = mat4.create();
	for(var i = 0, l = vertices.length / 3; i < l; ++i)
	{
		var ov = original_vertices.subarray(i*3, i*3+3);

		var b = bone_indices.subarray(i*4, i*4+4);
		var w = weights.subarray(i*4, i*4+4);
		var v = vertices.subarray(i*3, i*3+3);

		var bmat = [ bones[ b[0] ], bones[ b[1] ], bones[ b[2] ], bones[ b[3] ] ];

		temp_matrix.set( zero_matrix );
		mat4.scaleAndAdd( temp_matrix, temp_matrix, bmat[0], w[0] );
		if(w[1] > 0.0) mat4.scaleAndAdd( temp_matrix, temp_matrix, bmat[1], w[1] );
		if(w[2] > 0.0) mat4.scaleAndAdd( temp_matrix, temp_matrix, bmat[2], w[2] );
		if(w[3] > 0.0) mat4.scaleAndAdd( temp_matrix, temp_matrix, bmat[3], w[3] );

		mat4.multiplyVec3(v, temp_matrix, original_vertices.subarray(i*3, i*3+3) );
		if(normals)
		{
			var n = normals.subarray(i*3, i*3+3);
			mat4.rotateVec3(n, temp_matrix, original_normals.subarray(i*3, i*3+3) );
		}
		
		//we could also multiply the normal but this is already superslow...
		if(SkinDeformer.apply_to_normals_by_software)
		{
			//apply weights
			v[0] = v[1] = v[2] = 0.0; //reset
			mat4.multiplyVec3(v, bmat[0], ov_temp);
			vec3.scale(v,v,w[0]);
			for(var j = 1; j < 4; ++j)
				if(w[j] > 0.0)
				{
					mat4.multiplyVec3( temp, bmat[j], ov_temp );
					vec3.scaleAndAdd( v, v, temp, w[j] );
				}
		}

		//if(factor != 1) vec3.lerp( v, ov, v, factor);
	}

	//upload
	vertices_buffer.upload(gl.STREAM_DRAW);
	if(normals_buffer)
		normals_buffer.upload(gl.STREAM_DRAW);
}

SkinDeformer.prototype.extractSkeleton = function()
{
	//TODO
}

//returns an array with all the bone nodes affecting this mesh
SkinDeformer.prototype.getBones = function()
{
	var mesh = this._mesh;
	if(!mesh && !mesh.bones)
		return null;

	var bones = [];
	for(var i in mesh.bones)
	{
		var bone = this.getBoneNode( mesh.bones[i][0] );
		if(bone)
			bones.push( bone );
	}

	return bones;
}

LS.registerComponent( SkinDeformer );
LS.SkinDeformer = SkinDeformer;

SkinDeformer.skinning_shader_code = "\n\
	//Skinning ******************* \n\
	#ifndef MAX_BONES\n\
		#define MAX_BONES 64\n\
	#endif\n\
	#ifdef USE_SKINNING_TEXTURE\n\
		uniform sampler2D u_bones;\n\
	#else\n\
		uniform vec4 u_bones[ MAX_BONES * 3];\n\
	#endif\n\
	attribute vec4 a_weights;\n\
	attribute vec4 a_bone_indices;\n\
	\n\
	void getMat(int id, inout mat4 m) {\n\
	\n\
		#ifdef USE_SKINNING_TEXTURE\n\
			float i_max_texture_bones_offset = 1.0 / (128.0 * 3.0);\n\
			m[0] = texture2D( u_bones, vec2( 0.0, (float(id*3)+0.5) * i_max_texture_bones_offset ) ); \n\
			m[1] = texture2D( u_bones, vec2( 0.0, (float(id*3+1)+0.5) * i_max_texture_bones_offset ) );\n\
			m[2] = texture2D( u_bones, vec2( 0.0, (float(id*3+2)+0.5) * i_max_texture_bones_offset ) );\n\
		#else\n\
			m[0] = u_bones[ id * 3];\n\
			m[1] = u_bones[ id * 3 + 1];\n\
			m[2] = u_bones[ id * 3 + 2];\n\
		#endif\n\
	}\n\
	\n\
	mat3 mat3_emu(mat4 m4) {\n\
	  return mat3(\n\
		  m4[0][0], m4[0][1], m4[0][2],\n\
		  m4[1][0], m4[1][1], m4[1][2],\n\
		  m4[2][0], m4[2][1], m4[2][2]);\n\
	}\n\
	\n\
	void applySkinning(inout vec4 position, inout vec3 normal)\n\
	{\n\
		//toji version seems faster\n\
		mat4 bone_matrix = mat4(0.0,0.0,0.0,0.0, 0.0,0.0,0.0,0.0, 0.0,0.0,0.0,0.0, 0.0,0.0,0.0,1.0);\n\
		\n\
		getMat( int(a_bone_indices.x), bone_matrix );\n\
		mat4 result = a_weights.x * bone_matrix;\n\
		getMat( int(a_bone_indices.y), bone_matrix);\n\
		result = result + a_weights.y * bone_matrix;\n\
		getMat( int(a_bone_indices.z), bone_matrix);\n\
		result = result + a_weights.z * bone_matrix;\n\
		getMat( int(a_bone_indices.w), bone_matrix);\n\
		result = result + a_weights.w * bone_matrix;\n\
		\n\
		position.xyz = (position * result).xyz;\n\
		normal = normal * mat3_emu(result);\n\
	}\n\
";

SkinDeformer.skinning_enabled_shader_code = "\n#pragma shaderblock skinning_mode\n#define USING_SKINNING\n";
SkinDeformer.skinning_disabled_shader_code = "\nvoid applySkinning( inout vec4 position, inout vec3 normal) {}\n";

// ShaderBlocks used to inject to shader in runtime
var skinning_block = new LS.ShaderBlock("skinning");
skinning_block.addCode( GL.VERTEX_SHADER, SkinDeformer.skinning_enabled_shader_code, SkinDeformer.skinning_disabled_shader_code );
skinning_block.register();
SkinDeformer.skinning_block = skinning_block;

var skinning_uniforms_block = new LS.ShaderBlock("skinning_uniforms");
skinning_uniforms_block.defineContextMacros( { "skinning_mode": "skinning_uniforms"} );
skinning_uniforms_block.addCode( GL.VERTEX_SHADER, SkinDeformer.skinning_shader_code, SkinDeformer.skinning_disabled_shader_code );
skinning_uniforms_block.register();
SkinDeformer.skinning_uniforms_block = skinning_uniforms_block;

var skinning_texture_block = new LS.ShaderBlock("skinning_texture");
skinning_texture_block.defineContextMacros( { "skinning_mode": "skinning_texture"} );
skinning_texture_block.addCode( GL.VERTEX_SHADER, "\n#define USE_SKINNING_TEXTURE\n" + SkinDeformer.skinning_shader_code, SkinDeformer.skinning_disabled_shader_code );
skinning_texture_block.register();
SkinDeformer.skinning_texture_block = skinning_texture_block;