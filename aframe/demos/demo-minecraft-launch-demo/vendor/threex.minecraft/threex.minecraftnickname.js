var THREEx	= THREEx	|| {}

THREEx.MinecraftNickname	= function(character){
	this.object3d	= null;
	this.clear	= function(){
		if( this.object3d === null )	return
		character.root.remove(this.object3d)
		this.object3d	= null
	}
	this.set = function(nickName){
		if( this.object3d )	this.clear()
		// build the texture
		var canvas	= buildNickCartouche(nickName);
		var texture	= new THREE.Texture(canvas)
		texture.needsUpdate	= true
		// build the sprite itself
		var material	= new THREE.SpriteMaterial({
			map			: texture,
			useScreenCoordinates	: false
		});
		var sprite		= new THREE.Sprite( material );
		this.object3d	= sprite
		sprite.position.y	= 1.15
		// add sprite to the character
		character.root.add(this.object3d)
	}
	return
	/**
	 * Build a canvas for the nickname cartouche
	 */
	function buildNickCartouche(text){
		// create the canvas
		var canvas	= document.createElement("canvas");
		var context	= canvas.getContext("2d");
		canvas.width	= 256;
		canvas.height	= 128;
		// center the origin
		context.translate( canvas.width/2, canvas.height/2 );
		// measure text
		var fontSize	= 36;
		context.font	= "bolder "+fontSize+"px Verdana";
		var fontH	= fontSize;
		var fontW	= context.measureText(text).width;
		// build the background
		context.fillStyle = "rgba(0,0,255,0.3)";
		var scale	= 1.2;
		context.fillRect(-fontW*scale/2,-fontH*scale/1.3,fontW*scale,fontH*scale)
		// display the text
		context.fillStyle = "rgba(0,0,0,0.7)";
		context.fillText(text, -fontW/2, 0);
		// return the canvas element
		return canvas;
	};
}
