watch: build
	fswatch -0 three.js/src/*/*.js aframe/src/*.js babylon.js/src/*.js | xargs -0 -n 1 -I {} make build
	
build:
	cd three.js && make build
	cd three.js/contribs/portableAR.js && make build
	cd aframe && make build

minify:
	cd three.js && make minify
	cd three.js/contribs/portableAR.js && make minify
	cd aframe && make minify

.PHONY: test
test:
	(cd test && make test)

server:
	http-server -c -1
