# reorganize the repo
- DONE rename EasyARjs into PortableARjs 
- remove webvr-polyfill
- merge to master

---

- remove all the examples which are only demos
  - aframe/demos three.js/demos instead of examples
  - maybe put them in a arjs-demos repository ?
  - currently move them in this repo, in their own directory
  - demos/three.js demos/aframe
  - make them as standalone as possible, aka copy dependancy in their
  - when it is ready
- remove three.js dependancy
- remove any tango support
- clean up data


- DONE fix the testing, seems to have projection issue on image read, works on webcam tho
- DONE import the new babylon.js port
