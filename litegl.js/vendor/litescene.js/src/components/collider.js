
function Collider(o)
{
	this.enabled = true;
	this.shape = 1;
	this.mesh = null;
	this.size = vec3.fromValues(0.5,0.5,0.5); //in local space?
	this.center = vec3.create(); //in local space?
	this.use_mesh_bounding = false;
	if(o)
		this.configure(o);
}

Collider.icon = "mini-icon-collider.png";

Collider.BOX = LS.PhysicsInstance.BOX;
Collider.SPHERE = LS.PhysicsInstance.SPHERE;
Collider.MESH = LS.PhysicsInstance.MESH;

//vars
Collider["@size"] = { type: "vec3", step: 0.01 };
Collider["@center"] = { type: "vec3", step: 0.01 };
Collider["@mesh"] = { type: "mesh" };
Collider["@shape"] = { type:"enum", values: {"Box": Collider.BOX, "Sphere": Collider.SPHERE, "Mesh": Collider.MESH }};

//Collider["@adjustToNodeBounding"] = { type:"action" };

Collider.prototype.onAddedToScene = function(scene)
{
	LEvent.bind( scene, "collectPhysicInstances", this.onGetColliders, this);
}

Collider.prototype.onRemovedFromScene = function(scene)
{
	LEvent.unbind( scene, "collectPhysicInstances", this.onGetColliders, this);
}

Collider.prototype.getMesh = function() {
	if(typeof(this.mesh) === "string")
		return LS.ResourcesManager.meshes[this.mesh];
	return this.mesh;
}

Collider.prototype.getResources = function(res)
{
	if(!this.mesh) return;
	if(typeof(this.mesh) == "string")
		res[this.mesh] = Mesh;
	return res;
}

Collider.prototype.onResourceRenamed = function (old_name, new_name, resource)
{
	if(this.mesh == old_name)
		this.mesh = new_name;
}

/*
Collider.prototype.adjustToNodeBounding = function()
{
	var final_bounding = BBox.create();
	var components = this._root.getComponents();
	for(var i = 0: i < components.length; ++i)
	{
		var component = components[i];
		if(!component.getMesh)
			continue;
		var mesh = component.getMesh();
		if(!mesh)
			continue;
		var bounding = mesh.getBoundingBox();
		if(!bounding)
			return;
		//TODO: merge all the boundings
	}
}
*/

Collider.prototype.onGetColliders = function(e, colliders)
{
	if(!this.enabled)
		return;

	var PI = this._PI;
	if(!PI)
		this._PI = PI = new LS.PhysicsInstance(this._root, this);

	if(this._root.transform)
		PI.matrix.set( this._root.transform._global_matrix );

	PI.type = this.shape;
	PI.layers = this._root.layers;

	//get mesh
	var mesh = null;
	if(PI.type === LS.PhysicsInstance.MESH || this.use_mesh_bounding)
		mesh = this.getMesh();

	//spherical collider
	if(PI.type === LS.PhysicsInstance.SPHERE)
	{
		if(mesh)
			BBox.copy( PI.oobb, mesh.bounding );
		else
			BBox.setCenterHalfsize( PI.oobb, this.center, [this.size[0],this.size[0],this.size[0]]);
	}
	else if(PI.type === LS.PhysicsInstance.BOX)
	{
		if(mesh)
			BBox.copy( PI.oobb, mesh.bounding );
		else
			BBox.setCenterHalfsize( PI.oobb, this.center, this.size);
	}

	if(mesh)
		vec3.copy( PI.center, BBox.getCenter( mesh.bounding ) );
	else
		vec3.copy( PI.center, this.center );

	//convert center from local to world space
	vec3.transformMat4( PI.center, PI.center, PI.matrix );

	if(PI.type === LS.PhysicsInstance.MESH)
	{
		if(!mesh)
			return;
		PI.setMesh(mesh);
	}

	colliders.push(PI);
}


LS.registerComponent( Collider );