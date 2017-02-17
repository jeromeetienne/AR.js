# Release v1.0.0
- with tag and all
- add links in all examples
- add a index.html in each examples directories
- add docs on the options of threex-artoolkit


# include motionprediction in ArMarkerControls
- cleanup the code to park it
- DONE rename setKnownPosition into setKnownPose
- DONE refactor all the ```this._lastKnownPoseAt``` with a ```this._lastPose.createAt```
  and so on

# Misc
- handle sensor fusion with the IMU ?
- do a threex-artoolkitprofile.js with various performance profile
  - var arToolKitProfile = new THREEx.ARToolKitProfile(type)
  - may be dynamic 
  - type = 'phoneInHand' || 'desktop'
  

- make aframe resizable
  - currently it start display 3d only after a resize how come ?

- supposedly now resize is nice at three.js level
  - now to a flexible resize for aframe and webvr-polyfill

- see about webworkers
- add the nft ?

- currently the source image ratio is always in 640x480
  - i could get something better on phone
  - the aspect of the webcam should depends on the screens

- fix projection camera which inversing y axis, and looking toward positive z

# Idea about performance - js profiling
- more than 70% of the time is used to copy the image in the HEAP
  - .drawImage, .getImageData
  - this.dataHeap.set( data ) is 43% of the total
  - if i can send just a pointer on the data... i gain 43% in one shot
- ctx.imageSmoothingEnabled = false - what is the influence on performance and result ?
- performance remove copy to heap
  - http://kapadia.github.io/emscripten/2013/09/13/emscripten-pointers-and-pointers.html
  - this explains how to pass a pointer from a typearray to c++ 
  - this would avoid the dataHeap.set() - 43%
  
# DONE stuff
- DONE code angular velocity in motion prediction
- DONE about resize, there is a silly blink just after the page is loaded
  - test with all the possible source video/webcam/image
  - test on desktop, and on mobile
  - test with slow devices too
- DONE issue: aspect is not visually respected
- DONE issue: not dynamic, handle window resize
- DONE port webcam to new standard - https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/enumerateDevices
- LATER relation with stereo display ?
- LATER to have the video in webgl ? or in DOM ? should i care now ?
- LATER support .setThresholdMode(), put it in demo to test
- LATER support .setLabelingMode()


- DONE in ArToolkitContext rename parameters.imageWidth in parameters.sourceWidth
- DONE simply set the maxDetectionRate, in artoolkit context
  - and set this value to the video fps
  - if we want to reduce cpu usage, we can set maxDetectionRate below sourceVideo fps
- how to get the sourceVideo fps
- DONE issue: the screen resolution and the image resolution should NOT be the same
  - displayWidth/displayHeight to have the resolution
  - imageWidth/Height are faster when smaller
- DONE the size is set in the renderer and then propagated
- DONE able to set whatever resolution at start
- DONE video aspect ratio should be the same as the 3d canvas one

# Performance
- a 320x240 video is doing 30fps on nexus6p, without webassembly and webworker
- does the webworker version 

# TODO
- webvr-polyfill support present with stereo and good projectionMatrix
  - so the video source should be in 3d
  - isnt that silly to support that and not the resize ?
- add baseUrl in aframe system
- interaction with aframe inspector ?
  - use .update more cleverly
- init artoolkit source and load camera parameters in // in systems.init
- split in 3 repositories
  - three.artoolkit controls
  - aframe-artoolkit
  - artoolkit-webvr-polyfill
- fix the no aspect update - ask phill
- make it aframe-artoolkit in codepen
  - issue with cors
  - aframe/examples/noinstall.html
  - https://codepen.io/jeromeetienne/pen/mRqqzb?editors=1000#0
  
- import hatsune miku
  - works only on aframe.master
  - copy hatsune files on repo
- import md2 character
  - there is a threex md2character already
  - update it with other characters and new three.js
