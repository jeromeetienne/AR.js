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
	var isPresent = document.querySelector('#myArCode') !== null ? true : false
	if( isPresent === true ){
		var domElement = document.querySelector('#myArCode')
		domElement.parentNode.removeChild(domElement)
		var domElement = document.querySelector('#myCache')
		domElement.parentNode.removeChild(domElement)
		return
	}
	

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
		#myCache {
			position: absolute;
			background-color: white;
			width: 100%;
			height: 100%;
			top: 0;
			bottom: 0;
			left: 0;
			right: 0;
		}
	`
	var domElement = document.createElement('style');
	domElement.innerHTML = styleData;
	document.body.appendChild(domElement);
	
	var domElement = document.createElement('div')
	domElement.setAttribute('id', 'myCache')
	document.querySelector('.gui.enabled').appendChild(domElement)

	
	var domElement = document.createElement('img')
	domElement.src = 'http://127.0.0.1:8080/three.js/examples/sketchfab/images/ar-code.png'
	// domElement.src = 'http://127.0.0.1:8080/data/images/hiro.png'
	domElement.setAttribute('id', 'myArCode')
	document.querySelector('.gui.enabled').appendChild(domElement)



})

})()
