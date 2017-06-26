

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


;(function(){
        window.addEventListener('resize', onResize)
        onResize()
        
        function onResize(){
                document.querySelector('#markerPageResolution').innerHTML = window.innerWidth + 'x' + window.innerHeight
        }
})()
