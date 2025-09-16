/*
 * Copyright © 2025 Superstruct Ltd, New Zealand
 * Licensed under libtiff license
 *
 * Vitest Configuration for libtiff.wasm
 * Testing configuration for native C/C++ functions with WebGPU + SIMD requirements
 */

import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Environment configuration
    environment: 'happy-dom', // Lightweight DOM for WASM testing
    globals: true,

    // Browser requirements for WebGPU + SIMD
    setupFiles: ['./test/setup.ts'],

    // Test file patterns
    include: ['test/**/*.test.ts', 'src/**/*.test.ts'],
    exclude: ['node_modules', 'dist', 'build-*'],

    // Timeout configuration for WASM loading
    testTimeout: 30000,      // 30 seconds for WASM module loading
    hookTimeout: 10000,      // 10 seconds for setup hooks

    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'json'],
      exclude: [
        'node_modules/',
        'dist/',
        'build-*/',
        'test/',
        'wasm/',
        '**/*.d.ts',
        '**/*.config.*',
        'src/demo.ts',
        'src/benchmark.ts'
      ],
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80
        }
      }
    },

    // Performance monitoring
    benchmark: {
      include: ['test/**/*.bench.ts'],
      reporters: ['verbose']
    },

    // Browser-specific configuration for WebGPU testing
    pool: 'threads',
    poolOptions: {
      threads: {
        // Single thread for WASM module testing
        singleThread: true,
        // Isolate modules for clean WASM testing
        isolate: true
      }
    },

    // Reporter configuration
    reporter: ['verbose', 'html'],
    outputFile: {
      html: './test-results/index.html',
      json: './test-results/results.json'
    },

    // Retry configuration for flaky WASM tests
    retry: 2,

    // Watch mode configuration
    watch: false,

    // Dependency optimization for WASM
    deps: {
      // External dependencies that shouldn't be bundled
      external: [
        /^@discere-os\/.*.wasm$/
      ]
    }
  },

  // Build configuration for test dependencies
  build: {
    target: 'es2022',
    lib: {
      entry: './src/lib/bindings.ts',
      formats: ['es']
    }
  },

  // Define configuration for test environment
  define: {
    // Feature flags for testing
    __LIBTIFF_WEBGPU_ENABLED__: true,
    __LIBTIFF_SIMD_ENABLED__: true,
    __LIBTIFF_THREADING_ENABLED__: true,

    // Browser capability overrides for testing
    __TEST_WEBGPU_AVAILABLE__: true,
    __TEST_SIMD_AVAILABLE__: true,
    __TEST_SHARED_ARRAY_BUFFER_AVAILABLE__: true
  }
});