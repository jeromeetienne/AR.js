//legacy format
var parserJSMesh = { 
	extension: 'jsmesh',
	type: 'mesh',
	format: 'text',
	dataType:'string',

	parse: function(data,options)
	{
		var mesh = null;

		if(typeof(data) == "object")
			mesh = data;
		else if(typeof(data) == "string")
			mesh = JSON.parse(data);

		if(mesh.vertices.constructor == Array) //for deprecated formats
		{
			mesh.vertices = typeof( mesh.vertices[0] ) == "number" ? mesh.vertices : linearizeArray(mesh.vertices);
			if(mesh.normals) mesh.normals = typeof( mesh.normals[0] ) == "number" ? mesh.normals : linearizeArray(mesh.normals);
			if(mesh.coords) mesh.coords = typeof( mesh.coords[0] ) == "number" ? mesh.coords : linearizeArray(mesh.coords);
			if(mesh.triangles) mesh.triangles = typeof( mesh.triangles[0] ) == "number" ? mesh.triangles : linearizeArray(mesh.triangles);

			mesh.vertices = new Float32Array(mesh.vertices);
			if(mesh.normals) mesh.normals = new Float32Array(mesh.normals);
			if(mesh.coords) mesh.coords = new Float32Array(mesh.coords);
			if(mesh.triangles) mesh.triangles = new Uint16Array(mesh.triangles);
		}

		if(!mesh.bounding)
			mesh.bounding = LS.Formats.computeMeshBounding(mesh.vertices);
		return mesh;
	}
};

LS.Formats.addSupportedFormat( "jsmesh", parserJSMesh );
