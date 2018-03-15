# AR.js repackaged to be easy to port

This is a repackaged AR.js specifically repackaged to be super easy to port.

There is a [babylon.js example](examples/babylon.js/)
([demo](https://jeromeetienne.github.io/AR.js/three.js/contribs/portableAR.js/examples/babylon.js/basic.html))

# How to use

First create the class

```js
// create a portableARjs instance
var portableARjs = new PortableARjs(webglCanvas, {
	// debugUI : true,
	// renderThreejs: true
})
```

Second update it on every frame

```js
// on every frame, be sure to update portableARjs
portableARjs.update()

// now portableARjs.cameraProjectionMatrix is the projection matrix for the camera
// - it is a matrix4x4 as an Array(16)

// now portableARjs.cameraTransformMatrix is the tranform matrix for the camera
// - it is a matrix4x4 as an Array(16)
```
