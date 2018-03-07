# easy-ar.js
- provide cameraProjection matrix

- whenever tracking is happening, notified thru event
  - tracking-started
  - tracking-stopped

- https://github.com/jeromeetienne/microevent.js/blob/master/microevent.js#L12-31
  

```js
var ezAR = new ezAR()

ezAR.addEventListener('ready', function(){
	// ezAR.cameraProjectionMatrix = array(16)
})

ezAR.addEventListener('tracking-updated', function(cameraTransform){
	
})

ezAR.addEventListener('tracking-stopped', function(){
	
})
ezAR.addEventListener('tracking-started', function(){
	
})
```
