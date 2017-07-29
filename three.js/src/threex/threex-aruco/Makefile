watch: build
	fswatch -0 three.js/*.js | xargs -0 -n 1 -I {} make build
	
.PHONY: build
build:
	cat 	../../../vendor/js-aruco/src/aruco.js \
		../../../vendor/js-aruco/src/cv.js \
		../../../vendor/js-aruco/src/posit1.js \
		../../../vendor/js-aruco/src/svd.js \
	 	threex-*.js > build/threex-aruco.js

minify: build
	uglifyjs build/threex-aruco.js > build/threex-aruco-min.js

prepack: build
	prepack build/threex-aruco.js --out build/threex-aruco-prepacked.js
