/**
	ARToolKit Web Worker proxy.
*/

importScripts("../build/artoolkit.min.js");

WorkerARControllers = {};
WorkerARControllerID = 0;

callbackMethods = {
	'loadNFTMarker': 1,
	'loadMarker': 1,
	'loadMultiMarker': 1
};

onmessage = function(ev) {

	if (ev.data.method === 'new') {

		var arController = new ARController(ev.data.arguments[0], ev.data.arguments[1], ev.data.arguments[2]);
		var id = WorkerARControllerID++;
		WorkerARControllers[id] = arController;
		var eventProxy = function(ev) {
			ev.target = id;
			postMessage({event: ev});
		};
		['load', 'markerNum', 'getMarker', 'getNFTMarker', 'getMultiMarker', 'getMultiMarkerSub'].forEach(function(n) {
			arController.addEventListener(n, eventProxy);
		});
		postMessage({method: 'new', id: id, callID: ev.data.callID});

	} else if (ev.data.method === 'dispose') {

		var arController = WorkerARControllers[ev.data.id];
		arController.dispose();
		delete WorkerARControllers[ev.data.id];
		postMessage({method: 'dispose', id: ev.data.id, callID: ev.data.callID});

	} else {

		var arController = WorkerARControllers[ev.data.id];
// console.log('method', ev.data.method, arController, ev.data.id, WorkerARControllers)
		if (callbackMethods[ev.data.method]) {
			ev.data.arguments.push(function() {
				var args = Array.prototype.slice.call(arguments)
				postMessage({method: ev.data.method, result: args, id: ev.data.id, callID: ev.data.callID});
			});
			arController[ev.data.method].apply(arController, ev.data.arguments);
		} else {
			var result = arController[ev.data.method].apply(arController, ev.data.arguments);
			postMessage({method: ev.data.method, result: result, id: ev.data.id, callID: ev.data.callID});
		}
	}

};
