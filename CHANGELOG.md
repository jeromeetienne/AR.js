# 1.0.1-dev - Current

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
