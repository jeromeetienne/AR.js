- arMultiMarkerControls is done my own on top of normal arMarkerControls
- workaround all the silly bugs in jsartoolkit
- limit complexity of interaction with the library.


----------------------------------------------------
About doing my own:
- no more issue with the jsartoolkit version!!!
- there is nMarkers in your multi markers
- each subMarker is visible or not
- each subMarker got a transposition matrix (position/rotation/scale) for the origin of the multi marker
- the multimarker is visible if at least one subMarker MUST be visible
- the multimarker pose is the average of each subMarker view of the multiMarker origin

- allows more subtle markers
  - mix between pattern, or barcode markers
- be able to read a artoolkit multimarker files

--------------------------------------------------
THREEx.ArMultiMakersLearning = function(markersControls){
}

THREEx.ArMultiMarkerControls = function(markersControls, markersPose){
	this.object3d = new THREE.Group()

	// create x ArMarkerControls with a 
}
