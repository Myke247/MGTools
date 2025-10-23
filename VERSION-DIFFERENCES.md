# MGTools Version Differences

## Two Versions Available

You now have two versions of MGTools to choose from based on your preferences:

---

## 📦 **MGTools.user.js** (Standard Version - ORIGINAL)

**Status:** ✅ UNCHANGED - This is your original version

**Auto-Refresh Behavior:**
- ✅ **Automatically clicks CONTINUE** when game update popup appears
- ✅ **Automatically refreshes page** after 5-second countdown when WebSocket detects update (code 4710)
- ✅ Shows friendly countdown notification: "Refreshing in 5s..."

**Use this if you want:**
- Seamless updates with no manual intervention
- Automatic page refresh when dev pushes updates
- Hands-off experience

---

## 📦 **MGTools-NoAutoRefresh.user.js** (No Auto-Refresh Version - NEW)

**Status:** ✨ NEW - Created from original with auto-features removed

**Manual Refresh Behavior:**
- ❌ **Does NOT auto-click CONTINUE** - you must click it yourself
- ❌ **Does NOT auto-refresh page** - you must manually refresh
- ✅ Shows notification with manual "Refresh Page Now" button
- ✅ Shows alert when game update popup is detected: "Please click CONTINUE in the popup above"

**Use this if you want:**
- Full manual control over page refreshes
- To decide when to refresh (e.g., finish current task first)
- To avoid interruption during important gameplay moments

---

## Key Differences

| Feature | Standard Version | No Auto-Refresh Version |
|---------|-----------------|-------------------------|
| **WebSocket 4710 Detection** | Auto-refreshes after 5s countdown | Shows button, waits for manual click |
| **"Game Update Available" Popup** | Auto-clicks CONTINUE button | Shows alert, user clicks CONTINUE |
| **Notification Color** | 🟢 Green (auto-refreshing) | 🟠 Orange (manual action required) |
| **Interruption Risk** | Refreshes automatically | Only refreshes when you choose |
| **Version ID** | `1.1.0` | `1.1.0-noauto` |

---

## All Other Features Are IDENTICAL

Both versions include all the same features:
- ✅ Pet presets & swapping
- ✅ Shop monitoring & notifications
- ✅ Hunger tracking
- ✅ Ability notifications
- ✅ Room management
- ✅ Hotkeys
- ✅ All UI enhancements
- ✅ All quality-of-life improvements

**The ONLY difference is the auto-refresh behavior!**

---

## Installation

### Using Standard Version (Original)
```
Continue using MGTools.user.js as normal
```

### Switching to No Auto-Refresh Version
1. **Disable MGTools.user.js** in Tampermonkey
2. **Enable MGTools-NoAutoRefresh.user.js** in Tampermonkey
3. Refresh the game page

### Important Notes
- ⚠️ **Only run ONE version at a time** (not both!)
- Both versions use the same storage keys, so settings are shared
- You can switch between versions anytime without losing data

---

## Code Changes Summary

**Lines modified in NoAutoRefresh version:**

### 1. **Header (lines 2-8)**
```diff
- @name         MGTools
+ @name         MGTools (No Auto-Refresh)
- @version      1.1.0
+ @version      1.1.0-noauto
```

### 2. **WebSocket 4710 Handler (lines ~33060-33121)**
```diff
- Shows countdown: "Refreshing in 5s..."
- Auto-refreshes after 5 seconds
+ Shows "Refresh Page Now" button
+ Waits for manual click (NO auto-refresh)
```

### 3. **DOM Update Detection (lines ~33275-33357)**
```diff
- Auto-clicks CONTINUE button on popup
- Triggers immediate refresh
+ Shows alert: "Please click CONTINUE in the popup above"
+ NO auto-click (user must click themselves)
```

---

## Recommendation

**Standard Version (Original):**
- Best for most users
- Seamless update experience
- No manual intervention needed

**No Auto-Refresh Version:**
- Best for users who want control
- Good for competitive players who need to finish actions
- Good for AFK scenarios where sudden refresh is disruptive

---

## File Locations

```
MGTools.user.js                  → Standard version (original, unchanged)
MGTools-NoAutoRefresh.user.js    → No auto-refresh version (new)
```

Both files are in: `C:\Users\MLvP3\ClaudeProjectRepo\`
