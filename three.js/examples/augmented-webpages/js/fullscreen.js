//////////////////////////////////////////////////////////////////////////////
//		toggleFullScreen
//////////////////////////////////////////////////////////////////////////////
// from https://stackoverflow.com/questions/21280966/toggle-fullscreen-exit
function fullScreenSet(enabled) {
	if ( enabled === true ){
		if (document.documentElement.requestFullscreen) {
			document.documentElement.requestFullscreen();
		} else if (document.documentElement.msRequestFullscreen) {
			document.documentElement.msRequestFullscreen();
		} else if (document.documentElement.mozRequestFullScreen) {
			document.documentElement.mozRequestFullScreen();
		} else if (document.documentElement.webkitRequestFullscreen) {
			document.documentElement.webkitRequestFullscreen(Element.ALLOW_KEYBOARD_INPUT);
		}
	}else if ( enabled === false){
		if (document.exitFullscreen) {
			document.exitFullscreen();
		} else if (document.msExitFullscreen) {
			document.msExitFullscreen();
		} else if (document.mozCancelFullScreen) {
			document.mozCancelFullScreen();
		} else if (document.webkitExitFullscreen) {
			document.webkitExitFullscreen();
		}
	}else console.assert(false)
}

function fullscreenToggle(){
	if( isFullscreen() ){
		fullScreenSet(false)
	}else{
		fullScreenSet(true)	
	}
}

function fullscreenInit(){
	document.querySelector('#fullscreenButton').addEventListener('click', function(){
		fullscreenToggle()
	})
	
	document.addEventListener('keydown', function(event){
		if( event.code !== 'KeyT' ) return
		fullscreenToggle()
	})
	// document.addEventListener("webkitfullscreenchange", function( event ) {
	// 	if( isFullscreen() === false ){
	// 		markersPageLeave()
	// 	}
	// })	

	// document.addEventListener("webkitfullscreenchange", function( event ) {
	// 	if( isFullscreen() === true ){
	// 		markersPageEnter()
	// 	}else{
	// 		markersPageLeave()
	// 	}
	// })	
}


function isFullscreen(){
	return document.webkitIsFullScreen
}
