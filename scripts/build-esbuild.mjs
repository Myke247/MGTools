import esbuild from 'esbuild';
import { spawnSync } from 'node:child_process';
import { mkdirSync } from 'node:fs';

// Get userscript header from source, use it as a banner
const meta = spawnSync(process.execPath, ['scripts/extract-userscript-meta.mjs'], { encoding: 'utf8' });
if (meta.status !== 0) {
  console.error(meta.stderr || 'Failed to extract meta');
  process.exit(1);
}
const banner = meta.stdout;

// Ensure output dir
mkdirSync('dist', { recursive: true });

// DRY RUN note: src/index.js is a scaffold; we only prove the toolchain.
// We DO NOT replace the shipping build. We output a parallel artifact.
await esbuild
  .build({
    entryPoints: ['src/index.js'],
    bundle: true,
    format: 'iife',
    target: 'es2020',
    outfile: 'dist/mgtools.esbuild.user.js',
    banner: { js: banner },
    legalComments: 'none',
    sourcemap: false,
    minify: false,
    logLevel: 'info'
  })
  .catch(e => {
    console.error(e);
    process.exit(1);
  });

console.log('esbuild DRY RUN complete → dist/mgtools.esbuild.user.js (parallel artifact)');
