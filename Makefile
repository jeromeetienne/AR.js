PHONY: build
build:
	(cd aframe && make build) 
	(cd webvr-polyfill && make build) 

minify:
	(cd aframe && make minify) 
	(cd webvr-polyfill && make minify) 
