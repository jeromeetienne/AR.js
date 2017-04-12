watch: build
	fswatch -0 three.js/*.js | xargs -0 -n 1 -I {} make build

.PHONY: build
build: 
	cat 	three.js/vendor/jsartoolkit5/build/artoolkit.min.js	\
		three.js/vendor/jsartoolkit5/js/artoolkit.api.js	\
		three.js/threex-*.js 					\
		> build/ar.js

minify: build
	uglifyjs build/ar.js > build/ar.min.js


################################################################################
#									       #
################################################################################

buildAll: minify buildAFrame buildWebVR
	
buildAFrame:
	(cd aframe && make minify)

buildWebVR:
	(cd webvr-polyfill && make minify)
