# The Render Pipeline #

The rendering pipeline of LiteScene has several steps that are important to understand if you want to modify how it behaves.
The reason to have some many steps is to ensure all the cases are considered.
If you are happy with the current rendering pipeline you do not need to read this article.

## WebGL, LiteGL and LiteScene

The first and most important part is to understand the layers involved in the engine and how they affect the rendering process.

Obviously in the lowest point we have the WebGL API supplied by the browser. You can call the WebGL API directly if you want, just keep in mind that during the rendering of a frame the Renderer will assume that the state of the API is in the state it was left by it, so be careful when changing the state.
My recommendation is to do not call WebGL directly, an instead use LiteGL (it is easier).

LiteGL is a low-level wrapper of WebGL that makes it easy to compile shaders, create meshes or upload textures, without any noticeable performance loss. It is important to know how to use it if you plan to modify the rendering pipeline. 

To know more about LiteGL [check the repository of LiteGL](https://github.com/jagenjo/litegl.js).

Although you are more prone to interact with LiteScene than with LiteGL. LiteScene rendering methods are in charge of creating the final frame, and those are the ones that you will have to tweak to change how the render pipeline works.

## LS.RenderInstance ##

First we need to understand the atomic class to render geometry that uses LiteScene, it is called ```LS.RenderInstance```.

A ```LS.RenderInstance``` represents one object to render in the scene, and it contains the mesh, the material and some extra information that must be taken into account when rendering that mesh (like layers, mesh range, primitive, etc).

Here is a list of the most relevant properties:

- __vertex_buffers__: tells the buffers required 
- __index_buffer__: which index buffer must be used
- __range__: to render only a range of the buffers
- __primitive__: the WebGL primitive (default is GL.TRIANGLES)
- __material__: the material in charge of rendering this primitive
- __layers__: in which layers is visible
- __mesh__: the original mesh
- __collision_mesh__: a optional collision mesh (used for ray picking)
- __priority__: the info about the rendering priority
- __matrix__: the matrix defining where to render it
- __normal_matrix__: the matrix defining how to transform the normals
- __aabb__: the bounding box

So every component of the scene that plans to render something on the screen needs to create a ```LS.RenderInstance``` and supplied to the system when the ```"collectRenderInstances"``` event is generated.

Take into account that a ```LS.RenderInstance``` is not a low-level API render call, because it still depends in many parameters to determine how to render it (mostly the material), and one RenderInstance could end up using several draw calls.

For example, the same ```RenderInstance``` will be rendered with different shaders depending if it is being rendered to the color buffer or to the shadow buffer.

Also one ```SceneNode``` can generate one RenderInstance, several or none, it depends on what it wants to do.

But don't worry about RenderInstances, you usually wont need to deal with them directly. There are components in charge of generating RenderInstances like the ```MeshRenderer``` or the ```GeometryPrimitive```.

## The LS.Renderer ##

Most of the rendering pipeline is contained in the ```LS.Renderer``` static class.
This class is in charge of taking a scene and generate the final frame.

It is important to take into account that to generate the final frame sometimes it is required to render the scene several times (for shadowmaps, reflections, secondary cameras, ...).
So if you plan to change the rendering pipeline maybe is better to change only the parts that really matter.

The ```LS.Renderer``` class is used by many components to do intermediate steps, so do not replace it completly unless the new class contains most of its  methods.
The ```LS.Renderer``` also keeps tracks of the current state of the rendering in process, so components can retrieve info during the rendering (stuff like the current camera, active samplers, lights, etc).

### Renderer.render(...) ###

This is the most important method from the ```Renderer```, is the one that generates the final frame.
Here is a list of the steps performed by the render pipeline when calling the render function:

1. **Collect visible data** 
  1. **processVisibleData** which will call **scene.collectData** to collect all visible data
  1. prepare RenderInstances (compute rendering order)
  1. prepare Lights (generate shadowmaps)
  1. prepare Cameras (they are sorted so cameras that are rendered to texture are renderer first)
1. Trigger several events to generate intermediate content (reflections)
1. In case there is a global framebuffer, enable that (to render the final frame to a texture and apply an FX)
1. **renderFrameCameras**: For every active camera
  1. Trigger camera events in case this camera requires an special buffer
  1. **renderFrame**: Render Scene from Camera view point
    1. **enableCamera** assign viewport and matrices according to camera
    1. **sortRenderInstances** rearrange the render instances so they are rendered in the propper order (opaque first, blend last, and taking into account priority)
    1. clear Buffer (or not)
    1. **renderInstances** iterate through every RenderInstance and call to renderColorPassInstance or renderShadowPassInstance
  1. apply FX to this buffer

Most of the rendering calls are performed from the **renderColorPassInstance** so check the chapter about that function to understand better how a single RenderInstance is rendered.

Careful, if you want to issue any special rendering pass during the render of a frame, **you must never call LS.Renderer.render from an event dispatched by the rendering**, this will create a recursive loop. You can bind to ```"beforeRenderMainPass"``` event and call functions like ```renderFrame``` to render the view from one camera, or do it manually calling ```enableCamera``` and ```renderInstances```.

### Render Events ###

In case we want to bind some events during the render here is the order at which they are triggered and the name of the callback that you can define in a script to catch it:

* **"beforeRender"** (script: onSceneRender ) Just after launching the ```LS.Renderer.render(...)```
* **"collectRenderInstances"** (script: onCollectRenderInstances ) When collecting resources to show in the scene
* **"enableFrameContext"** (script: onEnableFrameContext ) To enable to which LS.RenderFrameContext you want to do the render
* **"beforeCameraEnabled"** In case we want to change any parameter of the camera when rendering
* **"beforeRenderInstances"** (script: onRender ) before rendering every instance of the scene
* **"afterRenderInstances"** (script: onAfterRender ) after rendering every instance of the scene
* **"showFrameContext"** (script: onShowFrameContext ) when you want to show the context 
* **"renderHelpers"** (script: onRenderHelpers ) to render helper objects (gizmos, grids, etc)
* **"renderGUI"** (script: onRenderGUI ) to render 2D info in the immediate mode 
* **"afterRender"** (script: onAfterSceneRender ) after all the content of the scene has been rendered.

### Collecting the data ###

The scene contains many cameras, lights, render instances and other items that could affect the final frame, so we need to have all the data stored in the propper containers.

This methods try to extract all the useful information from the scene and prepare it so it is ready to be used during the rendering.

It is important to notice that once this action is performed and while rendering the frame, any changes applied to the scene wont be reflected till the next frame.

### Materials ###

When rendering a single instance the actions that must be performed depend on the kind of material it has assigned.

Different materials can specify different ways to render an instance, but to understand better the rendering pipeline lets focus in two different materials.

The ```ShaderMaterial``` and the ```StandardMaterial```

#### ShaderMaterial rendering ####

This is the simplest one, when rendering an instance that has a ShaderMaterial applied to it then Renderer will call the render function of the material.
The ShaderMaterial finds the Shader, passes the uniforms, and calls the render method in the RenderInstance.

This is the most straight forward shader, but it has some limitations. Because the shader assumes a fixed set of parameters, when rendering this instance it wont be affected by the surroundings.

This means that it won't have shadows or be affected by the scene lights or get any modifiers applied to it (like Skinning or Morphing)  unless the shader specifies it.

But it is the one that has the best performance.

#### StandardMaterial rendering ####

Sometimes we don't want to take care of the shader, we just want to specify some properties and let the render pipeline decide which is the best shader to apply.

In those situations the system has to be aware of the different modifiers to apply to the shader based in all the actors in the scene, like:
1. lights: because lights could have different type, or have shadowmaps, or projector textures, or special shaders.
1. nodes: because nodes can have deformers applied to them (skinning, morph targets)
1. scene: because maybe there is a clipping plane
1. renderer: because maybe the renderer is using an special pipeline

All those actors can affect the shader, changing its behaviour. So an StandardMaterial cannot have an specific shader applied to it.

Instead, the render pipeline computes the shader based on all those actors and renders the RenderInstance with the final shader.

This process is slower than using a fixed shader but ensures that people with no knowledge about shader coding can create its own materials easily.

### Multi light rendering ###

When rendering an scene we want to be sure than an object can be affected by multiple lights. This is achieved by using a multi pass rendering approach.

This means that for every light affecting the ```RenderInstance```, the pipeline is going to do a render pass for that instance. This could lead to bad performance when we have an scene with several meshes an lights.

## RenderState ##

Materials can control the way they are rendered by changing the flags in the GPU during rendering.

This way a material can decide if it is z-culled, two-sided, blended, etc. The info about how it should be rendered is contained in the ```LS.RenderState``` class in the ```material.render_state``` property.

To know more check the [guide about RenderState](shaders.md#renderstate)


## Post-processing Effects ##

A camera could be rendered to the screen or to a texture, in which case the texture could have FX applied to it.

To render to a texture we use a class called ```RenderFrameContext```, which helps setting up the context.

There are several components that allow to apply FX to the camera, just keep in mind that we could apply an FX per camera or to the whole scene.

Those components will bind events to the camera enableFrameBuffer (or the scene enableFrameBuffer), so they can redirect the render to the 

Check the [guide about post-processing effects](post-processing.md) to know more.
