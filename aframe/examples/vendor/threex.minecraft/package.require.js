define( [ 'module'	// to set .baseURL
	, './threex.animation'
	, './threex.animations'
	, './threex.minecraft'
	, './threex.minecraftcharbodyanim'
	, './threex.minecraftcharheadanim'
	, './threex.minecraftcontrols'
	, './threex.minecraftplayer'
	], function(module){
	// set baseUrl for this extension
	THREEx.MinecraftChar.baseUrl	= module.uri+'/../';
});