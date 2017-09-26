//***** OBJ parser adapted from SpiderGL implementation *****************
/**
* Parses a OBJ string and returns an object with the info ready to be passed to GL.Mesh.load
* @method Mesh.parseOBJ
* @param {String} data all the OBJ info to be parsed
* @param {Object} options
* @return {Object} mesh information (vertices, coords, normals, indices)
*/

Mesh.parseOBJ = function(text, options)
{
	options = options || {};

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

	var hasPos = false;
	var hasTex = false;
	var hasNor = false;

	var parsingFaces = false;
	var indices_offset = 0;
	var negative_offset = -1; //used for weird objs with negative indices
	var max_index = 0;

	var skip_indices = options.noindex ? options.noindex : (text.length > 10000000 ? true : false);
	//trace("SKIP INDICES: " + skip_indices);
	var flip_axis = options.flipAxis;
	var flip_normals = (flip_axis || options.flipNormals);

	//used for mesh groups (submeshes)
	var group = null;
	var groups = [];
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
		line = lines[lineIndex].replace(/[ \t]+/g, " ").replace(/\s\s*$/, ""); //trim

		if (line[0] == "#") continue;
		if(line == "") continue;

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
			if( code != VT_CODE )
			{
				if(tokens[3] == '\\') //super weird case, OBJ allows to break lines with slashes...
				{
					//HACK! only works if the var is the thirth position...
					++lineIndex;
					line = lines[lineIndex].replace(/[ \t]+/g, " ").replace(/\s\s*$/, ""); //better than trim
					z = parseFloat(line);
				}
				else
					z = parseFloat(tokens[3]);
			}
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

			if (tokens.length < 4) continue; //faces with less that 3 vertices? nevermind

			//for every corner of this polygon
			var polygon_indices = [];
			for (var i=1; i < tokens.length; ++i) 
			{
				if (!(tokens[i] in facemap) || skip_indices) 
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
						console.err("Problem parsing: unknown number of values per face");
						return false;
					}

					if(i > 3 && skip_indices) //break polygon in triangles
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

					//add new vertex
					x = 0.0;
					y = 0.0;
					z = 0.0;
					if ((pos * 3 + 2) < positions.length) {
						hasPos = true;
						x = positions[pos*3+0];
						y = positions[pos*3+1];
						z = positions[pos*3+2];
					}
					positionsArray.push(x,y,z);

					//add new texture coordinate
					x = 0.0;
					y = 0.0;
					if ((tex * 2 + 1) < texcoords.length) {
						hasTex = true;
						x = texcoords[tex*2+0];
						y = texcoords[tex*2+1];
					}
					texcoordsArray.push(x,y);

					//add new normal
					x = 0.0;
					y = 0.0;
					z = 1.0;
					if(nor != -1)
					{
						if ((nor * 3 + 2) < normals.length) {
							hasNor = true;
							x = normals[nor*3+0];
							y = normals[nor*3+1];
							z = normals[nor*3+2];
						}
						
						normalsArray.push(x,y,z);
					}

					//Save the string "10/10/10" and tells which index represents it in the arrays
					if(!skip_indices)
						facemap[tokens[i]] = index++;
				}//end of 'if this token is new (store and index for later reuse)'

				//store key for this triplet
				if(!skip_indices)
				{
					var final_index = facemap[tokens[i]];
					polygon_indices.push(final_index);
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
		else if (code == G_CODE || tokens[0] == "usemtl") {
			negative_offset = positions.length / 3 - 1;

			if(tokens.length > 1)
			{
				if(group != null)
				{
					group.length = indicesArray.length - group.start;
					if(group.length > 0)
						groups.push(group);
				}

				group = {
					name: tokens[1],
					start: indicesArray.length,
					length: -1,
					material: ""
				};
			}
		}
		else if (tokens[0] == "usemtl") {
			if(group)
				group.material = tokens[1];
		}
		/*
		else if (tokens[0] == "o" || tokens[0] == "s") {
			//ignore
		}
		else
		{
			//console.log("unknown code: " + line);
		}
		*/
	}

	if(!positions.length)
	{
		console.error("OBJ doesnt have vertices, maybe the file is not a OBJ");
		return null;
	}

	if(group && (indicesArray.length - group.start) > 1)
	{
		group.length = indicesArray.length - group.start;
		groups.push(group);
	}

	//deindex streams
	if((max_index > 256*256 || skip_indices ) && indicesArray.length > 0)
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
		mesh.triangles = new Uint16Array(indicesArray);

	var info = {};
	if(groups.length > 1)
		info.groups = groups;
	mesh.info = info;

	var final_mesh = null;
	
	final_mesh = Mesh.load(mesh, null, options.mesh);
	final_mesh.updateBounding();
	return final_mesh;
}

Mesh.parsers["obj"] = Mesh.parseOBJ.bind( Mesh );

Mesh.encoders["obj"] = function( mesh, options )
{
	//store vertices
	var verticesBuffer = mesh.getBuffer("vertices");
	if(!verticesBuffer)
		return null;

	var result = "# Generated with liteGL.js by Javi Agenjo\n\n";

	var vertices = verticesBuffer.data;
	for (var i = 0; i < vertices.length; i+=3)
		result += "v " + vertices[i].toFixed(4) + " " + vertices[i+1].toFixed(4) + " " + vertices[i+2].toFixed(4) + "\n";

	//store normals
	var normalsBuffer = mesh.getBuffer("normals");
	if(normalsBuffer)
	{
		result += "\n";
		var normals = normalsBuffer.data;
		for (var i = 0; i < normals.length; i+=3)
			result += "vn " + normals[i].toFixed(4) + " " + normals[i+1].toFixed(4) + " " + normals[i+2].toFixed(4) + "\n";
	}
	
	//store uvs
	var coordsBuffer = mesh.getBuffer("coords");
	if(coordsBuffer)
	{
		result += "\n";
		var coords = coordsBuffer.data;
		for (var i = 0; i < coords.length; i+=2)
			result += "vt " + coords[i].toFixed(4) + " " + coords[i+1].toFixed(4) + " " + " 0.0000\n";
	}

	result += "\ng mesh\n";

	//store faces
	var indicesBuffer = mesh.getIndexBuffer("triangles");
	if(indicesBuffer)
	{
		var indices = indicesBuffer.data;
		for (var i = 0; i < indices.length; i+=3)
			result += "f " + (indices[i]+1) + "/" + (indices[i]+1) + "/" + (indices[i]+1) + " " + (indices[i+1]+1) + "/" + (indices[i+1]+1) + "/" + (indices[i+1]+1) + " " + (indices[i+2]+1) + "/" + (indices[i+2]+1) + "/" + (indices[i+2]+1) + "\n";
	}
	else //no indices
	{
		for (var i = 0; i < (vertices.length / 3); i+=3)
			result += "f " + (i+1) + "/" + (i+1) + "/" + (i+1) + " " + (i+2) + "/" + (i+2) + "/" + (i+2) + " " + (i+3) + "/" + (i+3) + "/" + (i+3) + "\n";
	}
	
	return result;
}
