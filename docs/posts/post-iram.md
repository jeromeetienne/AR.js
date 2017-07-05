https://medium.com/@sivaniram/c503e796a0c5

TODO past the relevant section in the post


There are good reasons to believe that web apps will begin to look more and more like native apps due to these technology trends:

**Progressive Web Apps (PWA)** — PWA are a website building methodology that enables website to be treated by the browser like an app, rather than an old school website. It enables web sites to have live updates, push notifications, launch the web site from the home screen, SEO discoverability, offline usage and more. This circumvents many of the reasons why users prefer apps, which will make it easier for publishers to engage users without the high friction need for app download. Some notable companies who shifted to PWA are AliExpress, The Financial Times and Lyft. Check out the video below to learn more about PWA.

**WebAssembly** — This is a new low level, Assembly-like, programming language that enables code written in non-javascript to run in the browser. 
It is efficient, lightning fast, and backward compatible with asm.js. 
Why is WebAssembly so important? Wasm enables to leverage code written for native environment and run it in the browser.
So the web can reuse native code and run it faster than normal javascript.
People like unity or unreal are obviously interested and are actively collaborating with browser makers to make it happen.

**WebGL 2.0** — A javascript graphics API that enables rendering of high quality 3D graphics content on the browser. It is built on top of OpenGL ES (Embedded System) which allows it to use the mobile device’s GPU, which is a massive improvement compared to running it on the CPU. WebGL is supported by all major browsers which helps standardize web content creation.

**WebRTC** — Web Real Time Communication is a well established standard that allows browsers to perform real time communications (in our case, access to the device’s camera and microphone). It works on all mobiles (IOS11 just added getUserMedia) and allow for a standardized way for developers to use Javascript libraries such as three.js and ar.js to enable real time AR experiences within a web app environment.

**Shared Memory and Multi-Threading**:
WebWorkers is a way to run code on multiple CPU cores at the same time. 
Typically a modern phone got 4 CPU, to leverage all of them would greatly increase the CPU available to the application.
WebWorkers exists for a long time, but recently shared memory and atomic got added.
It definitly helps computer vision application. They can now use all CPU core, avoid unnecessary copy and handle
shared rescources efficiently with atomic locks. 
