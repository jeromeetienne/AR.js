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

	// push the css 
	var styleData = `
		#myArCode {
			position: absolute;
			transform: translateY(-50%) translateX(-50%);
			margin-left: 0;
			top: 50%;
			max-width: 90%;
			max-height: 90%;
			margin-top: 0;
			left: 50%;
		}
	`
	var domElement = document.createElement('style');
	domElement.innerHTML = styleData;
	document.body.appendChild(domElement);


	var domElement = document.createElement('img')
	domElement.src = 'http://127.0.0.1:8080/three.js/examples/sketchfab/images/ar-code.png'
	domElement.setAttribute('id', 'myArCode')
	

	var container = document.querySelector('.gui.enabled')
	container.appendChild(domElement)
})

})()
