- NOGO in player, load the hardcoded from a file
  - clean up the code and demo the case
  - link the hardcoded one with the image of the multi marker

---
# Porting to a-frame
- port only multi markers controls
- start the port
- it will make it easier to do demo and accessible for aframe people
- preset='multimarker-localstorage'

- put the smoother on option for aframe
- use the profile by default
  - remove all the default from the aframe configuration
  - so first, init basic of profile, then push specific configuration from configuration
  - avoid to duplicate all the default


---

- posts "Area Learning with Marker-based Augmented Reality"
  - larger AR
  - more stable AR
  - describe workflow: dynamic learning + usage
  - screenshots of the experience
  
- describe the algorightm you used to learn and to use multi markers
- algo definition: ALGORITHM.md here
  - how to learn
  - how to use 
  - may become a post on medium

---









# new Learning UI

- DONE in learner, display all the markers as text
  - each got a progress in percent 
  - display percent in red
  - when percent is 100%, display check character in green
  - find function to get name of marker (worst case scenario - display index)
    - type + patternUrl basename ?
    - add a .name() function in the controls ?
  - progress is directly the result.confidenceFactor clamp [0, 1]
- display the origin markers
- DONE Global progress for the whole area 
  - sum of all progress divided by the number of sub markers.
  - It should exclude the origin markers
- change compute .computeAverageMatrix()
  - rename to .computeResult()
  - put a confidence factor in the Number
  - userData.markerLearningResult.averageMatrix / .confidenceFactor
  - what if the result can not be computed ?
    - .averageMatrix === null && .confidenceFactor === 0
- .computeResult() MUST support unlearned markers
  - aka we can learn among X markers and get a valid result for less markers
  - it MUST work in the learner, in the result production, and in the player
- result.confidenceFactor is about amount of sample used to compute the averageMatrix.
  - Say that 200 samples is deemed good enough.
- result.confidenceFactor is n-samples / required-n-samples.
  - notes that it can go above 1

# new learning algo






---

- make all markers children of a parent THREEx.ArBaseControls()
  - GOAL: make it explicit what is expected from a AR controls
  - emit event
  - have id
  - anything which is common

- TODO put a smoother on sub-marker while learning ? as a way to remove noise ?
  - do it and hide it behind a flags
  - in relation with THREEx.ArBaseControls
- add a-frame support
  - support for learning new area - can i just use the area-learner.html
  - support of multi-marker description


- DONE make a function in controls to compute the center of the multi markers
  - it can be used as a default position for the origin controls.computer
  - this is simply the average of all sub-marker matrix
  - so compute all the sub-markers matrix

- make a video for it
  - recorded on the phab2 - abcf
  - Multi marker with AR.js
  - insert: Designed for easy workflow
  - Step 1: scan all markers with your phone
  - Step 2: once done, you just use it!
  - show what happen when you go close to the markers at low altitude
  - insert: more stable
  - insert: only one is visible? still works!

- what to do with the official multimarker support
  - make an example for it, and keep supporting it
  - issue with the last jsartoolkit
  - park multimarker.html


- do an apps which does something with it
  - a minecraft going from submarkers to submarkers


- do a post about multimarker - https://medium.com/p/4bcafc785dfd/edit



- DONE merge it all in the README.md
