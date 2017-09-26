# Components #

Every node could host several components.

A component is a element that adds behaviour and visual representation to a node. There are lots of different components that can be attached to any node to add behaviour.

Thanks to components the engine is very dynamic, allows to construct new behaviours by blending different components in one node, and allows to extend the system with ease.

All the component classes are stored in ```LS.Components```.

## Instantiating and attaching components ##

To create a component you just instatiate the class:

```Javascript
var my_component = new LS.Components.Camera();
node.addComponent( my_component );
```

To access the component:
```Javascript
var my_component = node.getComponent( LS.Components.Camera );
```

or to remove it
```Javascript
node.removeComponent( my_component );
```

Check the documentation for more info.

## Creating your own components class

If you want to create new component classes check [the guide to programe new components](programming_components.md).

## Important Components ##

There are several components that are very important for any scene, they are:

- **Transform**: to handle the position, rotation and scaling of every object in the scene.
- **Camera**: to choose from where to render the scene and how.
- **MeshRenderer**: to render something in the scene.
- **Light**: to iluminate the scene.

### Transform ##

Transform is the component in charge of handling where a SceneNode is located spacially on the scene, where is heading and which is its size.

It also provides methods to handle the different coordinates systems.

### Camera ##

The Camera component adds a camera to the scene, which will be used by the Renderer to create a representation on the screen.

### MeshRenderer ##

MeshRenderer is the component in charge of rendering meshes into the scene.

### Light ##

Light is the component in charge of holds the info about the light sources. The behaviour depends on the rendering engine and shaders.

### Script and ScriptFromFile ##

To add extra behaviour there are components that could be programmed from the editor.

For more info read the [Scripting guide](scripting.md).
