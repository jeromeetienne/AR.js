# Post-processing and Camera FX #

It is common to apply post-processing FX to the image rendered to give it a final touch.

LiteScene provides some Components that help apply those efects, but it also provides an API that makes very easy to create your own FX manually.

## Camera or Global Effects ##

There is one thing to keep in mind when creating an FX: if you want it applied to a single camera viewport or to the final frame.
If you want to apply it to the camera then the FX should be binded to the camera, otherwise if should be binded to the whole scene.

## RenderFrameContext ##

To apply any FX to an image first we need to render the scene to a texture, and then apply the effect to the content of that texture.

But creating and setting the texture to render could be a complex process, also you need to keep in mind several situations:
- Which size should the texture be? That would depend on the viewport size which is affected by the window size and the camera viewport.
- Which type should the texture be? Maybe we can render to a low-precision texture, but in some cases we may need high precision.
- What if we want to store the depth buffer also in a texture to use it in our effects?
- What if I want to render to several textures at the same time? GPUs allow to output to several texture to have extra info per pixel.
- How to render the final buffer to the screen?

To help tackling those situations LiteScene provides a special class called LS.RenderFrameContext. Here is a list of the properties:

- **width** and **height**: this defines the final size of the texture, if width or height is 0 then the respective size of the viewport will be used. If we want to downscale the viewport size we can use negative numbers (-1 means half, -2 a quater, etc).
- **precision**: here you can specify the data type of the texture, values are: 
  - **RenderFrameContext.DEFAULT_PRECISION**: gl.UNSIGNED_BYTE (alghough it could be changed with the var RenderFrameContext.DEFAULT_PRECISION_WEBGL_TYPE)
  - **RenderFrameContext.LOW_PRECISION**: gl.UNSIGNED_BYTE Good for regular renderings
  - **RenderFrameContext.MEDIUM_PRECISION**: gl.HALF_FLOAT_OES if supported, otherwise gl.FLOAT, otherwise, gl.UNSIGNED_BYTE (good for renders which very bright spots that need to preserve them after FX)
  - **RenderFrameContext.HIGH_PRECISION**: gl.FLOAT if supported (otherwise gl.UNSIGNED_BYTE) Good for deferred (slow)
- **filter_texture**: in case you want to set the magFilter of the final color_texture to NEAREST, so it looks pixelated.
- **adjust_aspect**: in case the frame has an aspect ratio of the final viewport, this forces the renderer to correct it.
- **use_depth_texture**: allows to store the depth in another texture so it can be used in the effects.
- **num_extra_textures**: number of additional textures to bind as render buffer

To enable a RenderFrameContext just call ```enable```, and when finished call ```disable```. To show it on the screen call ```show``` although if you want to apply any FX you can read the textures using the ```getColorTexture``` method.

## FXGraphComponent ##

Another way to apply FX is using the graph system. This way is much more intuitive but it consumes way more memory (because every graph node uses its own texture).
Just connect the "Rendered Frame" graph node to any gltexture node and the final output to viewport.

## Using a Script ##

When using scripts you can easily create your own effects, here is an example:

```javascript
//@SimpleCameraBlurFX

this.high_precision = false;
this.iterations = 4;

var frame = new LS.RenderFrameContext();
frame.width = 0;
frame.height = 0;
frame.precision = LS.RenderFrameContext.LOW_PRECISION;
frame.filter_texture = true;

this.onEnableFrameContext = function()
{
	frame.precision = this.high_precision ? LS.RenderFrameContext.MEDIUM_PRECISION : LS.RenderFrameContext.LOW_PRECISION;
  frame.enable();
}

this.onShowFrameContext = function()
{
	frame.disable();
  var tex = frame.getColorTexture();

  var tmp = GL.Texture.getTemporary( tex.width, tex.height, { type: tex.type  } );
  var tmp2 = GL.Texture.getTemporary( tex.width, tex.height, { type: tex.type  } );
  
  tex.copyTo( tmp );
  
  var iterations = Math.clamp( this.iterations, 0, 20 );
  for(var i = 0; i < iterations; ++i )
  	tmp.applyBlur(1<<i,1<<i,1,tmp2);
                  
  tmp.toViewport();
  
  GL.Texture.releaseTemporary(tmp);
  GL.Texture.releaseTemporary(tmp2);
 
}
```

## TextureFX ##

Also LiteScene provides a nice and fast way to apply several common effects to a texture. You need to use the LS.TextureFX class.

This class allows to concatenate different basic effects (like vigneting, brightness and contrast, edge detection) and pack all the efects in one single shader automatically.

check the TextureFX class for more info.



