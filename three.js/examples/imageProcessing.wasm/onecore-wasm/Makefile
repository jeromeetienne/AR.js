watch: build
	fswatch -0 cv-threshold.cpp | xargs -0 -n 1 -I {} make build
	
build:
	emcc --bind -o module.js cv-threshold.cpp
