self.addEventListener('message', function(event) {
	// console.log('in worker - received event', event)
	if( event.data === 'init' ){
		console.log('in worker - initialization', event)
		// ... init stuff here
		// 
		self.postMessage('started')
	}
}, false);
