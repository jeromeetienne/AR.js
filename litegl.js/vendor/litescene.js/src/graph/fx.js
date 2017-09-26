if(typeof(LiteGraph) != "undefined")
{

// Texture Blur *****************************************
function LGraphFXStack()
{
	this.addInput("Color","Texture");
	this.addInput("Depth","Texture");
	this.addInput("Intensity","number");
	this.addOutput("Final","Texture");
	this.properties = { intensity: 1, preserve_aspect: true };

	this._fx_stack = new LS.FXStack();
	this._fx_options = {};
}

LGraphFXStack.title = "FXStack";
LGraphFXStack.desc = "Apply FXs to Texture";

LGraphFXStack.prototype.onExecute = function()
{
	var tex = this.getInputData(0);
	if(!tex)
		return;

	if(!this.isOutputConnected(0))
		return; //saves work

	var temp = this._final_texture;

	if(!temp || temp.width != tex.width || temp.height != tex.height || temp.type != tex.type )
	{
		//we need two textures to do the blurring
		this._final_texture = new GL.Texture( tex.width, tex.height, { type: tex.type, format: gl.RGBA, filter: gl.LINEAR });
	}

	var intensity = this.properties.intensity;
	if( this.isInputConnected(2) )
	{
		intensity = this.getInputData(2);
		this.properties.intensity = intensity;
	}

	//blur sometimes needs an aspect correction
	var aspect = LiteGraph.camera_aspect;
	if(!aspect && window.gl !== undefined)
		aspect = gl.canvas.height / gl.canvas.width;
	if(!aspect)
		aspect = 1;
	aspect = this.properties.preserve_aspect ? aspect : 1;

	this._fx_stack.applyFX( tex, this._final_texture, this._fx_options );

	this.setOutputData(0, this._final_texture);
}

LGraphFXStack.prototype.inspect = function( inspector )
{
	return this._fx_stack.inspect( inspector );
}

LGraphFXStack.prototype.getResources = function( resources )
{
	return this._fx_stack.getResources( resources );
}

LGraphFXStack.prototype.onSerialize = function( o )
{
	o.stack = this._fx_stack.serialize();
}

LGraphFXStack.prototype.onConfigure = function( o )
{
	if(o.stack)
		this._fx_stack.configure( o.stack );
}

LiteGraph.registerNodeType("texture/fxstack", LGraphFXStack );



}