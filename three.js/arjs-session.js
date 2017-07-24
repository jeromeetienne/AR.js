var ARjs = ARjs || {}

/**
 * define a ARjs.Session
 * 
 * @param {Object} parameters - parameters for this session
 */
ARjs.Session = function(parameters){
	var _this = this

	this.renderer = parameters.renderer
	this.camera = parameters.camera
	this.scene = parameters.scene
	
	// for multi marker
	if( localStorage.getItem('ARjsMultiMarkerFile') === null && parameters.contextParameters.trackingBackend !== 'tango' ){
		THREEx.ArMultiMarkerUtils.storeDefaultMultiMarkerFile(parameters.contextParameters.trackingBackend)
	}


	//////////////////////////////////////////////////////////////////////////////
	//		init arSource
	//////////////////////////////////////////////////////////////////////////////
	var arSource = _this.arSource = new THREEx.ArToolkitSource(parameters.sourceParameters)

	arSource.init(function onReady(){
		arSource.onResize2(arContext, _this.renderer, _this.camera)
	})
	
	// handle resize
	window.addEventListener('resize', function(){
		arSource.onResize2(arContext, _this.renderer, _this.camera)
	})	
	
	//////////////////////////////////////////////////////////////////////////////
	//		init arContext
	//////////////////////////////////////////////////////////////////////////////
	
	// create atToolkitContext
	var arContext = _this.arContext = new THREEx.ArToolkitContext(parameters.contextParameters)
	
	// initialize it
	_this.arContext.init()
	
	arContext.addEventListener('initialized', function(event){
		arSource.onResize2(arContext, _this.renderer, _this.camera)
	})
	
	
	// update artoolkit on every frame
	this.update = function(){
		if( arSource.ready === false )	return
		
		arContext.update( arSource.domElement )
	}
}
