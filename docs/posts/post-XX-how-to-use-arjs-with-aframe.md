# post for a-frame blog
how to make augmented reality with AR.js

Dont worry, you can do it with only 8 line of html.


# introduction
- what is ar.js.
- work on any device
- work on android, ios11 and window mobile.
- totally open source
- link to the github repo

# Show dont tell 
- augmented reality in 10 line of html
- link to codepen
- explain the difference with the normal aframe boilerplate

# Explain personalise the 3d content
- add a text on top as an alternative personalisation
- Explain how to load a model on top of a marker

# Explain how to setup your own marker
We wrote a marker generator to help you build your own markers.
- https://medium.com/arjs/how-to-create-your-own-marker-44becbec1105
- https://jeromeetienne.github.io/AR.js/three.js/examples/marker-training/examples/generator.html

This time dont forget to explain what to do with the generated file

- list complete of options

# Explain the 2 type of markers
- barcode and pattern
- like to the pattern generator
- explain the preset

# How to handle multiple distinct markers
- link to measure it example
- video of it
- what's the use

# Move the camera or the object ?
- explain the various mode.
- Typically when you are markers in 3d, you 
  - the camera is fixed at 0, 0, 0 and looks toward negative z.
  - it remains fixed during the whole thing.
  - we move the marker in front of the camera, so somewhere in negative z.
- this is fine but its axis is quite counterintuitive.
- So i added a mode when you get one marker, it is at 0, 0, 0 and instead
  we move the camera around.
  
- Those 2 modes are available in AR.js:
  - changeMatrixMode : 'modelViewMatrix'
  - changeMatrixMode : 'cameraTranformMatrix'
