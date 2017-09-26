function CustomDeformer(o)
{
	this.enabled = true;
	this.deformer_code = "";

	if(o)
		this.configure(o);
}

CustomDeformer.icon = "mini-icon-teapot.png";


CustomDeformer.prototype.onAddedToNode = function(node)
{
	LEvent.bind(node, "collectRenderInstances", this.onCollectInstances, this);
}

CustomDeformer.prototype.onRemovedFromNode = function(node)
{
	LEvent.unbind(node, "collectRenderInstances", this.onCollectInstances, this);
}

CustomDeformer.prototype.onCollectInstances = function( e, render_instances )
{
	if(!render_instances.length)
		return;

	var last_RI = render_instances[ render_instances.length - 1];
	
	if(!this.enabled)
	{
		//disable
		this.disableDeformer( last_RI );
		return;
	}

	//grab the RI created previously and modified
	this.applyDeformer( last_RI );
}


CustomDeformer.prototype.applyDeformer = function( RI )
{
	var base_mesh = RI.mesh;
	if( !base_mesh )
		return;

	//TODO
}

CustomDeformer.prototype.onShaderQuery = function(e, query)
{
	if(!this.enabled)
		return;

	if(query.macros.USE_VERTEX_SHADER_UNIFORMS)
		query.macros.USE_VERTEX_SHADER_UNIFORMS += this._uniforms_code;
	else
		query.macros.USE_VERTEX_SHADER_UNIFORMS = this._uniforms_code;

	if(query.macros.USE_VERTEX_SHADER_CODE)
		query.macros.USE_VERTEX_SHADER_CODE += this._code;
	else
		query.macros.USE_VERTEX_SHADER_CODE = this._code;
}


CustomDeformer.prototype.disableDeformer = function( RI )
{
	if( RI.query && RI.query.macros["USE_MORPHING"] !== undefined )
	{
		//TODO
	}
}

CustomDeformer.prototype.getPropertyInfoFromPath = function( path )
{
	return;

	//TODO

	if(path.length == 1)
		return {
			node: this._root,
			target: this.morph_targets,
			type: "object"
		};

	var num = parseInt( path[1] );
	if(num >= this.morph_targets.length)
		return;

	var varname = path[2];
	if(varname != "mesh" && varname != "weight")
		return;

	return {
		node: this._root,
		target: this.morph_targets,
		name: varname,
		value: this.morph_targets[num][ varname ] !== undefined ? this.morph_targets[num][ varname ] : null,
		type: varname == "mesh" ? "mesh" : "number"
	};
}

CustomDeformer.prototype.setPropertyValueFromPath = function( path, value )
{
	if( path.length < 1 )
		return;

	if( path[0] != "morphs" )
		return;

	var num = parseInt( path[1] );
	if(num >= this.morph_targets.length)
		return;

	var varname = path[2];
	this.morph_targets[num][ varname ] = value;
}

LS.registerComponent( CustomDeformer );
LS.CustomDeformer = CustomDeformer;