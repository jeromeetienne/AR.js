server:
	java -jar -Dwebdriver.gecko.driver=./bin/geckodriver \
		-Dwebdriver.chrome.driver=./bin/chromedriver \
		bin/selenium-server-standalone-3.0.1.jar

test:
	./node_modules/.bin/wdio wdio.conf.js
