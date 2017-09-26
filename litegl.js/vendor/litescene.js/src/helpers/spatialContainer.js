//WORK IN PROGRESS

/** SpatialContainer
* This class allows to store data spatially so it can be retrieved by proximity or by camera frustum view.
* It can store objects associated with a bounding box.
* It is used by the renderer to store all the RenderInstances, Lights and Colliders
* IT IS A WORK IN PROGRESS SO FOR NOW IT DO NOT STORES THE INFO SPATIALLY, IT JUST EXPOSES AN INTERFACE
* @class SpatialContainer
*/

function SpatialContainer()
{
	this.size = 100000;
	this.root = [];
	this.objecs_cell_by_id = new WeakMap();
}

//adds a new object to the container
SpatialContainer.prototype.add = function( object, bounding )
{
	var cell = this.root;

	cell.push( object );
	this.objecs_cell_by_id.set( object, cell ); //in which container is
	return object.uid;
}

SpatialContainer.prototype.updateBounding = function( object, new_bounding )
{
	//...
}


//adds a new object to the container
SpatialContainer.prototype.remove = function( object, bounding )
{
	var cell = 	this.objecs_cell_by_id.get( object );
	if(!cell)
		return;
	var index = cell.indexOf( object );
	if(index !== -1)
		cell.splice( index, 1 );
	this.objecs_cell_by_id.delete( object );
}

//retrieves a list of objects overlaping this area
SpatialContainer.prototype.retrieve = function( bounding )
{
	//TODO: search cells that lay inside the bounding
	return this.root;
}

//retrieves a list of objects overlaping this area
SpatialContainer.prototype.retrieveFromCamera = function( camera )
{
	//TODO: search cells that lay inside the frustum
	return this.root;
}


SpatialContainer.prototype.clear = function()
{
	this.root.length = 0;
	this.objecs_cell_by_id = new WeakMap();
}

LS.SpatialContainer = SpatialContainer;