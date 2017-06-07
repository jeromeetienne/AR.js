watch: build
	fswatch -0 hello_world.c | xargs -0 -n 1 -I {} make build
	
build:
	emcc hello_world.c -Os -s WASM=1 -s SIDE_MODULE=1 -o hello_world.wasm
