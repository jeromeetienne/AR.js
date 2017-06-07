watch: build
	fswatch -0 canvas.c | xargs -0 -n 1 -I {} make build
	
build:
	emcc canvas.c -Os -s WASM=1 -s MODULARIZE=1 -o module.js
