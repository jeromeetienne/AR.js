- redo parameters-tuning.html
  - all parameters exposed as button - stored as json in url
  - to replace the demo.html in a-frame - which is super broken anyway
  - 3 groups of parameters : source, context, controls. make it 3 group on screen too
- bug in resize + debug in context

- put armarkerhelper else where
- DONE do a threex.armarkershelper.js something which display info on the marker
  - which pattern, etc...
  - an axis too
  - like you did in threex.arealearning.js
  - if controls.parameters.helperEnabled: true, then the controls will add the helper automatically

- do the initial tunning of camera resolution to have the same aspect as the screen resolution
  - better precision for my cpu
  - currently it is doing 640x480 by default
  - as it is supposed to be fullscreen, get the screen resolution, instead of the window resolution
    - thus no resize being late issue

- put github as the default location
  - warn the cdnjs guys
  - read more about it
  - how do they handle multiple versions ?

- about.me in ar - augmented.club - augmented.whoswho - augmented.cat - augmented.fans - ar.codes
  - multiple link
  - twitter, avatar, linkedin, facebook
  - all stored in the url. so all the states is in the network
  - avatar at the center, each link graviting around, with exploding entrance like in https://vimeo.com/6264709
  - minimal: twitter avatar, username, twitter logo
  - twitter logo model - https://sketchfab.com/models/60aedf8d974d481995e196225fb0bd2e
  - logo in voxel ? https://sketchfab.com/models/8da01234347a4193b06f0b2f07113d40
  - sketchfab logo - https://sketchfab.com/models/585ace7e32b44d93bb1cecb456488934
  - gravatar from the email - http://en.gravatar.com/site/implement/hash/

- release ar.js
  - start working in dev branch
  - more frequent release.

- moving three.js/ at the root ?
  - it seems more natural. But there is no emergency
  - webvr and aframe in their own repository now that it is more stable ?

- for refraction, do some deforming mirror effect
  - put dat.gui in it
  - various shape which will act as mirrors
  - cylinder with shrinked middle, dilated middle
  - animated geometry ?

- see about an example of videoinwebgl + vreffect
- work on the stereo thing - make the webvr stuff
  - suddently your demo would work on any webvr device
  - does this work if i port video-in-webvr into aframe ? what if we go in webvr mode ?

- what to do with profile
  - should it be the default ?
  - at least on a-frame it should be the default because it is targeted at easy
  - by default, the setting should be the most common one. 
  - aka the one of a phone

- "Augmented Reality in WebVR" as WebVR experiments... It has a nice twist that 
  i like :)  http://www.blog.google/products/google-vr/come-play-webvr-experiments/

- DONE fix the multimarker and the symlink - it prevents updating ar.js gh-pages
- DONE add show/hide into arcode.html url
  - thus the apps workflow is finished
- DONE do a build file
  threejs/build/ar.js
  threejs/build/ar.min.js

- DONE re-integrate dead reckoning
  - rename motion prediction into deadreckoningcontrols - more precise
- DONE put THREEx.ArToolkitContext.baseURL = '../' in all demo
- DONE add fish in pool hole-in-the-wall
  - https://blog.int3ractive.com/2012/05/fish-boids-threejs-demo.html
- DONE put liquid marker as a single html
  - or a directory, no need to be dirty
- DONE liquid-table.html
  - video texture + animation of sin 
  - center of finger click is the center of the wave
  - it can be water wave
  - it can be fluild real 
  - integrate physics from real finger
  - it can be like the finger in matrix - https://www.youtube.com/watch?v=b2MSF35IxVE&feature=youtu.be&t=98
  - http://mrdoob.com/lab/javascript/webgl/voxels_liquid/index.html

  


# webvr-polyfill
- GOAL: works well using only the positional tracking, not the stereo display
  - thus it works well with all three.js examples
- handle resize - currently the canvas isnt using the css it should
  - canvas is sent to the webvr with .requestPresent(layer)
- webvr polyfill to present in single screen - like smus/webvr-polyfill
  - look at his tuning and do the same
  - just do the call on the webvr-polyfill and see his framedata and all
- issue with the projection matrix being inverse in y and z
- LATER: make it work with a-frame

# Profile
- do a threex-artoolkitprofile.js with various performance profile
  - var arToolKitProfile = new THREEx.ARToolKitProfile(type)
  - may be dynamic - for resolution - 'dynamic'
  - type = 'phoneInHand' || 'desktop'
  - thus the user can go a in profiler.html and try various profiles until he find the one he needs
  - then we store that in a cookie, and other applications all use this profile
  - cookie/localstorage makes it stored on the browser, need one profiler per domain tho
  - but no database and no authentication needed
- DONE artoolkit-profile.html to store the profile in localstorage
  - it allows you to select which profile you like
  - it has a <select> and store it in the storage - desktop-normal - phone-normal - phone-slow - dynamic
  - in ctor, if there is a local storage use this

# TODO
- DONE fix projection camera which inversing y axis, and looking toward positive z
  - this affect webvr polyfill in three.js demo
- currently the source image ratio is always in 640x480 :(
  - the aspect of the webcam should depends on the screens
  - it will improve the accuracy of the marker detection. trackable from further away

# Idea about performance - js profiling
- do it on canary. this is the most advanced tool for that
  - POST: optimising AR.js with chromedevtools
- more than 70% of the time is used to copy the image in the HEAP
  - .drawImage, .getImageData
  - this.dataHeap.set( data ) is 43% of the total
  - if i can send just a pointer on the data... i gain 43% in one shot
- performance remove copy to heap
  - http://kapadia.github.io/emscripten/2013/09/13/emscripten-pointers-and-pointers.html
  - this explains how to pass a pointer from a typearray to c++ 
  - this would avoid the dataHeap.set() - 43%
