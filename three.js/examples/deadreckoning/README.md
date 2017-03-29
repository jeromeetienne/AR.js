# threex-motionpredictioncontrols.js
Simple motion prediction to experiment with AR.js.

It allows to get predict the motion of a object in the future based on it previous poses.
Here a pose of the associations of the position/quaterion/scale

It implements a very basic (maybe too naive ?) algorithm.

```
currentPosition = lastPosition + lastVelocity * deltaTime
```

Unfortunatly it doesn't provide results as good as expected for the moment.
