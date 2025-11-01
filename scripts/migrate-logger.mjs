#!/usr/bin/env node
/**
 * Logger Migration Script
 * Replaces console.log/error/warn with productionLog/Error/Warn
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const srcDir = path.join(__dirname, '..', 'src');

// Files to exclude
const EXCLUDE_FILES = ['logging.js', 'constants.js', 'early-trap-standalone.js'];

// Find all JS files
function findJsFiles(dir) {
  let results = [];
  const list = fs.readdirSync(dir);

  list.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat && stat.isDirectory()) {
      results = results.concat(findJsFiles(filePath));
    } else if (file.endsWith('.js') && !EXCLUDE_FILES.includes(file)) {
      results.push(filePath);
    }
  });

  return results;
}

// Check if file needs logging import
function needsLoggingImport(content) {
  return !content.includes('from') || !content.includes('logging.js');
}

// Get correct import path
function getImportPath(filePath) {
  const relativePath = path.relative(srcDir, filePath);
  const depth = relativePath.split(path.sep).length - 1;
  const prefix = depth === 0 ? './' : '../'.repeat(depth);
  return `${prefix}core/logging.js`;
}

// Add import statement
function addLoggingImport(content, importPath) {
  // Find end of first comment block or beginning of file
  const lines = content.split('\n');
  let insertIndex = 0;
  let inComment = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    if (line.startsWith('/*')) inComment = true;
    if (inComment && line.endsWith('*/')) {
      inComment = false;
      insertIndex = i + 1;
      break;
    }
    if (!inComment && line.startsWith('//')) continue;
    if (!inComment && line.length > 0 && !line.startsWith('import')) {
      insertIndex = i;
      break;
    }
    if (line.startsWith('import')) {
      insertIndex = i;
      break;
    }
  }

  const importStatement = `import { productionLog, productionError, productionWarn, debugLog } from '${importPath}';\n`;
  lines.splice(insertIndex, 0, importStatement);
  return lines.join('\n');
}

// Main migration
function migrateFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  const originalContent = content;

  // Check if file has console usage
  if (!content.includes('console.log') && !content.includes('console.error') && !content.includes('console.warn')) {
    return { migrated: false, path: filePath };
  }

  // Add import if needed
  if (needsLoggingImport(content)) {
    const importPath = getImportPath(filePath);
    content = addLoggingImport(content, importPath);
  }

  // Replace console calls
  let replacements = 0;
  content = content.replace(/console\.error\(/g, () => {
    replacements++;
    return 'productionError(';
  });
  content = content.replace(/console\.warn\(/g, () => {
    replacements++;
    return 'productionWarn(';
  });
  content = content.replace(/console\.log\(/g, () => {
    replacements++;
    return 'productionLog(';
  });

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    return { migrated: true, path: filePath, replacements };
  }

  return { migrated: false, path: filePath };
}

// Run migration
console.log('🚀 Starting logger migration...\n');

const files = findJsFiles(srcDir);
const results = files.map(migrateFile);

const migrated = results.filter(r => r.migrated);
const totalReplacements = migrated.reduce((sum, r) => sum + (r.replacements || 0), 0);

console.log(`✅ Migration complete!`);
console.log(`📊 Files processed: ${files.length}`);
console.log(`📝 Files migrated: ${migrated.length}`);
console.log(`🔄 Total replacements: ${totalReplacements}\n`);

if (migrated.length > 0) {
  console.log('Migrated files:');
  migrated.forEach(r => {
    const rel = path.relative(srcDir, r.path);
    console.log(`  - ${rel} (${r.replacements} replacements)`);
  });
}

console.log('\n📦 Next step: npm run build:production');
