//RenderQueue is in charge of storing the RenderInstances that must be rendered
//There could be several RenderQueue (for opaque, transparent, overlays, etc)
//It works similar to the one in Unity
function RenderQueue( sort_mode )
{
	this.sort_mode = sort_mode || LS.RenderQueue.NO_SORT;
	this.instances = [];
}

RenderQueue.prototype.sort = function()
{
	var func = null;
	switch(this.sort_mode)
	{
		case 1: func = LS.RenderQueue.sort_near_to_far_func; break;
		case 2: func = LS.RenderQueue.sort_far_to_near_func; break;
		case 3: func = LS.RenderQueue.sort_by_priority_func; break;
	}

	if(func)
		this.instances.sort( func );
}

RenderQueue.prototype.add = function( ri )
{
	this.instances.push( ri );
}

RenderQueue.prototype.clear = function()
{
	this.instances.length = 0;
}

RenderQueue.DEFAULT = 0;
RenderQueue.BACKGROUND = 5;
RenderQueue.GEOMETRY = 10;
RenderQueue.TRANSPARENT = 15;
RenderQueue.READBACK_COLOR = 20;
RenderQueue.OVERLAY = 25;

RenderQueue.NO_SORT = 0;
RenderQueue.SORT_NEAR_TO_FAR = 1;
RenderQueue.SORT_FAR_TO_NEAR = 2;
RenderQueue.SORT_BY_PRIORITY = 3;

RenderQueue.sort_far_to_near_func = function(a,b) { return b._dist - a._dist; },
RenderQueue.sort_near_to_far_func = function(a,b) { return a._dist - b._dist; },
RenderQueue.sort_by_priority_func = function(a,b) { return b.priority - a.priority; },
RenderQueue.sort_by_priority_and_near_to_far_func = function(a,b) { var r = b.priority - a.priority; return r ? r : (a._dist - b._dist) },
RenderQueue.sort_by_priority_and_far_to_near_func = function(a,b) { var r = b.priority - a.priority; return r ? r : (b._dist - a._dist) },

LS.RenderQueue = RenderQueue;