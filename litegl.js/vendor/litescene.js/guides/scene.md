# Scene #

To familiarize with LiteScene first you need to understand how the scene is composed.

## The LS.SceneNode ##

A LS.SceneNode represents an object in your scene (similar to how a GameObject works in Unity).

It can have a name, a transform to define where it is, and a list of components to add behaviour and visual properties.

Everything visible or that react to our scene must be inside a LS.SceneNode.

### Names and UIDs ###

Every node can have a name in a String form, this name doesnt have to be unique.

Besides the name, every node has a UID (unique identifier) that tries to be as universal as possible to avoid collisions when loading nodes from several scenes.

UIDs are created using random numbers, incremental numbers and timestamps so they should be very unique.

```Javascript
node.name = "Ball";
console.log( node.uid ); //will show something similar to: "@NODE--72553e-27b-1a284aa-5"
```

### Inserting nodes inside nodes ###

SceneNodes belongs to a tree like structure, where every node can have other nodes inside, to do this we can attach a node to another node:

```Javascript
node.addChild( other_node ); //adds other node inside node
```

Child nodes are stored in ```node.children``` and the parent node of a node is stored in ```node.parentNode```.
Check the documentation for more info about how to attach or remove nodes from a node.


### Layers ###

Every node belongs to several layers (or none), this helps filter which object should react or be visible with our scene.

Layers are stored using a number where every bit represent to which layer belongs (to a maxium of 32). The layers names are stored in the SceneTree.

```Javascript
node.layers |= 1; //adds the layer 1 to this object
```

## SceneTree ##

The SceneTree is the global container for the whole scene.

To acess the current active scene you can use  ```LS.GlobalScene```

This contains a root SceneNode where all the nodes of the scene are located.

To access the root node you can go to ```LS.GlobalScene.root```

## Scene information ##

You can access several information from the Scene like:
- **time**: the time the scene has been running in seconds (this value only increases if it is in play mode).
- **global_time**: the system time in seconds (similar to getTime()).
- **frame**: the current frame number (how many times the function ```LS.Renderer.render``` has been rendered with this scene).
- **layer_names**: an array containing the name for every layer.

## Documentation ##

For a more detailed description check the documentation.
