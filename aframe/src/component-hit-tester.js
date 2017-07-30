//////////////////////////////////////////////////////////////////////////////
//		arjsmarker
//////////////////////////////////////////////////////////////////////////////
AFRAME.registerComponent('arjs-hit-tester', {
	dependencies: ['arjs', 'artoolkit'],
	schema: {
		enabled : {
			type: 'boolean',
			default: false,
		},
		renderDebug : {
			type: 'boolean',
			default: false,
		},
	},
	init: function () {
		var _this = this
		var arjsSystem = this.el.sceneEl.systems.arjs || this.el.sceneEl.systems.artoolkit

// TODO make it work on cameraTransformMatrix too
// 
		_this.initialised = false
		_this._arAnchor = null
		_this._arHitTester = null

		// trick to wait until arjsSystem is initialised
		var startedAt = Date.now()
		var timerId = setInterval(function(){
			var anchorEl = _this.el
			var arjsMarker = anchorEl.components.arjsmarker
			// wait until arjsMarker is initialised
			if( arjsMarker === undefined || arjsMarker.initialised === false )	return

			clearInterval(timerId)

			//////////////////////////////////////////////////////////////////////////////
			//		create arAnchor
			//////////////////////////////////////////////////////////////////////////////
			var arAnchor = arjsMarker._arAnchor
			var arSession = arjsSystem._arSession
			var renderer = arSession.renderer

			var hitTester = _this._arHitTester = new ARjs.HitTester(arSession)
			
			// tango only - picking to set object position
			renderer.domElement.addEventListener("click", function(domEvent){
				var hitTestResults = hitTester.testDomEvent(domEvent)
				if( hitTestResults.length === 0 )	return

				var hitTestResult = hitTestResults[0]
				arAnchor.applyHitTestResult(hitTestResult)
			})
			
			_this.initialised = true
		}, 1000/60)
	},
	remove : function(){
	},
	update: function () {
	},
	tick: function(){
		var _this = this
		// if not yet initialised, do nothing
		if( this.initialised === false )	return

		var arjsSystem = this.el.sceneEl.systems.arjs || this.el.sceneEl.systems.artoolkit
		var arSession = arjsSystem._arSession

		var anchorEl = _this.el
		var arjsMarker = anchorEl.components.arjsmarker
		var arAnchor = arjsMarker._arAnchor
		

		var hitTester = this._arHitTester
		var camera = arSession.camera
// console.log(camera.position)
		hitTester.update(camera, arAnchor.object3d, arAnchor.parameters.changeMatrixMode)
	}
});

//////////////////////////////////////////////////////////////////////////////
//                define some primitives shortcuts
//////////////////////////////////////////////////////////////////////////////

AFRAME.registerPrimitive('a-hit-tester', AFRAME.utils.extendDeep({}, AFRAME.primitives.getMeshMixin(), {
	defaultComponents: {
		'arjs-hit-tester': {},
	},
	mappings: {
		'enabled': 'arjs-hit-tester.enabled',
		'renderDebug': 'arjs-hit-tester.renderDebug',
	}
}));
