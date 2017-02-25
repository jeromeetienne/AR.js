It is a polyfill for webvr API using artoolkit as positional tracker.
It is a work in progress, use at your own risk.
As it expose the positional tracking via WebVR api, it is possible to use AR.js 
without depending on any specific library API.

*any* 3d engines can use it (or will be as soon as it is completed).
This is the beauty of it.
You don't need to write your 3d in a specific 3d engines, like three.js.
Any 3d engines can use this, as long as they support WebVR standard.
This include sketchfab, babylonjs, playcanvas, goocreate or any others.


```html
<!-- include artoolkit-webvr-polyfill.js -->
<script src="artoolkit-webvr-polyfill.js"></script>
```

## Please Help
- it currently depends on three.js for the maths
- It uses 3+ math classes Vector3/Quaternion/Matrix4...
- i would love it to be fully standalone but time is missing
- WebAR is currently a single personn effort and this is big complex code :)
- the contribution is simple and a pull request
- if anybody is considering contributing it, i would love to help and point at the code.
