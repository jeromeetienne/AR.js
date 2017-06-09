#include <emscripten/bind.h>
#include <emscripten.h>
#include <cassert>

extern "C" {
	
#define FILL_ALL_CHANNELS 0

EMSCRIPTEN_KEEPALIVE
void convertToGray(uint8_t *buffer, int imageW, int imageH){
	int length = imageW * imageH * 4;
	for(int i = 0; i < length; i+=4){
		buffer[i] = (uint8_t)(buffer[i] * 0.299 + buffer[i + 1] * 0.587 + buffer[i + 2] * 0.114 + 0.5);

		#if FILL_ALL_CHANNELS
			buffer[i + 1] = buffer[i];
			buffer[i + 2] = buffer[i];
		#endif
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
			
			#if FILL_ALL_CHANNELS
			dstBuffer[(y * imageW + x) * 4+1] = dstBuffer[(y * imageW + x) * 4];
			dstBuffer[(y * imageW + x) * 4+2] = dstBuffer[(y * imageW + x) * 4];
			dstBuffer[(y * imageW + x) * 4+3] = 255;
			#endif
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
			
			#if FILL_ALL_CHANNELS
			dstBuffer[(y * imageW + x) * 4+1] = dstBuffer[(y * imageW + x) * 4];
			dstBuffer[(y * imageW + x) * 4+2] = dstBuffer[(y * imageW + x) * 4];
			dstBuffer[(y * imageW + x) * 4+3] = 255;
			#endif
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
		
		#if FILL_ALL_CHANNELS
		dstBuffer[i + 1] = dstBuffer[i];
		dstBuffer[i + 2] = dstBuffer[i];
		dstBuffer[i + 3] = 255;
		#endif
	}
}


////////////////////////////////////////////////////////////////////////////////
//
////////////////////////////////////////////////////////////////////////////////

EMSCRIPTEN_KEEPALIVE
void meanBlurHorizontalExactSlow(uint8_t *srcBuffer, uint8_t *dstBuffer, int imageW, int imageH, int windowW){
	// EM_ASM(console.log("DDD"));
	
	for(int y = 0; y < imageH; y++){
		for(int x = 0; x < windowW; x++){
			uint32_t average = 0;
			for(int d = -x; d <= windowW; d++){
				average += srcBuffer[(y * imageW + x + d) * 4];
			}			
			dstBuffer[(y * imageW + x) * 4] = average / (windowW+x+1);
		}
		for(int x = windowW; x < imageW-windowW; x++){
			uint32_t average = 0;
			for(int d = -windowW; d <= windowW; d++){
				average += srcBuffer[(y * imageW + x + d) * 4];
			}
			
			dstBuffer[(y * imageW + x) * 4] = average / (windowW*2+1);
		}

		for(int x = imageW-windowW; x < imageW; x++){
			uint32_t average = 0;
			for(int d = -windowW; d <= windowW && x+d < imageW; d++){
				average += srcBuffer[(y * imageW + x + d) * 4];
			}
			
			dstBuffer[(y * imageW + x) * 4] = average / (windowW+imageW-x+1);
		}

		#if FILL_ALL_CHANNELS
		for(int x = 0; x < imageW; x++){
			dstBuffer[(y * imageW + x) * 4+1] = dstBuffer[(y * imageW + x) * 4];
			dstBuffer[(y * imageW + x) * 4+2] = dstBuffer[(y * imageW + x) * 4];
			dstBuffer[(y * imageW + x) * 4+3] = 255;
		}
		#endif
	}
}
////////////////////////////////////////////////////////////////////////////////
//
////////////////////////////////////////////////////////////////////////////////

EMSCRIPTEN_KEEPALIVE
void meanBlurHorizontalSlidingWindow(uint8_t *srcBuffer, uint8_t *dstBuffer, int imageW, int imageH, int windowW){
	EM_ASM(console.log("meanBlurHorizontalSlidingWindow"));
	
	uint8_t window[256];
	uint32_t windowLength = windowW*2+1;
	assert( windowLength < 256 );
	
	for(int y = 0; y < imageH; y++){
		for(int x = 0; x < windowW; x++){
		}
		for(int x = 0; x < windowW; x++){
			uint32_t average = 0;
			for(int d = -x; d <= windowW; d++){
				average += srcBuffer[(y * imageW + x + d) * 4];
			}			
			dstBuffer[(y * imageW + x) * 4] = average / (windowW+x+1);
		}
		for(int x = windowW; x < imageW-windowW; x++){
			uint32_t average = 0;
			for(int d = -windowW; d <= windowW; d++){
				average += srcBuffer[(y * imageW + x + d) * 4];
			}
			
			dstBuffer[(y * imageW + x) * 4] = average / (windowW*2+1);
		}

		for(int x = imageW-windowW; x < imageW; x++){
			uint32_t average = 0;
			for(int d = -windowW; d <= windowW && x+d < imageW; d++){
				average += srcBuffer[(y * imageW + x + d) * 4];
			}
			
			dstBuffer[(y * imageW + x) * 4] = average / (windowW+imageW-x+1);
		}

		#if FILL_ALL_CHANNELS
		for(int x = 0; x < imageW; x++){
			dstBuffer[(y * imageW + x) * 4+1] = dstBuffer[(y * imageW + x) * 4];
			dstBuffer[(y * imageW + x) * 4+2] = dstBuffer[(y * imageW + x) * 4];
			dstBuffer[(y * imageW + x) * 4+3] = 255;
		}
		#endif
	}
}


}
