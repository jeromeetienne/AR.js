# post2 for a-frame blog
how to make augmented reality with AR.js

Dont worry, you can do it with only 8 line of html.

---

# introduction
- what is ar.js.
- work on any device
- work on android, ios11 and window mobile.
- totally open source and free of charge
- link to the github repo

AR.js is efficient Augmented Reality for the Web.

It runs 100% in your web browser.
no app to install.
no need for specific devices e.g. tango or iphone.
It run fast, 60fps on 2year-old phone.

It run on every plateform: android, ios11 and window mobile.

looks good ? let see how to use it 

# Show Dont Tell 
Today you can make
[augmented reality in 10 Lines of HTML](https://medium.com/arjs/augmented-reality-in-10-lines-of-html-4e193ea9fdbf), isn't the web amazing ?
You can try live on [codepen](https://codepen.io/jeromeetienne/pen/mRqqzb).



```html
<script src="https://aframe.io/releases/0.5.0/aframe.min.js"></script>
<script src="https://jeromeetienne.github.io/AR.js/aframe/build/aframe-ar.js"></script>
<body style='margin : 0px; overflow: hidden;'>
	<a-scene embedded artoolkit='sourceType: webcam;'>
		<a-box position='0 0.5 0' material='opacity: 0.5;'></a-box>
		<a-marker-camera preset='hiro'></a-marker-camera>
	</a-scene>
</body>
```

- explain the difference with the normal aframe boilerplate


# Explain personalise the 3d content
The most asked questions 
is "how to load my own model ?"
- add a text on top as an alternative personalisation
- Explain how to load a model on top of a marker

How to add a text on top of the marker ?

Simple just use [a-text](https://aframe.io/docs/0.5.0/primitives/a-text.html)

```html
<a-entity
  geometry="primitive: plane; width: 4; height: auto"
  material="color: blue"
  text="value: This text will be 4 units wide."></a-entity>
```

# Explain how to setup your own marker
We wrote a marker generator to help you build your own markers.
- https://medium.com/arjs/how-to-create-your-own-marker-44becbec1105
- https://jeromeetienne.github.io/AR.js/three.js/examples/marker-training/examples/generator.html

This time dont forget to explain what to do with the generated file

- list complete of options

In order to make the common case easier, it offers some presets configuration for markers.
e.g. ```preset: 'hiro'``` to have the classical pattern hiro marker, or ```preset: 'kanji'```
for kanji.

When you have generator with own markers, the page will provide a ```pattern-marker.patt```.
This file contains the encoded marker that you should reuse in your code.
So for our case, with ```<a-marker-camera>```, it should be replaced by the following.

```html
<a-marker-camera type='pattern' patternUrl='path/to/pattern-marker.patt'></a-marker-camera>
```

You specify you want a pattern marker and you give the url to find the one you want.
Simple enough.


# Explain the 2 type of markers
- barcode and pattern
- like to the pattern generator
- explain the preset

Have you notice the ```type``` attribute ? this is for the type of markers. There is currently 
2 kind of markers
- barcode
- pattern
  - it matches a given image


http://www.artoolworks.com/support/library/Using_2D-barcode_markers

http://www.artoolworks.com/support/library/Creating_and_training_new_ARToolKit_markers

http://www.artoolworks.com/support/applications/marker/

To use a barcode marker, set the type='barcode' and value to

```html
<a-marker-camera type='barcode' value='42'></a-marker-camera>
```

detectionMode: mono_and_matrix; matrixCodeType: 3x3;'

You have to tell AR.js that you are using barcode markers

detectionMode: mono_and_matrix

type of barcode you are using - (TODO what is the list of barcode you can use)
matrixCodeType: 3x3

```html
<a-scene embedded 
  artoolkit='sourceType: webcam; detectionMode: mono_and_matrix; matrixCodeType: 3x3;'>
```


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
