/**
* The Project is the top-most object that contains the whole application, from the project we can load other scenes
* WORK IN PROGRESS
*
* @class Project
* @constructor
*/

function Project(o)
{
	this.uid = LS.generateUId("PROJ-");
	
	this.includes = []; //files to include before launching this project
	this.settings = {};
	this.scenes = [];

	if(o)
		this.configure(o);
}

Project.prototype.serialize = function()
{

}

Project.prototype.configure = function(o)
{

}

//stuff to add
// start
// time
// finish

Project.prototype.load = function(url, on_complete)
{
	//load project json
	//load associated resources ( imports, atlas )
		// after loaded -> configure scene
		// on_complete
}

LS.extendClass( Project, ComponentContainer ); //container methods
