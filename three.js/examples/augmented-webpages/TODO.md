- DONE make marker page part of landing page
- generate multi marker file based on window resolution
  - test hardcoded in player.html
  - then pass it as parameters from landing-page
- pass resolution from homepage to appPage
  - get the multi marker from resolution if it is present
  - get multi markers from localstorage is available
  - else use default markers
  - keep all the usual process of learning
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

# What with resolution
- if i got the resolution from the marker screen in the app, i can easily/immediatly generate the perfect markers.
- so it got better accuracy, and immediate result
- seem the way to go - do AR application receive trackingBackend and screenResolution. all that in hash
- as app is coming from landing page, have the landing page pass the screen resolution
- to avoid the page reload, make the marker page in the index.html
  - thus we got ability to get fullscreen
- when going to marker-page, goto fullscreen at the same time ?

- so lets see if it is correct

- do AR application receive trackingBackend and screenResolution. all that in hash
- here compute the multimarker


- what if it is read on a phone first ?
  - we force another scanning ?
  - we ask to explicitly learn ?
  - doesnt seems avoid to add an extra step - another scanning seems the less painful
  - on the other hand to say 'read this page on a desktop' isnt much... because you already need a desktop close to you

# Misc
- do a area: learn - reset
- in player.html page UI
  - do a area: learn - reset
  - markerhelper 
  - learn area - button exist
- DONE in player.html
  - remove all hash state
  - aruco/artoolkit only in into via hash

- /marker-page/index.html

- augmenting-webpages: 

---
- landing page got many issues
  - ugly - use getmdl
  - not explicative


---------------------------------------------------

- screenAsPortal - put a border like with hublo 360

- add description in landing pages
  - if isMobile, 'please open this url on desktop, then click here' - goto arApp
  - if isMobile === false, 'please open this url on phone, (or scan qrcode), and click here' - goto markerPage
  
- add qrCode in landingPage
- landingPage got a arPageUrl (for qrCode)
- handle webar-playground parameters in the qrCode
- add description in marker pages
- DONE move it all to ar.js three.js/examples/multi-markers/augmenting-webpages
- DONE make an example in multi marker
  - examples/screenAsPortal.html
  - with usual lee demo

---------------------------------------------------
# in marker pages
- marker page is mainly running on desktop
- what is a good marker pages ?
- i got the dimension of the screen deducable from the markers position/size
- it can be read on desktop, tablet, phone
- the AR is centered in the middle of the screen
- toggle to go fullscreen

---------------------------------------------------
- DONE put all that in its own folder 
  - markers-on-screen

- put multi marker on screen
  - with a qrcode for the phone - it is there only at the begining
  - you arrive, there is a url+qrcode for the phone in a popup
  - then you scan the qrcode, and close the popup
  - there is big markers on the screens (usable from far)
  - you edit on this scene
  - with webar-editor, you learn this area and edit on it
- later you build the url of the application based on the dimension of the screen
  - thus you dont need to learn it
  - link it from the home page!
  - get the marker definition in the url of the app.html 
  - thus when you arrive on the homepage with a saved scene, i add the marker definition to the url
  - so any url will get a good marker definition no matter the screen size

---

- detection seems bad super bad... how come ? because it is on screen ?
  - if so, i can change the color of the screen and use this
  - i can do thresholding
  - augmenting the screen is a big case
  - display debug and see
