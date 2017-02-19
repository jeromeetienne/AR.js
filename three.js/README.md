# threex artoolkit
three.js extension to easily handle artoolkit.
It is the main part of my [WebAR effort](http://github.com/jeromeetienne/webAR)



# THREEx.ArMarkerControls 

Parameters:
```json
	// debug - true if one should display artoolkit debug canvas, false otherwise
	debug: false,
	// the mode of detection - ['color', 'color_and_matrix', 'mono', 'mono_and_matrix']
	detectionMode: 'color_and_matrix',
	// type of matrix code - valid iif detectionMode end with 'matrix' - [3x3, 3x3_HAMMING63, 3x3_PARITY65, 4x4, 4x4_BCH_13_9_3, 4x4_BCH_13_5_5]
	matrixCodeType: '3x3',
	
	// url of the camera parameters
	cameraParametersUrl: 'parameters/camera_para.dat',

	// tune the maximum rate of pose detection in the source image
	maxDetectionRate: 60,
	// resolution of at which we detect pose in the source image
	sourceWidth: 640,
	sourceHeight: 480,
	
	// enable image smoothing or not for canvas copy - default to true
	// https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/imageSmoothingEnabled
	imageSmoothingEnabled : true,
}
```
