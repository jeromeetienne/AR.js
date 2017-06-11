/*
Copyright (c) 2012 Juan Mellado

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
*/

/*
References:
- "3D Pose Estimation"
  Andrew Kirillow
  http://www.aforgenet.com/articles/posit/
*/

var POS = POS || {};

POS.Posit = function(modelSize, focalLength){
  this.model = this.buildModel(modelSize);
  this.focalLength = focalLength;

  this.init();
};

POS.Posit.prototype.buildModel = function(modelSize){
  var half = modelSize / 2.0;
  
  return [
    new Vec3(-half,  half, 0.0),
    new Vec3( half,  half, 0.0),
    new Vec3( half, -half, 0.0),
    new Vec3(-half, -half, 0.0) ];
};

POS.Posit.prototype.init = function(){
  var d = new Vec3(), v = new Mat3(), u;
  
  this.modelVectors = Mat3.fromRows(
      Vec3.sub(this.model[1], this.model[0]),
      Vec3.sub(this.model[2], this.model[0]),
      Vec3.sub(this.model[3], this.model[0]) );

  u = Mat3.clone(this.modelVectors);

  SVD.svdcmp(u.m, 3, 3, d.v, v.m);

  this.modelPseudoInverse = Mat3.mult(
    Mat3.mult(v, Mat3.fromDiagonal( Vec3.inverse(d) ) ), Mat3.transpose(u) );
  
  this.modelNormal = v.column( d.minIndex() );
};

POS.Posit.prototype.pose = function(points){
  var eps = new Vec3(1.0, 1.0, 1.0),
      rotation1 = new Mat3(), rotation2 = new Mat3(),
      translation1 = new Vec3(), translation2 = new Vec3(),
      error1, error2;

  this.pos(points, eps, rotation1, rotation2, translation1, translation2);

  error1 = this.iterate(points, rotation1, translation1);
  error2 = this.iterate(points, rotation2, translation2);

  return error1 < error2?
    new POS.Pose(error1, rotation1.m, translation1.v, error2, rotation2.m, translation2.v):
    new POS.Pose(error2, rotation2.m, translation2.v, error1, rotation1.m, translation1.v);
};

POS.Posit.prototype.pos = function(points, eps, rotation1, rotation2, translation1, translation2){
  var xi = new Vec3(points[1].x, points[2].x, points[3].x),
      yi = new Vec3(points[1].y, points[2].y, points[3].y),
      xs = Vec3.addScalar( Vec3.mult(xi, eps), -points[0].x),
      ys = Vec3.addScalar( Vec3.mult(yi, eps), -points[0].y),
      i0 = Mat3.multVector(this.modelPseudoInverse, xs),
      j0 = Mat3.multVector(this.modelPseudoInverse, ys),
      s = j0.square() - i0.square(),
      ij = Vec3.dot(i0, j0),
      r = 0.0, theta = 0.0,
      i, j, k, inorm, jnorm, scale, temp, lambda, mu;

  if (0.0 === s){
    r = Math.sqrt( Math.abs(2.0 * ij) );
    theta = (-Math.PI / 2.0) * (ij < 0.0? -1: (ij > 0.0? 1.0: 0.0) );
  }else{
    r = Math.sqrt( Math.sqrt(s * s + 4.0 * ij * ij) );
    theta = Math.atan(-2.0 * ij / s);
    if (s < 0.0){
      theta += Math.PI;
    }
    theta /= 2.0;
  }

  lambda = r * Math.cos(theta);
  mu = r * Math.sin(theta);

  //First possible rotation/translation
  i = Vec3.add(i0, Vec3.multScalar(this.modelNormal, lambda) );
  j = Vec3.add(j0, Vec3.multScalar(this.modelNormal, mu) );
  inorm = i.normalize();
  jnorm = j.normalize();
  k = Vec3.cross(i, j);
  rotation1.copy( Mat3.fromRows(i, j, k) );
  
  scale = (inorm + jnorm) / 2.0;
  temp = Mat3.multVector(rotation1, this.model[0]);
  translation1.v = [
    points[0].x / scale - temp.v[0],
    points[0].y / scale - temp.v[1],
    this.focalLength / scale];

  //Second possible rotation/translation
  i = Vec3.sub(i0, Vec3.multScalar(this.modelNormal, lambda) );
  j = Vec3.sub(j0, Vec3.multScalar(this.modelNormal, mu) );
  inorm = i.normalize();
  jnorm = j.normalize();
  k = Vec3.cross(i, j);
  rotation2.copy( Mat3.fromRows(i, j, k) );
  
  scale = (inorm + jnorm) / 2.0;
  temp = Mat3.multVector(rotation2, this.model[0]);
  translation2.v = [
    points[0].x / scale - temp.v[0],
    points[0].y / scale - temp.v[1],
    this.focalLength / scale];
};

POS.Posit.prototype.iterate = function(points, rotation, translation){
  var prevError = Infinity,
      rotation1 = new Mat3(), rotation2 = new Mat3(),
      translation1 = new Vec3(), translation2 = new Vec3(),
      i = 0, eps, error, error1, error2;

  for (; i < 100; ++ i){
    eps = Vec3.addScalar( Vec3.multScalar( 
      Mat3.multVector( this.modelVectors, rotation.row(2) ), 1.0 / translation.v[2]), 1.0);

    this.pos(points, eps, rotation1, rotation2, translation1, translation2);

    error1 = this.getError(points, rotation1, translation1);
    error2 = this.getError(points, rotation2, translation2);

    if (error1 < error2){
      rotation.copy(rotation1);
      translation.copy(translation1);
      error = error1;
    }else{
      rotation.copy(rotation2);
      translation.copy(translation2);
      error = error2;
    }

    if ( (error <= 2.0) || (error > prevError) ){
      break;
    }

    prevError = error;
  }

  return error;
};

POS.Posit.prototype.getError = function(points, rotation, translation){
  var v1 = Vec3.add( Mat3.multVector(rotation, this.model[0]), translation),
      v2 = Vec3.add( Mat3.multVector(rotation, this.model[1]), translation),
      v3 = Vec3.add( Mat3.multVector(rotation, this.model[2]), translation),
      v4 = Vec3.add( Mat3.multVector(rotation, this.model[3]), translation),
      modeled, ia1, ia2, ia3, ia4, ma1, ma2, ma3, ma4;
  
  v1 = v1.v; v2 = v2.v; v3 = v3.v; v4 = v4.v;
  
  v1[0] *= this.focalLength / v1[2];
  v1[1] *= this.focalLength / v1[2];
  v2[0] *= this.focalLength / v2[2];
  v2[1] *= this.focalLength / v2[2];
  v3[0] *= this.focalLength / v3[2];
  v3[1] *= this.focalLength / v3[2];
  v4[0] *= this.focalLength / v4[2];
  v4[1] *= this.focalLength / v4[2];
  
  modeled = [
    {x: v1[0], y: v1[1]},
    {x: v2[0], y: v2[1]},
    {x: v3[0], y: v3[1]},
    {x: v4[0], y: v4[1]}
  ];

  ia1 = this.angle( points[0], points[1], points[3] );
  ia2 = this.angle( points[1], points[2], points[0] );
  ia3 = this.angle( points[2], points[3], points[1] );
  ia4 = this.angle( points[3], points[0], points[2] );

  ma1 = this.angle( modeled[0], modeled[1], modeled[3] );
  ma2 = this.angle( modeled[1], modeled[2], modeled[0] );
  ma3 = this.angle( modeled[2], modeled[3], modeled[1] );
  ma4 = this.angle( modeled[3], modeled[0], modeled[2] );

  return ( Math.abs(ia1 - ma1) +
           Math.abs(ia2 - ma2) +
           Math.abs(ia3 - ma3) +
           Math.abs(ia4 - ma4) ) / 4.0;
};

POS.Posit.prototype.angle = function(a, b, c){
  var x1 = b.x - a.x, y1 = b.y - a.y,
      x2 = c.x - a.x, y2 = c.y - a.y;
  
  return Math.acos( (x1 * x2 + y1 * y2) / 
    (Math.sqrt(x1 * x1 + y1 * y1) * Math.sqrt(x2 * x2 + y2 * y2) ) ) * 180.0 / Math.PI;
};

POS.Pose = function(error1, rotation1, translation1, error2, rotation2, translation2){
  this.bestError = error1;
  this.bestRotation = rotation1;
  this.bestTranslation = translation1;
  this.alternativeError = error2;
  this.alternativeRotation = rotation2;
  this.alternativeTranslation = translation2;
};

var Vec3 = function(x, y, z){
  this.v = [x || 0.0, y || 0.0, z || 0.0];
};

Vec3.prototype.copy = function(a){
  var v = this.v;

  a = a.v;

  v[0] = a[0];
  v[1] = a[1];
  v[2] = a[2];

  return this;
};

Vec3.add = function(a, b){
  var vector = new Vec3(), v = vector.v;
  
  a = a.v; b = b.v;

  v[0] = a[0] + b[0];
  v[1] = a[1] + b[1];
  v[2] = a[2] + b[2];
  
  return vector;
};

Vec3.sub = function(a, b){
  var vector = new Vec3(), v = vector.v;
  
  a = a.v; b = b.v;

  v[0] = a[0] - b[0];
  v[1] = a[1] - b[1];
  v[2] = a[2] - b[2];
  
  return vector;
};

Vec3.mult = function(a, b){
  var vector = new Vec3(), v = vector.v;
  
  a = a.v; b = b.v;

  v[0] = a[0] * b[0];
  v[1] = a[1] * b[1];
  v[2] = a[2] * b[2];
  
  return vector;
};

Vec3.addScalar = function(a, b){
  var vector = new Vec3(), v = vector.v;
  
  a = a.v;

  v[0] = a[0] + b;
  v[1] = a[1] + b;
  v[2] = a[2] + b;
  
  return vector;
};

Vec3.multScalar = function(a, b){
  var vector = new Vec3(), v = vector.v;
  
  a = a.v;

  v[0] = a[0] * b;
  v[1] = a[1] * b;
  v[2] = a[2] * b;
  
  return vector;
};

Vec3.dot = function(a, b){
  a = a.v; b = b.v;

  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
};

Vec3.cross = function(a, b){
  a = a.v; b = b.v;

 return new Vec3(
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0]);
};

Vec3.prototype.normalize = function(){
  var v = this.v,
      len = Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);
      
  if (len > 0.0){
    v[0] /= len;
    v[1] /= len;
    v[2] /= len;
  }

  return len;
};

Vec3.inverse = function(a){
  var vector = new Vec3(), v = vector.v;
  
  a = a.v;
  
  if (a[0] !== 0.0){
    v[0] = 1.0 / a[0];
  }
  if (a[1] !== 0.0){
    v[1] = 1.0 / a[1];
  }
  if (a[2] !== 0.0){
    v[2] = 1.0 / a[2];
  }
  
  return vector;
};

Vec3.prototype.square = function(){
  var v = this.v;

  return v[0] * v[0] + v[1] * v[1] + v[2] * v[2];
};

Vec3.prototype.minIndex = function(){
  var v = this.v;

  return v[0] < v[1]? (v[0] < v[2]? 0: 2): (v[1] < v[2]? 1: 2);
};

var Mat3 = function(){
  this.m = [ [0.0, 0.0, 0.0],
             [0.0, 0.0, 0.0],
             [0.0, 0.0, 0.0] ];
};

Mat3.clone = function(a){
  var matrix = new Mat3(), m = matrix.m;
  
  a = a.m;

  m[0][0] = a[0][0];
  m[0][1] = a[0][1];
  m[0][2] = a[0][2];
  m[1][0] = a[1][0];
  m[1][1] = a[1][1];
  m[1][2] = a[1][2];
  m[2][0] = a[2][0];
  m[2][1] = a[2][1];
  m[2][2] = a[2][2];
  
  return matrix;
};

Mat3.prototype.copy = function(a){
  var m = this.m;

  a = a.m;

  m[0][0] = a[0][0];
  m[0][1] = a[0][1];
  m[0][2] = a[0][2];
  m[1][0] = a[1][0];
  m[1][1] = a[1][1];
  m[1][2] = a[1][2];
  m[2][0] = a[2][0];
  m[2][1] = a[2][1];
  m[2][2] = a[2][2];

  return this;
};

Mat3.fromRows = function(a, b, c){
  var matrix = new Mat3(), m = matrix.m;
  
  a = a.v; b = b.v; c = c.v;
  
  m[0][0] = a[0];
  m[0][1] = a[1];
  m[0][2] = a[2];
  m[1][0] = b[0];
  m[1][1] = b[1];
  m[1][2] = b[2];
  m[2][0] = c[0];
  m[2][1] = c[1];
  m[2][2] = c[2];

  return matrix;
};

Mat3.fromDiagonal = function(a){
  var matrix = new Mat3(), m = matrix.m;
  
  a = a.v;
  
  m[0][0] = a[0];
  m[1][1] = a[1];
  m[2][2] = a[2];
  
  return matrix;
};

Mat3.transpose = function(a){
  var matrix = new Mat3(), m = matrix.m;
  
  a = a.m;
  
  m[0][0] = a[0][0];
  m[0][1] = a[1][0];
  m[0][2] = a[2][0];
  m[1][0] = a[0][1];
  m[1][1] = a[1][1];
  m[1][2] = a[2][1];
  m[2][0] = a[0][2];
  m[2][1] = a[1][2];
  m[2][2] = a[2][2];
            
  return matrix;
};

Mat3.mult = function(a, b){
  var matrix = new Mat3(), m = matrix.m;
  
  a = a.m; b = b.m;

  m[0][0] = a[0][0] * b[0][0] + a[0][1] * b[1][0] + a[0][2] * b[2][0];
  m[0][1] = a[0][0] * b[0][1] + a[0][1] * b[1][1] + a[0][2] * b[2][1];
  m[0][2] = a[0][0] * b[0][2] + a[0][1] * b[1][2] + a[0][2] * b[2][2];
  m[1][0] = a[1][0] * b[0][0] + a[1][1] * b[1][0] + a[1][2] * b[2][0];
  m[1][1] = a[1][0] * b[0][1] + a[1][1] * b[1][1] + a[1][2] * b[2][1];
  m[1][2] = a[1][0] * b[0][2] + a[1][1] * b[1][2] + a[1][2] * b[2][2];
  m[2][0] = a[2][0] * b[0][0] + a[2][1] * b[1][0] + a[2][2] * b[2][0];
  m[2][1] = a[2][0] * b[0][1] + a[2][1] * b[1][1] + a[2][2] * b[2][1];
  m[2][2] = a[2][0] * b[0][2] + a[2][1] * b[1][2] + a[2][2] * b[2][2];

  return matrix;
};

Mat3.multVector = function(m, a){
  m = m.m; a = a.v;
  
  return new Vec3(
    m[0][0] * a[0] + m[0][1] * a[1] + m[0][2] * a[2],
    m[1][0] * a[0] + m[1][1] * a[1] + m[1][2] * a[2],
    m[2][0] * a[0] + m[2][1] * a[1] + m[2][2] * a[2]);
};

Mat3.prototype.column = function(index){
  var m = this.m;
  
  return new Vec3( m[0][index], m[1][index], m[2][index] );
};

Mat3.prototype.row = function(index){
  var m = this.m;
  
  return new Vec3( m[index][0], m[index][1], m[index][2] );
};
