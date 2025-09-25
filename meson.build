project('libtiff.wasm', 'c', version: '4.7.0', meson_version: '>=1.3.0')

simd = get_option('simd')

incs = include_directories('.', 'libtiff')

tiff_sources = files(
  'libtiff/tif_aux.c','libtiff/tif_close.c','libtiff/tif_codec.c','libtiff/tif_color.c','libtiff/tif_compress.c','libtiff/tif_dir.c','libtiff/tif_dirinfo.c','libtiff/tif_dirread.c','libtiff/tif_dirwrite.c','libtiff/tif_dumpmode.c','libtiff/tif_error.c','libtiff/tif_extension.c','libtiff/tif_flush.c','libtiff/tif_getimage.c','libtiff/tif_luv.c','libtiff/tif_lzw.c','libtiff/tif_next.c','libtiff/tif_open.c','libtiff/tif_packbits.c','libtiff/tif_pixarlog.c','libtiff/tif_predict.c','libtiff/tif_print.c','libtiff/tif_read.c','libtiff/tif_strip.c','libtiff/tif_swab.c','libtiff/tif_thunder.c','libtiff/tif_tile.c','libtiff/tif_version.c','libtiff/tif_warning.c','libtiff/tif_write.c','libtiff/tif_zip.c'
)

cargs = []
if simd
  cargs += ['-msimd128']
endif

# MAIN links to Emscripten zlib and libjpeg
executable('libtiff-main',
  files('wasm/libtiff_wasm_module.c') + tiff_sources,
  include_directories: incs,
  c_args: cargs,
  link_args: [
    '-sUSE_ZLIB=1','-sUSE_LIBJPEG=1','-sWASM=1','-sMODULARIZE=1','-sEXPORT_ES6=1','-sEXPORT_NAME=LibtiffModule',
    '-sALLOW_MEMORY_GROWTH=1','-sNO_FILESYSTEM=1','-sEXPORTED_RUNTIME_METHODS=["cwrap","ccall","UTF8ToString"]','-O3','-flto'
  ],
  install: true,
  install_dir: get_option('bindir')
)

# SIDE leaves zlib/jpeg to host
shared_module('libtiff-side',
  files('wasm/libtiff_wasm_side.c') + tiff_sources,
  include_directories: incs,
  name_prefix: '',
  c_args: cargs,
  link_args: ['-sSIDE_MODULE=2','-fPIC','-O3','-flto','-sERROR_ON_UNDEFINED_SYMBOLS=0','-sEXPORTED_FUNCTIONS=["_libtiff_wasm_version"]'],
  install: true,
  install_dir: get_option('libdir')
)

