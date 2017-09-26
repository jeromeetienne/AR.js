# Useful API methods

When coding scripts in LiteScene we need to access many features present in the LiteScene system (to retrieve an scene node, a component, a resource, etc.

To do so here is a guide of the most common methods that you need to know.

Remember that if you need more specific info you can check the API reference in detail in [the webglstudio documentation page](http://webglstudio.org/doc/)
for all the libraries involved in the WebGLStudio ecosystem.

## LS.GlobalScene

To access the current active scene there is a global variable called ```LS.GlobalScene```.
Feel free to access it whenever you need to retrieve anything from the scene.

```js
var time = LS.GlobalScene.time;
```

All the nodes in the scene are children of one root node, in case you want to crawl the scene manually.

```js
LS.GlobalScene.root
```

## Retrieving nodes

To get the parent of a node you just need to use the ```node.parentNode``` property.

And if you want the child nodes then you can use the array ```node.childNodes``` or if you want all the descendants you can call ```node.getDescendants``` (this will retrieve children and children of children...)

When we want to retrieve one node from the scene we have different options:

* ```LS.GlobalScene.getNode( name_or_uid )```: this allows to pass any kind of node identifier (like node name or uid), it is slower when working with node names because they are not indexed.
* ```LS.GlobalScene.getNodeByUid( uid )```: this search by uid and because uids are indexed this is the fastest one.
* ```LS.GlobalScene.getNodeByName( name )```: this search by name, but because they are not indexed this is slower.

Sometimes we want to find a node searching only inside one node. When searching using findNode the method crawls the tree so it could be slow if there are many child nodes.

* ```node.findNode( name_or_uid )```
* ```node.findNodeByName( name )```
* ```node.findNodeByUid( name )```

## Retrieving components

When we have a node sometimes we need to fetch for an specific component of that node.

All the components of a node are stored in an array at ```node.components``` but if we want to fetch it:

* ```node.getComponent( "MeshRenderer" )``` we can fetch by component class name (it will return the first occurrence).
* ```node.getComponent( LS.Components.MeshRenderer )``` we can fetch by class (this is slightly faster).
* ```node.getComponentByUId( uid )``` we can fetch by the uid of the component class.

If we have the UID of a component that we know it is in the scene we can try to find it using:

* ```LS.GlobalScene.findComponent( uid )```

## Retrieving Resources

Usually we need to retrieve resources like textures, meshes or data to use it in our code. 

The problem with resources is that they may or may not have been loaded in the system so you need to ask the system to load them:

```js
var resource = LS.ResourcesManager.load( resource_path, on_loaded );
if( resource )
{
  //...
}

function on_loaded( resource )
{
  //...
}
```

Or if you just want to retrieve it:

```js
var res = LS.ResourcesManager.getResource( url );
```

## Destroying instances

Sometimes you want to remove some element from the system:

* For nodes: ```node.destroy();```
* For components: ```node.removeComponent( component );```
* For resources: ```LS.ResourcesManager.unregisterResource( filename );```












