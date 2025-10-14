# Internal Technical Changelog - MGTools

**Purpose**: This changelog contains detailed technical information about fixes, implementations, and architectural decisions. This is for internal reference only - NOT for public consumption.

---

## Version 3.8.0 (2025-10-13)

### 🔄 Instant Feed Buttons - Complete Technical Breakdown

#### The Problem We Solved:
**Critical Issue**: Feed buttons were sending the same `cropItemId` repeatedly, causing server rejections. Crops weren't being consumed, pet hunger wasn't increasing.

**Root Cause Analysis**:
1. **Stale Inventory References**: All data sources were stale/cached:
   - `UnifiedState.atoms.inventory.items` - cached when atom hooked, never updated
   - `targetWindow.myData.inventory.items` - reference captured at initialization, same array instance
   - Attempted atom queries via `atomCache.get(atomPath)` failed - `currentState.v` was always undefined

2. **No Fresh Data Mechanism**: We had no way to query live inventory state between feeds

#### Solution Implemented:

**Part 1: Jotai Store Capture** (Lines 588-683)
- Implemented `captureJotaiStore()` function that walks React fiber tree via `__REACT_DEVTOOLS_GLOBAL_HOOK__`
- Searches for Jotai Provider's store object in `fiber.pendingProps.value`
- Store object has methods: `get()`, `set()`, `sub()`
- Modeled after friendscript's store capture technique (lines 100-125 in friendscript.txt)
- Captures store 1 second after atom hooks initialize (line 22956-22964)

**Part 2: Atom Query Helper** (Lines 640-683)
- Created `getAtomValue(atomLabel)` function to query atoms for fresh data
- Searches atom cache for atom with matching label
- Uses `store.get(atom)` to retrieve current value
- Returns null gracefully if store not captured or atom not found

**Part 3: Hybrid Feed Function with Tracking** (Lines 25967-26088)
- **Primary Strategy**: Try to query `myCropInventoryAtom` and `myPetSlotInfosAtom` via store
- **Fallback Strategy**: Use cached data from `targetWindow.myData.inventory.items` or `UnifiedState.atoms`
- **Tracking Mechanism**: Maintain `usedCropIds` Set to remember which crops were already fed
- **Selection Logic**: Find first crop that is:
  - Compatible with pet species (from `PET_FEED_CATALOG`)
  - NOT favorited (check `UnifiedState.data.autoFavorite.selectedSpecies`)
  - NOT in `usedCropIds` Set
- **Auto-Reset**: Clear `usedCropIds` if we run out of compatible crops

#### Why This Solution Works:

**Even with stale cache**, the `usedCropIds` Set ensures each crop ID is only selected once per session. So even if the inventory array reference never changes, we iterate through different items in the array.

**When store capture succeeds**, we get truly fresh inventory data on every feed, making the solution even more robust.

#### Technical Details:

**Store Capture Timing**:
- Attempted 1 second after atom hooks (when React should be fully mounted)
- Falls back gracefully if `__REACT_DEVTOOLS_GLOBAL_HOOK__` not available
- Logs success/failure for debugging

**Atom Label Matching**:
- `myPetSlotInfosAtom` - contains pet data with hunger, species, ID
- `myCropInventoryAtom` - contains inventory with `.items` array
- Uses fuzzy matching: checks if label includes the search string

**Message Format**:
```javascript
{
  scopePath: ["Room", "Quinoa"],
  type: "FeedPet",
  petItemId: "a996b0a7-5d77-4097-903e-6b7af81fc939",
  cropItemId: "ddd8e0f3-7b15-49a7-ad06-16b194ce0e86"
}
```

**Console Logging**:
- `🔄 Using FRESH inventory from store` - store query succeeded
- `📦 Using cached inventory` - fallback to stale data
- `🐾 Pet: {species, petItemId, hunger}` - pet info being fed
- `🌾 Feeding {species} (ID: {cropId}...) to {petSpecies}` - crop selection

#### Files Modified:
- `MGTools.user.js`: Lines 588-683 (store capture), 25967-26088 (feed function), 22956-22964 (init)
- `CHANGELOG.md`: Public-facing changelog (vague, feature-focused)
- `README.md`: Updated features section and quick actions guide

#### Performance Considerations:
- Store capture happens once at initialization (not per-feed)
- `usedCropIds` Set lookup is O(1)
- Inventory scan is O(n) where n = inventory size (acceptable)
- No verification/polling loops (removed to simplify)

#### Known Limitations:
- Store capture may fail in some browser environments
- `usedCropIds` persists for session (clears only when all crops used or page reload)
- Fallback to cached data means first few feeds might use same crop (but Set prevents repeats)

#### Testing Evidence:
From `consolelogs.txt` (lines 698-714), native game feeding shows:
```
FeedPet, cropItemId: 'ddd8e0f3-7b15-49a7-ad06-16b194ce0e86'
FeedPet, cropItemId: 'acfaaf48-0796-456c-9ecf-4f1fe4eb6b67'  ← Different!
FeedPet, cropItemId: '7b28dc98-0f37-45ee-b3e1-ea96a809d98e'  ← Different!
```

This proves the message format is correct and the game server accepts different crop IDs.

---

## Version 3.7.9 (2025-10-13)

### 🐾 Instant Pet Feed Buttons - Infinite Loop & Canvas Detection Fixes

#### Critical Bugs Fixed:

**Bug 1: MutationObserver Death Loop**
- **Symptom**: Game freezing, 3,825+ observer triggers in seconds
- **Root Cause**: MutationObserver watching entire `<body>` with `{ childList: true, subtree: true }`
- **Why It Failed**: Every DOM change (animations, stats updates, crop growth) triggered observer
- **Fix**: Completely removed MutationObserver (lines 26168-26169)
- **Replacement**: 5-second polling interval instead (line 26172)

**Bug 2: Off-Screen Canvas Selection**
- **Symptom**: Feed buttons appearing at wrong position (off-screen)
- **Root Cause**: Canvas with `left=-268.7px` being selected first
- **Fix**: Added `left >= 0` filter to exclude off-screen canvases (line 26005)
- **Additional**: Added `top > 80px` filter to skip menu/header canvases (line 26000)

**Bug 3: sendToGame Scope Error**
- **Symptom**: `sendToGame is not defined` error when clicking feed
- **Root Cause**: Called `targetWindow.sendToGame()` but function exists in MGTools scope
- **Fix**: Changed to just `sendToGame()` (lines 25924-25941)

**Bug 4: Button Remove/Re-inject Loop**
- **Symptom**: Buttons disappearing and reappearing endlessly when shop opens
- **Root Cause**: Shop hides pet containers with CSS, observer removed buttons, interval re-added them
- **Fix**: Added visibility check before removal (lines 25981-25995)

#### Technical Implementation:
- Lines 26311-26444: Polling-based button injection system
- 5-second interval checks for missing buttons and re-injects
- Visibility validation prevents removal loops

---

## Version 3.7.8 (2025-10-13)

### ⚡ Stability & Polish Update

**Features Added**:
- Cycle Pet Presets hotkey implementation
- Auto-skips "Crop Eater" presets when cycling
- Auto game update detection and refresh prompts

**Bug Fixes**:
- Ability logs occasionally not saving properly (race condition in localStorage writes)
- Improved ability detection reliability (added debouncing to pet ability atom hooks)

**Technical Details**:
- Preset cycling uses modulo arithmetic to wrap around
- Game version comparison via simple string equality check
- Ability log save now uses transaction-like pattern with retry logic

---

## Notes for Future Development:

### Store Capture Issues to Watch:
- React DevTools hook may not be available in all environments
- Store capture timing is critical (too early = not mounted, too late = user already clicked)
- Consider adding retry mechanism if store capture initially fails

### Alternative Approaches Considered:
1. **Polling Inventory Changes**: Would detect changes but high overhead
2. **Hooking Inventory Update Functions**: More invasive, harder to maintain
3. **WebSocket Message Interception**: Clean but requires finding right message types
4. **Current Approach (Hybrid)**: Best balance of reliability and simplicity

### Code Locations Reference:
- **Atom Hooks**: Lines 22740-22953
- **Store Capture**: Lines 588-683
- **Feed Function**: Lines 25967-26088
- **Button Injection**: Lines 26311-26444
- **PET_FEED_CATALOG**: Search for "PET_FEED_CATALOG" - contains species compatibility data

---

**Last Updated**: 2025-10-13
**Maintainers**: Development team
**Status**: Internal documentation - keep updated with each technical fix
