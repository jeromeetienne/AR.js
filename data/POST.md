# AR.js - Efficient Augmented Reality for the Web

The possibilities of augmented reality are countless, and we haven't even scratched the surface yet!
I've been passionate about developing web-based AR for a [long](https://www.youtube.com/watch?v=rzLuJxTraos) [time](https://github.com/jeromeetienne/threex.webar). I would like AR to be useful for us, to stop being a promise and become a reality. This project is the result of that strong desire to actually make it happen. It's called AR.js. 

[youtube video](https://www.youtube.com/watch?v=0MtvjFg7tik)

### What is AR.js? 

AR.js is a solution for efficiently doing augmented reality on the web, [available on github](https://github.com/jeromeetienne/ar.js). Let's take a detailed look at what it is: 

- **Very Fast** : It runs efficiently even on mobile phones. [60 fps on my 2 year-old phone](https://twitter.com/jerome_etienne/status/831333879810236421)!
- **Web-based** : It is a pure web solution, so no installation required. Full javascript based on three.js + jsartoolkit5
- **Open Source** : It is completely open source and free of charge!
- **Standards** : It works on any phone with [webgl](http://caniuse.com/#feat=webgl) and [webrtc](http://caniuse.com/#feat=stream)

My goal is to make it easy for people to do augmented reality; that it can be easily experienced on today's phones, easily designed using web technology. The AR.js project is about enabling those people. So now, anybody with a modern phone can enjoy open-source AR, free of charge, cross-platform and without installation.

### How it is a game-changer?

It is a game changer because it is fast. This is the first time that we have an open-source web-based solution capable of doing 60fps on currently deployed phones. 

Suddenly, most people have a phone capable of doing AR without installation. It was not possible before. You don't have to wait for everybody to buy AR enabled devices (such as Tango, Moverio...etc.) . You already have one, in your pocket!  

![c4l9v3ywmaai5ul 1](https://cloud.githubusercontent.com/assets/252962/23409880/23683520-fdc5-11e6-8c9b-f3e6dee9605a.jpg)

### Standing on the shoulders of giants 
AR.js would not have been possible without some inspiring projects that came before. It is thanks to the hard work of others, that we can today reach this mythic 60fps AR. So I would like to thank :

* Three.js for being a great library to create 3d graphics on the web.
* ARToolKit for years of development and experiences doing augmented reality
* emscripten and asm.js! - thus I could compile ARToolKit into JavaScript
* Chromium for being so fast!

Only thanks to all of them, could I do my part: Optimizing performance from 5fps on high-end phones, to 60fps on 2 year-old phone.

### How to try it on your mobile?

AR.js is based on standards and works on any phone with WebGL and WebRTC. It works on Android and Windows mobile. Unfortunately, it wont work on iOS devices at the moment. Safari doesn't support WebRTC but [Apple is currently working on it](https://webkit.org/status/#specification-webrtc).

To try on your phone is only 2 easy steps, check it out :)

1. Open this [hiro marker image](https://jeromeetienne.github.io/AR.js/data/images/HIRO.jpg) in your desktop browser.
1. Open this [augmented reality webapps](https://jeromeetienne.github.io/AR.js/three.js/examples/mobile-performance.html) in your phone browser, and point it to your screen.

**You are done!** It will open a webpage which reads the phone webcam, localize a hiro marker and add 3d on top of it.

![screenshot](https://cloud.githubusercontent.com/assets/252962/23072106/73a0656c-f528-11e6-9fcd-3c900d1d47d3.jpg)

### Performance - What does Fast mean? 

We are still in the early stages of  the project but here are some initial numbers to give you an idea: 

- I reached 60fps running stable on a Nexus 6p
- I've gotten some reports of it running around 50fps on a Sony Xperia Z2. This is a 2.5 year-old phone priced at 170 euros! 
- I got some more reports of it running around 50fps on an old Nexus 5 and 60fps on a Nexus 9. Note that Nexus 5 is a 3.5 year old phone!
- I got some other reports of it working on Windows mobile with Edge: 13fps on Lumia 950 for some, and 40-45fps on Lumia 930 for others. I am still amazed it runs on Windows phone :)

Obviously, your mileage may vary. The performance you get will depends on 3 things: how heavy your 3D is, how you tune your parameters and the hardware that you are using.

# What's next ?

We did good on performance, but there is still a lot of room for optimisation. Using [webworkers](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Using_web_workers)  would increase cpu usage. Compiling in [webassembly](https://webassembly.org) instead of [asm.js](http://asmjs.org/) should improve loading time and likely cpu performance. And obviously, we can still tweak more parameters :)

I would like people to start experiencing augmented reality, getting comfortable with it. This is highly creative! Just look at this [puzzle game in AR playing with mirror and laser beam](https://www.youtube.com/watch?v=OzLJb7HitvA). You could do it with AR.js, aka open-source and  running on normal phones, no need to buy a new device. Isn't that great? 

Augmented reality on mobile has applications in many fields: [history education](https://www.youtube.com/watch?v=gyp8ZYtyu_M), [science](https://www.youtube.com/watch?v=gMxdBdLpVgc) or [gaming](https://www.youtube.com/watch?v=kEMDgvfFUcI). Take your pick and play with it! I am excited to see what people will do with AR.js :)
