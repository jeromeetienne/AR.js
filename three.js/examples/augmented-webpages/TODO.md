# Nice Url for augemented-webpages
- then support on external site - try to get nice url
- include that in webxr.io - little AR logo in bottom right - try clean url
  - keep on their URL
  - if click then go webxr.io/ar
  - can i put that in the github readme.md ?
  - here goes in iframe with the augmented-webpages examples
  - and url remains simple
  - no need to move files 

- later refactor learning in multimarker itself
  - this will clean the code for webar-playground and other potential application

# TODO 
- cleanup code in the screenAsPortal examples
  - then make that the example for multi marker with a simpler 3d
- put learner in the same .html to avoid reload
- maybe do a threex-armultimarkersimple.js which regroup the usual usage of multi marker
  - thus the boilerplate isnt too big when it is repeated all the time
- clean up learner
  - remove arToolkitContext
  - have caller listen to the event and call areaLearning.onSourceProcessed()
- we learn while we play ? thus the result are getting better and better
- able to play when all marker are markers as learned
- do nice visual on each marker - phase 'scan all the markers'
- once all markers are learned we can start playing



---------------------------------------------------

- screenAsPortal - put a border like with hublo 360

- add description in landing pages
  - if isMobile, 'please open this url on desktop, then click here' - goto arApp
  - if isMobile === false, 'please open this url on phone, (or scan qrcode), and click here' - goto markerPage
  
- handle webar-playground parameters in the qrCode
- add description in marker pages
- DONE move it all to ar.js three.js/examples/multi-markers/augmenting-webpages
- DONE make an example in multi marker
  - examples/screenAsPortal.html
  - with usual lee demo


---------------------------------------------------
