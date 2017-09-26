# Context

To start using WebGL first you need to create a ```WebGLRenderingContext```. This is the class that contains all the calls to WebGL.
To obtain that instance you first need to have a HTMLCanvas and do the call to retrieve the context, similar of how it is done with the regular 
Canvas2D.

This is done in LiteGL by callding the ```GL.create``` method:

```js
var settings = {
  canvas: "mycanvas",
  alpha: true
}
var gl = GL.create( settings );
```

Where settings is an object with several optional settings that you can pass, here is a list:

- *canvas* : it can be the HTMLCanvas element or the ID of the element. This way the context will be attached to that canvas.
- *container* : if no canvas is specified then a container can be specified where the canvas should be attached.
- *width* and *height* : the size of the canvas in case there is no canvas speficied and must be created.
- *webgl2* : forces to create a webgl2 canvas

Any other option will be passed to the context creation function so you can add alpha, stencil, antialias, depth, etc.
Check the [MDN guide for more info](https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/getContext)

Once the context has been created you can start calling any WebGL function trhough the global variable ```gl```, which is defined automatically.

If you have more than one webgl context (like two canvas) you must keep track of the gl variable returned by the ```GL.create``` method.

## Binding callbacks

Now we have the context created probably you want to create a main loop. Check the [main loop and input guide](mainloop_input.md) for more information.
