# try to integrate firebase
- there is already working examples
- firebase could be used to sync-up markers-page size with phone
- firebase could be used to calibrate markers-page brightness/contrast

- on landingPage, get a random number, add that in the url. this is the id of the infopage
- make firebase record name based on this random number
  - scanned : false
  - createdAt : xxxxxx (used to delete it later)
- have a procedurre to erase all record which are older than X. launch it in the background in the landing page
- set scanned to false every time you leave markerPage
- when the ar app is loaded, set the variable to true
- when landingpage see the value become true, it show the markerPage and set it to false

------------
- put examples firebase/peerjs/goo.gl in gist

- DONE make the player receive variable query instead of hash. check if it works well when sending email
- DONE how to include goo.gl - make QRCode easier to read important



- initialisation phase needed for peerjs+goo.gl
- peerjs signaling thru camera
- goo.gl workglow:
  - url is updated on every resize this may be a lot
  - do a rate limiter ? like if not moved for 0.5 seconds, then do it
  - hide qrcode image when it is invalid - aka during goo.gl call

# communication between markerPage and phone
- https://twitter.com/jerome_etienne/status/877628394388602880
- establish connection with peerjs or other

# goo.gl url shortner
- api key AIzaSyDehQAfFZ9COHDLsvg8tIv7m4I4ySIc0e4
- to restrict usage 
https://console.developers.google.com/apis/credentials/key/140?authuser=0&project=augmented-webpag-1498205969249&pli=1

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
