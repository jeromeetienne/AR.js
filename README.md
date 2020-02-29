# AR.js - Augmented Reality for the Web

<img src="https://github.com/jeromeetienne/AR.js/blob/master/AR.js-1920-1080-HD.png?raw=true" height="200" />

Logo by [Simon Poulter](https://twitter.com/viralinfo)

---

[![npm](https://img.shields.io/npm/v/ar.js.svg)](https://www.npmjs.com/package/ar.js)
[![npm](https://img.shields.io/npm/dt/ar.js.svg)](https://www.npmjs.com/package/ar.js)
[![Build Status](https://travis-ci.org/jeromeetienne/AR.js.svg?branch=master)](https://travis-ci.org/jeromeetienne/AR.js)
<br class="badge-separator" />
[![Gitter chat](https://badges.gitter.im/AR-js/Lobby.png)](https://gitter.im/AR-js/Lobby)
<span class="badge-patreon"><a href="https://patreon.com/jerome_etienne" title="Donate to this project using Patreon"><img src="https://img.shields.io/badge/patreon-donate-yellow.svg" alt="Patreon donate button" /></a></span>
[![Twitter Follow](https://img.shields.io/twitter/follow/nicolocarp.svg?style=plastic&label=nicolocarpignoli-twitter&style=plastic)](https://twitter.com/nicolocarp)
[![Twitter Follow](https://img.shields.io/twitter/follow/jerome_etienne.svg?style=plastic&label=jeromeetienne-twitter&style=plastic)](https://twitter.com/jerome_etienne)

AR.js is a lightweight library for Augmented Reality on the Web, coming with features like Marker based and Location based AR.

Welcome to the official repository!

This project has been created by [@jeromeetienne](https://github.com/jeromeetienne) and it is now maintained by [@nicolocarpignoli](https://github.com/nicolocarpignoli).

🚀For frequent updates on AR.js you can follow [@nicolocarp](https://twitter.com/nicolocarp) and Watch this repo!

**Key points**:

- **Very Fast** : it runs efficiently even on phones - [60 fps on my 2 year-old phone](https://twitter.com/jerome_etienne/status/831333879810236421)!
- **Web-based** : It is a pure web solution, so no installation required. Full javascript based on three.js + jsartoolkit5
- **Open Source** : It is completely open source and free of charge!
- **Standards** : It works on any phone with [webgl](http://caniuse.com/#feat=webgl) and [webrtc](http://caniuse.com/#feat=stream)

# AR.js v2.0.0 is out!🌍

AR.js v2.0.0 introduces, for the first time, another type of Augmented Reality: **Location Based**.

AR.js can now be used with its default Marker Based feature, with Location Based or both combined.

See the project that has been integrated into AR.js: [GeoAR.js](https://github.com/nicolocarpignoli/GeoAR.js).

You can find additional details below.

# Try it on Mobile

It works on all platforms. Android, IOS and window phone. It runs on **any browser with WebGL and WebRTC** (for iOS, you need to update to iOS11),

To try it on your phone, it is only 2 easy steps, check it out!

1. Open this [hiro marker image](https://jeromeetienne.github.io/AR.js/data/images/HIRO.jpg) in your desktop browser.
1. Open this [augmented reality webapps](https://codepen.io/nicolocarpignoli/full/vMBgob) in your phone browser, and point it at your screen.

**You are done!** It will open a webpage which read the phone webcam, localize a hiro marker and add a 3D model on top of it!

# What "Marker Based" means
AR.js uses `artoolkit`, and so it is marker based.
`artoolkit` is a software with years of experience doing augmented reality. It is able to do a lot!

It supports a wide range of markers: multiple types of markers [pattern](https://github.com/artoolkit/artoolkit5/tree/master/doc/patterns)/[barcode](https://github.com/artoolkit/artoolkit-docs/blob/master/3_Marker_Training/marker_barcode.md)
multiple independent markers at the same time, or [multiple markers acting as a single marker](https://github.com/artoolkit/artoolkit-docs/blob/master/3_Marker_Training/marker_multi.md) up to you to choose.

More details about markers:

* [Artoolkit Open Doc](https://github.com/artoolkit/artoolkit-docs/tree/master/3_Marker_Training)
* [Detailed Article about markers](https://medium.com/@nicolcarpignoli/ar-js-the-simplest-way-to-get-cross-browser-augmented-reality-on-the-web-10cbc721debc) by [@nicolocarpignoli](https://twitter.com/nicolocarp)

# What "Location Based" means

### Check out the Location Based documentation: [here](https://github.com/jeromeetienne/AR.js/blob/master/aframe/README.md#location-based).

AR.js, on its `aframe` implementation, comes with few custom components that make possible to integrate data from GPS sensors.

Basically, you can add `gps-entity-place` - custom `aframe` entities that have a specific longitude/latitude values.

You can add them with a script, loading them from APIs (Foursquare, Google Maps, and so on) or just add them statically on your HTML.

Once you have added one or more gps-entities, and added the `gps-camera` on the `camera` entity, the system calculates, at every frame, your position and the distance of places from you.

Using your phone sensors for orientation/position, AR.js is able to show on your camera a content for each place on its 'physical' place (so if you point the camera towards the place in real life, you will see the content near it).

If you move the camera, it calculates again orientation and position. If places are far, it shows smaller content. If places are near you, it shows it bigger.

Learn more with [this article](https://medium.com/@nicolcarpignoli/location-based-gps-augmented-reality-on-the-web-7a540c515b3c).

🌍Click on the examples below to try it out.
📲Open from mobile phone with GPS data enabled.

- [Click Places](https://nicolo-carpignoli.herokuapp.com/examples/basic.html)

    Show place icon for every place. Clicking on the icon will show the place name.

    <img height="569" width="320" src="https://github.com/nicolocarpignoli/GeoAR.js/blob/master/docs/click-places.gif?raw=true">

- [Places Name](https://nicolo-carpignoli.herokuapp.com/examples/places-name)

    Show icon and place name above. Clicking on places will redirect to a certain URL (now mocked up).

  <img height="569" width="320" src="https://github.com/nicolocarpignoli/GeoAR.js/blob/master/docs/places-name.gif?raw=true">

Every example uses the `places.js` script to load places. You set your places using static data, with specific coordinates, adding these info in the first lines of code (there are comments to explain it better).

Otherwise, as default, the script searches for places of interest near the user using Foursquare APIs. Please retrieve valid API credentials [here](https://developer.foursquare.com/) in order to use it. Place credentials (replace both Client Secret and Client Id) on `places.js`.

You can also use GeoAR.js **without** the script, adding `gps-entity-place` entities directly on the `index.html` file.as documentated [here](https://github.com/jeromeetienne/AR.js/blob/master/aframe/README.md).


# Index
* [Get Started](#Get-Started)
* [Guides for Beginners](#Guides-for-beginners)
* [Advanced Guides](#Advanced-Guides)
* [Examples](#Examples)
* [Augmented Website](#Augmented-Website)
* [Tools](#Tools)
* [Performance](#Performance)
* [Status](#Status)
* [Folders](#Folders)
* [Browser Support](#Browser-Support)
* [Licenses](#Licenses)

⚠️ *Please always give a look for new undocumented features on the [Changelog](https://github.com/jeromeetienne/AR.js/blob/master/CHANGELOG.md) until the documentation has been updated.*


#  Get Started

## Augmented Reality for the Web in less than 10 lines of HTML

```html
<!doctype HTML>
<html>
<script src="https://aframe.io/releases/1.0.0/aframe.min.js"></script>
<script src="https://raw.githack.com/jeromeetienne/AR.js/2.2.2/aframe/build/aframe-ar.js"></script>
  <body style='margin : 0px; overflow: hidden;'>
    <a-scene embedded arjs>
      <a-marker preset="hiro">
          <a-box position='0 0.5 0' material='color: yellow;'></a-box>
      </a-marker>
      <a-entity camera></a-entity>
    </a-scene>
  </body>
</html>
```

See on [codepen](https://codepen.io/nicolocarpignoli/pen/vMBgob)

A-Frame magic :) All details are explained in this super post
["Augmented Reality in 10 Lines of HTML - AR.js with a-frame magic"](https://medium.com/arjs/augmented-reality-in-10-lines-of-html-4e193ea9fdbf)
by
[@AndraConnect](https://twitter.com/AndraConnect).


## Guides for beginners

### Marker Based
- [AR.js introduction and insight on markers](https://medium.com/@nicolcarpignoli/ar-js-the-simplest-way-to-get-cross-browser-augmented-reality-on-the-web-10cbc721debc)
- [Details about 3D models that can be used with AR.js](https://medium.com/@akashkuttappa/using-3d-models-with-ar-js-and-a-frame-84d462efe498)
- ["WebVR for Augmented Reality - Using WebVR to write cross-platform AR applications"](https://medium.com/arjs/webvr-for-augmented-reality-f1e69a505902)
  by [@jerome_etienne](https://twitter.com/jerome_etienne)
- ["AR-Code:a Fast Path to Augmented Reality - From QR Code to AR.js content"](https://medium.com/arjs/ar-code-a-fast-path-to-augmented-reality-60e51be3cbdf)
  by [@jerome_etienne](https://twitter.com/jerome_etienne)

### Location Based
- [Location Based (GPS) Augmented Reality on the Web](https://medium.com/@nicolcarpignoli/location-based-gps-augmented-reality-on-the-web-7a540c515b3c)
- [Tutorial for Location Based Augmented Reality on the Web](https://medium.com/chialab-open-source/build-your-location-based-augmented-reality-web-app-c2442e716564)

## Advanced guides

### Marker Based
- [How to deliver AR.js only with a QR Code](https://medium.com/@nicolcarpignoli/how-to-deliver-ar-on-the-web-only-with-a-qr-code-139bb90e82f1)
- [How to handle click with AR.js](https://medium.com/@nicolcarpignoli/how-to-handle-click-events-on-ar-js-f397ea5994d)
- [10 tips to enhance your AR.js app performances](https://medium.com/@nicolcarpignoli/10-tips-to-enhance-your-ar-js-app-8b44c6faffca)
- ["Area Learning with Multi-Markers in AR.js - For a Larger & More Stable Augmented Reality"](https://medium.com/arjs/area-learning-with-multi-markers-in-ar-js-1ff03a2f9fbe)
  by [@AndraConnect](https://twitter.com/AndraConnect)
- Great post about [WebAR for designer](http://www.nexusinteractivearts.com/webar/)
by [nexus interactive arts](http://www.nexusinteractivearts.com/)


# Examples

Try to get inspired by this great works:

### Marker Based
- [Examples from official AR.js doc](https://jeromeetienne.github.io/AR.js-docs/misc/EXAMPLES.html)

### Location Based

- [Click Places](./aframe/examples/click-places) - set up remote credentials to fetch remote places (`places.js` file)
- [Places Name](./aframe/examples/places-name) - add new places statically on javascript (`places.js` file)
- [Only HTML](./aframe/examples/only-html) - add new places statically on html (`index.html` file)
- [Only HTML](./aframe/examples/always-face-user) - like only-html but here content always face the user (`index.html` file)

# Related Projects
- [Examples inspired from AR.js - not AR.js based](https://github.com/stemkoski/AR-Examples) from [@stemkoski](https://github.com/stemkoski)
- [AR-gif](https://github.com/rodrigocam/ar-gif):
   Easy to use web components to do web augmented reality. Currently supporting gifs, but open for contributions to
   add 3d objects, videos and so on.

## Augmented Website

[Seminal post](https://medium.com/arjs/augmenting-the-web-page-e893f2d199b8) explaining the concept.
The service is available [webxr.io/augmented-website](https://webxr.io/augmented-website/)

# Community
- AR.js on gitter: https://gitter.im/AR-js/Lobby
- Trello board for ongoing work: https://trello.com/b/63F7JlvD/arjs

# Tools

- [Pattern Marker Generator](https://jeromeetienne.github.io/AR.js/three.js/examples/marker-training/examples/generator.html):
  Generate a pattern marker with your own image.
- [ARCode Generator](https://jeromeetienne.github.io/AR.js/three.js/examples/arcode.html):
  Generator of AR-Code
  ([source](https://github.com/jeromeetienne/AR.js/blob/master/three.js/examples/arcode.html))

# Performance

We are still early in the project but here are some initial numbers to give you an idea.

- I got 60fps stable on nexus6p
- Some reports [Sony Xperia Z2 (2.5 years old) runs around 50fps](https://twitter.com/leinadkalpot/status/834121238087925763) - this is a 170euro phone
- Some reports [~50fps on a old nexus5, and ~60fps on nexus 9](https://twitter.com/Ellyll/status/834312442926751744) - nexus5 is 3.5 years old!
- Some reports it working on windows phone edge!! [13fps on Lumia 950](https://twitter.com/leinadkalpot/status/834299384510763012) for some.
  [40-45fps on lumia 930](https://twitter.com/fastclemmy/status/834817155665391616) for others.

Obviously you mileage may vary. The performance you get will depend on 3 things: How heavy your 3D is, How you tune your parameters
and the hardware that you are using.

# Standing on the Shoulders of Giants

So we shown it is now possible to do 60fps web-based augmented reality on a phone.
This is great for sure but how did we get here ? **By standing on the shoulders of giants!**
It is thanks to the hard work from others, that we can today reach this mythic 60fps AR.
So I would like to thanks :

- **three.js** for being a great library to do 3d on the web.
- **artoolkit**! years of development and experiences on doing augmented reality
- **emscripten and asm.js**! thus we could compile artoolkit c into javascript
- **chromium**! thanks for being so fast!

Only thanks to all of them, I could do my part : Optimizing performance from 5fps on high-end
phone, to 60fps on 2years old phone.

After all this work done by a lot of people, we have a *web-based augmented reality solution fast enough for mobile*!

Now, many people got a phone powerful enough to do web AR in their pocket.
I think this performance improvement makes web AR a reality.
i am all exited by what people are gonna with it :)

![screenshot](https://cloud.githubusercontent.com/assets/252962/23068128/40343608-f51a-11e6-8cb3-900e37a7f658.jpg)

## What’s New?
Recently, we’ve been getting creative and working on developing new things with AR.js. One of them is playing around with [shadows](https://twitter.com/jerome_etienne/status/837240034847764480), syncing the position of virtual lights with reality for a more life-like finish:
![screen shot 2017-03-16 at 21 06 24](https://cloud.githubusercontent.com/assets/6317076/24018623/7f787ba8-0a8c-11e7-8088-fea4799b5d09.png)

We’ve been collaborating very closely with [Fredrick Blomqvist](https://twitter.com/snigelpaogat). His input has had a great impact on AR.js innovation and we want to thank him. Together, we’ve been implementing [refraction](https://twitter.com/jerome_etienne/status/838749280999518208), giving the 3d a transparent/glassy effect. It ended up having a nice polished look. What do you guys think?

![screen shot 2017-03-06 at 16 31 28](https://cloud.githubusercontent.com/assets/6317076/23832948/9b64c79e-0736-11e7-9cb8-747f6a8fc082.png)

Other crazy ideas we’ve been working on include a [hole in the wall](https://twitter.com/jerome_etienne/status/836754117964017664) and a [portal into another world](https://twitter.com/jerome_etienne/status/838404908235776000). We want to take AR.js to new dimensions.

![screen shot 2017-03-12 at 15 19 51](https://cloud.githubusercontent.com/assets/6317076/23833024/b2e045be-0737-11e7-9ef0-8e1ac9e49ba8.png)
![screen shot 2017-03-07 at 10 08 39](https://cloud.githubusercontent.com/assets/6317076/23833015/947f6abe-0737-11e7-9a0d-1ea919f6ffbe.png)

# Status
- At the three.js level is the main one. It is working well and efficiently
- a-frame component - it export ```<a-marker>``` tag. It becomes real easy to use.
  It allows the things three.js extension does. Here are some slides
  [aframe-artoolkit](http://jeromeetienne.github.io/slides/artoolkit-aframe/)
- webvr-polyfill: it is kind of working - still a work-in-progress

# Folders
- ```/three.js``` is the extension to use it with [pure three.js](https://threejs.org)
- ```/aframe``` is the extension to use it with [a-frame](https://aframe.io)
- ```/webvr-polyfill``` is the WebVR polyfill so you can reuse your #AR / #VR content easily

# What's Next ?

We did good on performance, but there are still a lot of room for optimisation.
Using [webworkers](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Using_web_workers)
would increase cpu usage. Compiling in [webassembly](https://webassembly.org) instead
of [asm.js](http://asmjs.org/) should improve loading time and likely cpu performance.
And obviously, we can still do more parameters tweaking :)

I would like people start experience augmented reality and play with it.
This is highly creative! Just look at this [puzzle game in #AR playing with mirror and laser beam](https://www.youtube.com/watch?v=OzLJb7HitvA).
You could do it with AR.js, so opensource and running on normal phones, no need to buy a new device. isn't that great!

Augmented reality on phone have applications in many fields:
[history education](https://www.youtube.com/watch?v=gyp8ZYtyu_M)
, [science](https://www.youtube.com/watch?v=gMxdBdLpVgc)
or [gaming](https://www.youtube.com/watch?v=kEMDgvfFUcI).
I exited to see what people will do with AR.js :)


# Browser Support
Demo tested on the following browser setups:
- **Desktop Chrome with webcam and 2 tabs** (one for Hero, one for result) (works!)
- **Android native 4.4.2** (doesn't work, doesn't ask for permission to use camera. I see white background and text)
- **Android native 5.0** (doesn't work, doesn't ask for permission, I see white background and text)
- **Chrome on Android 4.4.2** (works!)
- **Chrome on Android 5.0** (doesn't work, asks for permission, I see black background, text and a chart)
- **Safari and Chrome on iOS < 11** (doesn't work, doesn't ask for permission, I see white background and text)
- **Microsoft Edge on Windows 10** (Chrome on Google Pixel phone to view hologram)

To see the full compatibility list and contribute to it yourself go to this google spreadsheet:
[AR.js platform and browser compatibility](https://docs.google.com/spreadsheets/d/1e5YimbF_D1Sou2bx2vdBH58s1WdB_LgzBVYYD_uQLJk/edit#gid=318398375)

Credits: @HelloDeadline, @sorianog

# Licenses
It is **all open source**! jsartoolkit5 is under LGPLv3 license and additional permission.
And All my code in AR.js repository is under MIT license. :)

For legal details, be sure to check [jsartoolkit5 license](https://github.com/artoolkit/jsartoolkit5/blob/master/LICENSE.txt)
and [AR.js license](https://github.com/jeromeetienne/AR.js/blob/master/LICENSE.txt).

# Last but not least

* [AR.js changelog](https://github.com/jeromeetienne/AR.js/blob/master/CHANGELOG.md)

* [Future plans](https://trello.com/b/63F7JlvD/arjs)

* [FAQ](https://jeromeetienne.github.io/AR.js-docs/misc/FAQ.html)

* [How to Release](https://github.com/jeromeetienne/AR.js/blob/master/HOW_TO_RELEASE.md)
