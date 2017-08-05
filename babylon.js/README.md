# ARBJS
Proof of Concept connecting Augmented Reality to Babylon.js for first time with AR.js

The index should run in a local server. 

It includes ar.js with customizations in Matrix math.

There is a single line of code that splices the two environments together so that both Three.js and Babylon run AR.js simultaneously.

That line of code is this:
cameraB._computedViewMatrix = new BABYLON.Matrix.FromArray(markerObject3D.matrix.toArray()); //SPLICE-FINAL! 

In the index file you will find two boilerplate examples. 1st Babylon which populates the cameraB variable.

Second, an AR template rendering a threeJS knot from AR.js.

MIT license. Free to use, extend, reuse. No Warranty.

Cheers.

