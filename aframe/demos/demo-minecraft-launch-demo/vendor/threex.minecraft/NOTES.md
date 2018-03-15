
Note on animation based on morphtarget
======================================
* will be done with morphtarget
* more standard than mine custom system
* tQuery.Animation.prototype._buildPosition to build the geometry ?
* all in a single geometry then ?
* so the modeling is how ?
  * you take the original model, geometry + material
  * produce another geometry which merges all the body parts, with meshFaceMaterial
  * then this is the morph target
* then another function to handle the influences
  * between keyframe of a given animation
* how to smoothly handle the transition between animations 
  * it is in the influence computation

POST about building minecraft character
======================================= 

you played minecraft, you loved it, you see webgl demos, you love them.
Want about doing your own minecraft character in webgl ? would that be cool ?
ok lets do that!

# Skin
First lets pick a skin, aka the image which dresses up your character.
In WebGL, this is called a texture.

[official wiki](http://www.minecraftwiki.net/wiki/Skin) 
it even provides free skin on the official sites.

minecraft character are quite special because their texture has a very small resolution.
64 pixel wide for 32 pixel high.
Even worst, this very small image is actually an atlas of textures, aka an image composed 
of smaller images. (put image on the left)
(here is a skin)[http://127.0.0.1:8000/src/threex.minecraft/images/jetienne.png]
It is quite similar to a spritesheet you use to boost css loading (TODO put example)

The GPU takes this image and will apply it to our 3d model. So lets look closer at this image.

# texture layout

On the left you can see the layout of this images.
TODO put the image on the left
It is (from the official website)[http://www.minecraftwiki.net/wiki/File:Skintemplate.png].

It is quite schematic but it is made to be easy to understand.
As you can see some part of the texture are reserved to a certain use.
You can easily read it. you got the head on top left of the image. As the character head 
is a cube, so it has 6 faces: the top, the bottom, left, right, and the front and the back.

It is the same for each part of the body. the legs, the arms, the upper body etc...

Now we need to tell three.js which part of the image covers which faces of our model.
This is done by [setting the UV](https://en.wikipedia.org/wiki/UV_mapping).
What are UVs ? Those are 2d coordinates.
They go from 0 to 1 whatever is the pixel resolution of the images.
This is a nice convenience.
The scaling is directly done by the graphic gpu, so it is fast.
