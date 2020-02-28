UGLIFY=../node_modules/.bin/uglifyjs
watch: build
	fswatch -0 src/*/*.js | xargs -0 -n 1 -I {} make build

build-main:
	echo	> build/ar.js
	cat vendor/jsartoolkit5/build/artoolkit.min.js \
	vendor/jsartoolkit5/js/artoolkit.api.js >> build/ar.js
	cat	src/threex/threex-arbasecontrols.js					\
		src/threex/threex-arclickability.js					\
		src/threex/threex-armarkercloak.js					\
		src/threex/threex-armarkercontrols.js					\
		src/threex/threex-armarkerhelper.js					\
		src/threex/threex-arsmoothedcontrols.js					\
		src/threex/threex-artoolkitcontext.js					\
		src/threex/threex-artoolkitprofile.js					\
		src/threex/threex-artoolkitsource.js					\
		src/threex/threex-arvideoinwebgl.js					\
		src/threex/threex-hittesting-plane.js					\
		src/new-api/*.js 				\
		src/markers-area/*.js 				>> build/ar.js

build-main-nft:
	echo	> build/ar-nft.js
	cat vendor/jsartoolkit5/build/artoolkit-nft.min.js	\
		vendor/jsartoolkit5/js/artoolkit.worker.js		>> build/ar-nft.js
	cat	src/threex/threex-arbasecontrols.js					\
		src/threex/threex-arclickability.js					\
		src/threex/threex-armarkercloak.js					\
		src/threex/threex-armarkercontrols-nft.js					\
		src/threex/threex-armarkerhelper.js					\
		src/threex/threex-arsmoothedcontrols.js					\
		src/threex/threex-artoolkitcontext-nft.js					\
		src/threex/threex-artoolkitprofile.js					\
		src/threex/threex-artoolkitsource.js					\
		src/threex/threex-arvideoinwebgl.js					\
		src/threex/threex-hittesting-plane.js					\
		src/new-api/*.js 				\
		src/markers-area/*.js 				>> build/ar-nft.js

.PHONY: build

minify-main: build-main
	$(UGLIFY) build/ar.js > build/ar.min.js

minify-main-nft: build-main-nft
	$(UGLIFY) build/ar-nft.js > build/ar-nft.min.js

build: build-main build-main-nft

minify: minify-main minify-main-nft

watchMinify: minify
	fswatch -0 three.js/*.js | xargs -0 -n 1 -I {} make minify
