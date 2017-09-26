/**
* This component allow to create basic FX
* @class CameraFX
* @param {Object} o object with the serialized info
*/
function CameraFX( o )
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

CameraFX.icon = "mini-icon-fx.png";
CameraFX["@camera_uid"] = { type: "String" };

Object.defineProperty( CameraFX.prototype, "use_antialiasing", { 
	set: function(v) { this.fx.apply_fxaa = v; },
	get: function() { return this.fx.apply_fxaa; },
	enumerable: true
});

CameraFX.prototype.configure = function(o)
{
	this.enabled = !!o.enabled;
	this.use_antialiasing = !!o.use_antialiasing;
	this.camera_uid = o.camera_uid;
	if(o.frame)
		this.frame.configure( o.frame );
	if(o.fx)
		this.fx.configure(o.fx);
}

CameraFX.prototype.serialize = function()
{
	return { 
		object_class: "CameraFX",
		enabled: this.enabled,
		use_antialiasing: this.use_antialiasing,
		frame: this.frame.serialize(),
		camera_uid: this.camera_uid,
		fx: this.fx.serialize()
	};
}

CameraFX.prototype.getResources = function( res )
{
	this.fx.getResources(res);
	if(this.shader_material)
		res[ this.shader_material ] = true;
	return res;
}

CameraFX.prototype.onResourceRenamed = function( old_name, new_name, resource )
{
	if( this.shader_material == old_name )
		this.shader_material = new_name;
	else
		this.fx.onResourceRenamed( old_name, new_name, resource );
}


CameraFX.prototype.addFX = function( name )
{
	this.fx.addFX(name);
}

CameraFX.prototype.getFX = function(index)
{
	return this.fx.getFX( index );
}

CameraFX.prototype.moveFX = function( fx, offset )
{
	return this.fx.moveFX(fx,offset);
}

CameraFX.prototype.removeFX = function( fx )
{
	return this.fx.removeFX( fx );
}

CameraFX.prototype.onAddedToScene = function( scene )
{
	LEvent.bind( scene, "enableFrameContext", this.onBeforeRender, this );
	LEvent.bind( scene, "showFrameContext", this.onAfterRender, this );
}

CameraFX.prototype.onRemovedFromScene = function( scene )
{
	LEvent.unbind( scene, "enableFrameContext", this.onBeforeRender, this );
	LEvent.unbind( scene, "showFrameContext", this.onAfterRender, this );

	if( this._binded_camera )
	{
		LEvent.unbindAll( this._binded_camera, this );
		this._binded_camera = null;
	}
}

//hook the RFC
CameraFX.prototype.onBeforeRender = function(e, render_settings)
{
	if(!this.enabled)
	{
		if( this._binded_camera )
		{
			LEvent.unbindAll( this._binded_camera, this );
			this._binded_camera = null;
		}
		return;
	}

	//FBO for one camera
	var camera = this._root.camera;
	if(this.camera_uid)
	{
		if( !this._binded_camera || this._binded_camera.uid != this.camera_uid )
			camera = this._binded_camera;
		else
			camera = this._root.scene.findComponentByUId( this.camera_uid );
	}

	if(!camera)
	{
		if( this._binded_camera )
		{
			LEvent.unbindAll( this._binded_camera, this );
			this._binded_camera = null;
		}
		return;
	}

	if(camera && camera != this._binded_camera)
	{
		if(this._binded_camera)
			LEvent.unbindAll( this._binded_camera, this );
		LEvent.bind( camera, "enableFrameContext", this.enableCameraFBO, this );
		LEvent.bind( camera, "showFrameContext", this.showCameraFBO, this );
	}
	this._binded_camera = camera;
}

CameraFX.prototype.onAfterRender = function( e, render_settings )
{
	if(!this.enabled)
		return;
	//this.showFBO();
}

CameraFX.prototype.enableCameraFBO = function(e, render_settings )
{
	if(!this.enabled)
		return;

	var camera = this._binded_camera;
	var viewport = this._viewport = camera.getLocalViewport( null, this._viewport );
	this.frame.enable( render_settings, viewport );

	render_settings.ignore_viewports = true;
}

CameraFX.prototype.showCameraFBO = function(e, render_settings )
{
	if(!this.enabled)
		return;
	render_settings.ignore_viewports = false;
	this.showFBO();
}

CameraFX.prototype.showFBO = function()
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


CameraFX.prototype.applyFX = function()
{
	var color_texture = this.frame._color_texture;
	var depth_texture = this.frame._depth_texture;

	this.fx.apply_fxaa = this.use_antialiasing;
	this.fx.filter = this.frame.filter_texture;
	this.fx.applyFX( color_texture, null, { depth_texture: depth_texture } );
}

LS.registerComponent( CameraFX );