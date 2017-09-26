/**
* Allows to easily test interaction between the user and the scene, attach the InteractiveController to the root and the mouse down,move and up events will
* be processed using a raycast and trigger events.
* @namespace LS
* @class InteractiveController
* @constructor
* @param {Object} last serialized data [optional]
*/
function InteractiveController(o)
{
	this.enabled = true;
	this.mode = InteractiveController.PICKING;
	this.layers = 3;

	this._last_collision = null;

	if(o)
		this.configure(o);
}

InteractiveController.icon = "mini-icon-cursor.png";

InteractiveController.PICKING = 1;
InteractiveController.BOUNDING = 2;
InteractiveController.COLLIDERS = 3;
InteractiveController.RENDER_INSTANCES = 4;

InteractiveController["@mode"] = { type: "enum", values: { "Picking": InteractiveController.PICKING, "Bounding": InteractiveController.BOUNDING, "Colliders": InteractiveController.COLLIDERS }};
InteractiveController["@layers"] = { type: "layers" };

InteractiveController.prototype.onAddedToScene = function(scene)
{
	LEvent.bind( scene, "mousedown", this._onMouse, this );
	LEvent.bind( scene, "mousemove", this._onMouse, this );
	LEvent.bind( scene, "mouseup", this._onMouse, this );
}

InteractiveController.prototype.onRemovedFromScene = function(scene)
{
	LEvent.unbindAll( scene, this );
}

InteractiveController.prototype.getNodeUnderMouse = function( e )
{
	var layers = this.layers;

	if(this.mode == InteractiveController.PICKING)
		return LS.Picking.getNodeAtCanvasPosition( e.canvasx, e.canvasy, null, layers );

	var camera = LS.Renderer.getCameraAtPosition( e.canvasx, e.canvasy );
	if(!camera)
		return null;
	var ray = camera.getRayInPixel( e.canvasx, e.canvasy );

	if(this.mode == InteractiveController.BOUNDING)
	{
		var collisions = LS.Physics.raycastRenderInstances( ray.origin, ray.direction, { layers: layers } );
		if(!collisions || !collisions.length)
			return null;
		this._last_collision = collisions[0];
		return collisions[0].node;
	}

	if(this.mode == InteractiveController.RENDER_INSTANCES)
	{
		var collisions = LS.Physics.raycastRenderInstances( ray.origin, ray.direction, { layers: layers, triangle_collision: true } );
		if(!collisions || !collisions.length)
			return null;
		this._last_collision = collisions[0];
		return collisions[0].node;
	}

	if(this.mode == InteractiveController.COLLIDERS)
	{
		var collisions = LS.Physics.raycast( ray.origin, ray.direction, { layers: layers } );
		if(!collisions || !collisions.length)
			return null;
		this._last_collision = collisions[0];
		return collisions[0].node;
	}

	return null;

}

InteractiveController.prototype._onMouse = function(type, e)
{
	if(!this.enabled)
		return;

	//Intereactive: check which node was clicked (this is a mode that helps clicking stuff)
	if(e.eventType == "mousedown" || e.eventType == "mousewheel" )
	{
		var node = this.getNodeUnderMouse(e);
		this._clicked_node = node;
		if(this._clicked_node && e.eventType == "mousedown" && e.button == 0 )
		{
			console.log("Node clicked: " + this._clicked_node.name );
			LEvent.trigger( this._clicked_node, "clicked", this._clicked_node ); //event in node clicked
			LEvent.trigger( this._root, "node_clicked", this._clicked_node ); //event in this node
			LEvent.trigger( this._root.scene, "node_clicked", this._clicked_node ); //event in scene
			if(this.onNodeClicked) //extra method, if you inject a new method in this component
				this.onNodeClicked( this._clicked_node );
		}
	}

	var levent = null; //levent dispatched

	//send event to clicked node
	if(this._clicked_node) // && this._clicked_node.flags.interactive)
	{
		e.scene_node = this._clicked_node;
		levent = LEvent.trigger( this._clicked_node, e.eventType, e );
	}

	if(e.eventType == "mouseup")
		this._clicked_node = null;

	if(this._clicked_node)
		return true;
}


LS.registerComponent( InteractiveController );
