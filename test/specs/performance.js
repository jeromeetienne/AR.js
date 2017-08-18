var viewportSize = {
	width: 640,
	height: 480,
}
browser.setViewportSize(viewportSize)


describe('AR.js Performance', function() {
	
	it(`fps average`, function () {
		var pageURL = '/three.js/examples/test-runner.html?artoolkit'                
		browser.url(pageURL)
		
		var averageFPS = measureFPS(browser, 2000)
		console.log('averageFPS ', averageFPS )
		
		// TODO what should i do with that ? 
		// - should i log it somewhere
	})
	
})

//////////////////////////////////////////////////////////////////////////////
//		Code Separator
//////////////////////////////////////////////////////////////////////////////

// NOTE: should i be custom command http://webdriver.io/guide/usage/customcommands.html

/**
 * client at a given position on the canvas
 * - useful to test hit testing
 */
function measureFPS(browser, delay){
	browser.timeoutsAsyncScript(5000);
	var result = browser.executeAsync(function(delay, done) {
		// declare variables
		var lastTime = null
		var averageFPS = 1/30
		
		// do a requestAnimationFrame loop
		requestAnimationFrame(function animate(nowMsec){
			// keep looping
			requestAnimationFrame( animate );
			// measure time
			lastTime	= lastTime || (nowMsec/1000-1000/30)
			var deltaTime	= nowMsec/1000 - lastTime
			// update lastTimeMsec
			lastTime	= nowMsec/1000
			// update averageFPS 
			averageFPS  = averageFPS *0.9 + (1/deltaTime)*0.1
			
			console.log('averageFPS ', averageFPS )
		})
		
		// wait for a bit and return averageFPS 
		setTimeout(function() {
			done(averageFPS );
		}, delay);
	}, delay)
	return result.value
}
