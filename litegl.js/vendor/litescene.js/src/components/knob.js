(function(){

/**
* Knob allows to rotate a mesh like a knob (rotate when dragging)
* @class Knob
* @constructor
* @param {String} object to configure from
*/

function Knob(o)
{
	this.value = 0;
	this.delta = 0.01;

	this.steps = 0; //0 = continuous
	this.min_value = 0;
	this.max_value = 1;
	this.min_angle = -120;
	this.max_angle = 120;
	this.axis = vec3.fromValues(0,0,1);

	this._dragging = false;

	if(o)
		this.configure(o);
}

Knob.icon = "mini-icon-knob.png";

Knob.prototype.onAddedToScene = function(scene)
{
	LEvent.bind( scene, "mousedown", this.onMouse, this );
	LEvent.bind( scene, "mouseup", this.onMouse, this );
	LEvent.bind( scene, "mousemove", this.onMouse, this );
	this.updateKnob();
}

Knob.prototype.onRemovedFromScene = function(scene)
{
	LEvent.unbindAll( scene, this );
}


Knob.prototype.updateKnob = function()
{
	if(!this._root)
		return;

	var f = this.value / (this.max_value - this.min_value);
	var angle = (this.min_angle + (this.max_angle - this.min_angle) * f );
	quat.setAxisAngle(this._root.transform._rotation,this.axis, angle * DEG2RAD);
	this._root.transform.mustUpdate = true;
}

Knob.prototype.onMouse = function(e, mouse_event)
{ 
	if( e == "mousedown")
	{
		if(!this._root || !this._root._instances || !this._root._instances.length)
			return;

		var instance = this._root._instances[0];

		var cam = LS.Renderer.getCameraAtPosition( mouse_event.canvasx, mouse_event.canvasy );
		if(!cam)
			return;
		var ray = cam.getRayInPixel( mouse_event.canvasx, mouse_event.canvasy );
		if(!ray)
			return;

		this._dragging = geo.testRayBBox( ray.origin, ray.direction, instance.aabb);
	}
	else if( e == "mouseup")
	{
		this._dragging = false;
	}
	else //mouse move
	{
		if(!mouse_event.dragging || !this._dragging)
			return;

		this.value -= mouse_event.deltay * this.delta;

		if(this.value > this.max_value)
			this.value = this.max_value;
		else if(this.value < this.min_value)
			this.value = this.min_value;

		this.updateKnob();

		LEvent.trigger( this, "change", this.value );
		if(this._root)
			LEvent.trigger( this._root, "knobChange", this.value );

		return false;
	}
};

LS.registerComponent( Knob );

})();