// Collada.js  https://github.com/jagenjo/collada.js
// Javi Agenjo 2015 
// Specification from https://www.khronos.org/collada/wiki

(function(global){

var isWorker = global.document === undefined;
var DEG2RAD = Math.PI * 2 / 360;

//global temporal variables
var temp_mat4 = null;
var temp_vec2 = null;
var temp_vec3 = null;
var temp_vec4 = null;
var temp_quat = null;

if( isWorker )
{
	global.console = {
		log: function(msg) { 
			var args = Array.prototype.slice.call(arguments, 0);
			self.postMessage({action:"log", params: args});
		},
		warn: function(msg) { 
			var args = Array.prototype.slice.call(arguments, 0);
			self.postMessage({action:"warn", params: args});
		},
		error: function(msg) { 
			var args = Array.prototype.slice.call(arguments, 0);
			self.postMessage({action:"error", params: args});
		}
	};

	global.alert = console.error;
}

//Collada parser
global.Collada = {

	libsPath: "./",
	workerPath: "./",
	no_flip: true,
	use_transferables: true, //for workers
	onerror: null,
	verbose: false,
	config: { forceParser:false },

	init: function (config)
	{
		config = config || {}
		for(var i in config)
			this[i] = config[i];
		this.config = config;

		if( isWorker )
		{
			try
			{
				importScripts( this.libsPath + "gl-matrix-min.js", this.libsPath + "tinyxml.js" );
			}
			catch (err)
			{
				Collada.throwException( Collada.LIBMISSING_ERROR );
			}
		}

		//init glMatrix
		temp_mat4 = mat4.create();
		temp_vec2 = vec3.create();
		temp_vec3 = vec3.create();
		temp_vec4 = vec3.create();
		temp_quat = quat.create();

		if( isWorker )
			console.log("Collada worker ready");
	},

	load: function(url, callback)
	{
		request(url, function(data)
		{
			if(!data)
				callback( null );
			else
				callback( Collada.parse( data ) );
		});
	},

	_xmlroot: null,
	_nodes_by_id: null,
	_transferables: null,
	_controllers_found: null,
	_geometries_found: null,

	safeString: function (str) { 
		if(!str)
			return "";

		if(this.convertID)
			return this.convertID(str);

		return str.replace(/ /g,"_"); 
	},

	LIBMISSING_ERROR: "Libraries loading error, when using workers remember to pass the URL to the tinyxml.js in the options.libsPath",
	NOXMLPARSER_ERROR: "TinyXML not found, when using workers remember to pass the URL to the tinyxml.js in the options.libsPath (Workers do not allow to access the native XML DOMParser)",
	throwException: function(msg)
	{
		if(isWorker)
			self.postMessage({action:"exception", msg: msg});
		else
			if(Collada.onerror)
				Collada.onerror(msg);
		throw(msg);
	},

	getFilename: function(filename)
	{
		var pos = filename.lastIndexOf("\\");
		if(pos != -1)
			filename = filename.substr(pos+1);
		//strip unix slashes
		pos = filename.lastIndexOf("/");
		if(pos != -1)
			filename = filename.substr(pos+1);
		return filename;
	},

	last_name: 0,

	generateName: function(v)
	{
		v = v || "name_";
		var name = v + this.last_name;
		this.last_name++;
		return name;
	},

	parse: function(data, options, filename)
	{
		options = options || {};
		filename = filename || "_dae_" + Date.now() + ".dae";

		//console.log("Parsing collada");
		var flip = false;

		var xmlparser = null;
		var root = null;
		this._transferables = [];
		
		if(this.verbose)
			console.log(" - XML parsing...");

		if(global["DOMParser"] && !this.config.forceParser )
		{
			xmlparser = new DOMParser();
			root = xmlparser.parseFromString(data,"text/xml");
			if(this.verbose)
				console.log(" - XML parsed");			
		}
		else //USING JS XML PARSER IMPLEMENTATION (much slower)
		{
			if(!global["DOMImplementation"] )
				return Collada.throwException( Collada.NOXMLPARSER_ERROR );
			//use tinyxmlparser
			try
			{
				xmlparser = new DOMImplementation();
			}
			catch (err)
			{
				return Collada.throwException( Collada.NOXMLPARSER_ERROR );
			}

			root = xmlparser.loadXML(data);
			if(this.verbose)
				console.log(" - XML parsed");

			//for every node...
			var by_ids = root._nodes_by_id = {};
			for(var i = 0, l = root.all.length; i < l; ++i)
			{
				var node = root.all[i];
				by_ids[ node.id ] = node;
				if(node.getAttribute("sid"))
					by_ids[ node.getAttribute("sid") ] = node;
			}

			if(!this.extra_functions)
			{
				this.extra_functions = true;
				//these methods are missing so here is a lousy implementation
				DOMDocument.prototype.querySelector = DOMElement.prototype.querySelector = function(selector)
				{
					var tags = selector.split(" ");
					var current_element = this;

					while(tags.length)
					{
						var current = tags.shift();
						var tokens = current.split("#");
						var tagname = tokens[0];
						var id = tokens[1];
						var elements = tagname ? current_element.getElementsByTagName(tagname) : current_element.childNodes;
						if(!id) //no id filter
						{
							if(tags.length == 0)
								return elements.item(0);
							current_element = elements.item(0);
							continue;
						}

						//has id? check for all to see if one matches the id
						for(var i = 0; i < elements.length; i++)
							if( elements.item(i).getAttribute("id") == id)
							{
								if(tags.length == 0)
									return elements.item(i);
								current_element = elements.item(i);
								break;
							}
					}
					return null;
				}

				DOMDocument.prototype.querySelectorAll = DOMElement.prototype.querySelectorAll = function( selector )
				{
					var tags = selector.split(" ");
					if(tags.length == 1)
						return this.getElementsByTagName( selector );

					var current_element = this;
					var result = [];

					inner(this, tags);

					function inner(root, tags )
					{
						if(!tags)
							return;

						var current = tags.shift();
						var elements = root.getElementsByTagName( current );
						if(tags.length == 0)
						{
							for(var i = 0; i < elements.length; i++)
								result.push( elements.item(i) );
							return;
						}

						for(var i = 0; i < elements.length; i++)
							inner( elements.item(i), tags.concat() );
					}

					var list = new DOMNodeList(this.documentElement);
					list._nodes = result;
					list.length = result.length;

					return list;
				}

				Object.defineProperty( DOMElement.prototype, "textContent", { 
					get: function() { 
						var nodes = this.getChildNodes();
						return nodes.item(0).toString(); 
					},
					set: function() {} 
				});
			}
		}
		this._xmlroot = root;
		var xmlcollada = root.querySelector("COLLADA");
		if(xmlcollada)
		{
			this._current_DAE_version = xmlcollada.getAttribute("version");
			console.log("DAE Version:" + this._current_DAE_version);
		}

		//var xmlvisual_scene = root.querySelector("visual_scene");
		var xmlvisual_scene = root.getElementsByTagName("visual_scene").item(0);
		if(!xmlvisual_scene)
			throw("visual_scene XML node not found in DAE");

		//hack to avoid problems with bones with spaces in names
		this._nodes_by_id = {}; //clear
		this._controllers_found = {};//we need to check what controllers had been found, in case we miss one at the end
		this._geometries_found = {};

		//Create a scene tree
		var scene = { 
			object_class:"SceneTree", 
			light: null,
			materials: {},
			meshes: {},
			resources: {}, //used to store animation tracks
			root:{ children:[] },
			external_files: {} //store info about external files mentioned in this 
		};

		//scene metadata (like author, tool, up vector, dates, etc)
		var xmlasset = root.getElementsByTagName("asset")[0];
		if(xmlasset)
			scene.metadata = this.readAsset( xmlasset );

		//parse nodes tree to extract names and ierarchy only
		var xmlnodes = xmlvisual_scene.childNodes;
		for(var i = 0; i < xmlnodes.length; i++)
		{
			if(xmlnodes.item(i).localName != "node")
				continue;

			var node = this.readNodeTree( xmlnodes.item(i), scene, 0, flip );
			if(node)
				scene.root.children.push(node);
		}

		//parse nodes content (two steps so we have first all the scene tree info)
		for(var i = 0; i < xmlnodes.length; i++)
		{
			if(xmlnodes.item(i).localName != "node")
				continue;
			this.readNodeInfo( xmlnodes.item(i), scene, 0, flip );
		}

		//read remaining controllers (in some cases some controllers are not linked from the nodes or the geometries)
		this.readLibraryControllers( scene );

		//read animations
		var animations = this.readAnimations(root, scene);
		if(animations)
		{
			var animations_name = "#animations_" + filename.substr(0,filename.indexOf("."));
			scene.resources[ animations_name ] = animations;
			scene.root.animations = animations_name;
		}

		//read external files (images)
		scene.images = this.readImages(root);

		//clear memory
		this._nodes_by_id = {};
		this._controllers_found = {};
		this._geometries_found = {};
		this._xmlroot = null;

		//console.log(scene);
		return scene;
	},

	/* Collect node ids, in case there is bones (with spaces in name) I need to know the nodenames in advance */
	/*
	readAllNodeNames: function(xmlnode)
	{
		var node_id = this.safeString( xmlnode.getAttribute("id") );
		if(node_id)
			this._nodes_by_id[node_id] = true; //node found
		//nodes seem to have to possible ids, id and sid, I guess one is unique, the other user-defined
		var node_sid = this.safeString( xmlnode.getAttribute("sid") );
		if(node_sid)
			this._nodes_by_id[node_sid] = true; //node found


		for( var i = 0; i < xmlnode.childNodes.length; i++ )
		{
			var xmlchild = xmlnode.childNodes.item(i);

			//children
			if(xmlchild.localName != "node")
				continue;
			this.readAllNodeNames(xmlchild);
		}
	},
		*/

	readAsset: function( xmlasset )
	{
		var metadata = {};

		for( var i = 0; i < xmlasset.childNodes.length; i++ )
		{
			var xmlchild = xmlasset.childNodes.item(i);
			if(xmlchild.nodeType != 1 ) //not tag
				continue;
			switch( xmlchild.localName )
			{
				case "contributor": 
					var tool = xmlchild.querySelector("authoring_tool");
					if(tool)
						metadata["authoring_tool"] = tool.textContext;
					break;
				case "unit": metadata["unit"] = xmlchild.getAttribute("name"); break;
				default:
					metadata[ xmlchild.localName ] = xmlchild.textContent; break;
			}
		}

		return metadata;
	},

	readNodeTree: function(xmlnode, scene, level, flip)
	{
		var node_id = this.safeString( xmlnode.getAttribute("id") );
		var node_sid = this.safeString( xmlnode.getAttribute("sid") );
		var node_name = this.safeString( xmlnode.getAttribute("name") );

		var unique_name = node_id || node_sid || node_name;

		if(!unique_name)
		{
			console.warn("Collada: node without name or id, skipping it");
			return null;
		}

		//here we create the node
		var node = { 
			name: node_name,
			id: unique_name, 
			children:[], 
			_depth: level 
		};

		var node_type = xmlnode.getAttribute("type");
		if(node_type)
			node.type = node_type;

		this._nodes_by_id[ unique_name ] = node;
		if( node_id )
			this._nodes_by_id[ node_id ] = node;
		if( node_sid )
			this._nodes_by_id[ node_sid ] = node;

		//transform
		node.model = this.readTransform(xmlnode, level, flip );

		//node elements
		for( var i = 0; i < xmlnode.childNodes.length; i++ )
		{
			var xmlchild = xmlnode.childNodes.item(i);
			if(xmlchild.nodeType != 1 ) //not tag
				continue;

			//children
			if(xmlchild.localName == "node")
			{
				var child_node = this.readNodeTree(xmlchild, scene, level+1, flip);
				if(child_node)
					node.children.push( child_node );
				continue;
			}
		}

		return node;
	},

	readNodeInfo: function( xmlnode, scene, level, flip, parent )
	{
		var node_id = this.safeString( xmlnode.getAttribute("id") );
		var node_sid = this.safeString( xmlnode.getAttribute("sid") );
		var node_name = this.safeString( xmlnode.getAttribute("name") );

		var unique_name = node_id || node_sid || node_name;

		/*
		if(!node_id && !node_sid)
		{
			console.warn("Collada: node without id, creating a random one");
			node_id = this.generateName("node_");
			return null;
		}
		*/

		var node;
		if(!unique_name) {
			//if there is no id, then either all of this node's properties 
			//should be assigned directly to its parent node, or the node doesn't
			//have a parent node, in which case its a light or something. 
			//So we get the parent by its id, and if there is no parent, we return null
			if (parent)
				node = this._nodes_by_id[ parent.id || parent.sid || parent.name ];
			else 
			{
				console.warn("Collada: node without name or id, skipping it");
				return null;
			}
		} 
		else
			node = this._nodes_by_id[ unique_name ];

		if(!node)
		{
			console.warn("Collada: Node not found by id: " + (node_id || node_sid));
			return null;
		}

		//node elements
		for( var i = 0; i < xmlnode.childNodes.length; i++ )
		{
			var xmlchild = xmlnode.childNodes.item(i);
			if(xmlchild.nodeType != 1 ) //not tag
				continue;

			//children
			if(xmlchild.localName == "node")
			{
				//pass parent node in case child node is a 'dead' node (has no id or sid)
				this.readNodeInfo( xmlchild, scene, level+1, flip, xmlnode );
				continue;
			}

			//geometry
			if(xmlchild.localName == "instance_geometry")
			{
				var url = xmlchild.getAttribute("url");
				var mesh_id = url.toString().substr(1);

				if(!node.mesh)
					node.mesh = mesh_id;
				else
				{
					if(!node.meshes)
						node.meshes = [node.mesh];
					node.meshes.push( mesh_id );
				}

				if(!scene.meshes[ url ])
				{
					var mesh_data = this.readGeometry(url, flip);
					if(mesh_data)
					{
						mesh_data.name = mesh_id;
						scene.meshes[ mesh_id ] = mesh_data;
					}
				}

				//binded material
				var xmlmaterials = xmlchild.querySelectorAll("instance_material");
				if(xmlmaterials)
				{
					for(var iMat = 0; iMat < xmlmaterials.length; ++iMat)
					{
						var xmlmaterial = xmlmaterials.item(iMat);
						if(!xmlmaterial)
						{
							console.warn("instance_material not found: " + i);
							continue;
						}

						var matname = xmlmaterial.getAttribute("target").toString().substr(1);
						//matname = matname.replace(/ /g,"_"); //names cannot have spaces
						if(!scene.materials[ matname ])
						{

							var material = this.readMaterial(matname);
							if(material)
							{
								material.id = matname; 
								scene.materials[ material.id ] = material;
							}
						}
						if(iMat == 0)
							node.material = matname;
						else
						{
							if(!node.materials)
								node.materials = [];
							node.materials.push(matname);
						}
					}
				}
			}


			//this node has a controller: skinning, morph targets or even multimaterial are controllers
			//warning: I detected that some nodes could have a controller but they are not referenced here.  ??
			if(xmlchild.localName == "instance_controller")
			{
				var url = xmlchild.getAttribute("url");
				var xmlcontroller = this._xmlroot.querySelector("controller" + url);

				if(xmlcontroller)
				{

					var mesh_data = this.readController( xmlcontroller, flip, scene );

					//binded materials
					var xmlbind_material = xmlchild.querySelector("bind_material");
					if(xmlbind_material){
						//removed readBindMaterials up here for consistency
						var xmltechniques = xmlbind_material.querySelectorAll("technique_common");
						for(var iTec = 0; iTec < xmltechniques.length; iTec++)
						{
							var xmltechnique = xmltechniques.item(iTec);
							var xmlinstance_materials = xmltechnique.querySelectorAll("instance_material");
							for(var iMat = 0; iMat < xmlinstance_materials.length; iMat++)
							{
								var xmlinstance_material = xmlinstance_materials.item(iMat);
								if(!xmlinstance_material)
								{
									console.warn("instance_material for controller not found: " + xmlinstance_material);
									continue;
								}
								var matname = xmlinstance_material.getAttribute("target").toString().substr(1);
								if(!scene.materials[ matname ])
								{

									var material = this.readMaterial(matname);
									if(material)
									{
										material.id = matname; 
										scene.materials[ material.id ] = material;
									}
								}
								if(iMat == 0)
									node.material = matname;
								else
								{
									if(!node.materials)
										node.materials = [];
									node.materials.push(matname);
								}

							}
						}

					}

					if(mesh_data)
					{
						var mesh = mesh_data;
						if( mesh_data.type == "morph" )
						{
							mesh = mesh_data.mesh;
							node.morph_targets = mesh_data.morph_targets;
						}

						mesh.name = url.toString();
						node.mesh = url.toString();
						scene.meshes[ url ] = mesh;
					}
				}
			}

			//light
			if(xmlchild.localName == "instance_light")
			{
				var url = xmlchild.getAttribute("url");
				this.readLight(node, url);
			}

			//camera
			if(xmlchild.localName == "instance_camera")
			{
				var url = xmlchild.getAttribute("url");
				this.readCamera(node, url);
			}

			//other possible tags?
		}
	},

	//if you want to rename some material names
	material_translate_table: {
		/*
		transparency: "opacity",
		reflectivity: "reflection_factor",
		specular: "specular_factor",
		shininess: "specular_gloss",
		emission: "emissive",
		diffuse: "color"
		*/
	},

	light_translate_table: {

		point: "omni",
		directional: "directional",
		spot: "spot"		
	},

	camera_translate_table: {
		xfov: "fov",
		aspect_ratio: "aspect",
		znear: "near",
		zfar: "far"
	},

	//used when id have spaces (regular selector do not support spaces)
	querySelectorAndId: function(root, selector, id)
	{
		var nodes = root.querySelectorAll(selector);
		for(var i = 0; i < nodes.length; i++)
		{
			var attr_id = nodes.item(i).getAttribute("id");
			if( !attr_id ) 
				continue;
			attr_id = attr_id.toString();
			if(attr_id == id )
				return nodes.item(i);
		}
		return null;
	},

	//returns the first element that matches a tag name, if not tagname is specified then the first tag element
	getFirstChildElement: function(root, localName)
	{
		var c = root.childNodes;
		for(var i = 0; i < c.length; ++i)
		{
			var item = c.item(i);
			if( (item.localName && !localName) || (localName && localName == item.localName) )
				return item;
		}
		return null;
	},

	readMaterial: function(url)
	{
		var xmlmaterial = this.querySelectorAndId( this._xmlroot, "library_materials material", url );

		if(!xmlmaterial)
			return null;

		//get effect name
		var xmleffect = xmlmaterial.querySelector("instance_effect");
		if(!xmleffect) return null;

		var effect_url = xmleffect.getAttribute("url").substr(1);

		//get effect
		var xmleffects = this.querySelectorAndId( this._xmlroot, "library_effects effect", effect_url );

		if(!xmleffects) return null;

		//get common
		var xmltechnique = xmleffects.querySelector("technique");
		if(!xmltechnique) 
			return null;

		//get newparams and convert to js object
		var xmlnewparams = xmleffects.querySelectorAll("newparam");
		var newparams = {}
		for (var i = 0; i < xmlnewparams.length; i++) {

			var init_from = xmlnewparams[i].querySelector("init_from");
			var parent;
			if (init_from)
				parent = init_from.innerHTML;
			else {
				var source = xmlnewparams[i].querySelector("source");
				parent = source.innerHTML;
			}

			newparams[xmlnewparams[i].getAttribute("sid")] = {
				parent: parent
			};
		}



		var material = {};

		//read the images here because we need to access them to assign texture names
		var images = this.readImages(this._xmlroot);


		var xmlphong = xmltechnique.querySelector("phong");
		if(!xmlphong) 
			xmlphong = xmltechnique.querySelector("blinn");
		if(!xmlphong) 
			xmlphong = xmltechnique.querySelector("lambert");
		if(!xmlphong) 
			return null;

		//for every tag of properties
		for(var i = 0; i < xmlphong.childNodes.length; ++i)
		{
			var xmlparam = xmlphong.childNodes.item(i);

			if(!xmlparam.localName) //text tag
				continue;

			//translate name
			var param_name = xmlparam.localName.toString();
			if(this.material_translate_table[param_name])
				param_name = this.material_translate_table[param_name];

			//value
			var xmlparam_value = this.getFirstChildElement( xmlparam );
			if(!xmlparam_value)
				continue;

			if(xmlparam_value.localName.toString() == "color")
			{
				var value = this.readContentAsFloats( xmlparam_value );
				if( xmlparam.getAttribute("opaque") == "RGB_ZERO")
					material[ param_name ] = value.subarray(0,4);
				else
					material[ param_name ] = value.subarray(0,3);
				continue;
			}
			else if(xmlparam_value.localName.toString() == "float")
			{
				material[ param_name ] = this.readContentAsFloats( xmlparam_value )[0];
				continue;
			}
			else if(xmlparam_value.localName.toString() == "texture")
			{
				if(!material.textures)
					material.textures = {};
				var map_id = xmlparam_value.getAttribute("texture");
				if(!map_id)
					continue;

				// if map_id is not a filename, lets go and look for it.
				if (map_id.indexOf('.') === -1){
					//check effect parents
					map_id = this.getParentParam(newparams, map_id);

					if (images[map_id])
						map_id = images[map_id].path;
				}

				//now get the texture filename from images

				var map_info = { map_id: map_id };
				var uvs = xmlparam_value.getAttribute("texcoord");
				map_info.uvs = uvs;
				material.textures[ param_name ] = map_info;
			}
		}

		material.object_class = "Material";
		return material;
	},

	getParentParam: function(newparams, param) {
		if (!newparams[param])
			return param;

		if (newparams[param].parent)
			return this.getParentParam(newparams, newparams[param].parent)
		else
			return param;
	},

	readLight: function(node, url)
	{
		var light = {};

		var xmlnode = null;
		
		if(url.length > 1) //weird cases with id == #
			xmlnode = this._xmlroot.querySelector("library_lights " + url);
		else
		{
			var xmlliblights = this._xmlroot.querySelector("library_lights");
			xmlnode = this.getFirstChildElement( xmlliblights, "light" );
		}

		if(!xmlnode)
			return null;

		//pack
		var children = [];
		var xml = xmlnode.querySelector("technique_common");
		if(xml)
			for(var i = 0; i < xml.childNodes.length; i++ )
				if( xml.childNodes.item(i).nodeType == 1 ) //tag
					children.push( xml.childNodes.item(i) );

		var xmls = xmlnode.querySelectorAll("technique");
		for(var i = 0; i < xmls.length; i++)
		{
			var xml2 = xmls.item(i);
			for(var j = 0; j < xml2.childNodes.length; j++ )
				if( xml2.childNodes.item(j).nodeType == 1 ) //tag
					children.push( xml2.childNodes.item(j) );
		}

		//get
		for(var i = 0; i < children.length; i++)
		{
			var xml = children[i];
			switch( xml.localName )
			{
				case "point": 
					light.type = this.light_translate_table[ xml.localName ]; 
					parse_params(light, xml);
					break;
				case "directional":
					light.type = this.light_translate_table[ xml.localName ]; 
					parse_params(light, xml);
					break;
				case "spot": 
					light.type = this.light_translate_table[ xml.localName ]; 
					parse_params(light, xml);
					break;
				
				case "intensity": 
					light.intensity = this.readContentAsFloats( xml )[0]; 
					break;
			}
		}

		function parse_params(light, xml)
		{
			for(var i = 0; i < xml.childNodes.length; i++)
			{
				var child = xml.childNodes.item(i);
				if( !child || child.nodeType != 1 ) //tag
					continue;

				switch( child.localName )
				{
					case "color": 
						light.color = Collada.readContentAsFloats( child ); break;
					case "falloff_angle": 
						light.angle_end = Collada.readContentAsFloats( child )[0]; 
						light.angle = light.angle_end - 10; 
					break;
				}
			}
		}

		
		if(node.model)
		{
			//light position is final column of model
			light.position = [node.model[12],node.model[13],node.model[14]];
			//light forward vector is reverse of third column of model
			var forward = [ - node.model[8], - node.model[9], - node.model[10]];
			//so light target is position + forward
			light.target = [light.position[0] + forward[0],
							light.position[1] + forward[1],
							light.position[2] + forward[2] ];
		}
		else {
			console.warn( "Could not read light position for light: " + node.name + ". Setting defaults.");
			light.position = [0,0,0];
			light.target = [0,-1,0];
		}
		

		node.light = light;
	},

	readCamera: function(node, url)
	{
		var camera = {};

		var xmlnode = this._xmlroot.querySelector("library_cameras " + url);
		if(!xmlnode) return null;

		//pack
		var children = [];
		var xml = xmlnode.querySelector("technique_common");
		if(xml) //grab all internal stuff
			for(var i = 0; i < xml.childNodes.length; i++ )
				if( xml.childNodes.item(i).nodeType == 1 ) //tag
					children.push( xml.childNodes.item(i) );

		//
		for(var i = 0; i < children.length; i++)
		{
			var tag = children[i];
			parse_params(camera, tag);
		}

		function parse_params(camera, xml)
		{
			for(var i = 0; i < xml.childNodes.length; i++)
			{
				var child = xml.childNodes.item(i);
				if( !child || child.nodeType != 1 ) //tag
					continue;
				var translated = Collada.camera_translate_table[ child.localName ] || child.localName;
				camera[ translated ] = parseFloat( child.textContent );
				
			}
		}

		//parse to convert yfov to standard (x) fov
		if ( camera.yfov && !camera.fov ) {
			if ( camera.aspect ) {
				camera.fov = camera.yfov * camera.aspect;
			}
			else
				console.warn("Could not convert camera yfov to xfov because aspect ratio not set")
		} 

		node.camera = camera;
	},

	readTransform: function(xmlnode, level, flip)
	{
		//identity
		var matrix = mat4.create(); 
		var temp = mat4.create(); 
		var tmpq = quat.create();
		
		var flip_fix = false;

		//search for the matrix
		for(var i = 0; i < xmlnode.childNodes.length; i++)
		{
			var xml = xmlnode.childNodes.item(i);
			if( !xml || xml.nodeType != 1 ) //tag
				continue;

			if(xml.localName == "matrix")
			{
				var matrix = this.readContentAsFloats(xml);
				//console.log("Nodename: " + xmlnode.getAttribute("id"));
				//console.log(matrix);
				this.transformMatrix(matrix, level == 0);
				//console.log(matrix);
				return matrix;
			}

			if(xml.localName == "translate")
			{
				var values = this.readContentAsFloats(xml);
				if(flip && level > 0)
				{
					var tmp = values[1];
					values[1] = values[2];
					values[2] = -tmp; //swap coords
				}

				mat4.translate( matrix, matrix, values );
				continue;
			}

			//rotate
			if(xml.localName == "rotate")
			{
				var values = this.readContentAsFloats(xml);
				if(values.length == 4) //x,y,z, angle
				{
					var id = xml.getAttribute("sid");
					if(id == "jointOrientX")
					{
						values[3] += 90;
						flip_fix = true;
					}
					//rotateX & rotateY & rotateZ done below

					if(flip)
					{
						var tmp = values[1];
						values[1] = values[2];
						values[2] = -tmp; //swap coords
					}

					if(values[3] != 0.0)
					{
						quat.setAxisAngle( tmpq, values.subarray(0,3), values[3] * DEG2RAD);
						mat4.fromQuat( temp, tmpq );
						mat4.multiply(matrix, matrix, temp);
					}
				}
				continue;
			}

			//scale
			if(xml.localName == "scale")
			{
				var values = this.readContentAsFloats(xml);
				if(flip)
				{
					var tmp = values[1];
					values[1] = values[2];
					values[2] = -tmp; //swap coords
				}
				mat4.scale( matrix, matrix, values );
			}
		}

		return matrix;
	},

	readTransform2: function(xmlnode, level, flip)
	{
		//identity
		var matrix = mat4.create(); 
		var rotation = quat.create();
		var tmpmatrix = mat4.create();
		var tmpq = quat.create();
		var translate = vec3.create();
		var scale = vec3.fromValues(1,1,1);
		
		var flip_fix = false;

		//search for the matrix
		for(var i = 0; i < xmlnode.childNodes.length; i++)
		{
			var xml = xmlnode.childNodes.item(i);

			if(xml.localName == "matrix")
			{
				var matrix = this.readContentAsFloats(xml);
				//console.log("Nodename: " + xmlnode.getAttribute("id"));
				//console.log(matrix);
				this.transformMatrix(matrix, level == 0);
				//console.log(matrix);
				return matrix;
			}

			if(xml.localName == "translate")
			{
				var values = this.readContentAsFloats(xml);
				translate.set(values);
				continue;
			}

			//rotate
			if(xml.localName == "rotate")
			{
				var values = this.readContentAsFloats(xml);
				if(values.length == 4) //x,y,z, angle
				{
					var id = xml.getAttribute("sid");
					if(id == "jointOrientX")
					{
						values[3] += 90;
						flip_fix = true;
					}
					//rotateX & rotateY & rotateZ done below

					if(flip)
					{
						var tmp = values[1];
						values[1] = values[2];
						values[2] = -tmp; //swap coords
					}

					if(values[3] != 0.0)
					{
						quat.setAxisAngle( tmpq, values.subarray(0,3), values[3] * DEG2RAD);
						quat.multiply(rotation,rotation,tmpq);
					}
				}
				continue;
			}

			//scale
			if(xml.localName == "scale")
			{
				var values = this.readContentAsFloats(xml);
				if(flip)
				{
					var tmp = values[1];
					values[1] = values[2];
					values[2] = -tmp; //swap coords
				}
				scale.set(values);
			}
		}

		if(flip && level > 0)
		{
			var tmp = translate[1];
			translate[1] = translate[2];
			translate[2] = -tmp; //swap coords
		}
		mat4.translate(matrix, matrix, translate);

		mat4.fromQuat( tmpmatrix , rotation );
		//mat4.rotateX(tmpmatrix, tmpmatrix, Math.PI * 0.5);
		mat4.multiply( matrix, matrix, tmpmatrix );
		mat4.scale( matrix, matrix, scale );


		return matrix;
	},

	//for help read this: https://www.khronos.org/collada/wiki/Using_accessors
	readGeometry: function(id, flip, scene)
	{
		//already read, could happend if several controllers point to the same mesh
		if( this._geometries_found[ id ] !== undefined )
			return this._geometries_found[ id ];

		//var xmlgeometry = this._xmlroot.querySelector("geometry" + id);
		var xmlgeometry = this._xmlroot.getElementById(id.substr(1));
		if(!xmlgeometry) 
		{
			console.warn("readGeometry: geometry not found: " + id);
			this._geometries_found[ id ] = null;
			return null;
		}

		//if the geometry has morph targets then instead of storing it in a geometry, it is in a controller
		if(xmlgeometry.localName == "controller") 
		{
			var geometry = this.readController( xmlgeometry, flip, scene );
			this._geometries_found[ id ] = geometry;
			return geometry;
		}


		if(xmlgeometry.localName != "geometry") 
		{
			console.warn("readGeometry: tag should be geometry, instead it was found: " + xmlgeometry.localName);
			this._geometries_found[ id ] = null;
			return null;
		}

		var xmlmesh = xmlgeometry.querySelector("mesh");
		if(!xmlmesh)
		{
			console.warn("readGeometry: mesh not found in geometry: " + id);
			this._geometries_found[ id ] = null;
			return null;
		}
		
		//get data sources
		var sources = {};
		var xmlsources = xmlmesh.querySelectorAll("source");
		for(var i = 0; i < xmlsources.length; i++)
		{
			var xmlsource = xmlsources.item(i);
			if(!xmlsource.querySelector) continue;
			var float_array = xmlsource.querySelector("float_array");
			if(!float_array)
				continue;
			var floats = this.readContentAsFloats( float_array );

			var xmlaccessor = xmlsource.querySelector("accessor");
			var stride = parseInt( xmlaccessor.getAttribute("stride") );

			sources[ xmlsource.getAttribute("id") ] = {stride: stride, data: floats};
		}

		//get streams
		var xmlvertices = xmlmesh.querySelector("vertices input");
		var vertices_source = sources[ xmlvertices.getAttribute("source").substr(1) ];
		sources[ xmlmesh.querySelector("vertices").getAttribute("id") ] = vertices_source;

		var mesh = null;
		var xmlpolygons = xmlmesh.querySelector("polygons");
		if( xmlpolygons )
			mesh = this.readTriangles( xmlpolygons, sources );

		if(!mesh)
		{
			var xmltriangles = xmlmesh.querySelectorAll("triangles");
			if(xmltriangles && xmltriangles.length)
				mesh = this.readTriangles( xmltriangles, sources );
		}

		if(!mesh)
		{
			//polylist = true;
			//var vcount = null;
			//var xmlvcount = xmlpolygons.querySelector("vcount");
			//var vcount = this.readContentAsUInt32( xmlvcount );
			var xmlpolylist_array = xmlmesh.querySelectorAll("polylist");
			if( xmlpolylist_array && xmlpolylist_array.length )
				mesh = this.readPolylistArray( xmlpolylist_array, sources );
		}

		if(!mesh)
		{
			var xmllinestrip = xmlmesh.querySelector("linestrips");
			if(xmllinestrip)
				mesh = this.readLineStrip( sources, xmllinestrip );
		}

		if(!mesh)
		{
			console.log("no polygons or triangles in mesh: " + id);
			this._geometries_found[ id ] = null;
			return null;
		}
	
		//swap coords (X,Y,Z) -> (X,Z,-Y)
		if(flip && !this.no_flip)
		{
			var tmp = 0;
			var array = mesh.vertices;
			for(var i = 0, l = array.length; i < l; i += 3)
			{
				tmp = array[i+1]; 
				array[i+1] = array[i+2];
				array[i+2] = -tmp; 
			}

			array = mesh.normals;
			for(var i = 0, l = array.length; i < l; i += 3)
			{
				tmp = array[i+1]; 
				array[i+1] = array[i+2];
				array[i+2] = -tmp; 
			}
		}

		//transferables for worker
		if(isWorker && this.use_transferables)
		{
			for(var i in mesh)
			{
				var data = mesh[i];
				if(data && data.buffer && data.length > 100)
				{
					this._transferables.push(data.buffer);
				}
			}
		}

		//extra info
		mesh.filename = id;
		mesh.object_class = "Mesh";

		this._geometries_found[ id ] = mesh;
		return mesh;
	},

	readTriangles: function( xmltriangles, sources )
	{
		var use_indices = false;

		var groups = [];
		var buffers = [];
		var last_index = 0;
		var facemap = {};
		var vertex_remap = []; //maps DAE vertex index to Mesh vertex index (because when meshes are triangulated indices are changed
		var indicesArray = [];
		var last_start = 0;
		var group_name = "";
		var material_name = "";

		//for every triangles set (warning, some times they are repeated...)
		for(var tris = 0; tris < xmltriangles.length; tris++)
		{
			var xml_shape_root = xmltriangles.item(tris);
			var triangles = xml_shape_root.localName == "triangles";

			material_name = xml_shape_root.getAttribute("material");

			//for each buffer (input) build the structure info
			if(tris == 0)
				buffers = this.readShapeInputs( xml_shape_root, sources );

			//assuming buffers are ordered by offset

			//iterate data
			var xmlps = xml_shape_root.querySelectorAll("p");
			var num_data_vertex = buffers.length; //one value per input buffer

			//compute data to read per vertex
			var num_values_per_vertex = 1;
			var buffers_length = buffers.length;
			for(var b = 0; b < buffers_length; ++b)
				num_values_per_vertex = Math.max( num_values_per_vertex, buffers[b][4] + 1);

			//for every polygon (could be one with all the indices, could be several, depends on the program)
			for(var i = 0; i < xmlps.length; i++)
			{
				var xmlp = xmlps.item(i);
				if(!xmlp || !xmlp.textContent) 
					break;

				var data = xmlp.textContent.trim().split(" ");

				//used for triangulate polys
				var first_index = -1;
				var current_index = -1;
				var prev_index = -1;

				//discomment to force 16bits indices
				//if(use_indices && last_index >= 256*256)
				//	break;

				//for every pack of indices in the polygon (vertex, normal, uv, ... )
				for(var k = 0, l = data.length; k < l; k += num_values_per_vertex)
				{
					var vertex_id = data.slice(k,k+num_values_per_vertex).join(" "); //generate unique id

					prev_index = current_index;
					if(facemap.hasOwnProperty(vertex_id)) //add to arrays, keep the index
						current_index = facemap[vertex_id];
					else
					{
						//for every data buffer associated to this vertex
						for(var j = 0; j < buffers_length; ++j)
						{
							var buffer = buffers[j];
							var array = buffer[1]; //array where we accumulate the final data as we extract if from sources
							var source = buffer[3]; //where to read the data from
							
							//compute the index inside the data source array
							var index = parseInt( data[ k + buffer[4] ] );

							//remember this index in case we need to remap
							if(j == 0)
								vertex_remap[ array.length / buffer[2] ] = index; //not sure if buffer[2], it should be number of floats per vertex (usually 3)

							//compute the position inside the source buffer where the final data is located
							index *= buffer[2]; //this works in most DAEs (not all)

							//extract every value of this element and store it in its final array (every x,y,z, etc)
							for(var x = 0; x < buffer[2]; ++x)
							{
								//if(source[index+x] === undefined) throw("UNDEFINED!"); //DEBUG
								array.push( source[index+x] );
							}
						}
						
						current_index = last_index;
						last_index += 1;
						facemap[vertex_id] = current_index;
					}

					if(!triangles) //the xml element is not triangles? then split polygons in triangles
					{
						if(k == 0)
							first_index = current_index;
						//if(k > 2 * num_data_vertex) //not sure if use this or the next line, the next one works in some DAEs but not sure if it works in all
						if(k > 2) //triangulate polygons: ensure this works
						{
							indicesArray.push( first_index );
							indicesArray.push( prev_index );
						}
					}

					indicesArray.push( current_index );
				}//per vertex
			}//per polygon

			var group = {
				name: group_name || ("group" + tris),
				start: last_start,
				length: indicesArray.length - last_start,
				material: material_name || ""
			};
			last_start = indicesArray.length;
			groups.push( group );
		}//per triangles group

		var mesh = {
			vertices: new Float32Array( buffers[0][1] ),
			info: { groups: groups },
			_remap: new Uint32Array(vertex_remap)
		};

		this.transformMeshInfo( mesh, buffers, indicesArray );

		return mesh;
	},

	readPolylistArray: function( xml_polylist_array, sources )
	{
		var meshes = [];

		for(var i = 0; i < xml_polylist_array.length; ++i)
		{
			var xml_polylist = xml_polylist_array[i];
			var mesh = this.readPolylist( xml_polylist, sources );
			if(mesh)
				meshes.push( mesh );
		}

		//one or none
		if( meshes.length < 2)
			return meshes[0];

		//merge meshes
		var mesh = this.mergeMeshes( meshes );
		return mesh;
	},

	readPolylist: function( xml_polylist, sources )
	{
		var use_indices = false;

		var groups = [];
		var buffers = [];
		var last_index = 0;
		var facemap = {};
		var vertex_remap = [];
		var indicesArray = [];
		var last_start = 0;
		var group_name = "";
		var material_name = "";

		material_name = xml_polylist.getAttribute("material") || "";
		buffers = this.readShapeInputs( xml_polylist, sources );

		var xmlvcount = xml_polylist.querySelector("vcount");
		var vcount = this.readContentAsUInt32( xmlvcount );

		var xmlp = xml_polylist.querySelector("p");
		var data = this.readContentAsUInt32( xmlp );
		var pos = 0;

		var num_values_per_vertex = 1;
		var buffers_length = buffers.length;
		for(var b = 0; b < buffers_length; ++b)
			num_values_per_vertex = Math.max( num_values_per_vertex, buffers[b][4] + 1);

		for(var i = 0, l = vcount.length; i < l; ++i)
		{
			var num_vertices = vcount[i];

			var first_index = -1;
			var current_index = -1;
			var prev_index = -1;

			//iterate vertices of this polygon
			for(var k = 0; k < num_vertices; ++k)
			{
				var vertex_id = data.slice( pos, pos + num_values_per_vertex).join(" "); //generate unique id

				prev_index = current_index;
				if(facemap.hasOwnProperty(vertex_id)) //add to arrays, keep the index
					current_index = facemap[vertex_id];
				else
				{
					for(var j = 0; j < buffers_length; ++j)
					{
						var buffer = buffers[j];
						var array = buffer[1]; //array with all the data
						var source = buffer[3]; //where to read the data from

						var index = parseInt( data[ pos + buffer[4] ] );

						if(j == 0)
							vertex_remap[ array.length / buffer[2] ] = index; //not sure if buffer[2], it should be number of floats per vertex (usually 3)

						//compute the position inside the source buffer where the final data is located
						index *= buffer[2]; //this works in most DAEs (not all)

						//extract every value of this element and store it in its final array (every x,y,z, etc)
						for(var x = 0; x < buffer[2]; ++x)
						{
							//if(source[index+x] === undefined) throw("UNDEFINED!"); //DEBUG
							array.push( source[index+x] );
						}
					}
					
					current_index = last_index;
					last_index += 1;
					facemap[vertex_id] = current_index;
				}

				if(num_vertices > 3) //split polygons then
				{
					if(k == 0)
						first_index = current_index;
					//if(k > 2 * num_data_vertex) //not sure if use this or the next line, the next one works in some DAEs but not sure if it works in all
					if(k > 2) //triangulate polygons: tested, this works
					{
						indicesArray.push( first_index );
						indicesArray.push( prev_index );
					}
				}

				indicesArray.push( current_index );
				pos += num_values_per_vertex;
			}//per vertex
		}//per polygon

		var mesh = {
			vertices: new Float32Array( buffers[0][1] ),
			info: {
				material: material_name
			},
			_remap: new Uint32Array( vertex_remap )
		};

		this.transformMeshInfo( mesh, buffers, indicesArray );
		return mesh;
	},

	readShapeInputs: function(xml_shape_root, sources)
	{
		var buffers = [];

		var xmlinputs = xml_shape_root.querySelectorAll("input");
		for(var i = 0; i < xmlinputs.length; i++)
		{
			var xmlinput = xmlinputs.item(i);
			if(!xmlinput.getAttribute) 
				continue;
			var semantic = xmlinput.getAttribute("semantic").toUpperCase();
			var stream_source = sources[ xmlinput.getAttribute("source").substr(1) ];
			var offset = parseInt( xmlinput.getAttribute("offset") );
			var data_set = 0;
			if(xmlinput.getAttribute("set"))
				data_set = parseInt( xmlinput.getAttribute("set") );
			buffers.push([semantic, [], stream_source.stride, stream_source.data, offset, data_set ]);
		}

		return buffers;
	},

	transformMeshInfo: function( mesh, buffers, indicesArray )
	{
		//rename buffers (DAE has other names)
		var translator = {
			"normal":"normals",
			"texcoord":"coords"
		};

		for(var i = 1; i < buffers.length; ++i)
		{
			var name = buffers[i][0].toLowerCase();
			var data = buffers[i][1];
			if(!data.length)
				continue;

			if(translator[name])
				name = translator[name];
			if(mesh[name])
				name = name + buffers[i][5];
			mesh[ name ] = new Float32Array(data); //are they always float32? I think so
		}
		
		if(indicesArray && indicesArray.length)
		{
			if(mesh.vertices.length > 256*256)
				mesh.triangles = new Uint32Array(indicesArray);
			else
				mesh.triangles = new Uint16Array(indicesArray);
		}

		return mesh;
	},

	readLineStrip: function(sources, xmllinestrip)
	{
		var use_indices = false;

		var buffers = [];
		var last_index = 0;
		var facemap = {};
		var vertex_remap = [];
		var indicesArray = [];
		var last_start = 0;
		var group_name = "";
		var material_name = "";

		var tris = 0; //used in case there are several strips

		//for each buffer (input) build the structure info
		var xmlinputs = xmllinestrip.querySelectorAll("input");
		if(tris == 0) //first iteration, create buffers
			for(var i = 0; i < xmlinputs.length; i++)
			{
				var xmlinput = xmlinputs.item(i);
				if(!xmlinput.getAttribute) 
					continue;
				var semantic = xmlinput.getAttribute("semantic").toUpperCase();
				var stream_source = sources[ xmlinput.getAttribute("source").substr(1) ];
				var offset = parseInt( xmlinput.getAttribute("offset") );
				var data_set = 0;
				if(xmlinput.getAttribute("set"))
					data_set = parseInt( xmlinput.getAttribute("set") );

				buffers.push([semantic, [], stream_source.stride, stream_source.data, offset, data_set]);
			}
		//assuming buffers are ordered by offset

		//iterate data
		var xmlps = xmllinestrip.querySelectorAll("p");
		var num_data_vertex = buffers.length; //one value per input buffer

		//for every polygon (could be one with all the indices, could be several, depends on the program)
		for(var i = 0; i < xmlps.length; i++)
		{
			var xmlp = xmlps.item(i);
			if(!xmlp || !xmlp.textContent) 
				break;

			var data = xmlp.textContent.trim().split(" ");

			//used for triangulate polys
			var first_index = -1;
			var current_index = -1;
			var prev_index = -1;

			//if(use_indices && last_index >= 256*256)
			//	break;

			//for every pack of indices in the polygon (vertex, normal, uv, ... )
			for(var k = 0, l = data.length; k < l; k += num_data_vertex)
			{
				var vertex_id = data.slice(k,k+num_data_vertex).join(" "); //generate unique id

				prev_index = current_index;
				if(facemap.hasOwnProperty(vertex_id)) //add to arrays, keep the index
					current_index = facemap[vertex_id];
				else
				{
					for(var j = 0; j < buffers.length; ++j)
					{
						var buffer = buffers[j];
						var index = parseInt(data[k + j]);
						var array = buffer[1]; //array with all the data
						var source = buffer[3]; //where to read the data from
						if(j == 0)
							vertex_remap[ array.length / num_data_vertex ] = index;
						index *= buffer[2]; //stride
						for(var x = 0; x < buffer[2]; ++x)
							array.push( source[index+x] );
					}
					
					current_index = last_index;
					last_index += 1;
					facemap[vertex_id] = current_index;
				}

				indicesArray.push( current_index );
			}//per vertex
		}//per polygon

		var mesh = {
			primitive: "line_strip",
			vertices: new Float32Array( buffers[0][1] ),
			info: {}
		};

		return this.transformMeshInfo( mesh, buffers, indicesArray );
	},

	//like querySelector but allows spaces in names because COLLADA allows space in names
	findXMLNodeById: function(root, nodename, id)
	{
		//precomputed
		if( this._xmlroot._nodes_by_id )
		{
			var n = this._xmlroot._nodes_by_id[ id ];
			if( n && n.localName == nodename)
				return n;
		}
		else //for the native parser
		{
			var n = this._xmlroot.getElementById( id );
			if(n)
				return n;
		}

		//recursive: slow
		var childs = root.childNodes;
		for(var i = 0; i < childs.length; ++i)
		{
			var xmlnode = childs.item(i);
			if(xmlnode.nodeType != 1 ) //no tag
				continue;
			if(xmlnode.localName != nodename)
				continue;
			var node_id = xmlnode.getAttribute("id");
			if(node_id == id)
				return xmlnode;
		}
		return null;
	},

	readImages: function(root)
	{
		var xmlimages = root.querySelector("library_images");
		if(!xmlimages)
			return null;

		var images = {};

		var xmlimages_childs = xmlimages.childNodes;
		for(var i = 0; i < xmlimages_childs.length; ++i)
		{
			var xmlimage = xmlimages_childs.item(i);
			if(xmlimage.nodeType != 1 ) //no tag
				continue;

			var xmlinitfrom = xmlimage.querySelector("init_from");
			if(!xmlinitfrom)
				continue;
			if(xmlinitfrom.textContent)
			{
				var filename = this.getFilename( xmlinitfrom.textContent );
				var id = xmlimage.getAttribute("id");
				images[id] = { filename: filename, map: id, name: xmlimage.getAttribute("name"), path: xmlinitfrom.textContent };
			}
		}

		return images;
	},

	readAnimations: function(root, scene)
	{
		var xmlanimations = root.querySelector("library_animations");
		if(!xmlanimations)
			return null;

		var xmlanimation_childs = xmlanimations.childNodes;

		var animations = {
			object_class: "Animation",
			takes: {}
		};

		var default_take = { tracks: [] };
		var tracks = default_take.tracks;

		for(var i = 0; i < xmlanimation_childs.length; ++i)
		{
			var xmlanimation = xmlanimation_childs.item(i);
			if(xmlanimation.nodeType != 1 || xmlanimation.localName != "animation") //no tag
				continue;

			var anim_id = xmlanimation.getAttribute("id");
			if(!anim_id) //nested animation (DAE 1.5)
			{
				var xmlanimation2_childs = xmlanimation.querySelectorAll("animation");
				if(xmlanimation2_childs.length)
				{
					for(var j = 0; j < xmlanimation2_childs.length; ++j)
					{
						var xmlanimation2 = xmlanimation2_childs.item(j);
						this.readAnimation( xmlanimation2, tracks );
					}
				}
				else //source tracks?
					this.readAnimation( xmlanimation, tracks );
			}
			else //no nested (DAE 1.4)
				this.readAnimation( xmlanimation, tracks );
		}

		if(!tracks.length) 
			return null; //empty animation

		//compute animation duration
		var max_time = 0;
		for(var i = 0; i < tracks.length; ++i)
			if( max_time < tracks[i].duration )
				max_time = tracks[i].duration;

		default_take.name = "default";
		default_take.duration = max_time;
		animations.takes[ default_take.name ] = default_take;
		return animations;
	},

	//animation xml
	readAnimation: function( xmlanimation, result )
	{
		if(xmlanimation.localName != "animation")
			return null;

		//this could be missing when there are lots of anims packed in one <animation>
		var anim_id = xmlanimation.getAttribute("id");

		//channels are like animated properties
		var xmlchannel_list = xmlanimation.querySelectorAll("channel");
		if(!xmlchannel_list.length)
			return null;

		var tracks = result || [];

		for(var i = 0; i < xmlchannel_list.length; ++i)
		{
			var anim = this.readChannel( xmlchannel_list.item(i), xmlanimation );
			if(anim)
				tracks.push( anim );
		}

		return tracks;
	},

	readChannel: function( xmlchannel, xmlanimation )
	{
		if(xmlchannel.localName != "channel" || xmlanimation.localName != "animation")
			return null;

		var source = xmlchannel.getAttribute("source");
		var target = xmlchannel.getAttribute("target");

		//sampler, is in charge of the interpolation
		//var xmlsampler = xmlanimation.querySelector("sampler" + source);
		var xmlsampler = this.findXMLNodeById( xmlanimation, "sampler", source.substr(1) );
		if(!xmlsampler)
		{
			console.error("Error DAE: Sampler not found in " + source);
			return null;
		}

		var inputs = {};
		var params = {};
		var sources = {};
		var xmlinputs = xmlsampler.querySelectorAll("input");

		var time_data = null;

		//iterate inputs: collada separates the keyframe info in independent streams, like time, interpolation method, value )
		for(var j = 0; j < xmlinputs.length; j++)
		{
			var xmlinput = xmlinputs.item(j);
			var source_name =  xmlinput.getAttribute("source");

			//there are three 
			var semantic = xmlinput.getAttribute("semantic");

			//Search for source
			var xmlsource = this.findXMLNodeById( xmlanimation, "source", source_name.substr(1) );
			if(!xmlsource)
				continue;

			var xmlparam = xmlsource.querySelector("param");
			if(!xmlparam)
				continue;

			var type = xmlparam.getAttribute("type");
			inputs[ semantic ] = { source: source_name, type: type };

			var data_array = null;

			if(type == "float" || type == "float4x4")
			{
				var xmlfloatarray = xmlsource.querySelector("float_array");
				var floats = this.readContentAsFloats( xmlfloatarray );
				sources[ source_name ] = floats;
				data_array = floats;

			}
			else //only floats and matrices are supported in animation
				continue;

			var param_name = xmlparam.getAttribute("name");
			if(param_name == "TIME")
				time_data = data_array;
			if(semantic == "OUTPUT")
				param_name = semantic;
			if(param_name)
				params[ param_name ] = type;
			else
				console.warn("Collada: <param> without name attribute in <animation>");
		}

		if(!time_data)
		{
			console.error("Error DAE: no TIME info found in <channel>: " + xmlchannel.getAttribute("source") );
			return null;
		}

		//construct animation
		var path = target.split("/");

		var anim = {};
		var nodename = path[0]; //safeString ?
		var node = this._nodes_by_id[ nodename ];
		var locator = node.id + "/" + path[1];
		//anim.nodename = this.safeString( path[0] ); //where it goes
		anim.name = path[1];
		anim.property = locator;
		var type = "number";
		var element_size = 1;
		var param_type = params["OUTPUT"];
		switch(param_type)
		{
			case "float": element_size = 1; break;
			case "float3x3": element_size = 9; type = "mat3"; break;
			case "float4x4": element_size = 16; type = "mat4"; break;
			default: break;
		}

		anim.type = type;
		anim.value_size = element_size;
		anim.duration = time_data[ time_data.length - 1]; //last sample

		var value_data = sources[ inputs["OUTPUT"].source ];
		if(!value_data)
			return null;

		//Pack data ****************
		var num_samples = time_data.length;
		var sample_size = element_size + 1;
		var anim_data = new Float32Array( num_samples * sample_size );
		//for every sample
		for(var j = 0; j < time_data.length; ++j)
		{
			anim_data[j * sample_size] = time_data[j]; //set time
			var value = value_data.subarray( j * element_size, (j+1) * element_size );
			if(param_type == "float4x4")
			{
				this.transformMatrix( value, node ? node._depth == 0 : 0 );
				//mat4.transpose(value, value);
			}
			anim_data.set(value, j * sample_size + 1); //set data
		}

		if(isWorker && this.use_transferables)
		{
			var data = anim_data;
			if(data && data.buffer && data.length > 100)
				this._transferables.push(data.buffer);
		}

		anim.data = anim_data;
		return anim;
	},

	findNode: function(root, id)
	{
		if(root.id == id) return root;
		if(root.children)
			for(var i in root.children)
			{
				var ret = this.findNode(root.children[i], id);
				if(ret) return ret;
			}
		return null;
	},

	//reads controllers and stores them in 
	readLibraryControllers: function( scene )
	{
		var xmllibrarycontrollers = this._xmlroot.querySelector("library_controllers");
		if(!xmllibrarycontrollers)
			return null;

		var xmllibrarycontrollers_childs = xmllibrarycontrollers.childNodes;

		for(var i = 0; i < xmllibrarycontrollers_childs.length; ++i)
		{
			var xmlcontroller = xmllibrarycontrollers_childs.item(i);
			if(xmlcontroller.nodeType != 1 || xmlcontroller.localName != "controller") //no tag
				continue;
			var id = xmlcontroller.getAttribute("id");
			//we have already processed this controller
			if( this._controllers_found[ id ] )
				continue;

			//read it (we wont use the returns, we will get it from this._controllers_found
			this.readController( xmlcontroller, null, scene );
		}
	},

	//used for skinning and morphing
	readController: function( xmlcontroller, flip, scene )
	{
		if(!xmlcontroller.localName == "controller")
		{
			console.warn("readController: not a controller: " + xmlcontroller.localName);
			return null;
		}

		var id = xmlcontroller.getAttribute("id");

		//use cached
		if( this._controllers_found[ id ] )
			return this._controllers_found[ id ];

		var use_indices = false;
		var mesh = null;
		var xmlskin = xmlcontroller.querySelector("skin");
		if(xmlskin) {
			mesh = this.readSkinController( xmlskin, flip, scene);
		}

		var xmlmorph = xmlcontroller.querySelector("morph");
		if(xmlmorph)
			mesh = this.readMorphController( xmlmorph, flip, scene, mesh );

		//cache and return
		this._controllers_found[ id ] = mesh;

		return mesh;
	},

	//read this to more info about DAE and skinning https://collada.org/mediawiki/index.php/Skinning
	readSkinController: function( xmlskin, flip, scene )
	{
		//base geometry
		var id_geometry = xmlskin.getAttribute("source");


		var mesh = this.readGeometry( id_geometry, flip, scene );
		if(!mesh)
			return null;

		var sources = this.readSources(xmlskin, flip);
		if(!sources)
			return null;

		//matrix
		var bind_matrix = null;
		var xmlbindmatrix = xmlskin.querySelector("bind_shape_matrix");
		if(xmlbindmatrix)
		{
			bind_matrix = this.readContentAsFloats( xmlbindmatrix );
			this.transformMatrix(bind_matrix, true, true );			
		}
		else
			bind_matrix = mat4.create(); //identity

		//joints
		var joints = [];
		var xmljoints = xmlskin.querySelector("joints");
		if(xmljoints)
		{
			var joints_source = null; //which bones
			var inv_bind_source = null; //bind matrices
			var xmlinputs = xmljoints.querySelectorAll("input");
			for(var i = 0; i < xmlinputs.length; i++)
			{
				var xmlinput = xmlinputs[i];
				var sem = xmlinput.getAttribute("semantic").toUpperCase();
				var src = xmlinput.getAttribute("source");
				var source = sources[ src.substr(1) ];
				if(sem == "JOINT")
					joints_source = source;
				else if(sem == "INV_BIND_MATRIX")
					inv_bind_source = source;
			}

			//save bone names and inv matrix
			if(!inv_bind_source || !joints_source)
			{
				console.error("Error DAE: no joints or inv_bind sources found");
				return null;
			}

			for(var i = 0; i < joints_source.length; ++i)
			{
				//get the inverse of the bind pose
				var inv_mat = inv_bind_source.subarray(i*16,i*16+16);
				var nodename = joints_source[i];
				var node = this._nodes_by_id[ nodename ];
				if(!node)
				{
					console.warn("Node " + nodename + " not found");
					continue;
				}
				this.transformMatrix(inv_mat, node._depth == 0, true );
				joints.push([ nodename, inv_mat ]);
			}
		}

		//weights
		var xmlvertexweights = xmlskin.querySelector("vertex_weights");
		if(xmlvertexweights)
		{

			//here we see the order 
			var weights_indexed_array = null;
			var xmlinputs = xmlvertexweights.querySelectorAll("input");
			for(var i = 0; i < xmlinputs.length; i++)
			{
				if( xmlinputs[i].getAttribute("semantic").toUpperCase() == "WEIGHT" )
					weights_indexed_array = sources[ xmlinputs.item(i).getAttribute("source").substr(1) ];
			}

			if(!weights_indexed_array)
				throw("no weights found");

			var xmlvcount = xmlvertexweights.querySelector("vcount");
			var vcount = this.readContentAsUInt32( xmlvcount );

			var xmlv = xmlvertexweights.querySelector("v");
			var v = this.readContentAsUInt32( xmlv );

			var num_vertices = mesh.vertices.length / 3; //3 components per vertex
			var weights_array = new Float32Array(4 * num_vertices); //4 bones per vertex
			var bone_index_array = new Uint8Array(4 * num_vertices); //4 bones per vertex

			var pos = 0;
			var remap = mesh._remap;
			if(!remap)
				throw("no remap info found in mesh");
			var max_bone = 0; //max bone affected

			for(var i = 0, l = vcount.length; i < l; ++i)
			{
				var num_bones = vcount[i]; //num bones influencing this vertex

				//find 4 with more influence
				//var v_tuplets = v.subarray(offset, offset + num_bones*2);

				var offset = pos;
				var b = bone_index_array.subarray(i*4, i*4 + 4);
				var w = weights_array.subarray(i*4, i*4 + 4);

				var sum = 0;
				for(var j = 0; j < num_bones && j < 4; ++j)
				{
					b[j] = v[offset + j*2];
					if(b[j] > max_bone) max_bone = b[j];

					w[j] = weights_indexed_array[ v[offset + j*2 + 1] ];
					sum += w[j];
				}

				//normalize weights
				if(num_bones > 4 && sum < 1.0)
				{
					var inv_sum = 1/sum;
					for(var j = 0; j < 4; ++j)
						w[j] *= inv_sum;
				}

				pos += num_bones * 2;
			}


			//remap: because vertices order is now changed after parsing the mesh
			var final_weights = new Float32Array(4 * num_vertices); //4 bones per vertex
			var final_bone_indices = new Uint8Array(4 * num_vertices); //4 bones per vertex
			var used_joints = [];

			//for every vertex in the mesh, process bone indices and weights
			for(var i = 0; i < num_vertices; ++i)
			{
				var p = remap[ i ] * 4;
				var w = weights_array.subarray(p,p+4);
				var b = bone_index_array.subarray(p,p+4);

				//sort by weight so relevant ones goes first
				for(var k = 0; k < 3; ++k)
				{
					var max_pos = k;
					var max_value = w[k];
					for(var j = k+1; j < 4; ++j)
					{
						if(w[j] <= max_value)
							continue;
						max_pos = j;
						max_value = w[j];
					}
					if(max_pos != k)
					{
						var tmp = w[k];
						w[k] = w[max_pos];
						w[max_pos] = tmp;
						tmp = b[k];
						b[k] = b[max_pos]; 
						b[max_pos] = tmp;
					}
				}

				//store
				final_weights.set( w, i*4);
				final_bone_indices.set( b, i*4);

				//mark bones used
				if(w[0]) used_joints[b[0]] = true;
				if(w[1]) used_joints[b[1]] = true;
				if(w[2]) used_joints[b[2]] = true;
				if(w[3]) used_joints[b[3]] = true;
			}

			if(max_bone >= joints.length)
				console.warn("Mesh uses higher bone index than bones found");

			//trim unused bones (collada could give you 100 bones for an object that only uses a fraction of them)
			if(1)
			{
				var new_bones = [];
				var bones_translation = {};
				for(var i = 0; i < used_joints.length; ++i)
					if(used_joints[i])
					{
						bones_translation[i] = new_bones.length;
						new_bones.push( joints[i] );
					}

				//in case there are less bones in use...
				if(new_bones.length < joints.length)
				{
					//remap
					for(var i = 0; i < final_bone_indices.length; i++)
						final_bone_indices[i] = bones_translation[ final_bone_indices[i] ];
					joints = new_bones;
				}
				//console.log("Bones: ", joints.length, " used:", num_used_joints );
			}

			//console.log("Bones: ", joints.length, "Max bone: ", max_bone);

			mesh.weights = final_weights;
			mesh.bone_indices = final_bone_indices;
			mesh.bones = joints;
			mesh.bind_matrix = bind_matrix;

			//delete mesh["_remap"];
		}

		return mesh;
	},

	//NOT TESTED
	readMorphController: function(xmlmorph, flip, scene, mesh)
	{
		var id_geometry = xmlmorph.getAttribute("source");
		var base_mesh = this.readGeometry( id_geometry, flip, scene );
		if(!base_mesh)
			return null;

		//read sources with blend shapes info (which ones, and the weight)
		var sources = this.readSources(xmlmorph, flip);

		var morphs = [];

		//targets
		var xmltargets = xmlmorph.querySelector("targets");
		if(!xmltargets)
			return null;

		var xmlinputs = xmltargets.querySelectorAll("input");
		var targets = null;
		var weights = null;

		for(var i = 0; i < xmlinputs.length; i++)
		{
			var xmlinput = xmlinputs.item(i);
			var semantic = xmlinput.getAttribute("semantic").toUpperCase();
			var data = sources[ xmlinput.getAttribute("source").substr(1) ];
			if( semantic == "MORPH_TARGET" )
				targets = data;
			else if( semantic == "MORPH_WEIGHT" )
				weights = data;
		}

		if(!targets || !weights)
		{
			console.warn("Morph controller without targets or weights. Skipping it.");
			return null;
		}

		//get targets
		for(var i in targets)
		{
			var id = "#" + targets[i];
			var geometry = this.readGeometry( id, flip, scene );
			scene.meshes[ id ] = geometry;
			morphs.push( { mesh: id, weight: weights[i]} );
		}

		base_mesh.morph_targets = morphs;
		return base_mesh;
	},

	readBindMaterials: function( xmlbind_material, mesh )
	{
		var materials = [];

		var xmltechniques = xmlbind_material.querySelectorAll("technique_common");
		for(var i = 0; i < xmltechniques.length; i++)
		{
			var xmltechnique = xmltechniques.item(i);
			var xmlinstance_materials = xmltechnique.querySelectorAll("instance_material");
			for(var j = 0; j < xmlinstance_materials.length; j++)
			{
				var xmlinstance_material = xmlinstance_materials.item(j);
				if(xmlinstance_material)
					materials.push( xmlinstance_material.getAttribute("symbol") );
			}
		}

		return materials;
	},

	readSources: function(xmlnode, flip)
	{
		//for data sources
		var sources = {};
		var xmlsources = xmlnode.querySelectorAll("source");
		for(var i = 0; i < xmlsources.length; i++)
		{
			var xmlsource = xmlsources.item(i);
			if(!xmlsource.querySelector) //??
				continue;

			var float_array = xmlsource.querySelector("float_array");
			if(float_array)
			{
				var floats = this.readContentAsFloats( xmlsource );
				sources[ xmlsource.getAttribute("id") ] = floats;
				continue;
			}

			var name_array = xmlsource.querySelector("Name_array");
			if(name_array)
			{
				var names = this.readContentAsStringsArray( name_array );
				if(!names)
					continue;
				sources[ xmlsource.getAttribute("id") ] = names;
				continue;
			}

			var ref_array = xmlsource.querySelector("IDREF_array");
			if(ref_array)
			{
				var names = this.readContentAsStringsArray( ref_array );
				if(!names)
					continue;
				sources[ xmlsource.getAttribute("id") ] = names;
				continue;
			}
		}

		return sources;
	},

	readContentAsUInt32: function(xmlnode)
	{
		if(!xmlnode) return null;
		var text = xmlnode.textContent;
		text = text.replace(/\n/gi, " "); //remove line breaks
		text = text.trim(); //remove empty spaces
		if(text.length == 0) return null;
		var numbers = text.split(" "); //create array
		var floats = new Uint32Array( numbers.length );
		for(var k = 0; k < numbers.length; k++)
			floats[k] = parseInt( numbers[k] );
		return floats;
	},

	readContentAsFloats: function(xmlnode)
	{
		if(!xmlnode) return null;
		var text = xmlnode.textContent;
		text = text.replace(/\n/gi, " "); //remove line breaks
		text = text.replace(/\s\s+/gi, " ");
		text = text.replace(/\t/gi, "");
		text = text.trim(); //remove empty spaces
		var numbers = text.split(" "); //create array
		var count = xmlnode.getAttribute("count");
		var length = count ? parseInt( count  ) : numbers.length;
		var floats = new Float32Array( length );
		for(var k = 0; k < numbers.length; k++)
			floats[k] = parseFloat( numbers[k] );
		return floats;
	},
	
	readContentAsStringsArray: function(xmlnode)
	{
		if(!xmlnode) return null;
		var text = xmlnode.textContent;
		text = text.replace(/\n/gi, " "); //remove line breaks
		text = text.replace(/\s\s/gi, " ");
		text = text.trim(); //remove empty spaces
		var words = text.split(" "); //create array
		for(var k = 0; k < words.length; k++)
			words[k] = words[k].trim();
		if(xmlnode.getAttribute("count") && parseInt(xmlnode.getAttribute("count")) != words.length)
		{
			var merged_words = [];
			var name = "";
			for (var i in words)
			{
				if(!name)
					name = words[i];
				else
					name += " " + words[i];
				if(!this._nodes_by_id[ this.safeString(name) ])
					continue;
				merged_words.push( this.safeString(name) );
				name = "";
			}

			var count = parseInt(xmlnode.getAttribute("count"));
			if(merged_words.length == count)
				return merged_words;

			console.error("Error: bone names have spaces, avoid using spaces in names");
			return null;
		}
		return words;
	},

	max3d_matrix_0: new Float32Array([0, -1, 0, 0, 0, 0, -1, 0, 1, 0, 0, -0, 0, 0, 0, 1]),
	//max3d_matrix_other: new Float32Array([0, -1, 0, 0, 0, 0, -1, 0, 1, 0, 0, -0, 0, 0, 0, 1]),

	transformMatrix: function(matrix, first_level, inverted)
	{
		mat4.transpose(matrix,matrix);

		if(this.no_flip)
			return matrix;

		//WARNING: DO NOT CHANGE THIS FUNCTION, THE SKY WILL FALL
		if(first_level){

			//flip row two and tree
			var temp = new Float32Array(matrix.subarray(4,8)); //swap rows
			matrix.set( matrix.subarray(8,12), 4 );
			matrix.set( temp, 8 );

			//reverse Z
			temp = matrix.subarray(8,12);
			vec4.scale(temp,temp,-1);
		}
		else 
		{
			var M = mat4.create();
			var m = matrix;

			//if(inverted) mat4.invert(m,m);

			/* non trasposed
			M.set([m[0],m[8],-m[4]], 0);
			M.set([m[2],m[10],-m[6]], 4);
			M.set([-m[1],-m[9],m[5]], 8);
			M.set([m[3],m[11],-m[7]], 12);
			*/

			M.set([m[0],m[2],-m[1]], 0);
			M.set([m[8],m[10],-m[9]], 4);
			M.set([-m[4],-m[6],m[5]], 8);
			M.set([m[12],m[14],-m[13]], 12);

			m.set(M);

			//if(inverted) mat4.invert(m,m);

		}
		return matrix;
	},

	mergeMeshes: function( meshes, options )
	{
		options = options || {};

		var vertex_buffers = {};
		var index_buffers = {};
		var offsets = {}; //tells how many positions indices must be offseted
		var vertex_offsets = [];
		var current_vertex_offset = 0;
		var groups = [];

		var index_buffer_names = {
			triangles: true,
			wireframe: true
		};

		var remap = null;
		var remap_offset = 0;

		//vertex buffers
		//compute size
		for(var i = 0; i < meshes.length; ++i)
		{
			var mesh = meshes[i];
			var offset = current_vertex_offset;
			vertex_offsets.push( offset );
			var length = mesh.vertices.length / 3;
			current_vertex_offset += length;

			for(var j in mesh)
			{
				var buffer = mesh[j];

				if( j == "info" || j == "_remap" )
					continue;

				if( index_buffer_names[j] )
				{
					if(!index_buffers[j])
						index_buffers[j] = buffer.length;
					else
						index_buffers[j] += buffer.length;
				}
				else
				{
					if(!vertex_buffers[j])
						vertex_buffers[j] = buffer.length;
					else
						vertex_buffers[j] += buffer.length;
				}
			}

			//groups
			var group = {
				name: "mesh_" + ( mesh.info.material || i ),
				start: offset,
				length: length,
				material: ( mesh.info.material || "" )
			};

			groups.push( group );
		}

		//allocate
		for(var j in vertex_buffers)
		{
			var datatype = options[j];
			if(datatype === null)
			{
				delete vertex_buffers[j];
				continue;
			}

			if(!datatype)
				datatype = Float32Array;

			vertex_buffers[j] = new datatype( vertex_buffers[j] );
			offsets[j] = 0;
		}

		for(var j in index_buffers)
		{
			index_buffers[j] = new Uint32Array( index_buffers[j] );
			offsets[j] = 0;
		}

		//store
		for(var i = 0; i < meshes.length; ++i)
		{
			var mesh = meshes[i];
			var offset = 0;

			var buffer = mesh.vertices;
			if(!buffer)
				return console.error("mesh without vertices");
			var length = buffer.length / 3;
			
			for(var j in mesh)
			{
				var buffer = mesh[j];
				if( j == "info")
					continue;

				if(j == "_remap")
				{
					if(remap_offset)
						apply_offset( buffer, 0, buffer.length, remap_offset );

					if(!remap)
					{
						remap = new Uint32Array( buffer.length );
						remap.set( buffer );
					}
					else
					{
						var new_remap = new Uint32Array( remap.length + buffer.length );
						new_remap.set( remap );
						new_remap.set( buffer, remap.length );
						remap = new_remap;
					}
					remap_offset += length;
				}

				//INDEX BUFFER
				if( index_buffer_names[j] )
				{
					index_buffers[j].set( buffer, offsets[j] );
					apply_offset( index_buffers[j], offsets[j], buffer.length, vertex_offsets[i] );
					offsets[j] += buffer.length;
					continue;
				}

				//VERTEX BUFFER
				if(!vertex_buffers[j])
					continue;

				vertex_buffers[j].set( buffer, offsets[j] );
				offsets[j] += buffer.length;
			}
		}

		function apply_offset( array, start, length, offset )
		{
			var l = start + length;
			for(var i = start; i < l; ++i)
				array[i] += offset;
		}

		var extra = { info: { groups: groups } };
		var final_mesh = { info: { groups: groups } };
		for(var i in vertex_buffers)
			final_mesh[i] = vertex_buffers[i];
		for(var i in index_buffers)
			final_mesh[i] = index_buffers[i];

		if( remap )
			final_mesh._remap = remap;
		return final_mesh;
	}
};


//add worker launcher
if(!isWorker)
{
	Collada.launchWorker = function()
	{
		var worker = this.worker = new Worker( Collada.workerPath + "collada.js" );
		worker.callback_ids = {};

		worker.addEventListener('error', function(e){
			if (Collada.onerror)
				Collada.onerror(err);
		});

		//main thread receives a message from worker
		worker.addEventListener('message', function(e) {
			if(!e.data)
				return;

			var data = e.data;

			switch(data.action)
			{
				case "log": console.log.apply( console, data.params ); break;
				case "warn": console.warn.apply( console, data.params ); break;
				case "exception": 
					console.error.apply( console, data.params ); 
					if(Collada.onerror)
						Collada.onerror(data.msg);
					break;
				case "error": console.error.apply( console, data.params ); break;
				case "result": 
					var callback = this.callback_ids[ data.callback_id ];
					if(!callback)
						throw("callback not found");
					callback( data.result );
					break;
				default:
					console.warn("Unknown action:", data.action);
					break;
			}
		});

		this.callback_ids = {};
		this.last_callback_id = 1;

		this.toWorker("init", [this.config] );
	}

	Collada.toWorker = function( func_name, params, callback )
	{
		if(!this.worker)
			this.launchWorker();

		var id = this.last_callback_id++;
		this.worker.callback_ids[ id ] = callback;
		this.worker.postMessage({ func: func_name, params: params, callback_id: id });
	}

	Collada.loadInWorker = function( url, callback )
	{
		this.toWorker("loadInWorker", [url], callback );
	}

	Collada.parseInWorker = function( data, callback )
	{
		this.toWorker("parseInWorker", [data], callback );
	}

}
else //in worker
{
	Collada.loadInWorker = function(callback, url) { 
		Collada.load(url, callback);
	}

	Collada.parseInWorker = function(callback, data) { 
		callback( Collada.parse(data) );
	}
}


function request(url, callback)
{
	var req = new XMLHttpRequest();
	req.onload = function() {
		var response = this.response;
		if(this.status != 200)
			return;
		if(callback)
			callback(this.response);
	};
	if(url.indexOf("://") == -1)
		url = Collada.dataPath + url;
	req.open("get", url, true);
	req.send();
}

//global event catcher
if(isWorker)
{
	self.addEventListener('message', function(e) {

		if(e.data.func == "init")
			return Collada.init.apply( Collada, e.data.params );

		var func_name = e.data.func;
		var params = e.data.params;
		var callback_id = e.data.callback_id;

		//callback when the work is done
		var callback = function(result){
			self.postMessage({action:"result", callback_id: callback_id, result: result}, Collada._transferables );
			Collada._transferables = null;
		}

		var func = Collada[func_name];

		if( func === undefined)
		{
			console.error("function not found:", func_name);
			callback(null);
		}
		else
		{
			try
			{
				func.apply( Collada, params ? [callback].concat(params) : [callback]);
			}
			catch (err)
			{
				console.error("Error inside worker function call to " + func_name + " :: " + err);
				callback(null);
			}
		}

	}, false);
}

})( typeof(window) != "undefined" ? window : self );