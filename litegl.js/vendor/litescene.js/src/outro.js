//here goes the ending of commonjs stuff

//create Global Scene
var Scene = LS.GlobalScene = new SceneTree();

LS.newMeshNode = function(id,mesh_name)
{
	var node = new LS.SceneNode(id);
	node.addComponent( new LS.Components.MeshRenderer() );
	node.setMesh(mesh_name);
	return node;
}

LS.newLightNode = function(id)
{
	var node = new LS.SceneNode(id);
	node.addComponent( new LS.Components.Light() );
	return node;
}

LS.newCameraNode = function(id)
{
	var node = new LS.SceneNode(id);
	node.addComponent( new LS.Components.Camera() );
	return node;
}

global.LS = LS;

//*******************************/
})( typeof(window) != "undefined" ? window : self ); //TODO: add support for commonjs