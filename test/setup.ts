/*
 * Copyright © 2025 Superstruct Ltd, New Zealand
 * Licensed under libtiff license
 *
 * Test Setup for libtiff.wasm
 * Configures test environment for WebGPU + SIMD requirements
 */

import { beforeAll, afterAll } from 'vitest';

// Mock WebGPU and SIMD APIs for testing environment
beforeAll(() => {
  // Mock navigator.gpu for WebGPU testing
  if (!global.navigator) {
    global.navigator = {} as Navigator;
  }

  // Mock WebGPU API
  (global.navigator as any).gpu = {
    requestAdapter: async () => ({
      requestDevice: async () => ({
        createBuffer: () => ({}),
        createComputePipeline: () => ({}),
        queue: {
          submit: () => {},
          writeBuffer: () => {}
        }
      })
    })
  };

  // Mock WebAssembly.simd
  if (!global.WebAssembly.simd) {
    global.WebAssembly.simd = () => true;
  }

  // Mock SharedArrayBuffer for threading tests
  if (!global.SharedArrayBuffer) {
    global.SharedArrayBuffer = ArrayBuffer as any;
  }

  // Mock performance API
  if (!global.performance) {
    global.performance = {
      now: () => Date.now()
    } as Performance;
  }

  console.log('✅ Test environment configured with WebGPU + SIMD mocks');
});

afterAll(() => {
  console.log('🧹 Test cleanup completed');
});

// Helper function to check if running in browser environment
export function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof document !== 'undefined';
}

// Helper function to check WebGPU availability (real or mocked)
export function isWebGPUAvailable(): boolean {
  return !!(global.navigator as any)?.gpu;
}

// Helper function to check SIMD availability (real or mocked)
export function isSIMDAvailable(): boolean {
  return typeof WebAssembly.simd === 'function';
}

// Helper function to create test image data
export function createTestImageRGBA(width: number, height: number): Uint8Array {
  const rgbaData = new Uint8Array(width * height * 4);

  for (let i = 0; i < rgbaData.length; i += 4) {
    const pixel = i / 4;
    rgbaData[i] = (pixel * 73) % 256;     // Red
    rgbaData[i + 1] = (pixel * 151) % 256; // Green
    rgbaData[i + 2] = (pixel * 211) % 256; // Blue
    rgbaData[i + 3] = 255;                 // Alpha
  }

  return rgbaData;
}