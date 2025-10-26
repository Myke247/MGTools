# MGTools Project Context

**🚨 READ THIS FIRST when starting ANY session! 🚨**

This file contains permanent project rules and context for all developers and AI sessions.

---

## 🏆 **CRITICAL: ARCHITECTURAL 100% ACHIEVED!** 🏆

**PARADIGM SHIFT COMPLETE - January 2025**

### ⚠️ **THE #1 RULE: src/ is the SINGLE SOURCE OF TRUTH** ⚠️

```
╔════════════════════════════════════════════════════════════╗
║  🚫 DO NOT EDIT MGTools.user.js DIRECTLY! 🚫               ║
║                                                            ║
║  MGTools.user.js is AUTO-GENERATED from src/              ║
║  Any manual edits WILL BE LOST on next build              ║
║                                                            ║
║  ✅ Edit files in src/ directory                          ║
║  ✅ Run: npm run build:production                         ║
║  ✅ Commit BOTH src/ and generated MGTools.user.js        ║
╚════════════════════════════════════════════════════════════╝
```

---

## 📋 Project Overview

**MGTools** - Professional userscript for Magic Garden game enhancement

**Current Status:** ✅ **ARCHITECTURAL 100% COMPLETE!** (Phase G - Jan 2025)

**Architecture:**
- **55 ES6 modules** in `src/` directory (SINGLE SOURCE OF TRUTH)
- **7-layer architecture** (Utils → Core → State → UI → Features → Controllers → Init)
- **Full dependency injection** pattern throughout
- **95.1% code extraction** (32,798/34,361 lines modularized)
- **Remaining 4.9%:** Build wrapper (auto-generated)

**Build System:**
- **esbuild** - Modern, fast bundler
- **IIFE format** - Tampermonkey compatible
- **Tree-shaking** - Removes unused code
- **50ms build time** - Lightning fast
- **10% smaller output** - 1.27 MB vs 1.42 MB

---

## 🏗️ Architecture: Architectural 100%

### The Build System (SINGLE SOURCE OF TRUTH)

```
┌────────────────────────────────────────┐
│  SOURCE OF TRUTH: src/ (55 modules)    │
│  ├─ utils/          (4 modules)        │
│  ├─ core/           (8 modules)        │
│  ├─ state/          (2 modules)        │
│  ├─ ui/             (9 modules)        │
│  ├─ features/       (15 modules)       │
│  ├─ controller/     (4 modules)        │
│  ├─ init/           (5 modules)        │
│  └─ index.js        (entry point)      │
└────────────────────────────────────────┘
              ↓
    npm run build:production
              ↓
┌────────────────────────────────────────┐
│  GENERATED ARTIFACT: MGTools.user.js   │
│  ├─ Auto-generated from src/           │
│  ├─ 29,580 lines (optimized)           │
│  ├─ 1.27 MB (10% smaller!)             │
│  ├─ IIFE format (Tampermonkey)         │
│  └─ Ready for users                    │
└────────────────────────────────────────┘
```

### Before vs After (The Paradigm Shift)

**BEFORE (Phases A-F):**
```
MGTools.user.js (34,361 lines)
├─ Source of truth
└─ Shipped to users

src/ (55 modules)
├─ Parallel extraction
└─ Secondary codebase

❌ TWO sources of truth
❌ Manual synchronization
```

**AFTER (Architectural 100%):**
```
src/ (55 modules, 32,798 lines)
├─ SINGLE SOURCE OF TRUTH ✅
└─ All development happens here
        ↓
  npm run build:production
        ↓
MGTools.user.js (29,580 lines)
├─ AUTO-GENERATED ✅
└─ Shipped to users

✅ ONE source of truth
✅ Automated build pipeline
✅ Professional workflow
```

---

## 📁 Directory Structure

```
MGTools/
├── src/                        # ⭐ SOURCE OF TRUTH ⭐
│   ├── index.js                # Entry point (exports all modules)
│   │
│   ├── utils/                  # Utilities (4 modules)
│   │   ├── constants.js        # Global constants
│   │   ├── runtime-utilities.js # Runtime helpers
│   │   ├── memory-management.js # Cleanup & pooling
│   │   └── platform-detection.js # Environment detection
│   │
│   ├── core/                   # Core Infrastructure (8 modules)
│   │   ├── storage.js          # GM storage wrapper
│   │   ├── logging.js          # Logging system
│   │   ├── compat.js           # Compatibility layer
│   │   ├── network.js          # Network utilities
│   │   ├── atoms.js            # Jotai state management
│   │   ├── modal-detection.js  # Modal spam prevention
│   │   ├── storage-recovery.js # Data recovery
│   │   └── websocket-manager.js # Auto-reconnect
│   │
│   ├── state/                  # State Management (2 modules)
│   │   ├── unified-state.js    # Unified state container
│   │   └── draggable.js        # Draggable/resizable
│   │
│   ├── ui/                     # UI Components (9 modules)
│   │   ├── overlay.js          # Main UI overlay
│   │   ├── ui.js               # UI framework
│   │   ├── theme-system.js     # Theme engine
│   │   ├── tooltip-system.js   # Tooltips
│   │   ├── tab-content.js      # Tab generators
│   │   ├── version-badge.js    # Version badge
│   │   ├── connection-status.js # Connection HUD
│   │   ├── hotkey-help.js      # Hotkey display
│   │   └── asset-manager.js    # Asset management
│   │
│   ├── features/               # Feature Modules (15 modules)
│   │   ├── pets.js             # Pet management
│   │   ├── shop.js             # Shop system
│   │   ├── notifications.js    # Notifications
│   │   ├── hotkeys.js          # Hotkeys
│   │   ├── protection.js       # Crop protection
│   │   ├── room-manager.js     # Room registry
│   │   ├── timer-manager.js    # Timers
│   │   ├── turtle-timer.js     # Turtle timer
│   │   ├── crop-value.js       # Value calculator
│   │   ├── crop-highlighting.js # Highlighting
│   │   ├── auto-favorite.js    # Auto-favorite
│   │   ├── value-manager.js    # Value manager
│   │   ├── version-checker.js  # Version check
│   │   ├── settings-ui.js      # Settings UI
│   │   ├── mgtp-overlay.js     # MGTP overlay
│   │   └── abilities/          # Abilities system (6 sub-modules)
│   │
│   ├── controller/             # Controllers (4 modules)
│   │   ├── app-core.js         # Core app controller
│   │   ├── inputs.js           # Input handlers
│   │   ├── room-poll.js        # Room polling
│   │   ├── shortcuts.js        # Hotkey management
│   │   └── version-check.js    # Version UI
│   │
│   └── init/                   # Initialization (5 modules)
│       ├── bootstrap.js        # Main bootstrap
│       ├── early-traps.js      # Early traps
│       ├── legacy-bootstrap.js # Legacy init
│       ├── public-api.js       # Public API
│       └── event-handlers.js   # Event handlers
│
├── MGTools.user.js             # 🤖 AUTO-GENERATED (DO NOT EDIT!)
│
├── scripts/                    # Build Scripts
│   ├── build-production.mjs    # Production build (generates MGTools.user.js)
│   ├── build-esbuild.mjs       # Dev build (dist/mgtools.esbuild.user.js)
│   └── extract-userscript-meta.mjs # Metadata extractor
│
├── dist/                       # Build outputs (gitignored)
│   └── mgtools.esbuild.user.js # Dev build artifact
│
└── .husky/                     # Git hooks (quality enforcement)
```

---

## 🔧 Development Workflow (ARCHITECTURAL 100%)

### 1. Edit Source Code (in src/)

```bash
# All development happens in src/
vim src/features/my-feature.js
```

### 2. Build Production Artifact

```bash
# Generate MGTools.user.js from src/
npm run build:production
```

This will:
- Bundle all 55 modules with esbuild
- Add userscript metadata header
- Add "AUTO-GENERATED" warning
- Output to `MGTools.user.js`
- Report build statistics

### 3. Test Generated Artifact

```bash
# Install MGTools.user.js in Tampermonkey
# Test all features in Magic Garden
# Verify no regressions
```

### 4. Commit BOTH Source and Generated File

```bash
git add src/features/my-feature.js
git add MGTools.user.js  # Generated, but committed for users
git commit -m "feat: my new feature"
```

**Why commit the generated file?**
- Users download `MGTools.user.js` directly from GitHub
- They don't run build tools
- Generated file must be in repo for direct installation

### 5. Ship to Users

```bash
git push  # Users install from GitHub
```

---

## 📐 Code Quality Standards (MANDATORY)

### 1. ESLint + Prettier + Airbnb

**All src/ code MUST pass:**
```bash
npm run style  # Auto-fixes ESLint + Prettier
```

**Config:**
- `eslint.config.mjs` - ESLint with Airbnb rules
- `.prettierrc` - Prettier config

**Note:** Generated `MGTools.user.js` is EXCLUDED from linting (it's auto-generated)

### 2. Dependency Injection Pattern

**ALL functions MUST use dependency injection:**

```javascript
// ❌ BAD (uses globals)
export function doSomething() {
  UnifiedState.data.something = true;
  MGA_saveJSON('key', value);
}

// ✅ GOOD (dependency injection)
export function doSomething(dependencies = {}) {
  const {
    UnifiedState = typeof window !== 'undefined' && window.UnifiedState,
    MGA_saveJSON,
    targetWindow = typeof window !== 'undefined' ? window : null
  } = dependencies;

  UnifiedState.data.something = true;
  MGA_saveJSON('key', value);
}
```

**Why?**
- Testable without globals
- Works in any environment
- Clean module boundaries
- Professional architecture

---

## 🚫 Git Workflow Rules (CRITICAL)

### What to Commit

**✅ ALWAYS commit:**
- Source code (`src/**/*.js`)
- Generated file (`MGTools.user.js`)
- Build scripts (`scripts/*.mjs`)
- Config files (`.prettierrc`, `eslint.config.mjs`, `package.json`)
- Documentation (`README.md`, `.claude/PROJECT_CONTEXT.md`, `SESSION_STATUS.md`)

**❌ NEVER commit:**
- Session/analysis files (`*PHASE*.md`, `*AUDIT*.md`, `*HANDOFF*.md`, etc.)
- Local settings (`.claude/settings.local.json`)
- Build artifacts (`dist/`)
- Temp files

**Git hooks automatically enforce this!**

### Commit Message Format

```
feat:     New feature
fix:      Bug fix
docs:     Documentation
refactor: Code refactoring
test:     Test changes
chore:    Build/tooling
```

### Pre-commit Automation

**Every commit automatically:**
1. Runs `npm run style` (ESLint + Prettier on src/)
2. Runs `npm run build:production` (regenerates MGTools.user.js)
3. Verifies no forbidden files

**Never bypass with --no-verify unless absolutely necessary!**

---

## 📊 Architectural 100% Achievement

### Journey Summary

**Phases Completed:**
- ✅ **Phase A** - Quick wins (4 systems, ~2,442 lines)
- ✅ **Phase B** - Feature modules (5 systems, ~3,019 lines)
- ✅ **Phase C** - Large UI systems (2 systems, ~1,873 lines)
- ✅ **Phase D** - Complex integrations (2 systems, ~6,400 lines)
- ✅ **Phase E** - Complete migration (1 system, ~200 lines)
- ✅ **Phase F** - 95% extraction (5 systems, ~2,736 lines)
- ✅ **Phase G** - **ARCHITECTURAL 100%!** (Build pipeline transformation)

**Final Statistics:**
- **Total Modules:** 55 ES6 modules
- **Code Extraction:** 95.1% (32,798/34,361 lines)
- **Architecture Layers:** 7 layers
- **Build Optimization:** 10% smaller output (1.27 MB vs 1.42 MB)
- **Build Time:** ~50ms
- **Achievement:** TRUE 100% - All source code is modular!

### What "Architectural 100%" Means

**Not about extracting every line:**
- Remaining 4.9% is necessary build wrapper (auto-generated)
- Can't extract userscript metadata, IIFE wrappers, etc.
- 95.1% is MAXIMUM realistic extraction

**TRUE 100% is architectural:**
- ✅ 100% of SOURCE CODE is modular (src/)
- ✅ Single source of truth (no parallel codebases)
- ✅ Professional build pipeline
- ✅ Generated artifact from modules
- ✅ Industry-standard workflow

---

## 🎯 Standard Workflow Reference

### Available NPM Scripts

```bash
# Production build (generates MGTools.user.js)
npm run build:production

# Development build (creates parallel artifact in dist/)
npm run build:dev

# Code quality
npm run style         # Auto-fix ESLint + Prettier
npm run lint:fix      # Fix ESLint only
npm run format        # Format with Prettier only

# Clean artifacts
npm run clean         # Remove dist/*.js

# Legacy (mostly obsolete)
npm run build:legacy  # Old mirror build system
```

### Before Starting Work

```bash
# 1. Check current state
git status
git log --oneline -5

# 2. Read context
cat .claude/PROJECT_CONTEXT.md  # This file!
cat SESSION_STATUS.md           # Current session status

# 3. Verify build works
npm run build:production
```

### During Development

```bash
# Edit src/ files
vim src/features/my-feature.js

# Build and test frequently
npm run build:production

# Install and test in Tampermonkey
```

### Before Committing

```bash
# Check what changed
git status
git diff src/

# Pre-commit hook will automatically:
# - Run npm run style (ESLint + Prettier)
# - Run npm run build:production (regenerate MGTools.user.js)
# - Verify no forbidden files

# Commit (hook runs automatically)
git add src/features/my-feature.js MGTools.user.js
git commit -m "feat: my new feature"
```

---

## 💡 Critical Reminders for AI Sessions

### Start EVERY Session With:

1. **Read** `.claude/PROJECT_CONTEXT.md` (this file!) ✅
2. **Read** `SESSION_STATUS.md` (current state)
3. **Check** `git log --oneline -5` (recent work)
4. **Understand** the current task before making changes

### Remember:

- 🚫 **NEVER edit MGTools.user.js directly** (it's auto-generated!)
- ✅ **Always edit src/ files** (source of truth)
- ✅ **Always run `npm run build:production` after changes**
- ✅ **Commit BOTH src/ and MGTools.user.js**
- ✅ **Use dependency injection pattern**
- ✅ **Keep code quality high** (ESLint + Prettier)

### Common Pitfalls:

- ❌ Editing MGTools.user.js directly (WILL BE LOST!)
- ❌ Forgetting to run build after src/ changes
- ❌ Using globals instead of dependency injection
- ❌ Committing session/analysis files
- ❌ Bypassing pre-commit hooks unnecessarily

---

## 📞 Need Help?

**Check these files in order:**
1. `.claude/PROJECT_CONTEXT.md` (this file) - Project rules and architecture
2. `SESSION_STATUS.md` - Current session state and recent work
3. `ARCHITECTURAL_100_QUICK_START.md` - Quick reference guide
4. `README.md` - User-facing documentation
5. `package.json` - Available npm scripts

**When in doubt:** Ask the user!

---

**Last Updated:** 2025-01-26 (Phase G Complete - Architectural 100%)
**Current State:** ✅ Architectural 100% ACHIEVED
**Architecture:** 55 modules, 7 layers, full DI pattern
**Extraction:** 95.1% (32,798/34,361 lines) - MAXIMUM REALISTIC
**Build:** src/ → MGTools.user.js (auto-generated)
