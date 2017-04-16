(function() {
	/**
		Creates a Web Worker that runs AR marker detection.

		Sets up event dispatch from the Worker ARController to the worker object and its listeners.

		Use the ARProxy class to make use of the AR Worker.
	*/
	var makeARWorker = function() {
		var worker = new Worker('../vendor/jsartoolkit5/js/artoolkit.worker.js');
		worker.callID = 0;
		worker.callbacks = {};
		worker.listeners = {};
		worker.allEventListeners = [];

		worker.call = function(id, method, arguments, transferables, callback) {
			var callID = this.callID++;
			if (typeof transferables === 'function') {
				callback = transferables;
				transferables = undefined;
			}
			this.callbacks[callID] = callback;
			this.postMessage({
				method: method,
				id: id,
				callID: callID,
				arguments: arguments
			}, transferables);
		};

		worker.addEventListener = function(name, callback) {
			if (!this.listeners[name]) {
				this.listeners[name] = [];
			}
			this.listeners[name].push(callback);
		};

		worker.removeEventListener = function(name, callback) {
			if (this.listeners[name]) {
				var index = this.listeners[name].indexOf(callback);
				if (index > -1) {
					this.listeners[name].splice(index, 1);
				}
			}
		};

		worker.dispatchEvent = function(event) {
			var self = this;
			this.allEventListeners.forEach(function(f) { f.call(self, event) });
			var listeners = this.listeners[event.name];
			if (listeners) {
				for (var i=0; i<listeners.length; i++) {
					listeners[i].call(this, event);
				}
			}
		};

		worker.listenForAllEvents = function(callback) {
			this.allEventListeners.push(callback);
		};

		worker.onmessage = function(ev) {
			if (ev.data.event) {
				this.dispatchEvent(ev.data.event);
			} else {
				var callback = this.callbacks[ev.data.callID];
				if (callback) {
					callback(ev.data);
				}
				delete this.callbacks[ev.data.callID];
			}
		};

		return worker;
	};

	/**
		ARProxy implements a proxy ARController that dispatches its calls to an ARController running in a Web Worker.

		var proxy = new ARProxy(
			arController,
			'/examples/Data/camera_para-iPhone 5 rear 640x480 1.0m.dat',
			function() { 
				console.log("Created a new ARController Worker", arguments); 
			}
		);

		proxy.addEventListener('load', function() {
			this.loadNFTMarker("mymarker", function(ev) {
				var markerRoot = this.arController.createThreeNFTMarker(ev.result[0]);
				markerRoot.add(sphere);
				arScene.scene.add(markerRoot);
				this.processingDone = true;

			});
		});

		proxy.process(arScene.video);

	*/
	ARProxy = function(arController, cameraParam, callback) {
		this.listeners = {};
		this.allEventListeners = [];
		this.id = null;

		this.arController = arController;

		this.worker = makeARWorker();

		this.processingDone = false;

		this.canvas = document.createElement('canvas');
		this.canvas.width = arController.videoWidth;
		this.canvas.height = arController.videoHeight;
		this.ctx = this.canvas.getContext('2d');

		this.addEventListener = this.worker.addEventListener;
		this.removeEventListener = this.worker.removeEventListener;
		this.dispatchEvent = this.worker.dispatchEvent;
		this.listenForAllEvents = this.worker.listenForAllEvents;

		var self = this;
		var newCallback = function(result) {
			self.id = result.id;
			if (callback) {
				callback(self);
			}
		}
		this.worker.call(null, 'new', [arController.videoWidth, arController.videoHeight, cameraParam], [], newCallback);
		this.worker.listenForAllEvents(function(ev) { 
			if (ev.target === self.id) {
				self.dispatchEvent(ev);
			}
		});

		this.addEventListener('getNFTMarker', function(ev) {
			this.arController.threeNFTMarkers[ev.data.index].keepVisible = true;
			this.arController.dispatchEvent(ev);
		});

		this.addEventListener('getMarker', function(ev) {
			if (ev.data.type === artoolkit.BARCODE_MARKER) {
				if (this.arController.barcodeMarkers[ev.data.index]) {
					this.arController.barcodeMarkers[ev.data.index].keepVisible = true;
				}
			} else {
				if (this.arController.patternMarkers[ev.data.index]) {
					this.arController.patternMarkers[ev.data.index].keepVisible = true;
				}
			}
			this.arController.dispatchEvent(ev);
		});

		this.addEventListener('markerNum', function(event) {
			var self = this.arController;
			for (var i in self.threePatternMarkers) {
				if (!self.threePatternMarkers[i].keepVisible) {
					self.threePatternMarkers[i].visible = false;
				}
				self.threePatternMarkers[i].keepVisible = false;
			}
			for (var i in self.threeNFTMarkers) {
				if (!self.threeNFTMarkers[i].keepVisible) {
					self.threeNFTMarkers[i].visible = false;
				}
				self.threeNFTMarkers[i].keepVisible = false;
			}
			for (var i in self.threeBarcodeMarkers) {
				if (!self.threeBarcodeMarkers[i].keepVisible) {
					self.threeBarcodeMarkers[i].visible = false;
				}
				self.threeBarcodeMarkers[i].keepVisible = false;
			}
			for (var i in self.threeMultiMarkers) {
				if (!self.threeMultiMarkers[i].keepVisible) {
					self.threeMultiMarkers[i].visible = false;
				}
				self.threeMultiMarkers[i].keepVisible = false;
				for (var j=0; j<self.threeMultiMarkers[i].markers.length; j++) {
					if (self.threeMultiMarkers[i].markers[j]) {
						if (!self.threeMultiMarkers[i].markers[j].keepVisible) {
							self.threeMultiMarkers[i].markers[j].visible = false;
						}
						self.threeMultiMarkers[i].markers[j].keepVisible = false;
					}
				}
			}
		});

	};

	ARProxy.callbackMethods = {
		'loadNFTMarker': 1,
		'loadMarker': 1,
		'loadMultiMarker': 1
	};

	ARProxy.isCallbackMethod = function(methodName) {
		return !!ARProxy.callbackMethods[methodName];
	};

	ARProxy.getTransferables = function(methodName, arguments) {
		if (methodName === 'process' || methodName === 'detectMarkers') {
			return [arguments[0].data.buffer];
		}
		return [];
	};
	ARProxy.methods = [
		'dispose',
		'process',
		'trackPatternMarkerId',
		'trackBarcodeMarkerId',
		'trackNFTMarkerId',
		'getMultiMarkerCount',
		'getMultiMarkerPatternCount',
		'addEventListener',
		'removeEventListener',
		'dispatchEvent',
		'debugSetup',
		'loadMarker',
		'loadNFTMarker',
		'loadMultiMarker',
		'getTransMatSquare',
		'getTransMatSquareCont',
		'getTransMatMultiSquare',
		'getTransMatMultiSquareRobust',
		'transMatToGLMat',
		'detectMarker',
		'getMarkerNum',
		'getMarker',
		'getNFTMarker',
		'setMarkerInfoVertex',
		'cloneMarkerInfo',
		'getMultiEachMarker',
		'getTransformationMatrix',
		'getCameraMatrix',
		'getMarkerTransformationMatrix',
		'setDebugMode',
		'getDebugMode',
		'getProcessingImage',
		'setLogLevel',
		'getLogLevel',
		'setMarkerInfoDir',
		'setProjectionNearPlane',
		'getProjectionNearPlane',
		'setProjectionFarPlane',
		'getProjectionFarPlane',
		'setThresholdMode',
		'getThresholdMode',
		'setThreshold',
		'getThreshold',
		'setPatternDetectionMode',
		'getPatternDetectionMode',
		'setMatrixCodeType',
		'getMatrixCodeType',
		'setLabelingMode',
		'getLabelingMode',
		'setPattRatio',
		'getPattRatio',
		'setImageProcMode',
		'getImageProcMode',
		'debugDraw',
		'_initialize',
		'_initNFT',
		'_copyImageToHeap',
		'_debugMarker',
		'createThreeScene',
		'createThreeMarker',
		'createThreeNFTMarker',
		'createThreeMultiMarker',
		'createThreeBarcodeMarker',
		'setupThree'
	];
	ARProxy.callbackIndices = {"dispose":0,"process":1,"trackPatternMarkerId":2,"trackBarcodeMarkerId":2,"trackNFTMarkerId":2,"getMultiMarkerCount":0,"getMultiMarkerPatternCount":1,"addEventListener":2,"removeEventListener":2,"dispatchEvent":1,"debugSetup":0,"loadMarker":1,"loadNFTMarker":1,"loadMultiMarker":1,"getTransMatSquare":3,"getTransMatSquareCont":4,"getTransMatMultiSquare":2,"getTransMatMultiSquareRobust":2,"transMatToGLMat":3,"detectMarker":1,"getMarkerNum":0,"getMarker":1,"getNFTMarker":1,"setMarkerInfoVertex":2,"cloneMarkerInfo":1,"getMultiEachMarker":2,"getTransformationMatrix":0,"getCameraMatrix":0,"getMarkerTransformationMatrix":0,"setDebugMode":1,"getDebugMode":0,"getProcessingImage":0,"setLogLevel":1,"getLogLevel":0,"setMarkerInfoDir":2,"setProjectionNearPlane":1,"getProjectionNearPlane":0,"setProjectionFarPlane":1,"getProjectionFarPlane":0,"setThresholdMode":1,"getThresholdMode":0,"setThreshold":1,"getThreshold":0,"setPatternDetectionMode":1,"getPatternDetectionMode":0,"setMatrixCodeType":1,"getMatrixCodeType":0,"setLabelingMode":1,"getLabelingMode":0,"setPattRatio":1,"getPattRatio":0,"setImageProcMode":1,"getImageProcMode":0,"debugDraw":0,"_initialize":0,"_initNFT":0,"_copyImageToHeap":1,"_debugMarker":1,"createThreeScene":1,"createThreeMarker":2,"createThreeNFTMarker":2,"createThreeMultiMarker":1,"createThreeBarcodeMarker":2,"setupThree":0};

	for (var i = 0; i < ARProxy.methods.length; i++) {
		var methodName = ARProxy.methods[i];
		ARProxy.prototype[methodName] = (function(methodName) {
			var callbackIndex = ARProxy.callbackIndices[methodName] ;
			var onErrorIndex = callbackIndex + 1;
			return function() {
				var callback = arguments[callbackIndex];
				var onError = arguments[onErrorIndex];
				var transferables = ARProxy.getTransferables(methodName, arguments);
				this.worker.call(this.id, methodName, [].slice.call(arguments, 0, callbackIndex), transferables, callback.bind(this));
			};
		})(methodName);
	}

	ARProxy.prototype.process = function(image) {
		if (this.processingDone) {
			this.processingDone = false;
			this.ctx.drawImage(image, 0, 0, this.canvas.width, this.canvas.height);
			var self = this;
			var imageData = this.ctx.getImageData(0,0, this.canvas.width, this.canvas.height);
			this.worker.call(this.id, 'process', [imageData], [imageData.data.buffer], function(ev) {
				console.log('Processed frame');
				self.processingDone = true;
			});
		}
	};
})();
