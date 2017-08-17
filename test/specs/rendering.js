var viewportSize = {
	width: 640,
	height: 480,
}
browser.setViewportSize(viewportSize)


describe('AR.js Rendering', function() {
	
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
	
	// test that clicking in the middle of the screen, actually move the object
	// - aka hit testing should be there
	it('test hit testing', function () {
		var pageURL = '/three.js/examples/test-runner.html?artoolkit'                
		browser.url(pageURL)
	
		triggerClick(browser, 0.5, 0.5)
		browser.checkViewport()
	})
	

	// var windowSize = browser.windowHandleSize();
	// console.log('window.size', windowSize.value.width+'x'+windowSize.value.height); // outputs: { width: 500, height: 602 }
	
			
})


//////////////////////////////////////////////////////////////////////////////
//		Code Separator
//////////////////////////////////////////////////////////////////////////////

// NOTE: should i be custom command http://webdriver.io/guide/usage/customcommands.html

/**
 * client at a given position on the canvas
 * - useful to test hit testing
 */
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

/**
 * to change currentTime in the testing video
 */
function seekVideo(browser, currentTime){
	browser.execute(function(currentTime) {
		// get the video at a given point
		var videoElement = arSession.arSource.domElement
		videoElement.pause()
		videoElement.currentTime = 4.0
	}, currentTime)	
}
