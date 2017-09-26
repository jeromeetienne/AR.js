# Operating with Vectors, Matrices and Quaternions

When scripting any 3D application usually you will need to do mathematic operations like adding or multiplying vectors,
normalizing, doing the cross or dot product, transforming vectors by matrices, rotating quaternions, etc.

Instead of providing our own mathematical library, LiteScene uses [gl-matrix](http://glmatrix.net/) as the base library for geometric operations.

Created by Brandon Jones, this library has proven to be very powerful and bug-free, but has a particular syntax that any user must understand in order to use it.

## Understanding gl-matrix

gl-matrix does not create classes to store vectors, matrices and quaternions. Instead it relies in the Float32Array class.

This means that any vector, matrix or quaternion created using gl-matrix is stored in a regular Float32Array(...).

Because of this the performance is very good and when storing lots of vectors in a single array, the array can be a regular typed array.

But this also means that we cannot rely in the classical syntax of ```myvector.normalize()```, instead we must call ```vec3.normalize( myvector, myvector )```.

Also, gl-matrix allows to apply any operation over an existing vector without creating new ones, this way it reduces the garbage.


## Creating a Vector3 ##

To create a vector we have several ways:

```js
   var myvector = vec3.create(); //default 0,0,0
   var myvector = vec3.fromValues(x,y,z);
   var myvector = vec3.clone([x,y,z]);
   var myvector = new Float32Array([x,y,z]);
```

You can also create a vec2 or vec4.

## Operating with vectors (vec2,vec3,vec4)

When operating over any container you must pass the output container as the first parameter and the result will always be the first parameter.
And  you dont have to worry if the output container is the same as one of the inputs, gl-matrix handles that for you to avoid strange errors.
This way we can control how much garbage is generated in our code:

```js
var result = vec3.add( vec3.create(), v1, v2 );
```

Here is a list of some of the operations available:

 * ```vec3.add( out, a, b )```: add two vec3
 * ```vec3.sub( out, a, b )```: substracts two vec3
 * ```vec3.mul( out, a, b )```: multiply two vec3
 * ```vec3.div( out, a, b )```: divide two vec3
 * ```vec3.scale( out, a, f )```: multiply a vec3 by a scalar
 * ```vec3.normalize( out, a )```: normalize a vector
 * ```vec3.cross( out, a, b )```: cross product between two vectors
 * ```vec3.dot( out, a, b )```: dot product between two vectors
 * ```vec3.length( a )```: length of the vector
 * ```vec3.clone( a )```: returns another vector
 * ```vec3.copy( r, a )```: copies a vec3 to the output

To have a full list of vec3 operations [the gl-matrix vec3 documentation](http://glmatrix.net/docs/vec3.html)

## Operating with matrices (mat3,mat4)

For matrices the class is mat3 and mat4.

To have a full list of mat4 operations [the gl-matrix mat4 documentation](http://glmatrix.net/docs/mat4.html)

## Operating with quaternions (quat)

For quaternions the class is called quat.

To have a full list of quat operations [the gl-matrix quat documentation](http://glmatrix.net/docs/quat.html)

## Intersections 

Besides vectors and matrices, the system also provides some basic intersection tests:

* ```geo.testRaySphere( start, direction, center, radius, result, max_dist )```
* ```geo.testRayBox( start, direction, minB, maxB, result, max_dist )```
* ```geo.testRayPlane( start, direction, P, N, result )```
* ```geo.testSegmentPlane(start, end, P, N, result )```



