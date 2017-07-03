server:
	gitbook serve
	
build:
	gitbook build

install:
	gitbook install
	
deploy:
	git pull
	git checkout gh-pages
	git pull
	git merge master --no-edit
	(make install && make build && cp -a _book/* .)
	git commit -a -m 'new build of gitbook docs/'
	git push origin gh-pages
	git checkout master
