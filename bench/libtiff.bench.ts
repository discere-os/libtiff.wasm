/**
 * Libtiff WASM Benchmarks
 */

import LibtiffWASM from "../src/lib/index.ts"

Deno.bench("libtiff initialization", {
  baseline: true
}, async () => {
  const lib = new LibtiffWASM()
  await lib.initialize()
})
