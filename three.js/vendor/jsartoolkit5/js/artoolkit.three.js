/* THREE.js ARToolKit integration */

;(function() {
	var integrate = function() {
		/**
			Helper for setting up a Three.js AR scene using the device camera as input.
			Pass in the maximum dimensions of the video you want to process and onSuccess and onError callbacks.

			On a successful initialization, the onSuccess callback is called with an ThreeARScene object.
			The ThreeARScene object contains two THREE.js scenes (one for the video image and other for the 3D scene)
			and a couple of helper functions for doing video frame processing and AR rendering.

			Here's the structure of the ThreeARScene object:
			{
				scene: THREE.Scene, // The 3D scene. Put your AR objects here.
				camera: THREE.Camera, // The 3D scene camera.

				arController: ARController,

				video: HTMLVideoElement, // The userMedia video element.

				videoScene: THREE.Scene, // The userMedia video image scene. Shows the video feed.
				videoCamera: THREE.Camera, // Camera for the userMedia video scene.

				process: function(), // Process the current video frame and update the markers in the scene.
				renderOn: function( THREE.WebGLRenderer ) // Render the AR scene and video background on the given Three.js renderer.
			}

			You should use the arScene.video.videoWidth and arScene.video.videoHeight to set the width and height of your renderer.

			In your frame loop, use arScene.process() and arScene.renderOn(renderer) to do frame processing and 3D rendering, respectively.

			@param {number} width - The maximum width of the userMedia video to request.
			@param {number} height - The maximum height of the userMedia video to request.
			@param {function} onSuccess - Called on successful initialization with an ThreeARScene object.
			@param {function} onError - Called if the initialization fails with the error encountered.
		*/
		ARController.getUserMediaThreeScene = function(configuration) {
			var obj = {};
			for (var i in configuration) {
				obj[i] = configuration[i];
			}
			var onSuccess = configuration.onSuccess;

			obj.onSuccess = function(arController, arCameraParam) {
				var scenes = arController.createThreeScene();
				onSuccess(scenes, arController, arCameraParam);
			};

			var video = this.getUserMediaARController(obj);
			return video;
		};

		/**
			Creates a Three.js scene for use with this ARController.

			Returns a ThreeARScene object that contains two THREE.js scenes (one for the video image and other for the 3D scene)
			and a couple of helper functions for doing video frame processing and AR rendering.

			Here's the structure of the ThreeARScene object:
			{
				scene: THREE.Scene, // The 3D scene. Put your AR objects here.
				camera: THREE.Camera, // The 3D scene camera.

				arController: ARController,

				video: HTMLVideoElement, // The userMedia video element.

				videoScene: THREE.Scene, // The userMedia video image scene. Shows the video feed.
				videoCamera: THREE.Camera, // Camera for the userMedia video scene.

				process: function(), // Process the current video frame and update the markers in the scene.
				renderOn: function( THREE.WebGLRenderer ) // Render the AR scene and video background on the given Three.js renderer.
			}

			You should use the arScene.video.videoWidth and arScene.video.videoHeight to set the width and height of your renderer.

			In your frame loop, use arScene.process() and arScene.renderOn(renderer) to do frame processing and 3D rendering, respectively.

			@param video Video image to use as scene background. Defaults to this.image
		*/
		ARController.prototype.createThreeScene = function(video) {
			video = video || this.image;

			this.setupThree();

			// To display the video, first create a texture from it.
			var videoTex = new THREE.Texture(video);

			videoTex.minFilter = THREE.LinearFilter;
			videoTex.flipY = false;

			// Then create a plane textured with the video.
			var plane = new THREE.Mesh(
			  new THREE.PlaneBufferGeometry(2, 2),
			  new THREE.MeshBasicMaterial({map: videoTex, side: THREE.DoubleSide})
			);

			// The video plane shouldn't care about the z-buffer.
			plane.material.depthTest = false;
			plane.material.depthWrite = false;

			// Create a camera and a scene for the video plane and
			// add the camera and the video plane to the scene.
			var videoCamera = new THREE.OrthographicCamera(-1, 1, -1, 1, -1, 1);
			var videoScene = new THREE.Scene();
			videoScene.add(plane);
			videoScene.add(videoCamera);

			if (this.orientation === 'portrait') {
				plane.rotation.z = Math.PI/2;
			}

			var scene = new THREE.Scene();
			var camera = new THREE.Camera();
			camera.matrixAutoUpdate = false;
			setProjectionMatrix(camera.projectionMatrix, this.getCameraMatrix());

			scene.add(camera);


			var self = this;

			return {
				scene: scene,
				videoScene: videoScene,
				camera: camera,
				videoCamera: videoCamera,

				arController: this,

				video: video,

				process: function() {
					for (var i in self.threePatternMarkers) {
						self.threePatternMarkers[i].visible = false;
					}
					for (var i in self.threeNFTMarkers) {
						self.threeNFTMarkers[i].visible = false;
					}
					for (var i in self.threeBarcodeMarkers) {
						self.threeBarcodeMarkers[i].visible = false;
					}
					for (var i in self.threeMultiMarkers) {
						self.threeMultiMarkers[i].visible = false;
						for (var j=0; j<self.threeMultiMarkers[i].markers.length; j++) {
							if (self.threeMultiMarkers[i].markers[j]) {
								self.threeMultiMarkers[i].markers[j].visible = false;
							}
						}
					}
					self.process(video);
				},

				renderOn: function(renderer) {
					videoTex.needsUpdate = true;

					var ac = renderer.autoClear;
					renderer.autoClear = false;
					renderer.clear();
					renderer.render(this.videoScene, this.videoCamera);
					renderer.render(this.scene, this.camera);
					renderer.autoClear = ac;
				}
			};
		};


		/**
			Creates a Three.js marker Object3D for the given marker UID.
			The marker Object3D tracks the marker pattern when it's detected in the video.

			Use this after a successful artoolkit.loadMarker call:

			arController.loadMarker('/bin/Data/patt.hiro', function(markerUID) {
				var markerRoot = arController.createThreeMarker(markerUID);
				markerRoot.add(myFancyHiroModel);
				arScene.scene.add(markerRoot);
			});

			@param {number} markerUID The UID of the marker to track.
			@param {number} markerWidth The width of the marker, defaults to 1.
			@return {THREE.Object3D} Three.Object3D that tracks the given marker.
		*/
		ARController.prototype.createThreeMarker = function(markerUID, markerWidth) {
			this.setupThree();
			var obj = new THREE.Object3D();
			obj.markerTracker = this.trackPatternMarkerId(markerUID, markerWidth);
			obj.matrixAutoUpdate = false;
			this.threePatternMarkers[markerUID] = obj;
			return obj;
		};

		/**
			Creates a Three.js marker Object3D for the given NFT marker UID.
			The marker Object3D tracks the NFT marker when it's detected in the video.

			Use this after a successful artoolkit.loadNFTMarker call:

			arController.loadNFTMarker('DataNFT/pinball', function(markerUID) {
				var markerRoot = arController.createThreeNFTMarker(markerUID);
				markerRoot.add(myFancyModel);
				arScene.scene.add(markerRoot);
			});

			@param {number} markerUID The UID of the marker to track.
			@param {number} markerWidth The width of the marker, defaults to 1.
			@return {THREE.Object3D} Three.Object3D that tracks the given marker.
		*/
		ARController.prototype.createThreeNFTMarker = function(markerUID, markerWidth) {
			this.setupThree();
			var obj = new THREE.Object3D();
			obj.markerTracker = this.trackNFTMarkerId(markerUID, markerWidth);
			obj.matrixAutoUpdate = false;
			this.threeNFTMarkers[markerUID] = obj;
			return obj;
		};

		/**
			Creates a Three.js marker Object3D for the given multimarker UID.
			The marker Object3D tracks the multimarker when it's detected in the video.

			Use this after a successful arController.loadMarker call:

			arController.loadMultiMarker('/bin/Data/multi-barcode-4x3.dat', function(markerUID) {
				var markerRoot = arController.createThreeMultiMarker(markerUID);
				markerRoot.add(myFancyMultiMarkerModel);
				arScene.scene.add(markerRoot);
			});

			@param {number} markerUID The UID of the marker to track.
			@return {THREE.Object3D} Three.Object3D that tracks the given marker.
		*/
		ARController.prototype.createThreeMultiMarker = function(markerUID) {
			this.setupThree();
			var obj = new THREE.Object3D();
			obj.matrixAutoUpdate = false;
			obj.markers = [];
			this.threeMultiMarkers[markerUID] = obj;
			return obj;
		};

		/**
			Creates a Three.js marker Object3D for the given barcode marker UID.
			The marker Object3D tracks the marker pattern when it's detected in the video.

			var markerRoot20 = arController.createThreeBarcodeMarker(20);
			markerRoot20.add(myFancyNumber20Model);
			arScene.scene.add(markerRoot20);

			var markerRoot5 = arController.createThreeBarcodeMarker(5);
			markerRoot5.add(myFancyNumber5Model);
			arScene.scene.add(markerRoot5);

			@param {number} markerUID The UID of the barcode marker to track.
			@param {number} markerWidth The width of the marker, defaults to 1.
			@return {THREE.Object3D} Three.Object3D that tracks the given marker.
		*/
		ARController.prototype.createThreeBarcodeMarker = function(markerUID, markerWidth) {
			this.setupThree();
			var obj = new THREE.Object3D();
			obj.markerTracker = this.trackBarcodeMarkerId(markerUID, markerWidth);
			obj.matrixAutoUpdate = false;
			this.threeBarcodeMarkers[markerUID] = obj;
			return obj;
		};

		ARController.prototype.setupThree = function() {
			if (this.THREE_JS_ENABLED) {
				return;
			}
			this.THREE_JS_ENABLED = true;

			/*
				Listen to getMarker events to keep track of Three.js markers.
			*/
			this.addEventListener('getMarker', function(ev) {
				var marker = ev.data.marker;
				var obj;
				if (ev.data.type === artoolkit.PATTERN_MARKER) {
					obj = this.threePatternMarkers[marker.idPatt];

				} else if (ev.data.type === artoolkit.BARCODE_MARKER) {
					obj = this.threeBarcodeMarkers[marker.idMatrix];

				}
				if (obj) {
					setProjectionMatrix(obj.matrix, ev.data.matrixGL_RH);
					obj.visible = true;
				}
			});

			/*
				Listen to getNFTMarker events to keep track of Three.js markers.
			*/
			this.addEventListener('getNFTMarker', function(ev) {
                var marker = ev.data.marker;
				var obj;

                console.log('Found NFT marker', marker, obj);

				obj = this.threeNFTMarkers[marker.id];

				if (obj) {
					obj.matrix.fromArray(ev.data.matrixGL_RH);
					obj.visible = true;
				}
            });

            /*
				Listen to lostNFTMarker events to keep track of Three.js markers.
			*/
			this.addEventListener('lostNFTMarker', function(ev) {
                var marker = ev.data.marker;
				var obj;

                console.log('Lost NFT marker', marker, obj);

				obj = this.threeNFTMarkers[marker.id];

				if (obj) {
                    obj.matrix.fromArray(ev.data.matrixGL_RH);

                    // TODO make it maybe more stable, making the object not visible
                    // only after some ms of lost tracking?
					obj.visible = false;
				}
			});

			/*
				Listen to getMultiMarker events to keep track of Three.js multimarkers.
			*/
			this.addEventListener('getMultiMarker', function(ev) {
				var obj = this.threeMultiMarkers[ev.data.multiMarkerId];
				if (obj) {
					obj.matrix.fromArray(ev.data.matrixGL_RH);
					obj.visible = true;
				}
			});

			/*
				Listen to getMultiMarkerSub events to keep track of Three.js multimarker submarkers.
			*/
			this.addEventListener('getMultiMarkerSub', function(ev) {
				var marker = ev.data.multiMarkerId;
				var subMarkerID = ev.data.markerIndex;
				var subMarker = ev.data.marker;
				var obj = this.threeMultiMarkers[marker];
				if (obj && obj.markers && obj.markers[subMarkerID]) {
					var sub = obj.markers[subMarkerID];
					sub.matrix.fromArray(ev.data.matrixGL_RH);
					sub.visible = (subMarker.visible >= 0);
				}
			});

			/**
				Index of Three.js pattern markers, maps markerID -> THREE.Object3D.
			*/
			this.threePatternMarkers = {};

			/**
				Index of Three.js NFT markers, maps markerID -> THREE.Object3D.
			*/
			this.threeNFTMarkers = {};

			/**
				Index of Three.js barcode markers, maps markerID -> THREE.Object3D.
			*/
			this.threeBarcodeMarkers = {};

			/**
				Index of Three.js multimarkers, maps markerID -> THREE.Object3D.
			*/
			this.threeMultiMarkers = {};
		};

	};
	/**
	 * Helper Method for Three.js compatibility
	 */
	var setProjectionMatrix = function(projectionMatrix, value) {
		if (typeof projectionMatrix.elements.set === "function") {
			projectionMatrix.elements.set(value);
		} else {
			projectionMatrix.elements = [].slice.call(value);
		}
	};

	var tick = function() {
		if (window.ARController && window.THREE) {
			integrate();
			if (window.ARThreeOnLoad) {
				window.ARThreeOnLoad();
			}
		} else {
			setTimeout(tick, 50);
		}
	};

	tick();

})();
