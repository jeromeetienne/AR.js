# WebVR API extension for smartphone AR

## Overview

Basic smartphone based Augmented Reality (AR) web applications can be enabled with minimal extensions to the [WebVR 1.1 API].

**DISCLAIMER:** By no means is this a web standards proposal for AR on the web. It is only a simple way to provide some basic AR capabilities to experiment with prototype browsers that implement this extension.

This extension mainly focuses on smartphone based AR where there are 3 basic elements that enable AR experiences:

* **Motion tracking**: The device needs to know its exact location and orientation in 3D space. This is called 6 Degrees Of Freedom ([6DOF]) motion tracking.
* **Rendering the pass through camera**: Smartphones allow to render virtual content on top of the reality represented by the feed provided by the camera they have.
* **Basic understanding of the real world**: Motion tracking provides the exact location of the device in the real world but apart from that, the device does not understand much more from it. In order to be able to interact with the real world correctly, some basic understanding is very valuable. Current Smartphone AR technology provides different ways to identify planes in the real world (or even more complex information like meshes or objects like markers or even complete point clouds). This way, virtual objects can be anchored in the real world so they appear to interact with it as a human would expect them to.

## Features

The AR extension to the WebVR API provides basic functionality to expose these features.

### Motion Tracking

Motion tracking is resolved by the WebVR API itself so no extension is needed, just a correct implementation in the browser side to communicate with the underlying AR technology and expose the [6DOF] tracking needed. Please, refer to the [WebVR 1.1 API] documentation or to the 'Using the WebAR API' section below for more information on how to obtain the pose.

### Rendering the pass through camera

If a developer chooses to use a [VRDisplay] instance in their web app that has support for the pass through camera, the user agent will internally render the camera feed and composite it per frame. It is important, though, to know if this compositing is happening and that is why the WebVR extension for AR provides a new flag in the [VRDisplayCapabilities] structure.

```
partial interface VRDisplayCapabilities {
  readonly attribute boolean hasPassThroughCamera;
};
```

A new property has been added to [VRDisplayCapabilities] that indicate the existence of a AR-capable [VRDisplay]. If `hasPassThroughCamera` is true, the device's camera will render underneath the composited display and the web app can accordingly adapt, like not clearing the color buffer per frame, for example, as the camera feed would be cleared, or asking the WebGL context to use alpha transparency.

### Basic understanding of the real world

There are multiple ways to get some information in an AR system about the real world surrounding the device. For now, the WebVR extension for AR exposes one of the simplest possible: throw a ray from the device perspective into the real world and let the app know if there has been a hit against any of the elements the system understands from the real world.

```
partial interface VRDisplay {
  sequence<VRHit> hitTest(float x, float y);
};
```

`VRDisplay.prototype.hitTest` returns an array of 0 or more VRHit instances that represent locations in the real world. This functionality casts the ray from a 2D position and obtains a list of all the hit points in the real world. The `x` and `y` values must be normalized between 0 and 1, with (0, 0) being the upper-left corner of the screen. Also note that if the `x`, `y` values are not normalized, the method will throw an error.

The `VRHit` structure and has a single property, `modelMatrix`.

```
struct VRHit {
  readonly attribute Float32Array modelMatrix;
};
```

The `modelMatrix` property is a 4x4 transformation matrix represented as a Float32Array of size 16, encoding the position and orientation of some object in the real world.

It's also possible to subscribe to events that deliver information on detected planes in the real world. The VRDisplay object is an EventTarget that fires 3 additional events ('planesadded', 'planesremoved', 'planesupdates') as response to changing in the detected planes.

```
interface VRPlane {
  readonly attribute long identifier;
  // A 4x4 transformation matrix, encoding the position and orientation of the plane
  readonly attribute Float32Array? modelMatrix;
  // Contains a values [x, z] that represent the extents relative to the plane
  readonly attribute Float32Array? extent;
  // An array of values group by x,y,z values of a series of vertices
  // representing this plane. [p0x, p0y, p0z, p1x, p1y, p1z, ...]
  readonly attribute Float32Array? vertices;
}
```

See [webvr_ar_extension.idl] for structure of VRPlane, VRHit, and others.

## Using the WebVR extension API for AR

As the extension API is built on top of WebVR, please refer to the [WebVR 1.1 API] for more details and basic knowledge that will be necessary to understand this section. Some of the examples will also use some [three.js] based code for clarity purposes but the same concept could be applied in any other engine or basic webgl based web app.

### Detecting an AR-capable VRDisplay

The WebVR API provides a mechanism to list all the available devices via [getVRDisplays]. An AR-capable [VRDisplay] will have a [VRDisplayCapabilities] boolean flag for `hasPassThroughCamera`.

```js
navigator.getVRDisplays().then(displays => {
  for (let display of displays) {
    if (display.capabilities.hasPassThroughCamera) {
      init(display);
    }
  }
});
```

### Obtaining the camera pose and projection information

The WebVR API provides a mechanism to obtain both the position and orientation of the camera and the correct projection matrix needed to render the virtual elements. Updating the [VRFrameData] will populate the [VRPose] with `position` and `orientation` properties, and the [VRFrameData] will contain a `leftProjectionMatrix` and `rightProjectionMatrix`, which are identical in the smartphone AR scenario. The pose orientation and position may lose tracking temporarily if the underlying AR engine is unable to detect visual features.

Using the pose information is no different than native WebVR experiences, like the Daydream, which provides pose orientation, or the HTC Vive, which provides both orientation and position. The [VRControls] utility maps the frame data to our [three.js] camera.

```js
display.getFrameData(frameData);
frameData.pose.position; // Float32Array(3) (x, y, z) vector3
frameData.pose.orientation; // Float32Array(4) (x, y, z, w) quaternion
frameData.leftProjectionMatrix; // Float32Array(16)
```

### Placing a virtual object in the real world

The AR extension on top of WebVR allows to cast a ray from the camera to the real world and obtain a list of hits (if any). [This code example](https://github.com/google-ar/three.ar.js/blob/e871fe9ed806ef3be233fd9cc86ffc5a6a7a1382/examples/spawn-at-surface.html#L232-L248) shows how to make that call and process the resulting information.

### Getting planes data

Listening to events in the `VRDisplay` allows a developer to observe changes in the underlying plane detection. There are `planesadded`, `planesupdated` and `planesremoved` events. This feature was added in October 2017 in [WebARonARCore] and [WebARonARKit] and an example rendering surfaces from these events can [be seen here](https://google-ar.github.io/three.ar.js/examples/surfaces.html). Note that on ARCore, planes can be convex polygons, and on ARKit, planes are always rectangular.

```js
display.addEventListener('planesadded', e => {
  console.log(`Planes added for ${e.display}`);
  e.planes.forEach(plane => {
    console.log(`
      Added plane ${plane.identifier} at ${plane.modelMatrix},
      with extent ${plane.extent} with vertices ${plane.vertices}
    `);
  });
});
```

It's also possible to just fetch the current planes detected. While less performant than subscribing to events, it may be desirable to just get a snapshot of the current planes. For example, a developer may fetch planes for one point in time rather than managing the plane changes, or want to fetch planes before subscribing to events for an accurate representation.

```js
display.getPlanes().forEach(plane => {
  console.log(`
    Found plane ${plane.identifier} at ${plane.modelMatrix},
    with extent ${plane.extent} with vertices ${plane.vertices}
  `);
});
```

[WebVR 1.1 API]: https://w3c.github.io/webvr/spec/1.1/
[WebVR 2.0 API]: https://github.com/w3c/webvr/blob/master/explainer.md
[6DOF]: https://en.wikipedia.org/wiki/Six_degrees_of_freedom
[VRFrameData]: https://developer.mozilla.org/en-US/docs/Web/API/VRFrameData
[VRPose]: https://developer.mozilla.org/en-US/docs/Web/API/VRPose
[VRDisplayCapabilities]: https://developer.mozilla.org/en-US/docs/Web/API/VRDisplayCapabilities
[VRDisplay]: https://developer.mozilla.org/en-US/docs/Web/API/VRDisplay
[getVRDisplays]: https://developer.mozilla.org/en-US/docs/Web/API/Navigator/getVRDisplays
[three.js]: https://threejs.org/
[VRControls]: https://github.com/google-ar/three.ar.js/blob/e871fe9ed806ef3be233fd9cc86ffc5a6a7a1382/third_party/three.js/VRControls.js#L87
[WebARonARKit]: https://github.com/google-ar/WebARonARKit
[WebARonARCore]: https://github.com/google-ar/WebARonARCore
[webvr_ar_extension.idl]: webvr_ar_extension.idl

