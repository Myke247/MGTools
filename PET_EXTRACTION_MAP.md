# Pet Management Extraction Map

**Date:** 2025-10-24
**Status:** Analysis Complete - Ready for Extraction
**Estimated Total:** ~5,000 lines of pet-related code

---

## 🎯 Extraction Strategy

**Phase 1:** Extract self-contained sections (presets, hunger monitoring)
**Phase 2:** Extract UI components (tab content, popout)
**Phase 3:** Extract core logic (detection, feeding, swapping)
**Phase 4:** Extract integration code (auto-favorite, hotkeys)

---

## 📍 Pet Code Locations in MGTools.user.js

### **1. Core Pet Detection & State** (~114 lines)
**Lines:** 4317-4431
**Section:** SIMPLE PET DETECTION
**Functions:**
- `getActivePetsFromRoomState()` - Detects active pets from room state
- `updateActivePetsFromRoomState()` - Updates pet state in UnifiedState

**Dependencies:**
- `targetWindow.MagicCircle_RoomConnection`
- `UnifiedState.atoms.activePets`
- `window.activePets`

**Extraction Priority:** HIGH (needed by all other pet features)

---

### **2. Pet Presets (Import/Export)** (~99 lines)
**Lines:** 5315-5414
**Functions:**
- `exportPetPresets()` - Export presets to JSON file
- `importPetPresets()` - Import presets from JSON file

**Dependencies:**
- `UnifiedState.data.petPresets`
- `UnifiedState.data.petPresetsOrder`
- `MGA_saveJSON()` / `MGA_loadJSON()`

**Extraction Priority:** MEDIUM (self-contained, good first extraction)

---

### **3. Pet Feeding Logic** (~47 lines)
**Lines:** 6993-7039
**Functions:**
- `sendFeedPet(petItemId, cropItemId)` - Send feed command
- `feedPetEnsureSync(...)` - Feed pet with sync validation

**Dependencies:**
- `sendWithAck()` - Network helper
- `readAtom()` - Jotai atom reader

**Extraction Priority:** HIGH (core functionality)

---

### **4. Pet Tab UI Content** (~736 lines)
**Lines:** 11683-12418
**Functions:**
- `getPetsPopoutContent()` - Generates popout window HTML (355 lines)
- `getPetsTabContent()` - Generates main tab HTML (381 lines)

**Dependencies:**
- `UnifiedState.data.petPresets`
- `UnifiedState.data.petPresetsOrder`
- `UnifiedState.atoms.activePets`
- Various UI helper functions

**Extraction Priority:** MEDIUM (large UI code block)

---

### **5. Auto-Favorite Settings UI** (~217 lines)
**Lines:** 14397-14613
**Section:** Within Settings Tab
**Features:**
- Species selection checkboxes
- Mutation selection checkboxes
- Pet ability selection (Rainbow Granter, Gold Granter)
- Enable/disable toggle

**Dependencies:**
- `UnifiedState.data.settings.autoFavorite`

**Extraction Priority:** LOW (tightly coupled with settings UI)

---

### **6. Pet Hunger Monitoring** (~320 lines)
**Lines:** 16637-16956
**Section:** PET HUNGER MONITORING
**Constants:**
- `SPECIES_MAX_HUNGER` - Max hunger values per species
- `SPECIES_HUNGER_DEPLETION_TIME` - Hunger depletion rates
- `HUNGER_BOOST_VALUES` - Hunger boost ability values

**Functions:**
- `checkPetHunger()` - Main hunger monitoring function

**Dependencies:**
- `UnifiedState.data.settings.notifications.petHungerEnabled`
- `UnifiedState.data.settings.notifications.petHungerThreshold`
- `window.activePets`

**Extraction Priority:** MEDIUM (self-contained monitoring system)

---

### **7. Pet UI Helper Functions** (~881 lines)
**Lines:** 18559-19440
**Section:** PETS UI HELPER FUNCTIONS
**Functions:** (Many - need detailed scan)
- Pet display utilities
- Preset management
- Pet slot interactions
- UI updates

**Dependencies:** Various

**Extraction Priority:** MEDIUM (large utility block)

---

### **8. Magic Garden Pet Helpers** (~76 lines)
**Lines:** 19441-19517
**Section:** MAGIC GARDEN PET HELPERS
**Functions:** (Need to scan)
- Game-specific pet utilities

**Dependencies:** Game API

**Extraction Priority:** LOW (game API wrappers)

---

### **9. Auto-Favorite Logic** (~500+ lines estimated)
**Lines:** 27290+ (scattered)
**Section:** Seed/Ability Processing
**Features:**
- Auto-favorite seeds by species
- Auto-favorite seeds by mutation
- Auto-favorite pet abilities (Rainbow Granter, Gold Granter)

**Dependencies:**
- `UnifiedState.data.settings.autoFavorite`
- Jotai atoms (abilities, inventory)

**Extraction Priority:** LOW (complex integration with ability system)

---

## 📊 Extraction Complexity Matrix

| Code Section | Lines | Self-Contained | Dependencies | Priority | Effort |
|--------------|-------|----------------|--------------|----------|--------|
| Pet Presets | ~99 | ✅ Yes | Storage only | Medium | Low |
| Hunger Monitoring | ~320 | ✅ Yes | State only | Medium | Low |
| Pet Detection | ~114 | ⚠️ Partial | State, Network | High | Medium |
| Pet Feeding | ~47 | ⚠️ Partial | Network | High | Medium |
| Pet Tab UI | ~736 | ❌ No | Many | Medium | High |
| Pet UI Helpers | ~881 | ❌ No | Many | Medium | High |
| Auto-Favorite | ~500+ | ❌ No | Complex | Low | Very High |

---

## 🚀 Recommended Extraction Order

### **Phase 1: Foundation (Day 1)**
1. ✅ Extract Pet Presets (~99 lines)
   - Self-contained
   - Easy to test
   - Good proof-of-concept

2. ✅ Extract Hunger Monitoring (~320 lines)
   - Self-contained
   - Clear boundaries
   - Minimal dependencies

**Total Phase 1:** ~419 lines

---

### **Phase 2: Core Logic (Day 2)**
3. Extract Pet Detection (~114 lines)
   - Core functionality
   - Needed by everything else
   - Some network dependencies

4. Extract Pet Feeding (~47 lines)
   - Core functionality
   - Network dependent

**Total Phase 2:** ~161 lines

---

### **Phase 3: UI Components (Days 3-4)**
5. Extract Pet UI Helpers (~881 lines)
   - Many small functions
   - May need to split into sub-modules

6. Extract Pet Tab UI (~736 lines)
   - Large HTML generators
   - Depends on helpers

**Total Phase 3:** ~1,617 lines

---

### **Phase 4: Integration (Day 5+)**
7. Extract Magic Garden Pet Helpers (~76 lines)
   - Game API wrappers

8. Extract Auto-Favorite Logic (~500+ lines)
   - Most complex
   - Deeply integrated
   - May need refactoring

**Total Phase 4:** ~576+ lines

---

## 📦 Target Module Structure

```
src/features/pets/
├── index.js              # Main exports
├── presets.js            # Preset import/export
├── hunger.js             # Hunger monitoring
├── detection.js          # Pet detection from room state
├── feeding.js            # Pet feeding logic
├── ui-helpers.js         # UI utility functions
├── tab-content.js        # Tab UI generators
├── game-api.js           # Magic Garden API wrappers
└── auto-favorite.js      # Auto-favorite integration
```

**OR Simpler Structure:**
```
src/features/
├── pets.js               # All pet code in one file (~3000 lines)
└── pet-auto-favorite.js  # Separate due to ability system coupling
```

---

## 🔧 Build System Updates Needed

### **1. Update src/index.js**
Add feature imports:
```javascript
import * as Pets from './features/pets.js';

export const MGTools = {
  // ... existing
  Features: {
    Pets
  }
};
```

### **2. Update scripts/build-esbuild.mjs**
No changes needed - already bundles everything in src/

### **3. Test Compilation**
```bash
npm run build:esbuild
# Should compile cleanly with pet features
```

---

## ⚠️ Challenges & Risks

### **1. Tight Coupling with UnifiedState**
- Pet code heavily uses `UnifiedState.atoms.activePets`
- Need to maintain state access in modules
- Solution: Pass state as parameter or keep global access

### **2. UI Dependencies**
- Pet UI generates HTML strings
- Uses many UI helper functions
- Need to extract helpers first

### **3. Network Dependencies**
- Pet feeding requires `sendWithAck()`
- Need to import from network module
- May need to expose more network functions

### **4. Auto-Favorite Complexity**
- Tightly coupled with ability system
- Hooks into seed processing
- May need to stay in monolith initially

---

## ✅ Success Criteria

**Phase 1 Complete:**
- ✅ Pet presets extracted to src/features/pets.js
- ✅ Hunger monitoring extracted
- ✅ Builds cleanly with `npm run build:esbuild`
- ✅ Module exports properly structured

**Full Extraction Complete:**
- ✅ All ~5,000 lines of pet code in src/features/
- ✅ Monolith no longer has pet code
- ✅ Mirror build unchanged (features still work)
- ✅ Modular build includes pet features

---

## 📅 Timeline

**Estimated Time:** 4-5 days

- Day 1: Phase 1 (Foundation) - 2-3 hours
- Day 2: Phase 2 (Core Logic) - 2-3 hours
- Days 3-4: Phase 3 (UI Components) - 4-6 hours
- Day 5+: Phase 4 (Integration) - 3-4 hours

**Total Effort:** ~15-20 hours

---

## 🎯 Next Steps

1. ✅ Create this analysis document
2. 🚀 Start Phase 1: Extract pet presets
3. 🚀 Start Phase 1: Extract hunger monitoring
4. ✅ Test compilation
5. ✅ Commit Phase 1 progress
6. 📋 Continue with Phase 2 tomorrow

---

**Status:** Ready to begin extraction
**Confidence:** High (well-mapped, clear dependencies)
**Risk:** Low (starting with self-contained sections)
