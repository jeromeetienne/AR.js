#include <emscripten/bind.h>
#include <string>

using namespace emscripten;

class MyClass {
public:
	MyClass(int x) : x(x) {
	}
	
	void incrementX() {
		++x;
	}
	
	int getX() const { return x; }
	void setX(int x_) { x = x_; }
	
private:
	int x;
};

// Binding code
EMSCRIPTEN_BINDINGS(my_class_example) {
	class_<MyClass>("MyClass")
	.constructor<int>()
	.function("incrementX", &MyClass::incrementX)
	.property("x", &MyClass::getX, &MyClass::setX)
	;
}
