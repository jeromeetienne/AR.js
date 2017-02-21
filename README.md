# AR.js - Efficient Augmented Reality for the Web using ARToolKit

I am focusing hard on making AR for the web a reality.
This repository is where i publish the code.
Contact me anytime [@jerome_etienne](https://twitter.com/jerome_etienne).
Stuff are still moving fast, We reached a good status tho.
So i wanted to publish thus people can try it and have fun with it :)

- **Very Fast** : it runs efficiently even on phones. [60 fps on my 2 year-old phone](https://twitter.com/jerome_etienne/status/831333879810236421)!
- **Very Webby** : It is a pure web solution, so no installation required. Full javascript based on three.js + jsartoolkit5
- **Free and Open** : It is completly open source and free of charge!
- **Pure Standards** : It works on any phone with [webgl](http://caniuse.com/#feat=webgl) and [webrtc](http://caniuse.com/#feat=stream)

![screenshot](https://cloud.githubusercontent.com/assets/252962/23068128/40343608-f51a-11e6-8cb3-900e37a7f658.jpg)

# Try it on Mobile
It is done in 2 easy steps :)

1. Direct your android browser to [this url](https://jeromeetienne.github.io/AR.js/three.js/examples/mobile-performance.html).
2. Point your phone at a hiro marker. 

You are done! It will open a webpage which read the phone webcam, localize an hiro marker 
and add 3d on top of it.
Here is an example of [hiro marker](http://wibiwardhono.lecture.ub.ac.id/files/2015/01/HIRO.jpg).
You can print the marker too or you can just display it on your desktop screen, like below.

![screenshot](https://cloud.githubusercontent.com/assets/252962/23072106/73a0656c-f528-11e6-9fcd-3c900d1d47d3.jpg)

# Status
- At the three.js level is the main one. It is working well and efficiently
- a-frame component - it export ```<a-marker>``` tag. It becomes real easy to use.
  It allows the things three.js extension does. Here are some slides 
  [aframe-artoolkit](http://jeromeetienne.github.io/slides/artoolkit-aframe/)
- webvr-polyfill: it is kind of working - still a work-in-progress

# Examples

Three.js Examples: 

- [cameratransform](https://jeromeetienne.github.io/AR.js/three.js/examples/cameratransform.html) : 
  three.js example for cameratransform
  ([source](https://github.com/jeromeetienne/AR.js/blob/master/three.js/examples/cameratransform.html))
- [markerroot](https://jeromeetienne.github.io/AR.js/three.js/examples/markerroot.html) : 
  three.js example for markerroot
  ([source](https://github.com/jeromeetienne/AR.js/blob/master/three.js/examples/markerroot.html))
- [mobile-performance](https://jeromeetienne.github.io/AR.js/three.js/examples/mobile-performance.html) : 
  three.js example for mobile-performance
  ([source](https://github.com/jeromeetienne/AR.js/blob/master/three.js/examples/mobile-performance.html))

a-frame Examples: 

- [basic](https://jeromeetienne.github.io/AR.js/aframe/examples/basic.html) : 
  a-frame example for basic
  ([source](https://github.com/jeromeetienne/AR.js/blob/master/aframe/examples/basic.html))
- [demo](https://jeromeetienne.github.io/AR.js/aframe/examples/demo.html) : 
  a-frame example for demo
  ([source](https://github.com/jeromeetienne/AR.js/blob/master/aframe/examples/demo.html))
- [hatsune](https://jeromeetienne.github.io/AR.js/aframe/examples/hatsune.html) : 
  a-frame example for hatsune
  ([source](https://github.com/jeromeetienne/AR.js/blob/master/aframe/examples/hatsune.html))
- [minecraft](https://jeromeetienne.github.io/AR.js/aframe/examples/minecraft.html) : 
  a-frame example for minecraft
  ([source](https://github.com/jeromeetienne/AR.js/blob/master/aframe/examples/minecraft.html))
- [marker-camera](https://jeromeetienne.github.io/AR.js/aframe/examples/marker-camera.html) : 
  a-frame example for marker-camera
  ([source](https://github.com/jeromeetienne/AR.js/blob/master/aframe/examples/marker-camera.html))
- [multiple-independant-markers](https://jeromeetienne.github.io/AR.js/aframe/examples/multiple-independant-markers.html) : 
  a-frame example for multiple-independant-markers
  ([source](https://github.com/jeromeetienne/AR.js/blob/master/aframe/examples/multiple-independant-markers.html))
- [noinstall](https://jeromeetienne.github.io/AR.js/aframe/examples/noinstall.html) : 
  a-frame example for noinstall
  ([source](https://github.com/jeromeetienne/AR.js/blob/master/aframe/examples/noinstall.html))

WebVR-polyfill Examples: 
- [aframe](https://jeromeetienne.github.io/AR.js/webvr-polyfill/examples/aframe.html) : 
  a-frame example for aframe
  ([source](https://github.com/jeromeetienne/AR.js/blob/master/webvr-polyfill/examples/aframe.html))
- [basic](https://jeromeetienne.github.io/AR.js/webvr-polyfill/examples/basic.html) : 
  a-frame example for basic
  ([source](https://github.com/jeromeetienne/AR.js/blob/master/webvr-polyfill/examples/basic.html))

# Folders
- ```/three.js``` is the extension to use it with [pure three.js](https://threejs.org)
- ```/aframe``` is the extension to use it with [a-frame](https://aframe.io)
- ```/webvr-polyfill``` is the WebVR polyfill so you can reuse your #AR / #VR content easily

# Licenses
It is **all open source** ! jsartoolkit5 is under LGPLv3 license and additional permission.
And All my code in AR.js repository is under MIT license. :)

For legal details, be sure to check [jsartoolkit5 license](https://github.com/artoolkit/jsartoolkit5/blob/master/LICENSE.txt)
and [AR.js license](https://github.com/jeromeetienne/AR.js/blob/master/LICENSE.txt).

# Change Log
[CHANGELOG.md](https://github.com/jeromeetienne/AR.js/blob/master/CHANGELOG.md)

# How To Release ?

```bash
# replace REVISION to the proper version
atom three.js/threex-artoolkitcontext.js

# Rebuild a-frame and webvr-polyfill
(cd aframe && make minify) && (cd webvr-polyfill && make minify)

# Commit everything
git add . && git commit -a -m 'Last commit before release'

# tag the release 
git tag 1.0.0

# push the tag on github
git push origin --tags

# update the a-frame codepen 
open "https://codepen.io/jeromeetienne/pen/mRqqzb?editors=1000#0"
```
