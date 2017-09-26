# Textures

Using textures in WebGL is easy because the browser already comes with Image loaders.

The problems come when you want to apply very basic actions to the textures, like cloning, applying a shader to every pixel, resizing, etc.

For those reasons LiteGL adds many useful functions to the class ```GL.Texture```.

## Creating a texture

To create a texture just call the constructor:

```javascript
var mytexture = new GL.Texture( 256, 256, { minFilter: gl.NEAREST, magFilter: gl.LINEAR });
```

As you can see the first parameter is the width, the second parameter the height, and the thirth parameter an object containing all possible options.

If no options are specified they will take the default value, which is:

- **texture_type**: gl.TEXTURE_2D, gl.TEXTURE_CUBE_MAP, default gl.TEXTURE_2D 
- **format**: gl.RGB, gl.RGBA, gl.DEPTH_COMPONENT, default gl.RGBA 
- **type**: gl.UNSIGNED_BYTE, gl.UNSIGNED_SHORT, gl.HALF_FLOAT_OES, gl.FLOAT, default gl.UNSIGNED_BYTE 
- **filter**: filtering for mag and min: gl.NEAREST or gl.LINEAR, default gl.NEAREST 
- **magFilter**: magnifying filter: gl.NEAREST, gl.LINEAR, default gl.NEAREST 
- **minFilter**: minifying filter: gl.NEAREST, gl.LINEAR, gl.LINEAR_MIPMAP_LINEAR, default gl.NEAREST 
- **wrap**: texture wrapping: gl.CLAMP_TO_EDGE, gl.REPEAT, gl.MIRROR, default gl.CLAMP_TO_EDGE (also accepts wrapT and wrapS for separate settings) 
- **pixel_data**: ArrayBufferView with the pixel data to upload to the texture, otherwise the texture will be black 
- **premultiply_alpha**: multiply the color by the alpha value when uploading, default FALSE 
- **no_flip**: do not flip in Y when data is uploaded, default TRUE 
- **anisotropic**: number of anisotropic fetches, default 0 

Once the texture has been created if you want to change any of the properties you must do it manually calling the WebGL funtions.

## Loading a texture from file

If you want to use an existing image as a texture you can use the loading methods for ```GL.Texture```.

```javascript
  var texture = GL.Texture.fromURL( "myimage.png", {} );
```

## Cubemaps

Using cubemaps is very useful to create interesting effects but loading or generating is hard and prone to errors.

LiteGL comes with some useful functions to handle cubemaps, not only for loading but also to generate them from your scene.

```javascript
var cubemap_texture = GL.Texture.cubemapFromURL( url ); //this assumes the url contains an image with the six faces arranged vertically
```

Or if you have an image with a cross cubemap (aligned to the left)
```javascript
var cubemap_texture = GL.Texture.cubemapFromURL( url, { is_cross: 1 } ); //for a cross image to the left
```

## Useful actions

Here is a list of useful methods that you can use with textures:
- ```bind```: to bind it in one slot
- ```clone```: returns a texture that its a clone of this one.
- ```fill```: fills the texture with one solid color.
- ```toViewport```: renders a full screen quad with the texture, check the documentation for more options.
- ```applyBlur```: blurs the content of a texture, check the documentation to use it properly.

## Render to texture

It is easy to render your scene to a texture instead of to the screen.
This is useful to create postprocessing effects or to bake information.

To render to one texture (or several) check the guide for the [GL.FBO](fbo.md) class.

## Texture pool 

When using temporary textures is always better to reuse old ones instead of creating and destroying them which would lead to garbage and fragmented memory.

LiteGL comes with a very simple texture pool system, you can release any texture or retrieve it.

Keep in mind that the textures pool would never be freed, so use it smartly.

```javascript
  //retrieve a texture from the pool
  var temp_texture = GL.Texture.getTemporary( 256, 256, { format: gl.RGB } );
  //here we use it...
  //then release it so others can use it
  GL.Texture.releaseTemporary( temp_texture );
```
