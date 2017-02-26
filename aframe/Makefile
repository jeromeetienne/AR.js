watch: build
	fswatch -0 *.js ../three.js/*.js | xargs -0 -n 1 -I {} make build
	
.PHONY: build
build:
	cat ../three.js/threex*.js aframe-ar.js \
		../three.js/vendor/jsartoolkit5/build/artoolkit.min.js \
		../three.js/vendor/jsartoolkit5/js/artoolkit.api.js \
		> build/aframe-ar.js 

minify: build
	uglifyjs build/aframe-ar.js > build/aframe-ar.min.js
