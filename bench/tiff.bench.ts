/*
 * Copyright (c) 1988-1997 Sam Leffler
 * Copyright (c) 1991-1997 Silicon Graphics, Inc.
 * Copyright (c) 2025 Superstruct Ltd, New Zealand
 * Licensed under libtiff license
 *
 * Performance benchmarks for libtiff.wasm
 * Measures SIMD optimization impact and overall throughput
 */

import { LibTIFF } from "../src/lib/index.ts";

let libtiff: LibTIFF;

// Setup - initialize LibTIFF once for all benchmarks
await (async () => {
  libtiff = await LibTIFF.initialize();
  console.log('LibTIFF.wasm initialized for benchmarking');
})();

// Benchmark: TIFF creation from RGBA data
Deno.bench("TIFF creation - 512x512 no compression", () => {
  const width = 512;
  const height = 512;
  const rgbaData = new Uint8Array(width * height * 4);

  // Fill with gradient pattern
  for (let i = 0; i < rgbaData.length; i += 4) {
    const pixel = i / 4;
    const x = pixel % width;
    const y = Math.floor(pixel / width);
    rgbaData[i] = (x / width) * 255;     // Red
    rgbaData[i + 1] = (y / height) * 255; // Green
    rgbaData[i + 2] = ((x + y) / (width + height)) * 255; // Blue
    rgbaData[i + 3] = 255;               // Alpha
  }

  libtiff.processor.createFromRGBA("bench_512x512.tiff", rgbaData, width, height, 1);
});

Deno.bench("TIFF creation - 512x512 LZW compression", () => {
  const width = 512;
  const height = 512;
  const rgbaData = new Uint8Array(width * height * 4);

  // Fill with gradient pattern
  for (let i = 0; i < rgbaData.length; i += 4) {
    const pixel = i / 4;
    const x = pixel % width;
    const y = Math.floor(pixel / width);
    rgbaData[i] = (x / width) * 255;
    rgbaData[i + 1] = (y / height) * 255;
    rgbaData[i + 2] = ((x + y) / (width + height)) * 255;
    rgbaData[i + 3] = 255;
  }

  libtiff.processor.createFromRGBA("bench_512x512_lzw.tiff", rgbaData, width, height, 5);
});

// SIMD benchmarks
Deno.bench("SIMD horizontal predictor 4-byte - 1MB", () => {
  const module = libtiff.getRawModule() as any;
  const testSize = 1024 * 1024; // 1MB
  const dataPtr = module._malloc(testSize);

  // Fill with pattern
  const testData = new Uint8Array(testSize);
  for (let i = 0; i < testSize; i++) {
    testData[i] = (i % 256);
  }
  module.HEAPU8.set(testData, dataPtr);

  // Benchmark the SIMD operation
  if (module._tiff_wasm_simd_horizontal_predictor_4) {
    module._tiff_wasm_simd_horizontal_predictor_4(dataPtr, testSize);
  }

  module._free(dataPtr);
});

Deno.bench("SIMD byte swap 32-bit - 1MB", () => {
  const module = libtiff.getRawModule() as any;
  const testSize = 1024 * 1024; // 1MB
  const dataPtr = module._malloc(testSize);

  // Fill with pattern
  const testData = new Uint8Array(testSize);
  for (let i = 0; i < testSize; i++) {
    testData[i] = (i % 256);
  }
  module.HEAPU8.set(testData, dataPtr);

  // Benchmark the SIMD operation
  if (module._tiff_wasm_simd_swap_bytes_32) {
    module._tiff_wasm_simd_swap_bytes_32(dataPtr, testSize);
  }

  module._free(dataPtr);
});

Deno.bench("SIMD RGB to YUV conversion - 512x512", () => {
  const module = libtiff.getRawModule() as any;
  const width = 512;
  const height = 512;
  const pixelCount = width * height;
  const rgbSize = pixelCount * 3;

  const rgbPtr = module._malloc(rgbSize);
  const yuvPtr = module._malloc(rgbSize);

  // Fill RGB data
  const rgbData = new Uint8Array(rgbSize);
  for (let i = 0; i < rgbSize; i += 3) {
    const pixel = i / 3;
    const x = pixel % width;
    const y = Math.floor(pixel / width);
    rgbData[i] = (x / width) * 255;     // Red
    rgbData[i + 1] = (y / height) * 255; // Green
    rgbData[i + 2] = ((x + y) / (width + height)) * 255; // Blue
  }
  module.HEAPU8.set(rgbData, rgbPtr);

  // Benchmark the SIMD operation
  if (module._tiff_wasm_simd_rgb_to_yuv) {
    module._tiff_wasm_simd_rgb_to_yuv(rgbPtr, yuvPtr, pixelCount);
  }

  module._free(rgbPtr);
  module._free(yuvPtr);
});

Deno.bench("SIMD strip copy - 4MB", () => {
  const module = libtiff.getRawModule() as any;
  const testSize = 4 * 1024 * 1024; // 4MB
  const srcPtr = module._malloc(testSize);
  const dstPtr = module._malloc(testSize);

  // Fill source with pattern
  const srcData = new Uint8Array(testSize);
  for (let i = 0; i < testSize; i++) {
    srcData[i] = (i % 256);
  }
  module.HEAPU8.set(srcData, srcPtr);

  // Benchmark the SIMD operation
  if (module._tiff_wasm_simd_copy_strip) {
    module._tiff_wasm_simd_copy_strip(srcPtr, dstPtr, testSize);
  }

  module._free(srcPtr);
  module._free(dstPtr);
});

// Memory allocation benchmarks
Deno.bench("Memory allocation/deallocation - 1000 cycles", () => {
  const memory = libtiff.memory;

  for (let i = 0; i < 1000; i++) {
    const memView = memory.allocateBytes(1024); // 1KB per allocation
    memory.free(memView);
  }
});

Deno.bench("Large memory allocation - 10MB", () => {
  const memory = libtiff.memory;
  const memView = memory.allocateBytes(10 * 1024 * 1024);
  memory.free(memView);
});

// Cleanup notice
globalThis.addEventListener("unload", () => {
  console.log("Benchmark cleanup completed");
});