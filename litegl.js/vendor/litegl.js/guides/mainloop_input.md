# Main Loop and Input

Every interactive application requires of some basic structure to control the input and the rendering loop.

To simplify those aspects LiteGL comes with some basic functions:


## Main loop

Realtime applications require to constantly render a new frame, this render has to be in sync with the browser rendering pace.
To do this browsers have a function called ```requestAnimationFrame```. LiteGL allows to create a simple animation loop by defining the ondraw and onupdate callback and launching the main loop by calling the ```gl.animate()``` method.

```js
    //create the rendering context
    var container = document.body;
    var gl = GL.create({width: container.offsetWidth, height: container.offsetHeight});
    container.appendChild(gl.canvas);
    
    //define the draw callback
    gl.ondraw = function()
    {
      //...
    }
    
    //define the update callback
    gl.onupdate = function( dt )
    {
      //...
    }

    //start the main loop
    gl.animate();
```

This methods (ondraw and onupdate) will be called **only if the tab is active**.

## Getting the Input

You probably want to get the user input (mouse clicks, keyboard press, gamepad buttons, ...).

To simplify that LiteGL provides some easy to use methods:

### Getting the Keyboard

To capture key presses (and releases) you use the ```gl.onkeydown``` and ```gl.onkeyup``` callbacks after enabling the keyboard capture using the ```gl.captureKeys()```.

```js
gl.onkeydown = function(e)
{
	if(e.keyCode == 39) //using ascii keycodes
	{
	   //do something
	}
}

gl.captureKeys();
```

### Getting the Mouse

To capture mouse events you use the next methods:

- ```gl.onmousedown``` to get when the user presses a mouse button.
- ```gl.onmouseup``` to get when the user release a mouse button.
- ```gl.onmousemove``` to get when the user moves the mouse
- ```gl.onmousewheel``` to get when the user moves the mouse wheel (remember to set the captureMouse parameter to true)

And to capture you must call ```gl.captureMouse(true)``` (true if you want to capture the mouse wheel).


```js
gl.onmousedown = function(e)
{
	if( e.leftButton ) //or e.rightButton or e.middleButton 
	{
	   //do something...
	}
}

gl.onmousemove = function(e)
{
	// e.canvasx and e.canvasy contain the mouse position in bottom-left coordinates
	// e.mousex and e.mousey contain the mouse position in top-left coordinates
}

gl.onmousewheel = function(e)
{
	// e.wheel 
}

gl.captureMouse(true);
```

### Getting the gamepad

To get the gamepad:

```js
var gamepads = gl.getGamepads();
if(gamepads)
{
	for(var i = 0; i < gamepads.length; i++)
	{
		var gamepad = gamepads[i];
		if(!gamepad)
			continue;
		if(!player && gamepad.xbox && gamepad.xbox.buttons["a"])
		{
			//do something
		}
	}
}

gl.captureGamepads();
``` 

### Getting the input state

You can also read the input state at any moment using the ```gl.mouse``` and ```gl.keys``` properties:

```js
if( gl.mouse.left_mouse )
{

}

if( gl.keys["UP"] )
{

}

```

