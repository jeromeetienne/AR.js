# AR.js repackaged to be easy to port

This is a repackaged AR.js specifically repackaged to be super easy to port.

# How to use

First create the class

```js
// create a easyARjs instance
var easyARjs = new EasyARjs(webglCanvas, {
	// debugUI : true,
	// renderThreejs: true
})
```

Second update it on every frame

```js
// on every frame, be sure to update easyARjs
easyARjs.update()

// now easyARjs.cameraProjectionMatrix is the projection matrix for the camera
// - it is a matrix4x4 as an Array(16)

// now easyARjs.cameraTransformMatrix is the tranform matrix for the camera
// - it is a matrix4x4 as an Array(16)
```
