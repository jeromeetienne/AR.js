var ARjs = ARjs || {}

// https://github.com/mrdoob/three.js/blob/master/src/core/Object3D.js

ARjs.Object3D = function(){
	this.position = vec3.create()
	this.quaternion = quat.create()
	this.scale = vec3.create()
	vec3.set(this.scale, 1, 1, 1)


	this.matrix = mat4.create()
	this.matrixAutoUpdate = true

	this.matrixWorld = mat4.create()
	this.matrixWorldNeedsUpdate = false
	
	// decompose transform matrix
	// mat4.getTranslation(this.position, this.matrix)
	// mat4.getRotation(this.quaternion, this.matrix)
	// mat4.getScaling(this.scale, this.matrix)

	this.updateMatrix()

	this.id = ARjs.Object3D.nextID++
	this.parent = null
	this.children = []

	this.visible = true
	this.userData = {}		
}

ARjs.Object3D.nextID = 0

ARjs.Object3D.prototype.updateMatrix = function () {
	// compose transform matrix
	mat4.fromRotationTranslationScale(this.matrix, this.quaternion, this.position, this.scale)

	this.matrixWorldNeedsUpdate = true
}

ARjs.Object3D.prototype.updateMatrixWorld = function (force) {
	// not yet implemented
}

ARjs.Object3D.prototype.add = function (child) {
	if( child.parent !== null )	child.parent.remove( child )

	child.parent = this

	this.children.push( child )
}

ARjs.Object3D.prototype.remove = function (child){
	var index = this.children.indexOf( child )

	if ( index === - 1 ) return

	child.parent = null;

	this.children.splice( index, 1 );
}
