;(function(){
	

var container = document.querySelector('.general-controls.widget')


var domElement = document.createElement('a')
domElement.href = 'http://googgle.com'
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
	alert('jerome etienne, c\'est mieux que james bond')	
})

})()
