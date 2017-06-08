Standalone WebAssembly Example
------------------------------

Build `hello_world.c` using

    emcc hello_world.c -Os -s WASM=1 -s SIDE_MODULE=1 -o hello_world.wasm

(make sure to use latest Emscripten incoming). That creates a
WebAssembly dynamic library`hello_world.wasm`. You can then run
`hello_world.html` in your browser, which loads and uses it.

More details: https://github.com/kripken/emscripten/wiki/WebAssembly-Standalone

---

from https://gist.github.com/kripken/59c67556dc03bb6d57052fedef1e61ab
