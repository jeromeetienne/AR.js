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
