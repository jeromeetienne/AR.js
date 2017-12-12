watch: build
	fswatch -0 src/*/*.js | xargs -0 -n 1 -I {} make build

build: 
	(cd src/threex/threex-aruco && make build)
	echo	> build/ar.js
	cat 	vendor/jsartoolkit5/build/artoolkit.min.js	\
		vendor/jsartoolkit5/js/artoolkit.api.js		>> build/ar.js
	cat	src/threex/threex-aruco/build/threex-aruco.js	>> build/ar.js
	cat	vendor/chromium-tango/THREE.WebAR.js		>> build/ar.js
	cat	src/threex/*.js					\
		src/new-api/*.js 				\
		src/markers-area/*.js 				>> build/ar.js

.PHONY: build

minify: build
	uglifyjs build/ar.js > build/ar.min.js

watchMinify: minify
	fswatch -0 three.js/*.js | xargs -0 -n 1 -I {} make minify
