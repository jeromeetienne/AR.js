
/**
* Input is a static class used to read the input state (keyboard, mouse, gamepad, etc)
*
* @class Input
* @namespace LS
* @constructor
*/
var Input = {
	mapping: {

		//xbox
		A_BUTTON: 0,
		B_BUTTON: 1,
		X_BUTTON: 2,
		Y_BUTTON: 3,
		LB_BUTTON: 4,
		RB_BUTTON: 5,
		BACK_BUTTON: 6,
		START_BUTTON: 7,
		LS_BUTTON: 8,
		RS_BUTTON: 9,

		LX: 0,
		LY: 1,
		RX: 2,
		RY: 3,
		TRIGGERS: 4,
		LEFT_TRIGGER: 4,
		RIGHT_TRIGGER: 5,

		//generic
		JUMP:0,
		FIRE:1,

		//mouse
		LEFT:0,
		MIDDLE:1,
		RIGHT:2
	},

	LEFT_MOUSE_BUTTON: 1,
	MIDDLE_MOUSE_BUTTON: 2,
	RIGHT_MOUSE_BUTTON: 3,

	Keyboard: [],
	Mouse: {},
	Gamepads: [],

	//used for GUI elements
	last_mouse: null,
	last_click: null,
	current_click: null,
	current_key: null,
	keys_buffer: [],

	//_mouse_event_offset: [0,0],
	_last_frame: -1, //internal

	init: function()
	{
		this.Keyboard = gl.keys;
		this.Mouse = gl.mouse;
		this.Gamepads = gl.getGamepads();
	},

	reset: function()
	{
		this.Gamepads = gl.gamepads = []; //force reset so they send new events 
	},

	update: function()
	{
		//capture gamepads snapshot
		this.Gamepads = gl.getGamepads();
	},

	//called from LS.Player when onmouse
	onMouse: function(e)
	{
		this.last_mouse = e;

		this.Mouse.mousex = e.mousex;
		this.Mouse.mousey = e.mousey;

		//save it in case we need to know where was the last click
		if(e.type == "mousedown")
			this.current_click = e;
		else if(e.type == "mouseup")
			this.current_click = null;

		//we test if this event should be sent to the components or it was blocked by the GUI
		return LS.GUI.testEventInBlockedArea(e);
	},

	//called from LS.Player when onkey
	onKey: function(e)
	{
		if(e.type == "keydown")
		{
			this.current_key = e;
			if( LS.Renderer._frame != this._last_frame )
			{
				this.keys_buffer.length = 0;
				LS.Renderer._frame = this._last_frame;
			}
			if( this.keys_buffer.length < 10 ) //safety first!
				this.keys_buffer.push(e);
		}
		else
			this.current_key = null;
	},

	/**
	* returns if the mouse is inside the rect defined by x,y, width,height
	*
	* @method isMouseInRect
	* @param {Number} x x coordinate of the mouse in canvas coordinates 
	* @param {Number} y y coordinate of the mouse in canvas coordinates (0 is bottom)
	* @param {Number} width rectangle width in pixels
	* @param {Number} height rectangle height in pixels
	* @param {boolean} flip [optional] if you want to flip the y coordinate
	* @return {boolean}
	*/
	isMouseInRect: function( x, y, width, height, flip_y )
	{
		return this.Mouse.isInsideRect(x,y,width,height,flip_y);
	},

	isEventInRect: function( e, area, offset )
	{
		var offsetx = 0;
		var offsety = 0;
		if(offset)
		{
			offsetx = offset[0];
			offsety = offset[1];
		}
		return ( (e.mousex - offsetx) >= area[0] && (e.mousex - offsetx) < (area[0] + area[2]) && (e.mousey - offsety) >= area[1] && (e.mousey - offsety) < (area[1] + area[3]) );
	},

	/**
	* Returns a gamepad snapshot if it is connected
	*
	* @method getGamepad
	* @param {Number} index the index of the gamepad
	* @return {Object} gamepad snapshot with all the info
	*/
	getGamepad: function(index)
	{
		index = index || 0;
		return this.Gamepads[index];
	},

	/**
	* Returns a gamepad snapshot if it is connected
	*
	* @method getGamepadAxis
	* @param {Number} index the index of the gamepad
	* @param {String} name the name of the axis (also you could specify the number)
	* @param {boolean} raw [optional] if you want the data unfiltered
	* @return {Number} axis value from -1 to 1
	*/
	getGamepadAxis: function(index, name, raw)
	{
		var gamepad = this.Gamepads[index];
		if(!gamepad)
			return 0;

		var num = 0;
		if(name && name.constructor === String)
			num = this.mapping[name];
		else
			num = name;
		if(num === undefined)
			return 0;
		var v = gamepad.axes[num];
		if(!raw && v > -0.1 && v < 0.1 ) //filter
			return 0;
		return v;
	},

	/**
	* Returns if the given button of the specified gamepad is pressed
	*
	* @method isGamepadButtonPressed
	* @param {Number} index the index of the gamepad
	* @param {String} name the name of the button "A","B","X","Y","LB","RB","BACK","START","LS","RS" (also you could specify the number)
	* @return {Boolean} if the button is pressed
	*/
	isGamepadButtonPressed: function(input, name)
	{
		var gamepad = this.Gamepads[input];
		if(!gamepad)
			return null;

		var num = 0;
		if(name && name.constructor === String)
			num = this.mapping[name];
		else
			num = name;
		if(num === undefined)
			return 0;
		var button = gamepad.buttons[num];
		return button && button.pressed;
	},

	/**
	* Returns if the given mouse button is pressed
	*
	* @method isMouseButtonPressed
	* @param {String} name the name of the button  "LEFT","MIDDLE,"RIGHT" (also you could specify the number)
	* @return {Boolean} if the button is pressed
	*/
	isMouseButtonPressed: function(name)
	{
		var num = 0;
		if(name && name.constructor === String)
			num = this.mapping[name];
		else
			num = name;
		if(num === undefined)
			return false;
		return (this.Mouse.buttons & (1<<num)) !== 0;
	}
};

LS.Input = Input;