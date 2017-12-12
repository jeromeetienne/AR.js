# ar.js for babylon.js

AR.js now support babylon.js. This is a first version, but it is a working version. 

first include [babylon-ar.js](https://github.com/jeromeetienne/AR.js/tree/master/babylon.js/build/babylon-ar.js)

```html
<script src="https://cdn.rawgit.com/jeromeetienne/AR.js/master/babylon.js/build/babylon-ar.js"></script>
<script>ARjs.Context.baseURL = 'https://cdn.rawgit.com/jeromeetienne/AR.js/master/three.js/'</script> 
```

```javascript
ARjs.Babylon.init(engine, scene, camera)
```
