#include <emscripten.h>
#include "libtiff/tiffio.h"

EMSCRIPTEN_KEEPALIVE
const char* libtiff_wasm_version(void) {
  return TIFFGetVersion();
}

