var ARjs = ARjs || {}
var THREEx = THREEx || {}

ARjs.Context = THREEx.ArToolkitContext = function (parameters, sourceParameters) {
    var _this = this

    _this._updatedAt = null

    // handle default parameters
    this.parameters = {
        // AR backend - ['artoolkit']
        trackingBackend: 'artoolkit',
        // debug - true if one should display artoolkit debug canvas, false otherwise
        debug: false,
        // the mode of detection - ['color', 'color_and_matrix', 'mono', 'mono_and_matrix']
        detectionMode: 'mono',
        // type of matrix code - valid iif detectionMode end with 'matrix' - [3x3, 3x3_HAMMING63, 3x3_PARITY65, 4x4, 4x4_BCH_13_9_3, 4x4_BCH_13_5_5]
        matrixCodeType: '3x3',

        // url of the camera parameters
        cameraParametersUrl: ARjs.Context.baseURL + 'parameters/camera_para.dat',

        // tune the maximum rate of pose detection in the source image
        maxDetectionRate: 60,
        // resolution of at which we detect pose in the source image
        canvasWidth: 640,
        canvasHeight: 480,

        // to use sourceWidth and sourceHeight if passed as input
        sourceWidth: sourceParameters.sourceWidth || 640,
        sourceHeight: sourceParameters.sourceHeight || 480,

        // the patternRatio inside the artoolkit marker - artoolkit only
        patternRatio: 0.5,

        // enable image smoothing or not for canvas copy - default to true
        // https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/imageSmoothingEnabled
        imageSmoothingEnabled: false,
    }
    // parameters sanity check
    console.assert(['artoolkit'].indexOf(this.parameters.trackingBackend) !== -1, 'invalid parameter trackingBackend', this.parameters.trackingBackend)
    console.assert(['color', 'color_and_matrix', 'mono', 'mono_and_matrix'].indexOf(this.parameters.detectionMode) !== -1, 'invalid parameter detectionMode', this.parameters.detectionMode)

    this.arController = null;

    _this.initialized = false


    this._arMarkersControls = []

    //////////////////////////////////////////////////////////////////////////////
    //		setParameters
    //////////////////////////////////////////////////////////////////////////////
    setParameters(parameters)
    function setParameters(parameters) {
        if (parameters === undefined) return
        for (var key in parameters) {
            var newValue = parameters[key]

            if (newValue === undefined) {
                console.warn("THREEx.ArToolkitContext: '" + key + "' parameter is undefined.")
                continue
            }

            var currentValue = _this.parameters[key]

            if (currentValue === undefined) {
                console.warn("THREEx.ArToolkitContext: '" + key + "' is not a property of this material.")
                continue
            }

            _this.parameters[key] = newValue
        }
    }
}

Object.assign(ARjs.Context.prototype, THREE.EventDispatcher.prototype);

// ARjs.Context.baseURL = '../'
// default to github page
ARjs.Context.baseURL = 'https://jeromeetienne.github.io/AR.js/three.js/'
ARjs.Context.REVISION = '2.1.4';

/**
 * Create a default camera for this trackingBackend
 * @param {string} trackingBackend - the tracking to user
 * @return {THREE.Camera} the created camera
 */
ARjs.Context.createDefaultCamera = function (trackingBackend) {
    console.assert(false, 'use ARjs.Utils.createDefaultCamera instead')
    // Create a camera
    if (trackingBackend === 'artoolkit') {
        var camera = new THREE.Camera();
    } else console.assert(false)
    return camera
}


//////////////////////////////////////////////////////////////////////////////
//		init functions
//////////////////////////////////////////////////////////////////////////////
ARjs.Context.prototype.init = function (onCompleted) {
    var _this = this
    if (this.parameters.trackingBackend === 'artoolkit') {
        this._initArtoolkit(done)
    } else console.assert(false)
    return

    function done() {
        // dispatch event
        _this.dispatchEvent({
            type: 'initialized'
        });

        _this.initialized = true

        onCompleted && onCompleted()
    }

}
////////////////////////////////////////////////////////////////////////////////
//          update function
////////////////////////////////////////////////////////////////////////////////
ARjs.Context.prototype.update = function (srcElement) {

    // be sure arController is fully initialized
    if (this.parameters.trackingBackend === 'artoolkit' && this.arController === null) return false;

    // honor this.parameters.maxDetectionRate
    var present = performance.now()
    if (this._updatedAt !== null && present - this._updatedAt < 1000 / this.parameters.maxDetectionRate) {
        return false
    }
    this._updatedAt = present

    // mark all markers to invisible before processing this frame
    this._arMarkersControls.forEach(function (markerControls) {
        if (!markerControls.context.arController.showObject) {
            markerControls.object3d.visible = false
        }
    })

    // process this frame
    if (this.parameters.trackingBackend === 'artoolkit') {
        this._updateArtoolkit(srcElement)
    } else {
        console.assert(false)
    }

    // dispatch event
    this.dispatchEvent({
        type: 'sourceProcessed'
    });


    // return true as we processed the frame
    return true;
}

////////////////////////////////////////////////////////////////////////////////
//          Add/Remove markerControls
////////////////////////////////////////////////////////////////////////////////
ARjs.Context.prototype.addMarker = function (arMarkerControls) {
    console.assert(arMarkerControls instanceof THREEx.ArMarkerControls)
    this._arMarkersControls.push(arMarkerControls)
}

ARjs.Context.prototype.removeMarker = function (arMarkerControls) {
    console.assert(arMarkerControls instanceof THREEx.ArMarkerControls)
    // console.log('remove marker for', arMarkerControls)
    var index = this.arMarkerControlss.indexOf(artoolkitMarker);
    console.assert(index !== index)
    this._arMarkersControls.splice(index, 1)
}

//////////////////////////////////////////////////////////////////////////////
//		artoolkit specific
//////////////////////////////////////////////////////////////////////////////
ARjs.Context.prototype._initArtoolkit = function (onCompleted) {
    var _this = this

    // set this._artoolkitProjectionAxisTransformMatrix to change artoolkit projection matrix axis to match usual webgl one
    this._artoolkitProjectionAxisTransformMatrix = new THREE.Matrix4()
    this._artoolkitProjectionAxisTransformMatrix.multiply(new THREE.Matrix4().makeRotationY(Math.PI))
    this._artoolkitProjectionAxisTransformMatrix.multiply(new THREE.Matrix4().makeRotationZ(Math.PI))

    // get cameraParameters
    var cameraParameters = new ARCameraParam(_this.parameters.cameraParametersUrl, function () {
        // init controller
        var arController = new ARController(_this.parameters.canvasWidth, _this.parameters.canvasHeight, cameraParameters);
        _this.arController = arController

        // honor this.parameters.imageSmoothingEnabled
        arController.ctx.mozImageSmoothingEnabled = _this.parameters.imageSmoothingEnabled;
        arController.ctx.webkitImageSmoothingEnabled = _this.parameters.imageSmoothingEnabled;
        arController.ctx.msImageSmoothingEnabled = _this.parameters.imageSmoothingEnabled;
        arController.ctx.imageSmoothingEnabled = _this.parameters.imageSmoothingEnabled;

        // honor this.parameters.debug
        if (_this.parameters.debug === true) {
            arController.debugSetup();
            arController.canvas.style.position = 'absolute'
            arController.canvas.style.top = '0px'
            arController.canvas.style.opacity = '0.6'
            arController.canvas.style.pointerEvents = 'none'
            arController.canvas.style.zIndex = '-1'
        }

        // setPatternDetectionMode
        var detectionModes = {
            'color': artoolkit.AR_TEMPLATE_MATCHING_COLOR,
            'color_and_matrix': artoolkit.AR_TEMPLATE_MATCHING_COLOR_AND_MATRIX,
            'mono': artoolkit.AR_TEMPLATE_MATCHING_MONO,
            'mono_and_matrix': artoolkit.AR_TEMPLATE_MATCHING_MONO_AND_MATRIX,
        }
        var detectionMode = detectionModes[_this.parameters.detectionMode]
        console.assert(detectionMode !== undefined)
        arController.setPatternDetectionMode(detectionMode);

        // setMatrixCodeType
        var matrixCodeTypes = {
            '3x3': artoolkit.AR_MATRIX_CODE_3x3,
            '3x3_HAMMING63': artoolkit.AR_MATRIX_CODE_3x3_HAMMING63,
            '3x3_PARITY65': artoolkit.AR_MATRIX_CODE_3x3_PARITY65,
            '4x4': artoolkit.AR_MATRIX_CODE_4x4,
            '4x4_BCH_13_9_3': artoolkit.AR_MATRIX_CODE_4x4_BCH_13_9_3,
            '4x4_BCH_13_5_5': artoolkit.AR_MATRIX_CODE_4x4_BCH_13_5_5,
        }
        var matrixCodeType = matrixCodeTypes[_this.parameters.matrixCodeType]
        console.assert(matrixCodeType !== undefined)
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
        onCompleted()
    })
    return this
}

/**
 * return the projection matrix
 */
ARjs.Context.prototype.getProjectionMatrix = function () {
    // FIXME rename this function to say it is artoolkit specific - getArtoolkitProjectMatrix
    // keep a backward compatibility with a console.warn

    console.assert(this.parameters.trackingBackend === 'artoolkit')
    console.assert(this.arController, 'arController MUST be initialized to call this function')

    // get projectionMatrixArr from artoolkit
    var projectionMatrixArr = this.arController.getCameraMatrix();
    var projectionMatrix = new THREE.Matrix4().fromArray(projectionMatrixArr)

    return projectionMatrix
}

ARjs.Context.prototype._updateArtoolkit = function (srcElement) {
    this.arController.process(srcElement)
}
