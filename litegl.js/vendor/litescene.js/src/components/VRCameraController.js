//WORK IN PROGRESS: NOT FINISHED

/**
* This component allow to integrate with WebVR to use VR Headset
* @class VRCameraController
* @namespace LS.Components
* @param {Object} o object with the serialized info
*/
function VRCameraController(o)
{
	this.enabled = true;
	this.eye_distance = 1;
	if(o)
		this.configure(o);
}

VRCameraController.icon = "mini-icon-graph.png";

//Remove this
VRCameraController.rift_server_url = "http://tamats.com/uploads/RiftServer_0_3.zip";

VRCameraController.prototype.onAddedToNode = function(node)
{
	var scene = node.scene;

	LEvent.bind(scene,"start", this.onStart, this );
	LEvent.bind(scene,"finish", this.onStop, this );
	LEvent.bind(scene,"beforeRender", this.onBeforeRender, this );
	LEvent.bind(scene,"afterRender", this.onAfterRender, this );
	LEvent.bind(node, "collectCameras", this.onCollectCameras, this );
}

VRCameraController.prototype.onRemovedFromNode = function(node)
{
	var scene = this._root.scene;

	LEvent.unbind(scene,"start", this.onStart, this );
	LEvent.unbind(scene,"finish", this.onStop, this );
	LEvent.unbind(scene,"beforeRender", this.onBeforeRender, this );
	LEvent.unbind(scene,"afterRender", this.onAfterRender, this );
	LEvent.unbind(node, "collectCameras", this.onCollectCameras, this );
	Renderer.color_rendertarget = null;
}

VRCameraController.prototype.onCollectCameras = function(e, cameras)
{
	var main_camera = Renderer.main_camera;

	if(this._orientation)
		main_camera.setOrientation(this._orientation, true);

	var right_vector = main_camera.getLocalVector([ this.eye_distance * 0.5, 0, 0]);
	var left_vector = vec3.scale( vec3.create(), right_vector, -1);

	if(!this._left_camera)
	{
		this._left_camera = new LS.Camera();
		this._right_camera = new LS.Camera();
	}

	var main_info = main_camera.serialize();

	this._left_camera.configure(main_info);
	this._right_camera.configure(main_info);

	this._left_camera.eye = vec3.add(vec3.create(), main_camera.eye, left_vector);
	this._right_camera.eye = vec3.add(vec3.create(), main_camera.eye, right_vector);

	this._left_camera._viewport.set([0,0,0.5,1]);
	this._right_camera._viewport.set([0.5,0,0.5,1]);
	this._right_camera._ignore_clear = true;

	cameras.push( this._left_camera, this._right_camera );
}

VRCameraController.prototype.onStart = function(e)
{
	var ws = new WebSocket("ws://localhost:1981");
	ws.onopen = function()
	{
		console.log("VR connection stablished");
	}

	ws.onmessage = this.onMessage.bind(this);

	ws.onclose = function()
	{
		console.log("OVR connection lost");
	}

	ws.onerror = function()
	{
		console.error("Oculus Server not found in your machine. To run an app using Oculus Rift you need to use a client side app, you can download it from: " + OculusController.rift_server_url );
	}

	this._ws = ws;
}

VRCameraController.prototype.onMessage = function(e)
{
	var data = e.data;
	data = JSON.parse("[" + data + "]");

	var q = quat.create();
	q.set( data );
	var q2 = quat.fromValues(-1,0,0,0);	quat.multiply(q,q2,q);
	this._orientation = q;

	if(this._root.scene)
		this._root.scene.requestFrame();
}

VRCameraController.prototype.onStop = function(e)
{
	if(this._ws)
	{
		this._ws.close();
		this._ws = null;
	}
}

VRCameraController.prototype.onBeforeRender = function(e,dt)
{
	var width = 1024;
	var height = 512;
	var viewport = gl.viewport_data;
	width = v[2];
	height = v[3];

	if(!this._color_texture || this._color_texture.width != width || this._color_texture.height != height)
	{
		this._color_texture = new GL.Texture( width, height,{ format: gl.RGB, filter: gl.LINEAR });
		LS.ResourcesManager.textures[":vr_color_buffer"] = this._color_texture;
	}

	//CHANGE THIS TO USE RENDERFRAMECONTEXT
	if(this.enabled)
	{
		LS.Renderer.color_rendertarget = this._color_texture;
	}
	else
	{
		LS.Renderer.color_rendertarget = null;
	}

	//Renderer.disable_main_render
}


VRCameraController.prototype.onAfterRender = function(e,dt)
{
	if(this._color_texture)
		this._color_texture.toViewport();
}

/* not finished
LS.registerComponent(VRCameraController);
window.VRCameraController = VRCameraController;
*/




