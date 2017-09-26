/**
* CameraDirector allows to switch between scene cameras easily
* @class CameraDirector
* @constructor
* @param {String} object to configure from
*/

function CameraDirector(o)
{
	this.enabled = true;
	this.current_camera_uid = "";
	this.configure(o);
}

CameraDirector.icon = "mini-icon-cameracontroller.png";

CameraDirector.prototype.onAddedToScene = function( scene )
{
	LEvent.bind( scene, "update",this.onUpdate,this);
}

CameraDirector.prototype.onRemovedFromScene = function( scene )
{
	LEvent.unbindAll( scene, this );
}

CameraDirector.prototype.onUpdate = function(e)
{
	if(!this._root || !this.enabled) 
		return;
}

CameraDirector.prototype.showProperties = function( inspector )
{
}

LS.registerComponent( CameraDirector );
