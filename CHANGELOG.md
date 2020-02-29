# 2.2.2

- Restored old camera constraints, was giving better performances for some devices but worst for others.

# 2.2.0

- it's now possible to track markers with white background and black shapes, using `labelingMode: white_region;` property on `arjs` component (thanks to @umutto)
- in location based is now possible to simulate altitude, longitude and latitude for user position (thanks to @cmcfadden)
- default package script for jsdelvr (thanks to @benalfree)

# 2.1.8

- handle y position (height) of content in Location Based, using `position` property of A-FRAME

# 2.1.7

- enhanced `distance` property, now calculating combined distance for latitude/longitude

# 2.1.6

- set distance in `distance` property of `gps-entity-place` (location based) as z axis (previously was x axis)

# 2.1.5

- added `distance` and `distanceMsg` properties to `gps-entity-place` (location based)
- added new example for distance property
- added new example for a `gps-entity-place` that is always facing the user (location based)
- fixed error when source is image or video and not camera
- enhanced docs

# 2.1.4

- fixed wrong positioning of content on markers

# 2.1.3

- fixed a bug that causes Overconstrained Error on desktop
- cleaned repo (removed data like videos and heavy files)

# 2.1.0

- Removed support for Google Tango (obsolete and no more supported by Google)
- Removed support for Aruco markers
- Fixed loader bug on location based examples
- Merged PR https://github.com/jeromeetienne/AR.js/pull/673 and https://github.com/jeromeetienne/AR.js/pull/666
- Fixed documentation
- Cleaned repo, preparing for next release

# 2.0.8

- Fixed bug on location-based while added places via HTML
- Added example of location-based using only HTML
- Added loader during the time between gps-camera initialization and gps-entity-place add

# 2.0.5

- Fixed a bug on location-based statically add of places via script

# 2.0.4

- Fixed motion and orientation sensors permission for iOS 13+ devices

# 2.0.1

- Fixed location-based files build
- Removed unuseful imports on location-based examples

# 2.0.0

- Introduced Location Based Augmented Reality adding new `aframe` custom components (`gps-entity-place`, `gps-camera`, `gps-camera-debug`)
- Added new and updated documentation
- Added examples for Location Based AR
- Reduced repository size deleting unuseful code

# 1.7.8

(Release drafted for problems with the release flow. No change from previous version)

# 1.7.7

- added event when camera video stream has been appended to the DOM tree (`arjs-video-loaded`)

# 1.7.5

- added events for camera initialization success/error (`camera-init`, `camera-error`)
- enhanced Debug UI style
- minor documentation fixes

# 1.7.2

- updated `three.js` dependency to `r103` version
- minor documentation fixes
- replace all rawgit URLs (learn more at https://rawgit.com/)

# 1.7.1

- added possibility to change border marker color in marker generator

# 1.7.0

- optionally manage smooth parameter (for video entity glitches and similar problems)
- generate .patt files keeping uploaded image name
- enhanced marker generator
- reduce build size

# 1.6.3-dev

- added a ```npm run build``` script for travis

# 1.6.2

- Adds TravisCI config with NPM deployment configured - thanks @joestrong -
[#344](https://github.com/jeromeetienne/AR.js/pull/344)

# 1.6.1

## aframe-ar.js

- aframe-ar.js - `<a-marker>` elements will emit `markerFound` and `markerLost` events - thanks @nikolaymihaylov! Pull Request [#303](https://github.com/jeromeetienne/AR.js/pull/303)

## Demos

- Created [an example](https://jeromeetienne.github.io/AR.js/aframe/examples/marker-events.html) that demonstrates emitting events when markers are found and lost, and registering the respective event listeners.

# 1.6.0

- implemented patternRatio in aframe/three.js - a way to reduce the ugly black border
  - aka something to make the pattern marker border thinner
  - change (generator.html)[https://jeromeetienne.github.io/AR.js/three.js/examples/marker-training/examples/generator.html] to support patternRatio
  - added examples in [aframe](https://jeromeetienne.github.io/AR.js/aframe/examples/default-thinner-border.html) and [three.js](https://jeromeetienne.github.io/AR.js/three.js/examples/default-thinner-border.html)

# 1.5.5

- Fix cross domain issue with [https://webxr.io/augmented-website/](https://webxr.io/augmented-website/)
- reduced npm package size from 250mbyte to 3.5mbyte #256 (thanks @paztis)
- fixed perspective in artoolkit portrait #212 (thanks @pikilipita)
- fixed barcode in a-frame #260 (thanks @basbase)
- created [portableAR.js](https://github.com/jeromeetienne/AR.js/tree/dev/three.js/contribs/portableAR.js) - a simple way to port ar.js to a non-three.js framework
  - it is in /three.js/contribs/portableAR.js
  - in [examples/](https://github.com/jeromeetienne/AR.js/tree/dev/three.js/contribs/portableAR.js/examples/babylon.js) you can find babylon.js using portableAR.js
- made webvr-polyfill obsolete
  - it was more a toy than something currently useful
  - it was far from complete, not even in a workable state, anyway
- reorganized ```examples/``` folder
  - created ```demos/``` to contain working demos
  - created ```experiments/``` to contain work in progress

## Tests
- Made tests to report failure - yeah i know it is silly but before it reported
- Added test to measure performance : fps
- Added test for markers-area learning and usage
- Added test for artoolkit, aruco and hit-testing

---

# 1.5.1

## aframe-ar.js
- aframe-ar.js - added link into [https://webxr.io/augmented-website/](https://webxr.io/augmented-website/)
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

---

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

---

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

---

# 1.0.0 - AR.js has landed

- Fixed the resize issue in a-frame!
- Performance improvement of image copy time by 40%!!!
  - massive improvement in the pose detection time
  - so maxDetectionRate can go way up
- Improved documentations

---

# 0.9.0 - Initial Release

I worked a lot on WebAR.
But i recently reached [60fps on mobile phones](https://twitter.com/jerome_etienne/status/831333879810236421).
so i think WebAR is now ready to be released :)

I will keep the usual branch model

- stable release on master branch
- current release on dev branch
- features in progress on their own branch
