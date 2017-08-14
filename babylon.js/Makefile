watch: build
	fswatch -0 src/*.js ../three.js/src/*/*.js | xargs -0 -n 1 -I {} make build
	
.PHONY: build
build:
	(cd ../three.js/ && make build)
	cat 	../three.js/examples/vendor/three.js/build/three.js \
		../three.js/build/ar.js	\
		src/babylon-ar.js	\
		> build/babylon-ar.js 

minify: build
	uglifyjs build/babylon-ar.js > build/babylon-ar.min.js
