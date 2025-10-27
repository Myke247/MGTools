# 🌳 MGTools Branch Strategy

**Updated:** 2025-10-26

---

## Current Branch Structure

### 📦 Production Branches (Stable, Working v2.0.0)

#### `main` - Stable Release
- **Status:** ✅ WORKING - v2.0.0 Monolithic
- **Commit:** `a20e289` (Oct 24, 2025)
- **Purpose:** Stable release for general users
- **Features:**
  - Full working UI (dock, sidebar, tabs)
  - Micro/Mini dock sizes
  - Pet auto-favorite fixes
  - All features functional
- **Update Strategy:** Only merge tested, stable code

#### `Live-Beta` - Beta Testing
- **Status:** ✅ WORKING - v2.0.0 Monolithic
- **Commit:** `a20e289` (Oct 24, 2025)
- **Purpose:** Beta testing for power users
- **Currently:** Identical to main (both running stable v2.0.0)
- **Update Strategy:** Test new features here before merging to main

---

### 🚧 Development Branch (Work in Progress)

#### `feat/modular-v2-wip` - Modular Architecture v2.1
- **Status:** ⚠️ IN DEVELOPMENT - UI Not Working Yet
- **Purpose:** Complete rewrite using modular ES6 architecture
- **Progress:** 95% code extracted (55 modules), initialization incomplete
- **Issue:** UI doesn't appear (19 of 23 initialization dependencies are stubs)

**What Works:**
- ✅ All 55 modules extracted and organized
- ✅ Build system (esbuild) functional
- ✅ Early traps install
- ✅ Game readiness polling
- ✅ 4/23 initialization dependencies wired

**What Doesn't Work:**
- ❌ UI doesn't appear (stub functions prevent initialization)
- ❌ 19 dependencies still need wiring

**Preserved State:**
- Branch created: 2025-10-26
- Tag: `modular-v2-snapshot-20251026`
- HEAD: `090acc3`

---

## Why Both main and Live-Beta Have v2.0.0 Monolith

**Context:** The modular architecture work took longer than expected and hit initialization issues. Rather than leave users without a working script, we:

1. **Preserved all modular work** on `feat/modular-v2-wip` branch
2. **Restored working v2.0.0** to both main and Live-Beta
3. **Tagged the state** for easy recovery

This allows:
- ✅ Users get working MGTools immediately
- ✅ Development continues on modular without pressure
- ✅ No work lost (everything in git history)
- ✅ Clear separation between production and development

---

## Merge Criteria: When to Merge Modular → main/Live-Beta

The modular branch (`feat/modular-v2-wip`) can be merged when:

### Critical Requirements (Must Have)
- [ ] UI appears when script loads
- [ ] All tabs functional (Home, Pets, Shop, Values, Abilities, Settings)
- [ ] Settings persist across reloads
- [ ] No console errors

### Feature Requirements (Must Work)
- [ ] Pet presets load/save/switch
- [ ] Crop highlighting works
- [ ] Shop notifications work
- [ ] Turtle timer works
- [ ] Ability logging works
- [ ] Hotkeys functional
- [ ] Theme system works

### Testing Requirements
- [ ] Tested on Magic Circle
- [ ] Tested on Magic Garden
- [ ] Tested on Discord environment
- [ ] No performance regression
- [ ] Build size acceptable (<500KB)

---

## Development Workflow

### Working on Production Features (main/Live-Beta)
```bash
git checkout Live-Beta
# Make changes to MGTools.user.js
git add MGTools.user.js
git commit -m "feat: your feature description"
git push origin Live-Beta

# After testing, merge to main
git checkout main
git merge Live-Beta --ff-only
git push origin main
```

### Working on Modular Architecture (feat/modular-v2-wip)
```bash
git checkout feat/modular-v2-wip
# Make changes to src/ files
npm run build:production
# Test the generated MGTools.user.js
git add src/ MGTools.user.js
git commit -m "fix: initialization dependency wiring"
git push origin feat/modular-v2-wip
```

---

## Timeline

**Current State (Oct 26, 2025):**
- main & Live-Beta: Running stable v2.0.0 monolith
- feat/modular-v2-wip: In development (no deadline)

**No pressure on modular completion** - Fix properly over as many sessions as needed (estimated 10+ sessions for full initialization wiring).

---

## Recovery Instructions

### If You Need to Go Back to Modular Work:
```bash
git checkout feat/modular-v2-wip
# or
git checkout modular-v2-snapshot-20251026
```

### If You Need v2.0.0 Monolith:
```bash
git checkout main  # or Live-Beta
# Both are at commit a20e289
```

---

## Questions?

See:
- **For modular progress:** `feat/modular-v2-wip` branch, check commit history
- **For production issues:** Open issue on GitHub
- **For context:** See `SESSION_STATUS.md`
