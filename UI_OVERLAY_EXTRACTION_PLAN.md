# UI Overlay System Extraction Plan

**Total Estimated Size:** ~3,687 lines (exceeds initial 3,000 line estimate!)
**Target Module:** `src/ui/overlay.js`
**Status:** NOT STARTED

---

## 📋 Overview

The UI Overlay System is the core user interface framework for MGTools. It handles:
- CSS styling (UNIFIED_STYLES)
- Main dock UI creation and management
- Sidebar tab navigation
- Popout widget windows
- In-game overlay system
- Tab content caching and updates

This is one of the largest remaining systems and forms the foundation of the entire UI.

---

## 🎯 Extraction Phases

### **Phase 1: UNIFIED_STYLES CSS** (~719 lines)
**Lines:** 2358-3077
**Complexity:** Low (pure CSS)

**Components:**
- Google Fonts import
- Hybrid dock styles (horizontal/vertical)
- Dock item styles with hover states
- Dock size variants (micro, mini, tiny, small, normal, large, huge)
- Sidebar styles
- Popout window styles
- Overlay styles
- Button and control styles
- Animation and transition definitions
- Responsive design rules
- Theme integration

**Strategy:** Extract as a single const, export as `UNIFIED_STYLES`

---

### **Phase 2: Main UI Creation** (~895 lines)
**Lines:** 8267-9162
**Complexity:** Medium-High

**Functions:**
1. `createUnifiedUI()` - 367 lines
   - Main UI initialization
   - Creates dock, sidebar, and all UI elements
   - Icon mapping and tooltip setup
   - Event listener attachment

2. `ensureUIHealthy()` - 81 lines
   - UI health checks and recovery

3. `setupToolbarToggle()` - 76 lines
   - Toolbar collapse/expand functionality

4. `setupDockSizeControl()` - 87 lines
   - Dock size selection and persistence

5. `saveDockPosition()` - 12 lines
6. `resetDockPosition()` - 38 lines
7. `cleanupCorruptedDockPosition()` - 38 lines
8. `loadDockPosition()` - 42 lines
9. `saveDockOrientation()` - 7 lines
10. `loadDockOrientation()` - 8 lines

11. `makeDockDraggable()` - 130 lines
    - Drag-and-drop functionality for dock
    - Snap-to-position logic
    - Position persistence

**Dependencies:** GM storage, UNIFIED_STYLES, targetDocument, UnifiedState

---

### **Phase 3: Sidebar & Popout Management** (~523 lines)
**Lines:** 9163-9686
**Complexity:** Medium

**Functions:**
1. `openSidebarTab(tabName)` - 48 lines
   - Opens/toggles sidebar tabs
   - Content loading and rendering
   - Active state management

2. `openPopoutWidget(tabName)` - 134 lines
   - Creates detached popout windows
   - Tab-specific content rendering
   - Event handler setup

3. `makePopoutDraggable(popout, handle)` - 81 lines
   - Drag functionality for popouts

4. Weather-related utilities:
   - `hideWeatherCanvases()` - 7 lines
   - `showWeatherCanvases()` - 7 lines
   - `applyWeatherSetting()` - 27 lines

5. Hotkey utilities:
   - `formatHotkey(event)` - 13 lines
   - `matchesHotkey(event, hotkeyString)` - 5 lines
   - `showHotkeyRecordingModal(presetName, context)` - 193 lines

**Dependencies:** UnifiedState, targetDocument, tab content generators

---

### **Phase 4: Overlay System** (~1,505 lines)
**Lines:** 10017-11476
**Complexity:** High (most complex phase)

**Core Functions:**
1. `getContentForTab(tabName, isPopout)` - 28 lines
   - Tab content dispatcher

2. `setupOverlayHandlers(overlay, tabName)` - 49 lines
   - Handler setup for different tab types

3. `createInGameOverlay(tabName)` - 311 lines ⭐ LARGEST FUNCTION
   - Creates full overlay windows
   - Position calculation and persistence
   - Minimize/maximize functionality
   - Theme integration

4. `updateOverlayContent(contentArea, tabName)` - 108 lines
   - Updates overlay content dynamically

**Dragging System:**
5. `makeEntireOverlayDraggable(overlay)` - 117 lines
6. `makeOverlayDraggable(overlay, header)` - 46 lines
7. `constrainOverlayToViewport(overlay)` - 34 lines

**Position Management:**
8. `getGameViewport()` - 13 lines
9. `findOptimalPosition(tabName, gameViewport)` - 127 lines
10. `findPositionInZone(zone, overlayWidth, overlayHeight, snapGrid, mainHudBuffer)` - 30 lines
11. `overlapsMainHUD(x, y, width, height)` - 23 lines
12. `hasCollisionAtPosition(x, y, width, height)` - 22 lines
13. `saveOverlayPosition(overlayId, position)` - 17 lines
14. `loadOverlayPosition(overlay)` - 41 lines

**Resize & Dimensions:**
15. `addResizeHandleToOverlay(overlay)` - 38 lines
16. `saveOverlayDimensions(overlayId, dimensions)` - 17 lines
17. `loadOverlayDimensions(overlay)` - 29 lines

**State Management:**
18. `toggleOverlayMinimized(overlay, tabName)` - 63 lines
19. `loadOverlayState(overlay)` - 33 lines
20. `closeInGameOverlay(tabName)` - 12 lines

**Content Updates:**
21. `updatePopoutButtonStateByTab(tabName, isActive)` - 7 lines
22. `updatePureOverlayContent(overlay, tabName)` - 156 lines
23. `setupPureOverlayHandlers(overlay, tabName)` - 40 lines
24. `refreshOverlayContent(tabName)` - 21 lines

**Popout Utilities:**
25. `toggleTabPopout(tabName, buttonElement)` - 25 lines
26. `updatePopoutButtonState(buttonElement, isActive)` - 14 lines
27. `openTabInPopout(tabName)` - 12 lines

**Dependencies:** All tab content generators, all tab handler setup functions

---

### **Phase 5: Tab Content Cache & updateTabContent** (~45+ lines)
**Lines:** 11477-11522+
**Complexity:** Low-Medium

**Functions:**
1. `getCachedTabContent(tabName, generator)` - 33 lines
   - Caches generated tab content for performance

2. `invalidateTabCache(tabName)` - 11 lines
   - Clears cached content

3. `updateTabContent()` - starts at 11523 (need to find end)
   - Main tab content update orchestrator

**Dependencies:** All tab content generators

---

## 🔄 Extraction Strategy

### Dependencies to Keep in Mind
The UI Overlay System depends on:
- **GM Storage Functions** (already extracted)
- **Tab Content Generators** (NOT extracted - stay in main file for now):
  - `getPetsTabContent()`, `getPetsPopoutContent()`
  - `getAbilitiesTabContent()`
  - `getSeedsTabContent()`
  - `getShopTabContent()`
  - `getValuesTabContent()`
  - `getTimersTabContent()`
  - `getRoomStatusTabContent()`
  - `getToolsTabContent()`
  - `getSettingsTabContent()`
  - `getHotkeysTabContent()`
  - `getNotificationsTabContent()`
  - `getProtectTabContent()`

- **Tab Handler Setup Functions** (NOT extracted - stay in main file for now):
  - `setupPetsTabHandlers()`
  - `setupAbilitiesTabHandlers()`
  - `setupSeedsTabHandlers()`
  - `setupShopTabHandlers()`
  - etc.

- **Other Systems:**
  - `makeElementResizable()` from draggable.js (already extracted)
  - `checkVersion()` from version-checker.js (already extracted)
  - `targetDocument`, `targetWindow` (global references)
  - `UnifiedState` (global state object)

### Injection Pattern
```javascript
// In main file
import {
  UNIFIED_STYLES,
  createUnifiedUI,
  openSidebarTab,
  openPopoutWidget,
  createInGameOverlay,
  // ... etc
} from './src/ui/overlay.js';

// Create injection object for overlay system
const overlayDeps = {
  targetDocument,
  targetWindow,
  UnifiedState,
  // Tab content generators
  getPetsTabContent,
  getAbilitiesTabContent,
  // ... all other content generators
  // Tab handler setup functions
  setupPetsTabHandlers,
  setupAbilitiesTabHandlers,
  // ... all other handler setup functions
  // Other utilities
  makeElementResizable,
  checkVersion,
  // Storage functions
  MGA_saveJSON,
  MGA_loadJSON,
  // Debugging
  debugLog,
  debugError,
  productionLog
};

// Initialize
const uiOverlay = initializeUIOverlay(overlayDeps);
```

---

## ⚡ Quick Start (Phase 1)

**Next Steps:**
1. Create `src/ui/overlay.js`
2. Extract UNIFIED_STYLES first (cleanest extraction)
3. Add proper JSDoc comments
4. Export as module
5. Test mirror build
6. Test modular build
7. Commit

**Estimated Time per Phase:**
- Phase 1: ~30 minutes (pure CSS)
- Phase 2: ~1.5 hours (complex UI creation)
- Phase 3: ~1 hour (sidebar/popout management)
- Phase 4: ~2.5 hours (largest and most complex)
- Phase 5: ~30 minutes (simple caching)

**Total Estimated Time:** ~6 hours of extraction work

---

## 📝 Notes

- **This is the UI FOUNDATION** - most other UI systems depend on this
- Keep tab content generators in main file (they're feature-specific, not UI infrastructure)
- Use full dependency injection for maximum modularity
- Test each phase thoroughly before moving to next
- UNIFIED_STYLES can be extracted immediately with zero risk

---

## ✅ Success Criteria

- [ ] All 5 phases extracted
- [ ] Module exports all functions
- [ ] Full dependency injection pattern used
- [ ] Mirror build remains byte-identical (1420.91 KB)
- [ ] Modular build compiles successfully
- [ ] ESLint: 0 errors, minimal warnings
- [ ] Prettier formatting applied
- [ ] All functions documented with JSDoc
- [ ] UnifiedState UI references updated
- [ ] No global function calls (all injected)

---

**Ready to begin extraction!** 🚀
