# Introduction to LiteGL #

When developing OpenGL applications programmers have to remember lots of functions with complex names that receive several parameters of very specific types.
The nature of this syntax is to make it more powerful and flexible but could lead to very slow advance when developing common 3D applications.

This problem gets even worse in WebGL due to the nature of the Javascript language (soft-typing, garbage collection) and the browser restrictions (safety limitations, async calls).

The aim of LiteGL is to reduce this gap by wrapping most of the common WebGL 1.0 calls inside object oriented classes that represent clearer concepts (like ```GL.Texture```, ```GL.Shader``` or ```GL.Mesh```).
And adding some very useful extra functions that most 3D application will eventually need (mesh parsing, texture copying, a pool of useful shaders,...).

Also it adds the necessary functions for any browser realtime application (canvas creation, input handling, events system).

Keep in mind that LiteGL wont free you from knowing WebGL, you still will need to do regular WebGL calls to handle the GPU attributes, or to do more specific actions on Textures, Meshes, etc.
But LiteGL should make it much easier to cope with the regular actions.

LiteGL has been using in several projects over the last 4 years with very good results. From weekend GameJam projects to professional applications or open source projects.

It is in a very mature state and almost 100% bug free.

Although I keep polishing it, the library is finished and no bigger changes are expected in the future (while we wait to WebGL 2.0 to be deployed globally).

LiteGL is based in [LightGL.js by Evan Wallace](https://github.com/evanw/lightgl.js/), but some major changes were made to achieve better performance and clarity.


## Dependencies ##

LiteGL only has one dependency, [gl-matrix](http://glmatrix.net/), which helps with all the mathematical operations common in all 3D applications. gl-matrix provides classes for vector3, matrix33, matrix44 and quaternions. And because it forces to use typed-arrays the performance is very good.

To better understand the syntax check the [guide for gl-matrix](gl-matrix.md).

## Usage ##

If you want to see an example of application done in LiteGL I recommend to check the examples folder in the repository where you will find examples for every feature.

Or you can check the [guide for a basic litegl application](basic_application.md).

## The Context ##

To use WebGL we need to have a WebGL context, check [the context guide](context.md) to know how to do it.


## Classes ##

There are four classes that any WebGL developer need to create to do a basic 3D application: ```GL.Buffer```, ```GL.Mesh```, ```GL.Shader```, ```GL.Texture```.

### GL.Mesh and GL.Buffer ##

The ```GL.Mesh``` contains the geometry that must be rendered for an object.

It is just a container for several ```GL.Buffer``` which is the class that sends the data to the GPU, but ```GL.Mesh``` makes it easier to work with (loading, uploading to VRAM, generating new ones, etc).

There are also some methods to generate geometrical shapes like Spheres, Hemispheres, Boxes, etc. Check the examples to see all the shapes.

For more info read the [guide about GL.Mesh and GL.Buffer](meshes.md)

### GL.Texture ##

The ```GL.Texture``` wraps a ```WebGLTexture```. Helps to upload an image to the VRAM, apply FX or showing it to the viewport.

Because texture could come from several sources (images, video, canvas, data from memory) or in different forms (TEXTURE_2D, TEXTURE_CUBE_MAP) this class makes working with texture much easier.

For more info read the [guide about GL.Texture](textures.md)

### GL.Shader ##

```GL.Shader``` wraps a ```WebGLProgram``` so it is easier to compile, check errors, bind or pass uniforms to the shader.

It also provides some basic shaders for copying data between textures.

For more info read the [guide about GL.Shader](shaders.md)

### GL.FBO ###

Another useful trick in graphics imply rendering the scene inside a texture so it can be used in later stages, to do so you need a ```WebGLFramebuffer```. The ```GL.FBO``` class wraps it so it is much easier to attach textures and enable it.

For more info read the [guide about GL.FBO](fbos.md)

## Input and Mainloop ##

When creating an interactive application we need to ensure our code renders a frame constantly and handles the user input.

This is common in every WebGL application so LiteGL provides a convenient system to handle keyboard, mouse and gamepad inputs, and helps creating the main loop.

For more info read the [mainloop and input guide](mainloop_input.md)


## Helper classes ##

Besides the basic classes LiteGL comes with others that could help with more complex 3D applications.

### GL.Octree and GL.Raytracer ###

This class helps testing ray collision against mesh in an efficient way. An octree is constructed containing all the mesh data so it can be crawled faster when testing collisions.

To see an example of the Octree and the Raytracer check the [octree example](https://github.com/jagenjo/litegl.js/blob/master/examples/octree.html)

### geo ###

Following the gl-matrix coding style we provide a class to do basic collision detection between basic shapes (ray-sphere, ray-box, ray-plane, box-box)

### LEvent ###

Additionaly LiteGL provides a simple but fast events system so you can dispatch events from any class and trigger callbacks.

For more info read the [LEvent guide](levent.md)

## Next steps ##

Once you know how to use LiteGL if you want to do more complex application you probably will need to use a scene graph with cameras and resources managers. If that is your case, I recommend you to check [Rendeer.js](https://github.com/jagenjo/rendeer.js) (lightweight  but fast renderer) and [LiteScene.js](https://github.com/jagenjo/litescene.js) (complex but powerful renderer), libraries build on top of LiteGL.
