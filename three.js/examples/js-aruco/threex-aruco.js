var THREEx = THREEx || {}

THREEx.Aruco = function(){
	
}

THREEx.Aruco.updateObject3D = function(object3D, rotation, translation){
        object3D.position.x =  translation[0];
        object3D.position.y =  translation[1];
        object3D.position.z = -translation[2];
        
        object3D.rotation.x = -Math.asin(-rotation[1][2]);
        object3D.rotation.y = -Math.atan2(rotation[0][2], rotation[2][2]);
        object3D.rotation.z =  Math.atan2(rotation[1][0], rotation[1][1]);
        
        object3D.scale.x = markerSize;
        object3D.scale.y = markerSize;
        object3D.scale.z = markerSize;
}

THREEx.Aruco.drawDebugId = function(canvas, markers){
	var context = canvas.getContext('2d');
	var corners, corner, x, y, i, j;
	
	context.strokeStyle = "blue";
	context.lineWidth = 1;
	
	for (i = 0; i !== markers.length; ++ i){
		corners = markers[i].corners;
		
		x = Infinity;
		y = Infinity;
		
		for (j = 0; j !== corners.length; ++ j){
			corner = corners[j];
			
			x = Math.min(x, corner.x);
			y = Math.min(y, corner.y);
		}
		context.strokeText(markers[i].id, x, y)
	}
}

THREEx.Aruco.drawDebugCorners = function(canvas, markers){
        var corners, corner, i, j;
        var context = canvas.getContext('2d');
        context.lineWidth = 3;
        
        for (i = 0; i < markers.length; ++ i){
                corners = markers[i].corners;
                
                context.strokeStyle = 'red';
                context.beginPath();
                
                for (j = 0; j < corners.length; ++ j){
                        corner = corners[j];
                        context.moveTo(corner.x, corner.y);
                        corner = corners[(j + 1) % corners.length];
                        context.lineTo(corner.x, corner.y);
                }
                
                context.stroke();
                context.closePath();
                
                context.strokeStyle = 'green';
                context.strokeRect(corners[0].x - 2, corners[0].y - 2, 4, 4);
        }
};
