watch: build
	fswatch -0 myclass.cpp | xargs -0 -n 1 -I {} make build
	
build:
	emcc --bind -o myclass.js myclass.cpp
