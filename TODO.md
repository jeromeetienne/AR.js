- pack the TODO.md and all, then switch to webvr-polyfill until it works for three.js demo, then for a-frame demo


# TODO
- fix projection camera which inversing y axis, and looking toward positive z
  - this affect webvr polyfill in three.js demo. 
- currently the source image ratio is always in 640x480 :(
  - the aspect of the webcam should depends on the screens
  - it will improve the accuracy of the marker detection. trackable from further away
- do a threex-artoolkitprofile.js with various performance profile
  - var arToolKitProfile = new THREEx.ARToolKitProfile(type)
  - may be dynamic - for resolution - 'dynamic'
  - type = 'phoneInHand' || 'desktop'
  - thus the user can go a in profiler.html and try various profiles until he find the one he needs
  - then we store that in a cookie, and other applications all use this profile
  - cookie makes it stored on the browser, need one profiler per domain tho
  - but no database and no authentication needed

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
  
