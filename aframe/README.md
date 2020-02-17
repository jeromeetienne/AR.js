# aframe-ar
Augmented reality for a-frame.

## Marker Based

### \<a-marker\>

Here are the attributes for this entity

| Attribute | Description | Component Mapping |
| --- | --- | --- |
| type | type of marker - ['pattern', 'barcode', 'unknown' ] | artoolkitmarker.type |
| size | size of the marker in meter | artoolkitmarker.size |
| url | url of the pattern - IIF type='pattern' | artoolkitmarker.patternUrl |
| value | value of the barcode - IIF type='barcode' | artoolkitmarker.barcodeValue |
| preset | parameters preset - ['hiro', 'kanji'] | artoolkitmarker.preset |
| emitevents | emits 'markerFound' and 'markerLost' events - ['true', 'false'] | - |
| smooth | turn on/off camera smoothing - ['true', 'false'] - default: false | - |
| smoothCount | number of matrices to smooth tracking over, more = smoother but slower follow - default: 5 | - |
| smoothTolerance | distance tolerance for smoothing, if smoothThreshold # of matrices are under tolerance, tracking will stay still - default: 0.01 | - |
| smoothThreshold | threshold for smoothing, will keep still unless enough matrices are over tolerance - default: 2 | - |


### \<a-marker-camera\>
Usually the model used in augmented reality is about changing the modelViewMatrix
based on the marker position. the camera being static in 0,0,0 looking toward negative z.

We define as well a model where we move the camera, instead of the object.
It changes the camera transform matrix.

This cameraTransform mode seems more instinctive than the modelView mode.
cameraTransform would fit well a room-scale setup, with *multiple markers connected to each other*.
modelView is able to provide multiple *independent* markers.

```html
<!-- add artoolkit into your scene -->
<a-scene artoolkit>
<!-- define your scene as usual -->
<a-box></a-box>
<!-- define a camera inside the <a-marker-camera> -->
<a-marker-camera preset='hiro'><a-marker-camera>
</a-scene>
```

## Location Based


### `gps-camera`

**Required**: yes
**Max allowed per scene**: 1

This component enables the Location AR. It has to be added to the `camera` entity.
It makes possible to handle both position and rotation of the camera and it's used to determine where the user is pointing their device.

For example:

```HTML
<a-camera gps-camera rotation-reader></a-camera>
```

In addition to that, as you can see on the example above, we also have to add `rotation-reader` to handle rotation events. See [here](https://aframe.io/docs/0.9.0/components/camera.html#reading-position-or-rotation-of-the-camera) for more details.


### Properties

| Property   | Description | Default Value |
|------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|---------------|
| alert     | Whether to show a message when GPS signal is under the `positionMinAccuracy`                  | false |                                                                                                                                                                        | true          |
| positionMinAccuracy        | Minimum accuracy allowed for position signal    | 100 |
| minDistance        | If set, places with a distance from the user lower than this value, are not showed. Only a positive value is allowed. Value is in meters.    | 0 (disabled) |
| simulateLatitude   | Setting this allows you to simulate the latitude of the camera, to aid in testing.    | 0 (disabled) |
| simulateLongitude   | Setting this allows you to simulate the longitude of the camera, to aid in testing.    | 0 (disabled) |
| simulateAltitude   | Setting this allows you to simulate the altitude of the camera in meters above sea level, to aid in testing.    | 0 (disabled) |


### `gps-entity-place`

**Required**: yes
**Max allowed per scene**: no limit

This component makes each entity GPS-trackable. This assigns a specific world position to an entity, so that the user can see it when their device is pointing to its position in the real world. If the user is far from the entity, it will seem smaller. If it's too far away, it won't be seen at all.

It requires latitude and longitude as a single string parameter (example with `a-box` aframe primitive):

```HTML
<a-box color="yellow" gps-entity-place="latitude: <your-latitude>; longitude: <your-longitude>"/>
```

In addition, you can use the a-frame "position" parameter to assign a y-value or altitude to the entity.  This value should be entered in meters above or below sea level. For example, this would assign a height of 300 meters above sea level, and will be displayed relative to the gps-camera's current altitude:

```HTML
<a-box color="yellow" gps-entity-place="latitude: <your-latitude>; longitude: <your-longitude>" position="0 300 0"/>
```



| Custom Attribute   | Description | Default Value |
|------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|---------------|
| distance        | Distance from user, updated at every user position update. Value in meters.   | 0 |
| distanceMsg        | Distance from user, updated at every user position update. Value as `<distance> meters/kilometers`.   | '' |

### `gps-camera-debug` [deprecated, may not work]

**Required**: no
**Max allowed per scene**: 1

This component should only be added in development environments, not in production environments.
It shows a debug UI with camera informations and a list of registered `gps-entity-place` entities, showing also distance from the user for each one.

```HTML
<a-scene gps-camera-debug embedded arjs='sourceType: webcam; debugUIEnabled: false;'></a-scene>
```

## Tips

### **Content that will always face the user**

Look at [this example](./examples/always-face-user/index.html) in order to create `gps-entity-place` entities that will always face the user (so the user camera).

## Location Based Support

Tried on Huawei P20, works like charm.

Works good also on iPhone 6.

On iOS, from 12.2, Motion sensors on Safari has be to activated from Settings. If not, GeoAR.js will prompt the user to do so.
This [may change with final release of iOS 13](https://developer.apple.com/documentation/safari_release_notes/safari_13_beta_6_release_notes) but as September 2019 is not yet out.

We need a lot of more tests, but the first impression is: the more advanced the phone (so newer) the better. This because of better quality sensors.

## General useful links

- [slides about aframe-ar](http://jeromeetienne.github.io/slides/artoolkit-aframe/)
- Augmented reality is about [understand the view matrix](http://www.3dgep.com/understanding-the-view-matrix/)
- [jsartoolkit5](https://github.com/artoolkit/jsartoolkit5)
- [artoolkit5](https://github.com/artoolkit/artoolkit5/)
- good collection of [marker patterns](https://github.com/artoolkit/artoolkit5/tree/master/doc/patterns)
