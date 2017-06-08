#include <emscripten.h>
#include <stdlib.h>
#include <alloca.h>
#include <stdint.h>

uint32_t canvasWidth = 0;
uint32_t canvasHeight = 0;

#define NCHANNELS 3

unsigned char *canvasBuffer = NULL;

EMSCRIPTEN_KEEPALIVE
unsigned char *canvasAllocate(int width, int height){
        printf("bal");
        // allocate the memory
        canvasBuffer = malloc(width * height * sizeof(canvasBuffer[0]) * NCHANNELS);
        // copy value
        canvasWidth = width;
        canvasHeight = height;
        // return the buffer
        return canvasBuffer;
}

EMSCRIPTEN_KEEPALIVE  
void canvasFree(){
        if( canvasBuffer != NULL ){
                free(canvasBuffer);
                canvasBuffer = NULL;
                canvasWidth = 0;
                canvasHeight = 0;
        }
}

EMSCRIPTEN_KEEPALIVE  
unsigned char *getCanvasBuffer(){
        return canvasBuffer;
}

EMSCRIPTEN_KEEPALIVE  
uint32_t getCanvasWidth(){
        return canvasWidth;
}

EMSCRIPTEN_KEEPALIVE  
uint32_t getCanvasHeight(){
        return canvasHeight;
}
