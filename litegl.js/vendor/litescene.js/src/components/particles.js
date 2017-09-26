function Particle()
{
	this.id = 0;
	this._pos = vec3.fromValues(0,0,0);
	this._vel = vec3.fromValues(0,0,0);
	this.life = 1;
	this.angle = 0;
	this.size = 1;
	this.rot = 0;
}

Object.defineProperty( Particle.prototype, 'pos', {
	get: function() { return this._pos; },
	set: function(v) { this._pos.set(v); },
	enumerable: true
});

Object.defineProperty( Particle.prototype, 'vel', {
	get: function() { return this._vel; },
	set: function(v) { this._vel.set(v); },
	enumerable: true
});


function ParticleEmissor(o)
{
	this.enabled = true;

	this.max_particles = 1024;
	this.warm_up_time = 0;
	this.point_particles = false;

	this.emissor_type = ParticleEmissor.BOX_EMISSOR;
	this.emissor_rate = 5; //particles per second
	this.emissor_size = vec3.fromValues(10,10,10);
	this.emissor_mesh = null;

	this.particle_life = 5;
	this.particle_speed = 10;
	this.particle_size = 5;
	this.particle_rotation = 0;
	this.particle_size_curve = [[1,1]];

	this._particle_start_color = vec3.fromValues(1,1,1);
	this._particle_end_color = vec3.fromValues(1,1,1);

	this.particle_opacity_curve = [[0.5,1]];

	this.texture_grid_size = 1;

	this._custom_emissor_code = null;
	this._custom_update_code = null;

	//physics
	this.physics_gravity = [0,0,0];
	this.physics_friction = 0;

	//material
	this.opacity = 1;
	this.additive_blending = false;
	this.texture = null;
	this.animation_fps = 1;
	this.soft_particles = false;

	this.use_node_material = false; 
	this.animated_texture = false; //change frames
	this.loop_animation = false;
	this.independent_color = false;
	this.premultiplied_alpha = false;
	this.align_with_camera = true;
	this.align_always = false; //align with all cameras
	this.follow_emitter = false;
	this.sort_in_z = true; //slower
	this.stop_update = false; //do not move particles
	this.ignore_lights = false; 

	if(o)
		this.configure(o);

	//LEGACY!!! sizes where just a number before
	if(typeof(this.emissor_size) == "number")
		this.emissor_size = [this.emissor_size,this.emissor_size,this.emissor_size];

	this._emissor_pos = vec3.create();
	this._particles = [];
	this._remining_dt = 0;
	this._visible_particles = 0;
	this._min_particle_size = 0.001;
	this._last_id = 0;

	if(global.gl)
		this.createMesh();

	
	/* demo particles
	for(var i = 0; i < this.max_particles; i++)
	{
		var p = this.createParticle();
		this._particles.push(p);
	}
	*/
}

ParticleEmissor.BOX_EMISSOR = 1;
ParticleEmissor.SPHERE_EMISSOR = 2;
ParticleEmissor.MESH_EMISSOR = 3;
ParticleEmissor.CUSTOM_EMISSOR = 10;

ParticleEmissor["@emissor_type"] = { type:"enum", values:{ "Box":ParticleEmissor.BOX_EMISSOR, "Sphere":ParticleEmissor.SPHERE_EMISSOR, "Mesh":ParticleEmissor.MESH_EMISSOR, "Custom": ParticleEmissor.CUSTOM_EMISSOR }};
ParticleEmissor.icon = "mini-icon-particles.png";

Object.defineProperty( ParticleEmissor.prototype, 'particle_start_color', {
	get: function() { return this._particle_start_color; },
	set: function(v) { 
		if(v)
			this._particle_start_color.set(v); 
	},
	enumerable: true
});

Object.defineProperty( ParticleEmissor.prototype, 'particle_end_color', {
	get: function() { return this._particle_end_color; },
	set: function(v) { 
		if(v)
			this._particle_end_color.set(v); 
	},
	enumerable: true
});


Object.defineProperty( ParticleEmissor.prototype , 'custom_emissor_code', {
	get: function() { return this._custom_emissor_code; },
	set: function(v) { 
		v = LScript.cleanCode(v);
		this._custom_emissor_code = v;
		try
		{
			if(v && v.length)
				this._custom_emissor_func = new Function("p",v);
			else
				this._custom_emissor_func = null;
		}
		catch (err)
		{
			console.error("Error in ParticleEmissor custom emissor code: ", err);
		}
	},
	enumerable: true
});

Object.defineProperty( ParticleEmissor.prototype , 'custom_update_code', {
	get: function() { return this._custom_update_code; },
	set: function(v) { 
		v = LScript.cleanCode(v);
		this._custom_update_code = v;
		try
		{
			if(v && v.length)
				this._custom_update_func = new Function("p","dt",v);
			else
				this._custom_update_func = null;
		}
		catch (err)
		{
			console.error("Error in ParticleEmissor custom emissor code: ", err);
		}
	},
	enumerable: true
});


ParticleEmissor.prototype.onAddedToScene = function(scene)
{
	LEvent.bind( scene, "update",this.onUpdate,this);
	LEvent.bind( scene, "start",this.onStart,this);
	LEvent.bind( scene, "collectRenderInstances", this.onCollectInstances, this);
	LEvent.bind( scene, "afterCameraEnabled",this.onAfterCamera, this);
}

ParticleEmissor.prototype.onRemovedFromScene = function(scene)
{
	LEvent.unbindAll( scene, this );
}

ParticleEmissor.prototype.getResources = function(res)
{
	if(this.emissor_mesh)
		res[ this.emissor_mesh ] = Mesh;
	if(this.texture)
		res[ this.texture ] = Texture;
}

ParticleEmissor.prototype.onResourceRenamed = function (old_name, new_name, resource)
{
	if(this.emissor_mesh == old_name)
		this.emissor_mesh = new_name;
	if(this.texture == old_name)
		this.texture = new_name;
}

ParticleEmissor.prototype.onAfterCamera = function(e,camera)
{
	if(!this.enabled)
		return;

	if(this.align_always)
		this.updateMesh( camera );
}

ParticleEmissor.prototype.createParticle = function(p)
{
	p = p || new Particle();
	
	switch(this.emissor_type)
	{
		case ParticleEmissor.BOX_EMISSOR: p._pos.set( [this.emissor_size[0] * ( Math.random() - 0.5), this.emissor_size[1] * ( Math.random() - 0.5 ), this.emissor_size[2] * (Math.random() - 0.5) ]); break;
		case ParticleEmissor.SPHERE_EMISSOR: 
			var gamma = 2 * Math.PI * Math.random();
			var theta = Math.acos(2 * Math.random() - 1);
			p._pos.set( [Math.sin(theta) * Math.cos(gamma), Math.sin(theta) * Math.sin(gamma), Math.cos(theta) ]);
			vec3.multiply( p.pos, p.pos, this.emissor_size); 
			break;
			//p.pos = vec3.multiply( vec3.normalize( vec3.create( [(Math.random() - 0.5), ( Math.random() - 0.5 ), (Math.random() - 0.5)])), this.emissor_size); break;
		case ParticleEmissor.MESH_EMISSOR: 
			var mesh = this.emissor_mesh;
			if(mesh && mesh.constructor === String)
				mesh = LS.ResourcesManager.getMesh(this.emissor_mesh);
			if(mesh && mesh.getBuffer("vertices") )
			{
				var vertices = mesh.getBuffer("vertices").data;				
				var v = Math.floor(Math.random() * vertices.length / 3)*3;
				p._pos.set( [vertices[v] + Math.random() * 0.001, vertices[v+1] + Math.random() * 0.001, vertices[v+2] + Math.random() * 0.001] );
			}
			else
				p._pos.set([0,0,0]);
			break;
		case ParticleEmissor.CUSTOM_EMISSOR: //done after the rest
		default: 
	}

	p._vel.set( [Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5 ] );
	p.life = this.particle_life;
	p.id = this._last_id;
	p.angle = 0;
	p.size = 1;
	p.rot = this.particle_rotation + 0.25 * this.particle_rotation * Math.random();

	this._last_id += 1;
	if(this.independent_color)
		p.c = vec3.clone( this.particle_start_color );

	vec3.scale(p._vel, p._vel, this.particle_speed);

	//after everything so the user can edit whatever he wants
	if(this.emissor_type == ParticleEmissor.CUSTOM_EMISSOR && this._custom_emissor_func)
		this._custom_emissor_func.call( this, p );

	//this._root.transform.transformPoint(p.pos, p.pos);
	if(!this.follow_emitter) //the transform will be applyed in the matrix
		vec3.add(p._pos, p._pos, this._emissor_pos);

	return p;
}

ParticleEmissor.prototype.onStart = function(e)
{
	if(!this.enabled)
		return;

	if(this.warm_up_time <= 0)
		return;

	var delta = 1/30;
	for(var i = 0; i < this.warm_up_time; i+= delta)
		this.onUpdate( null, delta, true);
}

ParticleEmissor.prototype.onUpdate = function(e, dt, do_not_updatemesh )
{
	if(!this.enabled)
		return;

	if(!this._root.scene)
		throw("update without scene? impossible");

	if(this._root.transform)
		this._root.transform.getGlobalPosition(this._emissor_pos);

	if(this.emissor_rate < 0) this.emissor_rate = 0;

	if(!this.stop_update)
	{
		//update particles
		var gravity = vec3.clone(this.physics_gravity);
		var friction = this.physics_friction;
		var particles = [];
		var vel = vec3.create();
		var rot = this.particle_rotation * dt;

		for(var i = 0, l = this._particles.length; i < l; ++i)
		{
			var p = this._particles[i];

			vec3.copy(vel, p._vel);
			vec3.add(vel, gravity, vel);
			vec3.scale(vel, vel, dt);

			if(friction)
			{
				vel[0] -= vel[0] * friction;
				vel[1] -= vel[1] * friction;
				vel[2] -= vel[2] * friction;
			}

			vec3.add( p._pos, vel, p._pos);

			p.angle += p.rot * dt;
			p.life -= dt;

			if(this._custom_update_func)
				this._custom_update_func.call(this,p,dt);

			if(p.life > 0) //keep alive
				particles.push(p);
		}

		//emit new
		if(this.emissor_rate != 0)
		{
			var new_particles = (dt + this._remining_dt) * this.emissor_rate;
			this._remining_dt = (new_particles % 1) / this.emissor_rate;
			new_particles = new_particles<<0;

			if(new_particles > this.max_particles)
				new_particles = this.max_particles;

			for(var i = 0; i < new_particles; i++)
			{
				var p = this.createParticle();
				if(particles.length < this.max_particles)
					particles.push(p);
			}
		}

		//replace old container with new one
		this._particles = particles;
	}

	//compute mesh
	if(!this.align_always && !do_not_updatemesh)
	{
		this.updateMesh( LS.Renderer._current_camera );
		this._root.scene.requestFrame();
	}

	//send change
	LEvent.trigger( this._root.scene , "change"); //??
}

ParticleEmissor.prototype.createMesh = function ()
{
	if( this._mesh_maxparticles == this.max_particles)
		return;

	this._vertices = new Float32Array(this.max_particles * 6 * 3); //6 vertex per particle x 3 floats per vertex
	this._coords = new Float32Array(this.max_particles * 6 * 2);
	this._colors = new Float32Array(this.max_particles * 6 * 4);
	this._extra2 = new Float32Array(this.max_particles * 2);

	var default_coords = [1,1, 0,1, 1,0,  0,1, 0,0, 1,0];
	var default_color = [1,1,1,1, 1,1,1,1, 1,1,1,1, 1,1,1,1, 1,1,1,1, 1,1,1,1];

	for(var i = 0; i < this.max_particles; i++)
	{
		this._coords.set( default_coords , i*6*2);
		this._colors.set( default_color , i*6*4);
		this._extra2[i*2] = 1;
		this._extra2[i*2+1] = i;
	}

	this._computed_grid_size = 1;
	//this._mesh = Mesh.load({ vertices:this._vertices, coords: this._coords, colors: this._colors, stream_type: gl.STREAM_DRAW });
	this._mesh = new GL.Mesh();
	this._mesh.addBuffers({ vertices:this._vertices, coords: this._coords, colors: this._colors, extra2: this._extra2 }, null, gl.STREAM_DRAW);
	this._mesh_maxparticles = this.max_particles;
}

ParticleEmissor.prototype.updateMesh = function (camera)
{
	if(!camera) //no main camera specified (happens at early updates)
		return;

	if( this._mesh_maxparticles != this.max_particles) 
		this.createMesh();

	var center = camera.getEye(); 

	var MIN_SIZE = this._min_particle_size;

	/*
	if(this.follow_emitter)
	{
		var iM = this._root.transform.getMatrix();
		mat4.multiplyVec3(iM, center);
	}
	*/

	var front = camera.getLocalVector([0,0,1]);
	var right = camera.getLocalVector([1,0,0]);
	var top = camera.getLocalVector([0,1,0]);
	var temp = vec3.create();
	var size = this.particle_size;

	var topleft = vec3.fromValues(-1,0,-1);
	var topright = vec3.fromValues(1,0,-1);
	var bottomleft = vec3.fromValues(-1,0,1);
	var bottomright = vec3.fromValues(1,0,1);

	if(this.align_with_camera)
	{
		vec3.subtract(topleft, top,right);
		vec3.add(topright, top,right);
		vec3.scale(bottomleft,topright,-1);
		vec3.scale(bottomright,topleft,-1);
	}

	//scaled versions
	var s_topleft = vec3.create()
	var s_topright = vec3.create()
	var s_bottomleft = vec3.create()
	var s_bottomright = vec3.create()

	var particles = this._particles;
	if(this.sort_in_z)
	{
		particles = this._particles.concat(); //copy
		var plane = geo.createPlane(center, front); //compute camera plane
		var den = 1 / Math.sqrt(plane[0]*plane[0] + plane[1]*plane[1] + plane[2]*plane[2]); //delta
		for(var i = 0; i < particles.length; ++i)
			particles[i]._dist = Math.abs(vec3.dot(particles[i]._pos,plane) + plane[3]) * den;
			//particles[i]._dist = vec3.dist( center, particles[i].pos );
		particles.sort(function(a,b) { return a._dist < b._dist ? 1 : (a._dist > b._dist ? -1 : 0); });
		this._particles = particles;
	}

	//avoid errors
	if(this.particle_life == 0) this.particle_life = 0.0001;

	var color = new Float32Array([1,1,1,1]);
	var particle_start_color = this._particle_start_color;
	var particle_end_color = this._particle_end_color;

	//used for grid based textures
	var recompute_coords = false;
	if((this._computed_grid_size != this.texture_grid_size || this.texture_grid_size > 1) || this.point_particles)
	{
		recompute_coords = true;
		this._computed_grid_size = this.texture_grid_size;
	}
	var texture_grid_size = this.texture_grid_size;
	var d_uvs = 1 / this.texture_grid_size;
	var offset_u = 0, offset_v = 0;
	var grid_frames = this.texture_grid_size<<2;
	var animated_texture = this.animated_texture;
	var loop_animation = this.loop_animation;
	var time = this._root.scene.getTime() * this.animation_fps;

	//used for precompute curves to speed up (sampled at 60 frames per second)
	var recompute_colors = true;
	var opacity_curve = new Float32Array((this.particle_life * 60)<<0);
	var size_curve = new Float32Array((this.particle_life * 60)<<0);
	var particle_size = this.particle_size;

	var dI = 1 / (this.particle_life * 60);
	for(var i = 0; i < opacity_curve.length; i += 1)
	{
		opacity_curve[i] = LS.getCurveValueAt(this.particle_opacity_curve,0,1,0, i * dI );
		size_curve[i] = LS.getCurveValueAt(this.particle_size_curve,0,1,0, i * dI );
	}

	//references
	var points = this.point_particles;
	var max_vertices = this._vertices.length;
	var vertices = this._vertices;
	var colors = this._colors;
	var extra2 = this._extra2;
	var coords = this._coords;

	//used for rotations
	var rot = quat.create();

	//generate quads
	var i = 0, f = 0;
	for( var iParticle = 0, l = particles.length; iParticle < l; ++iParticle )
	{
		var p = particles[iParticle];
		if(p.life <= 0)
			continue;

		f = 1.0 - p.life / this.particle_life;

		if(recompute_colors) //compute color and opacity
		{
			var a = opacity_curve[(f*opacity_curve.length)<<0]; //getCurveValueAt(this.particle_opacity_curve,0,1,0,f);

			if(this.independent_color && p.c)
				vec3.clone(color,p.c);
			else
				vec3.lerp(color, particle_start_color, particle_end_color, f);

			if(this.premultiplied_alpha)
			{
				vec3.scale(color,color,a);
				color[3] = 1.0;
			}
			else
				color[3] = a;

			if(a < 0.001)
				continue;
		}

		var s = p.size * size_curve[(f*size_curve.length)<<0]; //getCurveValueAt(this.particle_size_curve,0,1,0,f);

		if(Math.abs(s * particle_size) < MIN_SIZE)
			continue; //ignore almost transparent particles

		if(points)
		{
			vertices.set(p._pos, i*3);
			colors.set(color, i*4);
			if(recompute_coords)
			{
				var iG = (animated_texture ? ((loop_animation?time:f)*grid_frames)<<0 : p.id) % grid_frames;
				offset_u = iG * d_uvs;
				offset_v = 1 - (offset_u<<0) * d_uvs - d_uvs;
				offset_u = offset_u%1;
				coords[i*2] = offset_u;
				coords[i*2+1] = offset_v;
			}
			extra2[i*2] = s;
			extra2[i*2+1] = i;
			++i;
			if(i*3 >= max_vertices)
				break; //too many particles
			continue;
		}

		s *= particle_size;

		vec3.scale(s_bottomleft, bottomleft, s)
		vec3.scale(s_topright, topright, s);
		vec3.scale(s_topleft, topleft, s);
		vec3.scale(s_bottomright, bottomright, s);

		if(p.angle != 0)
		{
			quat.setAxisAngle( rot , front, p.angle * DEG2RAD);
			vec3.transformQuat(s_bottomleft, s_bottomleft, rot);
			vec3.transformQuat(s_topright, s_topright, rot);
			vec3.transformQuat(s_topleft, s_topleft, rot);
			vec3.transformQuat(s_bottomright, s_bottomright, rot);
		}

		vec3.add(temp, p._pos, s_topright);
		vertices.set(temp, i*6*3);

		vec3.add(temp, p._pos, s_topleft);
		vertices.set(temp, i*6*3 + 3);

		vec3.add(temp, p._pos, s_bottomright);
		vertices.set(temp, i*6*3 + 3*2);

		vec3.add(temp, p._pos, s_topleft);
		vertices.set(temp, i*6*3 + 3*3);

		vec3.add(temp, p._pos, s_bottomleft);
		vertices.set(temp, i*6*3 + 3*4);

		vec3.add(temp, p._pos, s_bottomright);
		vertices.set(temp, i*6*3 + 3*5);

		if(recompute_colors)
		{
			colors.set(color, i*6*4);
			colors.set(color, i*6*4 + 4);
			colors.set(color, i*6*4 + 4*2);
			colors.set(color, i*6*4 + 4*3);
			colors.set(color, i*6*4 + 4*4);
			colors.set(color, i*6*4 + 4*5);
		}

		if(recompute_coords)
		{
			var iG = (animated_texture ? ((loop_animation?time:f)*grid_frames)<<0 : p.id) % grid_frames;
			offset_u = iG * d_uvs;
			offset_v = 1 - (offset_u<<0) * d_uvs - d_uvs;
			offset_u = offset_u%1;
			coords.set([offset_u+d_uvs,offset_v+d_uvs, offset_u,offset_v+d_uvs, offset_u+d_uvs,offset_v,  offset_u,offset_v+d_uvs, offset_u,offset_v, offset_u+d_uvs,offset_v], i*6*2);
		}

		++i;
		if(i*6*3 >= max_vertices)
			break; //too many particles
	}
	this._visible_particles = i;

	//upload geometry
	this._mesh.vertexBuffers["vertices"].data = this._vertices;
	this._mesh.vertexBuffers["vertices"].upload(gl.STREAM_DRAW);

	this._mesh.vertexBuffers["colors"].data = this._colors;
	this._mesh.vertexBuffers["colors"].upload(gl.STREAM_DRAW);

	this._mesh.vertexBuffers["extra2"].data = this._extra2;
	this._mesh.vertexBuffers["extra2"].upload(gl.STREAM_DRAW);

	if(recompute_coords)
	{
		this._mesh.vertexBuffers["coords"].data = this._coords;
		this._mesh.vertexBuffers["coords"].upload(gl.STREAM_DRAW);
	}
}

ParticleEmissor._identity = mat4.create();

//ParticleEmissor.prototype.getRenderInstance = function(options,camera)
ParticleEmissor.prototype.onCollectInstances = function(e, instances, options)
{
	if(!this._root || !this.enabled)
		return;

	var camera = LS.Renderer._current_camera;

	if(!this._material)
		this._material = new LS.StandardMaterial({ shader_name:"lowglobal" });

	this._material.opacity = this.opacity - 0.01; //try to keep it under 1
	this._material.setTexture( "color", this.texture );
	this._material.blend_mode = this.additive_blending ? Blend.ADD : Blend.ALPHA;
	this._material.soft_particles = this.soft_particles;
	this._material.constant_diffuse = true;
	this._material.uvs_matrix[0] = this._material.uvs_matrix[4] = 1 / this.texture_grid_size;
	this._material.flags.depth_write = false;
	this._material.flags.ignore_lights = this.ignore_lights;

	if(!this._mesh)
		return null;

	var RI = this._render_instance;
	if(!RI)
		this._render_instance = RI = new LS.RenderInstance(this._root, this);

	if(this.follow_emitter)
		mat4.translate( RI.matrix, ParticleEmissor._identity, this._root.transform._position );
	else
	{
		mat4.copy( RI.matrix, ParticleEmissor._identity );
		if(this._root.transform)
			this._root.transform.getGlobalPosition( RI.center );
	}

	var material = (this._root.material && this.use_node_material) ? this._root.getMaterial() : this._material;
	mat4.multiplyVec3(RI.center, RI.matrix, vec3.create());

	RI.setMaterial( material );

	if(this.point_particles)
	{
		RI.setMesh( this._mesh, gl.POINTS );
		RI.uniforms.u_point_size = this.particle_size;
		RI.query.macros["USE_POINTS"] = "";
		RI.query.macros["USE_POINT_CLOUD"] = "";
		RI.query.macros["USE_TEXTURED_POINTS"] = "";
		RI.setRange(0, this._visible_particles);
	}
	else
	{
		RI.setMesh( this._mesh, gl.TRIANGLES );
		RI.setRange(0, this._visible_particles * 6); //6 vertex per particle
		delete RI.query.macros["USE_POINTS"];
		delete RI.query.macros["USE_POINT_CLOUD"];
		delete RI.query.macros["USE_TEXTURED_POINTS"];
		delete RI.uniforms["u_point_size"];
	}

	instances.push( RI );
}

LS.Particle = Particle;
LS.registerComponent(ParticleEmissor);