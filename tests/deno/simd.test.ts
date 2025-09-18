/*
 * Copyright (c) 1988-1997 Sam Leffler
 * Copyright (c) 1991-1997 Silicon Graphics, Inc.
 * Copyright (c) 2025 Superstruct Ltd, New Zealand
 * Licensed under libtiff license
 *
 * SIMD optimization tests for libtiff.wasm
 */

import { assert, assertEquals } from "@std/assert";
import { LibTIFF } from "../../src/lib/index.ts";

Deno.test("SIMD availability detection", async () => {
  const libtiff = await LibTIFF.initialize();
  const module = libtiff.getRawModule() as any;

  // Check if SIMD functions are available
  const simdAvailable = module._tiff_wasm_simd_available;
  assert(typeof simdAvailable === 'function', "SIMD availability function should exist");

  const isAvailable = simdAvailable();
  assert(typeof isAvailable === 'number', "SIMD availability should return number");
});

Deno.test("SIMD horizontal predictor functions", async () => {
  const libtiff = await LibTIFF.initialize();
  const module = libtiff.getRawModule() as any;

  // Test data for horizontal predictor
  const testData = new Uint8Array([
    10, 20, 30, 40,  // First group
    50, 60, 70, 80,  // Second group
    90, 100, 110, 120 // Third group
  ]);

  const dataPtr = module._malloc(testData.length);
  module.HEAPU8.set(testData, dataPtr);

  // Test 4-byte horizontal predictor
  if (module._tiff_wasm_simd_horizontal_predictor_4) {
    module._tiff_wasm_simd_horizontal_predictor_4(dataPtr, testData.length);

    // Read back the result
    const result = new Uint8Array(module.HEAPU8.buffer, dataPtr, testData.length);

    // First 4 bytes should be unchanged
    assertEquals(result[0], 10);
    assertEquals(result[1], 20);
    assertEquals(result[2], 30);
    assertEquals(result[3], 40);

    // Following bytes should be differences
    assertEquals(result[4], 50 - 10); // 40
    assertEquals(result[5], 60 - 20); // 40
  }

  module._free(dataPtr);
});

Deno.test("SIMD byte swapping", async () => {
  const libtiff = await LibTIFF.initialize();
  const module = libtiff.getRawModule() as any;

  // Test 32-bit byte swapping
  const testData32 = new Uint8Array([
    0x12, 0x34, 0x56, 0x78,  // Should become 0x78563412
    0xAB, 0xCD, 0xEF, 0x01   // Should become 0x01EFCDAB
  ]);

  const dataPtr32 = module._malloc(testData32.length);
  module.HEAPU8.set(testData32, dataPtr32);

  if (module._tiff_wasm_simd_swap_bytes_32) {
    module._tiff_wasm_simd_swap_bytes_32(dataPtr32, testData32.length);

    const result32 = new Uint8Array(module.HEAPU8.buffer, dataPtr32, testData32.length);
    assertEquals(result32[0], 0x78);
    assertEquals(result32[1], 0x56);
    assertEquals(result32[2], 0x34);
    assertEquals(result32[3], 0x12);
  }

  module._free(dataPtr32);
});

Deno.test("SIMD RGB to YUV conversion", async () => {
  const libtiff = await LibTIFF.initialize();
  const module = libtiff.getRawModule() as any;

  // Test RGB data (white and black pixels)
  const rgbData = new Uint8Array([
    255, 255, 255,  // White pixel
    0, 0, 0,        // Black pixel
    255, 0, 0,      // Red pixel
    0, 255, 0       // Green pixel
  ]);

  const yuvData = new Uint8Array(rgbData.length);

  const rgbPtr = module._malloc(rgbData.length);
  const yuvPtr = module._malloc(yuvData.length);

  module.HEAPU8.set(rgbData, rgbPtr);

  if (module._tiff_wasm_simd_rgb_to_yuv) {
    module._tiff_wasm_simd_rgb_to_yuv(rgbPtr, yuvPtr, 4); // 4 pixels

    const result = new Uint8Array(module.HEAPU8.buffer, yuvPtr, yuvData.length);

    // White pixel should have Y=255, U=128, V=128
    assert(result[0] > 200, "White pixel Y component should be bright");
    assert(Math.abs(result[1] - 128) < 20, "White pixel U component should be near 128");
    assert(Math.abs(result[2] - 128) < 20, "White pixel V component should be near 128");

    // Black pixel should have Y=0, U=128, V=128
    assert(result[3] < 50, "Black pixel Y component should be dark");
  }

  module._free(rgbPtr);
  module._free(yuvPtr);
});

Deno.test("SIMD strip copying performance", async () => {
  const libtiff = await LibTIFF.initialize();
  const module = libtiff.getRawModule() as any;

  const testSize = 1024; // 1KB test
  const srcData = new Uint8Array(testSize);
  const dstData = new Uint8Array(testSize);

  // Fill source with pattern
  for (let i = 0; i < testSize; i++) {
    srcData[i] = i % 256;
  }

  const srcPtr = module._malloc(testSize);
  const dstPtr = module._malloc(testSize);

  module.HEAPU8.set(srcData, srcPtr);

  if (module._tiff_wasm_simd_copy_strip) {
    const startTime = performance.now();
    module._tiff_wasm_simd_copy_strip(srcPtr, dstPtr, testSize);
    const endTime = performance.now();

    // Verify copy correctness
    const result = new Uint8Array(module.HEAPU8.buffer, dstPtr, testSize);
    for (let i = 0; i < testSize; i++) {
      assertEquals(result[i], srcData[i], `Byte ${i} should match`);
    }

    // Performance should be reasonable (< 1ms for 1KB)
    const copyTime = endTime - startTime;
    assert(copyTime < 1.0, `Copy time ${copyTime}ms should be fast`);

    console.log(`SIMD copy performance: ${(testSize / copyTime / 1000).toFixed(2)} MB/s`);
  }

  module._free(srcPtr);
  module._free(dstPtr);
});