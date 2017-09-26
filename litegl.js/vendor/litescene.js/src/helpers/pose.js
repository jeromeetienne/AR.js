/* A pose contains the transform or properties of a set of nodes and allows to interpolate between them */
function Pose(o)
{
	//array containing object like { id:, transform: }
	this.properties = {};
}

Pose.prototype.addProperty = function( locator, value )
{
	var property = new PoseProperty( locator, value );
	this.properties[ locator ] = property;
}

Pose.properties.applyPose = function( scene )
{
	scene = scene || LS.GlobalScene;

	for(var i in this.properties)
	{
		var property = this.properties[i];
		scene.setPropertyValue( property.locator, property.value );
	}
}

function PoseProperty( locator, value )
{
	this.locator = locator;
	this.value = value;
}

Pose.Property = PoseProperty;
LS.Pose = Pose;