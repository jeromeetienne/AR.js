watch: build
	fswatch -0 src/*.js ../three.js/src/*/*.js | xargs -0 -n 1 -I {} make build
	
.PHONY: build
build:
	(cd ../three.js/ && make build)
	cat 	../three.js/examples/vendor/three.js/build/three.js \
		../three.js/build/ar.js	\
		src/litegl-ar.js	\
		> build/litegl-ar.js 

minify: build
	uglifyjs build/litegl-ar.js > build/litegl-ar.min.js


################################################################################
buildLiteScene:
	cd vendor/litescene.js/utils && python builder.py deploy_files.txt -o ../build/litescene.min.js -o2 ../build/litescene.js
