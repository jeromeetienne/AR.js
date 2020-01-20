UGLIFY=../node_modules/.bin/uglifyjs
watch: build
	fswatch -0 src/*/*.js | xargs -0 -n 1 -I {} make build

build-main:
	echo	> build/ar.js
	cat vendor/jsartoolkit5/build/artoolkit.min.js	\
		vendor/jsartoolkit5/js/artoolkit.worker.js		>> build/ar.js
	cat	src/threex/*.js					\
		src/new-api/*.js 				\
		src/markers-area/*.js 				>> build/ar.js

.PHONY: build

minify-main: build-main
	$(UGLIFY) build/ar.js > build/ar.min.js

build: build-main

minify: minify-main

watchMinify: minify
	fswatch -0 three.js/*.js | xargs -0 -n 1 -I {} make minify
