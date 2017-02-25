- GOAL: works well using only the positional tracking, not the stereo display
  - thus it works well with all three.js examples

- handle resize - currently the canvas isnt using the css it should
  - canvas is sent to the webvr with .requestPresent(layer)
- webvr polyfill to present in single screen - like smus/webvr-polyfill
  - look at his tuning and do the same

- LATER: make it work with a-frame
