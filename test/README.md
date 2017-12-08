# Automatic tests for AR.js

It is running [webdriver.io](http://webdriver.io/)
with their great [visual regression's services](http://webdriver.io/guide/services/visual-regression.html).
In brief, it takes screenshots of the current version and compare them to screenshots from previous versions.
If they are different, this is a regression.

To see current tasks in progress, check out the [TODO.md](https://github.com/jeromeetienne/AR.js/blob/dev/test/TODO.md).

# How to run the tests ?

First install the npm packages for the tests.

```bash
npm install 
```

How to run the tests ?

```bash
npm test
```

# Principles for measuring performance
- Measure stability - so 3d shakiness, if marker is stable and camera too
  - influence of blur, influence of noises
- Measure accuracy - substract between where it should be, versus where it is.
- Measure latency - time to process one frame
- Measure performance fps

  
# Good links
- "GUI and Headless Browser Testing" on @travisci 
  - https://docs.travis-ci.com/user/gui-and-headless-browsers/
  - It would be good to have that tested on each commit
- [webdriver.io](http://webdriver.io/)
  with their great [visual regression's services](http://webdriver.io/guide/services/visual-regression.html).
