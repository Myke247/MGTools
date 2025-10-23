# Data Loss Bug - Fix Summary

## What Happened

You lost your pet preset data after refreshing MGTools. Console logs showed:
```
⚠️ [HEALTH-CHECK] Storage issues detected:
   - localStorage read/write mismatch
```

### Root Cause

When storage health check fails during initialization:
1. `MGA_loadJSON('MGA_petPresets', {})` returns empty object (default)
2. Initialization completes and saves the empty state
3. Good data in GM storage gets overwritten with empty data

## Fixes Implemented

### 1. Data Loss Prevention (Line 26285-26302)

Added validation before final save:
- Checks if loaded data is suspiciously empty (0 presets)
- Checks if health check detected issues
- If both conditions true: **ABORTS save and exits initialization**
- Preserves existing data instead of overwriting it

```javascript
if (presetCount === 0 && hasHealthIssues) {
  productionWarn('⚠️ [DATA-LOSS-PREVENTION] Refusing to save empty pet presets');
  productionError('❌ [INIT-ABORTED] Initialization aborted to prevent data loss');
  return; // Exit without saving
}
```

### 2. Auto-Backup System (Line 4603-4639)

Before overwriting critical data (MGA_data, MGA_petPresets, MGA_petPresetsOrder):
- Creates timestamped backup: `MGA_data_backup_1729364567890`
- Keeps last 3 backups per key
- Auto-cleans old backups
- Non-fatal (continues save if backup fails)

### 3. Recovery Tools (Line 4933-5046)

Added two new console functions:

**`listBackups()`**
- Lists all available auto-backups
- Shows timestamps, item counts, age
- Displays table in console

**`restoreFromBackup("backup_key")`**
- Restores data from specific backup
- Shows preview before restoring
- Requires user confirmation
- Instructions to reload after restore

## Immediate Recovery Steps

Run these in console RIGHT NOW:

```javascript
// 1. Check if backups exist (requires GM_listValues support)
listBackups()

// 2. Check GM storage directly
GM_getValue("MGA_petPresets", null)

// 3. Check localStorage
localStorage.getItem("MGA_petPresets")

// 4. Full emergency scan
emergencyStorageScan("MGA_petPresets")
```

If any return data, we can recover it.

## How It Works Now

### Normal Operation (Data Exists)
1. Health check runs → passes
2. Load presets → finds data
3. Validation passes (presets > 0)
4. **Auto-backup created before save**
5. Save new state
6. Persistence guard cleared

### Data Loss Scenario (Fixed)
1. Health check runs → **FAILS** (localStorage r/w mismatch)
2. Load presets → **EMPTY** (loading failed)
3. Validation catches: empty + health issues
4. **ABORT initialization**
5. **DON'T save** (preserves old data)
6. Show recovery instructions

### Backup System
Every save of critical data:
1. Read existing data from GM storage
2. Create backup: `{key}_backup_{timestamp}`
3. Keep last 3 backups
4. Delete older backups
5. Proceed with normal save

## Recovery Examples

### Restore from auto-backup
```javascript
// List backups
listBackups()

// Output:
// === Available Backups ===
// MGA_petPresets_backup_1729364567890  |  5 items  |  2 min ago
// MGA_petPresets_backup_1729364234567  |  5 items  |  10 min ago

// Restore most recent
restoreFromBackup("MGA_petPresets_backup_1729364567890")

// Reload page
location.reload()
```

### Manual recovery from GM storage
```javascript
// Check what's in GM storage
const data = GM_getValue("MGA_petPresets", null)
console.log(JSON.parse(data))

// If data exists but didn't load, force copy to current state
if (data) {
  const parsed = JSON.parse(data)
  UnifiedState.data.petPresets = parsed
  MGA_saveJSON('MGA_data', UnifiedState.data)
  console.log("✅ Restored", Object.keys(parsed).length, "presets")
  location.reload()
}
```

## Testing

Changes tested for:
- ✅ Empty data + health issues → Initialization aborted, no save
- ✅ Valid data + health issues → Save proceeds (data exists)
- ✅ Empty data + no health issues → Save proceeds (fresh install)
- ✅ Auto-backup creates timestamped backup before save
- ✅ Backup cleanup keeps only last 3
- ✅ listBackups() shows all backups with metadata
- ✅ restoreFromBackup() restores and requires confirmation

## Future Improvements

Consider adding:
- UI button for "Recover Lost Data"
- Visual indicator when running with failed health check
- More aggressive backup (before every critical operation)
- Export reminder after creating presets

## Files Modified

- `mgtools.user.js` (3 sections)
  - Line 4603-4639: Auto-backup system
  - Line 4933-5046: Recovery tools
  - Line 26285-26302: Data loss prevention

## Version

- Fix version: v3.8.9
- Date: 2025-10-19
- Issue: Pet preset data loss after refresh with storage health check failure

## Notes

- Auto-backups only work if `GM_listValues()` is available (Tampermonkey/Violentmonkey)
- Backups stored in GM storage (same as main data)
- Recovery functions available in both `window` and `targetWindow`
- Non-intrusive: No UI changes, console-based tools only
