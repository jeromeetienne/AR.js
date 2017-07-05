# How To Easily Create Your Own Augmented Reality with AR.js
## Don't Worry It's Less Than 10 Lines of HTML 


AR.js is an efficient Augmented Reality solution on the Web. 
It runs 100% in your web browser, this means no app to install! 
There is no need for a specific device either e.g. tango or iphone. 
It runs on all mobile platforms: Android, iOS11 and Windows mobile.
You can use it with your own phone. 
Depending on your device, it can run very fast, up to 60fps on 2year-old phones!
On top of that, the code is open source and all available on [github](https://github.com/jeromeetienne/ar.js).

![screen shot 2017-04-01 at 14 36 00](https://user-images.githubusercontent.com/6317076/27866704-452eaed6-618f-11e7-9cdd-2deaef865e3e.png)

A-frame is very easy to use so I wanted to make sure that AR.js was working well with a-frame.
Thus, combining a-frame and AR.js, it's simple for everybody to create AR content on the web. 

Sounds good? Let's see how to use it.  

# Show Dont Tell 
[![screen shot 2017-07-05 at 14 40 01](https://user-images.githubusercontent.com/6317076/27867019-5c4699d4-6190-11e7-831b-e8251711acdf.png)](https://www.youtube.com/watch?v=v_Uj0C8sMi4&feature=youtu.be&utm_content=buffer22f18&utm_medium=social&utm_source=twitter.com&utm_campaign=buffer)
(OR EMBED VIDEO IN THE POST)

Today you can make
[augmented reality in 10 Lines of HTML](https://medium.com/arjs/augmented-reality-in-10-lines-of-html-4e193ea9fdbf), isn't the web amazing ?
It is really that simple, you can try live on [codepen](https://codepen.io/jeromeetienne/pen/mRqqzb).
Just put a [hiro marker](https://github.com/jeromeetienne/AR.js/blob/master/data/images/HIRO.jpg) in front
of the camera and we will add the augmented reality on it.


```html
<!-- include aframe obviously -->
<script src="https://aframe.io/releases/0.6.0/aframe.min.js"></script>
<!-- include ar.js for a-frame -->
<script src="https://jeromeetienne.github.io/AR.js/aframe/build/aframe-ar.js"></script>
<body style='margin : 0px; overflow: hidden;'>
	<a-scene embedded arjs='sourceType: webcam;'>
		<!-- create your content here. just a box for now -->
		<a-box position='0 0.5 0' material='opacity: 0.5;'></a-box>
		<!-- define a camera which will move according to the marker position -->
		<a-marker-camera preset='hiro'></a-marker-camera>
	</a-scene>
</body>
```

In this scene, the camera is being moved by AR.js, and 
the origin of your scene is at the center of the marker. 
All the rest is normal a-frame. 
So if you want to add new objects in the augmented reality, just add it 
near the ```<a-box>```.


# How to add AR.js in your A-Frame Project
![screen shot 2017-07-05 at 14 22 23](https://user-images.githubusercontent.com/6317076/27867071-8833eaf6-6190-11e7-9fb9-9deac93b88bd.png)

This is 2 steps only

1. Tell a-aframe to start ar.js
2. setup the camera to move according to the markers

So first you include aframe-ar.js, then declare a-scene to 
add the parameters for arjs.

TODO to complete

- ```embedded```


- explain the difference with the normal aframe boilerplate

- Please ignore the body style and a-scene embedded attribute. 
those are glitch which are meant to disapear shortly. 

# Personalize your AR Content
![screen shot 2017-07-05 at 14 45 35](https://user-images.githubusercontent.com/6317076/27867143-bf05926e-6190-11e7-855f-a90ab71976fc.png)

Now we have a basic cube in AR...
it would be good to personalise AR a bit. Let's see how to add a text, an image or even your 
own model in augmented reality.

One of the most asked questions has been "how to load my own model in AR?".
As said before, ar.js controls the displacement of the camera, all the rest
is classic a-frame. So you can load a model exactly as you would in 
a-frame. 
Here is an example of loading a [gltf](https://www.khronos.org/gltf) model, just add that in your a-scene.
For more detail see [a-frame documentation about models](https://aframe.io/docs/0.5.0/introduction/models.html#sidebar).

```html
<!-- define your gltf asset -->
<a-assets>
	<a-asset-item id="tree" src="/path/to/tree.gltf"></a-asset-item>
</a-assets>
<!-- use your gltf model -->
<a-entity gltf-model="#tree"></a-entity>
```

Another way to easily personalize your AR is to put a text or an image on top.
To add a text, simply just use [a-text](https://aframe.io/docs/0.5.0/primitives/a-text.html) as below.

```html
<a-text value="Hello, World!"></a-text>
```

To add an image, [a-image](https://aframe.io/docs/0.5.0/primitives/a-image.html) is easy. Just paste this in your a-frame scene.

```html
<a-image src="another-image.png"></a-image>
```

# Customize your Marker
![arjs marker training](https://user-images.githubusercontent.com/6317076/27867192-e55306b8-6190-11e7-9bd1-7a9dbf4fa76a.png)

We understand that many people want to personalize the marker. It is possible to replace the Hiro pattern with your own image, as long as it is inside the black border.
We have provided an easy way to this. It is called the [marker generator](https://jeromeetienne.github.io/AR.js/three.js/examples/marker-training/examples/generator.html).
We even wrote a whole step by step [post](https://medium.com/arjs/how-to-create-your-own-marker-44becbec1105) to help you get started. 

First you upload your own image and generate a pattern file ```pattern-marker.patt```.
Second, you download the trained marker. And third, potentially print your marker.
We provide a PDF file to make it easier for you.

What to do with the generated pattern file?
This file contains the encoded marker that you should reuse in your code.
You specify you want a pattern marker and you provide the url to your own marker. 
So in our case ```<a-marker-camera>``` should be replaced by the following.

```html
<a-marker-camera type='pattern' patternUrl='path/to/pattern-marker.patt'></a-marker-camera>
```

Simple enough.


# Explain the 2 type of markers

Pattern Marker 
![screen shot 2017-07-05 at 14 50 43](https://user-images.githubusercontent.com/6317076/27867388-64baee98-6191-11e7-9fbe-586fd79eba9d.png)

Barcode Marker
![screen shot 2017-07-05 at 14 50 56](https://user-images.githubusercontent.com/6317076/27867389-64d880d4-6191-11e7-88cb-e7417dee258d.png)

TODO to complete

- barcode and pattern
- like to the pattern generator
- explain the preset

**About Presets:**
In order to make the common case easier, it offers some presets configuration for markers.
e.g. ```preset: 'hiro'``` to have the classical pattern hiro marker, or ```preset: 'kanji'```
for kanji.


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
arjs='sourceType: webcam; detectionMode: mono_and_matrix; matrixCodeType: 3x3;'>
```


# Move the camera or the marker ?

When handling augmented reality, you need to decide if you want the 
3d world origin to be the camera or the marker. Most people will use
the marker as origin because it is more intuitive. Let's see the details
of each mode.

In one mode, you use ```<a-marker-camera>```. In this mode, the camera is moving and the marker is static, fixed at 0,0,0.
This way to work is more common for 3d programmers, so it is the one I use in most examples.

```html
<a-marker-camera preset='hiro'></a-marker-camera>
```


In the other mode, you use ```<a-marker>```.
It behaves the other way around: the camera is static at all times while the objects or markers are moving.
The camera is fixed at 0,0,0 at all times and looks toward negative-z.
Nevertheless this mode got a limitation, it can't handle multiple independent markers at once.
So if you have multiple markers and want to handle them independently from each other 
e.g. like in [this video](https://www.youtube.com/watch?v=dIEZwmjuaUA&list=PL2oSKUSmuoTECUCvHDvifRhztkOYduQsq&index=10).
You will need to use ```<a-marker>```, and a simple camera instead. 


```html
<!-- define your markers -->
<a-marker preset='hiro'>
	<!-- here define the content to display on top of the marker -->
	<a-box position='0 0.5 0' material='color: red;'></a-box>
</a-marker>
<!-- define a simple camera -->
<a-entity camera></a-entity>
```

![screen shot 2017-07-05 at 14 53 43](https://user-images.githubusercontent.com/6317076/27867514-c85fefb6-6191-11e7-99c4-2091ab0a6fd1.png)

TODO transition ?

# How to handle multiple distinct markers

TODO to complete
- link to measure it example
- video of it
- what's the use

- e.g. you can see it in this [multiple independent markers example](https://jeromeetienne.github.io/AR.js/aframe/examples/multiple-independent-markers.html)

```html
<script src="https://aframe.io/releases/0.6.0/aframe.min.js"></script>
<script src="https://jeromeetienne.github.io/AR.js/aframe/build/aframe-ar.js"></script>
<body style='margin : 0px; overflow: hidden;'>
	<a-scene embedded arjs='sourceType: webcam;'>
		<!-- handle marker with your own pattern -->
		<a-marker type='pattern' patternUrl='path/to/pattern-marker.patt'>
			<a-box position='0 0.5 0' material='color: red;'></a-box>
		</a-marker>

		<!-- handle marker with hiro preset -->
		<a-marker preset='hiro'>
			<a-box position='0 0.5 0' material='color: blue;'></a-box>
		</a-marker>

		<!-- handle barcode marker -->
		<a-marker type='barcode' value='5'>
			<a-box position='0 0.5 0' material='color: pink;'></a-box>
		</a-marker>

		<!-- add a simple camera -->
		<a-entity camera></a-entity>
	</a-scene>
</body>
```

# Conclusion
In this post we have seen how to do efficient Augmented Reality with AR.js, and how to add it to your A-Frame project. 
We now know how to customize content in AR and make it more personal. 
We've also learned that it's possible to create your own marker with an easy-to-use marker generator.
Finally, we've learned how to handle the camera and use multiple distinct markers. 
This is a lot! Congrats on getting to the end without quitting ;)

I hope you all start creating amazing things with AR.js and A-Frame. Don't forget it's open source, so your imagination is the limit! 

Thanks for reading. Cheers! 
