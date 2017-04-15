var THREEx	= THREEx	|| {}

// TODO: make something to be able to tune the tween with a minSpeed. thus the object3d can be have a constant velocity

THREEx.TweenControls	= function(object3d){
	var _this = this
	
	this.object3d = object3d
	this.enabled = true
	var startTime		= null

	var startPosition	= new THREE.Vector3
	var finalPosition	= new THREE.Vector3
	var startQuaternion	= new THREE.Quaternion
	var finalQuaternion	= new THREE.Quaternion
	var startScale		= new THREE.Vector3
	var finalScale		= new THREE.Vector3


	this.tweenDelay		= 1
	// to set the tween function 
	// - for a full list, see tween.js TWEEN.Easing in https://github.com/sole/tween.js/blob/master/src/Tween.js
	this.tweenFunction	= THREEx.TweenControls.Easing.Linear.None

	this.setTargetFromObject3D	= function(object3d){
		_this.setTarget(object3d.position, object3d.quaternion, object3d.scale)
	}
	this.setTarget	= function(newPosition, newQuaternion, newScale){
		// handle default arguments
		newPosition	= newPosition	|| object3d.position
		newQuaternion	= newQuaternion	|| object3d.quaternion
		newScale	= newScale	|| object3d.scale
		// set startTime
		startTime	= Date.now()/1000

		// set position
		startPosition.copy(object3d.position)
		finalPosition.copy(newPosition)
		// set quaternion
		startQuaternion.copy(object3d.quaternion)
		finalQuaternion.copy(newQuaternion)
		// set scale
		startScale.copy(object3d.scale)
		finalScale.copy(newScale)
	}
	this.isRunning	= function(){
		return startTime !== null ? true : false
	}
	this.update	= function(){
		// return now if no tweening is in progress
		if( startTime === null )	return

		var now		= Date.now()/1000
		// if tweening just completed or disabled, set it to final pose
		if( now - startTime > this.tweenDelay || _this.enabled === false ){
			startTime	= null
			// set the object3d at his final pose
			object3d.position.copy(finalPosition)
			object3d.quaternion.copy(finalQuaternion)
			object3d.scale.copy(finalScale)
			return
		}
		// compute and tween progress 
		var progress	= (now - startTime) / this.tweenDelay
		progress	= this.tweenFunction(progress)

		// Position - compute and set current delta position based on progress
		var distance	= finalPosition.distanceTo(startPosition) * progress
		var delta	= finalPosition.clone().sub(startPosition)
		delta.setLength(distance)
		object3d.position.copy(startPosition).add(delta)

		// Quaternion - compute and set current delta position based on progress
		object3d.quaternion.copy(startQuaternion).slerp(finalQuaternion, progress)

		// Scale - compute and set current delta position based on progress
		var distance	= finalScale.distanceTo(startScale) * progress
		var delta	= finalScale.clone().sub(startScale)
		delta.setLength(distance)
		object3d.scale.copy(startScale).add(delta)
	}
}


// By the excelent Tween.js library - https://github.com/tweenjs/tween.js
// copied here to avoid dependancy
THREEx.TweenControls.Easing = {

	Linear: {

		None: function (k) {

			return k;

		}

	},

	Quadratic: {

		In: function (k) {

			return k * k;

		},

		Out: function (k) {

			return k * (2 - k);

		},

		InOut: function (k) {

			if ((k *= 2) < 1) {
				return 0.5 * k * k;
			}

			return - 0.5 * (--k * (k - 2) - 1);

		}

	},

	Cubic: {

		In: function (k) {

			return k * k * k;

		},

		Out: function (k) {

			return --k * k * k + 1;

		},

		InOut: function (k) {

			if ((k *= 2) < 1) {
				return 0.5 * k * k * k;
			}

			return 0.5 * ((k -= 2) * k * k + 2);

		}

	},

	Quartic: {

		In: function (k) {

			return k * k * k * k;

		},

		Out: function (k) {

			return 1 - (--k * k * k * k);

		},

		InOut: function (k) {

			if ((k *= 2) < 1) {
				return 0.5 * k * k * k * k;
			}

			return - 0.5 * ((k -= 2) * k * k * k - 2);

		}

	},

	Quintic: {

		In: function (k) {

			return k * k * k * k * k;

		},

		Out: function (k) {

			return --k * k * k * k * k + 1;

		},

		InOut: function (k) {

			if ((k *= 2) < 1) {
				return 0.5 * k * k * k * k * k;
			}

			return 0.5 * ((k -= 2) * k * k * k * k + 2);

		}

	},

	Sinusoidal: {

		In: function (k) {

			return 1 - Math.cos(k * Math.PI / 2);

		},

		Out: function (k) {

			return Math.sin(k * Math.PI / 2);

		},

		InOut: function (k) {

			return 0.5 * (1 - Math.cos(Math.PI * k));

		}

	},

	Exponential: {

		In: function (k) {

			return k === 0 ? 0 : Math.pow(1024, k - 1);

		},

		Out: function (k) {

			return k === 1 ? 1 : 1 - Math.pow(2, - 10 * k);

		},

		InOut: function (k) {

			if (k === 0) {
				return 0;
			}

			if (k === 1) {
				return 1;
			}

			if ((k *= 2) < 1) {
				return 0.5 * Math.pow(1024, k - 1);
			}

			return 0.5 * (- Math.pow(2, - 10 * (k - 1)) + 2);

		}

	},

	Circular: {

		In: function (k) {

			return 1 - Math.sqrt(1 - k * k);

		},

		Out: function (k) {

			return Math.sqrt(1 - (--k * k));

		},

		InOut: function (k) {

			if ((k *= 2) < 1) {
				return - 0.5 * (Math.sqrt(1 - k * k) - 1);
			}

			return 0.5 * (Math.sqrt(1 - (k -= 2) * k) + 1);

		}

	},

	Elastic: {

		In: function (k) {

			if (k === 0) {
				return 0;
			}

			if (k === 1) {
				return 1;
			}

			return -Math.pow(2, 10 * (k - 1)) * Math.sin((k - 1.1) * 5 * Math.PI);

		},

		Out: function (k) {

			if (k === 0) {
				return 0;
			}

			if (k === 1) {
				return 1;
			}

			return Math.pow(2, -10 * k) * Math.sin((k - 0.1) * 5 * Math.PI) + 1;

		},

		InOut: function (k) {

			if (k === 0) {
				return 0;
			}

			if (k === 1) {
				return 1;
			}

			k *= 2;

			if (k < 1) {
				return -0.5 * Math.pow(2, 10 * (k - 1)) * Math.sin((k - 1.1) * 5 * Math.PI);
			}

			return 0.5 * Math.pow(2, -10 * (k - 1)) * Math.sin((k - 1.1) * 5 * Math.PI) + 1;

		}

	},

	Back: {

		In: function (k) {

			var s = 1.70158;

			return k * k * ((s + 1) * k - s);

		},

		Out: function (k) {

			var s = 1.70158;

			return --k * k * ((s + 1) * k + s) + 1;

		},

		InOut: function (k) {

			var s = 1.70158 * 1.525;

			if ((k *= 2) < 1) {
				return 0.5 * (k * k * ((s + 1) * k - s));
			}

			return 0.5 * ((k -= 2) * k * ((s + 1) * k + s) + 2);

		}

	},

	Bounce: {

		In: function (k) {

			return 1 - TWEEN.Easing.Bounce.Out(1 - k);

		},

		Out: function (k) {

			if (k < (1 / 2.75)) {
				return 7.5625 * k * k;
			} else if (k < (2 / 2.75)) {
				return 7.5625 * (k -= (1.5 / 2.75)) * k + 0.75;
			} else if (k < (2.5 / 2.75)) {
				return 7.5625 * (k -= (2.25 / 2.75)) * k + 0.9375;
			} else {
				return 7.5625 * (k -= (2.625 / 2.75)) * k + 0.984375;
			}

		},

		InOut: function (k) {

			if (k < 0.5) {
				return TWEEN.Easing.Bounce.In(k * 2) * 0.5;
			}

			return TWEEN.Easing.Bounce.Out(k * 2 - 1) * 0.5 + 0.5;

		}

	}

};
