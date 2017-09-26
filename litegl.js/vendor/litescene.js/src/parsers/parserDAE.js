
var parserDAE = {
	extension: "dae",
	type: "scene",
	resource: "SceneNode",
	format: "text",
	dataType:'text',

	parse: function( data, options, filename )
	{
		if(!data || data.constructor !== String)
		{
			console.error("DAE parser requires string");
			return null;
		}

		Collada.material_translate_table = {
			reflectivity: "reflection_factor",
			specular: "specular_factor",
			shininess: "specular_gloss",
			emission: "emissive",
			diffuse: "color"
		}; //this is done to match LS specification

		var clean_filename = LS.RM.getFilename( filename );

		//parser moved to Collada.js library
		var scene = Collada.parse( data, options, clean_filename );
		console.log( scene ); 

		scene.root.name = clean_filename;

		//apply 90 degrees rotation to match the Y UP AXIS of the system
		if( scene.metadata && scene.metadata.up_axis == "Z_UP" )
			scene.root.model = mat4.rotateX( mat4.create(), mat4.create(), -90 * 0.0174532925 );

		//rename meshes, nodes, etc
		var renamed = {};
		var basename = clean_filename.substr(0, clean_filename.indexOf("."));

		//rename meshes names
		var renamed_meshes = {};
		for(var i in scene.meshes)
		{
			var newmeshname = basename + "__" + i;
			newmeshname = newmeshname.replace(/[^a-z0-9]/gi,"_"); //newmeshname.replace(/ /#/g,"_");
			renamed[ i ] = newmeshname;
			renamed_meshes[ newmeshname ] = scene.meshes[i];
		}
		scene.meshes = renamed_meshes;

		for(var i in scene.meshes)
		{
			var mesh = scene.meshes[i];
			this.processMesh( mesh, renamed );
		}

		//change local collada ids to valid uids 
		inner_replace_names( scene.root );

		function inner_replace_names( node )
		{
			//change uid
			if(node.id && !options.skip_renaming )
			{
				node.uid = "@" + basename + "::" + node.id;
				renamed[ node.id ] = node.uid;
			}
			
			//in case the node has some kind of type
			if(node.type)
			{
				node.node_type = node.type;
				delete node.type; //to be sure it doesnt overlaps with some existing var
			}

			//change mesh names to engine friendly ids
			if(node.meshes)
			{
				for(var i = 0; i < node.meshes.length; i++)
					if(node.meshes[i] && renamed[ node.meshes[i] ])
						node.meshes[i] = renamed[ node.meshes[i] ];
			}
			if(node.mesh && renamed[ node.mesh ])
				node.mesh = renamed[ node.mesh ];

			if(node.children)
				for(var i in node.children)
					inner_replace_names( node.children[i] );
		}

		//replace skinning joint ids
		for(var i in scene.meshes)
		{
			var mesh = scene.meshes[i];
			if(mesh.bones)
			{
				for(var j in mesh.bones)
				{
					var id = mesh.bones[j][0];
					var uid = renamed[ id ];
					if(uid)
						mesh.bones[j][0] = uid;
				}
			}
		}

		//Materials need some renames
		for(var i in scene.materials)
			this.processMaterial( scene.materials[i] );

		//check resources
		for(var i in scene.resources)
		{
			var res = scene.resources[i];
			if(res.object_class == "Animation")
				this.processAnimation( res, renamed );
		}

		return scene;
	},

	processMesh: function( mesh, renamed )
	{
		if(!mesh.vertices)
			return; //mesh without vertices?!

		var num_vertices = mesh.vertices.length / 3;
		var num_coords = mesh.coords ? mesh.coords.length / 2 : 0;

		if(num_coords && num_coords != num_vertices )
		{
			var old_coords = mesh.coords;
			var new_coords = new Float32Array( num_vertices * 2 );

			if(num_coords > num_vertices) //check that UVS have 2 components (MAX export 3 components for UVs)
			{
				for(var i = 0; i < num_vertices; ++i )
				{
					new_coords[i*2] = old_coords[i*3];
					new_coords[i*2+1] = old_coords[i*3+1];
				}
			}
			mesh.coords = new_coords;
		}

		//rename morph targets names
		if(mesh.morph_targets)
			for(var j = 0; j < mesh.morph_targets.length; ++j)
			{
				var morph = mesh.morph_targets[j];
				if(morph.mesh && renamed[ morph.mesh ])
					morph.mesh = renamed[ morph.mesh ];
			}
	},

	//depending on the 3D software used, animation tracks could be tricky to handle
	processAnimation: function( animation, renamed )
	{
		for(var i in animation.takes)
		{
			var take = animation.takes[i];

			//apply renaming
			for(var j = 0; j < take.tracks.length; ++j)
			{
				var track = take.tracks[j];
				var pos = track.property.indexOf("/");
				if(!pos)
					continue;
				var nodename = track.property.substr(0,pos);
				var extra = track.property.substr(pos);
				if(extra == "/transform") //blender exports matrices as transform
					extra = "/matrix";

				if( !renamed[nodename] )
					continue;

				nodename = renamed[ nodename ];
				track.property = nodename + extra;
			}

			//rotations could come in different ways, some of them are accumulative, which doesnt work in litescene, so we have to accumulate them previously
			var rotated_nodes = {};
			for(var j = 0; j < take.tracks.length; ++j)
			{
				var track = take.tracks[j];
				track.packed_data = true; //hack: this is how it works my loader
				if(track.name == "rotateX.ANGLE" || track.name == "rotateY.ANGLE" || track.name == "rotateZ.ANGLE")
				{
					var nodename = track.property.split("/")[0];
					if(!rotated_nodes[nodename])
						rotated_nodes[nodename] = { tracks: [] };
					rotated_nodes[nodename].tracks.push( track );
				}
			}

			for(var j in rotated_nodes)
			{
				var info = rotated_nodes[j];
				var newtrack = { data: [], type: "quat", value_size: 4, property: j + "/Transform/rotation", name: "rotation" };
				var times = [];

				//collect timestamps
				for(var k = 0; k < info.tracks.length; ++k)
				{
					var track = info.tracks[k];
					var data = track.data;
					for(var w = 0; w < data.length; w+=2)
						times.push( data[w] );
				}

				//create list of timestamps and remove repeated ones
				times.sort();
				var last_time = -1;
				var final_times = [];
				for(var k = 0; k < times.length; ++k)
				{
					if(times[k] == last_time)
						continue;
					final_times.push( times[k] );
					last_time = times[k];
				}
				times = final_times;

				//create samples
				newtrack.data.length = times.length;
				for(var k = 0; k < newtrack.data.length; ++k)
				{
					var time = times[k];
					var value = quat.create();
					//create keyframe
					newtrack.data[k] = [time, value];

					for(var w = 0; w < info.tracks.length; ++w)
					{
						var track = info.tracks[w];
						var sample = getTrackSample( track, time );
						if(!sample) //nothing to do if no sample or 0
							continue;
						sample *= 0.0174532925; //degrees to radians
						switch( track.name )
						{
							case "rotateX.ANGLE": quat.rotateX( value, value, -sample ); break;
							case "rotateY.ANGLE": quat.rotateY( value, value, sample ); break;
							case "rotateZ.ANGLE": quat.rotateZ( value, value, sample ); break;
						}
					}
				}

				//add track
				take.tracks.push( newtrack );

				//remove old rotation tracks
				for(var w = 0; w < info.tracks.length; ++w)
				{
					var track = info.tracks[w];
					var pos = take.tracks.indexOf( track );
					if(pos == -1)
						continue;
					take.tracks.splice(pos,1);
				}
			}

		}//takes

		function getTrackSample( track, time )
		{
			var data = track.data;
			var l = data.length;
			for(var t = 0; t < l; t+=2)
			{
				if(data[t] == time)
					return data[t+1];
				if(data[t] > time)
					return null;
			}
			return null;
		}
	},

	processMaterial: function(material)
	{
		material.object_class = "StandardMaterial";

		if(material.transparency)
		{
			material.opacity = 1.0 - parseFloat( material.transparency );
			if(material.transparent)
				material.opacity = material.transparency; //why? dont know but works
		}

		//collada supports materials with colors as specular_factor but StandardMaterial only support one value
		if(material.specular_factor && material.specular_factor.length)
			material.specular_factor = material.specular_factor[0];

		if(material.textures)
		{
			for(var i in material.textures)
			{
				var tex_info = material.textures[i];
				var coords = LS.Material.COORDS_UV0;
				if( tex_info.uvs == "TEX1")
					coords = LS.Material.COORDS_UV1;
				tex_info = { 
					texture: tex_info.map_id,
					uvs: coords
				};
				material.textures[i] = tex_info;
			}
		}
	}
};

LS.Formats.addSupportedFormat( "dae", parserDAE );
