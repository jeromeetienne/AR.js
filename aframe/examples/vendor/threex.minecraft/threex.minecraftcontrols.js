var THREEx	= THREEx || {};


THREEx.MinecraftControls	= function(character, input){
	var _this = this
	// arguments default values
	input		= input	|| {}

	// handle arguments default values
	this.speed		= 2;
	this.angularSpeed	= 0.2 * Math.PI * 2;
	this.input	= input;
	this.object3d	= character.root;
	
	// user control
	this.update	= function(delta, now){
		var prevPosition	= _this.object3d.position.clone();
		// rotation
		if( input.left )	_this.object3d.rotation.y += this.angularSpeed*delta
		if( input.right )	_this.object3d.rotation.y -= this.angularSpeed*delta

		// strafe
		var distance	= 0;
		if( input.strafeLeft )	distance	= +this.speed * delta;
		if( input.strafeRight )	distance	= -this.speed * delta;
		if( distance ){
			var velocity	= new THREE.Vector3(distance, 0, 0);
			var matrix	= new THREE.Matrix4().makeRotationY(object3d.rotation.y);
			velocity.applyMatrix4( matrix );
			_this.object3d.position.add(velocity);
		}

		// up/down
		var distance	= 0;
		if( input.up )		distance	= +this.speed * delta;
		if( input.down )	distance	= -this.speed * delta;
		if( distance ){
			var velocity	= new THREE.Vector3(0, 0, distance);
			var matrix	= new THREE.Matrix4().makeRotationY(_this.object3d.rotation.y);
			velocity.applyMatrix4( matrix );
			_this.object3d.position.add(velocity);
		}
	}
}

THREEx.MinecraftControls.setKeyboardInput = function(controls, mappings){
	mappings = mappings || ['wasd', 'ijkl', 'arrows']
	
	document.body.addEventListener('keydown', function(event){
		var input	= controls.input
		if( mappings.indexOf('wasd') !== -1 ){
			if( event.keyCode === 'W'.charCodeAt(0) )	input.up	= true
			if( event.keyCode === 'S'.charCodeAt(0) )	input.down	= true
			if( event.keyCode === 'A'.charCodeAt(0) )	input.left	= true
			if( event.keyCode === 'D'.charCodeAt(0) )	input.right	= true
			if( event.keyCode === 'Q'.charCodeAt(0) )	input.strafeLeft= true
			if( event.keyCode === 'E'.charCodeAt(0) )	input.strafeRight= true			
		}

		if( mappings.indexOf('ijkl') !== -1 ){
			if( event.keyCode === 'I'.charCodeAt(0) )	input.up	= true
			if( event.keyCode === 'K'.charCodeAt(0) )	input.down	= true
			if( event.keyCode === 'J'.charCodeAt(0) )	input.left	= true
			if( event.keyCode === 'L'.charCodeAt(0) )	input.right	= true
			if( event.keyCode === 'U'.charCodeAt(0) )	input.strafeLeft= true
			if( event.keyCode === 'O'.charCodeAt(0) )	input.strafeRight= true			
		}

		// to support arrows because tsate asked me :)
		if( mappings.indexOf('arrows') !== -1 ){
			if( event.keyCode === 38 )			input.up	= true
			if( event.keyCode === 40 )			input.down	= true
			if( event.keyCode === 37 && !event.shiftKey )	input.left	= true
			if( event.keyCode === 39 && !event.shiftKey )	input.right	= true
			if( event.keyCode === 37 &&  event.shiftKey )	input.strafeLeft= true
			if( event.keyCode === 39 &&  event.shiftKey )	input.strafeRight= true
		}
	})

	document.body.addEventListener('keyup', function(event){
		var input	= controls.input
		
		if( mappings.indexOf('wasd') !== -1 ){
			if( event.keyCode === 'W'.charCodeAt(0) )	input.up	= false
			if( event.keyCode === 'S'.charCodeAt(0) )	input.down	= false
			if( event.keyCode === 'A'.charCodeAt(0) )	input.left	= false
			if( event.keyCode === 'D'.charCodeAt(0) )	input.right	= false
			if( event.keyCode === 'Q'.charCodeAt(0) )	input.strafeLeft= false
			if( event.keyCode === 'E'.charCodeAt(0) )	input.strafeRight= false
		}
				
		if( mappings.indexOf('ijkl') !== -1 ){
			if( event.keyCode === 'I'.charCodeAt(0) )	input.up	= false
			if( event.keyCode === 'K'.charCodeAt(0) )	input.down	= false
			if( event.keyCode === 'J'.charCodeAt(0) )	input.left	= false
			if( event.keyCode === 'L'.charCodeAt(0) )	input.right	= false
			if( event.keyCode === 'U'.charCodeAt(0) )	input.strafeLeft= false
			if( event.keyCode === 'O'.charCodeAt(0) )	input.strafeRight= false
		}


		// to support arrows because tsate asked me :)
		if( mappings.indexOf('arrows') !== -1 ){
			if( event.keyCode === 38 )			input.up	= false
			if( event.keyCode === 40 )			input.down	= false
			if( event.keyCode === 37 ||  event.shiftKey )	input.left	= false
			if( event.keyCode === 39 ||  event.shiftKey )	input.right	= false
			if( event.keyCode === 37 || !event.shiftKey )	input.strafeLeft= false
			if( event.keyCode === 39 || !event.shiftKey )	input.strafeRight= false
		}
	})	
	return controls
}
