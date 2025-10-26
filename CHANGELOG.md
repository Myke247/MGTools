# Changelog - MGTools

## Version 2.0.0 (2025-10-24)

**Breaking Changes:**
- Dock sizing system expanded from 4 to 6 sizes (added Micro and Mini below Tiny)
- Size cycle order changed: Micro → Mini → Tiny → Small → Medium (default) → Large

**Bug Fixes:**
- Fixed pet auto-favorite checkboxes not persisting state when clicked
- Fixed pets with Gold/Rainbow granter abilities not being automatically favorited
- Added defensive initialization for petAbilities array (fixes upgrade path from v1.1.8 and earlier)
- Improved pet detection logic to check both `abilities` array AND `mutations` array
- Fixed checkbox flash issue where settings weren't being saved properly

**New Features:**
- Added 2 smaller dock sizes: Micro (22x22 H / 20x20 V) and Mini (27x27 H / 25x25 V)
- Dock size now cycles through 6 sizes total with Alt+= and Alt+-
- Enhanced debug logging for pet auto-favorite troubleshooting

**Technical Improvements:**
- Added comprehensive logging to `favoritePetAbility()` function with pet structure debugging
- Added null-safety checks for `petAbilities` array in all code paths
- Improved error handling in pet favoriting logic
- Pet favoriting now checks abilities array for ability type strings (e.g., "GoldCropGranter", "RainbowCropGranter")
- Auto-favorite system logs detailed scan results and matched pets

**Important Note:**
- Unchecking pet ability checkboxes ONLY disables future auto-favoriting
- Existing favorited pets are NEVER unfavorited (by design - preserves user choices)

---

## Version 1.1.9 (2025-10-24)

**New Features:**
- Added auto-favorite for pets with Rainbow Granter or Gold Granter abilities
  - New UI section in VALUES tab → Auto-Favorite settings
  - Checkboxes for "Rainbow Granter" and "Gold Granter" abilities
  - Automatically favorites pets with Gold or Rainbow mutations (which grant these abilities)
  - Prevents accidental selling of valuable pets
  - Works seamlessly with existing crop auto-favorite system

**Bug Fixes:**
- Fixed shop showing inaccurate/empty data on first load
  - Shop now shows "Loading shop data..." message while waiting for game data
  - Automatically populates shop when data becomes available (typically <500ms)
  - Shows helpful error message if data fails to load after 5 seconds
  - Eliminates confusing "0 stock" displays when opening shop right after joining game

**Performance Improvements:**
- Removed unnecessary console.log calls for improved FPS
  - Cleaned up auto-favorite checkbox handlers
  - Removed verbose debugging from favoriteSpecies/favoriteMutation functions
  - Removed 5-second diagnostic interval
  - Kept only critical error/success messages

**Technical Improvements:**
- Added smart loading state for shop UI with 100ms polling
- Extended autoFavorite settings with `petAbilities` array
- Modified `checkAndFavoriteNewItems()` to check pet mutations
- Added `favoritePetAbility()` and `unfavoritePetAbility()` helper functions
- Improved first-time user experience when accessing shop features

---

## Version 1.1.8 (2025-10-23)

**New Features:**
- Added 15 new black accent color themes
  - Pure Void, Violet, Amber, Jade, Coral, Steel, Lavender, Mint, Ruby, Cobalt, Bronze, Teal, Magenta, Lime, Indigo
  - All themes feature dark backgrounds with vibrant accent borders and glows
  - Total of 31 black accent themes now available

**Bug Fixes:**
- Fixed opacity slider to work correctly from 0% (fully transparent) to 100% (fully opaque)
- Removed opacity overboost that was breaking CSS values
- Fixed hardcoded opacity values in black theme rendering functions
- Fixed sidebar gradient transparency bug
- Disabled backdrop-filter blur at 100% opacity for truly solid appearance

**Technical Improvements:**
- Updated theme application functions to respect user opacity settings
- Simplified opacity handling for consistent behavior across all themes
- Added gradient definitions for all new black themes

---

## Version 1.1.7 (2025-10-23)

**Bug Fixes:**

- Shop/Notification/Timers fixed

---

## Version 1.1.5 (2025-10-23)

**New Features:**

- Added Alt+X hotkey for dock position reset
- Press Alt+X to instantly reset the dock to its default position on the right side of the screen
- Clears saved position from localStorage and recalculates default placement

**Technical Details:**

- New `resetDockPosition()` function handles position reset logic
- Clears `mgh_dock_position` from localStorage
- Calculates default position: right side - 20px offset, top 100px
- Shows toast notification: "Dock Reset - Position reset to default"
- Keyboard handler uses `capture: true` for reliable event handling

**Why This Matters:**

- Users who accidentally drag the dock off-screen can now recover instantly
- No need to manually clear localStorage or reinstall the script
- Quick recovery from positioning issues without losing other settings

---

## Version 1.1.4 (2025-10-22)

**Optimization:**

- Pet swapping now skips already-equipped pets to prevent unnecessary network calls
- All 4 pet swap handlers check if `currentPet.id === desiredPet.id` before swapping
- Reduces server load and eliminates redundant SwapPet messages

**Technical Details:**

- Added equipped check to `loadPetPreset()` function
- Added equipped check to `placePetPreset()` function
- Added equipped check to Quick Load button handler
- Added equipped check to pet popout preset click handler

**Why This Matters:**

- Previous versions sent SwapPet messages even when pet was already equipped
- This caused unnecessary network traffic and confused some users
- Now only swaps when actually needed, improving performance and clarity

---

## Version 1.1.3 (2025-10-22)

**Bug Fixes:**

- Added debounce protection to pet preset "Place" buttons
- Prevents rapid double-clicks from triggering duplicate pet swapping operations
- All 4 "place" button handlers now use 500ms debounce delay

**Technical Details:**

- Created debounced wrapper for `placePetPreset` function
- Replaced inline pet swapping code with centralized debounced function
- Reduces server load and prevents race conditions during rapid clicking

**Why This Matters:**

- Previous versions allowed rapid double-clicks to send duplicate swap commands
- Debouncing ensures only one swap operation runs at a time
- Improves reliability and reduces potential for unexpected behavior

---

## Version 1.1.1 (2025-10-22)

**Critical Bug Fix:**

- Fixed pet swapping to work with FULL inventory (100/100 items)
- Replaced broken StorePet/PlacePet approach with native SwapPet messages
- Pet preset swapping now works atomically without requiring free inventory slots

**Implementation Details:**

- 5 handler locations updated to use native game swap mechanism
- For each slot: SwapPet exchanges active pet ↔ inventory pet directly
- Empty slots still use PlacePet, excess pets use StorePet
- 100ms delays between operations for connection reliability

**UI Improvements:**

- Version checker now clearly shows "Your Branch (Beta/Stable)" vs "Other Branch"
- Removed excessive debug console logs for cleaner console output
- Beta version displays with orange/yellow colors, Stable with green colors

**Why This Matters:**

- Previous fix (v1.1.0) added delays but still failed with full inventory
- Native SwapPet bypasses inventory space requirement completely
- Users can now swap pets regardless of inventory fullness

---

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
