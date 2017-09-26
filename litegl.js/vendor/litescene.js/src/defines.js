
if(typeof(GL) == "undefined")
	throw("LiteSCENE requires to have litegl.js included before litescene.js");

//blending mode
var Blend = {
	AUTOMATIC: "automatic",
	NORMAL: "normal",
	ALPHA: "alpha",
	ADD: "add",
	MULTIPLY: "multiply",
	SCREEN: "screen",
	CUSTOM: "custom"
}

LS.Blend = Blend;

LS.BlendFunctions = {};

LS.BlendFunctions[ Blend.AUTOMATIC ] = [GL.ONE, GL.ZERO];
LS.BlendFunctions[ Blend.NORMAL ] = [GL.ONE, GL.ZERO];
LS.BlendFunctions[ Blend.ALPHA ] = [GL.SRC_ALPHA, GL.ONE_MINUS_SRC_ALPHA];
LS.BlendFunctions[ Blend.ADD ] = [GL.SRC_ALPHA, GL.ONE];
LS.BlendFunctions[ Blend.MULTIPLY ] = [GL.DST_COLOR, GL.ONE_MINUS_SRC_ALPHA];
LS.BlendFunctions[ Blend.SCREEN ] =	[GL.SRC_ALPHA, GL.ONE];
LS.BlendFunctions[ Blend.CUSTOM ] =	[GL.SRC_ALPHA, GL.ONE_MINUS_SRC_ALPHA];

//used to know the state of the application
LS.STOPPED = 0;
LS.PLAYING = 1; 
LS.PAUSED = 2;
LS.LOADING = 3;

LS.RUNNING = 1; //LEGACY

//helpful consts
LS.ZEROS = vec3.create();
LS.ZEROS4 = vec4.create();
LS.ONES = vec3.fromValues(1,1,1);
LS.TOP = vec3.fromValues(0,1,0);
LS.BOTTOM = vec3.fromValues(0,-1,0);
LS.RIGHT = vec3.fromValues(1,0,0);
LS.LEFT = vec3.fromValues(-1,0,0);
LS.FRONT = vec3.fromValues(0,0,-1);
LS.BACK = vec3.fromValues(0,0,1);
LS.IDENTITY = mat4.create();

//types
LS.TYPES = {
	BOOLEAN: "boolean",
	NUMBER : "number",
	STRING : "string",
	VEC2 : "vec2",
	VEC3 : "vec3",
	VEC4 : "vec3",
	COLOR : "color",
	COLOR4 : "color4",
	RESOURCE: "resource",
	TEXTURE : "texture",
	MESH: "mesh",
	SCENE: "scene",
	SCENENODE: "node",
	SCENENODE_ID: "node_id",
	COMPONENT: "component",
	MATERIAL: "material",
	ARRAY: "array"
};
