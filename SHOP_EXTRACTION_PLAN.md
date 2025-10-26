# Shop System Extraction Plan

**Feature:** Shop System (Seeds, Eggs, Tools, Decor)
**Estimated Size:** ~1,750-2,400 lines
**Target Module:** `src/features/shop.js`
**Extraction Strategy:** Incremental 6-phase approach

---

## Extraction Phases

### Phase 1: Shop Constants & Utilities (~200 lines)
**Priority:** High - Foundation for all shop features

- `SHOP_IMAGE_MAP` - Discord CDN URLs for item sprites (~45 lines)
- `SHOP_COLOR_GROUPS` - Rarity color groupings (~7 lines)
- `SHOP_RAINBOW_ITEMS` - Celestial seed list (~1 line)
- `SHOP_PRICES` - Price data for all items (~50 lines)
- `SHOP_DISPLAY_NAMES` - Human-readable names (likely ~30 lines)
- `formatShopPrice()` - Format prices with k/m/b notation (~17 lines)
- `normalizeShopKey()` - Normalize strings for comparison (~5 lines)
- `getShopItemColorClass()` - Get rarity color class (~24 lines)
- `preloadShopImages()` - IIFE for image preloading (~7 lines)
- `flashPurchaseFeedback()` - Visual purchase feedback (~20 lines)

**Lines:** ~12430-12700

---

### Phase 2: Inventory & Stock Management (~300 lines)
**Priority:** High - Required for purchase logic

- `isInventoryFull()` - Check if 100-slot inventory is full (~11 lines)
- `getInventoryItemCount()` - Count items in inventory (~16 lines)
- `getItemStackCap()` - Get stack capacity limits (~12 lines)
- `getItemStock()` - Get shop stock for item (2 versions, ~10 lines each)
- `flashInventoryFullFeedback()` - Red flash on full inventory (~28 lines)
- `resetLocalPurchases()` - Reset purchase tracking (likely ~10 lines)
- `checkForWatchedItems()` - Scan shop for watched items (likely ~100+ lines)

**Lines:** ~13519-13770, scattered

---

### Phase 3: Shop Item Elements & Purchase Logic (~400-500 lines)
**Priority:** High - Core shop functionality

- `createShopItemElement()` - Create shop item UI element (~98 lines)
  - Stock displays, rarity colors, sprite images
  - Buy buttons (1/All)
  - Owned quantity displays
  - Stack capacity warnings
- `buyItem()` - Purchase item logic (2 versions):
  - Shop window version (~370 lines) - Lines 13599-13968
  - Settings tab version (~155 lines) - Lines 14154-14308
  - Inventory checks, quantity logic, purchase messages
  - Visual feedback, error handling
- `isShopDataReady()` - Check if shop data loaded (~15 lines)
- `waitForShopData()` - Wait for shop initialization (~100 lines)

**Lines:** ~13419-14308

---

### Phase 4: Shop Windows & Overlays (~500-700 lines)
**Priority:** Medium - Visual shop interface

- `createShopOverlay()` - Create persistent shop overlay (~17 lines)
- `createShopSidebar()` - Create sidebar for seeds/eggs (~151 lines)
- `toggleShopWindows()` - Show/hide shop windows (~25 lines)
- `createShopSidebars()` - Create both sidebars (~18 lines)
- `createShopWindow()` - Create floating shop window (~116 lines)
- `makeShopWindowDraggable()` - Drag-and-drop logic (~92 lines)
- `setupShopWindowHandlers()` - Event handlers for windows (~163 lines)
- `refreshAllShopWindows()` - Refresh all shop UIs (~7 lines)

**Lines:** ~12705-13287, ~12430-12440, ~12873-13124

---

### Phase 5: Shop Tab Content (~200-300 lines)
**Priority:** Medium - Settings tab integration

- `getShopTabContent()` - Generate shop settings tab HTML (~61 lines)
  - Watch lists (seeds, eggs, decor)
  - Stock filters
  - Visual feedback toggles
- `setupShopTabHandlers()` - Event handlers for tab (~49 lines + nested)
  - Nested functions:
    - `createShopItem()` - Create item in tab (~45 lines)
    - `getItemStock()` - Get stock (duplicate, ~12 lines)
    - `buyItem()` - Buy from tab (duplicate, ~155 lines)
    - `applyStockFilter()` - Filter by stock (~8 lines)

**Lines:** ~13969-14309

---

### Phase 6: Shop Monitoring & Restock Detection (~400-500 lines)
**Priority:** Medium - Auto-refresh and notifications

- `scheduleRefresh()` - Debounced shop refresh (~12 lines)
- `handleEggRestockDetection()` - Pattern-based egg restock (~30 lines)
- Tool shop restock detection (interval-based, ~22 lines)
- `initializeShopWatcher()` - Main shop watcher system (~112 lines)
  - Nested `watchShopData()` - Watch globalShop for changes (~106 lines)
  - Restock detection (seed, egg, decor, tool)
  - Proxy-based globalShop interception
  - Polling-based monitoring (5s interval)
- Shop notification integration:
  - `playShopNotificationSound()` - Already extracted to notifications.js ✅
  - `checkForWatchedItems()` - Likely ~100-200 lines

**Lines:** ~16433-16632, ~16504-16632

---

## Remaining Shop Functions to Locate

**Need to find:**
- `SHOP_DISPLAY_NAMES` - Human-readable names
- `resetLocalPurchases()` - Reset purchase tracking
- `checkForWatchedItems()` - Scan for watched items
- Any sell-related functions (line 21947 has `applySellBlockThreshold`)

**Search patterns:**
- Lines 14309+ for remaining tab handlers
- Lines 15000-16000 for notification integration
- Lines 21000+ for sell/threshold functions

---

## Extraction Order

1. **Phase 1: Constants & Utilities** (Foundation)
2. **Phase 2: Inventory Management** (Required for Phase 3)
3. **Phase 3: Item Elements & Purchase** (Core functionality)
4. **Phase 4: Windows & Overlays** (Visual interface)
5. **Phase 5: Tab Content** (Settings integration)
6. **Phase 6: Monitoring & Restock** (Auto-refresh)

---

## Dependencies

### Internal (within shop.js):
- Phase 3 depends on Phase 1 (constants) + Phase 2 (inventory)
- Phase 4 depends on Phase 1 (constants) + Phase 3 (item elements)
- Phase 5 depends on Phase 1 + Phase 2 + Phase 3
- Phase 6 depends on Phase 4 (refresh functions)

### External (from other modules):
- `notifications.js` - `playShopNotificationSound()` ✅ Already extracted
- `UnifiedState.atoms.inventory` - Inventory state
- `UnifiedState.data.settings.shop` - Shop settings
- `targetWindow.MagicCircle_RoomConnection` - Buy/sell messages
- `targetWindow.globalShop` - Shop data (seeds/eggs/tools/decor)
- `productionLog`, `productionWarn` - Logging
- `setManagedInterval` - Interval management

---

## Testing Strategy

After each phase:
1. ✅ ESLint + Prettier (`npm run style`)
2. ✅ Modular build (`npm run build:esbuild`)
3. ✅ Mirror build (`npm run build`)
4. ✅ Verify file sizes stable
5. ✅ Commit with detailed message

Final testing:
- Test shop window creation and dragging
- Test buy 1/buy all functionality
- Test inventory full blocking
- Test restock detection and notifications
- Test watch list functionality
- Test stock filtering in tab

---

## Estimated Progress

| Phase | Lines | % of Total |
|-------|-------|------------|
| 1 | ~200 | 10% |
| 2 | ~300 | 15% |
| 3 | ~500 | 25% |
| 4 | ~700 | 35% |
| 5 | ~300 | 15% |
| 6 | ~500 | 25% |
| **Total** | **~2,500** | **125%** (over-estimate for safety) |

---

## Notes

- Shop notification sound already extracted to `notifications.js` ✅
- Some functions have duplicates (buyItem, getItemStock) - will consolidate during extraction
- Shop monitoring uses Proxy + polling (no MutationObserver due to performance)
- Inventory has 100-slot cap (91 bag + 9 hotbar)
- Stack caps: WateringCan (99), Shovel (unlimited), others (unlimited)
- Restock detection: Pattern-based for eggs, timer-based for seeds/tools/decor

---

**Created:** 2025-10-24
**Target Start:** Immediately after notification system completion
**Estimated Duration:** ~6 sessions (one per phase)
