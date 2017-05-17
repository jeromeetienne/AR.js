- document the issue with multi marker and specific version of jsartoolkit5
- document the bug in the writing of file inside jsartoolkit5.api.js
- learner/player - simple to understand

---
- park multi marker in its own directory
- workflow
  - one pass to generate the marker file
  - store that in a local storage
  - then another page to use the multi markers
- to load the marker, make a global with translation table
  - ARTOOLKIT_MULTIMARKER_FILENAME2URL = {
          filename : url
  }
  - currently it is hardcoded
- jsartoolkit - find a working version - git checkout 7cc3bedc54fdb4fe9f92138792c36164a3c5c81a
  - and slowly come back to understand why it doesnt work
  - https://github.com/artoolkit/jsartoolkit5/issues/34
  - work on old compile of .min.js - what changed in the new version ? is that the same artoolkit version ? is that the new compilation ?

- DONE have a multimarker-learning.js
  - you give it 2 markers
  - and it outputs the multi marker file
- DONE now how to generate the marker
  - threex.ararealearning.js
  - i give it the controls parameters for each marker
  - it recognize the marker independantly
  - when it see them together, it stores their relative position
- generation of multimarker file on the fly and load it in - blob url
  - http://stackoverflow.com/questions/30864573/what-is-blob-url-why-it-is-used-explain


- hide part of the markers
- i should be able to build my own markers
  - what is the good API for that

# Multimarker
- how to say 'those markers will start act as one'
- actually print 6 cards with matrix markers on simple papers, and play with them
- you need to ensure this is working as a setup
- multipattern seems to work on old version... not on new version
  - git checkout 8510249f1d3c20d24bcce2350b95b67c28495971
  - make it work on new version too
- first integrate the multi pattern in ar.js
- then do it dynamically
- multiple pattern
- multiple matrix - this one seems bogus even on a old one
- algo: 
  1. the user put all the marker on the table
  2. this is deemed the stable positional
  3. from all those positions, build a Multimarker
  4. init artoolkit with this multimarker
- this is all about programmation, no subtle algo
- see https://github.com/artoolkit/jsartoolkit5/issues/34

### PS vita workflow
- perfect for desk augmented reality
- PS vita workflow : the user put the card on the table, the way it likes
  then we locate each marker and build a multimarker description file
  we start to track this multimarker.

- start printing barcode markers.
  - each is a number barcode - 1 2 3 4 5
- better would be to actually use ps vita card
  - find out which barcode it is
  - try each possible barcode encoding
- just take known barcode images from artoolkit repository
  - https://github.com/artoolkit/artoolkit5/tree/master/doc/patterns/Matrix%20code%203x3%20(72dpi)
  - print them in a pdf
  - google draw
