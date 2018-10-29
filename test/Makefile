test:
	./node_modules/.bin/wdio wdio.conf.js

testMarkersArea:
	./node_modules/.bin/wdio --spec specs/markers-area.js ./wdio.conf.js

testRendering:
	./node_modules/.bin/wdio --spec specs/rendering.js ./wdio.conf.js

testPerformance:
	./node_modules/.bin/wdio --spec specs/performance.js ./wdio.conf.js

################################################################################
################################################################################

clean: cleanResults
	rm -f screenshots/reference/*.png

cleanResults: 
	rm -f screenshots/diff/*.png
	rm -f screenshots/screen/*.png

################################################################################
################################################################################

# server:
# 	java -jar -Dwebdriver.gecko.driver=./bin/geckodriver \
# 		-Dwebdriver.chrome.driver=./bin/chromedriver \
# 		bin/selenium-server-standalone-3.0.1.jar
