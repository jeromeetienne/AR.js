- do a threex-artoolkitprofile.js with various performance profile
  - var arToolKitProfile = new THREEx.ARToolKitProfile(type)
  - may be dynamic 
  - type = 'phoneInHand' || 'desktop'
  - thus the user can go a in profiler.html and try various profiles until he find the one he needs
  - then we store that in a cookie, and other applications all use this profile
  - cookie makes it stored on the browser, need one profiler per domain tho
  - but no database and no authentication needed

# Big tasks
- see about webworkers
- add the nft ?
- handle sensor fusion with the IMU ?

- currently the source image ratio is always in 640x480
  - i could get something better on phone
  - the aspect of the webcam should depends on the screens

- produce a single image able to do qr-code and pattern marker. https://twitter.com/nlehuen/status/834115970641829888
  - about having an image able to do qr-code and pattern marker at the same time. If we have such image, we skip one step. 
  - The person first acquire the qr-code with his phone, and then it goes to a webpage which is a webar application.
  - thus the publisher only has to publish this on its ads, likely on paper ads in magazine or in the street.
  - and the user can use his phone to immediatly see the related augmented reality

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
  
