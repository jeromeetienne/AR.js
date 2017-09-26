//WORK IN PROGRESS


/**
* Renders one mesh, it allows to configure the rendering primitive, the submesh (range of mesh) and a level of detail mesh
* @class SVGRenderer
* @namespace LS.Components
* @constructor
* @param {String} object to configure from
*/
function SVGRenderer(o)
{
	this.enabled = true;
	this.svg = null;

	if(o)
		this.configure(o);

	this._RI = new LS.RenderInstance( null, this );

	this._mesh = null;
	this._svg_data = null;
}

SVGRenderer.icon = "mini-icon-teapot.png";

//vars
SVGRenderer["@svg"] = { type: "resource" };

SVGRenderer.prototype.onAddedToScene = function( scene )
{
}

SVGRenderer.prototype.onRemovedFromScene = function( scene )
{
}

SVGRenderer.prototype.onAddedToNode = function( node )
{
	LEvent.bind( node, "collectRenderInstances", this.onCollectInstances, this );
	this._RI.node = node;
}

SVGRenderer.prototype.onRemovedFromNode = function( node )
{
	LEvent.unbind( node, "collectRenderInstances", this.onCollectInstances, this );
}

SVGRenderer.prototype.getMesh = function()
{
	if(!this.svg)
		return null;

	var svg = LS.ResourcesManager.getResource( this.svg );
	var mesh = null;

	if(this._svg_data === svg )
	{
		mesh = this._mesh;
	}

	if(!mesh)
		mesh = this._mesh = GL.Mesh.cube();
	return mesh;
}

SVGRenderer.prototype.onCollectInstances = function(e, instances)
{
	if(!this._enabled)
		return;

	var mesh = this.getMesh();
	if(!mesh)
		return null;

	var node = this._root;
	if(!this._root)
		return;

	var RI = this._RI;
	var is_static = this._root.flags && this._root.flags.is_static;
	var transform = this._root.transform;

	RI.setMatrix( this._root.transform._global_matrix );
	mat4.multiplyVec3( RI.center, RI.matrix, LS.ZEROS );

	//material (after flags because it modifies the flags)
	var material = this._root.getMaterial();
	RI.setMaterial( material );

	//buffers from mesh and bounding
	RI.setMesh( mesh, GL.TRIANGLES );
	RI.setRange(0,-1);
	RI.collision_mesh = mesh;
	instances.push( RI );
}

/**
* Configure from a serialized object
* @method configure
* @param {Object} object with the serialized info
*/
SVGRenderer.prototype.configure = function(o)
{
	if(o.enabled !== undefined)
		this.enabled = o.enabled;
	this.svg = o.svg;
}

/**
* Serialize the object 
* @method serialize
* @return {Object} object with the serialized info
*/
SVGRenderer.prototype.serialize = function()
{
	var o = { 
		enabled: this.enabled,
		svg: this.svg
	};
	return o;
}

SVGRenderer.prototype.getResources = function(res)
{
	if(typeof(this.svg) == "string")
		res[this.svg] = LS.Resource;
	return res;
}

SVGRenderer.prototype.onResourceRenamed = function (old_name, new_name, resource)
{
	if(this.svg == old_name)
		this.svg = new_name;
}


//LS.registerComponent( SVGRenderer );
