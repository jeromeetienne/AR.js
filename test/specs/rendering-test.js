var viewportSize = {
	width: 640,
	height: 360,
}
// var viewportSize = {
// 	width: 360,
// 	height: 640,
// }
browser.setViewportSize(viewportSize)

describe('AR.js test', function() {
	it(`rendering-three.js-artookit-${viewportSize.width}x${viewportSize.height}`, function () {
		var pageURL = '/three.js/examples/test-runner.html#artoolkit'                
		browser.url(pageURL)
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
