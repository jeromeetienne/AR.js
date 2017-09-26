# Shaders

Shaders are fragments of code uploaded to the GPU that will be executed during the rendering process. 
This way the programmer can control vertex projections and deformations or how every single pixel is illuminated.

Learning to code shaders is a complex subject that require good knowledge of mathmatics (algebra and 3d projection) plus a good understanding of how GPUs work.
This guide is not meant to teach you how to code shaders but to help you understand how to use your shaders in with LiteGL.

Please, if you never have coded shaders check any tutorial related of how to code shaders before going forward with this guide.

## GLSL

In WebGL (as in OpenGL) all shaders must be coded in GLSL (GL Shading Language) which has a syntax similar to C++.

Every shader in WebGL 1.0 is made by two blocks of code, the Vertex Shader (executed per vertex) and the Fragment Shader (executed per pixel).

```cpp
//Basic Vertex Shader
			precision highp float;
			attribute vec3 a_vertex;
			uniform mat4 u_mvp;
			void main() {
				gl_Position = u_mvp * vec4(a_vertex,1.0);
			}

//Basic Fragment Shader
			precision highp float;
			uniform vec4 u_color;
			void main() {
			  gl_FragColor = u_color
			}
```

Note that the shader specifies the names of the streams (attributes).
In LiteGL the class GL.Mesh gives the streams some default names depending on the name of the buffer:
- **a_vertex** for vertices (vec3)
- **a_normal** for normals (vec3)
- **a_coord** for texture coordinates (vec2)

- **a_color** for vertex colors (vec4)
- **a_extra** for any extra stream of one single value (float)
- **a_extra2** for any extra stream of two values per vertice (vec2)
- **a_extra3** for any extra stream of two values per vertice (vec3)
- **a_extra4** for any extra stream of two values per vertice (vec4)

## Create a shader

To create a shader un LiteGL you need to use the class ```GL.Shader```.

Here is the different ways you can create a shader:

If the code is stored in two variables:

```js
var myshader = new GL.Shader( vertex_code, fragment_code );
```

Sometimes  you want to compile the same shader but with different pre-processor macros, then you can pack the macros inside an object and pass it as thirth parameter:

```js
var macros = { USE_PHONG: "" }; //this will be expanded as #define USE_PHONG
var myshader = new GL.Shader( vertex_code, fragment_code, macros );
```

Or if the code is in two files:

```js
var myshader = GL.Shader.fromURL( vertex_code_url, fragment_code_url );
```

Or you can use the ```GL.loadFileAtlas(url, callback)``` which allow to load one single file that contains the code of all the shaders easily.


## Setting up the uniforms

To use a shader you need to upload some variables from javascript to be used in the computations:

```js
//in bulk
myshader.uniforms({ u_mvp: matrix, u_color: [1,1,1,1] });

//per uniform
myshader.setUniform("u_color",[1,1,1,1]);
```

## Information about the shader

You can extract information about the compiled shader like which uniforms or attributes does it use and the types:

```js
//if shader contains this uniform
if( myshader.uniformInfo["u_color"] )
    //...
```

## Render using this shader

If you have already your GL.Mesh you can render it using a shader with the next command:

```js
   myshader.uniforms({u_mvp:matrix}).draw( mymesh );
```

## Default Shaders

The system allows to create some basic shaders easily:

```js
var flat_shader = GL.Shader.getFlatShader(); //useful for rendering flat lines
```

