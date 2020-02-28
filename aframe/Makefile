UGLIFY=../node_modules/.bin/uglifyjs

watch: build
	fswatch -0 src/*.js ../three.js/src/*/*.js | xargs -0 -n 1 -I {} make build

.PHONY: build

build-default:
	(cd ../three.js/ && make build-main)
	cat 	../three.js/build/ar.js	\
		src/component-anchor.js	\
		src/component-hit-testing.js	\
		src/location-based/*.js \
		src/system-arjs.js	\
		> build/aframe-ar.js

build-nft:
	(cd ../three.js/ && make build-main-nft)
	cat 	../three.js/build/ar-nft.js	\
		src/component-anchor-nft.js	\
		src/component-hit-testing.js	\
		src/location-based/*.js \
		src/system-arjs.js	\
		> build/aframe-ar-nft.js

build: build-default build-nft

minify-default: build-default
	$(UGLIFY) build/aframe-ar.js > build/aframe-ar.min.js

minify-nft: build-nft
	$(UGLIFY) build/aframe-ar-nft.js > build/aframe-ar-nft.min.js

minify: minify-default minify-nft
