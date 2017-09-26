# Actions

To make the editor more powerful some components allow to perform special actions on them directly from the editor (they appear in the contextual menu of the component if you right click in the title).

This actions could be defined by the components, or by the editor, and stored in a way they can be easily accessed.

Here are some examples of common actions:
- copy
- paste
- reset
- share

But some components could have special ones.

## Action object

An action is an object with some properties:
- title: what text to show to the user when listing actions
- callback: callback to call when the action is performed (the this will the component where the action is performed)
- callback_show: [optional] a callback that must return true if this action must be shown to this component

## How to define actions

There are three ways to define actions:
- In the class Component: actions that are global to any component
- In the constructor of a specific component: this action is specific of this component class
- In the instance of a component: this action is specific of this instance

To add them to the component class:

```js
LS.Component.actions["copy"] = { 
	title:"Copy",
	callback: function(){
		EditorModule.copyComponentToClipboard(this);
	}
};  
```

To add them to an specific component:

```js
LS.Components.Camera.actions["setview"] = { 
  title: "Set to view", 
  callback: function() { 
    //...
  }
};

Or to add to an instance:

myinstance.getActions = function( actions )
{
  //modify actions array
  //...
  return actions;
}
