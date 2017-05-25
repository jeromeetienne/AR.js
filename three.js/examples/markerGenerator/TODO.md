- button download which trigger download
- when a file is uploaded, display the fullMarkerImage (thus downloadable + usable immediatly for AR)
- button upload (drag drop latter)
- warn if image isnt square but goes on, convert to square automatically
  - or not... they will see it
- do a pdf download
  - with specific size of markers on the page
  - multiple markers per page

--------------
- 
--------------

- do the upload in browser
- do the drawing on screen of the marker - using a inner marker image
- generate the inner marker image, from the pattern marker file
- add link to artoolkit tutorial

---

- Load the image
- it has to be square
  - sanity check
- build the .patt file
  - make it downloadable
- copy it in a file, and run 
- threex.arpatternmarker
  .encode(imageUrl, function done(encodedMarkerString){})
  var canvas = .draw(encodedMarkerString)
