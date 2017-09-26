function AnnotationComponent(o)
{
	this.text = "";
	this.notes = [];
	this._screen_pos = vec3.create();
	this._selected = null;
	this.configure(o);
}

AnnotationComponent.editor_color = [0.33,0.874,0.56,0.9];


AnnotationComponent.onShowMainAnnotation = function (node)
{
	if(typeof(AnnotationModule) != "undefined")
		AnnotationModule.editAnnotation(node);
}

AnnotationComponent.onShowPointAnnotation = function (node, note)
{
	var comp = node.getComponent( AnnotationComponent );
	if(!comp) return;

	//in editor...
	if(typeof(AnnotationModule) != "undefined")
	{
		AnnotationModule.showDialog( note.text, { 
			item: note, 
			on_close: inner_update_note.bind(note), 
			on_delete: function(info) { 
				comp.removeAnnotation(info.item);
				this._root.scene.requestFrame();
			},
			on_focus: function(info) { 
				AnnotationModule.focusInAnnotation(info.item);
				comp._selected = info.item;
			}});
	}


	function inner_update_note(text)
	{
		this.text = text;
	}
}

AnnotationComponent.prototype.addAnnotation = function(item)
{
	this._selected = null;
	this.notes.push(item);
}

AnnotationComponent.prototype.getAnnotation = function(index)
{
	return this.nodes[ index ];
}

AnnotationComponent.prototype.removeAnnotation = function(item)
{
	this._selected = null;
	var pos = this.notes.indexOf(item);
	if(pos != -1)
		this.notes.splice(pos,1);
}

AnnotationComponent.prototype.setStartTransform = function()
{
	this.start_position = this.getObjectCenter();
}

AnnotationComponent.prototype.getObjectCenter = function()
{
	var center = vec3.create();
	var mesh = this._root.getMesh();
	if(mesh && mesh.bounding )
		vec3.copy( center, BBox.getCenter(mesh.bounding) );
	var pos = this._root.transform.localToGlobal( center );
	return pos;
}

AnnotationComponent.prototype.serialize = function()
{
	var o = {
		object_class: "AnnotationComponent",
		text: this.text,
		notes: [],
		start_position: this.start_position
	};
	
	for(var i = 0; i < this.notes.length; ++i)
	{
		var note = this.notes[i];
		for(var j in note)
		{
			if(note[j].constructor == Float32Array)
				Array.prototype.slice.call( note[j] );
		}
		o.notes.push(note);
	}
	return o;
}

AnnotationComponent.prototype.onAddedToScene = function(scene)
{
	LEvent.bind( scene,"mousedown",this.onMouse,this);
}

AnnotationComponent.prototype.onRemovedFromScene = function(scene)
{
	LEvent.bind( scene,"mousedown",this.onMouse,this);
}

AnnotationComponent.prototype.onMouse = function(type, e)
{
	if(e.eventType == "mousedown")
	{
		var node = this._root;
		this._screen_pos[2] = 0;
		var dist = vec3.dist( this._screen_pos, [e.canvasx, gl.canvas.height - e.canvasy, 0] );
		if(dist < 30)
		{
			var that = this;
			AnnotationComponent.onShowMainAnnotation(this._root);
		}

		for(var i = 0; i < this.notes.length; ++i)
		{
			var note = this.notes[i];
			dist = vec2.dist( note._end_screen, [e.mousex, gl.canvas.height - e.mousey] );
			if(dist < 30)
			{
				this._selected = note;
				AnnotationComponent.onShowPointAnnotation(this._root, note);
				return true;
			}
		}
	}
}

AnnotationComponent.prototype.renderEditor = function( selected )
{
	if(!this.text && !this.notes.length)
		return;

	var center = vec3.create();
	var mesh = this._root.getMesh();
	if(mesh)
		vec3.copy( center, BBox.getCenter(mesh.bounding) );

	var camera = LS.Renderer._current_camera;

	var pos = this._root.transform.getGlobalPosition();
	var object_center = this.getObjectCenter();
	var camera_eye = camera.getEye();
	var right = camera.getLocalVector([1,0,0]);
	var top = 	camera.getLocalVector([0,1,0]);
	var front = camera.getLocalVector([0,0,1]);

	var f = Math.tan(camera.fov*DEG2RAD) * vec3.dist( pos, camera_eye );

	//why? to scale the icon?
	var icon_top = vec3.scale(vec3.create(), top, f * 0.2);
	var icon_right = vec3.scale(vec3.create(), right, f * 0.2);
	var icon_pos = vec3.add( vec3.create(), pos, icon_top );
	vec3.add( icon_pos, icon_right, icon_pos);

	camera.project( icon_pos, null, this._screen_pos );
	//var right = camera.getLocalVector([10,0,0]);
	//trace(this._screen_pos);

	gl.enable(gl.BLEND);
	gl.enable(gl.DEPTH_TEST);
	LS.Draw.setColor([1,1,1,1]);

	var lines = [];
	var lines_colors = [];
	var points = [];
	var points_colors = [];

	if(this.text)
	{
		lines.push(pos, icon_pos);
		lines_colors.push( [1,1,1,0],[1,1,1,1]);
		//Draw.setColor([0.33,0.874,0.56,1.0]);
		if( window.EditorModule )
			LS.Draw.renderImage( icon_pos, EditorModule.icons_path + "/mini-icon-script.png",f * 0.03);
	}

	var model = this._root.transform.getGlobalMatrix();

	//notes
	for(var i = 0; i < this.notes.length; ++i)
	{
		var note = this.notes[i];
		var start = mat4.multiplyVec3( vec3.create(), model, note.start );
		var end = mat4.multiplyVec3( vec3.create(), model, note.end );
		note.end_world = end;

		points.push( end );
		lines.push( start, end );

		if(this._selected == note)
		{
			points_colors.push( [1,1,1,1] );
			lines_colors.push( [1,1,1,0.2],[1,1,0.8,1]);
		}
		else
		{
			points_colors.push( LS.Components.AnnotationComponent.editor_color );
			lines_colors.push( [0,0,0,0.2], LS.Components.AnnotationComponent.editor_color );
		}
		note._end_screen = camera.project( end );
	}

	//transform
	var start = this.start_position;
	if(start && vec3.dist(start, object_center) > 1)
	{
		//dashed line...
		var dist = vec3.dist(start, object_center);
		var line_dist = dist / 20.0;
		var delta = vec3.subtract(vec3.create(), object_center, start );
		vec3.normalize(delta, delta);
		for(var i = 0; i < 20; i += 2)
		{
			var temp = vec3.scale(vec3.create(), delta, i*line_dist );
			vec3.add(temp, temp, start);
			lines.push(temp);
			
			temp = vec3.scale(vec3.create(), delta,(i+1)*line_dist );
			vec3.add(temp, temp, start);
			lines.push(temp);
			lines_colors.push( [0,1,0,0.2],[0,1,0,1]);
		}
	}

	//render in two passes to have the cool semitransparent effect 
	LS.Draw.setPointSize( 12 );
	LS.Draw.renderPoints(points, points_colors);

	LS.Draw.setColor( [0,0,0,0.5] );
	LS.Draw.setPointSize( 10 );
	LS.Draw.renderPoints(points, points_colors);

	LS.Draw.setColor([1,1,1,1]);
	LS.Draw.renderLines(lines, lines_colors);

	gl.depthFunc( gl.GREATER );

	LS.Draw.setAlpha(0.1);
	LS.Draw.renderPoints(points, points_colors);
	LS.Draw.renderLines(lines, lines_colors);

	gl.depthFunc( gl.LESS );

	//texts
	gl.disable( gl.CULL_FACE );
	LS.Draw.setColor( LS.Components.AnnotationComponent.editor_color );
	for(var i = 0; i < this.notes.length; ++i)
	{
		var note = this.notes[i];
		LS.Draw.push();
		//Draw.lookAt( note.end_world, camera_eye, [0,1,0] );
		LS.Draw.fromTranslationFrontTop(note.end_world, front, top );

		LS.Draw.translate( [-1,-1,0] );
		LS.Draw.scale( [-0.0004 * f,0.0004 * f,0.0004 * f] );
		var first_line = note.text.split("\n")[0];
		LS.Draw.renderText( first_line );
		//Draw.renderWireBox(10,10,10);
		LS.Draw.pop();
	}

	gl.disable(gl.BLEND);
}


LS.registerComponent( AnnotationComponent );