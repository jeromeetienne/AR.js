
function Cloner(o)
{
	this.enabled = true;

	this.mode = Cloner.GRID_MODE;

	this.createProperty( "count", vec3.fromValues(10,1,1) );
	this.createProperty( "size", vec3.fromValues(100,100,100) );

	this.mesh = null;
	this.lod_mesh = null;
	this.material = null;

	if(o)
		this.configure(o);

	if(!Cloner._identity) //used to avoir garbage
		Cloner._identity = mat4.create();
}

Cloner.GRID_MODE = 1;
Cloner.RADIAL_MODE = 2;
Cloner.MESH_MODE = 3;
Cloner.CHILDREN_MODE = 4;

Cloner.icon = "mini-icon-cloner.png";

//vars
Cloner["@mesh"] = { type: "mesh" };
Cloner["@lod_mesh"] = { type: "mesh" };
Cloner["@mode"] = { type:"enum", values: { "Grid": Cloner.GRID_MODE, "Radial": Cloner.RADIAL_MODE, /* "Mesh": Cloner.MESH_MODE ,*/ "Children": Cloner.CHILDREN_MODE } };
Cloner["@count"] = { type:"vec3", min:1, step:1, precision: 0 };

Cloner.prototype.onAddedToScene = function(scene)
{
	LEvent.bind(scene, "collectRenderInstances", this.onCollectInstances, this);
	LEvent.bind(scene, "afterCollectData", this.onUpdateInstances, this);
}


Cloner.prototype.onRemovedFromScene = function(scene)
{
	LEvent.unbind(scene, "collectRenderInstances", this.onCollectInstances, this);
	LEvent.unbind(scene, "afterCollectData", this.onUpdateInstances, this);
}

Cloner.prototype.getMesh = function() {
	if( this.mesh && this.mesh.constructor === String )
		return ResourcesManager.meshes[ this.mesh ];
	return this.mesh;
}

Cloner.prototype.getLODMesh = function() {
	if( this.lod_mesh && this.lod_mesh.constructor === String )
		return ResourcesManager.meshes[this.lod_mesh];
	return this.lod_mesh;
}

Cloner.prototype.getResources = function(res)
{
	if( this.mesh && this.mesh.constructor === String )
		res[this.mesh] = Mesh;
	if( this.lod_mesh && this.lod_mesh.constructor === String )
		res[this.lod_mesh] = Mesh;
	return res;
}

Cloner.prototype.onResourceRenamed = function( old_name, new_name, resource )
{
	if( this.mesh == old_name )
		this.mesh = new_name;

	if( this.lod_mesh == old_name )
		this.lod_mesh = new_name;
}

Cloner.generateTransformKey = function(count, hsize, offset)
{
	var key = new Float32Array(9);
	key.set(count);
	key.set(hsize,3);
	key.set(offset,6);
	return key;
}

Cloner.compareKeys = function(a,b)
{
	for(var i = 0; i < a.length; ++i)
		if(a[i] != b[i])
			return false;
	return true;
}


Cloner.prototype.onCollectInstances = function(e, instances)
{
	if(!this.enabled)
		return;

	var mesh = this.getMesh();
	if(!mesh) 
		return null;

	var node = this._root;
	if(!this._root)
		return;

	this.updateRenderInstancesArray();

	var RIs = this._RIs;
	var material = this.material || this._root.getMaterial();
	var flags = 0;

	if(!RIs)
		return;

	//resize the instances array to fit the new RIs (avoids using push)
	var start_array_pos = instances.length;
	instances.length = start_array_pos + RIs.length;

	//update parameters
	for(var i = 0, l = RIs.length; i < l; ++i)
	{
		var RI = RIs[i];

		RI.setMesh(mesh);
		RI.layers = node.layers;
		RI.setMaterial( material );
		instances[ start_array_pos + i ] = RI;
	}
}

Cloner.prototype.updateRenderInstancesArray = function()
{
	var total = 0;
	if(this.mode === Cloner.GRID_MODE)
		total = (this.count[0]|0) * (this.count[1]|0) * (this.count[2]|0);
	else if(this.mode === Cloner.RADIAL_MODE)
		total = this.count[0]|0;
	else if(this.mode === Cloner.MESH_MODE)
	{
		total = 0; //TODO
	}
	else if(this.mode === Cloner.CHILDREN_MODE)
	{
		if(this._root && this._root._children)
			total = this._root._children.length;
	}

	if(!total) 
	{
		if(this._RIs)
			this._RIs.length = 0;
		return;
	}

	if(!this._RIs || this._RIs.length != total)
	{
		//create RIs
		if(!this._RIs)
			this._RIs = new Array(total);
		else
			this._RIs.length = total;

		for(var i = 0; i < total; ++i)
			if(!this._RIs[i])
				this._RIs[i] = new LS.RenderInstance(this._root, this);
	}
}

Cloner.prototype.onUpdateInstances = function(e, dt)
{
	if(!this.enabled)
		return;

	var RIs = this._RIs;
	if(!RIs || !RIs.length)
		return;

	var global = this._root.transform.getGlobalMatrix(mat4.create());

	var countx = this._count[0]|0;
	var county = this._count[1]|0;
	var countz = this._count[2]|0;

	var node = this._root;

	//Set position according to the cloner mode
	if(this.mode == Cloner.GRID_MODE)
	{
		//compute offsets
		var hsize = vec3.scale( vec3.create(), this.size, 0.5 );
		var offset = vec3.create();
		if( countx > 1) offset[0] = this.size[0] / ( countx - 1);
		else hsize[0] = 0;
		if( county > 1) offset[1] = this.size[1] / ( county - 1);
		else hsize[1] = 0;
		if( countz > 1) offset[2] = this.size[2] / ( countz - 1);
		else hsize[2] = 0;

		var i = 0;
		var tmp = vec3.create(), zero = vec3.create();
		for(var x = 0; x < countx; ++x)
		for(var y = 0; y < county; ++y)
		for(var z = 0; z < countz; ++z)
		{
			var RI = RIs[i];
			if(!RI)
				return;
			tmp[0] = x * offset[0] - hsize[0];
			tmp[1] = y * offset[1] - hsize[1];
			tmp[2] = z * offset[2] - hsize[2];
			mat4.translate( RI.matrix, global, tmp );
			RI.setMatrix( RI.matrix ); //force normal matrix generation
			mat4.multiplyVec3( RI.center, RI.matrix, zero );
			++i;
			RI.picking_node = null;
		}
	}
	else if(this.mode == Cloner.RADIAL_MODE)
	{
		var offset = Math.PI * 2 / RIs.length;
		var tmp = vec3.create(), zero = vec3.create();
		for(var i = 0, l = RIs.length; i < l; ++i)
		{
			var RI = RIs[i];
			if(!RI)
				return;

			tmp[0] = Math.sin( offset * i ) * this.size[0];
			tmp[1] = 0;
			tmp[2] = Math.cos( offset * i ) * this.size[0];
			RI.matrix.set( global );
			mat4.translate( RI.matrix, RI.matrix, tmp );
			mat4.rotateY( RI.matrix,RI.matrix, offset * i );
			RI.setMatrix( RI.matrix ); //force normal matrix generation
			mat4.multiplyVec3( RI.center, RI.matrix, zero );
			RI.picking_node = null;
		}
	}
	else if(this.mode == Cloner.CHILDREN_MODE)
	{
		if(!this._root || !this._root._children)
			return;

		for(var i = 0, l = RIs.length; i < l; ++i)
		{
			var RI = RIs[i];
			if(!RI)
				return;
			var childnode = this._root._children[i];
			if(!childnode)
				continue;
			if( childnode.transform )
				childnode.transform.getGlobalMatrix( global );
			RI.setMatrix( global );
			RI.picking_node = childnode;
		}
	}
}



LS.registerComponent(Cloner);