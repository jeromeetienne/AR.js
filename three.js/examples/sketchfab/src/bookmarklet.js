;(function(){
	

var container = document.querySelector('.general-controls.widget')


var domElement = document.createElement('a')
domElement.href = 'javascript:void(0)'
domElement.innerHTML = 'AR.js'
// container.appendChild(domElement)


// var domElement = document.createElement('img')
// domElement.src = 'http://127.0.0.1:8080/data/logo/logo-black-transparent-512x204.png'
// domElement.style.width = '64px'
// domElement.style.height = '24px'



domElement.classList.add('control')
domElement.classList.add('tooltip')
domElement.dataset.title = 'Switch to AR'
container.insertBefore(domElement, container.firstChild);



domElement.addEventListener('click', function(){
	// alert('jerome etienne, c\'est mieux que james bond')	
	// TODO add an image AR-Code inside the player
	// three.js/examples/sketchfab/images/ar-code.png


	var domElement = document.createElement('img')
	domElement.src = 'http://127.0.0.1:8080/three.js/examples/sketchfab/images/ar-code.png'
	domElement.style.width = 'auto'
	domElement.style.height = 'auto'
	domElement.style.maxWidth = '80%'
	domElement.style.maxHeight = '80%'
	

	var container = document.querySelector('.gui.enabled')
	container.appendChild(domElement)
})

})()
