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

## custom markers:
Currently the path to the marker is hardcode within babylon-ar.js @502015
This is clearly a temporary kludge, and i would love if somebody provide a pull request to make it tunable.
```javascript
if( trackingBackend === 'artoolkit' ){
		file.subMarkersControls[0].parameters.type = 'pattern'
		file.subMarkersControls[0].parameters.patternUrl = absoluteBaseURL + 'hiro.patt'
```
If you change the ARjs.Context.baseURL also clear your browsers local storage for the domain, as this parameter is stored here as well.
