/**
* RenderState sets the flags for the GPU associated with a rendering action (blending, masking, depth test, etc)
* It is stored in the material (although defined usually from ShaderCode) so the material can use it.
*
* @class RenderState
* @namespace LS
* @constructor
*/

/* gpu flags

0: front_face: GL.CCW
1: cull_face: 1
2: cull_face_mode: GL.BACK

//depth buffer
4: depth_test: 1
5: depth_mask: 1 //write in depth buffer
6: depth_func: GL.LESS
7: depth_range0: 0
8: depth_range1: 1

//blend function
9: blend: 0;
10: blendFunc0: GL.SRC_ALPHA
11: blendFunc1: GL.ONE_MINUS_SRC_ALPHA

//color mask
12:	colorMask0: 1
13:	colorMask1: 1
14:	colorMask2: 1
15:	colorMask3: 1

//stencil buffer
16: stencil_test: 0
17:	stencil_mask: 0xFF,
18:	stencil_func_func: GL.ALWAYS,
19:	stencil_func_ref: 0,
20:	stencil_func_mask: 0xFF,
21:	stencil_op_sfail: GL.KEEP,
22:	stencil_op_dpfail: GL.KEEP,
23:	stencil_op_dppass: GL.KEEP

*/

function RenderState( o )
{
	this._data = new Uint32Array(24);
	this.init();

	if(o)
		this.configure(o);
}

Object.defineProperty( RenderState.prototype, "front_face", {
	set: function(v) { this._data[0] = v; },
	get: function() { return this._data[0];	},
	enumerable: true
});

RenderState["@front_face"] = { widget: "combo", values: { CW: GL.CW, CCW: GL.CCW } };

Object.defineProperty( RenderState.prototype, "cull_face", {
	set: function(v) { this._data[1] = v ? 1 : 0; },
	get: function() { return this._data[1] !== 0;	},
	enumerable: true
});

Object.defineProperty( RenderState.prototype, "cull_face_mode", {
	set: function(v) { this._data[2] = v; },
	get: function() { return this._data[2];	},
	enumerable: true
});

RenderState["@cull_face_mode"] = { widget: "combo", values: { FRONT: GL.FRONT, BACK: GL.BACK, FRONT_AND_BACK: GL.FRONT_AND_BACK } };

Object.defineProperty( RenderState.prototype, "depth_test", {
	set: function(v) { this._data[4] = v ? 1 : 0; },
	get: function() { return this._data[4] !== 0;	},
	enumerable: true
});

Object.defineProperty( RenderState.prototype, "depth_mask", {
	set: function(v) { this._data[5] = v ? 1 : 0; },
	get: function() { return this._data[5] !== 0;	},
	enumerable: true
});

Object.defineProperty( RenderState.prototype, "depth_func", {
	set: function(v) { this._data[6] = v; },
	get: function() { return this._data[6];	},
	enumerable: true
});

RenderState["@depth_func"] = { widget: "combo", values: { LESS: GL.LESS, LEQUAL: GL.LEQUAL, EQUAL: GL.EQUAL, NOTEQUAL: GL.NOTEQUAL, GREATER: GL.GREATER, GEQUAL: GL.GEQUAL, ALWAYS: GL.ALWAYS, NEVER: GL.NEVER } };

Object.defineProperty( RenderState.prototype, "depth_range", {
	set: function(v) { 
		if(!v || v.length != 2)
			return;
		this._data[7] = v[0];
		this._data[8] = v[1];
	},
	get: function() { return this._data.subarray(7,9);	},
	enumerable: true
});

Object.defineProperty( RenderState.prototype, "blend", {
	set: function(v) { this._data[9] = v ? 1 : 0; },
	get: function() { return this._data[9] !== 0;	},
	enumerable: true
});

Object.defineProperty( RenderState.prototype, "blendFunc0", {
	set: function(v) { this._data[10] = v; },
	get: function() { return this._data[10];	},
	enumerable: true
});

RenderState["@blendFunc0"] = { widget: "combo", values: { ZERO: GL.ZERO, ONE: GL.ONE, SRC_COLOR: GL.SRC_COLOR, ONE_MINUS_SRC_COLOR: GL.ONE_MINUS_SRC_COLOR, DST_COLOR: GL.DST_COLOR, ONE_MINUS_DST_COLOR: GL.ONE_MINUS_DST_COLOR, SRC_ALPHA: GL.SRC_ALPHA, ONE_MINUS_SRC_ALPHA: GL.ONE_MINUS_SRC_ALPHA, DST_ALPHA: GL.DST_ALPHA, ONE_MINUS_DST_ALPHA: GL.ONE_MINUS_DST_ALPHA, CONSTANT_COLOR: GL.CONSTANT_COLOR, ONE_MINUS_CONSTANT_COLOR: GL.ONE_MINUS_CONSTANT_COLOR, CONSTANT_ALPHA: GL.CONSTANT_ALPHA, ONE_MINUS_CONSTANT_ALPHA: GL.ONE_MINUS_CONSTANT_ALPHA, SRC_ALPHA_SATURATE: GL.SRC_ALPHA_SATURATE } };

Object.defineProperty( RenderState.prototype, "blendFunc1", {
	set: function(v) { this._data[11] = v; },
	get: function() { return this._data[11];	},
	enumerable: true
});

RenderState["@blendFunc1"] = { widget: "combo", values: { ZERO: GL.ZERO, ONE: GL.ONE, SRC_COLOR: GL.SRC_COLOR, ONE_MINUS_SRC_COLOR: GL.ONE_MINUS_SRC_COLOR, DST_COLOR: GL.DST_COLOR, ONE_MINUS_DST_COLOR: GL.ONE_MINUS_DST_COLOR, SRC_ALPHA: GL.SRC_ALPHA, ONE_MINUS_SRC_ALPHA: GL.ONE_MINUS_SRC_ALPHA, DST_ALPHA: GL.DST_ALPHA, ONE_MINUS_DST_ALPHA: GL.ONE_MINUS_DST_ALPHA, CONSTANT_COLOR: GL.CONSTANT_COLOR, ONE_MINUS_CONSTANT_COLOR: GL.ONE_MINUS_CONSTANT_COLOR, CONSTANT_ALPHA: GL.CONSTANT_ALPHA, ONE_MINUS_CONSTANT_ALPHA: GL.ONE_MINUS_CONSTANT_ALPHA, SRC_ALPHA_SATURATE: GL.SRC_ALPHA_SATURATE } };

Object.defineProperty( RenderState.prototype, "blendFunc", {
	set: function(v)
	{
		if(!v || v.length != 2)
			return;
		this._data[10] = v[0];
		this._data[11] = v[1];
	},
	get: function()
	{
		return this._data.subarray(10,12);
	},
	enumerable: false
});

Object.defineProperty( RenderState.prototype, "colorMask0", {
	set: function(v) { this._data[12] = v ? 1 : 0; },
	get: function() { return this._data[12] !== 0;	},
	enumerable: true
});

Object.defineProperty( RenderState.prototype, "colorMask1", {
	set: function(v) { this._data[13] = v ? 1 : 0; },
	get: function() { return this._data[13] !== 0;	},
	enumerable: true
});

Object.defineProperty( RenderState.prototype, "colorMask2", {
	set: function(v) { this._data[14] = v ? 1 : 0; },
	get: function() { return this._data[14] !== 0;	},
	enumerable: true
});

Object.defineProperty( RenderState.prototype, "colorMask3", {
	set: function(v) { this._data[15] = v ? 1 : 0; },
	get: function() { return this._data[15] !== 0;	},
	enumerable: true
});

Object.defineProperty( RenderState.prototype, "colorMask", {
	set: function(v)
	{
		if(!v || v.length != 4)
			return;
		this._data[12] = v[0];
		this._data[13] = v[1];
		this._data[14] = v[2];
		this._data[15] = v[3];
	},
	get: function()
	{
		return this._data.subarray(12,16);
	},
	enumerable: false
});

/*
16: stencil_test: 0
17:	stencil_mask: 0xFF,
18:	stencil_func_func: GL.ALWAYS,
19:	stencil_func_ref: 0,
20:	stencil_func_mask: 0xFF,
21:	stencil_op_sfail: GL.KEEP,
22:	stencil_op_dpfail: GL.KEEP,
23:	stencil_op_dppass: GL.KEEP
*/

Object.defineProperty( RenderState.prototype, "stencil_test", {
	set: function(v) { this._data[16] = v ? 1 : 0; },
	get: function() { return this._data[16] !== 0;	},
	enumerable: true
});

Object.defineProperty( RenderState.prototype, "stencil_mask", {
	set: function(v) { this._data[17] = v; },
	get: function() { return this._data[17]; },
	enumerable: true
});

RenderState["@stencil_mask"] = { widget: "number", min: 0, max: 256, step: 1, precision: 0 };

Object.defineProperty( RenderState.prototype, "stencil_func", {
	set: function(v) {
		if(!v || v.length != 3)
			return;
		this._data[18] = v[0];
		this._data[19] = v[1];
		this._data[20] = v[2];
	},
	get: function() { return this._data.subarray(18,21); },
	enumerable: false
});

Object.defineProperty( RenderState.prototype, "stencil_func_func", {
	set: function(v) { this._data[18] = v; },
	get: function() { return this._data[18]; },
	enumerable: true
});

RenderState["@stencil_func_func"] = { widget: "combo", values: { LESS: GL.LESS, LEQUAL: GL.LEQUAL, EQUAL: GL.EQUAL, NOTEQUAL: GL.NOTEQUAL, GREATER: GL.GREATER, GEQUAL: GL.GEQUAL, ALWAYS: GL.ALWAYS, NEVER: GL.NEVER } };

Object.defineProperty( RenderState.prototype, "stencil_func_ref", {
	set: function(v) { this._data[19] = v; },
	get: function() { return this._data[19]; },
	enumerable: true
});

RenderState["@stencil_func_ref"] = { widget: "number", min: 0, max: 256, step: 1, precision: 0 };

Object.defineProperty( RenderState.prototype, "stencil_func_mask", {
	set: function(v) { this._data[20] = v; },
	get: function() { return this._data[20]; },
	enumerable: true
});

RenderState["@stencil_func_mask"] = { widget: "number", min: 0, max: 256, step: 1, precision: 0 };

Object.defineProperty( RenderState.prototype, "stencil_op", {
	set: function(v) {
		if(!v || v.length != 3)
			return;
		this._data[21] = v[0];
		this._data[22] = v[1];
		this._data[23] = v[2];
	},
	get: function() { return this._data.subarray(21,24); },
	enumerable: false
});

Object.defineProperty( RenderState.prototype, "stencil_op_sfail", {
	set: function(v) { this._data[21] = v; },
	get: function() { return this._data[21]; },
	enumerable: true
});

RenderState["@stencil_op_sfail"] = { widget: "combo", values: { KEEP: GL.KEEP, ZERO: GL.ZERO, REPLACE: GL.REPLACE, INCR: GL.INCR, INCR_WRAP: GL.INCR_WRAP, DECR: GL.DECR_WRAP, INVERT: GL.INVERT } };

Object.defineProperty( RenderState.prototype, "stencil_op_dpfail", {
	set: function(v) { this._data[22] = v; },
	get: function() { return this._data[22]; },
	enumerable: true
});

RenderState["@stencil_op_dpfail"] = { widget: "combo", values: { KEEP: GL.KEEP, ZERO: GL.ZERO, REPLACE: GL.REPLACE, INCR: GL.INCR, INCR_WRAP: GL.INCR_WRAP, DECR: GL.DECR_WRAP, INVERT: GL.INVERT } };

Object.defineProperty( RenderState.prototype, "stencil_op_dppass", {
	set: function(v) { this._data[23] = v; },
	get: function() { return this._data[23]; },
	enumerable: true
});

RenderState["@stencil_op_dppass"] = { widget: "combo", values: { KEEP: GL.KEEP, ZERO: GL.ZERO, REPLACE: GL.REPLACE, INCR: GL.INCR, INCR_WRAP: GL.INCR_WRAP, DECR: GL.DECR_WRAP, INVERT: GL.INVERT } };

RenderState.default_state = {
	front_face: GL.CCW,
	cull_face: true,
	depth_test: true,
	depth_func: GL.LESS,
	depth_mask: true,
	blend: false,
	blendFunc0: GL.SRC_ALPHA,
	blendFunc1: GL.ONE_MINUS_SRC_ALPHA,
	colorMask0: true,
	colorMask1: true,
	colorMask2: true,
	colorMask3: true,
	stencil_test: false,
	stencil_mask: 0xFF,
	stencil_func_func: GL.ALWAYS,
	stencil_func_ref: 0,
	stencil_func_mask: 0xFF,
	stencil_op_sfail: GL.KEEP,
	stencil_op_dpfail: GL.KEEP,
	stencil_op_dppass: GL.KEEP
};

RenderState.last_state = null;

RenderState.prototype.init = function()
{
	//gpu flags
	this.front_face = GL.CCW;
	this.cull_face = true;
	//this.cull_face_mode = GL.BACK;

	//depth buffer
	this.depth_test = true;
	this.depth_mask = true; //write in depth buffer
	this.depth_func = GL.LESS;
	//depth range: never used

	//blend function
	this.blend = false;
	this.blendFunc0 = GL.SRC_ALPHA;
	this.blendFunc1 = GL.ONE_MINUS_SRC_ALPHA;
	//blend equation

	//color mask
	this.colorMask0 = true;
	this.colorMask1 = true;
	this.colorMask2 = true;
	this.colorMask3 = true;

	//stencil buffer
	this.stencil_test = false;
	this.stencil_mask = 0xFF;
	this.stencil_func_func = GL.ALWAYS;
	this.stencil_func_ref = 0;
	this.stencil_func_mask = 0xFF;
	this.stencil_op_sfail = GL.KEEP;
	this.stencil_op_dpfail = GL.KEEP;
	this.stencil_op_dppass = GL.KEEP;
}

//helper, allows to set the blend mode from a string
RenderState.prototype.setBlendMode = function( mode )
{
	var functions = LS.BlendFunctions[ mode ];
	if(!mode || mode == LS.Blend.NORMAL )
	{
		this.blend = false;
		return;
	}

	this.blend = true;
	this.blendFunc0 = mode[0];
	this.blendFunc1 = mode[1];
}

RenderState.prototype.enable = function()
{
	RenderState.enable( this );
}

RenderState.enable = function( state, prev )
{
	if(!prev)
	{
		//faces
		gl.frontFace( state.front_face );
		if(state.cull_face)
			gl.enable( gl.CULL_FACE );
		else
			gl.disable( gl.CULL_FACE );
		//depth
		if(state.depth_test)
			gl.enable( gl.DEPTH_TEST );
		else
			gl.disable( gl.DEPTH_TEST );
		gl.depthMask( state.depth_mask );
		gl.depthFunc( state.depth_func );

		//blend
		if(state.blend)
			gl.enable( gl.BLEND );
		else
			gl.disable( gl.BLEND );
		gl.blendFunc( state.blendFunc0, state.blendFunc1 );

		//color
		gl.colorMask( state.colorMask0, state.colorMask1, state.colorMask2, state.colorMask3 );

		//stencil
		if(state.stencil_test)
		{
			gl.enable( gl.STENCIL_TEST );
			gl.stencilFunc( state.stencil_func_func, state.stencil_func_ref, state.stencil_func_mask );
			gl.stencilOp( state.stencil_op_sfail, state.stencil_op_dpfail, state.stencil_op_dppass );
			gl.stencilMask( state.stencil_mask );
		}
		else
			gl.disable( gl.STENCIL_TEST );

		this.last_state = state;
		return;
	}

	//faces
	if(prev.front_face !== state.front_face)
		gl.frontFace( state.front_face );
	if(prev.cull_face !== state.cull_face)
	{
		if(state.cull_face)
			gl.enable( gl.CULL_FACE );
		else
			gl.disable( gl.CULL_FACE );
	}

	//depth
	if(prev.depth_test !== state.depth_test)
	{
		if(state.depth_test)
			gl.enable( gl.DEPTH_TEST );
		else
			gl.disable( gl.DEPTH_TEST );
	}
	if(prev.depth_mask !== state.depth_mask)
		gl.depthMask( state.depth_mask );
	if(prev.depth_func !== state.depth_func)
		gl.depthFunc( state.depth_func );

	//blend
	if(prev.blend !== state.blend)
	{
		if(state.blend)
			gl.enable( gl.BLEND );
		else
			gl.disable( gl.BLEND );
	}
	if(prev.blendFunc0 !== state.blendFunc0 || prev.blendFunc1 !== state.blendFunc1)
		gl.blendFunc( state.blendFunc0, state.blendFunc1 );

	//color
	if(prev.colorMask0 !== state.colorMask0 || prev.colorMask1 !== state.colorMask1 || prev.colorMask2 !== state.colorMask2 || prev.colorMask3 !== state.colorMask3 )
		gl.colorMask( state.colorMask0, state.colorMask1, state.colorMask2, state.colorMask3 );

	//stencil
	if(prev.stencil_test != state.stencil_test )
	{
		if(state.stencil_test)
			gl.enable( gl.STENCIL_TEST);
		else
			gl.disable( gl.STENCIL_TEST );
	}

	if(state.stencil_test)
	{
		if( state.stencil_func_func !== prev.stencil_func_func || state.stencil_func_ref !== prev.stencil_func_ref || state.stencil_func_mask !== prev.stencil_func_mask )
			gl.stencilFunc( state.stencil_func_func, state.stencil_func_ref, state.stencil_func_mask );

		if(state.stencil_op_sfail !== prev.stencil_op_sfail || state.stencil_op_dpfail !== stencil_op_dpfail || state.stencil_op_dppass !== stencil_op_dppass )
			gl.stencilOp( state.stencil_op_sfail, state.stencil_op_dpfail, state.stencil_op_dppass );

		if(state.stencil_mask !== prev.stencil_mask)
			gl.stencilMask( prev.stencil_mask );
	}

	//save state
	this.last_state = state;
}

RenderState.reset = function()
{
	this.enable( this.default_state );
}

RenderState.prototype.serialize = function()
{
	return LS.cloneObject(this);
}

RenderState.prototype.toJSON = RenderState.prototype.serialize;

RenderState.prototype.configure = function(o)
{
	LS.cloneObject(o,this);
}

RenderState.prototype.copyFrom = function( rs )
{
	this._data.set( rs._data );
}


LS.RenderState = RenderState;