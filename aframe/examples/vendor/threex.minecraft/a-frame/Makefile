.PHONY: build

build:
	cat ../threex*.js ./*.js > build/aframe-minecraft.js 

minify: build
	uglifyjs build/aframe-minecraft.js > build/aframe-minecraft.min.js