watch: build
	fswatch -0 *.js core/*.js math/*.js | xargs -0 -n 1 -I {} make build

build:
	cat *.js \
		math/Vector3.js math/Quaternion.js math/Vector3.js math/Vector4.js math/Color.js \
		math/Matrix3.js \
		math/Matrix4.js \
		math/Plane.js math/Box3.js math/Sphere.js \
		math/Frustum.js \
		core/*.js \
		renderers/webgl/*.js \
		renderers/*.js \
		> build/build.js

.PHONY: build
