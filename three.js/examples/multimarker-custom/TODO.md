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
