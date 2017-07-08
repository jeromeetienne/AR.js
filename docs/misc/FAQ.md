# AR.js FAQ

## How small can we print the markers ?
There is no absolute. It is a ratio between the physical size of the marker, and the resolution of the camera image.
It is a tradeoff: the larger the camera image, the slower it is running.
The larger the camera image, the smaller the marker can be.

## How to Run AR.js Locally
To run AR.js locally on your computer, first clone a copy of the repository, and change to the `AR.js` folder:

  ````
  git clone git@github.com:jeromeetienne/AR.js.git
  cd AR.js
  ````

After that, serve the files using a static http server.  I use a simple command line http server called ```http-server```.
This can be installed using npm:

  ````
  npm install -g http-server
  ````


to start the http-server, simply run:

  ````
  http-server
  ````


## Can't access user media error

On mobile, accessing the camera using `getUserMedia` requires that you have a secure HTTPS connection to the server.  To do this, you will need to generate a certificate by running:

  ````
  openssl req -newkey rsa:2048 -new -nodes -x509 -days 3650 -keyout key.pem -out cert.pem
  ````

This will generate two files: `key.pem` and `cert.pem`.

You then run the server with the `-S` to enable SSL and `-C` for your certificate files:

  ````
  http-server -S -C cert.pem -o
  ````

Alternatively, you can deploy to [github pages](https://pages.github.com/) which by default, is served using HTTPS.  This avoids having to configure a SSL server.

Also working from localhost, you can avoid having to use HTTPS since [localhost is assumed secured](https://w3c.github.io/webappsec-secure-contexts/#localhost).

Thanks to [@mritzco](https://gist.github.com/mritzco) for [configuration directions](https://gist.github.com/mritzco/18dfe13096294592d5eb53e7e1a5f63c).

# Which plateform is Supported ?
it works on any browser with WebRTC and WebGL.
It run on platforms: android, IOS and window mobile.

As experimentation, it has been on 
[htc vive](https://twitter.com/jerome_etienne/status/883396955400880129) by [@robenghuse](https://twitter.com/robenghuse) 
and [hololens](https://twitter.com/jerome_etienne/status/856503929814831108) by [@evhan55](https://twitter.com/evhan55).
What is interested is that i didn't change a line to run on those devices. AR.js ran out of the box directly
on htv vive and Hololens, i think it is a clear proof of the web being true cross-platform.


# How To Release ?

This one is mainly for [me](@jerome_etienne) to remember :)

```bash
# replace REVISION to the proper version
atom three.js/threex-artoolkitcontext.js package.json

# Rebuild a-frame and webvr-polyfill
(cd aframe && make minify) && (cd webvr-polyfill && make minify)

# Commit everything
git add . && git commit -a -m 'Last commit before release'

# tag the release
git tag 1.0.0

# push the tag on github
git push origin --tags

# update npm package.json
npm publish

# update the a-frame codepen
open "https://codepen.io/jeromeetienne/pen/mRqqzb?editors=1000#0"
```
