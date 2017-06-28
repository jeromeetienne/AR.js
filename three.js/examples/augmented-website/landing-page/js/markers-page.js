
function markersPageInit(){
	markersPageUpdateBrightnessOpacity()

	markersPageSetTrackingBackend('artoolkit')	

	document.body.addEventListener('keydown', function(event){
		if( event.code !== 'Space' )	return
		markersPageEnter()
	})

	document.body.addEventListener('keydown', function(event){
		if( event.code !== 'Backspace' && event.code !== 'Escape' )	return
		markersPageLeave()
	})
	
	document.body.addEventListener('keydown', function(event){
		if( event.code === 'ArrowLeft' ){
			markersPageBrightness -= 0.025
		}else if( event.code === 'ArrowRight' ){
			markersPageBrightness += 0.025
		}else if( event.code === 'ArrowUp' ){
			markersPageOpacity += 0.025
		}else if( event.code === 'ArrowDown' ){
			markersPageOpacity -= 0.025		
		}else{
			return
		}
		
		markersPageUpdateBrightnessOpacity()
	})
	
	window.addEventListener('popstate', function(event){  
		var content = "";
		if(event.state) {
			if( event.state.plate === 'Markers' ){
				markersPageEnter()
			}
			if( event.state.plate === 'LandingPage' ){
				markersPageLeave()
			}
		}
	})
}

//////////////////////////////////////////////////////////////////////////////
//		markersPage
//////////////////////////////////////////////////////////////////////////////

function markersPageEnter(){
	// debugger
	history.pushState( { 
		plate_id: 1, 
		plate: "Markers" 
	}, null, "markers");
	markersPageSetVisibility(true)
}

function markersPageLeave(){
	history.pushState( { 
		plate_id: 2, 
		plate: "LandingPage" 
	}, null, ".");
	markersPageSetVisibility(false)
}

function markersPageSetVisibility(visible){
	if( visible === true ){
		document.querySelector('#markers-page').style.display = 'block'
		document.querySelector('.mdl-layout__container').style.display = 'none'
	}else if( visible === false ){
		document.querySelector('#markers-page').style.display = 'none'
		document.querySelector('.mdl-layout__container').style.display = 'block'
	}else console.assert(false)
}


//////////////////////////////////////////////////////////////////////////////
//		markersPage brightness/contrast
//////////////////////////////////////////////////////////////////////////////
var markersPageBrightness = 0
var markersPageOpacity = 0.5
function markersPageUpdateBrightnessOpacity(){
	// normalize values
	markersPageBrightness = Math.max(0, Math.min(1, markersPageBrightness))
	markersPageOpacity = Math.max(0, Math.min(1, markersPageOpacity))
	
	// update css
	var domElement = document.querySelector('#markers-page .filter')
	var colorRgba = 'rgba(' + Math.round(markersPageBrightness * 255)
			+ ', ' + Math.round(markersPageBrightness * 255)
			+ ', ' + Math.round(markersPageBrightness * 255)
			+ ', ' + (1-markersPageOpacity)
			+ ')'
	domElement.style.backgroundColor = colorRgba

	// update views1
	document.querySelector('#markers-page .currentBrightness').innerHTML = markersPageBrightness.toFixed(3)
	document.querySelector('#markers-page .currentOpacity').innerHTML = markersPageOpacity.toFixed(3)	
}



//////////////////////////////////////////////////////////////////////////////
//		markersPageSetTrackingBackend
//////////////////////////////////////////////////////////////////////////////
function markersPageSetTrackingBackend(trackingBackend){
	// trackingBackend feedback
	document.querySelector('#currentTracking').innerHTML = trackingBackend
	// remove previous classes
	document.body.classList.remove('trackingBackend-artoolkit')			
	document.body.classList.remove('trackingBackend-aruco')
	// set the proper class
	if( trackingBackend === 'artoolkit' ){
		document.body.classList.add('trackingBackend-artoolkit')
	}else if( trackingBackend === 'aruco' ){
		document.body.classList.add('trackingBackend-aruco')			
	}else console.assert(false)
}
