//////////////////////////////////////////////////////////////////////////////
//		arjs-hit-testing
//////////////////////////////////////////////////////////////////////////////
AFRAME.registerComponent('arjs-portal', {
	dependencies: ['arjs'],
	schema: {
		url : {
			type: 'string',
		},
	},
	init: function () {
		var _this = this
		var doorWidth = 1
		var doorHeight = 2
		
		var doorCenter = new THREE.Group
		doorCenter.position.y = doorHeight/2
		this.el.object3D.add(doorCenter)

		// create texture
		var imageURL = this.data.url
		var imageURL = 'images/360_topaz.png'
		var texture360 = new THREE.TextureLoader().load(imageURL)
		// texture360.minFilter = THREE.NearestFilter;
		// texture360.magFilter = THREE.NearestFilter;
		texture360.format = THREE.RGBFormat;
		texture360.flipY = false;

  		// create insideMesh which is visible IIF inside the portal
		var insideMesh = buildInsideMesh(texture360, doorWidth, doorHeight)
		doorCenter.add(insideMesh)
		this.insideMesh = insideMesh

  		// create outsideMesh which is visible IIF outside the portal
		var outsideMesh = buildOutsideMesh(texture360, doorWidth, doorHeight)
		doorCenter.add(outsideMesh)
		this.outsideMesh = outsideMesh

		// create frameMesh for the frame of the portal
		var frameMesh = buildRectangularFrame(doorWidth/100, doorWidth, doorHeight)
		doorCenter.add(frameMesh)
		return

		/**
		 * create insideMesh which is visible IIF inside the portal
		 */
		function buildInsideMesh(texture360, doorWidth, doorHeight){
			var doorInsideCenter = new THREE.Group

			// var squareCache = THREEx.HoleInTheWall.buildSquareCache()
			// squareCache.scale.y = doorWidth
			// squareCache.scale.y = doorHeight
			// doorInsideCenter.add( squareCache )

			var geometry = new THREE.PlaneGeometry(doorWidth, doorHeight)
			var material = THREEx.HoleInTheWall.buildTransparentMaterial()
			// var material = new THREE.MeshNormalMaterial()
			var mesh = new THREE.Mesh( geometry, material)
			mesh.rotation.y = Math.PI
			// mesh.position.z = 0.03
			doorInsideCenter.add( mesh )


			//////////////////////////////////////////////////////////////////////////////
			//		add 360 sphere
			//////////////////////////////////////////////////////////////////////////////
			// add 360 texture
			// TODO put that in a this.data
			var radius360Sphere = 10
			// var radius360Sphere = 1

			var geometry = new THREE.SphereGeometry( radius360Sphere, 16, 16).rotateZ(Math.PI)
			var material = new THREE.MeshBasicMaterial( {
				map: texture360,
				// opacity: 0.9,
				side: THREE.DoubleSide,
			});
			// var material = new THREE.MeshNormalMaterial()
			var sphere360Mesh = new THREE.Mesh( geometry, material );
			sphere360Mesh.position.z = -0.1
			sphere360Mesh.rotation.y = Math.PI
			doorInsideCenter.add(sphere360Mesh)
			
			return doorInsideCenter
		}

		/**
		 * create outsideMesh which is visible IIF outside the portal
		 */
		function buildOutsideMesh(texture360, doorWidth, doorHeight){
			var doorOutsideCenter = new THREE.Group

			//////////////////////////////////////////////////////////////////////////////
			//		add squareCache
			//////////////////////////////////////////////////////////////////////////////
			var squareCache = THREEx.HoleInTheWall.buildSquareCache()
			squareCache.scale.y = doorWidth
			squareCache.scale.y = doorHeight
			doorOutsideCenter.add( squareCache )

			//////////////////////////////////////////////////////////////////////////////
			//		add 360 sphere
			//////////////////////////////////////////////////////////////////////////////
			// add 360 texture
			var radius360Sphere = 10
			// var radius360Sphere = 1

			// build half sphere geometry
			var geometry = new THREE.SphereGeometry( radius360Sphere, 16, 16, Math.PI, Math.PI, 0, Math.PI).rotateZ(Math.PI)
			// fix UVs
			geometry.faceVertexUvs[0].forEach(function(faceUvs){
				faceUvs.forEach(function(uv){
					uv.x /= 2
				})
			})
			geometry.uvsNeedUpdate = true
			var material = new THREE.MeshBasicMaterial( {
				map: texture360,
				// opacity: 0.9,
				side: THREE.BackSide,
			});
			// var geometry = new THREE.SphereGeometry( radius360Sphere, 16, 16);
			// var material = new THREE.MeshNormalMaterial()
			var sphere360Mesh = new THREE.Mesh( geometry, material );
			sphere360Mesh.position.z = -0.1
			doorOutsideCenter.add(sphere360Mesh)
			
			return doorOutsideCenter
		}

		/**
		 * create frameMesh for the frame of the portal
		 */
		function buildRectangularFrame(radius, width, height){
			var container = new THREE.Group
			var material = new THREE.MeshNormalMaterial()
			var material = new THREE.MeshPhongMaterial({
				color: 'silver',
				emissive: 'green'
			})

			var geometryBeamVertical = new THREE.CylinderGeometry(radius, radius, height - radius)

			// mesh right
			var meshRight = new THREE.Mesh(geometryBeamVertical, material)
			meshRight.position.x = width/2
			container.add(meshRight)

			// mesh right
			var meshLeft = new THREE.Mesh(geometryBeamVertical, material)
			meshLeft.position.x = -width/2
			container.add(meshLeft)

			var geometryBeamHorizontal = new THREE.CylinderGeometry(radius, radius, width - radius).rotateZ(Math.PI/2)

			// mesh top
			var meshTop = new THREE.Mesh(geometryBeamHorizontal, material)
			meshTop.position.y = height/2
			container.add(meshTop)

			// mesh bottom
			var meshBottom = new THREE.Mesh(geometryBeamHorizontal, material)
			meshBottom.position.y = -height/2
			container.add(meshBottom)

			return container
		}
	},
	tick: function(){

		// determine if the user is isOutsidePortal
		var localPosition = new THREE.Vector3
		this.el.object3D.worldToLocal(localPosition)
		var isOutsidePortal = localPosition.z >= 0 ? true : false

		// handle mesh visibility based on isOutsidePortal
		if( isOutsidePortal ){
			this.outsideMesh.visible = true
			this.insideMesh.visible = false
		}else{
			this.outsideMesh.visible = false
			this.insideMesh.visible = true
		}
	}
})


AFRAME.registerPrimitive('a-ar-portal', AFRAME.utils.extendDeep({}, AFRAME.primitives.getMeshMixin(), {
	defaultComponents: {
		'arjs-portal': {},
	},
	mappings: {
		'url': 'arjs-portal.url',
	}
}));
