# Using the LS.Player #

The LS.Player is the class used to embed and launch an scene inside a website so you do not need to use WebGLStudio to visualize it.

The Player is in charge of several tasks:

- Set up the render context
- Load the scene and the scripts associated to it
- Show progress bar during loading (useful in big scenes)
- Start playing the scene once everything is loaded
- Process the main loop to call the render and update methods
- Capture the input and send it to the specific callbacks
- Handle the GUI elements so they overlap properly with the scene

And because it is just one single class it is very easy to create a website that launches one scene:

### Usage ###

If you want to play an scene in your browser, here are the basic steps:

Include the libraries and dependencies:
```html
<script src="external/gl-matrix-min.js"></script>
<script src="external/litegl.min.js"></script>
<script src="external/Canvas2DtoWebGL.js"></script>
<script src="js/litescene.js"></script>
```

Create the player:
```js
var player = new LS.Player({
	width:800, height:600,
	resources: "resources/",
	shaders: "data/shaders.xml"
});
```

Attach to Canvas to the DOM:
```js
document.getElementById("mycontainer").appendChild( player.canvas )
```
or you can pass the canvas in the player settings as ```{ canvas: my_canvas_element }```

Load the scene and play it:
```js
player.loadScene("scene.json");
```

Some additional options you can pass to the player:

- **canvas**: the canvas element where to attach the render context (string selector or element)
- **width** and **height**: if you want the player to create the canvas by itself
- **container**: which DOM element where to attach the canvas, if not specified then the body is used.
- **container_id**: the container id if no container element is supplied.
- **loadingbar**: if true it will show the loading bar (default false)
- **redraw**: if false the scene wont be redraw constantly
- **autoresize**: if true the canvas will always try to match the parentNode size
- **autoplay**: if false the player wont play the scene unless you do it manually
- **shaders**: the path to the shaders.xml file, if omited then "data/shaders.xml"

You can also add to the options information for the WebGLContext:
- **alpha**: true if you want the canvas to be transparent
- **premultipliedAlpha**: if you want to multiply the alpha by the color

In case you want to overwrite the loading bar gizmo shown while loading the scene, you must overwrite the player.renderLoadingBar:

```js
player.renderLoadingBar = function( loading_info )
{
    //to know how much of the main scene file has been loaded: loading_info.scene_loaded
    //to know how much of the resource files as been loaded: loading_info.resources_loaded
}
```
