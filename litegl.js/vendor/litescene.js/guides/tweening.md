# Tweening #

Tweening is the process by which we change a value from the current value to a target value smoothly over time using an interpolation curve.

Using tweening helps to make the changes in our application much more elegant.

LiteScene comes with its own tweening system.

To tween just call the LS.Tween.easyProperty passing the object containing the property, the property name in string format, the target value, and the time the transition should last.

```javascript
  	LS.Tween.easeProperty( node.transform, "x", 2.5, 1 );
```

By default it will use EASE_IN_OUT_QUAD interpolation function (quadratic interpolation for in and out), but you can choose any of the supported functions:

```javascript
  	LS.Tween.easeProperty( node.transform, "x", 2.5, 1, LS.Tween.EASE_IN_CUBIC );
```
Here is a list:

- EASE_IN_QUAD:
- EASE_OUT_QUAD: 
- EASE_IN_OUT_QUAD: 
- QUAD: 
- EASE_IN_CUBIC: 
- EASE_OUT_CUBIC: 
- EASE_IN_OUT_CUBIC: 
- CUBIC: 
- EASE_IN_QUART:
- EASE_OUT_QUART: 
- EASE_IN_OUT_QUART: 
- QUART: 
- EASE_IN_SINE: 
- EASE_OUT_SINE: 
- EASE_IN_OUT_SINE: 
- SINE: 
- EASE_IN_EXPO:
- EASE_OUT_EXPO:
- EASE_IN_OUT_EXPO:
- EXPO: 
- EASE_IN_BACK: 
- EASE_OUT_BACK:
- EASE_IN_OUT_BACK:
- BACK: 

In case you want to call a callback once per update or once it finishes you can pass the callbacks in order:

```javascript
  	LS.Tween.easeProperty( node.transform, "x", target, 1, LS.Tween.EASE_IN_CUBIC, on_complete, on_progress );
```

## Update ##

The pending tweens are processed using the method LS.Tween.update which is called automatically from LS.Player.update.

Also the system will check for a ```mustUpdate``` variable in the object and if it is pressed it will set it to true.

Keep in mind that if the scene is not running the tweens wont be processed.
