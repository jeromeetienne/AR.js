
function Label(o)
{
	this.text = "";
	this.className = "";
	this.use_html = false;
	this._world_pos = vec3.create();
	this._screen_pos = vec3.create();
	this.configure(o);
}

Label.icon = "mini-icon-text.png";
Label.CSS_classname = "LS3D_label";

Label.prototype.onAddedToScene = function( scene )
{
	//events
	LEvent.bind( scene,"renderGUI",this.render,this);
}

Label.prototype.onRemovedFromScene = function(scene)
{
	LEvent.unbind( scene, "renderGUI", this.render, this);
	this.removeHTML();
}

Label.prototype.createHTML = function()
{
	//create html
	var elem = document.createElement("div");
	elem.innerHTML = this.text;
	var style = elem.style;
	style.className = this.constructor.CSS_classname;
	style.position = "absolute";
	style.top = 0;
	style.left = 0;
	style.fontSize = "20px";
	style.padding = "10px";
	style.color = "white";
	style.minWidth = "100px";
	style.pointerEvents = "none";
	style.backgroundColor = "rgba(0,0,0,0.5)";
	style.borderRadius = "2px";

	var parent = LS.getGUIElement();
	parent.appendChild( elem );

	this._element = elem;
}

Label.prototype.removeHTML = function()
{
	if(!this._element)
		return;
	if(this._element.parentNode)
		this._element.parentNode.removeChild( this._element );
	this._element = null;
}

Label.prototype.render = function(e, render_settings)
{
	var node = this._root;

	var camera = LS.Renderer._main_camera;
	if(!camera)
		return;

	node.transform.getGlobalPosition(this._world_pos);
	camera.project(this._world_pos, null, this._screen_pos );

	if(this.use_html)
	{
		if(!this._element)
			this.createHTML();

		if(this._element.innerHTML != this.text)
			this._element.innerHTML = this.text;

		this._element.style.display = node.flags.visible === false ? "none" : "block";
		if(!this.text)
		{
			this._element.style.display = "none";
			return;
		}

		var classname = this.constructor.CSS_classname + " " + this.className;
		if(this._element.className != classname)
			this._element.className = classname;

		this._element.style.left = this._screen_pos[0].toFixed(0) + "px";
		this._element.style.top = (gl.canvas.height - (this._screen_pos[1]|0) - 10) + "px";
	}
	else
	{
		if(this._element)
			this.removeHTML();

		if(gl.start2D)
		{
			var x = this._screen_pos[0] + 5;
			var y = gl.canvas.height - this._screen_pos[1] + 10;
			gl.start2D();
			gl.font = "20px Arial";
			var info = gl.measureText( this.text );
			gl.fillStyle = "black";
			gl.globalAlpha = 0.5;
			gl.fillRect( x - 5, y - 20, info.width + 10, 26 );
			gl.globalAlpha = 1;
			gl.fillStyle = "white";
			gl.fillText( this.text, x, y );
			gl.finish2D();
		}
	}
}

LS.registerComponent(Label);

