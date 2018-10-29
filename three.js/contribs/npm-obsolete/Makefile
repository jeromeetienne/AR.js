watch: build
	fswatch -0 ../../build/ar.js scripts/prefix.js scripts/suffix.js | xargs -0 -n 1 -I {} make build

build:
	cd ../../ && make build
	cat scripts/prefix.js ../../build/ar.js scripts/suffix.js > build/ar.js

publish:
	npm publish

.PHONY: build
