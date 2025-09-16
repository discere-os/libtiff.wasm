/*
 * Copyright © 2025 Superstruct Ltd, New Zealand
 * Licensed under libtiff license
 *
 * TypeScript Type Definitions for libtiff.wasm
 * Direct C/C++ function bindings and type definitions ONLY
 *
 * CRITICAL: TypeScript provides ONLY thin bindings to native C/C++ functions
 * ALL implementation logic remains in C/C++ - no JavaScript business logic
 */

/**
 * Native WASM Module Interface
 * Direct binding to Emscripten-compiled C/C++ functions
 */
export interface LibTIFFWASM {
  // Core WASM module properties
  ready: Promise<LibTIFFWASM>;
  FS: any; // Emscripten filesystem
  HEAP8: Int8Array;
  HEAP16: Int16Array;
  HEAP32: Int32Array;
  HEAPU8: Uint8Array;
  HEAPU16: Uint16Array;
  HEAPU32: Uint32Array;
  HEAPF32: Float32Array;
  HEAPF64: Float64Array;

  // Memory management (direct Emscripten bindings)
  _malloc(size: number): number;
  _free(ptr: number): void;
  stackSave(): number;
  stackRestore(ptr: number): void;
  stackAlloc(size: number): number;

  // Native C/C++ function bindings (ccall/cwrap wrappers)
  libtiff_main_init(): void;
  libtiff_webgpu_init(): void;
  libtiff_simd_init(): void;

  // High-performance TIFF processing (native C implementation)
  libtiff_create_from_rgba(filename: string, rgba_data: number, width: number, height: number, compression: number): number;
  libtiff_read_to_rgba(filename: string, width_ptr: number, height_ptr: number): number;
  libtiff_get_metadata_json(filename: string): string;
  libtiff_batch_process(filenames: number, count: number, operation: number): number;


  // Performance monitoring (native C implementation)
  libtiff_get_performance_metrics(): string;
  libtiff_detect_browser_capabilities(): string;
}

/**
 * TIFF Processing Configuration
 * Direct mapping to native libtiff constants and enums
 */
export interface TIFFConfig {
  // Compression types (native libtiff constants)
  readonly COMPRESSION_NONE: number;
  readonly COMPRESSION_CCITTRLE: number;
  readonly COMPRESSION_CCITTFAX3: number;
  readonly COMPRESSION_CCITTFAX4: number;
  readonly COMPRESSION_LZW: number;
  readonly COMPRESSION_OJPEG: number;
  readonly COMPRESSION_JPEG: number;
  readonly COMPRESSION_ADOBE_DEFLATE: number;
  readonly COMPRESSION_DEFLATE: number;
  readonly COMPRESSION_PACKBITS: number;

  // Photometric interpretation (native libtiff constants)
  readonly PHOTOMETRIC_MINISWHITE: number;
  readonly PHOTOMETRIC_MINISBLACK: number;
  readonly PHOTOMETRIC_RGB: number;
  readonly PHOTOMETRIC_PALETTE: number;
  readonly PHOTOMETRIC_MASK: number;
  readonly PHOTOMETRIC_SEPARATED: number;
  readonly PHOTOMETRIC_YCBCR: number;
}

/**
 * TIFF Metadata Structure
 * Direct mapping to native TIFF directory entries
 */
export interface TIFFMetadata {
  width: number;
  height: number;
  bitsPerSample: number[];
  compression: number;
  photometric: number;
  samplesPerPixel: number;
  planarConfig: number;
  xResolution: number;
  yResolution: number;
  resolutionUnit: number;
  software?: string;
  dateTime?: string;
  artist?: string;
  copyright?: string;
  description?: string;
}


/**
 * Performance Metrics
 * Native C implementation provides all data
 */
export interface PerformanceMetrics {
  webgpu_utilization: number;    // GPU core usage percentage
  simd_efficiency: number;       // SIMD instruction efficiency
  memory_usage_mb: number;       // Current memory consumption
  processing_speed_mpixels: number; // Million pixels per second
  threading_efficiency: number; // Multi-threading utilization
}

/**
 * Browser Capability Detection
 * Native C implementation checks all APIs
 */
export interface BrowserCapabilities {
  webgpu: boolean;              // WebGPU compute shader support
  simd: boolean;                // WebAssembly SIMD support
  threading: boolean;           // SharedArrayBuffer + Workers
  shared_memory: boolean;       // SharedArrayBuffer support
  audio_worklet: boolean;       // WebAudio low-latency support
  offscreen_canvas: boolean;    // OffscreenCanvas support
  web_codecs: boolean;          // WebCodecs API support
}

/**
 * Error Handling
 * Native C error codes with TypeScript mapping
 */
export enum TIFFError {
  SUCCESS = 0,
  FILE_NOT_FOUND = -1,
  INVALID_FORMAT = -2,
  MEMORY_ERROR = -3,
  COMPRESSION_ERROR = -4,
  WRITE_ERROR = -5,
  READ_ERROR = -6,
  WEBGPU_ERROR = -7,
  SIMD_ERROR = -8
}

/**
 * Memory Management Helper Types
 * For working with Emscripten heap memory
 */
export interface WASMMemoryView {
  ptr: number;                  // Pointer to allocated memory
  size: number;                 // Size in bytes
  view: Uint8Array;             // Typed array view
}

/**
 * File System Integration
 * Emscripten filesystem operations
 */
export interface WASMFileSystem {
  writeFile(filename: string, data: Uint8Array): void;
  readFile(filename: string): Uint8Array;
  unlink(filename: string): void;
  exists(filename: string): boolean;
  mkdir(dirname: string): void;
  rmdir(dirname: string): void;
}