//TODO: a class to remove the tree methods from SceneTree and SceneNode
/**
* CompositePattern implements the Composite Pattern, which allows to one class to contain instances of its own class
* creating a tree-like structure.
* @class CompositePattern
* @constructor
*/
function CompositePattern()
{
	//WARNING! do not add anything here, it will never be called
}

CompositePattern.prototype.compositeCtor = function()
{
	//this method is not called by SceneNode 
	this._parentNode = null;
	this._children = null;
	this._in_tree = null;
}

/* use .scene instead
CompositePattern.prototype.getScene = function()
{
	this._in_tree;
}
*/

/**
* Adds one child to this instance
* @method addChild
* @param {*} child
* @param {number} index [optional]  in which position you want to insert it, if not specified it goes to the last position
* @param {*} options [optional] data to be passed when adding it, used for special cases when moving nodes around
**/

CompositePattern.prototype.addChild = function(node, index, options)
{
	if( !node )
		throw("cannot addChild of null");

	if( node.constructor !== this.constructor )
		throw("added child must be of the same type");

	//be careful with weird recursions...
	var aux = this;
	while( aux._parentNode )
	{
		if(aux == node)
		{
			console.error("addChild: Cannot insert a node as his own child");
			return false;
		}
		aux = aux._parentNode;
	}

	//has a parent
	if(node._parentNode)
		node._parentNode.removeChild(node, options);

	/*
	var moved = false;
	if(node._parentNode)
	{
		moved = true;
		node._onChangeParent(this, options);
		//remove from parent children
		var pos = node._parentNode._children.indexOf(node);
		if(pos != -1)
			node._parentNode._children.splice(pos,1);
	}
	*/

	//attach to this
	node._parentNode = this;
	if( !this._children )
		this._children = [node];
	else if(index == undefined)
		this._children.push(node);
	else
		this._children.splice(index,0,node);

	//the same as scene but we called tree to make it more generic
	var tree = this._in_tree;

	//this would never fire but just in case
	if(tree && node._in_tree && node._in_tree != tree)
		throw("Cannot add a node that belongs to another scene tree");

	//Same tree
	node._in_tree = tree;

	//overwritten from SceneNode
	if(this._onChildAdded)
		this._onChildAdded(node, options);

	LEvent.trigger(this,"childAdded", node);
	if(tree)
	{
		//added to scene tree
		LEvent.trigger(tree, "treeItemAdded", node);
		inner_recursive(node);
	}

	//recursive action
	function inner_recursive(item)
	{
		if(!item._children) return;
		for(var i in item._children)
		{
			var child = item._children[i];
			if(!child._in_tree)
			{
				//added to scene tree
				LEvent.trigger( tree, "treeItemAdded", child );
				child._in_tree = tree;
			}
			inner_recursive( child );
		}
	}
}

/**
* Removes the node from its parent (and from the scene tree)
*
* @method removeChild
* @param {Node} node this child to remove
* @param {*} param1 data passed to onChildRemoved
* @param {*} param2 data passed to onChildRemoved as second parameter
* @return {Boolean} returns true if it was found and removed
*/
CompositePattern.prototype.removeChild = function(node, param1, param2)
{
	if(!node)
		throw("cannot removeChild of null");

	if(!this._children || node._parentNode != this)
		return false;
	if( node._parentNode != this)
		return false; //not his son
	var pos = this._children.indexOf(node);
	if(pos == -1)
		return false; //not his son ¿?
	this._children.splice(pos,1);

	if(this._onChildRemoved)
		this._onChildRemoved(node, param1, param2);

	LEvent.trigger(this,"childRemoved", node);

	if(node._in_tree)
	{
		LEvent.trigger(node._in_tree, "treeItemRemoved", node);
		//propagate to childs
		inner_recursive(node);
	}
	node._in_tree = null;

	//recursive action to remove tree
	function inner_recursive(item)
	{
		if(!item._children)
			return;
		for(var i = 0, l = item._children.length; i < l; ++i)
		{
			var child = item._children[i];
			if(child._in_tree)
			{
				LEvent.trigger( child._in_tree, "treeItemRemoved", child );
				child._in_tree = null;
			}
			inner_recursive( child );
		}
	}

	return true;
}


/**
* Remove every child node
*
* @method removeAllChildren
*/
CompositePattern.prototype.removeAllChildren = function( param1, param2 )
{
	if(this._children)
		while( this._children.length )
			this.removeChild( this._children[0], param1, param2 );
}

/**
* Serialize the data from all the children
*
* @method serializeChildren
* @return {Array} array containing all serialized data from every children
*/
CompositePattern.prototype.serializeChildren = function()
{
	var r = [];
	if(this._children)
		for(var i in this._children)
			r.push( this._children[i].serialize() ); //serialize calls serializeChildren
	return r;
}

/**
* Configure every children with the data
*
* @method configureChildren
* @return {Array} o array containing all serialized data 
*/
CompositePattern.prototype.configureChildren = function(o)
{
	if(!o.children)
		return;

	for(var i = 0; i < o.children.length; ++i)
	{
		var c = o.children[i];

		//create instance
		var node = new this.constructor(c.id); //id is hardcoded...
		//we do this before because otherwise the event fired by addChild wont have all the info which is crucial in some cases in the editor
		if(c.uid) 
			node.uid = c.uid;
		if(c.editor) 
			node._editor = c.editor;
		//add before configure, so every child has a scene tree
		this.addChild(node);
		//we configure afterwards otherwise children wouldnt have a scene tree to bind anything
		node.configure(c);
	}
}

/**
* Returns parent node
*
* @method getParent
* @return {SceneNode} parent node
*/
CompositePattern.prototype.getParent = function()
{
	return this._parentNode;
}

/**
* returns a list with all direct children (if you want below that use getDescendants)
* @method getChildren
* @param {Array} Original array containing the children
**/
CompositePattern.prototype.getChildren = function()
{
	return this._children || [];
}

/**
* returns the index of a child in the children array
* @method getChildIndex
* @param {SceneNode} child the child to search for
* @return {number} the index of this child in the array, if it is not inside returns -1
**/
CompositePattern.prototype.getChildIndex = function( child )
{
	return this._children ? this._children.indexOf( child ) : -1;
}

/**
* Returns the child in the index position
* @method getChildByIndex
* @param {number} index the index in the array 
* @return {SceneNode} the child in that position
**/
CompositePattern.prototype.getChildByIndex = function( index )
{
	return this._children && this._children.length > index ? this._children[ index ] : null;
}

/**
* Returns the child that matches that name
* @method getChildByName
* @param {String} name
* @return {SceneNode} the child with that name otherwise returns null;
**/
CompositePattern.prototype.getChildByName = function( name )
{
	if(!this._children)
		return null;

	for(var i = 0; i < this._children.length; ++i)
		if(this._children[i].name == name )
			return this._children[i];

	return null;
}

/**
* Returns the path name of the node (a path name is a concatenation of the name of the nodes an its ancestors: "root|parent|child"
* @method getPathName
* @return {String} the pathname
**/
CompositePattern.prototype.getPathName = function()
{
	if(!this._in_tree)
		return null;

	if(this === this._in_tree.root )
		return "";

	var path = this.name;
	var parent = this._parentNode;
	while(parent)
	{
		if(parent === this._in_tree.root )
			return path;
		path = parent.name + "|" + path;
		parent = parent._parentNode;
	}
	return null;
}

//DOM style
Object.defineProperty( CompositePattern.prototype, "childNodes", {
	enumerable: true,
	get: function() {
		return this._children || [];
	},
	set: function(v) {
		//TODO
	}
});

Object.defineProperty( CompositePattern.prototype, "parentNode", {
	enumerable: true,
	get: function() {
		return this._parentNode;
	},
	set: function(v) {
		//TODO
	}
});

Object.defineProperty( CompositePattern.prototype, "scene", {
	enumerable: true,
	get: function() {
		return this._in_tree;
	},
	set: function(v) {
		throw("Scene cannot be set, you must use addChild in parent");
	}
});

/**
* get all nodes below this in the hierarchy (children and children of children)
*
* @method getDescendants
* @return {Array} array containing all descendants
*/
CompositePattern.prototype.getDescendants = function()
{
	if(!this._children || this._children.length == 0)
		return [];
	var r = this._children.concat();
	for(var i = 0;  i < this._children.length; ++i)
		r = r.concat( this._children[i].getDescendants() );
	return r;
}

/**
* Swaps the index in the children array so it is before 
* @method moveBefore
* @param {SceneNode} sibling [optional] allows to put before given node, otherwise it will be moved one position before of current position
* @return {number} new index
**/
CompositePattern.prototype.moveBefore = function( sibling )
{
	if(!this._parentNode || (sibling && this._parentNode !== sibling._parentNode) )
		return -1;

	var parent_children = this._parentNode._children;
	var index = parent_children.indexOf( this );
	if(index == -1)
		throw("moveBefore node not found in parent, this is impossible");

	var new_index = index - 1;
	if(sibling)
	{
		new_index = parent_children.indexOf( sibling );
		if(new_index == -1)
			return -1;
		new_index = new_index - 1; //before
	}

	if(index == new_index || new_index < 0)
		return new_index; //nothing to do

	parent_children.splice( index, 1 ); //remove
	if(new_index > index) //sibling is after
		new_index -= 1;
	parent_children.splice( new_index, 0, this); //insert
	LEvent.trigger(this._in_tree,"node_rearranged", this );
	return new_index;
}

/**
* Swaps the index in the children array so it is before 
* @method moveAfter
* @param {SceneNode} sibling [optional] allows to put after given node, otherwise it will be moved one position after current position
* @return {number} new index
**/
CompositePattern.prototype.moveAfter = function( sibling )
{
	if(!this._parentNode || (sibling && this._parentNode !== sibling._parentNode) )
		return -1;

	var parent_children = this._parentNode._children;
	var index = parent_children.indexOf( this );
	if(index == -1)
		throw("moveBefore node not found in parent, this is impossible");

	var new_index = index + 1;
	if(sibling)
	{
		new_index = parent_children.indexOf( sibling );
		if(new_index == -1)
			return -1;
		new_index = new_index + 1; //before
	}

	if( index == new_index || new_index >= parent_children.length )
		return new_index; //nothing to do

	parent_children.splice( index, 1 ); //remove
	if(new_index > index) //sibling is after
		new_index -= 1;
	parent_children.splice( new_index, 0, this); //insert
	LEvent.trigger(this._in_tree,"node_rearranged", this );
	return new_index;
}


//search for a node using a string that could be a name, a fullname or a uid
CompositePattern.prototype.findNode = function( name_or_uid )
{
	if(name_or_uid == "")
		return this;
	if(!name_or_uid)
		return null;
	if(name_or_uid.charAt(0) != LS._uid_prefix)
		return this.findNodeByName( name_or_uid );
	return this.findNodeByUId( name_or_uid );
}

//this function gets called a lot when using animations
CompositePattern.prototype.findNodeByName = function( name )
{
	if(!name)
		return null;

	if(this.name == name)
		return this;

	var children = this._children;

	if(children)
	{
		for(var i = 0, l = children.length; i < l; ++i)
		{
			var node = children[i];
			if( node.name == name )
				return node;
			if(node._children)
			{
				var r = node.findNodeByName( name );
				if(r)
					return r;
			}
		}
	}
	return null;
}

CompositePattern.prototype.findNodeByUId = function( uid )
{
	if(!uid)
		return null;

	if(this.uid == uid)
		return this;

	var children = this._children;

	if(children)
		for(var i = 0; i < children.length; ++i)
		{
			var node = children[i];
			if( node.uid == uid )
				return node;
			if(node._children)
			{
				var r = node.findNodeByUId(uid);
				if(r)
					return r;
			}
		}
	return null;
}



