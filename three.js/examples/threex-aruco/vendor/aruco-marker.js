/*! aruco-marker 1.0.0 2014-06-19 - MIT Licensed, see http://github.com/bhollis/aruco-marker */
// Export for use via AMD, Node.js, or a browser global.
// See https://github.com/umdjs/umd/blob/master/returnExportsGlobal.js
(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define([], function () {
      return (root.ArucoMarker = factory());
    });
  } else if (typeof exports === 'object') {
    // Node. Does not work with strict CommonJS, but
    // only CommonJS-like enviroments that support module.exports,
    // like Node.
    module.exports = factory();
  } else {
    // Browser globals
    root.ArucoMarker = factory();
  }
}(this, function () {

  // Create an ArucoMarker object by its ID, which can then be used to generate images.
  // The id must be in the range [0..1023]
  // Based on https://github.com/rmsalinas/aruco/blob/master/trunk/src/arucofidmarkers.cpp
  function ArucoMarker(id) {
    if (id < 0 || id > 1023) {
      throw new RangeError('Marker ID must be in the range [0..1023]');
    }

    this.id = id;
  }

  ArucoMarker.prototype = {
    // Generate a marker as a 5x5 matrix of 0s and 1s.
    markerMatrix: function() {
      var ids = [16, 23, 9, 14];
      var index, val, x, y;
      var marker = [[0, 0, 0, 0, 0],
                 [0, 0, 0, 0, 0],
                 [0, 0, 0, 0, 0],
                 [0, 0, 0, 0, 0],
                 [0, 0, 0, 0, 0]];

      for (y = 0; y < 5; y++) {
        index = (this.id >> 2 * (4 - y)) & 3;
        val = ids[index];
        for (x = 0; x < 5; x++) {
          if ((val >> (4 - x)) & 1) {
            marker[x][y] = 1;
          } else {
            marker[x][y] = 0;
          }
        }
      }

      return marker;
    },

    // Create an SVG image of the marker, as a string.
    // Optionally pass a size (in any SVG-compatible units) or leave it out to size it on your own.
    toSVG: function(size) {
      var x, y;
      var marker = this.markerMatrix();
      var image;

      if (size) {
        size = 'height="' + size + '" width="' + size + '"';
      } else {
        size = '';
      }

      image = '<svg ' + size + ' viewBox="0 0 7 7" version="1.1" xmlns="http://www.w3.org/2000/svg">\n' +
        '  <rect x="0" y="0" width="7" height="7" fill="black"/>\n';

      for (y = 0; y < 5; y++) {
        for (x = 0; x < 5; x++) {
          if (marker[x][y] === 1) {
            image += '  <rect x="' + (x + 1) + '" y="' + (y + 1) +
              '" width="1" height="1" fill="white" ' +
              // Slight stroke to get around aliasing issues with adjacent rectangles
              'stroke="white" stroke-width="0.01" />\n';
          }
        }
      }

      image += '</svg>';

      return image;
    }
  };

  return ArucoMarker;
}));
