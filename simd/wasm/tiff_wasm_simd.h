/*
 * Copyright © 2025 Superstruct Ltd, New Zealand
 * Licensed under libtiff license
 *
 * WASM SIMD optimization headers for libtiff.wasm
 * SIMD-optimized TIFF processing operations
 */

#ifndef TIFF_WASM_SIMD_H
#define TIFF_WASM_SIMD_H

#include <stdint.h>
#include <stddef.h>

#ifdef __cplusplus
extern "C" {
#endif

/*
 * WASM SIMD optimized functions
 * These automatically fall back to scalar implementations if SIMD is unavailable
 */

/* Horizontal predictor optimizations (from tif_predict.c) */
void tiff_wasm_simd_horizontal_predictor_4(uint8_t* data, size_t count);
void tiff_wasm_simd_horizontal_predictor_3(uint8_t* data, size_t count);
void tiff_wasm_simd_horizontal_predictor_2(uint8_t* data, size_t count);

/* Byte swapping optimizations (from tif_lzw.c) */
void tiff_wasm_simd_swap_bytes_64(uint8_t* data, size_t count);
void tiff_wasm_simd_swap_bytes_32(uint8_t* data, size_t count);

/* Color space conversion optimizations */
void tiff_wasm_simd_rgb_to_yuv(const uint8_t* rgb, uint8_t* yuv, size_t pixel_count);

/* Memory operation optimizations */
void tiff_wasm_simd_copy_strip(const uint8_t* src, uint8_t* dst, size_t size);

/* SIMD capability detection */
int tiff_wasm_simd_available(void);

/*
 * Scalar fallback implementations
 * Always available regardless of SIMD support
 */

void tiff_scalar_horizontal_predictor_4(uint8_t* data, size_t count);
void tiff_scalar_horizontal_predictor_3(uint8_t* data, size_t count);
void tiff_scalar_horizontal_predictor_2(uint8_t* data, size_t count);
void tiff_scalar_swap_bytes_64(uint8_t* data, size_t count);
void tiff_scalar_swap_bytes_32(uint8_t* data, size_t count);
void tiff_scalar_rgb_to_yuv(const uint8_t* rgb, uint8_t* yuv, size_t pixel_count);

#ifdef __cplusplus
}
#endif

#endif /* TIFF_WASM_SIMD_H */