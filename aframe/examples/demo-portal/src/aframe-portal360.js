//////////////////////////////////////////////////////////////////////////////
//		arjs-hit-testing
//////////////////////////////////////////////////////////////////////////////
AFRAME.registerComponent('arjs-portal360', {
	dependencies: ['arjs'],
	schema: {
		url : {
			type: 'string',
		},
		doorWidth : {
			type: 'number',
			default: 1,
		},
		doorHeight : {
			type: 'number',
			default: 2,
		},
	},
	init: function () {
		var _this = this

		var doorWidth = this.data.doorWidth
		var doorHeight = this.data.doorHeight
		var imageURL = this.data.url

		var portal360 = new THREEx.Portal360(imageURL, doorWidth, doorHeight)
		this._portal360 = portal360
		
		this.el.object3D.add(portal360.object3d)
	},
	tick: function(){
		this._portal360.update()
	}
})


AFRAME.registerPrimitive('a-portal360', AFRAME.utils.extendDeep({}, AFRAME.primitives.getMeshMixin(), {
	defaultComponents: {
		'arjs-portal360': {},
	},
	mappings: {
		'url': 'arjs-portal360.url',
	}
}));
