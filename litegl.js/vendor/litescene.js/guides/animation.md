# Animation #

LiteScene allows to animate any property of any component or node in the scene.

This is used for the skeletal animation but it can be used to animate other properties like camera position, material properties or any field that the user wants.

The animation system works by storing tracks with keyframes that contain the time and the values to apply.

When we want to apply an animation we use the PlayAnimation component.

You can use the WebGLStudio timeline editor to edit any animation in the scene.

## The LS.Animation and LS.Animation.Take ##

Animations are stored in a big container called LS.Animation that behaves like a resource.

Instead of storing the tracks per animation, we store them in another container called Take, this way one animation could contain several subanimations (takes).
By we usually use the default take.

Every Take contains a list of tracks, and the total duration of the take.

Because every scene usually needs to have an animation track, to make it easier, you can have one global animation track stored in the scene itself.

To create it you can call ```LS.GlobalScene.createAnimation()``` and this track will be saved with the scene.

## LS.Animation.Track ##

Every track contains all the info to modify one property of the scene as time goes.

They contain a locator, a list of keyframes, and information about the interpolation method.

There are two types of track:
- Property tracks: every keyframe represents a value to assign to the property specified in the track locator.
- Event tracks: every keyframe contain info about an event or a function call that should be performed 

## Locators ##

Every track has a string called the locator which identifies the property in the scene affected by the animation track.

Some examples: ```root/transform/x```,```mynode/MeshRenderer/enabled``` or ```@NODE-f7cac-865-1ecf644-5\@COMP-f7cac-865-1ecf644-3\size```.

The locator is usually (but not always) divided in three parts:
 * node: could be the UID or the name of the node
 * componentt: to specify which component, could be the UID or the name of the component
 * property: to specify the name of the property

Some components handle the locators by themselves (like script components) because they allow more parts in the locator.

To get the locator of a property you can call the method getLocator of the container (the component) passing the name of the property as a parameter:

```javascript
node.transform.getLocator("x"); //returns "@NODE_uid/@COMP-uid/x"
```

## PlayAnimation ##

To play an animation you must use the PlayAnimation component.

This component allows to select the animation, choose the take, the playback speed, and different modes.

If you want to use the global scene animation leave the animation field blank (or use "@scene").
