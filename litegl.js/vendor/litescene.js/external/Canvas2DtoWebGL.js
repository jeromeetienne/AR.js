//replaces the Canvas2D functions by WebGL functions, the behaviour is not 100% the same but it kind of works in many cases
//not all functions have been implemented

if(typeof(GL) == "undefined")
	throw("litegl.js must be included to use enableWebGLCanvas");

function enableWebGLCanvas( canvas, options )
{
	var gl;
	options = options || {};

	// Detect if canvas is WebGL enabled and get context if possible
	if(!canvas.is_webgl)
	{
		options.canvas = canvas;
		options.alpha = true;
		options.stencil = true;
		try {
			gl = GL.create(options);
		} catch(e) {
			console.log("This canvas cannot be used as WebGL, maybe WebGL is not supported or this canvas has already a 2D context associated");
			gl = canvas.getContext("2d", options);
			return gl;
       	}
	}
	else
		gl = canvas.gl;


	// Return if canvas is already canvas2DtoWebGL enabled
	if(canvas.canvas2DtoWebGL_enabled)
		return gl;

	//settings
	var curveSubdivisions = 50;
	var max_points = 10000; //max amount of vertex allowed to have in a single primitive
	var max_characters = 1000; //max amount of characters allowed to have in a single fillText

	//flag it for future uses
	canvas.canvas2DtoWebGL_enabled = true;

	var prev_gl = null;

	var ctx = canvas.ctx = gl;
	ctx.WebGLCanvas = {};
	var white = vec4.fromValues(1,1,1,1);

	//some generic shaders
	var	flat_shader = new GL.Shader( GL.Shader.QUAD_VERTEX_SHADER, GL.Shader.SCREEN_FLAT_FRAGMENT_SHADER );
	var	texture_shader = new GL.Shader( GL.Shader.QUAD_VERTEX_SHADER, GL.Shader.SCREEN_COLORED_FRAGMENT_SHADER );
	var circle = GL.Mesh.circle({size:1});

	//reusing same buffer
	var global_index = 0;
	var global_vertices = new Float32Array( max_points * 3 );
	var global_mesh = new GL.Mesh();
	var global_buffer = global_mesh.createVertexBuffer("vertices", null, null, global_vertices, gl.STREAM_DRAW );
	var quad_mesh = GL.Mesh.getScreenQuad();
	var is_rect = false;
	var extra_projection = mat4.create();
	var stencil_enabled = false;
	var anisotropic = options.anisotropic !== undefined ? options.anisotropic : 2;

	var uniforms = {
		u_texture: 0
	};

	var extra_macros = {};
	if(options.allow3D)
		extra_macros.EXTRA_PROJECTION = "";

	//used to store font atlas textures (images are not stored here)
	var textures = {};

	var vertex_shader = "\n\
			precision highp float;\n\
			attribute vec3 a_vertex;\n\
			uniform vec2 u_viewport;\n\
			uniform mat3 u_transform;\n\
			#ifdef EXTRA_PROJECTION\n\
				uniform mat4 u_projection;\n\
			#endif\n\
			varying float v_visible;\n\
			void main() { \n\
				vec3 pos = a_vertex;\n\
				v_visible = pos.z;\n\
				pos = u_transform * vec3(pos.xy,1.0);\n\
				pos.z = 0.0;\n\
				//normalize\n\
				pos.x = (2.0 * pos.x / u_viewport.x) - 1.0;\n\
				pos.y = -((2.0 * pos.y / u_viewport.y) - 1.0);\n\
				#ifdef EXTRA_PROJECTION\n\
					pos = (u_projection * mat4(pos,1.0)).xz;\n\
				#endif\n\
				gl_Position = vec4(pos, 1.0); \n\
			}\n\
			";

	var	flat_primitive_shader = new GL.Shader(vertex_shader,"\n\
			precision highp float;\n\
			varying float v_visible;\n\
			uniform vec4 u_color;\n\
			void main() {\n\
				if (v_visible == 0.0)\n\
					discard;\n\
				gl_FragColor = u_color;\n\
			}\n\
		", extra_macros );

	var	textured_transform_shader = new GL.Shader(GL.Shader.QUAD_VERTEX_SHADER,"\n\
			precision highp float;\n\
			uniform sampler2D u_texture;\n\
			uniform vec4 u_color;\n\
			uniform vec4 u_texture_transform;\n\
			varying vec2 v_coord;\n\
			void main() {\n\
				vec2 uv = v_coord * u_texture_transform.zw + vec2(u_texture_transform.x,0.0);\n\
				uv.y = uv.y - u_texture_transform.y + (1.0 - u_texture_transform.w);\n\
				uv = clamp(uv,vec2(0.0),vec2(1.0));\n\
				gl_FragColor = u_color * texture2D(u_texture, uv);\n\
			}\n\
		", extra_macros );

	var	textured_primitive_shader = new GL.Shader(vertex_shader,"\n\
			precision highp float;\n\
			varying float v_visible;\n\
			uniform vec4 u_color;\n\
			uniform sampler2D u_texture;\n\
			uniform vec4 u_texture_transform;\n\
			uniform vec2 u_viewport;\n\
			uniform mat3 u_itransform;\n\
			void main() {\n\
				vec2 pos = (u_itransform * vec3( gl_FragCoord.s, u_viewport.y - gl_FragCoord.t,1.0)).xy;\n\
				pos *= vec2( (u_viewport.x * u_texture_transform.z), (u_viewport.y * u_texture_transform.w) );\n\
				vec2 uv = fract(pos / u_viewport) + u_texture_transform.xy;\n\
				uv.y = 1.0 - uv.y;\n\
				gl_FragColor = u_color * texture2D( u_texture, uv);\n\
			}\n\
		", extra_macros );

	var	gradient_primitive_shader = new GL.Shader(vertex_shader,"\n\
			precision highp float;\n\
			varying float v_visible;\n\
			uniform vec4 u_color;\n\
			uniform sampler2D u_texture;\n\
			uniform vec4 u_gradient;\n\
			uniform vec2 u_viewport;\n\
			uniform mat3 u_itransform;\n\
			void main() {\n\
				vec2 pos = (u_itransform * vec3( gl_FragCoord.s, u_viewport.y - gl_FragCoord.t,1.0)).xy;\n\
				//vec2 pos = vec2( gl_FragCoord.s, u_viewport.y - gl_FragCoord.t);\n\
				vec2 AP = pos - u_gradient.xy;\n\
				vec2 AB = u_gradient.zw - u_gradient.xy;\n\
				float dotAPAB = dot(AP,AB);\n\
				float dotABAB = dot(AB,AB);\n\
				float x = dotAPAB / dotABAB;\n\
				vec2 uv = vec2( x, 0.0 );\n\
				gl_FragColor = u_color * texture2D( u_texture, uv );\n\
			}\n\
		", extra_macros );

	ctx.createImageShader = function(code)
	{
		return new GL.Shader( GL.Shader.QUAD_VERTEX_SHADER,"\n\
			precision highp float;\n\
			uniform sampler2D u_texture;\n\
			uniform vec4 u_color;\n\
			uniform vec4 u_texture_transform;\n\
			uniform vec2 u_viewport;\n\
			varying vec2 v_coord;\n\
			void main() {\n\
				vec2 uv = v_coord * u_texture_transform.zw + vec2(u_texture_transform.x,0.0);\n\
				uv.y = uv.y - u_texture_transform.y + (1.0 - u_texture_transform.w);\n\
				uv = clamp(uv,vec2(0.0),vec2(1.0));\n\
				vec4 color = u_color * texture2D(u_texture, uv);\n\
				"+code+";\n\
				gl_FragColor = color;\n\
			}\n\
		", extra_macros );
	}


	//some people may reuse it
	ctx.WebGLCanvas.vertex_shader = vertex_shader;

	//STACK and TRANSFORM
	ctx._matrix = mat3.create();
	var tmp_mat3 = mat3.create();
	var tmp_vec2 = vec2.create();
	var tmp_vec4 = vec4.create();
	var tmp_vec4b = vec4.create();
	var tmp_vec2b = vec2.create();
	ctx._stack = [];
	var global_angle = 0;
	var viewport = vec2.fromValues(1,1);

	ctx.translate = function(x,y)
	{
		tmp_vec2[0] = x;
		tmp_vec2[1] = y;
		mat3.translate( this._matrix, this._matrix, tmp_vec2 );
	}

	ctx.rotate = function(angle)
	{
		mat3.rotate( this._matrix, this._matrix, angle );
		global_angle += angle;
	}

	ctx.scale = function(x,y)
	{
		tmp_vec2[0] = x;
		tmp_vec2[1] = y;
		mat3.scale( this._matrix, this._matrix, tmp_vec2 );
	}

	//own method to reset internal stuff
	ctx.resetTransform = function()
	{
		//reset transform
		gl._stack.length = 0;
		this._matrix.set([1,0,0, 0,1,0, 0,0,1]);
		global_angle = 0;
	}

	ctx.save = function() {
		if(this._stack.length < 32)
			this._stack.push( mat3.clone( this._matrix ) );
	}

	ctx.restore = function() {
		if(this._stack.length)
			this._matrix.set( this._stack.pop() );
		else
			mat3.identity( this._matrix );
		global_angle = Math.atan2( this._matrix[3], this._matrix[4] ); //use up vector
		if(	stencil_enabled )
		{
			gl.enable( gl.STENCIL_TEST );
			gl.clearStencil( 0x0 );
			gl.clear( gl.STENCIL_BUFFER_BIT );
			gl.disable( gl.STENCIL_TEST );
			stencil_enabled = false;
		}
	}

	ctx.transform = function(a,b,c,d,e,f) {
		var m = tmp_mat3;
		m[0] = a;
		m[1] = c;
		m[2] = e;
		m[3] = b;
		m[4] = d;
		m[5] = f;
		m[6] = 0;
		m[7] = 0;
		m[8] = 1;

		mat3.multiply( this._matrix, this._matrix, m );
		global_angle = Math.atan2( this._matrix[0], this._matrix[1] );
	}

	ctx.setTransform = function(a,b,c,d,e,f) {
		var m = this._matrix;
		m[0] = a;
		m[1] = c;
		m[2] = e;
		m[3] = b;
		m[4] = d;
		m[5] = f;
		m[6] = 0;
		m[7] = 0;
		m[8] = 1;
		//this._matrix.set([a,c,e,b,d,f,0,0,1]);
		global_angle = Math.atan2( this._matrix[0], this._matrix[1] );
	}

	//Images
	var last_uid = 1;

	//textures are stored inside images, so as long as the image exist in memory, the texture will exist
	function getTexture( img )
	{
		var tex = null;
		if(img.constructor === GL.Texture)
		{
			if(img._context_id == gl.context_id)
				return img;
			return null;
		}
		else
		{
			//same image could be used in several contexts
			if(!img.gl)
				img.gl = {};

			//Regular image
			if(img.src)
			{
				var wrap = gl.REPEAT;

				tex = img.gl[ gl.context_id ];
				if(tex)
					return tex;
				return img.gl[ gl.context_id ] = GL.Texture.fromImage(img, { magFilter: gl.LINEAR, minFilter: gl.LINEAR_MIPMAP_LINEAR, wrap: wrap, ignore_pot:true, premultipliedAlpha: true, anisotropic: anisotropic } );
			}
			else //probably a canvas
			{
				tex = img.gl[ gl.context_id ];
				if(tex)
					return tex;
				return img.gl[ gl.context_id ] = GL.Texture.fromImage(img, { minFilter: gl.LINEAR, magFilter: gl.LINEAR, anisotropic: anisotropic });
			}
		}

		return null;
	}

	ctx.drawImage = function( img, x, y, w, h, shader )
	{
		if(!img || img.width == 0 || img.height == 0) 
			return;

		var tex = getTexture(img);
		if(!tex)
			return;

		if(arguments.length == 9) //img, sx,sy,sw,sh, x,y,w,h
		{
			tmp_vec4b.set([x/img.width,y/img.height,w/img.width,h/img.height]);
			x = arguments[5];
			y = arguments[6];
			w = arguments[7];
			h = arguments[8];
			shader = textured_transform_shader;
		}
		else
			tmp_vec4b.set([0,0,1,1]); //reset texture transform

		tmp_vec2[0] = x; tmp_vec2[1] = y;
		tmp_vec2b[0] = w === undefined ? tex.width : w;
		tmp_vec2b[1] = h === undefined ? tex.height : h;

		tex.bind(0);
		if(tex !== img) //only apply the imageSmoothingEnabled if we are dealing with images, not textures
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, this.imageSmoothingEnabled ? gl.LINEAR : gl.NEAREST );

		if(!this.tintImages)
		{
			tmp_vec4[0] = tmp_vec4[1] = tmp_vec4[2] = 1.0;	tmp_vec4[3] = this._globalAlpha;
		}

		uniforms.u_color = this.tintImages ? this._fillcolor : tmp_vec4;
		uniforms.u_position = tmp_vec2;
		uniforms.u_size = tmp_vec2b;
		uniforms.u_transform = this._matrix;
		uniforms.u_texture_transform = tmp_vec4b;
		uniforms.u_viewport = viewport;

		shader = shader || texture_shader;

		shader.uniforms( uniforms ).draw(quad_mesh);
	}

	ctx.createPattern = function( img )
	{
		return getTexture( img );
	}

	//to craete gradients
	function WebGLCanvasGradient(x,y,x2,y2)
	{
		this.id = (ctx._last_gradient_id++) % ctx._max_gradients;
		this.points = new Float32Array([x,y,x2,y2]);
		this.stops = [];
		this._must_update = true;
	}

	//to avoid creating textures all the time
	ctx._last_gradient_id = 0;
	ctx._max_gradients = 16;
	ctx._gradients_pool = [];

	WebGLCanvasGradient.prototype.addColorStop = function( pos, color )
	{
		var final_color = hexColorToRGBA( color );
		var v = new Uint8Array(4);
		v[0] = Math.clamp( final_color[0], 0,1 ) * 255;
		v[1] = Math.clamp( final_color[1], 0,1 ) * 255;
		v[2] = Math.clamp( final_color[2], 0,1 ) * 255;
		v[3] = Math.clamp( final_color[3], 0,1 ) * 255;
		this.stops.push( [ pos, v ]);
		this.stops.sort( function(a,b) {return (a[0] > b[0]) ? 1 : ((b[0] > a[0]) ? -1 : 0);} );
		this._must_update = true;
	}

	WebGLCanvasGradient.prototype.toTexture = function()
	{
		//create a texture from the pool
		if(!this._texture)
		{
			if(this.id != -1)
				this._texture = ctx._gradients_pool[ this.id ];
			if(!this._texture)
			{
				this._texture = new GL.Texture( 128,1, { format: gl.RGBA, magFilter: gl.LINEAR, wrap: gl.CLAMP_TO_EDGE, minFilter: gl.NEAREST });
				if(this.id != -1)
					ctx._gradients_pool[ this.id ] = this._texture;
			}
		}
		if(!this._must_update)
			return this._texture;
		this._must_update = false;
		if(this.stops.length < 1)
			return this._texture; //no stops
		if(this.stops.length < 2)
		{
			this._texture.fill( this.stops[0][1] );
			return this._texture; //one color
		}

		//fill buffer
		var index = 0;
		var current = this.stops[index];
		var next = this.stops[index+1];

		var buffer = new Uint8Array(128*4);
		for(var i = 0; i < 128; i+=1)
		{
			var color = buffer.subarray( i*4, i*4+4 );
			var t = i/128;
			if( current[0] > t )
			{
				if(index == 0)
					color.set( current[1] );
				else
				{
					index+=1;						
					current = this.stops[index];
					next = this.stops[index+1];
					if(!next)
						break;
					i-=1;
				}
			}
			else if( current[0] <= t && t < next[0] )
			{
				var f = (t - current[0]) / (next[0] - current[0]);
				vec4.lerp( color, current[1], next[1], f );
			}
			else if( next[0] <= t )
			{
				index+=1;						
				current = this.stops[index];
				next = this.stops[index+1];
				if(!next)
					break;
				i-=1;
			}
		}
		//fill the remaining
		if(i<128)
			for(var j = i; j < 128; j+=1)
				buffer.set( current[1], j*4 );
		this._texture.uploadData( buffer );
		return this._texture;
	}

	ctx.createLinearGradient = function( x,y, x2, y2 )
	{
		return new WebGLCanvasGradient(x,y,x2,y2);
	}


	//Primitives

	ctx.beginPath = function()
	{
		global_index = 0;
		is_rect = false;
	}

	ctx.closePath = function()
	{
		if(global_index < 3)
			return;
		global_vertices[ global_index ] = global_vertices[0];
		global_vertices[ global_index + 1] = global_vertices[1];
		global_vertices[ global_index + 2] = 1;
		global_index += 3;
		is_rect = false;
	}

	ctx.moveTo = function(x,y)
	{
		//not the first line
		if(global_index == 0)
		{
			global_vertices[ global_index ] = x;
			global_vertices[ global_index + 1] = y;
			global_vertices[ global_index + 2] = 1;
			global_index += 3;
		}
		else
		{
			global_vertices[ global_index ] = global_vertices[ global_index - 3];
			global_vertices[ global_index + 1] = global_vertices[ global_index - 2];
			global_vertices[ global_index + 2] = 0;
			global_index += 3;
			global_vertices[ global_index ] = x;
			global_vertices[ global_index + 1] = y;
			global_vertices[ global_index + 2] = 0;
			global_index += 3;
		}

		is_rect = false;
	}

	ctx.lineTo = function(x,y)
	{
		global_vertices[ global_index ] = x;
		global_vertices[ global_index + 1] = y;
		global_vertices[ global_index + 2] = 1;
		global_index += 3;
		is_rect = false;
	}

	ctx.bezierCurveTo = function(m1x,m1y, m2x,m2y, ex,ey)
	{
		if(global_index < 3) return;
		is_rect = false;

		var last = [ global_vertices[ global_index - 3 ], global_vertices[ global_index - 2 ] ];
		cp = [ last, [m1x, m1y], [m2x, m2y], [ex, ey] ];
		for(var i = 0; i <= curveSubdivisions; i++)
		{
			var t = i/curveSubdivisions;
			var ax, bx, cx;
			var ay, by, cy;
			var tSquared, tCubed;

			/* cálculo de los coeficientes polinomiales */
			cx = 3.0 * (cp[1][0] - cp[0][0]);
			bx = 3.0 * (cp[2][0] - cp[1][0]) - cx;
			ax = cp[3][0] - cp[0][0] - cx - bx;

			cy = 3.0 * (cp[1][1] - cp[0][1]);
			by = 3.0 * (cp[2][1] - cp[1][1]) - cy;
			ay = cp[3][1] - cp[0][1] - cy - by;

			/* calculate the curve point at parameter value t */
			tSquared = t * t;
			tCubed = tSquared * t;

			var x = (ax * tCubed) + (bx * tSquared) + (cx * t) + cp[0][0];
			var y = (ay * tCubed) + (by * tSquared) + (cy * t) + cp[0][1];
			global_vertices[ global_index ] = x;
			global_vertices[ global_index + 1] = y;
			global_vertices[ global_index + 2] = 1;
			global_index += 3;
		}
	}

	ctx.quadraticCurveTo = function(mx,my,ex,ey)
	{
		if(global_index < 3) return;
		is_rect = false;

		var sx = global_vertices[ global_index - 3 ];
		var sy = global_vertices[ global_index - 2 ];
		
		for(var i = 0; i <= curveSubdivisions; i++)
		{
			var f = i/curveSubdivisions;
			var nf = 1-f;

			var m1x = sx * nf + mx * f;
			var m1y = sy * nf + my * f;

			var m2x = mx * nf + ex * f;
			var m2y = my * nf + ey * f;

			global_vertices[ global_index ] = m1x * nf + m2x * f;
			global_vertices[ global_index + 1] = m1y * nf + m2y * f;
			global_vertices[ global_index + 2] = 1;
			global_index += 3;
		}
	}


	ctx.fill = function()
	{
		if(global_index < 9)
			return;

		//if(is_rect)
		//	return this.fillRect();

		//update buffer
		//global_buffer.upload( gl.STREAM_DRAW );
		global_buffer.uploadRange(0, global_index * 4); //4 bytes per float
		uniforms.u_viewport = viewport;
		var shader = flat_primitive_shader;

		//first the shadow
		if( this._shadowcolor[3] > 0.0 )
		{
			uniforms.u_color = this._shadowcolor;
			this.save();
			this.translate( this.shadowOffsetX, this.shadowOffsetY );
			shader.uniforms(uniforms).drawRange(global_mesh, gl.TRIANGLE_FAN, 0, global_index / 3);
			this.restore();
		}

		uniforms.u_color = this._fillcolor;
		uniforms.u_transform = this._matrix;

		var fill_style = this._fillStyle;

		if( fill_style.constructor === WebGLCanvasGradient ) //gradient
		{
			var grad = fill_style;
			var tex = grad.toTexture();
			uniforms.u_color = [1,1,1, this.globalAlpha]; 
			uniforms.u_gradient = grad.points; 
			uniforms.u_texture = 0;
			uniforms.u_itransform = mat3.invert( tmp_mat3, this._matrix );
			tex.bind(0);
			shader = gradient_primitive_shader;
		}
		else if( fill_style.constructor === GL.Texture ) //pattern
		{
			var tex = fill_style;
			uniforms.u_color = [1,1,1, this.globalAlpha]; 
			uniforms.u_texture = 0;
			tmp_vec4.set([0,0,1/tex.width, 1/tex.height]);
			uniforms.u_texture_transform = tmp_vec4;
			uniforms.u_itransform = mat3.invert( tmp_mat3, this._matrix );
			tex.bind(0);
			shader = textured_primitive_shader;
		}

		//render
		shader.uniforms(uniforms).drawRange(global_mesh, gl.TRIANGLE_FAN, 0, global_index / 3);
	}

	//basic stroke using gl.LINES
	ctx.strokeThin = function()
	{
		if(global_index < 6)
			return;

		//update buffer
		global_buffer.uploadRange(0, global_index * 4); //4 bytes per float
		//global_buffer.upload( gl.STREAM_DRAW );

		gl.setLineWidth( this.lineWidth );
		uniforms.u_color = this._strokecolor;
		uniforms.u_transform = this._matrix;
		uniforms.u_viewport = viewport;
		flat_primitive_shader.uniforms(uniforms).drawRange(global_mesh, gl.LINE_STRIP, 0, global_index / 3);
	}

	//advanced stroke (it takes width into account)
	var lines_vertices = new Float32Array( max_points * 3 );
	var lines_mesh = new GL.Mesh();
	var lines_buffer = lines_mesh.createVertexBuffer("vertices", null, null, lines_vertices, gl.STREAM_DRAW );

	ctx.stroke = function()
	{
		if(global_index < 6)
			return;

		if( (this.lineWidth * this._matrix[0]) <= 1.0 )
			return this.strokeThin();

		var num_points = global_index / 3;
		var vertices = lines_vertices;
		var l = global_index;
		var line_width = this.lineWidth * 0.5;

		var points = global_vertices;

		var delta_x = 0;
		var delta_y = 0;
		var prev_delta_x = 0;
		var prev_delta_y = 0;
		var average_x = 0;
		var average_y = 0;
		var first_delta_x = 0;
		var first_delta_y = 0;

		if(points[0] == points[ global_index - 3 ] && points[1] == points[ global_index - 2 ])
		{
			delta_x = points[ global_index - 3 ] - points[ global_index - 6 ];
			delta_y = points[ global_index - 2 ] - points[ global_index - 5 ];
			var dist = Math.sqrt( delta_x*delta_x + delta_y*delta_y );
			if(dist != 0)
			{
				delta_x = (delta_x / dist);
				delta_y = (delta_y / dist);
			}
		}

		var i, pos = 0;
		for(i = 0; i < l-3; i+=3)
		{
			prev_delta_x = delta_x;
			prev_delta_y = delta_y;

			delta_x = points[i+3] - points[i];
			delta_y = points[i+4] - points[i+1];
			var dist = Math.sqrt( delta_x*delta_x + delta_y*delta_y );
			if(dist != 0)
			{
				delta_x = (delta_x / dist);
				delta_y = (delta_y / dist);
			}
			if(i == 0)
			{
				first_delta_x = delta_x;
				first_delta_y = delta_y;
			}

			average_x = delta_x + prev_delta_x;
			average_y = delta_y + prev_delta_y;

			var dist = Math.sqrt( average_x*average_x + average_y*average_y );
			if(dist != 0)
			{
				average_x = (average_x / dist);
				average_y = (average_y / dist);
			}

			vertices[ pos+0 ] = points[i] - average_y * line_width;
			vertices[ pos+1 ] = points[i+1] + average_x * line_width;
			vertices[ pos+2 ] = 1;
			vertices[ pos+3 ] = points[i] + average_y * line_width;
			vertices[ pos+4 ] = points[i+1] - average_x * line_width;
			vertices[ pos+5 ] = 1;

			pos += 6;
		}

		//final points are tricky
		if(points[0] == points[ global_index - 3 ] && points[1] == points[ global_index - 2 ])
		{
			average_x = delta_x + first_delta_x;
			average_y = delta_y + first_delta_y;
			var dist = Math.sqrt( average_x*average_x + average_y*average_y );
			if(dist != 0)
			{
				average_x = (average_x / dist);
				average_y = (average_y / dist);
			}
			vertices[ pos+0 ] = points[i] - average_y * line_width;
			vertices[ pos+1 ] = points[i+1] + average_x * line_width;
			vertices[ pos+2 ] = 1;
			vertices[ pos+3 ] = points[i] + average_y * line_width;
			vertices[ pos+4 ] = points[i+1] - average_x * line_width;
			vertices[ pos+5 ] = 1;
		}
		else
		{
			var dist = Math.sqrt( delta_x*delta_x + delta_y*delta_y );
			if(dist != 0)
			{
				average_x = (delta_x / dist);
				average_y = (delta_y / dist);
			}

			vertices[ pos+0 ] = points[i] - (average_y - average_x) * line_width;
			vertices[ pos+1 ] = points[i+1] + (average_x + average_y) * line_width;
			vertices[ pos+2 ] = 1;
			vertices[ pos+3 ] = points[i] + (average_y + average_x) * line_width;
			vertices[ pos+4 ] = points[i+1] - (average_x - average_y) * line_width;
			vertices[ pos+5 ] = 1;
		}

		pos += 6;

		lines_buffer.upload(gl.STREAM_DRAW);
		lines_buffer.uploadRange(0, pos * 4); //4 bytes per float

		uniforms.u_transform = this._matrix;
		uniforms.u_viewport = viewport;

		//first the shadow
		if( this._shadowcolor[3] > 0.0 )
		{
			uniforms.u_color = this._shadowcolor;
			this.save();
			this.translate( this.shadowOffsetX, this.shadowOffsetY );
			flat_primitive_shader.uniforms(uniforms).drawRange(global_mesh, gl.TRIANGLE_STRIP, 0, pos / 3);
			this.restore();
		}

		//gl.setLineWidth( this.lineWidth );
		uniforms.u_color = this._strokecolor;
		flat_primitive_shader.uniforms( uniforms ).drawRange(lines_mesh, gl.TRIANGLE_STRIP, 0, pos / 3 );
	}


	ctx.rect = function(x,y,w,h)
	{
		global_vertices[ global_index ] = x;
		global_vertices[ global_index + 1] = y;
		global_vertices[ global_index + 2] = 1;

		global_vertices[ global_index + 3] = x+w;
		global_vertices[ global_index + 4] = y;
		global_vertices[ global_index + 5] = 1;

		global_vertices[ global_index + 6] = x+w;
		global_vertices[ global_index + 7] = y+h;
		global_vertices[ global_index + 8] = 1;

		global_vertices[ global_index + 9] = x;
		global_vertices[ global_index + 10] = y+h;
		global_vertices[ global_index + 11] = 1;

		global_vertices[ global_index + 12] = x;
		global_vertices[ global_index + 13] = y;
		global_vertices[ global_index + 14] = 1;

		global_index += 15;

		if(global_index == 15)
			is_rect = true;
	}

	//roundRect is a function I use sometimes, but here we dont have it
	ctx.roundRect = ctx.rect;

	ctx.arc = function(x,y,radius, start_ang, end_ang)
	{
		num = Math.ceil(radius*2*this._matrix[0]+1);
		if(num<1)
			return;

		start_ang = start_ang === undefined ? 0 : start_ang;
		end_ang = end_ang === undefined ? Math.PI * 2 : end_ang;

		var delta = (end_ang - start_ang) / num;

		for(var i = 0; i <= num; i++)
		{
			var f = start_ang + i*delta;
			this.lineTo(x + Math.cos(f) * radius, y + Math.sin(f) * radius);
		}
		is_rect = false;
	}

	ctx.strokeRect = function(x,y,w,h)
	{
		this.beginPath();
		this.rect(x,y,w,h);//[x,y,1, x+w,y,1, x+w,y+h,1, x,y+h,1, x,y,1 ];
		this.stroke();
	}
	
	ctx.fillRect = function(x,y,w,h)
	{
		global_index = 0;

		//fill using a gradient or pattern
		if( this._fillStyle.constructor == GL.Texture || this._fillStyle.constructor === WebGLCanvasGradient )
		{
			this.beginPath();
			this.rect(x,y,w,h);
			this.fill();
			return;
		}

		uniforms.u_color = this._fillcolor;
		tmp_vec2[0] = x; tmp_vec2[1] = y;
		tmp_vec2b[0] = w; tmp_vec2b[1] = h;
		uniforms.u_position = tmp_vec2;
		uniforms.u_size = tmp_vec2b;
		uniforms.u_transform = this._matrix;
		uniforms.u_viewport = viewport

		flat_shader.uniforms(uniforms).draw(quad_mesh);
	}

	//other functions
	ctx.clearRect = function(x,y,w,h)
	{
		if(x != 0 || y != 0 || w != canvas.width || h != canvas.height )
			gl.scissor(x,y,w,h);

		//gl.clearColor( 0.0,0.0,0.0,0.0 );
		gl.clear( gl.COLOR_BUFFER_BIT );
		var v = gl.viewport_data;
		gl.scissor(v[0],v[1],v[2],v[3]);
	}
	
	ctx.clip = function()
	{
		gl.colorMask(false, false, false, false);
		gl.depthMask(false);
		
		//fill stencil buffer
		gl.enable( gl.STENCIL_TEST );
		gl.stencilFunc( gl.ALWAYS, 1, 0xFF );
		gl.stencilOp( gl.KEEP, gl.KEEP, gl.REPLACE ); //TODO using INCR we could allow 8 stencils 
		
		this.fill();

		stencil_enabled = true;		
		gl.colorMask(true, true, true, true);
		gl.depthMask(true);
		gl.stencilFunc( gl.EQUAL, 1, 0xFF );
	}

	//control funcs: used to set flags at the beginning and the end of the render
	ctx.start2D = function()
	{
		prev_gl = window.gl;
		window.gl = this;
		var gl = this;

		viewport[0] = gl.viewport_data[2];
		viewport[1] = gl.viewport_data[3];
		gl.disable( gl.CULL_FACE );
		gl.disable( gl.DEPTH_TEST );
		gl.disable( gl.STENCIL_TEST );
		gl.enable( gl.BLEND );
		gl.blendFunc( gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA );
		gl.lineWidth = 1;
		global_index = 0;
		is_rect = false;
	}

	ctx.finish2D = function()
	{
		global_index = 0;
		gl.lineWidth = 1;
		window.gl = prev_gl;
		gl.disable( gl.STENCIL_TEST );
	}

	//extra
	var POINT_TEXT_VERTEX_SHADER = "\n\
			precision highp float;\n\
			attribute vec3 a_vertex;\n\
			attribute vec2 a_coord;\n\
			varying vec2 v_coord;\n\
			uniform vec2 u_viewport;\n\
			uniform mat3 u_transform;\n\
			#ifdef EXTRA_PROJECTION\n\
				uniform mat4 u_projection;\n\
			#endif\n\
			uniform float u_pointSize;\n\
			void main() { \n\
				vec3 pos = a_vertex;\n\
				pos = u_transform * pos;\n\
				pos.z = 0.0;\n\
				//normalize\n\
				pos.x = (2.0 * pos.x / u_viewport.x) - 1.0;\n\
				pos.y = -((2.0 * pos.y / u_viewport.y) - 1.0);\n\
				#ifdef EXTRA_PROJECTION\n\
					pos = (u_projection * mat4(pos,1.0)).xz;\n\
				#endif\n\
				gl_Position = vec4(pos, 1.0); \n\
				gl_PointSize = ceil(u_pointSize);\n\
				v_coord = a_coord;\n\
			}\n\
			";

	var POINT_TEXT_FRAGMENT_SHADER = "\n\
			precision highp float;\n\
			uniform sampler2D u_texture;\n\
			uniform float u_iCharSize;\n\
			uniform vec4 u_color;\n\
			uniform float u_pointSize;\n\
			uniform vec2 u_viewport;\n\
			uniform vec2 u_angle_sincos;\n\
			varying vec2 v_coord;\n\
			void main() {\n\
				vec2 uv = vec2(1.0 - gl_PointCoord.s, gl_PointCoord.t);\n\
				uv = vec2( ((uv.y - 0.5) * u_angle_sincos.y - (uv.x - 0.5) * u_angle_sincos.x) + 0.5, ((uv.x - 0.5) * u_angle_sincos.y + (uv.y - 0.5) * u_angle_sincos.x) + 0.5);\n\
				uv = v_coord - uv * u_iCharSize + vec2(u_iCharSize*0.5);\n\
				uv.y = 1.0 - uv.y;\n\
				gl_FragColor = vec4(u_color.xyz, u_color.a * texture2D(u_texture, uv, -1.0  ).a);\n\
			}\n\
			";

	/*
	var max_triangle_characters = 64;
	var triangle = new Float32Array([-1,1,0, -1,-1,0, 1,-1,0, -1,1,0, 1,-1,0, 1,1,0]);
	var triangle_text_vertices = new Float32Array( max_triangle_characters * 6 * 3 );
	var triangle_text_mesh = new GL.Mesh();
	var triangle_text_vertices_buffer = triangle_text_mesh.createVertexBuffer("vertices", null, null, triangle_text_vertices );
	var tv = triangle_text_vertices;
	for(var i = 0; i < triangle_text_vertices.length; i += 6*3)
	{
		tv.set(triangle, i);
		tv[2] = tv[5] = tv[8] = tv[11] = t[14] = t[17] = i / (6*3);
	}
	triangle_text_vertices_buffer.upload();

	var TRIANGLE_TEXT_VERTEX_SHADER = "\n\
			precision highp float;\n\
			#define MAX_CHARS 64;
			attribute vec3 a_vertex;\n\
			varying vec2 v_coord;\n\
			uniform vec2 u_viewport;\n\
			uniform vec2 u_charPos[ MAX_CHARS ];\n\
			uniform vec2 u_charCoord[ MAX_CHARS ];\n\
			uniform mat3 u_transform;\n\
			uniform float u_pointSize;\n\
			void main() { \n\
				vec3 pos = a_vertex;\n\
				v_coord = a_vertex * 0.5 + vec2(0.5);\n\
				int char_index = (int)pos.z;\n\
				pos.z = 1.0;\n\
				pos.xz = pos.xz * u_pointSize + u_charPos[char_index];\n\
				pos = u_transform * pos;\n\
				pos.z = 0.0;\n\
				//normalize\n\
				pos.x = (2.0 * pos.x / u_viewport.x) - 1.0;\n\
				pos.y = -((2.0 * pos.y / u_viewport.y) - 1.0);\n\
				gl_Position = vec4(pos, 1.0); \n\
			}\n\
			";

	var TRIANGLE_TEXT_FRAGMENT_SHADER = "\n\
			precision highp float;\n\
			uniform sampler2D u_texture;\n\
			uniform float u_iCharSize;\n\
			uniform vec4 u_color;\n\
			uniform float u_pointSize;\n\
			uniform vec2 u_viewport;\n\
			varying vec2 v_coord;\n\
			void main() {\n\
				vec2 uv = vec2(1.0 - gl_PointCoord.s, 1.0 - gl_PointCoord.t);\n\
				uv = v_coord - uv * u_iCharSize + vec2(u_iCharSize*0.5);\n\
				uv.y = 1.0 - uv.y;\n\
				gl_FragColor = vec4(u_color.xyz, u_color.a * texture2D(u_texture, uv, -1.0  ).a);\n\
			}\n\
			";
	*/

	//text rendering
	var	point_text_shader = new GL.Shader( POINT_TEXT_VERTEX_SHADER, POINT_TEXT_FRAGMENT_SHADER, extra_macros );
	var point_text_vertices = new Float32Array( max_characters * 3 );
	var point_text_coords = new Float32Array( max_characters * 2 );
	var point_text_mesh = new GL.Mesh();
	var point_text_vertices_buffer = point_text_mesh.createVertexBuffer("vertices", null, null, point_text_vertices, gl.STREAM_DRAW );
	var point_text_coords_buffer = point_text_mesh.createVertexBuffer("coords", null, null, point_text_coords, gl.STREAM_DRAW );

	ctx.fillText = ctx.strokeText = function(text,startx,starty)
	{
		if(text === null || text === undefined)
			return;
		if(text.constructor !== String)
			text = String(text);

		var atlas = createFontAtlas.call( this, this._font_family, this._font_mode );
		var info = atlas.info;

		var points = point_text_vertices;
		var coords = point_text_coords;
		var point_size = this._font_size * 1.1;

		if(point_size < 1)
			point_size = 1;
		var char_size = info.char_size;

		var x = 0;
		var y = 0;
		var l = text.length;
		var spacing = point_size * info.spacing / info.char_size - 1 ;
		var kernings = info.kernings;
		var scale_factor = info.font_size / this._font_size;

		var vertices_index = 0, coords_index = 0;
		
		for(var i = 0; i < l; i++)
		{
			var char_code = text.charCodeAt(i);
			var c = info[ char_code ]; //info
			if(!c)
			{
				if(text.charCodeAt(i) == 10) //break line
				{
					x = 0;
					y -= point_size;
				}
				else
					x += point_size * 0.5;
				continue;
			}

			var kern = kernings[ text[i] ];
			if(i == 0)
				x -= point_size * kern["nwidth"] * 0.25;


			points[vertices_index+0] = startx + x + point_size * 0.5;
			points[vertices_index+1] = starty + y - point_size * 0.25;
			points[vertices_index+2] = 1;
			vertices_index += 3;

			coords[coords_index+0] = c[1];
			coords[coords_index+1] = c[2];
			coords_index += 2;

			var pair_kern = kern[ text[i+1] ];
			if(!pair_kern)
				x += point_size * info.space;
			else
				x += point_size * pair_kern;
		}

		var offset = 0;
		if(this.textAlign == "right")
			offset = x + point_size * 0.5;
		else if(this.textAlign == "center")
			offset = x * 0.5;
		if(offset)
			for(var i = 0; i < points.length; i += 3)
				points[i] -= offset;
		
		//render
		atlas.bind(0);

		//var mesh = GL.Mesh.load({ vertices: points, coords: coords });
		point_text_vertices_buffer.uploadRange(0,vertices_index*4);
		point_text_coords_buffer.uploadRange(0,coords_index*4);

		uniforms.u_color = this._fillcolor;
		uniforms.u_pointSize = point_size * vec2.length( this._matrix );
		uniforms.u_iCharSize = info.char_size / atlas.width;
		uniforms.u_transform = this._matrix;
		uniforms.u_viewport = viewport;
		if(!uniforms.u_angle_sincos)
			uniforms.u_angle_sincos = vec2.create();

		uniforms.u_angle_sincos[1] = Math.sin(-global_angle);
		uniforms.u_angle_sincos[0] = -Math.cos(-global_angle);
		//uniforms.u_angle_sincos[0] = Math.sin(-global_angle);
		//uniforms.u_angle_sincos[1] = Math.cos(-global_angle);

		point_text_shader.uniforms(uniforms).drawRange(point_text_mesh, gl.POINTS, 0, vertices_index / 3 );

		return { x:x, y:y };
	}

	ctx.measureText = function(text)
	{
		var atlas = createFontAtlas.call( this, this._font_family, this._font_mode );
		var info = atlas.info;
		var point_size = this._font_size * 1.1;
		var spacing = point_size * atlas.info.spacing / atlas.info.char_size - 1 ;
		return { width: text.length * spacing, height: point_size };
	}

	function createFontAtlas( fontname, fontmode, force )
	{
		fontname = fontname || "monospace";
		fontmode = fontmode || "normal";

		var now = getTime();

		var imageSmoothingEnabled = this.imageSmoothingEnabled;
		var useInternationalFont = enableWebGLCanvas.useInternationalFont;

		var canvas_size = 1024;

		var texture_name = ":font_" + fontname + ":" + fontmode + ":" + useInternationalFont;

		var texture = textures[texture_name];
		if(texture && !force)
			return texture;

		var max_ascii_code = 200;
		var chars_per_row = 10;

		if(useInternationalFont) //more characters
		{
			max_ascii_code = 400;
			chars_per_row = 20;
		}

		var char_size = (canvas_size / chars_per_row)|0;
		var font_size = (char_size * 0.95)|0;

		var canvas = createCanvas(canvas_size,canvas_size);
		//document.body.appendChild(canvas); //debug
		var ctx = canvas.getContext("2d");
		ctx.fillStyle = "white";
		ctx.imageSmoothingEnabled = this.imageSmoothingEnabled;
		//ctx.fillRect(0,0,canvas.width,canvas.height);
		ctx.clearRect(0,0,canvas.width,canvas.height);
		ctx.font = fontmode + " " + font_size + "px " + fontname;
		ctx.textAlign = "center";
		var x = 0;
		var y = 0;
		var xoffset = 0.5, yoffset = font_size * -0.3;
		var info = {
			font_size: font_size,
			char_size: char_size, //in pixels
			spacing: char_size * 0.6, //in pixels
			space: (ctx.measureText(" ").width / font_size)
		};
		
		yoffset += enableWebGLCanvas.fontOffsetY * char_size;

		//compute individual char width (WARNING: measureText is very slow)
		var kernings = info.kernings = {};
		for(var i = 33; i < max_ascii_code; i++)
		{
			var character = String.fromCharCode(i);
			var char_width = ctx.measureText(character).width;
			var char_info = { width: char_width, nwidth: char_width / font_size };
			kernings[character] = char_info;
		}
		
		var clip = true; //clip every character: debug

		//paint characters in atlas
		for(var i = 33; i < max_ascii_code; ++i)//valid characters from 33 to max_ascii_code
		{
			var character = String.fromCharCode(i);
			var kerning = kernings[ character ];
			if( kerning && kerning.width ) //has some visual info
			{
				info[i] = [character, (x + char_size*0.5)/canvas.width, (y + char_size*0.5) / canvas.height];
				if(clip)
				{
					ctx.save();
					ctx.beginPath();
					ctx.rect( Math.floor(x)+0.5,Math.floor(y)+0.5, char_size-2, char_size-2 );
					ctx.clip();
					ctx.fillText(character,Math.floor(x+char_size*xoffset),Math.floor(y+char_size+yoffset),char_size);
					ctx.restore();
				}
				else
					ctx.fillText(character,Math.floor(x+char_size*xoffset),Math.floor(y+char_size+yoffset),char_size);
				x += char_size; //cannot pack chars closer because rendering points, no quads
				if((x + char_size) > canvas.width)
				{
					x = 0;
					y += char_size;
				}
			}

			if( y + char_size > canvas.height )
				break; //too many characters
		}

		var last_valid_ascii = i; //the last character in the atlas

		//compute kernings of every char with the rest of chars
		for(var i = 33; i < last_valid_ascii; ++i)
		{
			var character = String.fromCharCode(i);
			var kerning = kernings[ character ];
			var char_width = kerning.width;
			for(var j = 33; j < last_valid_ascii; ++j)
			{
				var other = String.fromCharCode(j);
				var other_width = kernings[other].width; 
				if(!other_width)
					continue;
				var total_width = ctx.measureText(character + other).width; //this is painfully slow...
				kerning[other] = (total_width * 1.45 - char_width - other_width) / font_size;
			}
		}

		//console.log("Font Atlas Generated:", ((getTime() - now)*0.001).toFixed(2),"s");

		texture = GL.Texture.fromImage( canvas, {magFilter: imageSmoothingEnabled ? gl.LINEAR : gl.NEAREST, minFilter: imageSmoothingEnabled ? gl.LINEAR : gl.NEAREST, premultiply_alpha: false} );
		texture.info = info; //font generation info

		return textures[texture_name] = texture;
	}

	//NOT TESTED
	ctx.getImageData = function(x,y,w,h)
	{
		var buffer = new Uint8Array(w*h*4);
		gl.readPixels(x,y,w,h,gl.RGBA,gl.UNSIGNED_BYTE,buffer);
		return { data: buffer, width: w, height: h, resolution: 1 };
	}

	ctx.putImageData = function( imagedata, x, y )
	{
		var tex = new GL.Texture( imagedata.width, imagedata.height, { filter: gl.NEAREST, pixel_data: imagedata.data } );
		tex.renderQuad(x,y,tex.width, tex.height);
	}

	Object.defineProperty(gl, "fillStyle", {
		get: function() { return this._fillStyle; },
		set: function(v) { 
			if(!v)
				return;
			this._fillStyle = v;
			hexColorToRGBA( v, this._fillcolor, this._globalAlpha ); 
		}
	});

	Object.defineProperty(gl, "strokeStyle", {
		get: function() { return this._strokeStyle; },
		set: function(v) { 
			if(!v)
				return;
			this._strokeStyle = v; 
			hexColorToRGBA( v, this._strokecolor, this._globalAlpha );
		}
	});

	//shortcuts
	Object.defineProperty(gl, "fillColor", {
		get: function() { return this._fillcolor; },
		set: function(v) { 
			if(!v)
				return;
			this._fillcolor.set(v);
		}
	});

	Object.defineProperty(gl, "strokeColor", {
		get: function() { return this._strokecolor; },
		set: function(v) { 
			if(!v)
				return;
			this._strokecolor.set(v);
		}
	});

	Object.defineProperty(gl, "shadowColor", {
		get: function() { return this._shadowcolor; },
		set: function(v) { 
			if(!v)
				return;
			hexColorToRGBA( v, this._shadowcolor, this._globalAlpha );
		}
	});

	Object.defineProperty(gl, "globalAlpha", {
		get: function() { return this._globalAlpha; },
		set: function(v) { 
			this._globalAlpha = v; 
			this._strokecolor[3] = this._fillcolor[3] = v;
		}
	});

	Object.defineProperty(gl, "font", {
		get: function() { return this._font; },
		set: function(v) { 
			this._font = v;
			var t = v.split(" ");
			if(t.length == 3)
			{
				this._font_mode = t[0];
				this._font_size = parseFloat(t[1]);
				if( Number.isNaN( this._font_size ) )
					this._font_size = 14;
				if(this._font_size < 10) 
					this._font_size = 10;
				this._font_family = t[2];
			}
			else if(t.length == 2)
			{
				this._font_mode = "normal";
				this._font_size = parseFloat(t[0]);
				if( Number.isNaN( this._font_size ) )
					this._font_size = 14;
				if(this._font_size < 10) 
					this._font_size = 10;
				this._font_family = t[1];
			}
			else
			{
				this._font_mode = "normal";
				this._font_family = t[0];
			}
		}
	});

	ctx._fillcolor = vec4.fromValues(0,0,0,1);
	ctx._strokecolor = vec4.fromValues(0,0,0,1);
	ctx._shadowcolor = vec4.fromValues(0,0,0,0);
	ctx._globalAlpha = 1;
	ctx._font = "14px monospace";
	ctx._font_family = "monospace";
	ctx._font_size = "14px";
	ctx._font_mode = "normal";


	//STATE
	ctx.strokeStyle = "rgba(0,0,0,1)";
	ctx.fillStyle = "rgba(0,0,0,1)";
	ctx.shadowColor = "transparent";
	ctx.shadowOffsetX = ctx.shadowOffsetY = 0;
	ctx.globalAlpha = 1;
	ctx.setLineWidth = ctx.lineWidth; //save the webgl function
	ctx.lineWidth = 4; //set lineWidth as a number
	ctx.imageSmoothingEnabled = true;
	ctx.tintImages = false; //my own parameter


	//empty functions: this is used to create null functions in those Canvas2D funcs not implemented here
	var names = ["arcTo","isPointInPath","createImageData"]; //all functions have been implemented
	var null_func = function() {};
	for(var i in names)
		ctx[ names[i] ] = null_func;

	return ctx;
};

enableWebGLCanvas.useInternationalFont = false; //render as much characters as possible in the texture atlas
enableWebGLCanvas.fontOffsetY = 0; //hack, some fonts need extra offsets, dont know why