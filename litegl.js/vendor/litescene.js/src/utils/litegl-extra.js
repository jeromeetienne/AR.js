
//Add some functions to the classes in LiteGL to fit better in the LiteScene engine

GL.Texture.EXTENSION = "png";
GL.Mesh.EXTENSION = "wbin";

//when working with animations sometimes you want the bones to be referenced by node name and no node uid, because otherwise you cannot reuse
//the same animation with different characters in the same scene.
GL.Mesh.prototype.convertBoneNames = function( root_node, use_uids )
{
	if(!this.bones || !this.bones.length)
		return 0;

	root_node = root_node || LS.GlobalScene;
	if( root_node.constructor == LS.SceneTree )
		root_node = root_node.root;
	if(!root_node.findNode)
	{
		console.error("convertBoneNames first parameter must be node or scene");
		return 0;
	}

	var modified = false;

	//Rename the id to a relative name
	for(var i = 0; i < this.bones.length; ++i)
	{
		var bone = this.bones[i];
		var bone_name = bone[0];

		if( !use_uids )
		{
			if( bone_name[0] != LS._uid_prefix)
				continue; //already using a name, not a uid
			var node = root_node.findNode( bone_name );
			if(!node)
			{
				console.warn("Bone node not found: " + bone_name );
				continue;
			}
			bone[0] = node.name;
			modified = true;
		}
		else
		{
			if( bone_name[0] == LS._uid_prefix)
				continue; //already using a uid
			var node = root_node.findNode( bone_name );
			if(!node)
			{
				console.warn("Bone node not found: " + bone_name );
				continue;
			}
			bone[0] = node.uid;
			modified = true;
		}
	}

	//flag it
	if(modified)
		LS.RM.resourceModified( this );
}

GL.Mesh.fromBinary = function( data_array )
{
	var o = null;
	if( data_array.constructor == ArrayBuffer )
		o = WBin.load( data_array );
	else
		o = data_array;

	if( o.format )
		GL.Mesh.uncompress( o );

	var vertex_buffers = {};
	for(var i in o.vertex_buffers)
		vertex_buffers[ o.vertex_buffers[i] ] = o[ o.vertex_buffers[i] ];

	var index_buffers = {};
	for(var i in o.index_buffers)
		index_buffers[ o.index_buffers[i] ] = o[ o.index_buffers[i] ];

	var mesh = new GL.Mesh(vertex_buffers, index_buffers);
	mesh.info = o.info;
	mesh.bounding = o.bounding;
	if(o.bones)
	{
		mesh.bones = o.bones;
		//restore Float32array
		for(var i = 0; i < mesh.bones.length; ++i)
			mesh.bones[i][1] = mat4.clone(mesh.bones[i][1]);
		if(o.bind_matrix)
			mesh.bind_matrix = mat4.clone( o.bind_matrix );		
	}
	
	return mesh;
}

GL.Mesh.enable_wbin_compression = true;

GL.Mesh.prototype.toBinary = function()
{
	if(!this.info)
		this.info = {};

	//clean data
	var o = {
		object_class: "Mesh",
		info: this.info,
		groups: this.groups
	};

	if(this.bones)
	{
		var bones = [];
		//convert to array
		for(var i = 0; i < this.bones.length; ++i)
			bones.push([ this.bones[i][0], mat4.toArray( this.bones[i][1] ) ]);
		o.bones = bones;
		if(this.bind_matrix)
			o.bind_matrix = this.bind_matrix;
	}

	//bounding box
	if(!this.bounding)	
		this.updateBounding();
	o.bounding = this.bounding;

	var vertex_buffers = [];
	var index_buffers = [];

	for(var i in this.vertexBuffers)
	{
		var stream = this.vertexBuffers[i];
		o[ stream.name ] = stream.data;
		vertex_buffers.push( stream.name );

		if(stream.name == "vertices")
			o.info.num_vertices = stream.data.length / 3;
	}

	for(var i in this.indexBuffers)
	{
		var stream = this.indexBuffers[i];
		o[i] = stream.data;
		index_buffers.push( i );
	}

	o.vertex_buffers = vertex_buffers;
	o.index_buffers = index_buffers;

	//compress wbin using the bounding
	if( GL.Mesh.enable_wbin_compression ) //apply compression
		GL.Mesh.compress( o );

	//create pack file
	var bin = WBin.create(o, "Mesh");

	return bin;
}

GL.Mesh.compress = function( o )
{
	o.format = {
		type: "bounding_compressed"
	};

	if(!o.vertex_buffers)
		throw("buffers not found");

	var min = BBox.getMin( o.bounding );
	var max = BBox.getMax( o.bounding );
	var range = vec3.sub( vec3.create(), max, min );

	var vertices = o.vertices;
	var new_vertices = new Uint16Array( vertices.length );
	for(var i = 0; i < vertices.length; i+=3)
	{
		new_vertices[i] = ((vertices[i] - min[0]) / range[0]) * 65535;
		new_vertices[i+1] = ((vertices[i+1] - min[1]) / range[1]) * 65535;
		new_vertices[i+2] = ((vertices[i+2] - min[2]) / range[2]) * 65535;
	}
	o.vertices = new_vertices;		

	if( o.normals )
	{
		var normals = o.normals;
		var new_normals = new Uint8Array( normals.length );
		var normals_range = new_normals.constructor == Uint8Array ? 255 : 65535;
		for(var i = 0; i < normals.length; i+=3)
		{
			new_normals[i] = (normals[i] * 0.5 + 0.5) * normals_range;
			new_normals[i+1] = (normals[i+1] * 0.5 + 0.5) * normals_range;
			new_normals[i+2] = (normals[i+2] * 0.5 + 0.5) * normals_range;
		}
		o.normals = new_normals;
	}

	if( o.coords )
	{
		//compute uv bounding: [minu,minv,maxu,maxv]
		var coords = o.coords;
		var uvs_bounding = [10000,10000,-10000,-10000];
		for(var i = 0; i < coords.length; i+=2)
		{
			var u = coords[i];
			if( uvs_bounding[0] > u ) uvs_bounding[0] = u;
			else if( uvs_bounding[2] < u ) uvs_bounding[2] = u;
			var v = coords[i+1];
			if( uvs_bounding[1] > v ) uvs_bounding[1] = v;
			else if( uvs_bounding[3] < v ) uvs_bounding[3] = v;
		}
		o.format.uvs_bounding = uvs_bounding;

		var new_coords = new Uint16Array( coords.length );
		var range = [ uvs_bounding[2] - uvs_bounding[0], uvs_bounding[3] - uvs_bounding[1] ];
		for(var i = 0; i < coords.length; i+=2)
		{
			new_coords[i] = ((coords[i] - uvs_bounding[0]) / range[0]) * 65535;
			new_coords[i+1] = ((coords[i+1] - uvs_bounding[1]) / range[1]) * 65535;
		}
		o.coords = new_coords;
	}

	if( o.weights )
	{
		var weights = o.weights;
		var new_weights = new Uint16Array( weights.length ); //using only one byte distorts the meshes a lot
		var weights_range = new_weights.constructor == Uint8Array ? 255 : 65535;
		for(var i = 0; i < weights.length; i+=4)
		{
			new_weights[i] = weights[i] * weights_range;
			new_weights[i+1] = weights[i+1] * weights_range;
			new_weights[i+2] = weights[i+2] * weights_range;
			new_weights[i+3] = weights[i+3] * weights_range;
		}
		o.weights = new_weights;
	}
}

GL.Mesh.uncompress = function( o )
{
	var bounding = o.bounding;
	var min = BBox.getMin( bounding );
	var max = BBox.getMax( bounding );
	var range = vec3.sub( vec3.create(), max, min );

	var format = o.format;

	if(format.type == "bounding_compressed")
	{
		var inv8 = 1 / 255;
		var inv16 = 1 / 65535;
		var vertices = o.vertices;
		var new_vertices = new Float32Array( vertices.length );
		for( var i = 0, l = vertices.length; i < l; i += 3 )
		{
			new_vertices[i] = ((vertices[i] * inv16) * range[0]) + min[0];
			new_vertices[i+1] = ((vertices[i+1] * inv16) * range[1]) + min[1];
			new_vertices[i+2] = ((vertices[i+2] * inv16) * range[2]) + min[2];
		}
		o.vertices = new_vertices;		

		if( o.normals && o.normals.constructor != Float32Array )
		{
			var normals = o.normals;
			var new_normals = new Float32Array( normals.length );
			var inormals_range = normals.constructor == Uint8Array ? inv8 : inv16;
			for( var i = 0, l = normals.length; i < l; i += 3 )
			{
				new_normals[i] = (normals[i] * inormals_range) * 2.0 - 1.0;
				new_normals[i+1] = (normals[i+1] * inormals_range) * 2.0 - 1.0;
				new_normals[i+2] = (normals[i+2] * inormals_range) * 2.0 - 1.0;
				var N = new_normals.subarray(i,i+3);
				vec3.normalize(N,N);
			}
			o.normals = new_normals;
		}

		if( o.coords && format.uvs_bounding && o.coords.constructor != Float32Array )
		{
			var coords = o.coords;
			var uvs_bounding = format.uvs_bounding;
			var range = [ uvs_bounding[2] - uvs_bounding[0], uvs_bounding[3] - uvs_bounding[1] ];
			var new_coords = new Float32Array( coords.length );
			for( var i = 0, l = coords.length; i < l; i += 2 )
			{
				new_coords[i] = (coords[i] * inv16) * range[0] + uvs_bounding[0];
				new_coords[i+1] = (coords[i+1] * inv16) * range[1] + uvs_bounding[1];
			}
			o.coords = new_coords;
		}

		//bones are already in Uint8 format so dont need to compress them further, but weights yes
		if( o.weights && o.weights.constructor != Float32Array ) //do we really need to unpack them? what if we use them like this?
		{
			var weights = o.weights;
			var new_weights = new Float32Array( weights.length );
			var iweights_range = weights.constructor == Uint8Array ? inv8 : inv16;
			for(var i = 0, l = weights.length; i < l; i += 4 )
			{
				new_weights[i] = weights[i] * iweights_range;
				new_weights[i+1] = weights[i+1] * iweights_range;
				new_weights[i+2] = weights[i+2] * iweights_range;
				new_weights[i+3] = weights[i+3] * iweights_range;
			}
			o.weights = new_weights;
		}

	}
	else
		throw("unknown mesh format compression");
}