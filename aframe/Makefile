watch: build
	fswatch -0 src/*.js ../three.js/src/*/*.js | xargs -0 -n 1 -I {} make build
	
.PHONY: build
build:
	(cd ../three.js/ && make build)
	cat 	../three.js/build/ar.js	\
		src/component-*.js	\
		src/system-arjs*.js	\
		> build/aframe-ar.js 

minify: build
	uglifyjs build/aframe-ar.js > build/aframe-ar.min.js
