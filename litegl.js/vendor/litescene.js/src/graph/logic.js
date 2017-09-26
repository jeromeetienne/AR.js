if(typeof(LiteGraph) != "undefined")
{
	//special kind of node
	global.LGraphSetValue = function LGraphSetValue()
	{
		this.properties = { property_name: "", value: "", type: "String" };
		this.addInput("on_set", LiteGraph.ACTION );
		this.addOutput("on", LiteGraph.EVENT ); //to chain
		this.addOutput("node", 0 );
		this.mode = LiteGraph.ON_TRIGGER;
	}

	LGraphSetValue.prototype.onAction = function( action_name, params ) { 
		//is on_set

		if(!this.properties.property_name)
			return;

		//get the connected node
		var nodes = this.getOutputNodes(1);
		if(!nodes)
			return;

		//check for a setValue method
		for(var i = 0; i < nodes.length; ++i)
		{
			var node = nodes[i];
			//call it
			if(node.onSetValue)
				node.onSetValue( this.properties.property_name, this.properties.value );
		}

		this.trigger("on");
	}

	LGraphSetValue.title = "SetValue";
	LGraphSetValue.desc = "sets a value to a node";

	LiteGraph.registerNodeType("logic/setValue", LGraphSetValue );
}



