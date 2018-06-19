/**
 *
 * 
 * # Description
 * - Model = setKnownPose Object is the object controlled by ArMarkerControls,  markerDetected
 * - markerRoot is controlled by THREEx.DeadReckoningControls
 * - motionPredictionControls = new THREEx.DeadReckoningControls(markerRoot)
 * - markerDetected is controlled by THREEx.ArMarkerControls
 * - var hasBeenUpdated = arToolkitContext.update() - modification to do
 * - if( hasBeenUpdated ) motionPredictionControls.setKnownPose(markerDetected)
 */


var THREEx = THREEx || {}

THREEx.DeadReckoningControls = function(object){
	this.object = object
	this.enabled = true

	this._lastPose = {
		createdAt : null,
		deltaTime: 0,
		
		// store the pose itself
		position: new THREE.Vector3,
		quaternion: new THREE.Quaternion,
		scale: new THREE.Vector3,
		
		// all the velocities
		positionVelocity: new THREE.Vector3,
		quaternionDelta: new THREE.Quaternion,
		scaleVelocity: new THREE.Vector3
	}
}

THREEx.DeadReckoningControls.prototype.update = function(){
	var lastPose = this._lastPose
	
	// honor this.enabled
	if( this.enabled === false ){
		this.object.position.copy(lastPose.position)
		this.object.quaternion.copy(lastPose.quaternion)
		this.object.scale.copy(lastPose.scale)
		return
	}

	// if we never had any pose, return now
	if( lastPose.createdAt === null )	return
	// compute time
	var present = performance.now()
	var deltaTime = present - lastPose.createdAt

	// update position from lastPose.position and _positionVelocity
	this.object.position.copy(lastPose.position)
	this.object.position.add(lastPose.positionVelocity.clone().multiplyScalar(deltaTime))

	// update scale from lastPose.scale and lastPose.scaleVelocity
	this.object.scale.copy(lastPose.scale)
	this.object.scale.add(lastPose.scaleVelocity.clone().multiplyScalar(deltaTime))

	// update quaternion from lastPose.quaternion, lastPose.quaternionDelta and lastPose.deltaTime
	var deltaQuaternion = new THREE.Quaternion()
		.slerp(lastPose.quaternionDelta, deltaTime/lastPose.deltaTime).normalize()
	this.object.quaternion.copy(lastPose.quaternion)
		.multiply(deltaQuaternion.normalize())
}

THREEx.DeadReckoningControls.prototype.setKnownPose = function (newPosition, newQuaternion, newScale) {
	var lastPose = this._lastPose
	var present = performance.now()
	var deltaTime = present - lastPose.createdAt
	
	// if there is a _lastPose.createdAt, compute the velocity in position/quaternion/scale
	if( lastPose.createdAt !== null ){
		// Compute linear speed
		lastPose.positionVelocity.copy(newPosition)
			.sub(lastPose.position)
			.divideScalar(deltaTime)

		// NOTE: store the angular difference and the deltaTime
		// - i can not compute the actual angular velocity, so i store the quaternion
		//   difference between the 2 known poses, and the deltaTime
		// http://math.stackexchange.com/questions/160908/how-to-get-angular-velocity-from-difference-orientation-quaternion-and-time
		// http://www.euclideanspace.com/physics/kinematics/angularvelocity/quatDiff1stAttempt.htm		
		lastPose.quaternionDelta = newQuaternion.clone()
			.multiply(lastPose.quaternion.clone().inverse().normalize())
			.normalize()

		// Compute scale velocity
		lastPose.scaleVelocity.copy(newScale)
			.sub(lastPose.scale)
			.divideScalar(deltaTime)
	}

	// update lastPose values
	lastPose.createdAt = present
	lastPose.deltaTime = deltaTime
	lastPose.position.copy(newPosition)
	lastPose.quaternion.copy(newQuaternion)
	lastPose.scale.copy(newScale)
};
