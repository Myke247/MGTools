#!/usr/bin/env node
/**
 * MGTools Build Script - Strategy Selector
 * =========================================
 * Phase 3D: Supports selectable build strategies via BUILD_STRATEGY env var
 *
 * Strategies:
 *   - mirror (default): Copy source directly to dist (byte-identical)
 *   - esbuild: Bundle modular sources with esbuild
 *
 * Usage:
 *   BUILD_STRATEGY=mirror node build.js   (default)
 *   BUILD_STRATEGY=esbuild node build.js
 */

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const STRAT = (process.env.BUILD_STRATEGY || 'mirror').toLowerCase();
const DIST = path.join('dist', 'mgtools.user.js');

function sha256(file) {
  const c = require('crypto');
  return c.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
}

function ensureDist() {
  if (!fs.existsSync('dist')) fs.mkdirSync('dist');
}

if (STRAT === 'mirror') {
  console.log('🔨 MGTools Build (Mirror)');
  ensureDist();
  fs.copyFileSync('mgtools.user.js', DIST);
  console.log('✅ mirror → dist/mgtools.user.js');
} else if (STRAT === 'esbuild') {
  console.log('🔨 MGTools Build (esbuild)');
  // 1) Build esbuild artifact
  const r = spawnSync(process.execPath, ['scripts/build-esbuild.mjs'], { stdio: 'inherit' });
  if (r.status !== 0) process.exit(r.status);
  // 2) Copy esbuild artifact into shipping path
  const src = path.join('dist', 'mgtools.esbuild.user.js');
  ensureDist();
  fs.copyFileSync(src, DIST);
  console.log('✅ esbuild → dist/mgtools.user.js');
} else {
  console.error('❌ Unknown BUILD_STRATEGY:', STRAT);
  process.exit(1);
}

// Build check (source vs shipping identical only when mirror)
if (STRAT === 'mirror') {
  const c = require('crypto');
  const a = c.createHash('sha256').update(fs.readFileSync('mgtools.user.js')).digest('hex');
  const b = c.createHash('sha256').update(fs.readFileSync(DIST)).digest('hex');
  if (a !== b) { console.error('❌ Build mismatch'); process.exit(1); }
  console.log('✅ Build matches source (mirror)');
}
