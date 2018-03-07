watch: build
	fswatch -0 src/*.js ../../three.js/src/*/*.js | xargs -0 -n 1 -I {} make build
	
.PHONY: build
build:
	(cd ../../three.js/ && make build)
	cat 	\
		../../three.js/examples/vendor/three.js/build/three.js	\
		../../three.js/build/ar.js				\
		src/portable-ar.js					\
		> build/portable-ar.js 

minify: build
	uglifyjs build/portable-ar.js > build/portable-ar.min.js
