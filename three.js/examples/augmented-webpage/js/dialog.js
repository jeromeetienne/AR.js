function dialogsInit(){
	// infoDialog and infoDialog
	document.querySelector('#infoButton').addEventListener('click', function(){
		document.querySelector('#infoDialog').showModal()
	})
	document.querySelector('#infoDialog .close').addEventListener('click', function(){
		document.querySelector('#infoDialog').close()
	})

	// helpDialog and helpDialog
	document.querySelector('#helpButton').addEventListener('click', function(){
		document.querySelector('#helpDialog').showModal()
	})
	document.querySelector('#helpDialog .close').addEventListener('click', function(){
		document.querySelector('#helpDialog').close()
	})	
}
