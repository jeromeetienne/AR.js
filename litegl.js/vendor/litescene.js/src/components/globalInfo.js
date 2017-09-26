
function GlobalInfo(o)
{
	this.createProperty( "ambient_color", GlobalInfo.DEFAULT_AMBIENT_COLOR, "color" );

	//this._render_settings = new LS.RenderSettings();

	this._textures = {};

	if(o)
		this.configure(o);
}

Object.defineProperty( GlobalInfo.prototype, 'textures', {
	set: function( v )
	{
		if(typeof(v) != "object")
			return;
		for(var i in v)
			if( v[i] === null || v[i].constructor === String || v[i] === GL.Texture )
				this._textures[i] = v[i];
	},
	get: function(){
		return this._textures;
	},
	enumerable: true
});

/*
Object.defineProperty( GlobalInfo.prototype, 'render_settings', {
	set: function( v )
	{
		if(typeof(v) != "object")
			return;
		this._render_settings.configure(v);
	},
	get: function(){
		return this._render_settings;
	},
	enumerable: true
});
*/

GlobalInfo.icon = "mini-icon-bg.png";
GlobalInfo.DEFAULT_AMBIENT_COLOR = vec3.fromValues(0.2, 0.2, 0.2);

GlobalInfo.prototype.onAddedToScene = function(scene)
{
	scene.info = this;
}

GlobalInfo.prototype.onRemovedFromScene = function(scene)
{
	//scene.info = null;
}

GlobalInfo.prototype.getResources = function(res)
{
	for(var i in this._textures)
	{
		if(typeof(this._textures[i]) == "string")
			res[ this._textures[i] ] = GL.Texture;
	}
	return res;
}

GlobalInfo.prototype.getPropertiesInfo = function()
{
	return {
		"ambient_color":"color",
		"textures/environment": "texture",
		"textures/irradiance": "texture",
		"render_settings":"RenderSettings"
	};
}

GlobalInfo.prototype.setProperty = function( name, value )
{
	if(name.substr(0,9) == "textures/" && (!value || value.constructor === String || value.constructor === GL.Texture) )
	{
		this._textures[ name.substr(9) ] = value;
		return true;
	}
}

//used for animation tracks
GlobalInfo.prototype.getPropertyInfoFromPath = function( path )
{
	if(path[0] != "textures")
		return;

	if(path.length == 1)
		return {
			node: this._root,
			target: this._textures,
			type: "object"
		};

	var varname = path[1];

	return {
		node: this._root,
		target: this._textures,
		name: varname,
		value: this._textures[ varname ] || null,
		type: "texture"
	};
}

GlobalInfo.prototype.setPropertyValueFromPath = function( path, value, offset )
{
	offset = offset || 0;
	if( path.length < (offset+1) )
		return;

	if( path[offset] != "textures" )
		return;

	var varname = path[offset+1];
	this._textures[ varname ] = value;
}


GlobalInfo.prototype.onResourceRenamed = function (old_name, new_name, resource)
{
	for(var i in this._textures)
	{
		if(this._textures[i] == old_name)
			this._textures[i] = new_name;
	}
}

LS.registerComponent( GlobalInfo );
LS.GlobalInfo = GlobalInfo;