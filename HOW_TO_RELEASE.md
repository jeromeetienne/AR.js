# How To Release ?

```bash
# Update following files:
CHANGELOG.md
three.js/src/threex/threex-artoolkitcontext.js
package.json
README.md

# Rebuild and minify everything - aka a-frame and three.js
make minify

# Commit everything
git add . && git commit -a -m 'Last commit before release' && git push

# Go to master branch
git checkout master

# Merge dev branch into master branch
git merge dev

# tag the release
git tag <tag>

# push the tag on github
git push origin --tags

# push commits tag on github
git push

# publish on NPM (only if have proper credentials)
npm publish

# Come back to dev branch
git checkout dev

# Update CHANGELOG.md - start new dev version
atom CHANGELOG.md

# update the a-frame codepen if needed
open "https://codepen.io/jeromeetienne/pen/mRqqzb?editors=1000#0"
```
