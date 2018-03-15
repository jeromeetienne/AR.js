watch: build
	fswatch -0 src/*.js ../../src/*/*.js | xargs -0 -n 1 -I {} make build
	
.PHONY: build
build:
	(cd ../../ && make build)
	cat 	\
		../../examples/vendor/three.js/build/three.js	\
		../../build/ar.js					\
		src/portable-ar.js				\
		> build/portable-ar.js 

minify: build
	uglifyjs build/portable-ar.js > build/portable-ar.min.js
