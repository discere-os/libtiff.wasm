/*
 * Copyright © 2025 Superstruct Ltd, New Zealand
 * Licensed under libtiff license
 *
 * LibTIFF.wasm Demo - TIFF Processing Demonstration
 * Demonstrates high-performance TIFF processing capabilities
 *
 * CRITICAL: ALL logic implemented in native C/C++ code
 * TypeScript provides ONLY thin bindings and data marshalling
 */

import { LibTIFFProcessor, loadLibTIFFWASM } from './lib/bindings.js';

/**
 * TIFF Processing Demo
 * Demonstrates native C/C++ functions via TypeScript bindings
 */
async function runTIFFDemo(): Promise<void> {
  console.log('=== LibTIFF.wasm Demo ===');
  console.log('High-performance TIFF processing with WebAssembly');
  console.log('');

  try {
    // Initialize native WASM module with maximum browser features
    const wasmModule = await loadLibTIFFWASM();
    const processor = new LibTIFFProcessor(wasmModule);

    console.log('✅ LibTIFF WASM initialized successfully');

    // Create sample TIFF image - native C implementation
    console.log('=== Creating Sample TIFF ===');
    const width = 800;
    const height = 600;
    const rgbaData = generateSampleImageData(width, height);

    const createResult = await processor.createFromRGBA(
      'sample.tif',
      rgbaData,
      width,
      height,
      1 // No compression
    );

    if (createResult === 0) {
      console.log('✅ TIFF created successfully using native C/C++ code');
    } else {
      console.log('❌ TIFF creation failed:', createResult);
      return;
    }

    // Read and analyze metadata - native C function returns structured data
    const metadata = await processor.getMetadata('sample.tif');
    if (metadata) {
      console.log('TIFF Metadata (extracted by native C code):');
      console.log(`  Dimensions: ${metadata.width} × ${metadata.height}`);
      console.log(`  Compression: ${metadata.compression}`);
      console.log(`  Photometric: ${metadata.photometric}`);
      console.log(`  Bits per Sample: ${metadata.bitsPerSample.join(', ')}`);
    }
    console.log('');

    console.log('🎉 Demo completed successfully!');
    console.log('Native C/C++ implementation with TypeScript bindings');

  } catch (error) {
    console.error('Demo failed:', error);

    if (error instanceof Error) {
      if (error.message.includes('WebGPU')) {
        console.log('💡 Please use Chrome/Edge 113+ for full WebGPU support');
      } else if (error.message.includes('SIMD')) {
        console.log('💡 Please use Chrome/Edge 113+ for WebAssembly SIMD support');
      }
    }
  }
}

/**
 * Generate Sample Image Data for Demo
 * Creates simple pattern for TIFF processing demonstration
 */
function generateSampleImageData(width: number, height: number): Uint8Array {
  const rgbaData = new Uint8Array(width * height * 4);

  // Create simple gradient pattern
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const index = (y * width + x) * 4;

      // Generate gradient pattern
      const centerX = width / 2;
      const centerY = height / 2;
      const distanceFromCenter = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
      const maxDistance = Math.sqrt(centerX ** 2 + centerY ** 2);
      const normalizedDistance = distanceFromCenter / maxDistance;

      // Simple color gradient
      const hue = (normalizedDistance * 360 + (x + y) * 0.5) % 360;
      const saturation = 0.7;
      const lightness = 0.6;

      const [r, g, b] = hslToRgb(hue / 360, saturation, lightness);

      // RGBA values
      rgbaData[index] = r;     // Red
      rgbaData[index + 1] = g; // Green
      rgbaData[index + 2] = b; // Blue
      rgbaData[index + 3] = 255; // Alpha (fully opaque)
    }
  }

  return rgbaData;
}

/**
 * HSL to RGB Color Conversion
 * Helper function for generating color patterns
 */
function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  let r, g, b;

  if (s === 0) {
    r = g = b = l; // Achromatic
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1/6) return p + (q - p) * 6 * t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    };

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1/3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1/3);
  }

  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}

/**
 * Run Demo on Page Load
 * Demonstrates native-level TIFF processing
 */
if (typeof window !== 'undefined') {
  // Browser environment
  document.addEventListener('DOMContentLoaded', runTIFFDemo);
} else {
  // Node.js environment
  runTIFFDemo().catch(console.error);
}