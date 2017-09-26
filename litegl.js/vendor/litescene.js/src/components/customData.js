/** 
* This module allows to store custom data inside a node
* properties have the form of:
* - name:
* - value:
* - type:
* @class CustomData
* @constructor
* @param {Object} object to configure from
*/

function CustomData(o)
{
	this._properties = [];
	this._properties_by_name = {};

	if(o)
		this.configure(o);
}

Object.defineProperty( CustomData.prototype, "properties", {
	set: function(v){
		if(!v || v.constructor !== Array)
			return;
		this._properties.length = v.length;
		this._properties_by_name = {};
		for(var i = 0; i < v.length; ++i)
		{
			var p = v[i];
			this._properties[i] = p;
			this._properties_by_name[ p.name ] = p;
		}
	},
	get: function()
	{
		return this._properties;
	},
	enumerable: true
});

CustomData.icon = "mini-icon-bg.png";

CustomData.prototype.onAddedToNode = function(node)
{
	if(!node.custom)
		node.custom = this;
}

CustomData.prototype.onRemovedFromNode = function(node)
{
	if(node.custom == this)
		delete node.custom;
}

CustomData.prototype.getResources = function(res)
{
	return res;
}

CustomData.prototype.addProperty = function( property )
{
	this._properties.push( property );
	if( this._properties_by_name[ property.name ] )
		console.warn("CustomData: there is a property with the same name");
	this._properties_by_name[ property.name ] = property;
}

CustomData.prototype.getProperty = function( name )
{
	return this._properties_by_name[ name ];
}

CustomData.prototype.getPropertiesInfo = function()
{
	return this._properties;
}

CustomData.prototype.updateProperty = function( property )
{
	this._properties_by_name[ property.name ] = property;
}

//used for animation tracks
CustomData.prototype.getPropertyInfoFromPath = function( path )
{
	var varname = path[0];
	var property = this._properties_by_name[ varname ];
	if(!property)
		return null;
	return {
		node: this._root,
		target: property, //no this
		name: "value",
		value: property.value,
		type: property.type
	};
}

CustomData.prototype.setPropertyValueFromPath = function( path, value, offset )
{
	offset = offset || 0;

	var varname = path[offset];
	var property = this._properties_by_name[ varname ];
	if(!property)
		return;

	//assign
	if(property.value && property.value.set)
		property.value.set( value ); //typed arrays
	else
		property.value = value;
}


CustomData.prototype.onResourceRenamed = function (old_name, new_name, resource)
{
}

LS.registerComponent( CustomData );
LS.CustomData = CustomData;