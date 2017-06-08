#include <emscripten/bind.h>
#include <emscripten.h>
#include <stdint.h>

extern "C" {

EMSCRIPTEN_KEEPALIVE
void convertToGray(uint8_t *buffer, int imageW, int imageH){
	int length = imageW * imageH * 4;
	for(int i = 0; i < length; i+=4){
		buffer[i] = (uint8_t)(buffer[i] * 0.299 + buffer[i + 1] * 0.587 + buffer[i + 2] * 0.114 + 0.5);

		// buffer[i + 1] = buffer[i];
		// buffer[i + 2] = buffer[i];
	}
}


EMSCRIPTEN_KEEPALIVE
void meanBlurHorizontal(uint8_t *srcBuffer, uint8_t *dstBuffer, int imageW, int imageH, int windowW){
	for(int y = 0; y < imageH; y++){
		for(int x = windowW; x < imageW-windowW; x++){
			uint32_t average = 0;
			for(int d = -windowW; d <= windowW; d++){
				average += srcBuffer[(y * imageW + x + d) * 4];
			}
			
			dstBuffer[(y * imageW + x) * 4] = average / (windowW*2+1);
			
			// dstBuffer[(y * imageW + x) * 4+1] = dstBuffer[(y * imageW + x) * 4];
			// dstBuffer[(y * imageW + x) * 4+2] = dstBuffer[(y * imageW + x) * 4];
			// dstBuffer[(y * imageW + x) * 4+3] = 255;
		}
	}
}


EMSCRIPTEN_KEEPALIVE
void meanBlurVertical(uint8_t *srcBuffer, uint8_t *dstBuffer, int imageW, int imageH, int windowH){
	for(int y = windowH; y < imageH-windowH; y++){
		for(int x = 0; x < imageW; x++){
			uint32_t average = 0;
			for(int d = -windowH; d <= windowH; d++){
				average += srcBuffer[((y+d) * imageW + x) * 4];
			}
			
			dstBuffer[(y * imageW + x) * 4] = average / (windowH*2+1);
			
			// dstBuffer[(y * imageW + x) * 4+1] = dstBuffer[(y * imageW + x) * 4];
			// dstBuffer[(y * imageW + x) * 4+2] = dstBuffer[(y * imageW + x) * 4];
			// dstBuffer[(y * imageW + x) * 4+3] = 255;
		}
	}
}

EMSCRIPTEN_KEEPALIVE
void adaptativeThreshold(uint8_t *srcBuffer, uint8_t *bluredBuffer, uint8_t *dstBuffer, int imageW, int imageH, int threshold){
	uint8_t tab[768];
	for(int i = 0; i < 768; i++){
		tab[i] = (i - 255 <= -threshold)? 255: 0;
	}

	int length = imageW * imageH * 4;
	for(int i = 0; i < length; i+=4){
		dstBuffer[i] = tab[srcBuffer[i] - bluredBuffer[i] + 255];
		
		// dstBuffer[i + 1] = dstBuffer[i];
		// dstBuffer[i + 2] = dstBuffer[i];
		// dstBuffer[i + 3] = 255;
	}
}

}
