watch: build
	fswatch -0 three.js/src/*/*.js aframe/src/*.js babylon.js/src/*.js | xargs -0 -n 1 -I {} make build
	
build:
	cd three.js && make build
	cd aframe && make build
	cd babylon.js && make build
	cd webvr-polyfill && make build

minify:
	cd three.js && make minify
	cd aframe && make minify
	cd babylon.js && make minify
	cd webvr-polyfill && make minify

.PHONY: test
test:
	(cd test && make test)

server:
	http-server -c -1
