# Development Tooling Guide

This document explains the code quality tools used in the MGTools project and how to use them.

## Overview

MGTools uses three main tools to maintain code quality and consistency:

1. **ESLint** - JavaScript linter (catches errors and enforces code patterns)
2. **Prettier** - Code formatter (enforces consistent style)
3. **Airbnb Style Guide** - Industry-standard JavaScript style rules

## Setup

### Initial Installation

```bash
npm install
```

This installs all development dependencies from `package-lock.json`, ensuring everyone has identical versions.

### Required Files

- `package.json` - Defines dependencies and npm scripts
- `package-lock.json` - Locks exact dependency versions (critical for consistency)
- `eslint.config.mjs` - ESLint configuration (uses Airbnb rules)
- `.eslintrc.json` - Additional ESLint settings
- `.prettierrc` - Prettier formatting rules
- `.prettierignore` - Files Prettier should skip

## Tool Details

### ESLint (Linter)

**Purpose:** Catches errors, bugs, and enforces coding patterns

**Configuration:**
- Uses Airbnb JavaScript Style Guide (`eslint-config-airbnb-base`)
- Integrates with Prettier to avoid conflicts (`eslint-config-prettier`)
- Custom rules configured in `eslint.config.mjs`

**Usage:**

```bash
# Check for linting errors
npm run lint

# Auto-fix errors where possible
npm run lint:fix
```

**What it checks:**
- Syntax errors and potential bugs
- Undefined variables
- Unused variables
- Code complexity
- Best practice violations
- Airbnb style rules

### Prettier (Formatter)

**Purpose:** Enforces consistent code formatting automatically

**Configuration:** `.prettierrc`
```json
{
  "semi": true,
  "trailingComma": "none",
  "singleQuote": true,
  "printWidth": 120,
  "tabWidth": 2,
  "arrowParens": "avoid"
}
```

**Usage:**

```bash
# Format code
npm run format

# Check if code is formatted correctly (without changing)
npm run format:check
```

**What it formats:**
- Indentation (2 spaces)
- Line length (max 120 characters)
- Quotes (single quotes)
- Semicolons (always)
- Trailing commas (none)
- Arrow function parentheses (avoid when possible)

### Airbnb Style Guide

**Purpose:** Industry-standard JavaScript best practices

**What it enforces:**
- Consistent variable naming (camelCase)
- Proper use of `const` and `let` (no `var`)
- Template literals instead of string concatenation
- Arrow functions for callbacks
- Object and array destructuring
- Consistent spacing and indentation
- Many other best practices

**Documentation:** https://github.com/airbnb/javascript

## Workflow

### Before Committing Code

Run all checks to ensure quality:

```bash
# 1. Check syntax
npm run syntax

# 2. Fix linting issues
npm run lint:fix

# 3. Format code
npm run format

# Or run both linting and formatting together:
npm run style
```

### Common Issues

#### "ESLint errors after formatting with Prettier"

This shouldn't happen - `eslint-config-prettier` disables conflicting rules. If it does:
1. Make sure `package-lock.json` is up to date
2. Run `npm install` again
3. Check that `eslint.config.mjs` includes the Prettier config

#### "Different versions on different machines"

Always use `package-lock.json`:
1. Never delete `package-lock.json` from the repository
2. Run `npm install` (not `npm update`) to respect locked versions
3. Only update dependencies intentionally with `npm update <package>`

#### "Linting is slow"

ESLint can be slow on large files (like MGTools.user.js at 1.4MB):
- This is normal for a 33,000+ line file
- Consider running `npm run lint:fix` less frequently
- Focus on formatting with Prettier for quick fixes

## Available NPM Scripts

```json
{
  "lint": "eslint MGTools.user.js",              // Check for errors
  "lint:fix": "eslint MGTools.user.js --fix",    // Auto-fix errors
  "format": "prettier --write MGTools.user.js",  // Format code
  "format:check": "prettier --check MGTools.user.js", // Check formatting
  "syntax": "node -c MGTools.user.js",           // Validate syntax
  "style": "npm run lint:fix && npm run format"  // Fix style (lint + format)
}
```

## Configuration Files Explained

### `eslint.config.mjs`

Modern ESLint flat config format. Key sections:

```javascript
// Airbnb base rules + Prettier integration
export default [
  js.configs.recommended,
  airbnbBase,
  prettier,
  {
    languageOptions: {
      globals: {
        // Browser globals + userscript globals
        queueMicrotask: 'readonly',
        MGA_saveJSON: 'readonly',
        // ... etc
      }
    }
  }
];
```

### `.prettierrc`

JSON format, defines formatting preferences aligned with Airbnb style:

- `semi: true` - Semicolons required (Airbnb standard)
- `singleQuote: true` - Single quotes for strings (Airbnb standard)
- `printWidth: 120` - Reasonable line length (Airbnb uses 100, we use 120)
- `tabWidth: 2` - 2-space indentation (Airbnb standard)

### `.prettierignore`

Prevents Prettier from formatting certain files:

```
node_modules/
dist/
*.min.js
```

## Troubleshooting

### "npm install fails"

1. Delete `node_modules/` folder
2. Delete `package-lock.json` (locally only, don't commit)
3. Run `npm install` again
4. If still failing, restore `package-lock.json` from Git: `git checkout package-lock.json`

### "ESLint config not found"

Make sure you're in the project root directory where `eslint.config.mjs` exists.

### "Prettier not formatting"

1. Check `.prettierignore` - file might be excluded
2. Try running directly: `npx prettier --write MGTools.user.js`
3. Check file permissions

## Best Practices

1. **Always commit `package-lock.json`** - Critical for dependency consistency
2. **Run `npm run style` before committing** - Ensures code quality
3. **Don't ignore linting errors** - They often catch real bugs
4. **Use `npm install`, not `npm update`** - Respects locked versions
5. **Update dependencies intentionally** - Only when needed, with testing

## For Collaborators

When you clone the repository or pull changes:

```bash
# 1. Install dependencies (uses locked versions)
npm install

# 2. Verify tooling works
npm run lint
npm run format:check

# 3. Before committing changes
npm run style
npm run syntax
```

This ensures everyone has the same development environment and code quality standards.

## Version Information

Current versions (locked in package-lock.json):

- ESLint: ^9.x
- Prettier: ^3.x
- Airbnb Style Guide: eslint-config-airbnb-base ^15.x

See `package.json` for complete dependency list.
