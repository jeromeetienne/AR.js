(function() {
  /**
   * Matrix utility.
   * @static
   * @constructor
   */
  tracking.Matrix = {};

  /**
   * Loops the array organized as major-row order and executes `fn` callback
   * for each iteration. The `fn` callback receives the following parameters:
   * `(r,g,b,a,index,i,j)`, where `r,g,b,a` represents the pixel color with
   * alpha channel, `index` represents the position in the major-row order
   * array and `i,j` the respective indexes positions in two dimensions.
   * @param {array} pixels The pixels in a linear [r,g,b,a,...] array to loop
   *     through.
   * @param {number} width The image width.
   * @param {number} height The image height.
   * @param {function} fn The callback function for each pixel.
   * @param {number} opt_jump Optional jump for the iteration, by default it
   *     is 1, hence loops all the pixels of the array.
   * @static
   */
  tracking.Matrix.forEach = function(pixels, width, height, fn, opt_jump) {
    opt_jump = opt_jump || 1;
    for (var i = 0; i < height; i += opt_jump) {
      for (var j = 0; j < width; j += opt_jump) {
        var w = i * width * 4 + j * 4;
        fn.call(this, pixels[w], pixels[w + 1], pixels[w + 2], pixels[w + 3], w, i, j);
      }
    }
  };

  /**
   * Calculates the per-element subtraction of two NxM matrices and returns a 
   * new NxM matrix as the result.
   * @param {matrix} a The first matrix.
   * @param {matrix} a The second matrix.
   * @static
   */
  tracking.Matrix.sub = function(a, b){
    var res = tracking.Matrix.clone(a);
    for(var i=0; i < res.length; i++){
      for(var j=0; j < res[i].length; j++){
        res[i][j] -= b[i][j]; 
      }
    }
    return res;
  }

  /**
   * Calculates the per-element sum of two NxM matrices and returns a new NxM
   * NxM matrix as the result.
   * @param {matrix} a The first matrix.
   * @param {matrix} a The second matrix.
   * @static
   */
  tracking.Matrix.add = function(a, b){
    var res = tracking.Matrix.clone(a);
    for(var i=0; i < res.length; i++){
      for(var j=0; j < res[i].length; j++){
        res[i][j] += b[i][j]; 
      }
    }
    return res;
  }

  /**
   * Clones a matrix (or part of it) and returns a new matrix as the result.
   * @param {matrix} src The matrix to be cloned.
   * @param {number} width The second matrix.
   * @static
   */
  tracking.Matrix.clone = function(src, width, height){
    width = width || src[0].length;
    height = height || src.length;
    var temp = new Array(height);
    var i = height;
    while(i--){
      temp[i] = new Array(width);
      var j = width;
      while(j--) temp[i][j] = src[i][j];
    } 
    return temp;
  }

  /**
   * Multiply a matrix by a scalar and returns a new matrix as the result.
   * @param {number} scalar The scalar to multiply the matrix by.
   * @param {matrix} src The matrix to be multiplied.
   * @static
   */
  tracking.Matrix.mulScalar = function(scalar, src){
    var res = tracking.Matrix.clone(src);
    for(var i=0; i < src.length; i++){
      for(var j=0; j < src[i].length; j++){
        res[i][j] *= scalar;
      }
    }
    return res;
  }

  /**
   * Transpose a matrix and returns a new matrix as the result.
   * @param {matrix} src The matrix to be transposed.
   * @static
   */
  tracking.Matrix.transpose = function(src){
    var transpose = new Array(src[0].length);
    for(var i=0; i < src[0].length; i++){
      transpose[i] = new Array(src.length);
      for(var j=0; j < src.length; j++){
        transpose[i][j] = src[j][i];
      }
    }
    return transpose;
  }

  /**
   * Multiply an MxN matrix with an NxP matrix and returns a new MxP matrix
   * as the result.
   * @param {matrix} a The first matrix.
   * @param {matrix} b The second matrix.
   * @static
   */
  tracking.Matrix.mul = function(a, b) {
    var res = new Array(a.length);
    for (var i = 0; i < a.length; i++) {
      res[i] = new Array(b[0].length);
      for (var j = 0; j < b[0].length; j++) {
        res[i][j] = 0;            
        for (var k = 0; k < a[0].length; k++) {
          res[i][j] += a[i][k] * b[k][j];
        }
      }
    }
    return res;
  }

  /**
   * Calculates the absolute norm of a matrix.
   * @param {matrix} src The matrix which norm will be calculated.
   * @static
   */
  tracking.Matrix.norm = function(src){
    var res = 0;
    for(var i=0; i < src.length; i++){
      for(var j=0; j < src[i].length; j++){
        res += src[i][j]*src[i][j];
      }
    }
    return Math.sqrt(res);
  }

  /**
   * Calculates and returns the covariance matrix of a set of vectors as well
   * as the mean of the matrix.
   * @param {matrix} src The matrix which covariance matrix will be calculated.
   * @static
   */
  tracking.Matrix.calcCovarMatrix = function(src){

    var mean = new Array(src.length);
    for(var i=0; i < src.length; i++){
      mean[i] = [0.0];
      for(var j=0; j < src[i].length; j++){
        mean[i][0] += src[i][j]/src[i].length;
      }
    }

    var deltaFull = tracking.Matrix.clone(mean);
    for(var i=0; i < deltaFull.length; i++){
      for(var j=0; j < src[0].length - 1; j++){
        deltaFull[i].push(deltaFull[i][0]);
      }
    }

    var a = tracking.Matrix.sub(src, deltaFull);
    var b = tracking.Matrix.transpose(a);
    var covar = tracking.Matrix.mul(b,a); 
    return [covar, mean];

  }

}());