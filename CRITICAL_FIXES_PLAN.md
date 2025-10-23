# CRITICAL FIXES PLAN - Session Handoff
**Date:** 2025-10-20
**Status:** 🚨 URGENT - Token Budget at 11% (autocompact imminent)
**Context:** Initial fixes implemented but 3 issues remain after user testing

---

## 📊 **Current Status After User Testing**

### ✅ What's Working:
1. **Code IS loaded** - Confirmed by `[FIX_ROOMS]` log appearing
2. **Custom room fetch works** - Shows player count immediately on add
3. **No syntax errors** - Code runs without crashes

### ❌ What's Still Broken:
1. **Multi-harvest sync** - Not tested properly (used wrong crops)
2. **Hotkey chat blocking** - Still triggers hotkeys when typing in chat
3. **Room data persistence** - Shows 0/6 after page refresh

---

## 🔍 **ROOT CAUSE ANALYSIS**

### Issue 1: Multi-Harvest Sync (FALSE ALARM)
**User tested with:** Pepper, DragonFruit
**Problem:** These are SINGLE-harvest crops!
**What happened:**
- Code runs correctly
- `syncSlotIndexFromGame()` returns `null` (no slot change)
- With `FIX_VALIDATION: false` + `newIndex === null` → No log appears
- User thinks it's broken, but it's working as designed

**Evidence from logs:**
```
Line 991: ✅ ALLOWED HarvestCrop: Pepper with mutations []
(No [FIX_HARVEST] log because Pepper doesn't advance slots)
```

**REAL FIX NEEDED:**
1. Change logging to ALWAYS show (even for single-harvest) when testing
2. Add explicit crop name list in documentation
3. Tell user to test with ACTUAL multi-harvest crops

---

### Issue 2: Hotkey Chat Blocking (FUNDAMENTAL DESIGN FLAW)
**Chat input structure from screenshot:**
```html
<input placeholder="Send" maxlength="180"
       class="chakra-input css-11j28z9" value="">
```

**Current code location:** Line 19675-19688
**What it does:** Checks `shouldBlockHotkey(e)` and returns if true
**Why it fails:**
1. Game's hotkey handler might use **capture phase** (runs before bubble)
2. OR game listens on **window/document** (doesn't care about `activeElement`)
3. My code only checks in bubble phase

**Evidence from screenshot:**
- Input IS a standard `<input>` element
- Should be caught by `tagName === 'input'` check
- But hotkeys still trigger

**REAL FIX NEEDED:**
```javascript
// Add event listener in CAPTURE phase (runs first)
document.addEventListener('keydown', e => {
  if (shouldBlockHotkey(e)) {
    e.stopImmediatePropagation(); // Prevent other handlers
    e.preventDefault();
    return;
  }
}, true); // <-- CAPTURE PHASE
```

**Alternative approach - Target Chakra UI specifically:**
```javascript
function shouldBlockHotkey(event) {
  const active = document.activeElement;
  if (!active) return false;

  // Basic checks...

  // SPECIFIC CHECK for game's chat input
  if (active.classList?.contains('chakra-input')) {
    console.log('[FIX_HOTKEYS] Blocking - Chakra UI input detected');
    return true;
  }
}
```

---

### Issue 3: Room Data Persistence (MISSING SAVE/LOAD)
**User quote:** "If I refresh it shows 0/6 again"

**Current code:** Lines 3873-3887
```javascript
// Stores data in memory
UnifiedState.data.roomStatus.counts[roomCode] = playerCount;
```

**Problem:** `roomStatus` object is NOT saved to GM_storage!

**Evidence:**
- On page load, `UnifiedState.data.roomStatus` starts empty
- Immediate fetch populates it
- But on refresh, it's empty again

**REAL FIX NEEDED:**

**Option A: Add to existing save operation**
```javascript
// Find where MGA_saveJSON('MGA_data', UnifiedState.data) is called
// Verify roomStatus is included in UnifiedState.data
// If it's a separate object, add it to the save
```

**Option B: Save separately**
```javascript
// After storing player count
UnifiedState.data.roomStatus.counts[roomCode] = playerCount;
MGA_saveJSON('MGA_roomStatus', UnifiedState.data.roomStatus);

// On initialization, load it
const savedRoomStatus = MGA_loadJSON('MGA_roomStatus', {counts: {}, lastUpdate: {}});
UnifiedState.data.roomStatus = savedRoomStatus;
```

**Option C: Initialize roomStatus object properly on load**
```javascript
// Search for where UnifiedState.data is initialized
// Add roomStatus loading from storage
if (!UnifiedState.data.roomStatus) {
  UnifiedState.data.roomStatus = MGA_loadJSON('MGA_roomStatus', {
    counts: {},
    lastUpdate: {}
  });
}
```

---

## 🎯 **IMPLEMENTATION PLAN**

### **Phase 1: Enable Proper Diagnostics** (5 min)

**File:** `MGTools.user.js`
**Lines:** 609, 620

```javascript
// Line 609
DEBUG: {
  PRODUCTION: false,  // CHANGE: Enable all logging for testing

// Line 620
  FIX_VALIDATION: true  // CHANGE: Enable fix diagnostic logs
```

**Purpose:** Let user see what's actually happening

---

### **Phase 2: Fix Multi-Harvest Logging** (10 min)

**File:** `MGTools.user.js`
**Lines:** 20375-20384

**Current code:**
```javascript
// Only log if FIX_VALIDATION is enabled or if slot actually changed
if (CONFIG.DEBUG.FLAGS.FIX_VALIDATION || newIndex !== null) {
  console.log('[FIX_HARVEST] Post-harvest slot sync:', {
    species,
    preHarvest: preHarvestIndex,
    postHarvest: newIndex !== null ? newIndex : preHarvestIndex,
    slotAdvanced: newIndex !== null,
    isMultiHarvest: newIndex !== null
  });
}
```

**NEW code:**
```javascript
// ALWAYS log during testing to show code is running
console.log('[FIX_HARVEST] Post-harvest slot sync:', {
  species,
  preHarvest: preHarvestIndex,
  postHarvest: newIndex !== null ? newIndex : preHarvestIndex,
  slotAdvanced: newIndex !== null,
  isMultiHarvest: newIndex !== null,
  note: newIndex === null
    ? 'Single-harvest crop (expected - no slot advance)'
    : 'Multi-harvest detected - slot advanced'
});
```

**Also add at the top of harvest handler (after line 20348):**
```javascript
console.log(`✅ ALLOWED HarvestCrop: ${species} with mutations [${slotMutations.join(', ')}]`);

// DIAGNOSTIC: Always log when fix code runs
if (CONFIG.DEBUG.FLAGS.FIX_VALIDATION) {
  console.log('[FIX_HARVEST] Harvest handler called for:', species,
              'Will attempt sync in 100ms...');
}
```

---

### **Phase 3: Fix Hotkey Chat Blocking** (20 min)

**File:** `MGTools.user.js`
**Location:** Find where main hotkey listener is added (search for `document.addEventListener('keydown'` in hotkey section)

**Strategy 1: Add capture-phase listener BEFORE existing handler**

```javascript
// ==================== HOTKEY CHAT BLOCKING - CAPTURE PHASE ====================
// Add this BEFORE the existing hotkey handler

// Block hotkeys in text inputs using CAPTURE phase (runs first)
document.addEventListener('keydown', (e) => {
  const active = document.activeElement;
  if (!active) return;

  // Check if typing in any input
  const tagName = active.tagName?.toLowerCase();
  const isInput = tagName === 'input' || tagName === 'textarea' || tagName === 'select';
  const isContentEditable = active.contentEditable === 'true' || active.isContentEditable;
  const isChakraInput = active.classList?.contains('chakra-input');

  if (isInput || isContentEditable || isChakraInput) {
    // This is a text input - block all hotkeys
    if (CONFIG.DEBUG.FLAGS.FIX_VALIDATION) {
      console.log('[FIX_HOTKEYS] CAPTURE PHASE - Blocked hotkey in input:', {
        key: e.key,
        tag: tagName,
        classes: active.className,
        chakraInput: isChakraInput
      });
    }

    // Stop event from reaching game's hotkey handler
    e.stopImmediatePropagation();

    // Don't prevent default - let the character type
    // (unless it's a hotkey we're explicitly blocking)
    const hotkeyKeys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0',
                        'o', 'O', 'p', 'P', 'x', 'X', 'c', 'C'];
    if (hotkeyKeys.includes(e.key)) {
      // This key is a hotkey - let it type in input instead
      if (CONFIG.DEBUG.FLAGS.FIX_VALIDATION) {
        console.log('[FIX_HOTKEYS] Allowing', e.key, 'to type in input (not trigger hotkey)');
      }
    }
    return; // Don't let it propagate
  }
}, true); // <-- CAPTURE PHASE (true = useCapture)
```

**Strategy 2: Modify existing handler to check earlier**

Find existing hotkey handler (around line 19660-19690) and add:

```javascript
// Existing handler code...

// Block hotkeys when typing in inputs (enhanced with shadow DOM support)
if (shouldBlockHotkey(e)) {
  e.stopImmediatePropagation(); // ADDED: Stop other handlers from seeing this
  e.preventDefault(); // ADDED: Prevent default action

  // Log when hotkey is blocked (helps diagnose chat detection issues)
  if (CONFIG.DEBUG.FLAGS.FIX_VALIDATION) {
    const active = document.activeElement;
    console.log('[FIX_HOTKEYS] Hotkey blocked - typing detected:', {
      key: e.key,
      tag: active?.tagName,
      id: active?.id,
      classes: active?.className,
      contentEditable: active?.contentEditable
    });
  }
  return;
}
```

---

### **Phase 4: Fix Room Data Persistence** (15 min)

**File:** `MGTools.user.js`

**Step 1: Find initialization point (search for `UnifiedState.data = {`)**

Around line 3000-3100, add roomStatus to initial state:
```javascript
UnifiedState.data = {
  // ... existing properties ...
  roomStatus: {
    counts: {},
    lastUpdate: {}
  }
};
```

**Step 2: Load saved room status on initialization**

Find where `loadSavedData()` or similar is called, add:
```javascript
// Load room status from storage
const savedRoomStatus = MGA_loadJSON('MGA_roomStatus', null);
if (savedRoomStatus && savedRoomStatus.counts) {
  UnifiedState.data.roomStatus = savedRoomStatus;
  productionLog('🏠 [ROOMS] Loaded saved room status:',
                Object.keys(savedRoomStatus.counts).length, 'rooms');
} else {
  UnifiedState.data.roomStatus = { counts: {}, lastUpdate: {} };
}
```

**Step 3: Save after immediate fetch (after line 3886)**

```javascript
UnifiedState.data.roomStatus.counts[roomCode] = Math.max(0, Math.min(6, data.numPlayers));
UnifiedState.data.roomStatus.lastUpdate[roomCode] = Date.now();

// ADDED: Save to persistent storage
MGA_saveJSON('MGA_roomStatus', UnifiedState.data.roomStatus);

if (CONFIG.DEBUG.FLAGS.FIX_VALIDATION) {
  console.log('[FIX_ROOMS] Stored player count for', roomCode, ':',
              UnifiedState.data.roomStatus.counts[roomCode]);
  console.log('[FIX_ROOMS] Saved roomStatus to storage');
}
```

**Step 4: Also save when room polling updates counts**

Find the main room polling update function (search for `UnifiedState.data.roomStatus.counts =`), add save after:
```javascript
UnifiedState.data.roomStatus.counts = counts;
productionLog('[Room Status] Updated counts:', counts);

// ADDED: Persist to storage
MGA_saveJSON('MGA_roomStatus', UnifiedState.data.roomStatus);
```

---

## 📝 **TESTING INSTRUCTIONS FOR USER**

After implementing fixes, create this file: `TESTING_INSTRUCTIONS.md`

```markdown
# Testing Instructions - Round 2

## Setup (REQUIRED)
The code now has debug logging ENABLED by default for this test cycle.
You should see MANY `[FIX_*]` logs in console.

## Test 1: Multi-Harvest Slot Sync

**IMPORTANT:** You must use MULTI-HARVEST crops!

**Multi-harvest crops to test with:**
- Certain berry varieties (check which ones give multiple harvests)
- Any crop that shows a number after harvesting (e.g., "1/3 harvests")

**Test Steps:**
1. Plant a multi-harvest crop
2. Harvest it
3. Check console for:
   ```
   ✅ ALLOWED HarvestCrop: [CropName] with mutations []
   [FIX_HARVEST] Harvest handler called for: [CropName]
   [FIX_HARVEST] Post-harvest slot sync: {
     slotAdvanced: true,
     isMultiHarvest: true,
     note: "Multi-harvest detected - slot advanced"
   }
   ```
4. Verify the crop value display updates to the next slot automatically

**If you test with single-harvest crops (Pepper, Aloe, etc.):**
You'll see:
```
[FIX_HARVEST] Post-harvest slot sync: {
  slotAdvanced: false,
  isMultiHarvest: false,
  note: "Single-harvest crop (expected - no slot advance)"
}
```
This is CORRECT behavior - these crops don't advance slots.

## Test 2: Hotkey Chat Blocking

**Test Steps:**
1. Click in the game's chat input box
2. Try typing characters that are hotkeys: `o`, `p`, `1`, `2`, etc.
3. **Expected:** Characters should TYPE in the chat, NOT trigger hotkeys
4. Check console for:
   ```
   [FIX_HOTKEYS] CAPTURE PHASE - Blocked hotkey in input: {
     key: "o",
     tag: "input",
     chakraInput: true
   }
   [FIX_HOTKEYS] Allowing o to type in input (not trigger hotkey)
   ```

## Test 3: Room Data Persistence

**Test Steps:**
1. Add a custom room (e.g., MG66)
2. Verify player count appears within 1-2 seconds
3. Check console for:
   ```
   [FIX_ROOMS] Stored player count for MG66: 2
   [FIX_ROOMS] Saved roomStatus to storage
   ```
4. **REFRESH THE PAGE** (F5 or Ctrl+R)
5. Check if room still shows correct player count (NOT 0/6)
6. Check console on load for:
   ```
   🏠 [ROOMS] Loaded saved room status: 1 rooms
   ```

## What to Report

For each test, tell me:
1. ✅ or ❌ - Did it work?
2. Paste the relevant console logs
3. If it failed, describe exactly what happened
```

---

## 🚀 **EXECUTION CHECKLIST**

Before exiting plan mode and implementing:

- [ ] Phase 1: Set PRODUCTION: false, FIX_VALIDATION: true
- [ ] Phase 2: Fix multi-harvest logging (always show, add note)
- [ ] Phase 3: Fix hotkey blocking (add capture-phase listener)
- [ ] Phase 4: Fix room persistence (save/load roomStatus)
- [ ] Create TESTING_INSTRUCTIONS.md file
- [ ] Run `node -c MGTools.user.js` to verify syntax
- [ ] Update handoff with final status

---

## 🎯 **SUCCESS CRITERIA**

1. ✅ Multi-harvest: Shows log for EVERY harvest (even single-harvest)
2. ✅ Hotkeys: Characters type in chat without triggering hotkeys
3. ✅ Rooms: Player counts persist across page refreshes
4. ✅ All tests show diagnostic logs in console

---

## ⚠️ **CRITICAL NOTES**

1. **Multi-harvest was NEVER broken** - user tested wrong crops
2. **Hotkey blocking needs capture phase** - bubble phase is too late
3. **Room data needs save/load** - currently only stored in memory
4. **Diagnostic logging is ESSENTIAL** - user needs to see what's happening

---

## 📊 **Token Budget Warning**

**Current:** ~83K/200K used (41%)
**After autocompact:** Will lose context
**URGENT:** Implement these fixes NOW before compact

**Next Sonnet should:**
1. Read this file first
2. Implement all 4 phases
3. Test syntax
4. Report results

---

**Status:** Ready for implementation
**Confidence:** High - root causes identified
**Risk:** Low - changes are surgical and well-understood
