//WIP: this is the lowest GPU rendering object, which encapsulates all about a render call
//by encapsulating every render action into an object we can have materials that produce several render passes in different moments
//of the rendering process
//the only problem is that uniform containrs could change between render calls which will lead to errors 

function RenderCall()
{
	this.shader = null;
	this.uniforms_containers = [];
	this.vertex_buffers = null;
	this.index_buffer = null;
	this.offset_start = -1;
	this.offset_range = -1;
	this.primitive = -1;

	this.renderState = null;
}

RenderCall.prototype.draw = function()
{
	this.renderState.enable();

	this.shader.uniforms( this.uniforms ).drawBuffers( this.vertex_buffers,
	  this.index_buffer,
	  this.primitive, this.offset_start, this.offset_range );
}

//Pool
RenderCall.pool = [];

RenderCall.get = function()
{
	if( RenderCall.pool.length > 0 )
		return RenderCall.pool.pop();
	return new RenderCall();
}

RenderCall.prototype.release = function()
{
	RenderCall.pool.push(this);
}
