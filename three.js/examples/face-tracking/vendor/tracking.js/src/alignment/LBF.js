(function() {
  /**
   * Face Alignment via Regressing Local Binary Features (LBF)
   * This approach has two components: a set of local binary features and
   * a locality principle for learning those features.
   * The locality principle is used to guide the learning of a set of highly
   * discriminative local binary features for each landmark independently.
   * The obtained local binary features are used to learn a linear regression
   * that later will be used to guide the landmarks in the alignment phase.
   * 
   * @authors: VoxarLabs Team (http://cin.ufpe.br/~voxarlabs)
   *           Lucas Figueiredo <lsf@cin.ufpe.br>, Thiago Menezes <tmc2@cin.ufpe.br>,
   *           Thiago Domingues <tald@cin.ufpe.br>, Rafael Roberto <rar3@cin.ufpe.br>,
   *           Thulio Araujo <tlsa@cin.ufpe.br>, Joao Victor <jvfl@cin.ufpe.br>,
   *           Tomer Simis <tls@cin.ufpe.br>)
   */
  
  /**
   * Holds the maximum number of stages that will be used in the alignment algorithm.
   * Each stage contains a different set of random forests and retrieves the binary
   * code from a more "specialized" (i.e. smaller) region around the landmarks.
   * @type {number}
   * @static
   */
  tracking.LBF.maxNumStages = 4;

  /**
   * Holds the regressor that will be responsible for extracting the local features from 
   * the image and guide the landmarks using the training data.
   * @type {object}
   * @protected
   * @static
   */
  tracking.LBF.regressor_ = null; 
  
  /**
   * Generates a set of landmarks for a set of faces
   * @param {pixels} pixels The pixels in a linear [r,g,b,a,...] array.
   * @param {number} width The image width.
   * @param {number} height The image height.
   * @param {array} faces The list of faces detected in the image
   * @return {array} The aligned landmarks, each set of landmarks corresponding
   *     to a specific face.
   * @static
   */
  tracking.LBF.align = function(pixels, width, height, faces){

    if(tracking.LBF.regressor_ == null){
      tracking.LBF.regressor_ = new tracking.LBF.Regressor(
        tracking.LBF.maxNumStages
      );
    }
// NOTE: is this thesholding suitable ? if it is on image, why no skin-color filter ? and a adaptative threshold
    pixels = tracking.Image.grayscale(pixels, width, height, false);

    pixels = tracking.Image.equalizeHist(pixels, width, height);

    var shapes = new Array(faces.length);

    for(var i in faces){

      faces[i].height = faces[i].width;

      var boundingBox = {};
      boundingBox.startX = faces[i].x;
      boundingBox.startY = faces[i].y;
      boundingBox.width = faces[i].width;
      boundingBox.height = faces[i].height;

      shapes[i] = tracking.LBF.regressor_.predict(pixels, width, height, boundingBox);
    }

    return shapes;
  }

  /**
   * Unprojects the landmarks shape from the bounding box.
   * @param {matrix} shape The landmarks shape.
   * @param {matrix} boudingBox The bounding box.
   * @return {matrix} The landmarks shape projected into the bounding box.
   * @static
   * @protected
   */
  tracking.LBF.unprojectShapeToBoundingBox_ = function(shape, boundingBox){
    var temp = new Array(shape.length);
    for(var i=0; i < shape.length; i++){
      temp[i] = [
        (shape[i][0] - boundingBox.startX) / boundingBox.width,
        (shape[i][1] - boundingBox.startY) / boundingBox.height
      ];
    }
    return temp;
  }

  /**
   * Projects the landmarks shape into the bounding box. The landmarks shape has
   * normalized coordinates, so it is necessary to map these coordinates into
   * the bounding box coordinates.
   * @param {matrix} shape The landmarks shape.
   * @param {matrix} boudingBox The bounding box.
   * @return {matrix} The landmarks shape.
   * @static
   * @protected
   */
  tracking.LBF.projectShapeToBoundingBox_ = function(shape, boundingBox){
    var temp = new Array(shape.length);
    for(var i=0; i < shape.length; i++){
      temp[i] = [
        shape[i][0] * boundingBox.width + boundingBox.startX,
        shape[i][1] * boundingBox.height + boundingBox.startY
      ];
    }
    return temp;
  }

  /**
   * Calculates the rotation and scale necessary to transform shape1 into shape2.
   * @param {matrix} shape1 The shape to be transformed.
   * @param {matrix} shape2 The shape to be transformed in.
   * @return {[matrix, scalar]} The rotation matrix and scale that applied to shape1
   *     results in shape2.
   * @static
   * @protected
   */
  tracking.LBF.similarityTransform_ = function(shape1, shape2){

    var center1 = [0,0];
    var center2 = [0,0];
    for (var i = 0; i < shape1.length; i++) {
      center1[0] += shape1[i][0];
      center1[1] += shape1[i][1];
      center2[0] += shape2[i][0];
      center2[1] += shape2[i][1];
    }
    center1[0] /= shape1.length;
    center1[1] /= shape1.length;
    center2[0] /= shape2.length;
    center2[1] /= shape2.length;

    var temp1 = tracking.Matrix.clone(shape1);
    var temp2 = tracking.Matrix.clone(shape2);
    for(var i=0; i < shape1.length; i++){
      temp1[i][0] -= center1[0];
      temp1[i][1] -= center1[1];
      temp2[i][0] -= center2[0];
      temp2[i][1] -= center2[1];
    }

    var covariance1, covariance2;
    var mean1, mean2;

    var t = tracking.Matrix.calcCovarMatrix(temp1);
    covariance1 = t[0];
    mean1 = t[1];

    t = tracking.Matrix.calcCovarMatrix(temp2);
    covariance2 = t[0];
    mean2 = t[1];

    var s1 = Math.sqrt(tracking.Matrix.norm(covariance1));
    var s2 = Math.sqrt(tracking.Matrix.norm(covariance2));

    var scale = s1/s2;
    temp1 = tracking.Matrix.mulScalar(1.0/s1, temp1);
    temp2 = tracking.Matrix.mulScalar(1.0/s2, temp2);

    var num = 0, den = 0;
    for (var i = 0; i < shape1.length; i++) {
      num = num + temp1[i][1] * temp2[i][0] - temp1[i][0] * temp2[i][1];
      den = den + temp1[i][0] * temp2[i][0] + temp1[i][1] * temp2[i][1];
    }

    var norm = Math.sqrt(num*num + den*den);
    var sin_theta = num/norm;
    var cos_theta = den/norm;
    var rotation = [
      [cos_theta, -sin_theta],
      [sin_theta, cos_theta]
    ];

    return [rotation, scale];
  }

  /**
   * LBF Random Forest data structure.
   * @static
   * @constructor
   */
  tracking.LBF.RandomForest = function(forestIndex){
    this.maxNumTrees = tracking.LBF.RegressorData[forestIndex].max_numtrees;
    this.landmarkNum = tracking.LBF.RegressorData[forestIndex].num_landmark;
    this.maxDepth = tracking.LBF.RegressorData[forestIndex].max_depth;
    this.stages = tracking.LBF.RegressorData[forestIndex].stages; 

    this.rfs = new Array(this.landmarkNum);
    for(var i=0; i < this.landmarkNum; i++){
      this.rfs[i] = new Array(this.maxNumTrees);
      for(var j=0; j < this.maxNumTrees; j++){
        this.rfs[i][j] = new tracking.LBF.Tree(forestIndex, i, j);
      }
    }
  }

  /**
   * LBF Tree data structure.
   * @static
   * @constructor
   */
  tracking.LBF.Tree = function(forestIndex, landmarkIndex, treeIndex){
    var data = tracking.LBF.RegressorData[forestIndex].landmarks[landmarkIndex][treeIndex];
    this.maxDepth = data.max_depth;
    this.maxNumNodes = data.max_numnodes;
    this.nodes = data.nodes;
    this.landmarkID = data.landmark_id;
    this.numLeafnodes = data.num_leafnodes;
    this.numNodes = data.num_nodes;
    this.maxNumFeats = data.max_numfeats;
    this.maxRadioRadius = data.max_radio_radius;
    this.leafnodes = data.id_leafnodes;
  }

}());
