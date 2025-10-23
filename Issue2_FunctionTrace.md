# Issue 2: Multi-harvest Slot Value Update - Function Trace (FINAL)

## Context Setup

```javascript
// Define target context once and use consistently
const targetWindow   = typeof unsafeWindow !== 'undefined' ? unsafeWindow : window;
const targetDocument = targetWindow.document;

// Polyfill queueMicrotask for older embeds
const qmt = typeof queueMicrotask === 'function'
  ? queueMicrotask
  : (fn) => Promise.resolve().then(fn);
```

## Utility Functions for Robust Atom Access

### Robust Atom Finder
```javascript
function findAtom(cache, names = ['myCurrentGrowSlotIndexAtom']) {
  if (!cache) return null;

  if (cache.get) {
    // Try direct lookup first
    for (const n of names) {
      if (cache.get(n)) return cache.get(n);
    }
    // Suffix match fallback
    for (const [k, v] of cache.entries?.() ?? []) {
      if (names.some(n => k.endsWith(n))) return v;
    }
  } else {
    // Plain object fallback
    for (const k of Object.keys(cache)) {
      if (names.some(n => k === n || k.endsWith(n))) return cache[k];
    }
  }
  return null;
}
```

### Safe Atom Value Reader
```javascript
function readAtomValue(atom) {
  try {
    // Prefer cached "last seen" value if atom watcher tracks it
    if (typeof atom?.lastValue !== 'undefined') return atom.lastValue;

    // Otherwise, attempt safe read only if API matches
    if (typeof atom?.read === 'function' && typeof atom?.init !== 'undefined') {
      const ctx = { get: (a) => (a === atom ? atom.init : undefined) };
      return atom.read(ctx);
    }
  } catch {}
  return undefined;
}
```

### Centralized State Setter
```javascript
function setSlotIndex(idx) {
  // Central setter for future refactoring
  window._mgtools_currentSlotIndex = idx;

  // Could add state validation, events, or storage here
  if (CONFIG.DEBUG.FLAGS.FIX_VALIDATION) {
    console.log('[FIX_SLOT] Set slot index to:', idx);
  }
}
```

## Current X/C Navigation Mechanism

### Existing Atom Monitoring
**Module:** Slot Atom Cache Hook
**Anchor:** `// Method 1: Try to hook via jotaiAtomCache`

The system already watches for game slot changes:
```javascript
// When atom.read detects change:
if (window._mgtools_currentSlotIndex !== idx) {
  setSlotIndex(idx);  // Use centralized setter

  // Update display
  if (typeof insertTurtleEstimate === 'function') {
    requestAnimationFrame(() => insertTurtleEstimate());
  }
}
```

### Manual X/C Key Handler
**Anchor:** `// X/C/Arrow key handler for slot cycling`
**Function:** `updateSlotIndex(direction)`

Updates local index on key press, then triggers value refresh.

## Solution: Sync From Game State After Harvest

### Complete Sync Function
```javascript
function syncSlotIndexFromGame() {
  const atomCache = targetWindow.jotaiAtomCache?.cache || targetWindow.jotaiAtomCache;
  if (!atomCache) return null;

  // Use robust finder
  const slotAtom = findAtom(atomCache, ['myCurrentGrowSlotIndexAtom']);
  if (!slotAtom) return null;

  // Safe read
  const gameIndex = readAtomValue(slotAtom);
  if (!Number.isFinite(gameIndex)) return null;

  const currentIndex = window._mgtools_currentSlotIndex || 0;

  // Only update if changed
  if (gameIndex !== currentIndex) {
    setSlotIndex(gameIndex);  // Use centralized setter

    // Trigger value refresh using consistent scheduling
    qmt(() => {
      requestAnimationFrame(() => {
        if (typeof insertTurtleEstimate === 'function') {
          insertTurtleEstimate();
        }
      });
    });

    if (CONFIG.DEBUG.FLAGS.FIX_VALIDATION) {
      window._mgtools_syncCount = (window._mgtools_syncCount || 0) + 1;
      console.log('[FIX_HARVEST] Synced to game slot:', {
        from: currentIndex,
        to: gameIndex,
        syncCount: window._mgtools_syncCount
      });
    }

    return gameIndex;  // Return new index for testing
  }

  return null;  // No change
}
```

### Enhanced updateSlotIndex (Accept Absolute Index)
```javascript
const updateSlotIndex = (directionOrIndex) => {
  const currentCrop = UnifiedState.atoms.currentCrop || targetWindow.currentCrop || [];
  const sortedIndices = UnifiedState.atoms.sortedSlotIndices || targetWindow.sortedSlotIndices;

  if (!currentCrop || currentCrop.length <= 1) return;

  const maxIndex = sortedIndices?.length || currentCrop.length;

  if (typeof directionOrIndex === 'number') {
    // Absolute index set
    setSlotIndex(Math.max(0, Math.min(directionOrIndex, maxIndex - 1)));
  } else if (directionOrIndex === 'forward') {
    const newIndex = (window._mgtools_currentSlotIndex + 1) % maxIndex;
    setSlotIndex(newIndex);
  } else if (directionOrIndex === 'backward') {
    const newIndex = (window._mgtools_currentSlotIndex - 1 + maxIndex) % maxIndex;
    setSlotIndex(newIndex);
  }

  // Use consistent scheduling
  qmt(() => {
    requestAnimationFrame(() => {
      if (typeof insertTurtleEstimate === 'function') {
        insertTurtleEstimate();
      }
    });
  });
};
```

## Implementation in Harvest Handler

### Location
**Anchor:** Search for `"✅ ALLOWED HarvestCrop"`
**Module:** WebSocket message handler / harvest intercept

### Implementation
```javascript
// After harvest allowed
console.log(`✅ ALLOWED HarvestCrop: ${species} with mutations [${slotMutations.join(', ')}]`);

// Check for multi-harvest
const isMultiHarvest = slotData?.harvestsRemaining > 1 ||
                      slotData?.maxHarvests > 1;

if (isMultiHarvest) {
  // Store pre-harvest index for comparison
  const preHarvestIndex = window._mgtools_currentSlotIndex || 0;

  // Small delay to ensure game has processed harvest
  qmt(() => {
    // Sync from game's authoritative state
    const newIndex = syncSlotIndexFromGame();

    if (CONFIG.DEBUG.FLAGS.FIX_VALIDATION) {
      console.log('[FIX_HARVEST] Multi-harvest sync:', {
        preHarvest: preHarvestIndex,
        postHarvest: newIndex,
        changed: newIndex !== null
      });
    }
  });
}
```

## Preconditions

1. **Atom cache available**: `targetWindow.jotaiAtomCache` exists
2. **Multi-harvest confirmed**: `isMultiHarvest === true`
3. **Game state settled**: Auto-cycle completed in game
4. **Functions available**: `insertTurtleEstimate` defined

## Postconditions

1. **Index synced**: MGTools index matches game state
2. **Single refresh**: Exactly one `insertTurtleEstimate()` call
3. **No double-cycle**: Index advances once per harvest
4. **Wraparound correct**: Last slot → first slot handled
5. **Return value**: Function returns new index or null

## Test Instrumentation

```javascript
// In CONFIG.DEBUG.FLAGS
FIX_VALIDATION: false  // Set true only during testing

// Test helper
window._mgtools_testHarvestSync = function() {
  console.log('Test: Pre-sync index:', window._mgtools_currentSlotIndex);
  const result = syncSlotIndexFromGame();
  console.log('Test: Sync result:', result);
  console.log('Test: Post-sync index:', window._mgtools_currentSlotIndex);
  return result;
};
```

## Test Cases

1. **Standard multi-harvest**: Harvest slot 3 of 9 → advances to 4
2. **Last slot wrap**: Harvest slot 8 of 9 → wraps to 0
3. **Single-harvest crop**: No sync triggered
4. **Single slot garden**: Graceful no-op
5. **Discord browser/desktop**: Verify targetWindow usage
6. **IME composition safety**:
   - Type in chat while harvesting
   - Ensure no slot jump during composition
   - Verify hotkeys blocked during IME input
7. **Rapid harvests**: Multiple harvests in quick succession
8. **Network lag**: Delayed harvest response handling

## Why This Solution is Correct

1. **No synthetic events**: Reads actual game state
2. **No arbitrary delays**: Uses microtask → RAF scheduling
3. **Robust atom access**: Handles API changes gracefully
4. **Centralized state**: Single point for index updates
5. **Discord compatible**: Polyfills and targetWindow usage
6. **Testable**: Returns values for assertions
7. **Safe failures**: All functions fail gracefully

## Integration Notes for Sonnet

- All helper functions go near the existing `updateSlotIndex` function
- The sync call goes in the harvest handler after multi-harvest check
- Use the centralized `setSlotIndex()` for ALL index updates
- Keep FIX_VALIDATION flag false by default
- Test IME composition alongside this fix (relates to Issue 7)

## Summary

**Core Solution:** `syncSlotIndexFromGame()` after multi-harvest detection
**Key Innovation:** Read game's Jotai atom state, don't simulate keys
**Scheduling:** `queueMicrotask` → `requestAnimationFrame` → `insertTurtleEstimate`
**Return Value:** New index or null for test assertions
**No Risk:** Absolute sync prevents double-advance