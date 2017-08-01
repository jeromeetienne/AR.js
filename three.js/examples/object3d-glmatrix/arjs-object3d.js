var ARjs = ARjs || {}


ARjs.Object3D = function(){
	this.position = vec3.create()
	this.quaternion = quat.create()
	this.scale = vec3.create()

	this.matrix = mat4.create()
	
	// compose transform matrix
	mat4.fromRotationTranslationScale(this.matrix, this.position, this.quaternion, this.scale)

	// decompose transform matrix
	mat4.getTranslation(this.position, this.matrix)
	mat4.getRotation(this.quaternion, this.matrix)
	mat4.getScaling(this.scale, this.matrix)
}
