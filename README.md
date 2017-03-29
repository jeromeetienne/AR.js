# AR.js - Efficient Augmented Reality for the Web using ARToolKit

I am focusing hard on making AR for the web a reality.
This repository is where I publish the code.
Contact me anytime [@jerome_etienne](https://twitter.com/jerome_etienne).
Stuff are still moving fast, We reached a good status tho.
An article has been published on [uploadvr](https://uploadvr.com/ar-js-efficient-augmented-reality-for-the-web/).
So I wanted to publish thus people can try it and have fun with it :)

- **Very Fast** : it runs efficiently even on phones. [60 fps on my 2 year-old phone](https://twitter.com/jerome_etienne/status/831333879810236421)!
- **Web-based** : It is a pure web solution, so no installation required. Full javascript based on three.js + jsartoolkit5
- **Open Source** : It is completely open source and free of charge!
- **Standards** : It works on any phone with [webgl](http://caniuse.com/#feat=webgl) and [webrtc](http://caniuse.com/#feat=stream)

[![AR.js 1.0 Video](https://cloud.githubusercontent.com/assets/252962/23441016/ab6900ce-fe17-11e6-971b-24614fb8ac0e.png)](https://youtu.be/0MtvjFg7tik)


# Try it on Mobile

It works on **any browser with WebGL and WebRTC**. So android works. Window mobile works.
IOS doesnt work unfortunately. IOS safari doesn't support WebRTC at the moment. 
Apple is [currently working on it](https://webkit.org/status/#specification-webrtc) tho. 

To try on your phone is only 2 easy steps, check it out!

1. Open this [hiro marker image](https://jeromeetienne.github.io/AR.js/data/images/HIRO.jpg) in your desktop browser.
1. Open this [augmented reality webapps](https://jeromeetienne.github.io/AR.js/three.js/examples/mobile-performance.html) in your phone browser, and point it 
to your screen.

**You are done!** It will open a webpage which read the phone webcam, localize a hiro marker and add 3d on top of it, as you can see below.

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

After all this work done by a lot of people, we have a *web-based augmented reality solution fast enough for mobile*!

Now, many people got a phone powerful enough to do web AR in their pocket.
I think this performance improvement makes web AR a reality.
i am all exited by what people are gonna with it :)

# Performance

We are still early in the project but here are some initial numbers to give you an idea.

- I got 60fps stable on nexus6p
- Some reports [Sony Xperia Z2 (2.5 years old) runs around 50fps](https://twitter.com/leinadkalpot/status/834121238087925763) - this is a 170euro phone
- Some reports [~50fps on a old nexus5, and ~60fps on nexus 9](https://twitter.com/Ellyll/status/834312442926751744) - nexus5 is 3.5 years old!
- Some reports it working on windows phone edge!! [13fps on Lumia 950](https://twitter.com/leinadkalpot/status/834299384510763012) for some.
  [40-45fps on lumia 930](https://twitter.com/fastclemmy/status/834817155665391616) for others.

Obviously you mileage may vary. The performance you get will depend on 3 things: How heavy your 3D is, How you tune your parameters
and the hardware that you are using.

![screenshot](https://cloud.githubusercontent.com/assets/252962/23068128/40343608-f51a-11e6-8cb3-900e37a7f658.jpg)

# Full Featured Marker based
With this project, we bring more performance to artoolkit. 
artoolkit is a software with years of experience doing augmented reality. It is able to do a lot!

It is marker based. It supports a wide range of markers: multiple types of markers [pattern](https://artoolkit.org/documentation/doku.php?id=3_Marker_Training:marker_training)/[barcode](https://artoolkit.org/documentation/doku.php?id=3_Marker_Training:marker_barcode)
multiple independant markers at the same time, or [multiple markers acting as a single marker](https://artoolkit.org/documentation/doku.php?id=3_Marker_Training:marker_multi)
up to you to choose.

# What’s New?
Recently, we’ve been getting creative and working on developing new things with AR.js. One of them is playing around with [shadows](https://twitter.com/jerome_etienne/status/837240034847764480), syncing the position of virtual lights with reality for a more life-like finish:
![screen shot 2017-03-16 at 21 06 24](https://cloud.githubusercontent.com/assets/6317076/24018623/7f787ba8-0a8c-11e7-8088-fea4799b5d09.png)

We’ve been collaborating very closely with [Fredrick Blomqvist](https://twitter.com/snigelpaogat). His input has had a great impact on AR.js innovation and we want to thank him. Together, we’ve been implementing [refraction](https://twitter.com/jerome_etienne/status/838749280999518208), giving the 3d a transparent/glassy effect. It ended up having a nice polished look. What do you guys think?
![screen shot 2017-03-06 at 16 31 28](https://cloud.githubusercontent.com/assets/6317076/23832948/9b64c79e-0736-11e7-9cb8-747f6a8fc082.png)

Other crazy ideas we’ve been working on include a [hole in the wall](https://twitter.com/jerome_etienne/status/836754117964017664) and a [portal into another world](https://twitter.com/jerome_etienne/status/838404908235776000). We want to take AR.js to new dimensions.
![screen shot 2017-03-12 at 15 19 51](https://cloud.githubusercontent.com/assets/6317076/23833024/b2e045be-0737-11e7-9ef0-8e1ac9e49ba8.png)
![screen shot 2017-03-07 at 10 08 39](https://cloud.githubusercontent.com/assets/6317076/23833015/947f6abe-0737-11e7-9a0d-1ea919f6ffbe.png)

# Status
- At the three.js level is the main one. It is working well and efficiently
- a-frame component - it export ```<a-marker>``` tag. It becomes real easy to use.
  It allows the things three.js extension does. Here are some slides 
  [aframe-artoolkit](http://jeromeetienne.github.io/slides/artoolkit-aframe/)
- webvr-polyfill: it is kind of working - still a work-in-progress

# Augmented reality for the web in less than 10 lines of html

a-frame magic :)

```html
<script src="https://aframe.io/releases/0.5.0/aframe.min.js"></script>
<script src="https://rawgit.com/jeromeetienne/ar.js/master/aframe/build/aframe-ar.js"></script>
<script>THREEx.ArToolkitContext.baseURL = 'https://rawgit.com/jeromeetienne/ar.js/master/three.js/'</script>
<body style='margin : 0px; overflow: hidden;'>
	<a-scene embedded artoolkit='sourceType: webcam;'>
		<a-box position='0 0 0.5' material='opacity: 0.5;'></a-box>
		<a-marker-camera preset='hiro'></a-marker-camera>
	</a-scene>
</body>
```

See on [codepen](codepen.io/jeromeetienne/pen/mRqqzb) or [bl.ocks.org](https://bl.ocks.org/jeromeetienne/feeb69257803e69f18dc3ea5f4fc6d71)

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
- [profile](https://jeromeetienne.github.io/AR.js/three.js/examples/profile.html) : 
  three.js example for profile
  ([source](https://github.com/jeromeetienne/AR.js/blob/master/three.js/examples/profile.html))
- [deadreckoning](https://jeromeetienne.github.io/AR.js/three.js/examples/deadreckoning.html) : 
  Experiment with dead reckoning - not conclusive :(
  ([source](https://github.com/jeromeetienne/AR.js/blob/master/three.js/examples/deadreckoning.html))
- [hole-in-the-wall](https://jeromeetienne.github.io/AR.js/three.js/examples/hole-in-the-wall.html) : 
  three.js example for hole-in-the-wall
  ([source](https://github.com/jeromeetienne/AR.js/blob/master/three.js/examples/hole-in-the-wall.html))
- [shadow](https://jeromeetienne.github.io/AR.js/three.js/examples/shadow.html) : 
  three.js example for shadow
  ([source](https://github.com/jeromeetienne/AR.js/blob/master/three.js/examples/shadow.html))
- [refraction](https://jeromeetienne.github.io/AR.js/three.js/examples/refraction.html) : 
  three.js example for refraction
  ([source](https://github.com/jeromeetienne/AR.js/blob/master/three.js/examples/refraction.html))
- [markercloak](https://jeromeetienne.github.io/AR.js/three.js/examples/markercloak.html) : 
  three.js example for markercloak
  ([source](https://github.com/jeromeetienne/AR.js/blob/master/three.js/examples/markercloak.html))
- [liquid-marker](https://jeromeetienne.github.io/AR.js/three.js/examples/liquid-marker/) : 
  demo transforming table and wall as liquid
  ([source](https://github.com/jeromeetienne/AR.js/blob/master/three.js/examples/liquid-marker/index.html))
- [holographic-message](https://jeromeetienne.github.io/AR.js/three.js/examples/holographic-message/) : 
  A holographic-message in Augmented reality. Part of a business card for [@AndraConnect](https://twitter.com/AndraConnect)
  ([source](https://github.com/jeromeetienne/AR.js/blob/master/three.js/examples/holographic-message/index.html))
- [videoinwebgl](https://jeromeetienne.github.io/AR.js/three.js/examples/videoinwebgl.html) : 
  Add video in webgl - useful for phone-in-hmd usecase - work in progress
  ([source](https://github.com/jeromeetienne/AR.js/blob/master/three.js/examples/videoinwebgl.html))
- [videoinwebgl-stereo](https://jeromeetienne.github.io/AR.js/three.js/examples/videoinwebgl-stereo.html) : 
  Add video in webgl - useful for phone-in-hmd usecase - adding stereo - work in progress
  ([source](https://github.com/jeromeetienne/AR.js/blob/master/three.js/examples/videoinwebgl-stereo.html))

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
- [full-hatsune](https://jeromeetienne.github.io/AR.js/aframe/examples/full-hatsune.html) : 
  a-frame example for full-hatsune
  ([source](https://github.com/jeromeetienne/AR.js/blob/master/aframe/examples/full-hatsune.html))
- [minecraft](https://jeromeetienne.github.io/AR.js/aframe/examples/minecraft.html) : 
  a-frame example for minecraft
  ([source](https://github.com/jeromeetienne/AR.js/blob/master/aframe/examples/minecraft.html))
- [marker-camera](https://jeromeetienne.github.io/AR.js/aframe/examples/marker-camera.html) : 
  a-frame example for marker-camera
  ([source](https://github.com/jeromeetienne/AR.js/blob/master/aframe/examples/marker-camera.html))
- [multiple-indepandent-markers](https://jeromeetienne.github.io/AR.js/aframe/examples/multiple-independant-markers.html) : 
  a-frame example for multiple-indepandent-markers
  ([source](https://github.com/jeromeetienne/AR.js/blob/master/aframe/examples/multiple-independant-markers.html))
- [minimal](https://jeromeetienne.github.io/AR.js/aframe/examples/minimal.html) : 
  Want to do Augmented Reality on the web ? You can do it [in less than 10 lines of html now](https://twitter.com/jerome_etienne/status/842192608256512000) :)
  minimal.html is the shortest html file you need if you want to do ar.js with a-frame
  ([source](https://github.com/jeromeetienne/AR.js/blob/master/aframe/examples/minimal.html))0
- [mobile-performance](https://jeromeetienne.github.io/AR.js/aframe/examples/mobile-performance.html) : 
  a-frame example for mobile-performance
  ([source](https://github.com/jeromeetienne/AR.js/blob/master/aframe/examples/mobile-performance.html))

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

# What's Next ?

We did good on performance, but there are still a lot of room for optimisation.
Using [webworkers](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Using_web_workers) 
would increase cpu usage. Compiling in [webassembly](https://webassembly.org) instead 
of [asm.js](http://asmjs.org/) should improve loading time and likely cpu performance.
And obviously, we can still do more parameters tweaking :)


I would like people start experience augmented reality and play with it.
This is highly creative! Just look at this [puzzle game in #AR playing with mirror and laser beam](https://www.youtube.com/watch?v=OzLJb7HitvA). 
You could do it with AR.js, so opensource and running on normal phones, no need to buy a new device. isn't that great!


Augmented reality on phone have applications in many fields:
[history education](https://www.youtube.com/watch?v=gyp8ZYtyu_M)
, [science](https://www.youtube.com/watch?v=gMxdBdLpVgc)
or [gaming](https://www.youtube.com/watch?v=kEMDgvfFUcI).
I exited to see what people will do with AR.js :)


# Futures
- add webworkers
- add the nft
- handle sensor fusion with the IMU ? Assume that the marker is fixed in space
- marker removal in the video - https://twitter.com/jerome_etienne/status/838584931009835009
- dynamic multiple markers - https://github.com/artoolkit/jsartoolkit5/issues/34
- put the video in the webgl (and not the dom), as an options
- stabilizer for marker orientation and/or position
  - some tweening/smoothing on marker orientation - maybe just a lerp ?
  - it would help the shakyness especially when the source resolution is low
- stabilizer using gravity ?
  - using gravity it is possible to know if the marker is on a wall or on a table
  - once we flag the marker as on a wall, we can reduce shakyness from video detection
  - by using gravity sensor
- cloud computing to get better rendering
  - fancy name for easy tech - 
  [Capture a MediaStream From a Canvas, Video or Audio Element](https://developers.google.com/web/updates/2016/10/capture-stream)
  - have a browser on server to produce high quality 3d - aka pbs and to stream that to a phone
  - so when the phone is moving a lot, we do the local rendering
  - when the phone is stable, we do the server rendering
- social AR - https://github.com/haydenjameslee/networked-aframe/blob/master/docs/Tutorial:%20Create%20your%20first%20Networked-Aframe%20experience.md
- use a pingpong ball or a metallic ball to estimate the reality lighting
  - https://www.youtube.com/watch?v=fhFzStkoE50&feature=youtu.be&t=59 for ping pong ball
  - https://www.researchgate.net/publication/220222173_Image_Based_Shadowing_in_Real-Time_Augmented_Reality for metallic ball

# Ideas
- AR Gaming - https://www.youtube.com/watch?v=EmGGGzibGok
- AR Business Card - https://vimeo.com/4979525
- multi user AR world : much easier to code than you think - https://twitter.com/jerome_etienne/status/842219346030149632
- IDEA: produce a single image able to do qr-code and pattern marker. https://twitter.com/nlehuen/status/834115970641829888
  - about having an image able to do qr-code and pattern marker at the same time. If we have such image, we skip one step. 
  - The person first acquire the qr-code with his phone, and then it goes to a webpage which is a webar application.
  - thus the publisher only has to publish this on its ads, likely on paper ads in magazine or in the street.
  - and the user can use his phone to immediatly see the related augmented reality
  - https://techcrunch.com/2017/02/02/google-chrome-gets-its-own-qr-code-barcode-scanner/
- do something with ps vita AR cards
  - http://ie.playstation.com/media/8DokiOUp/AR%20Play%20Cards.pdf
  - print it on hard papers
  - find the kind of matrix it is.
  - just put each marker in front of the camera - using image / photo of screen
  - and go thru each and every matrix type detection
- Nice effect with video texture - https://www.youtube.com/watch?v=Y9HMn6bd-v8&feature=youtu.be&t=172

# How To Release ?

```bash
# replace REVISION to the proper version
atom three.js/threex-artoolkitcontext.js package.json

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
