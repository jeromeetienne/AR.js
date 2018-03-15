# reorganize the repo
- DONE rename EasyARjs into PortableARjs 
- DONE remove webvr-polyfill

- merge to master

- in demos/ and experiments/ avoid to have .html directly, move each experiments in its own folders
- make a nice examples of face tracking
- in threex.jsaruco
  - fix path in examples
  - experiments with focal change - dat.gui to tune 
  - can you find a value which works on macbook
- multi-marker: put threex.screenasportal elsewhere ?
  - three.js/demos ? YES
  - http://127.0.0.1:8080/three.js/examples/multi-markers/examples/threex-screenasportal/
- multi-marker: make ar.js marker by default in the multi marker screen

- remove all the artoolkit in classname and filename
  - just keep a layer for backward compatibility
- DONE put three.js/experiments/shadow markercloak + liquid-marker as /demos

---

- remove three.js dependancy
- remove any tango support
- clean up data


- DONE fix the testing, seems to have projection issue on image read, works on webcam tho
- DONE import the new babylon.js port
