# webar-playground
- Create repo webar demo. If mobile then ar.js or chromiumAR. Post about it and about chromium ar
- how to store put the files in this repo
- start packing all the assets into /examples/demo-scenes
  - what about a simple demo-scenes/vendor where i copy all the files from elsewhere in the repo
  - refraction/threex.minecraft/hole-in-the-wall/holographic-message

# Demo.html

- make it possible to save/load scene from json - put json in url - thus shareable
  - each markerScene got a name/type/position/orientation/scale
  - a fullScene is an array of those
  - need to be able to build a json from current structure
  - need to be able to parse this json and create the matching scene tree
- remove the sceneName='' in the url - just store the whole scene

- get unique name when creating object
- DONE add holographic message

- picking doesnt work on mobile
  - or on horizontal aspect on desktop

- fix the hiro case
- video refraction doesnt work on chromium




---

- handle lights
- handle shadows

---
- make it easily usable on multiple marker configurations
