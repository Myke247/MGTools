#!/usr/bin/env node
/**
 * MGTools Build Script - Incremental Modularization Builder
 * ===========================================================
 * Phase 2 Strategy: Hybrid build that combines extracted modules
 * with remaining inline code from mgtools.user.js
 *
 * This allows incremental extraction without breaking the build.
 */

const fs = require('fs');
const path = require('path');

// Paths
const OUTDIR = path.join(process.cwd(), 'dist');
const OUT_FILE = path.join(OUTDIR, 'mgtools.user.js');
const MONOLITH_FILE = path.join(process.cwd(), 'mgtools.user.js');
const SRC_INDEX = path.join(process.cwd(), 'src', 'index.js');

// Ensure output directory exists
fs.mkdirSync(OUTDIR, { recursive: true });

console.log('🔨 MGTools Build (Phase 2 - Incremental Modularization)');
console.log('  Strategy: Mirror build (extract in next phase)');
console.log('  Source: mgtools.user.js');
console.log('  Output: dist/mgtools.user.js');
console.log('');

// For now, Phase 2 Module 1 is complete but not yet integrated into build
// We'll continue with mirror build until all modules are extracted
// Then switch to esbuild bundling

// Read source
const source = fs.readFileSync(MONOLITH_FILE, 'utf8');

// Write to dist (mirror build)
fs.writeFileSync(OUT_FILE, source, 'utf8');

const stats = fs.statSync(OUT_FILE);
const sizeKB = (stats.size / 1024).toFixed(2);

console.log('✅ Build complete → dist/mgtools.user.js');
console.log(`   Size: ${sizeKB} KB`);
console.log('');
console.log('📝 Status: Phase 2 Module 1 (storage.js) extracted');
console.log('   Next: Extract remaining modules, then switch to esbuild bundling');
console.log('');
console.log('✨ Ready to deploy! Copy dist/mgtools.user.js to Tampermonkey');
