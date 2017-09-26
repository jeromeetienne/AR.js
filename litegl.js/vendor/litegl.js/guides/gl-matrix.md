# gl-matrix #

When creating any 3D application the developer always need to have a vector3 class and a matrix4x4, mostly for screen projection and vertex transformations.

There are several mathmatical libraries for Javascript but all rely in creating classes to store every basic data, a class for vector3, a class for matrix44 and so on.

This has several problems, first the performance, and second the memory fragmentation.

To avoid this gl-matrix propose a different paradigm, instead of instantiating a class to store some data (like a vector3) we create the most basic Javascript typed array, a Float32Array with three elements.

This way accessing the data is fast and we can pack lots of data in one single array.

The only problem is that the syntax changes a little bit. 

To create a var we have some functions:


```javascript

//creating data in different ways
var vertex = vec3.create(); //it will contain [0,0,0]
var normal = vec3.fromValues(0,1,0); //it will contain [0,1,0]
var result = vec3.clone([1,2,3]); //it will contain [1,2,3]
//all three vars contain a Float32Array[3]
```

Instead of calling to a method in the var that contains the data, we call a global function and pass all the data it needs to perform the operation.

In gl-matrix the first parameter is always the place where to store the result of the operation.

```javascript
//operating
vec3.add( result, vertex, normal ); //this adds vertex to normal and stores the result in result
```

When working with matrices is the same:

```javascript
var matrix = mat4.create(); //the default is the identity matrix
vec3.transformMat4( result, vertex, matrix );
```

Keep in mind that LiteGL adds some extra useful functions to vec3, mat4 and quat.

For more info about gl-matrix [check the documentation](http://glmatrix.net/docs/glMatrix.html)
