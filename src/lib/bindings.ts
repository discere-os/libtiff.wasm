/*
 * Copyright © 2025 Superstruct Ltd, New Zealand
 * Licensed under libtiff license
 *
 * TypeScript Bindings for libtiff.wasm
 * Minimal glue layer for Emscripten ccall/cwrap helpers ONLY
 *
 * CRITICAL: This file provides ONLY data marshalling to/from C/C++
 * ALL implementation logic remains in native C/C++ code
 * TypeScript never implements library functionality
 */

import type {
  LibTIFFWASM,
  TIFFConfig,
  TIFFMetadata,
  PerformanceMetrics,
  BrowserCapabilities,
  TIFFError,
  WASMMemoryView
} from './types.js';

/**
 * Native WASM Module Loader
 * Direct Emscripten module loading with maximum browser features
 */
let wasmModule: LibTIFFWASM | null = null;

export async function loadLibTIFFWASM(): Promise<LibTIFFWASM> {
  if (wasmModule) {
    return wasmModule;
  }

  // Mandatory WebGPU+SIMD detection - no fallbacks
  if (!navigator.gpu) {
    throw new Error('WebGPU required - please upgrade to Chrome/Edge 113+ for native-level TIFF processing');
  }

  if (!WebAssembly.simd) {
    throw new Error('WebAssembly SIMD required - please upgrade to Chrome/Edge 113+ for vectorized operations');
  }

  // Dynamic import of WASM module (build system will resolve path)
  const LibTIFFWASMFactory = (await import('../dist/libtiff-main.js')).default;

  wasmModule = await LibTIFFWASMFactory({
    // Maximum browser API utilization configuration
    wasmBinary: undefined, // Let Emscripten handle binary loading
    noInitialRun: true,    // Manual initialization control
    noExitRuntime: true,   // Persistent module for multiple operations

    // Threading configuration
    mainScriptUrlOrBlob: undefined, // Auto-detect

    // Performance optimization
    locateFile: (path: string, scriptDirectory: string) => {
      // CDN optimization for production deployment
      if (path.endsWith('.wasm')) {
        return scriptDirectory + path;
      }
      return scriptDirectory + path;
    },

    // Error handling
    onRuntimeInitialized: () => {
      console.log('[LibTIFF WASM] Runtime initialized with native-level features');
      // Initialize native C/C++ module
      wasmModule!.libtiff_main_init();
    },

    onAbort: (reason: string) => {
      console.error('[LibTIFF WASM] Module aborted:', reason);
      throw new Error(`LibTIFF WASM module aborted: ${reason}`);
    }
  });

  return wasmModule;
}

/**
 * Memory Management Utilities
 * Direct Emscripten heap manipulation - no JavaScript logic
 */
export class WASMMemoryManager {
  private module: LibTIFFWASM;

  constructor(module: LibTIFFWASM) {
    this.module = module;
  }

  // Allocate memory and return typed view
  allocateBytes(size: number): WASMMemoryView {
    const ptr = this.module._malloc(size);
    if (!ptr) {
      throw new Error(`Failed to allocate ${size} bytes`);
    }

    return {
      ptr,
      size,
      view: new Uint8Array(this.module.HEAPU8.buffer, ptr, size)
    };
  }

  // Free allocated memory
  free(memView: WASMMemoryView): void {
    this.module._free(memView.ptr);
  }

  // Write string to heap and return pointer
  allocateString(str: string): number {
    const encoder = new TextEncoder();
    const bytes = encoder.encode(str + '\0'); // Null-terminated
    const memView = this.allocateBytes(bytes.length);
    memView.view.set(bytes);
    return memView.ptr;
  }

  // Read string from heap pointer
  readString(ptr: number): string {
    const decoder = new TextDecoder();
    const view = new Uint8Array(this.module.HEAPU8.buffer, ptr);

    // Find null terminator
    let length = 0;
    while (view[length] !== 0 && length < view.length) {
      length++;
    }

    return decoder.decode(view.slice(0, length));
  }
}

/**
 * High-Performance TIFF Processing API
 * Direct bindings to native C/C++ functions - no JavaScript implementation
 */
export class LibTIFFProcessor {
  private module: LibTIFFWASM;
  private memory: WASMMemoryManager;

  constructor(module: LibTIFFWASM) {
    this.module = module;
    this.memory = new WASMMemoryManager(module);
  }

  // Create TIFF from RGBA data - calls native C function
  async createFromRGBA(
    filename: string,
    rgbaData: Uint8Array,
    width: number,
    height: number,
    compression: number = 1
  ): Promise<TIFFError> {
    // Allocate memory for image data
    const dataMemView = this.memory.allocateBytes(rgbaData.length);
    dataMemView.view.set(rgbaData);

    // Allocate filename string
    const filenamePtr = this.memory.allocateString(filename);

    try {
      // Call native C function - ALL logic in C/C++
      const result = this.module.libtiff_create_from_rgba(
        this.memory.readString(filenamePtr),
        dataMemView.ptr,
        width,
        height,
        compression
      );

      return result as TIFFError;
    } finally {
      // Clean up allocated memory
      this.memory.free(dataMemView);
      this.module._free(filenamePtr);
    }
  }

  // Read TIFF to RGBA data - calls native C function
  async readToRGBA(filename: string): Promise<{
    rgbaData: Uint8Array;
    width: number;
    height: number;
  } | null> {
    const filenamePtr = this.memory.allocateString(filename);

    // Allocate memory for width/height output parameters
    const widthPtr = this.module._malloc(4);   // int*
    const heightPtr = this.module._malloc(4);  // int*

    try {
      // Call native C function - ALL logic in C/C++
      const dataPtr = this.module.libtiff_read_to_rgba(
        this.memory.readString(filenamePtr),
        widthPtr,
        heightPtr
      );

      if (!dataPtr) {
        return null;
      }

      // Read output parameters
      const width = this.module.HEAP32[widthPtr / 4];
      const height = this.module.HEAP32[heightPtr / 4];
      const dataSize = width * height * 4; // RGBA

      // Copy data from WASM heap
      const rgbaData = new Uint8Array(dataSize);
      rgbaData.set(new Uint8Array(this.module.HEAPU8.buffer, dataPtr, dataSize));

      // Free the C-allocated data
      this.module._free(dataPtr);

      return { rgbaData, width, height };
    } finally {
      // Clean up allocated memory
      this.module._free(filenamePtr);
      this.module._free(widthPtr);
      this.module._free(heightPtr);
    }
  }

  // Get TIFF metadata - calls native C function returning JSON
  async getMetadata(filename: string): Promise<TIFFMetadata | null> {
    const filenamePtr = this.memory.allocateString(filename);

    try {
      // Call native C function - returns JSON string
      const jsonStr = this.module.libtiff_get_metadata_json(
        this.memory.readString(filenamePtr)
      );

      if (!jsonStr || jsonStr === '{}') {
        return null;
      }

      // Parse JSON returned by C function (C does the work, TypeScript just parses)
      return JSON.parse(jsonStr) as TIFFMetadata;
    } finally {
      this.module._free(filenamePtr);
    }
  }
}

      // Native C implementation handles all composition logic
      this.module.libtiff_rhetoric_composition(
        this.memory.readString(projectPtr),
        this.memory.readString(modePtr)
      );
    } finally {
      this.module._free(projectPtr);
      this.module._free(modePtr);
    }
  }
}

/**
 * Performance Monitoring
 * Direct bindings to native C/C++ performance functions
 */
export class LibTIFFPerformance {
  private module: LibTIFFWASM;

  constructor(module: LibTIFFWASM) {
    this.module = module;
  }

  // Get performance metrics - native C function returns JSON
  getMetrics(): PerformanceMetrics {
    const jsonStr = this.module.libtiff_get_performance_metrics();
    return JSON.parse(jsonStr) as PerformanceMetrics;
  }

  // Detect browser capabilities - native C function returns JSON
  detectCapabilities(): BrowserCapabilities {
    const jsonStr = this.module.libtiff_detect_browser_capabilities();
    return JSON.parse(jsonStr) as BrowserCapabilities;
  }
}

/**
 * Main API Export
 * Provides access to all native C/C++ functionality via TypeScript bindings
 */
export class LibTIFF {
  private module: LibTIFFWASM;

  public readonly processor: LibTIFFProcessor;
  public readonly education: LibTIFFEducation;
  public readonly performance: LibTIFFPerformance;
  public readonly memory: WASMMemoryManager;

  private constructor(module: LibTIFFWASM) {
    this.module = module;
    this.processor = new LibTIFFProcessor(module);
    this.education = new LibTIFFEducation(module);
    this.performance = new LibTIFFPerformance(module);
    this.memory = new WASMMemoryManager(module);
  }

  // Static factory method for loading and initializing
  static async initialize(): Promise<LibTIFF> {
    const module = await loadLibTIFFWASM();
    return new LibTIFF(module);
  }

  // Access to raw WASM module for advanced users
  getRawModule(): LibTIFFWASM {
    return this.module;
  }
}