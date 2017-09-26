# Events 

Inside LiteGL there is also an events system, that allow to bind events to any object.

```js
var instance = {
  callback: function(e,params)
  {
     //e is the string containing the event name
  }
}

//bind the listener to the object
LEvent.bind( object, "eventname", callback, instance );

//this will dispatch the event
LEvent.trigger( object, "eventname", params); 

```

You can bind events to gl context like mousedown, mousemove, keydown, etc if you want to avoid using the callbacks.
