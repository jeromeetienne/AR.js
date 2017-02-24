# AR.js - Efficient Augmented Reality for the Web using ARToolKit

I am focusing hard on making AR for the web a reality.
This repository is where I publish the code.
Contact me anytime [@jerome_etienne](https://twitter.com/jerome_etienne).
Stuff are still moving fast, We reached a good status tho.
So I wanted to publish thus people can try it and have fun with it :)

- **Very Fast** : it runs efficiently even on phones. [60 fps on my 2 year-old phone](https://twitter.com/jerome_etienne/status/831333879810236421)!
- **Very Webby** : It is a pure web solution, so no installation required. Full javascript based on three.js + jsartoolkit5
- **Free and Open** : It is completely open source and free of charge!
- **Pure Standards** : It works on any phone with [webgl](http://caniuse.com/#feat=webgl) and [webrtc](http://caniuse.com/#feat=stream)

![screenshot](https://cloud.githubusercontent.com/assets/252962/23068128/40343608-f51a-11e6-8cb3-900e37a7f658.jpg)

# Try it on Mobile
It is done in 2 easy steps :)

1. Direct your android browser to [this url](https://jeromeetienne.github.io/AR.js/three.js/examples/mobile-performance.html).
2. Point your phone at a hiro marker. 

You are done! It will open a webpage which read the phone webcam, localize a hiro marker 
and add 3d on top of it.
Here is an example of [hiro marker](http://wibiwardhono.lecture.ub.ac.id/files/2015/01/HIRO.jpg).
You can print the marker too or you can just display it on your desktop screen, like below.

![screenshot](https://cloud.githubusercontent.com/assets/252962/23072106/73a0656c-f528-11e6-9fcd-3c900d1d47d3.jpg)

# Standing on the Shoulders of Giants

So we shown it is now possible to do 60fps web-based augmented reality on a phone. 
This is great for sure but how did we get here ? **By standing on the shoulders of giants!**
It is thanks to the hard work from others, that we can today reach this mythic 60fps AR.
So i would like to thanks :

- **three.js** for being a great library to do 3d on the web.
- **artoolkit!** years of development and experiences on doing augmented reality
- **emscripten and asm.js**! thus we could compile artoolkit c into javascript
- **chromium**! thanks for being so fast!

Only thanks to all of them, i could do my part : Optimizing performance from 5fps on high-end
phone, to 60fps on 2years old phone.

After all this work done by a lot of people, we have it! 
We have a web-based augmented reality library fast enough for mobile.

Now, a lot of people got a phone powerful enough to do web AR in their pocket.
I think this performance improvement make web AR a reality.
i am all exited by what people are gonna with it :)

# Phone Support

It works on **any browser with WebGL and WebRTC**. This is the principle.
Now the specifics: android works, window mobile works, IOS doesnt work unfortunately.
IOS safari doesn't support WebRTC at the moment. 
Apple is [currently working on it](https://webkit.org/status/#specification-webrtc) tho. 

It is the beginning of this project. 
Here are some initial performance numbers just to give an idea. 
It highly depends on how heavy your 3d is and what are your tuning of AR.js, so you milage may vary. 
That said they give a rough idea. 

- I got 60fps stable on nexus6p
- Some reports [Sony Xperia Z2 (2.5 years old) runs around 50fps](https://twitter.com/leinadkalpot/status/834121238087925763) - this is a 170euro phone
- Some reports [~50fps on a old nexus5, and ~60fps on nexus 9](https://twitter.com/Ellyll/status/834312442926751744) - nexus5 is 3.5 years old!
- Some reports it working on windows phone edge!! [13fps on Lumia 950](https://twitter.com/leinadkalpot/status/834299384510763012) for some.
  [40-45fps still on lumia 930](https://twitter.com/fastclemmy/status/834817155665391616) for others
  it run on window phone, it is amazing :)

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
- [aframe-logo](https://jeromeetienne.github.io/AR.js/aframe/examples/aframe-logo.html) : 
  a-frame example for aframe-logo
  ([source](https://github.com/jeromeetienne/AR.js/blob/master/aframe/examples/aframe-logo.html))
- [hatsune](https://jeromeetienne.github.io/AR.js/aframe/examples/hatsune.html) : 
  a-frame example for hatsune
  ([source](https://github.com/jeromeetienne/AR.js/blob/master/aframe/examples/hatsune.html))
- [minecraft](https://jeromeetienne.github.io/AR.js/aframe/examples/minecraft.html) : 
  a-frame example for minecraft
  ([source](https://github.com/jeromeetienne/AR.js/blob/master/aframe/examples/minecraft.html))
- [marker-camera](https://jeromeetienne.github.io/AR.js/aframe/examples/marker-camera.html) : 
  a-frame example for marker-camera
  ([source](https://github.com/jeromeetienne/AR.js/blob/master/aframe/examples/marker-camera.html))
- [multiple-independent-markers](https://jeromeetienne.github.io/AR.js/aframe/examples/multiple-independant-markers.html) : 
  a-frame example for multiple-independent-markers
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


# Phone Support

It works on **any browser with WebGL and WebRTC**. This is the principle.
So android works and window mobile works.
It doesn't work on IOS unfortunately. safari IOS safari doesn't support WebRTC at the moment. 
Apple is [currently working on it](https://webkit.org/status/#specification-webrtc ) tho. 

It is the beginning of this project. 
Here are some initial performance numbers just to give an idea. 
It highly depends on how heavy your 3d is and what are your tuning of AR.js, so you milage may vary . 
That said they give a rough idea. 

- I got 60fps stable on nexus6p
- Some reports [Sony Xperia Z2 (2.5 years old) runs around 50fps](https://twitter.com/leinadkalpot/status/834121238087925763) - this is a 170euro phone
- Some reports [~50fps on an old nexus5, and ~60fps on nexus 9](https://twitter.com/Ellyll/status/834312442926751744) - nexus5 is 3.5 years old!
- Some reports it working on windows phone edge!! [13fps on Lumia 950](https://twitter.com/leinadkalpot/status/834299384510763012)
  Ok it is slow at the moment but still! it run on window phone, it is amazing :)

# Standing on the Shoulders of Giants

So we shown it is now possible to do 60fps web-based augmented reality on a phone. 
This is great for sure but how did we get here ? By standing on the shoulders of giants!
It is thanks to the hard work from others, that we can today reach those mythic 60fps AR.
So I would like to thanks :

- three.js for being a great library to do 3d on the web.
- artoolkit! years of development and experiences on doing augmented reality
- emscripten and asm.j! thus we could compile artoolkit c into javascript
- chromium browser! thanks for being so fast!

Only thanks to all of them, I could do my part : Optimizing performance from 5fps on high-end
phone, to 60fps on 2years old phone.

After all this work done by a lot of people, we have it! 
We have a web-based augmented reality library fast enough for mobile.
Now, a lot of people got a phone powerful enough to do web AR in their pocket.
I think this performance improvement make web AR a reality.
I am all excited :)

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

# update npm package.json
npm publish

# update the a-frame codepen 
open "https://codepen.io/jeromeetienne/pen/mRqqzb?editors=1000#0"
```
