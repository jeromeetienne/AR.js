# TODO
- the matrix position outputted by THREEx.ArMultiMakersLearning.prototype.toJSON 
  isnt the good one. the position is the negative it should be
- THREEx.ArMultiMakersLearning.prototype.toJSON should output result from statistic
- clean up THREEx.ArMultiMarkerControls.prototype.onSourceProcessed


- how to know if it works



---
# How to compute the result of the learning
- we got statistics on the position/orientation/scale between each marker seen simultaneously
- we want a transposition matrix relative to the origin markersControls

- step1 - build the transposition matrix relative the origin marker controls
  - store it in the userData
  - use similar format as local matrix
  step2 - generate the file


Questions to answer:
- how to get the transposition matrix if a marker has been seen with the origin markers
  - well we got the position/orientation/scale average from the statistic collection
  - we just need to build a transposition matrix from it
- what if it has not been seen with origin marker
- how to have a minimal working algo

- LATER: how to get more robust statistics?

---


- DONE merge the tweencontrols 

- do a accumulator API for vector3 and quaternion
  - use it in the learner and in the player
  - just copy the unity function from the link
  - accumulator function = keep maintaining the average as you update it
  - accVector3(averageVector3, newVector3, nValues)

# MVP
- we need a way to learn an area
- we need to be able to play content in this area
- display all submarkers controls to help tuning

## Files
- able to generate the file
- file format
    	{
		markerControls : [
			{
				parameters : Objects of MarkerControls parameters (only a partial copy)
				pose: THREE.Matrix4
			},
		]
	}
- threex.armultimarkercontrols.prototype.toJSON
- threex.armultimarkercontrols.fromJSON
- able to store/retrieve this file in local storage



----
- DONE store the learned area in localStorage
- NO. do i need 2 html ? it seems to make a lot of boilerplate to be repeated
  - so a 2 phase but single html
