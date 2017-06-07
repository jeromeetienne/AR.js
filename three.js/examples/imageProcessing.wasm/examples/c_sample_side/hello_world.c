unsigned int canvasWidth = 256;
unsigned int canvasHeight = 256;

#define CANVAS_MAX_WIDTH 256
#define CANVAS_MAX_HEIGHT 256
#define CANVAS_MAX_CHANNEL 1

// TODO i dont need malloc - i can just create a large ARRAY
unsigned char canvasArray[CANVAS_MAX_WIDTH * CANVAS_MAX_HEIGHT * CANVAS_MAX_CHANNEL];

void fillArray(){
        int i;
        for( i = 0; i < 256; i++ ){
                canvasArray[i] = i*5;
        }
}

int getValue(int i) {
        return canvasArray[i];
}

int doubler(int x) {
        return 2 * x;
}
