
/**
* Renders one mesh, it allows to configure the rendering primitive, the submesh (range of mesh) and a level of detail mesh
* @class MeshRenderer
* @namespace LS.Components
* @constructor
* @param {String} object to configure from
*/
function MeshRenderer(o)
{
	this._enabled = true;

	/**
	* The name of the mesh to render
	* @property mesh {string}
	* @default null;
	*/
	this._mesh = null;
	/**
	* The name of the mesh to render in case the mesh is far away, this mesh is also used for collision testing if using raycast to RenderInstances
	* @property lod_mesh {string}
	* @default null;
	*/
	this._lod_mesh = null;
	/**
	* The id of the submesh group to render, if the id is -1 then all the mesh is rendered.
	* @property submesh_id {number}
	* @default -1;
	*/
	this._submesh_id = -1;

	this._material = null;
	/**
	* The GL primitive to use when rendering this mesh (gl.POINTS, gl.TRIANGLES, etc), -1 is default, it also supports the option 10 which means Wireframe
	* @property primitive {number}
	* @default -1;
	*/
	this._primitive = -1;

	this._must_update_static = true; //used in static meshes
	this._transform_version = -1;

	//used to render with several materials
	this.use_submaterials = false;
	this.submaterials = [];

	if(o)
		this.configure(o);

	this._RI = new LS.RenderInstance( null, this );
	//this._RIs = [];
	this._is_attached = false;
}

Object.defineProperty( MeshRenderer.prototype, 'enabled', {
	get: function() { return this._enabled; },
	set: function(v) { 
		v = !!v;
		this._enabled = v;
		this.checkRenderInstances();
	},
	enumerable: true
});

Object.defineProperty( MeshRenderer.prototype, 'primitive', {
	get: function() { return this._primitive; },
	set: function(v) { 
		v = (v === undefined || v === null ? -1 : v|0);
		if( v < -1 || v > 10 )
			return;
		this._primitive = v;
		this.updateRIs();
	},
	enumerable: true
});

Object.defineProperty( MeshRenderer.prototype, 'material', {
	get: function() { return this._material; },
	set: function(v) { 
		this._material = v;
		this.updateRIs();
	},
	enumerable: true
});

Object.defineProperty( MeshRenderer.prototype, 'mesh', {
	get: function() { return this._mesh; },
	set: function(v) { 
		this._mesh = v;
		this.updateRIs();
	},
	enumerable: true
});

Object.defineProperty( MeshRenderer.prototype, 'lod_mesh', {
	get: function() { return this._lod_mesh; },
	set: function(v) { 
		this._lod_mesh = v;
		this.updateRIs();
	},
	enumerable: true
});

Object.defineProperty( MeshRenderer.prototype, 'submesh_id', {
	get: function() { return this._submesh_id; },
	set: function(v) { this._submesh_id = v; },
	enumerable: true
});

Object.defineProperty( MeshRenderer.prototype, 'render_instance', {
	get: function() { return this._RI; },
	set: function(v) { throw("cannot set a render_instance, must use the collectRenderInstances process."); },
	enumerable: false
});

MeshRenderer.icon = "mini-icon-teapot.png";

//vars
MeshRenderer["@mesh"] = { type: "mesh" };
MeshRenderer["@lod_mesh"] = { type: "mesh" };
MeshRenderer["@material"] = { type: "material" };
MeshRenderer["@primitive"] = { type:"enum", values: {"Default":-1, "Points": 0, "Lines":1, "LineLoop":2, "LineStrip":3, "Triangles":4, "TriangleStrip":5, "TriangleFan":6, "Wireframe":10 }};
MeshRenderer["@submesh_id"] = { type:"enum", values: function() {
	var component = this.instance;
	var mesh = component.getMesh();
	if(!mesh) return null;
	if(!mesh || !mesh.info || !mesh.info.groups || mesh.info.groups.length < 2)
		return null;

	var t = {"all":null};
	for(var i = 0; i < mesh.info.groups.length; ++i)
		t[mesh.info.groups[i].name] = i;
	return t;
}};

MeshRenderer["@use_submaterials"] = { type: LS.TYPES.BOOLEAN, widget: null }; //avoid widget
MeshRenderer["@submaterials"] = { widget: null }; //avoid 

//we bind to onAddedToNode because the event is triggered per node so we know which RIs belong to which node
MeshRenderer.prototype.onAddedToScene = function( scene )
{
	this.checkRenderInstances();
}

MeshRenderer.prototype.onRemovedFromScene = function( scene )
{
	this.checkRenderInstances();
}

MeshRenderer.prototype.onAddedToNode = function( node )
{
	LEvent.bind( node, "materialChanged", this.updateRIs, this );
	LEvent.bind( node, "collectRenderInstances", this.onCollectInstances, this );
	this._RI.node = node;
}

MeshRenderer.prototype.onRemovedFromNode = function( node )
{
	LEvent.unbind( node, "materialChanged", this.updateRIs, this );
	LEvent.unbind( node, "collectRenderInstances", this.onCollectInstances, this );
}


/**
* Configure from a serialized object
* @method configure
* @param {Object} object with the serialized info
*/
MeshRenderer.prototype.configure = function(o)
{
	if(o.uid)
		this.uid = o.uid;
	if(o.enabled !== undefined)
		this.enabled = o.enabled;
	this.mesh = o.mesh;
	this.lod_mesh = o.lod_mesh;
	if(o.submesh_id !== undefined)
		this.submesh_id = o.submesh_id;
	this.primitive = o.primitive; //gl.TRIANGLES
	this.material = o.material;
	this.use_submaterials = !!o.use_submaterials;
	if(o.submaterials)
		this.submaterials = o.submaterials;
	if(o.material && o.material.constructor === String)
		this.material = o.material;
}

/**
* Serialize the object 
* @method serialize
* @return {Object} object with the serialized info
*/
MeshRenderer.prototype.serialize = function()
{
	var o = { 
		object_class: "MeshRenderer",
		enabled: this.enabled,
		uid: this.uid,
		mesh: this.mesh,
		lod_mesh: this.lod_mesh
	};

	if(this.material && this.material.constructor === String )
		o.material = this.material;

	if(this.primitive != -1)
		o.primitive = this.primitive;
	if(this.submesh_id != -1)
		o.submesh_id = this.submesh_id;
	o.material = this.material;

	if(this.use_submaterials)
		o.use_submaterials = this.use_submaterials;
	o.submaterials = this.submaterials;

	return o;
}

MeshRenderer.prototype.getMesh = function() {
	if(!this.mesh)
		return null;

	if( this.mesh.constructor === String )
		return LS.ResourcesManager.meshes[ this.mesh ];
	return this.mesh;
}

MeshRenderer.prototype.getLODMesh = function() {
	if(!this.lod_mesh)
		return null;

	if( this.lod_mesh.constructor === String )
		return LS.ResourcesManager.meshes[ this.lod_mesh ];

	return null;
}

MeshRenderer.prototype.getAnyMesh = function() {
	return (this.getMesh() || this.getLODMesh());
}

MeshRenderer.prototype.getResources = function(res)
{
	if( this.mesh && this.mesh.constructor === String )
		res[ this.mesh ] = GL.Mesh;
	if( this.lod_mesh && this.lod_mesh.constructor === String )
		res[this.lod_mesh] = GL.Mesh;
	if( this.material && this.material.constructor === String )
		res[this.material] = LS.Material;

	if(this.use_submaterials)
	{
		for(var i  = 0; i < this.submaterials.length; ++i)
			if(this.submaterials[i])
				res[this.submaterials[i]] = LS.Material;
	}
	return res;
}

MeshRenderer.prototype.onResourceRenamed = function (old_name, new_name, resource)
{
	if(this.mesh == old_name)
		this.mesh = new_name;
	if(this.lod_mesh == old_name)
		this.lod_mesh = new_name;
	if(this.morph_targets)
		for(var i in this.morph_targets)
			if( this.morph_targets[i].mesh == old_name )
				this.morph_targets[i].mesh = new_name;
}

MeshRenderer.prototype.checkRenderInstances = function()
{
	return;

	var should_be_attached = this._enabled && this._root.scene;

	if( should_be_attached && !this._is_attached )
	{
		this._root.scene.attachSceneElement( this._RI );
		this._is_attached = true;
	}
	else if( !should_be_attached && this._is_attached )
	{
		this._root.scene.detachSceneElement( this._RI );
		this._is_attached = false;
	}
}

//called everytime something affecting this RIs configuration changes
MeshRenderer.prototype.updateRIs = function()
{
	return;

	var node = this._root;
	if(!node)
		return;

	var RI = this._RI;
	var is_static = this._root.flags && this._root.flags.is_static;
	var transform = this._root.transform;

	//optimize: TODO
	//if( is_static && LS.allow_static && !this._must_update_static && (!transform || (transform && this._transform_version == transform._version)) )
	//	return instances.push( RI );

	//assigns matrix, layers
	RI.fromNode( this._root );

	//material (after flags because it modifies the flags)
	var material = null;
	if(this.material)
		material = LS.ResourcesManager.getResource( this.material );
	else
		material = this._root.getMaterial();
	RI.setMaterial( material );

	//buffers from mesh and bounding
	var mesh = LS.ResourcesManager.getMesh( this._mesh );
	if( mesh )
	{
		RI.setMesh( mesh, this.primitive );
		if(this._submesh_id != -1 && this._submesh_id != null && mesh.info && mesh.info.groups)
		{
			var group = mesh.info.groups[this._submesh_id];
			if(group)
				RI.setRange( group.start, group.length );
		}
		else
			RI.setRange(0,-1);
	}
	else
	{
		RI.setMesh( null );
		RI.setRange(0,-1);
		if(this._once_binding_index != null)
			this._once_binding_index = LS.ResourcesManager.onceLoaded( this._mesh, this.updateRIs.bind(this ) );
	}

	//used for raycasting
	/*
	if(this.lod_mesh)
	{
		if( this.lod_mesh.constructor === String )
			RI.collision_mesh = LS.ResourcesManager.resources[ this.lod_mesh ];
		else
			RI.collision_mesh = this.lod_mesh;
		//RI.setLODMesh( RI.collision_mesh );
	}
	else
	*/
		RI.collision_mesh = mesh;

	//mark it as ready once no more changes should be applied
	if( is_static && LS.allow_static && !this.isLoading() )
	{
		this._must_update_static = false;
		this._transform_version = transform ? transform._version : 0;
	}
}

//*
//MeshRenderer.prototype.getRenderInstance = function(options)
MeshRenderer.prototype.onCollectInstances = function(e, instances)
{
	if(!this._enabled)
		return;

	if(this.use_submaterials)
	{
		this.onCollectInstancesSubmaterials(instances);
		return;
	}

	var mesh = this.getAnyMesh();
	if(!mesh)
		return null;

	var node = this._root;
	if(!this._root)
		return;

	var RI = this._RI;
	var is_static = this._root.flags && this._root.flags.is_static;
	var transform = this._root.transform;
	RI.layers = this._root.layers;

	//optimize
	//if( is_static && LS.allow_static && !this._must_update_static && (!transform || (transform && this._transform_version == transform._version)) )
	//	return instances.push( RI );

	//assigns matrix, layers
	RI.fromNode( this._root );

	//material (after flags because it modifies the flags)
	var material = null;
	if(this.material)
		material = LS.ResourcesManager.getResource( this.material );
	else
		material = this._root.getMaterial();
	RI.setMaterial( material );

	//buffers from mesh and bounding
	RI.setMesh( mesh, this.primitive );

	if(this.submesh_id != -1 && this.submesh_id != null && mesh.info && mesh.info.groups)
	{
		var group = mesh.info.groups[this.submesh_id];
		if(group)
			RI.setRange( group.start, group.length );
	}
	else
		RI.setRange(0,-1);

	//used for raycasting
	/*
	if(this.lod_mesh)
	{
		if( this.lod_mesh.constructor === String )
			RI.collision_mesh = LS.ResourcesManager.resources[ this.lod_mesh ];
		else
			RI.collision_mesh = this.lod_mesh;
		//RI.setLODMesh( RI.collision_mesh );
	}
	else
	*/
		RI.collision_mesh = mesh;

	//mark it as ready once no more changes should be applied
	if( is_static && LS.allow_static && !this.isLoading() )
	{
		this._must_update_static = false;
		this._transform_version = transform ? transform._version : 0;
	}

	instances.push( RI );
}

MeshRenderer.prototype.onCollectInstancesSubmaterials = function(instances)
{
	if(!this._RIs)
		this._RIs = [];

	var mesh = this.getMesh();
	if(!mesh)
		return;

	var groups = mesh.info.groups;
	if(!groups)
		return;

	var global = this._root.transform._global_matrix;
	var center = vec3.create();
	mat4.multiplyVec3( center, global, LS.ZEROS );
	var first_RI = null;

	for(var i = 0; i < this.submaterials.length; ++i)
	{
		var submaterial_name = this.submaterials[i];
		if(!submaterial_name)
			continue;
		var group = groups[i];
		if(!group)
			continue;
		var material = LS.ResourcesManager.getResource( submaterial_name );
		if(!material)
			continue;

		var RI = this._RIs[i];
		if(!RI)
			RI = this._RIs[i] = new LS.RenderInstance(this._root,this);

		if(!first_RI)
			RI.setMatrix( this._root.transform._global_matrix );
		else
			RI.setMatrix( first_RI.matrix, first_RI.normal_matrix );
		RI.center.set(center);

		//flags
		RI.setMaterial( material );
		RI.setMesh( mesh, this.primitive );
		RI.setRange( group.start, group.length );
		instances.push(RI);

		if(!first_RI)
			first_RI = RI;
	}
}
//*/

//test if any of the assets is being loaded
MeshRenderer.prototype.isLoading = function()
{
	if( this.mesh && LS.ResourcesManager.isLoading( this.mesh ))
		return true;
	if( this.lod_mesh && LS.ResourcesManager.isLoading( this.lod_mesh ))
		return true;
	if( this.material && LS.ResourcesManager.isLoading( this.material ))
		return true;
	if(this._root && this._root.material && this._root.material.constructor === String && LS.ResourcesManager.isLoading( this._root.material ))
		return true;
	return false;
}


LS.registerComponent( MeshRenderer );
LS.MeshRenderer = MeshRenderer;