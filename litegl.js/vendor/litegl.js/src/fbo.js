/** 
* FBO for FrameBufferObjects, FBOs are used to store the render inside one or several textures 
* Supports multibuffer and depthbuffer texture, useful for deferred rendering
* @namespace GL
* @class FBO
* @param {Array} color_textures an array containing the color textures, if not supplied a render buffer will be used
* @param {GL.Texture} depth_texture the depth texture, if not supplied a render buffer will be used
* @param {Bool} stencil create a stencil buffer?
* @constructor
*/
function FBO( textures, depth_texture, stencil, gl )
{
	gl = gl || global.gl;
	this.gl = gl;
	this._context_id = gl.context_id; 

	if(textures && textures.constructor !== Array)
		throw("FBO textures must be an Array");

	this.handler = null;
	this.width = -1;
	this.height = -1;
	this.color_textures = [];
	this.depth_texture = null;
	this.stencil = !!stencil;

	this._stencil_enabled = false;
	this._num_binded_textures = 0;

	//assign textures
	if((textures && textures.length) || depth_texture)
		this.setTextures( textures, depth_texture );

	//save state
	this._old_fbo_handler = null;
	this._old_viewport = new Float32Array(4);
}

GL.FBO = FBO;

/**
* Changes the textures binded to this FBO
* @method setTextures
* @param {Array} color_textures an array containing the color textures, if not supplied a render buffer will be used
* @param {GL.Texture} depth_texture the depth texture, if not supplied a render buffer will be used
* @param {Boolean} skip_disable it doenst try to go back to the previous FBO enabled in case there was one
*/
FBO.prototype.setTextures = function( color_textures, depth_texture, skip_disable )
{
	if( depth_texture && depth_texture.constructor === GL.Texture &&
		( (depth_texture.format !== gl.DEPTH_COMPONENT && depth_texture.format !== gl.DEPTH_STENCIL) || 
		( depth_texture.type != gl.UNSIGNED_INT && depth_texture.type != GL.UNSIGNED_INT_24_8_WEBGL ) ) )
		throw("FBO Depth texture must be of format: gl.DEPTH_COMPONENT and type: gl.UNSIGNED_INT");

	//test if is already binded
	var same = this.depth_texture == depth_texture;
	if( same && color_textures )
	{
		if( color_textures.constructor !== Array )
			throw("FBO: color_textures parameter must be an array containing all the textures to be binded in the color");
		if( color_textures.length == this.color_textures.length )
		{
			for(var i = 0; i < color_textures.length; ++i)
				if( color_textures[i] != this.color_textures[i] )
				{
					same = false;
					break;
				}
		}
		else
			same = false;
	}

	if(this._stencil_enabled !== this.stencil)
		same = false;
		
	if(same)
		return;

	//copy textures in place
	this.color_textures.length = color_textures ? color_textures.length : 0;
	if(color_textures)
		for(var i = 0; i < color_textures.length; ++i)
			this.color_textures[i] = color_textures[i];
	this.depth_texture = depth_texture;

	//update GPU FBO
	this.update( skip_disable );
}

/**
* Updates the FBO with the new set of textures and buffers
* @method update
* @param {Boolean} skip_disable it doenst try to go back to the previous FBO enabled in case there was one
*/
FBO.prototype.update = function( skip_disable )
{
	//save state to restore afterwards
	this._old_fbo_handler = gl.getParameter( gl.FRAMEBUFFER_BINDING );

	if(!this.handler)
		this.handler = gl.createFramebuffer();

	var w = -1,
		h = -1,
		type = null;

	var color_textures = this.color_textures;
	var depth_texture = this.depth_texture;

	//compute the W and H (and check they have the same size)
	if(color_textures && color_textures.length)
		for(var i = 0; i < color_textures.length; i++)
		{
			var t = color_textures[i];
			if(t.constructor !== GL.Texture)
				throw("FBO can only bind instances of GL.Texture");
			if(w == -1) 
				w = t.width;
			else if(w != t.width)
				throw("Cannot bind textures with different dimensions");
			if(h == -1) 
				h = t.height;
			else if(h != t.height)
				throw("Cannot bind textures with different dimensions");
			if(type == null) //first one defines the type
				type = t.type;
			else if (type != t.type)
				throw("Cannot bind textures to a FBO with different pixel formats");
			if (t.texture_type != gl.TEXTURE_2D)
				throw("Cannot bind a Cubemap to a FBO");
		}
	else
	{
		w = depth_texture.width;
		h = depth_texture.height;
	}

	this.width = w;
	this.height = h;

	gl.bindFramebuffer( gl.FRAMEBUFFER, this.handler );

	if(depth_texture && !gl.extensions["WEBGL_depth_texture"])
		throw("Rendering to depth texture not supported by your browser");

	//draw_buffers allow to have more than one color texture binded in a FBO
	var ext = gl.extensions["WEBGL_draw_buffers"];
	if(!ext && color_textures && color_textures.length > 1)
		throw("Rendering to several textures not supported by your browser");

	gl.framebufferRenderbuffer( gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, null );
	gl.framebufferRenderbuffer( gl.FRAMEBUFFER, gl.DEPTH_STENCIL_ATTACHMENT, gl.RENDERBUFFER, null );
	//detach color too?

	//bind a buffer for the depth
	if( depth_texture && depth_texture.constructor === GL.Texture )
	{
		if(this.stencil && depth_texture.format !== gl.DEPTH_STENCIL )
			console.warn("Stencil cannot be enabled if there is a depth texture with a DEPTH_STENCIL format");

		if( depth_texture.format == gl.DEPTH_STENCIL )
			gl.framebufferTexture2D( gl.FRAMEBUFFER, gl.DEPTH_STENCIL_ATTACHMENT, gl.TEXTURE_2D, depth_texture.handler, 0);
		else
			gl.framebufferTexture2D( gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.TEXTURE_2D, depth_texture.handler, 0);
	}
	else //create a renderbuffer to store depth
	{
		var depth_renderbuffer = null;
		
		//allows to reuse a renderbuffer between FBOs
		if( depth_texture && depth_texture.constructor === WebGLRenderbuffer && depth_texture.width == w && depth_texture.height == h ) 
			depth_renderbuffer = this._depth_renderbuffer = depth_texture;
		else
		{
			//create one
			depth_renderbuffer = this._depth_renderbuffer = this._depth_renderbuffer || gl.createRenderbuffer();
			depth_renderbuffer.width = w;
			depth_renderbuffer.height = h;
		}
		
		gl.bindRenderbuffer( gl.RENDERBUFFER, depth_renderbuffer );
		if(this.stencil)
		{
			gl.renderbufferStorage( gl.RENDERBUFFER, gl.DEPTH_STENCIL, w, h );
			gl.framebufferRenderbuffer( gl.FRAMEBUFFER, gl.DEPTH_STENCIL_ATTACHMENT, gl.RENDERBUFFER, depth_renderbuffer );
		}
		else
		{
			gl.renderbufferStorage( gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, w, h );
			gl.framebufferRenderbuffer( gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, depth_renderbuffer );
		}
	}

	//bind buffers for the colors
	if(color_textures && color_textures.length)
	{
		this.order = []; //draw_buffers request the use of an array with the order of the attachments
		for(var i = 0; i < color_textures.length; i++)
		{
			var t = color_textures[i];

			gl.framebufferTexture2D( gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0 + i, gl.TEXTURE_2D, t.handler, 0 );
			this.order.push( gl.COLOR_ATTACHMENT0 + i );
		}
	}
	else //create renderbuffer to store color
	{
		var color_renderbuffer = this._color_renderbuffer = this._color_renderbuffer || gl.createRenderbuffer();
		color_renderbuffer.width = w;
		color_renderbuffer.height = h;
		gl.bindRenderbuffer( gl.RENDERBUFFER, color_renderbuffer );
		gl.renderbufferStorage( gl.RENDERBUFFER, gl.RGBA4, w, h );
		gl.framebufferRenderbuffer( gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.RENDERBUFFER, color_renderbuffer );
	}

	//detach old ones (only if is reusing a FBO with a different set of textures)
	var num = color_textures ? color_textures.length : 0;
	for(var i = num; i < this._num_binded_textures; ++i)
		gl.framebufferTexture2D( gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0 + i, gl.TEXTURE_2D, null, 0);
	this._num_binded_textures = num;

	this._stencil_enabled = this.stencil;

	/* does not work, must be used with the depth_stencil
	if(this.stencil && !depth_texture)
	{
		var stencil_buffer = this._stencil_buffer = this._stencil_buffer || gl.createRenderbuffer();
		stencil_buffer.width = w;
		stencil_buffer.height = h;
		gl.bindRenderbuffer( gl.RENDERBUFFER, stencil_buffer );
		gl.renderbufferStorage( gl.RENDERBUFFER, gl.STENCIL_INDEX8, w, h);
		gl.framebufferRenderbuffer( gl.FRAMEBUFFER, gl.STENCIL_ATTACHMENT, gl.RENDERBUFFER, stencil_buffer );
		this._stencil_enabled = true;
	}
	else
	{
		this._stencil_buffer = null;
		this._stencil_enabled = false;
	}
	*/

	//when using more than one texture you need to use the multidraw extension
	if(color_textures && color_textures.length > 1)
		ext.drawBuffersWEBGL( this.order );

	//check completion
	var complete = gl.checkFramebufferStatus( gl.FRAMEBUFFER );
	if(complete !== gl.FRAMEBUFFER_COMPLETE)
		throw("FBO not complete: " + complete);

	//restore state
	gl.bindTexture(gl.TEXTURE_2D, null);
	gl.bindRenderbuffer(gl.RENDERBUFFER, null);
	if(!skip_disable)
		gl.bindFramebuffer( gl.FRAMEBUFFER, this._old_fbo_handler );
}

/**
* Enables this FBO (from now on all the render will be stored in the textures attached to this FBO
* It stores the previous viewport to restore it afterwards, and changes it to full FBO size
* @method bind
* @param {boolean} keep_old keeps the previous FBO is one was attached to restore it afterwards
*/
FBO.prototype.bind = function( keep_old )
{
	if(!this.color_textures.length && !this.depth_texture)
		throw("FBO: no textures attached to FBO");
	this._old_viewport.set( gl.viewport_data );

	if(keep_old)
		this._old_fbo_handler = gl.getParameter( gl.FRAMEBUFFER_BINDING );
	else
		this._old_fbo_handler = null;

	if(this._old_fbo_handler != this.handler )
		gl.bindFramebuffer( gl.FRAMEBUFFER, this.handler );

	//mark them as in use in the FBO
	for(var i = 0; i < this.color_textures.length; ++i)
		this.color_textures[i]._in_current_fbo = true;
	if(this.depth_texture)
		this.depth_texture._in_current_fbo = true;

	gl.viewport( 0,0, this.width, this.height );
}

/**
* Disables this FBO, if it was binded with keep_old then the old FBO is enabled, otherwise it will render to the screen
* Restores viewport to previous
* @method unbind
*/
FBO.prototype.unbind = function()
{
	gl.bindFramebuffer( gl.FRAMEBUFFER, this._old_fbo_handler );
	this._old_fbo_handler = null;
	gl.setViewport( this._old_viewport );

	//mark the textures as no longer in use
	for(var i = 0; i < this.color_textures.length; ++i)
		this.color_textures[i]._in_current_fbo = false;
	if(this.depth_texture)
		this.depth_texture._in_current_fbo = false;
}

//binds another FBO without switch back to previous (faster)
FBO.prototype.switchTo = function( next_fbo )
{
	next_fbo._old_fbo_handler = this._old_fbo_handler;
	next_fbo._old_viewport.set( this._old_viewport );
	gl.bindFramebuffer( gl.FRAMEBUFFER, next_fbo.handler );
	this._old_fbo_handler = null;
	gl.viewport( 0,0, this.width, this.height );

	//mark the textures as no longer in use
	for(var i = 0; i < this.color_textures.length; ++i)
		this.color_textures[i]._in_current_fbo = false;
	if(this.depth_texture)
		this.depth_texture._in_current_fbo = false;

	//mark them as in use in the FBO
	for(var i = 0; i < next_fbo.color_textures.length; ++i)
		next_fbo.color_textures[i]._in_current_fbo = true;
	if(next_fbo.depth_texture)
		next_fbo.depth_texture._in_current_fbo = true;
}

FBO.prototype.delete = function()
{
	gl.deleteFramebuffer( this.handler );
	this.handler = null;
}

