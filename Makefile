build:
	(cd three.js && make build) && (cd aframe && make build) && (cd webvr-polyfill && make build)

minify:
	(cd three.js && make minify) && (cd aframe && make minify) && (cd webvr-polyfill && make minify)

test:
	(cd test && make test)

deploy:
	(cd docs && make deploy)

.PHONY: test
