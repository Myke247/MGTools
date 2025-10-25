# MGTools Project Context

**READ THIS FIRST when starting development!**

This file contains permanent project rules and context for all developers.

---

## 📋 Project Overview

**MGTools** is a comprehensive userscript for Magic Garden game enhancement with:
- Unified UI system
- Pet management
- Room monitoring
- Notification system
- Ability tracking

**Current Phase:** Phase 4 - Feature Extraction (MAJOR PROGRESS - 47% of monolith extracted!)

---

## 🏗️ Architecture

### Dual Build System

1. **Mirror Build** (Production)
   - Command: `npm run build`
   - Source: `MGTools.user.js` (monolith)
   - Output: `dist/mgtools.user.js` (1.5MB)
   - Status: Production-stable, used by all users

2. **Modular Build** (Development)
   - Command: `npm run build:esbuild`
   - Source: `src/index.js` + ES6 modules
   - Output: `dist/mgtools.esbuild.user.js` (~186KB)
   - Status: Opt-in test artifact, growing as features extract

### Directory Structure

```
MGTools/
├── MGTools.user.js          # Monolith (production, 34,361 lines)
├── src/
│   ├── index.js             # Modular entry point
│   ├── core/                # Core infrastructure ✅
│   │   ├── atoms.js         # State management (653 lines) ✅
│   │   ├── environment.js   # Environment detection (307 lines) ✅
│   │   ├── modal-detection.js # Modal & debug (341 lines) ✅
│   │   ├── storage.js       # GM storage (982 lines) ✅
│   │   ├── logging.js       # Logging system (162 lines) ✅
│   │   ├── compat.js        # Compatibility (278 lines) ✅
│   │   └── network.js       # Network layer (353 lines) ✅
│   ├── features/            # Feature modules (~12,000 lines) ✅
│   │   ├── pets.js          # Pet management (5,732 lines) ✅
│   │   ├── shop.js          # Shop system (3,597 lines) ✅
│   │   ├── notifications.js # Notifications (2,118 lines) ✅
│   │   ├── hotkeys.js       # Hotkey system (975 lines) ✅
│   │   ├── protection.js    # Protection (907 lines) ✅
│   │   ├── crop-value.js    # Crop value/timer (916 lines) ✅
│   │   ├── crop-highlighting.js # Crop highlighting (515 lines) ✅
│   │   └── version-checker.js # Version checker (275 lines) ✅
│   ├── ui/                  # UI modules (~4,900 lines) ✅
│   │   ├── overlay.js       # UI overlay system (4,277 lines) ✅
│   │   ├── draggable.js     # Draggable/resizable (680 lines) ✅
│   │   ├── ui.js            # UI framework (430 lines) ✅
│   │   ├── version-badge.js # Version badge (430 lines) ✅
│   │   ├── connection-status.js # Connection status (490 lines) ✅
│   │   └── hotkey-help.js   # Hotkey help (260 lines) ✅
│   ├── controller/          # Controllers ✅
│   ├── init/                # Bootstrap ✅
│   └── utils/               # Utility modules ✅
├── scripts/                 # Build scripts
├── .husky/                  # Git hooks (quality enforcement)
└── dist/                    # Build outputs (gitignored)
```

---

## 📐 Code Quality Standards (MANDATORY)

### 1. ESLint + Prettier + Airbnb

**All code MUST pass:**
```bash
npm run style  # Auto-fixes ESLint + formats with Prettier
```

**Config files:**
- `eslint.config.mjs` - ESLint with Airbnb-style rules
- `.prettierrc` - Prettier config (singleQuote, 120 char width, etc.)

**Rules enforced:**
- ✅ No `var` (use `const`/`let`)
- ✅ Single quotes
- ✅ No trailing commas
- ✅ 120 character line limit
- ✅ ES6+ features
- ✅ Airbnb style guide compliance

### 2. Dependency Injection Pattern

**ALL extracted functions MUST:**
- Accept dependencies as parameters (no globals)
- Be self-contained and testable
- Use ES6 module exports

**Example:**
```javascript
// ❌ BAD (uses globals)
export function doSomething() {
  UnifiedState.data.something = true;
  MGA_saveJSON('key', value);
}

// ✅ GOOD (dependency injection)
export function doSomething(UnifiedState, MGA_saveJSON) {
  UnifiedState.data.something = true;
  MGA_saveJSON('key', value);
}
```

---

## 🚫 Git Workflow Rules (CRITICAL)

### Repository Philosophy: ESSENTIAL FILES ONLY

**The git repository should contain ONLY:**
- ✅ Source code (`src/`, `MGTools.user.js`)
- ✅ Build scripts (`scripts/`, `build.js`)
- ✅ Configuration files (`.prettierrc`, `eslint.config.mjs`, `package.json`, `package-lock.json`)
- ✅ Git hooks (`.husky/`)
- ✅ Essential documentation (`README.md`, `DEVELOPMENT_WORKFLOW.md`, etc.)
- ✅ Project context (`.claude/PROJECT_CONTEXT.md`, `SESSION_STATUS.md`)

**NEVER commit conversation/analysis files. They stay LOCAL.**

### Never Commit These Files

**Git hooks automatically block these patterns:**
- `*AUDIT*.md` - Analysis files
- `*SUMMARY*.md` - Summary documents
- `*FINDINGS*.md` - Investigation notes
- `*OVERNIGHT*.md` - Session summaries
- `*STATUS*.md` - Status tracking (EXCEPT `SESSION_STATUS.md`)
- `*HANDOFF*.md` - Handoff documents
- `REALISTIC*.md` - Conversation files
- `NEXT_SESSION*.txt` - Session planning
- `.claude/settings*.json` - Local preferences

**If you create analysis/temp files, they stay LOCAL ONLY.**

### Commit Message Format

**Required prefix:**
```
feat:     New feature
fix:      Bug fix
docs:     Documentation
refactor: Code refactoring
test:     Test changes
chore:    Build/tooling
Phase:    Modularization work
```

### Automated Quality Checks

**Every commit automatically runs:**
1. ✅ Forbidden file check
2. ✅ `npm run style` (ESLint + Prettier)
3. ✅ `npm run build:esbuild` (verify build)

**To bypass** (use sparingly): `git commit --no-verify`

---

## 📊 Modularization Progress

**Current Status:** Phase 4 - Feature Extraction (MAJOR MILESTONE ACHIEVED!)

### Overall Progress

**Monolith:** 34,361 lines total
**Extracted:** ~16,218 lines (47.2%)
**Remaining:** ~18,143 lines (52.8%)

### Phase History
- ✅ **Phase 1:** Build system setup (Complete)
- ✅ **Phase 2:** Core infrastructure extraction (Complete - 7 modules)
- ✅ **Phase 3:** Dual build system established (Complete)
- 🔄 **Phase 4:** Feature extraction (IN PROGRESS - 12+ systems extracted)

### Extracted Systems (13 Complete Systems)

**✅ Core Infrastructure (~3,076 lines)**
1. Atoms/State Management - 653 lines
2. Environment Detection - 307 lines
3. Modal Detection & Debug - 341 lines
4. Storage Layer - 982 lines
5. Logging System - 162 lines
6. Compatibility Layer - 278 lines
7. Network Layer - 353 lines

**✅ Feature Modules (~12,035 lines)**
1. Pet Management - 5,732 lines (100% complete - all 9 phases)
2. Shop System - 3,597 lines (100% complete - all 6 phases)
3. Notifications - 2,118 lines (100% complete - all 5 phases)
4. Hotkeys - 975 lines (100% complete - all 4 phases)
5. Protection - 907 lines (100% complete - all 3 phases)
6. Crop Value & Timer - 916 lines (100% complete - all 3 phases)
7. Crop Highlighting - 515 lines (100% complete - all 3 phases)
8. Version Checker - 275 lines (100% complete)

**✅ UI Modules (~4,967 lines)**
1. UI Overlay System - 4,277 lines (100% complete - all 5 phases)
2. Draggable/Resizable - 680 lines (100% complete)
3. UI Framework - 430 lines
4. Version Badge - 430 lines
5. Connection Status - 490 lines
6. Hotkey Help - 260 lines

**📊 Extraction Stats:**
- Total systems extracted: 13 complete
- Largest extraction: Pet Management (5,732 lines)
- Total commits: 100+ modularization commits
- Quality: 100% ESLint + Prettier compliant

### Extraction Strategy

1. **Read** code from `MGTools.user.js` (monolith)
2. **Extract** to appropriate `src/` module with dependency injection
3. **Test** with `npm run build:esbuild`
4. **Keep** mirror build unchanged (production safety)
5. **Commit** with progress updates to SESSION_STATUS.md
6. **Document** in SESSION_STATUS.md Recently Completed section

---

## 🔄 Standard Workflow

### Before Making Changes

```bash
git status                    # Check current state
npm run build:esbuild        # Verify baseline builds
```

### During Development

```bash
# Edit files...
npm run style                # Auto-fix style (manual check)
npm run build:esbuild        # Test build
```

### Before Committing

**Git hooks run automatically, but you can test manually:**
```bash
npm run style                # ESLint + Prettier
npm run build:esbuild        # Verify build
git add <files>
git commit -m "feat: ..."    # Hooks run automatically
```

---

## 🎯 Next Steps (Always Check SESSION_STATUS.md)

**Current Status:** 13 systems extracted (47.2% of monolith)

**Priority:**
1. **Analyze Remaining Code** - Identify extractable systems in remaining ~18,143 lines
2. **Continue Feature Extraction** - Extract next high-value system
3. **Integration Work** - Update src/index.js to import all extracted modules
4. **Testing** - Validate modular build with all systems working

**Potential Next Extraction Targets:**
- Timers system
- Rooms/Navigation system
- Remaining UI components
- Settings/Configuration system
- Initialization/Bootstrap enhancements

**See `SESSION_STATUS.md` for detailed latest progress and active tasks.**

---

## 💡 Development Tips

### Start Every Session With:

1. **Read this file** (`.claude/PROJECT_CONTEXT.md`) - You're here! ✅
2. **Read** `SESSION_STATUS.md` - Current state & next steps
3. **Check** `git status` and recent commits
4. **Understand** what's in progress before changing anything

### Common Pitfalls to Avoid:

- ❌ Starting extraction "from scratch" (always continue from SESSION_STATUS.md)
- ❌ Creating temp/analysis docs without `.md` extension (use `.md` or `.txt`)
- ❌ Committing temp files (hooks prevent this, but don't create them)
- ❌ Using global variables in extracted code (dependency injection!)
- ❌ Forgetting to run `npm run style` (hooks do it, but test early)
- ❌ Changing mirror build (keep production stable)

### Always Remember:

- 📖 Code quality is automatic (hooks enforce it)
- 🔒 Production (mirror build) stays stable
- 🧪 Development (modular build) is where we innovate
- 📝 Document progress in SESSION_STATUS.md
- 🚀 Goal: Replace monolith with modules eventually

---

## 📞 Questions?

**Check these files:**
- `SESSION_STATUS.md` - Current state
- `DEVELOPMENT_WORKFLOW.md` - Detailed workflow
- `PET_EXTRACTION_MAP.md` - Pet feature roadmap
- `package.json` - Available npm scripts

**When in doubt:** Ask the user!

---

**Last Updated:** 2025-10-25
**Current Phase:** Phase 4 - Feature Extraction (13 systems complete)
**Progress:** 47.2% (16,218/34,361 lines extracted)
