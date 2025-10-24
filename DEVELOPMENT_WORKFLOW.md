# MGTools Development Workflow

**Updated:** 2025-10-24
**Status:** Phase 4 - Feature Extraction with Automated Quality Checks
**Branch:** Live-Beta

---

## ⚡ NEW: Automated Workflow (Oct 24, 2025)

**Git hooks now enforce quality automatically!**

### What Changed:
- ✅ **ESLint + Prettier** run automatically on every commit
- ✅ **Forbidden files** blocked from commits (analysis docs, temp files)
- ✅ **Build verification** ensures code compiles before commit
- ✅ **Commit message** format validation

### What This Means:
- ✅ No more manual `npm run style` needed (automatic!)
- ✅ No more accidentally committing temp files
- ✅ No more broken commits (build must pass)
- ✅ Consistent code quality (Airbnb + Prettier enforced)

---

## 🎯 Current State (Phase 3B)

### What Changed (Oct 24, 2025):

✅ **esbuild pipeline is ACTIVE on Live-Beta**
✅ **Infrastructure modules wired and ready** (all 14 modules)
✅ **Two build systems running in parallel:**
   - Mirror build (production): `npm run build` → 1.5MB
   - Modular build (opt-in): `npm run build:esbuild` → 121KB
⚠️ **Features still in monolith** (being extracted to src/features/)

### What This Means:

**For Infrastructure Changes:**
- ✅ Modules in `src/` are the source of truth
- ❌ DO NOT edit infrastructure code in `MGTools.user.js`
- ✅ Edit modules, test with `npm run build:esbuild`
- ⚠️ Still need to sync to monolith (temporary, until features extracted)

**For Feature Changes:**
- ✅ Edit `MGTools.user.js` directly (for now)
- ✅ Test with `npm run build` (mirror)
- ⏳ Will extract to `src/features/` (Phase 4)

---

## 📋 New Commit Workflow (Automated Quality Checks)

### Standard Workflow

```bash
# 1. Make your changes
nano src/features/pets.js

# 2. Stage files
git add src/features/pets.js

# 3. Commit (hooks run automatically!)
git commit -m "feat: add pet ability filter"
```

**What happens automatically:**
1. 🚫 Checks for forbidden files (temp/analysis docs)
2. 📝 Runs ESLint + Prettier on ALL staged files
3. 🔨 Verifies modular build compiles successfully
4. ✅ Validates commit message format
5. 💾 Creates commit if all checks pass

### Manual Quality Check (Optional)

If you want to check quality before committing:

```bash
npm run style              # Run ESLint + Prettier manually
npm run build:esbuild      # Test build manually
```

### Bypassing Hooks (Emergency Only)

```bash
git commit --no-verify -m "fix: emergency hotfix"
```

**⚠️ Use sparingly!** Only for urgent production fixes.

### Commit Message Format

**Required prefix:**
```
feat:     New feature
fix:      Bug fix
docs:     Documentation changes
refactor: Code refactoring
test:     Test changes
chore:    Build/tooling changes
Phase:    Modularization work
```

**Examples:**
```bash
git commit -m "feat: add turtle growth calculations"
git commit -m "fix: resolve pet hunger alert throttle"
git commit -m "Phase 4 - Day 2: Pet helpers extracted"
```

---

## 📋 Making Changes: Quick Reference

### ❓ Where Do I Make This Change?

| Change Type | File to Edit | Notes |
|-------------|--------------|-------|
| **Keyboard shortcut (UI)** | `src/controller/shortcuts.js` | Infrastructure |
| **Version indicator color** | `src/ui/version-badge.js` | Infrastructure |
| **Version fetch logic** | `src/core/network.js` | Infrastructure |
| **Toast notifications** | `src/ui/ui.js` | Infrastructure |
| **Logging behavior** | `src/core/logging.js` | Infrastructure |
| **Storage operations** | `src/core/storage.js` | Infrastructure |
| **Pet management** | `MGTools.user.js` | Feature (not extracted yet) |
| **Abilities tracking** | `MGTools.user.js` | Feature (not extracted yet) |
| **Teleport system** | `MGTools.user.js` | Feature (not extracted yet) |
| **Seeds, values, timers** | `MGTools.user.js` | Feature (not extracted yet) |

---

## 🔧 Workflow: Making Infrastructure Changes

### Step 1: Edit the Module

**Example:** Adding a new keyboard shortcut

```bash
# Edit the module
nano src/controller/shortcuts.js
```

Add your changes:
```javascript
export const SHORTCUTS = {
  // ... existing shortcuts
  NEW_FEATURE: {
    key: 'n',
    modifiers: { alt: true },
    action: 'new-feature',
    description: 'Trigger new feature'
  }
};
```

### Step 2: Sync to Monolith (TEMPORARY - Until Phase 3)

**Why?** Because the build system still uses the monolith as the source.

```bash
# Find the corresponding section in MGTools.user.js
# Search for "SHORTCUTS" or similar
# Copy your change to the monolith
```

**IMPORTANT:** This manual sync is temporary. Once we switch to hybrid build (Phase 3), modules will be the ONLY source.

### Step 3: Build and Test BOTH Systems

```bash
# Test mirror build (production)
npm run build

# Test modular build (infrastructure only)
npm run build:esbuild

# Install and test BOTH:
# - dist/mgtools.user.js (mirror - production)
# - dist/mgtools.esbuild.user.js (modular - opt-in)
#   Enable with: localStorage.MGTOOLS_ESBUILD_ENABLE = "1"
```

### Step 4: Commit BOTH Files

```bash
# Stage your changes
git add src/controller/shortcuts.js
git add MGTools.user.js

# Commit
git commit -m "Add Alt+N shortcut for new feature

- Updated src/controller/shortcuts.js (source of truth)
- Synced to MGTools.user.js (temporary, until Phase 3)
"
```

---

## 🚫 Common Mistakes to Avoid

### ❌ WRONG: Editing Infrastructure in Monolith

```bash
# DON'T DO THIS:
nano MGTools.user.js
# ... edit version indicator colors ...
git commit -m "Fix version colors"
```

**Problem:** Changes will be lost when we switch to hybrid build.

### ✅ CORRECT: Edit Module First

```bash
# DO THIS:
nano src/ui/version-badge.js
# ... edit version indicator colors ...
# Then sync to MGTools.user.js (temporary)
git commit -m "Fix version colors"
```

---

## 🏗️ Workflow: Making Feature Changes

**For NOW (Phase 2), features are still in the monolith.**

### Step 1: Edit the Monolith

```bash
nano MGTools.user.js
```

### Step 2: Build and Test

```bash
npm run build
# Test dist/mgtools.user.js
```

### Step 3: Commit

```bash
git add MGTools.user.js
git commit -m "Add pet hunger notification threshold setting"
```

---

## 🔄 Phase 4: Feature Extraction (Next Steps)

**Once features are extracted, the workflow will change:**

### Infrastructure Changes (Phase 4):
1. Edit `src/core/network.js` (or relevant module)
2. Run `npm run build` (compiles modules → production artifact)
3. Test `dist/mgtools.user.js`
4. Commit (modules only, no manual sync needed)

### Feature Changes (Phase 4):
1. Edit `src/features/pets.js` (or relevant module)
2. Run `npm run build` (compiles modules → production artifact)
3. Test `dist/mgtools.user.js`
4. Commit (feature module only)

### No More Manual Sync:
- ✅ Modules are the ONLY source
- ✅ Build system compiles everything
- ✅ Monolith is archived/deleted
- ✅ All development through `src/`

### Timeline for Phase 4:
**Week 1:** Extract pet management (~5,000 lines) to src/features/pets.js
**Week 2:** Extract abilities tracking (~3,000 lines) to src/features/abilities.js
**Week 3-4:** Extract remaining features (seeds, values, timers, shop, themes)
**Week 5:** Switch to full modular build, archive monolith

---

## 📊 Build System Evolution

### Phase 1 (Complete): Mirror Build
```bash
npm run build
# → Copies MGTools.user.js to dist/mgtools.user.js
```

### Phase 2 (Complete): Mirror Build + Module Enforcement
```bash
npm run build
# → Still copies monolith
# → Pre-commit hook warns about infrastructure edits
# → Modules are maintained separately
```

### Phase 3B (Current): Dual Build System
```bash
npm run build
# → Mirror build (production): copies monolith → dist/mgtools.user.js

npm run build:esbuild
# → Modular build (opt-in): compiles src/ → dist/mgtools.esbuild.user.js
# → Infrastructure modules active
# → Features still in monolith (being extracted)
```

### Phase 4 (Next): Full Modular Build
```bash
npm run build
# → Compiles infrastructure from src/
# → Compiles features from src/features/
# → Combines into dist/mgtools.user.js
# → Monolith deprecated
# → Single build system
```

---

## 🛡️ Pre-Commit Hook (Phase 2)

**Coming soon:** A pre-commit hook will warn you if you edit infrastructure sections in the monolith.

**What it does:**
- Detects changes to infrastructure code in `MGTools.user.js`
- Warns: "Infrastructure changes must go through src/ modules"
- Provides guidance on correct workflow

**What it doesn't do:**
- Block feature changes (those are still in monolith)
- Block emergency fixes (can override with `--no-verify`)

---

## 🎓 FAQs

### Q: Why do I have to sync changes to the monolith manually?

**A:** This is temporary. Once we switch to hybrid build (Phase 3), modules will be compiled automatically. For now, the build system still uses the monolith as the source, so we need to keep them in sync.

### Q: What if I forget to sync a module change to the monolith?

**A:** The pre-commit hook (coming in Phase 2) will warn you. Also, you can run `npm run build:modular` to test that your module compiles correctly.

### Q: Can I skip editing the monolith and just edit modules?

**A:** Not yet. The current build (Phase 2) still uses the monolith. Your module changes won't appear in dist/ until we switch to hybrid build.

### Q: When will we switch to hybrid build?

**A:** After features are extracted to `src/features/` (Phase 3). The timeline depends on how quickly we extract pet management, abilities, etc.

### Q: What if I need to make an emergency fix?

**A:**
1. Make the fix in the monolith (fastest path to users)
2. Run `npm run build` and deploy
3. **Then** backport the fix to modules
4. Commit both

---

## 📝 Summary

**Current Workflow (Phase 3B):**

| Type | Source File | Build Process | Notes |
|------|-------------|---------------|-------|
| Infrastructure | `src/` modules | Manual sync to monolith → mirror build | Temporary |
| Infrastructure | `src/` modules | `npm run build:esbuild` → opt-in artifact | Testing |
| Features | `MGTools.user.js` | Mirror build → production | Until extracted |

**Future Workflow (Phase 4):**

| Type | Source File | Build Process | Notes |
|------|-------------|---------------|-------|
| Infrastructure | `src/` modules | Modular build (esbuild) | Production |
| Features | `src/features/` modules | Modular build (esbuild) | Production |

---

**Status:** Phase 3B Active (Oct 24, 2025)
**Current:** Dual build system (mirror + esbuild)
**Next Step:** Extract features to src/features/
**Goal:** Migrate to full modular build (Phase 4)
