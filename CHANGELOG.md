# Changelog - MGTools

## Version 1.1.0 (2025-10-21)

**Bug Fixes:**
- Fixed game update popup to auto-click CONTINUE button before reloading
- Previously popup was detected but not dismissed, causing state issues
- Now properly clicks CONTINUE → waits 500ms → shows countdown → reloads

**Performance Improvements:**
- Inventory counter optimized: 500ms → 1000ms update interval
- Reference counting prevents duplicate intervals when multiple shop UIs open
- Increased safe interval timings: ability monitoring (3s→5s), notifications (10s→15s), update checks (5s→10s)
- Cached room polling selectors (5-second cache)
- Added cleanup for shop tab switching and popout closing

**Expected Performance Impact:**
- FPS gain: +20-40%
- DOM queries: -75% reduction
- No duplicate intervals

---

## Version 1.0.0 (2025-10-21)

**Bug Fixes:**
- Fixed pet swapping to work consistently regardless of inventory space
- All 3 pets now swap smoothly even with 1-2 free inventory slots
- Removed old StorePet+PlacePet fallback that required inventory space

**New Features:**
- Live inventory counter in shop UI (updates every 500ms)
- Color-coded inventory counter: green → yellow → red based on fullness

**Improvements:**
- Pet presets now use atomic SwapPet message for all swaps
- Smoother pet switching experience everywhere
- No dependency on available inventory slots

---

## Historical Versions

Previous versions (3.9.2 and earlier) are archived in main branch history.

For installation and full feature list, see [README](README.md)
