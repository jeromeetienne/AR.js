var ARjs = ARjs || {}

ARjs.Camera = function(){
	ARjs.Object3D.call(this)
	
	this.projectionMatrix = ARjs.Math.Matrix4.create()
}

ARjs.Camera.prototype = Object.create( ARjs.Object3D.prototype );
ARjs.Camera.prototype.constructor = ARjs.Camera;
