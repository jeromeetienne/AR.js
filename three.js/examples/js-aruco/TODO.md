- Check js implementation and their multi channels issue

- tried with prepacked
- try with webassembly
- try with webworker
  - how to use webworker ?
  - split the processing of the original image
  - so gray scale + adatative threshold - splitted in 4 zones for 4 cpu
- https://github.com/andrei-markeev/ts2c
---
# webworker usage
- in 640x480, it take 18.3ms for context.detect
  - 13.84ms for greyscale + adaptative threshold - 75% of the whole!
- it is doable on GPU too
- greyscale is per pixel
- adaptative threshold needs a local average blur and then it is per pixel


- there is a pool of workers
  - and add task to it
  - doing the greyscale 
  - doing the horizontal blur
  - doing the vertical blur
- demo where you read the webcam and filter it with this

---
- see how to include it in ar.js
  - so basically a context and a controls
  - the source can remain the same without trouble
- how to handle all the options between the various backend
