watch: build
	fswatch -0 cv-threshold.cpp | xargs -0 -n 1 -I {} make build
	
build:
	emcc cv-threshold.c -Os -s WASM=1 -s MODULARIZE=1 -o module.js
