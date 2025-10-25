# Hotkey System Extraction Plan

**Target:** Complete hotkey management system for MGTools
**Total Size:** ~608 lines (hotkey core) + ~754 lines (protection system) = **~1,362 lines total**
**Location:** MGTools.user.js lines 20928-22289
**Destination:** `src/features/hotkeys.js` + `src/features/protection.js`

---

## Overview

The hotkey system consists of two related but distinct features:
1. **Hotkey System** - Custom key binding, simulation, and interception
2. **Protection/Harvest System** - Auto-harvest rules and sell block thresholds

Both will be extracted to separate modules for better organization.

---

## Phase 1: Hotkey Core - Recording & Utilities (~276 lines)

**Lines:** 20928-21204

### Module-Level State
- `currentlyRecordingHotkey` - Track recording state

### Recording Functions
- `startRecordingHotkey()` - Record game key bindings (~63 lines)
  - Conflict detection across gameKeys
  - Key combo building (ctrl+alt+shift+key)
  - ESC to cancel
  - Save to UnifiedState.data.hotkeys.gameKeys
- `stopRecordingHotkey()` - Stop recording and reset UI (~8 lines)
- `startRecordingHotkeyMGTools()` - Record MGTools key bindings (~66 lines)
  - Conflict detection across both gameKeys and mgToolsKeys
  - Save to UnifiedState.data.hotkeys.mgToolsKeys

### Input Detection
- `shouldBlockHotkey()` - Comprehensive input field detection (~114 lines)
  - Basic input elements (input, textarea, select)
  - Chakra UI chat input detection
  - Contenteditable elements
  - ARIA role="textbox"
  - Shadow DOM traversal
  - Discord chat detection
  - In-game chat pattern matching
- `isTypingInInput()` - Simple input check (calls shouldBlockHotkey)

### Key Parsing Utilities
- `parseKeyCombo()` - Parse key combination string (~10 lines)
  - Split by '+' delimiter
  - Extract modifiers and main key
- `getProperKeyCode()` - Get KeyboardEvent keyCode for simulation (~55 lines)
  - Map key names to keyCodes
  - Handle special keys (space, enter, arrows, etc.)
  - Modifier keys (ctrl, alt, shift, meta)

**Dependencies:**
- UnifiedState (hotkeys.gameKeys, hotkeys.mgToolsKeys)
- MGA_saveJSON (persist hotkey config)
- productionLog (logging)
- debugLog (debug logging)

---

## Phase 2: Hotkey Simulation & Matching (~86 lines)

**Lines:** 21256-21342

### Event Matching
- `matchesKeyCombo()` - Check if KeyboardEvent matches key combo (~15 lines)
  - Compare modifiers (ctrl, alt, shift, meta)
  - Case-insensitive key comparison
  - Handle special keys (space, etc.)

### Key Simulation
- `simulateKeyDown()` - Simulate key press event (~19 lines)
  - Create KeyboardEvent with proper keyCode
  - Set modifiers based on combo
  - Dispatch to document
- `simulateKeyUp()` - Simulate key release event (~17 lines)
  - Same as simulateKeyDown but for keyup

**Dependencies:**
- parseKeyCombo (from Phase 1)
- getProperKeyCode (from Phase 1)

---

## Phase 3: Hotkey Event Handlers (~98 lines)

**Lines:** 21307-21446

### Main Event Handlers
- `handleHotkeyPress()` - Global keydown handler (~133 lines)
  - Block if typing in input (shouldBlockHotkey check)
  - Match against gameKeys (water, harvest, feed, etc.)
  - Match against mgToolsKeys (toggleUI, cyclePreset, etc.)
  - Simulate game key presses
  - Execute MGTools actions
  - Extensive debug logging
- `handleHotkeyRelease()` - Global keyup handler (~6 lines)
  - Currently just logs (placeholder for future features)

### Initialization
- `initializeHotkeySystem()` - Initialize global hotkey listeners (~6 lines)
  - Add keydown listener (handleHotkeyPress, capture phase)
  - Add keyup listener (handleHotkeyRelease, capture phase)

**Dependencies:**
- shouldBlockHotkey (from Phase 1)
- matchesKeyCombo (from Phase 2)
- parseKeyCombo (from Phase 1)
- simulateKeyDown (from Phase 2)
- UnifiedState (hotkeys, activePresets, settings)
- cycleToNextPreset (from pets.js)
- debugLog (debug logging)

---

## Phase 4: Hotkey Tab UI (~84 lines)

**Lines:** 21452-21536

### UI Event Handlers
- `setupHotkeysTabHandlers()` - Setup hotkey tab event handlers (~84 lines)
  - Game key rebind buttons (water, harvest, feed, etc.)
  - MGTools key rebind buttons (toggleUI, cyclePreset, etc.)
  - Reset to default buttons
  - Enable/disable toggles
  - Handler guards (data-handler-setup attribute)

**Dependencies:**
- startRecordingHotkey (from Phase 1)
- startRecordingHotkeyMGTools (from Phase 1)
- UnifiedState (hotkeys)
- MGA_saveJSON (persist config)
- productionLog (logging)

---

## Protection/Harvest System (Separate Module: `src/features/protection.js`)

### Phase 5: Protection Tab UI (~84 lines)

**Lines:** 21536-21620

- `setupProtectTabHandlers()` - Setup protection tab event handlers (~84 lines)
  - Auto-harvest rules checkboxes
  - Sell block threshold slider
  - Handler guards

**Dependencies:**
- UnifiedState (settings.autoHarvest)
- MGA_saveJSON (persist config)
- updateProtectStatus (from Phase 6)
- productionLog (logging)

### Phase 6: Protection Status & Display (~322 lines)

**Lines:** 21858-22180

- `updateProtectStatus()` - Update protection status display (~42 lines)
  - Show/hide auto-harvest indicators
  - Update threshold displays
  - Refresh protection mode badges

**Dependencies:**
- UnifiedState (settings.autoHarvest, settings.sellBlockThreshold)
- DOM manipulation

### Phase 7: Protection Hooks & Logic (~352 lines)

**Lines:** 21900-22289

- `applyHarvestRule()` - Apply auto-harvest protection (~47 lines)
  - Check if crop matches auto-harvest rules
  - Block harvest if protected
  - Show visual feedback
- `applySellBlockThreshold()` - Apply sell block threshold (~9 lines)
  - Check item value against threshold
  - Block sell if value too high
- `initializeProtectionHooks()` - Initialize protection system (~333 lines)
  - Hook into game's harvest/sell atoms
  - Intercept actions before they execute
  - Apply protection rules
  - Show warnings/toasts

**Dependencies:**
- UnifiedState (settings.autoHarvest, settings.sellBlockThreshold)
- Jotai atoms (game state interception)
- showNotificationToast (from notifications.js)

---

## Extraction Strategy

### Hotkey Module (`src/features/hotkeys.js`)
1. Extract Phases 1-4 in order
2. Use full dependency injection pattern
3. Export all functions for use by monolith
4. Test with `npm run build:esbuild` after each phase

### Protection Module (`src/features/protection.js`)
1. Extract Phases 5-7 separately
2. Keep clean separation from hotkeys
3. Both modules can be in same session

### Commit Strategy
- Commit after each phase (or 2 phases if small)
- Each commit should pass ESLint + build
- Use descriptive commit messages with line counts

---

## Dependencies Map

**External Dependencies:**
- `UnifiedState` - State management
- `MGA_saveJSON` - Storage
- `productionLog`, `debugLog` - Logging
- `cycleToNextPreset` - From pets.js
- `showNotificationToast` - From notifications.js

**Internal Module Dependencies:**
- Phase 2 depends on Phase 1 (parseKeyCombo, getProperKeyCode)
- Phase 3 depends on Phase 1-2 (shouldBlockHotkey, matchesKeyCombo, simulateKeyDown)
- Phase 4 depends on Phase 1 (recording functions)
- Phases 5-7 are self-contained (protection module)

---

## Success Criteria

✅ All 17 functions extracted with dependency injection
✅ ESLint 0 errors, <200 warnings
✅ Both builds pass (mirror + modular)
✅ Module-level state properly managed
✅ Clean exports for monolith integration
✅ Comprehensive JSDoc comments
✅ SESSION_STATUS.md updated

---

**Total Expected Output:**
- `src/features/hotkeys.js` - ~608 lines (Phases 1-4)
- `src/features/protection.js` - ~754 lines (Phases 5-7)
- **Combined: ~1,362 lines extracted**
