//this module is in charge of rendering basic objects like lines, points, and primitives
//it works over litegl (no need of scene)
//carefull, it is very slow

/**
* LS.Draw allows to render basic primitives, similar to the OpenGL Fixed pipeline.
* It reuses local meshes when possible to avoid fragmenting the VRAM.
* @class Draw
* @constructor
*/

var Draw = {
	ready: false,
	images: {},
	image_last_id: 1,

	onRequestFrame: null,
	reset_stack_on_reset: true,

	/**
	* Sets up everything (prepare meshes, shaders, and so)
	* @method init
	*/
	init: function()
	{
		if(this.ready)
			return;
		if(!gl)
			return;

		this.color = new Float32Array(4);
		this.color[3] = 1;
		this.mvp_matrix = mat4.create();
		this.temp_matrix = mat4.create();
		this.point_size = 2;

		this.stack = new Float32Array(16 * 32); //stack max size
		this.model_matrix = new Float32Array(this.stack.buffer,0,16);
		mat4.identity( this.model_matrix );

		//matrices
		this.camera = null;
		this.camera_position = vec3.create();
		this.view_matrix = mat4.create();
		this.projection_matrix = mat4.create();
		this.viewprojection_matrix = mat4.create();

		this.camera_stack = []; //not used yet

		//Meshes
		var vertices = [[-1,1,0],[1,1,0],[1,-1,0],[-1,-1,0]];
		var coords = [[0,1],[1,1],[1,0],[0,0]];
		this.quad_mesh = GL.Mesh.load({vertices:vertices, coords: coords});

		var vertex_shader = '\
			precision mediump float;\n\
			attribute vec3 a_vertex;\n\
			#ifdef USE_COLOR\n\
				attribute vec4 a_color;\n\
				varying vec4 v_color;\n\
			#endif\n\
			#ifdef USE_TEXTURE\n\
				attribute vec2 a_coord;\n\
				varying vec2 v_coord;\n\
			#endif\n\
			#ifdef USE_SIZE\n\
				attribute float a_extra;\n\
			#endif\n\
			uniform mat4 u_mvp;\n\
			uniform float u_point_size;\n\
			void main() {\n\
				gl_PointSize = u_point_size;\n\
				#ifdef USE_SIZE\n\
					gl_PointSize = a_extra;\n\
				#endif\n\
				#ifdef USE_TEXTURE\n\
					v_coord = a_coord;\n\
				#endif\n\
				#ifdef USE_COLOR\n\
					v_color = a_color;\n\
				#endif\n\
				gl_Position = u_mvp * vec4(a_vertex,1.0);\n\
			}\
			';

		var pixel_shader = '\
			precision mediump float;\n\
			uniform vec4 u_color;\n\
			#ifdef USE_COLOR\n\
				varying vec4 v_color;\n\
			#endif\n\
			#ifdef USE_TEXTURE\n\
				varying vec2 v_coord;\n\
				uniform sampler2D u_texture;\n\
			#endif\n\
			void main() {\n\
				vec4 color = u_color;\n\
				#ifdef USE_TEXTURE\n\
				  color *= texture2D(u_texture, v_coord);\n\
				  if(color.a < 0.1)\n\
					discard;\n\
			    #endif\n\
				#ifdef USE_POINTS\n\
				    float dist = length( gl_PointCoord.xy - vec2(0.5) );\n\
					if( dist > 0.45 )\n\
						discard;\n\
			    #endif\n\
				#ifdef USE_COLOR\n\
					color *= v_color;\n\
				#endif\n\
				gl_FragColor = color;\n\
			}\
		';

		//create shaders
		this.shader = new Shader( vertex_shader, pixel_shader );

		this.shader_color = new Shader(vertex_shader,pixel_shader,{"USE_COLOR":""});
		this.shader_texture = new Shader(vertex_shader,pixel_shader,{"USE_TEXTURE":""});
		this.shader_points = new Shader(vertex_shader,pixel_shader,{"USE_POINTS":""});
		this.shader_points_color = new Shader(vertex_shader,pixel_shader,{"USE_COLOR":"","USE_POINTS":""});
		this.shader_points_color_size = new Shader(vertex_shader,pixel_shader,{"USE_COLOR":"","USE_SIZE":"","USE_POINTS":""});


		this.shader_image = new Shader('\
			precision mediump float;\n\
			attribute vec3 a_vertex;\n\
			uniform mat4 u_mvp;\n\
			uniform float u_point_size;\n\
			void main() {\n\
				gl_PointSize = u_point_size;\n\
				gl_Position = u_mvp * vec4(a_vertex,1.0);\n\
			}\
			','\
			precision mediump float;\n\
			uniform vec4 u_color;\n\
			uniform sampler2D u_texture;\n\
			void main() {\n\
			  vec4 tex = texture2D(u_texture, vec2(gl_PointCoord.x,1.0 - gl_PointCoord.y) );\n\
			  if(tex.a < 0.1)\n\
				discard;\n\
			  gl_FragColor = u_color * tex;\n\
			}\
		');



		this.shader_points_color_texture_size = new Shader('\
			precision mediump float;\n\
			attribute vec3 a_vertex;\n\
			attribute vec4 a_color;\n\
			attribute float a_extra;\n\
			uniform mat4 u_mvp;\n\
			uniform float u_point_size;\n\
			varying vec4 v_color;\n\
			void main() {\n\
				v_color = a_color;\n\
				gl_PointSize = u_point_size * a_extra;\n\
				gl_Position = u_mvp * vec4(a_vertex,1.0);\n\
			}\
			','\
			precision mediump float;\n\
			uniform vec4 u_color;\n\
			varying vec4 v_color;\n\
			uniform sampler2D u_texture;\n\
			void main() {\n\
			  vec4 tex = texture2D(u_texture, vec2(gl_PointCoord.x,1.0 - gl_PointCoord.y) );\n\
			  if(tex.a < 0.1)\n\
				discard;\n\
			  vec4 color = u_color * v_color * tex;\n\
			  gl_FragColor = color;\n\
			}\
		');

		//create shaders
		this.shader_phong = new Shader('\
			precision mediump float;\n\
			attribute vec3 a_vertex;\n\
			attribute vec3 a_normal;\n\
			varying vec3 v_pos;\n\
			varying vec3 v_normal;\n\
			uniform mat4 u_model;\n\
			uniform mat4 u_mvp;\n\
			void main() {\n\
				v_pos = (u_model * vec4(a_vertex,1.0)).xyz;\n\
				v_normal = (u_model * vec4(a_vertex + a_normal,1.0)).xyz - v_pos;\n\
				gl_Position = u_mvp * vec4(a_vertex,1.0);\n\
			}\
			','\
			precision mediump float;\n\
			uniform vec3 u_ambient_color;\n\
			uniform vec3 u_light_color;\n\
			uniform vec3 u_light_dir;\n\
			uniform vec4 u_color;\n\
			varying vec3 v_pos;\n\
			varying vec3 v_normal;\n\
			void main() {\n\
				vec3 N = normalize(v_normal);\n\
				float NdotL = max(0.0, dot(N,u_light_dir));\n\
				gl_FragColor = u_color * vec4(u_ambient_color + u_light_color * NdotL, 1.0);\n\
			}\
		');

		this.shader_phong.uniforms({u_ambient_color:[0.1,0.1,0.1], u_light_color:[0.8,0.8,0.8], u_light_dir: [0,1,0] });

		//create shaders
		this.shader_depth = new Shader('\
			precision mediump float;\n\
			attribute vec3 a_vertex;\n\
			varying vec4 v_pos;\n\
			uniform mat4 u_model;\n\
			uniform mat4 u_mvp;\n\
			void main() {\n\
				v_pos = u_model * vec4(a_vertex,1.0);\n\
				gl_Position = u_mvp * vec4(a_vertex,1.0);\n\
			}\
			','\
			precision mediump float;\n\
			varying vec4 v_pos;\n\
			\n\
			vec4 PackDepth32(float depth)\n\
			{\n\
				const vec4 bitSh  = vec4(   256*256*256, 256*256,   256,         1);\n\
				const vec4 bitMsk = vec4(   0,      1.0/256.0,    1.0/256.0,    1.0/256.0);\n\
				vec4 comp;\n\
				comp	= depth * bitSh;\n\
				comp	= fract(comp);\n\
				comp	-= comp.xxyz * bitMsk;\n\
				return comp;\n\
			}\n\
			void main() {\n\
				float depth = (v_pos.z / v_pos.w) * 0.5 + 0.5;\n\
				gl_FragColor = PackDepth32(depth);\n\
			}\
		');

		this.ready = true;
	},

	/**
	* A helper to create shaders when you only want to specify some basic shading
	* @method createSurfaceShader
	* @param {string} surface_function GLSL code like: "vec4 surface_function( vec3 pos, vec3 normal, vec2 coord ) { return vec4(1.0); } ";
	* @param {object} macros [optional] object containing the macros and value
	* @param {object} uniforms [optional] object with name and type
	* @return {GL.Shader} the resulting shader
	*/
	createSurfaceShader: function( surface_function, uniforms, macros )
	{
		//"vec4 surface_function( vec3 pos, vec3 normal, vec2 coord ) { return vec4(1.0); } ";

		if( surface_function.indexOf("surface_function") == -1 )
			surface_function = "vec4 surface_function( vec3 pos, vec3 normal, vec2 coord ) { " + surface_function + "\n } ";

		if(uniforms)
		{
			if (uniforms.constructor === String)
				surface_function = uniforms + ";\n" + surface_function;
			else
				for(var i in uniforms)
					surface_function += "uniform " + uniforms[i] + " " + i + ";\n";
		}

		var vertex_shader = "\
			precision mediump float;\n\
			attribute vec3 a_vertex;\n\
			attribute vec3 a_normal;\n\
			attribute vec2 a_coord;\n\
			varying vec2 v_coord;\n\
			varying vec3 v_pos;\n\
			varying vec3 v_normal;\n\
			uniform mat4 u_mvp;\n\
			uniform mat4 u_model;\n\
			void main() {\n\
				v_coord = a_coord;\n\
				v_pos = (u_model * vec4(a_vertex,1.0)).xyz;\n\
				v_normal = (u_model * vec4(a_normal,0.0)).xyz;\n\
				gl_Position = u_mvp * vec4(a_vertex,1.0);\n\
			}\
			";

		var pixel_shader = "\
			precision mediump float;\n\
			varying vec2 v_coord;\n\
			varying vec3 v_pos;\n\
			varying vec3 v_normal;\n\
			uniform vec4 u_color;\n\
			uniform vec3 u_camera_position;\n\
			uniform sampler2D u_texture;\n\
			"+ surface_function +"\n\
			void main() {\n\
				gl_FragColor = surface_function(v_pos,v_normal,v_coord);\n\
			}\
		";	

		return new GL.Shader( vertex_shader, pixel_shader, macros );
	},

	/**
	* clears the stack
	* @method reset
	*/
	reset: function( reset_memory )
	{
		if(!this.ready)
			this.init();

		if( reset_memory )
			this.images = {}; //clear images

		if(this.reset_stack_on_reset)
		{
			this.model_matrix = new Float32Array(this.stack.buffer,0,16);
			mat4.identity( this.model_matrix );
		}
	},

	/**
	* Sets the color used to paint primitives
	* @method setColor
	* @param {vec3|vec4} color
	*/
	setColor: function(color)
	{
		for(var i = 0; i < color.length; i++)
			this.color[i] = color[i];
	},

	/**
	* Sets the alpha used to paint primitives
	* @method setAlpha
	* @param {number} alpha
	*/
	setAlpha: function(alpha)
	{
		this.color[3] = alpha;
	},

	/**
	* Sets the point size
	* @method setPointSize
	* @param {number} v
	*/
	setPointSize: function(v)
	{
		this.point_size = v;
	},

	/**
	* Sets the camera to use during the rendering, this is already done by LS.Renderer
	* @method setCamera
	* @param {LS.Camera} camera
	*/
	setCamera: function( camera )
	{
		this.camera = camera;
		camera.updateMatrices();
		vec3.copy( this.camera_position, camera.getEye() );	
		mat4.copy( this.view_matrix, camera._view_matrix );
		mat4.copy( this.projection_matrix, camera._projection_matrix );
		mat4.copy( this.viewprojection_matrix, camera._viewprojection_matrix );
	},

	/**
	* Specifies the camera position (used to compute point size)
	* @method setCameraPosition
	* @param {vec3} center
	*/
	setCameraPosition: function(center)
	{
		vec3.copy( this.camera_position, center);
	},

	pushCamera: function()
	{
		this.camera_stack.push( mat4.create( this.viewprojection_matrix ) );
	},

	popCamera: function()
	{
		if(this.camera_stack.length == 0)
			throw("too many pops");
		this.viewprojection_matrix.set( this.camera_stack.pop() );
	},

	/**
	* Specifies the camera view and projection matrices
	* @method setViewProjectionMatrix
	* @param {mat4} view
	* @param {mat4} projection
	* @param {mat4} vp viewprojection matrix [optional]
	*/
	setViewProjectionMatrix: function(view, projection, vp)
	{
		mat4.copy( this.view_matrix, view);
		mat4.copy( this.projection_matrix, projection);
		if(vp)
			mat4.copy( this.viewprojection_matrix, vp);
		else
			mat4.multiply( this.viewprojection_matrix, view, vp);
	},

	/**
	* Specifies the transformation matrix to apply to the mesh
	* @method setMatrix
	* @param {mat4} matrix
	*/
	setMatrix: function(matrix)
	{
		mat4.copy(this.model_matrix, matrix);
	},

	/**
	* Multiplies the current matrix by a given one
	* @method multMatrix
	* @param {mat4} matrix
	*/
	multMatrix: function(matrix)
	{
		mat4.multiply(this.model_matrix, matrix, this.model_matrix);
	},

	/**
	* Render lines given a set of points
	* @method renderLines
	* @param {Float32Array|Array} points
	* @param {Float32Array|Array} colors [optional]
	* @param {bool} strip [optional] if the lines are a line strip (one consecutive line)
	* @param {bool} loop [optional] if strip, close loop
	*/
	renderLines: function(lines, colors, strip, loop)
	{
		if(!lines || !lines.length) return;
		var vertices = null;

		vertices = lines.constructor == Float32Array ? lines : this.linearize(lines);
		if(colors)
			colors = colors.constructor == Float32Array ? colors : this.linearize(colors);
		if(colors && (colors.length/4) != (vertices.length/3))
			colors = null;

		var type = gl.LINES;
		if(loop)
			type = gl.LINE_LOOP;
		else if(strip)
			type = gl.LINE_STRIP;

		var mesh = this.toGlobalMesh({vertices: vertices, colors: colors});
		return this.renderMesh( mesh, type, colors ? this.shader_color : this.shader, undefined, 0, vertices.length / 3 );
	},

	/**
	* Render points given a set of positions (and colors)
	* @method renderPoints
	* @param {Float32Array|Array} points
	* @param {Float32Array|Array} colors [optional]
	* @param {GL.Shader} shader [optional]
	*/
	renderPoints: function(points, colors, shader)
	{
		if(!points || !points.length)
			return;

		var vertices = null;

		if(points.constructor == Float32Array)
			vertices = points;
		else if(points[0].length) //array of arrays
			vertices = this.linearize(points);
		else
			vertices = new Float32Array(points);

		if(colors && colors.constructor != Float32Array)
		{
			if(colors.constructor === Array && colors[0].constructor === Number)
				colors = new Float32Array( colors );
			else
				colors = this.linearize(colors);
		}

		var mesh = this.toGlobalMesh({vertices: vertices, colors: colors});
		if(!shader)
			shader = colors ? this.shader_color : this.shader;

		return this.renderMesh(mesh, gl.POINTS, shader, undefined, 0, vertices.length / 3 );
	},

	/**
	* Render round points given a set of positions (and colors)
	* @method renderRoundPoints
	* @param {Float32Array|Array} points
	* @param {Float32Array|Array} colors [optional]
	* @param {GL.Shader} shader [optional]
	*/
	renderRoundPoints: function(points, colors, shader)
	{
		if(!points || !points.length)
			return;

		var vertices = null;

		if(points.constructor == Float32Array)
			vertices = points;
		else if(points[0].length) //array of arrays
			vertices = this.linearize(points);
		else
			vertices = new Float32Array(points);

		if(colors)
			colors = colors.constructor == Float32Array ? colors : this.linearize(colors);

		var mesh = this.toGlobalMesh({vertices: vertices, colors: colors});
		if(!shader)
			shader = colors ? this.shader_points_color : this.shader_points;
		return this.renderMesh( mesh, gl.POINTS, shader, undefined, 0, vertices.length / 3 );
	},

	/**
	* Render points with color, size, and texture binded in 0
	* @method renderPointsWithSize
	* @param {Float32Array|Array} points
	* @param {Float32Array|Array} colors [optional]
	* @param {Float32Array|Array} sizes [optional]
	* @param {GL.Texture} texture [optional]
	* @param {GL.Shader} shader [optional]
	*/
	renderPointsWithSize: function(points, colors, sizes, texture, shader)
	{
		if(!points || !points.length) return;
		var vertices = null;

		if(points.constructor == Float32Array)
			vertices = points;
		else if(points[0].length) //array of arrays
			vertices = this.linearize(points);
		else
			vertices = new Float32Array(points);

		if(!colors)
			throw("colors required in Draw.renderPointsWithSize");
		colors = colors.constructor == Float32Array ? colors : this.linearize(colors);
		if(!sizes)
			throw("sizes required in Draw.renderPointsWithSize");
		sizes = sizes.constructor == Float32Array ? sizes : this.linearize(sizes);

		var mesh = this.toGlobalMesh({vertices: vertices, colors: colors, extra: sizes});
		shader = shader || (texture ? this.shader_points_color_texture_size : this.shader_points_color_size);
		
		return this.renderMesh(mesh, gl.POINTS, shader, undefined, 0, vertices.length / 3 );
	},

	createRectangleMesh: function(width, height, in_z, use_global)
	{
		var vertices = new Float32Array(4 * 3);
		if(in_z)
			vertices.set([-width*0.5,0,height*0.5, width*0.5,0,height*0.5, width*0.5,0,-height*0.5, -width*0.5,0,-height*0.5]);
		else
			vertices.set([-width*0.5,height*0.5,0, width*0.5,height*0.5,0, width*0.5,-height*0.5,0, -width*0.5,-height*0.5,0]);

		if(use_global)
			return this.toGlobalMesh( {vertices: vertices} );

		return GL.Mesh.load({vertices: vertices});
	},

	/**
	* Render a wireframe rectangle of width x height 
	* @method renderRectangle
	* @param {number} width
	* @param {number} height
	* @param {boolean} in_z [optional] if the plane is aligned with the z plane
	*/
	renderRectangle: function(width, height, in_z)
	{
		var mesh = this.createRectangleMesh(width, height, in_z, true);
		return this.renderMesh( mesh, gl.LINE_LOOP, undefined, undefined, 0, this._global_mesh_last_size );
	},

	createCircleMesh: function(radius, segments, in_z, use_global)
	{
		segments = segments || 32;
		var axis = [0,1,0];
		var num_segments = segments || 100;
		var R = quat.create();
		var temp = vec3.create();
		var vertices = new Float32Array(num_segments * 3);

		var offset =  2 * Math.PI / num_segments;

		for(var i = 0; i < num_segments; i++)
		{
			temp[0] = Math.sin(offset * i) * radius;
			if(in_z)
			{
				temp[1] = 0;
				temp[2] = Math.cos(offset * i) * radius;
			}
			else
			{
				temp[2] = 0;
				temp[1] = Math.cos(offset * i) * radius;
			}

			vertices.set(temp, i*3);
		}

		if(use_global)
			return this.toGlobalMesh({vertices: vertices});

		return GL.Mesh.load({vertices: vertices});
	},

	/**
	* Renders a circle 
	* @method renderCircle
	* @param {number} radius
	* @param {number} segments
	* @param {boolean} in_z [optional] if the circle is aligned with the z plane
	* @param {boolean} filled [optional] renders the interior
	*/
	renderCircle: function(radius, segments, in_z, filled)
	{
		var mesh = this.createCircleMesh(radius, segments, in_z, true);
		return this.renderMesh(mesh, filled ? gl.TRIANGLE_FAN : gl.LINE_LOOP, undefined, undefined, 0, this._global_mesh_last_size );
	},

	/**
	* Render a filled circle
	* @method renderSolidCircle
	* @param {number} radius
	* @param {number} segments
	* @param {boolean} in_z [optional] if the circle is aligned with the z plane
	*/
	renderSolidCircle: function(radius, segments, in_z)
	{
		return this.renderCircle(radius, segments, in_z, true);
	},

	createWireSphereMesh: function(radius, segments, use_global )
	{
		var axis = [0,1,0];
		segments = segments || 100;
		var R = quat.create();
		var temp = vec3.create();
		var vertices = new Float32Array( segments * 2 * 3 * 3); 

		var delta = 1.0 / segments * Math.PI * 2;

		for(var i = 0; i < segments; i++)
		{
			temp.set([ Math.sin( i * delta) * radius, Math.cos( i * delta) * radius, 0]);
			vertices.set(temp, i*18);
			temp.set([Math.sin( (i+1) * delta) * radius, Math.cos( (i+1) * delta) * radius, 0]);
			vertices.set(temp, i*18 + 3);

			temp.set([ Math.sin( i * delta) * radius, 0, Math.cos( i * delta) * radius ]);
			vertices.set(temp, i*18 + 6);
			temp.set([Math.sin( (i+1) * delta) * radius, 0, Math.cos( (i+1) * delta) * radius ]);
			vertices.set(temp, i*18 + 9);

			temp.set([ 0, Math.sin( i * delta) * radius, Math.cos( i * delta) * radius ]);
			vertices.set(temp, i*18 + 12);
			temp.set([ 0, Math.sin( (i+1) * delta) * radius, Math.cos( (i+1) * delta) * radius ]);
			vertices.set(temp, i*18 + 15);
		}

		if(use_global)
			return this.toGlobalMesh({vertices: vertices});
		
		return GL.Mesh.load({vertices: vertices});
	},

	/**
	* Renders three circles to form a simple spherical shape
	* @method renderWireSphere
	* @param {number} radius
	* @param {number} segments
	*/
	renderWireSphere: function(radius, segments)
	{
		var mesh = this.createWireSphereMesh( radius, segments, true );
		return this.renderMesh( mesh, gl.LINES, undefined, undefined, 0, this._global_mesh_last_size );
	},

	/**
	* Renders an sphere
	* @method renderSolidSphere
	* @param {number} radius
	*/
	renderSolidSphere: function(radius)
	{
		var mesh = this._sphere_mesh;
		if(!this._sphere_mesh)
			mesh = this._sphere_mesh = GL.Mesh.sphere({ size: 1 });
		this.push();
		this.scale( radius,radius,radius );
		this.renderMesh( mesh, gl.TRIANGLES );
		this.pop();
	},


	createWireBoxMesh: function( sizex, sizey, sizez, use_global )
	{
		sizex = sizex*0.5;
		sizey = sizey*0.5;
		sizez = sizez*0.5;
		var vertices = new Float32Array([-sizex,sizey,sizez , -sizex,sizey,-sizez, sizex,sizey,-sizez, sizex,sizey,sizez,
						-sizex,-sizey,sizez, -sizex,-sizey,-sizez, sizex,-sizey,-sizez, sizex,-sizey,sizez]);
		var triangles = new Uint16Array([0,1, 0,4, 0,3, 1,2, 1,5, 2,3, 2,6, 3,7, 4,5, 4,7, 6,7, 5,6   ]);

		if(use_global)
			return this.toGlobalMesh( {vertices: vertices}, triangles );

		return GL.Mesh.load({vertices: vertices, lines:triangles });
	},

	/**
	* Renders a wire box (box made of lines, not filled)
	* @method renderWireBox
	* @param {number} sizex
	* @param {number} sizey
	* @param {number} sizez
	*/
	renderWireBox: function(sizex,sizey,sizez)
	{
		var mesh = this.createWireBoxMesh(sizex,sizey,sizez, true);
		return this.renderMesh( mesh, gl.LINES, undefined, "indices", 0, this._global_mesh_last_size );
	},

	createSolidBoxMesh: function( sizex,sizey,sizez, use_global)
	{
		sizex = sizex*0.5;
		sizey = sizey*0.5;
		sizez = sizez*0.5;
		//var vertices = [[-sizex,sizey,-sizez],[-sizex,-sizey,+sizez],[-sizex,sizey,sizez],[-sizex,sizey,-sizez],[-sizex,-sizey,-sizez],[-sizex,-sizey,+sizez],[sizex,sizey,-sizez],[sizex,sizey,sizez],[sizex,-sizey,+sizez],[sizex,sizey,-sizez],[sizex,-sizey,+sizez],[sizex,-sizey,-sizez],[-sizex,sizey,sizez],[sizex,-sizey,sizez],[sizex,sizey,sizez],[-sizex,sizey,sizez],[-sizex,-sizey,sizez],[sizex,-sizey,sizez],[-sizex,sizey,-sizez],[sizex,sizey,-sizez],[sizex,-sizey,-sizez],[-sizex,sizey,-sizez],[sizex,-sizey,-sizez],[-sizex,-sizey,-sizez],[-sizex,sizey,-sizez],[sizex,sizey,sizez],[sizex,sizey,-sizez],[-sizex,sizey,-sizez],[-sizex,sizey,sizez],[sizex,sizey,sizez],[-sizex,-sizey,-sizez],[sizex,-sizey,-sizez],[sizex,-sizey,sizez],[-sizex,-sizey,-sizez],[sizex,-sizey,sizez],[-sizex,-sizey,sizez]];
		var vertices = [-sizex,sizey,-sizez,-sizex,-sizey,+sizez,-sizex,sizey,sizez,-sizex,sizey,-sizez,-sizex,-sizey,-sizez,-sizex,-sizey,+sizez,sizex,sizey,-sizez,sizex,sizey,sizez,sizex,-sizey,+sizez,sizex,sizey,-sizez,sizex,-sizey,+sizez,sizex,-sizey,-sizez,-sizex,sizey,sizez,sizex,-sizey,sizez,sizex,sizey,sizez,-sizex,sizey,sizez,-sizex,-sizey,sizez,sizex,-sizey,sizez,-sizex,sizey,-sizez,sizex,sizey,-sizez,sizex,-sizey,-sizez,-sizex,sizey,-sizez,sizex,-sizey,-sizez,-sizex,-sizey,-sizez,-sizex,sizey,-sizez,sizex,sizey,sizez,sizex,sizey,-sizez,-sizex,sizey,-sizez,-sizex,sizey,sizez,sizex,sizey,sizez,-sizex,-sizey,-sizez,sizex,-sizey,-sizez,sizex,-sizey,sizez,-sizex,-sizey,-sizez,sizex,-sizey,sizez,-sizex,-sizey,sizez];
		if(use_global)
			return this.toGlobalMesh( {vertices: vertices} );

		return GL.Mesh.load({vertices: vertices });
	},

	/**
	* Renders a solid box 
	* @method renderSolidBox
	* @param {number} sizex
	* @param {number} sizey
	* @param {number} sizez
	*/
	renderSolidBox: function(sizex,sizey,sizez)
	{
		var mesh = this.createSolidBoxMesh(sizex,sizey,sizez, true);
		return this.renderMesh( mesh, gl.TRIANGLES, undefined, undefined, 0, this._global_mesh_last_size );
	},

	/**
	* Renders a wire cube of size size
	* @method renderWireCube
	* @param {number} size
	*/
	renderWireCube: function(size)
	{
		return this.renderWireBox(size,size,size);
	},

	/**
	* Renders a solid cube of size size
	* @method renderSolidCube
	* @param {number} size
	*/
	renderSolidCube: function(size)
	{
		return this.renderSolidCube(size,size,size);
	},

	/**
	* Renders a solid plane (could be textured or even with an specific shader)
	* @method renderPlane
	* @param {vec3} position
	* @param {vec2} size
	* @param {GL.Texture} texture
	* @param {GL.Shader} shader
	*/
	renderPlane: function( position, size, texture, shader)
	{
		if(!position || !size)
			throw("LS.Draw.renderPlane param missing");

		this.push();
		this.translate(position);
		this.scale( size[0], size[1], 1 );
		if(texture)
			texture.bind(0);

		if(!shader && texture)
			shader = this.shader_texture;

		this.renderMesh(this.quad_mesh, gl.TRIANGLE_FAN, shader );

		if(texture)
			texture.unbind(0);
		
		this.pop();
	},	

	createGridMesh: function(dist,num)
	{
		dist = dist || 20;
		num = num || 10;
		var vertices = new Float32Array( (num*2+1) * 4 * 3);
		var pos = 0;
		for(var i = -num; i <= num; i++)
		{
			vertices.set( [i*dist,0,dist*num], pos);
			vertices.set( [i*dist,0,-dist*num],pos+3);
			vertices.set( [dist*num,0,i*dist], pos+6);
			vertices.set( [-dist*num,0,i*dist],pos+9);
			pos += 3*4;
		}
		return GL.Mesh.load({vertices: vertices});
	},

	/**
	* Renders a grid of lines
	* @method renderGrid
	* @param {number} dist distance between lines
	* @param {number} num number of lines
	*/
	renderGrid: function(dist,num)
	{
		var mesh = this.createGridMesh(dist,num);
		return this.renderMesh(mesh, gl.LINES);
	},

	createConeMesh: function(radius, height, segments, in_z, use_global )
	{
		var axis = [0,1,0];
		segments = segments || 100;
		var R = quat.create();
		var temp = vec3.create();
		var vertices = new Float32Array( (segments+2) * 3);
		vertices.set(in_z ? [0,0,height] : [0,height,0], 0);

		for(var i = 0; i <= segments; i++)
		{
			quat.setAxisAngle(R,axis, 2 * Math.PI * (i/segments) );
			vec3.transformQuat(temp, [0,0,radius], R );
			if(in_z)
				vec3.set(temp, temp[0],temp[2],temp[1] );
			vertices.set(temp, i*3+3);
		}

		if(use_global)
			return this.toGlobalMesh( {vertices: vertices} );

		return GL.Mesh.load({vertices: vertices});
	},

	/**
	* Renders a cone 
	* @method renderCone
	* @param {number} radius
	* @param {number} height
	* @param {number} segments
	* @param {boolean} in_z aligned with z axis
	*/
	renderCone: function(radius, height, segments, in_z)
	{
		var mesh = this.createConeMesh(radius, height, segments, in_z, true);
		return this.renderMesh(mesh, gl.TRIANGLE_FAN, undefined, undefined, 0, this._global_mesh_last_size );
	},

	createCylinderMesh: function( radius, height, segments, in_z, use_global )
	{
		var axis = [0,1,0];
		segments = segments || 100;
		var R = quat.create();
		var temp = vec3.create();
		var vertices = new Float32Array( (segments+1) * 3 * 2);

		for(var i = 0; i <= segments; i++)
		{
			quat.setAxisAngle(R, axis, 2 * Math.PI * (i/segments) );
			vec3.transformQuat(temp, [0,0,radius], R );
			vertices.set(temp, i*3*2+3);
			temp[1] = height;
			vertices.set(temp, i*3*2);
		}

		if(use_global)
			return this.toGlobalMesh( {vertices: vertices} );

		return GL.Mesh.load({vertices: vertices});
	},

	/**
	* Renders a cylinder
	* @method renderCylinder
	* @param {number} radius
	* @param {number} height
	* @param {number} segments
	* @param {boolean} in_z aligned with z axis
	*/
	renderCylinder: function( radius, height, segments, in_z )
	{
		var mesh = this.createCylinderMesh(radius, height, segments, in_z, true);
		return this.renderMesh( mesh, gl.TRIANGLE_STRIP, undefined, undefined, 0, this._global_mesh_last_size );
	},

	/**
	* Renders an image
	* @method renderImage
	* @param {vec3} position
	* @param {Image|Texture|String} image from an URL, or a texture
	* @param {number} size [optional=10]
	* @param {boolean} fixed_size [optional=false] (camera distance do not affect size)
	*/
	renderImage: function( position, image, size, fixed_size )
	{
		if(!position || !image)
			throw("LS.Draw.renderImage param missing");
		size = size || 10;
		var texture = null;

		if(typeof(image) == "string")
		{
			texture = this.images[image];
			if(texture == null)
			{
				Draw.images[image] = 1; //loading
				var img = new Image();
				img.src = image;
				img.onload = function()
				{
					var texture = GL.Texture.fromImage(this);
					Draw.images[image] = texture;
					if(Draw.onRequestFrame)
						Draw.onRequestFrame();
					return;
				}	
				return;
			}
			else if(texture == 1)
				return; //loading
		}
		else if(image.constructor == Image)
		{
			if(!image.texture)
				image.texture = GL.Texture.fromImage( this );
			texture = image.texture;
		}
		else if(image.constructor == Texture)
			texture = image;

		if(!texture)
			return;

		if(fixed_size)
		{
			this.setPointSize( size );
			texture.bind(0);
			this.renderPoints( position, null, this.shader_image );
		}
		else
		{
			this.push();
			//this.lookAt(position, this.camera_position,[0,1,0]);
			this.billboard(position);
			this.scale(size,size,size);
			texture.bind(0);
			this.renderMesh(this.quad_mesh, gl.TRIANGLE_FAN, this.shader_texture );
			this.pop();
		}
	},

	/**
	* Renders a given mesh applyting the stack transformations
	* @method renderMesh
	* @param {GL.Mesh} mesh
	* @param {enum} primitive [optional=gl.TRIANGLES] GL.TRIANGLES, gl.LINES, gl.POINTS, ...
	* @param {string} indices [optional="triangles"] the name of the buffer in the mesh with the indices
	* @param {number} range_start [optional] in case of rendering a range, the start primitive
	* @param {number} range_length [optional] in case of rendering a range, the number of primitives
	*/
	renderMesh: function( mesh, primitive, shader, indices, range_start, range_length )
	{
		if(!this.ready)
			throw ("Draw.js not initialized, call Draw.init()");
		if(!mesh)
			throw ("LS.Draw.renderMesh mesh cannot be null");

		if(!shader)
		{
			if(mesh === this._global_mesh && this._global_mesh_ignore_colors )
				shader = this.shader;
			else
				shader = mesh.vertexBuffers["colors"] ? this.shader_color : this.shader;
		}

		mat4.multiply(this.mvp_matrix, this.viewprojection_matrix, this.model_matrix );

		shader.uniforms({
				u_model: this.model_matrix,
				u_mvp: this.mvp_matrix,
				u_color: this.color,
				u_camera_position: this.camera_position,
				u_point_size: this.point_size,
				u_texture: 0
		});
				
		if( range_start === undefined )
			shader.draw(mesh, primitive === undefined ? gl.TRIANGLES : primitive, indices );
		else
			shader.drawRange(mesh, primitive === undefined ? gl.TRIANGLES : primitive, range_start, range_length, indices );

		//used for repeating render 
		this._last_mesh = mesh;
		this._last_primitive = primitive;
		this._last_shader = shader;
		this._last_indices = indices;
		this._last_range_start = range_start;
		this._last_range_length = range_length;

		this.last_mesh = mesh;
		return mesh;
	},

	//used in some special cases
	repeatLastRender: function()
	{
		this.renderMesh( this._last_mesh, this._last_primitive, this._last_shader, this._last_indices, this._last_range_start, this._last_range_length );
	},

	/**
	* Renders a text in the current matrix position
	* @method renderText
	* @param {string} text
	*/
	renderText: function( text )
	{
		if(!Draw.font_atlas)
			this.createFontAtlas();
		var atlas = this.font_atlas;
		var l = text.length;
		var char_size = atlas.atlas.char_size;
		var i_char_size = 1 / atlas.atlas.char_size;
		var spacing = atlas.atlas.spacing;

		var num_valid_chars = 0;
		for(var i = 0; i < l; ++i)
			if(atlas.atlas[ text.charCodeAt(i) ] != null)
				num_valid_chars++;

		var vertices = new Float32Array( num_valid_chars * 6 * 3);
		var coords = new Float32Array( num_valid_chars * 6 * 2);

		var pos = 0;
		var x = 0, y = 0;
		for(var i = 0; i < l; ++i)
		{
			var c = atlas.atlas[ text.charCodeAt(i) ];
			if(!c)
			{
				if(text.charCodeAt(i) == 10)
				{
					x = 0;
					y -= char_size;
				}
				else
					x += char_size;
				continue;
			}

			vertices.set( [x, y, 0], pos*6*3);
			vertices.set( [x, y + char_size, 0], pos*6*3+3);
			vertices.set( [x + char_size, y + char_size, 0], pos*6*3+6);
			vertices.set( [x + char_size, y, 0], pos*6*3+9);
			vertices.set( [x, y, 0], pos*6*3+12);
			vertices.set( [x + char_size, y + char_size, 0], pos*6*3+15);

			coords.set( [c[0], c[1]], pos*6*2);
			coords.set( [c[0], c[3]], pos*6*2+2);
			coords.set( [c[2], c[3]], pos*6*2+4);
			coords.set( [c[2], c[1]], pos*6*2+6);
			coords.set( [c[0], c[1]], pos*6*2+8);
			coords.set( [c[2], c[3]], pos*6*2+10);

			x+= spacing;
			++pos;
		}
		var mesh = this.toGlobalMesh({vertices: vertices, coords: coords});
		atlas.bind(0);
		return this.renderMesh( mesh, gl.TRIANGLES, this.shader_texture, undefined, 0, vertices.length / 3 );
	},


	createFontAtlas: function()
	{
		var canvas = createCanvas(512,512);
		var fontsize = (canvas.width * 0.09)|0;
		var char_size = (canvas.width * 0.1)|0;

		//$("body").append(canvas);
		var ctx = canvas.getContext("2d");
		//ctx.fillRect(0,0,canvas.width,canvas.height);
		ctx.fillStyle = "white";
		ctx.font = fontsize + "px Courier New";
		ctx.textAlign = "center";
		var x = 0;
		var y = 0;
		var xoffset = 0.5, yoffset = fontsize * -0.3;
		var atlas = {char_size: char_size, spacing: char_size * 0.6};

		for(var i = 6; i < 100; i++)//valid characters
		{
			var character = String.fromCharCode(i+27);
			atlas[i+27] = [x/canvas.width, 1-(y+char_size)/canvas.height, (x+char_size)/canvas.width, 1-(y)/canvas.height];
			ctx.fillText( character,Math.floor(x+char_size*xoffset),Math.floor(y+char_size+yoffset),char_size);
			x += char_size;
			if((x + char_size) > canvas.width)
			{
				x = 0;
				y += char_size;
			}
		}

		this.font_atlas = GL.Texture.fromImage(canvas, {magFilter: gl.LINEAR, minFilter: gl.LINEAR_MIPMAP_LINEAR} );
		gl.colorMask(true,true,true,false);
		this.font_atlas.fill([1,1,1,0]);
		gl.colorMask(true,true,true,true);
		this.font_atlas.atlas = atlas;
	},

	linearize: function(array)
	{
		var n = array[0].length;
		var result = new Float32Array(array.length * n);
		var l = array.length;
		for(var i = 0; i < l; ++i)
			result.set(array[i], i*n);
		return result;
	},

	/**
	* pushes the transform matrix into the stack to save the state
	* @method push
	*/
	push: function()
	{
		if(this.model_matrix.byteOffset >= (this.stack.byteLength - 16*4))
			throw("matrices stack overflow");

		var old = this.model_matrix;
		this.model_matrix = new Float32Array(this.stack.buffer,this.model_matrix.byteOffset + 16*4,16);
		mat4.copy(this.model_matrix, old);
	},

	/**
	* takes the matrix from the top position of the stack to restore the last saved state
	* @method push
	*/
	pop: function()
	{
		if(this.model_matrix.byteOffset == 0)
			throw("too many pops");
		this.model_matrix = new Float32Array(this.stack.buffer,this.model_matrix.byteOffset - 16*4,16);
	},

	/**
	* clears the transform matrix setting it to an identity
	* @method identity
	*/
	identity: function()
	{
		mat4.identity(this.model_matrix);
	},

	/**
	* changes the scale of the transform matrix. The parameters could be a vec3, a single number (then the scale is uniform in all axis) or three numbers
	* @method scale
	* @param {vec3|array|number} x could be an array of 3, one value (if no other values are specified then it is an uniform scaling)
	* @param {number} y
	* @param {number} z
	*/
	scale: function(x,y,z)
	{
		if(arguments.length == 3)
			mat4.scale(this.model_matrix,this.model_matrix,[x,y,z]);
		else if(x.length)//one argument: x is vec3
			mat4.scale(this.model_matrix,this.model_matrix,x);
		else //is number
			mat4.scale(this.model_matrix,this.model_matrix,[x,x,x]);
	},

	/**
	* applies a translation to the transform matrix
	* @method translate
	* @param {vec3|number} x could be an array of 3 or the x transform
	* @param {number} y
	* @param {number} z
	*/
	translate: function(x,y,z)
	{
		if(arguments.length == 3)
			mat4.translate(this.model_matrix,this.model_matrix,[x,y,z]);
		else  //one argument: x -> vec3
			mat4.translate(this.model_matrix,this.model_matrix,x);
	},

	/**
	* applies a translation to the transform matrix
	* @method rotate
	* @param {number} angle in degrees
	* @param {number|vec3} x could be the x component or the full axis
	* @param {number} y
	* @param {number} z
	*/
	rotate: function(angle, x,y,z)
	{
		if(arguments.length == 4)
			mat4.rotate(this.model_matrix, this.model_matrix, angle * DEG2RAD, [x,y,z]);
		else //two arguments: x -> vec3
			mat4.rotate(this.model_matrix, this.model_matrix, angle * DEG2RAD, x);
	},

	/**
	* moves an object to a given position and forces it to look to another direction
	* Warning: it doesnt changes the camera in any way, only the transform matrix
	* @method lookAt
	* @param {vec3} position
	* @param {vec3} target
	* @param {vec3} up
	*/
	lookAt: function(position, target, up)
	{
		mat4.lookAt( this.model_matrix, position, target, up );
		mat4.invert( this.model_matrix, this.model_matrix );
	},

	billboard: function(position)
	{
		mat4.invert(this.model_matrix, this.view_matrix);
		mat4.setTranslation(this.model_matrix, position);
	},

	fromTranslationFrontTop: function(position, front, top)
	{
		mat4.fromTranslationFrontTop(this.model_matrix, position, front, top);
	},

	/**
	* projects a point from 3D space to 2D space (multiply by MVP)
	* @method project
	* @param {vec3} position
	* @param {vec3} dest [optional]
	* @return {vec3} the point in screen space (in normalized coordinates)
	*/
	project: function( position, dest )
	{
		dest = dest || vec3.create();
		return mat4.multiplyVec3(dest, this.mvp_matrix, position);
	},

	getPhongShader: function( ambient_color, light_color, light_dir )
	{
		this.shader_phong.uniforms({ u_ambient_color: ambient_color, u_light_color: light_color, u_light_dir: light_dir });
		return this.shader_phong;
	},

	getDepthShader: function()
	{
		return this.shader_depth;
	},

	//reuses a global mesh to avoid fragmenting the VRAM 
	toGlobalMesh: function( buffers, indices )
	{
		if(!this._global_mesh)
		{
			//global mesh: to reuse memory and save fragmentation
			this._global_mesh_max_vertices = 1024;
			this._global_mesh = new GL.Mesh({
				vertices: new Float32Array(this._global_mesh_max_vertices * 3),
				normals: new Float32Array(this._global_mesh_max_vertices * 3),
				coords: new Float32Array(this._global_mesh_max_vertices * 2),
				colors: new Float32Array(this._global_mesh_max_vertices * 4),
				extra: new Float32Array(this._global_mesh_max_vertices * 1)
			},{
				indices: new Uint16Array(this._global_mesh_max_vertices * 3)
			}, { stream_type: gl.DYNAMIC_STREAM });
		}

		//take every stream and store it inside the mesh buffers
		for(var i in buffers)
		{
			var mesh_buffer = this._global_mesh.getBuffer( i );
			if(!mesh_buffer)
			{
				console.warn("Draw: global mesh lacks one buffer: " + i );
				continue;
			}

			var buffer_data = buffers[i];
			if(!buffer_data)
				continue;
			if(!buffer_data.buffer)
				buffer_data = new Float32Array( buffer_data ); //force typed arrays

			//some data would be lost here
			if(buffer_data.length > mesh_buffer.data.length)
			{
				console.warn("Draw: data is too big, resizing" );
				this.resizeGlobalMesh();
				mesh_buffer = this._global_mesh.getBuffer( i );
				buffer_data = buffer_data.subarray(0,mesh_buffer.data.length);
			}

			mesh_buffer.setData( buffer_data ); //set and upload
		}

		this._global_mesh_ignore_colors = !(buffers.colors);

		if(indices)
		{
			var mesh_buffer = this._global_mesh.getIndexBuffer("indices");			
			mesh_buffer.setData( indices );
			this._global_mesh_last_size = indices.length;
		}
		else
			this._global_mesh_last_size = buffers["vertices"].length / 3;
		return this._global_mesh;
	},

	resizeGlobalMesh: function()
	{
		if(!this._global_mesh)
			throw("No global mesh to resize");

		//global mesh: to reuse memory and save fragmentation
		this._global_mesh_max_vertices = this._global_mesh_max_vertices * 2;
		this._global_mesh.deleteBuffers();

		this._global_mesh = new GL.Mesh({
			vertices: new Float32Array(this._global_mesh_max_vertices * 3),
			normals: new Float32Array(this._global_mesh_max_vertices * 3),
			coords: new Float32Array(this._global_mesh_max_vertices * 2),
			colors: new Float32Array(this._global_mesh_max_vertices * 4),
			extra: new Float32Array(this._global_mesh_max_vertices * 1)
		},{
			indices: new Uint16Array(this._global_mesh_max_vertices * 3)
		}, { stream_type: gl.DYNAMIC_STREAM });
	}

};

if(typeof(LS) != "undefined")
	LS.Draw = Draw;