build:
	(cd three.js && make build) && (cd aframe && make build) && (cd webvr-polyfill && make build)

minify:
	(cd three.js && make minify) && (cd aframe && make minify) && (cd webvr-polyfill && make minify)

test:
	(cd test && make test)

deploy:
	git pull
	git checkout gh-pages
	git pull
	git merge master
	(cd docs && make build && cp -a _book/* .)
	git commit -a -m 'new build of gitbook docs/'
	git push origin gh-pages
	git checkout master


.PHONY: test
