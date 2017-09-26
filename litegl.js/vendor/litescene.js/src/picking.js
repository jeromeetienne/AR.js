//
/**
* Picking is used to detect which element is below one pixel (used the GPU) or using raycast
*
* @class Picking
* @namespace LS
* @constructor
*/
var Picking = {

	picking_color_offset: 10, //color difference between picking objects

	/**
	* Renders the pixel and retrieves the color to detect which object it was, slow but accurate
	* @method getNodeAtCanvasPosition
	* @param {number} x in canvas coordinates
	* @param {number} y in canvas coordinates
	* @param {Camera} camera default is all cameras
	* @param {number} layers default is 0xFFFF which is all
	* @param {SceneTree} scene default is GlobalScene
	*/
	getNodeAtCanvasPosition: function( x, y, camera, layers, scene )
	{
		var instance = this.getInstanceAtCanvasPosition( x, y, camera, layers, scene );
		if(!instance)
			return null;

		if(instance.constructor == LS.SceneNode)
			return instance;

		if(instance._root && instance._root.constructor == LS.SceneNode)
			return instance._root;

		if(instance.node)
			return instance.node;

		return null;
	},

	/**
	* Returns the instance under a screen position
	* @method getInstanceAtCanvasPosition
	* @param {number} x in canvas coordinates
	* @param {number} y in canvas coordinates
	* @param {Camera} camera
	* @param {number} layers default is 0xFFFF which is all
	* @param {SceneTree} scene
	* @return {Object} the info supplied by the picker (usually a SceneNode)
	*/
	getInstanceAtCanvasPosition: function( x, y, camera, layers, scene )
	{
		scene = scene || LS.GlobalScene;

		if(!camera)
			camera = LS.Renderer.getCameraAtPosition( x, y, scene._cameras );

		if(!camera)
			return null;

		this._picking_nodes = {};

		//render all Render Instances
		this.getPickingColorFromBuffer( scene, camera, x,y, layers );

		this._picking_color[3] = 0; //remove alpha, because alpha is always 255
		var id = new Uint32Array(this._picking_color.buffer)[0]; //get only element

		var instance_info = this._picking_nodes[id];
		this._picking_nodes = {};
		return instance_info;
	},	

	/**
	* Returns a color you should use to paint this node during picking rendering
	* you tell what info you want to retrieve associated with this object if it is clicked
	* @method getNextPickingColor
	* @param {*} info
	* @return {vec3} array containing all the RenderInstances that collided with the ray
	*/
	getNextPickingColor: function( info )
	{
		this._picking_next_color_id += this.picking_color_offset;
		var pick_color = new Uint32Array(1); //store four bytes number
		pick_color[0] = this._picking_next_color_id; //with the picking color for this object
		var byte_pick_color = new Uint8Array( pick_color.buffer ); //read is as bytes
		//byte_pick_color[3] = 255; //Set the alpha to 1

		this._picking_nodes[ this._picking_next_color_id ] = info;
		return vec4.fromValues( byte_pick_color[0] / 255, byte_pick_color[1] / 255, byte_pick_color[2] / 255, 1 );
	},

	//picking
	_pickingMap: null,
	_picking_color: new Uint8Array(4),
	_picking_depth: 0,
	_picking_next_color_id: 0,
	_picking_nodes: {},
	_picking_render_settings: new RenderSettings(),

	getPickingColorFromBuffer: function( scene, camera, x, y, layers )
	{
		//create texture
		if(this._pickingMap == null || this._pickingMap.width != gl.canvas.width || this._pickingMap.height != gl.canvas.height )
		{
			this._pickingMap = new GL.Texture( gl.canvas.width, gl.canvas.height, { format: gl.RGBA, filter: gl.NEAREST });
			this._pickingFBO = new GL.FBO([this._pickingMap]);
			//LS.ResourcesManager.textures[":picking"] = this._pickingMap; //debug the texture
		}

		//y = gl.canvas.height - y; //reverse Y
		var small_area = true;

		LS.Renderer._current_target = this._pickingMap;

		this._pickingFBO.bind();

			//var viewport = camera.getLocalViewport();
			//camera._real_aspect = viewport[2] / viewport[3];
			//gl.viewport( viewport[0], viewport[1], viewport[2], viewport[3] );

			if(small_area)
			{
				gl.scissor(x-1,y-1,2,2);
				gl.enable(gl.SCISSOR_TEST);
			}

			this.renderPickingBuffer( scene, camera, layers, [x,y] );

			gl.readPixels(x,y,1,1,gl.RGBA,gl.UNSIGNED_BYTE, this._picking_color );

			if(small_area)
				gl.disable(gl.SCISSOR_TEST);

		this._pickingFBO.unbind();

		LS.Renderer._current_target = null; //??? deprecated

		//if(!this._picking_color) this._picking_color = new Uint8Array(4); //debug
		//trace(" END Rendering: ", this._picking_color );
		return this._picking_color;
	},

	renderPickingBuffer: function( scene, camera, layers, mouse_pos )
	{
		if(layers === undefined)
			layers = 0xFFFF;
		var picking_render_settings = this._picking_render_settings;

		LS.Renderer.enableCamera( camera, this._picking_render_settings );

		gl.clearColor(0,0,0,0);
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

		this._picking_next_color_id = 0;
		LS.Renderer.setRenderPass("picking");
		picking_render_settings.layers = layers;

		//check instances colliding with cursor using a ray against AABBs
		var instances = null;
		if(1) //not tested yet
		{
			var ray = camera.getRayInPixel( mouse_pos[0], mouse_pos[1] );
			var instances_collisions = LS.Physics.raycastRenderInstances( ray.origin, ray.direction );
			if( instances_collisions )
			{
				instances = Array( instances_collisions.length );
				for(var i = 0; i < instances_collisions.length; ++i)
					instances[i] = instances_collisions[i].instance;
			}
			//console.log("Instances ray collided:", instances_collisions.length);
		}

		LS.Renderer.renderInstances( picking_render_settings, instances );

		LEvent.trigger( scene, "renderPicking", mouse_pos );
		LEvent.trigger( LS.Renderer, "renderPicking", mouse_pos );

		LS.Renderer.setRenderPass("color");
	}
};

LS.Picking = Picking;


//helper
//to visualize picking buffer
//LS.Renderer.registerRenderPass( "color", { id: 1, render_instance: LS.Renderer.renderPickingPassInstance } );
