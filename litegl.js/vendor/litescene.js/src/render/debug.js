/**	DebugRender
* Used to render debug information like skeletons, a grid, etc
* I moved it from WebGLStudio to LS so it could help when working with scenes coded without the editor
*
* @class DebugRender
* @namespace LS
* @constructor
*/
function DebugRender()
{
	this.debug_points = []; //used for debugging, allows to draw points easily

	//current frame data to render (we store it so we can render with less drawcalls)
	this._points = []; //linear array with x,y,z, x,y,z, ...
	this._points_color = [];
	this._points_nodepth = []; //linear array with x,y,z, x,y,z, ...
	this._points_color_nodepth = [];
	this._lines = []; //vec3,vec3 array
	this._lines_color = []; //
	this._names = []; //array of [vec3, string]

	this.grid_texture_url = "imgs/grid.png";

	//this camera is used to render names
	this.camera2D = new LS.Camera({eye:[0,0,0],center:[0,0,-1]});
	this.createMeshes();

	this.colors = {
		selected: vec4.fromValues(1,1,1,1),
		node: vec4.fromValues(1,0.5,0,1),
		bone: vec4.fromValues(1,0,0.5,1)
	}

	this.settings = {
		render_grid: true,
		grid_scale: 1.0,
		grid_alpha: 0.5,
		grid_plane: "xz",
		render_names: false,
		render_skeletons: true,
		render_tree: false,
		render_components: true,
		render_null_nodes: true,
		render_axis: false,
		render_colliders: true,
		render_paths: true,
		render_origin: true,
		render_colliders_aabb: false
	};

	this._in_scene = false;
}

DebugRender.prototype.enable = function( scene )
{
	if(this._in_scene)
		return;
	scene = scene || LS.GlobalScene;
	LEvent.bind( scene, "afterRenderInstances", this.onRender, this );
	this._in_scene = scene;
}

DebugRender.prototype.disable = function( scene )
{
	if(!this._in_scene)
		return;
	LEvent.unbind( this._in_scene, "afterRenderInstances", this.onRender, this );
	this._in_scene = null;
}

DebugRender.prototype.onRender = function( e, render_settings )
{
	this.render( LS.Renderer._current_camera );
}

//we pass a callback to check if something is selected
DebugRender.prototype.render = function( camera, is_selected_callback, scene )
{
	var settings = this.settings;

	scene = scene || LS.GlobalScene;

	gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);
	gl.enable( gl.DEPTH_TEST );
	gl.disable(gl.BLEND);
	gl.disable( gl.CULL_FACE );
	gl.depthFunc( gl.LEQUAL );
	//gl.depthMask( false );
	var selected_node = null;

	if( settings.render_grid && settings.grid_alpha > 0 )
		this.renderGrid();

	if(settings.render_origin)
	{
		LS.Draw.setColor([0.3,0.3,0.3,1.0]);
		LS.Draw.push();
		LS.Draw.scale(0.01,0.01,0.01);
		LS.Draw.rotate(-90,[1,0,0]);
		gl.blendFunc(gl.SRC_ALPHA,gl.ONE);
		LS.Draw.renderText("Origin");
		gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);
		LS.Draw.pop();
	}

	if(settings.render_components)
	{
		//Node components
		for(var i = 0, l = scene._nodes.length; i < l; ++i)
		{
			var node = scene._nodes[i];
			var is_node_selected = node._is_selected;
			selected_node = node;
			if(node.renderEditor)
				node.renderEditor( is_node_selected );
			for(var j = 0, l2 = node._components.length; j < l2; ++j)
			{
				var component = node._components[j];
				var is_component_selected = false;
				if(is_selected_callback)
					is_component_selected = is_selected_callback( component );
				if(component.renderEditor)
					component.renderEditor( is_node_selected, is_component_selected );
			}
		}
	}

	//render local things		
	var zero = vec3.create();
	for(var i = 0, l = scene._nodes.length; i < l; ++i)
	{
		var node = scene._nodes[i];
		if(node._is_root || !node.flags.visible ) 
			continue;

		var global = node.transform ? node.transform.getGlobalMatrixRef() : mat4.create();
		var pos = mat4.multiplyVec3( vec3.create(), global, zero ); //create a new one to store them

		if( settings.render_null_nodes)
		{
			if( node._is_selected )
				this.renderPoint( pos, true, this.colors.selected );
			else if( node._is_bone )
				this.renderPoint( pos, true, this.colors.bone );
			else
				this.renderPoint( pos, false, this.colors.node );
		}

		if(settings.render_names)
			this.renderText(pos, node.name, node._is_selected ? [0.94, 0.8, 0.4,1] : [0.8,0.8,0.8,0.9] );

		if (node._parentNode && node._parentNode.transform && (settings.render_tree || (settings.render_skeletons && node._is_bone && node._parentNode._is_bone)) )
		{
			this.renderLine( pos , node._parentNode.transform.getGlobalPosition(), this.colors.bone );
			//this.renderPoint( pos, true, this.colors.bone );
		}

		if(settings.render_axis)
		{
			LS.Draw.push();
			LS.Draw.multMatrix(global);
			LS.Draw.setColor([1,1,1,1]);
			LS.Draw.renderMesh( this.axis_mesh, gl.LINES );
			LS.Draw.pop();
		}
	}

	if(settings.render_colliders)
		this.renderColliders( scene );
	if(settings.render_paths)
		this.renderPaths( scene );

	//Render primitives (points, lines, text) ***********************

	if(this._points.length)
	{
		LS.Draw.setPointSize(4);
		LS.Draw.setColor([1,1,1,1]);
		LS.Draw.renderPoints( this._points, this._points_color );
		this._points.length = 0;
		this._points_color.length = 0;
	}

	if(this._points_nodepth.length)
	{
		LS.Draw.setPointSize(4);
		LS.Draw.setColor([1,1,1,1]);
		gl.disable( gl.DEPTH_TEST );
		LS.Draw.renderPoints( this._points_nodepth, this._points_color_nodepth );
		gl.enable( gl.DEPTH_TEST );
		this._points_nodepth.length = 0;
		this._points_color_nodepth.length = 0;
	}

	if(this._lines.length)
	{
		gl.disable( gl.DEPTH_TEST );
		LS.Draw.setColor([1,1,1,1]);
		LS.Draw.renderLines( this._lines, this._lines_color );
		gl.enable( gl.DEPTH_TEST );
		this._lines.length = 0;
		this._lines_color.length = 0;
	}

	if(this.debug_points.length)
	{
		LS.Draw.setPointSize(5);
		LS.Draw.setColor([1,0,1,1]);
		LS.Draw.renderPoints( this.debug_points );
	}

	//this require Canvas2DtoWebGL library
	if(settings.render_names && gl.start2D)
	{
		gl.disable( gl.DEPTH_TEST );
		var camera2D = this.camera2D;
		var viewport = gl.getViewport();
		camera2D.setOrthographic(0,viewport[2], 0,viewport[3], -1,1);
		camera2D.updateMatrices();
		gl.start2D();
		//gl.disable( gl.BLEND );
		gl.font = "14px Arial";
		var black_color = vec4.fromValues(0,0,0,0.5);

		for(var i = 0; i < this._names.length; ++i)
		{
			var pos2D = camera.project( this._names[i][1] );
			if(pos2D[2] < 0)
				continue;
			pos2D[2] = 0;

			var text_size = gl.measureText( this._names[i][0] );
			gl.fillColor = black_color;
			gl.fillRect( Math.floor(pos2D[0] + 10), viewport[3] - (Math.floor(pos2D[1] + 8)), text_size.width, text_size.height );
			gl.fillColor = this._names[i][2];
			gl.fillText( this._names[i][0], Math.floor(pos2D[0] + 10), viewport[3] - (Math.floor(pos2D[1] - 4) ) );
		}
		gl.finish2D();
		this._names.length = 0;
	}

	//DEBUG
	if(settings.render_axis && selected_node) //render axis for all nodes
	{
		LS.Draw.push();
		var Q = selected_node.transform.getGlobalRotation();
		var R = mat4.fromQuat( mat4.create(), Q );
		LS.Draw.setMatrix( R );
		LS.Draw.setColor([1,1,1,1]);
		LS.Draw.scale(10,10,10);
		LS.Draw.renderMesh( this.axis_mesh, gl.LINES );
		LS.Draw.pop();
	}

	gl.depthFunc( gl.LESS );
}

//this primitives are rendered after all the components editors are rendered
DebugRender.prototype.renderPoint = function( p, ignore_depth, c )
{
	c = c || [1,1,1,1];
	if(ignore_depth)
	{
		this._points_nodepth.push( p[0], p[1], p[2] );
		this._points_color_nodepth.push( c[0], c[1], c[2], c[3] );
	}
	else
	{
		this._points.push( p[0], p[1], p[2] );
		this._points_color.push( c[0], c[1], c[2], c[3] );
	}
}

DebugRender.prototype.renderLine = function( start, end, color )
{
	color = color || [1,1,1,1];
	this._lines.push( start, end );
	this._lines_color.push( color, color );
}

DebugRender.prototype.renderText = function( position, text, color )
{
	color = color || [1,1,1,1];
	this._names.push([text,position, color]);
}

DebugRender.prototype.renderGrid = function()
{
	var settings = this.settings;

	//textured grid
	if(!this.grid_shader)
	{
		//this.grid_shader = LS.Draw.createSurfaceShader("float PI2 = 6.283185307179586; return vec4( vec3( max(0.0, cos(pos.x * PI2 * 0.1) - 0.95) * 10.0 + max(0.0, cos(pos.z * PI2 * 0.1) - 0.95) * 10.0 ),1.0);");
		this.grid_shader = LS.Draw.createSurfaceShader("vec2 f = vec2(1.0/64.0,-1.0/64.0); float brightness = texture2D(u_texture, pos.xz + f).x * 0.6 + texture2D(u_texture, pos.xz * 0.1 + f ).x * 0.3 + texture2D(u_texture, pos.xz * 0.01 + f ).x * 0.2; brightness /= max(1.0,0.001 * length(u_camera_position.xz - pos.xz));vec4 color = u_color * vec4(vec3(1.0),brightness); if( abs(pos.x) < 0.025 ) color *= vec4(0.4,0.4,1.0,1.0); if( abs(pos.z) < 0.025 ) color *= vec4(1.0,0.4,0.4,1.0); return color;");
		//this.grid_shader = LS.Draw.createSurfaceShader("vec2 f = vec2(1.0/64.0,-1.0/64.0); float brightness = texture2D(u_texture, pos.xz + f).x * 0.6 + texture2D(u_texture, pos.xz * 0.1 + f ).x * 0.3 + texture2D(u_texture, pos.xz * 0.01 + f ).x * 0.2; brightness /= max(1.0,0.001 * length(u_camera_position.xz - pos.xz));vec4 color = u_color * vec4(vec3(1.0),brightness); return color;");
		this.grid_shader_xy = LS.Draw.createSurfaceShader("vec2 f = vec2(1.0/64.0,-1.0/64.0); float brightness = texture2D(u_texture, pos.xy + f).x * 0.6 + texture2D(u_texture, pos.xy * 0.1 + f ).x * 0.3 + texture2D(u_texture, pos.xy * 0.01 + f ).x * 0.2; brightness /= max(1.0,0.001 * length(u_camera_position.xy - pos.xy));vec4 color = u_color * vec4(vec3(1.0),brightness);  if( abs(pos.x) < 0.025 ) color *= vec4(0.4,1.0,0.4,1.0); if( abs(pos.y) < 0.025 ) color *= vec4(1.0,0.4,0.4,1.0); return color;");
		//this.grid_shader_xy = LS.Draw.createSurfaceShader("vec2 f = vec2(1.0/64.0,-1.0/64.0); float brightness = texture2D(u_texture, pos.xy + f).x * 0.6 + texture2D(u_texture, pos.xy * 0.1 + f ).x * 0.3 + texture2D(u_texture, pos.xy * 0.01 + f ).x * 0.2; brightness /= max(1.0,0.001 * length(u_camera_position.xy - pos.xy));return u_color * vec4(vec3(1.0),brightness);");
		this.grid_shader_yz = LS.Draw.createSurfaceShader("vec2 f = vec2(1.0/64.0,-1.0/64.0); float brightness = texture2D(u_texture, pos.yz + f).x * 0.6 + texture2D(u_texture, pos.yz * 0.1 + f ).x * 0.3 + texture2D(u_texture, pos.yz * 0.01 + f ).x * 0.2; brightness /= max(1.0,0.001 * length(u_camera_position.yz - pos.yz)); vec4 color = u_color * vec4(vec3(1.0),brightness);  if( abs(pos.y) < 0.025 ) color *= vec4(0.4, 0.4, 1.0, 1.0); if( abs(pos.z) < 0.025 ) color *= vec4(0.4,1.0,0.4,1.0); return color;");
		//this.grid_shader_yz = LS.Draw.createSurfaceShader("vec2 f = vec2(1.0/64.0,-1.0/64.0); float brightness = texture2D(u_texture, pos.yz + f).x * 0.6 + texture2D(u_texture, pos.yz * 0.1 + f ).x * 0.3 + texture2D(u_texture, pos.yz * 0.01 + f ).x * 0.2; brightness /= max(1.0,0.001 * length(u_camera_position.yz - pos.yz));return u_color * vec4(vec3(1.0),brightness);");
		this.grid_shader.uniforms({u_texture:0});

		if( this.grid_img && this.grid_img.loaded )
			this.grid_texture = GL.Texture.fromImage( this.grid_img, {format: gl.RGB, wrap: gl.REPEAT, anisotropic: 4, minFilter: gl.LINEAR_MIPMAP_LINEAR } );
		else
			this.grid_texture = GL.Texture.fromURL( this.grid_texture_url, {format: gl.RGB, wrap: gl.REPEAT, anisotropic: 4, minFilter: gl.LINEAR_MIPMAP_LINEAR } );
	}

	LS.Draw.push();

	if(settings.grid_plane == "xy")
		LS.Draw.rotate(90,1,0,0);
	else if(settings.grid_plane == "yz")
		LS.Draw.rotate(90,0,0,1);


	if(!this.grid_texture || this.grid_texture.ready === false)
	{
		var grid_scale = 1;			
		var grid_alpha = 1;
		//lines grid
		LS.Draw.setColor([0.2,0.2,0.2, grid_alpha * 0.75]);
		LS.Draw.scale( grid_scale , grid_scale , grid_scale );
		LS.Draw.renderMesh( this.grid_mesh, gl.LINES );
		LS.Draw.scale(10,10,10);
		LS.Draw.renderMesh( this.grid_mesh, gl.LINES );
	}
	else
	{
		//texture grid
		gl.enable(gl.BLEND);
		this.grid_texture.bind(0);
		gl.depthMask( false );
		LS.Draw.setColor([1,1,1, this.settings.grid_alpha ]);
		LS.Draw.translate( LS.Draw.camera_position[0], 0, LS.Draw.camera_position[2] ); //follow camera
		LS.Draw.scale( 10000, 10000, 10000 );
		LS.Draw.renderMesh( this.plane_mesh, gl.TRIANGLES, settings.grid_plane == "xy" ? this.grid_shader_xy : (settings.grid_plane == "yz" ? this.grid_shader_yz : this.grid_shader) );
		gl.depthMask( true );
	}

	LS.Draw.pop();
}

DebugRender.prototype.renderColliders = function( scene )
{
	scene = scene || LS.GlobalScene;
	if(!scene._colliders)
		return;

	LS.Draw.setColor([0.33,0.71,0.71,0.5]);

	for(var i = 0; i < scene._colliders.length; ++i)
	{
		var instance = scene._colliders[i];
		var oobb = instance.oobb;

		if(this.settings.render_colliders_aabb) //render AABB
		{
			var aabb = instance.aabb;
			LS.Draw.push();
			var center = BBox.getCenter(aabb);
			var halfsize = BBox.getHalfsize(aabb);
			LS.Draw.translate(center);
			//LS.Draw.setColor([0.33,0.71,0.71,0.5]);
			LS.Draw.renderWireBox(halfsize[0]*2,halfsize[1]*2,halfsize[2]*2);
			LS.Draw.pop();
		}

		LS.Draw.push();
		LS.Draw.multMatrix( instance.matrix );
		var halfsize = BBox.getHalfsize(oobb);

		if(instance.type == LS.PhysicsInstance.BOX)
		{
			LS.Draw.translate( BBox.getCenter(oobb) );
			LS.Draw.renderWireBox( halfsize[0]*2, halfsize[1]*2, halfsize[2]*2 );
		}
		else if(instance.type == LS.PhysicsInstance.SPHERE)
		{
			//Draw.scale(,halfsize[0],halfsize[0]);
			LS.Draw.translate( BBox.getCenter(oobb) );
			LS.Draw.renderWireSphere( halfsize[0], 20 );
		}
		else if(instance.type == LS.PhysicsInstance.MESH)
		{
			var mesh = instance.mesh;
			if(mesh)
			{
				if(!mesh.indexBuffers["wireframe"])
					mesh.computeWireframe();
				LS.Draw.renderMesh(mesh, gl.LINES, null, "wireframe" );
			}
		}

		LS.Draw.pop();
	}
}

DebugRender.prototype.renderPaths = function( scene )
{
	scene = scene || LS.GlobalScene;

	if(!scene._paths)
		return;

	LS.Draw.setColor([0.7,0.6,0.3,0.5]);

	for(var i = 0; i < scene._paths.length; ++i)
	{
		var path = scene._paths[i];
		var points = path.samplePoints(0);
		LS.Draw.renderLines( points, null, true );
	}
}

DebugRender.prototype.createMeshes = function()
{
	//plane
	this.plane_mesh = GL.Mesh.plane({xz:true});

	//grid
	var dist = 10;
	var num = 10;
	var vertices = [];
	for(var i = -num; i <= num; i++)
	{
		vertices.push([i*dist,0,dist*num]);
		vertices.push([i*dist,0,-dist*num]);
		vertices.push([dist*num,0,i*dist]);
		vertices.push([-dist*num,0,i*dist]);
	}
	this.grid_mesh = GL.Mesh.load({vertices:vertices});

	//box
	vertices = new Float32Array([-1,1,1 , -1,1,-1, 1,1,-1, 1,1,1, -1,-1,1, -1,-1,-1, 1,-1,-1, 1,-1,1]);
	var triangles = new Uint16Array([0,1, 0,4, 0,3, 1,2, 1,5, 2,3, 2,6, 3,7, 4,5, 4,7, 6,7, 5,6 ]);
	this.box_mesh = GL.Mesh.load({vertices: vertices, lines:triangles });

	//circle
	this.circle_mesh = GL.Mesh.circle({size:1,slices:50});
	this.circle_empty_mesh = GL.Mesh.circle({size:1,slices:50,empty:1});
	this.sphere_mesh = GL.Mesh.icosahedron({size:1, subdivisions: 3});

	//dummy
	vertices = [];
	vertices.push([-dist*0.5,0,0],[+dist*0.5,0,0]);
	vertices.push([0,-dist*0.5,0],[0,+dist*0.5,0]);
	vertices.push([0,0,-dist*0.5],[0,0,+dist*0.5]);
	this.dummy_mesh = GL.Mesh.load({vertices:vertices});

	//box
	vertices = [];
	vertices.push([-1.0,1.0,1.0],[1.0,1.0,1.0],[-1.0,1.0,-1.0], [1.0,1.0,-1.0],[-1.0,-1.0,1.0], [1.0,-1.0,1.0],[-1.0,-1.0,-1.0], [1.0,-1.0,-1.0]);
	vertices.push([1.0,-1.0,1.0],[1.0,1.0,1.0],[1.0,-1.0,-1.0],[1.0,1.0,-1.0],[-1.0,-1.0,1.0],[-1.0,1.0,1.0],[-1.0,-1.0,-1.0],[-1.0,1.0,-1.0]);
	vertices.push([1.0,1.0,1.0],[1.0,1.0,-1.0],[1.0,-1.0,1.0],[1.0,-1.0,-1.0],[-1.0,1.0,1.0],[-1.0,1.0,-1.0],[-1.0,-1.0,1.0],[-1.0,-1.0,-1.0]);
	this.cube_mesh = GL.Mesh.load({vertices:vertices});

	for(var i = 1; i >= 0.0; i -= 0.02)
	{
		var f = ( 1 - 0.001/(i) )*2-1;
		vertices.push([-1.0,1.0,f],[1.0,1.0,f],[-1.0,-1.0,f], [1.0,-1.0,f]);
		vertices.push([1.0,-1.0,f],[1.0,1.0,f],[-1.0,-1.0,f],[-1.0,1.0,f]);
	}

	this.frustum_mesh = GL.Mesh.load({vertices:vertices});

	//cylinder
	this.cylinder_mesh = GL.Mesh.cylinder({radius:10,height:2});

	//axis
	vertices = [];
	var colors = [];
	dist = 2;
	vertices.push([0,0,0],[+dist*0.5,0,0]);
	colors.push([1,0,0,1],[1,0,0,1]);
	vertices.push([0,0,0],[0,+dist*0.5,0]);
	colors.push([0,1,0,1],[0,1,0,1]);
	vertices.push([0,0,0],[0,0,+dist*0.5]);
	colors.push([0,0,1,1],[0,0,1,1]);
	this.axis_mesh = GL.Mesh.load({vertices:vertices, colors: colors});

	//top
	vertices = [];
	vertices.push([0,0,0],[0,+dist*0.5,0]);
	vertices.push([0,+dist*0.5,0],[0.1*dist,+dist*0.4,0]);
	vertices.push([0,+dist*0.5,0],[-0.1*dist,+dist*0.4,0]);
	this.top_line_mesh = GL.Mesh.load({vertices:vertices});

	//front
	vertices = [];
	vertices.push([0,0,0],[0,0,+dist*0.5]);
	vertices.push([0,0,+dist*0.5],[0,0.1*dist,+dist*0.4]);
	vertices.push([0,0,+dist*0.5],[0,-0.1*dist,+dist*0.4]);
	this.front_line_mesh = GL.Mesh.load({vertices:vertices});
}

LS.DebugRender = DebugRender;