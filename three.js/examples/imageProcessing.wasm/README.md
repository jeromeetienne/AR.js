# GOAL
- Bench how fast the web can go about image processing
- Example on filtering : convert2Grey + adaptativeThresholding
- Code this in multiple versions : webworkers - webassembly - gpu
- Then mix them together - determine which combinason is best

# Step1 Basic Demo - onecore-purejs
- read the webcam
- display the origianl image
- filter the image - use jsaruco function
- display the filtered image

# Step2 Implement webworkers + jsaruco - multicore-purejs
- aka all normal javascript - no webassembly so more stable

# Step3 Implement webassembly - onecore-wasm
- code in C the convert2Grey yourself first
- see about getting a horintal/vertical blur in C 
- then do a adaptative thresholding
- result must be the same as the jsaruco version

# Step4 Implement a gpu version
- convert2Grey may be done in shader
- horizontal/vertical blur may be done in shader
- which resolution for the texture ?
- how many passes ? 4 different shaders or larger ones ?

# Step5 Mix them together
- what is possible ? what is buggy ?
- if all is running as expected, any combinaison would work. 
- it is a matter of picking the fastest
- so try and measure :)
