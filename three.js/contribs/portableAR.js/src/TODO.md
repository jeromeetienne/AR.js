# easy-ar.js
- provide cameraProjection matrix

- whenever tracking is happening, notified thru event
  - tracking-started
  - tracking-stopped

- https://github.com/jeromeetienne/microevent.js/blob/master/microevent.js#L12-31
  

```js
var portableARjs = new PortableARjs()

portableARjs.addEventListener('ready', function(){
	// portableARjs.cameraProjectionMatrix = array(16)
})

portableARjs.addEventListener('tracking-updated', function(cameraTransform){
	
})

portableARjs.addEventListener('tracking-stopped', function(){
	
})
portableARjs.addEventListener('tracking-started', function(){
	
})
```
