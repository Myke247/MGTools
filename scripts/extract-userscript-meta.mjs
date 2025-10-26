import { readFileSync } from 'node:fs';
const txt = readFileSync('MGTools.user.js', 'utf8');
const m = txt.match(/\/\/\s*==UserScript==[\s\S]*?\/\/\s*==\/UserScript==/);
if (!m) {
  console.error('Userscript meta block not found in MGTools.user.js');
  process.exit(1);
}
process.stdout.write(m[0] + '\n');
