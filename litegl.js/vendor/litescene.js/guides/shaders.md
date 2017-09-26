# Creating Shaders #

You can create your own shaders for your materials. This way the rendering is much faster (the pipeline doesnt have to guess the best shader for your material) and you have more control.

Shaders are stored in the ```LS.ShaderCode``` class and used by some classes, mainly ```LS.ShaderMaterial``` and some FX components.

Because shaders are usually defined by several parts (vertex shader, fragment shader, definition of external variables) they are written in a text file where every part is defined by the backlash character and the name of the part, like  ```\default.vs```, this blocks are called subfiles.

## GLSL ##

Remember that shaders in WebGL are made using the GLSL programming language, not javascript. The shaders code will be sent to the GPU to be compiled to low level assembly code so it can be executed very fast. Also keep in mind that WebGL is based in OpenGL ES 2.0, it means some GLSL features may be missing.

If you want a reference about GLSL [check this website](http://www.shaderific.com/glsl/).

## Javascript ##

When creating a shader you may want to call some javascript functions to prepare the properties of the material containing the shader, for this purpose you can write a part in the file that contain that JS code, separated from the GLSL code of the shaders.

The main functions are:
 - ```createUniform( label, uniform_name, type, default_value, options )```: this will make the uniform with the ```uniform_name``` accessible from the editor and the code. The type must be of ```LS.TYPES``` keeping in mind that it has to be able to be passed to the shader.
 - ```createSampler( label, uniform_name, texture_options )```: this will make the uniform with the ```uniform_name``` accessible from the editor and the code.
 - ```createProperty( name, default_value, options )```: this will create a var that is not passed to the shader (used in conjuction with onPrepare).

The subfile to contain this calls should be called ```\js```

```js
\js

this.createUniform("Scale","u_tex_scale","number",1, {min:0, max:1}); //create a uniform for the shader
this.createSampler("Texture","u_texture", { magFilter: GL.LINEAR, missing: "white"} ); //create a sampler (texture) for the shader
this.createProperty("Node",null, LS.TYPES.NODE ); //create a property not meant to be send to the shader (to use with onPrepare)
this.render_state.depth_test = false; //the flags to use when rendering
```

This function will be called once the shader is assigned to the material.

## RenderState ##

Some properties for the rendering cannot be defined inside the GLSL code (like GPU flags) so they are defined in a class called ```LS.RenderState``` that contains all the common flags.

If you want to use an special rendering pass consider changing those, here is a list with the flags and their default types:

```js
	this.front_face = GL.CCW;
	this.cull_face = true;

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
```

## RenderQueue ##

To stablish the rendering order you must use the ```this.queue``` property.

This property is a number associated to a render queue in the system. There are queues for GEOMETRY and TRANSPARENT by default. The bigger the number the later it will be rendered.

You can type your own value or use one of the enumerated options:

- ```LS.RenderQueue.DEFAULT```: means no render queue specified, the system will try to guess it.
- ```LS.RenderQueue.BACKGROUND```: for object that are in the background like skyboxes (value 5)
- ```LS.RenderQueue.GEOMETRY```: for regular non-transparent geometry (value 10)
- ```LS.RenderQueue.TRANSPARENT```: for semitransparent objects (blend activated) (value 15)
- ```LS.RenderQueue.OVERLAY```: for render calls in the screen space. (value 20)

You can also add or substract to the queue number to reorder inside the same queue:

```javascript
	this.queue = LS.RenderQueue.TRANSPARENT + 1;
```

One example setting the alpha and the rendering order:

```javascript
\js
	this.render_state.blend = true;
	this.queue = LS.RenderQueue.TRANSPARENT;
```

## Flags ##

Besides the render states and the render queue there are also some generic properties that materials could switch to control the behaviour during the rendering process. Flags are stored in ```this.flags```. Here is a list of them:

- ```cast_shadows```: tells if this material should be rendered in the shadowmaps.
- ```receive_shadows```: tells if this material should read from the shadowmaps.
- ```ignore_frustum```: must be set to ```true``` if you shader is applying any deformation per vertex (invalidating the precomputed bounding box of the mesh. If your mesh disappears suddenly when moving the camera, this is a signal that the frustum culling is not working so set it to true.

```javascript
\js
	this.flags.cast_shadows = false;
```

## onPrepare ##

Sometimes we want our material to perform some actions before rendering (like extracting information from the scene and send it to the shader).

To do that you can create a ```onPrepare``` function, this function will be called before rendering the scene, when all materials are being prepared.

Here is one example that passes the matrix of a camera to the material:

```javascript
this.createSampler("Texture","u_texture");
//create a property Camera that we will use to pass some data about the scene to this shader
this.createProperty("Camera", null, LS.TYPES.COMPONENT); 

this.onPrepare = function( scene )
{
  if(!this.Camera) //the property Camera has not been assigned in the material
    return;
  //read the this.Camera value (the string with the UID of the camera the user assigned to this material)
  //and try to find the component with that UID (the camera object itself)
  var camera = scene.findComponentByUId( this.Camera );
  if(!camera) //no component with that uid
    return;
  if(!this._uniforms.u_textureprojection_matrix)
    this._uniforms.u_textureprojection_matrix = mat4.create();
  //now we can use that info
  camera.getViewProjectionMatrix( this._uniforms.u_textureprojection_matrix );
}
```

## Pragmas

You can use some special pragmas designed to allow the user to include external code, this is helpful to reuse GLSL code between different ShaderCodes.

### pragma include

This is the most basic pragma an lets you import a GLSL file stored in a resource GLSL file. The content will be copyed directly:

```c++
	#pragma include "guest/shaders/noise_functions.glsl"
```

You can also include a subfile:

```c++
	#pragma include "guest/shaders/noise_functions.glsl:subfilename"
```

### pragma shaderblock

This feature is still a Work In Progress but it lets different components in the system interact with the material by including some code (but only if the shader allows it).

To do this first the shader must accept to have the shaderblock supported by using the shaderblock pragma. And also call the functions associated by that shaderblock:

```c++
	//global
	#pragma shaderblock "skinning"
	
	//inside the main...
	//...
	 applySkinning( vertex4, v_normal );  
```

### pragma snippet

You can include snippets of code that are stored in the snippets container of the ```LS.ShadersManager```, this is used internally to avoid creating the same code several times or to update code from scripts.

```c++
	#pragma snippet "lighting"
```

To create a snippet:


```javascript
	LS.ShadersManager.registerSnippet("mysnippet", "//code...");
```

## Structs

If you plan to use the default lighting system from your shaders you need to use several structs to map vertex data, surface data and light data. You will have access by including the "light" shaderblock:

```c++
	#pragma shaderblock "light"
```

The next struct defines the info per vertex:
```c++
struct Input {
	vec3 vertex;
	vec3 normal;
	vec2 uv;
	vec2 uv1;
	vec4 color;

	vec3 camPos;
	vec3 viewDir;
	vec3 worldPos;
	vec3 worldNormal;
	vec4 screenPos;
};
```

And to fill it you must call:

```c++
	Input IN = getInput();
```


The next struct defines properties of the object surface:

```c++
struct SurfaceOutput {
	vec3 Albedo; //base color
	vec3 Normal; //separated in case there is a normal map
	vec3 Emission; //extra light
	vec3 Ambient; //amount of ambient light reflected
	float Specular; //specular factor
	float Gloss; //specular gloss
	float Alpha; //alpha
	float Reflectivity; //amount of reflection
	vec4 Extra; //for special purposes
};
```

And to get a prefilled version you must call:

```c++
	SurfaceOutput o = getSurfaceOutput();
```


When calling getSurfaceOutput it will be filled with this values:

```c++
SurfaceOutput getSurfaceOutput()
{
	SurfaceOutput o;
	o.Albedo = u_material_color.xyz;
	o.Alpha = u_material_color.a;
	o.Normal = normalize( v_normal );
	o.Specular = 0.5;
	o.Gloss = 10.0;
	o.Ambient = vec3(1.0);
	return o;
}
```

And the next struct defines properties of the light:

```c++
struct FinalLight {
	vec3 Color;
	vec3 Ambient;
	float Diffuse; //NdotL
	float Specular; //RdotL
	vec3 Emission;
	vec3 Reflection;
	float Attenuation;
	float Shadow; //1.0 means fully lit
};
```

And to apply the final lighting:

```c++
	FinalLight LIGHT = getLight();
	LIGHT.Ambient = u_ambient_light;
	final_color.xyz = computeLight( o, IN, LIGHT );
```


## Shader Example ##

Here is a complete shader with normalmap and specular map that support multiple lights and shadowmaps using the built-in shaderblock system so you do not have to worry about it.

```c++




\js
//define exported uniforms from the shader (name, uniform, widget)
this.createUniform("Number","u_number","number");
this.createSampler("Texture","u_texture");
this.createSampler("Spec. Texture","u_specular_texture");
this.createSampler("Normal Texture","u_normal_texture");
this._light_mode = 1;

\color.vs

precision mediump float;
attribute vec3 a_vertex;
attribute vec3 a_normal;
attribute vec2 a_coord;

//varyings
varying vec3 v_pos;
varying vec3 v_normal;
varying vec2 v_uvs;

//matrices
uniform mat4 u_model;
uniform mat4 u_normal_model;
uniform mat4 u_view;
uniform mat4 u_viewprojection;

//globals
uniform float u_time;
uniform vec4 u_viewport;
uniform float u_point_size;

#pragma shaderblock "light"
#pragma shaderblock "morphing"
#pragma shaderblock "skinning"

//camera
uniform vec3 u_camera_eye;
void main() {
	
	vec4 vertex4 = vec4(a_vertex,1.0);
	v_normal = a_normal;
	v_uvs = a_coord;
  
  //deforms
  applyMorphing( vertex4, v_normal );
  applySkinning( vertex4, v_normal );
	
	//vertex
	v_pos = (u_model * vertex4).xyz;
  
  applyLight(v_pos);
  
	//normal
	v_normal = (u_normal_model * vec4(v_normal,0.0)).xyz;
	gl_Position = u_viewprojection * vec4(v_pos,1.0);
}

\color.fs

precision mediump float;

//varyings
varying vec3 v_pos;
varying vec3 v_normal;
varying vec2 v_uvs;

//globals
uniform vec3 u_camera_eye;
uniform vec4 u_clipping_plane;
uniform float u_time;
uniform vec3 u_background_color;
uniform vec4 u_material_color;
uniform float u_number;

uniform sampler2D u_texture;
uniform sampler2D u_specular_texture;
uniform sampler2D u_normal_texture;

#pragma shaderblock "light"

#pragma snippet "perturbNormal"

void main() {
  Input IN = getInput();
  SurfaceOutput o = getSurfaceOutput();
  vec4 surface_color = texture2D( u_texture, IN.uv ) * u_material_color;
  o.Albedo = surface_color.xyz;
  vec4 spec = texture2D( u_specular_texture, IN.uv );
	o.Specular = spec.x;  
	o.Gloss = spec.y * 10.0;  
	vec4 normal_pixel = texture2D( u_normal_texture, IN.uv );
  o.Normal = perturbNormal( IN.worldNormal, IN.worldPos, v_uvs, normal_pixel.xyz );
	  
  vec4 final_color = vec4(0.0);
  Light LIGHT = getLight();
  final_color.xyz = computeLight( o, IN, LIGHT );
  final_color.a = surface_color.a;
  
	gl_FragColor = final_color;
}






```
