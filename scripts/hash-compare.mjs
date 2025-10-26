import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

function sha256(p) {
  const h = createHash('sha256');
  h.update(readFileSync(p));
  return h.digest('hex');
}

const have = p => {
  try {
    readFileSync(p);
    return true;
  } catch {
    return false;
  }
};

const lines = [];
if (have('MGTools.user.js')) lines.push(`source : ${sha256('MGTools.user.js')}`);
if (have('dist/mgtools.user.js')) lines.push(`mirror : ${sha256('dist/mgtools.user.js')}`);
if (have('dist/mgtools.esbuild.user.js')) lines.push(`esbuild: ${sha256('dist/mgtools.esbuild.user.js')}`);
console.log(lines.join('\n') || 'No files to hash');
