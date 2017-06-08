- thresholding is working in webassembly
- now lets make it fast
- do a linear time with the incremental technique
  - do a pure average first
  - you know how to code it
  - later: do a gaussian approximentation - boxstackblur stuff which is the trick
- so you get a good idea of the speed
- so you get webassembly version from optimised c - this is the fastest it can be on the web at the moment
- good to bench webassembly
- test multiple browser - multiple resolutions
- see how hard it would be to incoporate it in threex-aruco.js



- source ~/webwork/emsdk/emsdk_env.sh


Found issues
- jsaruco use a kernel size of 2 in adaptative thresholding
  - could i reduce the resolution of the source image and use a kernel size of 1 ?
  - it would produce more fps. what the difference would be ? create errors ?
- jsaruco - adaptiveThreshold is doing it on ALL bytes - so all channel ???
  - it use blackwhite image - it only needs 1 channel - 8 bits is already a lot to store blackwhite
  - this mean 4 times more work than needed
