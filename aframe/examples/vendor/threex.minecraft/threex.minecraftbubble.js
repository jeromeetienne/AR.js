var THREEx	= THREEx	|| {}

THREEx.MinecraftBubble	= function(character){
	var _this = this
	//////////////////////////////////////////////////////////////////////////////////
	//		update functions						//
	//////////////////////////////////////////////////////////////////////////////////
	
	var onRenderFcts= [];
	this.update	= function(delta, now){
		onRenderFcts.forEach(function(updateFct){
			updateFct(delta, now)
		})
	}.bind(this)	

	//////////////////////////////////////////////////////////////////////////////////
	//		Say								//
	//////////////////////////////////////////////////////////////////////////////////
	this._object3D	= null
	this._createdAt	= null
	this.expireAfter= 10.0
	this.update	= function(delta, now){
		// if there is no say at the moment, do nothing
		if( _this._createdAt === null )	return
		// if the say sprite isnt old enougth to timeout, do nothing
		var sayAge	= (Date.now() - _this._createdAt)/1000.0
		if( sayAge < _this.expireAfter )		return
		// remove the say sprite
		_this.clear()
	}
	this.clear	= function(){
		if( this._object3D === null )	return
		character.root.remove(this._object3D)
		this._object3D	= null
		this._createdAt	= null
	}
	this.set	= function(text){
		if( this._object3D )	this.clear()
		// update for timer
		this._createdAt	= Date.now()
		// build the texture
		var canvas	= buildChatBubble(text);
		var texture	= new THREE.Texture(canvas)
		texture.needsUpdate	= true
		// build the sprite itself
		var material	= new THREE.SpriteMaterial({
			map			: texture,
			useScreenCoordinates	: false
		});
		var sprite		= new THREE.Sprite( material );
		this._object3D	= sprite
		sprite.scale.multiplyScalar(4)
		sprite.position.y	= 1.5
		// add sprite to the character
		character.root.add(this._object3D)
	}
	return 
	
	function buildChatBubble(text) {
		// create the canvas
		var canvas	= document.createElement("canvas");
		var context	= canvas.getContext("2d");
		canvas.width	= 1024;
		canvas.height	= 512;
		// center the origin
		context.translate( canvas.width/2, canvas.height/2 );
		// measure text
		var fontSize	= 24;
		context.font	= "bolder "+fontSize+"px Verdana";
		var fontH	= fontSize;
		var fontW	= context.measureText(text).width;
		// build the background
		context.fillStyle = "rgba(255,255,255,0.3)";
		var scale	= 1.2;
		context.fillRect(-fontW*scale/2,-fontH*scale/1.3,fontW*scale,fontH*scale)
		// display the text
		context.fillStyle = "rgba(0,0,0,0.7)";
		context.fillText(text, -fontW/2, 0);
		// return the canvas element
		return canvas;
	};
}
