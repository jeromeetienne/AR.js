if ('function' === typeof importScripts) {
    importScripts('../build/artoolkit.min.js');

    self.onmessage = function (e) {
        var msg = e.data;
        switch (msg.type) {
            case "load": {
                load(msg);
                return;
            }
        }
    };

    function load(msg) {
        var path = '../../';
        var onLoad = function () {
            var ar = new ARController(msg.pw, msg.ph, param);

            ar.addEventListener('getNFTMarker', function (ev) {
                postMessage({
                    type: "found",
                    matrix: JSON.stringify(ev.data.matrix),
                });
            });

            ar.loadNFTMarker(path + msg.marker, function (markerId) {
                ar.trackNFTMarkerId(markerId);
            }, function(err) {
                console.log('Error in loading marker on Worker', err)
            });
        };

        var onError = function (error) {
            console.error(error);
        };

        var param = new ARCameraParam(path + msg.param, onLoad, onError);
    }
}
