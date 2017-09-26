# LS.Draw 

To render things on our scene we rely on the rendering pipeline and the LS.RenderInstances that are collected from the scene.

But sometimes we want to render in immediate mode (mostly for debug purposes but also to create 3D GUIs or helpers).

LiteScene includes a namespace called ```LS.Draw``` which contains several functions to render basic shapes or meshes without the need to create a LS.RenderInstance.

Keep in mind that anything rendered using immediate mode wont receive any of the behaviours provided by the render pipeline (like shadows, reflections, picking, etc).

Also remember that you can always call WebGL directly or to use the LiteGL methods to access WebGL to render anything, LS.Draw is just a list of helpers to make it easier.

## Rendering in immediate mode

To render in immediate mode first you need to be sure that your code will be executed during the rendering loop.

To ensure that, you must place your code inside a function call during the rendering loop like the ```onRender``` on a script:

```javascript
this.onRender = function()
{
   LS.Draw.setColor([1,1,1]);
   LS.Draw.renderSolidBox( 10,10,10 );
}
```

Or if you are using your own component you can bind any of the rendering methods like ```beforeRenderInstances``` or ```afterRenderInstances```.

## Basic shapes ##

When you have some basic data like points or lines use:

- ```renderPoints```: renders the points on the screen using the point size set by ```LS.Draw.setPointSize```, you can pass also a stream with colors if they have different colros.
- ```renderPointsWithSize```: same as ```renderPoints``` but you can pass an extra stream with the size of every point related to the global point size.
- ```renderRoundPoints```: same as ```renderPoints``` but points will be rounded.
- ```renderLines```: renders lines passed as an array of points, you can specify LINE_STRIP if you want.

```javascript
LS.Draw.renderPoints( [0,0,0, 100,100,100], [1,1,1,1, 1,0,0,1] ); //this will render two points, one white and the other red.
LS.Draw.renderLines( [0,0,0, 100,100,100] ); //this will render one line
```

If you have a mesh you want to render just call the ```renderMesh``` function:

```javascript
LS.Draw.renderMesh( mymesh, GL.TRIANGLES ); //check the documentation if you want to render a range or using an IndexBuffer 
```

But there are also some basic shapes that you can render without the need to create the Mesh, like basic shapes:

- ```renderCircle ( radius, segments, in_z, filled )```
- ```renderCone ( radius, height, segments, in_z )```
- ```renderCylinder ( radius,  height,  segments,  in_z )```
- ```renderRectangle ( width,  height,  in_z )```
- ```renderSolidBox ( sizex,  sizey,  sizez )```
- ```renderSolidCircle ( radius,  segments,  in_z )```
- ```renderWireBox ( sizex,  sizey,  sizez )```
- ```renderWireSphere ( radius,  segments )```

Other useful functions are:

- ```renderText```
- ```renderImage```


## Applying transformations ##

All functions will render the object in the current center of your coordinates system.
To change the coordinates system you can apply basic transformations:

```javascript
LS.Draw.translate(10,10,10);
LS.Draw.rotate(90,0,1,0);
LS.Draw.scale(2,2,2);
```

And if you want to save and retrieve the state of the transformations you can use ```push``` and ```pop```:

```javascript
LS.Draw.push(); //saves coordinates system
LS.Draw.translate(10,10,10);
LS.Draw.renderCircle( 10,10 );
LS.Draw.pop(); //recover old coordinates system
```

## Global properties

Every render will try to use the global properties to define the color, alpha and point size:

```javascript
LS.Draw.setColor([1,0,0]); //you can pass a fourth parameter with the alpha
LS.Draw.setAlpha(0.5);
LS.Draw.setPointSize(10); //in pixels
```

## Camera ##

Also if you want to change the camera position you can also pass a camera although the system already does it:

```javascript
LS.Draw.setCamera( mycamera );
```

## Documentation 

Check the [LS.Draw](http://webglstudio.org/doc/litescene/classes/LS.Draw.html) documentation for better explanation of every function.


