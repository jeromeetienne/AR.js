watch: build
	fswatch -0 *.js ../threex*.js | xargs -0 -n 1 -I {} make build
	
.PHONY: build
build:
	cat ../threex*.js aframe-artoolkit.js ../vendor/jsartoolkit5/build/artoolkit.min.js ../vendor/jsartoolkit5/js/artoolkit.api.js > build/aframe-artoolkit.js 

minify: build
	uglifyjs build/aframe-artoolkit.js > build/aframe-artoolkit.min.js
