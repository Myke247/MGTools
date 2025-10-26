# MGTools Extraction Roadmap

**Last Updated:** 2025-10-25
**Current Progress:** 47.2% (16,218/34,361 lines extracted)
**Remaining:** 52.8% (~18,143 lines)

---

## 🎯 Executive Summary

**Completed Extractions (13 systems):**
- Core Infrastructure: 7 modules (~3,076 lines)
- Feature Modules: 8 systems (~12,035 lines)
- UI Modules: 6 systems (~4,967 lines)

**High-Value Targets Identified:**
5 major systems representing 70%+ of remaining extractable code:
1. Settings UI System (~5,310 lines)
2. Abilities Tab & Monitoring (~7,367 lines)
3. Initialization & Bootstrap (~5,487 lines)
4. Tab Content System (~4,963 lines)
5. Theme & Styling System (~1,439 lines)

---

## 📊 Extraction Priority Matrix

### Tier 1: Critical High-Impact Extractions

#### 1. Theme & Styling System (~1,439 lines) **RECOMMENDED FIRST**
- **Why First:** Self-contained, minimal dependencies, high reusability
- **File Location:** Lines 24312-25750
- **Components:**
  - Professional theme engine with gradient generation
  - Texture system (glassmorphism, materials, cyberpunk, etc.)
  - Theme application to all UI elements
  - Cross-window synchronization
- **Extraction Target:** `src/ui/theme-system.js`
- **Estimated Effort:** 2-3 hours
- **Dependencies:** Minimal - mostly self-contained
- **Benefits:** Clean separation of concerns, easier testing

#### 2. Tab Content System (~4,963 lines)
- **File Location:** Lines 12038-17000
- **Components:**
  - Content generators for: Pets, Seeds, Shop, Values, Timers, Rooms, Tools, Protect, Help, Hotkeys, Notifications
  - Note: Excludes Settings & Abilities (separate systems)
- **Extraction Target:** `src/ui/tab-content.js`
- **Estimated Effort:** 4-6 hours (split into phases)
- **Dependencies:** Requires theme system, state management
- **Benefits:** Modular tab system, easier feature additions

#### 3. Settings UI System (~5,310 lines)
- **File Location:** Lines 17991-23300
- **Components:**
  - Complete settings tab content generation
  - Event handlers for all preferences
  - Theme customization controls
  - Texture selection
  - Opacity controls
  - Feature toggles
  - Settings persistence
- **Extraction Target:** `src/features/settings.js`
- **Estimated Effort:** 6-8 hours (largest single system)
- **Dependencies:** Theme system, storage system
- **Benefits:** Centralized settings management

### Tier 2: Important Feature Extractions

#### 4. Value Calculation System (~539 lines)
- **File Location:** Lines 26012-26550
- **Components:**
  - Enhanced ValueManager with caching
  - Throttling for performance
  - Tile/garden/inventory value calculations
  - UI update integration
- **Extraction Target:** `src/features/value-manager.js`
- **Estimated Effort:** 1-2 hours
- **Dependencies:** Crop value system (already extracted)
- **Benefits:** Performance optimization, clean calculations

#### 5. Timer System (~648 lines)
- **File Location:** Lines 26553-27200
- **Components:**
  - Enhanced TimerManager
  - Interval management
  - Persistence
  - Heartbeat monitoring
  - Frozen timer detection
  - Main loop control
- **Extraction Target:** `src/features/timer-manager.js`
- **Estimated Effort:** 2-3 hours
- **Dependencies:** State management, storage
- **Benefits:** Centralized timer management

#### 6. Turtle Timer System (~833 lines)
- **File Location:** Lines 27589-28421
- **Components:**
  - Specialized timer for turtle pets
  - Experience tracking
  - Scale bonus calculations
  - Growth boost predictions
- **Extraction Target:** `src/features/turtle-timer.js`
- **Estimated Effort:** 2-3 hours
- **Dependencies:** Timer system, pet system
- **Benefits:** Specialized pet feature isolation

#### 7. Auto-Favorite System (~309 lines)
- **File Location:** Lines 27282-27590
- **Components:**
  - Automatic pet favoriting
  - Species-based rules
  - Mutation-based rules
  - Ability-based rules
  - Configuration UI
- **Extraction Target:** `src/features/auto-favorite.js`
- **Estimated Effort:** 1 hour
- **Dependencies:** Pet system (already extracted)
- **Benefits:** Clean pet automation feature

### Tier 3: Complex Integrations (Save for Later)

#### 8. Abilities Tab & Monitoring (~7,367 lines)
- **File Location:** Lines 12190-19556 + 25751-26500
- **Components:**
  - Ability log display
  - Filtering and search
  - Normalization
  - Tab content generation
  - Handler setup
  - Ability monitoring system
- **Extraction Target:** `src/features/abilities.js` (may need multiple files)
- **Estimated Effort:** 8-10 hours (split into multiple phases)
- **Dependencies:** Pet system, notifications, state
- **Benefits:** Major code reduction in monolith
- **Note:** This is a MASSIVE system - recommend breaking into sub-modules

#### 9. Initialization & Bootstrap (~5,487 lines)
- **File Location:** Lines 27014-32500
- **Components:**
  - Core initialization logic
  - Canvas detection
  - Ready state checking
  - Standalone initialization
  - Environment-aware startup
  - Main startup sequence
- **Extraction Target:** `src/init/bootstrap-enhanced.js`
- **Estimated Effort:** 6-8 hours
- **Dependencies:** Almost everything (integration point)
- **Benefits:** Clean startup orchestration
- **Note:** Save for late-stage extraction (high coupling)

### Tier 4: Infrastructure & Utilities

#### 10. Storage Recovery & Backup (~771 lines)
- **File Location:** Lines 5210-5980
- **Components:**
  - Emergency storage scan
  - Data migration
  - Backup creation
  - Health checks
- **Extraction Target:** `src/core/storage-recovery.js`
- **Estimated Effort:** 2-3 hours
- **Dependencies:** Storage system (already extracted)
- **Benefits:** Robust data management

#### 11. Room Registry & Firebase (~790 lines)
- **File Location:** Lines 3388-3800 (Firebase) + 3424-3800 (Registry)
- **Components:**
  - Room registry system
  - Discord rooms
  - Custom rooms
  - Firebase integration/polling
  - Room status polling
- **Extraction Target:** `src/features/room-manager.js`
- **Estimated Effort:** 3-4 hours
- **Dependencies:** Network layer, state management
- **Benefits:** Clean room/multiplayer management

#### 12. WebSocket Auto-Reconnect (~347 lines)
- **File Location:** Lines 33838-34184
- **Components:**
  - Enhanced WebSocket management
  - Automatic reconnection
  - Version detection (code 4710)
  - Compatibility mode integration
- **Extraction Target:** `src/core/websocket-manager.js`
- **Estimated Effort:** 1-2 hours
- **Dependencies:** Network layer, compatibility layer
- **Benefits:** Robust connection management

### Tier 5: Small Utilities (Low Priority)

#### 13. Teleport System (~332 lines)
- **File Location:** Lines 30089-30420
- **Extraction Target:** `src/features/teleport.js`
- **Estimated Effort:** 1 hour

#### 14. Tooltip System (~177 lines)
- **File Location:** Lines 32924-33100
- **Extraction Target:** `src/ui/tooltip.js`
- **Estimated Effort:** 30-45 minutes

#### 15. Seed Deletion System (~132 lines)
- **File Location:** Lines 26422-26553
- **Extraction Target:** `src/features/seed-deletion.js`
- **Estimated Effort:** 30 minutes

#### 16. Memory Management (~259 lines)
- **File Location:** Lines 6178-6436
- **Extraction Target:** `src/core/memory-manager.js`
- **Estimated Effort:** 1 hour

#### 17. UnifiedState (~270 lines)
- **File Location:** Lines 3119-3388
- **Extraction Target:** `src/state/unified-state-manager.js`
- **Estimated Effort:** 1 hour
- **Note:** May already be partially extracted

---

## 🚀 Recommended Extraction Sequence

### Phase A: Quick Wins (Low-hanging fruit)
**Estimated Total:** 4-6 hours, ~2,500 lines
1. Theme & Styling System (~1,439 lines) - 2-3 hours
2. Auto-Favorite System (~309 lines) - 1 hour
3. Value Calculation System (~539 lines) - 1-2 hours
4. Tooltip System (~177 lines) - 30 min

### Phase B: Feature Modules (Medium complexity)
**Estimated Total:** 8-12 hours, ~3,500 lines
1. Timer System (~648 lines) - 2-3 hours
2. Turtle Timer (~833 lines) - 2-3 hours
3. WebSocket Auto-Reconnect (~347 lines) - 1-2 hours
4. Storage Recovery (~771 lines) - 2-3 hours
5. Room Registry & Firebase (~790 lines) - 3-4 hours

### Phase C: Large UI Systems (High complexity)
**Estimated Total:** 12-18 hours, ~10,273 lines
1. Tab Content System (~4,963 lines) - 4-6 hours (split into sub-phases)
2. Settings UI System (~5,310 lines) - 6-8 hours (split into sub-phases)

### Phase D: Complex Integrations (Save for last)
**Estimated Total:** 16-20 hours, ~12,854 lines
1. Abilities Tab & Monitoring (~7,367 lines) - 8-10 hours (split into modules)
2. Initialization & Bootstrap (~5,487 lines) - 6-8 hours

---

## 📈 Progress Tracking

### Completed (47.2%)
- ✅ 13 systems extracted (~16,218 lines)

### Phase A Target (55%)
- After quick wins: ~18,718 lines extracted (+2,500)

### Phase B Target (65%)
- After feature modules: ~22,218 lines extracted (+3,500)

### Phase C Target (95%)
- After large UI systems: ~32,491 lines extracted (+10,273)

### Phase D Target (100%)
- After complex integrations: ~45,345 lines total
- Note: Total exceeds monolith due to JSDoc, exports, better organization

---

## 🎯 Next Immediate Steps

**Recommended:** Start with Phase A - Quick Wins

1. **Extract Theme & Styling System** (~1,439 lines)
   - Self-contained, minimal dependencies
   - High reusability across all UI
   - Clean separation of concerns
   - Estimated: 2-3 hours

2. **Extract Auto-Favorite System** (~309 lines)
   - Small, well-defined feature
   - Already has clear boundaries
   - Estimated: 1 hour

3. **Extract Value Calculation System** (~539 lines)
   - Complements already-extracted Crop Value system
   - Performance benefits
   - Estimated: 1-2 hours

**Total Phase A:** 4-6 hours, ~2,500 lines, brings us to 55% extraction!

---

## ⚠️ Code Not Recommended for Extraction

### Hard-to-Extract (Keep in Monolith for Now)
1. **Global Styles & CSS** (~7,655 lines, lines 2346-10000)
   - Massive inline CSS
   - Could extract to CSS module but deeply integrated with theme
   - Low priority for now

2. **Early Bootstrap Code** (lines 25-1277)
   - Executes before main init
   - RoomConnection trap, CSP guard, compatibility detection
   - Critical for environment setup
   - High risk to extract

3. **Scattered Utilities** (~3,000 lines)
   - Small helpers used everywhere
   - compareVersions, isGMApiAvailable, etc.
   - Can be extracted last as `src/utils/helpers.js`

4. **Inline Event Handlers**
   - Context-specific callbacks
   - Hard to decouple
   - Extract with parent systems

---

## 📝 Notes

- **Dependency Injection:** All extracted code MUST use dependency injection pattern
- **Testing:** Run `npm run build:esbuild` after each extraction
- **Documentation:** Update SESSION_STATUS.md after each extraction
- **Quality:** All code must pass ESLint + Prettier
- **Mirror Build:** Keep MGTools.user.js unchanged (production safety)

---

**End of Roadmap**
