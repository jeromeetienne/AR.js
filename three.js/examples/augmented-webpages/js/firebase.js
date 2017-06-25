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
	var firebaseApp = firebase.initializeApp(config);


	var dataRef = firebase.database().ref('marker-page-'+firebasePeerID);
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
	});

	return
	function createGUID() {
		function s4() {
			return Math.floor((1 + Math.random()) * 0x10000)
			.toString(16)
			.substring(1);
		}
		// return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
		// s4() + '-' + s4() + s4() + s4();
		return s4() + s4()
	}
}
