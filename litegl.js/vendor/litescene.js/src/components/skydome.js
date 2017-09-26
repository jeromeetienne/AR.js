
function Skydome(o)
{
	this.sun_altitude = 0.5;
	this.sun_azimuth = 0.5;

	if(o)
		this.configure(o);
}

Skydome.icon = "mini-icon-dome.png";

//vars
Skydome["@texture"] = { widget: "texture" };

Skydome.prototype.onAddedToNode = function(node)
{
	LEvent.bind(node, "collectRenderInstances", this.onCollectInstances, this);
}

Skydome.prototype.onRemovedFromNode = function(node)
{
	LEvent.unbind(node, "collectRenderInstances", this.onCollectInstances, this);
}

Skydome.prototype.getResources = function(res)
{
	if(typeof(this.texture) == "string")
		res[this.texture] = Texture;
	return res;
}

Skydome.prototype.onResourceRenamed = function (old_name, new_name, resource)
{
	if(this.texture == old_name)
		this.texture = new_name;
}

Skydome.prototype.onCollectInstances = function(e, instances)
{
	if(!this._root) return;

	var texture = null;
	if (this.use_environment)
		texture = Renderer._current_scene.textures["environment"];
	else
		texture = this.texture;

	if(!texture) return;

	if(texture.constructor === String)
		texture = LS.ResourcesManager.textures[texture];

	if(!texture) return;

	var mesh = this._mesh;
	if(!mesh)
		mesh = this._mesh = GL.Mesh.cube({size: 10});

	var node = this._root;

	var RI = this._render_instance;
	if(!RI)
	{
		this._render_instance = RI = new RenderInstance(this._root, this);
		RI.priority = 100;

		RI.onPreRender = function(render_settings) { 
			var cam_pos = LS.Renderer._current_camera.getEye();
			mat4.identity(this.matrix);
			mat4.setTranslation( this.matrix, cam_pos );
			if(this.node.transform)
			{
				var R = this.node.transform.getGlobalRotationMatrix();
				mat4.multiply( this.matrix, this.matrix, R );
			}

			//this.updateAABB(); this node doesnt have AABB (its always visible)
			vec3.copy( this.center, cam_pos );
		};
	}

	var mat = this._material;
	if(!mat)
		mat = this._material = new LS.Material({use_scene_ambient:false});

	vec3.copy( mat.color, [ this.intensity, this.intensity, this.intensity ] );
	var sampler = mat.setTexture( Material.COLOR, texture);

	if(texture && texture.texture_type == gl.TEXTURE_2D)
	{
		sampler.uvs = "polar_vertex";
		texture.bind(0);
		texture.setParameter( gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE ); //to avoid going up
		texture.setParameter( gl.TEXTURE_MIN_FILTER, gl.LINEAR ); //avoid ugly error in atan2 edges
	}
	else
		sampler.uvs = "0";

	RI.setMesh(mesh);

	RI.flags = RI_DEFAULT_FLAGS;
	RI.applyNodeFlags();
	RI.enableFlag( RI_CW | RI_IGNORE_LIGHTS | RI_IGNORE_FRUSTUM | RI_IGNORE_CLIPPING_PLANE); 
	RI.disableFlag( RI_CAST_SHADOWS | RI_DEPTH_WRITE | RI_DEPTH_TEST ); 

	RI.setMaterial(mat);

	instances.push(RI);
}

//LS.registerComponent(Skydome);
//LS.Skydome = Skydome;