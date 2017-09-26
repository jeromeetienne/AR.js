//***** ASE Parser *****************
var parserASE = {
	extension: "ase",
	type: "mesh",
	resource: "Mesh",
	format: 'text',
	dataType:'text',
	
	parse: function( text, options, filename )
	{
		options = options || {};

		//final arrays (packed, lineal [ax,ay,az, bx,by,bz ...])
		var positionsArray = [ ];
		var normalsArray   = [ ];
		var indicesArray   = [ ];

		var uvs_container = [ ];
		var current_uvs = null;


		//unique arrays (not packed, lineal)
		var positions = [ ];
		var normals   = [ ];
		var indices = [ ];
		var tvertlist = [ ];
		var facemap   = { };
		var index     = 0;

		var line = null;
		var f   = null;
		var pos = 0;
		var tex = 0;
		var nor = 0;
		var x   = 0.0;
		var y   = 0.0;
		var z   = 0.0;
		var tokens = null;

		var indices_offset = 0;
		var mesh_index = 0;
		var current_mat_id = -1;
		var current_mesh_name = "";

		//used for mesh groups (submeshes)
		var group = null;
		var groups = [];

		var flip_axis = this.flipAxis;
		if(options.flipAxis != null) flip_axis = options.flipAxis;
		var flip_normals = (flip_axis || options.flipNormals);

		var lines = text.split("\n");
		for (var lineIndex = 0;  lineIndex < lines.length; ++lineIndex) {
			line = lines[lineIndex].replace(/[ \t]+/g, " ").replace(/\s\s*$/, ""); //trim
			if(line[0] == " ")
				line = line.substr(1,line.length);

			if(line == "") continue;
			tokens = line.split(" ");

			if(tokens[0] == "*MESH")
			{
				mesh_index += 1;
				positions = [];

				if(mesh_index > 1)
					break; //parse only the first mesh
			}
			else if (tokens[0] == "*NODE_NAME") {
				current_mesh_name =  tokens[1].substr(1, tokens[1].length - 2);
			}
			else if(tokens[0] == "*MESH_VERTEX")
			{
				if(flip_axis) //maya and max notation style
					positions.push( [-1*parseFloat(tokens[2]), parseFloat(tokens[4]), parseFloat(tokens[3])] );
				else
					positions.push( [parseFloat(tokens[2]), parseFloat(tokens[3]), parseFloat(tokens[4])] );
			}
			else if(tokens[0] == "*MESH_FACE")
			{
				//material info
				var mat_id = parseInt( tokens[17] );
				if(current_mat_id != mat_id)
				{
					current_mat_id = mat_id;
					if(group != null)
					{
						group.length = positionsArray.length / 3 - group.start;
						if(group.length > 0)
							groups.push(group);
					}

					group = {
						name: "mat_" + mat_id,
						start: positionsArray.length / 3,
						length: -1,
						material: ""
					};
				}

				//add vertices
				var vertex = positions[ parseInt(tokens[3]) ];
				positionsArray.push( vertex[0], vertex[1], vertex[2] );
				vertex = positions[ parseInt(tokens[5]) ];
				positionsArray.push( vertex[0], vertex[1], vertex[2] );
				vertex = positions[ parseInt(tokens[7]) ];
				positionsArray.push( vertex[0], vertex[1], vertex[2] );
			}
			else if(tokens[0] == "*MESH_TVERTLIST")
			{
				tvertlist = [];
			}
			else if(tokens[0] == "*MESH_TVERT")
			{
				tvertlist.push( [parseFloat(tokens[2]), parseFloat(tokens[3])] );
			}
			else if(tokens[0] == "*MESH_TFACELIST")
			{
				if( current_uvs && current_uvs.length )
					uvs_container.push( current_uvs );
				current_uvs = [];
			}
			else if(tokens[0] == "*MESH_TFACE")
			{
				var coord = tvertlist[ parseInt(tokens[2]) ];
				current_uvs.push( coord[0], coord[1] );
				coord = tvertlist[ parseInt(tokens[3]) ];
				current_uvs.push( coord[0], coord[1] );
				coord = tvertlist[ parseInt(tokens[4]) ];
				current_uvs.push( coord[0], coord[1] );
			}
			else if(tokens[0] == "*MESH_MAPPINGCHANNEL")
			{
				if( current_uvs )
					uvs_container.push( current_uvs );
				current_uvs = [];
			}
			else if(tokens[0] == "*MESH_VERTEXNORMAL")
			{
				if(flip_normals)  //maya and max notation style
					normalsArray.push(-1*parseFloat(tokens[2]),parseFloat(tokens[4]),parseFloat(tokens[3]));
				else
					normalsArray.push(parseFloat(tokens[2]),parseFloat(tokens[3]),parseFloat(tokens[4]));
			}
		}

		if(current_uvs)
			uvs_container.push( current_uvs );

		var total_primitives = positionsArray.length / 3 - group.start;
		if(group && total_primitives > 1)
		{
			group.length = total_primitives;
			groups.push(group);
		}

		var mesh = { info: {} };

		mesh.vertices = new Float32Array(positionsArray);
		if (normalsArray.length > 0)
			mesh.normals = new Float32Array(normalsArray);
		for(var i = 0; i < uvs_container.length; ++i )
		{
			var channel = "";
			if(i > 0)
				channel = i+1;
			mesh[ "coords" + channel ] = new Float32Array( uvs_container[i] );
		}

		//extra info
		mesh.bounding = LS.Formats.computeMeshBounding( mesh.vertices );
		if(groups.length > 1)
			mesh.info.groups = groups;
		return mesh;
	}
};

LS.Formats.addSupportedFormat( "ase", parserASE );
