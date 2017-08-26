# TODO
- make a babylon.js test

- What to do of with FPS result ?

- make it such as you can instrument any demo
  - have the .js to detect they are running in a test... how ?
  - and if running in a tests, have the profile to obey the conditions
- what about the tester being able to send the ARProfile directly
  - and the test arProfile is overwritten on .checkIfValid()

# Issues
- when testing on images, the 3d aspect is inproper
  - likly an issue with source resize


## Generate videos
- Generate the videos synthetically - draw a three.js scene and make a movie out of it - https://github.com/spite/ccapture.js/
- display a marker - aka 1x1 with a texture - display a marker area - all in all this is a marker controls
- Generating videos for test seems nice and standalone. I controls the output better than actual movies. 
  I can pick the resolution, the content, simulate the lighting. The angle. Transition speed, rotation speed
- Extend THREEx.MarkersHelpers ? you give it a ARjs.Controls and it is able to display
  - where the markers should be
  - where the markers are
  - find a good name




- DONE test need to fail if there is a screenshot error
- DONE measure FPS
- DONE Test multi marker: learning playing
- DONE test picking
- DONE make test-runner.html to the ARjs new api
- DONE support test on video too

# What to test
- various resolution/orientation
- measure latency ? make a panning movement
- screenshot - change the resolution
- screenshot - change the orientation
- make more image for test
  - multi markers
  - various angle, various lights
