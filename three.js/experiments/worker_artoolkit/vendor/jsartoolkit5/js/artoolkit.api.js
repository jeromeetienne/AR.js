(function() {
	'use strict'

	/**
		The ARController is the main object for doing AR marker detection with JSARToolKit.

		To use an ARController, you need to tell it the dimensions to use for the AR processing canvas and
		pass it an ARCameraParam to define the camera parameters to use when processing images. 
		The ARCameraParam defines the lens distortion and aspect ratio of the camera used. 
		See https://www.artoolworks.com/support/library/Calibrating_your_camera for more information about AR camera parameteters and how to make and use them.

		If you pass an image as the first argument, the ARController uses that as the image to process,
		using the dimensions of the image as AR processing canvas width and height. If the first argument
		to ARController is an image, the second argument is used as the camera param.

		The camera parameters argument can be either an ARCameraParam or an URL to a camera definition file.
		If the camera argument is an URL, it is loaded into a new ARCameraParam, and the ARController dispatches
		a 'load' event and calls the onload method if it is defined.

	 	@exports ARController
	 	@constructor

		@param {number} width The width of the images to process.
		@param {number} height The height of the images to process.
		@param {ARCameraParam | string} camera The ARCameraParam to use for image processing. If this is a string, the ARController treats it as an URL and tries to load it as a ARCameraParam definition file, calling ARController#onload on success. 
	*/
	var ARController = function(width, height, camera) {
		var id;
		var w = width, h = height;

		this.orientation = 'landscape';

		this.listeners = {};

		if (typeof width !== 'number') {
			var image = width;
			camera = height;
			w = image.videoWidth || image.width;
			h = image.videoHeight || image.height;
			this.image = image;
		}

		this.width = w;
		this.height = h;

		this.nftMarkerCount = 0;

		this.defaultMarkerWidth = 1;
		this.patternMarkers = {};
		this.barcodeMarkers = {};
		this.nftMarkers = {};
		this.transform_mat = new Float32Array(16);

		if (typeof document !== 'undefined') {
			this.canvas = document.createElement('canvas');
			this.canvas.width = w;
			this.canvas.height = h;
			this.ctx = this.canvas.getContext('2d');
		}

		this.videoWidth = w;
		this.videoHeight = h;

		if (typeof camera === 'string') {

			var self = this;
			this.cameraParam = new ARCameraParam(camera, function() {
				self._initialize();
			}, function(err) {
				console.error("ARController: Failed to load ARCameraParam", err);
			});

		} else {

			this.cameraParam = camera;
			this._initialize();

		}
	};

	/**
		Destroys the ARController instance and frees all associated resources.
		After calling dispose, the ARController can't be used any longer. Make a new one if you need one.

		Calling this avoids leaking Emscripten memory, which may be important if you're using multiple ARControllers.
	*/
	ARController.prototype.dispose = function() {
		artoolkit.teardown(this.id);

		for (var t in this) {
			this[t] = null;
		}
	};

	/**
		Detects markers in the given image. The process method dispatches marker detection events during its run.

		The marker detection process proceeds by first dispatching a markerNum event that tells you how many
		markers were found in the image. Next, a getMarker event is dispatched for each found marker square.
		Finally, getMultiMarker is dispatched for every found multimarker, followed by getMultiMarkerSub events
		dispatched for each of the markers in the multimarker.
			
			arController.addEventListener('markerNum', function(ev) {
				console.log("Detected " + ev.data + " markers.")
			});
			arController.addEventListener('getMarker', function(ev) {
				console.log("Detected marker with ids:", ev.data.marker.id, ev.data.marker.idPatt, ev.data.marker.idMatrix);
				console.log("Marker data", ev.data.marker);
				console.log("Marker transform matrix:", [].join.call(ev.data.matrix, ', '));
			});
			arController.addEventListener('getMultiMarker', function(ev) {
				console.log("Detected multimarker with id:", ev.data.multiMarkerId);
			});
			arController.addEventListener('getMultiMarkerSub', function(ev) {
				console.log("Submarker for " + ev.data.multiMarkerId, ev.data.markerIndex, ev.data.marker);
			});
			
			arController.process(image);	


		If no image is given, defaults to this.image.

		If the debugSetup has been called, draws debug markers on the debug canvas.

		@param {ImageElement | VideoElement} image The image to process [optional]. 
	*/
	ARController.prototype.process = function(image) {
		this.detectMarker(image);
		
		var markerNum = this.getMarkerNum();
		var k,o;
		for (k in this.patternMarkers) {
			o = this.patternMarkers[k]
			o.inPrevious = o.inCurrent;
			o.inCurrent = false;
		}
		for (k in this.barcodeMarkers) {
			o = this.barcodeMarkers[k]
			o.inPrevious = o.inCurrent;
			o.inCurrent = false;
		}
		for (k in this.nftMarkers) {
			o = this.nftMarkers[k]
			o.inPrevious = o.inCurrent;
			o.inCurrent = false;
		}

		this.dispatchEvent({
			name: 'markerNum',
			target: this,
			data: markerNum
		});

		for (var i=0; i<markerNum; i++) {
			var markerInfo = this.getMarker(i);

			var markerType = artoolkit.UNKNOWN_MARKER;
			var visible = this.trackPatternMarkerId(-1);

			if (markerInfo.idPatt > -1 && (markerInfo.id === markerInfo.idPatt || markerInfo.idMatrix === -1)) {
				visible = this.trackPatternMarkerId(markerInfo.idPatt);
				markerType = artoolkit.PATTERN_MARKER;

				if (markerInfo.dir !== markerInfo.dirPatt) {
					this.setMarkerInfoDir(i, markerInfo.dirPatt);
				}

			} else if (markerInfo.idMatrix > -1) {
				visible = this.trackBarcodeMarkerId(markerInfo.idMatrix);
				markerType = artoolkit.BARCODE_MARKER;

				if (markerInfo.dir !== markerInfo.dirMatrix) {
					this.setMarkerInfoDir(i, markerInfo.dirMatrix);
				}
			}

			if (markerType !== artoolkit.UNKNOWN_MARKER && visible.inPrevious) {
				this.getTransMatSquareCont(i, visible.markerWidth, visible.matrix, visible.matrix);
			} else {
				this.getTransMatSquare(i, visible.markerWidth, visible.matrix);
			}

			visible.inCurrent = true;
			this.transMatToGLMat(visible.matrix, this.transform_mat);
			this.dispatchEvent({
				name: 'getMarker',
				target: this,
				data: {
					index: i,
					type: markerType,
					marker: markerInfo,
					matrix: this.transform_mat
				}
			});
		}

		var nftMarkerCount = this.nftMarkerCount;
		if( nftMarkerCount ) artoolkit.detectNFTMarker(this.id);
		for (var i=0; i < nftMarkerCount; i++) {
			var markerInfo = this.getNFTMarker(i);
		
			if (markerInfo.found) {
				var visible = this.trackNFTMarkerId(i);
				visible.matrix.set(markerInfo.pose);
				visible.inCurrent = true;
				this.transMatToGLMat(visible.matrix, this.transform_mat);
				this.dispatchEvent({
					name: 'getNFTMarker',
					target: this,
					data: {
						index: i,
						marker: markerInfo,
						matrix: this.transform_mat
					}
				});
			}
		}

		var multiMarkerCount = this.getMultiMarkerCount();
		for (var i=0; i<multiMarkerCount; i++) {
			var subMarkerCount = this.getMultiMarkerPatternCount(i);
			var visible = false;

			artoolkit.getTransMatMultiSquareRobust(this.id, i);
			this.transMatToGLMat(this.marker_transform_mat, this.transform_mat);

			for (var j=0; j<subMarkerCount; j++) {
				var multiEachMarkerInfo = this.getMultiEachMarker(i, j);
				if (multiEachMarkerInfo.visible >= 0) {
					visible = true;
					this.dispatchEvent({
						name: 'getMultiMarker',
						target: this,
						data: {
							multiMarkerId: i,
							matrix: this.transform_mat
						}
					});
					break;
				}
			}
			if (visible) {
				for (var j=0; j<subMarkerCount; j++) {
					var multiEachMarkerInfo = this.getMultiEachMarker(i, j);
					this.transMatToGLMat(this.marker_transform_mat, this.transform_mat);
					this.dispatchEvent({
						name: 'getMultiMarkerSub',
						target: this,
						data: {
							multiMarkerId: i,
							markerIndex: j,
							marker: multiEachMarkerInfo,
							matrix: this.transform_mat
						}
					});
				}
			}
		}
		if (this._bwpointer) {
			this.debugDraw();
		}
	};

	/**
		Adds the given pattern marker ID to the index of tracked IDs.
		Sets the markerWidth for the pattern marker to markerWidth.

		Used by process() to implement continuous tracking, 
		keeping track of the marker's transformation matrix
		and customizable marker widths.

		@param {number} id ID of the pattern marker to track.
		@param {number} markerWidth The width of the marker to track.
		@return {Object} The marker tracking object.
	*/
	ARController.prototype.trackPatternMarkerId = function(id, markerWidth) {
		var obj = this.patternMarkers[id];
		if (!obj) {
			this.patternMarkers[id] = obj = {
				inPrevious: false,
				inCurrent: false,
				matrix: new Float32Array(12),
				markerWidth: markerWidth || this.defaultMarkerWidth
			};
		}
		if (markerWidth) {
			obj.markerWidth = markerWidth;
		}
		return obj;
	};

	/**
		Adds the given barcode marker ID to the index of tracked IDs.
		Sets the markerWidth for the pattern marker to markerWidth.

		Used by process() to implement continuous tracking, 
		keeping track of the marker's transformation matrix
		and customizable marker widths.

		@param {number} id ID of the barcode marker to track.
		@param {number} markerWidth The width of the marker to track.
		@return {Object} The marker tracking object.
	*/
	ARController.prototype.trackBarcodeMarkerId = function(id, markerWidth) {
		var obj = this.barcodeMarkers[id];
		if (!obj) {
			this.barcodeMarkers[id] = obj = {
				inPrevious: false,
				inCurrent: false,
				matrix: new Float32Array(12),
				markerWidth: markerWidth || this.defaultMarkerWidth
			};
		}
		if (markerWidth) {
			obj.markerWidth = markerWidth;
		}
		return obj;
	};

	/**
		Adds the given NFT marker ID to the index of tracked IDs.
		Sets the markerWidth for the pattern marker to markerWidth.

		Used by process() to implement continuous tracking, 
		keeping track of the marker's transformation matrix
		and customizable marker widths.

		@param {number} id ID of the NFT marker to track.
		@param {number} markerWidth The width of the marker to track.
		@return {Object} The marker tracking object.
	*/
	ARController.prototype.trackNFTMarkerId = function(id, markerWidth) {
		var obj = this.nftMarkers[id];
		if (!obj) {
			this.nftMarkers[id] = obj = {
				inPrevious: false,
				inCurrent: false,
				matrix: new Float32Array(12),
				markerWidth: markerWidth || this.defaultMarkerWidth
			};
		}
		if (markerWidth) {
			obj.markerWidth = markerWidth;
		}
		return obj;
	};

	/**
		Returns the number of multimarkers registered on this ARController.

		@return {number} Number of multimarkers registered.
	*/
	ARController.prototype.getMultiMarkerCount = function() {
		return artoolkit.getMultiMarkerCount(this.id);
	};

	/**
		Returns the number of markers in the multimarker registered for the given multiMarkerId.

		@param {number} multiMarkerId The id number of the multimarker to access. Given by loadMultiMarker.
		@return {number} Number of markers in the multimarker. Negative value indicates failure to find the multimarker.
	*/
	ARController.prototype.getMultiMarkerPatternCount = function(multiMarkerId) {
		return artoolkit.getMultiMarkerNum(this.id, multiMarkerId);
	};

	/**
		Add an event listener on this ARController for the named event, calling the callback function
		whenever that event is dispatched.

		Possible events are: 
		  * getMarker - dispatched whenever process() finds a square marker
		  * getMultiMarker - dispatched whenever process() finds a visible registered multimarker
		  * getMultiMarkerSub - dispatched by process() for each marker in a visible multimarker
		  * load - dispatched when the ARController is ready to use (useful if passing in a camera URL in the constructor)

		@param {string} name Name of the event to listen to.
		@param {function} callback Callback function to call when an event with the given name is dispatched.
	*/
	ARController.prototype.addEventListener = function(name, callback) {
       if (!this.listeners[name]) {
			this.listeners[name] = [];
		}
		this.listeners[name].push(callback);
	};

	/**
		Remove an event listener from the named event.

		@param {string} name Name of the event to stop listening to.
		@param {function} callback Callback function to remove from the listeners of the named event.
	*/
	ARController.prototype.removeEventListener = function(name, callback) {
		if (this.listeners[name]) {
			var index = this.listeners[name].indexOf(callback);
			if (index > -1) {
				this.listeners[name].splice(index, 1);
			}
		}
	};

	/**
		Dispatches the given event to all registered listeners on event.name.

		@param {Object} event Event to dispatch.
	*/
	ARController.prototype.dispatchEvent = function(event) {
		var listeners = this.listeners[event.name];
		if (listeners) {
			for (var i=0; i<listeners.length; i++) {
				listeners[i].call(this, event);
			}
		}
	};

	/**
		Sets up a debug canvas for the AR detection. Draws a red marker on top of each detected square in the image.

		The debug canvas is added to document.body.
	*/
	ARController.prototype.debugSetup = function() {
		document.body.appendChild(this.canvas)
		this.setDebugMode(1);
		this._bwpointer = this.getProcessingImage();
	};

	/**
		Loads a pattern marker from the given URL and calls the onSuccess callback with the UID of the marker.

		arController.loadMarker(markerURL, onSuccess, onError);

		@param {string} markerURL - The URL of the marker pattern file to load.
		@param {function} onSuccess - The success callback. Called with the id of the loaded marker on a successful load.
		@param {function} onError - The error callback. Called with the encountered error if the load fails.
	*/
	ARController.prototype.loadMarker = function(markerURL, onSuccess, onError) {
		return artoolkit.addMarker(this.id, markerURL, onSuccess, onError);
	};

	/**
		Loads an NFT marker from the given URL prefix and calls the onSuccess callback with the UID of the marker.

		arController.loadNFTMarker(markerURL, onSuccess, onError);

		@param {string} markerURL - The URL prefix of the NFT markers to load.
		@param {function} onSuccess - The success callback. Called with the id of the loaded marker on a successful load.
		@param {function} onError - The error callback. Called with the encountered error if the load fails.
	*/
	ARController.prototype.loadNFTMarker = function(markerURL, onSuccess, onError) {
		var self = this;
		return artoolkit.addNFTMarker(this.id, markerURL, function(id) {
			self.nftMarkerCount = id + 1;
			onSuccess(id);
		}, onError);
	};

	/**
		Loads a multimarker from the given URL and calls the onSuccess callback with the UID of the marker.

		arController.loadMultiMarker(markerURL, onSuccess, onError);

		@param {string} markerURL - The URL of the multimarker pattern file to load.
		@param {function} onSuccess - The success callback. Called with the id and the number of sub-markers of the loaded marker on a successful load.
		@param {function} onError - The error callback. Called with the encountered error if the load fails.
	*/
	ARController.prototype.loadMultiMarker = function(markerURL, onSuccess, onError) {
		return artoolkit.addMultiMarker(this.id, markerURL, onSuccess, onError);
	};

	/**
	 * Populates the provided float array with the current transformation for the specified marker. After 
	 * a call to detectMarker, all marker information will be current. Marker transformations can then be 
	 * checked.
	 * @param {number} markerUID	The unique identifier (UID) of the marker to query
	 * @param {number} markerWidth	The width of the marker
	 * @param {Float64Array} dst	The float array to populate with the 3x4 marker transformation matrix
	 * @return	{Float64Array} The dst array.
	 */
	ARController.prototype.getTransMatSquare = function(markerIndex, markerWidth, dst) {
		artoolkit.getTransMatSquare(this.id, markerIndex, markerWidth);
		dst.set(this.marker_transform_mat);
		return dst;
	};

	/**
	 * Populates the provided float array with the current transformation for the specified marker, using 
	 * previousMarkerTransform as the previously detected transformation. After 
	 * a call to detectMarker, all marker information will be current. Marker transformations can then be 
	 * checked.
	 * @param {number} markerUID	The unique identifier (UID) of the marker to query
	 * @param {number} markerWidth	The width of the marker
	 * @param {Float64Array} previousMarkerTransform	The float array to use as the previous 3x4 marker transformation matrix
	 * @param {Float64Array} dst	The float array to populate with the 3x4 marker transformation matrix
	 * @return	{Float64Array} The dst array.
	 */
	ARController.prototype.getTransMatSquareCont = function(markerIndex, markerWidth, previousMarkerTransform, dst) {
		this.marker_transform_mat.set(previousMarkerTransform)
		artoolkit.getTransMatSquareCont(this.id, markerIndex, markerWidth);
		dst.set(this.marker_transform_mat);
		return dst;
	};

	/**
	 * Populates the provided float array with the current transformation for the specified multimarker. After 
	 * a call to detectMarker, all marker information will be current. Marker transformations can then be 
	 * checked.
	 *
	 * @param {number} markerUID	The unique identifier (UID) of the marker to query
	 * @param {number} markerWidth	The width of the marker
	 * @param {Float64Array} dst	The float array to populate with the 3x4 marker transformation matrix
	 * @return	{Float64Array} The dst array.
	 */
	ARController.prototype.getTransMatMultiSquare = function(multiMarkerId, dst) {
		artoolkit.getTransMatMultiSquare(this.id, multiMarkerId);
		dst.set(this.marker_transform_mat);
		return dst;
	};

	/**
	 * Populates the provided float array with the current robust transformation for the specified multimarker. After 
	 * a call to detectMarker, all marker information will be current. Marker transformations can then be 
	 * checked.
	 * @param {number} markerUID	The unique identifier (UID) of the marker to query
	 * @param {number} markerWidth	The width of the marker
	 * @param {Float64Array} dst	The float array to populate with the 3x4 marker transformation matrix
	 * @return	{Float64Array} The dst array.
	 */
	ARController.prototype.getTransMatMultiSquareRobust = function(multiMarkerId, dst) {
		artoolkit.getTransMatMultiSquare(this.id, multiMarkerId);
		dst.set(this.marker_transform_mat);
		return dst;
	};

	/**
		Converts the given 3x4 marker transformation matrix in the 12-element transMat array
		into a 4x4 WebGL matrix and writes the result into the 16-element glMat array.

		If scale parameter is given, scales the transform of the glMat by the scale parameter.

		@param {Float64Array} transMat The 3x4 marker transformation matrix.
		@param {Float64Array} glMat The 4x4 GL transformation matrix.
		@param {number} scale The scale for the transform.
	*/ 
	ARController.prototype.transMatToGLMat = function(transMat, glMat, scale) {
		glMat[0 + 0*4] = transMat[0]; // R1C1
		glMat[0 + 1*4] = transMat[1]; // R1C2
		glMat[0 + 2*4] = transMat[2];
		glMat[0 + 3*4] = transMat[3];
		glMat[1 + 0*4] = transMat[4]; // R2
		glMat[1 + 1*4] = transMat[5];
		glMat[1 + 2*4] = transMat[6];
		glMat[1 + 3*4] = transMat[7];
		glMat[2 + 0*4] = transMat[8]; // R3
		glMat[2 + 1*4] = transMat[9];
		glMat[2 + 2*4] = transMat[10];
		glMat[2 + 3*4] = transMat[11];
		glMat[3 + 0*4] = 0.0;
		glMat[3 + 1*4] = 0.0;
		glMat[3 + 2*4] = 0.0;
		glMat[3 + 3*4] = 1.0;
		if (scale != undefined && scale !== 0.0) {
			glMat[12] *= scale;
			glMat[13] *= scale;
			glMat[14] *= scale;
		}
		return glMat;
	};

	/**
		This is the core ARToolKit marker detection function. It calls through to a set of
		internal functions to perform the key marker detection steps of binarization and
		labelling, contour extraction, and template matching and/or matrix code extraction.
        
        Typically, the resulting set of detected markers is retrieved by calling arGetMarkerNum
        to get the number of markers detected and arGetMarker to get an array of ARMarkerInfo
        structures with information on each detected marker, followed by a step in which
        detected markers are possibly examined for some measure of goodness of match (e.g. by
        examining the match confidence value) and pose extraction.

		@param {image} Image to be processed to detect markers.
		@return {number}     0 if the function proceeded without error, or a value less than 0 in case of error.
			A result of 0 does not however, imply any markers were detected.
	*/
	ARController.prototype.detectMarker = function(image) {
		if (this._copyImageToHeap(image)) {
			return artoolkit.detectMarker(this.id);
		}
		return -99;
	};

	/**
		Get the number of markers detected in a video frame.
  
	    @return {number}     The number of detected markers in the most recent image passed to arDetectMarker.
    	    Note that this is actually a count, not an index. A better name for this function would be
        	arGetDetectedMarkerCount, but the current name lives on for historical reasons.
    */
	ARController.prototype.getMarkerNum = function() {
		return artoolkit.getMarkerNum(this.id);
	};

	/**
		Get the marker info struct for the given marker index in detected markers.

		Call this.detectMarker first, then use this.getMarkerNum to get the detected marker count.

		The returned object is the global artoolkit.markerInfo object and will be overwritten
		by subsequent calls. If you need to hang on to it, create a copy using this.cloneMarkerInfo();

		Returns undefined if no marker was found.

		A markerIndex of -1 is used to access the global custom marker.

		The fields of the markerInfo struct are:
		    @field      area Area in pixels of the largest connected region, comprising the marker border and regions connected to it. Note that this is
		        not the same as the actual onscreen area inside the marker border.
			@field      id If pattern detection mode is either pattern mode OR matrix but not both, will be marker ID (>= 0) if marker is valid, or -1 if invalid.
			@field      idPatt If pattern detection mode includes a pattern mode, will be marker ID (>= 0) if marker is valid, or -1 if invalid.
		    @field      idMatrix If pattern detection mode includes a matrix mode, will be marker ID (>= 0) if marker is valid, or -1 if invalid.
			@field      dir If pattern detection mode is either pattern mode OR matrix but not both, and id != -1, will be marker direction (range 0 to 3, inclusive).
			@field      dirPatt If pattern detection mode includes a pattern mode, and id != -1, will be marker direction (range 0 to 3, inclusive).
			@field      dirMatrix If pattern detection mode includes a matrix mode, and id != -1, will be marker direction (range 0 to 3, inclusive).
			@field      cf If pattern detection mode is either pattern mode OR matrix but not both, will be marker matching confidence (range 0.0 to 1.0 inclusive) if marker is valid, or -1.0 if marker is invalid.
			@field      cfPatt If pattern detection mode includes a pattern mode, will be marker matching confidence (range 0.0 to 1.0 inclusive) if marker is valid, or -1.0 if marker is invalid.
			@field      cfMatrix If pattern detection mode includes a matrix mode, will be marker matching confidence (range 0.0 to 1.0 inclusive) if marker is valid, or -1.0 if marker is invalid.
			@field      pos 2D position (in camera image coordinates, origin at top-left) of the centre of the marker.
			@field      line Line equations for the 4 sides of the marker.
			@field      vertex 2D positions (in camera image coordinates, origin at top-left) of the corners of the marker. vertex[(4 - dir)%4][] is the top-left corner of the marker. Other vertices proceed clockwise from this. These are idealised coordinates (i.e. the onscreen position aligns correctly with the undistorted camera image.)


		@param {number} markerIndex The index of the marker to query.
		@returns {Object} The markerInfo struct.
	*/
	ARController.prototype.getMarker = function(markerIndex) {
		if (0 === artoolkit.getMarker(this.id, markerIndex)) {
			return artoolkit.markerInfo;
		}
	};

	ARController.prototype.getNFTMarker = function(markerIndex) {
		if (0 === artoolkit.getNFTMarker(this.id, markerIndex)) {
			return artoolkit.NFTMarkerInfo;
		}
	};

	/**
		Set marker vertices to the given vertexData[4][2] array.

		Sets the marker pos to the center of the vertices.

		Useful for building custom markers for getTransMatSquare.

		A markerIndex of -1 is used to access the global custom marker.

		@param {number} markerIndex The index of the marker to edit.
	*/
	ARController.prototype.setMarkerInfoVertex = function(markerIndex, vertexData) {
		for (var i=0; i<vertexData.length; i++) {
			this.marker_transform_mat[i*2+0] = vertexData[i][0];
			this.marker_transform_mat[i*2+1] = vertexData[i][1];
		}
		return artoolkit.setMarkerInfoVertex(this.id, markerIndex);
	};

	/**
		Makes a deep copy of the given marker info.

		@param {Object} markerInfo The marker info object to copy.
		@return {Object} The new copy of the marker info.
	*/
	ARController.prototype.cloneMarkerInfo = function(markerInfo) {
		return JSON.parse(JSON.stringify(markerInfo));
	};

	/**
		Get the marker info struct for the given marker index in detected markers.

		Call this.detectMarker first, then use this.getMarkerNum to get the detected marker count.

		The returned object is the global artoolkit.markerInfo object and will be overwritten
		by subsequent calls. If you need to hang on to it, create a copy using this.cloneMarkerInfo();

		Returns undefined if no marker was found.

		@field {number} pattId The index of the marker.
		@field {number} pattType The type of the marker. Either AR_MULTI_PATTERN_TYPE_TEMPLATE or AR_MULTI_PATTERN_TYPE_MATRIX.
		@field {number} visible 0 or larger if the marker is visible
		@field {number} width The width of the marker.

		@param {number} multiMarkerId The multimarker to query.
		@param {number} markerIndex The index of the marker to query.
		@returns {Object} The markerInfo struct.
	*/
	ARController.prototype.getMultiEachMarker = function(multiMarkerId, markerIndex) {
		if (0 === artoolkit.getMultiEachMarker(this.id, multiMarkerId, markerIndex)) {
			return artoolkit.multiEachMarkerInfo;
		}
	};


	/**
		Returns the 16-element WebGL transformation matrix used by ARController.process to 
		pass marker WebGL matrices to event listeners.

		Unique to each ARController.

		@return {Float64Array} The 16-element WebGL transformation matrix used by the ARController.
	*/
	ARController.prototype.getTransformationMatrix = function() {
		return this.transform_mat;
	};

	/**
	 * Returns the projection matrix computed from camera parameters for the ARController.
	 *
	 * @return {Float64Array} The 16-element WebGL camera matrix for the ARController camera parameters.
	 */
	ARController.prototype.getCameraMatrix = function() {
		return this.camera_mat;
	};

	/**
		Returns the shared ARToolKit 3x4 marker transformation matrix, used for passing and receiving
		marker transforms to/from the Emscripten side.

		@return {Float64Array} The 12-element 3x4 row-major marker transformation matrix used by ARToolKit.
	*/
	ARController.prototype.getMarkerTransformationMatrix = function() {
		return this.marker_transform_mat;
	};


	/* Setter / Getter Proxies */

	/**
	 * Enables or disables debug mode in the tracker. When enabled, a black and white debug
	 * image is generated during marker detection. The debug image is useful for visualising
	 * the binarization process and choosing a threshold value.
	 * @param {number} debug		true to enable debug mode, false to disable debug mode
	 * @see				getDebugMode()
	 */
	ARController.prototype.setDebugMode = function(mode) {
		return artoolkit.setDebugMode(this.id, mode);
	};

	/**
	 * Returns whether debug mode is currently enabled.
	 * @return			true when debug mode is enabled, false when debug mode is disabled
	 * @see				setDebugMode()
	 */
	ARController.prototype.getDebugMode = function() {
		return artoolkit.getDebugMode(this.id);
	};

	/**
		Returns the Emscripten HEAP offset to the debug processing image used by ARToolKit.

		@return {number} HEAP offset to the debug processing image.
	*/
	ARController.prototype.getProcessingImage = function() {
		return artoolkit.getProcessingImage(this.id);
	}

	/**
		Sets the logging level to use by ARToolKit.

		@param 
	*/
	ARController.prototype.setLogLevel = function(mode) {
		return artoolkit.setLogLevel(mode);
	};

	ARController.prototype.getLogLevel = function() {
		return artoolkit.getLogLevel();
	};

	ARController.prototype.setMarkerInfoDir = function(markerIndex, dir) {
		return artoolkit.setMarkerInfoDir(this.id, markerIndex, dir);
	};

	ARController.prototype.setProjectionNearPlane = function(value) {
		return artoolkit.setProjectionNearPlane(this.id, value);
	};

	ARController.prototype.getProjectionNearPlane = function() {
		return artoolkit.getProjectionNearPlane(this.id);
	};

	ARController.prototype.setProjectionFarPlane = function(value) {
		return artoolkit.setProjectionFarPlane(this.id, value);
	};

	ARController.prototype.getProjectionFarPlane = function() {
		return artoolkit.getProjectionFarPlane(this.id);
	};


	/**
	    Set the labeling threshold mode (auto/manual).

	    @param {number}		mode An integer specifying the mode. One of:
	        AR_LABELING_THRESH_MODE_MANUAL,
	        AR_LABELING_THRESH_MODE_AUTO_MEDIAN,
	        AR_LABELING_THRESH_MODE_AUTO_OTSU,
	        AR_LABELING_THRESH_MODE_AUTO_ADAPTIVE,
	        AR_LABELING_THRESH_MODE_AUTO_BRACKETING
	 */
 	ARController.prototype.setThresholdMode = function(mode) {
		return artoolkit.setThresholdMode(this.id, mode);
	};

	/**
	 * Gets the current threshold mode used for image binarization.
	 * @return	{number}		The current threshold mode
	 * @see				getVideoThresholdMode()
	 */
	ARController.prototype.getThresholdMode = function() {
		return artoolkit.getThresholdMode(this.id);
	};

	/**
    	Set the labeling threshhold.

        This function forces sets the threshold value.
        The default value is AR_DEFAULT_LABELING_THRESH which is 100.
        
        The current threshold mode is not affected by this call.
        Typically, this function is used when labeling threshold mode
        is AR_LABELING_THRESH_MODE_MANUAL.
 
        The threshold value is not relevant if threshold mode is
        AR_LABELING_THRESH_MODE_AUTO_ADAPTIVE.
 
        Background: The labeling threshold is the value which
		the AR library uses to differentiate between black and white
		portions of an ARToolKit marker. Since the actual brightness,
		contrast, and gamma of incoming images can vary signficantly
		between different cameras and lighting conditions, this
		value typically needs to be adjusted dynamically to a
		suitable midpoint between the observed values for black
		and white portions of the markers in the image.

		@param {number}     thresh An integer in the range [0,255] (inclusive).
	*/
	ARController.prototype.setThreshold = function(threshold) {
		return artoolkit.setThreshold(this.id, threshold);
	};

	/**
	    Get the current labeling threshold.

		This function queries the current labeling threshold. For,
		AR_LABELING_THRESH_MODE_AUTO_MEDIAN, AR_LABELING_THRESH_MODE_AUTO_OTSU,
		and AR_LABELING_THRESH_MODE_AUTO_BRACKETING
		the threshold value is only valid until the next auto-update.

		The current threshold mode is not affected by this call.

		The threshold value is not relevant if threshold mode is
		AR_LABELING_THRESH_MODE_AUTO_ADAPTIVE.

	    @return {number} The current threshold value.
	*/
	ARController.prototype.getThreshold = function() {
		return artoolkit.getThreshold(this.id);
	};


	/**
		Set the pattern detection mode

		The pattern detection determines the method by which ARToolKit
		matches detected squares in the video image to marker templates
		and/or IDs. ARToolKit v4.x can match against pictorial "template" markers,
		whose pattern files are created with the mk_patt utility, in either colour
		or mono, and additionally can match against 2D-barcode-type "matrix"
		markers, which have an embedded marker ID. Two different two-pass modes
		are also available, in which a matrix-detection pass is made first,
		followed by a template-matching pass.

		@param {number} mode
			Options for this field are:
			AR_TEMPLATE_MATCHING_COLOR
			AR_TEMPLATE_MATCHING_MONO
			AR_MATRIX_CODE_DETECTION
			AR_TEMPLATE_MATCHING_COLOR_AND_MATRIX
			AR_TEMPLATE_MATCHING_MONO_AND_MATRIX
			The default mode is AR_TEMPLATE_MATCHING_COLOR.
	*/
	ARController.prototype.setPatternDetectionMode = function(value) {
		return artoolkit.setPatternDetectionMode(this.id, value);
	};

	/**
		Returns the current pattern detection mode.

		@return {number} The current pattern detection mode.
	*/
	ARController.prototype.getPatternDetectionMode = function() {
		return artoolkit.getPatternDetectionMode(this.id);
	};

	/**
		Set the size and ECC algorithm to be used for matrix code (2D barcode) marker detection.

		When matrix-code (2D barcode) marker detection is enabled (see arSetPatternDetectionMode)
		then the size of the barcode pattern and the type of error checking and correction (ECC)
		with which the markers were produced can be set via this function.

		This setting is global to a given ARHandle; It is not possible to have two different matrix
		code types in use at once.

	    @param      type The type of matrix code (2D barcode) in use. Options include:
	        AR_MATRIX_CODE_3x3
	        AR_MATRIX_CODE_3x3_HAMMING63
	        AR_MATRIX_CODE_3x3_PARITY65
	        AR_MATRIX_CODE_4x4
	        AR_MATRIX_CODE_4x4_BCH_13_9_3
	        AR_MATRIX_CODE_4x4_BCH_13_5_5
	        The default mode is AR_MATRIX_CODE_3x3.
	*/
	ARController.prototype.setMatrixCodeType = function(value) {
		return artoolkit.setMatrixCodeType(this.id, value);
	};

	/**
		Returns the current matrix code (2D barcode) marker detection type.

		@return {number} The current matrix code type.
	*/
	ARController.prototype.getMatrixCodeType = function() {
		return artoolkit.getMatrixCodeType(this.id);
	};

	/**
		Select between detection of black markers and white markers.
	
		ARToolKit's labelling algorithm can work with both black-bordered
		markers on a white background (AR_LABELING_BLACK_REGION) or
		white-bordered markers on a black background (AR_LABELING_WHITE_REGION).
		This function allows you to specify the type of markers to look for.
		Note that this does not affect the pattern-detection algorith
		which works on the interior of the marker.

		@param {number}      mode
			Options for this field are:
			AR_LABELING_WHITE_REGION
			AR_LABELING_BLACK_REGION
			The default mode is AR_LABELING_BLACK_REGION.
	*/
	ARController.prototype.setLabelingMode = function(value) {
		return artoolkit.setLabelingMode(this.id, value);
	};

	/**
		Enquire whether detection is looking for black markers or white markers.
	    
	    See discussion for setLabelingMode.

	    @result {number} The current labeling mode.
	*/
	ARController.prototype.getLabelingMode = function() {
		return artoolkit.getLabelingMode(this.id);
	};

	/**
		Set the width/height of the marker pattern space, as a proportion of marker width/height.

	    @param {number}		pattRatio The the width/height of the marker pattern space, as a proportion of marker
	        width/height. To set the default, pass AR_PATT_RATIO.
	        If compatibility with ARToolKit verions 1.0 through 4.4 is required, this value
	        must be 0.5.
	 */
 	ARController.prototype.setPattRatio = function(value) {
		return artoolkit.setPattRatio(this.id, value);
	};

	/**
		Returns the current ratio of the marker pattern to the total marker size.

		@return {number} The current pattern ratio.
	*/
	ARController.prototype.getPattRatio = function() {
		return artoolkit.getPattRatio(this.id);
	};

	/**
	    Set the image processing mode.

        When the image processing mode is AR_IMAGE_PROC_FRAME_IMAGE,
        ARToolKit processes all pixels in each incoming image
        to locate markers. When the mode is AR_IMAGE_PROC_FIELD_IMAGE,
        ARToolKit processes pixels in only every second pixel row and
        column. This is useful both for handling images from interlaced
        video sources (where alternate lines are assembled from alternate
        fields and thus have one field time-difference, resulting in a
        "comb" effect) such as Digital Video cameras.
        The effective reduction by 75% in the pixels processed also
        has utility in accelerating tracking by effectively reducing
        the image size to one quarter size, at the cost of pose accuraccy.

	    @param {number} mode
			Options for this field are:
			AR_IMAGE_PROC_FRAME_IMAGE
			AR_IMAGE_PROC_FIELD_IMAGE
			The default mode is AR_IMAGE_PROC_FRAME_IMAGE.
	*/
	ARController.prototype.setImageProcMode = function(value) {
		return artoolkit.setImageProcMode(this.id, value);
	};

	/**
	    Get the image processing mode.

		See arSetImageProcMode() for a complete description.

	    @return {number} The current image processing mode.
	*/
	ARController.prototype.getImageProcMode = function() {
		return artoolkit.getImageProcMode(this.id);
	};


	/**
		Draw the black and white image and debug markers to the ARController canvas.

		See setDebugMode.
	*/
	ARController.prototype.debugDraw = function() {
		var debugBuffer = new Uint8ClampedArray(Module.HEAPU8.buffer, this._bwpointer, this.framesize);
		var id = new ImageData(debugBuffer, this.canvas.width, this.canvas.height)
		this.ctx.putImageData(id, 0, 0)

		var marker_num = this.getMarkerNum();
		for (var i=0; i<marker_num; i++) {
			this._debugMarker(this.getMarker(i));
		}
	};


	// private

	ARController.prototype._initialize = function() {
		this.id = artoolkit.setup(this.width, this.height, this.cameraParam.id);

		this._initNFT();

		var params = artoolkit.frameMalloc;
		this.framepointer = params.framepointer;
		this.framesize = params.framesize;

		this.dataHeap = new Uint8Array(Module.HEAPU8.buffer, this.framepointer, this.framesize);

		this.camera_mat = new Float64Array(Module.HEAPU8.buffer, params.camera, 16);
		this.marker_transform_mat = new Float64Array(Module.HEAPU8.buffer, params.transform, 12);

		this.setProjectionNearPlane(0.1)
		this.setProjectionFarPlane(1000);

		var self = this;
		setTimeout(function() {
			if (self.onload) {
				self.onload();
			}
			self.dispatchEvent({
				name: 'load',
				target: self
			});
		}, 1);
	};

	ARController.prototype._initNFT = function() {
		artoolkit.setupAR2(this.id);
	};

	ARController.prototype._copyImageToHeap = function(image) {
		if (!image) {
			image = this.image;
		}
		if (image.data) {
			
			var imageData = image;

		} else {

			this.ctx.save();

			if (this.orientation === 'portrait') {
				this.ctx.translate(this.canvas.width, 0);
				this.ctx.rotate(Math.PI/2);
				this.ctx.drawImage(image, 0, 0, this.canvas.height, this.canvas.width); // draw video
			} else {
				this.ctx.drawImage(image, 0, 0, this.canvas.width, this.canvas.height); // draw video
			}

			this.ctx.restore();
			var imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);

		}

		var data = imageData.data;

		if (this.dataHeap) {
			this.dataHeap.set( data );
			return true;
		}
		return false;
	};

	ARController.prototype._debugMarker = function(marker) {
		var vertex, pos;
		vertex = marker.vertex;
		var ctx = this.ctx;
		ctx.strokeStyle = 'red';

		ctx.beginPath()
		ctx.moveTo(vertex[0][0], vertex[0][1])
		ctx.lineTo(vertex[1][0], vertex[1][1])
		ctx.stroke();

		ctx.beginPath()
		ctx.moveTo(vertex[2][0], vertex[2][1])
		ctx.lineTo(vertex[3][0], vertex[3][1])
		ctx.stroke()

		ctx.strokeStyle = 'green';
		ctx.beginPath()
		ctx.lineTo(vertex[1][0], vertex[1][1])
		ctx.lineTo(vertex[2][0], vertex[2][1])
		ctx.stroke();

		ctx.beginPath()
		ctx.moveTo(vertex[3][0], vertex[3][1])
		ctx.lineTo(vertex[0][0], vertex[0][1])
		ctx.stroke();

		pos = marker.pos
		ctx.beginPath()
		ctx.arc(pos[0], pos[1], 8, 0, Math.PI * 2)
		ctx.fillStyle = 'red'
		ctx.fill()
	};


	// static

	/**
		ARController.getUserMedia gets a device camera video feed and calls the given onSuccess callback with it.

		Tries to start playing the video. Playing the video can fail on Chrome for Android,
		so ARController.getUserMedia adds user input event listeners to the window
		that try to start playing the video. On success, the event listeners are removed.

		To use ARController.getUserMedia, call it with an object with the onSuccess attribute set to a callback function.

			ARController.getUserMedia({
				onSuccess: function(video) {
					console.log("Got video", video);
				}
			});

		The configuration object supports the following attributes:

			{
				onSuccess : function(video),
				onError : function(error),

				width : number | {min: number, ideal: number, max: number},
				height : number | {min: number, ideal: number, max: number},

				facingMode : 'environment' | 'user' | 'left' | 'right' | { exact: 'environment' | ... }
			}

		See https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia for more information about the
		width, height and facingMode attributes.

		@param {object} configuration The configuration object.
		@return {VideoElement} Returns the created video element.
	*/
	ARController.getUserMedia = function(configuration) {
		var facing = configuration.facingMode || 'environment';

		var onSuccess = configuration.onSuccess;
		var onError = configuration.onError || function(err) { console.error("ARController.getUserMedia", err); };

		var video = document.createElement('video');

		var initProgress = function() {
			if (this.videoWidth !== 0) {
				onSuccess(video);
			}
		};

		var readyToPlay = false;
		var eventNames = [
			'touchstart', 'touchend', 'touchmove', 'touchcancel',
			'click', 'mousedown', 'mouseup', 'mousemove',
			'keydown', 'keyup', 'keypress', 'scroll'
		];
		var play = function(ev) {
			if (readyToPlay) {
				video.play();
				if (!video.paused) {
					eventNames.forEach(function(eventName) {
						window.removeEventListener(eventName, play, true);
					});
				}
			}
		};
		eventNames.forEach(function(eventName) {
			window.addEventListener(eventName, play, true);
		});

		var success = function(stream) {
			video.addEventListener('loadedmetadata', initProgress, false);
			video.src = window.URL.createObjectURL(stream);
			readyToPlay = true;
			play(); // Try playing without user input, should work on non-Android Chrome
		};

		var constraints = {};
		var mediaDevicesConstraints = {};
		if (configuration.width) {
			mediaDevicesConstraints.width = configuration.width;
			if (typeof configuration.width === 'object') {
				if (configuration.width.max) {
					constraints.maxWidth = configuration.width.max;
				}
				if (configuration.width.min) {
					constraints.minWidth = configuration.width.max;
				}
			} else {
				constraints.maxWidth = configuration.width;
			}
		}

		if (configuration.height) {
			mediaDevicesConstraints.height = configuration.height;
			if (typeof configuration.height === 'object') {
				if (configuration.height.max) {
					constraints.maxHeight = configuration.height.max;
				}
				if (configuration.height.min) {
					constraints.minHeight = configuration.height.max;
				}
			} else {
				constraints.maxHeight = configuration.height;
			}
		}

		mediaDevicesConstraints.facingMode = facing;

		navigator.getUserMedia  = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;
		var hdConstraints = {
			audio: false,
			video: {
				mandatory: constraints
		  	}
		};

		if ( false ) {
		// if ( navigator.mediaDevices || window.MediaStreamTrack) {
			if (navigator.mediaDevices) {
				navigator.mediaDevices.getUserMedia({
					audio: false,
					video: mediaDevicesConstraints
				}).then(success, onError); 
			} else {
				MediaStreamTrack.getSources(function(sources) {
					var facingDir = mediaDevicesConstraints.facingMode;
					if (facing && facing.exact) {
						facingDir = facing.exact;
					}
					for (var i=0; i<sources.length; i++) {
						if (sources[i].kind === 'video' && sources[i].facing === facingDir) {
							hdConstraints.video.mandatory.sourceId = sources[i].id;
							break;
						}
					}
					if (facing && facing.exact && !hdConstraints.video.mandatory.sourceId) {
						onError('Failed to get camera facing the wanted direction');
					} else {
						if (navigator.getUserMedia) {
							navigator.getUserMedia(hdConstraints, success, onError);
						} else {
							onError('navigator.getUserMedia is not supported on your browser');
						}
					}
				});
			}
		} else {
			if (navigator.getUserMedia) {
				navigator.getUserMedia(hdConstraints, success, onError);
			} else {
				onError('navigator.getUserMedia is not supported on your browser');
			}
		}

		return video;
	};

	/**
		ARController.getUserMediaARController gets an ARController for the device camera video feed and calls the 
		given onSuccess callback with it.

		To use ARController.getUserMediaARController, call it with an object with the cameraParam attribute set to
		a camera parameter file URL, and the onSuccess attribute set to a callback function.

			ARController.getUserMediaARController({
				cameraParam: 'Data/camera_para.dat',
				onSuccess: function(arController, arCameraParam) {
					console.log("Got ARController", arController);
					console.log("Got ARCameraParam", arCameraParam);
					console.log("Got video", arController.image);
				}
			});

		The configuration object supports the following attributes:

			{
				onSuccess : function(ARController, ARCameraParam),
				onError : function(error),

				cameraParam: url, // URL to camera parameters definition file.
				maxARVideoSize: number, // Maximum max(width, height) for the AR processing canvas.

				width : number | {min: number, ideal: number, max: number},
				height : number | {min: number, ideal: number, max: number},

				facingMode : 'environment' | 'user' | 'left' | 'right' | { exact: 'environment' | ... }
			}

		See https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia for more information about the
		width, height and facingMode attributes.

		The orientation attribute of the returned ARController is set to "portrait" if the userMedia video has larger
		height than width. Otherwise it's set to "landscape". The videoWidth and videoHeight attributes of the arController
		are set to be always in landscape configuration so that width is larger than height.

		@param {object} configuration The configuration object.
		@return {VideoElement} Returns the created video element.
	*/
	ARController.getUserMediaARController = function(configuration) {
		var obj = {};
		for (var i in configuration) {
			obj[i] = configuration[i];
		}
		var onSuccess = configuration.onSuccess;
		var cameraParamURL = configuration.cameraParam;

		obj.onSuccess = function() {
			new ARCameraParam(cameraParamURL, function() {
				var arCameraParam = this;
				var maxSize = configuration.maxARVideoSize || Math.max(video.videoWidth, video.videoHeight);
				var f = maxSize / Math.max(video.videoWidth, video.videoHeight);
				var w = f * video.videoWidth;
				var h = f * video.videoHeight;
				if (video.videoWidth < video.videoHeight) {
					var tmp = w;
					w = h;
					h = tmp;
				}
				var arController = new ARController(w, h, arCameraParam);
				arController.image = video;
				if (video.videoWidth < video.videoHeight) {
					arController.orientation = 'portrait';
					arController.videoWidth = video.videoHeight;
					arController.videoHeight = video.videoWidth;
				} else {
					arController.orientation = 'landscape';
					arController.videoWidth = video.videoWidth;
					arController.videoHeight = video.videoHeight;
				}
				onSuccess(arController, arCameraParam);
			}, function(err) {
				console.error("ARController: Failed to load ARCameraParam", err);
			});
		};

		var video = this.getUserMedia(obj);
		return video;
	};


	/** 
		ARCameraParam is used for loading AR camera parameters for use with ARController.
		Use by passing in an URL and a callback function.

			var camera = new ARCameraParam('Data/camera_para.dat', function() {
				console.log('loaded camera', this.id);
			},
			function(err) {
				console.log('failed to load camera', err);
			});

		@exports ARCameraParam
		@constructor
	 
		@param {string} src URL to load camera parameters from.
		@param {string} onload Onload callback to be called on successful parameter loading.
		@param {string} onerror Error callback to called when things don't work out.
	*/
	var ARCameraParam = function(src, onload, onerror) {
		this.id = -1;
		this._src = '';
		this.complete = false;
		this.onload = onload;
		this.onerror = onerror;
		if (src) {
			this.load(src);
		}
	};

	/** 
		Loads the given URL as camera parameters definition file into this ARCameraParam.

		Can only be called on an unloaded ARCameraParam instance. 

		@param {string} src URL to load.
	*/
	ARCameraParam.prototype.load = function(src) {
		if (this._src !== '') {
			throw("ARCameraParam: Trying to load camera parameters twice.")
		}
		this._src = src;
		if (src) {
			var self = this;
			artoolkit.loadCamera(src, function(id) {
				self.id = id;
				self.complete = true;
				self.onload();
			}, function(err) {
				self.onerror(err);
			});
		}
	};

	Object.defineProperty(ARCameraParam.prototype, 'src', {
		set: function(src) {
			this.load(src);
		},
		get: function() {
			return this._src;
		}
	});

	/**
		Destroys the camera parameter and frees associated Emscripten resources.

	*/
	ARCameraParam.prototype.dispose = function() {
		if (this.id !== -1) {
			artoolkit.deleteCamera(this.id);
		}
		this.id = -1;
		this._src = '';
		this.complete = false;
	};



	// ARToolKit exported JS API
	//
	var artoolkit = {

		UNKNOWN_MARKER: -1,
		PATTERN_MARKER: 0,
		BARCODE_MARKER: 1,

		loadCamera: loadCamera,

		addMarker: addMarker,
		addMultiMarker: addMultiMarker,
		addNFTMarker: addNFTMarker

	};

	var FUNCTIONS = [
		'setup',
		'teardown',

		'setupAR2',

		'setLogLevel',
		'getLogLevel',

		'setDebugMode',
		'getDebugMode',

		'getProcessingImage',

		'setMarkerInfoDir',
		'setMarkerInfoVertex',

		'getTransMatSquare',
		'getTransMatSquareCont',

		'getTransMatMultiSquare',
		'getTransMatMultiSquareRobust',

		'getMultiMarkerNum',
		'getMultiMarkerCount',

		'detectMarker',
		'getMarkerNum',

		'detectNFTMarker',

		'getMarker',
		'getMultiEachMarker',
		'getNFTMarker',

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
	];

	function runWhenLoaded() {
		FUNCTIONS.forEach(function(n) {
			artoolkit[n] = Module[n];
		})

		for (var m in Module) {
			if (m.match(/^AR/))
			artoolkit[m] = Module[m];
		}
	}

	var marker_count = 0;
	function addMarker(arId, url, callback) {
		var filename = '/marker_' + marker_count++;
		ajax(url, filename, function() {
			var id = Module._addMarker(arId, filename);
			if (callback) callback(id);
		});
	}

	function addNFTMarker(arId, url, callback) {
		var mId = marker_count++;
		var prefix = '/markerNFT_' + mId;
		var filename1 = prefix + '.fset';
		var filename2 = prefix + '.iset';
		var filename3 = prefix + '.fset3';
		ajax(url + '.fset', filename1, function() {
			ajax(url + '.iset', filename2, function() {
				ajax(url + '.fset3', filename3, function() {
					var id = Module._addNFTMarker(arId, prefix);
					if (callback) callback(id);
				});
			});
		});
	}

	function bytesToString(array) {
		return String.fromCharCode.apply(String, array);
	}

	function parseMultiFile(bytes) {
		var str = bytesToString(bytes);

		var lines = str.split('\n');

		var files = [];

		var state = 0; // 0 - read,
		var markers = 0;

		lines.forEach(function(line) {
			line = line.trim();
			if (!line || line.startsWith('#')) return;

			switch (state) {
				case 0:
					markers = +line;
					state = 1;
					return;
				case 1: // filename or barcode
					if (!line.match(/^\d+$/)) {
						files.push(line);
					}
				case 2: // width
				case 3: // matrices
				case 4:
					state++;
					return;
				case 5:
					state = 1;
					return;
			}
		});

		return files;
	}

	var multi_marker_count = 0;

	function addMultiMarker(arId, url, callback) {
		var filename = '/multi_marker_' + multi_marker_count++;
		ajax(url, filename, function(bytes) {
			var files = parseMultiFile(bytes);

			function ok() {
				var markerID = Module._addMultiMarker(arId, filename);
				var markerNum = Module.getMultiMarkerNum(arId, markerID);
				if (callback) callback(markerID, markerNum);
			}

			if (!files.length) return ok();

			var path = url.split('/').slice(0, -1).join('/')
			files = files.map(function(file) {
				return [path + '/' + file, file]
			})

			ajaxDependencies(files, ok);
		});
	}

	var camera_count = 0;
	function loadCamera(url, callback) {
		var filename = '/camera_param_' + camera_count++;
		var writeCallback = function() {
			var id = Module._loadCamera(filename);
			if (callback) callback(id);
		};
		if (typeof url === 'object') { // Maybe it's a byte array
			writeByteArrayToFS(filename, url, writeCallback);
		} else if (url.indexOf("\n") > -1) { // Or a string with the camera param
			writeStringToFS(filename, url, writeCallback);
		} else {
			ajax(url, filename, writeCallback);
		}
	}


	// transfer image

	function writeStringToFS(target, string, callback) {
		var byteArray = new Uint8Array(string.length);
		for (var i=0; i<byteArray.length; i++) {
			byteArray[i] = string.charCodeAt(i) & 0xff;
		}
		writeByteArrayToFS(target, byteArray, callback);
	}

	function writeByteArrayToFS(target, byteArray, callback) {
		FS.writeFile(target, byteArray, { encoding: 'binary' });
		// console.log('FS written', target);

		callback(byteArray);
	}

	// Eg.
	//	ajax('../bin/Data2/markers.dat', '/Data2/markers.dat', callback);
	//	ajax('../bin/Data/patt.hiro', '/patt.hiro', callback);

	function ajax(url, target, callback) {
		var oReq = new XMLHttpRequest();
		oReq.open('GET', url, true);
		oReq.responseType = 'arraybuffer'; // blob arraybuffer

		oReq.onload = function(oEvent) {
			// console.log('ajax done for ', url);
			var arrayBuffer = oReq.response;
			var byteArray = new Uint8Array(arrayBuffer);
			writeByteArrayToFS(target, byteArray, callback);
		};

		oReq.send();
	}

	function ajaxDependencies(files, callback) {
		var next = files.pop();
		if (next) {
			ajax(next[0], next[1], function() {
				ajaxDependencies(files, callback);
			});
		} else {
			callback();
		}
	}

	var scope;
	if (typeof window !== 'undefined') {
		scope = window;
	} else {
		scope = self;
	}

	/* Exports */
	scope.artoolkit = artoolkit;
	scope.ARController = ARController;
	scope.ARCameraParam = ARCameraParam;

	if (scope.Module) {
		runWhenLoaded();
	} else {
		scope.Module = {
			onRuntimeInitialized: function() {
				runWhenLoaded();
			}
		};
	}

})();
