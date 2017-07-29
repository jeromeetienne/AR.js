watch: build
	fswatch -0 *.js ../three.js/*.js | xargs -0 -n 1 -I {} make build
	
.PHONY: build
build:
	(cd ../three.js/ && make build)
	cat 	../three.js/build/ar.js	\
		src/aframe-ar.js	\
		> build/aframe-ar.js 

minify: build
	uglifyjs build/aframe-ar.js > build/aframe-ar.min.js
