# WebAR - Efficient augmented reality for the web

I am focusing hard on making WebAR a reality. 
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

1. Direct your android browser to [this url](https://jeromeetienne.github.io/WebAR/three.js/examples/performance.html)
  It will open a webpage which read the phone webcam, localise an hiro marker and add 3d on top of it
2. Point your phone at a hiro marker. Here is an example of [hiro marker](http://wibiwardhono.lecture.ub.ac.id/files/2015/01/HIRO.jpg).
  you can print the marker too or 
  you can just display the hiro marker on desktop screen and point your phone at it. Like below.

![screenshot](https://cloud.githubusercontent.com/assets/252962/23072106/73a0656c-f528-11e6-9fcd-3c900d1d47d3.jpg)

# Status
- At the three.js level is the main one. It is working well and efficiently
- a-frame component allow everything three.js extension can do
  - there is a resize issue at the moment. it is being worked out
  - beyond this issue it is working without any known issues
- webvr-polyfill: it is kind of working - still a work-in-progress

# Examples

- [cameratransform](https://jeromeetienne.github.io/WebAR/three.js/examples/cameratransform.html) 
  three.js example for cameratransform
  - [source](https://github.com/jeromeetienne/WebAR/blob/master/three.js/examples/cameratransform.html)


# Folders
- ```/three.js``` is the extension to use it with [pure three.js](https://threejs.org)
- ```/aframe``` is the extension to use it with [a-frame](https://aframe.io)
- ```/webxr``` is the WebVR polyfill so you can reuse your #AR / #VR content easily

# Licenses
It is **all open source** ! jsartoolkit5 is under LGPLv3 license and additional permission.
And All my code in WebAR repository is under MIT license. :)

For legal details, be sure to check [jsartoolkit5 license](https://github.com/artoolkit/jsartoolkit5/blob/master/LICENSE.txt)
and [WebAR license](https://github.com/jeromeetienne/WebAR/blob/master/LICENSE.txt).


# Change Log
[CHANGELOG.md](https://github.com/jeromeetienne/WebAR/blob/master/CHANGELOG.md)
