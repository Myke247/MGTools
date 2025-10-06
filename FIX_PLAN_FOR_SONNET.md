# CRITICAL FIX PLAN FOR MGTools - EXECUTE IN ORDER

## PROBLEM ANALYSIS
The script is severely broken due to:
1. **DUPLICATE FUNCTIONS**: Two different `hookAtom()` functions (lines 3053 and 13641)
2. **DUPLICATE ATOM HOOKS**: Same atoms being hooked multiple times from different functions
3. **INFINITE RETRY LOOPS**: Each failed hook retries every second, creating console spam
4. **BROKEN FEATURES**: Loadouts, pet swapping, crop lock/unlock, incorrect names

## ROOT CAUSES
- **Line 3053**: `hookAtom(atomPath, windowKey, callback, retryCount)` - Main hook function with callback
- **Line 13641**: `hookAtom(atomPath, windowKey)` - Duplicate function WITHOUT callback support
- **Multiple Initialization**: Same atoms hooked in initializeProtectionHooks(), initializeAtoms(), and initializeTurtleTimer()
- **Retry Spam**: Each hook failure retries indefinitely (1000ms intervals)

## FIX STEPS - EXECUTE IN ORDER

### STEP 1: Remove Duplicate hookAtom Function
**FILE**: `magicgardenunified.hybrid.user.js`
**ACTION**: DELETE the second hookAtom function (lines 13641-13709)
- This is the one WITHOUT callback support
- Keep ONLY the first one at line 3053

### STEP 2: Fix initializeProtectionHooks
**FILE**: `magicgardenunified.hybrid.user.js`
**LINE**: ~13710-13750
**ACTION**: Update to use the correct hookAtom signature
```javascript
function initializeProtectionHooks() {
    // Hook friend bonus atom
    hookAtom("/home/runner/work/magiccircle.gg/magiccircle.gg/client/src/games/Quinoa/atoms/miscAtoms.ts/friendBonusMultiplierAtom",
        "friendBonus",
        (value) => {
            targetWindow.friendBonus = value;
        }
    );

    // Hook garden data
    hookAtom("/home/runner/work/magiccircle.gg/magiccircle.gg/client/src/games/Quinoa/atoms/myAtoms.ts/myDataAtom",
        "myGarden",
        (value) => {
            targetWindow.myGarden = value;
        }
    );

    // Rest of function stays the same (sendMessage hook)
}
```

### STEP 3: Prevent Duplicate Atom Hooks
**FILE**: `magicgardenunified.hybrid.user.js`
**ACTION**: Add tracking to prevent duplicate hooks

Add at top of script (around line 100):
```javascript
const hookedAtoms = new Set(); // Track which atoms have been hooked
```

Update hookAtom function (line ~3053):
```javascript
function hookAtom(atomPath, windowKey, callback, retryCount = 0) {
    // Prevent duplicate hooks
    const hookKey = `${atomPath}_${windowKey}`;
    if (hookedAtoms.has(hookKey)) {
        console.log(`[HOOK] Already hooked: ${windowKey}`);
        return;
    }

    // Rest of existing function...
    // Add to set after successful hook
    if (atom) {
        hookedAtoms.add(hookKey);
        // ... rest of success logic
    }
}
```

### STEP 4: Remove Duplicate Atom Calls
**FILE**: `magicgardenunified.hybrid.user.js`
**ACTION**: Remove duplicate hooks from initializeProtectionHooks

Since `friendBonus` and `myGarden` are already hooked in `initializeAtoms()` (lines 17113-17126), we should:
1. Remove these hooks from initializeProtectionHooks
2. OR remove them from initializeAtoms
3. Choose ONE place to hook each atom

**Recommendation**: Keep all atom hooks in `initializeAtoms()` only.

### STEP 5: Fix Pet Loadout Issues
**FILE**: `magicgardenunified.hybrid.user.js`
**ISSUE**: Pet loadouts not working
**ACTION**: Check loadPetPreset function (search for "loadPetPreset")
- Verify it's using correct message format
- Check if UnifiedState.atoms.activePets is properly populated

### STEP 6: Fix Crop Lock/Unlock Buttons
**FILE**: `magicgardenunified.hybrid.user.js`
**ISSUE**: Lock/unlock buttons not working
**ACTION**:
1. Find "lockCrop" and "unlockCrop" functions
2. Verify they use correct safeSendMessage format
3. Check event handlers are properly attached

### STEP 7: Fix Crop Names
**FILE**: `magicgardenunified.hybrid.user.js`
**ISSUE**: Incorrect crop and mutation names
**ACTION**:
1. Ensure speciesMap and mutationNames are populated
2. Use targetWindow.globalShop?.speciesById for correct names
3. Update display functions to use proper name lookups

### STEP 8: Fix Maximum Retry Limit
**FILE**: `magicgardenunified.hybrid.user.js`
**LINE**: ~3065
**ACTION**: Add maximum retry limit to prevent infinite loops
```javascript
function hookAtom(atomPath, windowKey, callback, retryCount = 0) {
    const MAX_RETRIES = 10; // Limit retries

    if (retryCount >= MAX_RETRIES) {
        console.error(`[HOOK] Failed to hook ${windowKey} after ${MAX_RETRIES} attempts`);
        return;
    }

    // Rest of function...
}
```

## VERIFICATION STEPS

After implementing fixes:

1. **Reload script** and check console - should see minimal/no hookAtom errors
2. **Test Pet Loadouts**:
   - Save a preset
   - Try loading it
   - Should swap pets correctly
3. **Test Crop Lock/Unlock**:
   - Click lock button on a crop
   - Verify it prevents harvesting
   - Click unlock to restore
4. **Check Names**:
   - Hover over crops - should show correct names
   - Check mutations - should show proper mutation names
5. **Test All Tabs**:
   - Open each tab (Alt+V, etc)
   - Verify content displays correctly
   - No console errors

## CRITICAL NOTES

- **DO NOT** create new duplicate functions
- **DO NOT** hook the same atom multiple times
- **ALWAYS** check if atom is already hooked before hooking
- **USE** the callback parameter in hookAtom for all hooks
- **LIMIT** retries to prevent infinite loops

## Expected Outcome

After fixes:
- Console should be clean (no spam)
- All features should work
- Pet loadouts should swap correctly
- Crop lock/unlock should function
- Correct names for all items/mutations

---

**IMPORTANT**: Execute these fixes in order. Test after each major step to ensure nothing else breaks.