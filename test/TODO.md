# TODO
- Test multi marker: learning playing
- measure performance
  - e.g. fps. run the test for say 5sec and then extract an average
  - should i use stats.js. my own specific measurement
  - console.time ?
  - can i get this result ? my own simple performance.now() substract
  - 
- make it such as you can instrument any demo
- make more image for test
  - multi markers
  - various angle, various lights

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
