# ShaderBlocks

The problem when using ShaderMaterials is that the shader defined by the user is static,
which means that nothing from the scene could affect the ShaderCode in this ShaderMaterial.

This is a problem because when rendering objects in a scene different elements from the scene could affect the way it is seen.
For instance lights contribute to the color, but also mesh deformers (blend shapes, skinning) or even atmospheric FX (Fog).

To tackle this problem ShaderCode allows to include ShaderBlocks.

A ShaderBlock its a snippet of code that could be toggled from different elements of the render pipeline.

Depending on if the ShaderBlock is enabled or disabled it will output a different fragment of code.
And because every shaderblock has its own unique number, they can be easily mapped using bit operations in a 64 bits number.

## Creating a ShaderBlock

To create a ShaderBlock you must instatiate the ShaderBlock class and configure it:

First create the ShaderBlock and give it a name (this name will be the one referenced from the shader when including it):
```javascript
var morphing_block = new LS.ShaderBlock("morphing");
```
The next step is to add the code snippets for the Vertex or Fragment shader. 

When adding a code snippet you have to pass two snippets, one for when the ShaderBlock is enabled and one for when it is disabled. This is because from your shader you will be calling functions contained in this ShaderBlock, and you want the shader to have this functions even if the ShaderBlock is disabled.

```javascript
morphing_block.addCode( GL.VERTEX_SHADER, MorphDeformer.morph_enabled_shader_code, MorphDeformer.morph_disabled_shader_code );
```

Register the ShaderBlock in the system by calling the register function:

```javascript
morphing_block.register();
```

After doing this you can call it from your shader:

```cpp
#pragma shaderblock "morphing"

void main() {
  //...
  applyMorphing( vertex4, v_normal ); //this function is defined inside the shader block
```

To activate the ShaderBlock from your javascript component you have to get the RenderInstance and add it there:

```javascript
   var RI = node._instances[0];
   RI.addShaderBlock( morphing_block );
```


## Chaining ShaderBlocks

You can chain several ShaderBlocks so one can include another one, just use the same syntaxis using pragmas.
Just be careful of not creating recursive loops.

```cpp
//from my ShaderBlock "morphing"...
#pragma shaderblock "morphing_texture"
```

## Conditional ShaderBlocks

Sometimes you want to have a ShaderBlock that can include optionaly another one based on if that other ShaderBlock is enabled or not.
This may seem strange but it is common when we have a ShaderBlock that can be affected by other ShaderBlocks, for instance lighting is a ShaderBlock but Shadowing is another ShaderBlock and there are different Shadowing techniques.

To solve this a ShaderBlock can include a ShaderBlock but instead of specifying the name, it can specify a dynamic name that will be read from the ShaderBlock context:

```
#pragma shaderblock morphing_mode
```

This means that the shaderblock name will be extracted from that variable inside the context (in this case ```morphing_mode``` is the variable).

The variable name can be defined from the ShaderBlock and only will be assigned if that ShaderBlock is enabled.

```javascript
var morphing_texture_block = new LS.ShaderBlock("morphing_texture");
morphing_texture_block.defineContextMacros( { "morphing_mode": "morphing_texture"} );
```

## Conclusion

Check the ShaderMaterial, ShaderCode, ShaderManager, ShaderBlock and GLSLParser to understand better how it works.

Also check the MorphDeformer component as a complete use-case.

