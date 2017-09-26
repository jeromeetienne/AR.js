//3dcgart format

var parserCGArtMesh = { 
	extension: 'cgart',
	type: 'mesh',
	format: 'text',
	dataType:'string',

	parse: function(data,options)
	{
		var m = null;

		if(typeof(data) == "object")
			m = data;
		else if(typeof(data) == "string")
			m = JSON.parse(data);

		m.faces = m.faces[0];
		m.normals = m.normals[0];
		m.vertices = m.vertices[0];
		m.uvs = m.uvs[0][0];

		var vertices = [];
		var normals = [];
		var uvs = [];

		var group = null;
		var groups = [];

		var i = 0;
		var current_mat_id = 0;
		while( i < m.faces.length )
		{
			if(m.faces[i] == 43) //quad
			{
				//material info
				var mat_id = m.faces[i+5];
				if(current_mat_id < mat_id)
				{
					current_mat_id = mat_id;
					if(group != null)
					{
						group.length = vertices.length / 3 - group.start;
						if(group.length > 0)
							groups.push(group);
					}

					group = {
						name: "mat_" + mat_id,
						start: vertices.length / 3,
						length: -1,
						material: ""
					};
				}

				var v1 = m.faces[i+1];
				var v2 = m.faces[i+2];
				var v3 = m.faces[i+3];
				var v4 = m.faces[i+4];
				vertices.push( m.vertices[ v1*3 ], m.vertices[ v1*3+1 ], m.vertices[ v1*3+2 ]);
				vertices.push( m.vertices[ v2*3 ], m.vertices[ v2*3+1 ], m.vertices[ v2*3+2 ]);
				vertices.push( m.vertices[ v3*3 ], m.vertices[ v3*3+1 ], m.vertices[ v3*3+2 ]);
				vertices.push( m.vertices[ v1*3 ], m.vertices[ v1*3+1 ], m.vertices[ v1*3+2 ]);
				vertices.push( m.vertices[ v3*3 ], m.vertices[ v3*3+1 ], m.vertices[ v3*3+2 ]);
				vertices.push( m.vertices[ v4*3 ], m.vertices[ v4*3+1 ], m.vertices[ v4*3+2 ]);

				var v1 = m.faces[i+6];
				var v2 = m.faces[i+7];
				var v3 = m.faces[i+8];
				var v4 = m.faces[i+9];
				uvs.push( m.uvs[ v1*2 ], m.uvs[ v1*2+1 ]);
				uvs.push( m.uvs[ v2*2 ], m.uvs[ v2*2+1 ]);
				uvs.push( m.uvs[ v3*2 ], m.uvs[ v3*2+1 ]);
				uvs.push( m.uvs[ v1*2 ], m.uvs[ v1*2+1 ]);
				uvs.push( m.uvs[ v3*2 ], m.uvs[ v3*2+1 ]);
				uvs.push( m.uvs[ v4*2 ], m.uvs[ v4*2+1 ]);

				var v1 = m.faces[i+10];
				var v2 = m.faces[i+11];
				var v3 = m.faces[i+12];
				var v4 = m.faces[i+13];
				normals.push( m.normals[ v1*3 ], m.normals[ v1*3+1 ], m.normals[ v1*3+2 ]);
				normals.push( m.normals[ v2*3 ], m.normals[ v2*3+1 ], m.normals[ v2*3+2 ]);
				normals.push( m.normals[ v3*3 ], m.normals[ v3*3+1 ], m.normals[ v3*3+2 ]);
				normals.push( m.normals[ v1*3 ], m.normals[ v1*3+1 ], m.normals[ v1*3+2 ]);
				normals.push( m.normals[ v3*3 ], m.normals[ v3*3+1 ], m.normals[ v3*3+2 ]);
				normals.push( m.normals[ v4*3 ], m.normals[ v4*3+1 ], m.normals[ v4*3+2 ]);

				i+=14;
			}
			else if(m.faces[i] == 42) //triangle
			{
				//material info
				var mat_id = m.faces[i+4];
				if(current_mat_id < mat_id)
				{
					console.log("New mat: " + mat_id );
					current_mat_id = mat_id;
					if(group != null)
					{
						group.length = vertices.length / 3 - group.start;
						if(group.length > 0)
							groups.push(group);
					}

					group = {
						name: "mat_" + mat_id,
						start: vertices.length / 3,
						length: -1,
						material: ""
					};
				}

				var v1 = m.faces[i+1];
				var v2 = m.faces[i+2];
				var v3 = m.faces[i+3];
				vertices.push( m.vertices[ v1*3 ], m.vertices[ v1*3+1 ], m.vertices[ v1*3+2 ]);
				vertices.push( m.vertices[ v2*3 ], m.vertices[ v2*3+1 ], m.vertices[ v2*3+2 ]);
				vertices.push( m.vertices[ v3*3 ], m.vertices[ v3*3+1 ], m.vertices[ v3*3+2 ]);

				var v1 = m.faces[i+5];
				var v2 = m.faces[i+6];
				var v3 = m.faces[i+7];
				uvs.push( m.uvs[ v1*2 ], m.uvs[ v1*2+1 ]);
				uvs.push( m.uvs[ v2*2 ], m.uvs[ v2*2+1 ]);
				uvs.push( m.uvs[ v3*2 ], m.uvs[ v3*2+1 ]);

				var v1 = m.faces[i+8];
				var v2 = m.faces[i+9];
				var v3 = m.faces[i+10];
				normals.push( m.normals[ v1*3 ], m.normals[ v1*3+1 ], m.normals[ v1*3+2 ]);
				normals.push( m.normals[ v2*3 ], m.normals[ v2*3+1 ], m.normals[ v2*3+2 ]);
				normals.push( m.normals[ v3*3 ], m.normals[ v3*3+1 ], m.normals[ v3*3+2 ]);

				i += 11;
			}
			else 
			{
				console.log("Warning: unsupported primitive type: " + m.faces[i]);
				i += 1;
			}
		}

		if(group && (vertices.length - group.start) > 1)
		{
			group.length = vertices.length - group.start;
			groups.push(group);
		}

		var mesh = {};
		mesh.vertices = new Float32Array( vertices );
		if(normals.length > 0)
			mesh.normals = new Float32Array( normals );
		if(uvs.length > 0)
			mesh.coords = new Float32Array( uvs );
		//mesh.coords = new Float32Array( m.uvs );
		//if(m.faces) mesh.triangles = new Uint16Array( m.faces );

		//extra info
		mesh.bounding = LS.Formats.computeMeshBounding(mesh.vertices);
		mesh.info = {};
		if(groups.length > 1)
			mesh.info.groups = groups;

		console.log("Num vertex: " + vertices.length / 3);
		console.log(mesh.info.groups);

		return mesh;
	}
};

LS.Formats.addSupportedFormat( "cgart", parserCGArtMesh );


//GR2
var parserGR2 = { 
	extension: 'gr2',
	type: 'mesh',
	format: 'text',
	dataType:'string',

	parse: function(data, options)
	{
		data = data.replace(/\'/g,'\"');
		console.log(data);
		data = JSON.parse("["+data+"]");
		window.foo = data;
		data = data[0];
		var mesh = {
		  vertices: data[0][2][0],
		  normals: data[0][2][1],
		  triangles: data[0][3]
		};
		mesh.bounding = LS.Formats.computeMeshBounding(mesh.vertices);
		return mesh;
	}
};

LS.Formats.addSupportedFormat( "gr2", parserGR2 );


