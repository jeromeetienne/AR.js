var firebasePeerID = null
function firebaseInit(){
	firebasePeerID = createGUID()
	// add the firebasePeerID in the arAppURL
	updateArAppURL()
	// Initialize Firebase
	var config = {
		apiKey: "AIzaSyAKONfp5EmXuAlFmGGtmJcJiWg_Xyjb5SQ",
		// authDomain: "augmented-webpages.firebaseapp.com",
		databaseURL: "https://augmented-webpages.firebaseio.com",
		// projectId: "augmented-webpages",
		// storageBucket: "augmented-webpages.appspot.com",
		// messagingSenderId: "128557805583"
	};
	firebase.initializeApp(config)


	var dataRef = firebase.database().ref('marker-page-'+firebasePeerID)
	dataRef.set({
		qrCodeToScan: true,
		createdAt : new Date().toJSON()
	})
	dataRef.on('value', function(snapshot){
		// console.log('new value', snapshot.val())
		if( snapshot.val().qrCodeToScan === false ){
			console.log('qrcode scanned')
			markersPageEnter()
			dataRef.update({
				qrCodeToScan : true
			})
		}
	})
	
	// remove all records older than 30min
	purgeObsoleteRecords(30*60)

	return
	
	//////////////////////////////////////////////////////////////////////////////
	//		create GUID
	//////////////////////////////////////////////////////////////////////////////
	function createGUID() {
		function s4() {
			return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1)
		}
		// return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4()
		return s4() + s4()
	}
	
	function purgeObsoleteRecords(maxAge){
		var ref = firebase.database().ref()
		ref.on("child_added", function(snapshot){
			if( snapshot.key.match('marker-page-') === null )	return
			var createdAtString = snapshot.child("createdAt").val()
			var createdAt = new Date(createdAtString)
			var ageSeconds = (Date.now() - createdAt.getTime()) / 1000
			if( ageSeconds > maxAge ){
				snapshot.ref.remove()
			}
		})
	}
}
