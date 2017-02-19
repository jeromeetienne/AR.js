watch: build
	fswatch -0 *.js | xargs -0 -n 1 -I {} make build
	
.PHONY: build
build:
	cat ../three.js/threex*.js aframe-webar.js \
		../three.js/vendor/jsartoolkit5/build/artoolkit.min.js \
		../three.js/vendor/jsartoolkit5/js/artoolkit.api.js \
		> build/aframe-webar.js 

minify: build
	uglifyjs build/aframe-webar.js > build/aframe-webar.min.js
