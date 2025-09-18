/*
 * Copyright (c) 1988-1997 Sam Leffler
 * Copyright (c) 1991-1997 Silicon Graphics, Inc.
 * Copyright (c) 2025 Superstruct Ltd, New Zealand
 * Licensed under libtiff license
 *
 * Basic functionality tests for libtiff.wasm
 */

import { assert, assertEquals, assertExists } from "@std/assert";
import { LibTIFF } from "../../src/lib/index.ts";

Deno.test("LibTIFF initialization", async () => {
  const libtiff = await LibTIFF.initialize();
  assertExists(libtiff);
  assertExists(libtiff.processor);
  assertExists(libtiff.performance);
  assertExists(libtiff.memory);
});

Deno.test("LibTIFF module access", async () => {
  const libtiff = await LibTIFF.initialize();
  const module = libtiff.getRawModule();
  assertExists(module);
  assertExists(module._malloc);
  assertExists(module._free);
  assertExists(module.HEAPU8);
});

Deno.test("Memory management", async () => {
  const libtiff = await LibTIFF.initialize();
  const memory = libtiff.memory;

  // Test memory allocation
  const testSize = 1024;
  const memView = memory.allocateBytes(testSize);
  assertEquals(memView.size, testSize);
  assertExists(memView.ptr);
  assertExists(memView.view);
  assertEquals(memView.view.length, testSize);

  // Test memory cleanup
  memory.free(memView);
});

Deno.test("String allocation and reading", async () => {
  const libtiff = await LibTIFF.initialize();
  const memory = libtiff.memory;

  const testString = "Hello, LibTIFF.wasm!";
  const ptr = memory.allocateString(testString);
  assert(ptr > 0);

  const readBack = memory.readString(ptr);
  assertEquals(readBack, testString);

  libtiff.getRawModule()._free(ptr);
});

Deno.test("TIFF creation from RGBA", async () => {
  const libtiff = await LibTIFF.initialize();

  // Create a simple 2x2 RGBA image
  const width = 2;
  const height = 2;
  const rgbaData = new Uint8Array([
    255, 0, 0, 255,    // Red pixel
    0, 255, 0, 255,    // Green pixel
    0, 0, 255, 255,    // Blue pixel
    255, 255, 255, 255 // White pixel
  ]);

  const filename = "test_basic_2x2.tiff";
  const compression = 1; // No compression

  const error = await libtiff.processor.createFromRGBA(
    filename,
    rgbaData,
    width,
    height,
    compression
  );

  assertEquals(error, 0, "TIFF creation should succeed");
});

Deno.test("Performance metrics", async () => {
  const libtiff = await LibTIFF.initialize();
  const metrics = libtiff.performance.getMetrics();

  assertExists(metrics);
  assert(typeof metrics.memory_usage_mb === 'number');
  assert(typeof metrics.processing_speed_mpixels === 'number');
  assert(typeof metrics.simd_efficiency === 'number');
  assert(metrics.memory_usage_mb >= 0);
});

Deno.test("Browser capabilities detection", async () => {
  const libtiff = await LibTIFF.initialize();
  const capabilities = libtiff.performance.detectCapabilities();

  assertExists(capabilities);
  assert(typeof capabilities.webgpu === 'boolean');
  assert(typeof capabilities.simd === 'boolean');
  assert(typeof capabilities.shared_memory === 'boolean');
});