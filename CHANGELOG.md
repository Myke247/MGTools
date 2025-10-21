# Changelog - MGTools

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
