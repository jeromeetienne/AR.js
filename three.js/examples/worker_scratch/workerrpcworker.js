/**
	ARToolKit Web Worker proxy.
*/

importScripts("../../vendor/jsartoolkit5/build/artoolkit.debug.js");
importScripts("../../src/threex/threex-artoolkitcontext.js");
importScripts("../../src/threex/threex-armarkercontrols.js");


onmessage = function(event) {
	if( event.data.type === 'ArToolkitContext'){
		onMessageContext(event)
	}else if( event.data.type === 'ArToolkitControls'){
		onMessageControls(event)
	}else{
		console.assert(false, 'unknown data type '+event.data.type)
	}
}


//////////////////////////////////////////////////////////////////////////////
//		THREEx.ArToolkitContext
//////////////////////////////////////////////////////////////////////////////

var contextWorkers = {};
var contextWorkerId = 0;
var contextCallbackMethods = {
	'loadNFTMarker': 1,
	'loadMarker': 1,
	'loadMultiMarker': 1
};

function onMessageContext(event){
	var data = event.data
	
	if (data.method === 'new') {
		
		// create ArToolkitContext
		var arToolKitContext = new THREEx.ArToolkitContext(data.args[0]);
		// store it
		var contextId = contextWorkerId++;
		contextWorkers[contextId] = arToolKitContext;

		// notify the main thread it is completed
		postMessage({method: 'new', contextId: contextId, callId: data.callId});

	} else if (data.method === 'dispose') {
		
		// get arToolKitContext
		var contextId = data.contextId
		var arToolKitContext = contextWorkers[contextId];

		// dispose of arToolKitContext
		arToolKitContext.dispose();
		delete contextWorkers[data.id];

		// notify the main thread it is completed
		postMessage({method: 'dispose', contextId: data.id, callId: data.callId});

	} else {
		// get arToolKitContext

		var arToolKitContext = contextWorkers[data.id];

		if (contextCallbackMethods[data.method]) {
			data.args.push(function() {
				var args = Array.prototype.slice.call(arguments)
				postMessage({method: data.method, result: args, id: data.id, callId: data.callId});
			});
			arToolKitContext[data.method].apply(arToolKitContext, data.args);
		} else {
			var result = arToolKitContext[data.method].apply(arToolKitContext, data.args);
			postMessage({method: data.method, result: result, id: data.id, callId: data.callId});
		}
	}

};

//////////////////////////////////////////////////////////////////////////////
//		THREEx.ArToolkitControls
//////////////////////////////////////////////////////////////////////////////

var controlsWorkers = {};
var controlsWorkerId = 0;
var controlsCallbackMethods = {
	'loadNFTMarker': 1,
	'loadMarker': 1,
	'loadMultiMarker': 1
};

function onMessageControls(event){
	var data = event.data
	
	if (data.method === 'new') {
		
		// get arToolKitContext
		var contextId = data.contextId
		var arToolKitContext = contextWorkers[contextId];

		// create ArToolkitContext
		var arMarkerControls = new THREEx.ArMarkerControls(arToolKitContext, OBJECT3D, data.args[0]);
		// store it
		var controlsId = controlsWorkerId++;
		controlsWorkers[controlsId] = arMarkerControls;

		// notify the main thread it is completed
		postMessage({method: 'new', controlsId: controlsId, callId: data.callId});

	} else if (data.method === 'dispose') {
		
		// get arMarkerControls
		var controlsId = data.controlsId
		var arMarkerControls = controlsWorkers[controlsId];

		// dispose of arMarkerControls
		arMarkerControls.dispose();
		delete controlsWorkers[data.id];

		// notify the main thread it is completed
		postMessage({method: 'dispose', controlsId: data.id, callId: data.callId});

	} else {
		// get arMarkerControls

		var arMarkerControls = controlsWorkers[data.id];

		if (controlsCallbackMethods[data.method]) {
			data.args.push(function() {
				var args = Array.prototype.slice.call(arguments)
				postMessage({method: data.method, result: args, id: data.id, callId: data.callId});
			});
			arMarkerControls[data.method].apply(arMarkerControls, data.args);
		} else {
			var result = arMarkerControls[data.method].apply(arToolKitContext, data.args);
			postMessage({method: data.method, result: result, id: data.id, callId: data.callId});
		}
	}

};
