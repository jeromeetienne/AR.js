//////////////////////////////////////////////////////////////////////////////
//		arjs-hit-testing
//////////////////////////////////////////////////////////////////////////////
AFRAME.registerComponent('mapbox-terrain', {
	schema: {
		latitude : {
			type: 'number',
			default: 0,
		},
		longitude : {
			type: 'number',
			default: 0,
		},
		'zoom-level' : {	// http://wiki.openstreetmap.org/wiki/Zoom_levels
			type: 'number',
			default: 0,
		},
	},
	init: function () {
		// https://www.mapbox.com/studio/account/tokens/
		var access_token = 'pk.eyJ1IjoiamV0aWVubmUiLCJhIjoiY2o1eWFxaHFqMDBlcTJxbnBlNTVlOGkwZiJ9.-gTP-Ef27RRamJP7iF7W9g'

		var mapLatitude = this.data.latitude
		var mapLongitude = this.data.longitude
		var mapZoomLevel = this.data['zoom-level']
		var tileX = long2tile(mapLongitude, mapZoomLevel)
		var tileY = lat2tile(mapLatitude, mapZoomLevel)

	
		var texture = buildTerrainTexture()

		var geometry	= new THREE.PlaneGeometry(1,1);
		var geometry	= buildElevationPlaneGeometry()
		var material	= new THREE.MeshPhongMaterial({
			map: texture,
			// wireframe: true
		}); 

		var mesh	= new THREE.Mesh( geometry, material );
		mesh.rotation.x = -Math.PI/2
		mesh.receiveShadow = true
		mesh.castShadow = true
 
		mesh.scale.multiplyScalar(4)
		this.el.object3D.add(mesh)
		return
		
		// http://wiki.openstreetmap.org/wiki/Slippy_map_tilenames#ECMAScript_.28JavaScript.2FActionScript.2C_etc..29
		function long2tile(lon,zoom) { return (Math.floor((lon+180)/360*Math.pow(2,zoom))); }
 	 	function lat2tile(lat,zoom)  { return (Math.floor((1-Math.log(Math.tan(lat*Math.PI/180) + 1/Math.cos(lat*Math.PI/180))/Math.PI)/2 *Math.pow(2,zoom))); }
 
		function buildElevationPlaneGeometry(){
			// https://blog.mapbox.com/global-elevation-data-6689f1d0ba65
			var restURL = `https://api.mapbox.com/v4/mapbox.terrain-rgb/${mapZoomLevel}/${tileX}/${tileY}@2x.pngraw?access_token=${access_token}`
			// debugger
			var geometry	= new THREE.PlaneBufferGeometry( 1, 1, 512-1, 512-1 );
			loadImage(restURL, function(image){
				
				var canvas = document.createElement('canvas')
				canvas.width = 512
				canvas.height = 512
				var context = canvas.getContext('2d')
				context.drawImage(image, 0, 0)
				var imageData = context.getImageData(0, 0, canvas.width, canvas.height)
				var elevationArray = imageData.data
				
				var positions = geometry.attributes.position.array
				for(var y = 0; y < canvas.height; y++ ){
					for(var x = 0; x < canvas.width; x++ ){
						var offset2 = (y*canvas.width + x)*4
						var height = -10000 + (elevationArray[offset2+0] *256*256 + elevationArray[offset2+1]*256 + elevationArray[offset2+2]) * 0.1
	
						height /= 10000
						height /= 3

						var offsetPosition = (y*canvas.width + x)*3
						positions[offsetPosition+2] = height
					}
				}
				geometry.attributes.position.needsUpdate = true
				geometry.computeVertexNormals()
			})

			return geometry
		}
		function buildTerrainTexture(){
			var restURL = `https://api.mapbox.com/v4/mapbox.streets-satellite/${mapZoomLevel}/${tileX}/${tileY}@2x.png?access_token=${access_token}`
			// var restURL = `https://api.mapbox.com/v4/mapbox.satellite/${mapZoomLevel}/${tileX}/${tileY}@2x.png?access_token=${access_token}`

			var texture = new THREE.Texture()
			loadImage(restURL, function(image){
				texture.image = image
				texture.needsUpdate = true
			})

			return texture
		}
		function loadImage(imageURL, onLoad) {
			var image = document.createElement('img')

			var request = new XMLHttpRequest();
			request.addEventListener('load', function() {
				var fileReader = new FileReader();
				fileReader.addEventListener('loadend', function(){
					var dataUrl = fileReader.result
					var image = document.createElement('img')
					image.src = dataUrl
					image.addEventListener('load', function(){						
						onLoad(image)
					})
				})
				fileReader.readAsDataURL(request.response);
			})
			request.open('GET', imageURL);
			request.responseType = 'blob';
			request.send();
		}
	},
	tick: function(){
		// this._portalDoor.update()
	}
})


AFRAME.registerPrimitive('a-mapbox-terrain', AFRAME.utils.extendDeep({}, AFRAME.primitives.getMeshMixin(), {
	defaultComponents: {
		'mapbox-terrain': {},
	},
	mappings: {
		'latitude': 'mapbox-terrain.latitude',
		'longitude': 'mapbox-terrain.longitude',
		'zoom-level': 'mapbox-terrain.zoom-level',
	}
}))
