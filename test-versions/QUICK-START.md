# 🚀 Quick Start - Test Version

## For Tester: 3 Simple Steps

### Step 1: Disable Current MGTools
- Tampermonkey → Dashboard
- Find "MGTools" → Toggle OFF

### Step 2: Install Test Version
- Tampermonkey → "+" New Script
- Delete all code
- Open: `test-versions/mgtools-test-ui-fix.user.js`
- Copy everything → Paste → Save (Ctrl+S)

### Step 3: Test
- Go to https://magicgarden.gg/r/*
- Press F5 (reload)
- **Look for toolbar** - should appear within 5 seconds
- **Check console** - should see `[MGTools TEST]` messages
- **Try Alt+M** - toolbar should hide/show

---

## ✅ Success Looks Like:
- Toolbar appears ✓
- Console: `✅ UI confirmed visible` ✓
- Alt+M toggles toolbar ✓

## ❌ Failure Looks Like:
- Red error box on screen
- Console: `❌ UI failed to load after 5 attempts`
- No toolbar after 10-15 seconds

---

## Report Results:
**If Works:** "Test version works!"

**If Fails:** Send:
- Browser version
- Console screenshot
- Did retries happen?

---

**File:** `test-versions/mgtools-test-ui-fix.user.js`
**Version:** 3.8.9-TEST
