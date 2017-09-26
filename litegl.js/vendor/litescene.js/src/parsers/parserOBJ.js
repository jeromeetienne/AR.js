//***** OBJ parser adapted from SpiderGL implementation *****************
var parserOBJ = {
	extension: 'obj',
	type: 'mesh',
	resource: 'Mesh',
	format: 'text',
	dataType:'text',

	flipAxis: false,

	parse: function(text, options)
	{
		options = options || {};
		var support_uint = true;

		//unindexed containers
		var vertices = [];
		var normals = [];
		var uvs = [];

		//final containers
		var vertices_buffer_data = [];
		var normals_buffer_data = [];
		var uvs_buffer_data = [];

		//groups
		var group_id = 0;
		var groups = [];
		var current_group_materials = {};
		var last_group_name = null;
		var materials_found = {};
		var mtllib = null;
		var group = createGroup();

		var indices_map = new Map();
		var next_index = 0;

		var V_CODE = 1;
		var VT_CODE = 2;
		var VN_CODE = 3;
		var F_CODE = 4;
		var G_CODE = 5;
		var O_CODE = 6;
		var USEMTL_CODE = 7;
		var MTLLIB_CODE = 8;
		var codes = { v: V_CODE, vt: VT_CODE, vn: VN_CODE, f: F_CODE, g: G_CODE, o: O_CODE, usemtl: USEMTL_CODE, mtllib: MTLLIB_CODE };

		var x,y,z;

		var lines = text.split("\n");
		var length = lines.length;
		for (var lineIndex = 0;  lineIndex < length; ++lineIndex) {

			var line = lines[lineIndex];
			line = line.replace(/[ \t]+/g, " ").replace(/\s\s*$/, ""); //better than trim

			if(line[ line.length - 1 ] == "\\") //breakline support
			{
				lineIndex += 1;
				var next_line = lines[lineIndex].replace(/[ \t]+/g, " ").replace(/\s\s*$/, ""); //better than trim
				line = (line.substr(0,line.length - 1) + next_line).replace(/[ \t]+/g, " ").replace(/\s\s*$/, "");
			}
			
			if (line[0] == "#")
				continue;
			if(line == "")
				continue;

			var tokens = line.split(" ");
			var code = codes[ tokens[0] ];

			if( code <= VN_CODE ) //v,vt,vn
			{
				x = parseFloat(tokens[1]);
				y = parseFloat(tokens[2]);
				if( code != VT_CODE ) //not always present
					z = parseFloat(tokens[3]); 
			}
			
			switch(code)
			{
				case V_CODE: vertices.push(x,y,z);	break;
				case VT_CODE: uvs.push(x,y);	break;
				case VN_CODE: normals.push(x,y,z);	break;
				case F_CODE: 
					if (tokens.length < 4)
						continue; //faces with less that 3 vertices? nevermind
					//get the triangle indices
					var polygon_indices = [];
					for(var i = 1; i < tokens.length; ++i)
						polygon_indices.push( getIndex( tokens[i] ) );
					group.indices.push( polygon_indices[0], polygon_indices[1], polygon_indices[2] );
					//polygons are break intro triangles
					for(var i = 2; i < polygon_indices.length-1; ++i)
						group.indices.push( polygon_indices[0], polygon_indices[i], polygon_indices[i+1] );
					break;
				case G_CODE:  
				case O_CODE:  //whats the difference?
					var name = tokens[1];
					last_group_name = name;
					if(!group.name)
						group.name = name;
					else
					{
						current_group_materials = {};
						group = createGroup( name );
					}
					break;
				case USEMTL_CODE: 
					changeMaterial( tokens[1] );
					break;
				case MTLLIB_CODE:
					mtllib = tokens[1];
					break;
				default:
			}
		}

		//generate indices
		var indices = [];
		var group_index = 0;
		var final_groups = [];
		for(var i = 0; i < groups.length; ++i)
		{
			var group = groups[i];
			if(!group.indices) //already added?
				continue;
			group.start = group_index;
			group.length = group.indices.length;
			indices = indices.concat( group.indices );
			//TODO: compute bounding of group here
			delete group.indices; //do not store indices in JSON format!
			group_index += group.length;
			final_groups.push( group );
		}
		groups = final_groups;

		//finish mesh
		var mesh = {};

		if(!vertices.length)
		{
			console.error("mesh without vertices");
			return null;
		}

		//create typed arrays
		mesh.vertices = new Float32Array( vertices_buffer_data );
		if ( normals_buffer_data.length )
			mesh.normals = new Float32Array( normals_buffer_data );
		if ( uvs_buffer_data.length )
			mesh.coords = new Float32Array( uvs_buffer_data );
		if ( indices && indices.length > 0 )
			mesh.triangles = new ( support_uint && group_index > 256*256 ? Uint32Array : Uint16Array )(indices);

		//extra info
		mesh.bounding = GL.Mesh.computeBounding( mesh.vertices );
		var info = {};
		if(groups.length > 1)
		{
			info.groups = groups;
			//compute bounding of groups? //TODO
		}

		mesh.info = info;
		if( !mesh.bounding )
		{
			console.log("empty mesh");
			return null;
		}

		if( mesh.bounding.radius == 0 || isNaN(mesh.bounding.radius))
			console.log("no radius found in mesh");
		//console.log(mesh);
		return mesh;

		//this function helps reuse triplets that have been created before
		function getIndex( str )
		{
			var pos,tex,nor,f;
			var has_negative = false;

			//cannot use negative indices as keys, convert them to positive
			if(str.indexOf("-") == -1)
			{
				var index = indices_map.get(str);
				if(index !== undefined)
					return index;
			}
			else
				has_negative = true;

			if(!f) //maybe it was parsed before
				f = str.split("/");

			if (f.length == 1) { //unpacked
				pos = parseInt(f[0]);
				tex = pos;
				nor = pos;
			}
			else if (f.length == 2) { //no normals
				pos = parseInt(f[0]);
				tex = parseInt(f[1]);
				nor = pos;
			}
			else if (f.length == 3) { //all three indexed
				pos = parseInt(f[0]);
				tex = parseInt(f[1]);
				nor = parseInt(f[2]);
			}
			else {
				console.log("Problem parsing: unknown number of values per face");
				return -1;
			}

			//negative indices are relative to the end
			if(pos < 0) 
				pos = vertices.length / 3 + pos + 1;
			if(nor < 0)
				nor = normals.length / 2 + nor + 1;
			if(tex < 0)
				tex = uvs.length / 2 + tex + 1;

			//try again to see if we already have this
			if(has_negative)
			{
				str = pos + "/" + tex + "/" + nor;
				var index = indices_map.get(str);
				if(index !== undefined)
					return index;
			}

			//fill buffers
			pos -= 1; tex -= 1; nor -= 1; //indices in obj start in 1, buffers in 0
			vertices_buffer_data.push( vertices[pos*3+0], vertices[pos*3+1], vertices[pos*3+2] );
			if(uvs.length)
				uvs_buffer_data.push( uvs[tex*2+0], uvs[tex*2+1] );
			if(normals.length)
				normals_buffer_data.push( normals[nor*3+0], normals[nor*3+1], normals[nor*3+2] );

			//store index
			var index = next_index;
			indices_map.set( str, index );
			++next_index;
			return index;
		}

		function createGroup( name )
		{
			var g = {
				name: name || "",
				material: "",
				start: -1,
				length: -1,
				indices: []
			};
			groups.push(g);
			return g;
		}

		function changeMaterial( material_name )
		{
			if( !group.material )
			{
				group.material = material_name + ".json";
				current_group_materials[ material_name ] = group;
				return group;
			}

			var g = current_group_materials[ material_name ];
			if(!g)
			{
				g = createGroup( last_group_name + "_" + material_name );
				g.material = material_name + ".json";
				current_group_materials[ material_name ] = g;
			}
			group = g;
			return g;
		}
	},

	parse2: function(text, options)
	{
		options = options || {};

		var support_uint = true;
		var skip_indices = options.noindex ? options.noindex : false;
		//skip_indices = true;

		//final arrays (packed, lineal [ax,ay,az, bx,by,bz ...])
		var positionsArray = [ ];
		var texcoordsArray = [ ];
		var normalsArray   = [ ];
		var indicesArray   = [ ];

		//unique arrays (not packed, lineal)
		var positions = [ ];
		var texcoords = [ ];
		var normals   = [ ];
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
		var mtllib = null;

		var hasPos = false;
		var hasTex = false;
		var hasNor = false;

		var parsingFaces = false;
		var indices_offset = 0;
		var negative_offset = -1; //used for weird objs with negative indices
		var max_index = 0;

		//trace("SKIP INDICES: " + skip_indices);
		var flip_axis = (this.flipAxis || options.flipAxis);
		var flip_normals = (flip_axis || options.flipNormals);

		//used for mesh groups (submeshes)
		var group = null;
		var group_id = 0;
		var groups = [];
		var groups_by_name = {};
		var materials_found = {};

		var V_CODE = 1;
		var VT_CODE = 2;
		var VN_CODE = 3;
		var F_CODE = 4;
		var G_CODE = 5;
		var O_CODE = 6;
		var codes = { v: V_CODE, vt: VT_CODE, vn: VN_CODE, f: F_CODE, g: G_CODE, o: O_CODE };

		var lines = text.split("\n");
		var length = lines.length;
		for (var lineIndex = 0;  lineIndex < length; ++lineIndex) {

			var line = lines[lineIndex];
			line = line.replace(/[ \t]+/g, " ").replace(/\s\s*$/, ""); //better than trim

			if(line[ line.length - 1 ] == "\\") //breakline
			{
				lineIndex += 1;
				var next_line = lines[lineIndex].replace(/[ \t]+/g, " ").replace(/\s\s*$/, ""); //better than trim
				line = (line.substr(0,line.length - 1) + next_line).replace(/[ \t]+/g, " ").replace(/\s\s*$/, "");
			}
			

			if (line[0] == "#")
				continue;
			if(line == "")
				continue;

			tokens = line.split(" ");
			var code = codes[ tokens[0] ];

			if(parsingFaces && code == V_CODE) //another mesh?
			{
				indices_offset = index;
				parsingFaces = false;
				//trace("multiple meshes: " + indices_offset);
			}

			//read and parse numbers
			if( code <= VN_CODE ) //v,vt,vn
			{
				x = parseFloat(tokens[1]);
				y = parseFloat(tokens[2]);
				z = parseFloat(tokens[3]);
			}

			if (code == V_CODE) {
				if(flip_axis) //maya and max notation style
					positions.push(-1*x,z,y);
				else
					positions.push(x,y,z);
			}
			else if (code == VT_CODE) {
				texcoords.push(x,y);
			}
			else if (code == VN_CODE) {

				if(flip_normals)  //maya and max notation style
					normals.push(-y,-z,x);
				else
					normals.push(x,y,z);
			}
			else if (code == F_CODE) {
				parsingFaces = true;

				if (tokens.length < 4)
					continue; //faces with less that 3 vertices? nevermind

				//for every corner of this polygon
				var polygon_indices = [];
				for (var i=1; i < tokens.length; ++i) 
				{
					var faceid = group_id + ":" + tokens[i];
					if (  !(faceid in facemap) || skip_indices )
					{
						f = tokens[i].split("/");

						if (f.length == 1) { //unpacked
							pos = parseInt(f[0]) - 1;
							tex = pos;
							nor = pos;
						}
						else if (f.length == 2) { //no normals
							pos = parseInt(f[0]) - 1;
							tex = parseInt(f[1]) - 1;
							nor = -1;
						}
						else if (f.length == 3) { //all three indexed
							pos = parseInt(f[0]) - 1;
							tex = parseInt(f[1]) - 1;
							nor = parseInt(f[2]) - 1;
						}
						else {
							console.log("Problem parsing: unknown number of values per face");
							return false;
						}

						/*
						//pos = Math.abs(pos); tex = Math.abs(tex); nor = Math.abs(nor);
						if(pos < 0) pos = positions.length/3 + pos - negative_offset;
						if(tex < 0) tex = texcoords.length/2 + tex - negative_offset;
						if(nor < 0) nor = normals.length/3 + nor - negative_offset;
						*/

						if(i > 3 && skip_indices) //polys
						{
							//first
							var pl = positionsArray.length;
							positionsArray.push( positionsArray[pl - (i-3)*9], positionsArray[pl - (i-3)*9 + 1], positionsArray[pl - (i-3)*9 + 2]);
							positionsArray.push( positionsArray[pl - 3], positionsArray[pl - 2], positionsArray[pl - 1]);
							pl = texcoordsArray.length;
							texcoordsArray.push( texcoordsArray[pl - (i-3)*6], texcoordsArray[pl - (i-3)*6 + 1]);
							texcoordsArray.push( texcoordsArray[pl - 2], texcoordsArray[pl - 1]);
							pl = normalsArray.length;
							normalsArray.push( normalsArray[pl - (i-3)*9], normalsArray[pl - (i-3)*9 + 1], normalsArray[pl - (i-3)*9 + 2]);
							normalsArray.push( normalsArray[pl - 3], normalsArray[pl - 2], normalsArray[pl - 1]);
						}

						x = 0.0;
						y = 0.0;
						z = 0.0;
						if ((pos * 3 + 2) < positions.length)
						{
							hasPos = true;
							if(pos < 0) //negative indices are relative to the end
								pos = positions.length / 3 + pos + 1;
							x = positions[pos*3+0];
							y = positions[pos*3+1];
							z = positions[pos*3+2];
						}

						positionsArray.push(x,y,z);
						//positionsArray.push([x,y,z]);

						x = 0.0;
						y = 0.0;
						if ((tex * 2 + 1) < texcoords.length)
						{
							hasTex = true;
							if(tex < 0) //negative indices are relative to the end
								tex = texcoords.length / 2 + tex + 1;
							x = texcoords[tex*2+0];
							y = texcoords[tex*2+1];
						}
						texcoordsArray.push(x,y);
						//texcoordsArray.push([x,y]);

						x = 0.0;
						y = 0.0;
						z = 1.0;
						if(nor != -1)
						{
							if ((nor * 3 + 2) < normals.length)
							{
								hasNor = true;

								if(nor < 0)
									nor = normals.length / 3 + nor + 1;
								x = normals[nor*3+0];
								y = normals[nor*3+1];
								z = normals[nor*3+2];
							}
							
							normalsArray.push(x,y,z);
							//normalsArray.push([x,y,z]);
						}

						//Save the string "10/10/10" and tells which index represents it in the arrays
						if(!skip_indices)
							facemap[ faceid ] = index++;
					}//end of 'if this token is new (store and index for later reuse)'

					//store key for this triplet
					if(!skip_indices)
					{
						var final_index = facemap[ faceid ];
						polygon_indices.push( final_index );
						if(max_index < final_index)
							max_index = final_index;
					}
				} //end of for every token on a 'f' line

				//polygons (not just triangles)
				if(!skip_indices)
				{
					for(var iP = 2; iP < polygon_indices.length; iP++)
					{
						indicesArray.push( polygon_indices[0], polygon_indices[iP-1], polygon_indices[iP] );
						//indicesArray.push( [polygon_indices[0], polygon_indices[iP-1], polygon_indices[iP]] );
					}
				}
			}
			else if ( code == G_CODE || code == O_CODE)
			{
				negative_offset = positions.length / 3 - 1;

				if(tokens.length > 1)
				{
					var group_pos = (indicesArray.length ? indicesArray.length : positionsArray.length / 3);
					if(group != null)
					{
						group.length = group_pos - group.start;
						if(group.length > 0) //there are triangles...
						{
							groups_by_name[ group_name ] = group;
							groups.push(group);
							group_id++;
						}
					}

					var group_name = tokens[1];
					if(groups_by_name[group_name])
						group_name = group_name + "." + group_id;

					group = {
						name: group_name,
						start: group_pos,
						length: -1,
						material: ""
					};

					/*
					if(tokens[0] == "g")
					{
						group_vertex_start = positions.length / 3;
						group_normal_start = normals.length / 3;
						group_coord_start = texcoords.length / 2;
					}
					*/
				}
			}
			else if (tokens[0] == "mtllib") {
				mtllib = tokens[1];
			}
			else if (tokens[0] == "usemtl") {
				if(group)
					group.material = tokens[1];
			}
			else if ( tokens[0] == "s" ) { //tokens[0] == "o"
				//ignore
			}
			else
			{
				console.warn("unknown code: " + line);
				break;
			}
		}

		if(group && (indicesArray.length - group.start) > 1)
		{
			group.length = indicesArray.length - group.start;
			groups.push(group);
		}

		//deindex streams
		if((max_index > 256*256 || skip_indices ) && indicesArray.length > 0 && !support_uint )
		{
			console.log("Deindexing mesh...")
			var finalVertices = new Float32Array(indicesArray.length * 3);
			var finalNormals = normalsArray && normalsArray.length ? new Float32Array(indicesArray.length * 3) : null;
			var finalTexCoords = texcoordsArray && texcoordsArray.length ? new Float32Array(indicesArray.length * 2) : null;
			for(var i = 0; i < indicesArray.length; i += 1)
			{
				finalVertices.set( positionsArray.slice( indicesArray[i]*3,indicesArray[i]*3 + 3), i*3 );
				if(finalNormals)
					finalNormals.set( normalsArray.slice( indicesArray[i]*3,indicesArray[i]*3 + 3 ), i*3 );
				if(finalTexCoords)
					finalTexCoords.set( texcoordsArray.slice(indicesArray[i]*2,indicesArray[i]*2 + 2 ), i*2 );
			}
			positionsArray = finalVertices;
			if(finalNormals)
				normalsArray = finalNormals;
			if(finalTexCoords)
				texcoordsArray = finalTexCoords;
			indicesArray = null;
			max_index = 0;
		}

		//Create final mesh object
		var mesh = {};

		//create typed arrays
		if (hasPos)
			mesh.vertices = new Float32Array(positionsArray);
		if (hasNor && normalsArray.length > 0)
			mesh.normals = new Float32Array(normalsArray);
		if (hasTex && texcoordsArray.length > 0)
			mesh.coords = new Float32Array(texcoordsArray);
		if (indicesArray && indicesArray.length > 0)
			mesh.triangles = new (support_uint && max_index > 256*256 ? Uint32Array : Uint16Array)(indicesArray);

		//extra info
		mesh.bounding = GL.Mesh.computeBounding( mesh.vertices );
		var info = {};
		if(groups.length > 1)
		{
			info.groups = groups;
			//compute bounding of groups? //TODO
		}

		mesh.info = info;
		if( !mesh.bounding )
		{
			console.log("empty mesh");
			return null;
		}

		if( mesh.bounding.radius == 0 || isNaN(mesh.bounding.radius))
			console.log("no radius found in mesh");
		return mesh;
	}
};

LS.Formats.addSupportedFormat( "obj", parserOBJ );


//***** MTL parser *****************
//info from: http://paulbourke.net/dataformats/mtl/
var parserMTL = {
	extension: 'mtl',
	type: 'material',
	resource: 'StandardMaterial',
	format: 'text',
	dataType:'text',

	parse: function( text, options )
	{
		var lines = text.split("\n");
		var length = lines.length;

		var materials = {};
		var current_material = null;

		for (var lineIndex = 0;  lineIndex < length; ++lineIndex)
		{
			var line = lines[lineIndex].replace(/[ \t]+/g, " ").replace(/\s\s*$/, ""); //trim
			line = line.trim();

			if (line[0] == "#" || line == "")
				continue;

			var tokens = line.split(" ");
			var c = tokens[0];

			switch(c)
			{
				case "newmtl":
					var filename = tokens[1] + ".json";
					current_material = { filename: filename, textures: {} };
					materials[ filename ] = current_material;
					break;
				case "Ka":
					current_material.ambient = readVector3(tokens);
					break;
				case "Kd":
					current_material.color = readVector3(tokens);
					break;
				case "Ks":
					current_material.specular_factor = parseFloat(tokens[1]); //readVector3(tokens);
					break;
				case "Ke":
					current_material.emissive = readVector3(tokens); //readVector3(tokens);
					break;
				case "Ns": //glossiness
					current_material.specular_gloss = parseFloat(tokens[1]);
					break;
				case "Tr": //reflection coefficient
					current_material.reflection = parseFloat( tokens[1] );
					break;
				case "map_Kd":
					current_material.textures["color"] = this.clearPath( tokens[1] );
					current_material.color = [1,1,1];
					break;
				case "map_Ka":
					current_material.textures["ambient"] = this.clearPath( tokens[1] );
					current_material.ambient = [1,1,1];
					break;
				case "map_Ks":
					current_material.textures["specular"] = this.clearPath( tokens[1] );
					current_material.specular_factor = 1;
					break;
				case "bump":
				case "map_bump":
					current_material.textures["bump"] = this.clearPath( tokens[1] );
					break;
				case "d": //disolve is like transparency
					current_material.opacity = parseFloat( tokens[1] );
					break;
				case "Tr": //reflection coefficient
					current_material.opacity = parseFloat( tokens[1] );
					break;
				//Not supported stuff
				case "illum": //illumination model (raytrace related)
				case "Tf": //reflection by components
				case "Ni": //refraction coefficient
					break;
				default:
					console.log("Unknown MTL info: ", c);
					break;
			}
		}

		for(var i in materials)
		{
			var material_info = materials[i];

			//hack, ambient must be 1,1,1
			material_info.ambient = [1,1,1];

			var material = new LS.StandardMaterial(material_info);
			LS.RM.registerResource( material_info.filename, material );
		}

		return null;

		function readVector3(v)
		{
			return [ parseFloat(v[1]), parseFloat(v[2]), parseFloat(v[3]) ];
		}
	},

	clearPath: function(path)
	{
		var pos = path.lastIndexOf("\\");
		if(pos != -1)
			path = path.substr(pos+1);
		var filename = LS.RM.getFilename(path);
		if( LS.RM.resources_renamed_recently[filename] )
			filename = LS.RM.resources_renamed_recently[filename];
		return filename.toLowerCase();
	}
};

LS.Formats.addSupportedFormat( "mtl", parserMTL );