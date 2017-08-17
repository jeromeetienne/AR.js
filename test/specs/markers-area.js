var viewportSize = {
	width: 640,
	height: 480,
}
browser.setViewportSize(viewportSize)


describe('AR.js Markers Area', function() {

	//////////////////////////////////////////////////////////////////////////////
	//		Code Separator
	//////////////////////////////////////////////////////////////////////////////
	it('learn an markers-area and play it', function () {
		// goes in test-runner.html
		var pageURL = '/three.js/examples/test-runner.html'
		browser.url(pageURL)

		browser.click('#buttonMarkersAreaLearner')

		browser.waitUntil(function () {
			return browser.url().value.match(/learner-testrunner.html/) !== null
		}, 5000, 'page hasnt loaded in 5-seconds');

		// Wait for the time to learn the markers-area
		browser.pause(1000);

		// stop the recording
		browser.click('#recordStopButton')

		// wait until test-runner.html is loaded back
		browser.waitUntil(function () {
			return browser.url().value.match(/test-runner.html/) !== null
		}, 5000, 'page hasnt loaded in 5-seconds');

		// take screenshot of the result
		browser.checkViewport()
	})

	//////////////////////////////////////////////////////////////////////////////
	//		Code Separator
	//////////////////////////////////////////////////////////////////////////////
	it('use a markers-area and enabled markers-helpers', function() {
		// goes in test-runner.html
		var pageURL = '/three.js/examples/test-runner.html'
		browser.url(pageURL)

		// toggle marker-helpers
		browser.click('#buttonToggleMarkerHelpers')
	
		// take a screenshot of the result
		browser.checkViewport()
	})
	
	//////////////////////////////////////////////////////////////////////////////
	//		Code Separator
	//////////////////////////////////////////////////////////////////////////////
	it('reset the markers-area and enable marker-helpers', function () {
		// goes in test-runner.html
		var pageURL = '/three.js/examples/test-runner.html'
		browser.url(pageURL)

		// click button to reset markers-area
		browser.click('#buttonMarkersAreaReset')
	
		// FIXME timeout is lame
		browser.pause(1000);

		// click to display markers-helpers
		browser.click('#buttonToggleMarkerHelpers')

		// take a screenshot fo the results
		browser.checkViewport()
	})
})
