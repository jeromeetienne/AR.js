(function() {

  tracking.LBF = {};

  /**
   * LBF Regressor utility.
   * @constructor
   */
  tracking.LBF.Regressor = function(maxNumStages){
    this.maxNumStages = maxNumStages;

    this.rfs = new Array(maxNumStages);
    this.models = new Array(maxNumStages);
    for(var i=0; i < maxNumStages; i++){
      this.rfs[i] = new tracking.LBF.RandomForest(i);
      this.models[i] = tracking.LBF.RegressorData[i].models;
    }

    this.meanShape = tracking.LBF.LandmarksData;
  }

  /**
   * Predicts the position of the landmarks based on the bounding box of the face.
   * @param {pixels} pixels The grayscale pixels in a linear array.
   * @param {number} width Width of the image.
   * @param {number} height Height of the image.
   * @param {object} boudingBox Bounding box of the face to be aligned.
   * @return {matrix} A matrix with each landmark position in a row [x,y].
   */
  tracking.LBF.Regressor.prototype.predict = function(pixels, width, height, boundingBox) {

    var images = [];
    var currentShapes = [];
    var boundingBoxes = [];

    var meanShapeClone = tracking.Matrix.clone(this.meanShape);

    images.push({
      'data': pixels,
      'width': width,
      'height': height
    });
    boundingBoxes.push(boundingBox);

    currentShapes.push(tracking.LBF.projectShapeToBoundingBox_(meanShapeClone, boundingBox));

    for(var stage = 0; stage < this.maxNumStages; stage++){
      var binaryFeatures = tracking.LBF.Regressor.deriveBinaryFeat(this.rfs[stage], images, currentShapes, boundingBoxes, meanShapeClone);
      this.applyGlobalPrediction(binaryFeatures, this.models[stage], currentShapes, boundingBoxes);
    }

    return currentShapes[0];
  };

  /**
   * Multiplies the binary features of the landmarks with the regression matrix
   * to obtain the displacement for each landmark. Then applies this displacement
   * into the landmarks shape.
   * @param {object} binaryFeatures The binary features for the landmarks.
   * @param {object} models The regressor models.
   * @param {matrix} currentShapes The landmarks shapes.
   * @param {array} boudingBoxes The bounding boxes of the faces.
   */
  tracking.LBF.Regressor.prototype.applyGlobalPrediction = function(binaryFeatures, models, currentShapes, 
    boundingBoxes){

    var residual = currentShapes[0].length * 2;

    var rotation = [];
    var deltashape = new Array(residual/2);
    for(var i=0; i < residual/2; i++){
      deltashape[i] = [0.0, 0.0];
    }

    for(var i=0; i < currentShapes.length; i++){
      for(var j=0; j < residual; j++){
        var tmp = 0;
        for(var lx=0, idx=0; (idx = binaryFeatures[i][lx].index) != -1; lx++){
          if(idx <= models[j].nr_feature){
            tmp += models[j].data[(idx - 1)] * binaryFeatures[i][lx].value;
          }
        }
        if(j < residual/2){
          deltashape[j][0] = tmp;
        }else{
          deltashape[j - residual/2][1] = tmp;
        }
      }

      var res = tracking.LBF.similarityTransform_(tracking.LBF.unprojectShapeToBoundingBox_(currentShapes[i], boundingBoxes[i]), this.meanShape);
      var rotation = tracking.Matrix.transpose(res[0]);

      var s = tracking.LBF.unprojectShapeToBoundingBox_(currentShapes[i], boundingBoxes[i]);
      s = tracking.Matrix.add(s, deltashape);

      currentShapes[i] = tracking.LBF.projectShapeToBoundingBox_(s, boundingBoxes[i]);

    }
  };

  /**
   * Derives the binary features from the image for each landmark. 
   * @param {object} forest The random forest to search for the best binary feature match.
   * @param {array} images The images with pixels in a grayscale linear array.
   * @param {array} currentShapes The current landmarks shape.
   * @param {array} boudingBoxes The bounding boxes of the faces.
   * @param {matrix} meanShape The mean shape of the current landmarks set.
   * @return {array} The binary features extracted from the image and matched with the
   *     training data.
   * @static
   */
  tracking.LBF.Regressor.deriveBinaryFeat = function(forest, images, currentShapes, boundingBoxes, meanShape){

    var binaryFeatures = new Array(images.length);
    for(var i=0; i < images.length; i++){
      var t = forest.maxNumTrees * forest.landmarkNum + 1;
      binaryFeatures[i] = new Array(t);
      for(var j=0; j < t; j++){
        binaryFeatures[i][j] = {};
      }
    }

    var leafnodesPerTree = 1 << (forest.maxDepth - 1);

    for(var i=0; i < images.length; i++){

      var projectedShape = tracking.LBF.unprojectShapeToBoundingBox_(currentShapes[i], boundingBoxes[i]);
      var transform = tracking.LBF.similarityTransform_(projectedShape, meanShape);
      
      for(var j=0; j < forest.landmarkNum; j++){
        for(var k=0; k < forest.maxNumTrees; k++){

          var binaryCode = tracking.LBF.Regressor.getCodeFromTree(forest.rfs[j][k], images[i], 
                              currentShapes[i], boundingBoxes[i], transform[0], transform[1]);

          var index = j*forest.maxNumTrees + k;
          binaryFeatures[i][index].index = leafnodesPerTree * index + binaryCode;
          binaryFeatures[i][index].value = 1;

        }
      }
      binaryFeatures[i][forest.landmarkNum * forest.maxNumTrees].index = -1;
      binaryFeatures[i][forest.landmarkNum * forest.maxNumTrees].value = -1;
    }
    return binaryFeatures;

  }

  /**
   * Gets the binary code for a specific tree in a random forest. For each landmark,
   * the position from two pre-defined points are recovered from the training data
   * and then the intensity of the pixels corresponding to these points is extracted 
   * from the image and used to traverse the trees in the random forest. At the end,
   * the ending nodes will be represented by 1, and the remaining nodes by 0.
   * 
   * +--------------------------- Random Forest -----------------------------+ 
   * | Ø = Ending leaf                                                       |
   * |                                                                       |
   * |       O             O             O             O             O       |
   * |     /   \         /   \         /   \         /   \         /   \     |
   * |    O     O       O     O       O     O       O     O       O     O    |
   * |   / \   / \     / \   / \     / \   / \     / \   / \     / \   / \   |
   * |  Ø   O O   O   O   O Ø   O   O   Ø O   O   O   O Ø   O   O   O O   Ø  |
   * |  1   0 0   0   0   0 1   0   0   1 0   0   0   0 1   0   0   0 0   1  |
   * +-----------------------------------------------------------------------+
   * Final binary code for this landmark: 10000010010000100001
   *
   * @param {object} forest The tree to be analyzed.
   * @param {array} image The image with pixels in a grayscale linear array.
   * @param {matrix} shape The current landmarks shape.
   * @param {object} boudingBoxes The bounding box of the face.
   * @param {matrix} rotation The rotation matrix used to transform the projected landmarks
   *     into the mean shape.
   * @param {number} scale The scale factor used to transform the projected landmarks
   *     into the mean shape.
   * @return {number} The binary code extracted from the tree.
   * @static
   */
  tracking.LBF.Regressor.getCodeFromTree = function(tree, image, shape, boundingBox, rotation, scale){
    var current = 0;
    var bincode = 0;

    while(true){
      
      var x1 = Math.cos(tree.nodes[current].feats[0]) * tree.nodes[current].feats[2] * tree.maxRadioRadius * boundingBox.width;
      var y1 = Math.sin(tree.nodes[current].feats[0]) * tree.nodes[current].feats[2] * tree.maxRadioRadius * boundingBox.height;
      var x2 = Math.cos(tree.nodes[current].feats[1]) * tree.nodes[current].feats[3] * tree.maxRadioRadius * boundingBox.width;
      var y2 = Math.sin(tree.nodes[current].feats[1]) * tree.nodes[current].feats[3] * tree.maxRadioRadius * boundingBox.height;

      var project_x1 = rotation[0][0] * x1 + rotation[0][1] * y1;
      var project_y1 = rotation[1][0] * x1 + rotation[1][1] * y1;

      var real_x1 = Math.floor(project_x1 + shape[tree.landmarkID][0]);
      var real_y1 = Math.floor(project_y1 + shape[tree.landmarkID][1]);
      real_x1 = Math.max(0.0, Math.min(real_x1, image.height - 1.0));
      real_y1 = Math.max(0.0, Math.min(real_y1, image.width - 1.0));

      var project_x2 = rotation[0][0] * x2 + rotation[0][1] * y2;
      var project_y2 = rotation[1][0] * x2 + rotation[1][1] * y2;

      var real_x2 = Math.floor(project_x2 + shape[tree.landmarkID][0]);
      var real_y2 = Math.floor(project_y2 + shape[tree.landmarkID][1]);
      real_x2 = Math.max(0.0, Math.min(real_x2, image.height - 1.0));
      real_y2 = Math.max(0.0, Math.min(real_y2, image.width - 1.0));
      var pdf = Math.floor(image.data[real_y1*image.width + real_x1]) - 
          Math.floor(image.data[real_y2 * image.width +real_x2]);

      if(pdf < tree.nodes[current].thresh){
        current = tree.nodes[current].cnodes[0];
      }else{
        current = tree.nodes[current].cnodes[1];
      }

      if (tree.nodes[current].is_leafnode == 1) {
        bincode = 1;
        for (var i=0; i < tree.leafnodes.length; i++) {
          if (tree.leafnodes[i] == current) {
            return bincode;
          }
          bincode++;
        }
        return bincode;
      }

    }

    return bincode;
  }

}());