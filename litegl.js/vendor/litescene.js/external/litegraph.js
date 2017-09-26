//packer version

// *************************************************************
//   LiteGraph CLASS                                     *******
// *************************************************************

/**
* The Global Scope. It contains all the registered node classes.
*
* @class LiteGraph
* @constructor
*/

var LiteGraph = {

	NODE_TITLE_HEIGHT: 16,
	NODE_SLOT_HEIGHT: 15,
	NODE_WIDTH: 140,
	NODE_MIN_WIDTH: 50,
	NODE_COLLAPSED_RADIUS: 10,
	NODE_COLLAPSED_WIDTH: 80,
	CANVAS_GRID_SIZE: 10,
	NODE_DEFAULT_COLOR: "#999",
	NODE_DEFAULT_BGCOLOR: "#444",
	NODE_DEFAULT_BOXCOLOR: "#AEF",
	NODE_DEFAULT_SHAPE: "box",
	MAX_NUMBER_OF_NODES: 1000, //avoid infinite loops
	DEFAULT_POSITION: [100,100],
	node_images_path: "",

	debug: false,
	registered_node_types: {},
	graphs: [],

	/**
	* Register a node class so it can be listed when the user wants to create a new one
	* @method registerNodeType
	* @param {String} type name of the node and path
	* @param {Class} base_class class containing the structure of a node
	*/

	registerNodeType: function(type, base_class)
	{
		var title = type;
		if(base_class.prototype && base_class.prototype.title)
			title = base_class.prototype.title;
		else if(base_class.title)
			title = base_class.title;

		base_class.type = type;
		if(LiteGraph.debug)
			console.log("Node registered: " + type);

		var categories = type.split("/");

		var pos = type.lastIndexOf("/");
		base_class.category = type.substr(0,pos);
		//info.name = name.substr(pos+1,name.length - pos);

		//inheritance
		if(base_class.prototype) //is a class
			for(var i in LGraphNode.prototype)
				if(!base_class.prototype[i])
					base_class.prototype[i] = LGraphNode.prototype[i];

		this.registered_node_types[type] = base_class;
	},

	/**
	* Create a node of a given type with a name. The node is not attached to any graph yet.
	* @method createNode
	* @param {String} type full name of the node class. p.e. "math/sin"
	* @param {String} name a name to distinguish from other nodes
	* @param {Object} options to set options
	*/

	createNode: function(type,name, options)
	{
		var base_class = this.registered_node_types[type];
		if (!base_class)
		{
			if(LiteGraph.debug)
				console.log("GraphNode type \"" + type + "\" not registered.");
			return null;
		}

		var prototype = base_class.prototype || base_class;

		name = name || prototype.title || base_class.title || type;

		var node = null;
		if (base_class.prototype) //is a class
		{
			node = new base_class(name);
		}
		else
		{
			node = new LGraphNode(name);
			node.inputs = [];
			node.outputs = [];

			//add inputs and outputs
			for (var i in prototype)
			{
				if(i == "inputs")
				{
					for(var j in prototype[i])
						node.addInput( prototype[i][j][0],prototype[i][j][1], prototype[i][j][2] );
				}
				else if(i == "outputs")
				{
					for(var j in prototype[i])
						node.addOutput( prototype[i][j][0],prototype[i][j][1], prototype[i][j][2] );
				}
				else
				{
					if( prototype[i].concat ) //array
						node[i] = prototype[i].concat();
					else if (typeof(prototype[i]) == 'object')
						node[i] = LiteGraph.cloneObject(prototype[i]); //slow but safe
					else
						node[i] = prototype[i];
				}
			}
			//set size
			if(base_class.size) node.size = base_class.size.concat(); //save size
		}

		node.type = type;
		if(!node.name) node.name = name;
		if(!node.flags) node.flags = {};
		if(!node.size) node.size = node.computeSize();
		if(!node.pos) node.pos = LiteGraph.DEFAULT_POSITION.concat();

		//extra options
		if(options)
		{
			for(var i in options)
				node[i] = options[i];								
		}

		return node;
	},

	/**
	* Returns a registered node type with a given name
	* @method getNodeType
	* @param {String} type full name of the node class. p.e. "math/sin"
	* @return {Class} the node class
	*/

	getNodeType: function(type)
	{
		return this.registered_node_types[type];
	},


	/**
	* Returns a list of node types matching one category
	* @method getNodeType
	* @param {String} category category name
	* @return {Array} array with all the node classes
	*/

	getNodeTypesInCategory: function(category)
	{
		var r = [];
		for(var i in this.registered_node_types)
			if(category == "")
			{
				if (this.registered_node_types[i].category == null)
					r.push(this.registered_node_types[i]);
			}
			else if (this.registered_node_types[i].category == category)
				r.push(this.registered_node_types[i]);

		return r;
	},

	/**
	* Returns a list with all the node type categories
	* @method getNodeTypesCategories
	* @return {Array} array with all the names of the categories 
	*/

	getNodeTypesCategories: function()
	{
		var categories = {"":1};
		for(var i in this.registered_node_types)
			if(this.registered_node_types[i].category && !this.registered_node_types[i].skip_list)
				categories[ this.registered_node_types[i].category ] = 1;
		var result = [];
		for(var i in categories)
			result.push(i);
		return result;
	},

	//debug purposes: reloads all the js scripts that matches a wilcard
	reloadNodes: function (folder_wildcard)
	{
		var tmp = document.getElementsByTagName("script");
		//weird, this array changes by its own, so we use a copy
		var script_files = [];
		for(var i in tmp)
			script_files.push(tmp[i]);


		var docHeadObj = document.getElementsByTagName("head")[0];
		folder_wildcard = document.location.href + folder_wildcard;

		for(var i in script_files)
		{
			var src = script_files[i].src;
			if( !src || src.substr(0,folder_wildcard.length ) != folder_wildcard)
				continue;

			try
			{
				if(LiteGraph.debug)
					console.log("Reloading: " + src);
				var dynamicScript = document.createElement("script");
				dynamicScript.type = "text/javascript";
				dynamicScript.src = src;
				docHeadObj.appendChild(dynamicScript);
				docHeadObj.removeChild(script_files[i]);
			}
			catch (err)
			{
				if(LiteGraph.throw_errors)
					throw err;
				if(LiteGraph.debug)
					console.log("Error while reloading " + src);
			}
		}

		for (var i in LiteGraph.graphs)
		{
			for (var j in LiteGraph.graphs[i]._nodes)
			{
				var m = LiteGraph.graphs[i]._nodes[j];
				var t = LiteGraph.getNodeType(n.type);
				if(!t) continue;

				for (var k in t)
					if( typeof(t[k]) == "function" )
						m[k] = t[k];
			}
		}

		if(LiteGraph.debug)
			console.log("Nodes reloaded");
	},
	
	//separated just to improve if it doesnt work
	cloneObject: function(obj, target)
	{
		var r = JSON.parse( JSON.stringify( obj ) );
		if(!target) return r;

		for(var i in r)
			target[i] = r[i];
		return target;
	}

	/*
	benchmark: function(mode)
	{
		mode = mode || "all";

		trace("Benchmarking " + mode + "...");
		trace("  Num. nodes: " + this._nodes.length );
		var links = 0;
		for(var i in this._nodes)
			for(var j in this._nodes[i].outputs)
				if(this._nodes[i].outputs[j].node_id != null)
					links++;
		trace("  Num. links: " + links );
		
		var numTimes = 200;
		if(mode == "core")
			numTimes = 30000;

		var start = new Date().getTime();

		for(var i = 0; i < numTimes; i++)
		{
			if(mode == "render")
				this.draw(false);
			else if(mode == "core")
				this.sendEventToAllNodes("onExecute");
			else
			{
				this.sendEventToAllNodes("onExecute");
				this.draw(false);
			}
		}

		var elapsed = (new Date().getTime()) - start;
		trace("  Time take for  " + numTimes + " iterations: " + (elapsed*0.001).toFixed(3) + " seconds.");
		var seconds_per_iteration = (elapsed*0.001)/numTimes;
		trace("  Time per iteration:  " + seconds_per_iteration.toFixed( seconds_per_iteration < 0.001 ? 6 : 3) + " seconds");
		trace("  Avg FPS: " + (1000/(elapsed/numTimes)).toFixed(3));
	}
	*/
};





//*********************************************************************************
// LGraph CLASS                                  
//*********************************************************************************

/**
* LGraph is the class that contain a full graph. We instantiate one and add nodes to it, and then we can run the execution loop.
*
* @class LGraph
* @constructor
*/

function LGraph()
{
	if (LiteGraph.debug)
		console.log("Graph created");
	this.canvas = null;
	LiteGraph.graphs.push(this);
	this.clear();
}

LGraph.STATUS_STOPPED = 1;
LGraph.STATUS_RUNNING = 2;

/**
* Removes all nodes from this graph
* @method clear
*/

LGraph.prototype.clear = function()
{
	this.stop();
	this.status = LGraph.STATUS_STOPPED;
	this.last_node_id = 0;

	//nodes
	this._nodes = [];
	this._nodes_by_id = {};

	//links
	this.last_link_id = 0;
	this.links = {};

	//iterations
	this.iteration = 0;

	this.config = {
		canvas_offset: [0,0],
		canvas_scale: 1.0
	};

	//timing
	this.globaltime = 0;
	this.runningtime = 0;
	this.fixedtime =  0;
	this.fixedtime_lapse = 0.01;
	this.elapsed_time = 0.01;
	this.starttime = 0;

	this.graph = {};
	this.debug = true;

	this.change();
	if(this.canvas)
		this.canvas.clear();
}

/**
* Starts running this graph every interval milliseconds.
* @method start
* @param {number} interval amount of milliseconds between executions, default is 1
*/

LGraph.prototype.start = function(interval)
{
	if(this.status == LGraph.STATUS_RUNNING) return;
	this.status = LGraph.STATUS_RUNNING;

	if(this.onPlayEvent)
		this.onPlayEvent();

	this.sendEventToAllNodes("onStart");

	//launch
	this.starttime = new Date().getTime();
	interval = interval || 1;
	var that = this;	

	this.execution_timer_id = setInterval( function() { 
		//execute
		that.runStep(1); 
	},interval);
}

/**
* Stops the execution loop of the graph
* @method stop
*/

LGraph.prototype.stop = function()
{
	if(this.status == LGraph.STATUS_STOPPED)
		return;

	this.status = LGraph.STATUS_STOPPED;

	if(this.onStopEvent)
		this.onStopEvent();

	if(this.execution_timer_id != null)
		clearInterval(this.execution_timer_id);
	this.execution_timer_id = null;

	this.sendEventToAllNodes("onStop");
}

/**
* Run N steps (cycles) of the graph
* @method runStep
* @param {number} num number of steps to run, default is 1
*/

LGraph.prototype.runStep = function(num)
{
	num = num || 1;

	var start = new Date().getTime();
	this.globaltime = 0.001 * (start - this.starttime);

	try
	{
		for(var i = 0; i < num; i++)
		{
			this.sendEventToAllNodes("onExecute");
			this.fixedtime += this.fixedtime_lapse;
			if( this.onExecuteStep )
				this.onExecuteStep();
		}

		if( this.onAfterExecute )
			this.onAfterExecute();
		this.errors_in_execution = false;
	}
	catch (err)
	{
		this.errors_in_execution = true;
		if(LiteGraph.throw_errors)
			throw err;
		if(LiteGraph.debug)
			console.log("Error during execution: " + err);
		this.stop();
	}

	var elapsed = (new Date().getTime()) - start;
	if (elapsed == 0) elapsed = 1;
	this.elapsed_time = 0.001 * elapsed;
	this.globaltime += 0.001 * elapsed;
	this.iteration += 1;
}

/**
* Updates the graph execution order according to relevance of the nodes (nodes with only outputs have more relevance than
* nodes with only inputs.
* @method updateExecutionOrder
*/
	
LGraph.prototype.updateExecutionOrder = function()
{
	this._nodes_in_order = this.computeExecutionOrder();
}

//This is more internal, it computes the order and returns it
LGraph.prototype.computeExecutionOrder = function()
{
	var L = [];
	var S = [];
	var M = {};
	var visited_links = {}; //to avoid repeating links
	var remaining_links = {}; //to a
	
	//search for the nodes without inputs (starting nodes)
	for (var i in this._nodes)
	{
		var n = this._nodes[i];
		M[n.id] = n; //add to pending nodes

		var num = 0; //num of input connections
		if(n.inputs)
			for(var j = 0, l = n.inputs.length; j < l; j++)
				if(n.inputs[j] && n.inputs[j].link != null)
					num += 1;

		if(num == 0) //is a starting node
			S.push(n);
		else //num of input links 
			remaining_links[n.id] = num;
	}

	while(true)
	{
		if(S.length == 0)
			break;
			
		//get an starting node
		var n = S.shift();
		L.push(n); //add to ordered list
		delete M[n.id]; //remove from the pending nodes
		
		//for every output
		if(n.outputs)
			for(var i = 0; i < n.outputs.length; i++)
			{
				var output = n.outputs[i];
				//not connected
				if(output == null || output.links == null || output.links.length == 0)
					continue;

				//for every connection
				for(var j = 0; j < output.links.length; j++)
				{
					var link = output.links[j];

					//already visited link (ignore it)
					if(visited_links[ link[0] ])
						continue;

					var target_node = this.getNodeById( link[3] );
					if(target_node == null)
					{
						visited_links[ link[0] ] = true;
						continue;
					}

					visited_links[link[0]] = true; //mark as visited
					remaining_links[target_node.id] -= 1; //reduce the number of links remaining
					if (remaining_links[target_node.id] == 0)
						S.push(target_node); //if no more links, then add to Starters array
				}
			}
	}
	
	//the remaining ones (loops)
	for(var i in M)
		L.push(M[i]);
		
	if(L.length != this._nodes.length && LiteGraph.debug)
		console.log("something went wrong, nodes missing");

	//save order number in the node
	for(var i in L)
		L[i].order = i;
	
	return L;
}


/**
* Returns the amount of time the graph has been running in milliseconds
* @method getTime
* @return {number} number of milliseconds the graph has been running
*/

LGraph.prototype.getTime = function()
{
	return this.globaltime;
}

/**
* Returns the amount of time accumulated using the fixedtime_lapse var. This is used in context where the time increments should be constant
* @method getFixedTime
* @return {number} number of milliseconds the graph has been running
*/

LGraph.prototype.getFixedTime = function()
{
	return this.fixedtime;
}

/**
* Returns the amount of time it took to compute the latest iteration. Take into account that this number could be not correct
* if the nodes are using graphical actions
* @method getElapsedTime
* @return {number} number of milliseconds it took the last cycle
*/

LGraph.prototype.getElapsedTime = function()
{
	return this.elapsed_time;
}

/**
* Sends an event to all the nodes, useful to trigger stuff
* @method sendEventToAllNodes
* @param {String} eventname the name of the event
* @param {Object} param an object containing the info
*/

LGraph.prototype.sendEventToAllNodes = function(eventname, param)
{
	var M = this._nodes_in_order ? this._nodes_in_order : this._nodes;
	for(var j in M)
		if(M[j][eventname])
			M[j][eventname](param);
}

/**
* Adds a new node instasnce to this graph
* @method add
* @param {LGraphNode} node the instance of the node
*/

LGraph.prototype.add = function(node)
{
	if(!node || (node.id != -1 && this._nodes_by_id[node.id] != null))
		return; //already added

	if(this._nodes.length >= LiteGraph.MAX_NUMBER_OF_NODES)
		throw("LiteGraph: max number of nodes in a graph reached");

	//give him an id
	if(node.id == null || node.id == -1)
		node.id = this.last_node_id++;

	node.graph = this;

	this._nodes.push(node);
	this._nodes_by_id[node.id] = node;

	/*
	// rendering stuf... 
	if(node.bgImageUrl)
		node.bgImage = node.loadImage(node.bgImageUrl);
	*/

	if(node.onInit)
		node.onInit();

	if(this.config.align_to_grid)
		node.alignToGrid();
		
	this.updateExecutionOrder();	

	if(this.canvas)
		this.canvas.dirty_canvas = true;

	this.change();

	return node; //to chain actions
}

/**
* Removes a node from the graph
* @method remove
* @param {LGraphNode} node the instance of the node
*/

LGraph.prototype.remove = function(node)
{
	if(this._nodes_by_id[node.id] == null)
		return; //not found

	if(node.ignore_remove) 
		return; //cannot be removed

	//disconnect inputs
	if(node.inputs)
		for(var i = 0; i < node.inputs.length; i++)
		{
			var slot = node.inputs[i];
			if(slot.link != null)
				node.disconnectInput(i);
		}

	//disconnect outputs
	if(node.outputs)
		for(var i = 0; i < node.outputs.length; i++)
		{
			var slot = node.outputs[i];
			if(slot.links != null && slot.links.length)
				node.disconnectOutput(i);
		}

	node.id = -1;

	//callback
	if(node.onDelete)
		node.onDelete();

	//remove from environment
	if(this.canvas)
	{
		if(this.canvas.selected_nodes[node.id])
			delete this.canvas.selected_nodes[node.id];
		if(this.canvas.node_dragged == node)
			this.canvas.node_dragged = null;
	}

	//remove from containers
	var pos = this._nodes.indexOf(node);
	if(pos != -1)
		this._nodes.splice(pos,1);
	delete this._nodes_by_id[node.id];

	if(this.canvas)
		this.canvas.setDirty(true,true);

	this.change();

	this.updateExecutionOrder();
}

/**
* Returns a node by its id.
* @method getNodeById
* @param {String} id
*/

LGraph.prototype.getNodeById = function(id)
{
	if(id==null) return null;
	return this._nodes_by_id[id];
}


/**
* Returns a list of nodes that matches a type
* @method findNodesByType
* @param {String} type the name of the node type
* @return {Array} a list with all the nodes of this type
*/

LGraph.prototype.findNodesByType = function(type)
{
	var r = [];
	for(var i in this._nodes)
		if(this._nodes[i].type == type)
			r.push(this._nodes[i]);
	return r;
}

/**
* Returns a list of nodes that matches a name
* @method findNodesByName
* @param {String} name the name of the node to search
* @return {Array} a list with all the nodes with this name
*/

LGraph.prototype.findNodesByName = function(name)
{
	var result = [];
	for (var i in this._nodes)
		if(this._nodes[i].name == name)
			result.push(this._nodes[i]);
	return result;
}

/**
* Returns the top-most node in this position of the canvas
* @method getNodeOnPos
* @param {number} x the x coordinate in canvas space
* @param {number} y the y coordinate in canvas space
* @param {Array} nodes_list a list with all the nodes to search from, by default is all the nodes in the graph
* @return {Array} a list with all the nodes that intersect this coordinate
*/

LGraph.prototype.getNodeOnPos = function(x,y, nodes_list)
{
	nodes_list = nodes_list || this._nodes;
	for (var i = nodes_list.length - 1; i >= 0; i--)
	{
		var n = nodes_list[i];
		if(n.isPointInsideNode(x,y))
			return n;
	}
	return null;
}

/**
* Assigns a value to all the nodes that matches this name. This is used to create global variables of the node that
* can be easily accesed from the outside of the graph
* @method setInputData
* @param {String} name the name of the node
* @param {*} value value to assign to this node
*/

LGraph.prototype.setInputData = function(name,value)
{
	var m = this.findNodesByName(name);
	for(var i in m)
		m[i].setValue(value);
}

/**
* Returns the value of the first node with this name. This is used to access global variables of the graph from the outside
* @method setInputData
* @param {String} name the name of the node
* @return {*} value of the node
*/

LGraph.prototype.getOutputData = function(name)
{
	var n = this.findNodesByName(name);
	if(n.length)
		return m[0].getValue();
	return null;
}

//This feature is not finished yet, is to create graphs where nodes are not executed unless a trigger message is received

LGraph.prototype.triggerInput = function(name,value)
{
	var m = this.findNodesByName(name);
	for(var i in m)
		m[i].onTrigger(value);
}

LGraph.prototype.setCallback = function(name,func)
{
	var m = this.findNodesByName(name);
	for(var i in m)
		m[i].setTrigger(func);
}


LGraph.prototype.onConnectionChange = function()
{
	this.updateExecutionOrder();
}

LGraph.prototype.isLive = function()
{
	if(!this.canvas) return false;
	return this.canvas.live_mode;
}

LGraph.prototype.change = function()
{
	if(LiteGraph.debug)
		console.log("Graph changed");
	if(this.on_change)
		this.on_change(this);
}

//save and recover app state ***************************************
/**
* Creates a Object containing all the info about this graph, it can be serialized
* @method serialize
* @return {Object} value of the node
*/
LGraph.prototype.serialize = function()
{
	var nodes_info = [];
	for (var i in this._nodes)
		nodes_info.push( this._nodes[i].serialize() );

	var data = {
		graph: this.graph,

		iteration: this.iteration,
		frame: this.frame,
		last_node_id: this.last_node_id,
		last_link_id: this.last_link_id,

		config: this.config,
		nodes: nodes_info
	};

	return data;
}


/**
* Configure a graph from a JSON string 
* @method configure
* @param {String} str configure a graph from a JSON string
*/
LGraph.prototype.configure = function(data, keep_old)
{
	if(!keep_old)
		this.clear();

	var nodes = data.nodes;

	//copy all stored fields
	for (var i in data)
		this[i] = data[i];

	var error = false;

	//create nodes
	this._nodes = [];
	for (var i in nodes)
	{
		var n_info = nodes[i]; //stored info
		var n = LiteGraph.createNode( n_info.type, n_info.name );
		if(!n)
		{
			if(LiteGraph.debug)
				console.log("Node not found: " + n_info.type);
			error = true;
			continue;
		}

		n.configure(n_info);
		this.add(n);
	}

	//TODO: dispatch redraw
	if(this.canvas)
		this.canvas.draw(true,true);

	return error;
}

LGraph.prototype.onNodeTrace = function(node, msg, color)
{
	if(this.canvas)
		this.canvas.onNodeTrace(node,msg,color);
}

// *************************************************************
//   Node CLASS                                          *******
// *************************************************************

/* flags:
		+ skip_title_render
		+ clip_area
		+ unsafe_execution: not allowed for safe execution

	supported callbacks: 
		+ onInit: when added to graph
		+ onStart:	when starts playing
		+ onStop:	when stops playing
		+ onDrawForeground
		+ onDrawBackground
		+ onMouseMove
		+ onMouseOver
		+ onExecute: execute the node
		+ onPropertyChange: when a property is changed in the panel (return true to skip default behaviour)
		+ onGetInputs: returns an array of possible inputs
		+ onGetOutputs: returns an array of possible outputs
		+ onClick
		+ onDblClick
		+ onSerialize
		+ onSelected
		+ onDeselected
*/

/**
* Base Class for all the node type classes
* @class LGraphNode
* @param {String} name a name for the node
*/

function LGraphNode(name)
{
	this.name = name || "Unnamed";
	this.size = [LiteGraph.NODE_WIDTH,60];
	this.graph = null;

	this.pos = [10,10];
	this.id = -1; //not know till not added
	this.type = null;

	//inputs available: array of inputs
	this.inputs = [];
	this.outputs = [];
	this.connections = [];

	//local data
	this.data = null; //persistent local data
	this.flags = {
		//skip_title_render: true,
		//unsafe_execution: false,
	};
}

//serialization *************************
LGraphNode.prototype.configure = function(info)
{
	for (var j in info)
	{
		if(j == "console") continue;

		if(info[j] == null)
			continue;
		else if( info[j].concat ) //array
			this[j] = info[j].concat();
		else if (typeof(info[j]) == 'object') //object
			this[j] = LiteGraph.cloneObject(info[j], this[j] || {} );
		else //value
			this[j] = info[j];
	}
}

/* Copy all the info from one object to this node (used for serialization) */
LGraphNode.prototype.copyFromObject = function(info, ignore_connections)
{
	var outputs = null;
	var inputs = null;
	var properties = null;
	var local_data = null;

	for (var j in info)
	{
		if(ignore_connections && (j == "outputs" || j == "inputs"))
			continue;

		if(j == "console") continue;

		if(info[j] == null)
			continue;
		else if( info[j].concat ) //array
			this[j] = info[j].concat();
		else if (typeof(info[j]) == 'object') //object
			this[j] = LiteGraph.cloneObject(info[j]);
		else //value
			this[j] = info[j];
	}
}

LGraphNode.prototype.serialize = function()
{
	var o = {
		id: this.id,
		name: this.name,
		type: this.type,
		pos: this.pos,
		size: this.size,
		data: this.data,
		properties: LiteGraph.cloneObject(this.properties),
		flags: LiteGraph.cloneObject(this.flags),
		inputs: this.inputs,
		outputs: this.outputs
	};

	if(!o.type)
		o.type = this.constructor.type;

	if(this.color)
		o.color = this.color;
	if(this.bgcolor)
		o.bgcolor = this.bgcolor;
	if(this.boxcolor)
		o.boxcolor = this.boxcolor;
	if(this.shape)
		o.shape = this.shape;

	if(this.onSerialize)
		this.onSerialize(o);

	return o;
}

//reduced version of objectivize: NOT FINISHED
/*
LGraphNode.prototype.reducedObjectivize = function()
{
	var o = this.objectivize();
	
	var type = LiteGraph.getNodeType(o.type);

	if(type.name == o.name)
		delete o["name"];

	if(type.size && compareObjects(o.size,type.size))
		delete o["size"];

	if(type.properties && compareObjects(o.properties, type.properties))
		delete o["properties"];

	return o;
}
*/

LGraphNode.prototype.toString = function()
{
	return JSON.stringify( this.serialize() );
}
//LGraphNode.prototype.unserialize = function(info) {} //this cannot be done from within, must be done in LiteGraph


// Execution *************************

LGraphNode.prototype.setOutputData = function(slot,data)
{
	if(!this.outputs) return;
	if(slot > -1 && slot < this.outputs.length && this.outputs[slot] && this.outputs[slot].links != null)
	{
		for(var i = 0; i < this.outputs[slot].links.length; i++)
			this.graph.links[ this.outputs[slot].links[i][0] ] = data;
	}
}

LGraphNode.prototype.getInputData = function(slot)
{
	if(!this.inputs) return null;
	if(slot < this.inputs.length && this.inputs[slot].link != null)
		return this.graph.links[ this.inputs[slot].link[0] ];
	return null;
}

LGraphNode.prototype.isInputConnected = function(slot)
{
	if(!this.inputs) return null;
	return (slot < this.inputs.length && this.inputs[slot].link != null);
}

LGraphNode.prototype.getInputInfo = function(slot)
{
	if(!this.inputs) return null;
	if(slot < this.inputs.length)
		return this.inputs[slot];
	return null;
}


LGraphNode.prototype.getOutputInfo = function(slot)
{
	if(!this.outputs) return null;
	if(slot < this.outputs.length)
		return this.outputs[slot];
	return null;
}

LGraphNode.prototype.isOutputConnected = function(slot)
{
	if(!this.outputs) return null;
	return (slot < this.outputs.length && this.outputs[slot].links && this.outputs[slot].links.length);
}

LGraphNode.prototype.getOutputNodes = function(slot)
{
	if(!this.outputs || this.outputs.length == 0) return null;
	if(slot < this.outputs.length)
	{
		var output = this.outputs[slot];
		var r = [];
		for(var i = 0; i < output.length; i++)
			r.push( this.graph.getNodeById( output.links[i][3] ));
		return r;
	}
	return null;
}

LGraphNode.prototype.triggerOutput = function(slot,param)
{
	var n = this.getOutputNode(slot);
	if(n && n.onTrigger)
		n.onTrigger(param);
}

//connections

LGraphNode.prototype.addOutput = function(name,type,extra_info)
{
	var o = {name:name,type:type,links:null};
	if(extra_info)
		for(var i in extra_info)
			o[i] = extra_info[i];

	if(!this.outputs) this.outputs = [];
	this.outputs.push(o);
	this.size = this.computeSize();
}

LGraphNode.prototype.removeOutput = function(slot)
{
	this.disconnectOutput(slot);
	this.outputs.splice(slot,1);
	this.size = this.computeSize();
}

LGraphNode.prototype.addInput = function(name,type,extra_info)
{
	var o = {name:name,type:type,link:null};
	if(extra_info)
		for(var i in extra_info)
			o[i] = extra_info[i];

	if(!this.inputs) this.inputs = [];
	this.inputs.push(o);
	this.size = this.computeSize();
}

LGraphNode.prototype.removeInput = function(slot)
{
	this.disconnectInput(slot);
	this.inputs.splice(slot,1);
	this.size = this.computeSize();
}

//trigger connection
LGraphNode.prototype.addConnection = function(name,type,pos,direction)
{
	this.connections.push( {name:name,type:type,pos:pos,direction:direction,links:null});
}


LGraphNode.prototype.computeSize = function(minHeight)
{
	var rows = Math.max( this.inputs ? this.inputs.length : 1, this.outputs ? this.outputs.length : 1);
	var size = [0,0];
	size[1] = rows * 14 + 6;
	if(!this.inputs || this.inputs.length == 0 || !this.outputs || this.outputs.length == 0)
		size[0] = LiteGraph.NODE_WIDTH * 0.5;
	else
		size[0] = LiteGraph.NODE_WIDTH;
	return size;
}

//returns the bounding of the object, used for rendering purposes
LGraphNode.prototype.getBounding = function()
{
	return new Float32Array([this.pos[0] - 4, this.pos[1] - LiteGraph.NODE_TITLE_HEIGHT, this.pos[0] + this.size[0] + 4, this.pos[1] + this.size[1] + LGraph.NODE_TITLE_HEIGHT]);
}

//checks if a point is inside the shape of a node
LGraphNode.prototype.isPointInsideNode = function(x,y)
{
	var margin_top = this.graph.isLive() ? 0 : 20;
	if(this.flags.collapsed)
	{
		//if ( distance([x,y], [this.pos[0] + this.size[0]*0.5, this.pos[1] + this.size[1]*0.5]) < LiteGraph.NODE_COLLAPSED_RADIUS)
		if( isInsideRectangle(x,y, this.pos[0], this.pos[1] - LiteGraph.NODE_TITLE_HEIGHT, LiteGraph.NODE_COLLAPSED_WIDTH, LiteGraph.NODE_TITLE_HEIGHT) )
			return true;
	}
	else if (this.pos[0] - 4 < x && (this.pos[0] + this.size[0] + 4) > x
		&& (this.pos[1] - margin_top) < y && (this.pos[1] + this.size[1]) > y)
		return true;
	return false;
}

LGraphNode.prototype.findInputSlot = function(name)
{
	if(!this.inputs) return -1;
	for(var i = 0, l = this.inputs.length; i < l; ++i)
		if(name == this.inputs[i].name)
			return i;
	return -1;
}

LGraphNode.prototype.findOutputSlot = function(name)
{
	if(!this.outputs) return -1;
	for(var i = 0, l = this.outputs.length; i < l; ++i)
		if(name == this.outputs[i].name)
			return i;
	return -1;
}

//connect this node output to the input of another node
LGraphNode.prototype.connect = function(slot, node, target_slot)
{
	target_slot = target_slot || 0;

	//seek for the output slot
	if( slot.constructor === String )
	{
		slot = this.findOutputSlot(slot);
		if(slot == -1)
		{
			if(LiteGraph.debug)
				console.log("Connect: Error, no slot of name " + slot);
			return false;
		}
	}
	else if(!this.outputs || slot >= this.outputs.length) 
	{
		if(LiteGraph.debug)
			console.log("Connect: Error, slot number not found");
		return false;
	}

	//avoid loopback
	if(node == this) return false; 
	//if( node.constructor != LGraphNode ) throw ("LGraphNode.connect: node is not of type LGraphNode");

	if(target_slot.constructor === String)
	{
		target_slot = node.findInputSlot(target_slot);
		if(target_slot == -1)
		{
			if(LiteGraph.debug)
				console.log("Connect: Error, no slot of name " + target_slot);
			return false;
		}
	}
	else if(!node.inputs || target_slot >= node.inputs.length) 
	{
		if(LiteGraph.debug)
			console.log("Connect: Error, slot number not found");
		return false;
	}

	//if there is something already plugged there, disconnect
	if(target_slot != -1 && node.inputs[target_slot].link != null)
		node.disconnectInput(target_slot);
		
	//special case: -1 means node-connection, used for triggers
	var output = this.outputs[slot];
	if(target_slot == -1)
	{
		if( output.links == null )
			output.links = [];
		output.links.push({id:node.id, slot: -1});
	}
	else if(output.type == 0 ||  //generic output
			node.inputs[target_slot].type == 0 || //generic input
			output.type == node.inputs[target_slot].type) //same type
	{
		//info: link structure => [ 0:link_id, 1:start_node_id, 2:start_slot, 3:end_node_id, 4:end_slot ]
		var link = [ this.graph.last_link_id++, this.id, slot, node.id, target_slot ];

		//connect
		if( output.links == null )	output.links = [];
		output.links.push(link);
		node.inputs[target_slot].link = link;

		this.setDirtyCanvas(false,true);
		this.graph.onConnectionChange();
	}
	return true;
}

LGraphNode.prototype.disconnectOutput = function(slot, target_node)
{
	if( slot.constructor === String )
	{
		slot = this.findOutputSlot(slot);
		if(slot == -1)
		{
			if(LiteGraph.debug)
				console.log("Connect: Error, no slot of name " + slot);
			return false;
		}
	}
	else if(!this.outputs || slot >= this.outputs.length) 
	{
		if(LiteGraph.debug)
			console.log("Connect: Error, slot number not found");
		return false;
	}

	//get output slot
	var output = this.outputs[slot];
	if(!output.links || output.links.length == 0)
		return false;

	if(target_node)
	{
		for(var i = 0, l = output.links.length; i < l; i++)
		{
			var link = output.links[i];
			//is the link we are searching for...
			if( link[3] == target_node.id )
			{
				output.links.splice(i,1); //remove here
				target_node.inputs[ link[4] ].link = null; //remove there
				delete this.graph.links[link[0]];
				break;
			}
		}
	}
	else
	{
		for(var i = 0, l = output.links.length; i < l; i++)
		{
			var link = output.links[i];
			var target_node = this.graph.getNodeById( link[3] );
			if(target_node)
				target_node.inputs[ link[4] ].link = null; //remove other side link
		}
		output.links = null;
	}

	this.setDirtyCanvas(false,true);
	this.graph.onConnectionChange();
	return true;
}

LGraphNode.prototype.disconnectInput = function(slot)
{
	//seek for the output slot
	if( slot.constructor === String )
	{
		slot = this.findInputSlot(slot);
		if(slot == -1)
		{
			if(LiteGraph.debug)
				console.log("Connect: Error, no slot of name " + slot);
			return false;
		}
	}
	else if(!this.inputs || slot >= this.inputs.length) 
	{
		if(LiteGraph.debug)
			console.log("Connect: Error, slot number not found");
		return false;
	}

	var input = this.inputs[slot];
	if(!input) return false;
	var link = this.inputs[slot].link;
	this.inputs[slot].link = null;

	//remove other side
	var node = this.graph.getNodeById( link[1] );
	if(!node) return false;

	var output = node.outputs[ link[2] ];
	if(!output || !output.links || output.links.length == 0) 
		return false;

	for(var i = 0, l = output.links.length; i < l; i++)
	{
		var link = output.links[i];
		if( link[3] == this.id )
		{
			output.links.splice(i,1);
			break;
		}
	}

	this.setDirtyCanvas(false,true);
	this.graph.onConnectionChange();
	return true;
}

//returns the center of a connection point in canvas coords
LGraphNode.prototype.getConnectionPos = function(is_input,slot_number)
{
	if(this.flags.collapsed)
	{
		if(is_input)
			return [this.pos[0], this.pos[1] - LiteGraph.NODE_TITLE_HEIGHT * 0.5];
		else
			return [this.pos[0] + LiteGraph.NODE_COLLAPSED_WIDTH, this.pos[1] - LiteGraph.NODE_TITLE_HEIGHT * 0.5];
		//return [this.pos[0] + this.size[0] * 0.5, this.pos[1] + this.size[1] * 0.5];
	}

	if(is_input && slot_number == -1)
	{
		return [this.pos[0] + 10, this.pos[1] + 10];
	}

	if(is_input && this.inputs.length > slot_number && this.inputs[slot_number].pos)
		return [this.pos[0] + this.inputs[slot_number].pos[0],this.pos[1] + this.inputs[slot_number].pos[1]];
	else if(!is_input && this.outputs.length > slot_number && this.outputs[slot_number].pos)
		return [this.pos[0] + this.outputs[slot_number].pos[0],this.pos[1] + this.outputs[slot_number].pos[1]];

	if(!is_input) //output
		return [this.pos[0] + this.size[0] + 1, this.pos[1] + 10 + slot_number * LiteGraph.NODE_SLOT_HEIGHT];
	return [this.pos[0] , this.pos[1] + 10 + slot_number * LiteGraph.NODE_SLOT_HEIGHT];
}

/* Force align to grid */
LGraphNode.prototype.alignToGrid = function()
{
	this.pos[0] = LiteGraph.CANVAS_GRID_SIZE * Math.round(this.pos[0] / LiteGraph.CANVAS_GRID_SIZE);
	this.pos[1] = LiteGraph.CANVAS_GRID_SIZE * Math.round(this.pos[1] / LiteGraph.CANVAS_GRID_SIZE);
}

/* Creates a clone of this node */
LGraphNode.prototype.clone = function()
{
	var node = LiteGraph.createNode(this.type);

	node.size = this.size.concat();
	if(this.inputs)
		for(var i = 0, l = this.inputs.length; i < l; ++i)
		{
			if(node.findInputSlot( this.inputs[i].name ) == -1)
				node.addInput( this.inputs[i].name, this.inputs[i].type );
		}

	if(this.outputs)
		for(var i = 0, l = this.outputs.length; i < l; ++i)
		{
			if(node.findOutputSlot( this.outputs[i].name ) == -1)
				node.addOutput( this.outputs[i].name, this.outputs[i].type );
		}


	return node;
}

/* Console output */
LGraphNode.prototype.trace = function(msg)
{
	if(!this.console)
		this.console = [];
	this.console.push(msg);
	if(this.console.length > LGraphNode.MAX_CONSOLE)
		this.console.shift();

	this.graph.onNodeTrace(this,msg);
}

/* Forces to redraw or the main canvas (LGraphNode) or the bg canvas (links) */
LGraphNode.prototype.setDirtyCanvas = function(dirty_foreground, dirty_background)
{
	if(!this.graph || !this.graph.canvas)
		return;

	if(dirty_foreground)
		this.graph.canvas.dirty_canvas = true;
	if(dirty_background)
		this.graph.canvas.dirty_bgcanvas = true;
}

LGraphNode.prototype.loadImage = function(url)
{
	var img = new Image();
	img.src = LiteGraph.node_images_path + url;	
	img.ready = false;

	var that = this;
	img.onload = function() { 
		this.ready = true;
		that.setDirtyCanvas(true);
	}
	return img;
}

//safe LGraphNode action execution (not sure if safe)
LGraphNode.prototype.executeAction = function(action)
{
	if(action == "") return false;

	if( action.indexOf(";") != -1 || action.indexOf("}") != -1)
	{
		this.trace("Error: Action contains unsafe characters");
		return false;
	}

	var tokens = action.split("(");
	var func_name = tokens[0];
	if( typeof(this[func_name]) != "function")
	{
		this.trace("Error: Action not found on node: " + func_name);
		return false;
	}

	var code = action;

	try
	{
		var _foo = eval;
		eval = null;
		(new Function("with(this) { " + code + "}")).call(this);
		eval = _foo;
	}
	catch (err)
	{
		this.trace("Error executing action {" + action + "} :" + err);
		return false;
	}

	return true;
}

/* Allows to get onMouseMove and onMouseUp events even if the mouse is out of focus */
LGraphNode.prototype.captureInput = function(v)
{
	if(!this.graph || !this.graph.canvas)
		return;

	//releasing somebody elses capture?!
	if(!v && this.graph.canvas.node_capturing_input != this)
		return;

	//change
	this.graph.canvas.node_capturing_input = v ? this : null;
	if(this.graph.debug)
		console.log(this.name + ": Capturing input " + (v?"ON":"OFF"));
}

/* Collapse the node */
LGraphNode.prototype.collapse = function()
{
	if(!this.flags.collapsed)
		this.flags.collapsed = true;
	else
		this.flags.collapsed = false;
	this.setDirtyCanvas(true,true);
}

/* Forces the node to do not move or realign on Z */
LGraphNode.prototype.pin = function()
{
	if(!this.flags.pinned)
		this.flags.pinned = true;
	else
		this.flags.pinned = false;
}

LGraphNode.prototype.localToScreen = function(x,y)
{
	return [(x + this.pos[0]) * this.graph.config.canvas_scale + this.graph.config.canvas_offset[0],
		(y + this.pos[1]) * this.graph.config.canvas_scale + this.graph.config.canvas_offset[1]];
}



//*********************************************************************************
// LGraphCanvas: LGraph renderer CLASS                                  
//*********************************************************************************

function LGraphCanvas(canvas, graph)
{
	if(graph === undefined)
		throw ("No graph assigned");

	if( typeof(window) != "undefined" )
	{
		window.requestAnimFrame = (function(){
		  return  window.requestAnimationFrame       ||
				  window.webkitRequestAnimationFrame ||
				  window.mozRequestAnimationFrame    ||
				  function( callback ){
					window.setTimeout(callback, 1000 / 60);
				  };
		})();
	}

	//link canvas and graph
	this.graph = graph;
	if(graph)
		graph.canvas = this;

	this.setCanvas(canvas);
	this.clear();

	this.startRendering();
}

LGraphCanvas.link_type_colors = {'number':"#AAC",'node':"#DCA"};
LGraphCanvas.link_width = 2;

LGraphCanvas.prototype.clear = function()
{
	this.frame = 0;
	this.last_draw_time = 0;
	this.render_time = 0;
	this.fps = 0;

	this.selected_nodes = {};
	this.node_dragged = null;
	this.node_over = null;
	this.node_capturing_input = null;
	this.connecting_node = null;

	this.highquality_render = true;
	this.pause_rendering = false;
	this.render_shadows = true;
	this.dirty_canvas = true;
	this.dirty_bgcanvas = true;
	this.dirty_area = null;

	this.render_only_selected = true;
	this.live_mode = false;
	this.show_info = true;
	this.allow_dragcanvas = true;
	this.allow_dragnodes = true;

	this.node_in_panel = null;

	this.last_mouse = [0,0];
	this.last_mouseclick = 0;

	if(this.onClear) this.onClear();
	//this.UIinit();
}

LGraphCanvas.prototype.setGraph = function(graph)
{
	if(this.graph == graph) return;

	this.clear();
	if(this.graph)
		this.graph.canvas = null; //remove old graph link to the canvas
	this.graph = graph;
	if(this.graph)
		this.graph.canvas = this;
	this.setDirty(true,true);
}

LGraphCanvas.prototype.resize = function(width, height)
{
	if(this.canvas.width == width && this.canvas.height == height)
		return;

	this.canvas.width = width;
	this.canvas.height = height;
	this.bgcanvas.width = this.canvas.width;
	this.bgcanvas.height = this.canvas.height;
	this.setDirty(true,true);
}


LGraphCanvas.prototype.setCanvas = function(canvas)
{
	var that = this;

	//Canvas association
	if(typeof(canvas) == "string")
		canvas = document.getElementById(canvas);

	if(canvas == null)
		throw("Error creating LiteGraph canvas: Canvas not found");
	if(canvas == this.canvas) return;

	this.canvas = canvas;
	//this.canvas.tabindex = "1000";
	this.canvas.className += " lgraphcanvas";
	this.canvas.data = this;

	//bg canvas: used for non changing stuff
	this.bgcanvas = null;
	if(!this.bgcanvas)
	{
		this.bgcanvas = document.createElement("canvas");
		this.bgcanvas.width = this.canvas.width;
		this.bgcanvas.height = this.canvas.height;
	}

	if(this.canvas.getContext == null)
	{
		throw("This browser doesnt support Canvas");
	}

	this.ctx = this.canvas.getContext("2d");
	this.bgctx = this.bgcanvas.getContext("2d");

	//input:  (move and up could be unbinded)
	this._mousemove_callback = this.processMouseMove.bind(this);
	this._mouseup_callback = this.processMouseUp.bind(this);

	this.canvas.addEventListener("mousedown", this.processMouseDown.bind(this) ); //down do not need to store the binded
	this.canvas.addEventListener("mousemove", this._mousemove_callback);

	this.canvas.addEventListener("contextmenu", function(e) { e.preventDefault(); return false; });
	

	this.canvas.addEventListener("mousewheel", this.processMouseWheel.bind(this), false);
	this.canvas.addEventListener("DOMMouseScroll", this.processMouseWheel.bind(this), false);

	//touch events
	//if( 'touchstart' in document.documentElement )
	{
		//alert("doo");
		this.canvas.addEventListener("touchstart", this.touchHandler, true);
		this.canvas.addEventListener("touchmove", this.touchHandler, true);
		this.canvas.addEventListener("touchend", this.touchHandler, true);
		this.canvas.addEventListener("touchcancel", this.touchHandler, true);    
	}

	//this.canvas.onselectstart = function () { return false; };
	this.canvas.addEventListener("keydown", function(e) { 
		that.processKeyDown(e); 
	});

	this.canvas.addEventListener("keyup", function(e) { 
		that.processKeyUp(e); 
	});
}

/*
LGraphCanvas.prototype.UIinit = function()
{
	var that = this;
	$("#node-console input").change(function(e)
	{
		if(e.target.value == "")
			return;

		var node = that.node_in_panel;
		if(!node)
			return;
			
		node.trace("] " + e.target.value, "#333");
		if(node.onConsoleCommand)
		{
			if(!node.onConsoleCommand(e.target.value))
				node.trace("command not found", "#A33");
		}
		else if (e.target.value == "info")
		{
			node.trace("Special methods:");
			for(var i in node)
			{
				if(typeof(node[i]) == "function" && LGraphNode.prototype[i] == null && i.substr(0,2) != "on" && i[0] != "_")
					node.trace(" + " + i);
			}
		}
		else
		{
			try
			{
				eval("var _foo = function() { return ("+e.target.value+"); }");
				var result = _foo.call(node);
				if(result)
					node.trace(result.toString());
				delete window._foo;
			}
			catch(err)
			{
				node.trace("error: " + err, "#A33");
			}
		}
		
		this.value = "";
	});
}
*/

LGraphCanvas.prototype.setDirty = function(fgcanvas,bgcanvas)
{
	if(fgcanvas)
		this.dirty_canvas = true;
	if(bgcanvas)
		this.dirty_bgcanvas = true;
}

LGraphCanvas.prototype.startRendering = function()
{
	if(this.is_rendering) return; //already rendering

	this.is_rendering = true;
	renderFrame.call(this);

	function renderFrame()
	{
		if(!this.pause_rendering)
			this.draw();

		if(this.is_rendering)
			window.requestAnimFrame( renderFrame.bind(this) );
	}


	/*
	this.rendering_timer_id = setInterval( function() { 
		//trace("Frame: " + new Date().getTime() );
		that.draw(); 
	}, 1000/50);
	*/
}

LGraphCanvas.prototype.stopRendering = function()
{
	this.is_rendering = false;
	/*
	if(this.rendering_timer_id)
	{
		clearInterval(this.rendering_timer_id);
		this.rendering_timer_id = null;
	}
	*/
}

/* LiteGraphCanvas input */

LGraphCanvas.prototype.processMouseDown = function(e)
{
	if(!this.graph) return;

	this.adjustMouseEvent(e);
	
	this.canvas.removeEventListener("mousemove", this._mousemove_callback );
	document.addEventListener("mousemove", this._mousemove_callback );
	document.addEventListener("mouseup", this._mouseup_callback );

	var n = this.graph.getNodeOnPos(e.canvasX, e.canvasY, this.visible_nodes);
	var skip_dragging = false;

	if(e.which == 1) //left button mouse
	{
		//another node selected
		if(!e.shiftKey) //REFACTOR: integrate with function
		{
			var todeselect = [];
			for(var i in this.selected_nodes)
				if (this.selected_nodes[i] != n)
						todeselect.push(this.selected_nodes[i]);
			//two passes to avoid problems modifying the container
			for(var i in todeselect)
				this.processNodeDeselected(todeselect[i]);
		}
		var clicking_canvas_bg = false;

		//when clicked on top of a node
		//and it is not interactive
		if(n) 
		{
			if(!this.live_mode && !n.flags.pinned)
				this.bringToFront(n); //if it wasnt selected?
			var skip_action = false;

			//not dragging mouse to connect two slots
			if(!this.connecting_node && !n.flags.collapsed && !this.live_mode)
			{
				//search for outputs
				if(n.outputs)
					for(var i = 0, l = n.outputs.length; i < l; ++i)
					{
						var output = n.outputs[i];
						var link_pos = n.getConnectionPos(false,i);
						if( isInsideRectangle(e.canvasX, e.canvasY, link_pos[0] - 10, link_pos[1] - 5, 20,10) )
						{
							this.connecting_node = n;
							this.connecting_output = output;
							this.connecting_pos = n.getConnectionPos(false,i);
							this.connecting_slot = i;

							skip_action = true;
							break;
						}
					}

				//search for inputs
				if(n.inputs)
					for(var i = 0, l = n.inputs.length; i < l; ++i)
					{
						var input = n.inputs[i];
						var link_pos = n.getConnectionPos(true,i);
						if( isInsideRectangle(e.canvasX, e.canvasY, link_pos[0] - 10, link_pos[1] - 5, 20,10) )
						{
							if(input.link)
							{
								n.disconnectInput(i);
								this.dirty_bgcanvas = true;
								skip_action = true;
							}
						}
					}

				//Search for corner
				if( !skip_action && isInsideRectangle(e.canvasX, e.canvasY, n.pos[0] + n.size[0] - 5, n.pos[1] + n.size[1] - 5 ,5,5 ))
				{
					this.resizing_node = n;
					this.canvas.style.cursor = "se-resize";
					skip_action = true;
				}
			}

			//it wasnt clicked on the links boxes
			if(!skip_action) 
			{
				var block_drag_node = false;

				//double clicking
				var now = new Date().getTime();
				if ((now - this.last_mouseclick) < 300 && this.selected_nodes[n.id])
				{
					//double click node
					if( n.onDblClick)
						n.onDblClick(e);
					this.processNodeDblClicked(n);
					block_drag_node = true;
				}

				//if do not capture mouse

				if( n.onMouseDown && n.onMouseDown(e) )
					block_drag_node = true;
				else if(this.live_mode)
				{
					clicking_canvas_bg = true;
					block_drag_node = true;
				}
				
				if(!block_drag_node)
				{
					if(this.allow_dragnodes)
						this.node_dragged = n;

					if(!this.selected_nodes[n.id])
						this.processNodeSelected(n,e);
				}

				this.dirty_canvas = true;
			}
		}
		else
			clicking_canvas_bg = true;

		if(clicking_canvas_bg && this.allow_dragcanvas)
		{
			this.dragging_canvas = true;
		}
	}
	else if (e.which == 2) //middle button
	{

	}
	else if (e.which == 3) //right button
	{
		this.processContextualMenu(n,e);
	}

	//TODO
	//if(this.node_selected != prev_selected)
	//	this.onNodeSelectionChange(this.node_selected);

	this.last_mouse[0] = e.localX;
	this.last_mouse[1] = e.localY;
	this.last_mouseclick = new Date().getTime();
	this.canvas_mouse = [e.canvasX, e.canvasY];

	/*
	if( (this.dirty_canvas || this.dirty_bgcanvas) && this.rendering_timer_id == null) 
		this.draw();
	*/

	this.graph.change();

	//this is to ensure to defocus(blur) if a text input element is on focus
	if(!document.activeElement || (document.activeElement.nodeName.toLowerCase() != "input" && document.activeElement.nodeName.toLowerCase() != "textarea"))
		e.preventDefault();
	e.stopPropagation();
	return false;
}

LGraphCanvas.prototype.processMouseMove = function(e)
{
	if(!this.graph) return;

	this.adjustMouseEvent(e);
	var mouse = [e.localX, e.localY];
	var delta = [mouse[0] - this.last_mouse[0], mouse[1] - this.last_mouse[1]];
	this.last_mouse = mouse;
	this.canvas_mouse = [e.canvasX, e.canvasY];

	if(this.dragging_canvas)
	{
		this.graph.config.canvas_offset[0] += delta[0] / this.graph.config.canvas_scale;
		this.graph.config.canvas_offset[1] += delta[1] / this.graph.config.canvas_scale;
		this.dirty_canvas = true;
		this.dirty_bgcanvas = true;
	}
	else
	{
		if(this.connecting_node)
			this.dirty_canvas = true;

		//get node over
		var n = this.graph.getNodeOnPos(e.canvasX, e.canvasY, this.visible_nodes);

		//remove mouseover flag
		for(var i in this.graph._nodes)
		{
			if(this.graph._nodes[i].mouseOver && n != this.graph._nodes[i])
			{
				//mouse leave
				this.graph._nodes[i].mouseOver = false;
				if(this.node_over && this.node_over.onMouseLeave)
					this.node_over.onMouseLeave(e);
				this.node_over = null;
				this.dirty_canvas = true;
			}
		}

		//mouse over a node
		if(n)
		{
			//this.canvas.style.cursor = "move";
			if(!n.mouseOver)
			{
				//mouse enter
				n.mouseOver = true;
				this.node_over = n;
				this.dirty_canvas = true;

				if(n.onMouseEnter) n.onMouseEnter(e);
			}

			if(n.onMouseMove) n.onMouseMove(e);

			//ontop of input
			if(this.connecting_node)
			{
				var pos = this._highlight_input || [0,0];
				var slot = this.isOverNodeInput(n, e.canvasX, e.canvasY, pos);
				if(slot != -1 && n.inputs[slot])
				{	
					var slot_type = n.inputs[slot].type;
					if(slot_type == this.connecting_output.type || slot_type == "*" || this.connecting_output.type == "*")
						this._highlight_input = pos;
				}
				else
					this._highlight_input = null;
			}

			//Search for corner
			if( isInsideRectangle(e.canvasX, e.canvasY, n.pos[0] + n.size[0] - 5, n.pos[1] + n.size[1] - 5 ,5,5 ))
				this.canvas.style.cursor = "se-resize";
			else
				this.canvas.style.cursor = null;
		}
		else
			this.canvas.style.cursor = null;

		if(this.node_capturing_input && this.node_capturing_input != n && this.node_capturing_input.onMouseMove)
		{
			this.node_capturing_input.onMouseMove(e);
		}


		if(this.node_dragged && !this.live_mode)
		{
			/*
			this.node_dragged.pos[0] += delta[0] / this.graph.config.canvas_scale;
			this.node_dragged.pos[1] += delta[1] / this.graph.config.canvas_scale;
			this.node_dragged.pos[0] = Math.round(this.node_dragged.pos[0]);
			this.node_dragged.pos[1] = Math.round(this.node_dragged.pos[1]);
			*/
			
			for(var i in this.selected_nodes)
			{
				var n = this.selected_nodes[i];
				
				n.pos[0] += delta[0] / this.graph.config.canvas_scale;
				n.pos[1] += delta[1] / this.graph.config.canvas_scale;
				n.pos[0] = Math.round(n.pos[0]);
				n.pos[1] = Math.round(n.pos[1]);
			}
			
			this.dirty_canvas = true;
			this.dirty_bgcanvas = true;
		}

		if(this.resizing_node && !this.live_mode)
		{
			this.resizing_node.size[0] += delta[0] / this.graph.config.canvas_scale;
			this.resizing_node.size[1] += delta[1] / this.graph.config.canvas_scale;
			var max_slots = Math.max( this.resizing_node.inputs ? this.resizing_node.inputs.length : 0, this.resizing_node.outputs ? this.resizing_node.outputs.length : 0);
			if(this.resizing_node.size[1] < max_slots * LiteGraph.NODE_SLOT_HEIGHT + 4)
				this.resizing_node.size[1] = max_slots * LiteGraph.NODE_SLOT_HEIGHT + 4;
			if(this.resizing_node.size[0] < LiteGraph.NODE_MIN_WIDTH)
				this.resizing_node.size[0] = LiteGraph.NODE_MIN_WIDTH;

			this.canvas.style.cursor = "se-resize";
			this.dirty_canvas = true;
			this.dirty_bgcanvas = true;
		}
	}

	/*
	if((this.dirty_canvas || this.dirty_bgcanvas) && this.rendering_timer_id == null) 
		this.draw();
	*/

	e.preventDefault();
	e.stopPropagation();
	return false;
	//this is not really optimal
	//this.graph.change();
}

LGraphCanvas.prototype.processMouseUp = function(e)
{
	if(!this.graph) return;

	document.removeEventListener("mousemove", this._mousemove_callback, true );
	this.canvas.addEventListener("mousemove", this._mousemove_callback, true);
	document.removeEventListener("mouseup", this._mouseup_callback, true );

	this.adjustMouseEvent(e);

	if (e.which == 1) //left button
	{
		//dragging a connection
		if(this.connecting_node)
		{
			this.dirty_canvas = true;
			this.dirty_bgcanvas = true;

			var node = this.graph.getNodeOnPos(e.canvasX, e.canvasY, this.visible_nodes);

			//node below mouse
			if(node)
			{
			
				if(this.connecting_output.type == 'node')
				{
					this.connecting_node.connect(this.connecting_slot, node, -1);
				}
				else
				{
					//slot below mouse? connect
					var slot = this.isOverNodeInput(node, e.canvasX, e.canvasY);
					if(slot != -1)
					{
						this.connecting_node.connect(this.connecting_slot, node, slot);
					}
				}
			}

			this.connecting_output = null;
			this.connecting_pos = null;
			this.connecting_node = null;
			this.connecting_slot = -1;

		}//not dragging connection
		else if(this.resizing_node)
		{
			this.dirty_canvas = true;
			this.dirty_bgcanvas = true;
			this.resizing_node = null;
		}
		else if(this.node_dragged) //node being dragged?
		{
			this.dirty_canvas = true;
			this.dirty_bgcanvas = true;

			if(this.graph.config.align_to_grid)
				this.node_dragged.alignToGrid();
			this.node_dragged = null;
		}
		else //no node being dragged
		{
			this.dirty_canvas = true;
			this.dragging_canvas = false;

			if( this.node_over && this.node_over.onMouseUp )
				this.node_over.onMouseUp(e);
			if( this.node_capturing_input && this.node_capturing_input.onMouseUp )
				this.node_capturing_input.onMouseUp(e);
		}
	}
	else if (e.which == 2) //middle button
	{
		//trace("middle");
		this.dirty_canvas = true;
		this.dragging_canvas = false;
	}
	else if (e.which == 3) //right button
	{
		//trace("right");
		this.dirty_canvas = true;
		this.dragging_canvas = false;
	}

	/*
	if((this.dirty_canvas || this.dirty_bgcanvas) && this.rendering_timer_id == null)
		this.draw();
	*/

	this.graph.change();

	e.stopPropagation();
	e.preventDefault();
	return false;
}

LGraphCanvas.prototype.isOverNodeInput = function(node, canvasx, canvasy, slot_pos)
{
	if(node.inputs)
		for(var i = 0, l = node.inputs.length; i < l; ++i)
		{
			var input = node.inputs[i];
			var link_pos = node.getConnectionPos(true,i);
			if( isInsideRectangle(canvasx, canvasy, link_pos[0] - 10, link_pos[1] - 5, 20,10) )
			{
				if(slot_pos) { slot_pos[0] = link_pos[0]; slot_pos[1] = link_pos[1] };
				return i;
			}
		}
	return -1;
}

LGraphCanvas.prototype.processKeyDown = function(e) 
{
	if(!this.graph) return;
	var block_default = false;

	//select all Control A
	if(e.keyCode == 65 && e.ctrlKey)
	{
		this.selectAllNodes();
		block_default = true;
	}

	//delete or backspace
	if(e.keyCode == 46 || e.keyCode == 8)
	{
		this.deleteSelectedNodes();
	}

	//collapse
	//...

	//TODO
	if(this.selected_nodes) 
		for (var i in this.selected_nodes)
			if(this.selected_nodes[i].onKeyDown)
				this.selected_nodes[i].onKeyDown(e);

	this.graph.change();

	if(block_default)
	{
		e.preventDefault();
		return false;
	}
}

LGraphCanvas.prototype.processKeyUp = function(e) 
{
	if(!this.graph) return;
	//TODO
	if(this.selected_nodes)
		for (var i in this.selected_nodes)
			if(this.selected_nodes[i].onKeyUp)
				this.selected_nodes[i].onKeyUp(e);

	this.graph.change();
}

LGraphCanvas.prototype.processMouseWheel = function(e) 
{
	if(!this.graph) return;
	if(!this.allow_dragcanvas) return;

	var delta = (e.wheelDeltaY != null ? e.wheelDeltaY : e.detail * -60);

	this.adjustMouseEvent(e);

	var zoom = this.graph.config.canvas_scale;

	if (delta > 0)
		zoom *= 1.1;
	else if (delta < 0)
		zoom *= 1/(1.1);

	this.setZoom( zoom, [ e.localX, e.localY ] );

	/*
	if(this.rendering_timer_id == null)
		this.draw();
	*/

	this.graph.change();

	e.preventDefault();
	return false; // prevent default
}

LGraphCanvas.prototype.processNodeSelected = function(n,e)
{
	n.selected = true;
	if (n.onSelected)
		n.onSelected();
		
	if(e && e.shiftKey) //add to selection
		this.selected_nodes[n.id] = n;
	else
	{
		this.selected_nodes = {};
		this.selected_nodes[ n.id ] = n;
	}
		
	this.dirty_canvas = true;

	if(this.onNodeSelected)
		this.onNodeSelected(n);

	//if(this.node_in_panel) this.showNodePanel(n);
}

LGraphCanvas.prototype.processNodeDeselected = function(n)
{
	n.selected = false;
	if(n.onDeselected)
		n.onDeselected();
		
	delete this.selected_nodes[n.id];

	if(this.onNodeDeselected)
		this.onNodeDeselected();

	this.dirty_canvas = true;

	//this.showNodePanel(null);
}

LGraphCanvas.prototype.processNodeDblClicked = function(n)
{
	if(this.onShowNodePanel)
		this.onShowNodePanel(n);

	if(this.onNodeDblClicked)
		this.onNodeDblClicked(n);

	this.setDirty(true);
}

LGraphCanvas.prototype.selectNode = function(node)
{
	this.deselectAllNodes();

	if(!node)
		return;

	if(!node.selected && node.onSelected)
		node.onSelected();
	node.selected = true;
	this.selected_nodes[ node.id ] = node;
	this.setDirty(true);
}

LGraphCanvas.prototype.selectAllNodes = function()
{
	for(var i in this.graph._nodes)
	{
		var n = this.graph._nodes[i];
		if(!n.selected && n.onSelected)
			n.onSelected();
		n.selected = true;
		this.selected_nodes[this.graph._nodes[i].id] = n;
	}

	this.setDirty(true);
}

LGraphCanvas.prototype.deselectAllNodes = function()
{
	for(var i in this.selected_nodes)
	{
		var n = this.selected_nodes;
		if(n.onDeselected)
			n.onDeselected();
		n.selected = false;
	}
	this.selected_nodes = {};
	this.setDirty(true);
}

LGraphCanvas.prototype.deleteSelectedNodes = function()
{
	for(var i in this.selected_nodes)
	{
		var m = this.selected_nodes[i];
		//if(m == this.node_in_panel) this.showNodePanel(null);
		this.graph.remove(m);
	}
	this.selected_nodes = {};
	this.setDirty(true);
}

LGraphCanvas.prototype.centerOnNode = function(node)
{
	this.graph.config.canvas_offset[0] = -node.pos[0] - node.size[0] * 0.5 + (this.canvas.width * 0.5 / this.graph.config.canvas_scale);
	this.graph.config.canvas_offset[1] = -node.pos[1] - node.size[1] * 0.5 + (this.canvas.height * 0.5 / this.graph.config.canvas_scale);
	this.setDirty(true,true);
}

LGraphCanvas.prototype.adjustMouseEvent = function(e)
{
	var b = this.canvas.getBoundingClientRect();
	e.localX = e.pageX - b.left;
	e.localY = e.pageY - b.top;

	e.canvasX = e.localX / this.graph.config.canvas_scale - this.graph.config.canvas_offset[0];
	e.canvasY = e.localY / this.graph.config.canvas_scale - this.graph.config.canvas_offset[1];
}

LGraphCanvas.prototype.setZoom = function(value, zooming_center)
{
	if(!zooming_center)
		zooming_center = [this.canvas.width * 0.5,this.canvas.height * 0.5];

	var center = this.convertOffsetToCanvas( zooming_center );

	this.graph.config.canvas_scale = value;

	if(this.graph.config.canvas_scale > 4)
		this.graph.config.canvas_scale = 4;
	else if(this.graph.config.canvas_scale < 0.1)
		this.graph.config.canvas_scale = 0.1;
	
	var new_center = this.convertOffsetToCanvas( zooming_center );
	var delta_offset = [new_center[0] - center[0], new_center[1] - center[1]];

	this.graph.config.canvas_offset[0] += delta_offset[0];
	this.graph.config.canvas_offset[1] += delta_offset[1];

	this.dirty_canvas = true;
	this.dirty_bgcanvas = true;
}

LGraphCanvas.prototype.convertOffsetToCanvas = function(pos)
{
	return [pos[0] / this.graph.config.canvas_scale - this.graph.config.canvas_offset[0], pos[1] / this.graph.config.canvas_scale - this.graph.config.canvas_offset[1]];
}

LGraphCanvas.prototype.convertCanvasToOffset = function(pos)
{
	return [(pos[0] + this.graph.config.canvas_offset[0]) * this.graph.config.canvas_scale, 
		(pos[1] + this.graph.config.canvas_offset[1]) * this.graph.config.canvas_scale ];
}

LGraphCanvas.prototype.convertEventToCanvas = function(e)
{
	var rect = this.canvas.getClientRects()[0];
	return this.convertOffsetToCanvas([e.pageX - rect.left,e.pageY - rect.top]);
}

LGraphCanvas.prototype.bringToFront = function(n)
{
	var i = this.graph._nodes.indexOf(n);
	if(i == -1) return;
	
	this.graph._nodes.splice(i,1);
	this.graph._nodes.push(n);
}

LGraphCanvas.prototype.sendToBack = function(n)
{
	var i = this.graph._nodes.indexOf(n);
	if(i == -1) return;
	
	this.graph._nodes.splice(i,1);
	this.graph._nodes.unshift(n);
}
	
/* Interaction */



/* LGraphCanvas render */

LGraphCanvas.prototype.computeVisibleNodes = function()
{
	var visible_nodes = [];
	for (var i in this.graph._nodes)
	{
		var n = this.graph._nodes[i];

		//skip rendering nodes in live mode
		if(this.live_mode && !n.onDrawBackground && !n.onDrawForeground)
			continue;

		if(!overlapBounding(this.visible_area, n.getBounding() ))
			continue; //out of the visible area

		visible_nodes.push(n);
	}
	return visible_nodes;
}

LGraphCanvas.prototype.draw = function(force_canvas, force_bgcanvas)
{
	//fps counting
	var now = new Date().getTime();
	this.render_time = (now - this.last_draw_time)*0.001;
	this.last_draw_time = now;

	if(this.graph)
	{
		var start = [-this.graph.config.canvas_offset[0], -this.graph.config.canvas_offset[1] ];
		var end = [start[0] + this.canvas.width / this.graph.config.canvas_scale, start[1] + this.canvas.height / this.graph.config.canvas_scale];
		this.visible_area = new Float32Array([start[0],start[1],end[0],end[1]]);
	}

	if(this.dirty_bgcanvas || force_bgcanvas)
		this.drawBgcanvas();

	if(this.dirty_canvas || force_canvas)
		this.drawFrontCanvas();

	this.fps = this.render_time ? (1.0 / this.render_time) : 0;
	this.frame += 1;
}

LGraphCanvas.prototype.drawFrontCanvas = function()
{
	var ctx = this.ctx;
	var canvas = this.canvas;

	//reset in case of error
	ctx.restore();
	ctx.setTransform(1, 0, 0, 1, 0, 0);

	//clip dirty area if there is one, otherwise work in full canvas
	if(this.dirty_area)
	{
		ctx.save();
		ctx.beginPath();
		ctx.rect(this.dirty_area[0],this.dirty_area[1],this.dirty_area[2],this.dirty_area[3]);
		ctx.clip();
	}

	//clear
	//canvas.width = canvas.width;
	ctx.clearRect(0,0,canvas.width, canvas.height);

	//draw bg canvas
	ctx.drawImage(this.bgcanvas,0,0);

	//info widget
	if(this.show_info)
	{
		ctx.font = "10px Arial";
		ctx.fillStyle = "#888";
		if(this.graph)
		{
			ctx.fillText( "T: " + this.graph.globaltime.toFixed(2)+"s",5,13*1 );
			ctx.fillText( "I: " + this.graph.iteration,5,13*2 );
			ctx.fillText( "F: " + this.frame,5,13*3 );
			ctx.fillText( "FPS:" + this.fps.toFixed(2),5,13*4 );
		}
		else
			ctx.fillText( "No graph selected",5,13*1 );
	}

	if(this.graph)
	{
		//apply transformations
		ctx.save();
		ctx.scale(this.graph.config.canvas_scale,this.graph.config.canvas_scale);
		ctx.translate(this.graph.config.canvas_offset[0],this.graph.config.canvas_offset[1]);

		//draw nodes
		var drawn_nodes = 0;
		var visible_nodes = this.computeVisibleNodes();
		this.visible_nodes = visible_nodes;

		for (var i in visible_nodes)
		{
			var node = visible_nodes[i];

			//transform coords system
			ctx.save();
			ctx.translate( node.pos[0], node.pos[1] );

			//Draw
			this.drawNode(node, ctx );
			drawn_nodes += 1;

			//Restore
			ctx.restore();
		}
		
		//connections ontop?
		if(this.graph.config.links_ontop)
			if(!this.live_mode)
				this.drawConnections(ctx);

		//current connection
		if(this.connecting_pos != null)
		{
			ctx.lineWidth = LGraphCanvas.link_width;
			ctx.fillStyle = this.connecting_output.type == 'node' ? "#F85" : "#AFA";
			ctx.strokeStyle = ctx.fillStyle;
			this.renderLink(ctx, this.connecting_pos, [this.canvas_mouse[0],this.canvas_mouse[1]] );

			ctx.beginPath();
			ctx.arc( this.connecting_pos[0], this.connecting_pos[1],4,0,Math.PI*2);
			/*
			if( this.connecting_output.round)
				ctx.arc( this.connecting_pos[0], this.connecting_pos[1],4,0,Math.PI*2);
			else
				ctx.rect( this.connecting_pos[0], this.connecting_pos[1],12,6);
			*/
			ctx.fill();

			ctx.fillStyle = "#ffcc00";
			if(this._highlight_input)
			{
				ctx.beginPath();
				ctx.arc( this._highlight_input[0], this._highlight_input[1],6,0,Math.PI*2);
				ctx.fill();
			}
		}
		ctx.restore();
	}

	if(this.dirty_area)
	{
		ctx.restore();
		//this.dirty_area = null;
	}

	this.dirty_canvas = false;
}

LGraphCanvas.prototype.drawBgcanvas = function()
{
	var canvas = this.bgcanvas;
	var ctx = this.bgctx;


	//clear
	canvas.width = canvas.width;

	//reset in case of error
	ctx.restore();
	ctx.setTransform(1, 0, 0, 1, 0, 0);

	if(this.graph)
	{
		//apply transformations
		ctx.save();
		ctx.scale(this.graph.config.canvas_scale,this.graph.config.canvas_scale);
		ctx.translate(this.graph.config.canvas_offset[0],this.graph.config.canvas_offset[1]);

		//render BG
		if(this.background_image && this.graph.config.canvas_scale > 0.5)
		{
			ctx.globalAlpha = 1.0 - 0.5 / this.graph.config.canvas_scale;
			ctx.webkitImageSmoothingEnabled = ctx.mozImageSmoothingEnabled = ctx.imageSmoothingEnabled = false
			if(!this._bg_img || this._bg_img.name != this.background_image)
			{
				this._bg_img = new Image();
				this._bg_img.name = this.background_image; 
				this._bg_img.src = this.background_image;
				var that = this;
				this._bg_img.onload = function() { 
					that.draw(true,true);
				}
			}

			var pattern = null;
			if(this._bg_img != this._pattern_img && this._bg_img.width > 0)
			{
				pattern = ctx.createPattern( this._bg_img, 'repeat' );
				this._pattern_img = this._bg_img;
				this._pattern = pattern;
			}
			else
				pattern = this._pattern;
			if(pattern)
			{
				ctx.fillStyle = pattern;
				ctx.fillRect(this.visible_area[0],this.visible_area[1],this.visible_area[2]-this.visible_area[0],this.visible_area[3]-this.visible_area[1]);
				ctx.fillStyle = "transparent";
			}

			ctx.globalAlpha = 1.0;
		}

		//DEBUG: show clipping area
		//ctx.fillStyle = "red";
		//ctx.fillRect( this.visible_area[0] + 10, this.visible_area[1] + 10, this.visible_area[2] - this.visible_area[0] - 20, this.visible_area[3] - this.visible_area[1] - 20);

		//bg
		ctx.strokeStyle = "#235";
		ctx.strokeRect(0,0,canvas.width,canvas.height);

		/*
		if(this.render_shadows)
		{
			ctx.shadowColor = "#000";
			ctx.shadowOffsetX = 0;
			ctx.shadowOffsetY = 0;
			ctx.shadowBlur = 6;
		}
		else
			ctx.shadowColor = "rgba(0,0,0,0)";
		*/

		//draw connections
		if(!this.live_mode)
			this.drawConnections(ctx);

		//restore state
		ctx.restore();
	}

	this.dirty_bgcanvas = false;
	this.dirty_canvas = true; //to force to repaint the front canvas with the bgcanvas 
}

/* Renders the LGraphNode on the canvas */
LGraphCanvas.prototype.drawNode = function(node, ctx )
{
	var glow = false;

	var color = node.color || LiteGraph.NODE_DEFAULT_COLOR;
	//if (this.selected) color = "#88F";

	var render_title = true;
	if(node.flags.skip_title_render || node.graph.isLive())
		render_title = false;
	if(node.mouseOver)
		render_title = true;

	//shadow and glow
	if (node.mouseOver) glow = true;
	
	if(node.selected)
	{
		/*
		ctx.shadowColor = "#EEEEFF";//glow ? "#AAF" : "#000";
		ctx.shadowOffsetX = 0;
		ctx.shadowOffsetY = 0;
		ctx.shadowBlur = 1;
		*/
	}
	else if(this.render_shadows)
	{
		ctx.shadowColor = "#111";
		ctx.shadowOffsetX = 2;
		ctx.shadowOffsetY = 2;
		ctx.shadowBlur = 4;
	}
	else
		ctx.shadowColor = "transparent";

	//only render if it forces it to do it
	if(this.live_mode)
	{
		if(!node.flags.collapsed)
		{
			ctx.shadowColor = "transparent";
			if(node.onDrawBackground)
				node.onDrawBackground(ctx);
			if(node.onDrawForeground)
				node.onDrawForeground(ctx);
		}

		return;
	}

	//draw in collapsed form
	/*
	if(node.flags.collapsed)
	{
		if(!node.onDrawCollapsed || node.onDrawCollapsed(ctx) == false)
			this.drawNodeCollapsed(node, ctx, color, node.bgcolor);
		return;
	}
	*/

	//clip if required (mask)
	var shape = node.shape || "box";
	var size = new Float32Array(node.size);
	if(node.flags.collapsed)
		size.set([LiteGraph.NODE_COLLAPSED_WIDTH, 0]);

	//Start cliping
	if(node.flags.clip_area)
	{
		ctx.save();
		if(shape == "box")
		{
			ctx.beginPath();
			ctx.rect(0,0,size[0], size[1]);
		}
		else if (shape == "round")
		{
			ctx.roundRect(0,0,size[0], size[1],10);
		}
		else if (shape == "circle")
		{
			ctx.beginPath();
			ctx.arc(size[0] * 0.5, size[1] * 0.5, size[0] * 0.5, 0, Math.PI*2);
		}
		ctx.clip();
	}

	//draw shape
	this.drawNodeShape(node, ctx, size, color, node.bgcolor, !render_title, node.selected );
	ctx.shadowColor = "transparent";

	//connection slots
	ctx.textAlign = "left";
	ctx.font = "12px Arial";

	var render_text = node.graph.config.canvas_scale > 0.6;

	//render inputs and outputs
	if(!node.flags.collapsed)
	{
		//input connection slots
		if(node.inputs)
			for(var i = 0; i < node.inputs.length; i++)
			{
				var slot = node.inputs[i];

				ctx.globalAlpha = 1.0;
				if (this.connecting_node != null && this.connecting_output.type != 0 && node.inputs[i].type != 0 && this.connecting_output.type != node.inputs[i].type)
					ctx.globalAlpha = 0.4;

				ctx.fillStyle = slot.link != null ? "#7F7" : "#AAA";

				var pos = node.getConnectionPos(true,i);
				pos[0] -= node.pos[0];
				pos[1] -= node.pos[1];

				ctx.beginPath();

				if (1 || slot.round)
					ctx.arc(pos[0],pos[1],4,0,Math.PI*2);
				//else
				//	ctx.rect((pos[0] - 6) + 0.5, (pos[1] - 5) + 0.5,14,10);

				ctx.fill();

				//render name
				if(render_text)
				{
					var text = slot.label != null ? slot.label : slot.name;
					if(text)
					{
						ctx.fillStyle = color; 
						ctx.fillText(text,pos[0] + 10,pos[1] + 5);
					}
				}
			}

		//output connection slots
		if(this.connecting_node)
			ctx.globalAlpha = 0.4;

		ctx.lineWidth = 1;

		ctx.textAlign = "right";
		ctx.strokeStyle = "black";
		if(node.outputs)
			for(var i = 0; i < node.outputs.length; i++)
			{
				var slot = node.outputs[i];

				var pos = node.getConnectionPos(false,i);
				pos[0] -= node.pos[0];
				pos[1] -= node.pos[1];

				ctx.fillStyle = slot.links && slot.links.length ? "#7F7" : "#AAA";
				ctx.beginPath();
				//ctx.rect( node.size[0] - 14,i*14,10,10);

				if (1 || slot.round)
					ctx.arc(pos[0],pos[1],4,0,Math.PI*2);
				//else
				//	ctx.rect((pos[0] - 6) + 0.5,(pos[1] - 5) + 0.5,14,10);

				//trigger
				//if(slot.node_id != null && slot.slot == -1)
				//	ctx.fillStyle = "#F85";

				//if(slot.links != null && slot.links.length)
				ctx.fill();
				ctx.stroke();

				//render output name
				if(render_text)
				{
					var text = slot.label != null ? slot.label : slot.name;
					if(text)
					{
						ctx.fillStyle = color;
						ctx.fillText(text, pos[0] - 10,pos[1] + 5);
					}
				}
			}

		ctx.textAlign = "left";
		ctx.globalAlpha = 1.0;

		if(node.onDrawForeground)
			node.onDrawForeground(ctx);
	}//!collapsed

	if(node.flags.clip_area)
		ctx.restore();
}

/* Renders the node shape */
LGraphCanvas.prototype.drawNodeShape = function(node, ctx, size, fgcolor, bgcolor, no_title, selected )
{
	//bg rect
	ctx.strokeStyle = fgcolor || LiteGraph.NODE_DEFAULT_COLOR;
	ctx.fillStyle = bgcolor || LiteGraph.NODE_DEFAULT_BGCOLOR;

	/* gradient test
	var grad = ctx.createLinearGradient(0,0,0,node.size[1]);
	grad.addColorStop(0, "#AAA");
	grad.addColorStop(0.5, fgcolor || LiteGraph.NODE_DEFAULT_COLOR);
	grad.addColorStop(1, bgcolor || LiteGraph.NODE_DEFAULT_BGCOLOR);
	ctx.fillStyle = grad;
	*/

	var title_height = LiteGraph.NODE_TITLE_HEIGHT;

	//render depending on shape
	var shape = node.shape || "box";
	if(shape == "box")
	{
		if(selected)
		{
			ctx.strokeStyle = "#CCC";
			ctx.strokeRect(-0.5,no_title ? -0.5 : -title_height + -0.5, size[0]+2, no_title ? (size[1]+2) : (size[1] + title_height+2) );
			ctx.strokeStyle = fgcolor;
		}

		ctx.beginPath();
		ctx.rect(0,no_title ? 0.5 : -title_height + 1,size[0]+1, no_title ? size[1] : size[1] + title_height);
	}
	else if (node.shape == "round")
	{
		ctx.roundRect(0,no_title ? 0 : -title_height,size[0], no_title ? size[1] : size[1] + title_height, 10);
	}
	else if (node.shape == "circle")
	{
		ctx.beginPath();
		ctx.arc(size[0] * 0.5, size[1] * 0.5, size[0] * 0.5, 0, Math.PI*2);
	}

	ctx.fill();
	ctx.shadowColor = "transparent";

	//ctx.stroke();

	//image
	if (node.bgImage && node.bgImage.width)
		ctx.drawImage( node.bgImage, (size[0] - node.bgImage.width) * 0.5 , (size[1] - node.bgImage.height) * 0.5);

	if(node.bgImageUrl && !node.bgImage)
		node.bgImage = node.loadImage(node.bgImageUrl);

	if(node.onDrawBackground)
		node.onDrawBackground(ctx);

	//title bg
	if(!no_title)
	{
		ctx.fillStyle = fgcolor || LiteGraph.NODE_DEFAULT_COLOR;

		if(shape == "box")
		{
			ctx.beginPath();
			ctx.fillRect(0,-title_height,size[0]+1,title_height);
			ctx.stroke();
		}
		else if (shape == "round")
		{
			ctx.roundRect(0,-title_height,size[0], title_height,10,0);
			//ctx.fillRect(0,8,size[0],NODE_TITLE_HEIGHT - 12);
			ctx.fill();
			ctx.stroke();
		}

		//box
		ctx.fillStyle = node.boxcolor || LiteGraph.NODE_DEFAULT_BOXCOLOR;
		ctx.beginPath();
		if (shape == "round")
			ctx.arc(title_height *0.5, title_height * -0.5, (title_height - 6) *0.5,0,Math.PI*2);
		else
			ctx.rect(3,-title_height + 3,title_height - 6,title_height - 6);
		ctx.fill();

		//title text
		ctx.font = "bold 12px Arial";
		if(node.name != "" && node.graph.config.canvas_scale > 0.8)
		{
			ctx.fillStyle = "#222";
			ctx.fillText(node.name,16,13-title_height );
		}
	}
}

/* Renders the node when collapsed */
LGraphCanvas.prototype.drawNodeCollapsed = function(node, ctx, fgcolor, bgcolor)
{
	//draw default collapsed shape
	ctx.strokeStyle = fgcolor || LiteGraph.NODE_DEFAULT_COLOR;
	ctx.fillStyle = bgcolor || LiteGraph.NODE_DEFAULT_BGCOLOR;

	var collapsed_radius = LiteGraph.NODE_COLLAPSED_RADIUS;

	//circle shape
	var shape = node.shape || "box";
	if(shape == "circle")
	{
		ctx.beginPath();
		ctx.arc(node.size[0] * 0.5, node.size[1] * 0.5, collapsed_radius,0,Math.PI * 2);
		ctx.fill();
		ctx.shadowColor = "rgba(0,0,0,0)";
		ctx.stroke();

		ctx.fillStyle = node.boxcolor || LiteGraph.NODE_DEFAULT_BOXCOLOR;
		ctx.beginPath();
		ctx.arc(node.size[0] * 0.5, node.size[1] * 0.5, collapsed_radius * 0.5,0,Math.PI * 2);
		ctx.fill();
	}
	else if(shape == "round") //rounded box
	{
		ctx.beginPath();
		ctx.roundRect(node.size[0] * 0.5 - collapsed_radius, node.size[1] * 0.5 - collapsed_radius, 2*collapsed_radius,2*collapsed_radius,5);
		ctx.fill();
		ctx.shadowColor = "rgba(0,0,0,0)";
		ctx.stroke();

		ctx.fillStyle = node.boxcolor || LiteGraph.NODE_DEFAULT_BOXCOLOR;
		ctx.beginPath();
		ctx.roundRect(node.size[0] * 0.5 - collapsed_radius*0.5, node.size[1] * 0.5 - collapsed_radius*0.5, collapsed_radius,collapsed_radius,2);
		ctx.fill();
	}
	else //flat box
	{
		ctx.beginPath();
		//ctx.rect(node.size[0] * 0.5 - collapsed_radius, node.size[1] * 0.5 - collapsed_radius, 2*collapsed_radius, 2*collapsed_radius);
		ctx.rect(0, 0, node.size[0], collapsed_radius * 2 );
		ctx.fill();
		ctx.shadowColor = "rgba(0,0,0,0)";
		ctx.stroke();

		ctx.fillStyle = node.boxcolor || LiteGraph.NODE_DEFAULT_BOXCOLOR;
		ctx.beginPath();
		//ctx.rect(node.size[0] * 0.5 - collapsed_radius*0.5, node.size[1] * 0.5 - collapsed_radius*0.5, collapsed_radius,collapsed_radius);
		ctx.rect(collapsed_radius*0.5, collapsed_radius*0.5, collapsed_radius, collapsed_radius);
		ctx.fill();
	}
}

LGraphCanvas.link_colors = ["#AAC","#ACA","#CAA"];

LGraphCanvas.prototype.drawConnections = function(ctx)
{
	//draw connections
	ctx.lineWidth = LGraphCanvas.link_width;

	ctx.fillStyle = "#AAA";
	ctx.strokeStyle = "#AAA";
	//for every node
	for (var n in this.graph._nodes)
	{
		var node = this.graph._nodes[n];
		//for every input (we render just inputs because it is easier as every slot can only have one input)
		if(node.inputs && node.inputs.length)
			for(var i in node.inputs)
			{
				var input = node.inputs[i];
				if(!input || !input.link ) continue;
				var link = input.link;

				var start_node = this.graph.getNodeById( link[1] );
				if(start_node == null) continue;
				var start_node_slot = link[2];
				var start_node_slotpos = null;

				if(start_node_slot == -1)
					start_node_slotpos = [start_node.pos[0] + 10, start_node.pos[1] + 10];
				else
					start_node_slotpos = start_node.getConnectionPos(false, start_node_slot);

				var color = LGraphCanvas.link_type_colors[node.inputs[i].type];
				if(color == null)
					color = LGraphCanvas.link_colors[node.id % LGraphCanvas.link_colors.length];
				ctx.fillStyle = ctx.strokeStyle = color;
				this.renderLink(ctx, start_node_slotpos, node.getConnectionPos(true,i) );
			}
	}
}

LGraphCanvas.prototype.renderLink = function(ctx,a,b)
{
	var curved_lines = true;
	
	if(!this.highquality_render)
	{
		ctx.beginPath();
		ctx.moveTo(a[0],a[1]);
		ctx.lineTo(b[0],b[1]);
		ctx.stroke();
		return;
	}

	var dist = distance(a,b);

	ctx.beginPath();
	
	if(curved_lines)
	{
		ctx.moveTo(a[0],a[1]);
		ctx.bezierCurveTo(a[0] + dist*0.25, a[1],
							b[0] - dist*0.25 , b[1],
							b[0] ,b[1] );
	}
	else
	{
		ctx.moveTo(a[0]+10,a[1]);
		ctx.lineTo(((a[0]+10) + (b[0]-10))*0.5,a[1]);
		ctx.lineTo(((a[0]+10) + (b[0]-10))*0.5,b[1]);
		ctx.lineTo(b[0]-10,b[1]);
	}
	ctx.stroke();

	//render arrow
	if(this.graph.config.canvas_scale > 0.6)
	{
		//get two points in the bezier curve
		var pos = this.computeConnectionPoint(a,b,0.5);
		var pos2 = this.computeConnectionPoint(a,b,0.51);
		var angle = 0;
		if(curved_lines)
			angle = -Math.atan2( pos2[0] - pos[0], pos2[1] - pos[1]);
		else
			angle = b[1] > a[1] ? 0 : Math.PI;

		ctx.save();
		ctx.translate(pos[0],pos[1]);
		ctx.rotate(angle);
		ctx.beginPath();
		ctx.moveTo(-5,-5);
		ctx.lineTo(0,+5);
		ctx.lineTo(+5,-5);
		ctx.fill();
		ctx.restore();
	}
}

LGraphCanvas.prototype.computeConnectionPoint = function(a,b,t)
{
	var dist = distance(a,b);
	var p0 = a;
	var p1 = [ a[0] + dist*0.25, a[1] ];
	var p2 = [ b[0] - dist*0.25, b[1] ];
	var p3 = b;

	var c1 = (1-t)*(1-t)*(1-t);
	var c2 = 3*((1-t)*(1-t))*t;
	var c3 = 3*(1-t)*(t*t);
	var c4 = t*t*t;

	var x = c1*p0[0] + c2*p1[0] + c3*p2[0] + c4*p3[0];
	var y = c1*p0[1] + c2*p1[1] + c3*p2[1] + c4*p3[1];
	return [x,y];
}

LGraphCanvas.prototype.resizeCanvas = function(width,height)
{
	this.canvas.width = width;
	if(height)
		this.canvas.height = height;

	this.bgcanvas.width = this.canvas.width;
	this.bgcanvas.height = this.canvas.height;
	this.draw(true,true);
}

LGraphCanvas.prototype.switchLiveMode = function()
{
	this.live_mode = !this.live_mode;
	this.dirty_canvas = true;
	this.dirty_bgcanvas = true;
}

LGraphCanvas.prototype.onNodeSelectionChange = function(node)
{
	return; //disabled
	//if(this.node_in_panel) this.showNodePanel(node);
}

LGraphCanvas.prototype.touchHandler = function(event)
{
	//alert("foo");
    var touches = event.changedTouches,
        first = touches[0],
        type = "";

         switch(event.type)
    {
        case "touchstart": type = "mousedown"; break;
        case "touchmove":  type="mousemove"; break;        
        case "touchend":   type="mouseup"; break;
        default: return;
    }

             //initMouseEvent(type, canBubble, cancelable, view, clickCount,
    //           screenX, screenY, clientX, clientY, ctrlKey,
    //           altKey, shiftKey, metaKey, button, relatedTarget);
    
    var simulatedEvent = document.createEvent("MouseEvent");
    simulatedEvent.initMouseEvent(type, true, true, window, 1,
                              first.screenX, first.screenY,
                              first.clientX, first.clientY, false,
                              false, false, false, 0/*left*/, null);
	first.target.dispatchEvent(simulatedEvent);
    event.preventDefault();
}

/* CONTEXT MENU ********************/

LGraphCanvas.onMenuAdd = function(node, e, prev_menu, canvas, first_event )
{
	var values = LiteGraph.getNodeTypesCategories();
	var entries = {};
	for(var i in values)
		if(values[i])
			entries[ i ] = { value: values[i], content: values[i]  , is_menu: true };

	var menu = LiteGraph.createContextualMenu(entries, {event: e, callback: inner_clicked, from: prev_menu});

	function inner_clicked(v, e)
	{
		var category = v.value;
		var node_types = LiteGraph.getNodeTypesInCategory(category);
		var values = [];
		for(var i in node_types)
			values.push( { content: node_types[i].title, value: node_types[i].type });

		LiteGraph.createContextualMenu(values, {event: e, callback: inner_create, from: menu});
		return false;
	}

	function inner_create(v, e)
	{
		var node = LiteGraph.createNode( v.value );
		if(node)
		{
			node.pos = canvas.convertEventToCanvas(first_event);
			canvas.graph.add( node );
		}
	}

	return false;
}

LGraphCanvas.onMenuCollapseAll = function()
{

}


LGraphCanvas.onMenuNodeEdit = function()
{

}

LGraphCanvas.onMenuNodeInputs = function(node, e, prev_menu)
{
	if(!node) return;

	var options = node.optional_inputs;
	if(node.onGetInputs)
		options = node.onGetInputs();
	if(options)
	{
		var entries = [];
		for (var i in options)
		{
			var option = options[i];
			var label = option[0];
			if(option[2] && option[2].label)
				label = option[2].label;
			entries.push({content: label, value: option});
		}
		var menu = LiteGraph.createContextualMenu(entries, {event: e, callback: inner_clicked, from: prev_menu});
	}

	function inner_clicked(v)
	{
		if(!node) return;
		node.addInput(v.value[0],v.value[1], v.value[2]);
	}

	return false;
}

LGraphCanvas.onMenuNodeOutputs = function(node, e, prev_menu)
{
	if(!node) return;

	var options = node.optional_outputs;
	if(node.onGetOutputs)
		options = node.onGetOutputs();
	if(options)
	{
		var entries = [];
		for (var i in options)
		{
			if(node.findOutputSlot(options[i][0]) != -1)
				continue; //skip the ones already on
			entries.push({content: options[i][0], value: options[i]});
		}
		if(entries.length)
			var menu = LiteGraph.createContextualMenu(entries, {event: e, callback: inner_clicked, from: prev_menu});
	}

	function inner_clicked(v)
	{
		if(!node) return;
		node.addOutput(v.value[0],v.value[1]);
	}

	return false;
}

LGraphCanvas.onMenuNodeCollapse = function(node)
{
	node.flags.collapsed = !node.flags.collapsed;
	node.graph.canvas.setDirty(true,true);
}

LGraphCanvas.onMenuNodeColors = function(node, e, prev_menu)
{
	var values = [];
	for(var i in LGraphCanvas.node_colors)
	{
		var color = LGraphCanvas.node_colors[i];
		var value = {value:i, content:"<span style='display: block; color:"+color.color+"; background-color:"+color.bgcolor+"'>"+i+"</span>"};
		values.push(value);
	}
	LiteGraph.createContextualMenu(values, {event: e, callback: inner_clicked, from: prev_menu});

	function inner_clicked(v)
	{
		if(!node) return;
		var color = LGraphCanvas.node_colors[v.value];
		if(color)
		{
			node.color = color.color;
			node.bgcolor = color.bgcolor;
			node.graph.canvas.setDirty(true);
		}
	}

	return false;
}

LGraphCanvas.onMenuNodeShapes = function(node,e)
{
	LiteGraph.createContextualMenu(["box","round"], {event: e, callback: inner_clicked});

	function inner_clicked(v)
	{
		if(!node) return;
		node.shape = v;
		node.graph.canvas.setDirty(true);
	}

	return false;
}

LGraphCanvas.onMenuNodeRemove = function(node)
{
	if(node.removable == false) return;
	node.graph.remove(node);
	node.graph.canvas.setDirty(true,true);
}

LGraphCanvas.onMenuNodeClone = function(node)
{
	if(node.clonable == false) return;
	var newnode = node.clone();
	if(!newnode) return;
	newnode.pos = [node.pos[0]+5,node.pos[1]+5];
	node.graph.add(newnode);
	node.graph.canvas.setDirty(true,true);
}

LGraphCanvas.node_colors = {
	"red": { color:"#FAA", bgcolor:"#A44" },
	"green": { color:"#AFA", bgcolor:"#4A4" },
	"blue": { color:"#AAF", bgcolor:"#44A" },
	"white": { color:"#FFF", bgcolor:"#AAA" }
};

LGraphCanvas.prototype.getCanvasMenuOptions = function()
{
	return [
		{content:"Add Node", is_menu: true, callback: LGraphCanvas.onMenuAdd }
		//{content:"Collapse All", callback: LGraphCanvas.onMenuCollapseAll }
	];
}

LGraphCanvas.prototype.getNodeMenuOptions = function(node)
{
	var options = [
		{content:"Inputs", is_menu: true, disabled:true, callback: LGraphCanvas.onMenuNodeInputs },
		{content:"Outputs", is_menu: true, disabled:true, callback: LGraphCanvas.onMenuNodeOutputs },
		null,
		{content:"Collapse", callback: LGraphCanvas.onMenuNodeCollapse },
		{content:"Colors", is_menu: true, callback: LGraphCanvas.onMenuNodeColors },
		{content:"Shapes", is_menu: true, callback: LGraphCanvas.onMenuNodeShapes },
		null,
		{content:"Clone", callback: LGraphCanvas.onMenuNodeClone },
		null,
		{content:"Remove", callback: LGraphCanvas.onMenuNodeRemove }
	];

	if( node.clonable == false )
		options[7].disabled = true;
	if( node.removable == false )
		options[9].disabled = true;

	if(node.onGetInputs && node.onGetInputs().length )
		options[0].disabled = false;
	if(node.onGetOutputs && node.onGetOutputs().length )
		options[1].disabled = false;

	return options;
}

LGraphCanvas.prototype.processContextualMenu = function(node,event)
{
	var that = this;
	var menu = LiteGraph.createContextualMenu(node ? this.getNodeMenuOptions(node) : this.getCanvasMenuOptions(), {event: event, callback: inner_option_clicked});

	function inner_option_clicked(v,e)
	{
		if(!v) return;

		if(v.callback)
			return v.callback(node, e, menu, that, event );
	}
}






//API *************************************************
//function roundRect(ctx, x, y, width, height, radius, radius_low) {
CanvasRenderingContext2D.prototype.roundRect = function (x, y, width, height, radius, radius_low) {
  if ( radius === undefined ) {
    radius = 5;
  }

  if(radius_low === undefined)
	 radius_low  = radius;

  this.beginPath();
  this.moveTo(x + radius, y);
  this.lineTo(x + width - radius, y);
  this.quadraticCurveTo(x + width, y, x + width, y + radius);

  this.lineTo(x + width, y + height - radius_low);
  this.quadraticCurveTo(x + width, y + height, x + width - radius_low, y + height);
  this.lineTo(x + radius_low, y + height);
  this.quadraticCurveTo(x, y + height, x, y + height - radius_low);
  this.lineTo(x, y + radius);
  this.quadraticCurveTo(x, y, x + radius, y);
}

function compareObjects(a,b)
{
	for(var i in a)
		if(a[i] != b[i])
			return false;
	return true;
}

function distance(a,b)
{
	return Math.sqrt( (b[0] - a[0]) * (b[0] - a[0]) + (b[1] - a[1]) * (b[1] - a[1]) );
}

function colorToString(c)
{
	return "rgba(" + Math.round(c[0] * 255).toFixed() + "," + Math.round(c[1] * 255).toFixed() + "," + Math.round(c[2] * 255).toFixed() + "," + (c.length == 4 ? c[3].toFixed(2) : "1.0") + ")";
}

function isInsideRectangle(x,y, left, top, width, height)
{
	if (left < x && (left + width) > x &&
		top < y && (top + height) > y)
		return true;	
	return false;
}

//[minx,miny,maxx,maxy]
function growBounding(bounding, x,y)
{
	if(x < bounding[0])
		bounding[0] = x;
	else if(x > bounding[2])
		bounding[2] = x;

	if(y < bounding[1])
		bounding[1] = y;
	else if(y > bounding[3])
		bounding[3] = y;
}

//point inside boundin box
function isInsideBounding(p,bb)
{
	if (p[0] < bb[0][0] || 
		p[1] < bb[0][1] || 
		p[0] > bb[1][0] || 
		p[1] > bb[1][1])
		return false;
	return true;
}

//boundings overlap, format: [start,end]
function overlapBounding(a,b)
{
	if ( a[0] > b[2] ||
		a[1] > b[3] ||
		a[2] < b[0] ||
		a[3] < b[1])
		return false;
	return true;
}

//Convert a hex value to its decimal value - the inputted hex must be in the
//	format of a hex triplet - the kind we use for HTML colours. The function
//	will return an array with three values.
function hex2num(hex) {
	if(hex.charAt(0) == "#") hex = hex.slice(1); //Remove the '#' char - if there is one.
	hex = hex.toUpperCase();
	var hex_alphabets = "0123456789ABCDEF";
	var value = new Array(3);
	var k = 0;
	var int1,int2;
	for(var i=0;i<6;i+=2) {
		int1 = hex_alphabets.indexOf(hex.charAt(i));
		int2 = hex_alphabets.indexOf(hex.charAt(i+1)); 
		value[k] = (int1 * 16) + int2;
		k++;
	}
	return(value);
}
//Give a array with three values as the argument and the function will return
//	the corresponding hex triplet.
function num2hex(triplet) {
	var hex_alphabets = "0123456789ABCDEF";
	var hex = "#";
	var int1,int2;
	for(var i=0;i<3;i++) {
		int1 = triplet[i] / 16;
		int2 = triplet[i] % 16;

		hex += hex_alphabets.charAt(int1) + hex_alphabets.charAt(int2); 
	}
	return(hex);
}

/* LiteGraph GUI elements *************************************/

LiteGraph.createContextualMenu = function(values,options)
{
	options = options || {};
	this.options = options;

	if(!options.from)
		LiteGraph.closeAllContextualMenus();

	var root = document.createElement("div");
	root.className = "litecontextualmenu litemenubar-panel";
	this.root = root;
	var style = root.style;

	style.minWidth = "100px";
	style.minHeight = "20px";

	style.position = "fixed";
	style.top = "100px";
	style.left = "100px";
	style.color = "#AAF";
	style.padding = "2px";
	style.borderBottom = "2px solid #AAF";
	style.backgroundColor = "#444";

	//avoid a context menu in a context menu
	root.addEventListener("contextmenu", function(e) { e.preventDefault(); return false; });

	for(var i in values)
	{
		var item = values[i];
		var element = document.createElement("div");
		element.className = "litemenu-entry";

		if(item == null)
		{
			element.className = "litemenu-entry separator";
			root.appendChild(element);
			continue;
		}

		if(item.is_menu)
			element.className += " submenu";

		if(item.disabled)
			element.className += " disabled";

		element.style.cursor = "pointer";
		element.dataset["value"] = typeof(item) == "string" ? item : item.value;
		element.data = item;
		if(typeof(item) == "string")
			element.innerHTML = values.constructor == Array ? values[i] : i;
		else
			element.innerHTML = item.content ? item.content : i;

		element.addEventListener("click", on_click );
		root.appendChild(element);
	}

	root.addEventListener("mouseover", function(e) {
		this.mouse_inside = true;
	});

	root.addEventListener("mouseout", function(e) {
		//console.log("OUT!");
		var aux = e.toElement;
		while(aux != this && aux != document)
			aux = aux.parentNode;

		if(aux == this) return;
		this.mouse_inside = false;
		if(!this.block_close)
			this.closeMenu();
	});

	/* MS specific
	root.addEventListener("mouseleave", function(e) {
		
		this.mouse_inside = false;
		if(!this.block_close)
			this.closeMenu();
	});
	*/

	//insert before checking position
	document.body.appendChild(root);

	var root_rect = root.getClientRects()[0];

	//link menus
	if(options.from)
	{
		options.from.block_close = true;
	}

	var left = options.left || 0;
	var top = options.top || 0;
	if(options.event)
	{
		left = (options.event.pageX - 10);
		top = (options.event.pageY - 10);
		if(options.left)
			left = options.left;

		var rect = document.body.getClientRects()[0];

		if(options.from)
		{
			var parent_rect = options.from.getClientRects()[0];
			left = parent_rect.left + parent_rect.width;
		}

		
		if(left > (rect.width - root_rect.width - 10))
			left = (rect.width - root_rect.width - 10);
		if(top > (rect.height - root_rect.height - 10))
			top = (rect.height - root_rect.height - 10);
	}

	root.style.left = left + "px";
	root.style.top = top  + "px";

	function on_click(e) {
		var value = this.dataset["value"];
		var close = true;
		if(options.callback)
		{
			var ret = options.callback.call(root, this.data, e );
			if( ret != undefined ) close = ret;
		}

		if(close)
			LiteGraph.closeAllContextualMenus();
			//root.closeMenu();
	}

	root.closeMenu = function()
	{
		if(options.from)
		{
			options.from.block_close = false;
			if(!options.from.mouse_inside)
				options.from.closeMenu();
		}
		if(this.parentNode)
			document.body.removeChild(this);
	};

	return root;
}

LiteGraph.closeAllContextualMenus = function()
{
	var elements = document.querySelectorAll(".litecontextualmenu");
	if(!elements.length) return;

	var result = [];
	for(var i = 0; i < elements.length; i++)
		result.push(elements[i]);

	for(var i in result)
		if(result[i].parentNode)
			result[i].parentNode.removeChild( result[i] );
}

LiteGraph.extendClass = function(origin, target)
{
	for(var i in origin) //copy class properties
		target[i] = origin[i];
	if(origin.prototype) //copy prototype properties
		for(var i in origin.prototype)
			target.prototype[i] = origin.prototype[i];
}
//basic nodes

LiteGraph.registerNodeType("basic/const",{
	title: "Const",
	desc: "Constant",
	outputs: [["value","number"]],
	properties: {value:1.0},
	editable: { property:"value", type:"number" },

	setValue: function(v)
	{
		if( typeof(v) == "string") v = parseFloat(v);
		this.properties["value"] = v;
		this.setDirtyCanvas(true);
	},

	onExecute: function()
	{
		this.setOutputData(0, parseFloat( this.properties["value"] ) );
	},

	onDrawBackground: function(ctx)
	{
		//show the current value
		this.outputs[0].label = this.properties["value"].toFixed(3);
	},

	onWidget: function(e,widget)
	{
		if(widget.name == "value")
			this.setValue(widget.value);
	}
});

LiteGraph.registerNodeType("math/rand",{
	title: "Rand",
	desc: "Random number",
	outputs: [["value","number"]],
	properties: {min:0,max:1},
	size: [60,20],

	onExecute: function()
	{
		var min = this.properties.min;
		var max = this.properties.max;
		this._last_v = Math.random() * (max-min) + min;
		this.setOutputData(0, this._last_v );
	},

	onDrawBackground: function(ctx)
	{
		//show the current value
		if(this._last_v)
			this.outputs[0].label = this._last_v.toFixed(3);
		else
			this.outputs[0].label = "?";
	}
});

LiteGraph.registerNodeType("math/clamp",{
	title: "Clamp",
	desc: "Clamp number between min and max",
	inputs: [["in","number"]],
	outputs: [["out","number"]],
	size: [60,20],
	properties: {min:0,max:1},

	onExecute: function()
	{
		var v = this.getInputData(0);
		if(v == null) return;
		v = Math.max(this.properties.min,v);
		v = Math.min(this.properties.max,v);
		this.setOutputData(0, v );
	}
});

LiteGraph.registerNodeType("math/abs",{
	title: "Abs",
	desc: "Absolute",
	inputs: [["in","number"]],
	outputs: [["out","number"]],
	size: [60,20],

	onExecute: function()
	{
		var v = this.getInputData(0);
		if(v == null) return;
		this.setOutputData(0, Math.abs(v) );
	}
});

LiteGraph.registerNodeType("math/floor",{
	title: "Floor",
	desc: "Floor number to remove fractional part",
	inputs: [["in","number"]],
	outputs: [["out","number"]],
	size: [60,20],

	onExecute: function()
	{
		var v = this.getInputData(0);
		if(v == null) return;
		this.setOutputData(0, v|1 );
	}
});


LiteGraph.registerNodeType("math/frac",{
	title: "Frac",
	desc: "Returns fractional part",
	inputs: [["in","number"]],
	outputs: [["out","number"]],
	size: [60,20],

	onExecute: function()
	{
		var v = this.getInputData(0);
		if(v == null) return;
		this.setOutputData(0, v%1 );
	}
});


LiteGraph.registerNodeType("basic/watch", {
	title: "Watch",
	desc: "Show value",
	size: [60,20],
	inputs: [["value",0,{label:""}]],
	outputs: [["value",0,{label:""}]],
	properties: {value:""},

	onExecute: function()
	{
		this.properties.value = this.getInputData(0);
		this.setOutputData(0, this.properties.value);
	},

	onDrawBackground: function(ctx)
	{
		//show the current value
		if(this.inputs[0] && this.properties["value"] != null)	
		{
			if (this.properties["value"].constructor === Number )
				this.inputs[0].label = this.properties["value"].toFixed(3);
			else
				this.inputs[0].label = this.properties["value"];
		}
	}
});


LiteGraph.registerNodeType("math/scale",{
	title: "Scale",
	desc: "1 - value",
	inputs: [["value","number",{label:""}]],
	outputs: [["value","number",{label:""}]],
	size:[70,20],
	properties: {"factor":1},

	onExecute: function()
	{
		var value = this.getInputData(0);
		if(value != null)
			this.setOutputData(0, value * this.properties.factor );
	}
});


LiteGraph.registerNodeType("math/operation",{
	title: "Operation",
	desc: "Easy math operators",
	inputs: [["A","number"],["B","number"]],
	outputs: [["A+B","number"]],
	size: [80,20],
	//optional_inputs: [["start","number"]],

	properties: {A:1.0, B:1.0},

	setValue: function(v)
	{
		if( typeof(v) == "string") v = parseFloat(v);
		this.properties["value"] = v;
		this.setDirtyCanvas(true);
	},

	onExecute: function()
	{
		var A = this.getInputData(0);
		var B = this.getInputData(1);
		if(A!=null)
			this.properties["A"] = A;
		else
			A = this.properties["A"];

		if(B!=null)
			this.properties["B"] = B;
		else
			B = this.properties["B"];

		for(var i = 0, l = this.outputs.length; i < l; ++i)
		{
			var output = this.outputs[i];
			if(!output.links || !output.links.length)
				continue;
			switch( output.name )
			{
				case "A+B": value = A+B; break;
				case "A-B": value = A-B; break;
				case "A*B": value = A*B; break;
				case "A/B": value = A/B; break;
			}
			this.setOutputData(i, value );
		}
	},

	onGetOutputs: function()
	{
		return [["A-B","number"],["A*B","number"],["A/B","number"]];
	}
});

LiteGraph.registerNodeType("math/compare",{
	title: "Compare",
	desc: "compares between two values",

	inputs: [["A","number"],["B","number"]],
	outputs: [["A==B","number"],["A!=B","number"]],
	properties:{A:0,B:0},
	onExecute: function()
	{
		var A = this.getInputData(0);
		var B = this.getInputData(1);
		if(A!=null)
			this.properties["A"] = A;
		else
			A = this.properties["A"];

		if(B!=null)
			this.properties["B"] = B;
		else
			B = this.properties["B"];

		for(var i = 0, l = this.outputs.length; i < l; ++i)
		{
			var output = this.outputs[i];
			if(!output.links || !output.links.length)
				continue;
			switch( output.name )
			{
				case "A==B": value = A==B; break;
				case "A!=B": value = A!=B; break;
				case "A>B": value = A>B; break;
				case "A<B": value = A<B; break;
				case "A<=B": value = A<=B; break;
				case "A>=B": value = A>=B; break;
			}
			this.setOutputData(i, value );
		}
	},

	onGetOutputs: function()
	{
		return [["A==B","number"],["A!=B","number"],["A>B","number"],["A<B","number"],["A>=B","number"],["A<=B","number"]];
	}
});

if(window.math) //math library for safe math operations without eval
LiteGraph.registerNodeType("math/formula",{
	title: "Formula",
	desc: "Compute safe formula",
	inputs: [["x","number"],["y","number"]],
	outputs: [["","number"]],
	properties: {x:1.0, y:1.0, formula:"x+y"},
	
	onExecute: function()
	{
		var x = this.getInputData(0);
		var y = this.getInputData(1);
		if(x != null)
			this.properties["x"] = x;
		else
			x = this.properties["x"];

		if(y!=null)
			this.properties["y"] = y;
		else
			y = this.properties["y"];

		var f = this.properties["formula"];
		var value = math.eval(f,{x:x,y:y,T: this.graph.globaltime });
		this.setOutputData(0, value );
	},

	onDrawBackground: function()
	{
		var f = this.properties["formula"];
		this.outputs[0].label = f;
	},

	onGetOutputs: function()
	{
		return [["A-B","number"],["A*B","number"],["A/B","number"]];
	}
});


LiteGraph.registerNodeType("math/trigonometry",{
	title: "Trigonometry",
	desc: "Sin Cos Tan",
	bgImageUrl: "nodes/imgs/icon-sin.png",

	inputs: [["v","number"]],
	outputs: [["sin","number"]],
	properties: {amplitude:1.0},
	size:[100,20],

	onExecute: function()
	{
		var v = this.getInputData(0);
		var amp = this.properties["amplitude"];
		for(var i = 0, l = this.outputs.length; i < l; ++i)
		{
			var output = this.outputs[i];
			switch( output.name )
			{
				case "sin": value = Math.sin(v); break;
				case "cos": value = Math.cos(v); break;
				case "tan": value = Math.tan(v); break;
				case "asin": value = Math.asin(v); break;
				case "acos": value = Math.acos(v); break;
				case "atan": value = Math.atan(v); break;
			}
			this.setOutputData(i, amp * value );
		}
	},

	onGetOutputs: function()
	{
		return [["sin","number"],["cos","number"],["tan","number"],["asin","number"],["acos","number"],["atan","number"]];
	}
});

//if glMatrix is installed...
if(window.glMatrix) 
{
	LiteGraph.registerNodeType("math3d/vec3-to-xyz",{
		title: "Vec3->XYZ",
		desc: "vector 3 to components",
		inputs: [["vec3","vec3"]],
		outputs: [["x","number"],["y","number"],["z","number"]],

		onExecute: function()
		{
			var v = this.getInputData(0);
			if(v == null) return;

			this.setOutputData( 0, v[0] );
			this.setOutputData( 1, v[1] );
			this.setOutputData( 2, v[2] );
		}
	});

	LiteGraph.registerNodeType("math3d/xyz-to-vec3",{
		title: "XYZ->Vec3",
		desc: "components to vector3",
		inputs: [["x","number"],["y","number"],["z","number"]],
		outputs: [["vec3","vec3"]],

		onExecute: function()
		{
			var x = this.getInputData(0);
			if(x == null) x = 0;
			var y = this.getInputData(1);
			if(y == null) y = 0;
			var z = this.getInputData(2);
			if(z == null) z = 0;

			this.setOutputData( 0, vec3.fromValues(x,y,z) );
		}
	});

	LiteGraph.registerNodeType("math3d/rotation",{
		title: "Rotation",
		desc: "rotation quaternion",
		inputs: [["degrees","number"],["axis","vec3"]],
		outputs: [["quat","quat"]],
		properties: {angle:90.0, axis:[0,1,0]},

		onExecute: function()
		{
			var angle = this.getInputData(0);
			if(angle == null) angle = this.properties.angle;
			var axis = this.getInputData(1);
			if(axis == null) axis = this.properties.axis;

			var R = quat.setAxisAngle(quat.create(), axis, angle * 0.0174532925 );
			this.setOutputData( 0, R );
		}
	});

	LiteGraph.registerNodeType("math3d/rotate_vec3",{
		title: "Rot. Vec3",
		desc: "rotate a point",
		inputs: [["vec3","vec3"],["quat","quat"]],
		outputs: [["result","vec3"]],
		properties: {vec:[0,0,1]},

		onExecute: function()
		{
			var vec = this.getInputData(0);
			if(vec == null) vec = this.properties.vec;
			var quat = this.getInputData(1);
			if(quat == null)
				this.setOutputData(vec);
			else
				this.setOutputData( 0, vec3.transformQuat( vec3.create(), vec, quat ) );
		}
	});


	LiteGraph.registerNodeType("math3d/mult-quat",{
		title: "Mult. Quat",
		desc: "rotate quaternion",
		inputs: [["A","quat"],["B","quat"]],
		outputs: [["A*B","quat"]],

		onExecute: function()
		{
			var A = this.getInputData(0);
			if(A == null) return;
			var B = this.getInputData(1);
			if(B == null) return;

			var R = quat.multiply(quat.create(), A,B);
			this.setOutputData( 0, R );
		}
	});

} //glMatrix


/*
LiteGraph.registerNodeType("math/sinusoid",{
	title: "Sin",
	desc: "Sinusoidal value generator",
	bgImageUrl: "nodes/imgs/icon-sin.png",

	inputs: [["f",'number'],["q",'number'],["a",'number'],["t",'number']],
	outputs: [["",'number']],
	properties: {amplitude:1.0, freq: 1, phase:0},

	onExecute: function()
	{
		var f = this.getInputData(0);
		if(f != null)
			this.properties["freq"] = f;

		var q = this.getInputData(1);
		if(q != null)
			this.properties["phase"] = q;

		var a = this.getInputData(2);
		if(a != null)
			this.properties["amplitude"] = a;

		var t = this.graph.getFixedTime();
		if(this.getInputData(3) != null)
			t = this.getInputData(3);
		// t = t/(2*Math.PI); t = (t-Math.floor(t))*(2*Math.PI);

		var v = this.properties["amplitude"] * Math.sin((2*Math.PI) * t * this.properties["freq"] + this.properties["phase"]);
		this.setOutputData(0, v );
	},

	onDragBackground: function(ctx)
	{
		this.boxcolor = colorToString(v > 0 ? [0.5,0.8,1,0.5] : [0,0,0,0.5]);
		this.setDirtyCanvas(true);
	},
});
*/

/*
LiteGraph.registerNodeType("basic/number",{
	title: "Number",
	desc: "Fixed number output",
	outputs: [["","number"]],
	color: "#66A",
	bgcolor: "#336",
	widgets: [{name:"value",text:"Value",type:"input",property:"value"}],

	properties: {value:1.0},

	setValue: function(v)
	{
		if( typeof(v) == "string") v = parseFloat(v);
		this.properties["value"] = v;
		this.setDirtyCanvas(true);
	},

	onExecute: function()
	{
		this.outputs[0].name = this.properties["value"].toString();
		this.setOutputData(0, this.properties["value"]);
	},

	onWidget: function(e,widget)
	{
		if(widget.name == "value")
			this.setValue(widget.value);
	}
});


LiteGraph.registerNodeType("basic/string",{
	title: "String",
	desc: "Fixed string output",
	outputs: [["","string"]],
	color: "#66A",
	bgcolor: "#336",
	widgets: [{name:"value",text:"Value",type:"input"}],

	properties: {value:"..."},

	setValue: function(v)
	{
		this.properties["value"] = v;
		this.setDirtyCanvas(true);
	},

	onExecute: function()
	{
		this.outputs[0].name = this.properties["value"].toString();
		this.setOutputData(0, this.properties["value"]);
	},

	onWidget: function(e,widget)
	{
		if(widget.name == "value")
			this.setValue(widget.value);
	}
});

LiteGraph.registerNodeType("basic/trigger",{
	title: "Trigger",
	desc: "Triggers node action",
	inputs: [["!0","number"]],
	outputs: [["M","node"]],

	properties: {triggerName:null},

	onExecute: function()
	{
		if( this.getInputData(0) )
		{
			var m = this.getOutputNode(0);
			if(m && m.onTrigger)
				m.onTrigger();
			if(m && this.properties.triggerName && typeof(m[this.properties.triggerName]) == "function")
				m[this.properties.triggerName].call(m);
		}
	}
});


LiteGraph.registerNodeType("basic/switch",{
	title: "Switch",
	desc: "Switch between two inputs",
	inputs: [["i","number"],["A",0],["B",0]],
	outputs: [["",0]],

	onExecute: function()
	{
		var f = this.getInputData(0);
		if(f)
		{
			f = Math.round(f)+1;
			if(f < 1) f = 1;
			if(f > 2) f = 2;
			this.setOutputData(0, this.getInputData(f) );
		}
		else
			this.setOutputData(0, null);
	}
});

// System vars *********************************

LiteGraph.registerNodeType("session/info",{
	title: "Time",
	desc: "Seconds since start",

	outputs: [["secs",'number']],
	properties: {scale:1.0},
	onExecute: function()
	{
		this.setOutputData(0, this.session.getTime() * this.properties.scale);
	}
});

LiteGraph.registerNodeType("system/fixedtime",{
	title: "F.Time",
	desc: "Constant time value",

	outputs: [["secs",'number']],
	properties: {scale:1.0},
	onExecute: function()
	{
		this.setOutputData(0, this.session.getFixedTime() * this.properties.scale);
	}
});


LiteGraph.registerNodeType("system/elapsedtime",{
	title: "Elapsed",
	desc: "Seconds elapsed since last execution",

	outputs: [["secs",'number']],
	properties: {scale:1.0},
	onExecute: function()
	{
		this.setOutputData(0, this.session.getElapsedTime() * this.properties.scale);
	}
});

LiteGraph.registerNodeType("system/iterations",{
	title: "Iterations",
	desc: "Number of iterations (executions)",

	outputs: [["",'number']],
	onExecute: function()
	{
		this.setOutputData(0, this.session.iterations );
	}
});

LiteGraph.registerNodeType("system/trace",{
	desc: "Outputs input to browser's console",

	inputs: [["",0]],
	onExecute: function()
	{
		var data = this.getInputData(0);
		if(data)
			trace("DATA: "+data);
	}
});

/*
LiteGraph.registerNodeType("math/not",{
	title: "Not",
	desc: "0 -> 1 or 0 -> 1",
	inputs: [["A",'number']],
	outputs: [["!A",'number']],
	size: [60,22],
	onExecute: function()
	{
		var v = this.getInputData(0);
		if(v != null)
			this.setOutputData(0, v ? 0 : 1);
	}
});



// Nodes for network in and out 
LiteGraph.registerNodeType("network/general/network_input",{
	title: "N.Input",
	desc: "Network Input",
	outputs: [["",0]],
	color: "#00ff96",
	bgcolor: "#004327",

	setValue: function(v)
	{
		this.value = v;
	},

	onExecute: function()
	{
		this.setOutputData(0, this.value);
	}
});

LiteGraph.registerNodeType("network/general/network_output",{
	title: "N.Output",
	desc: "Network output",
	inputs: [["",0]],
	color: "#a8ff00",
	bgcolor: "#293e00",

	properties: {value:null},

	getValue: function()
	{
		return this.value;
	},

	onExecute: function()
	{
		this.value = this.getOutputData(0);
	}
});

LiteGraph.registerNodeType("network/network_trigger",{
	title: "N.Trigger",
	desc: "Network input trigger",
	outputs: [["",0]],
	color: "#ff9000",
	bgcolor: "#522e00",

	onTrigger: function(v)
	{
		this.triggerOutput(0,v);
	},
});

LiteGraph.registerNodeType("network/network_callback",{
	title: "N.Callback",
	desc: "Network callback output.",
	outputs: [["",0]],
	color: "#6A6",
	bgcolor: "#363",

	setTrigger: function(func)
	{
		this.callback = func;
	},

	onTrigger: function(v)
	{
		if(this.callback)
			this.callback(v);
	},
});

*/
//widgets

	LiteGraph.registerNodeType("widget/knob",{
		title: "Knob",
		desc: "Circular controller",
		size: [64,84],
		outputs: [["",'number']],
		properties: {min:0,max:1,value:0.5,wcolor:"#7AF",size:50},
		widgets: [{name:"increase",text:"+",type:"minibutton"},{name:"decrease",text:"-",type:"minibutton"}],	

		onInit: function()
		{
			this.value = (this.properties["value"] - this.properties["min"]) / (this.properties["max"] - this.properties["min"]);

			this.imgbg = this.loadImage("imgs/knob_bg.png");
			this.imgfg = this.loadImage("imgs/knob_fg.png");
		},

		onDrawImageKnob: function(ctx)
		{
			if(!this.imgfg || !this.imgfg.width) return;

			var d = this.imgbg.width*0.5;
			var scale = this.size[0] / this.imgfg.width;

			ctx.save();
				ctx.translate(0,20);
				ctx.scale(scale,scale);
				ctx.drawImage(this.imgbg,0,0);
				//ctx.drawImage(this.imgfg,0,20);

				ctx.translate(d,d);
				ctx.rotate(this.value * (Math.PI*2) * 6/8 + Math.PI * 10/8);
				//ctx.rotate(this.value * (Math.PI*2));
				ctx.translate(-d,-d);
				ctx.drawImage(this.imgfg,0,0);

			ctx.restore();

			ctx.font = "bold 16px Criticized,Tahoma";
			ctx.fillStyle="rgba(100,100,100,0.8)";
			ctx.textAlign = "center";

			ctx.fillText(this.name.toUpperCase(), this.size[0] * 0.5, 18 );
			ctx.textAlign = "left";
		},

		onDrawVectorKnob: function(ctx)
		{
			if(!this.imgfg || !this.imgfg.width) return;

			//circle around
			ctx.lineWidth = 1;
			ctx.strokeStyle= this.mouseOver ? "#FFF" : "#AAA";
			ctx.fillStyle="#000";
			ctx.beginPath();
			ctx.arc(this.size[0] * 0.5,this.size[1] * 0.5 + 10,this.properties.size * 0.5,0,Math.PI*2,true);
			ctx.stroke();

			if(this.value > 0)
			{
				ctx.strokeStyle=this.properties["wcolor"];
				ctx.lineWidth = (this.properties.size * 0.2);
				ctx.beginPath();
				ctx.arc(this.size[0] * 0.5,this.size[1] * 0.5 + 10,this.properties.size * 0.35,Math.PI * -0.5 + Math.PI*2 * this.value,Math.PI * -0.5,true);
				ctx.stroke();
				ctx.lineWidth = 1;
			}

			ctx.font = (this.properties.size * 0.2) + "px Arial";
			ctx.fillStyle="#AAA";
			ctx.textAlign = "center";

			var str = this.properties["value"];
			if(typeof(str) == 'number')
				str = str.toFixed(2);

			ctx.fillText(str,this.size[0] * 0.5,this.size[1]*0.65);
			ctx.textAlign = "left";
		},

		onDrawBackground: function(ctx)
		{
			this.onDrawImageKnob(ctx);
		},

		onExecute: function()
		{
			this.setOutputData(0, this.properties["value"] );

			this.boxcolor = colorToString([this.value,this.value,this.value]);
		},

		onMouseDown: function(e)
		{
			if(!this.imgfg || !this.imgfg.width) return;

			//this.center = [this.imgbg.width * 0.5, this.imgbg.height * 0.5 + 20];
			//this.radius = this.imgbg.width * 0.5;
			this.center = [this.size[0] * 0.5, this.size[1] * 0.5 + 20];
			this.radius = this.size[0] * 0.5;

			if(e.canvasY - this.pos[1] < 20 || distance([e.canvasX,e.canvasY],[this.pos[0] + this.center[0],this.pos[1] + this.center[1]]) > this.radius)
				return false;

			this.oldmouse = [ e.canvasX - this.pos[0], e.canvasY - this.pos[1] ];
			this.captureInput(true);

			/*
			var tmp = this.localToScreenSpace(0,0);
			this.trace(tmp[0] + "," + tmp[1]); */
			return true;
		},

		onMouseMove: function(e)
		{
			if(!this.oldmouse) return;

			var m = [ e.canvasX - this.pos[0], e.canvasY - this.pos[1] ];

			var v = this.value;
			v -= (m[1] - this.oldmouse[1]) * 0.01;
			if(v > 1.0) v = 1.0;
			else if(v < 0.0) v = 0.0;

			this.value = v;
			this.properties["value"] = this.properties["min"] + (this.properties["max"] - this.properties["min"]) * this.value;

			this.oldmouse = m;
			this.setDirtyCanvas(true);
		},

		onMouseUp: function(e)
		{
			if(this.oldmouse)
			{
				this.oldmouse = null;
				this.captureInput(false);
			}
		},

		onMouseLeave: function(e)
		{
			//this.oldmouse = null;
		},
		
		onWidget: function(e,widget)
		{
			if(widget.name=="increase")
				this.onPropertyChange("size", this.properties.size + 10);
			else if(widget.name=="decrease")
				this.onPropertyChange("size", this.properties.size - 10);
		},

		onPropertyChange: function(name,value)
		{
			if(name=="wcolor")
				this.properties[name] = value;
			else if(name=="size")
			{
				value = parseInt(value);
				this.properties[name] = value;
				this.size = [value+4,value+24];
				this.setDirtyCanvas(true,true);
			}
			else if(name=="min" || name=="max" || name=="value")
			{
				this.properties[name] = parseFloat(value);
			}
			else
				return false;
			return true;
		}
	});

	LiteGraph.registerNodeType("widget/hslider",{
		title: "H.Slider",
		desc: "Linear slider controller",
		size: [160,26],
		outputs: [["",'number']],
		properties: {wcolor:"#7AF",min:0,max:1,value:0.5},
		onInit: function()
		{
			this.value = 0.5;
			this.imgfg = this.loadImage("imgs/slider_fg.png");
		},

		onDrawVectorial: function(ctx)
		{
			if(!this.imgfg || !this.imgfg.width) return;

			//border
			ctx.lineWidth = 1;
			ctx.strokeStyle= this.mouseOver ? "#FFF" : "#AAA";
			ctx.fillStyle="#000";
			ctx.beginPath();
			ctx.rect(2,0,this.size[0]-4,20);
			ctx.stroke();

			ctx.fillStyle=this.properties["wcolor"];
			ctx.beginPath();
			ctx.rect(2+(this.size[0]-4-20)*this.value,0, 20,20);
			ctx.fill();
		},

		onDrawImage: function(ctx)
		{
			if(!this.imgfg || !this.imgfg.width) return;

			//border
			ctx.lineWidth = 1;
			ctx.fillStyle="#000";
			ctx.fillRect(2,9,this.size[0]-4,2);

			ctx.strokeStyle= "#333";
			ctx.beginPath();
			ctx.moveTo(2,9);
			ctx.lineTo(this.size[0]-4,9);
			ctx.stroke();

			ctx.strokeStyle= "#AAA";
			ctx.beginPath();
			ctx.moveTo(2,11);
			ctx.lineTo(this.size[0]-4,11);
			ctx.stroke();

			ctx.drawImage(this.imgfg, 2+(this.size[0]-4)*this.value - this.imgfg.width*0.5,-this.imgfg.height*0.5 + 10);
		},

		onDrawBackground: function(ctx)
		{
			this.onDrawImage(ctx);
		},

		onExecute: function()
		{
			this.properties["value"] = this.properties["min"] + (this.properties["max"] - this.properties["min"]) * this.value;
			this.setOutputData(0, this.properties["value"] );
			this.boxcolor = colorToString([this.value,this.value,this.value]);
		},

		onMouseDown: function(e)
		{
			if(e.canvasY - this.pos[1] < 0)
				return false;

			this.oldmouse = [ e.canvasX - this.pos[0], e.canvasY - this.pos[1] ];
			this.captureInput(true);
			return true;
		},

		onMouseMove: function(e)
		{
			if(!this.oldmouse) return;

			var m = [ e.canvasX - this.pos[0], e.canvasY - this.pos[1] ];

			var v = this.value;
			var delta = (m[0] - this.oldmouse[0]);
			v += delta / this.size[0];
			if(v > 1.0) v = 1.0;
			else if(v < 0.0) v = 0.0;

			this.value = v;

			this.oldmouse = m;
			this.setDirtyCanvas(true);
		},

		onMouseUp: function(e)
		{
			this.oldmouse = null;
			this.captureInput(false);
		},

		onMouseLeave: function(e)
		{
			//this.oldmouse = null;
		},

		onPropertyChange: function(name,value)
		{
			if(name=="wcolor")
				this.properties[name] = value;
			else
				return false;
			return true;
		}
	});

	LiteGraph.registerNodeType("widget/kpad",{
		title: "KPad",
		desc: "bidimensional slider",
		size: [200,200],
		outputs: [["x",'number'],["y",'number']],
		properties:{x:0,y:0,borderColor:"#333",bgcolorTop:"#444",bgcolorBottom:"#000",shadowSize:1, borderRadius:2},

		createGradient: function(ctx)
		{
			this.lineargradient = ctx.createLinearGradient(0,0,0,this.size[1]);  
			this.lineargradient.addColorStop(0,this.properties["bgcolorTop"]);  
			this.lineargradient.addColorStop(1,this.properties["bgcolorBottom"]);
		},

		onDrawBackground: function(ctx)
		{
			if(!this.lineargradient)
				this.createGradient(ctx);

			ctx.lineWidth = 1;
			ctx.strokeStyle = this.properties["borderColor"];
			//ctx.fillStyle = "#ebebeb";
			ctx.fillStyle = this.lineargradient;

			ctx.shadowColor = "#000";
			ctx.shadowOffsetX = 0;
			ctx.shadowOffsetY = 0;
			ctx.shadowBlur = this.properties["shadowSize"];
			ctx.roundRect(0,0,this.size[0],this.size[1],this.properties["shadowSize"]);
			ctx.fill();
			ctx.shadowColor = "rgba(0,0,0,0)";
			ctx.stroke();

			ctx.fillStyle = "#A00";
			ctx.fillRect(this.size[0] * this.properties["x"] - 5, this.size[1] * this.properties["y"] - 5,10,10);
		},

		onWidget: function(e,widget)
		{
			if(widget.name == "update")
			{
				this.lineargradient = null;
				this.setDirtyCanvas(true);
			}
		},

		onExecute: function()
		{
			this.setOutputData(0, this.properties["x"] );
			this.setOutputData(1, this.properties["y"] );
		},

		onMouseDown: function(e)
		{
			if(e.canvasY - this.pos[1] < 0)
				return false;

			this.oldmouse = [ e.canvasX - this.pos[0], e.canvasY - this.pos[1] ];
			this.captureInput(true);
			return true;
		},

		onMouseMove: function(e)
		{
			if(!this.oldmouse) return;

			var m = [ e.canvasX - this.pos[0], e.canvasY - this.pos[1] ];
			
			this.properties.x = m[0] / this.size[0];
			this.properties.y = m[1] / this.size[1];

			if(this.properties.x > 1.0) this.properties.x = 1.0;
			else if(this.properties.x < 0.0) this.properties.x = 0.0;

			if(this.properties.y > 1.0) this.properties.y = 1.0;
			else if(this.properties.y < 0.0) this.properties.y = 0.0;

			this.oldmouse = m;
			this.setDirtyCanvas(true);
		},

		onMouseUp: function(e)
		{
			if(this.oldmouse)
			{
				this.oldmouse = null;
				this.captureInput(false);
			}
		},

		onMouseLeave: function(e)
		{
			//this.oldmouse = null;
		}
	});


	LiteGraph.registerNodeType("widget/button", {
		title: "Button",
		desc: "A send command button",

		widgets: [{name:"test",text:"Test Button",type:"button"}],
		size: [100,40],
		properties:{text:"clickme",command:"",color:"#7AF",bgcolorTop:"#f0f0f0",bgcolorBottom:"#e0e0e0",fontsize:"16"},
		outputs:[["M","module"]],

		createGradient: function(ctx)
		{
			this.lineargradient = ctx.createLinearGradient(0,0,0,this.size[1]);  
			this.lineargradient.addColorStop(0,this.properties["bgcolorTop"]);  
			this.lineargradient.addColorStop(1,this.properties["bgcolorBottom"]);
		},

		drawVectorShape: function(ctx)
		{
			ctx.fillStyle = this.mouseOver ? this.properties["color"] : "#AAA";

			if(this.clicking) 
				ctx.fillStyle = "#FFF";

			ctx.strokeStyle = "#AAA";
			ctx.roundRect(5,5,this.size[0] - 10,this.size[1] - 10,4);
			ctx.stroke();

			if(this.mouseOver)
				ctx.fill();

			//ctx.fillRect(5,20,this.size[0] - 10,this.size[1] - 30);

			ctx.fillStyle = this.mouseOver ? "#000" : "#AAA";
			ctx.font = "bold " + this.properties["fontsize"] + "px Criticized,Tahoma";
			ctx.textAlign = "center";
			ctx.fillText(this.properties["text"],this.size[0]*0.5,this.size[1]*0.5 + 0.5*parseInt(this.properties["fontsize"]));
			ctx.textAlign = "left";
		},

		drawBevelShape: function(ctx)
		{
			ctx.shadowColor = "#000";
			ctx.shadowOffsetX = 0;
			ctx.shadowOffsetY = 0;
			ctx.shadowBlur = this.properties["shadowSize"];

			if(!this.lineargradient)
				this.createGradient(ctx);

			ctx.fillStyle = this.mouseOver ? this.properties["color"] : this.lineargradient;
			if(this.clicking) 
				ctx.fillStyle = "#444";

			ctx.strokeStyle = "#FFF";
			ctx.roundRect(5,5,this.size[0] - 10,this.size[1] - 10,4);
			ctx.fill();
			ctx.shadowColor = "rgba(0,0,0,0)";
			ctx.stroke();

			ctx.fillStyle = this.mouseOver ? "#000" : "#444";
			ctx.font = "bold " + this.properties["fontsize"] + "px Century Gothic";
			ctx.textAlign = "center";
			ctx.fillText(this.properties["text"],this.size[0]*0.5,this.size[1]*0.5 + 0.40*parseInt(this.properties["fontsize"]));
			ctx.textAlign = "left";
		},

		onDrawBackground: function(ctx)
		{
			this.drawBevelShape(ctx);
		},

		clickButton: function()
		{
			var module = this.getOutputModule(0);
			if(this.properties["command"] && this.properties["command"] != "")
			{
				if (! module.executeAction(this.properties["command"]) )
					this.trace("Error executing action in other module");
			}
			else if(module && module.onTrigger)
			{
				module.onTrigger();  
			}
		},

		onMouseDown: function(e)
		{
			if(e.canvasY - this.pos[1] < 2)
				return false;
			this.clickButton();
			this.clicking = true;
			return true;
		},

		onMouseUp: function(e)
		{
			this.clicking = false;
		},

		onExecute: function()
		{
		},

		onWidget: function(e,widget)
		{
			if(widget.name == "test")
			{
				this.clickButton();
			}
		},

		onPropertyChange: function(name,value)
		{
			this.properties[name] = value;
			return true;
		}
	});

	LiteGraph.registerNodeType("widget/progress",{
		title: "Progress",
		desc: "Shows data in linear progress",
		size: [160,26],
		inputs: [["",'number']],
		properties: {min:0,max:1,value:0,wcolor:"#AAF"},
		onExecute: function()
		{
			var v = this.getInputData(0);
			if( v != undefined )
				this.properties["value"] = v;
		},
		onDrawBackground: function(ctx)
		{
			//border
			ctx.lineWidth = 1;
			ctx.fillStyle=this.properties.wcolor;
			var v = (this.properties.value - this.properties.min) / (this.properties.max - this.properties.min);
			v = Math.min(1,v);
			v = Math.max(0,v);
			ctx.fillRect(2,2,(this.size[0]-4)*v,this.size[1]-4);
		}
	});

	LiteGraph.registerNodeType("widget/text", {
		title: "Text",
		desc: "Shows the input value",

		widgets: [{name:"resize",text:"Resize box",type:"button"},{name:"led_text",text:"LED",type:"minibutton"},{name:"normal_text",text:"Normal",type:"minibutton"}],
		inputs: [["",0]],
		properties:{value:"...",font:"Arial", fontsize:18, color:"#AAA", align:"left", glowSize:0, decimals:1},

		onDrawBackground: function(ctx)
		{
			//ctx.fillStyle="#000";
			//ctx.fillRect(0,0,100,60);
			ctx.fillStyle = this.properties["color"];
			var v = this.properties["value"];

			if(this.properties["glowSize"])
			{
				ctx.shadowColor = this.properties["color"];
				ctx.shadowOffsetX = 0;
				ctx.shadowOffsetY = 0;
				ctx.shadowBlur = this.properties["glowSize"];
			}
			else
				ctx.shadowColor = "transparent";

			var fontsize = this.properties["fontsize"];

			ctx.textAlign = this.properties["align"];
			ctx.font = fontsize.toString() + "px " + this.properties["font"];
			this.str = typeof(v) == 'number' ? v.toFixed(this.properties["decimals"]) : v;

			if( typeof(this.str) == 'string')
			{
				var lines = this.str.split("\\n");
				for(var i in lines)
					ctx.fillText(lines[i],this.properties["align"] == "left" ? 15 : this.size[0] - 15, fontsize * -0.15 + fontsize * (parseInt(i)+1) );
			}

			ctx.shadowColor = "transparent";
			this.last_ctx = ctx;
			ctx.textAlign = "left";
		},

		onExecute: function()
		{
			var v = this.getInputData(0);
			if(v != null)
				this.properties["value"] = v;
			else
				this.properties["value"] = "";
			this.setDirtyCanvas(true);
		},

		resize: function()
		{
			if(!this.last_ctx) return;

			var lines = this.str.split("\\n");
			this.last_ctx.font = this.properties["fontsize"] + "px " + this.properties["font"];
			var max = 0;
			for(var i in lines)
			{
				var w = this.last_ctx.measureText(lines[i]).width;
				if(max < w) max = w;
			}
			this.size[0] = max + 20;
			this.size[1] = 4 + lines.length * this.properties["fontsize"];

			this.setDirtyCanvas(true);
		},

		onWidget: function(e,widget)
		{
			if(widget.name == "resize")
				this.resize();
			else if (widget.name == "led_text")
			{
				this.properties["font"] = "Digital";
				this.properties["glowSize"] = 4;
				this.setDirtyCanvas(true);
			}
			else if (widget.name == "normal_text")
			{
				this.properties["font"] = "Arial";
				this.setDirtyCanvas(true);
			}
		},

		onPropertyChange: function(name,value)
		{
			this.properties[name] = value;
			this.str = typeof(value) == 'number' ? value.toFixed(3) : value;
			//this.resize();
			return true;
		}
	});

	LiteGraph.registerNodeType("widget/panel", {
		title: "Panel",
		desc: "Non interactive panel",

		widgets: [{name:"update",text:"Update",type:"button"}],
		size: [200,100],
		properties:{borderColor:"#ffffff",bgcolorTop:"#f0f0f0",bgcolorBottom:"#e0e0e0",shadowSize:2, borderRadius:3},

		createGradient: function(ctx)
		{
			if(this.properties["bgcolorTop"] == "" || this.properties["bgcolorBottom"] == "")
			{
				this.lineargradient = 0;
				return;
			}

			this.lineargradient = ctx.createLinearGradient(0,0,0,this.size[1]);  
			this.lineargradient.addColorStop(0,this.properties["bgcolorTop"]);  
			this.lineargradient.addColorStop(1,this.properties["bgcolorBottom"]);
		},

		onDrawBackground: function(ctx)
		{
			if(this.lineargradient == null)
				this.createGradient(ctx);

			if(!this.lineargradient)
				return;

			ctx.lineWidth = 1;
			ctx.strokeStyle = this.properties["borderColor"];
			//ctx.fillStyle = "#ebebeb";
			ctx.fillStyle = this.lineargradient;

			if(this.properties["shadowSize"])
			{
				ctx.shadowColor = "#000";
				ctx.shadowOffsetX = 0;
				ctx.shadowOffsetY = 0;
				ctx.shadowBlur = this.properties["shadowSize"];
			}
			else
				ctx.shadowColor = "transparent";

			ctx.roundRect(0,0,this.size[0]-1,this.size[1]-1,this.properties["shadowSize"]);
			ctx.fill();
			ctx.shadowColor = "transparent";
			ctx.stroke();
		},

		onWidget: function(e,widget)
		{
			if(widget.name == "update")
			{
				this.lineargradient = null;
				this.setDirtyCanvas(true);
			}
		}
	});

LiteGraph.registerNodeType("color/palette",{
		title: "Palette",
		desc: "Generates a color",

		inputs: [["f","number"]],
		outputs: [["Color","color"]],
		properties: {colorA:"#444444",colorB:"#44AAFF",colorC:"#44FFAA",colorD:"#FFFFFF"},

		onExecute: function()
		{
			var c = [];

			if (this.properties.colorA != null)
				c.push( hex2num( this.properties.colorA ) );
			if (this.properties.colorB != null)
				c.push( hex2num( this.properties.colorB ) );
			if (this.properties.colorC != null)
				c.push( hex2num( this.properties.colorC ) );
			if (this.properties.colorD != null)
				c.push( hex2num( this.properties.colorD ) );

			var f = this.getInputData(0);
			if(f == null) f = 0.5;
			if (f > 1.0)
				f = 1.0;
			else if (f < 0.0)
				f = 0.0;

			if(c.length == 0)
				return;

			var result = [0,0,0];
			if(f == 0)
				result = c[0];
			else if(f == 1)
				result = c[ c.length - 1];
			else
			{
				var pos = (c.length - 1)* f;
				var c1 = c[ Math.floor(pos) ];
				var c2 = c[ Math.floor(pos)+1 ];
				var t = pos - Math.floor(pos);
				result[0] = c1[0] * (1-t) + c2[0] * (t);
				result[1] = c1[1] * (1-t) + c2[1] * (t);
				result[2] = c1[2] * (1-t) + c2[2] * (t);
			}

			/*
			c[0] = 1.0 - Math.abs( Math.sin( 0.1 * reModular.getTime() * Math.PI) );
			c[1] = Math.abs( Math.sin( 0.07 * reModular.getTime() * Math.PI) );
			c[2] = Math.abs( Math.sin( 0.01 * reModular.getTime() * Math.PI) );
			*/

			for(var i in result)
				result[i] /= 255;
			
			this.boxcolor = colorToString(result);
			this.setOutputData(0, result);
		}
	});

LiteGraph.registerNodeType("graphics/frame", {
		title: "Frame",
		desc: "Frame viewerew",

		inputs: [["","image"]],
		size: [200,200],
		widgets: [{name:"resize",text:"Resize box",type:"button"},{name:"view",text:"View Image",type:"button"}],

		onDrawBackground: function(ctx)
		{
			if(this.frame)
				ctx.drawImage(this.frame, 0,0,this.size[0],this.size[1]);
		},

		onExecute: function()
		{
			this.frame = this.getInputData(0);
			this.setDirtyCanvas(true);
		},

		onWidget: function(e,widget)
		{
			if(widget.name == "resize" && this.frame)
			{
				var width = this.frame.width;
				var height = this.frame.height;

				if(!width && this.frame.videoWidth != null )
				{
					width = this.frame.videoWidth;
					height = this.frame.videoHeight;
				}

				if(width && height)
					this.size = [width, height];
				this.setDirtyCanvas(true,true);
			}
			else if(widget.name == "view")
				this.show();
		},

		show: function()
		{
			//var str = this.canvas.toDataURL("image/png");
			if(showElement && this.frame)
				showElement(this.frame);
		}
	});

LiteGraph.registerNodeType("visualization/graph", {
		desc: "Shows a graph of the inputs",

		inputs: [["",0],["",0],["",0],["",0]],
		size: [200,200],
		properties: {min:-1,max:1,bgColor:"#000"},
		onDrawBackground: function(ctx)
		{
			/*
			ctx.save();
			ctx.beginPath();
			ctx.rect(2,2,this.size[0] - 4, this.size[1]-4);
			ctx.clip();
			//*/

			var colors = ["#FFF","#FAA","#AFA","#AAF"];

			if(this.properties.bgColor != null && this.properties.bgColor != "")
			{
				ctx.fillStyle="#000";
				ctx.fillRect(2,2,this.size[0] - 4, this.size[1]-4);
			}

			if(this.data)
			{
				var min = this.properties["min"];
				var max = this.properties["max"];

				for(var i in this.data)
				{
					var data = this.data[i];
					if(!data) continue;

					if(this.getInputInfo(i) == null) continue;

					ctx.strokeStyle = colors[i];
					ctx.beginPath();

					var d = data.length / this.size[0];
					for(var j = 0; j < data.length; j += d)
					{
						var value = data[ Math.floor(j) ];
						value = (value - min) / (max - min);
						if (value > 1.0) value = 1.0;
						else if(value < 0) value = 0;

						if(j == 0)
							ctx.moveTo( j / d, (this.size[1] - 5) - (this.size[1] - 10) * value);
						else
							ctx.lineTo( j / d, (this.size[1] - 5) - (this.size[1] - 10) * value);
					}

					ctx.stroke();
				}
			}
			//*/

			//ctx.restore();
		},

		onExecute: function()
		{
			if(!this.data) this.data = [];

			for(var i in this.inputs)
			{
				var value = this.getInputData(i);

				if(typeof(value) == "number")
				{
					value = value ? value : 0;
					if(!this.data[i])
						this.data[i] = [];
					this.data[i].push(value);

					if(this.data[i].length > (this.size[1] - 4))
						this.data[i] = this.data[i].slice(1,this.data[i].length);
				}
				else
					this.data[i] = value;
			}

			if(this.data.length)
				this.setDirtyCanvas(true);
		}
	});

LiteGraph.registerNodeType("graphics/supergraph", {
		title: "Supergraph",
		desc: "Shows a nice circular graph",

		inputs: [["x","number"],["y","number"],["c","color"]],
		outputs: [["","image"]],
		widgets: [{name:"clear_alpha",text:"Clear Alpha",type:"minibutton"},{name:"clear_color",text:"Clear color",type:"minibutton"}],
		properties: {size:256,bgcolor:"#000",lineWidth:1},
		bgcolor: "#000",
		flags: {allow_fastrender:true},
		onLoad: function()
		{
			this.createCanvas();
		},
		
		createCanvas: function()
		{
			this.canvas = document.createElement("canvas");
			this.canvas.width = this.properties["size"];
			this.canvas.height = this.properties["size"];
			this.oldpos = null;
			this.clearCanvas(true);
		},

		onExecute: function()
		{
			var x = this.getInputData(0);
			var y = this.getInputData(1);
			var c = this.getInputData(2);

			if(x == null && y == null) return;

			if(!x) x = 0;
			if(!y) y = 0;
			x*= 0.95;
			y*= 0.95;

			var size = this.properties["size"];
			if(size != this.canvas.width || size != this.canvas.height)
				this.createCanvas();

			if (!this.oldpos)
			{
				this.oldpos = [ (x * 0.5 + 0.5) * size, (y*0.5 + 0.5) * size];
				return;
			}

			var ctx = this.canvas.getContext("2d");

			if(c == null)
				c = "rgba(255,255,255,0.5)";
			else if(typeof(c) == "object")  //array
				c = colorToString(c);

			//stroke line
			ctx.strokeStyle = c;
			ctx.beginPath();
			ctx.moveTo( this.oldpos[0], this.oldpos[1] );
			this.oldpos = [ (x * 0.5 + 0.5) * size, (y*0.5 + 0.5) * size];
			ctx.lineTo( this.oldpos[0], this.oldpos[1] );
			ctx.stroke();

			this.canvas.dirty = true;
			this.setOutputData(0,this.canvas);
		},

		clearCanvas: function(alpha)
		{
			var ctx = this.canvas.getContext("2d");
			if(alpha)
			{
				ctx.clearRect(0,0,this.canvas.width,this.canvas.height);
				this.trace("Clearing alpha");
			}
			else
			{
				ctx.fillStyle = this.properties["bgcolor"];
				ctx.fillRect(0,0,this.canvas.width,this.canvas.height);
			}
		},
		
		onWidget: function(e,widget)
		{
			if(widget.name == "clear_color")
			{
				this.clearCanvas(false);
			}
			else if(widget.name == "clear_alpha")
			{
				this.clearCanvas(true);
			}
		},

		onPropertyChange: function(name,value)
		{
			if(name == "size")
			{
				this.properties["size"] = parseInt(value);
				this.createCanvas();
			}
			else if(name == "bgcolor")
			{
				this.properties["bgcolor"] = value;
				this.createCanvas();
			}
			else if(name == "lineWidth")
			{
				this.properties["lineWidth"] = parseInt(value);
				this.canvas.getContext("2d").lineWidth = this.properties["lineWidth"];
			}
			else
				return false;
				
			return true;
		}
	});


LiteGraph.registerNodeType("graphics/imagefade", {
		title: "Image fade",
		desc: "Fades between images",

		inputs: [["img1","image"],["img2","image"],["fade","number"]],
		outputs: [["","image"]],
		properties: {fade:0.5,width:512,height:512},
		widgets: [{name:"resizeA",text:"Resize to A",type:"button"},{name:"resizeB",text:"Resize to B",type:"button"}],

		onLoad: function()
		{
			this.createCanvas();
			var ctx = this.canvas.getContext("2d");
			ctx.fillStyle = "#000";
			ctx.fillRect(0,0,this.properties["width"],this.properties["height"]);
		},
		
		createCanvas: function()
		{
			this.canvas = document.createElement("canvas");
			this.canvas.width = this.properties["width"];
			this.canvas.height = this.properties["height"];
		},

		onExecute: function()
		{
			var ctx = this.canvas.getContext("2d");
			this.canvas.width = this.canvas.width;

			var A = this.getInputData(0);
			if (A != null)
			{
				ctx.drawImage(A,0,0,this.canvas.width, this.canvas.height);
			}

			var fade = this.getInputData(2);
			if(fade == null)
				fade = this.properties["fade"];
			else
				this.properties["fade"] = fade;

			ctx.globalAlpha = fade;
			var B = this.getInputData(1);
			if (B != null)
			{
				ctx.drawImage(B,0,0,this.canvas.width, this.canvas.height);
			}
			ctx.globalAlpha = 1.0;

			this.setOutputData(0,this.canvas);
			this.setDirtyCanvas(true);
		}
	});

LiteGraph.registerNodeType("graphics/image", {
		title: "Image",
		desc: "Image loader",

		inputs: [],
		outputs: [["frame","image"]],
		properties: {"url":""},
		widgets: [{name:"load",text:"Load",type:"button"}],

		onLoad: function()
		{
			if(this.properties["url"] != "" && this.img == null)
			{
				this.loadImage(this.properties["url"]);
			}
		},

		onStart: function()
		{
		},

		onExecute: function()
		{
			if(!this.img)
				this.boxcolor = "#000";
			if(this.img && this.img.width)
				this.setOutputData(0,this.img);
			else
				this.setOutputData(0,null);
			if(this.img.dirty)
				this.img.dirty = false;
		},

		onPropertyChange: function(name,value)
		{
			this.properties[name] = value;
			if (name == "url" && value != "")
				this.loadImage(value);

			return true;
		},

		loadImage: function(url)
		{
			if(url == "")
			{
				this.img = null;
				return;
			}

			this.trace("loading image...");
			this.img = document.createElement("img");
			this.img.src = "miniproxy.php?url=" + url;
			this.boxcolor = "#F95";
			var that = this;
			this.img.onload = function()
			{
				that.trace("Image loaded, size: " + that.img.width + "x" + that.img.height );
				this.dirty = true;
				that.boxcolor = "#9F9";
				that.setDirtyCanvas(true);
			}
		},

		onWidget: function(e,widget)
		{
			if(widget.name == "load")
			{
				this.loadImage(this.properties["url"]);
			}
		}
	});

LiteGraph.registerNodeType("graphics/cropImage", {
		title: "Crop",
		desc: "Crop Image",

		inputs: [["","image"]],
		outputs: [["","image"]],
		properties: {width:256,height:256,x:0,y:0,scale:1.0 },
		size: [50,20],

		onLoad: function()
		{
			this.createCanvas();
		},
		
		createCanvas: function()
		{
			this.canvas = document.createElement("canvas");
			this.canvas.width = this.properties["width"];
			this.canvas.height = this.properties["height"];
		},

		onExecute: function()
		{
			var input = this.getInputData(0);
			if(!input) return;

			if(input.width)
			{
				var ctx = this.canvas.getContext("2d");

				ctx.drawImage(input, -this.properties["x"],-this.properties["y"], input.width * this.properties["scale"], input.height * this.properties["scale"]);
				this.setOutputData(0,this.canvas);
			}
			else
				this.setOutputData(0,null);
		},

		onPropertyChange: function(name,value)
		{
			this.properties[name] = value;

			if(name == "scale")
			{
				this.properties[name] = parseFloat(value);
				if(this.properties[name] == 0)
				{
					this.trace("Error in scale");
					this.properties[name] = 1.0;
				}
			}
			else
				this.properties[name] = parseInt(value);

			this.createCanvas();

			return true;
		}
	});


LiteGraph.registerNodeType("graphics/video", {
		title: "Video",
		desc: "Video playback",

		inputs: [["t","number"]],
		outputs: [["frame","image"],["t","number"],["d","number"]],
		properties: {"url":""},
		widgets: [{name:"play",text:"PLAY",type:"minibutton"},{name:"stop",text:"STOP",type:"minibutton"},{name:"demo",text:"Demo video",type:"button"},{name:"mute",text:"Mute video",type:"button"}],

		onClick: function(e)
		{
			if(!this.video) return;

			//press play
			if( distance( [e.canvasX,e.canvasY], [ this.pos[0] + 55, this.pos[1] + 40] ) < 20 )
			{
				this.play();
				return true;
			}
		},

		onKeyDown: function(e)
		{
			if(e.keyCode == 32)
				this.playPause();
		},

		onLoad: function()
		{
			if(this.properties.url != "")
				this.loadVideo(this.properties.url);
		},

		play: function()
		{
			if(this.video)
			{
				this.trace("Video playing");
				this.video.play();
			}
		},

		playPause: function()
		{
			if(this.video)
			{
				if(this.video.paused)
					this.play();
				else
					this.pause();
			}
		},

		stop: function()
		{
			if(this.video)
			{
				this.trace("Video stopped");
				this.video.pause();
				this.video.currentTime = 0;
			}
		},

		pause: function()
		{
			if(this.video)
			{
				this.trace("Video paused");
				this.video.pause();
			}
		},

		onExecute: function()
		{
			if(!this.video)
				return;

			var t = this.getInputData(0);
			if(t && t >= 0 && t <= 1.0)
			{
				this.video.currentTime = t * this.video.duration;
				this.video.pause();
			}

			this.video.dirty = true;
			this.setOutputData(0,this.video);
			this.setOutputData(1,this.video.currentTime);
			this.setOutputData(2,this.video.duration);
			this.setDirtyCanvas(true);
		},

		onStart: function()
		{
			//this.play();
		},

		onStop: function()
		{
			this.pause();
		},

		loadVideo: function(url)
		{
			this.video = document.createElement("video");
			if(url)
				this.video.src = url;
			else
			{
				this.video.src = "modules/data/video.webm";
				this.properties.url = this.video.src;
			}
			this.video.type = "type=video/mp4";
			//this.video.loop = true; //not work in FF
			this.video.muted = true;
			this.video.autoplay = false;

			//if(reModular.status == "running") this.play();

			var that = this;
			this.video.addEventListener("loadedmetadata",function(e) {
				//onload
				that.trace("Duration: " + that.video.duration + " seconds");
				that.trace("Size: " + that.video.videoWidth + "," + that.video.videoHeight);
				that.setDirtyCanvas(true);
				this.width = this.videoWidth;
				this.height = this.videoHeight;
			});
			this.video.addEventListener("progress",function(e) {
				//onload
				//that.trace("loading...");
			});
			this.video.addEventListener("error",function(e) {
				that.trace("Error loading video: " + this.src);
				if (this.error) {
				 switch (this.error.code) {
				   case this.error.MEDIA_ERR_ABORTED:
					  that.trace("You stopped the video.");
					  break;
				   case this.error.MEDIA_ERR_NETWORK:
					  that.trace("Network error - please try again later.");
					  break;
				   case this.error.MEDIA_ERR_DECODE:
					  that.trace("Video is broken..");
					  break;
				   case this.error.MEDIA_ERR_SRC_NOT_SUPPORTED:
					  that.trace("Sorry, your browser can't play this video.");
					  break;
				 }
				}
			});

			this.video.addEventListener("ended",function(e) {
				that.trace("Ended.");
				this.play();
			});

			//$("body").append(this.video);
		},

		onPropertyChange: function(name,value)
		{
			this.properties[name] = value;
			if (name == "url" && value != "")
				this.loadVideo(value);

			return true;
		},
		onWidget: function(e,widget)
		{
			if(widget.name == "demo")
			{
				this.loadVideo();
			}
			else if(widget.name == "play")
			{
				if(this.video)
					this.playPause();
			}
			if(widget.name == "stop")
			{
				this.stop();
			}
			else if(widget.name == "mute")
			{
				if(this.video)
					this.video.muted = !this.video.muted;
			}

		}
	});

