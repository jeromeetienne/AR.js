var THREEx = THREEx || {}

/**
 * - lerp position/quaternino/scale
 * - minDelayDetected
 * - minDelayUndetected
 * @param {[type]} object3d   [description]
 * @param {[type]} parameters [description]
 */
THREEx.ArSmoothedControls = function(object3d, parameters){
	var _this = this

	// copy parameters
	this.object3d = object3d
	this.object3d.visible = false
	
	this._lastLerpStepAt = null
	this._visibleStartedAt = null
	this._unvisibleStartedAt = null

	// handle default parameters
	parameters = parameters || {}
	this.parameters = {
		// lerp coeficient for the position - between [0,1] - default to 1
		lerpPosition: parameters.lerpPosition !== undefined ? parameters.lerpPosition : 0.3,
		// lerp coeficient for the quaternion - between [0,1] - default to 1
		lerpQuaternion: parameters.lerpQuaternion !== undefined ? parameters.lerpQuaternion : 0.6,
		// lerp coeficient for the scale - between [0,1] - default to 1
		lerpScale: parameters.lerpScale !== undefined ? parameters.lerpScale : 0.6,
		// delay for lerp fixed steps - in seconds - default to 1/120
		lerpStepDelay: parameters.fixStepDelay !== undefined ? parameters.fixStepDelay : 1/60,
		// minimum delay the sub-control must be visible before this controls become visible - default to 0 seconds
		minVisibleDelay: parameters.minVisibleDelay !== undefined ? parameters.minVisibleDelay : 0.0,
		// minimum delay the sub-control must be unvisible before this controls become unvisible - default to 0 seconds
		minUnvisibleDelay: parameters.minUnvisibleDelay !== undefined ? parameters.minUnvisibleDelay : 0.0,
	}
}

Object.assign( THREEx.ArSmoothedControls.prototype, THREE.EventDispatcher.prototype );

//////////////////////////////////////////////////////////////////////////////
//		update function
//////////////////////////////////////////////////////////////////////////////

THREEx.ArSmoothedControls.prototype.update = function(targetObject3d){
	var object3d = this.object3d
	var parameters = this.parameters
	var wasVisible = object3d.visible
	var present = performance.now()/1000


	//////////////////////////////////////////////////////////////////////////////
	//		handle object3d.visible with minVisibleDelay/minUnvisibleDelay
	//////////////////////////////////////////////////////////////////////////////
	if( targetObject3d.visible === false )	this._visibleStartedAt = null
	if( targetObject3d.visible === true )	this._unvisibleStartedAt = null

	if( wasVisible === false && targetObject3d.visible === true ){
		if( this._visibleStartedAt === null )		this._visibleStartedAt = present
		var visibleFor = present - this._visibleStartedAt
		if( visibleFor >= this.parameters.minVisibleDelay ){
			object3d.visible = true			
		}
		// console.log('visibleFor', visibleFor)
	}

	if( wasVisible === true && targetObject3d.visible === false ){
		if( this._unvisibleStartedAt === null )	this._unvisibleStartedAt = present
		var unvisibleFor = present - this._unvisibleStartedAt
		if( unvisibleFor >= this.parameters.minUnvisibleDelay ){
			object3d.visible = false			
		}
		// console.log('unvisibleFor', unvisibleFor)
	}
	
	// disabled minVisibleDelay+minUnvisibleDelay
	// if( true ){		
	// 	object3d.visible = targetObject3d.visible
	// }
	
	//////////////////////////////////////////////////////////////////////////////
	//		apply lerp on positon/quaternion/scale
	//////////////////////////////////////////////////////////////////////////////

	// apply lerp steps - require fix time steps to behave the same no matter the fps
	if( this._lastLerpStepAt === null ){
		applyOneSlepStep()
		this._lastLerpStepAt = present
	}else{
		var nStepsToDo = Math.floor( (present - this._lastLerpStepAt)/this.parameters.lerpStepDelay )
		for(var i = 0; i < nStepsToDo; i++){
			applyOneSlepStep()
			this._lastLerpStepAt += this.parameters.lerpStepDelay
		}
	}

	// update the matrix
	this.object3d.updateMatrix()

	function applyOneSlepStep(){
		object3d.position.lerp(targetObject3d.position, parameters.lerpPosition)
		object3d.quaternion.slerp(targetObject3d.quaternion, parameters.lerpQuaternion)
		object3d.scale.lerp(targetObject3d.scale, parameters.lerpScale)
	}

	// disable the lerp by directly copying targetObject3d position/quaternion/scale
	// if( false ){		
	// 	this.object3d.position.copy( targetObject3d.position )
	// 	this.object3d.quaternion.copy( targetObject3d.quaternion )
	// 	this.object3d.scale.copy( targetObject3d.scale )
	// 	this.object3d.updateMatrix()
	// }

	//////////////////////////////////////////////////////////////////////////////
	//		honor becameVisible/becameUnVisible event
	//////////////////////////////////////////////////////////////////////////////
	// honor becameVisible event
	if( wasVisible === false && object3d.visible === true ){
		this.dispatchEvent({ type: 'becameVisible' })
	}
	// honor becameUnVisible event
	if( wasVisible === true && object3d.visible === false ){
		this.dispatchEvent({ type: 'becameUnVisible' })
	}
}
