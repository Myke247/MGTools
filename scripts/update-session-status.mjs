#!/usr/bin/env node

/**
 * Update SESSION_STATUS.md with current git state
 *
 * This script helps maintain SESSION_STATUS.md with current:
 * - Latest commit hash and message
 * - Current branch
 * - Timestamp
 *
 * Usage: node scripts/update-session-status.mjs
 */

import { execSync } from 'child_process';
import { readFileSync, writeFileSync } from 'fs';

// Get git information
const branch = execSync('git rev-parse --abbrev-ref HEAD').toString().trim();
const latestCommit = execSync('git log --oneline -1').toString().trim();
const timestamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

console.log('📊 Updating SESSION_STATUS.md...');
console.log(`   Branch: ${branch}`);
console.log(`   Latest: ${latestCommit}`);
console.log(`   Date: ${timestamp}`);

// Read current SESSION_STATUS.md
const statusPath = 'SESSION_STATUS.md';
let content = readFileSync(statusPath, 'utf8');

// Update header section
const headerRegex = /\*\*Last Updated:\*\* .*?\n\*\*Branch:\*\* .*?\n\*\*Latest Commit:\*\* .*?\n/;
const newHeader = `**Last Updated:** ${timestamp}\n**Branch:** ${branch}\n**Latest Commit:** \`${latestCommit}\`\n`;

if (headerRegex.test(content)) {
  content = content.replace(headerRegex, newHeader);
} else {
  console.warn('⚠️  Could not find header section to update');
}

// Write updated content
writeFileSync(statusPath, content);

console.log('✅ SESSION_STATUS.md updated successfully!');
