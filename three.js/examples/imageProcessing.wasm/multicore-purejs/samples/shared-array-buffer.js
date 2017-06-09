function doStuffWith(buffer) {
	// read from read-only range
	// read/write to borrowed range
	// ...
}

self.onmessage = function(event) {
	var [buffer, readOnly, borrowed] = event.data;
	
	try {
		// error: can't borrow from range that is not currently owned
		buffer.borrow(0, 4096);
	} catch (e) { }
	
	try {
		// attach the regions to the buffer
		borrowed.attach(buffer);
		readOnly.attach(buffer);
		
		doStuffWith(buffer);
	} finally {
		// detach the regions from the buffer
		borrowed.detach();
		readOnly.detach();
		
		// return the regions back to the main thread
		postMessage([readOnly, borrowed], [readOnly, borrowed]);
	}
};
