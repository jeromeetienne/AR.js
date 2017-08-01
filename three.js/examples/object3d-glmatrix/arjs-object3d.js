var ARjs = ARjs || {}


/**
 * Heavily inspired from the great three.js THREE.Object3D
 */
ARjs.Object3D = function(){
	// unique ID for each ARjs.Object3D
	this.id = ARjs.Object3D.nextID++
	this.parent = null
	this.children = []

	this.visible = true
	this.userData = {}		

	// set position/quaternion/scale
	this.position = ARjs.Math.Vector3.create()
	this.quaternion = quat.create()
	this.scale = ARjs.Math.Vector3.create()
	ARjs.Math.Vector3.set(this.scale, 1, 1, 1)

	// define matrix and matrixWorld
	this.matrix = ARjs.Math.Matrix4.create()
	this.matrixAutoUpdate = true
	this.updateMatrix()

	this.matrixWorld = ARjs.Math.Matrix4.create()
	this.matrixWorldNeedsUpdate = false
	

}

ARjs.Object3D.nextID = 0

ARjs.Object3D.prototype.decomposeMatrix = function(){
	ARjs.Math.Matrix4.getTranslation(this.position, this.matrix)
	ARjs.Math.Matrix4.getRotation(this.quaternion, this.matrix)
	ARjs.Math.Matrix4.getScaling(this.scale, this.matrix)
	return this
}

ARjs.Object3D.prototype.localToWorldPosition = function(vector3){
	var out = ARjs.Math.Vector3.create()
	this.updateMatrixWorld()
	ARjs.Math.Matrix4.getTranslation(out, this.matrix)
	ARjs.Math.Vector3.add(out, vector3)
	return out
}

//////////////////////////////////////////////////////////////////////////////
//		.updateMatrix + .updateMatrixWorld
//////////////////////////////////////////////////////////////////////////////

ARjs.Object3D.prototype.updateMatrix = function(){
	// compose transform matrix
	ARjs.Math.Matrix4.fromRotationTranslationScale(this.matrix, this.quaternion, this.position, this.scale)

	this.matrixWorldNeedsUpdate = true
}

ARjs.Object3D.prototype.updateMatrixWorld = function(force){
	if( this.matrixAutoUpdate ) this.updateMatrix();

	if( this.matrixWorldNeedsUpdate || force ){

		if( this.parent === null ){
			ARjs.Math.Matrix4.copy(this.matrixWorld, this.matrix);
		}else{
			// this.matrixWorld.multiplyMatrices( this.parent.matrixWorld, this.matrix );
			ARjs.Math.Matrix4.multiply(this.matrixWorld, this.parent.matrixWorld, this.matrix);
		}

		this.matrixWorldNeedsUpdate = false;
		force = true;
	}

	// update children
	for( var i = 0; i < this.children.length; i ++ ){
		var child = this.children[i]
		child.updateMatrixWorld( force );
	}
}

//////////////////////////////////////////////////////////////////////////////
//		.add/.remove
//////////////////////////////////////////////////////////////////////////////

ARjs.Object3D.prototype.add = function(child){
	if( child.parent !== null )	child.parent.remove( child )

	child.parent = this

	this.children.push( child )
}

ARjs.Object3D.prototype.remove = function(child){
	var index = this.children.indexOf( child )

	if( index === - 1 ) return

	child.parent = null;

	this.children.splice( index, 1 );
}
