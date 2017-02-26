(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define([], factory);
  } else if (typeof module === 'object' && module.exports) {
    // Node. Does not work with strict CommonJS, but
    // only CommonJS-like environments that support module.exports,
    // like Node.
    module.exports = factory();
  } else {
    // Browser globals (root is window)
    if (!root.THREEx) root.THREEx = {};
    root.THREEx.ArToolkitSource = factory();
  }
}(this, function() {
  var ArToolkitSource = function(parameters) {
    // handle default parameters
    this.parameters = {
      // type of source - ['webcam', 'image', 'video']
      sourceType: parameters.sourceType !== undefined ? parameters.sourceType : 'webcam',
      // url of the source - valid if sourceType = image|video
      sourceUrl: parameters.sourceUrl !== undefined ? parameters.sourceUrl : null,

      // resolution of at which we detect pose in the source image
      sourceWidth: parameters.sourceWidth !== undefined ? parameters.sourceWidth : 640,
      sourceHeight: parameters.sourceHeight !== undefined ? parameters.sourceHeight : 480,
      // resolution displayed for the source
      displayWidth: parameters.displayWidth !== undefined ? parameters.displayWidth : 640,
      displayHeight: parameters.displayHeight !== undefined ? parameters.displayHeight : 480,
    }

    this.ready = false
    this.domElement = null
  }

  //////////////////////////////////////////////////////////////////////////////
  //		Code Separator
  //////////////////////////////////////////////////////////////////////////////
  ArToolkitSource.prototype.init = function(onReady) {
    var _this = this

    if (this.parameters.sourceType === 'image') {
      var domElement = this._initSourceImage(onSourceReady)
    } else if (this.parameters.sourceType === 'video') {
      var domElement = this._initSourceVideo(onSourceReady)
    } else if (this.parameters.sourceType === 'webcam') {
      var domElement = this._initSourceWebcam(onSourceReady)
    } else {
      console.assert(false)
    }

    // attach
    this.domElement = domElement
    this.domElement.style.position = 'absolute'
    this.domElement.style.top = '0px'
    this.domElement.style.zIndex = '-2'
    this.domElement.style.zIndex = '-2'

    return this

    function onSourceReady() {
      document.body.appendChild(_this.domElement);

      _this.ready = true
      console.log('completed')
      onReady && onReady()
    }
  }

  ////////////////////////////////////////////////////////////////////////////////
  //          init image source
  ////////////////////////////////////////////////////////////////////////////////


  ArToolkitSource.prototype._initSourceImage = function(onReady) {
    // TODO make it static
    var domElement = document.createElement('img')
    domElement.src = this.parameters.sourceUrl

    domElement.width = this.parameters.sourceWidth
    domElement.height = this.parameters.sourceHeight
    domElement.style.width = this.parameters.displayWidth + 'px'
    domElement.style.height = this.parameters.displayHeight + 'px'

    // wait until the video stream is ready
    var interval = setInterval(function() {
      if (!domElement.naturalWidth) return;
      onReady()
      clearInterval(interval)
    }, 1000 / 50);

    return domElement
  }

  ////////////////////////////////////////////////////////////////////////////////
  //          init video source
  ////////////////////////////////////////////////////////////////////////////////


  ArToolkitSource.prototype._initSourceVideo = function(onReady) {
    // TODO make it static
    var domElement = document.createElement('video');
    domElement.src = this.parameters.sourceUrl

    domElement.style.objectFit = 'initial'

    domElement.autoplay = true;
    domElement.webkitPlaysinline = true;
    domElement.controls = false;
    domElement.loop = true;
    domElement.muted = true

    // trick to trigger the video on android
    document.body.addEventListener('click', function() {
      domElement.play()
    })

    domElement.width = this.parameters.sourceWidth
    domElement.height = this.parameters.sourceHeight
    domElement.style.width = this.parameters.displayWidth + 'px'
    domElement.style.height = this.parameters.displayHeight + 'px'

    // wait until the video stream is ready
    var interval = setInterval(function() {
      if (!domElement.videoWidth) return;
      onReady()
      clearInterval(interval)
    }, 1000 / 50);
    return domElement
  }

  ////////////////////////////////////////////////////////////////////////////////
  //          handle webcam source
  ////////////////////////////////////////////////////////////////////////////////


  ArToolkitSource.prototype._initSourceWebcam = function(onReady) {
    var _this = this
    // TODO make it static
    navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;

    var domElement = document.createElement('video');
    domElement.style.width = this.parameters.displayWidth + 'px'
    domElement.style.height = this.parameters.displayHeight + 'px'


    if (navigator.getUserMedia == false) console.log("navigator.getUserMedia not present in your browser");

    navigator.mediaDevices.enumerateDevices().then(function(devices) {
      // define getUserMedia() constraints
      var constraints = {
        audio: false,
        video: {
          mandatory: {
            maxWidth: _this.parameters.sourceWidth,
            maxHeight: _this.parameters.sourceHeight
          }
        }
      }

      devices.forEach(function(device) {
        if (device.kind !== 'videoinput') return
        constraints.video.optional = [{
          sourceId: device.deviceId
        }]
      });

      // OLD API
      // it it finds the videoSource 'environment', modify constraints.video
      // for (var i = 0; i != sourceInfos.length; ++i) {
      //         var sourceInfo = sourceInfos[i];
      //         if(sourceInfo.kind == "video" && sourceInfo.facing == "environment") {
      //                 constraints.video.optional = [{sourceId: sourceInfo.id}]
      //         }
      // }

      navigator.getUserMedia(constraints, function success(stream) {
        console.log('success', stream);
        domElement.src = window.URL.createObjectURL(stream);
        // to start the video, when it is possible to start it only on userevent. like in android
        document.body.addEventListener('click', function() {
          domElement.play();
        })
        domElement.play();

        // wait until the video stream is ready
        var interval = setInterval(function() {
          if (!domElement.videoWidth) return;
          onReady()
          clearInterval(interval)
        }, 1000 / 50);
      }, function(error) {
        console.log("Can't access user media", error);
        alert("Can't access user media :()");
      });
    }).catch(function(err) {
      console.log(err.name + ": " + err.message);
    });

    return domElement
  }

  ////////////////////////////////////////////////////////////////////////////////
  //          handle resize
  ////////////////////////////////////////////////////////////////////////////////

  ArToolkitSource.prototype.onResize = function(rendererDomElement) {
    var screenWidth = window.innerWidth
    var screenHeight = window.innerHeight

    // compute sourceWidth, sourceHeight
    if (this.domElement.nodeName === "IMG") {
      var sourceWidth = this.domElement.naturalWidth
      var sourceHeight = this.domElement.naturalHeight
    } else if (this.domElement.nodeName === "VIDEO") {
      var sourceWidth = this.domElement.videoWidth
      var sourceHeight = this.domElement.videoHeight
    } else {
      console.assert(false)
    }

    // compute sourceAspect
    var sourceAspect = sourceWidth / sourceHeight
    // compute screenAspect
    var screenAspect = screenWidth / screenHeight

    // if screenAspect < sourceAspect, then change the width, else change the height
    if (screenAspect < sourceAspect) {
      // compute newWidth and set .width/.marginLeft
      var newWidth = sourceAspect * screenHeight
      this.domElement.style.width = newWidth + 'px'
      this.domElement.style.marginLeft = -(newWidth - screenWidth) / 2 + 'px'

      // init style.height/.marginTop to normal value
      this.domElement.style.height = screenHeight + 'px'
      this.domElement.style.marginTop = '0px'
    } else {
      // compute newHeight and set .height/.marginTop
      var newHeight = 1 / (sourceAspect / screenWidth)
      this.domElement.style.height = newHeight + 'px'
      this.domElement.style.marginTop = -(newHeight - screenHeight) / 2 + 'px'

      // init style.width/.marginLeft to normal value
      this.domElement.style.width = screenWidth + 'px'
      this.domElement.style.marginLeft = '0px'
    }

    if (rendererDomElement !== undefined) {
      // copy arToolkitSource.domElement position to renderer.domElement
      rendererDomElement.style.width = this.domElement.style.width
      rendererDomElement.style.height = this.domElement.style.height
      rendererDomElement.style.marginLeft = this.domElement.style.marginLeft
      rendererDomElement.style.marginTop = this.domElement.style.marginTop
    }
  }

  return ArToolkitSource;
}));
