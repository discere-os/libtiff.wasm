#include "libtiff/tiffio.h"

const char* libtiff_wasm_version(void) {
  return TIFFGetVersion();
}

