# Node-AR.js

Node.js installable AR.js based on [AR.js](http://npm.im/ar.js) by [jeromeetienne](https://github.com/jeromeetienne).

- AR.js v1.6.0

## Usage

```js
import * as THREE from 'three';
import {
  ArToolkitSource,
  ArToolkitContext,
  ArMarkerControls,
  ArSmoothedControls
} from 'node-ar.js';

// ArToolkitSource uses your version of THREE.js
const _artoolkitsource = ArToolkitSource(THREE);
const arToolkitSource = new _artoolkitsource({
  sourceType: 'webcam'
});
```

Currently, the other modules use a pre-installed 0.95.x version of node.js.

Other modules can be used simply as:

```js
const arToolkitContext = new ArToolkitContext({
  cameraParametersUrl: cameraParam,
  detectionMode: 'mono',
  maxDetectionRate: 30,
  canvasWidth: 80 * 3,
  canvasHeight: 60 * 3
});

const markerControls = new ArMarkerControls(arToolkitContext, markerRoot, {
  type: 'pattern',
  patternUrl: markerPattern,
  changeMatrixMode: 'cameraTransformMatrix'
});

const smoothedControls = new ArSmoothedControls(smoothedRoot, {
  lerpPosition: 0.4,
  lerpQuaternion: 0.3,
  lerpScale: 1,
});
```

### TODO
Decouple all modules from THREE.js and make them rely on installer's THREE.js version
