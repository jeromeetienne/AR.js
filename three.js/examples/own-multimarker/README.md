This is my own version of the multi markers. 

# Goal
Make a multi marker with a nice workflow. It must be as easy as possible for the user.
It must handle dynamic markers positions. 

- The user put all the markers where he want until he is satisfied. This is the dynamic part.
- After that, markers positions is considered stable. aka they are no more supposed to move.
- Those markers are called sub markers.
- AR.js will build a multi marker based on them. 
- All the sub-markers will act as one, the multi-marker. 
- the multi-marker pose will be averaged from all the visible sub-markers.

Thus even if only one sub-marker is visible, multi-marker position will still be tracked properly

# Motivation 

	there was to many bugs in artoolkit 

- issue in the file parsing - TODO get github issue
- in jsartoolkit5, it has several issue in the multimarker file loading. It is
  impossible to use twice the same marker filename.
- it handles poorly the url. It is forcing the user to put all the 
  files (multimarker file plus all the pattern file) at the root of the url.
  
I tried a bit to workaround those issues, but it rapidely became a pain. 
So i prefer to devote my energy at building a good version instead of working around
silly bugs.
