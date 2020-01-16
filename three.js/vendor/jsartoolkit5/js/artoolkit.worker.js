if ('function' === typeof importScripts) {
    //importScripts('artoolkit.min.js');
    importScripts('../build/artoolkit.min.js');

    self.onmessage = function (e) {
        var msg = e.data;
        switch (msg.type) {
            case "load": {
                load(msg);
                return;
            }
            case "process": {
                next = msg.imagedata;
                process();
                return;
            }
        }
    };

    var next = null;

    var ar = null;
    var markerResult = null;

    function load(msg) {
        var onLoad = function () {
            ar = new ARController(msg.pw, msg.ph, param);
            var cameraMatrix = ar.getCameraMatrix();

            ar.addEventListener('getNFTMarker', function (ev) {
                // old code to remove:
                // markerResult = { type: "found", matrixGL_RH: JSON.stringify(ev.data.matrixGL_RH), proj: JSON.stringify(cameraMatrix) };

                // i'm sending only .matrix as AR.js uses only that for pattern markers and barcode markers
                markerResult = { type: "found", matrix: JSON.stringify(ev.data.matrix) };
            });

            ar.loadNFTMarker(msg.marker.url, function (markerId) {
                ar.trackNFTMarkerId(markerId, 2);
                postMessage({ type: "endLoading", end: true })
            });

            postMessage({ type: "loaded", proj: JSON.stringify(cameraMatrix) });
        };

        var onError = function (error) {
            console.error(error);
        };

        var param = new ARCameraParam('../../../../data/data/camera_para-iPhone 5 rear 640x480 1.0m.dat', onLoad, onError);
    }

    function process() {
        markerResult = null;

        if (ar) {
            ar.process(next);
        }

        if (markerResult) {
            postMessage(markerResult);
        } else {
            postMessage({ type: "not found" });
        }

        next = null;
    }
}
