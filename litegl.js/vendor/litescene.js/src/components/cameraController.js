/**
* Camera controller
* @class CameraController
* @constructor
* @param {String} object to configure from
*/

function CameraController(o)
{
	this.enabled = true;

	this.speed = 10;
	this.rot_speed = 1;
	this.wheel_speed = 1;
	this.smooth = false;
	this.allow_panning = true;
	this.mode = CameraController.ORBIT;

	this._moving = vec3.fromValues(0,0,0);
	this._collision = vec3.create();
	this._dragging = false; //true if the mousedown was caught so the drag belongs to this component
	this._button = null;

	this.configure(o);
}

CameraController.ORBIT = 1; //orbits around the center
CameraController.FIRSTPERSON = 2; //moves relative to the camera
CameraController.PLANE = 3; //moves paralel to a plane

CameraController.icon = "mini-icon-cameracontroller.png";

CameraController["@mode"] = { type:"enum", values: { "Orbit": CameraController.ORBIT, "FirstPerson": CameraController.FIRSTPERSON, "Plane": CameraController.PLANE }};

CameraController.prototype.onAddedToScene = function( scene )
{
	LEvent.bind( scene, "mousedown",this.onMouse,this);
	LEvent.bind( scene, "mousemove",this.onMouse,this);
	LEvent.bind( scene, "mousewheel",this.onMouse,this);
	LEvent.bind( scene, "touchstart",this.onTouch,this);
	LEvent.bind( scene, "touchmove",this.onTouch,this);
	LEvent.bind( scene, "touchend",this.onTouch,this);
	LEvent.bind( scene, "keydown",this.onKey,this);
	LEvent.bind( scene, "keyup",this.onKey,this);
	LEvent.bind( scene, "update",this.onUpdate,this);
}

CameraController.prototype.onRemovedFromScene = function( scene )
{
	LEvent.unbindAll( scene, this );
}

CameraController.prototype.onUpdate = function(e)
{
	if(!this._root || !this.enabled) 
		return;

	if(this._root.transform)
	{
	}
	else if(this._root.camera)
	{
		var cam = this._root.camera;
		if(this.mode == CameraController.FIRSTPERSON)
		{
			//move using the delta vector
			if(this._moving[0] != 0 || this._moving[1] != 0 || this._moving[2] != 0)
			{
				var delta = cam.getLocalVector( this._moving );
				vec3.scale(delta, delta, this.speed * (this._move_fast?10:1));
				cam.move(delta);
				cam.updateMatrices();
			}
		}
	}

	if(this.smooth)
	{
		this._root.scene.requestFrame();
	}
}

CameraController.prototype.onMouse = function(e, mouse_event)
{
	if(!this._root || !this.enabled) 
		return;
	
	var node = this._root;
	var cam = node.camera;
	if(!cam)
		return;

	var is_global_camera = node._is_root;

	if(!mouse_event)
		mouse_event = e;

	if(mouse_event.eventType == "mousewheel")
	{
		var wheel = mouse_event.wheel > 0 ? 1 : -1;
		cam.orbitDistanceFactor(1 + wheel * -0.05 * this.wheel_speed );
		cam.updateMatrices();
		node.scene.requestFrame();
		return;
	}

	if(mouse_event.eventType == "mousedown")
	{
		if(this.mode == CameraController.PLANE)
			this.testOriginPlane( mouse_event.canvasx, gl.canvas.height - mouse_event.canvasy, this._collision );
		else
			this.testPerpendicularPlane( mouse_event.canvasx, gl.canvas.height - mouse_event.canvasy, cam.getCenter(), this._collision );
		this._button = mouse_event.button;
		this._dragging = true;
	}

	if(!mouse_event.dragging)
		this._dragging = false;

	//regular mouse dragging
	if( mouse_event.eventType != "mousemove" || !mouse_event.dragging || !this._dragging )
		return;

	var changed = false;

	if(this.mode == CameraController.FIRSTPERSON)
	{
		cam.rotate(-mouse_event.deltax * this.rot_speed,LS.TOP);
		cam.updateMatrices();
		var right = cam.getLocalVector(LS.RIGHT);

		if(is_global_camera)
		{
			cam.rotate(-mouse_event.deltay * this.rot_speed,right);
			cam.updateMatrices();
		}
		else
		{
			node.transform.rotate(-mouse_event.deltay * this.rot_speed,right);
			cam.updateMatrices();
		}

		changed = true;
	}
	else if(this.mode == CameraController.ORBIT)
	{
		if(this.allow_panning && (mouse_event.ctrlKey || mouse_event.button == 1)) //pan
		{
			var collision = vec3.create();
			var center = vec3.create();
			var delta = vec3.create();

			cam.getCenter( center );
			this.testPerpendicularPlane( mouse_event.canvasx, gl.canvas.height - mouse_event.canvasy, center, collision );
			vec3.sub( delta, this._collision, collision );

			if(is_global_camera)
			{
				cam.move( delta );
				cam.updateMatrices();
			}
			else
			{
				node.transform.translateGlobal( delta );
				cam.updateMatrices();
			}

			changed = true;
		}
		else //regular orbit
		{
			var yaw = mouse_event.deltax * this.rot_speed;
			var pitch = -mouse_event.deltay * this.rot_speed;

			if( Math.abs(yaw) > 0.0001 )
			{
				if(is_global_camera)
				{
					cam.orbit( -yaw, [0,1,0] );
					cam.updateMatrices();
				}
				else
				{
					var eye = cam.getEye();
					node.transform.globalToLocal( eye, eye );
					node.transform.orbit( -yaw, [0,1,0], eye );
					cam.updateMatrices();
				}
				changed = true;
			}

			var right = cam.getRight();
			var front = cam.getFront();
			var up = cam.getUp();
			var problem_angle = vec3.dot( up, front );
			if( !(problem_angle > 0.99 && pitch > 0 || problem_angle < -0.99 && pitch < 0)) //avoid strange behaviours
			{
				if(is_global_camera)
				{
					cam.orbit( -pitch, right, this.orbit_center );
				}
				else
				{
					var eye = cam.getEye();
					node.transform.globalToLocal( eye, eye );
					node.transform.orbit( -pitch, right, eye );
				}
				changed = true;
			}
		}
	}
	else if(this.mode == CameraController.PLANE)
	{
		if(this._button == 2)
		{
			var center = vec3.create();
			cam.getCenter( center );
			if(is_global_camera)
				cam.orbit( -mouse_event.deltax * this.rot_speed, LS.TOP, center );
			else
				node.transform.orbit( -mouse_event.deltax * this.rot_speed, LS.TOP, center );
			changed = true;
		}
		else
		{
			var collision = vec3.create();
			var delta = vec3.create();
			this.testOriginPlane( mouse_event.canvasx, gl.canvas.height - mouse_event.canvasy, collision );
			vec3.sub( delta, this._collision, collision );
			if(is_global_camera)
				cam.move( delta );
			else
				node.transform.translateGlobal( delta );
			cam.updateMatrices();
			changed = true;
		}
	}

	if(changed)
		this._root.scene.requestFrame();
}

CameraController.prototype.onTouch = function( e, touch_event)
{
	if(!this._root || !this.enabled) 
		return;
	
	var node = this._root;
	var cam = node.camera;
	if(!cam)
		return;

	var is_global_camera = node._is_root;

	if(!touch_event)
		touch_event = e;

	//console.log( e );
	//touch!
	if( touch_event.type == "touchstart" )
	{
		if( touch_event.touches.length == 2)
		{
			var distx = touch_event.touches[0].clientX - touch_event.touches[1].clientX;
			var disty = touch_event.touches[0].clientY - touch_event.touches[1].clientY;
			this._touch_distance = Math.sqrt(distx*distx + disty*disty);
			this._touch_center = [ (touch_event.touches[0].clientX + touch_event.touches[1].clientX) * 0.5,
									(touch_event.touches[0].clientY + touch_event.touches[1].clientY) * 0.5 ];
			touch_event.preventDefault();
			return false; //block
		}
	}
	if( touch_event.type == "touchmove" )
	{
		if(touch_event.touches.length == 2)
		{
			var distx = touch_event.touches[0].clientX - touch_event.touches[1].clientX;
			var disty = touch_event.touches[0].clientY - touch_event.touches[1].clientY;
			var distance = Math.sqrt(distx*distx + disty*disty);
			if(distance < 0.1)
				distance = 0.1;
			var delta_dist = this._touch_distance / distance;
			this._touch_distance = distance;
			//console.log( delta_dist );
			cam.orbitDistanceFactor( delta_dist );
			cam.updateMatrices();

			var delta_x = (touch_event.touches[0].clientX + touch_event.touches[1].clientX) * 0.5 - this._touch_center[0];
			var delta_y = (touch_event.touches[0].clientY + touch_event.touches[1].clientY) * 0.5 - this._touch_center[1];
			var panning_factor = cam.focalLength / gl.canvas.width;
			cam.panning( -delta_x, delta_y, panning_factor );
			this._touch_center[0] = (touch_event.touches[0].clientX + touch_event.touches[1].clientX) * 0.5;
			this._touch_center[1] = (touch_event.touches[0].clientY + touch_event.touches[1].clientY) * 0.5;

			cam.updateMatrices();
			this._root.scene.requestFrame();
			touch_event.preventDefault();
			return false; //block
		}
	}
}

CameraController.prototype.testOriginPlane = function(x,y, result)
{
	var cam = this._root.camera;
	var ray = cam.getRayInPixel( x, gl.canvas.height - y );
	var result = result || vec3.create();

	//test against plane at 0,0,0
	if( geo.testRayPlane( ray.origin, ray.direction, LS.ZEROS, LS.TOP, result ) )
		return true;
	return false;
}

CameraController.prototype.testPerpendicularPlane = function(x,y, center, result)
{
	var cam = this._root.camera;
	var ray = cam.getRayInPixel( x, gl.canvas.height - y );

	var front = cam.getFront();
	var center = center || cam.getCenter();
	var result = result || vec3.create();

	//test against plane
	if( geo.testRayPlane( ray.origin, ray.direction, center, front, result ) )
		return true;
	return false;
}

CameraController.prototype.onKey = function(e, key_event)
{
	if(!this._root || !this.enabled) 
		return;

	//trace(key_event);
	if(key_event.keyCode == 87)
	{
		if(key_event.type == "keydown")
			this._moving[2] = -1;
		else
			this._moving[2] = 0;
	}
	else if(key_event.keyCode == 83)
	{
		if(key_event.type == "keydown")
			this._moving[2] = 1;
		else
			this._moving[2] = 0;
	}
	else if(key_event.keyCode == 65)
	{
		if(key_event.type == "keydown")
			this._moving[0] = -1;
		else
			this._moving[0] = 0;
	}
	else if(key_event.keyCode == 68)
	{
		if(key_event.type == "keydown")
			this._moving[0] = 1;
		else
			this._moving[0] = 0;
	}
	else if(key_event.keyCode == 16) //shift in windows chrome
	{
		if(key_event.type == "keydown")
			this._move_fast = true;
		else
			this._move_fast = false;
	}

	//if(e.shiftKey) vec3.scale(this._moving,10);


	//LEvent.trigger(Scene,"change");
}

LS.registerComponent( CameraController );
