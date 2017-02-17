watch: build
	fswatch -0 src/*.js | xargs -0 -n 1 -I {} make build

.PHONY: build
build: 
	cat 	../three.js/vendor/jsartoolkit5/build/artoolkit.min.js	\
		../three.js/vendor/jsartoolkit5/js/artoolkit.api.js	\
		../three.js/threex-*.js 			\
		src/artoolkit-framedata.js 			\
		src/generic-webvr-polyfill.js 			\
		src/main.js 					\
		> build/artoolkit-webvr-polyfill.js

minify: build
	uglifyjs build/artoolkit-webvr-polyfill.js > build/artoolkit-webvr-polyfill.min.js
