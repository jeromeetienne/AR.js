
//WORK IN PROGRESS

//Is the class in charge of applying deformations to meshes (skinning and morph targets)
function Deformer()
{
	this.shader_block = null;
	this.macros = {}
	this.uniforms = {}
}

Deformer.prototype.applyByCPU = function( vertex_data, normals_data )
{
	//overwrite
}

LS.Deformer = Deformer;