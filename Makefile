watch: build
	fswatch -0 three.js/src/*/*.js aframe/src/*.js babylon.js/src/*.js | xargs -0 -n 1 -I {} make build
	
prepare:
	npm install

build:
	cd three.js && make build
	cd aframe && make build

minify: prepare
	cd three.js && make minify
	cd aframe && make minify

.PHONY: test
test:
	(cd test && make test)

server:
	http-server -c -1
