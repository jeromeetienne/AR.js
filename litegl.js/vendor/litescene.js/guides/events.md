# Events

The LiteScene system was designed so it is fairly easy to add new features or modify the existing ones.

To accomplish this the system relies mostly in events dispatched at certains points of the execution.
This way is the user wants to intercept the execution flow and add some steps it can be done.

Events are triggered from different elements of the system:

- from the scene (```LS.GlobalScene```): when they are related to the scene (like update, start, etc)
- from the renderer (```LS.Renderer```): when they are related to the rendering
- from the resources manager (```LS.ResourcesManager```): when they are related to the loading of resources
- from the node itself (```LS.SceneNode```): when is events related to this node

This events are triggered in an specific order, it is important to understand that to be able to usem them for your needs.

## Binding Events

In case you want to bind some actions to an event you must bind the callback to that event:

```js
LEvent.bind( LS.GlobalScene, "update", my_update_callback, my_instance );
```

And to unbind:

```js
LEvent.unbind( LS.GlobalScene, "update", my_update_callback, my_instance );
```

As you can see we are passing not only the callback but also the instance as a parameter.
This is important because this way we can unbind it without problem.

Warning: Using tricks like the ```Function.prototype.bind()``` method would create a new callback every time so we wouldnt be able to unbind it from the system again. Avoid to use it when passing callbacks to events.


## Execution Events

Here is a list of events and in which order they are called. 
They are all triggered from the current scene (```LS.GlobalScene```):

- "start": when the application starts after loading everything
  - *Main Loop*
    - *Rendering process*
      - "beforeRender"
      - *data is collected from the scene*
      - "afterCollectData": collect all the render data (cameras, render instances, lights)
      - "prepareMaterials": in case you want to edit material properties
      - "renderShadows": to render shadowmaps
      - "afterVisibility": in case we want to cull object according to the main camera
      - "renderReflections": to render realtime reflections to textures
      - "beforeRenderMainPass": after all things set, before we render the scene
      - "enableFrameContext" to enable the render output context
        - *For every camera*
        - "beforeRenderFrame"
        - "enableFrameContext" (on the camera) to enable the render output context
        - *Clear buffer*
        - "beforeRenderScene"
        - "beforeRenderInstances"
        - *the scene instances are rendered*
        - "renderInstances"
        - "renderScreenSpace"
        - "afterRenderInstances"
        - "afterRenderScene"
        - "afterRenderFrame"
      - "showFrameContext": show the frame in the screen
      - "renderGUI": render 2D content 
      - "afterRender": after all the scene has been rendered in the screen
   - "beforeUpdate" before the update
  - "update" during the update
  - "afterUpdate"  after the update
- "finish" when the application stops (in the editor)

- "pause" if the editor pauses the execution
- "unpause" if the editor unpauses the execution



