test:
	./node_modules/.bin/wdio wdio.conf.js

server:
	java -jar -Dwebdriver.gecko.driver=./bin/geckodriver \
		-Dwebdriver.chrome.driver=./bin/chromedriver \
		bin/selenium-server-standalone-3.0.1.jar

clean: cleanReference
	rm -f screenshots/diff/*.png
	rm -f screenshots/screen/*.png

cleanReference:
	rm -f screenshots/reference/*.png
