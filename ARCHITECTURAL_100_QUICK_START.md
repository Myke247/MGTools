# 🚀 Architectural 100% - Quick Start Guide

**Last Updated:** 2025-01-26

---

## ⚡ TL;DR - THE ONE RULE

```
╔═══════════════════════════════════════════════════════════╗
║  🚫 NEVER EDIT MGTools.user.js DIRECTLY! 🚫                ║
║                                                            ║
║  It's AUTO-GENERATED from src/                            ║
║  All edits WILL BE LOST on next build                     ║
║                                                            ║
║  ✅ Edit: src/**/*.js (source of truth)                   ║
║  ✅ Build: npm run build:production                       ║
║  ✅ Commit: BOTH src/ AND MGTools.user.js                 ║
╚═══════════════════════════════════════════════════════════╝
```

---

## 📊 Quick Facts

- **Architecture:** Architectural 100% (Phase G Complete - Jan 2025)
- **Modules:** 55 ES6 modules in src/
- **Extraction:** 95.1% (32,798/34,361 lines)
- **Build:** esbuild → IIFE format → 1.27 MB (10% smaller)
- **Pattern:** Full dependency injection

---

## 🔄 The Paradigm Shift

### BEFORE (Phases A-F)
```
MGTools.user.js = source of truth
src/ = parallel extraction (test only)
❌ Two codebases to maintain
```

### AFTER (Architectural 100%)
```
src/ = SINGLE SOURCE OF TRUTH
↓
npm run build:production
↓
MGTools.user.js = AUTO-GENERATED
✅ One codebase, professional workflow
```

---

## 🛠️ Quick Workflow

### 1. Edit Source
```bash
vim src/features/my-feature.js
```

### 2. Build
```bash
npm run build:production
```

### 3. Test
Install `MGTools.user.js` in Tampermonkey and test in-game

### 4. Commit BOTH
```bash
git add src/features/my-feature.js MGTools.user.js
git commit -m "feat: my feature"
```

---

## 📁 Directory Structure (Quick Reference)

```
src/
├── utils/          (4 modules)  - Runtime utilities, memory, platform
├── core/           (8 modules)  - Storage, logging, network, atoms
├── state/          (2 modules)  - Unified state, draggable
├── ui/             (9 modules)  - Overlay, theme, tooltips, badges
├── features/       (15+6 modules) - Pets, shop, abilities, etc.
├── controller/     (4 modules)  - App core, inputs, polling
├── init/           (5 modules)  - Bootstrap, traps, public API
└── index.js        (entry)      - Exports all modules

MGTools.user.js     🤖 AUTO-GENERATED - DO NOT EDIT!
```

---

## 🎯 NPM Scripts

```bash
# Production build (use this!)
npm run build:production

# Development build (parallel artifact)
npm run build:dev

# Code quality
npm run style         # Auto-fix ESLint + Prettier

# Clean
npm run clean         # Remove dist/*.js
```

---

## ✅ Pre-commit Hook (Automatic)

Every commit automatically:
1. Runs `npm run style` on src/
2. Runs `npm run build:production`
3. Verifies no forbidden files

**Never bypass with --no-verify!**

---

## 🚫 Common Mistakes

### ❌ WRONG
```bash
# Editing generated file
vim MGTools.user.js  # ❌ WILL BE LOST!
git commit MGTools.user.js  # ❌ Missing src/ changes!
```

### ✅ RIGHT
```bash
# Edit source
vim src/features/my-feature.js  # ✅ Source of truth
npm run build:production        # ✅ Regenerate
git add src/ MGTools.user.js    # ✅ Commit BOTH
git commit -m "feat: ..."       # ✅ Ship it!
```

---

## 📖 Dependency Injection Pattern

**ALL functions MUST use this pattern:**

```javascript
export function myFunction(dependencies = {}) {
  const {
    UnifiedState = typeof window !== 'undefined' && window.UnifiedState,
    targetWindow = typeof window !== 'undefined' ? window : null,
    MGA_saveJSON
  } = dependencies;

  // Your code here
}
```

**Why?**
- Testable
- No globals
- Professional
- Required!

---

## 📚 Full Documentation

**Read in this order:**
1. `SESSION_STATUS.md` - Current state
2. This file - Quick reference
3. `README.md` - User documentation

---

## 🆘 Troubleshooting

### Build fails?
```bash
# Check for syntax errors
npm run style
npm run build:production
```

### Confused about workflow?
```bash
# Read the session status
cat SESSION_STATUS.md
```

### Made a mistake?
```bash
# Regenerate from src/
npm run build:production
```

---

## 🎯 Remember

1. **src/ is the source of truth**
2. **MGTools.user.js is auto-generated**
3. **Always run `npm run build:production`**
4. **Commit BOTH src/ and MGTools.user.js**
5. **Use dependency injection**

---

**🎉 Architectural 100% Achieved - January 2025 🎉**

**Status:** Production-ready, fully modular, single source of truth!
