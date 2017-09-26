/**
* Node manipulator, allows to rotate it
* @class NodeManipulator
* @constructor
* @param {String} object to configure from
*/

function NodeManipulator(o)
{
	this.rot_speed = [1,1]; //degrees
	this.smooth = false;
	if(o)
		this.configure(o);
}

NodeManipulator.icon = "mini-icon-rotator.png";

NodeManipulator.prototype.onAddedToNode = function(node)
{
	LEvent.bind( node, "mousemove",this.onMouse,this);
	LEvent.bind( node, "update",this.onUpdate,this);
}

NodeManipulator.prototype.onRemovedFromNode = function(node)
{
	LEvent.unbind( node, "mousemove",this.onMouse,this);
	LEvent.unbind( node, "update",this.onUpdate,this);
}

NodeManipulator.prototype.onUpdate = function(e)
{
	if(!this._root)
		return;

	if(!this._root.transform)
		return;
}

NodeManipulator.prototype.onMouse = function(e, mouse_event)
{
	if(!this._root || !this._root.transform)
		return;
	
	//regular mouse dragging
	if(!mouse_event.dragging)
		return;

	var scene = this._root.scene;
	var camera = scene.getCamera();

	var right = camera.getLocalVector( LS.Components.Transform.RIGHT );
	this._root.transform.rotateGlobal( mouse_event.deltax * this.rot_speed[0], LS.Components.Transform.UP );
	this._root.transform.rotateGlobal( mouse_event.deltay * this.rot_speed[1], right );
	scene.requestFrame();

	//this._root.transform.rotate(mouse_event.deltax * this.rot_speed[0], [0,1,0] );
	//this._root.transform.rotateLocal(-mouse_event.deltay * this.rot_speed[1], [1,0,0] );
}

LS.registerComponent(NodeManipulator);