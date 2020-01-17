var THREEx = THREEx || {}

THREEx.ArNFTWorker = function (object3d, renderer) {
    //this.id = id;
    this.object3d = object3d;
    this.renderer = renderer;
}

var interpolationFactor = 24;

var trackedMatrix = {
    // for interpolation
    delta: [
        0, 0, 0, 0,
        0, 0, 0, 0,
        0, 0, 0, 0,
        0, 0, 0, 0
    ],
    interpolated: [
        0, 0, 0, 0,
        0, 0, 0, 0,
        0, 0, 0, 0,
        0, 0, 0, 0
    ]
}

Object.assign(THREEx.ArNFTWorker.prototype, THREE.EventDispatcher.prototype);

var isMobile = function () {
    return /Android|mobile|iPad|iPhone/i.test(navigator.userAgent);
}

var setMatrix = function (matrix, value) {
    var array = [];
    for (var key in value) {
        array[key] = value[key];
    }
    if (typeof matrix.elements.set === "function") {
        matrix.elements.set(array);
    } else {
        matrix.elements = [].slice.call(array);
    }
};

THREEx.ArNFTWorker.prototype.start = function (container, marker, video, input_width, input_height, canvas_draw, onMarkerFound) {
    var vw, vh;
    var sw, sh;
    var pscale, sscale;
    var w, h;
    var pw, ph;
    var ox, oy;
    var worker;

    var canvas_process = document.createElement('canvas');
    var context_process = canvas_process.getContext('2d');

    var scene = new THREE.Scene();

    var camera = new THREE.Camera();
    camera.matrixAutoUpdate = false;

    scene.add(camera);

    var root = new THREE.Object3D();

    scene.add(root);

    root.matrixAutoUpdate = false;
    var obj3D = this.object3d;
    obj3D.name = 'obj_3d';
    root.add(obj3D);

    var load = function () {
        vw = input_width;
        vh = input_height;

        pscale = 320 / Math.max(vw, vh / 3 * 4);
        sscale = isMobile() ? window.outerWidth / input_width : 1;

        sw = vw * sscale;
        sh = vh * sscale;
        video.style.width = sw + "px";
        video.style.height = sh + "px";
        container.style.width = sw + "px";
        container.style.height = sh + "px";
        canvas_draw.style.clientWidth = sw + "px";
        canvas_draw.style.clientHeight = sh + "px";
        canvas_draw.width = sw;
        canvas_draw.height = sh;
        w = vw * pscale;
        h = vh * pscale;
        pw = Math.max(w, h / 3 * 4);
        ph = Math.max(h, w / 4 * 3);
        ox = (pw - w) / 2;
        oy = (ph - h) / 2;
        canvas_process.style.clientWidth = pw + "px";
        canvas_process.style.clientHeight = ph + "px";
        canvas_process.width = pw;
        canvas_process.height = ph;

        this.renderer.setSize(sw, sh);

        worker = new Worker('../vendor/jsartoolkit5/js/artoolkit.worker.js');

        worker.postMessage({
            type: "load",
            pw: pw,
            ph: ph,
            marker: marker
        });

        worker.onmessage = function (ev) {
            var msg = ev.data;
            switch (msg.type) {
                case "loaded": {
                    var proj = JSON.parse(msg.proj);
                    var ratioW = pw / w;
                    var ratioH = ph / h;
                    proj[0] *= ratioW;
                    proj[4] *= ratioW;
                    proj[8] *= ratioW;
                    proj[12] *= ratioW;
                    proj[1] *= ratioH;
                    proj[5] *= ratioH;
                    proj[9] *= ratioH;
                    proj[13] *= ratioH;
                    setMatrix(camera.projectionMatrix, proj);
                    break;
                }

                case "endLoading": {
                    if (msg.end == true) {
                        // removing loader if present
                        var loader = document.getElementById('arjs-nft-loading');
                        if (loader) {
                            loader.parentElement.removeChild(loader);
                        }
                    }
                    break;
                }

                case "found": {
                    onMarkerFound(ev);

                    if (!msg) {
                      obj3D.visible = false;
                    } else {
                      obj3D.visible = true;
                    }
                    // old code, now let AR.js handle the rendering
                    // found(msg);
                    break;
                }
                case "not found": {
                    found(null);
                    break;
                }
            }
            process();
        };
    };

    var lastmsg = null;
    var found = function (msg) {
        lastmsg = msg;
    };

    var lasttime = Date.now();

    function process() {
        context_process.fillStyle = "black";
        context_process.fillRect(0, 0, pw, ph);
        context_process.drawImage(video, 0, 0, vw, vh, ox, oy, w, h);

        var imageData = context_process.getImageData(0, 0, pw, ph);
        worker.postMessage({ type: "process", imagedata: imageData }, [
            imageData.data.buffer
        ]);
    }

    // var tick = function () {
    //     draw();
    //     requestAnimationFrame(tick);
    // };

    // var time = 0;

    // var draw = function () {
    //     var now = Date.now();
    //     var dt = now - lasttime;
    //     time += dt;
    //     lasttime = now;

    //     if (!lastmsg) {
    //         obj3D.visible = false;
    //     } else {
    //         obj3D.visible = true;

    //         var world = JSON.parse(lastmsg.matrixGL_RH);

    //         // interpolate matrix
    //         for (var i = 0; i < 16; i++) {
    //             trackedMatrix.delta[i] = world[i] - trackedMatrix.interpolated[i];
    //             trackedMatrix.interpolated[i] =
    //                 trackedMatrix.interpolated[i] +
    //                 trackedMatrix.delta[i] / interpolationFactor;
    //         }

    //         // set matrix of 'root' by detected 'world' matrix
    //         setMatrix(root.matrix, trackedMatrix.interpolated);
    //     }
    //     this.renderer.render(scene, camera);
    // };

    load();
    // tick();
    process();
}
