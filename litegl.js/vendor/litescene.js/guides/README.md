# Guide to develop for LiteScene #
This guide intends to help people understand the engine so they can take full advantage of it from the WebGLStudio platform.

The most important thing to understand is that the engine is separated in several layers, every one of them is independent, so to better understand everything about LiteScene please first go to [LiteGL.js](https://github.com/jagenjo/litegl.js) which is the low-level layer in charge of accesing WebGL, and the one LiteScene uses to simplify the GPU calls.

## Guides ##

Here there is a list with the most commont topics to master LiteScene:

- [Scene](scene.md): Understanding the scene tree
- [Components](components.md): How to use the components system
- [Scripting](scripting.md): How to create your own scripts
- [Input](input.md): how to get user input
- [GUI](gui.md): how to add a GUI to your application
- [Resources](resources.md): How to handle resources (textures, meshes, etc)
- [Player](player.md): how to use the player to embed your scene in any website
- [Custom components](programming_components.md): How to create your own components

Some advanced topics:

- [Operating with Vectors and Matrices](operating_with_vectors.md): understanding gl-matrix and how to do mathematical operations.
- [Events](events.md): how to capture events from the system to call your own callbacks
- [Render pipeline](render_pipeline.md): How does the render pipeline work
- [Rendering methods](rendering_methods.md): Different ways to render in LiteScene
- [Shaders](shaders.md): How to write your own shaders
- [Post-processing](post-processing.md): How to apply postprocessing effects
- [Animation](animation.md): How to create animations
- [Custom editor interfaces](custom_editor_interfaces.md): configuring the interface in the editor
- [Tweening](tweening.md): how to interpolate values easily
- [Draw](draw.md): how to draw in immediate mode



## Index ##
* Features
* Limitations
* LS Namespace
* SceneTree and SceneNode
* Components
 * Scripts
 * Graphs
* Renderer
* ResourcesManager
* Player
* Network
* Formats
* Physics
* Picking
* Helpers
 * Animation
 * Prefab
* Other
 * LScript
 * WBin
 
## Features ##
LiteScene is an engine meant to work with WebGLStudio although it is not mandatory to do so (you can create full scenes just by accesing the engine directly from code).
The engine is meant to be very modular and easy to extend.

Simple things can be added to the engine (like new modules or materials) without really needing to understand the whole system, but for more complex behaviours you will need to learn the system as a whole.

Because the whole engine is coded in Javascript (without any transpiler) you have full access from within the engine to any part of it, that means that you could create a script that replaces the behaviour of an existint part of the engine without any problem, thanks to the nature of Javascript and the modularity of the system.

The engine also allows different ways to do the same actions to help people, so you can use in-editor scripts, or external scripts loaded on launch, or graphs, or directly replace the source code of the engine.

The engine is also meant to help the editor to understand what is going on in every component, this way users can create new components with personalized interfaces that helps them to setup their scenes, without the need to code them.

## Limitations ##

LiteScene is not meant to be used as a powerful 3D engine, it has its limitations regarding to number of objects in the scene or complexity of the interactions. If should be used in simple scenes with tens of objects at most.

## LS Namespace ##

The LS namespace is the global namespace where all the classes are contained, some generic methods are also here that could be helpful to control the global system.

Check the documentation for a complete list with all the methods.

Inside LS there are some important object that you should be aware:
- Components
- MaterialClasses
- Formats

Some of the most important components (such as Script, Camera, Light and Transform) are stored also in the LS namespace besides being in LS.Components.


## SceneTree and SceneNode

To handle the objects in a scene the user must understand how to use the SceneTree and the SceneNode object.

While SceneNode represent an object in the scene, SceneTree represents the scene itself.

Every node could contain other nodes as children similar to how the DOM works.

The SceneTree contains a root node (scene.root) where all the nodes in the scene are pending.

For more info about the Scene read the [Scene guide](scene.md).

## Components ##

The behaviour of every node comes from the components attached to it.

Cameras, Lights, MeshRenderers, etc, are all components that could be attached to any SceneNode to add functionalities.

For more info about the Scene read the [Components guide](components.md).

### Scripts ###

Scripts are a special component that contain code that should be executed. This is done to allow scenes to contain behaviour written by its author without the need to include external libraries.

For more info about the scripts read the [Scripting guide](scripting.md).

### Graphs ###

Graphs are another interesting component similar to scripts because they allow the creator to insert some behaviours, but instead of using code it uses graphs made combining nodes. 

For more info about the scripts read the [Graphs guide](graphs.md).

## Renderer ##

One of the main purposes of LiteScene is to provide a reliable render pipeline that can handle most common scenarios (multi-texture materials with several light sources, shadowmaps and reflections) but also giving total freedom to create your own rendering pipeline if you want.

For this reason there are several classes that handle the rendering process like ```LS.Renderer```, ```LS.RenderInstance```, ```LS.RenderState```, ```LS.ShaderCode```, ```LS.RenderFrameContext``` plus the obvious ones: ```LS.Material```, ```LS.Light```, ```LS.Camera``` that could be tweaked in many ways.

For more info about the rendering pipeline read the [Rendering guide](render_pipeline.md).

## ResourcesManager ##

There are many resources used by the application like Textures, Meshes and Shaders for rendering the frame, but also Scripts for behaviour, audios or data files.

All this resources are loaded and stored in the ResourcesManager.

For more info about the rendering pipeline read the [Resources Manager guide](resources_manager.md).

## Player ##

Once a scene has been created using an editor like WebGLStudio you want to embed it easily in your website without having to handle all the events and the main loop manually. For this reason there is the ```LS.Player``` class, that handles all the low-level actions plus loading and starting the scene.

For more info about the player read the [Player guide](player.md).

## Network ##

To handle requesting files from the network we supply with a high-level class called Network.
