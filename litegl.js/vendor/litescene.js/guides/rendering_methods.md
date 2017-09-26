# Rendering Methods

There are several ways to render geometry on the screen. Some of them are more simple (but limited), 
others more complex (but allow to do more interesting stuff). 

In this guide we will cover all of them, from easier to more complex, and explain the pros and cons of every one of them:

## SceneNode and components

The easiest way to render stuff on the scene is to create nodes attached to the scene and use some of the Components that render geometry like 
```MeshRenderer``` or ```GeometricPrimitive```. To define how this objects should be rendered you use the materials system of the engine.

This is easy to use and interacts perfectly with the rest of the engine, but in this case you cannot control the render calls, it is all 
controlled by the Material class.

You can use the editor or do it by code:

```js
var node = new LS.SceneNode(); //create a node
LS.GlobalScene.root.addChild( node ); //add to the scene
var comp = new LS.Components.MeshRenderer({mesh:"mymesh.obj"}); //create a mesh renderer
node.addComponent( comp ); //add to the node
``` 

## RenderInstances

The second option is to generate manually from a Script the RenderInstance, instead of using the components that do that for yourself.
A RenderInstance is the object containing all the info required to render one mesh on the screen. To know more check the [RenderInstance guide](render_pipeline.md#lsrenderinstance).

```js
this.onCollectRenderInstances = function( RIs )
{
  var RI = new LS.RenderInstance();
  
  var mesh = LS.ResourcesManager.load("my_mesh.obj");
  var material = LS.ResourcesManager.load("mymaterial.json");
  
  RI.setMesh( mesh );
  RI.setMaterial( material );
  RI.setMatrix( node.transform.getGlobalMatrixRef() );
  RIs.push( RI );
}
``` 

## LS.Draw

If you want to render some basic shapes for debugging purposes sometimes is easier to skip all the nodes and render instances and just do the basic calls.

For that purpose you can use the ```LS.Draw``` class. It behaves similar to old school fixed pipeline rendering method.

To know more check the [guide for LS.Draw](draw.md)

```js
this.onRender = function(){
  LS.Draw.push(); //save the state
  LS.Draw.multMatrix( node.transform.getGlobalMatrixRef() ); //use the transform from the node
  LS.Draw.setColor([1,0,0,1]); //red color
  LS.Draw.renderPoints( points_vector ); //render several points
  LS.Draw.pop(); //recover old matrix to leave the state as it was found
}
```

## Canvas2D

If all you want to do is some 2D primitives (useful to do HUDs or debug info), you do not need to battle with WebGL, you can just call regular Canvas2D calls.
This calls will be transformed automatically to WebGL.

But if you want to do some sort of GUI, remember that LiteScene has a built-in GUI system, [check the GUI guide for more info](gui.md):

```js
this.onRenderGUI = function(ctx)
{
  ctx.fillStyle = "red";
  ctx.fillRect(10,10,200,200);
  ctx.fillStyle = "white";
  ctx.fillText( "HELLO", 30, 30 );
}
```

## LiteGL

If you have experience coding directly to the GPU but you dont want to waste time with the inners of WebGL, LiteScene uses LiteGL as 
its low-level layer, which wraps most of the common calls to the GPU. This way it is very simple to do your own draw calls.

For more info about LiteGL check the [LiteGL repository guide](https://github.com/jagenjo/litegl.js/tree/master/guides).

```js
var mesh = GL.Mesh.cube();
var shader = new GL.Shader( vertex_shader_code, fragment_shader_code );

this.onRender = function()
{
   shader.uniforms({ u_color: [1,1,1,1]});
   shader.draw( mesh, GL.TRIANGLES );
}
```

## WebGL calls

Or if you dont want to use LiteGL and you feel more confortable doing your own WebGL calls manually, you have total freedom to do them
from any script.

## Custom Engine

The last option is to integrate and existing 3D engine inside LiteScene. Just be sure to pass all the info to the engine (like the
canvas used).


