# How to handle angular velocity with quaternion
- in setKnownPose()
  - store lastKnownTimeDelta = present - this.lastKnownPoseAt
  - store lastKnownQuaternionDifference = newQuaternion - lastKnownQuaternion
- in .update()
  - quaternionTarget = lastKnownQuaternion + lastKnownQuaternionDifference
  - ratio = lastKnownPoseAge / lastKnownTimeDelta
  - object.quaternion.copy(lastKnownQuaternion).slerp(quaternionTarget, ratio)

# How to do motion prediction

- http://math.stackexchange.com/questions/160908/how-to-get-angular-velocity-from-difference-orientation-quaternion-and-time
- http://www.euclideanspace.com/physics/kinematics/angularvelocity/quatDiff1stAttempt.htm

- when no new image to detect new pose, do a motion prediction
- do a threex.motionpredictioncontrols
  - do that in /threex.motionpredictioncontrols.js
  - /examples/motionpredictioncontrols.html
  - move targetObject to the left 10 per seconds
  - display the controls.object which should move smoothly at 60fps
- this is a controls with 2 objects, both have the same parent
- controls.update() periodically, move the object toward the target
  - console.assert(this.object.parent === this.targetObject.parent)
  - at the begining do simply a copy of this.object/.targetObject
- .setPosition

