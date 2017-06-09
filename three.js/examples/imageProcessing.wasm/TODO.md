# Browser API issue
- missing videoElement.getImageData(). It is only available in canvas context
  - cause a canvasContext.drawImage(videoElement) + canvasContext.getImageData()
- missing getImageData() .data directly as SharedArrayBuffer
  - new API ? imageData = contextCanvas.getImageData(x, y, width, height, dstImageData)
- inability to pass a buffer i want to WebAssembly without copying
