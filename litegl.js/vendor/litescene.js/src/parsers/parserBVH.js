//***** BVH Parser *****************
var parserBVH = {
	extension: "bvh",
	type: "scene",
	resource: "SceneTree",
	format: 'text',
	dataType:'text',
	
	parse: function( text, options, filename )
	{
		var MODE_HIERARCHY = 1;
		var MODE_MOTION = 2;
		var MODE_MOTION_DATA = 3;

		var mode = 0;
		var root = null;
		var parent = null;
		var node = null;
		var stack = [];
		var inside_of = null;
		var channels = [];

		var num_frames = -1;
		var frame_time = -1;
		var duration = -1;
		var current_frame = 0;
		var timestamps = [];

		var translator = {
			"Xposition":"x","Yposition":"y","Zposition":"z","Xrotation":"xrotation","Yrotation":"yrotation","Zrotation":"zrotation"
		};

		var ignore = false;

		var lines = text.split("\n");
		var length = lines.length;
		for (var lineIndex = 0;  lineIndex < length; ++lineIndex)
		{
			var line = lines[lineIndex].trim();

			if (line[0] == "#")
				continue;
			if(line == "")
				continue;

			var tokens = line.split(/[\s]+/); //splits by spaces and tabs
			var cmd = tokens[0];

			if(!mode)
			{
				switch(cmd)
				{
					case "HIERARCHY":
						mode = MODE_HIERARCHY;
						break;
				}
			}
			else if(mode == MODE_HIERARCHY)
			{
				switch(cmd)
				{
					case "ROOT":
						root = node = { name: tokens[1], node_type: "JOINT" };
						break;
					case "JOINT":
						parent = node;
						stack.push(parent);
						node = { name: tokens[1], node_type: "JOINT" };
						if(!parent.children)
							parent.children = [];
						parent.children.push(node);
						break;
					case "End":
						//ignore = true;
						parent = node;
						stack.push(parent);
						node = { name: parent.name + "_end", node_type: "JOINT" };
						if(!parent.children)
							parent.children = [];
						parent.children.push(node);

						break;
					case "{":
						break;
					case "}":
						if(ignore)
							ignore = false; //ignoreEND
						else
						{
							node = stack.pop();
							if(!node)
								node = root;
							inside_of = node;
						}
						break;
					case "CHANNELS":
						for(var j = 2; j < tokens.length; ++j)
						{
							var property = tokens[j].toLowerCase();
							if(translator[property])
								property = translator[property];
							//channels.push( { name: tokens[j], property: node.name + "/" + property, type: "number", value_size: 1, data: [], packed_data: true } );
							var channel_data = { node: node, property: property, data: [] };
							channels.push( channel_data );
							if(!node._channels)
								node._channels = {};
							if(!node._channels_order)
								node._channels_order = [];
							node._channels[ property ] = channel_data;
							node._channels_order.push( property );
						}
						break;
					case "OFFSET":
						node.transform = { position: readFloats(tokens,1) };
						break;
					case "MOTION":
						mode = MODE_MOTION;
						break;
				}
			}//mode hierarchy
			else if(mode == MODE_MOTION)
			{
				if(tokens[0] == "Frames:")
					num_frames = parseInt( tokens[1] );
				else if(tokens[0] == "Frame" && tokens[1] == "Time:")
					frame_time = parseFloat( tokens[2] );

				if(num_frames != -1 && frame_time != -1)
				{
					duration = num_frames * frame_time;
					mode = MODE_MOTION_DATA;
				}
			}
			else if(mode == MODE_MOTION_DATA)
			{
				var current_time = current_frame * frame_time;
				timestamps.push( current_time );
				for(var j = 0; j < channels.length; ++j)
				{
					var channel = channels[j];
					//channel.data.push( current_time, parseFloat( tokens[j] ) );
					channel.data.push( parseFloat( tokens[j] ) );
				}

				++current_frame;
			}
		}

		function readFloats(tokens, offset)
		{
			var r = tokens.slice(offset || 0);
			return r.map(parseFloat);
		}

		//process data
		var tracks = [];
		this.processMotion( root, tracks, timestamps );

		var scene = { root: root, object_class: "SceneNode", resources: {} };

		for(var i = 0; i < tracks.length; ++i)
		{
			var track = tracks[i];
			track.duration = duration;
		}
		var animation = { name: "#animation", object_class: "Animation", takes: { "default": { name: "default", duration: duration, tracks: tracks } } };
		root.animations = animation.name;
		scene.resources[ animation["name"] ] = animation;

		console.log(scene);
		return scene;
	},

	processMotion: function( node, tracks, timestamps )
	{
		var channels = node._channels;
		if(channels)
		{
			var track_position = null;
			var track_rotation = null;

			var XAXIS = vec3.fromValues(1,0,0);
			var YAXIS = vec3.fromValues(0,1,0);
			var ZAXIS = vec3.fromValues(0,0,1);

			if(channels.xposition || channels.yposition || channels.zposition )
				track_position = { name: node.name + "/Transform/position", property: node.name + "/Transform/position", type: "vec3", value_size: 3, data: [], packed_data: true };
			if(channels.xrotation || channels.yrotation || channels.zrotation )
				track_rotation = { name: node.name + "/Transform/rotation", property: node.name + "/Transform/rotation", type: "quat", value_size: 4, data: [], packed_data: true };


			for(var j = 0; j < timestamps.length; ++j)
			{
				var time = timestamps[j];
				var pos = vec3.create();
				var R = quat.create();
				var ROT = quat.create();

				for(var i = 0; i < node._channels_order.length; ++i)
				{
					var property = node._channels_order[i];

					switch( property )
					{
						case "xposition":
							pos[0] = channels.xposition.data[j] + node.transform.position[0];
							break;
						case "yposition":
							pos[1] = channels.yposition.data[j] + node.transform.position[1];
							break;
						case "zposition":
							pos[2] = channels.zposition.data[j] + node.transform.position[2];
							break;
						case "xrotation":
							quat.setAxisAngle( ROT, XAXIS, channels.xrotation.data[j] * DEG2RAD );
							//quat.mul( R, ROT, R );
							quat.mul( R, R, ROT );
							break;
						case "yrotation":
							quat.setAxisAngle( ROT, YAXIS, channels.yrotation.data[j] * DEG2RAD );
							//quat.mul( R, ROT, R );
							quat.mul( R, R, ROT );
							break;
						case "zrotation":
							quat.setAxisAngle( ROT, ZAXIS, channels.zrotation.data[j] * DEG2RAD );
							//quat.mul( R, ROT, R );
							quat.mul( R, R, ROT );
							break;
					};
				} //per channel

				if(track_position)
					track_position.data.push( time, pos[0], pos[1], pos[2] );
				if(track_rotation)
					track_rotation.data.push( time, R[0], R[1], R[2], R[3] );
			}//per timestamp

			if(track_position)
				tracks.push( track_position );
			if(track_rotation)
				tracks.push( track_rotation );
		} //if channels

		if(node.children)
		{
			for(var i = 0; i < node.children.length; ++i)
				this.processMotion( node.children[i], tracks, timestamps );
		}
	}
};

LS.Formats.addSupportedFormat( "bvh", parserBVH );