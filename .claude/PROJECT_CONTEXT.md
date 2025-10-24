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

**Current Phase:** Phase 4 - Feature Extraction (Modularization)

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
├── MGTools.user.js          # Monolith (production)
├── src/
│   ├── index.js             # Modular entry point
│   ├── core/                # Core infrastructure (Phase 2 ✅)
│   ├── features/            # Feature modules (Phase 4, in progress)
│   │   └── pets.js          # Pet management (44.1% extracted)
│   └── utils/               # Utility modules
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

**Current Status:** Phase 4 - Pet Feature Extraction

### Phase History
- ✅ **Phase 1:** Build system setup
- ✅ **Phase 2:** Core infrastructure extraction (14 modules)
- ✅ **Phase 3:** Dual build system established
- 🔄 **Phase 4:** Feature extraction (IN PROGRESS)

### Pet Feature Extraction Progress

**Current:** 44.1% (2,204 of ~5,000 lines)

**Extracted:**
- ✅ Pet Presets (import/export) - ~99 lines
- ✅ Hunger Monitoring - ~320 lines
- ✅ Pet Detection & State - ~114 lines
- ✅ Pet Feeding Logic - ~47 lines
- ✅ UI Helpers - ~291 lines
- ✅ Event Handlers - ~377 lines
- ✅ Tab Content Generators - ~736 lines
- ✅ Ability Calculation Helpers - ~176 lines

**Remaining:**
- ⏳ Auto-Favorite Integration - ~500+ lines
- ⏳ Additional pet functions - ~2,296 lines

### Extraction Strategy

1. **Read** code from `MGTools.user.js` (monolith)
2. **Extract** to `src/features/pets.js` with dependency injection
3. **Test** with `npm run build:esbuild`
4. **Keep** mirror build unchanged (production safety)
5. **Commit** with progress updates

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

**Current Target:** Continue Pet Feature Extraction

**Priority:**
1. Extract Auto-Favorite Integration (~500 lines)
2. Extract remaining pet functions
3. Reach 100% pet extraction
4. Move to next feature module

**See `SESSION_STATUS.md` for latest progress and next steps.**

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

**Last Updated:** 2025-10-24
**Current Phase:** Phase 4 - Pet Feature Extraction
**Progress:** 44.1% (2,204/5,000 lines)
