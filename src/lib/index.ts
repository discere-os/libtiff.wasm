/*
 * Copyright (c) 1988-1997 Sam Leffler
 * Copyright (c) 1991-1997 Silicon Graphics, Inc.
 * Copyright (c) 2025 Superstruct Ltd, New Zealand
 * Licensed under libtiff license
 *
 * libtiff.wasm - High-performance TIFF image processing library
 * WebAssembly port with SIMD optimization and modern browser API integration
 */

export { LibTIFF, LibTIFFProcessor, LibTIFFPerformance, WASMMemoryManager } from './bindings.ts';
export type {
  LibTIFFWASM,
  TIFFConfig,
  TIFFMetadata,
  PerformanceMetrics,
  BrowserCapabilities,
  TIFFError,
  WASMMemoryView
} from './types.ts';

// Default export for convenience
export { LibTIFF as default } from './bindings.ts';