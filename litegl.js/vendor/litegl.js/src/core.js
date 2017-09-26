
/**
* The global scope that contains all the classes from LiteGL and also all the enums of WebGL so you dont need to create a context to use the values.
* @class GL
*/

/**
* creates a new WebGL context (it can create the canvas or use an existing one)
* @method create
* @param {Object} options supported are: 
* - width
* - height
* - canvas
* - container (string or element)
* @return {WebGLRenderingContext} webgl context with all the extra functions (check gl in the doc for more info)
*/
GL.create = function(options) {
	options = options || {};
	var canvas = null;
	if(options.canvas)
	{
		if(typeof(options.canvas) == "string")
		{
			canvas = document.getElementById( options.canvas );
			if(!canvas) throw("Canvas element not found: " + options.canvas );
		}
		else 
			canvas = options.canvas;
	}
	else
	{
		var root = null;
		if(options.container)
			root = options.container.constructor === String ? document.querySelector( options.container ) : options.container;
		if(root && !options.width)
		{
			var rect = root.getBoundingClientRect();
			options.width = rect.width;
			options.height = rect.height;
		}

		canvas = createCanvas(  options.width || 800, options.height || 600 );
		if(root)
			root.appendChild(canvas);
	}

	if (!('alpha' in options)) options.alpha = false;


	/**
	* the webgl context returned by GL.create, its a WebGLRenderingContext with some extra methods added
	* @class gl
	*/
	var gl = null;

	if(options.webgl2)
	{
		try { gl = canvas.getContext('webgl2', options); gl.webgl_version = 2; } catch (e) {}
		try { gl = gl || canvas.getContext('experimental-webgl2', options); gl.webgl_version = 2; } catch (e) {}
	}
	try { gl = gl || canvas.getContext('webgl', options); } catch (e) {}
	try { gl = gl || canvas.getContext('experimental-webgl', options); } catch (e) {}
	if (!gl) { throw 'WebGL not supported'; }

	if(gl.webgl_version === undefined)
		gl.webgl_version = 1;

	global.gl = gl;
	canvas.is_webgl = true;
	canvas.gl = gl;
	gl.context_id = this.last_context_id++;

	//get some common extensions
	gl.extensions = {};
	gl.extensions["OES_standard_derivatives"] = gl.derivatives_supported = gl.getExtension('OES_standard_derivatives') || false;
	gl.extensions["WEBGL_depth_texture"] = gl.getExtension("WEBGL_depth_texture") || gl.getExtension("WEBKIT_WEBGL_depth_texture") || gl.getExtension("MOZ_WEBGL_depth_texture");
	gl.extensions["OES_element_index_uint"] = gl.getExtension("OES_element_index_uint");
	gl.extensions["WEBGL_draw_buffers"] = gl.getExtension("WEBGL_draw_buffers");
	gl.extensions["EXT_shader_texture_lod"] = gl.getExtension("EXT_shader_texture_lod");
	gl.extensions["EXT_sRGB"] = gl.getExtension("EXT_sRGB");
	gl.extensions["EXT_texture_filter_anisotropic"] = gl.getExtension("EXT_texture_filter_anisotropic") || gl.getExtension("WEBKIT_EXT_texture_filter_anisotropic") || gl.getExtension("MOZ_EXT_texture_filter_anisotropic");
	gl.extensions["EXT_frag_depth"] = gl.getExtension("EXT_frag_depth") || gl.getExtension("WEBKIT_EXT_frag_depth") || gl.getExtension("MOZ_EXT_frag_depth");
	gl.extensions["WEBGL_lose_context"] = gl.getExtension("WEBGL_lose_context") || gl.getExtension("WEBKIT_WEBGL_lose_context") || gl.getExtension("MOZ_WEBGL_lose_context");

	//for float textures
	gl.extensions["OES_texture_float_linear"] = gl.getExtension("OES_texture_float_linear");
	if(gl.extensions["OES_texture_float_linear"])
		gl.extensions["OES_texture_float"] = gl.getExtension("OES_texture_float");

	gl.extensions["OES_texture_half_float_linear"] = gl.getExtension("OES_texture_half_float_linear");
	if(gl.extensions["OES_texture_half_float_linear"])
		gl.extensions["OES_texture_half_float"] = gl.getExtension("OES_texture_half_float");

	gl.HALF_FLOAT_OES = 0x8D61; 
	if(gl.extensions["OES_texture_half_float"])
		gl.HALF_FLOAT_OES = gl.extensions["OES_texture_half_float"].HALF_FLOAT_OES;
	gl.HIGH_PRECISION_FORMAT = gl.extensions["OES_texture_half_float"] ? gl.HALF_FLOAT_OES : (gl.extensions["OES_texture_float"] ? gl.FLOAT : gl.UNSIGNED_BYTE); //because Firefox dont support half float

	gl.max_texture_units = gl.getParameter(gl.MAX_TEXTURE_IMAGE_UNITS);

	//viewport hack to retrieve it without using getParameter (which is slow and generates garbage)
	if(!gl._viewport_func)
	{
		gl._viewport_func = gl.viewport;
		gl.viewport_data = new Float32Array([0,0,gl.canvas.width,gl.canvas.height]); //32000 max viewport, I guess its fine
		gl.viewport = function(a,b,c,d) { var v = this.viewport_data; v[0] = a|0; v[1] = b|0; v[2] = c|0; v[3] = d|0; this._viewport_func(a,b,c,d); }
		gl.getViewport = function(v) { 
			if(v) { v[0] = gl.viewport_data[0]; v[1] = gl.viewport_data[1]; v[2] = gl.viewport_data[2]; v[3] = gl.viewport_data[3]; return v; }
			return new Float32Array( gl.viewport_data );
		};
		gl.setViewport = function( v, flip_y ) {
			gl.viewport_data.set(v);
			if(flip_y)
				gl.viewport_data[1] = this.drawingBufferHeight-v[1]-v[3];
			this._viewport_func(v[0],gl.viewport_data[1],v[2],v[3]);
		};
	}
	else
		console.warn("Creating LiteGL context over the same canvas twice");
	
	//just some checks
	if(typeof(glMatrix) == "undefined")
		throw("glMatrix not found, LiteGL requires glMatrix to be included");

	var last_click_time = 0;

	//some global containers, use them to reuse assets
	gl.shaders = {};
	gl.textures = {};
	gl.meshes = {};

	/**
	* sets this context as the current global gl context (in case you have more than one)
	* @method makeCurrent
	*/
	gl.makeCurrent = function()
	{
		global.gl = this;
	}

	/**
	* executes callback inside this webgl context
	* @method execute
	* @param {Function} callback
	*/
	gl.execute = function(callback)
	{
		var old_gl = global.gl;
		global.gl = this;
		callback();
		global.gl = old_gl;
	}


	/**
	* Launch animation loop (calls gl.onupdate and gl.ondraw every frame)
	* example: gl.ondraw = function(){ ... }   or  gl.onupdate = function(dt) { ... }
	* @method animate
	*/
	gl.animate = function(v) {
		if(v === false)
		{
			global.cancelAnimationFrame( this._requestFrame_id );
			this._requestFrame_id = null;
			return;
		}

		var post = global.requestAnimationFrame;
		var time = getTime();
		var context = this;

		//loop only if browser tab visible
		function loop() {
			if(gl.destroyed) //to stop rendering once it is destroyed
				return;

			context._requestFrame_id = post(loop); //do it first, in case it crashes

			var now = getTime();
			var dt = (now - time) * 0.001;

			if (context.onupdate) 
				context.onupdate(dt);
			LEvent.trigger(gl,"update",dt);
			if (context.ondraw)
			{
				//make sure the ondraw is called using this gl context (in case there is more than one)
				var old_gl = global.gl;
				global.gl = context;
				//call ondraw
				context.ondraw();
				LEvent.trigger(gl,"draw");
				//restore old context
				global.gl = old_gl;
			}
			time = now;
		}
		this._requestFrame_id = post(loop); //launch main loop
	}	

	//store binded to be able to remove them if destroyed
	/*
	var _binded_events = [];
	function addEvent(object, type, callback)
	{
		_binded_events.push(object,type,callback);
	}
	*/

	/**
	* Destroy this WebGL context (removes also the Canvas from the DOM)
	* @method destroy
	*/
	gl.destroy = function() {
		//unbind global events
		if(onkey_handler)
		{
			document.removeEventListener("keydown", onkey_handler );
			document.removeEventListener("keyup", onkey_handler );
		}

		if(this.canvas.parentNode)
			this.canvas.parentNode.removeChild(this.canvas);
		this.destroyed = true;
		if(global.gl == this)
			global.gl = null;
	}

	var mouse = gl.mouse = {
		buttons: 0, //this should always be up-to-date with mouse state
		left_button: false,
		middle_button: false,
		right_button: false,
		position: new Float32Array(2),
		x:0, //in canvas coordinates
		y:0,
		deltax: 0,
		deltay: 0,
		clientx:0, //in client coordinates
		clienty:0,
		isInsideRect: function(x,y,w,h, flip_y )
		{
			var mouse_y = this.y;
			if(flip_y)
				mouse_y = gl.canvas.height - mouse_y;
			if( this.x > x && this.x < x + w &&
				mouse_y > y && mouse_y < y + h)
				return true;
			return false;
		},
		isButtonPressed: function(num)
		{
			return this.buttons & (1<<GL.RIGHT_MOUSE_BUTTON);
		}
	};

	/**
	* Tells the system to capture mouse events on the canvas. 
	* This will trigger onmousedown, onmousemove, onmouseup, onmousewheel callbacks assigned in the gl context
	* example: gl.onmousedown = function(e){ ... }
	* The event is a regular MouseEvent with some extra parameters
	* @method captureMouse
	* @param {boolean} capture_wheel capture also the mouse wheel
	*/
	gl.captureMouse = function(capture_wheel, translate_touchs ) {

		canvas.addEventListener("mousedown", onmouse);
		canvas.addEventListener("mousemove", onmouse);
		if(capture_wheel)
		{
			canvas.addEventListener("mousewheel", onmouse, false);
			canvas.addEventListener("wheel", onmouse, false);
			//canvas.addEventListener("DOMMouseScroll", onmouse, false); //deprecated or non-standard
		}
		//prevent right click context menu
		canvas.addEventListener("contextmenu", function(e) { e.preventDefault(); return false; });

		if( translate_touchs )
			this.captureTouch( true );
	}

	function onmouse(e) {
		var old_mouse_mask = gl.mouse.buttons;
		GL.augmentEvent(e, canvas);
		e.eventType = e.eventType || e.type; //type cannot be overwritten, so I make a clone to allow me to overwrite
		var now = getTime();

		//gl.mouse info
		mouse.dragging = e.dragging;
		mouse.position[0] = e.canvasx;
		mouse.position[1] = e.canvasy;
		mouse.x = e.canvasx;
		mouse.y = e.canvasy;
		mouse.clientx = e.mousex;
		mouse.clienty = e.mousey;
		mouse.left_button = mouse.buttons & (1<<GL.LEFT_MOUSE_BUTTON);
		mouse.middle_button = mouse.buttons & (1<<GL.MIDDLE_MOUSE_BUTTON);
		mouse.right_button = mouse.buttons & (1<<GL.RIGHT_MOUSE_BUTTON);

		if(e.eventType == "mousedown")
		{
			if(old_mouse_mask == 0) //no mouse button was pressed till now
			{
				canvas.removeEventListener("mousemove", onmouse);
				var doc = canvas.ownerDocument;
				doc.addEventListener("mousemove", onmouse);
				doc.addEventListener("mouseup", onmouse);
			}
			last_click_time = now;

			if(gl.onmousedown)
				gl.onmousedown(e);
			LEvent.trigger(gl,"mousedown");
		}
		else if(e.eventType == "mousemove")
		{ 
			if(gl.onmousemove)
				gl.onmousemove(e); 
			LEvent.trigger(gl,"mousemove",e);
		} 
		else if(e.eventType == "mouseup")
		{
			if(gl.mouse.buttons == 0) //no more buttons pressed
			{
				canvas.addEventListener("mousemove", onmouse);
				var doc = canvas.ownerDocument;
				doc.removeEventListener("mousemove", onmouse);
				doc.removeEventListener("mouseup", onmouse);
			}
			e.click_time = now - last_click_time;
			//last_click_time = now; //commented to avoid reseting click time when unclicking two mouse buttons

			if(gl.onmouseup)
				gl.onmouseup(e);
			LEvent.trigger(gl,"mouseup",e);
		}
		else if((e.eventType == "mousewheel" || e.eventType == "wheel" || e.eventType == "DOMMouseScroll"))
		{ 
			e.eventType = "mousewheel";
			if(e.type == "wheel")
				e.wheel = -e.deltaY; //in firefox deltaY is 1 while in Chrome is 120
			else
				e.wheel = (e.wheelDeltaY != null ? e.wheelDeltaY : e.detail * -60);

			//from stack overflow
			//firefox doesnt have wheelDelta
			e.delta = e.wheelDelta !== undefined ? (e.wheelDelta/40) : (e.deltaY ? -e.deltaY/3 : 0);
			//console.log(e.delta);
			if(gl.onmousewheel)
				gl.onmousewheel(e);

			LEvent.trigger(gl, "mousewheel", e);
		}

		if(gl.onmouse)
			gl.onmouse(e);

		if(e.eventType != "mousemove")
			e.stopPropagation();
		e.preventDefault();
		return false;
	}

	var translate_touches = false;

	gl.captureTouch = function( translate_to_mouse_events )
	{
		translate_touches = translate_to_mouse_events;

		canvas.addEventListener("touchstart", ontouch, true);
		canvas.addEventListener("touchmove", ontouch, true);
		canvas.addEventListener("touchend", ontouch, true);
		canvas.addEventListener("touchcancel", ontouch, true);   

		canvas.addEventListener('gesturestart', ongesture );
		canvas.addEventListener('gesturechange', ongesture );
		canvas.addEventListener('gestureend', ongesture );
	}

	//translates touch events in mouseevents
	function ontouch( e )
	{
		var touches = e.changedTouches,
			first = touches[0],
			type = "";

		if( gl.ontouch && gl.ontouch(e) === false )
			return;

		if( LEvent.trigger( gl, e.type, e ) === false )
			return;

		if(!translate_touches)
			return;

		//ignore secondary touches
        if(e.touches.length && e.changedTouches[0].identifier !== e.touches[0].identifier)
        	return;
        	
		if(touches > 1)
			return;

		 switch(e.type)
		{
			case "touchstart": type = "mousedown"; break;
			case "touchmove":  type = "mousemove"; break;        
			case "touchend":   type = "mouseup"; break;
			default: return;
		}

		var simulatedEvent = document.createEvent("MouseEvent");
		simulatedEvent.initMouseEvent(type, true, true, window, 1,
								  first.screenX, first.screenY,
								  first.clientX, first.clientY, false,
								  false, false, false, 0/*left*/, null);
		simulatedEvent.originalEvent = simulatedEvent;
		simulatedEvent.is_touch = true;
		first.target.dispatchEvent( simulatedEvent );
		e.preventDefault();
	}

	function ongesture(e)
	{
		e.eventType = e.type;

		if(gl.ongesture && gl.ongesture(e) === false )
			return;

		if( LEvent.trigger( gl, e.type, e ) === false )
			return;

		e.preventDefault();
	}

	var keys = gl.keys = {};

	/**
	* Tells the system to capture key events on the canvas. This will trigger onkey
	* @method captureKeys
	* @param {boolean} prevent_default prevent default behaviour (like scroll on the web, etc)
	* @param {boolean} only_canvas only caches keyboard events if they happen when the canvas is in focus
	*/
	var onkey_handler = null;
	gl.captureKeys = function( prevent_default, only_canvas ) {
		if(onkey_handler) 
			return;
		gl.keys = {};

		var target = only_canvas ? gl.canvas : document;

		document.addEventListener("keydown", inner );
		document.addEventListener("keyup", inner );
		function inner(e) { onkey(e, prevent_default); }
		onkey_handler = inner;
	}



	function onkey(e, prevent_default)
	{
		//trace(e);
		e.eventType = e.type; //type cannot be overwritten, so I make a clone to allow me to overwrite

		var target_element = e.target.nodeName.toLowerCase();
		if(target_element === "input" || target_element === "textarea" || target_element === "select")
			return;

		e.character = String.fromCharCode(e.keyCode).toLowerCase();
		var prev_state = false;
		var key = GL.mapKeyCode(e.keyCode);
		if(!key) //this key doesnt look like an special key
			key = e.character;

		//regular key
		if (!e.altKey && !e.ctrlKey && !e.metaKey) {
			if (key) 
				gl.keys[key] = e.type == "keydown";
			prev_state = gl.keys[e.keyCode];
			gl.keys[e.keyCode] = e.type == "keydown";
		}

		//avoid repetition if key stays pressed
		if(prev_state != gl.keys[e.keyCode])
		{
			if(e.type == "keydown" && gl.onkeydown) 
				gl.onkeydown(e);
			else if(e.type == "keyup" && gl.onkeyup) 
				gl.onkeyup(e);
			LEvent.trigger(gl, e.type, e);
		}

		if(gl.onkey)
			gl.onkey(e);

		if(prevent_default && (e.isChar || GL.blockable_keys[e.keyIdentifier || e.key ]) )
			e.preventDefault();
	}

	//gamepads
	gl.gamepads = null;
	/*
	function onButton(e, pressed)
	{
		console.log(e);
		if(pressed && gl.onbuttondown)
			gl.onbuttondown(e);
		else if(!pressed && gl.onbuttonup)
			gl.onbuttonup(e);
		if(gl.onbutton)
			gl.onbutton(e);
		LEvent.trigger(gl, pressed ? "buttondown" : "buttonup", e );
	}
	function onGamepad(e)
	{
		console.log(e);
		if(gl.ongamepad) 
			gl.ongamepad(e);
	}
	*/

	/**
	* Tells the system to capture gamepad events on the canvas. 
	* @method captureGamepads
	*/
	gl.captureGamepads = function()
	{
		var getGamepads = navigator.getGamepads || navigator.webkitGetGamepads || navigator.mozGetGamepads; 
		if(!getGamepads) return;
		this.gamepads = getGamepads.call(navigator);

		//only in firefox, so I cannot rely on this
		/*
		window.addEventListener("gamepadButtonDown", function(e) { onButton(e, true); }, false);
		window.addEventListener("MozGamepadButtonDown", function(e) { onButton(e, true); }, false);
		window.addEventListener("WebkitGamepadButtonDown", function(e) { onButton(e, true); }, false);
		window.addEventListener("gamepadButtonUp", function(e) { onButton(e, false); }, false);
		window.addEventListener("MozGamepadButtonUp", function(e) { onButton(e, false); }, false);
		window.addEventListener("WebkitGamepadButtonUp", function(e) { onButton(e, false); }, false);
		window.addEventListener("gamepadconnected", onGamepad, false);
		window.addEventListener("gamepaddisconnected", onGamepad, false);
		*/

	}

	/**
	* returns the detected gamepads on the system
	* @method getGamepads
	* @param {bool} skip_mapping if set to true it returns the basic gamepad, otherwise it returns a class with mapping info to XBOX controller
	*/
	gl.getGamepads = function(skip_mapping)
	{
		//gamepads
		var getGamepads = navigator.getGamepads || navigator.webkitGetGamepads || navigator.mozGetGamepads; 
		if(!getGamepads)
			return;
		var gamepads = getGamepads.call(navigator);
		if(!this.gamepads)
			this.gamepads = [];
		for(var i = 0; i < 4; i++)
		{
			var gamepad = gamepads[i]; //current state

			if(gamepad && !skip_mapping)
				addGamepadXBOXmapping(gamepad);

			var old_gamepad = this.gamepads[i]; //old state

			//launch connected gamepads events
			if(!old_gamepad && gamepad)
			{
				var event = new CustomEvent("gamepadconnected");
				event.eventType = event.type;
				event.gamepad = gamepad;;
				if(this.ongamepadconnected)
					this.ongamepadconnected(event);
				LEvent.trigger(gl,"gamepadconnected",event);
			}
			else if(old_gamepad && !gamepad)
			{
				var event = new CustomEvent("gamepaddisconnected");
				event.eventType = event.type;
				event.gamepad = old_gamepad;
				if(this.ongamepaddisconnected)
					this.ongamepaddisconnected(event);
				LEvent.trigger(gl,"gamepaddisconnected",event);
			}

			//seek buttons changes to trigger events
			if(gamepad)
			{
				for(var j = 0; j < gamepad.buttons.length; ++j)
				{
					var button = gamepad.buttons[j];
					if( button.pressed && (!old_gamepad || !old_gamepad.buttons[j].pressed))
					{
						var event = new CustomEvent("gamepadButtonDown");
						event.eventType = event.type;
						event.button = button;
						event.which = j;
						event.gamepad = gamepad;
						if(gl.onbuttondown)
							gl.onbuttondown(event);
						LEvent.trigger(gl,"buttondown",event);
					}
					else if( !button.pressed && (old_gamepad && old_gamepad.buttons[j].pressed))
					{
						var event = new CustomEvent("gamepadButtonUp");
						event.eventType = event.type;
						event.button = button;
						event.which = j;
						event.gamepad = gamepad;
						if(gl.onbuttondown)
							gl.onbuttondown(event);
						LEvent.trigger(gl,"buttonup",event);
					}
				}
			}
		}
		this.gamepads = gamepads;
		return gamepads;
	}

	function addGamepadXBOXmapping(gamepad)
	{
		//xbox controller mapping
		var xbox = { axes:[], buttons:{}, hat: ""};
		xbox.axes["lx"] = gamepad.axes[0];
		xbox.axes["ly"] = gamepad.axes[1];
		xbox.axes["rx"] = gamepad.axes[2];
		xbox.axes["ry"] = gamepad.axes[3];
		xbox.axes["triggers"] = gamepad.axes[4];

		for(var i = 0; i < gamepad.buttons.length; i++)
		{
			switch(i) //I use a switch to ensure that a player with another gamepad could play
			{
				case 0: xbox.buttons["a"] = gamepad.buttons[i].pressed; break;
				case 1: xbox.buttons["b"] = gamepad.buttons[i].pressed; break;
				case 2: xbox.buttons["x"] = gamepad.buttons[i].pressed; break;
				case 3: xbox.buttons["y"] = gamepad.buttons[i].pressed; break;
				case 4: xbox.buttons["lb"] = gamepad.buttons[i].pressed; break;
				case 5: xbox.buttons["rb"] = gamepad.buttons[i].pressed; break;
				case 6: xbox.buttons["lt"] = gamepad.buttons[i].pressed; break;
				case 7: xbox.buttons["rt"] = gamepad.buttons[i].pressed; break;
				case 8: xbox.buttons["back"] = gamepad.buttons[i].pressed; break;
				case 9: xbox.buttons["start"] = gamepad.buttons[i].pressed; break;
				case 10: xbox.buttons["ls"] = gamepad.buttons[i].pressed; break;
				case 11: xbox.buttons["rs"] = gamepad.buttons[i].pressed; break;
				case 12: if( gamepad.buttons[i].pressed) xbox.hat += "up"; break;
				case 13: if( gamepad.buttons[i].pressed) xbox.hat += "down"; break;
				case 14: if( gamepad.buttons[i].pressed) xbox.hat += "left"; break;
				case 15: if( gamepad.buttons[i].pressed) xbox.hat += "right"; break;
				case 16: xbox.buttons["home"] = gamepad.buttons[i].pressed; break;
				default:
			}
		}
		gamepad.xbox = xbox;
	}

	/**
	* launches de canvas in fullscreen mode
	* @method fullscreen
	*/
	gl.fullscreen = function()
	{
		var canvas = this.canvas;
		if(canvas.requestFullScreen)
			canvas.requestFullScreen();
		else if(canvas.webkitRequestFullScreen)
			canvas.webkitRequestFullScreen();
		else if(canvas.mozRequestFullScreen)
			canvas.mozRequestFullScreen();
		else
			console.error("Fullscreen not supported");
	}

	/**
	* returns a canvas with a snapshot of an area
	* this is safer than using the canvas itself due to internals of webgl
	* @method snapshot
	* @param {Number} startx viewport x coordinate
	* @param {Number} starty viewport y coordinate from bottom
	* @param {Number} areax viewport area width
	* @param {Number} areay viewport area height
	* @return {Canvas} canvas
	*/
	gl.snapshot = function(startx, starty, areax, areay, skip_reverse)
	{
		var canvas = createCanvas(areax,areay);
		var ctx = canvas.getContext("2d");
		var pixels = ctx.getImageData(0,0,canvas.width,canvas.height);

		var buffer = new Uint8Array(areax * areay * 4);
		gl.readPixels(startx, starty, canvas.width, canvas.height, gl.RGBA,gl.UNSIGNED_BYTE, buffer);

		pixels.data.set( buffer );
		ctx.putImageData(pixels,0,0);

		if(skip_reverse)
			return canvas;

		//flip image 
		var final_canvas = createCanvas(areax,areay);
		var ctx = final_canvas.getContext("2d");
		ctx.translate(0,areay);
		ctx.scale(1,-1);
		ctx.drawImage(canvas,0,0);

		return final_canvas;
	}


	//mini textures manager
	var loading_textures = {};
	/**
	* returns a texture and caches it inside gl.textures[]
	* @method loadTexture
	* @param {String} url
	* @param {Object} options (same options as when creating a texture)
	* @param {Function} callback function called once the texture is loaded
	* @return {Texture} texture
	*/
	gl.loadTexture = function(url, options, on_load)
	{
		if(this.textures[ url ])
			return this.textures[url];

		if( loading_textures[url] )
			return null;

		var img = new Image();
		img.url = url;
		img.onload = function()
		{
			var texture = GL.Texture.fromImage(this, options);
			texture.img = this;
			gl.textures[this.url] = texture;
			delete loading_textures[this.url];
			if(on_load)
				on_load(texture);
		} 
		img.src = url;
		loading_textures[url] = true;
		return null;
	}

	/**
	* draws a texture to the viewport
	* @method drawTexture
	* @param {Texture} texture
	* @param {number} x in viewport coordinates 
	* @param {number} y in viewport coordinates 
	* @param {number} w in viewport coordinates 
	* @param {number} h in viewport coordinates 
	* @param {number} tx texture x in texture coordinates
	* @param {number} ty texture y in texture coordinates
	* @param {number} tw texture width in texture coordinates
	* @param {number} th texture height in texture coordinates
	*/
	gl.drawTexture = (function() {
		//static variables: less garbage
		var identity = mat3.create();
		var pos = vec2.create();
		var size = vec2.create();
		var area = vec4.create();
		var white = vec4.fromValues(1,1,1,1);
		var viewport = vec2.create();
		var _uniforms = {u_texture: 0, u_position: pos, u_color: white, u_size: size, u_texture_area: area, u_viewport: viewport, u_transform: identity };

		return (function(texture, x,y, w,h, tx,ty, tw,th, shader, uniforms)
		{
			pos[0] = x;	pos[1] = y;
			if(w === undefined)
				w = texture.width;
			if(h === undefined)
				h = texture.height;
			size[0] = w;
			size[1] = h;

			if(tx === undefined) tx = 0;
			if(ty === undefined) ty = 0;
			if(tw === undefined) tw = texture.width;
			if(th === undefined) th = texture.height;

			area[0] = tx / texture.width;
			area[1] = ty / texture.height;
			area[2] = (tx + tw) / texture.width;
			area[3] = (ty + th) / texture.height;

			viewport[0] = this.viewport_data[2];
			viewport[1] = this.viewport_data[3];

			shader = shader || Shader.getPartialQuadShader(this);
			var mesh = Mesh.getScreenQuad(this);
			texture.bind(0);
			shader.uniforms( _uniforms );
			if( uniforms )
				shader.uniforms( uniforms );
			shader.draw( mesh, gl.TRIANGLES );
		});
	})();

	gl.canvas.addEventListener("webglcontextlost", function(e) {
		e.preventDefault();
		gl.context_lost = true;
		if(gl.onlosecontext)
			gl.onlosecontext(e);
	}, false);

	/**
	* use it to reset the the initial gl state
	* @method gl.reset
	*/
	gl.reset = function()
	{
		//viewport
		gl.viewport(0,0, this.canvas.width, this.canvas.height );

		//flags
		gl.disable( gl.BLEND );
		gl.disable( gl.CULL_FACE );
		gl.disable( gl.DEPTH_TEST );
		gl.frontFace( gl.CCW );

		//texture
		gl._current_texture_drawto = null;
		gl._current_fbo_color = null;
		gl._current_fbo_depth = null;
	}

	gl.dump = function()
	{
		console.log("userAgent: ", navigator.userAgent );
		console.log("Supported extensions:");
		var extensions = gl.getSupportedExtensions();
		console.log( extensions.join(",") );
		var info = [ "VENDOR", "VERSION", "MAX_VERTEX_ATTRIBS", "MAX_VARYING_VECTORS", "MAX_VERTEX_UNIFORM_VECTORS", "MAX_VERTEX_TEXTURE_IMAGE_UNITS", "MAX_FRAGMENT_UNIFORM_VECTORS", "MAX_TEXTURE_SIZE", "MAX_TEXTURE_IMAGE_UNITS" ];
		console.log("WebGL info:");
		for(var i in info)
			console.log(" * " + info[i] + ": " + gl.getParameter( gl[info[i]] ));
		console.log("*************************************************")
	}

	//Reset state
	gl.reset();

	//Return
	return gl;
}

GL.mapKeyCode = function(code)
{
	var named = {
		8: 'BACKSPACE',
		9: 'TAB',
		13: 'ENTER',
		16: 'SHIFT',
		17: 'CTRL',
		27: 'ESCAPE',
		32: 'SPACE',
		37: 'LEFT',
		38: 'UP',
		39: 'RIGHT',
		40: 'DOWN'
	};
	return named[code] || (code >= 65 && code <= 90 ? String.fromCharCode(code) : null);
}

//add useful info to the event
GL.dragging = false;
GL.last_pos = [0,0];

//adds extra info to the MouseEvent (coordinates in canvas axis, deltas and button state)
GL.augmentEvent = function(e, root_element)
{
	var offset_left = 0;
	var offset_top = 0;
	var b = null;

	root_element = root_element || e.target || gl.canvas;
	b = root_element.getBoundingClientRect();
		
	e.mousex = e.clientX - b.left;
	e.mousey = e.clientY - b.top;
	e.canvasx = e.mousex;
	e.canvasy = b.height - e.mousey;
	e.deltax = 0;
	e.deltay = 0;
	
	if(e.type == "mousedown")
	{
		this.dragging = true;
		gl.mouse.buttons |= (1 << e.which); //enable
	}
	else if (e.type == "mousemove")
	{
	}
	else if (e.type == "mouseup")
	{
		gl.mouse.buttons = gl.mouse.buttons & ~(1 << e.which);
		if(gl.mouse.buttons == 0)
			this.dragging = false;
	}

	if( e.movementX !== undefined && !GL.isMobile() ) //pointer lock (mobile gives always zero)
	{
		//console.log( e.movementX )
		e.deltax = e.movementX;
		e.deltay = e.movementY;
	}
	else
	{
		e.deltax = e.mousex - this.last_pos[0];
		e.deltay = e.mousey - this.last_pos[1];
	}
	this.last_pos[0] = e.mousex;
	this.last_pos[1] = e.mousey;

	//insert info in event
	e.dragging = this.dragging;
	e.buttons_mask = gl.mouse.buttons;
	e.leftButton = gl.mouse.buttons & (1<<GL.LEFT_MOUSE_BUTTON);
	e.middleButton = gl.mouse.buttons & (1<<GL.MIDDLE_MOUSE_BUTTON);
	e.rightButton = gl.mouse.buttons & (1<<GL.RIGHT_MOUSE_BUTTON);
	e.isButtonPressed = function(num) { return this.buttons_mask & (1<<num); }
}

/**
* Tells you if the app is running on a mobile device (iOS or Android)
* @method isMobile
* @return {boolean} true if is running on a iOS or Android device
*/
GL.isMobile = function()
{
	if(this.mobile !== undefined)
		return this.mobile;

	if(!global.navigator) //server side js?
		return this.mobile = false;

	if( (navigator.userAgent.match(/iPhone/i)) || 
		(navigator.userAgent.match(/iPod/i)) || 
		(navigator.userAgent.match(/iPad/i)) || 
		(navigator.userAgent.match(/Android/i))) {
		return this.mobile = true;
	}
	return this.mobile = false;
}