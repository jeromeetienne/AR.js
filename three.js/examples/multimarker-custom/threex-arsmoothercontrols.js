var THREEx = THREEx || {}

THREEx.ArSmootherControls = function(object3d, parameters){
	var _this = this

	// copy parameters
	this.object3d = object3d

	// handle default parameters
	parameters = parameters || {}
	this.parameters = {
		// lerp coeficient for the position - between [0,1] - default to 1
		lerpPosition: parameters.lerpPosition !== undefined ? parameters.lerpPosition : 0.3,
		// lerp coeficient for the quaternion - between [0,1] - default to 1
		lerpQuaternion: parameters.lerpQuaternion !== undefined ? parameters.lerpQuaternion : 0.6,
		// lerp coeficient for the scale - between [0,1] - default to 1
		lerpScale: parameters.lerpScale !== undefined ? parameters.lerpScale : 0.6,
	}
}

Object.assign( THREEx.ArSmootherControls.prototype, THREE.EventDispatcher.prototype );

//////////////////////////////////////////////////////////////////////////////
//		update function
//////////////////////////////////////////////////////////////////////////////

THREEx.ArSmootherControls.prototype.update = function(targetObject3d){
	var object3d = this.object3d
	var parameters = this.parameters

	// honor object3d.visible
	object3d.visible = targetObject3d.visible

	//////////////////////////////////////////////////////////////////////////////
	//		apply lerp on positon/quaternion/scale
	//////////////////////////////////////////////////////////////////////////////

	// FIXME this lerp assume it is updated at regular interval
	// if we update onAnimationFrame, the tweening will behave differently depending on the fps
	// - either you call it regularly
	// - or you emulate a fix step here at 60fps

	object3d.position.lerp(targetObject3d.position, parameters.lerpPosition)
	object3d.quaternion.slerp(targetObject3d.quaternion, parameters.lerpQuaternion)
	object3d.scale.lerp(targetObject3d.scale, parameters.lerpScale)

	this.object3d.updateMatrix()
	
	// disabled the tweening by directly copying targetObject3d position/quaternion/scale
	if( false ){		
		this.object3d.position.copy( targetObject3d.position )
		this.object3d.quaternion.copy( targetObject3d.quaternion )
		this.object3d.scale.copy( targetObject3d.scale )
		this.object3d.updateMatrix()
	}
}
