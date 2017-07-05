watch: build
	fswatch -0 *.js ../three.js/*.js | xargs -0 -n 1 -I {} make build
	
.PHONY: build
build:
	cat ../three.js/threex*.js \
		../three.js/examples/multi-markers/threex*.js \
		aframe-ar.js \
		../three.js/vendor/jsartoolkit5/build/artoolkit.min.js \
		../three.js/vendor/jsartoolkit5/js/artoolkit.api.js \
		> build/aframe-ar.js 

minify: build
	uglifyjs build/aframe-ar.js > build/aframe-ar.min.js

#####

build0:
	cat ../three.js/threex*.js \
		../three.js/examples/multi-markers/threex*.js \
		aframe-ar.js \
		../three.js/vendor/jsartoolkit5/build/artoolkit.min.js \
		../three.js/vendor/jsartoolkit5/js/artoolkit.api.js \
		> build/aframe-ar0.js 

minify0: build0
	uglifyjs build/aframe-ar0.js > build/aframe-ar0.min.js
