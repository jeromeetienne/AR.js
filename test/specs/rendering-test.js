var viewportSize = {
	width: 640,
	height: 480,
}
browser.setViewportSize(viewportSize)


describe('AR.js testrunner.html', function() {
	
	it(`rendering-three.js-artookit-${viewportSize.width}x${viewportSize.height}`, function () {
		var pageURL = '/three.js/examples/test-runner.html?artoolkit'                
		browser.url(pageURL)
		browser.checkViewport()
	})

	it(`rendering-three.js-aruco-${viewportSize.width}x${viewportSize.height}`, function () {
		var pageURL = '/three.js/examples/test-runner.html?aruco'                
		browser.url(pageURL)
		browser.checkViewport()
	})

	it('test hit testing', function () {
		var pageURL = '/three.js/examples/test-runner.html?artoolkit'                
		browser.url(pageURL)

		triggerClick(browser, 0.5, 0.5)
		browser.checkViewport()
	})
		
	// it(`rendering-three.js-aruco-${viewportSize.width}x${viewportSize.height}`, function () {
	//         var pageURL = '/three.js/examples/test-runner.html#aruco'                
	// 	browser.url(pageURL)
	//         browser.checkViewport()
	// })
	// 
	// it(`rendering-aframe-artoolkit-${viewportSize.width}x${viewportSize.height}`, function () {
	//         var pageURL = '/aframe/examples/test-runner.html'
	// 	browser.url(pageURL)
	//         browser.checkViewport()
	// })
})


//////////////////////////////////////////////////////////////////////////////
//		Code Separator
//////////////////////////////////////////////////////////////////////////////


function triggerClick(browser, normalizedX, normalizedY){
	browser.execute(function(normalizedX, normalizedY) {
		// Create mouse events
		// - https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent/MouseEvent
		var mouseEvent = new MouseEvent("click", {
			clientX: normalizedX * arSession.arSource.domElementWidth(),
			clientY: normalizedY * arSession.arSource.domElementHeight(),
		})
		// dispatch the event
		renderer.domElement.dispatchEvent(mouseEvent);
	}, normalizedX, normalizedY)	
}

function seekVideo(browser, currentTime){
	browser.execute(function(currentTime) {
		// get the video at a given point
		var videoElement = arSession.arSource.domElement
		videoElement.pause()
		videoElement.currentTime = 4.0
	}, currentTime)	
}
