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
	
	THREEx.ArBaseControls.call(this, object3d)
	
	// copy parameters
	this.object3d.visible = false
	
	this._lastLerpStepAt = null
	this._visibleStartedAt = null
	this._unvisibleStartedAt = null

	// handle default parameters
	parameters = parameters || {}
	this.parameters = {
		// lerp coeficient for the position - between [0,1] - default to 1
		lerpPosition: 0.8,
		// lerp coeficient for the quaternion - between [0,1] - default to 1
		lerpQuaternion: 0.2,
		// lerp coeficient for the scale - between [0,1] - default to 1
		lerpScale: 0.7,
		// delay for lerp fixed steps - in seconds - default to 1/120
		lerpStepDelay: 1/60,
		// minimum delay the sub-control must be visible before this controls become visible - default to 0 seconds
		minVisibleDelay: 0.0,
		// minimum delay the sub-control must be unvisible before this controls become unvisible - default to 0 seconds
		minUnvisibleDelay: 0.2,
	}
	
	//////////////////////////////////////////////////////////////////////////////
	//		setParameters
	//////////////////////////////////////////////////////////////////////////////
	setParameters(parameters)
	function setParameters(parameters){
		if( parameters === undefined )	return
		for( var key in parameters ){
			var newValue = parameters[ key ]

			if( newValue === undefined ){
				console.warn( "THREEx.ArSmoothedControls: '" + key + "' parameter is undefined." )
				continue
			}

			var currentValue = _this.parameters[ key ]

			if( currentValue === undefined ){
				console.warn( "THREEx.ArSmoothedControls: '" + key + "' is not a property of this material." )
				continue
			}

			_this.parameters[ key ] = newValue
		}
	}
}
	
THREEx.ArSmoothedControls.prototype = Object.create( THREEx.ArBaseControls.prototype );
THREEx.ArSmoothedControls.prototype.constructor = THREEx.ArSmoothedControls;

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

	if( targetObject3d.visible === true && this._visibleStartedAt === null )	this._visibleStartedAt = present
	if( targetObject3d.visible === false && this._unvisibleStartedAt === null )	this._unvisibleStartedAt = present

	if( wasVisible === false && targetObject3d.visible === true ){
		var visibleFor = present - this._visibleStartedAt
		if( visibleFor >= this.parameters.minVisibleDelay ){
			object3d.visible = true
			snapDirectlyToTarget()
		}
		// console.log('visibleFor', visibleFor)
	}

	if( wasVisible === true && targetObject3d.visible === false ){
		var unvisibleFor = present - this._unvisibleStartedAt
		if( unvisibleFor >= this.parameters.minUnvisibleDelay ){
			object3d.visible = false			
		}
	}
	
	//////////////////////////////////////////////////////////////////////////////
	//		apply lerp on positon/quaternion/scale
	//////////////////////////////////////////////////////////////////////////////

	// apply lerp steps - require fix time steps to behave the same no matter the fps
	if( this._lastLerpStepAt === null ){
		applyOneSlerpStep()
		this._lastLerpStepAt = present
	}else{
		var nStepsToDo = Math.floor( (present - this._lastLerpStepAt)/this.parameters.lerpStepDelay )
		for(var i = 0; i < nStepsToDo; i++){
			applyOneSlerpStep()
			this._lastLerpStepAt += this.parameters.lerpStepDelay
		}
	}

	// disable the lerp by directly copying targetObject3d position/quaternion/scale
	if( false ){		
		snapDirectlyToTarget()
	}

	// update the matrix
	this.object3d.updateMatrix()

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
	return

	function snapDirectlyToTarget(){
		object3d.position.copy( targetObject3d.position )
		object3d.quaternion.copy( targetObject3d.quaternion )
		object3d.scale.copy( targetObject3d.scale )
	}	
	
	function applyOneSlerpStep(){
		object3d.position.lerp(targetObject3d.position, parameters.lerpPosition)
		object3d.quaternion.slerp(targetObject3d.quaternion, parameters.lerpQuaternion)
		object3d.scale.lerp(targetObject3d.scale, parameters.lerpScale)
	}
}
