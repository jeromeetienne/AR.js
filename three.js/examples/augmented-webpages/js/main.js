

var dialogs = document.querySelectorAll('dialog');
for(var i = 0; i < dialogs.length; i++){
    	dialogPolyfill.registerDialog(dialogs[i]);
	
}

googlInit()
// peerjsInit()
firebaseInit()
arAppURLInit()
markersPageInit()
fullscreenInit()
dialogsInit()

function displayResolution(){
	var resolution = window.innerWidth + 'x' + window.innerHeight
	alert('resolution is ' + resolution)
}
