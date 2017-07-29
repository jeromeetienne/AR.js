watch: build
	fswatch -0 three.js/*.js | xargs -0 -n 1 -I {} make build

.PHONY: build
build: 
	(cd src/threex/threex-aruco && make build)
	cat 	vendor/jsartoolkit5/build/artoolkit.min.js	\
		vendor/jsartoolkit5/js/artoolkit.api.js		\
		src/threex/threex-aruco/build/threex-aruco.js	\
		vendor/chromium-tango/THREE.WebAR.js		\
		src/threex/*.js					\
		src/new-api/*.js 				\
		src/markers-area/*.js 				\
		> build/ar.js

minify: build
	uglifyjs build/ar.js > build/ar.min.js

watchMinify: minify
	fswatch -0 three.js/*.js | xargs -0 -n 1 -I {} make minify
