import Source from './threex-artoolkitsource';
import Context from './threex-artoolkitcontext';
import MarkerControls from './threex-armarkercontrols';
import SmoothedControls from './threex-arsmoothedcontrols';
const ArToolkitSource = three => Source(three);
const ArToolkitContext = Context;
const ArMarkerControls = MarkerControls;
const ArSmoothedControls = SmoothedControls;

export { ArToolkitSource, ArToolkitContext, ArMarkerControls, ArSmoothedControls };
