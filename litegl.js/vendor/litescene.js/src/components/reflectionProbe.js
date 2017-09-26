/**
* Realtime Reflective surface
* @class RealtimeReflector
* @constructor
* @param {String} object to configure from
*/


function ReflectionProbe(o)
{
	this.enabled = true;
	this.texture_size = 512;
	this.high_precision = false;
	this.clip_offset = 0.5; //to avoid ugly edges near clipping plane
	this.texture_name = "";
	this.blur = 0;
	this.generate_mipmaps = false;
	this.refresh_rate = 1; //in frames
	this.layers = 0xFF;

	this.near = 0.1;
	this.far = 1000;
	this.background_color = vec4.create();

	if(o)
		this.configure(o);
}

ReflectionProbe.icon = "mini-icon-reflector.png";

ReflectionProbe["@texture_size"] = { type:"enum", values:["viewport",64,128,256,512,1024,2048] };
ReflectionProbe["@layers"] = { type:"layers" };
ReflectionProbe["@background_color"] = { type:"color" };

ReflectionProbe.prototype.onAddedToScene = function(scene)
{
	LEvent.bind( scene,"renderReflections", this.onRenderReflection, this );
	LEvent.bind( scene,"afterCameraEnabled", this.onCameraEnabled, this );
}


ReflectionProbe.prototype.onRemovedFromScene = function(scene)
{
	LEvent.unbindAll( scene, this );
	if(this._texture)
		LS.ResourcesManager.unregisterResource( ":reflection_" + this.uid );
	this._texture = null;
}

ReflectionProbe.prototype.onRenderReflection = function( e, render_settings )
{
	if(!this.enabled || !this._root)
		return;

	var scene = this._root.scene;
	if(!scene)
		return;

	this.refresh_rate = this.refresh_rate << 0;
	if( (scene._frame == 0 || (scene._frame % this.refresh_rate) != 0) && this._rt)
		return;

	var texture_size = parseInt( this.texture_size );

	//add flags
	var old_layers = render_settings.layers;
	render_settings.layers = this.layers;

	LS.Renderer.clearSamplers();

	var texture_type = gl.TEXTURE_CUBE_MAP;
	var type = this.high_precision ? gl.HIGH_PRECISION_FORMAT : gl.UNSIGNED_BYTE;

	var texture = this._texture;

	if(!texture || texture.width != texture_size || texture.height != texture_size || texture.type != type || texture.texture_type != texture_type || texture.minFilter != (this.generate_mipmaps ? gl.LINEAR_MIPMAP_LINEAR : gl.LINEAR) )
	{
		texture = new GL.Texture( texture_size, texture_size, { type: type, texture_type: texture_type, minFilter: this.generate_mipmaps ? gl.LINEAR_MIPMAP_LINEAR : gl.LINEAR });
		texture.has_mipmaps = this.generate_mipmaps;
		this._texture = texture;
	}

	texture._locked = true; //block binding this texture during rendering of the reflection

	//camera
	var reflected_camera = this._reflected_camera || new LS.Camera();
	this._reflected_camera = reflected_camera;
	var eye = this._root.getGlobalPosition();

	LS.Renderer.renderToCubemap( eye, 0, texture, render_settings, this.near, this.far, this.background_color );

	if(this.blur)
	{
		/* TODO
		*/
	}

	if(this.generate_mipmaps && isPowerOfTwo( texture_size ) )
	{
		texture.setParameter( gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR );
		gl.generateMipmap(texture.texture_type);
		texture.unbind();
	}

	texture._locked = false;

	if(this.texture_name)
		LS.ResourcesManager.registerResource( this.texture_name, texture );
	LS.ResourcesManager.registerResource( ":reflection_" + this.uid, texture );

	//add probe to LS.Renderer
	//TODO

	//remove flags
	render_settings.layers = old_layers;
}

LS.registerComponent( ReflectionProbe );