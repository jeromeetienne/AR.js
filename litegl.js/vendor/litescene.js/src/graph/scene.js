if(typeof(LiteGraph) != "undefined")
{
	/* Scene LNodes ***********************/

	global.LGraphScene = function()
	{
		this.addOutput("Time","number");
		this._scene = null;
	}


	LGraphScene.title = "Scene";
	LGraphScene.desc = "Scene";

	LGraphScene.getComponents = function(node, result)
	{
		result = result || [];
		var compos = node.getComponents();
		if(!compos)
			return result;

		for(var i = 0; i < compos.length; ++i)
		{
			var name = LS.getClassName( compos[i].constructor );
			result.push( [name, name] );
		}

		return result;
	}

	LGraphScene.prototype.onAdded = function( graph )
	{
		this.bindEvents( this.graph.getScene() );
	}

	LGraphScene.prototype.onRemoved = function()
	{
		this.bindEvents( null );
	}

	LGraphScene.prototype.onConnectionsChange = function()
	{
		this.bindEvents( this.graph.getScene() );
	}

	//bind events attached to this component
	LGraphScene.prototype.bindEvents = function( scene )
	{
		if(this._scene)
			LEvent.unbindAll( this._scene, this );

		this._scene = scene;
		if( !this._scene )
			return;
		
		//iterate outputs
		if(this.outputs && this.outputs.length)
			for(var i = 0; i < this.outputs.length; ++i )
			{
				var output = this.outputs[i];
				if( output.type !== LiteGraph.EVENT )
					continue;
				var event_name = output.name.substr(3);
				LEvent.bind( this._scene, event_name, this.onEvent, this );
			}
	}

	LGraphScene.prototype.onEvent = function( event_name, params )
	{
		this.trigger( "on_" + event_name, params );
	}

	LGraphScene.prototype.onExecute = function()
	{
		var scene = this.graph.getScene();

		//read inputs
		if(this.inputs)
		for(var i = 0; i < this.inputs.length; ++i)
		{
			var input = this.inputs[i]; //??
			var v = this.getInputData(i);
			if(v === undefined)
				continue;
		}

		//write outputs
		if(this.outputs)
		for(var i = 0; i < this.outputs.length; ++i)
		{
			var output = this.outputs[i];
			if(!output.links || !output.links.length || output.type == LiteGraph.EVENT )
				continue;
			var result = null;
			switch( output.name )
			{
				case "Time": result = scene.getTime(); break;
				case "Elapsed": result = (scene._last_dt != null ? scene._last_dt : 0); break;
				case "Frame": result = (scene._frame != null ? scene._frame : 0); break;
				default:
					result = scene.root.getComponent(output.name);
			}
			this.setOutputData(i,result);
		}
	}

	LGraphScene.prototype.onGetOutputs = function()
	{
		var r = [["Elapsed","number"],["Frame","number"],["on_start",LiteGraph.EVENT],["on_finish",LiteGraph.EVENT]];
		return LGraphScene.getComponents( this.graph.getScene().root, r);
	}

	LiteGraph.registerNodeType("scene/scene", LGraphScene );

	//********************************************************

	global.LGraphSceneNode = function()
	{
		this.properties = {node_id:""};
		this.size = [100,20];

		this.addInput("node_id", "string", { locked: true });

		this._node = null;
	}

	LGraphSceneNode.title = "SceneNode";
	LGraphSceneNode.desc = "Node on the scene";

	LGraphSceneNode.prototype.onRemoved = function()
	{
		if(this._node)
			this.bindNodeEvents(null);
	}

	LGraphSceneNode.prototype.onConnectionsChange = function()
	{
		this.bindNodeEvents( this._component );
	}

	LGraphSceneNode.prototype.getNode = function()
	{
		var node_id = null;

		//first check input
		if(this.inputs && this.inputs[0])
			node_id = this.getInputData(0);
		if(node_id)
			this.properties.node_id = node_id;

		//then check properties
		if(	!node_id && this.properties.node_id )
			node_id = this.properties.node_id;

		//get node from scene
		var scene = this.graph.getScene();
		if(!scene)
			return;

		var node = null;
		if(node_id)
			node = scene.getNode( node_id );

		//hook events
		if(this._node != node)
			this.bindNodeEvents(node);

		return node;
	}

	LGraphSceneNode.prototype.onExecute = function()
	{
		var node = this.getNode();
		if(!node)
			return;

		//read inputs
		if(this.inputs) //there must be inputs always but just in case
		{
			for(var i = 1; i < this.inputs.length; ++i)
			{
				var input = this.inputs[i];
				if( input.type === LiteGraph.ACTION )
					continue;
				var v = this.getInputData(i);
				if(v === undefined)
					continue;
				switch( input.name )
				{
					case "Transform": node.transform.copyFrom(v); break;
					case "Material": node.material = v;	break;
					case "Visible": node.flags.visible = v; break;
					default:

						break;
				}
			}
		}

		//write outputs
		if(this.outputs)
		for(var i = 0; i < this.outputs.length; ++i)
		{
			var output = this.outputs[i];
			if(!output.links || !output.links.length || output.type == LiteGraph.EVENT )
				continue;
			switch( output.name )
			{
				case "SceneNode": this.setOutputData( i, node ); break;
				case "Material": this.setOutputData( i, node.getMaterial() ); break;
				case "Transform": this.setOutputData( i, node.transform ); break;
				case "Mesh": this.setOutputData(i, node.getMesh()); break;
				case "Visible": this.setOutputData(i, node.flags.visible ); break;
				default:
					//this must be refactored
					var compo = node.getComponentByUId( output.name );
					if(!compo)
					{
						//SPECIAL CASE: maybe the node id changed so the output.name contains the uid of another node, in that case replace it
						var old_compo = node.scene.findComponentByUId( output.name );
						if(old_compo)
						{
							var class_name = LS.getObjectClassName( old_compo );
							compo = node.getComponent( class_name );
							if( compo )
								output.name = compo.uid; //replace the uid
						}
					}

					this.setOutputData(i, compo );
					break;
			}
		}
	}

	LGraphSceneNode.prototype.getComponents = function(result)
	{
		result = result || [];
		var node = this.getNode();
		if(!node)
			return result;
		var compos = node.getComponents();
		if(!compos)
			return result;

		for(var i = 0; i < compos.length; ++i)
		{
			var name = LS.getClassName( compos[i].constructor );
			result.push( [ compos[i].uid, name, { label: name } ] );
		}

		return result;
	}

	LGraphSceneNode.prototype.onDropItem = function( event )
	{
		var node_id = event.dataTransfer.getData("node_uid");
		if(!node_id)
			return;
		this.properties.node_id = node_id;
		this.onExecute();
		return true;
	}

	LGraphSceneNode.prototype.onPropertyChanged = function(name,value)
	{
		if(name == "node_id")
			this.getNode(); //updates this._node and binds events
	}

	//bind events attached to this component
	LGraphSceneNode.prototype.bindNodeEvents = function( node )
	{
		if(this._node)
			LEvent.unbindAll( this._node, this );

		this._node = node;
		if( !this._node )
			return;
		
		//iterate outputs
		if(this.outputs && this.outputs.length)
			for(var i = 0; i < this.outputs.length; ++i )
			{
				var output = this.outputs[i];
				if( output.type !== LiteGraph.EVENT )
					continue;
				var event_name = output.name.substr(3);
				LEvent.bind( this._node, event_name, this.onNodeEvent, this );
			}
	}

	LGraphSceneNode.prototype.onNodeEvent = function( e, params )
	{
		//trigger event
		this.trigger( "on_" + e, params );
	}

	LGraphSceneNode.prototype.onGetInputs = function()
	{
		var result = [["Visible","boolean"],["Material","Material"]];
		return this.getComponents(result);
	}

	LGraphSceneNode.prototype.onGetOutputs = function()
	{
		var result = [["SceneNode","SceneNode"],["Visible","boolean"],["Material","Material"],["on_clicked",LiteGraph.EVENT]];
		return this.getComponents(result);
	}

	LiteGraph.registerNodeType("scene/node", LGraphSceneNode );

	//********************************************************

	global.LGraphComponent = function()
	{
		this.properties = {
			node_id: "",
			component_id: ""
		};

		//this.addInput("Component", undefined, { locked: true });

		this._component = null;
	}

	LGraphComponent.title = "Component";
	LGraphComponent.desc = "A component from a node";

	LGraphComponent.prototype.onRemoved = function()
	{
		this.bindComponentEvents(null); //remove binding		
	}

	LGraphComponent.prototype.onConnectionsChange = function( side )
	{
		this.bindComponentEvents( this._component );
	}

	LGraphComponent.prototype.onInit = function()
	{
		var compo = this.getComponent();
		if(!compo)
			return;
		this.processOutputs( compo );
	}

	LGraphComponent.prototype.processOutputs = function( compo )
	{
		if(!this.outputs || !this.outputs.length  )
			return;

		//write outputs
		for(var i = 0; i < this.outputs.length; i++)
		{
			var output = this.outputs[i];
			if( !output.links || !output.links.length || output.type == LiteGraph.EVENT )
				continue;

			if(output.name == "Component")
				this.setOutputData(i, compo );
			else
				this.setOutputData(i, compo[ output.name ] );
		}
	}


	LGraphComponent.prototype.onExecute = function()
	{
		var compo = this.getComponent();
		if(!compo)
			return;

		//read inputs (skip 1, is the component)
		if(this.inputs)
		for(var i = 0; i < this.inputs.length; i++)
		{
			var input = this.inputs[i];
			if( input.type === LiteGraph.ACTION )
				continue;
			var v = this.getInputData(i);
			if(v === undefined)
				continue;
			LS.setObjectProperty( compo, input.name, v );
		}

		//write outputs (done in a function so it can be reused by other methods)
		this.processOutputs( compo );
	}

	LGraphComponent.updateOutputData = function( slot )
	{
		if(!this.outputs || slot >= this.outputs.length  )
			return;

		var output = this.outputs[i];
		if( !output.links || !output.links.length || output.type == LiteGraph.EVENT )
			return;

		var compo = this.getComponent();
		if(!compo)
			return;

		if(output.name == "Component")
			this.setOutputData( slot, compo );
		else
			this.setOutputData( slot, compo[ output.name ] );
	}

	LGraphComponent.prototype.onDrawBackground = function()
	{
		var compo = this.getComponent();
		if(compo)
			this.title = LS.getClassName( compo.constructor );
	}

	LGraphComponent.prototype.onConnectionsChange = function( type, slot, created, link_info, slot_info )
	{
		if(type == LiteGraph.INPUT && slot_info && slot_info.name == "Component" )
		{
			var node = this.getInputNode(slot);
			if(node && node.onExecute)
			{
				node.onExecute();
				this.setDirtyCanvas(true,true);
			}
		}
	}

	LGraphComponent.prototype.getComponent = function()
	{
		var scene = this.graph._scene;
		if(!scene) 
			return null;

		var node_id = this.properties.node_id;
		if(!node_id)
		{
			if( this.inputs && this.inputs.length )
			{
				var slot = this.findInputSlot("Component");
				if(slot != -1)
				{
					var component = this.getInputData(slot);
					return component ? component : null;
				}
			}

			return null;
		}

		//find node
		var node = scene.getNode( node_id );
		if(!node)
			return null;

		//find compo
		var compo_id = this.properties.component_id;
		var compo = null;
		if(compo_id.charAt(0) == "@")
			compo = node.getComponentByUId( compo_id );
		else if( LS.Components[ compo_id ] )
			compo = node.getComponent( LS.Components[ compo_id ] );
		else
			return null;

		if(compo && !compo.constructor.is_component)
			return null;

		if(this._component != compo)
			this.bindComponentEvents( compo );

		this._component = compo;
		return compo;
	}

	//bind events attached to this component
	LGraphComponent.prototype.bindComponentEvents = function( component )
	{
		if(this._component)
			LEvent.unbindAll( this._component, this );

		this._component = component;
		if( !this._component )
			return;
		
		//iterate outputs
		if(this.outputs && this.outputs.length)
			for(var i = 0; i < this.outputs.length; ++i )
			{
				var output = this.outputs[i];
				if( output.type !== LiteGraph.EVENT )
					continue;
				var event_name = output.name.substr(3);
				LEvent.bind( this._component, event_name, this.onComponentEvent, this );
			}
	}

	LGraphComponent.prototype.onComponentEvent = function ( e, params )
	{
		this.trigger( "on_" + e, params );
	}

	LGraphComponent.prototype.getComponentProperties = function( get_inputs, result )
	{
		var compo = this.getComponent();
		if(!compo)
			return null;

		var attrs = null;
		if(compo.getPropertiesInfo)
			attrs = compo.getPropertiesInfo( get_inputs );
		else
			attrs = LS.getObjectProperties( compo );

		result = result || [];
		for(var i in attrs)
			result.push( [i, attrs[i]] );
		return result;
	}

	LGraphComponent.prototype.onAction = function( action_name, params ) { 
		if(!action_name)
			return;
		var compo = this.getComponent();
		if(!compo)
			return;
		if(compo[action_name])
			compo[action_name](); //params will be mostly MouseEvent, so for now I wont pass it
	}

	//used by the LGraphSetValue node
	LGraphComponent.prototype.onSetValue = function( property_name, value ) { 
		var compo = this.getComponent();
		if(!compo)
			return;

		var current = compo[ property_name ];
		var final_value;

		if( current == null)
		{
			if(value && value.constructor === String)
				final_value = value;
		}
		else
		{
			switch( current.constructor )
			{
				case Number: final_value = Number( value ); break;
				case Boolean: final_value = (value == "true" || value == "1"); break;
				case String: final_value = String( value ); break;
				case Array:
				case Float32Array: 
					if( value != null )
					{
						if( value.constructor === String )
							final_value = JSON.parse("["+value+"]");
						else if( value.constructor === Number )
							final_value = [value];
						else
							final_value = value;
					}
					else
						final_value = value;
					break;
			}
		}

		if(final_value === undefined)
			return;

		if(compo.setPropertyValue)
			compo.setPropertyValue( property_name, final_value );
		else
			compo[ property_name ] = final_value;
	}

	LGraphComponent.prototype.onGetInputs = function()
	{ 
		var inputs = [["Node",0],["Component",0],null];

		this.getComponentProperties("input", inputs);

		var compo = this.getComponent();
		if(compo && compo.getEventActions)
		{
			var actions = compo.getEventActions();
			if(actions)
				for(var i in actions)
					inputs.push( [i, LiteGraph.ACTION ] );
		}

		return inputs;
	}

	LGraphComponent.prototype.onGetOutputs = function()
	{ 
		var outputs = [];
		outputs.push( ["Component", "Component" ], null ); //compo + separator

		this.getComponentProperties( "output", outputs);

		var compo = this.getComponent();
		if(compo && compo.getEvents)
		{
			var events = compo.getEvents();
			if(events)
				for(var i in events)
					outputs.push( ["on_" + i, LiteGraph.EVENT ] );
		}
		return outputs;
	}

	LiteGraph.registerNodeType("scene/component", LGraphComponent );
	
	//********************************************************

	/* LGraphNode representing an object in the Scene */

	global.LGraphTransform = function()
	{
		this.properties = {node_id:""};
		if(LGraphSceneNode._current_node_id)
			this.properties.node_id = LGraphSceneNode._current_node_id;
		this.addInput("Transform", "Transform", { locked: true });
		this.addOutput("Position","vec3");
	}

	LGraphTransform.title = "Transform";
	LGraphTransform.desc = "Transform info of a node";

	LGraphTransform.prototype.onExecute = function()
	{
		var transform = null;

		if(this.inputs && this.inputs[0])
			transform = this.getInputData(0);

		if(!transform)
		{
			var scene = this.graph.getScene();
			if(!scene)
				return;

			var node = this._node;
			if(	this.properties.node_id )
			{
				node = scene.getNode( this.properties.node_id );
				if(!node)
					return;
			}

			if(!node)
				node = this.graph._scenenode;

			transform = node.transform;
		}

		if(!transform)
			return;

		//read inputs
		if(this.inputs)
		for(var i = 1; i < this.inputs.length; ++i)
		{
			var input = this.inputs[i];
			var v = this.getInputData(i);
			if(v === undefined)
				continue;
			switch( input.name )
			{
				case "x": transform.x = v; break;
				case "y": transform.y = v; break;
				case "z": transform.z = v; break;
				case "Position": transform.setPosition(v); break;
				case "Rotation": transform.setRotation(v); break;
				case "Scale": transform.setScale(v); break;
				case "Matrix": transform.fromMatrix(v); break;
				case "Translate": transform.translate(v); break;
				case "Translate Global": transform.translateGlobal(v); break;
				case "RotateY": transform.rotateY(v); break;
			}
		}

		//write outputs
		if(this.outputs)
		for(var i = 0; i < this.outputs.length; ++i)
		{
			var output = this.outputs[i];
			if(!output.links || !output.links.length)
				continue;

			var value = undefined;
			switch( output.name )
			{
				case "x": value = transform.x; break;
				case "y": value = transform.y; break;
				case "z": value = transform.z; break;
				case "Position": value = transform.position; break;
				case "Global Position": value = transform.getGlobalPosition(); break;
				case "Rotation": value = transform.rotation; break;
				case "Global Rotation": value = transform.getGlobalRotation(); break;
				case "Scale": value = transform.scaling; break;
				case "Matrix": value = transform.getMatrix(); break;
				default:
					break;
			}

			if(value !== undefined)
				this.setOutputData( i, value );
		}
	}

	LGraphTransform.prototype.onGetInputs = function()
	{
		return [["Position","vec3"],["Rotation","quat"],["Scale","number"],["x","number"],["y","number"],["z","number"],["Global Position","vec3"],["Global Rotation","quat"],["Matrix","mat4"],["Translate","vec3"],["Translate Local","vec3"],["RotateY","number"]];
	}

	LGraphTransform.prototype.onGetOutputs = function()
	{
		return [["Position","vec3"],["Rotation","quat"],["Scale","number"],["x","number"],["y","number"],["z","number"],["Global Position","vec3"],["Global Rotation","quat"],["Matrix","mat4"]];
	}

	LiteGraph.registerNodeType("scene/transform", LGraphTransform );

	//***********************************************************************

	global.LGraphMaterial = function()
	{
		this.properties = {mat_name:""};
		this.addInput("Material","Material");
		this.size = [100,20];
	}

	LGraphMaterial.title = "Material";
	LGraphMaterial.desc = "Material of a node";

	LGraphMaterial.prototype.onExecute = function()
	{
		var mat = this.getMaterial();
		if(!mat)
			return;

		//read inputs
		for(var i = 0; i < this.inputs.length; ++i)
		{
			var input = this.inputs[i];
			var v = this.getInputData(i);
			if(v === undefined)
				continue;

			if(input.name == "Material")
				continue;

			mat.setProperty(input.name, v);

			/*
			switch( input.name )
			{
				case "Alpha": mat.alpha = v; break;
				case "Specular f.": mat.specular_factor = v; break;
				case "Diffuse": vec3.copy(mat.diffuse,v); break;
				case "Ambient": vec3.copy(mat.ambient,v); break;
				case "Emissive": vec3.copy(mat.emissive,v); break;
				case "UVs trans.": mat.uvs_matrix.set(v); break;
				default:
					if(input.name.substr(0,4) == "tex_")
					{
						var channel = input.name.substr(4);
						mat.setTexture(v, channel);
					}
					break;
			}
			*/
		}

		//write outputs
		if(this.outputs)
		for(var i = 0; i < this.outputs.length; ++i)
		{
			var output = this.outputs[i];
			if(!output.links || !output.links.length)
				continue;
			var v = mat.getProperty( output.name );
			/*
			var v;
			switch( output.name )
			{
				case "Material": v = mat; break;
				case "Alpha": v = mat.alpha; break;
				case "Specular f.": v = mat.specular_factor; break;
				case "Diffuse": v = mat.diffuse; break;
				case "Ambient": v = mat.ambient; break;
				case "Emissive": v = mat.emissive; break;
				case "UVs trans.": v = mat.uvs_matrix; break;
				default: continue;
			}
			*/
			this.setOutputData( i, v );
		}

		//this.setOutputData(0, parseFloat( this.properties["value"] ) );
	}

	LGraphMaterial.prototype.getMaterial = function()
	{
		//if it has an input material, use that one
		var slot = this.findInputSlot("Material");
		if( slot != -1)
			return this.getInputData( slot );

		if(	this.properties.mat_name )
			return LS.RM.materials[ this.properties.mat_name ];

		return null;
	}

	LGraphMaterial.prototype.onGetInputs = function()
	{
		var mat = this.getMaterial();
		if(!mat)
			return;
		var o = mat.getPropertiesInfo();
		var results = [["Material","Material"]];
		for(var i in o)
			results.push([i,o[i]]);
		return results;

		/*
		var results = [["Material","Material"],["Alpha","number"],["Specular f.","number"],["Diffuse","color"],["Ambient","color"],["Emissive","color"],["UVs trans.","texmatrix"]];
		for(var i in Material.TEXTURE_CHANNELS)
			results.push(["Tex." + Material.TEXTURE_CHANNELS[i],"Texture"]);
		return results;
		*/
	}

	LGraphMaterial.prototype.onGetOutputs = function()
	{
		var mat = this.getMaterial();
		if(!mat)
			return;
		var o = mat.getPropertiesInfo();
		var results = [["Material","Material"]];
		for(var i in o)
			results.push([i,o[i]]);
		return results;

		/*
		var results = [["Material","Material"],["Alpha","number"],["Specular f.","number"],["Diffuse","color"],["Ambient","color"],["Emissive","color"],["UVs trans.","texmatrix"]];
		for(var i in Material.TEXTURE_CHANNELS)
			results.push(["Tex." + Material.TEXTURE_CHANNELS[i],"Texture"]);
		return results;
		*/
	}

	LiteGraph.registerNodeType("scene/material", LGraphMaterial );
	global.LGraphMaterial = LGraphMaterial;

	//************************************************************
	/*
	global.LGraphLight = function()
	{
		this.properties = {mat_name:""};
		this.addInput("Light","Light");
		this.addOutput("Intensity","number");
		this.addOutput("Color","color");
	}

	LGraphLight.title = "Light";
	LGraphLight.desc = "Light from a scene";

	LGraphLight.prototype.onExecute = function()
	{
		var scene = this.graph.getScene();
		if(!scene)
			return;

		var node = this._node;
		if(	this.properties.node_id )
			node = scene.getNode( this.properties.node_id );

		if(!node)
			node = this.graph._scenenode;

		var light = null;
		if(node) //use light of the node
			light = node.getLight();
		//if it has an input light
		var slot = this.findInputSlot("Light");
		if( slot != -1 )
			light = this.getInputData(slot);
		if(!light)
			return;

		//read inputs
		for(var i = 0; i < this.inputs.length; ++i)
		{
			var input = this.inputs[i];
			var v = this.getInputData(i);
			if(v === undefined)
				continue;

			switch( input.name )
			{
				case "Intensity": light.intensity = v; break;
				case "Color": vec3.copy(light.color,v); break;
				case "Eye": vec3.copy(light.eye,v); break;
				case "Center": vec3.copy(light.center,v); break;
			}
		}

		//write outputs
		for(var i = 0; i < this.outputs.length; ++i)
		{
			var output = this.outputs[i];
			if(!output.links || !output.links.length)
				continue;

			switch( output.name )
			{
				case "Light": this.setOutputData(i, light ); break;
				case "Intensity": this.setOutputData(i, light.intensity ); break;
				case "Color": this.setOutputData(i, light.color ); break;
				case "Eye": this.setOutputData(i, light.eye ); break;
				case "Center": this.setOutputData(i, light.center ); break;
			}
		}
	}

	LGraphLight.prototype.onGetInputs = function()
	{
		return [["Light","Light"],["Intensity","number"],["Color","color"],["Eye","vec3"],["Center","vec3"]];
	}

	LGraphLight.prototype.onGetOutputs = function()
	{
		return [["Light","Light"],["Intensity","number"],["Color","color"],["Eye","vec3"],["Center","vec3"]];
	}

	LiteGraph.registerNodeType("scene/light", LGraphLight );
	*/

	//************************************

	global.LGraphGlobal = function LGraphGlobal()
	{
		this.addOutput("Value");
		this.properties = {name:"myvar", value: 0, type: "number", widget: "default", min:0, max:1 };
	}

	LGraphGlobal.title = "Global";
	LGraphGlobal.desc = "Global var for the graph";
	LGraphGlobal["@type"] = { type:"enum", values:["number","string","node","vec2","vec3","vec4","color","texture"]};
	LGraphGlobal["@widget"] = { type:"enum", values:[ "default", "slider", "pad" ]};

	LGraphGlobal.prototype.onExecute = function()
	{
		if(!this.properties.name)
			return;

		this.setOutputData(0, this.properties.value);
	}

	LGraphGlobal.prototype.onDrawBackground = function()
	{
		var name = this.properties.name;
		this.outputs[0].label = name;
	}

	LiteGraph.registerNodeType("scene/global", LGraphGlobal );

	global.LGraphSceneTime = function()
	{
		this.addOutput("Time","number");
		this._scene = null;
	}


	LGraphSceneTime.title = "Time";
	LGraphSceneTime.desc = "Time";

	LGraphSceneTime.prototype.onExecute = function()
	{
		var scene = this.graph.getScene();
		if(!scene)
			return;

		//read inputs
		if(this.inputs)
		for(var i = 0; i < this.inputs.length; ++i)
		{
			var input = this.inputs[i]; //??
			var v = this.getInputData(i);
			if(v === undefined)
				continue;
		}

		//write outputs
		if(this.outputs)
		for(var i = 0; i < this.outputs.length; ++i)
		{
			var output = this.outputs[i];
			if(!output.links || !output.links.length || output.type == LiteGraph.EVENT )
				continue;
			var result = null;
			switch( output.name )
			{
				case "Time": result = scene.getTime(); break;
				case "Elapsed": result = (scene._last_dt != null ? scene._last_dt : 0); break;
				case "Frame": result = (scene._frame != null ? scene._frame : 0); break;
				default:
					continue;
			}
			this.setOutputData(i,result);
		}
	}

	LGraphSceneTime.prototype.onGetOutputs = function()
	{
		return [["Elapsed","number"],["Time","number"]];
	}

	LiteGraph.registerNodeType("scene/time", LGraphSceneTime );

	//************************************

	global.LGraphLocatorProperty = function LGraphLocatorProperty()
	{
		this.addInput("in");
		this.addOutput("out");
		this.size = [80,20];
		this.properties = {locator:""};
	}

	LGraphLocatorProperty.title = "Property";
	LGraphLocatorProperty.desc = "A property of a node or component of the scene specified by its locator string";

	LGraphLocatorProperty.prototype.getLocatorInfo = function()
	{
		var locator = this.properties.locator;
		if(!this.properties.locator)
			return;
		var scene = this.graph._scene || LS.GlobalScene;
		return this._locator_info = scene.getPropertyInfo( locator );
	}

	LGraphLocatorProperty.prototype.onExecute = function()
	{
		var info = this.getLocatorInfo();

		if(info && info.target)
		{
			this.title = info.name;
			if( this.inputs.length && this.inputs[0].link !== null )
				LSQ.setFromInfo( info, this.getInputData(0) );
			if( this.outputs.length && this.outputs[0].links && this.outputs[0].links.length )
				this.setOutputData( 0, LSQ.getFromInfo( info ));
		}
	}

	LiteGraph.registerNodeType("scene/property", LGraphLocatorProperty );

	//***********************************

	//*
	global.LGraphToggleValue = function()
	{
		this.addInput("target","Component");
		this.addInput("toggle",LiteGraph.ACTION);
		this.properties = {property_name:""};
	}

	LGraphToggleValue.title = "Toggle";
	LGraphToggleValue.desc = "Toggle a property value";

	LGraphToggleValue.prototype.onAction = function( action_name, params ) { 

		var target = this.getInputData(0,true);
		if(!target)
			return;
		var prop_name = this.properties.property_name;
		if( target[ prop_name ] !== undefined )
			target[ prop_name ] = !target[ prop_name ];
	}

	LiteGraph.registerNodeType("scene/toggle", LGraphToggleValue );
	//*/

	//************************************

	global.LGraphFrame = function()
	{
		this.addOutput("Color","Texture");
		this.addOutput("Depth","Texture");
		this.addOutput("Extra","Texture");
		this.addOutput("Camera","Camera");
		this.properties = {};
	}

	LGraphFrame.title = "Frame";
	LGraphFrame.desc = "One frame rendered from the scene renderer";

	LGraphFrame.prototype.onExecute = function()
	{
		this.setOutputData(0, LGraphTexture.getTexture( this._color_texture ) );
		this.setOutputData(1, LGraphTexture.getTexture( this._depth_texture ) );
		this.setOutputData(2, LGraphTexture.getTexture( this._extra_texture ) );
		this.setOutputData(3, this._camera );
	}

	LGraphFrame.prototype.onDrawBackground = function( ctx )
	{
		if( this.flags.collapsed || this.size[1] <= 20 )
			return;

		if(!this._color_texture)
			return;

		if( !ctx.webgl )
			return; //is not working well

		//Different texture? then get it from the GPU
		if(this._last_preview_tex != this._last_tex || !this._last_preview_tex)
		{
			if( ctx.webgl && this._canvas && this._canvas.constructor === GL.Texture )
			{
				this._canvas = this._last_tex;
			}
			else
			{
				var texture = LGraphTexture.getTexture( this._color_texture );
				if(!texture)
					return;

				var tex_canvas = LGraphTexture.generateLowResTexturePreview( texture );
				if(!tex_canvas) 
					return;
				this._last_preview_tex = this._last_tex;
				this._canvas = cloneCanvas( tex_canvas );
			}
		}

		if(!this._canvas)
			return;

		//render to graph canvas
		ctx.save();
		if(!ctx.webgl) //reverse image
		{
			if( this._canvas.constructor === GL.Texture )
			{
				this._canvas = null;
				return;
			}

			ctx.translate( 0,this.size[1] );
			ctx.scale(1,-1);
		}
		ctx.drawImage( this._canvas, 0, 0, this.size[0], this.size[1] );
		ctx.restore();
	}

	LiteGraph.registerNodeType("scene/frame", LGraphFrame );
};

