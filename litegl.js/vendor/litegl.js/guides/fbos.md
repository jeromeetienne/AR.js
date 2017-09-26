# FBOs

FrameBufferObjects (or FBOs) are a way to tell the GPU to render the frame to a texture (or several) instead of the screen.

This is very useful for many common algorithms (like shadowmapping, reflections, postprocessing fx) and also could be helpful to generate textures on the fly.

The ```GL.FBO``` class makes it easy to use FrameBufferObjects.

## Usage

First we need to create the texture where we want to render the scene, and then create the FBO with the texture attached to it:

```js
var texture = new GL.Texture(512,512, { magFilter: gl.LINEAR });
var fbo = new GL.FBO([texture]);
```

One created if we want to render the scene inside the texture, we must bind the FBO, do the render calls and once finished rendering inside the texture, unbind it:

```js
fbo.bind();
//you render code here
gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT );
//...
fbo.unbind();
```

Now the texture contains the whole render, you can use it in further render calls.

```js
texture.toViewport(); //will show it on the screen
```

## Using more than one texture

WebGL supports rendering the scene to more than one texture, this is needed if you plan to use a deferred rendering pipeline.
Here is how you can do it:

```js
//creating the textures for the FBO
var w = gl.canvas.width;
var h = gl.canvas.height;
var texture_albedo = new GL.Texture(w,h, { type: type, filter: gl.NEAREST });
var texture_normal = new GL.Texture(w,h, { type: type, filter: gl.NEAREST });
var texture_depth = new GL.Texture(w,h, { format: gl.DEPTH_COMPONENT, type: gl.UNSIGNED_INT, filter: gl.NEAREST }); 
var textures = [ texture_albedo, texture_normal ];
var fbo = new GL.FBO( textures, texture_depth ); //the second parameter can be a depth texture
```

As you can see we not only created two color textures (texture_albedo and texture_normal), we also created a depth texture (texture_depth) that will contain the depth buffer.

Remember that the FBO requires that all color textures have the same settings (size, format, etc).

## Using texture.drawTo(...)

There is another way to render to a texture if you dont want to create the FBO, you can use the drawTo method in the class texture, this is a little bit slower though:

```js
var texture = new GL.Texture(512,512, { magFilter: gl.LINEAR });
texture.drawTo( function(){
   //render code
   //...
});
```

Check the [examples folder](https://github.com/jagenjo/litegl.js/tree/master/examples) to see more about FBOs.
