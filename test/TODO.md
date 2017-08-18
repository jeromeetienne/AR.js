# TODO
  
- What to do of with FPS result ?
- how to make the test use the various performance tunning
  - e.g. on this plateform, using this performance setting is that much fps

- make it such as you can instrument any demo
  - have the .js to detect they are running in a test... how ?
  - and if running in a tests, have the profile to obey the conditions
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
