- TODO put a smoother on sub-marker while learning ? as a way to remove noise ?
- do an apps which does something with it
  - a minecraft going from markers to markers

- add a-frame support
- what to do with the official multimarker support
  - make an example for it, and keep supporting it



# How to compute the result of the learning
- we got statistics on the position/orientation/scale between each marker seen simultaneously
- we want a transposition matrix relative to the origin markersControls

- step1 - build the transposition matrix relative the origin marker controls
  - store it in the userData
  - use similar format as local matrix
- step2 - generate the file
 

# Questions to answer
- how to get the transposition matrix if a marker has been seen with the origin markers
  - well we got the position/orientation/scale average from the statistic collection
  - we just need to build a transposition matrix from it
- what if it has not been seen with origin marker

- how to have a minimal working algo

- LATER: how to get more robust statistics?

# Minimal Process - origin always visible
- Assume that the origin sub-marker is ALWAYS visible
- Look on all the seen-couple of the origin sub-marker
- for each sub-markers, you got the relative position with the origin sub-marker
- just generate the transformation matrix for it

# Minimal process - origin may sometime be invisible
- do first pass where you compute all couple which contain the origin submarkers
- so you computed the transformation matrix for each sub-marker which has been 
  visible with the origin marker
- you computed the level 1 of transformation matrices
- the level 0 would the transformation matrix of the origin sub-marker. But it is 
  always the identity matrix.
- you do an iterative process, where each iterations compute one more level.

Algo for one iteration
1. for each sub-markers, check all the seen couple it appears in
2. if at least one already has a transformation matrix, compute the transformation
3. Loop until all sub-markers got computed

  


---

# TODO
- the matrix position outputted by THREEx.ArMultiMakersLearning.prototype.toJSON 
  isnt the good one. the position is the negative it should be

- THREEx.ArMultiMakersLearning.prototype.toJSON should output result from statistic

- clean up THREEx.ArMultiMarkerControls.prototype.onSourceProcessed


- how to know if it works
