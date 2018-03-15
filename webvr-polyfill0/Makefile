watch: build
	fswatch -0 src/*.js | xargs -0 -n 1 -I {} make build

.PHONY: build
build: 
	(cd ../three.js/ && make build)
	cat 	../three.js/build/ar.js	\
		src/artoolkit-framedata.js 			\
		src/generic-webvr-polyfill.js 			\
		src/main.js 					\
		> build/artoolkit-webvr-polyfill.js

minify: build
	uglifyjs build/artoolkit-webvr-polyfill.js > build/artoolkit-webvr-polyfill.min.js
