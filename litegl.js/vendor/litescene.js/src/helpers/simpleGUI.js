//WORK IN PROGRESS

(function(global){

//GUI
function SimpleGUI()
{
	this.widgets = [];
	this.on_event = null;
	this.root = new SimpleGUI.Widget();
	this.root.gui = this;
	this.area = vec4.fromValues(0,0,512,512);

	this.colors = {
		clicked: "#55F",
		over: "#555",
		active: "#333"
	}
}

SimpleGUI.prototype.draw = function(ctx, area)
{
	this.area[2] = ctx.drawingBufferWidth || gl.canvas.width;
	this.area[3] = ctx.drawingBufferHeight || gl.canvas.height;

	this.root.draw(ctx, this.area);
}

SimpleGUI.prototype.onmouse = function(e)
{
	this.root.onmouse(e);
}

//WIDGET
SimpleGUI.Widget = function Widget()
{
	this.caption = "";
	this.position = vec2.fromValues(0,0);
	this.size = vec2.fromValues(100,50);

	this.gui = null;
	this.parent = null;
	this.children = [];

	this._area = vec4.create(); //startx, starty, endx, endy
	this.flags = {
		visible: true,
		ignore_mouse: false
	};
}

Widget.prototype.draw = function(ctx, area)
{
	ctx.save();
	ctx.translate( this.position[0], this.position[1] );
	this._area[0] = area[0] + this.position[0];
	this._area[1] = area[1] + this.position[1];
	this._area[2] = this._area[0] + this.size[0];
	this._area[3] = this._area[1] + this.size[1];

	if(this.onDraw)
		this.onDraw( ctx, this._area );	

	ctx.restore();
}

Widget.prototype.addChild = function(w)
{
	if(w.parent)
		throw("Widget: Already has parent");
	this.children.push(w);
	w.parent = this;
	w.gui = this.gui;
	if(w.children.length)
		this.recursiveAssign("gui",this.gui);
}

//recursive assign
Widget.prototype.recursiveAssign = function( property, value )
{
	for(var i = 0; i < this.children.length; ++i)
	{
		var w = this.children[i];
		w[ property ] = value;
		if(w.children.length)
			w.recursiveAssign(property,value);
	}
}

Widget.prototype.removeChild = function(w)
{
	if(w.parent != this)
		throw("Widget: not its child");
	var index = this.children.indexOf(w);
	if(index != -1)
		throw("weird, it should be its child");
	this.children.splice(index,1);
	w.parent = null;
	w.gui = null;
	if(w.children.length)
		this.recursiveAssign("gui",null);
}


SimpleGUI.Button = function Button() {
  Widget.call(this); // call super constructor.
  this.images = {
  
  };
}
Button.prototype = Object.create(Widget.prototype);

Button.prototype.onDraw = function(ctx, area)
{
	ctx.save();
	ctx.fillColor = this.gui.colors.active;
	//ctx.globalAlpha = 1;
	ctx.fillRect(0,0,this.size[0],this.size[1]);
	ctx.textAlign = "center";
	ctx.fillText(this.caption, this.size[0] * 0.5, this.size[1] * 0.75 );
	//ctx.globalAlpha = 1;
	ctx.restore();
}



global.SimpleGUI = SimpleGUI;
if(typeof(global.LS) !== "undefined")
	LS.SimpleGUI = SimpleGUI;

})(typeof(global) !== "undefined" ? global : window );


