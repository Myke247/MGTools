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
   [FIX_HOTKEYS] Blocking - Chakra UI input detected
   [FIX_HOTKEYS] Hotkey blocked - typing detected: {
     key: "o",
     tag: "input",
     classes: "chakra-input css-11j28z9"
   }
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
