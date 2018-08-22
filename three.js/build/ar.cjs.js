'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var THREE$1 = require('three');
var jsartoolkit5 = require('jsartoolkit5');

class ArToolkitSource{
	constructor(parameters) {
		const defaultParameters = {
			sourceType: 'webcam', // options are webcam, image, video
			sourceUrl: null, // url of the source. Used for image or video source
			sourceWidth: 640,
			sourceHeight: 480,
			displayWidth: 640,
			displayHeight: 480,
		};
		this.parameters = Object.assign({}, defaultParameters, parameters);
		this.domElement = null;
		this.ready = false;
	}
	init(onReady, onError){
		const self = this;
		const { sourceType } = this.parameters;
		const sourceTypeActions = {
			image: () => self.initSourceImage(onReady, onError),
			video: () => self.initSourceVideo(onReady, onError),
			webcam: () => this.initSourceWebcam(onReady, onError)
		};
		if(sourceType in sourceTypeActions) {
			const domElement = sourceTypeActions[sourceType]();
			this.domElement = domElement;
			this.domElement.style.position = 'absolute';
			this.domElement.style.top = '0';
			this.domElement.style.left = '0';
			this.domElement.style.zIndex = '-2';
			this.render();
		}
	}
	render() {
		document.body.appendChild(this.domElement);
		this.ready = true;
	}
	initSourceImage(onReady) {
		const domElement = document.createElement('img');
		domElement.src = this.parameters.sourceUrl;
		domElement.width = this.parameters.sourceWidth;
		domElement.height = this.parameters.sourceHeight;
		domElement.style.width = `${this.parameters.displayWidth}px`;
		domElement.style.height = `${this.parameters.displayHeight}px`;
		const interval = setInterval(() => {
			if(!domElement.naturalWidth) return;
			onReady();
			clearInterval(interval);
		}, 1000/50);
		return domElement;
	}
	initSourceVideo(onReady) {
		// TODO make it static
		const domElement = document.createElement('video');
		domElement.src = this.parameters.sourceUrl;
		domElement.style.objectFit = 'initial';
		domElement.autoplay = true;
		domElement.webkitPlaysinline = true;
		domElement.controls = false;
		domElement.loop = true;
		domElement.muted = true;

		// Trick to trigger the video on android
		document.body.addEventListener('click', function onClick() {
			document.body.removeEventListener('click', onClick);
			domElement.play();
		});

		domElement.width = this.parameters.sourceWidth;
		domElement.height = this.parameters.sourceHeight;
		domElement.style.width = this.parameters.displayWidth+'px';
		domElement.style.height = this.parameters.displayHeight+'px';
		
		// wait until the video stream is ready
		var interval = setInterval(() => {
			if (!domElement.videoWidth)	return;
			onReady();
			clearInterval(interval);
		}, 1000/50);

		return domElement
	}
	initSourceWebcam(onReady, onError) {
		const _this = this;
		onError = onError || (error => alert(`Webcam Error\nName:${error.name}\nMessage:${error.message}`));
		const domElement = document.createElement('video');
		domElement.setAttribute('autoplay', '');
		domElement.setAttribute('muted', '');
		domElement.setAttribute('playsinline', '');
		domElement.style.width = this.parameters.displayWidth+'px';
		domElement.style.height = this.parameters.displayHeight+'px';

		// check API is available
		if (navigator.mediaDevices === undefined 
				|| navigator.mediaDevices.enumerateDevices === undefined 
				|| navigator.mediaDevices.getUserMedia === undefined  ){
			if( navigator.mediaDevices === undefined )				var fctName = 'navigator.mediaDevices';
			else if( navigator.mediaDevices.enumerateDevices === undefined )	var fctName = 'navigator.mediaDevices.enumerateDevices';
			else if( navigator.mediaDevices.getUserMedia === undefined )		var fctName = 'navigator.mediaDevices.getUserMedia';
			else console.assert(false);
			onError({
				name: '',
				message: 'WebRTC issue-! '+fctName+' not present in your browser'
			});
			return null
		}

		// get available devices
		navigator.mediaDevices.enumerateDevices().then(function(devices) {
			var userMediaConstraints = {
				audio: false,
				video: {
					facingMode: 'environment',
					width: {
						ideal: _this.parameters.sourceWidth,
						// min: 1024,
						// max: 1920
					},
					height: {
						ideal: _this.parameters.sourceHeight,
						// min: 776,
						// max: 1080
					}
				}
			};
			// get a device which satisfy the constraints
			navigator.mediaDevices.getUserMedia(userMediaConstraints).then(function success(stream) {
				// set the .src of the domElement
				domElement.srcObject = stream;
				// to start the video, when it is possible to start it only on userevent. like in android
				document.body.addEventListener('click', function(){
					domElement.play();
				});

				// TODO listen to loadedmetadata instead
				// wait until the video stream is ready
				var interval = setInterval(function() {
					if (!domElement.videoWidth)	return;
					onReady();
					clearInterval(interval);
				}, 1000/50);
			}).catch(function(error) {
				onError({
					name: error.name,
					message: error.message
				});
			});
		}).catch(function(error) {
			onError({
				message: error.message
			});
		});

		return domElement
	}
	hasMobileTorch() {
		var stream = arToolkitSource.domElement.srcObject;
		if( stream instanceof MediaStream === false )	return false

		if( this._currentTorchStatus === undefined ){
			this._currentTorchStatus = false;
		}

		var videoTrack = stream.getVideoTracks()[0];

		// if videoTrack.getCapabilities() doesnt exist, return false now
		if( videoTrack.getCapabilities === undefined )	return false

		var capabilities = videoTrack.getCapabilities();
		
		return capabilities.torch ? true : false
	}
	/**
	 * toggle the flash/torch of the mobile fun if applicable.
	 * Great post about it https://www.oberhofer.co/mediastreamtrack-and-its-capabilities/
	 */
	toggleMobileTorch() {
		// sanity check
		console.assert(this.hasMobileTorch() === true);
			
		var stream = arToolkitSource.domElement.srcObject;
		if( stream instanceof MediaStream === false ){
			alert('enabling mobile torch is available only on webcam');
			return
		}

		if( this._currentTorchStatus === undefined ){
			this._currentTorchStatus = false;
		}

		var videoTrack = stream.getVideoTracks()[0];
		var capabilities = videoTrack.getCapabilities();
		
		if( !capabilities.torch ){
			alert('no mobile torch is available on your camera');
			return
		}

		this._currentTorchStatus = this._currentTorchStatus === false ? true : false;
		videoTrack.applyConstraints({
			advanced: [{
				torch: this._currentTorchStatus
			}]
		}).catch(function(error){
			console.log(error);
		});
	}
	domElementWidth() {
		return parseInt(this.domElement.style.width);
	}
	domElementHeight() {
		return parseInt(this.domElement.style.height);
	}
	onResizeElement() {
		const screenWidth = window.innerWidth;
		const screenHeight = window.innerHeight;

		// sanity check
		console.assert( arguments.length === 0 );

		// compute sourceWidth, sourceHeight
		if( this.domElement.nodeName === "IMG" ){
			var sourceWidth = this.domElement.naturalWidth;
			var sourceHeight = this.domElement.naturalHeight;
		}else if( this.domElement.nodeName === "VIDEO" ){
			var sourceWidth = this.domElement.videoWidth;
			var sourceHeight = this.domElement.videoHeight;
		}else{
			console.assert(false);
		}
		
		// compute sourceAspect
		var sourceAspect = sourceWidth / sourceHeight;
		// compute screenAspect
		var screenAspect = screenWidth / screenHeight;

		// if screenAspect < sourceAspect, then change the width, else change the height
		if( screenAspect < sourceAspect ){
			// compute newWidth and set .width/.marginLeft
			var newWidth = sourceAspect * screenHeight;
			this.domElement.style.width = newWidth+'px';
			this.domElement.style.marginLeft = -(newWidth-screenWidth)/2+'px';
			
			// init style.height/.marginTop to normal value
			this.domElement.style.height = screenHeight+'px';
			this.domElement.style.marginTop = '0px';
		}else{
			// compute newHeight and set .height/.marginTop
			var newHeight = 1 / (sourceAspect / screenWidth);
			this.domElement.style.height = newHeight+'px';
			this.domElement.style.marginTop = -(newHeight-screenHeight)/2+'px';
			
			// init style.width/.marginLeft to normal value
			this.domElement.style.width = screenWidth+'px';
			this.domElement.style.marginLeft = '0px';
		}
	}
	copyElementSizeTo(otherElement) {
		if (window.innerWidth > window.innerHeight)
		{
			//landscape
			otherElement.style.width = this.domElement.style.width;
			otherElement.style.height = this.domElement.style.height;
			otherElement.style.marginLeft = this.domElement.style.marginLeft;
			otherElement.style.marginTop = this.domElement.style.marginTop;
		}
		else {
			//portrait
			otherElement.style.height = this.domElement.style.height;
			otherElement.style.width = (parseInt(otherElement.style.height) * 4/3)+"px";
			otherElement.style.marginLeft = ((window.innerWidth- parseInt(otherElement.style.width))/2)+"px";
			otherElement.style.marginTop = 0;
		}
	}
	copySizeTo() {
		console.warn('obsolete function arToolkitSource.copySizeTo. Use arToolkitSource.copyElementSizeTo' );
		this.copyElementSizeTo.apply(this, arguments);
	}
	onResize() {
		if( arguments.length !== 3 ){
			console.warn('obsolete function arToolkitSource.onResize. Use arToolkitSource.onResizeElement' );
			return this.onResizeElement.apply(this, arguments)
		}

		var trackingBackend = arToolkitContext.parameters.trackingBackend;
		

		// RESIZE DOMELEMENT
		if( trackingBackend === 'artoolkit' ){

			this.onResizeElement();
			
			var isAframe = renderer.domElement.dataset.aframeCanvas ? true : false;
			if( isAframe === false ){
				this.copyElementSizeTo(renderer.domElement);	
			}

			if( arToolkitContext.arController !== null ){
				this.copyElementSizeTo(arToolkitContext.arController.canvas);	
			}
		}else if( trackingBackend === 'aruco' ){
			this.onResizeElement();
			this.copyElementSizeTo(renderer.domElement);	

			this.copyElementSizeTo(arToolkitContext.arucoContext.canvas);	
		}else if( trackingBackend === 'tango' ){
			renderer.setSize( window.innerWidth, window.innerHeight );
		}else console.assert(false, 'unhandled trackingBackend '+trackingBackend);


		// UPDATE CAMERA
		if( trackingBackend === 'artoolkit' ){
			if( arToolkitContext.arController !== null ){
				camera.projectionMatrix.copy( arToolkitContext.getProjectionMatrix() );			
			}
		}else if( trackingBackend === 'aruco' ){	
			camera.aspect = renderer.domElement.width / renderer.domElement.height;
			camera.updateProjectionMatrix();			
		}else if( trackingBackend === 'tango' ){
			var vrDisplay = arToolkitContext._tangoContext.vrDisplay;
			// make camera fit vrDisplay
			if( vrDisplay && vrDisplay.displayName === "Tango VR Device" ) THREE.WebAR.resizeVRSeeThroughCamera(vrDisplay, camera);
		}else console.assert(false, 'unhandled trackingBackend '+trackingBackend);	

	}
}

const Source = THREE => {
	return ArToolkitSource;
};

var THREEx$1 = THREEx$1 || {};

const ArBaseControls = function(object3d){
	this.id = THREEx$1.ArBaseControls.id++;

	this.object3d = object3d;
	this.object3d.matrixAutoUpdate = false;
	this.object3d.visible = false;

	// Events to honor
	// this.dispatchEvent({ type: 'becameVisible' })
	// this.dispatchEvent({ type: 'markerVisible' })	// replace markerFound
	// this.dispatchEvent({ type: 'becameUnVisible' })
};

ArBaseControls.id = 0;

Object.assign( ArBaseControls.prototype, THREE$1.EventDispatcher.prototype );

//////////////////////////////////////////////////////////////////////////////
//		Functions
//////////////////////////////////////////////////////////////////////////////
/**
 * error catching function for update()
 */
ArBaseControls.prototype.update = function(){
	console.assert(false, 'you need to implement your own update');
};

/**
 * error catching function for name()
 */
ArBaseControls.prototype.name = function(){
	console.assert(false, 'you need to implement your own .name()');
	return 'Not yet implemented - name()'
};

THREEx$1.ArBaseControls = ArBaseControls;

const MarkerControls = function(context, object3d, parameters){
	var _this = this;

	ArBaseControls.call(this, object3d);

	this.context = context;
	// handle default parameters
	this.parameters = {
		// size of the marker in meter
		size : 1,
		// type of marker - ['pattern', 'barcode', 'unknown' ]
		type : 'unknown',
		// url of the pattern - IIF type='pattern'
		patternUrl : null,
		// value of the barcode - IIF type='barcode'
		barcodeValue : null,
		// change matrix mode - [modelViewMatrix, cameraTransformMatrix]
		changeMatrixMode : 'modelViewMatrix',
		// minimal confidence in the marke recognition - between [0, 1] - default to 1
		minConfidence: 0.6,
	};

	// sanity check
	var possibleValues = ['pattern', 'barcode', 'unknown'];
	console.assert(possibleValues.indexOf(this.parameters.type) !== -1, 'illegal value', this.parameters.type);
	var possibleValues = ['modelViewMatrix', 'cameraTransformMatrix' ];
	console.assert(possibleValues.indexOf(this.parameters.changeMatrixMode) !== -1, 'illegal value', this.parameters.changeMatrixMode);


        // create the marker Root
	this.object3d = object3d;
	this.object3d.matrixAutoUpdate = false;
	this.object3d.visible = false;

	//////////////////////////////////////////////////////////////////////////////
	//		setParameters
	//////////////////////////////////////////////////////////////////////////////
	setParameters(parameters);
	function setParameters(parameters){
		if( parameters === undefined )	return
		for( var key in parameters ){
			var newValue = parameters[ key ];

			if( newValue === undefined ){
				console.warn( "THREEx.ArMarkerControls: '" + key + "' parameter is undefined." );
				continue
			}

			var currentValue = _this.parameters[ key ];

			if( currentValue === undefined ){
				console.warn( "THREEx.ArMarkerControls: '" + key + "' is not a property of this material." );
				continue
			}

			_this.parameters[ key ] = newValue;
		}
	}

	//////////////////////////////////////////////////////////////////////////////
	//		Code Separator
	//////////////////////////////////////////////////////////////////////////////
	// add this marker to artoolkitsystem
	// TODO rename that .addMarkerControls
	context.addMarker(this);

	if( _this.context.parameters.trackingBackend === 'artoolkit' ){
		this._initArtoolkit();
	}else if( _this.context.parameters.trackingBackend === 'aruco' ){
		// TODO create a ._initAruco
		// put aruco second
		this._arucoPosit = new POS.Posit(this.parameters.size, _this.context.arucoContext.canvas.width);
	}else if( _this.context.parameters.trackingBackend === 'tango' ){
		this._initTango();
	}else console.assert(false);
};

MarkerControls.prototype = Object.create( ArBaseControls.prototype );
MarkerControls.prototype.constructor = MarkerControls;

MarkerControls.prototype.dispose = function(){
	this.context.removeMarker(this);

	// TODO remove the event listener if needed
	// unloadMaker ???
};

//////////////////////////////////////////////////////////////////////////////
//		update controls with new modelViewMatrix
//////////////////////////////////////////////////////////////////////////////

/**
 * When you actually got a new modelViewMatrix, you need to perfom a whole bunch
 * of things. it is done here.
 */
MarkerControls.prototype.updateWithModelViewMatrix = function(modelViewMatrix){
	var markerObject3D = this.object3d;

	// mark object as visible
	markerObject3D.visible = true;

	if( this.context.parameters.trackingBackend === 'artoolkit' ){
		// apply context._axisTransformMatrix - change artoolkit axis to match usual webgl one
		var tmpMatrix = new THREE$1.Matrix4().copy(this.context._artoolkitProjectionAxisTransformMatrix);
		tmpMatrix.multiply(modelViewMatrix);

		modelViewMatrix.copy(tmpMatrix);
	}else if( this.context.parameters.trackingBackend === 'aruco' );else if( this.context.parameters.trackingBackend === 'tango' );else console.assert(false);


	if( this.context.parameters.trackingBackend !== 'tango' ){

		// change axis orientation on marker - artoolkit say Z is normal to the marker - ar.js say Y is normal to the marker
		var markerAxisTransformMatrix = new THREE$1.Matrix4().makeRotationX(Math.PI/2);
		modelViewMatrix.multiply(markerAxisTransformMatrix);
	}

	// change markerObject3D.matrix based on parameters.changeMatrixMode
	if( this.parameters.changeMatrixMode === 'modelViewMatrix' ){
		markerObject3D.matrix.copy(modelViewMatrix);
	}else if( this.parameters.changeMatrixMode === 'cameraTransformMatrix' ){
		markerObject3D.matrix.getInverse( modelViewMatrix );
	}else {
		console.assert(false);
	}

	// decompose - the matrix into .position, .quaternion, .scale
	markerObject3D.matrix.decompose(markerObject3D.position, markerObject3D.quaternion, markerObject3D.scale);

	// dispatchEvent
	this.dispatchEvent( { type: 'markerFound' } );
};

//////////////////////////////////////////////////////////////////////////////
//		utility functions
//////////////////////////////////////////////////////////////////////////////

/**
 * provide a name for a marker
 * - silly heuristic for now
 * - should be improved
 */
MarkerControls.prototype.name = function(){
	var name = '';
	name += this.parameters.type;
	if( this.parameters.type === 'pattern' ){
		var url = this.parameters.patternUrl;
		var basename = url.replace(/^.*\//g, '');
		name += ' - ' + basename;
	}else if( this.parameters.type === 'barcode' ){
		name += ' - ' + this.parameters.barcodeValue;
	}else{
		console.assert(false, 'no .name() implemented for this marker controls');
	}
	return name
};

//////////////////////////////////////////////////////////////////////////////
//		init for Artoolkit
//////////////////////////////////////////////////////////////////////////////
MarkerControls.prototype._initArtoolkit = function(){
	var _this = this;

	var artoolkitMarkerId = null;

	var delayedInitTimerId = setInterval(function(){
		// check if arController is init
		var arController = _this.context.arController;
		if( arController === null )	return
		// stop looping if it is init
		clearInterval(delayedInitTimerId);
		delayedInitTimerId = null;
		// launch the _postInitArtoolkit
		postInit();
	}, 1000/50);

	return

	function postInit(){
		// check if arController is init
		var arController = _this.context.arController;
		console.assert(arController !== null );

		// start tracking this pattern
		if( _this.parameters.type === 'pattern' ){
	                arController.loadMarker(_this.parameters.patternUrl, function(markerId) {
				artoolkitMarkerId = markerId;
	                        arController.trackPatternMarkerId(artoolkitMarkerId, _this.parameters.size);
	                });
		}else if( _this.parameters.type === 'barcode' ){
			artoolkitMarkerId = _this.parameters.barcodeValue;
			arController.trackBarcodeMarkerId(artoolkitMarkerId, _this.parameters.size);
		}else if( _this.parameters.type === 'unknown' ){
			artoolkitMarkerId = null;
		}else{
			console.log(false, 'invalid marker type', _this.parameters.type);
		}

		// listen to the event
		arController.addEventListener('getMarker', function(event){
			if( event.data.type === artoolkit.PATTERN_MARKER && _this.parameters.type === 'pattern' ){
				if( artoolkitMarkerId === null )	return
				if( event.data.marker.idPatt === artoolkitMarkerId ) onMarkerFound(event);
			}else if( event.data.type === artoolkit.BARCODE_MARKER && _this.parameters.type === 'barcode' ){
				// console.log('BARCODE_MARKER idMatrix', event.data.marker.idMatrix, artoolkitMarkerId )
				if( artoolkitMarkerId === null )	return
				if( event.data.marker.idMatrix === artoolkitMarkerId )  onMarkerFound(event);
			}else if( event.data.type === artoolkit.UNKNOWN_MARKER && _this.parameters.type === 'unknown'){
				onMarkerFound(event);
			}
		});

	}

	function onMarkerFound(event){
		// honor his.parameters.minConfidence
		if( event.data.type === artoolkit.PATTERN_MARKER && event.data.marker.cfPatt < _this.parameters.minConfidence )	return
		if( event.data.type === artoolkit.BARCODE_MARKER && event.data.marker.cfMatt < _this.parameters.minConfidence )	return

		var modelViewMatrix = new THREE$1.Matrix4().fromArray(event.data.matrix);
		_this.updateWithModelViewMatrix(modelViewMatrix);
	}
};

//////////////////////////////////////////////////////////////////////////////
//		aruco specific
//////////////////////////////////////////////////////////////////////////////
MarkerControls.prototype._initAruco = function(){
	this._arucoPosit = new POS.Posit(this.parameters.size, _this.context.arucoContext.canvas.width);
};

//////////////////////////////////////////////////////////////////////////////
//		init for Artoolkit
//////////////////////////////////////////////////////////////////////////////
MarkerControls.prototype._initTango = function(){
	console.log('init tango ArMarkerControls');
};

const ArucoDebug = function(arucoContext){
	this.arucoContext = arucoContext;

// TODO to rename canvasElement into canvas
	this.canvasElement = document.createElement('canvas');
	this.canvasElement.width = this.arucoContext.canvas.width;
	this.canvasElement.height = this.arucoContext.canvas.height;
};

ArucoDebug.prototype.setSize = function (width, height) {
        if( this.canvasElement.width !== width )	this.canvasElement.width = width;
        if( this.canvasElement.height !== height )	this.canvasElement.height = height;
};


ArucoDebug.prototype.clear = function(){
	var canvas = this.canvasElement;
	var context = canvas.getContext('2d');
	context.clearRect(0,0,canvas.width, canvas.height);
	
};
	
ArucoDebug.prototype.drawContoursContours = function(){
	var contours = this.arucoContext.detector.contours;
	var canvas = this.canvasElement;
	this.drawContours(contours, 0, 0, canvas.width, canvas.height, function(hole){
		return hole? "magenta": "blue"
	});
};

ArucoDebug.prototype.drawContoursPolys = function(){
	var contours = this.arucoContext.detector.polys;
	var canvas = this.canvasElement;
	this.drawContours(contours, 0, 0, canvas.width, canvas.height, function(){
		return 'green'
	});
};


ArucoDebug.prototype.drawContoursCandidates = function(){
	var contours = this.arucoContext.detector.candidates;
	var canvas = this.canvasElement;
	this.drawContours(contours, 0, 0, canvas.width, canvas.height, function(){
		return 'red'
	});
};

ArucoDebug.prototype.drawContours = function(contours, x, y, width, height, fn){
	var i = contours.length, j, contour, point;
	var canvas = this.canvasElement;
	var context = canvas.getContext('2d');
	
	context.save();
	while(i --){
		contour = contours[i];
		context.strokeStyle = fn(contour.hole);
		context.beginPath();
		for (j = 0; j < contour.length; ++ j){
			point = contour[j];
			context.moveTo(x + point.x, y + point.y);
			point = contour[(j + 1) % contour.length];
			context.lineTo(x + point.x, y + point.y);
		}
		
		context.stroke();
		context.closePath();
	}
	context.restore();
};

//////////////////////////////////////////////////////////////////////////////
//		Code Separator
//////////////////////////////////////////////////////////////////////////////    

ArucoDebug.prototype.drawDetectorGrey = function(){
	var cvImage = arucoContext.detector.grey;
        this.drawCVImage( cvImage );
};

ArucoDebug.prototype.drawDetectorThreshold = function(){
	var cvImage = arucoContext.detector.thres;
        this.drawCVImage( cvImage );
};

//////////////////////////////////////////////////////////////////////////////
//		Code Separator
//////////////////////////////////////////////////////////////////////////////
ArucoDebug.prototype.drawCVImage = function(cvImage){
	var detector = this.arucoContext.detector;

	var canvas = this.canvasElement;
	var context = canvas.getContext('2d');

	var imageData = context.createImageData(canvas.width, canvas.height);
	this.copyCVImage2ImageData(cvImage, imageData);
	context.putImageData( imageData, 0, 0);
};


ArucoDebug.prototype.copyCVImage2ImageData = function(cvImage, imageData){
	var i = cvImage.data.length, j = (i * 4) + 3;
	
	while(i --){
		imageData.data[j -= 4] = 255;
		imageData.data[j - 1] = imageData.data[j - 2] = imageData.data[j - 3] = cvImage.data[i];
	}
	
	return imageData;
};

//////////////////////////////////////////////////////////////////////////////
//		Code Separator
//////////////////////////////////////////////////////////////////////////////
ArucoDebug.prototype.drawVideo = function(videoElement){
	var canvas = this.canvasElement;
	var context = canvas.getContext('2d');
	context.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
};

//////////////////////////////////////////////////////////////////////////////
//		Code Separator
//////////////////////////////////////////////////////////////////////////////
ArucoDebug.prototype.drawMarkerIDs = function(markers){
	var canvas = this.canvasElement;
	var context = canvas.getContext('2d');
	var corners, corner, x, y, i, j;
	
	context.save();
	context.strokeStyle = "blue";
	context.lineWidth = 1;
	
	for (i = 0; i !== markers.length; ++ i){
		corners = markers[i].corners;
		
		x = Infinity;
		y = Infinity;
		
		for (j = 0; j !== corners.length; ++ j){
			corner = corners[j];
			
			x = Math.min(x, corner.x);
			y = Math.min(y, corner.y);
		}
		context.strokeText(markers[i].id, x, y);
	}
	context.restore();
};

//////////////////////////////////////////////////////////////////////////////
//		Code Separator
//////////////////////////////////////////////////////////////////////////////
ArucoDebug.prototype.drawMarkerCorners = function(markers){
	var canvas = this.canvasElement;
        var corners, corner, i, j;
        var context = canvas.getContext('2d');
	context.save();
        context.lineWidth = 3;
        
        for (i = 0; i < markers.length; ++ i){
                corners = markers[i].corners;
                
                context.strokeStyle = 'red';
                context.beginPath();
                
                for (j = 0; j < corners.length; ++ j){
                        corner = corners[j];
                        context.moveTo(corner.x, corner.y);
                        corner = corners[(j + 1) % corners.length];
                        context.lineTo(corner.x, corner.y);
                }
                
                context.stroke();
                context.closePath();
                
                context.strokeStyle = 'green';
                context.strokeRect(corners[0].x - 2, corners[0].y - 2, 4, 4);
        }
	context.restore();

};

const ArucoContext = function(parameters){
	// handle default parameters
	parameters = parameters || {};
	this.parameters = {
		// debug - true if one should display artoolkit debug canvas, false otherwise
		debug: parameters.debug !== undefined ? parameters.debug : false,
		// resolution of at which we detect pose in the source image
		canvasWidth: parameters.canvasWidth !== undefined ? parameters.canvasWidth : 640,
		canvasHeight: parameters.canvasHeight !== undefined ? parameters.canvasHeight : 480,
	};


        this.canvas = document.createElement('canvas');
                
        this.detector = new AR.Detector();
        
        // setup ArucoDebug if needed
        this.debug = null;
        if( parameters.debug == true ){
                this.debug = new ArucoDebug(this);
        }
	
	// honor parameters.canvasWidth/.canvasHeight
	this.setSize(this.parameters.canvasWidth, this.parameters.canvasHeight);
};

ArucoContext.prototype.setSize = function (width, height) {
        this.canvas.width = width;
        this.canvas.height = height;
        if( this.debug !== null ){
                this.debug.setSize(width, height);
        }
};

ArucoContext.prototype.detect = function (videoElement) {
        var canvas = this.canvas;
        
        // get imageData from videoElement
        var context = canvas.getContext('2d');
        context.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
        var imageData = context.getImageData(0, 0, canvas.width, canvas.height);
        
        // detect markers in imageData
        var detectedMarkers = this.detector.detect(imageData);
	return detectedMarkers
};

/**
 * crappy function to update a object3d with a detectedMarker - super crappy
 */
ArucoContext.prototype.updateObject3D = function(object3D, arucoPosit, markerSize, detectedMarker){
        var markerCorners = detectedMarker.corners;
        var canvas = this.canvas;

        // convert the corners
        var poseCorners = new Array(markerCorners.length);
        for (var i = 0; i < markerCorners.length; ++ i){
                var markerCorner = markerCorners[i];        
                poseCorners[i] = {
                        x:  markerCorner.x - (canvas.width / 2),
                        y: -markerCorner.y + (canvas.height/ 2)
                };
        }
        
        // estimate pose from corners
        var pose = arucoPosit.pose(poseCorners);


	var rotation    = pose.bestRotation;
	var translation = pose.bestTranslation;
	
        object3D.position.x =  translation[0];
        object3D.position.y =  translation[1];
        object3D.position.z = -translation[2];
        
        object3D.rotation.x = -Math.asin(-rotation[1][2]);
        object3D.rotation.y = -Math.atan2(rotation[0][2], rotation[2][2]);
        object3D.rotation.z =  Math.atan2(rotation[1][0], rotation[1][1]);
        
        object3D.scale.x = markerSize;
        object3D.scale.y = markerSize;
        object3D.scale.z = markerSize;
};

const Context = function(parameters){
	var _this = this;

	_this._updatedAt = null;

	// handle default parameters
	this.parameters = {
		// AR backend - ['artoolkit', 'aruco', 'tango']
		trackingBackend: 'artoolkit',
		// debug - true if one should display artoolkit debug canvas, false otherwise
		debug: false,
		// the mode of detection - ['color', 'color_and_matrix', 'mono', 'mono_and_matrix']
		detectionMode: 'mono',
		// type of matrix code - valid iif detectionMode end with 'matrix' - [3x3, 3x3_HAMMING63, 3x3_PARITY65, 4x4, 4x4_BCH_13_9_3, 4x4_BCH_13_5_5]
		matrixCodeType: '3x3',

		// url of the camera parameters
		cameraParametersUrl: Context.baseURL + 'parameters/camera_para.dat',

		// tune the maximum rate of pose detection in the source image
		maxDetectionRate: 60,
		// resolution of at which we detect pose in the source image
		canvasWidth: 640,
		canvasHeight: 480,

		// the patternRatio inside the artoolkit marker - artoolkit only
		patternRatio: 0.5,

		// enable image smoothing or not for canvas copy - default to true
		// https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/imageSmoothingEnabled
		imageSmoothingEnabled : false,
	};
	// parameters sanity check
	console.assert(['artoolkit', 'aruco', 'tango'].indexOf(this.parameters.trackingBackend) !== -1, 'invalid parameter trackingBackend', this.parameters.trackingBackend);
	console.assert(['color', 'color_and_matrix', 'mono', 'mono_and_matrix'].indexOf(this.parameters.detectionMode) !== -1, 'invalid parameter detectionMode', this.parameters.detectionMode);

        this.arController = null;
        this.arucoContext = null;

	_this.initialized = false;


	this._arMarkersControls = [];

	//////////////////////////////////////////////////////////////////////////////
	//		setParameters
	//////////////////////////////////////////////////////////////////////////////
	setParameters(parameters);
	function setParameters(parameters){
		if( parameters === undefined )	return
		for( var key in parameters ){
			var newValue = parameters[ key ];

			if( newValue === undefined ){
				console.warn( "ArToolkitContext: '" + key + "' parameter is undefined." );
				continue
			}

			var currentValue = _this.parameters[ key ];

			if( currentValue === undefined ){
				console.warn( "ArToolkitContext: '" + key + "' is not a property of this material." );
				continue
			}

			_this.parameters[ key ] = newValue;
		}
	}
};

Object.assign( Context.prototype, THREE$1.EventDispatcher.prototype );

// Context.baseURL = '../'
// default to github page
Context.baseURL = 'https://jeromeetienne.github.io/AR.js/three.js/';
Context.REVISION = '1.6.0';



/**
 * Create a default camera for this trackingBackend
 * @param {string} trackingBackend - the tracking to user
 * @return {THREE.Camera} the created camera
 */
Context.createDefaultCamera = function( trackingBackend ){
	console.assert(false, 'use ARjs.Utils.createDefaultCamera instead');
	// Create a camera
	if( trackingBackend === 'artoolkit' ){
		var camera = new THREE$1.Camera();
	}else if( trackingBackend === 'aruco' ){
		var camera = new THREE$1.PerspectiveCamera(42, renderer.domElement.width / renderer.domElement.height, 0.01, 100);
	}else if( trackingBackend === 'tango' ){
		var camera = new THREE$1.PerspectiveCamera(42, renderer.domElement.width / renderer.domElement.height, 0.01, 100);
	}else console.assert(false);
	return camera
};


//////////////////////////////////////////////////////////////////////////////
//		init functions
//////////////////////////////////////////////////////////////////////////////
Context.prototype.init = function(onCompleted){
	var _this = this;
	if( this.parameters.trackingBackend === 'artoolkit' ){
		this._initArtoolkit(done);
	}else if( this.parameters.trackingBackend === 'aruco' ){
		this._initAruco(done);
	}else if( this.parameters.trackingBackend === 'tango' ){
		this._initTango(done);
	}else console.assert(false);
	return

	function done(){
		// dispatch event
		_this.dispatchEvent({
			type: 'initialized'
		});

		_this.initialized = true;

		onCompleted && onCompleted();
	}

};
////////////////////////////////////////////////////////////////////////////////
//          update function
////////////////////////////////////////////////////////////////////////////////
Context.prototype.update = function(srcElement){

	// be sure arController is fully initialized
        if(this.parameters.trackingBackend === 'artoolkit' && this.arController === null) return false;

	// honor this.parameters.maxDetectionRate
	var present = performance.now();
	if( this._updatedAt !== null && present - this._updatedAt < 1000/this.parameters.maxDetectionRate ){
		return false
	}
	this._updatedAt = present;

	// mark all markers to invisible before processing this frame
	this._arMarkersControls.forEach(function(markerControls){
		markerControls.object3d.visible = false;
	});

	// process this frame
	if(this.parameters.trackingBackend === 'artoolkit'){
		this._updateArtoolkit(srcElement);
	}else if( this.parameters.trackingBackend === 'aruco' ){
		this._updateAruco(srcElement);
	}else if( this.parameters.trackingBackend === 'tango' ){
		this._updateTango(srcElement);
	}else{
		console.assert(false);
	}

	// dispatch event
	this.dispatchEvent({
		type: 'sourceProcessed'
	});


	// return true as we processed the frame
	return true;
};

////////////////////////////////////////////////////////////////////////////////
//          Add/Remove markerControls
////////////////////////////////////////////////////////////////////////////////
Context.prototype.addMarker = function(arMarkerControls){
	console.assert(arMarkerControls instanceof MarkerControls);
	this._arMarkersControls.push(arMarkerControls);
};

Context.prototype.removeMarker = function(arMarkerControls){
	console.assert(arMarkerControls instanceof MarkerControls);
	// console.log('remove marker for', arMarkerControls)
	var index = this.arMarkerControlss.indexOf(artoolkitMarker);
	console.assert(index !== index );
	this._arMarkersControls.splice(index, 1);
};

//////////////////////////////////////////////////////////////////////////////
//		artoolkit specific
//////////////////////////////////////////////////////////////////////////////
Context.prototype._initArtoolkit = function(onCompleted){
        var _this = this;

	// set this._artoolkitProjectionAxisTransformMatrix to change artoolkit projection matrix axis to match usual webgl one
	this._artoolkitProjectionAxisTransformMatrix = new THREE$1.Matrix4();
	this._artoolkitProjectionAxisTransformMatrix.multiply(new THREE$1.Matrix4().makeRotationY(Math.PI));
	this._artoolkitProjectionAxisTransformMatrix.multiply(new THREE$1.Matrix4().makeRotationZ(Math.PI));

	// get cameraParameters
        var cameraParameters = new jsartoolkit5.ARCameraParam(_this.parameters.cameraParametersUrl, function(){
        	// init controller
                var arController = new jsartoolkit5.ARController(_this.parameters.canvasWidth, _this.parameters.canvasHeight, cameraParameters);
                _this.arController = arController;

		// honor this.parameters.imageSmoothingEnabled
		arController.ctx.mozImageSmoothingEnabled = _this.parameters.imageSmoothingEnabled;
		arController.ctx.webkitImageSmoothingEnabled = _this.parameters.imageSmoothingEnabled;
		arController.ctx.msImageSmoothingEnabled = _this.parameters.imageSmoothingEnabled;
		arController.ctx.imageSmoothingEnabled = _this.parameters.imageSmoothingEnabled;

		// honor this.parameters.debug
                if( _this.parameters.debug === true ){
			arController.debugSetup();
			arController.canvas.style.position = 'absolute';
			arController.canvas.style.top = '0px';
			arController.canvas.style.opacity = '0.6';
			arController.canvas.style.pointerEvents = 'none';
			arController.canvas.style.zIndex = '-1';
		}

		// setPatternDetectionMode
		var detectionModes = {
			'color'			: jsartoolkit5.artoolkit.AR_TEMPLATE_MATCHING_COLOR,
			'color_and_matrix'	: jsartoolkit5.artoolkit.AR_TEMPLATE_MATCHING_COLOR_AND_MATRIX,
			'mono'			: jsartoolkit5.artoolkit.AR_TEMPLATE_MATCHING_MONO,
			'mono_and_matrix'	: jsartoolkit5.artoolkit.AR_TEMPLATE_MATCHING_MONO_AND_MATRIX,
		};
		var detectionMode = detectionModes[_this.parameters.detectionMode];
		console.assert(detectionMode !== undefined);
		arController.setPatternDetectionMode(detectionMode);

		// setMatrixCodeType
		var matrixCodeTypes = {
			'3x3'		: jsartoolkit5.artoolkit.AR_MATRIX_CODE_3x3,
			'3x3_HAMMING63'	: jsartoolkit5.artoolkit.AR_MATRIX_CODE_3x3_HAMMING63,
			'3x3_PARITY65'	: jsartoolkit5.artoolkit.AR_MATRIX_CODE_3x3_PARITY65,
			'4x4'		: jsartoolkit5.artoolkit.AR_MATRIX_CODE_4x4,
			'4x4_BCH_13_9_3': jsartoolkit5.artoolkit.AR_MATRIX_CODE_4x4_BCH_13_9_3,
			'4x4_BCH_13_5_5': jsartoolkit5.artoolkit.AR_MATRIX_CODE_4x4_BCH_13_5_5,
		};
		var matrixCodeType = matrixCodeTypes[_this.parameters.matrixCodeType];
		console.assert(matrixCodeType !== undefined);
		arController.setMatrixCodeType(matrixCodeType);

		// set the patternRatio for artoolkit
		arController.setPattRatio(_this.parameters.patternRatio);

		// set thresholding in artoolkit
		// this seems to be the default
		// arController.setThresholdMode(artoolkit.AR_LABELING_THRESH_MODE_MANUAL)
		// adatative consume a LOT of cpu...
		// arController.setThresholdMode(artoolkit.AR_LABELING_THRESH_MODE_AUTO_ADAPTIVE)
		// arController.setThresholdMode(artoolkit.AR_LABELING_THRESH_MODE_AUTO_OTSU)

		// notify
                onCompleted();
        });
	return this
};

/**
 * return the projection matrix
 */
Context.prototype.getProjectionMatrix = function(srcElement){


// FIXME rename this function to say it is artoolkit specific - getArtoolkitProjectMatrix
// keep a backward compatibility with a console.warn

	console.assert( this.parameters.trackingBackend === 'artoolkit' );
	console.assert(this.arController, 'arController MUST be initialized to call this function');
	// get projectionMatrixArr from artoolkit
	var projectionMatrixArr = this.arController.getCameraMatrix();
	var projectionMatrix = new THREE$1.Matrix4().fromArray(projectionMatrixArr);

	// apply context._axisTransformMatrix - change artoolkit axis to match usual webgl one
	projectionMatrix.multiply(this._artoolkitProjectionAxisTransformMatrix);

	// return the result
	return projectionMatrix
};

Context.prototype._updateArtoolkit = function(srcElement){
	this.arController.process(srcElement);
};

//////////////////////////////////////////////////////////////////////////////
//		aruco specific
//////////////////////////////////////////////////////////////////////////////
Context.prototype._initAruco = function(onCompleted){
	this.arucoContext = new ArucoContext();

	// honor this.parameters.canvasWidth/.canvasHeight
	this.arucoContext.canvas.width = this.parameters.canvasWidth;
	this.arucoContext.canvas.height = this.parameters.canvasHeight;

	// honor this.parameters.imageSmoothingEnabled
	var context = this.arucoContext.canvas.getContext('2d');
	// context.mozImageSmoothingEnabled = this.parameters.imageSmoothingEnabled;
	context.webkitImageSmoothingEnabled = this.parameters.imageSmoothingEnabled;
	context.msImageSmoothingEnabled = this.parameters.imageSmoothingEnabled;
	context.imageSmoothingEnabled = this.parameters.imageSmoothingEnabled;


	setTimeout(function(){
		onCompleted();
	}, 0);
};


Context.prototype._updateAruco = function(srcElement){
	// console.log('update aruco here')
	var _this = this;
	var arMarkersControls = this._arMarkersControls;
        var detectedMarkers = this.arucoContext.detect(srcElement);

	detectedMarkers.forEach(function(detectedMarker){
		var foundControls = null;
		for(var i = 0; i < arMarkersControls.length; i++){
			console.assert( arMarkersControls[i].parameters.type === 'barcode' );
			if( arMarkersControls[i].parameters.barcodeValue === detectedMarker.id ){
				foundControls = arMarkersControls[i];
				break;
			}
		}
		if( foundControls === null )	return

		var tmpObject3d = new THREE$1.Object3D;
                _this.arucoContext.updateObject3D(tmpObject3d, foundControls._arucoPosit, foundControls.parameters.size, detectedMarker);
		tmpObject3d.updateMatrix();

		foundControls.updateWithModelViewMatrix(tmpObject3d.matrix);
	});
};

//////////////////////////////////////////////////////////////////////////////
//		tango specific
//////////////////////////////////////////////////////////////////////////////
Context.prototype._initTango = function(onCompleted){
	var _this = this;
	// check webvr is available
	if (navigator.getVRDisplays); else if (navigator.getVRDevices){
		alert("Your browser supports WebVR but not the latest version. See <a href='http://webvr.info'>webvr.info</a> for more info.");
	} else {
		alert("Your browser does not support WebVR. See <a href='http://webvr.info'>webvr.info</a> for assistance.");
	}


	this._tangoContext = {
		vrDisplay: null,
		vrPointCloud: null,
		frameData: new VRFrameData(),
	};


	// get vrDisplay
	navigator.getVRDisplays().then(function (vrDisplays){
		if( vrDisplays.length === 0 )	alert('no vrDisplays available');
		var vrDisplay = _this._tangoContext.vrDisplay = vrDisplays[0];

		console.log('vrDisplays.displayName :', vrDisplay.displayName);

		// init vrPointCloud
		if( vrDisplay.displayName === "Tango VR Device" ){
                	_this._tangoContext.vrPointCloud = new THREE$1.WebAR.VRPointCloud(vrDisplay, true);
		}

		// NOTE it doesnt seem necessary and it fails on tango
		// var canvasElement = document.createElement('canvas')
		// document.body.appendChild(canvasElement)
		// _this._tangoContext.requestPresent([{ source: canvasElement }]).then(function(){
		// 	console.log('vrdisplay request accepted')
		// });

		onCompleted();
	});
};


Context.prototype._updateTango = function(srcElement){
	// console.log('update aruco here')
	var _this = this;
	var arMarkersControls = this._arMarkersControls;
	var tangoContext= this._tangoContext;
	var vrDisplay = this._tangoContext.vrDisplay;

	// check vrDisplay is already initialized
	if( vrDisplay === null )	return


        // Update the point cloud. Only if the point cloud will be shown the geometry is also updated.
	if( vrDisplay.displayName === "Tango VR Device" ){
	        var showPointCloud = true;
		var pointsToSkip = 0;
	        _this._tangoContext.vrPointCloud.update(showPointCloud, pointsToSkip, true);
	}


	if( this._arMarkersControls.length === 0 )	return

	// TODO here do a fake search on barcode/1001 ?

	var foundControls = this._arMarkersControls[0];

	var frameData = this._tangoContext.frameData;

	// read frameData
	vrDisplay.getFrameData(frameData);

	if( frameData.pose.position === null )		return
	if( frameData.pose.orientation === null )	return

	// create cameraTransformMatrix
	var position = new THREE$1.Vector3().fromArray(frameData.pose.position);
	var quaternion = new THREE$1.Quaternion().fromArray(frameData.pose.orientation);
	var scale = new THREE$1.Vector3(1,1,1);
	var cameraTransformMatrix = new THREE$1.Matrix4().compose(position, quaternion, scale);
	// compute modelViewMatrix from cameraTransformMatrix
	var modelViewMatrix = new THREE$1.Matrix4();
	modelViewMatrix.getInverse( cameraTransformMatrix );

	foundControls.updateWithModelViewMatrix(modelViewMatrix);

	// console.log('position', position)
	// if( position.x !== 0 ||  position.y !== 0 ||  position.z !== 0 ){
	// 	console.log('vrDisplay tracking')
	// }else{
	// 	console.log('vrDisplay NOT tracking')
	// }

};

/**
 * - lerp position/quaternino/scale
 * - minDelayDetected
 * - minDelayUndetected
 * @param {[type]} object3d   [description]
 * @param {[type]} parameters [description]
 */
const SmoothedControls = function(object3d, parameters){
	var _this = this;
	
	ArBaseControls.call(this, object3d);
	
	// copy parameters
	this.object3d.visible = false;
	
	this._lastLerpStepAt = null;
	this._visibleStartedAt = null;
	this._unvisibleStartedAt = null;

	// handle default parameters
	parameters = parameters || {};
	this.parameters = {
		// lerp coeficient for the position - between [0,1] - default to 1
		lerpPosition: 0.8,
		// lerp coeficient for the quaternion - between [0,1] - default to 1
		lerpQuaternion: 0.2,
		// lerp coeficient for the scale - between [0,1] - default to 1
		lerpScale: 0.7,
		// delay for lerp fixed steps - in seconds - default to 1/120
		lerpStepDelay: 1/60,
		// minimum delay the sub-control must be visible before this controls become visible - default to 0 seconds
		minVisibleDelay: 0.0,
		// minimum delay the sub-control must be unvisible before this controls become unvisible - default to 0 seconds
		minUnvisibleDelay: 0.2,
	};
	
	//////////////////////////////////////////////////////////////////////////////
	//		setParameters
	//////////////////////////////////////////////////////////////////////////////
	setParameters(parameters);
	function setParameters(parameters){
		if( parameters === undefined )	return
		for( var key in parameters ){
			var newValue = parameters[ key ];

			if( newValue === undefined ){
				console.warn( "THREEx.ArSmoothedControls: '" + key + "' parameter is undefined." );
				continue
			}

			var currentValue = _this.parameters[ key ];

			if( currentValue === undefined ){
				console.warn( "THREEx.ArSmoothedControls: '" + key + "' is not a property of this material." );
				continue
			}

			_this.parameters[ key ] = newValue;
		}
	}
};
	
SmoothedControls.prototype = Object.create( ArBaseControls.prototype );
SmoothedControls.prototype.constructor = SmoothedControls;

//////////////////////////////////////////////////////////////////////////////
//		update function
//////////////////////////////////////////////////////////////////////////////

SmoothedControls.prototype.update = function(targetObject3d){
	var object3d = this.object3d;
	var parameters = this.parameters;
	var wasVisible = object3d.visible;
	var present = performance.now()/1000;


	//////////////////////////////////////////////////////////////////////////////
	//		handle object3d.visible with minVisibleDelay/minUnvisibleDelay
	//////////////////////////////////////////////////////////////////////////////
	if( targetObject3d.visible === false )	this._visibleStartedAt = null;
	if( targetObject3d.visible === true )	this._unvisibleStartedAt = null;

	if( targetObject3d.visible === true && this._visibleStartedAt === null )	this._visibleStartedAt = present;
	if( targetObject3d.visible === false && this._unvisibleStartedAt === null )	this._unvisibleStartedAt = present;

	if( wasVisible === false && targetObject3d.visible === true ){
		var visibleFor = present - this._visibleStartedAt;
		if( visibleFor >= this.parameters.minVisibleDelay ){
			object3d.visible = true;
			snapDirectlyToTarget();
		}
		// console.log('visibleFor', visibleFor)
	}

	if( wasVisible === true && targetObject3d.visible === false ){
		var unvisibleFor = present - this._unvisibleStartedAt;
		if( unvisibleFor >= this.parameters.minUnvisibleDelay ){
			object3d.visible = false;			
		}
	}
	
	//////////////////////////////////////////////////////////////////////////////
	//		apply lerp on positon/quaternion/scale
	//////////////////////////////////////////////////////////////////////////////

	// apply lerp steps - require fix time steps to behave the same no matter the fps
	if( this._lastLerpStepAt === null ){
		applyOneSlerpStep();
		this._lastLerpStepAt = present;
	}else{
		var nStepsToDo = Math.floor( (present - this._lastLerpStepAt)/this.parameters.lerpStepDelay );
		for(var i = 0; i < nStepsToDo; i++){
			applyOneSlerpStep();
			this._lastLerpStepAt += this.parameters.lerpStepDelay;
		}
	}

	// update the matrix
	this.object3d.updateMatrix();

	//////////////////////////////////////////////////////////////////////////////
	//		honor becameVisible/becameUnVisible event
	//////////////////////////////////////////////////////////////////////////////
	// honor becameVisible event
	if( wasVisible === false && object3d.visible === true ){
		this.dispatchEvent({ type: 'becameVisible' });
	}
	// honor becameUnVisible event
	if( wasVisible === true && object3d.visible === false ){
		this.dispatchEvent({ type: 'becameUnVisible' });
	}
	return

	function snapDirectlyToTarget(){
		object3d.position.copy( targetObject3d.position );
		object3d.quaternion.copy( targetObject3d.quaternion );
		object3d.scale.copy( targetObject3d.scale );
	}	
	
	function applyOneSlerpStep(){
		object3d.position.lerp(targetObject3d.position, parameters.lerpPosition);
		object3d.quaternion.slerp(targetObject3d.quaternion, parameters.lerpQuaternion);
		object3d.scale.lerp(targetObject3d.scale, parameters.lerpScale);
	}
};

const ArToolkitSource$1 = three => Source(three);
const ArToolkitContext = Context;
const ArMarkerControls = MarkerControls;
const ArSmoothedControls = SmoothedControls;

exports.ArToolkitSource = ArToolkitSource$1;
exports.ArToolkitContext = ArToolkitContext;
exports.ArMarkerControls = ArMarkerControls;
exports.ArSmoothedControls = ArSmoothedControls;
