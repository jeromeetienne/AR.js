- augmenting-webpages: 
- landing page parameters
  - arAppURL
  - backURL
- avoid page reload 
  - it is slow on phone
  - it leaves the fullscreen
  - all the state change in screenAsPortal - remove them
- 
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
