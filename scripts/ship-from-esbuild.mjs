import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

const SRC = 'dist/mgtools.esbuild.user.js';
const DEST = 'dist/mgtools.user.js';

const src = readFileSync(SRC, 'utf8');
if (!/\/\/\s*==UserScript==[\s\S]*?==\/UserScript==/.test(src)) {
  console.error('❌ Userscript header missing in esbuild artifact');
  process.exit(1);
}
writeFileSync(DEST, src);

const sha = (s) => createHash('sha256').update(s).digest('hex');
const a = sha(src);
const b = sha(readFileSync(DEST, 'utf8'));
if (a !== b) {
  console.error('❌ Copy mismatch');
  process.exit(1);
}
console.log('✅ Canary ship OK — dist/mgtools.user.js now equals esbuild artifact');
console.log('sha256:', a);
