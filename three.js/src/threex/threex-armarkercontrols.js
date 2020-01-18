var ARjs = ARjs || {}
var THREEx = THREEx || {}

ARjs.MarkerControls = THREEx.ArMarkerControls = function (context, object3d, parameters) {
    var _this = this

    THREEx.ArBaseControls.call(this, object3d)

    this.context = context
    // handle default parameters
    this.parameters = {
        // size of the marker in meter
        size: 1,
        // type of marker - ['pattern', 'barcode', 'nft', 'unknown' ]
        type: 'unknown',
        // url of the pattern - IIF type='pattern'
        patternUrl: null,
        // value of the barcode - IIF type='barcode'
        barcodeValue: null,
        // url of the descriptors of image - IIF type='nft'
        descriptorsUrl: null,
        // change matrix mode - [modelViewMatrix, cameraTransformMatrix]
        changeMatrixMode: 'modelViewMatrix',
        // minimal confidence in the marke recognition - between [0, 1] - default to 1
        minConfidence: 0.6,
        // turn on/off camera smoothing
        smooth: false,
        // number of matrices to smooth tracking over, more = smoother but slower follow
        smoothCount: 5,
        // distance tolerance for smoothing, if smoothThreshold # of matrices are under tolerance, tracking will stay still
        smoothTolerance: 0.01,
        // threshold for smoothing, will keep still unless enough matrices are over tolerance
        smoothThreshold: 2,
    }

    // sanity check
    var possibleValues = ['pattern', 'barcode', 'nft', 'unknown']
    console.assert(possibleValues.indexOf(this.parameters.type) !== -1, 'illegal value', this.parameters.type)
    var possibleValues = ['modelViewMatrix', 'cameraTransformMatrix']
    console.assert(possibleValues.indexOf(this.parameters.changeMatrixMode) !== -1, 'illegal value', this.parameters.changeMatrixMode)


    // create the marker Root
    this.object3d = object3d
    this.object3d.matrixAutoUpdate = false;
    this.object3d.visible = false

    //////////////////////////////////////////////////////////////////////////////
    //		setParameters
    //////////////////////////////////////////////////////////////////////////////
    setParameters(parameters)
    function setParameters(parameters) {
        if (parameters === undefined) return
        for (var key in parameters) {
            var newValue = parameters[key]

            if (newValue === undefined) {
                console.warn("THREEx.ArMarkerControls: '" + key + "' parameter is undefined.")
                continue
            }

            var currentValue = _this.parameters[key]

            if (currentValue === undefined) {
                console.warn("THREEx.ArMarkerControls: '" + key + "' is not a property of this material.")
                continue
            }

            _this.parameters[key] = newValue
        }
    }

    if (this.parameters.smooth) {
        this.smoothMatrices = []; // last DEBOUNCE_COUNT modelViewMatrix
    }

    //////////////////////////////////////////////////////////////////////////////
    //		Code Separator
    //////////////////////////////////////////////////////////////////////////////
    // add this marker to artoolkitsystem
    // TODO rename that .addMarkerControls
    context.addMarker(this)

    if (_this.context.parameters.trackingBackend === 'artoolkit') {
        this._initArtoolkit()
    } else console.assert(false)
}

ARjs.MarkerControls.prototype = Object.create(THREEx.ArBaseControls.prototype);
ARjs.MarkerControls.prototype.constructor = THREEx.ArMarkerControls;

ARjs.MarkerControls.prototype.dispose = function () {
    this.context.removeMarker(this)
}

//////////////////////////////////////////////////////////////////////////////
//		update controls with new modelViewMatrix
//////////////////////////////////////////////////////////////////////////////

/**
 * When you actually got a new modelViewMatrix, you need to perfom a whole bunch
 * of things. it is done here.
 */
ARjs.MarkerControls.prototype.updateWithModelViewMatrix = function (modelViewMatrix) {
    var markerObject3D = this.object3d;

    // mark object as visible
    markerObject3D.visible = true

    if (this.context.parameters.trackingBackend === 'artoolkit') {
        // apply context._axisTransformMatrix - change artoolkit axis to match usual webgl one
        var tmpMatrix = new THREE.Matrix4().copy(this.context._artoolkitProjectionAxisTransformMatrix)
        tmpMatrix.multiply(modelViewMatrix)

        modelViewMatrix.copy(tmpMatrix)
    } else console.assert(false)

    var renderReqd = false;

    // change markerObject3D.matrix based on parameters.changeMatrixMode
    if (this.parameters.changeMatrixMode === 'modelViewMatrix') {
        if (this.parameters.smooth) {
            var sum,
                i, j,
                averages, // average values for matrix over last smoothCount
                exceedsAverageTolerance = 0;

            this.smoothMatrices.push(modelViewMatrix.elements.slice()); // add latest

            if (this.smoothMatrices.length < (this.parameters.smoothCount + 1)) {
                markerObject3D.matrix.copy(modelViewMatrix); // not enough for average
            } else {
                this.smoothMatrices.shift(); // remove oldest entry
                averages = [];

                for (i in modelViewMatrix.elements) { // loop over entries in matrix
                    sum = 0;
                    for (j in this.smoothMatrices) { // calculate average for this entry
                        sum += this.smoothMatrices[j][i];
                    }
                    averages[i] = sum / this.parameters.smoothCount;
                    // check how many elements vary from the average by at least AVERAGE_MATRIX_TOLERANCE
                    if (Math.abs(averages[i] - modelViewMatrix.elements[i]) >= this.parameters.smoothTolerance) {
                        exceedsAverageTolerance++;
                    }
                }

                // if moving (i.e. at least AVERAGE_MATRIX_THRESHOLD entries are over AVERAGE_MATRIX_TOLERANCE)
                if (exceedsAverageTolerance >= this.parameters.smoothThreshold) {
                    // then update matrix values to average, otherwise, don't render to minimize jitter
                    for (i in modelViewMatrix.elements) {
                        modelViewMatrix.elements[i] = averages[i];
                    }
                    markerObject3D.matrix.copy(modelViewMatrix);
                    renderReqd = true; // render required in animation loop
                }
            }
        } else {
            markerObject3D.matrix.copy(modelViewMatrix)
        }
    } else if (this.parameters.changeMatrixMode === 'cameraTransformMatrix') {
        markerObject3D.matrix.getInverse(modelViewMatrix)
    } else {
        console.assert(false)
    }

    // decompose - the matrix into .position, .quaternion, .scale
    markerObject3D.matrix.decompose(markerObject3D.position, markerObject3D.quaternion, markerObject3D.scale)

    // dispatchEvent
    this.dispatchEvent({ type: 'markerFound' });

    return renderReqd;
}

//////////////////////////////////////////////////////////////////////////////
//		utility functions
//////////////////////////////////////////////////////////////////////////////

ARjs.MarkerControls.prototype.name = function () {
    var name = '';
    name += this.parameters.type;

    if (this.parameters.type === 'pattern') {
        var url = this.parameters.patternUrl;
        var basename = url.replace(/^.*\//g, '');
        name += ' - ' + basename;
    } else if (this.parameters.type === 'barcode') {
        name += ' - ' + this.parameters.barcodeValue;
    } else if (this.parameters.type === 'nft') {
        var url = this.parameters.descriptorsUrl;
        var basename = url.replace(/^.*\//g, '');
        name += ' - ' + basename;
    } else {
        console.assert(false, 'no .name() implemented for this marker controls');
    }

    return name;
}

//////////////////////////////////////////////////////////////////////////////
//		init for Artoolkit
//////////////////////////////////////////////////////////////////////////////
ARjs.MarkerControls.prototype._initArtoolkit = function () {
    var _this = this

    var artoolkitMarkerId = null

    var delayedInitTimerId = setInterval(function () {
        // check if arController is init
        var arController = _this.context.arController
        if (arController === null) return
        // stop looping if it is init
        clearInterval(delayedInitTimerId)
        delayedInitTimerId = null
        // launch the _postInitArtoolkit
        postInit()
    }, 1000 / 50)

    return

    function postInit() {
        // check if arController is init
        var arController = _this.context.arController
        console.assert(arController !== null)

        // start tracking this pattern
        if (_this.parameters.type === 'pattern') {
            arController.loadMarker(_this.parameters.patternUrl, function (markerId) {
                artoolkitMarkerId = markerId
                arController.trackPatternMarkerId(artoolkitMarkerId, _this.parameters.size);
            });
        } else if (_this.parameters.type === 'barcode') {
            artoolkitMarkerId = _this.parameters.barcodeValue
            arController.trackBarcodeMarkerId(artoolkitMarkerId, _this.parameters.size);
        } else if (_this.parameters.type === 'nft') {
            // use workers as default
            handleNFT(_this.parameters.descriptorsUrl, arController);
        } else if (_this.parameters.type === 'unknown') {
            artoolkitMarkerId = null
        } else {
            console.log(false, 'invalid marker type', _this.parameters.type)
        }

        // listen to the event
        arController.addEventListener('getMarker', function (event) {
            if (event.data.type === artoolkit.PATTERN_MARKER && _this.parameters.type === 'pattern') {
                if (artoolkitMarkerId === null) return
                if (event.data.marker.idPatt === artoolkitMarkerId) onMarkerFound(event)
            } else if (event.data.type === artoolkit.BARCODE_MARKER && _this.parameters.type === 'barcode') {
                if (artoolkitMarkerId === null) return
                if (event.data.marker.idMatrix === artoolkitMarkerId) onMarkerFound(event)
            } else if (event.data.type === artoolkit.UNKNOWN_MARKER && _this.parameters.type === 'unknown') {
                onMarkerFound(event)
            }
        })
    }

    function handleNFT(descriptorsUrl, arController) {
        // create a Worker to handle loading of NFT marker and tracking of it
        var worker = new Worker('../vendor/jsartoolkit5/js/artoolkit.worker.js');

        var pw = arController.canvas.width;
        var ph = arController.canvas.height;

        var context_process = arController.canvas.getContext('2d');

        function process() {
            var imageData = context_process.getImageData(0, 0, pw, ph);
            worker.postMessage({ type: "process", imagedata: imageData }, [imageData.data.buffer]);
        }

        // initialize the worker
        worker.postMessage({
            type: 'init',
            pw: pw,
            ph: ph,
            marker: descriptorsUrl,
            param: arController.cameraParam.src,
        });

        function multiplyMatrices(a, b) {
            var ae = a;
            var be = b;
            var te = new Float64Array(16);

            var a11 = ae[0], a12 = ae[4], a13 = ae[8], a14 = ae[12];
            var a21 = ae[1], a22 = ae[5], a23 = ae[9], a24 = ae[13];
            var a31 = ae[2], a32 = ae[6], a33 = ae[10], a34 = ae[14];
            var a41 = ae[3], a42 = ae[7], a43 = ae[11], a44 = ae[15];

            var b11 = be[0], b12 = be[4], b13 = be[8], b14 = be[12];
            var b21 = be[1], b22 = be[5], b23 = be[9], b24 = be[13];
            var b31 = be[2], b32 = be[6], b33 = be[10], b34 = be[14];
            var b41 = be[3], b42 = be[7], b43 = be[11], b44 = be[15];

            te[0] = a11 * b11 + a12 * b21 + a13 * b31 + a14 * b41;
            te[4] = a11 * b12 + a12 * b22 + a13 * b32 + a14 * b42;
            te[8] = a11 * b13 + a12 * b23 + a13 * b33 + a14 * b43;
            te[12] = a11 * b14 + a12 * b24 + a13 * b34 + a14 * b44;

            te[1] = a21 * b11 + a22 * b21 + a23 * b31 + a24 * b41;
            te[5] = a21 * b12 + a22 * b22 + a23 * b32 + a24 * b42;
            te[9] = a21 * b13 + a22 * b23 + a23 * b33 + a24 * b43;
            te[13] = a21 * b14 + a22 * b24 + a23 * b34 + a24 * b44;

            te[2] = a31 * b11 + a32 * b21 + a33 * b31 + a34 * b41;
            te[6] = a31 * b12 + a32 * b22 + a33 * b32 + a34 * b42;
            te[10] = a31 * b13 + a32 * b23 + a33 * b33 + a34 * b43;
            te[14] = a31 * b14 + a32 * b24 + a33 * b34 + a34 * b44;

            te[3] = a41 * b11 + a42 * b21 + a43 * b31 + a44 * b41;
            te[7] = a41 * b12 + a42 * b22 + a43 * b32 + a44 * b42;
            te[11] = a41 * b13 + a42 * b23 + a43 * b33 + a44 * b43;
            te[15] = a41 * b14 + a42 * b24 + a43 * b34 + a44 * b44;

            return te;
        }

        worker.onmessage = function (ev) {
            if (ev && ev.data && ev.data.type === 'found') {
                var proj = JSON.parse(ev.data.proj);
                var world = JSON.parse(ev.data.matrixGL_RH);

                // ~nicolocarpignoli the mulyiply matrixes is needed?
                var mat = multiplyMatrices(proj, world);

                onMarkerFound({
                    data: {
                        type: artoolkit.NFT_MARKER,
                        matrix: mat,
                    }
                });
            }

            // ~nicolocarpignoli this means that this run as a loop. Maybe we can add a minimal setTimeout
            // otherwise it stresses the CPU and battery of device
            process();
        };

        // start the loop
        process();
    }

    function onMarkerFound(event) {
        if (event.data.type === artoolkit.PATTERN_MARKER && event.data.marker.cfPatt < _this.parameters.minConfidence) return
        if (event.data.type === artoolkit.BARCODE_MARKER && event.data.marker.cfMatt < _this.parameters.minConfidence) return

        var modelViewMatrix = new THREE.Matrix4().fromArray(event.data.matrix)
        _this.updateWithModelViewMatrix(modelViewMatrix)
    }
}
