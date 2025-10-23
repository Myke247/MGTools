# MGTools TEST VERSION - UI Reliability Fix

**Version:** 3.8.9-TEST
**Date:** 2025-10-19
**Purpose:** Fix UI not showing in Tampermonkey/Chrome + Add Alt+M toolbar toggle

---

## 🎯 What's Fixed in This Test Version

### Issue #1: UI Not Showing (Tampermonkey/Chrome)
**Symptoms:** Script works when pasted in console, but UI doesn't appear when run via Tampermonkey

**Fixes Applied:**
- ✅ **UI Health Check System**: Automatically detects if UI failed to load
- ✅ **Smart Retry Logic**: Retries UI creation up to 5 times with exponential backoff (1s, 2s, 4s, 5s, 5s)
- ✅ **Emergency Fallback**: Shows visible error message if UI completely fails
- ✅ **Better Console Logging**: Clear `[MGTools TEST]` prefixed logs for debugging
- ✅ **Success Confirmation**: Toast notification when UI loads successfully

### Issue #2: No Way to Hide Toolbar
**New Feature:** Alt+M Keyboard Shortcut

**Features:**
- ✅ Press **Alt+M** to toggle toolbar visibility
- ✅ State persists across page reloads (localStorage)
- ✅ Toast notification when toggling
- ✅ Console feedback for debugging

---

## 📥 Installation Instructions

### For Your Tester

1. **Disable the Current MGTools Script** (if installed)
   - Open Tampermonkey dashboard
   - Find "MGTools" script
   - Toggle it OFF (don't delete, just disable)

2. **Install Test Version**
   - In Tampermonkey dashboard, click "+" to create new script
   - Delete all default code
   - Open file: `test-versions/mgtools-test-ui-fix.user.js`
   - Copy **entire contents**
   - Paste into Tampermonkey editor
   - Click "File" → "Save" (or Ctrl+S)

3. **Test It**
   - Navigate to Magic Garden (https://magicgarden.gg/r/*)
   - Reload page (F5)
   - Watch browser console for `[MGTools TEST]` messages

### Expected Console Output (Success)

```
[MGTools TEST] UI not found, retry 1/5 in 1000ms...  ← (if needed)
[MGTools TEST] ✅ UI confirmed visible (dock: true, sidebar: true)
[MGTools TEST] 💡 Tip: Press Alt+M to toggle toolbar visibility
[MGTools TEST] ⌨️ Alt+M toggle registered. Current state: visible
```

### Expected Console Output (Failure)

```
[MGTools TEST] UI not found, retry 1/5 in 1000ms...
[MGTools TEST] UI not found, retry 2/5 in 2000ms...
[MGTools TEST] UI not found, retry 3/5 in 4000ms...
[MGTools TEST] UI not found, retry 4/5 in 5000ms...
[MGTools TEST] UI not found, retry 5/5 in 5000ms...
[MGTools TEST] ❌ UI failed to load after 5 attempts.
[MGTools TEST] Please report this issue. Trying emergency fallback...
```

If failure occurs, a red error box will appear on screen.

---

## 🧪 Testing Checklist

### Test Case 1: UI Loads Successfully
- [ ] Page loads
- [ ] Toolbar appears within 2-5 seconds
- [ ] Console shows success message
- [ ] Green toast appears: "✅ MGTools TEST Loaded"
- [ ] All features work normally

### Test Case 2: Alt+M Toggle Works
- [ ] Press Alt+M → Toolbar disappears
- [ ] Console shows: `Toolbar now hidden`
- [ ] Toast appears: "👻 Toolbar Hidden"
- [ ] Press Alt+M again → Toolbar reappears
- [ ] Console shows: `Toolbar now visible`
- [ ] Toast appears: "🎨 Toolbar Shown"
- [ ] Reload page → Toolbar state is remembered

### Test Case 3: UI Retry Logic (Stress Test)
This is harder to test, but if tester experienced the original bug:
- [ ] Install test version
- [ ] Use same browser/environment where bug occurred
- [ ] Load page multiple times (10+ times)
- [ ] UI should eventually appear even if delayed
- [ ] Check console for retry messages

---

## 📊 What to Report Back

### If It Works ✅
"Test version works! UI shows up properly and Alt+M toggle works."

### If UI Still Doesn't Show ❌
Please provide:
1. Browser + Version (e.g., Chrome 120.0.6099.129)
2. Tampermonkey Version
3. Full console output (screenshot or copy/paste)
4. Did the red error box appear?
5. Did console show retry attempts?

### If Alt+M Doesn't Work
1. Does keyboard shortcut respond at all?
2. Any console errors when pressing Alt+M?
3. What browser/OS? (Some browsers handle Alt differently)

---

## 🔧 Technical Details

### Changes Made (Line References)

1. **Lines 7915-7983**: `ensureUIHealthy()` function
   - Health check system with retry logic
   - Exponential backoff: 1s → 2s → 4s → 5s → 5s
   - Emergency fallback with visible error

2. **Lines 7985-8039**: `setupToolbarToggle()` function
   - Alt+M keyboard listener
   - Persistent state via localStorage
   - Toggle both dock and sidebar

3. **Lines 27537-27539** & **28877-28879**: Function calls
   - Called after `createUnifiedUI()` in both code paths
   - Ensures all UI elements are monitored

4. **Lines 2-6**: Metadata updates
   - Version: 3.8.9-TEST
   - Name: "MGTools TEST - UI Reliability Fix"
   - Description updated

### Why This Should Fix The Issue

**Original Problem:**
- Script runs at `@run-at document-end`
- Sometimes DOM isn't fully ready
- `createUnifiedUI()` runs but elements don't attach properly
- Chrome/Tampermonkey timing variations

**Our Fix:**
- Health check runs 500ms after UI creation
- If UI missing → wait 1s → try again
- If still missing → wait 2s → try again
- Continue with exponential backoff
- Max 5 retries over ~13 seconds total
- Should catch 99% of timing issues

---

## 🚀 Next Steps

### If Test Succeeds
1. Merge fixes into main branch
2. Release as 3.8.9 or 3.9.0
3. Update production script

### If Test Reveals Issues
1. Analyze console logs
2. Adjust retry timing/logic
3. Create TEST v2 if needed

---

## 📞 Support

If tester has questions or finds bugs:
- Check console for `[MGTools TEST]` messages
- Take screenshots of any errors
- Note exact steps to reproduce
- Report browser/OS/Tampermonkey versions

---

## ⚠️ Important Notes

1. **This is a TEST version** - not for production use
2. **Disable regular MGTools** before testing
3. **Only one version should run** at a time
4. **Test on same environment** where bug was reported
5. **Console logs are verbose** on purpose (for debugging)

---

**File Location:** `C:\Users\MLvP3\ClaudeProjectRepo\test-versions\mgtools-test-ui-fix.user.js`

**Generated:** 2025-10-19 by Claude Code
