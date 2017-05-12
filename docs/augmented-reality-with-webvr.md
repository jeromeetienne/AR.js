Evangelist for AR.js, efficient augmented reality for the web. 

Working with Lightform, a startup in SF building a device for projection mapping, AR without the headset! 

Previously manager of the ARToolKit open source community and daqri.

---

- specialist
- all about AR
- multi fields e.g. industry, art
- various devices

AR.js open source 
artookit

perso cest AR.js
work cest lightform


---

# Augmented Reality with WebVR
## How to do WebAR today ?

What are you crazy !?!? VR stands for Virtual Reality! 
Indeed it does but i think it may be used for augmented reality too! 
Augmented Reality on the web is coming strong. Soon, we will have a web standard
specifically for it. But right now, all we have [WebVR Standard](https://w3c.github.io/webvr/) and 
i think we gonna do augmented reality with it, even if if VR stands for Virtual Reality :)

- [slides](https://docs.google.com/presentation/d/1nKr_dD0CMrYlrtLIDy89I3VDWrwQSp99NDZI5QBM3Pw/edit#slide=id.p)
- [pictures](https://twitter.com/jerome_etienne/status/857549922404634624)

# What is WebVR ?
Acording to [webvr.info](https://webvr.info/), here is the defintion of WebVR

    WebVR is an open standard that makes it possible to experience VR in your browser.
    The goal is to make it easier for everyone to get into VR experiences, no matter
    what device you have.

So it is standard, it is for the browser, it is for any device and it is for VR.
Or is it ? We will see that WebVR is not specific to Virtual reality, and apply
as well to augmented reality.

WebVR provides 2 features (and only those 2):
[Stereo Rendering](https://en.wikipedia.org/wiki/Stereoscopy)
and 
[Positional Tracking](https://en.wikipedia.org/wiki/Positional_tracking).
They match Virtual Reality needs obviously
But match Augmented Reality too!


# Pro of cross plateform

One great things with standard is the cross-plateform "You write your code once, it run everywhere".
There is several plateforms on which you can code Augmented Reality at the moment :
[hololens](https://www.microsoft.com/en-ie/hololens)
[tango](https://get.google.com/tango/)
and [AR.js](https://github.com/jeromeetienne/ar.js).
We don't want to have propriatery APIs.
Good thing WebVR already got what we need to do cross plateform AR today.

So if all the plateform exports their location tracking via WebVR, we can 
write cross plateform Augmented Reality today.

## About VR Controllers 
Note that WebVR doesn't provide the controllers part. It is all handled 
by another standard. The [Gamepad API Standard](https://w3c.github.io/gamepad/)
handled the normal stuff you find on any gamepad: buttons, joystick axes, 
Now it has [an extension](https://w3c.github.io/gamepad/extensions.html) to handle
the VR/AR controllers specificity e.g. position tracking, haptic response.
Thus it can handles 
[6dof](https://en.wikipedia.org/wiki/Six_degrees_of_freedom)
controllers like 
[HTC Vive](https://www.vive.com/us/accessory/controller/)
or 
simpler orientation-only like
[daydream controllers](https://www.vive.com/us/accessory/controller/).

## What is Stereo Rendering ?
According to [wikipedia](https://en.wikipedia.org/wiki/Stereoscopy), stereo rendering is 

    "Creating the illusion of depth in an image by stereopsis for binocular vision"

So basically you can see stuff in 3d, you have the actual feeling it is there.
It isn't just a basic projection of the 3d on a 2d screen.
It has been made popular by Google Cardboard.

TODO put screenshot here

Old concept tho - Here is from from 1860

TODO put screenshot here

### How is Stereo Rendering useful ?
- Give the illusion of depth
- It appears to be a given distance of the user
- It is no more a projection of a 3d object on a 2d plane (aka a screen)
- It appears as if it were there.
- It massively increases the immersion.

---
Ok so stereo rendering is nice..

What about positional tracking ?

---
# What is Positional Tracking ?

    “It tracks the position of the user camera”

- The camera may be your phone e.g. daydream
- The camera may be a HTC/Occulus headset

it can track the orientation and the position of the device
they may track only the orientation e.g. daydream, google cardboard. It is rather simple as it need only an IMU. It is already available in phones
---

# How is Positional Tracking useful ?
- It display the 3d according to the position of your device
- Physical real moves are reflected in the virtual world
- This links between physical and virtual is key to immersion

---

# Algos for Positional Tracking are quite varied
- Daydream - IMU based - provides orientation only (aka 3dof)
- Marker based provides positions and orientation too
- Vive/Occulus provides very accurate positions and orientation (aka 6dof)

No on-size-fit-fall :(   Each method got its PRO/CON

---

# WebVR is for Augmented Reality too!

WebVR contains all the stuff for Virtual Reality obviously! 
Stereoscopic Rendering is useful for VR.
Positional Tracking is useful for VR. 
Sure... 
but they are equally useful for Augmented Reality :)

So why WebVR has VR at the end ?
Because the authors were thinking about VR when they wrote it.
Nothing specific VR to it, It is equally good for AR.
Maybe it should have been named WebXR?  
