watch: build
	fswatch -0 src/*/*.js | xargs -0 -n 1 -I {} make build

build-main:
	(cd src/threex/threex-aruco && make build)
	echo	> build/ar.js
	cat	vendor/jsartoolkit5/build/artoolkit.min.js	>> build/ar.js
	cat	src/threex/threex-aruco/build/threex-aruco.js	>> build/ar.js
	cat	vendor/chromium-tango/THREE.WebAR.js		>> build/ar.js
	cat	vendor/signals.min.js				>> build/ar.js
	cat	src/threex/*.js					\
		src/new-api/*.js				\
		src/markers-area/*.js				>> build/ar.js

.PHONY: build

minify-main: build-main
	uglifyjs build/ar.js > build/ar.min.js

build-lean:
	echo	> build/ar.lean.js
	cat	vendor/jsartoolkit5/build/artoolkit.min.js	>> build/ar.lean.js
	cat	vendor/signals.min.js				>> build/ar.lean.js
	cat	src/threex/*.js					\
		src/new-api/*.js				\
		src/markers-area/*.js				>> build/ar.lean.js

minify-lean: build-lean
	uglifyjs build/ar.lean.js > build/ar.lean.min.js

build: build-main build-lean

minify: minify-main minify-lean

watchMinify: minify
	fswatch -0 three.js/*.js | xargs -0 -n 1 -I {} make minify