/**	RenderFrameContext
*	This class is used when you want to render the scene not to the screen but to some texture for postprocessing
*	It helps to create the textures and bind them easily, add extra buffers or show it on the screen.
*	Check the FrameFX and CameraFX components to see it in action.
*
* @class RenderFrameContext
* @namespace LS
* @constructor
*/
function RenderFrameContext( o )
{
	this.width = 0; //0 means the same size as the viewport, negative numbers mean reducing the texture in half N times
	this.height = 0; //0 means the same size as the viewport
	this.precision = RenderFrameContext.DEFAULT_PRECISION; //LOW_PRECISION uses a byte, MEDIUM uses a half_float, HIGH uses a float
	this.filter_texture = true; //magFilter: in case the texture is shown, do you want to see it pixelated?
	this.format = GL.RGBA; //how many color channels
	this.use_depth_texture = false; //store the depth in a texture
	this.use_stencil_buffer = false; //add an stencil buffer (cannot be read as a texture in webgl)
	this.num_extra_textures = 0; //number of extra textures in case we want to render to several buffers
	this.name = null; //if a name is provided all the textures will be stored in the LS.ResourcesManager

	this.generate_mipmaps = false; //try to generate mipmaps if possible (only when the texture is power of two)
	this.adjust_aspect = false; //when the size doesnt match the canvas size it could look distorted, settings this to true will fix the problem
	this.clone_after_unbind = false; //clones the textures after unbinding it. Used when the texture will be in the 3D scene

	this._fbo = null;
	this._color_texture = null;
	this._depth_texture = null;
	this._textures = []; //all color textures (the first will be _color_texture)
	this._cloned_textures = null; //in case we set the clone_after_unbind to true

	this._version = 1; //to detect changes

	if(o)
		this.configure(o);
}

RenderFrameContext.current = null;
RenderFrameContext.stack = [];

RenderFrameContext.DEFAULT_PRECISION = 0; //selected by the renderer
RenderFrameContext.LOW_PRECISION = 1; //byte
RenderFrameContext.MEDIUM_PRECISION = 2; //half_float or float
RenderFrameContext.HIGH_PRECISION = 3; //float

RenderFrameContext.DEFAULT_PRECISION_WEBGL_TYPE = GL.UNSIGNED_BYTE;

RenderFrameContext["@width"] = { type: "number", step: 1, precision: 0 };
RenderFrameContext["@height"] = { type: "number", step: 1, precision: 0 };
RenderFrameContext["@precision"] = { widget: "combo", values: { 
	"default": RenderFrameContext.DEFAULT_PRECISION, 
	"low": RenderFrameContext.LOW_PRECISION,
	"medium": RenderFrameContext.MEDIUM_PRECISION,
	"high": RenderFrameContext.HIGH_PRECISION
	}
};

RenderFrameContext["@format"] = { widget: "combo", values: { 
	"RGB": GL.RGB,
	"RGBA": GL.RGBA
	}
};

RenderFrameContext["@num_extra_textures"] = { type: "number", step: 1, min: 0, max: 4, precision: 0 };
RenderFrameContext["@name"] = { type: "string" };

RenderFrameContext.prototype.clear = function()
{
	if(this.name)
	{
		for(var i = 0; i < this._textures.length; ++i)
			delete LS.ResourcesManager.textures[ this.name + (i > 1 ? i : "") ];
		if(this._depth_texture)
			delete LS.ResourcesManager.textures[ this.name + "_depth"];
	}

	this._fbo = null;
	this._textures = [];
	this._color_texture = null;
	this._depth_textures = null;
}

RenderFrameContext.prototype.configure = function(o)
{
	this.width = o.width || 0;
	this.height = o.height || 0;
	this.format = o.format || GL.RGBA;
	this.precision = o.precision || 0;
	this.filter_texture = !!o.filter_texture;
	this.adjust_aspect = !!o.adjust_aspect;
	this.use_depth_texture = !!o.use_depth_texture;
	this.use_stencil_buffer = !!o.use_stencil_buffer;
	this.num_extra_textures = o.num_extra_textures || 0;
	this.name = o.name;
	this.clone_after_unbind = !!o.clone_after_unbind;
}

RenderFrameContext.prototype.serialize = function()
{
	return {
		width: this.width,
		height:  this.height,
		filter_texture: this.filter_texture,
		precision:  this.precision,
		format: this.format,
		adjust_aspect: this.adjust_aspect,
		use_depth_texture:  this.use_depth_texture,
		use_stencil_buffer: this.use_stencil_buffer,
		num_extra_textures:  this.num_extra_textures,
		clone_after_unbind: this.clone_after_unbind,
		name: this.name
	};
}

RenderFrameContext.prototype.prepare = function( viewport_width, viewport_height )
{
	//compute the right size for the textures
	var final_width = this.width;
	var final_height = this.height;
	if(final_width == 0)
		final_width = viewport_width;
	else if(final_width < 0)
		final_width = viewport_width >> Math.abs( this.width ); //subsampling
	if(final_height == 0)
		final_height = viewport_height;
	else if(final_height < 0)
		final_height = viewport_height >> Math.abs( this.height ); //subsampling

	var format = this.format;
	var magFilter = this.filter_texture ? gl.LINEAR : gl.NEAREST ;
	var type = 0;

	var minFilter = gl.LINEAR;
	if(this.generate_mipmaps && GL.isPowerOfTwo(final_width) && GL.isPowerOfTwo(final_height) )
		minFilter = gl.LINEAR_MIPMAP_LINEAR;

	switch( this.precision )
	{
		case RenderFrameContext.LOW_PRECISION:
			type = gl.UNSIGNED_BYTE; break;
		case RenderFrameContext.MEDIUM_PRECISION:
			type = gl.HIGH_PRECISION_FORMAT; break; //gl.HIGH_PRECISION_FORMAT is HALF_FLOAT_OES, if not supported then is FLOAT, otherwise is UNSIGNED_BYTE
		case RenderFrameContext.HIGH_PRECISION:
			type = gl.FLOAT; break;
		case RenderFrameContext.DEFAULT_PRECISION:
		default:
			type = RenderFrameContext.DEFAULT_PRECISION_WEBGL_TYPE; break;
	}

	var textures = this._textures;

	//for the color: check that the texture size matches
	if( !this._color_texture || 
		this._color_texture.width != final_width || this._color_texture.height != final_height || 
		this._color_texture.type != type || this._color_texture.format != format || this._color_texture.minFilter != minFilter )
		this._color_texture = new GL.Texture( final_width, final_height, { minFilter: minFilter, magFilter: magFilter, format: format, type: type });
	else
		this._color_texture.setParameter( gl.TEXTURE_MAG_FILTER, magFilter );
	textures[0] = this._color_texture;

	//extra color texture (multibuffer rendering)
	var total_extra = Math.min( this.num_extra_textures, 4 );
	for(var i = 0; i < total_extra; ++i) //MAX is 4
	{
		var extra_texture = textures[1 + i];
		if( (!extra_texture || extra_texture.width != final_width || extra_texture.height != final_height || extra_texture.type != type || extra_texture.format != format || extra_texture.minFilter != minFilter) )
			extra_texture = new GL.Texture( final_width, final_height, { minFilter: minFilter, magFilter: magFilter, format: format, type: type });
		else
			extra_texture.setParameter( gl.TEXTURE_MAG_FILTER, magFilter );
		textures[1 + i] = extra_texture;
	}

	//for the depth
	var depth_format = gl.DEPTH_COMPONENT;
	var depth_type = gl.UNSIGNED_INT;

	if(this.use_stencil_buffer && gl.extensions.WEBGL_depth_texture)
	{
		depth_format = gl.DEPTH_STENCIL;
		depth_type = gl.extensions.WEBGL_depth_texture.UNSIGNED_INT_24_8_WEBGL;
	}

	if( this.use_depth_texture && 
		(!this._depth_texture || this._depth_texture.width != final_width || this._depth_texture.height != final_height || this._depth_texture.format != depth_format || this._depth_texture.type != depth_type ) && 
		gl.extensions["WEBGL_depth_texture"] )
		this._depth_texture = new GL.Texture( final_width, final_height, { filter: gl.NEAREST, format: depth_format, type: depth_type });
	else if( !this.use_depth_texture )
		this._depth_texture = null;

	//we will store some extra info in the depth texture for the near and far plane distances
	if(this._depth_texture)
	{
		if(!this._depth_texture.near_far_planes)
			this._depth_texture.near_far_planes = vec2.create();
	}

	//create FBO
	if( !this._fbo )
		this._fbo = new GL.FBO();

	//cut extra
	textures.length = 1 + total_extra;

	//assign textures (this will enable the FBO but it will restore the old one after finishing)
	this._fbo.stencil = this.use_stencil_buffer;
	this._fbo.setTextures( textures, this._depth_texture );
	this._version += 1;
}

/**
* Called to bind the rendering to this context, from now on all the render will be stored in the textures inside
*
* @method enable
*/
RenderFrameContext.prototype.enable = function( render_settings, viewport )
{
	var camera = LS.Renderer._current_camera;
	viewport = viewport || gl.viewport_data;

	//create FBO and textures (pass width and height of current viewport)
	this.prepare( viewport[2], viewport[3] );

	if(!this._fbo)
		throw("No FBO created in RenderFrameContext");

	//enable FBO
	RenderFrameContext.enableFBO( this._fbo, this.adjust_aspect );

	if(LS.RenderFrameContext.current)
		RenderFrameContext.stack.push( LS.RenderFrameContext.current );
	LS.RenderFrameContext.current = this;

	//set depth info inside the texture
	if(this._depth_texture && camera)
	{
		this._depth_texture.near_far_planes[0] = camera.near;
		this._depth_texture.near_far_planes[1] = camera.far;
	}
}

//we cannot read and write in the same buffer, so we need to clone the textures
RenderFrameContext.prototype.cloneBuffers = function()
{
	//we do not call this._fbo.unbind because it will set the previous FBO
	gl.bindFramebuffer( gl.FRAMEBUFFER, null );

	///for color
	if( this._textures.length )
	{
		if(!this._cloned_textures)
			this._cloned_textures = [];
		var textures = this._textures;
		this._cloned_textures.length = textures.length;
		for(var i = 0; i < textures.length; ++i)
		{
			var texture = textures[i];
			var cloned_texture = this._cloned_textures[i];
			if( !cloned_texture || cloned_texture.hasSameSize( texture[i] ) || !cloned_texture.hasSameProperties( texture ) )
				cloned_texture = this._cloned_textures[i] = new GL.Texture( texture.width, texture.height, texture.getProperties() );

			texture.copyTo( cloned_texture );
			if(i == 0)
				LS.ResourcesManager.textures[":color_buffer" ] = cloned_texture;
		}
	}

	//for depth
	if( this._depth_texture )
	{
		var depth = this._depth_texture;
		if(!this._cloned_depth_texture || this._cloned_depth_texture.width != depth.width || this._cloned_depth_texture.height != depth.height || !this._cloned_depth_texture.hasSameProperties( depth ) )
			this._cloned_depth_texture = new GL.Texture( depth.width, depth.height, depth.getProperties() );

		depth.copyTo( this._cloned_depth_texture );
		LS.ResourcesManager.textures[":depth_buffer" ] = this._cloned_depth_texture;
	}

	//rebind FBO
	gl.bindFramebuffer( gl.FRAMEBUFFER, this._fbo.handler );
}

/**
* Called to stop rendering to this context
*
* @method disable
*/
RenderFrameContext.prototype.disable = function()
{
	//sets some global parameters for aspect and current RFC
	RenderFrameContext.disableFBO( this._fbo );

	//if we need to store the textures in the ResourcesManager
	if(this.name)
	{
		var textures = this._textures;
		for(var i = 0; i < textures.length; ++i)
		{
			var name = this.name + (i > 0 ? i : "");
			textures[i].filename = name;

			//only clone main color if requested
			if( this.clone_after_unbind && i === 0 )
			{
				if( !this._cloned_texture || 
					this._cloned_texture.width !== textures[i].width || 
					this._cloned_texture.height !== textures[i].height ||
					this._cloned_texture.type !== textures[i].type )
					this._cloned_texture = textures[i].clone();
				else
					textures[i].copyTo( this._cloned_texture );

				LS.ResourcesManager.textures[ name ] = this._cloned_texture;
			}
			else
				LS.ResourcesManager.textures[ name ] = textures[i];
		}

		if(this._depth_texture)
		{
			var name = this.name + "_depth";
			this._depth_texture.filename = name;
			LS.ResourcesManager.textures[ name ] = this._depth_texture;
			//LS.ResourcesManager.textures[ ":depth" ] = this._depth_texture;
		}
	}

	if( RenderFrameContext.stack.length )
		LS.RenderFrameContext.current = RenderFrameContext.stack.pop();
	else
		LS.RenderFrameContext.current = null;
}

/**
* returns the texture containing the data rendered in this context
*
* @method getColorTexture
* @param {number} index the number of the texture (in case there is more than one)
* @return {GL.Texture} the texture
*/
RenderFrameContext.prototype.getColorTexture = function(num)
{
	return this._textures[ num || 0 ] || null;
}

/**
* returns the depth texture containing the depth data rendered in this context (in case the use_depth_texture is set to true)
*
* @method getDepthTexture
* @return {GL.Texture} the depth texture
*/
RenderFrameContext.prototype.getDepthTexture = function()
{
	return this._depth_texture || null;
}

//enables the FBO and sets every texture with a flag so it cannot be used during the rendering process
RenderFrameContext.enableFBO = function( fbo, adjust_aspect )
{
	fbo.bind( true ); //changes viewport to full FBO size (saves old)

	LS.Renderer._full_viewport.set( gl.viewport_data );
	if( adjust_aspect )
	{
		fbo._old_aspect = LS.Renderer.global_aspect;
		LS.Renderer.global_aspect = (gl.canvas.width / gl.canvas.height) / (fbo.color_textures[0].width / fbo.color_textures[0].height);
	}
	else
		delete fbo._old_aspect;
}

RenderFrameContext.disableFBO = function( fbo )
{
	fbo.unbind(); //restores viewport to old saved one
	LS.Renderer._full_viewport.set( fbo._old_viewport );
	if( fbo._old_aspect )
		LS.Renderer.global_aspect = fbo._old_aspect;
}


/**
* Render the context of the context to the viewport (allows to apply FXAA)
*
* @method show
* @param {boolean} use_antialiasing in case you want to render with FXAA antialiasing
*/
RenderFrameContext.prototype.show = function( use_antialiasing )
{
	var texture = this._color_texture;
	if(!use_antialiasing)
	{
		texture.toViewport();
		return;
	}

	var viewport = gl.getViewport();
	var shader = GL.Shader.getFXAAShader();
	var mesh = GL.Mesh.getScreenQuad();
	texture.bind(0);
	shader.uniforms( { u_texture:0, uViewportSize: viewport.subarray(2,4), u_iViewportSize: [1 / texture.width, 1 / texture.height]} ).draw( mesh );
}

//Resets the current WebGL fbo so it renders to the screen
RenderFrameContext.reset = function()
{
	gl.bindFramebuffer( gl.FRAMEBUFFER, null );
	LS.RenderFrameContext.current = null;
	LS.RenderFrameContext.stack.length = 0;
}


LS.RenderFrameContext = RenderFrameContext;
