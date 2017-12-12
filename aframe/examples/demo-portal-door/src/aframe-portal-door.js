//////////////////////////////////////////////////////////////////////////////
//		arjs-hit-testing
//////////////////////////////////////////////////////////////////////////////
AFRAME.registerComponent('arjs-portal-door', {
	schema: {
		url : {		// Url of the content - may be video or image
			type: 'string',
		},
		doorWidth : {	// width of the door
			type: 'number',
			default: 1,
		},
		doorHeight : {	// height of the door
			type: 'number',
			default: 2,
		},
	},
	init: function () {
		var _this = this

		var doorWidth = this.data.doorWidth
		var doorHeight = this.data.doorHeight
		var imageURL = this.data.url

		var portalDoor = new THREEx.Portal360(imageURL, doorWidth, doorHeight)
		this._portalDoor = portalDoor

		this.el.object3D.add(portalDoor.object3d)
	},
	tick: function(){
		this._portalDoor.update()
	}
})


AFRAME.registerPrimitive('a-portal-door', AFRAME.utils.extendDeep({}, AFRAME.primitives.getMeshMixin(), {
	defaultComponents: {
		'arjs-portal-door': {},
	},
	mappings: {
		'url': 'arjs-portal-door.url',
	}
}))
