function FogFX(o)
{
	this.enabled = true;
	this.start = 100;
	this.end = 1000;
	this.density = 0.001;
	this.type = FogFX.LINEAR;
	this.color = vec3.fromValues(0.5,0.5,0.5);

	if(o)
		this.configure(o);
}

FogFX.icon = "mini-icon-fog.png";

FogFX.LINEAR = 1;
FogFX.EXP = 2;
FogFX.EXP2 = 3;

FogFX["@color"] = { type: "color" };
FogFX["@density"] = { type: "number", min: 0, max:1, step:0.0001, precision: 4 };
FogFX["@type"] = { type:"enum", values: {"linear": FogFX.LINEAR, "exponential": FogFX.EXP, "exponential 2": FogFX.EXP2 }};


FogFX.prototype.onAddedToScene = function(scene)
{
	//LEvent.bind( scene,"fillLightUniforms",this.fillUniforms,this);
	LEvent.bind( scene, "fillSceneQuery",this.fillSceneQuery,this);
	LEvent.bind( scene, "fillSceneUniforms",this.fillSceneUniforms,this);
}

FogFX.prototype.onRemovedFromScene = function(scene)
{
	//LEvent.unbind(Scene,"fillLightUniforms",this.fillUniforms,this);
	LEvent.unbind( scene, "fillSceneQuery",this.fillSceneQuery, this);
	LEvent.unbind( scene, "fillSceneUniforms",this.fillSceneUniforms, this);
}

FogFX.prototype.fillSceneQuery = function(e, query )
{
	if(!this.enabled)
		return;

	query.macros.USE_FOG = ""
	switch(this.type)
	{
		case FogFX.EXP:	query.macros.USE_FOG_EXP = ""; break;
		case FogFX.EXP2: query.macros.USE_FOG_EXP2 = ""; break;
	}
}

FogFX.prototype.fillSceneUniforms = function(e, uniforms )
{
	if(!this.enabled) return;

	uniforms.u_fog_info = [ this.start, this.end, this.density ];
	uniforms.u_fog_color = this.color;
}

LS.registerComponent(FogFX);