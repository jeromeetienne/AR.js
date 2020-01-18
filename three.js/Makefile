UGLIFY=../node_modules/.bin/uglifyjs
watch: build
	fswatch -0 src/*/*.js | xargs -0 -n 1 -I {} make build

build-main:
	echo	> build/ar.js
	cat 	vendor/jsartoolkit5/build/artoolkit.min.js	\
		vendor/jsartoolkit5/js/artoolkit.api.js		>> build/ar.js
	cat	src/threex/*.js					\
		src/new-api/*.js 				\
		src/markers-area/*.js 				>> build/ar.js

.PHONY: build

minify-main: build-main
	$(UGLIFY) build/ar.js > build/ar.min.js

build-lean:
	echo > build/ar.lean.js
	cat vendor/jsartoolkit5/build/artoolkit.min.js \
		vendor/jsartoolkit5/js/artoolkit.api.js >> build/ar.lean.js
	cat src/threex/*.js \
		src/new-api/*.js \
		src/markers-area/*.js >> build/ar.lean.js

minify-lean: build-lean
	$(UGLIFY) build/ar.lean.js > build/ar.lean.min.js

build: build-main build-lean

minify: minify-main minify-lean

watchMinify: minify
	fswatch -0 three.js/*.js | xargs -0 -n 1 -I {} make minify
