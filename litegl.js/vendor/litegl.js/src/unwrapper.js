
(function(global){

// Texture coordinates generator (for lightmaps, etc)
// Work in progress, NOT FINISHED
function Unwrapper( mesh, options )
{
	var verticesBuffer = mesh.vertexBuffers["vertices"];
	var indicesBuffer = mesh.indexBuffers["triangles"];

	if(!indices)
	{
		console.error("Only can generate UVs from indexed meshes");
		return false;
	}

	var vertices = verticesBuffer.data;
	var indices = IndicesBuffer.data;
	var num_triangles = indices.length / 3;

	//triplanar separation *********************
	var blocks = [];
	for(var i = 0; i < 6; ++i)
		blocks[i] = new Unwrapper.Block();

	var AB = vec3.create();
	var BC = vec3.create();
	var CA = vec3.create();
	var N = vec3.create();

	//blocks: 0:+X, 1:-X, 2:+Y, 3:-Y, 4:+Z, 5:-Z
	var BVs = new Float32Array(6);
	var chart_candidates = Array(3);

	//for every triangle add it to a chart in a block
	for(var i = 0; i < num_triangles; ++i)
	{
		var Ai = indices[i*3];
		var Bi = indices[i*3+1];
		var Ci = indices[i*3+2];

		var A = vertices.subarray( Ai, Ai + 3 );
		var B = vertices.subarray( Bi, Bi + 3 );
		var C = vertices.subarray( Ci, Ci + 3 );

		vec3.sub( AB, B, A );
		vec3.sub( BC, B, C );
		vec3.sub( CA, A, C );

		//compute normal
		vec3.cross( N, AB, CA ); //we should us AC but doesnt matter, we will fix it
		var len = vec3.length( N );
		vec3.scale( N, N, -len ); //reverse and normalize

		//compute which block belongs
		var max = -2; var block_id = -1;
		BVs[0] = N[0]; BVs[1] = N[1]; BVs[2] = N[2];
		BVs[3] = -N[0]; BVs[4] = -N[1]; BVs[5] = -N[2];
		for(var j = 0; j < 6; ++j)
		{
			if(BVs[j] < max)
				continue;
			block_id = j;
			max = BVs[j];
		}

		//get block
		var block = blocks[ block_id ];

		//search for chart
		var ABname = Ai + "," + Bi;
		var BCname = Bi + "," + Ci;
		var CAname = Ci + "," + Ai;

		chart = block.by_edge[ ABname ];
		chart_candidates[0] = block.by_edge[ ABname ];
		chart_candidates[1] = block.by_edge[ BCname ];
		chart_candidates[2] = block.by_edge[ CAname ];

		if( chart_candidates[0] && chart_candidates[1] && chart_candidates[0] != chart_candidates[1] )
		{
			chart_candidates[0].mergeWith( chart_candidates[1] );
			block.removeChart( chart_candidates[1] );
			chart_candidates[1] = null;
		}

		if( chart_candidates[0] && chart_candidates[2] && chart_candidates[0] != chart_candidates[2] )
		{
			chart_candidates[0].mergeWith( chart_candidates[2] );
			block.removeChart( chart_candidates[2] );
			chart_candidates[2] = null;
		}

		if( chart_candidates[1] && chart_candidates[2] && chart_candidates[1] != chart_candidates[2] )
		{
			chart_candidates[1].mergeWith( chart_candidates[2] );
			block.removeChart( chart_candidates[2] );
			chart_candidates[2] = null;
		}

		var final_chart = chart_candidates[0] || chart_candidates[1] || chart_candidates[2];

		if( !final_chart )
		{
			final_chart = new Unwrapper.Chart();
			block.addChart( final_chart );
		}

		//add triangle to chart
		final_chart.addTriangle( A,B,C );
	}

	//put all charts together
	var final_chart_list = [];
	for(var i = 0; i < blocks.length; ++i)
	{
		var block = blocks[i];
		if(block)
			final_chart_list = final_chart_list.concat( block.charts );
	}

	//compute bounding and area of every chart
	var total_area = 0;
	for(var i = 0; i < final_chart_list.length; ++i)
	{
		var chart = final_chart_list[i];
		chart.computeInfo();
		total_area += chart.area;
	}

	//arrange charts from big to small
	final_chart_list.sort( function ( A, B ) { return A.area - B.area; } );

	//compute best possible area size
	var area_size = Math.sqrt( total_area );
	for(var i = 0; i < final_chart_list.length; ++i)
	{
		var chart = final_chart_list[i];
		if(area_size < chart.width)
			area_size = chart.width;
		if(area_size < chart.height)
			area_size = chart.height;
	}

	var root = { x:0, y: 0, width: area_size, height: area_size };

	//for every Chart
		//check in which region belongs
			//add it to the smallest where it fits
			//subdivide
		//no region found, increase size and restart
}

function Block = function()
{
	this.by_edge = {};
	this.charts = [];
}

Block.addChart = function( chart )
{
	chart.block = this;
	this.charts.push( chart );
}

Block.removeChart = function( chart )
{
	var index = this.charts.indexOf( chart );
	if(index != -1)
		this.charts.splice(index,1);
	for(var i in chart.edges)
	{
		var edge = chart.edges[i];
		delete this.by_edge[ edge[0]+","+edge[1] ];
	}
}

Unwrapper.Block = Block;


function Chart()
{
	this.width = -1;
	this.height = -1;
	this.x = -1;
	this.y = -1;
	this.area = -1;

	this.edges = [];
	this.triangles = [];
}

Chart.prototype.addTriangle = function( Ai,Bi,Ci, A,B,C )
{
	//remove edge
	for(var i = 0; i < this.edges.length; ++i)
	{
		var edge = this.edges[i];
		if( edge[0] == Ai )
		{
		
		}
	}
	//add edges
	//add triangle
}

Chart.prototype.mergeWith = function( chart )
{
	//transfer edges
}

Chart.prototype.computeInfo = function()
{
	//compute bounding and area
}

Unwrapper.Chart = Chart;

global.Unwrapper = GL.Unwrapper = Unwrapper;

})( typeof(window) === "undefined" ? self : window );