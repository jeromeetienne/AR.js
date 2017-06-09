

Found issues
- jsaruco use a kernel size of 2 in adaptative thresholding
  - could i reduce the resolution of the source image and use a kernel size of 1 ?
  - it would produce more fps. what the difference would be ? create errors ?
- jsaruco - adaptiveThreshold is doing it on ALL bytes - so all channel ???
  - it use blackwhite image - it only needs 1 channel - 8 bits is already a lot to store blackwhite
  - this mean 4 times more work than needed
  - NOTES: unclear this is true - grayscale is packing it all in 1 channel. check it out ?


# API issue
- missing videoElement.getImageData(). It is only available in canvas context
  - cause a canvasContext.drawImage(videoElement) + canvasContext.getImageData()
- missing getImageData() .data directly as SharedArrayBuffer
  - new API ? imageData = contextCanvas.getImageData(x, y, width, height, dstImageData)
- inability to pass a buffer i want to WebAssembly without copying
