# 1.5.0-dev

## aframe-ar.js
- aframe-ar.js - added link into webxr.io/augmented-website
- aframe-ar.js - change debugUIEnabled default from false to true.
- FIX: in aframe-ar.js object3d stayed visible when marker goes out of screen

## babylon-ar.js
- AR.js now work with babylon.js [source](https://github.com/jeromeetienne/AR.js/tree/master/babylon.js)
- It is early but it is working!

## Demos
- drafting a demo for 3d.io - [tweet](https://twitter.com/jerome_etienne/status/895258272361480193) - [source](https://github.com/jeromeetienne/AR.js/tree/master/aframe/examples/demo-3dio/)
- Magic door bridging AR and VR [tweet](https://twitter.com/jerome_etienne/status/893217730517749760)
  - nice reuseable components available
- made demos to celebrate firefox 55 - [post](https://medium.com/arjs/demos-for-firefox-55-release-with-webvr-fb854bb9bb70) - [source](https://github.com/jeromeetienne/AR.js/tree/master/aframe/examples/demo-firefox-release/)
- made demo for mapbox - [tweet](https://twitter.com/jerome_etienne/status/895018409922093058) - [source](https://github.com/jeromeetienne/AR.js/tree/master/aframe/examples/demo-mapbox/)
- vr-camera-controls - or how to walk in VR with AR.js - [tweet](https://twitter.com/jerome_etienne/status/894580746026758144)

# 1.4.10

- support for markers-area 
  - Efficient user friendly area scanning
  - More Versatile than single marker tracking 0 larger areas than single markers
  - More Robust than single marker tracking - even if only one sub marker is visible it is still tracking
  - More Stable than single marker tracking - position is averaged based on visible markers
- Support for multiple tracking
- single api for all tracking
- tango support
- support for aruco WIP - all included but need to fix pose estimation

# 1.3.0

**Totally incomplete**

- added smoothedControls - everything tunable via parameters
  - it applies LERP for position/quaternion/scale on sub-controls
  - if display controls object3d when sub-controls has been visible for minVisibleDelay
  - if display controls object3d when sub-controls has been unvisible for minUnvisibleDelay
- did THREEx.ArMarkerHelper to help visualize marker
- AR-Code generator - see [AR-Code Generator](https://jeromeetienne.github.io/AR.js/three.js/examples/arcode.html)
- liquid markers are in!
  [water tweet](https://twitter.com/jerome_etienne/status/844681159112036356) -
  [boing tweet](https://twitter.com/jerome_etienne/status/845646514814947328)
- marker invisible cloak are in! with tweening and all :)
  [first tweet](https://twitter.com/jerome_etienne/status/840563600091688962) -
  [video tweet](https://twitter.com/jerome_etienne/status/843757199436472320)
- minimal.html just got a little bit cleaner
  - aka the simplest way to do AR on the web
  - or webar in less than 10 lines of html! on codepen
- finished hole-in-the-wall demo - 
  [duck on my desk tweet](https://twitter.com/jerome_etienne/status/846751371185541121)
- support preset in a-frame a-marker - preset = ["hiro" | "kanji"]
- experiementation in dead-reckoning ... not conclusive
- early work about videoInWebgl - a important componant of phone-in-hmd usecase
  [first tweet](https://twitter.com/jerome_etienne/status/846805050118864897)
- better handling of .baseUrl in aframe default parameters
- fixed artoolkit projection matrix to be more webgl - [projection matrix](https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/WebGL_model_view_projection)
  - it was looking to positive-z and y was upside down compared to the usual webgl one
- Change marker axis - now positive-y is normal to the marker
- Added logo by @tentone - [AR.js logo](https://github.com/jeromeetienne/AR.js/blob/master/data/logo/logo-black-transparent-1280x512.png)
Nice and slick! thanks @tentone
- Added a-frame logo in AR - [aframe-logo.html](https://github.com/jeromeetienne/AR.js/blob/master/aframe/examples/aframe-logo.html)
- added a profile discovery. It helps choose the performance tradeoff which fit your case - [profile](https://github.com/jeromeetienne/AR.js/blob/master/three.js/examples/profile.html)

# 1.0.0 - AR.js has landed

- Fixed the resize issue in a-frame!
- Performance improvement of image copy time by 40%!!!
  - massive improvement in the pose detection time
  - so maxDetectionRate can go way up
- Improved documentations

# 0.9.0 - Initial Release

I worked a lot on WebAR.
But i recently reached [60fps on mobile phones](https://twitter.com/jerome_etienne/status/831333879810236421).
so i think WebAR is now ready to be released :)

I will keep the usual branch model

- stable release on master branch
- current release on dev branch
- features in progress on their own branch
