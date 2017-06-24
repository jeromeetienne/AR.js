var peerjsPeer = null

function peerjsInit(){
	peerjsPeer = new Peer({key: 'lwjd5qra8257b9'});
	peerjsPeer.on('open', function() {
		console.log('My peerjsPeer ID is: ', peerjsPeer.id);
		updateArAppURL()
	});

	peerjsPeer.on('connection', function(peerjsConnection) {
		peerjsConnection.on('open', function() {
			// Receive messages
			peerjsConnection.on('data', function(message) {
				// console.log('Received', message);
				if( message === 'markersPageEnter' ){
					markersPageEnter()
				}else{
					console.log('received unknown message :', message)
				}
			});
			
			// Send messages
			peerjsConnection.send('Hello from markers-page!');
		});
	});
}


function firebaseInit(){
	// Initialize Firebase
	var config = {
		apiKey: "AIzaSyAKONfp5EmXuAlFmGGtmJcJiWg_Xyjb5SQ",
		authDomain: "augmented-webpages.firebaseapp.com",
		databaseURL: "https://augmented-webpages.firebaseio.com",
		projectId: "augmented-webpages",
		storageBucket: "augmented-webpages.appspot.com",
		messagingSenderId: "128557805583"
	};
	var firebaseApp = firebase.initializeApp(config);
	var rootRef = firebase.database().ref();
	// Get a reference to the /users/ada node
	var adaRef = firebase.database().ref("users/ada");
	adaRef.set({
		// arAppStatus: 'not-loaded'
		markersPagesShown : false
	});

	adaRef.on('value', function(snapshot){
		console.log('new value', snapshot.val())
		if( snapshot.val().markersPagesShown === true ){
			markersPageEnter()
		}
		// console.log('new value',  Date.now() - snapshot.val().time);
	});
}
