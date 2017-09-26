//***** STL Parser *****************
//based on https://github.com/tonylukasavage/jsstl
var parserSTL = {
	extension: 'stl',
	type: 'mesh',
	format: 'binary',
	dataType:'arraybuffer',
	
	parse: function( data, options )
	{
		options = options || {};

		var positionsArray = [];
		var normalsArray = [];
		var indicesArray = [];

		var dv = new DataView(data, 80); // 80 == unused header
		var isLittleEndian = true;
		var triangles = dv.getUint32(0, isLittleEndian); 
		// console.log('arraybuffer length:  ' + stl.byteLength);
		console.log('number of triangles: ' + triangles);
		var offset = 4;

		var tempA = vec3.create();
		var tempB = vec3.create();
		var tempC = vec3.create();
		var tempN = vec3.create();

		for (var i = 0; i < triangles; i++) {
			// Get the normal for this triangle
			var nx = dv.getFloat32(offset, isLittleEndian);
			var ny = dv.getFloat32(offset+4, isLittleEndian);
			var nz = dv.getFloat32(offset+8, isLittleEndian);

			offset += 12;
			// Get all 3 vertices for this triangle
			for (var j = 0; j < 3; j++) {
				var x = dv.getFloat32(offset, isLittleEndian);
				var y = dv.getFloat32(offset+4, isLittleEndian);
				var z = dv.getFloat32(offset+8, isLittleEndian);
				//positionsArray.push(x,y,z);
				positionsArray.push(x,z,-y); //flipped
				offset += 12
			}
			
			if(nx == 0 && ny == 0 && nz == 0) //compute normal
			{
				var l = positionsArray.length;
				tempA.set( positionsArray.slice(l-9,l-6) );
				tempB.set( positionsArray.slice(l-6,l-3) );
				tempC.set( positionsArray.slice(l-3,l) );
				vec3.sub( tempB, tempB, tempA );
				vec3.sub( tempC, tempC, tempA );
				vec3.cross( tempN, tempC, tempB );
				nx = tempN[0]; ny = tempN[1]; nz = tempN[2];
			}

			//normalsArray.push(nx,ny,nz,nx,ny,nz,nx,ny,nz);
			normalsArray.push(nx,nz,-ny,nx,nz,-ny,nx,nz,-ny); //flipped

			// there's also a Uint16 "attribute byte count" that we
			// don't need, it should always be zero.
			offset += 2;   
			// Create a new face for from the vertices and the normal             
			//indicesArray.push( i*3, i*3+1, i*3+2 );
		}
		// The binary STL I'm testing with seems to have all
		// zeroes for the normals, unlike its ASCII counterpart.
		// We can use three.js to compute the normals for us, though,
		// once we've assembled our geometry. This is a relatively 
		// expensive operation, but only needs to be done once.

		var mesh = { info: {} };

		mesh.vertices = new Float32Array(positionsArray);
		if (normalsArray.length > 0)
			mesh.normals = new Float32Array(normalsArray);
		if (indicesArray && indicesArray.length > 0)
			mesh.triangles = new Uint16Array(indicesArray);

		//extra info
		mesh.bounding = LS.Formats.computeMeshBounding( mesh.vertices );
		return mesh;
	}
};

LS.Formats.addSupportedFormat( "stl", parserSTL );
