- pack the TODO.md and all, then switch to webvr-polyfill until it works for three.js demo, then for a-frame demo
- aframe/examples/demo.html is buggy
  - TODO handle resize
  - fix javascript exception
  - find a new name e.g. parameters.html
  - check you got all the parameters
- option simplification in a-frame
  - remove that by using baseURL - cameraParametersUrl: https://rawgit.com/jeromeetienne/ar.js/master/data/data/camera_para.dat
  - support <a-marker preset='hiro'> to be equal to type='pattern' url='https://rawgit.com/jeromeetienne/ar.js/master/data/data/patt.hiro'
  - same for kanji

- for refraction, use shaddow and remove shaddow.html
- for refraction, use a skull, aka crustal skull
  - http://tf3dm.com/download-page.php?url=cranio-11055
  - https://www.yobi3d.com/q/skull
  - good model - see if you can get this one https://www.yobi3d.com/i/ieAvsKA6d2



# Multimarker
- how to say 'those markers will start as one'
- actually print 6 cards with matrix markers on simple papers, and play with them
- you need to ensure this is working as a setup
- multipattern seems to work on old version... not on new version
  - git checkout 8510249f1d3c20d24bcce2350b95b67c28495971
  - make it work on new version too
- first integrate the multi pattern in ar.js
- then do it dynamically
- multiple pattern
- multiple matrix - this one seems bogus even on a old one
- algo: 
  1. the user put all the marker on the table
  2. this is deemed the stable positional
  3. from all those positions, build a Multimarker
  4. init artoolkit with this multimarker
- this is all about programmation, no subtle algo

# Marker removal
- how to switch it to vertex shader
  - the UV is what is transformed on the fly
  - set it up in the geometry, and then do the change
  - change the js to match this model first
  - see about the coordinate conversion from [0, 1] uv to [-1,1] for orthographic


- take the video as texture
- push the matrix of the marker in shader
- put a plane over the whole marker (white borders included)
- for this plane, use video texture + set UV cleverly around the marker plane
- LATER: maybe some blending between the 4 borders of the full markers to make it more robuste
- needs to convert the UV thru the marker matrix
- https://www.youtube.com/watch?time_continue=172&v=-mFBraJzbZU video showing it
- https://twitter.com/jerome_etienne/status/838586924361187328 good screenshot
- first version on a picture, with uv computed in javascript
  - much easier to debug
- do that in a single html. markercache.html 
  - threex.markercache.js - this is just the plane with the special shader
  - attached to the markerRoot, provide a texture where to take the pixels
- apply the model view matrix on the UV, then the projection matrix
  - do that first in javascript, manually
  - clone markerCache.object3d.geometry.faceVertexUvs
  - change the UV on every fps
  - take the 2d vectors, convert it in 3d, apply the matrices
  - set markerCache.object3d.geometry.uvsNeedUpdate = true
  - test the matrices on the vertices - so require to have orthogonal camera and render vertices on it

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
