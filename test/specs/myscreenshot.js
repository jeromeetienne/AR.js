describe('AR.js test', function() {
	it('take a screenshot', function () {
                var pageURL = '/three.js/examples/test-runner.html'                
		browser.url(pageURL);
                browser.checkViewport();
	});

	it('take a screenshot2', function () {
                var pageURL = '/three.js/examples/test-runner.html'
		browser.url(pageURL);
                browser.checkViewport();
	});
});
