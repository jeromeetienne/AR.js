# GL.Mesh and GL.Buffer

To be able to render something we need to send the geometry of the object (vertices mostly, but could also be normals, texture coordinates,...) to the GPU.

Usually we store this information in buffers and send them so they are kept in the VRAM, this way the geometry can be easily retrieved by the GPU when it has to render the object.

To pack and send every buffer to the GPU you can use the class ```GL.Buffer```. 

Because normally an object is composed by several buffers, LiteGL uses the class ```GL.Mesh``` to store and manage ```GL.Buffers```.

## GL.Buffer ##

The class ```GL.Buffer``` contains several properties:

- **buffer**: this variable contains the ```WebGLBuffer``` handler of this buffer.
- **data**: this contains the typed array which contains a copy of the data that must be send to the GPU.
- **target**: the enum of WebGL to specify if this buffer is a GL.ARRAY_BUFFER (regular data) or a GL.ELEMENT_ARRAY_BUFFER (for indexing)
- **spacing**: tells every element in this array how many components does it have (a 3D point would have 3: (x,y,z)).
- **stream_type**: to tell the GPU how frequently the data will be modified, valid values are GL.STATIC_DRAW, GL.DYNAMIC_DRAW or GL.STREAM_DRAW
- **gl**: the WebGL context where this buffer is attached.

Some useful methods are:

- ```upload( stream_type )```: this will take the data and send it to the GPU.
- ```uploadRange( start, size )```: this will upload to the GPU only a range of the buffer (in case only some parts where modified)
- ```applyTransform( mat4 )```: applies a matrix transformation to every vertex in this buffer. Used to bake transformations.

An example of how to create a buffer:
```javascript
  var vertices_buffer = new GL.Buffer( gl.ARRAY_BUFFER, [0,0,0, 1,1,1, 0,1,0], 3 );
```

## GL.Mesh ##

This is the container to store several buffers. You dont need to use this container but it helps loading and doing the render calls.

The important methods are:

- **vertexBuffers**: object that contains all the ```GL.Buffer``` by their name.
- **indexBuffers**: object that contains all the ```GL.Buffer``` that are for indexing.
- **info**: object that contain some extra info about this mesh (like groups).
- **bounding**: the bounding box in ```BBox``` format (center,halfsize,min,max,radius).
- **gl**: the WebGL context where this buffers were attached.

Some useful methods are:

- ```upload```: uploads all the buffer again in the VRAM.
- ```updateBounding```: recomputes the boundingbox from the vertices in the mesh.
- ```getVertexBuffer( name )``` returns the ```GL.Buffer``` with that name (not index buffers).
- ```getIndexBuffer( name )``` returns the ```GL.Buffer``` for index buffers.

### How to create a mesh ###

You can create a mesh by creating every buffer individually and attaching them to a mesh or just using this method:

```js
var mesh = GL.Mesh.load({ 
  vertices: [0,0,0, 1,0,0, 0,1,0], 
  normals: [0,0,1, 0,0,1, 0,0,1], 
  coords: [0,0, 1,0, 1,0], 
  triangles: [0,1,2]
});
```

## Basic primitives ##

If you want to generate procedurally some basic geometric shapes (like spheres, planes, cubes, etc) the class ```GL.Mesh``` comes with some handy functions.

You must call the function directly from the base class ```GL.Mesh```(do not create the mesh using the ``new``` operator).

- ```GL.Mesh.plane({...})```: to create a plane, params are { detail, detailX, detailY, size, width, heigth, xz (horizontal plane) }
- ```GL.Mesh.cube({...})```: to create a cube, params are { size }
- ```GL.Mesh.sphere({...})```: to create a sphere, params are { radius, lat, long, subdivisions, hemi }

An example:

```javascript
  var mymesh = GL.Mesh.sphere({radius: 10, subdivisions: 20});
```

## Loading and Parsing ##

In case you want to load a remote mesh and parse it, the ```GL.Mesh``` comes with a basic OBJ loader but it can be extended to support other formats.

```javascript
  var mymesh = GL.Mesh.fromURL("meshes/mymesh.obj");
```

To extend the loader add your parser function to the ```GL.Mesh.parsers[ format ]``` container.

