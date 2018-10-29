# Porting thinner border
- DONE make the generator.html able to tune setPattRatio
- add a test in three.js/test
  - able to set setPattRatio
- change that i broke something ? super unlikely
  - be sure not to leave a mess tho
  - where to put an example ?
  - only aframe examples
  - currently there are 2 examples
- check that it works well, then commit to dev and release to master
- how to know if it works well ?
  - test manually
  - add example in aframe
  - add a test
    - just take an picture of the generator with a marker
    - TODO make test-runner.html to accept url of the image i want

- test for setPattRatio
  - aframe doesnt load image in test-runner.html - but works in default-tinner-border.html
  - but work in three.js/test-runner.html so likely a small issue in ar.js aframe
- change test-runner to get sourceImageURL in the query
  - change the formats2
---

- threex.jsaruco see about tuning the fov manually
- in threex.jsaruco
  - fix path in examples
  - experiments with focal change - dat.gui to tune
  - can you find a value which works on macbook
- multi-marker: put threex.screenasportal elsewhere ?
  - three.js/demos ? YES
  - http://127.0.0.1:8080/three.js/examples/multi-markers/examples/threex-screenasportal/
- multi-marker: make ar.js marker by default in the multi marker screen


---
# Clean AR.js
- remove all the artoolkit in classname and filename
  - just keep a layer for backward compatibility
- remove three.js dependancy
- remove any tango support
- clean up data

---

- DONE put three.js/experiments/shadow markercloak + liquid-marker as /demos
- DONE in arjs-face make a nice examples of face tracking
- DONE rename EasyARjs into PortableARjs
- DONE remove webvr-polyfill
- DONE merge to master
- DONE in demos/ and experiments/ avoid to have .html directly, move each experiments in its own folders
- DONE fix the testing, seems to have projection issue on image read, works on webcam tho
- DONE import the new babylon.js port
