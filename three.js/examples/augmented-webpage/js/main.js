googlInit()
firebaseInit()
arAppURLInit()
markersPageInit()
fullscreenInit()
dialogsInit()


// kludge to display resolution - used to debug
;(function(){
        window.addEventListener('resize', onResize)
        onResize()
        
        function onResize(){
                document.querySelector('#markerPageResolution').innerHTML = window.innerWidth + 'x' + window.innerHeight
        }
})()
