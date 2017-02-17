var THREEx	= THREEx || {};


/**
 * create a THREEx.Animations
 *
 * @name THREEx.createAnimations
 * @class
*/
THREEx.createAnimations	= function(){
	return new THREEx.Animations();
}

/**
 * handle multiple THREEx.Animation mutually exclusive
 *
 * @name THREEx.Animations
 * @class
*/
THREEx.Animations	= function(){
	this._animations	= {};
	this._currentAnim	= null;
	this._animationName	= null;
}

/**
 * Destructor
*/
THREEx.Animations.prototype.destroy	= function(){
	this._currentAnim	&& this._currentAnim.destroy();
}

//////////////////////////////////////////////////////////////////////////////////
//										//
//////////////////////////////////////////////////////////////////////////////////

/**
 * Add an animation
 *
 * @param {String} name the name of the animation to add
 * @param {THREEx.Animation} animation the THREEx.Animation to add
*/
THREEx.Animations.prototype.add	= function(name, animation){
	console.assert( animation instanceof THREEx.Animation );
	this._animations[name]	= animation;
	return this;	// for chained api
};

THREEx.Animations.prototype.list	= function(){
	return this._animations;
};

/**
 * return the name of all animations
 * 
 * @returns {String[]} list of the animations names
*/
THREEx.Animations.prototype.names	= function(){
	return Object.keys(this._animations);
};

//////////////////////////////////////////////////////////////////////////////////
//										//
//////////////////////////////////////////////////////////////////////////////////

/**
 * Start a animation. If an animation is already running, it is stopped
 * 
 * @param {string} animationName the name of the animation
*/
THREEx.Animations.prototype.start	= function(animationName){
	// if this animation is already the current one, do nothing
	if( this._animationName === animationName )	return this;
	// stop current animation
	if( this.isRunning() )	this.stop();
	console.assert( this._animations[animationName] !== undefined, "unknown animation name: "+animationName)
	this._animationName	= animationName;
	this._currentAnim	= this._animations[animationName];
	this._currentAnim.start();
	return this;	// for chained API
};

/**
 * test if an animation is running
 * 
 * @returns {boolean} true if an animation is running, false otherwise
*/
THREEx.Animations.prototype.isRunning	= function(){
	return this._currentAnim ? true : false;
}


/**
 * rendering update function
 */
THREEx.Animations.prototype.update	= function(delta, now){
	if( this.isRunning() === false )	return
	this._currentAnim.update(delta, now)
}

THREEx.Animations.prototype.animationName	= function(){
	return this._animationName;
}

/**
 * Stop the running animation if any
*/
THREEx.Animations.prototype.stop	= function(){
	this._currentAnim	&& this._currentAnim.destroy();
	this._currentAnim	= null;
	this._animationName	= null;
	return this;	// for chained API
}
