/**
* This component allow to create basic FX applied to the whole scene
* @class FrameFX
* @param {Object} o object with the serialized info
*/
function FrameFX(o)
{
	this.enabled = true;

	this.fx = new LS.FXStack( o ? o.fx : null );
	this.frame = new LS.RenderFrameContext();
	this.frame.use_depth_texture = true;
	this.use_antialiasing = false;
	this.shader_material = null;

	if(o)
		this.configure(o);
}

FrameFX.icon = "mini-icon-fx.png";

FrameFX.prototype.configure = function(o)
{
	this.enabled = !!o.enabled;
	this.use_viewport_size = !!o.use_viewport_size;
	this.use_antialiasing = !!o.use_antialiasing;
	this.shader_material = o.shader_material;
	if(o.fx)
		this.fx.configure( o.fx );
	if(o.frame)
		this.frame.configure( o.frame );
}

FrameFX.prototype.serialize = function()
{
	return { 
		object_class: "FrameFX",
		enabled: this.enabled,
		uid: this.uid,
		frame: this.frame.serialize(),
		shader_material: this.shader_material,
		use_antialiasing: this.use_antialiasing,
		use_viewport_size: this.use_viewport_size,
		fx: this.fx.serialize()
	};
}

FrameFX.prototype.getResources = function( res )
{
	this.fx.getResources(res);
	if(this.shader_material)
		res[ this.shader_material ] = true;
	return res;
}

FrameFX.prototype.onResourceRenamed = function( old_name, new_name, resource )
{
	if( this.shader_material == old_name )
		this.shader_material = new_name;
	else
		this.fx.onResourceRenamed( old_name, new_name, resource );
}

FrameFX.prototype.addFX = function( name )
{
	this.fx.addFX(name);
}

FrameFX.prototype.getFX = function(index)
{
	return this.fx.getFX( index );
}

FrameFX.prototype.moveFX = function( fx, offset )
{
	return this.fx.moveFX(fx,offset);
}

FrameFX.prototype.removeFX = function( fx )
{
	return this.fx.removeFX( fx );
}

FrameFX.prototype.onAddedToScene = function( scene )
{
	LEvent.bind( scene, "enableFrameContext", this.onBeforeRender, this );
	LEvent.bind( scene, "showFrameContext", this.onAfterRender, this );
}

FrameFX.prototype.onRemovedFromScene = function( scene )
{
	LEvent.unbind( scene, "enableFrameContext", this.onBeforeRender, this );
	LEvent.unbind( scene, "showFrameContext", this.onAfterRender, this );
}

//hook the RFC
FrameFX.prototype.onBeforeRender = function(e, render_settings)
{
	if(!this.enabled)
		return;

	this.enableFrameFBO( render_settings );
}

FrameFX.prototype.onAfterRender = function( e, render_settings )
{
	if(!this.enabled)
		return;
	this.showFBO();
}

FrameFX.prototype.enableFrameFBO = function( render_settings )
{
	if(!this.enabled)
		return;

	this.frame.enable( render_settings );
}

FrameFX.prototype.showFBO = function()
{
	if(!this.enabled)
		return;

	this.frame.disable();

	LEvent.trigger( LS.Renderer, "beforeShowFrameContext", this.frame );

	if(this.shader_material)
	{
		var material = LS.ResourcesManager.getResource( this.shader_material );
		var rendered = false;
		if(material && material.constructor === LS.ShaderMaterial )
			rendered = material.applyToTexture( this.frame._color_texture );
		if(!rendered)
			this.frame._color_texture.toViewport(); //fallback in case the shader is missing
		return;
	}

	if( this._viewport )
	{
		gl.setViewport( this._viewport );
		this.applyFX();
		gl.setViewport( this.frame._fbo._old_viewport );
	}
	else
		this.applyFX();
}

FrameFX.prototype.applyFX = function()
{
	var color_texture = this.frame._color_texture;
	var depth_texture = this.frame._depth_texture;

	this.fx.apply_fxaa = this.use_antialiasing;
	this.fx.filter = this.frame.filter_texture;
	this.fx.applyFX( color_texture, null, { depth_texture: depth_texture } );
}

LS.registerComponent( FrameFX );