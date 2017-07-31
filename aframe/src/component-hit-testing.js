//////////////////////////////////////////////////////////////////////////////
//		arjs-hit-testing
//////////////////////////////////////////////////////////////////////////////
AFRAME.registerComponent('arjs-hit-testing', {
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
		_this._arHitTesting = null

		// trick to wait until arjsSystem is initialised
		var startedAt = Date.now()
		var timerId = setInterval(function(){
			var anchorEl = _this.el
			var anchorComponent = anchorEl.components['arjs-anchor']
			// wait until anchorComponent is initialised
			if( anchorComponent === undefined || anchorComponent.initialised === false )	return

			clearInterval(timerId)

			//////////////////////////////////////////////////////////////////////////////
			//		create arAnchor
			//////////////////////////////////////////////////////////////////////////////
			var arAnchor = anchorComponent._arAnchor
			var arSession = arjsSystem._arSession
			var renderer = arSession.parameters.renderer

			var hitTesting = _this._arHitTesting = new ARjs.HitTesting(arSession)
			hitTesting.enabled = _this.data.enabled
			
			// tango only - picking to set object position
			renderer.domElement.addEventListener("click", function(domEvent){
				var hitTestResults = hitTesting.testDomEvent(domEvent)
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
		var anchorComponent = anchorEl.components['arjs-anchor']
		var arAnchor = anchorComponent._arAnchor
		

		var hitTesting = this._arHitTesting
		var camera = arSession.parameters.camera
// console.log(camera.position)
		hitTesting.update(camera, arAnchor.object3d, arAnchor.parameters.changeMatrixMode)
	}
});
