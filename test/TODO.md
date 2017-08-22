# TODO
- What to do of with FPS result ?
- how to make the test use the various performance tunning
  - e.g. on this plateform, using this performance setting is that much fps
  - so there is a context in which we measure performance
    - plateform informations: this browser on this hardware
    - ar.js version: we did the test with this software
    - ar.js profile: we measured this particular profile
  - which test is done: e.g. fps, latency

- make it such as you can instrument any demo
  - have the .js to detect they are running in a test... how ?
  - and if running in a tests, have the profile to obey the conditions
- what about the tester being able to send the ARProfile directly
  - and the test arProfile is overwritten on .checkIfValid()

## Generate videos
- Generate the videos synthetically - draw a three.js scene and make a movie out of it - https://github.com/spite/ccapture.js/
- display a marker - aka 1x1 with a texture - display a marker area - all in all this is a marker controls
- Generating videos for test seems nice and standalone. I controls the output better than actual movies. 
  I can pick the resolution, the content, simulate the lighting. The angle. Transition speed, rotation speed
- Extend THREEx.MarkersHelpers ? you give it a ARjs.Controls and it is able to display
  - where the markers should be
  - where the markers are
  - find a good name


- make more image for test
  - multi markers
  - various angle, various lights

- DONE measure FPS
- DONE Test multi marker: learning playing
- DONE test picking
- DONE make test-runner.html to the ARjs new api
- DONE support test on video too

# Issues
- test need to fail if there is a screenshot error
- when testing on images, the 3d aspect is inproper
  - likly an issue with source resize
  
# Later
- "GUI and Headless Browser Testing" on @travisci 
  - https://docs.travis-ci.com/user/gui-and-headless-browsers/
  - It would be good to have that tested on each commit

# What to test
- various resolution/orientation
- measure latency ? make a panning movement
- screenshot - change the resolution
- screenshot - change the orientation
