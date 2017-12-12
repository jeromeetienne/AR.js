
WHY REIMPLEMENTING WHAT IS ALREADY DONE IN THREE>JS ??
- why not simply copy it
- aka copy THREE.Object3D and THREE.Math
- the whole thing to be sure you got everything
- then switch the source to that ?
- it should be rather simple
- then maintain this is your own copy. it is not suppose to remain insync with three.js
- strip it down to the minimal you use. in Object3D, in Math
- API remains identical internally


- https://github.com/mrdoob/three.js/blob/master/src/core/Object3D.js
- http://glmatrix.net/docs/

- do ARjs.Object3D
- handle scene graph with world matrix
- 

- remove THREE.EventDispatched for signals.js

---

## Remove three.js dependancy
- first remove it externally
  - find all dependancy to three.js in the ar-session API
  - ARjs.Anchor should export a modelViewMatrix
  - ARjs.Session should export a camera projection matrix and a camera transform matrix
  - ARjs.HitTesting Plane is very three.js dependant - use raycasting of three.js
  - ARjs.Session got dependancy on renderer/scene/camera .... quite a lot 
    - it needs to be sorted out
    - renderer for canvas domElement - anything else ? for resize
    - scene only for my own stuff
    - camera too - for resize
    - ARjs.THREE.onResizeCamera() - ARjs.THREE.onResizeRenderer()
    - use inspector to display from where it is used

- then remove it internally
- get ride of three.js dependancy 
  - first arjs session API not to use any three.js specific
  - vector3 as array, same for quaternion
  - some matrix as array too - projection matrix, localMatrix
- as im rewriting the highlevel API, im thinking about removing the three.js 
  dependancy. aka to make AR.js easily usable by other than three.js
  this could be osg.js (sketchfab stuff), this could be babylon.js
  this would clean things up and this isnt too hard to do on my side.
  Just using another math library and to do some THREE.Object3d emulation
- use gl-matrix.js - it is good code - it is from somebody rigurous - it is well maintained
- ARjs.Camera inherit from ARjs.Object3D - projectionMatrix
- ARjs.Object3D : position, quaternion, scale
