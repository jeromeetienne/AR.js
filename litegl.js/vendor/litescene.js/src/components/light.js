//***** LIGHT ***************************

/**
* Light contains all the info about the light (type: SPOT, OMNI, DIRECTIONAL, attenuations, shadows, etc)
* @class Light
* @constructor
* @param {Object} object to configure from
*/
function Light(o)
{
	/**
	* Position of the light in world space
	* @property position
	* @type {[[x,y,z]]}
	* @default [0,0,0]
	*/
	this._position = vec3.create();
	/**
	* Position where the light is pointing at (in world space)
	* @property target
	* @type {[[x,y,z]]}
	* @default [0,0,1]
	*/
	this._target = vec3.fromValues(0,0,1);
	/**
	* Up vector (in world coordinates)
	* @property up
	* @type {[[x,y,z]]}
	* @default [0,1,0]
	*/
	this._up = vec3.fromValues(0,1,0);

	/**
	* Enabled
	* @property enabled
	* @type {Boolean}
	* @default true
	*/
	this.enabled = true;

	/**
	* Layers mask, this layers define which objects are iluminated by this light
	* @property layers
	* @type {Number}
	* @default true
	*/
	this.layers = 0xFF;


	/**
	* Near distance
	* @property near
	* @type {Number}
	* @default 1
	*/
	this.near = 1;
	/**
	* Far distance
	* @property far
	* @type {Number}
	* @default 1000
	*/

	this.far = 500;
	/**
	* Angle for the spot light inner apperture
	* @property angle
	* @type {Number}
	* @default 45
	*/
	this.angle = 45; //spot cone
	/**
	* Angle for the spot light outer apperture
	* @property angle_end
	* @type {Number}
	* @default 60
	*/
	this.angle_end = 60; //spot cone end

	this.constant_diffuse = false;
	this.use_specular = true;
	this.att_start = 0;
	this.att_end = 1000;

	/**
	* type of attenuation: Light.NO_ATTENUATION, Light.LINEAR_ATTENUATION, Light.RANGE_ATTENUATION
	* @property attenuation_type
	* @type {Number}
	* @default [1,1,1]
	*/
	this.attenuation_type = Light.RANGE_ATTENUATION; //0: none, 1:linear, 2:range, ...
	this.offset = 0;
	this._spot_cone = true;

	this.projective_texture = null;

	this._attenuation_info = new Float32Array([ this.att_start, this.att_end, this.attenuation_type, 0 ]); //start,end,type,extra

	//use target (when attached to node)
	this.use_target = false;

	/**
	* The color of the light
	* @property color
	* @type {vec3}
	* @default [1,1,1]
	*/
	this._color = vec3.fromValues(1,1,1);
	/**
	* The intensity of the light
	* @property intensity
	* @type {Number}
	* @default 1
	*/
	this.intensity = 1;

	this._type = Light.OMNI;
	this.frustum_size = 50; //ortho

	/**
	* If the light cast shadows
	* @property cast_shadows
	* @type {Boolean}
	* @default false
	*/
	this.cast_shadows = false;
	this.shadow_bias = 0.05;
	this.shadowmap_resolution = 0; //use automatic shadowmap size
	this.shadow_type = "hard"; //0 hard shadows

	//used to force the computation of the light matrix for the shader (otherwise only if projective texture or shadows are enabled)
	this.force_light_matrix = false; 
	this._light_matrix = mat4.create();

	this.extra_texture = null;

	//vectors in world space
	this._front = vec3.clone( LS.FRONT );
	this._right = vec3.clone( LS.RIGHT );
	this._top = vec3.clone( LS.TOP );

	//for StandardMaterial
	this._query = new LS.ShaderQuery();
	this._samplers = [];

	//light uniforms
	this._uniforms = {
		u_light_info: vec4.fromValues( this._type, this._spot_cone ? 1 : 0, 0, 0 ), //light type, spot cone, index of pass, num passes
		u_light_front: this._front,
		u_light_angle: vec4.fromValues( this.angle * DEG2RAD, this.angle_end * DEG2RAD, Math.cos( this.angle * DEG2RAD * 0.5 ), Math.cos( this.angle_end * DEG2RAD * 0.5 ) ),
		u_light_position: this._position,
		u_light_color: vec3.create(),
		u_light_att: this._attenuation_info,
		u_light_offset: this.offset,
		u_light_extra: vec4.create(),
		u_light_matrix: this._light_matrix
//		u_shadow_params: vec4.fromValues( 1, this.shadow_bias, 1, 100 ),
//		shadowmap: LS.Renderer.SHADOWMAP_TEXTURE_SLOT
	};

	//configure
	if(o) 
	{
		this.configure(o);
		if(o.shadowmap_resolution !== undefined)
			this.shadowmap_resolution = parseInt(o.shadowmap_resolution); //LEGACY: REMOVE
	}

	if(global.gl && !gl.extensions.WEBGL_depth_texture)
		Light.use_shadowmap_depth_texture = false;
}

Light.NO_ATTENUATION = 0;
Light.LINEAR_ATTENUATION = 1;
Light.RANGE_ATTENUATION = 2;

Light.AttenuationTypes = {
	"none": Light.NO_ATTENUATION,
	"linear": Light.LINEAR_ATTENUATION,
	"range": Light.RANGE_ATTENUATION
};

Light["@projective_texture"] = { type: LS.TYPES.TEXTURE };
Light["@extra_texture"] = { type: LS.TYPES.TEXTURE };
Light["@color"] = { type: LS.TYPES.COLOR };
Light["@attenuation_type"] = { type: "enum", values: Light.AttenuationTypes };

Object.defineProperty( Light.prototype, 'type', {
	get: function() { return this._type; },
	set: function(v) { 
		this._uniforms.u_light_info[0] = v;
		this._type = v;
	},
	enumerable: true
});

Object.defineProperty( Light.prototype, 'position', {
	get: function() { return this._position; },
	set: function(v) { this._position.set(v); },
	enumerable: true
});

Object.defineProperty( Light.prototype, 'target', {
	get: function() { return this._target; },
	set: function(v) { this._target.set(v);  },
	enumerable: true
});

Object.defineProperty( Light.prototype, 'extra', {
	get: function() { return this._uniforms.u_light_extra; },
	set: function(v) { 
		if(v)
			this._uniforms.u_light_extra.set(v);  },
	enumerable: true
});

Object.defineProperty( Light.prototype, 'up', {
	get: function() { return this._up; },
	set: function(v) { this._up.set(v);  },
	enumerable: true
});

Object.defineProperty( Light.prototype, 'color', {
	get: function() { return this._color; },
	set: function(v) { this._color.set(v); },
	enumerable: true
});

Object.defineProperty( Light.prototype, 'spot_cone', {
	get: function() { return this._spot_cone; },
	set: function(v) { 
		this._spot_cone = v;
		this._uniforms.u_light_info[1] = v ? 1 : 0;
	},
	enumerable: true
});

Light.OMNI = 1;
Light.SPOT = 2;
Light.DIRECTIONAL = 3;

Light.DEFAULT_DIRECTIONAL_FRUSTUM_SIZE = 50;

Light.use_shadowmap_depth_texture = true;
Light.shadow_shaderblocks = [];
Light.shadow_shaderblocks_by_name = [];

Light.prototype.onAddedToNode = function(node)
{
	if(!node.light)
		node.light = this;
}

Light.prototype.onRemovedFromNode = function(node)
{
	if(node.light == this)
		delete node.light;
}

Light.prototype.onAddedToScene = function(scene)
{
	LEvent.bind( scene, "collectLights", this.onCollectLights, this ); 
}

Light.prototype.onRemovedFromScene = function(scene)
{
	LEvent.unbind( scene, "collectLights", this.onCollectLights, this );
	LS.ResourcesManager.unregisterResource( ":shadowmap_" + this.uid );
}

Light.prototype.onCollectLights = function(e, lights)
{
	if(!this.enabled)
		return;

	//add to lights vector
	lights.push(this);
}

Light._temp_matrix = mat4.create();
Light._temp2_matrix = mat4.create();
Light._temp3_matrix = mat4.create();
Light._temp_position = vec3.create();
Light._temp_target = vec3.create();
Light._temp_up = vec3.create();
Light._temp_front = vec3.create();

//Used to create a camera from a light
Light.prototype.updateLightCamera = function()
{
	if(!this._light_camera)
		this._light_camera = new LS.Components.Camera();

	var camera = this._light_camera;
	camera.eye = this.getPosition( Light._temp_position );
	camera.center = this.getTarget( Light._temp_target );

	var up = this.getUp( Light._temp_up );
	var front = this.getFront( Light._temp_front );
	if( Math.abs( vec3.dot(front,up) ) > 0.999 ) 
		vec3.set(up,0,0,1);
	camera.up = up;
	camera.type = this.type == Light.DIRECTIONAL ? LS.Components.Camera.ORTHOGRAPHIC : LS.Components.Camera.PERSPECTIVE;

	var closest_far = this.computeShadowmapFar();

	camera.frustum_size = this.frustum_size || Light.DEFAULT_DIRECTIONAL_FRUSTUM_SIZE;
	camera.near = this.near;
	camera.far = closest_far;
	camera.fov = (this.angle_end || 45); //fov is in degrees

	camera.updateMatrices();

	this._light_matrix.set( camera._viewprojection_matrix );

	/* ALIGN TEXEL OF SHADOWMAP IN DIRECTIONAL
	if(this.type == Light.DIRECTIONAL && this.cast_shadows && this.enabled)
	{
		var shadowmap_resolution = this.shadowmap_resolution || Light.DEFAULT_SHADOWMAP_RESOLUTION;
		var texelSize = frustum_size / shadowmap_resolution;
		view_matrix[12] = Math.floor( view_matrix[12] / texelSize) * texelSize;
		view_matrix[13] = Math.floor( view_matrix[13] / texelSize) * texelSize;
	}
	*/	

	return camera;
}

/**
* Returns the camera that will match the light orientation (taking into account fov, etc), useful for shadowmaps
* @method getLightCamera
* @return {Camera} the camera
*/
Light.prototype.getLightCamera = function()
{
	if(!this._light_camera)
		this.updateLightCamera();
	return this._light_camera;
}

/**
* updates all the important vectors (target, position, etc) according to the node parent of the light
* @method updateVectors
*/
Light.prototype.updateVectors = (function(){
	var temp_v3 = vec3.create();

	return function()
	{
		//if the light is inside the root node of the scene
		if(!this._root || !this._root.transform) 
		{
			//position, target and up are already valid
			 //front
			 //vec3.subtract(this._front, this.position, this.target ); //positive z front
			 vec3.subtract(this._front, this._target, this._position ); //positive z front
			 vec3.normalize(this._front,this._front);
			 //right
			 vec3.normalize( temp_v3, this._up );
			 vec3.cross( this._right, this._front, temp_v3 );
			 //top
			 vec3.cross( this._top, this._right, this._front );
			 return;
		}

		var mat = this._root.transform.getGlobalMatrixRef();

		//position
		mat4.getTranslation( this._position, mat);
		//target
		if (!this.use_target)
			mat4.multiplyVec3( this._target, mat, LS.FRONT ); //right in front of the object
		//up
		mat4.multiplyVec3( this._up, mat, LS.TOP ); //right in front of the object

		//vectors
		mat4.rotateVec3( this._front, mat, LS.FRONT ); 
		mat4.rotateVec3( this._right, mat, LS.RIGHT ); 
		vec3.copy( this._top, this.up ); 
	}
})();
/**
* returns a copy of the light position (in global coordinates), if you want local you can access the position property
* @method getPosition
* @param {vec3} output optional
* @return {vec3} the position
*/
Light.prototype.getPosition = function( out )
{
	out = out || vec3.create();
	//if(this._root && this._root.transform) return this._root.transform.localToGlobal( this.position, p || vec3.create() );
	if(this._root && this._root.transform) 
		return this._root.transform.getGlobalPosition( out );
	out.set( this._position );
	return out;
}

/**
* returns a copy of the light target (in global coordinates), if you want local you can access the target property
* @method getTarget
* @param {vec3} output optional
* @return {vec3} the target
*/
Light.prototype.getTarget = function( out )
{
	out = out || vec3.create();
	if(this._root && this._root.transform && !this.use_target) 
		return this._root.transform.localToGlobal( LS.FRONT , out );
	out.set( this._target );
	return out;
}

/**
* returns a copy of the light up vector (in global coordinates), if you want local you can access the up property
* @method getUp
* @param {vec3} output optional
* @return {vec3} the up vector
*/
Light.prototype.getUp = function( out )
{
	out = out || vec3.create();

	if(this._root && this._root.transform) 
		return this._root.transform.transformVector( LS.TOP , out );
	out.set( this._up );
	return out;
}

/**
* returns a copy of the front vector (in global coordinates)
* @method getFront
* @param {vec3} output optional
* @return {vec3} the front vector
*/
Light.prototype.getFront = function( out ) 
{
	var front = out || vec3.create();
	vec3.subtract(front, this.getPosition(), this.getTarget() ); //front is reversed?
	//vec3.subtract(front, this.getTarget(), this.getPosition() ); //front is reversed?
	vec3.normalize(front, front);
	return front;
}

/*
Light.prototype.getLightRotationMatrix = function()
{
	//TODO
}
*/

Light.prototype.getResources = function (res)
{
	if(this.projective_texture)
		res[ this.projective_texture ] = GL.Texture;
	if(this.extra_texture)
		res[ this.extra_texture ] = GL.Texture;
	return res;
}

Light.prototype.onResourceRenamed = function (old_name, new_name, resource)
{
	if(this.projective_texture == old_name)
		this.projective_texture = new_name;
	if(this.extra_texture == old_name)
		this.extra_texture = new_name;
}

//Layer stuff
Light.prototype.checkLayersVisibility = function( layers )
{
	return (this.layers & layers) !== 0;
}

Light.prototype.isInLayer = function(num)
{
	return (this.layers & (1<<num)) !== 0;
}

/**
* This method is called by the LS.Renderer when the light needs to be prepared to be used during render (compute light camera, create shadowmaps, prepare macros, etc)
* @method prepare
* @param {Object} render_settings info about how the scene will be rendered
*/
Light.prototype.prepare = function( render_settings )
{
	var uniforms = this._uniforms;
	var samplers = this._samplers;

	var query = this._query;
	query.clear(); //delete all properties (I dont like to generate garbage)

	//projective texture needs the light matrix to compute projection
	if(this.projective_texture || this.cast_shadows || this.force_light_matrix)
		this.updateLightCamera();

	if( (!render_settings.shadows_enabled || !this.cast_shadows) && this._shadowmap)
	{
		this._shadowmap = null;
		delete LS.ResourcesManager.textures[":shadowmap_" + this.uid ];
	}

	this.updateVectors();

	if( this.cast_shadows )
	{
		this._shadow_shaderblock_info = Light.shadow_shaderblocks_by_name[ this.shadow_type ];
		//this._shadow_shaderblock_info = Light.shadow_shaderblocks_by_name[ this.hard_shadows ? "hard" : "soft" ];
	}

	//PREPARE SHADER QUERY
	if(this.type == Light.DIRECTIONAL)
		query.macros.USE_DIRECTIONAL_LIGHT = "";
	else if(this.type == Light.SPOT)
		query.macros.USE_SPOT_LIGHT = "";
	else //omni
		query.macros.USE_OMNI_LIGHT = "";

	if(this._spot_cone)
		query.macros.USE_SPOT_CONE = "";
	if(this.attenuation_type == Light.LINEAR_ATTENUATION)
		query.macros.USE_LINEAR_ATTENUATION = "";
	if(this.attenuation_type == Light.RANGE_ATTENUATION)
		query.macros.USE_RANGE_ATTENUATION = "";
	if(this.offset > 0.001)
		query.macros.USE_LIGHT_OFFSET = "";

	if(this.projective_texture)
	{
		var light_projective_texture = this.projective_texture.constructor === String ? LS.ResourcesManager.textures[this.projective_texture] : this.projective_texture;
		if(light_projective_texture)
		{
			if(light_projective_texture.texture_type == gl.TEXTURE_CUBE_MAP)
				query.macros.USE_LIGHT_CUBEMAP = "";
			else
				query.macros.USE_LIGHT_TEXTURE = "";
		}
	}

	if(this.extra_texture)
	{
		var extra_texture = this.extra_texture.constructor === String ? LS.ResourcesManager.textures[this.extra_texture] : this.extra_texture;
		if(extra_texture)
		{
			if(extra_texture.texture_type == gl.TEXTURE_CUBE_MAP)
				query.macros.USE_EXTRA_LIGHT_CUBEMAP = "";
			else
				query.macros.USE_EXTRA_LIGHT_TEXTURE = "";
		}
	}

	//PREPARE UNIFORMS
	//if(this.type == Light.DIRECTIONAL || this.type == Light.SPOT)
	//	uniforms.u_light_front = this._front;
	if(this.type == Light.SPOT)
	{
		uniforms.u_light_angle[0] = this.angle * DEG2RAD;
		uniforms.u_light_angle[1] = this.angle_end * DEG2RAD;
		uniforms.u_light_angle[2] = Math.cos( this.angle * DEG2RAD * 0.5 );
		uniforms.u_light_angle[3] = Math.cos( this.angle_end * DEG2RAD * 0.5 );
	}

	vec3.scale( uniforms.u_light_color, this.color, this.intensity );
	this._attenuation_info[0] = this.att_start;
	this._attenuation_info[1] = this.att_end;
	this._attenuation_info[2] = this.attenuation_type;
	uniforms.u_light_offset = this.offset;

	//generate shadowmaps
	var must_update_shadowmap = render_settings.update_shadowmaps && render_settings.shadows_enabled && !render_settings.lights_disabled && !render_settings.low_quality;

	if(must_update_shadowmap)
	{
		var cameras = LS.Renderer._visible_cameras;
		var is_inside_one_camera = false;

		if( !render_settings.update_all_shadowmaps && cameras && this.type == Light.OMNI && this.attenuation_type > Light.LINEAL_ATTENUATION )
		{
			var closest_far = this.computeShadowmapFar();
			for(var i = 0; i < cameras.length; i++)
			{
				if( geo.frustumTestSphere( cameras[i]._frustum_planes, this.position, closest_far ) != CLIP_OUTSIDE )
				{
					is_inside_one_camera = true;
					break;
				}
			}
		}
		else //we only check for omnis, cone frustum collision not developed yet
			is_inside_one_camera = true;

		if( is_inside_one_camera )
			this.generateShadowmap( render_settings );
	}

	if( this._shadowmap && !this.cast_shadows )
		this._shadowmap = null; //remove shadowmap

	//prepare samplers
	this._samplers.length = 0;
	var use_shadows = this.cast_shadows && this._shadowmap && this._light_matrix != null && !render_settings.shadows_disabled;

	//projective texture
	if(this.projective_texture)
	{
		var light_projective_texture = this.projective_texture.constructor === String ? LS.ResourcesManager.textures[ this.projective_texture ] : this.projective_texture;
		if(light_projective_texture)
		{
			if(light_projective_texture.texture_type == gl.TEXTURE_CUBE_MAP)
				uniforms.light_cubemap = LS.Renderer.LIGHTPROJECTOR_TEXTURE_SLOT;
			else
				uniforms.light_texture = LS.Renderer.LIGHTPROJECTOR_TEXTURE_SLOT;
		}
		samplers[ LS.Renderer.LIGHTPROJECTOR_TEXTURE_SLOT ] = light_projective_texture;
	}
	else
	{
		delete uniforms["light_texture"];
		delete uniforms["light_cubemap"];
	}

	if(this.extra_texture)
	{
		var extra_texture = this.extra_texture.constructor === String ? LS.ResourcesManager.textures[this.extra_texture] : this.extra_texture;
		if(extra_texture)
		{
			if(extra_texture.texture_type == gl.TEXTURE_CUBE_MAP)
				uniforms.extra_light_cubemap = LS.Renderer.LIGHTEXTRA_TEXTURE_SLOT;
			else
				uniforms.extra_light_texture = LS.Renderer.LIGHTEXTRA_TEXTURE_SLOT;
		}
		samplers[ LS.Renderer.LIGHTEXTRA_TEXTURE_SLOT ] = extra_texture;
	}
	else
	{
		delete uniforms["extra_light_texture"];
		delete uniforms["extra_light_cubemap"];
	}

	//use shadows?
	if(use_shadows)
	{
		var closest_far = this.computeShadowmapFar();
		if(!uniforms.u_shadow_params)
			uniforms.u_shadow_params = vec4.create();
		uniforms.u_shadow_params.set([ 1.0 / this._shadowmap.width, this.shadow_bias, this.near, closest_far ]);
		//uniforms.shadowmap = this._shadowmap.bind(10); //fixed slot
		uniforms.shadowmap = LS.Renderer.SHADOWMAP_TEXTURE_SLOT;
		uniforms.u_light_matrix = this._light_matrix;
		samplers[ LS.Renderer.SHADOWMAP_TEXTURE_SLOT ] = this._shadowmap;
	}
	else
	{
		delete uniforms["u_shadow_params"];
		delete uniforms["shadowmap"];
	}
}

/**
* Collects and returns the shader query of the light (some macros have to be computed now because they depend not only on the light, also on the node or material)
* @method getQuery
* @param {RenderInstance} instance the render instance where this light will be applied
* @param {Object} render_settings info about how the scene will be rendered
* @return {ShaderQuery} the macros
*/
Light.prototype.getQuery = function(instance, render_settings)
{
	var query = this._query;

	var use_shadows = this.cast_shadows && this._shadowmap && this._light_matrix != null && !render_settings.shadows_disabled;

	if(!this.constant_diffuse && !instance.material.constant_diffuse)
		query.macros.USE_DIFFUSE_LIGHT = "";
	else
		delete query.macros["USE_DIFFUSE_LIGHT"];

	if(this.use_specular && instance.material.specular_factor > 0)
		query.macros.USE_SPECULAR_LIGHT = "";	
	else
		delete query.macros["USE_SPECULAR_LIGHT"];

	if(use_shadows && instance.material.flags.receive_shadows )
	{
		query.macros.USE_SHADOW_MAP = "";
		if(this._shadowmap && this._shadowmap.texture_type == gl.TEXTURE_CUBE_MAP)
			query.macros.USE_SHADOW_CUBEMAP = "";
		if(this.hard_shadows)// || macros.USE_SHADOW_CUBEMAP != null)
			query.macros.USE_HARD_SHADOWS = "";
		if(this._shadowmap && this._shadowmap.format == gl.DEPTH_COMPONENT)
			query.macros.USE_SHADOW_DEPTH_TEXTURE = "";
		query.macros.SHADOWMAP_OFFSET = "";
	}
	else
		delete query.macros["USE_SHADOW_MAP"];

	return query;
}

/**
* Optimization: instead of using the far plane, we take into account the attenuation to avoid rendering objects where the light will never reach
* @method computeShadowmapFar
* @return {number} distance
*/
Light.prototype.computeShadowmapFar = function()
{
	var closest_far = this.far;

	if( this.type == Light.OMNI )
	{
		//Math.SQRT2 because in a 45º triangle the hypotenuse is sqrt(1+1) * side
		if( this.attenuation_type == Light.RANGE_ATTENUATION  && (this.att_end * Math.SQRT2) < closest_far)
			closest_far = this.att_end / Math.SQRT2;

		//TODO, if no range_attenuation but linear_attenuation also check intensity to reduce the far
	}
	else 
	{
		if( this.attenuation_type == Light.RANGE_ATTENUATION && this.att_end < closest_far)
			closest_far = this.att_end;
	}

	return closest_far;
}

/**
* Computes the max amount of light this object can produce (taking into account every color channel)
* @method computeLightIntensity
* @return {number} intensity
*/
Light.prototype.computeLightIntensity = function()
{
	var max = Math.max( this.color[0], this.color[1], this.color[2] );
	return Math.max(0,max * this.intensity);
}

/**
* Computes the light radius according to the attenuation
* @method computeLightRadius
* @return {number} radius
*/
Light.prototype.computeLightRadius = function()
{
	//linear attenuation has no ending so infinite
	if(this.attenuation_type == Light.NO_ATTENUATION || this.attenuation_type == Light.LINEAR_ATTENUATION )
		return -1;

	if( this.type == Light.OMNI )
		return this.att_end * Math.SQRT2;

	return this.att_end;
}

/**
* Generates the shadowmap for this light
* @method generateShadowmap
* @return {Object} render_settings
*/
Light.prototype.generateShadowmap = function (render_settings)
{
	if(!this.cast_shadows)
		return;

	var light_intensity = this.computeLightIntensity();
	if( light_intensity < 0.0001 )
		return;

	//create the texture
	var shadowmap_resolution = this.shadowmap_resolution;
	if(shadowmap_resolution == 0)
		shadowmap_resolution = render_settings.default_shadowmap_resolution;

	var tex_type = this.type == Light.OMNI ? gl.TEXTURE_CUBE_MAP : gl.TEXTURE_2D;
	if(this._shadowmap == null || this._shadowmap.width != shadowmap_resolution || this._shadowmap.texture_type != tex_type )
	{
		var type = gl.UNSIGNED_BYTE;
		var format = gl.RGBA;

		//not all webgl implementations support depth textures
		if( LS.Light.use_shadowmap_depth_texture && gl.extensions.WEBGL_depth_texture && this.type != LS.Light.OMNI )
		{
			format = gl.DEPTH_COMPONENT;
			type = gl.UNSIGNED_INT;
		}
		//create texture to store the shadowmap
		this._shadowmap = new GL.Texture( shadowmap_resolution, shadowmap_resolution, { type: type, texture_type: tex_type, format: format, magFilter: gl.NEAREST, minFilter: gl.NEAREST });
		LS.ResourcesManager.textures[":shadowmap_" + this.uid ] = this._shadowmap; //debug
		if( this._shadowmap.texture_type == gl.TEXTURE_2D )
		{
			if(format == gl.RGBA)
				this._fbo = new GL.FBO( [this._shadowmap] );
			else
				this._fbo = new GL.FBO( null, this._shadowmap );
		}
	}

	LS.Renderer.setRenderPass("shadow");
	LS.Renderer._current_light = this;

	//render the scene inside the texture
	if(this.type == Light.OMNI) //render to cubemap
	{
		var closest_far = this.computeShadowmapFar();
		this._shadowmap.unbind(); 
		LS.Renderer.renderToCubemap( this.getPosition(), shadowmap_resolution, this._shadowmap, render_settings, this.near, closest_far );
	}
	else //DIRECTIONAL and SPOTLIGHT
	{
		var shadow_camera = this.getLightCamera();
		LS.Renderer.enableCamera( shadow_camera, render_settings, true );

		// Render the object viewed from the light using a shader that returns the
		// fragment depth.
		this._shadowmap.unbind(); 
		LS.Renderer._current_target = this._shadowmap;
		this._fbo.bind();

		gl.clearColor(0, 0, 0, 0);
		//gl.clearColor(1, 1, 1, 1);
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

		//RENDER INSTANCES in the shadowmap
		LS.Renderer.renderInstances( render_settings );

		this._fbo.unbind();
		LS.Renderer._current_target = null;
	}

	LS.Renderer.setRenderPass("color");
	LS.Renderer._current_light = null;
}

/**
* It returns a matrix in the position of the given light property (target, position), mostly used for gizmos
* @method getTransformMatrix
* @param {String} element "target" or "position"
* @param {mat4} output [optional]
* @return {mat4} mat4
*/
Light.prototype.getTransformMatrix = function( element, mat )
{
	if( this._root && this._root.transform )
		return null; //use the node transform

	var p = null;
	if (element == "target")
		p = this.target;
	else
		p = this.position;

	var T = mat || mat4.create();
	mat4.setTranslation( T, p );
	return T;
}

/**
* apply a transformation to a given light property, this is done in a function to allow more complex gizmos
* @method applyTransformMatrix
* @param {mat4} matrix transformation in matrix form
* @param {vec3} center ¿?
* @param {string} property_name "target" or "position"
* @return {mat4} mat4
*/
Light.prototype.applyTransformMatrix = function( matrix, center, property_name )
{
	if( this._root && this._root.transform )
		return false; //ignore transform

	var p = null;
	if (property_name == "target")
		p = this.target;
	else
		p = this.position;

	mat4.multiplyVec3( p, matrix, p );
	return true;
}

Light.prototype.applyShaderBlockFlags = function( flags, pass, render_settings )
{
	if(!this.enabled)
		return flags;

	//get the default light shader block
	flags |= Light.shader_block.flag_mask;

	//attenuation
	if(this.attenuation_type)
		flags |= Light.attenuation_block.flag_mask;

	//disabled now
	if( this.cast_shadows && render_settings.shadows_enabled )
	{
		if(this.type == Light.OMNI)
		{
			//flags |= Light.shadowmapping_cube_shader_block.flag_mask;
		}
		else
		{
			//take into account if using depth texture or color texture
			var shadow_block = this._shadow_shaderblock_info ? this._shadow_shaderblock_info.shaderblock : null;
			if(shadow_block)
				flags |= shadow_block.flag_mask;
		}

		if(this._shadowmap && this._shadowmap.format == gl.RGBA )
			flags |= LS.Light.shadowmapping_depth_in_color_block.flag_mask;
	}
	return flags;
}

Light.registerShadowType = function( name, shaderblock )
{
	var info = { id: this.shadow_shaderblocks.length, name: name, shaderblock: shaderblock };
	this.shadow_shaderblocks.push( info );
	this.shadow_shaderblocks_by_name[ name ] = info;
}

LS.registerComponent( Light );
LS.Light = Light;

// LIGHT GLSL STRUCTS AND FUNCTIONS *****************************************

LS.ShadersManager.registerSnippet("light_structs","\n\
	#ifndef SB_LIGHT_STRUCTS\n\
	#define SB_LIGHT_STRUCTS\n\
	uniform lowp vec4 u_light_info;\n\
	uniform vec3 u_light_position;\n\
	uniform vec3 u_light_front;\n\
	uniform vec3 u_light_color;\n\
	uniform vec4 u_light_angle; //cone start,end,phi,theta \n\
	uniform vec4 u_light_att; //start,end \n\
	uniform float u_light_offset; //ndotl offset\n\
	uniform vec4 u_light_extra; //user data\n\
	uniform mat4 u_light_matrix; //to light space\n\
	uniform vec3 u_ambient_light;\n\
	struct Light {\n\
		lowp vec4 Info; //type of light (3: DIRECTIONAL), falloff type, pass index, num passes \n\
		vec3 Color;\n\
		vec3 Ambient;\n\
		vec3 Position;\n\
		vec3 Front;\n\
		vec4 ConeInfo; //for spotlights\n\
		vec4 Attenuation; //start,end,type,extra\n\
		float Offset; //phong_offset\n\
		vec4 Extra; //users can use this\n\
		mat4 Matrix; //converts to light space\n\
		float Distance;\n\
	};\n\
	//Returns the info about the light\n\
	Light getLight()\n\
	{\n\
		Light LIGHT;\n\
		LIGHT.Info = u_light_info;\n\
		LIGHT.Color = u_light_color;\n\
		if(u_light_info.z == 0.0)\n\
			LIGHT.Ambient = u_ambient_light;\n\
		else\n\
			LIGHT.Ambient = vec3(0.0);\n\
		LIGHT.Position = u_light_position;\n\
		LIGHT.Front = u_light_front;\n\
		LIGHT.ConeInfo = u_light_angle; //for spotlights\n\
		LIGHT.Attenuation = u_light_att; //start and end\n\
		LIGHT.Offset = u_light_offset;\n\
		LIGHT.Distance = length( u_light_position - v_pos );\n\
		LIGHT.Extra = u_light_extra;\n\
		LIGHT.Matrix = u_light_matrix; //converts to light space\n\
		return LIGHT;\n\
	}\n\
	//used to store light contribution\n\
	struct FinalLight {\n\
		vec3 Color;\n\
		vec3 Ambient;\n\
		float Diffuse; //NdotL\n\
		float Specular; //RdotL\n\
		vec3 Emission;\n\
		vec3 Reflection;\n\
		float Attenuation;\n\
		float Shadow; //1.0 means fully lit\n\
	};\n\
	#endif\n\
");


//Light ShaderBlocks
/*
	Light Modifiers (Cookies)
	Light Attenuation (Linear, Exponential)
	Light Shadowing (Hard, Soft)
*/

Light._vs_shaderblock_code = "\n\
	#pragma shaderblock \"testShadow\"\n\
";

Light._enabled_fs_shaderblock_code = "\n\
	#pragma snippet \"input\"\n\
	#pragma snippet \"surface\"\n\
	#pragma snippet \"light_structs\"\n\
	#pragma snippet \"spotFalloff\"\n\
	#pragma shaderblock \"attenuation\"\n\
	#pragma shaderblock SHADOWBLOCK \"testShadow\"\n\
	\n\
	//Light is separated in two functions, computeLight (how much light receives the object) and applyLight (compute resulting final color)\n\
	// FINAL LIGHT EQUATION, takes all the info from FinalLight and computes the final color \n\
	vec3 applyLight( in SurfaceOutput o, in FinalLight LIGHT )\n\
	{\n\
		vec3 total_light = LIGHT.Ambient * o.Ambient + LIGHT.Color * LIGHT.Diffuse * LIGHT.Attenuation * LIGHT.Shadow;\n\
		vec3 final_color = o.Albedo * total_light;\n\
		if(u_light_info.z == 0.0)\n\
			final_color += o.Emission;\n\
		final_color	+= o.Albedo * (LIGHT.Color * LIGHT.Specular * LIGHT.Attenuation * LIGHT.Shadow);\n\
		return max( final_color, vec3(0.0) );\n\
	}\n\
	\n\
	// HERE we fill FinalLight structure with all the info (colors,NdotL,diffuse,specular,etc) \n\
	vec3 computeLight(in SurfaceOutput o, in Input IN, in Light LIGHT, out FinalLight FINALLIGHT)\n\
	{\n\
		// INIT\n\
		FINALLIGHT.Color = LIGHT.Color;\n\
		FINALLIGHT.Ambient = LIGHT.Ambient;\n\
		\n\
		// COMPUTE VECTORS\n\
		vec3 N = o.Normal; //use the final normal (should be the same as IN.worldNormal)\n\
		vec3 E = (u_camera_eye - v_pos);\n\
		float cam_dist = length(E);\n\
		E /= cam_dist;\n\
		\n\
		vec3 L = (LIGHT.Position - v_pos) / LIGHT.Distance;\n\
		\n\
		if( LIGHT.Info.x == 3.0 )\n\
			L = -LIGHT.Front;\n\
		\n\
		vec3 R = reflect(E,N);\n\
		\n\
		// PHONG FORMULA\n\
		float NdotL = 1.0;\n\
		NdotL = dot(N,L);\n\
		float EdotN = dot(E,N); //clamp(dot(E,N),0.0,1.0);\n\
		NdotL = max( 0.0, NdotL + LIGHT.Offset );\n\
		FINALLIGHT.Diffuse = abs(NdotL);\n\
		FINALLIGHT.Specular = o.Specular * pow( clamp(dot(R,-L),0.001,1.0), o.Gloss );\n\
		\n\
		// ATTENUATION\n\
		FINALLIGHT.Attenuation = 1.0;\n\
		\n\
		#ifdef BLOCK_ATTENUATION\n\
			FINALLIGHT.Attenuation = computeAttenuation( LIGHT );\n\
		#endif\n\
		if( LIGHT.Info.x == 2.0 && LIGHT.Info.y == 1.0 )\n\
			FINALLIGHT.Attenuation *= spotFalloff( LIGHT.Front, normalize( LIGHT.Position - v_pos ), LIGHT.ConeInfo.z, LIGHT.ConeInfo.w );\n\
		\n\
		// SHADOWS\n\
		FINALLIGHT.Shadow = 1.0;\n\
		#ifdef BLOCK_TESTSHADOW\n\
			FINALLIGHT.Shadow = testShadow( LIGHT );\n\
		#endif\n\
		\n\
		// LIGHT MODIFIERS\n\
		#ifdef LIGHT_MODIFIER\n\
		#endif\n\
		// FINAL LIGHT FORMULA ************************* \n\
		return applyLight(o,FINALLIGHT);\n\
	}\n\
	\n\
	vec3 computeLight(in SurfaceOutput o, in Input IN, in Light LIGHT)\n\
	{\n\
		FinalLight FINALLIGHT;\n\
		return computeLight(o,IN,LIGHT,FINALLIGHT);\n\
	}\n\
	\n\
";

Light._disabled_shaderblock_code = "\n\
	#pragma snippet \"input\"\n\
	#pragma snippet \"surface\"\n\
	#pragma snippet \"light_structs\"\n\
	vec3 computeLight(in SurfaceOutput o, in Input IN, in Light LIGHT, inout FinalLight FINALLIGHT)\n\
	{\n\
		FINALLIGHT.Diffuse = 0.0;\n\
		FINALLIGHT.Specular = 0.0;\n\
		FINALLIGHT.Attenuation = 0.0;\n\
		FINALLIGHT.Shadow = 0.0;\n\
		vec3 final_color = o.Albedo * LIGHT.Ambient;\n\
		if(u_light_info.z == 0.0)\n\
			final_color += o.Emission;\n\
		return final_color;\n\
	}\n\
	vec3 computeLight(in SurfaceOutput o, in Input IN, in Light LIGHT)\n\
	{\n\
		FinalLight FINALLIGHT;\n\
		return computeLight(o,IN,LIGHT,FINALLIGHT);\n\
	}\n\
";

var light_block = new LS.ShaderBlock("light");
light_block.addCode( GL.VERTEX_SHADER, Light._vs_shaderblock_code, Light._vs_shaderblock_code );
light_block.addCode( GL.FRAGMENT_SHADER, Light._enabled_fs_shaderblock_code, Light._disabled_shaderblock_code );
light_block.register();
Light.shader_block = light_block;

// ATTENUATION
Light._attenuation_enabled_fragment_code = "\n\
	const float LINEAR_ATTENUATION = 1.0;\n\
	const float RANGE_ATTENUATION = 2.0;\n\
	float computeAttenuation( in Light LIGHT )\n\
	{\n\
		//no attenuation\n\
		if(LIGHT.Attenuation.z == 0.0)\n\
			return 1.0;\n\
		//directional light\n\
		if( LIGHT.Info.x == 3.0 )\n\
			return 1.0;\n\
		if( LIGHT.Attenuation.z == LINEAR_ATTENUATION )\n\
			return 10.0 / LIGHT.Distance;\n\
		if( LIGHT.Attenuation.z == RANGE_ATTENUATION )\n\
		{\n\
			if(LIGHT.Distance >= LIGHT.Attenuation.y)\n\
				return 0.0;\n\
			if(LIGHT.Distance >= LIGHT.Attenuation.x)\n\
				return 1.0 - (LIGHT.Distance - LIGHT.Attenuation.x) / (LIGHT.Attenuation.y - LIGHT.Attenuation.x);\n\
		}\n\
		return 1.0;\n\
	}\n\
";
Light._attenuation_disabled_fragment_code = "";

var attenuation_block = Light.attenuation_block = new LS.ShaderBlock("attenuation");
attenuation_block.addCode( GL.FRAGMENT_SHADER, Light._attenuation_enabled_fragment_code, Light._attenuation_disabled_fragment_code  );
attenuation_block.register();

//OMNI LIGHT SHADOWMAP *****************************************
Light._shadowmap_cubemap_code = "\n\
	#define SHADOWMAP_ACTIVE\n\
	uniform samplerCube shadowmap;\n\
	uniform vec4 u_shadow_params; // (1.0/(texture_size), bias, near, far)\n\
	\n\
	float VectorToDepthValue(vec3 Vec)\n\
	{\n\
		vec3 AbsVec = abs(Vec);\n\
		float LocalZcomp = max(AbsVec.x, max(AbsVec.y, AbsVec.z));\n\
		float n = u_shadow_params.z;\n\
		float f = u_shadow_params.w;\n\
		float NormZComp = (f+n) / (f-n) - (2.0*f*n)/(f-n)/LocalZcomp;\n\
		return (NormZComp + 1.0) * 0.5;\n\
	}\n\
	\n\
	float UnpackDepth32(vec4 depth)\n\
	{\n\
		const vec4 bitShifts = vec4( 1.0/(256.0*256.0*256.0), 1.0/(256.0*256.0), 1.0/256.0, 1);\n\
		return dot(depth.xyzw , bitShifts);\n\
	}\n\
	\n\
	float testShadow( Light LIGHT, vec3 offset )\n\
	{\n\
		float shadow = 0.0;\n\
		float depth = 0.0;\n\
		float bias = u_shadow_params.y;\n\
		\n\
		vec3 l_vector = (v_pos - u_light_position);\n\
		float dist = length(l_vector);\n\
		float pixel_z = VectorToDepthValue( l_vector );\n\
		if(pixel_z >= 0.998)\n\
			return 0.0; //fixes a little bit the far edge bug\n\
		vec4 depth_color = textureCube( shadowmap, l_vector + offset * dist );\n\
		float ShadowVec = UnpackDepth32( depth_color );\n\
		if ( ShadowVec > pixel_z - bias )\n\
			return 0.0; //no shadow\n\
		return 1.0; //full shadow\n\
	}\n\
";

Light._shadowmap_vertex_enabled_code ="\n\
	#pragma snippet \"light_structs\"\n\
	varying vec4 v_light_coord;\n\
	void applyLight( vec3 pos ) { v_light_coord = u_light_matrix * vec4(pos,1.0); }\n\
";

Light._shadowmap_vertex_disabled_code ="\n\
	void applyLight(vec3 pos) {}\n\
";

// DIRECTIONAL AND SPOTLIGHT SHADOWMAP *****************************************
Light._shadowmap_2d_enabled_fragment_code = "\n\
	#ifndef TESTSHADOW\n\
		#define TESTSHADOW\n\
	#endif\n\
	uniform sampler2D shadowmap;\n\
	varying vec4 v_light_coord;\n\
	uniform vec4 u_shadow_params; // (1.0/(texture_size), bias, near, far)\n\
	\n\
	float UnpackDepth(vec4 depth)\n\
	{\n\
		#ifdef BLOCK_DEPTH_IN_COLOR\n\
			const vec4 bitShifts = vec4( 1.0/(256.0*256.0*256.0), 1.0/(256.0*256.0), 1.0/256.0, 1);\n\
			return dot(depth.xyzw , bitShifts);\n\
		#else\n\
			return depth.x;\n\
		#endif\n\
	}\n\
	\n\
	float testShadow( Light LIGHT )\n\
	{\n\
		vec3 offset = vec3(0.0);\n\
		float shadow = 0.0;\n\
		float depth = 0.0;\n\
		float bias = u_shadow_params.y;\n\
		\n\
		vec2 sample = (v_light_coord.xy / v_light_coord.w) * vec2(0.5) + vec2(0.5) + offset.xy;\n\
		//is inside light frustum\n\
		if (clamp(sample, 0.0, 1.0) != sample) \n\
			return LIGHT.Info.x == 3.0 ? 1.0 : 0.0; //outside of shadowmap, no shadow\n\
		float sampleDepth = UnpackDepth( texture2D(shadowmap, sample) );\n\
		depth = (sampleDepth == 1.0) ? 1.0e9 : sampleDepth; //on empty data send it to far away\n\
		if (depth > 0.0) \n\
			shadow = ((v_light_coord.z - bias) / v_light_coord.w * 0.5 + 0.5) > depth ? 0.0 : 1.0;\n\
		return shadow;\n\
	}\n\
";

Light._shadowmap_2d_disabled_code = "\nfloat testShadow( Light LIGHT ) { return 1.0; }\n";

var shadowmapping_depth_in_color_block = new LS.ShaderBlock("depth_in_color");
shadowmapping_depth_in_color_block.register();
Light.shadowmapping_depth_in_color_block = shadowmapping_depth_in_color_block;

var shadowmapping_block = new LS.ShaderBlock("testShadow");
shadowmapping_block.addCode( GL.VERTEX_SHADER, Light._shadowmap_vertex_enabled_code, Light._shadowmap_vertex_disabled_code);
shadowmapping_block.addCode( GL.FRAGMENT_SHADER, Light._shadowmap_2d_enabled_fragment_code, Light._shadowmap_2d_disabled_code );
//shadowmapping_block.defineContextMacros({"SHADOWBLOCK":"testShadow"});
shadowmapping_block.register();
Light.shadowmapping_2d_shader_block = shadowmapping_block;
Light.registerShadowType( "hard", shadowmapping_block );

var shadowmapping_2D_hard_shader_block = new LS.ShaderBlock("testShadow2D_hard");
shadowmapping_2D_hard_shader_block.addCode( GL.VERTEX_SHADER, Light._shadowmap_vertex_enabled_code, Light._shadowmap_vertex_disabled_code );
shadowmapping_2D_hard_shader_block.addCode( GL.FRAGMENT_SHADER, Light._shadowmap_2d_enabled_code, "" );
shadowmapping_2D_hard_shader_block.register();
Light.shadowmapping_2D_hard_shader_block = shadowmapping_2D_hard_shader_block;
//Light.registerShadowType( "hard", shadowmapping_hard_2d_shader_block );

var shadowmapping_2D_soft_block = new LS.ShaderBlock("testShadow2D_soft");
shadowmapping_2D_soft_block.addCode( GL.VERTEX_SHADER, Light._shadowmap_vertex_enabled_code, Light._shadowmap_vertex_disabled_code );
shadowmapping_2D_soft_block.addCode( GL.FRAGMENT_SHADER, Light._shadowmap_2d_enabled_code, "" );
shadowmapping_2D_soft_block.register();
Light.shadowmapping_2D_soft_block = shadowmapping_2D_soft_block;
//Light.registerShadowType( "soft", shadowmappingsoft_block );

