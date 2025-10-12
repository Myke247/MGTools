# Live Beta Changelog

This is the **Live Beta** branch of MGTools. Changes here are experimental and may be unstable.

---

## v3.6.2 (2025-10-12)

### ✅ COMPLETE PERSISTENCE FIX

**All settings now save and persist correctly across page refresh!**

### 🐛 Bug Fixes
- **Theme Presets Now Save** - Added missing event handlers for all theme preset buttons
- **Continuous Notifications Save** - Added missing handler to setupNotificationsTabHandlers
- **Data Loading Consistency** - Fixed save/load mismatch - always uses MGA_data now
- **All Settings Elements Have Handlers** - Every checkbox, slider, and button now properly saves

### 🔧 Technical Improvements
- Added comprehensive theme preset button handlers that save on click
- Fixed data loading to always use MGA_data (no more fallback confusion)
- Migrates legacy MGA_settings to MGA_data automatically
- Added emergency save on page unload as fallback
- Added `debugSettingsPersistence()` function for troubleshooting

### 🎯 What Was Fixed
- Theme preset buttons (Gaming, Minimal, Vibrant, etc.) - NOW SAVE
- Continuous notification checkbox - NOW SAVES
- All texture controls - NOW SAVE
- Ultra-compact mode - NOW SAVES
- Hide weather effects - NOW SAVES
- Debug mode - NOW SAVES
- Every single setting in Settings and Notifications tabs - NOW SAVES

### 📝 Developer Note
Use `debugSettingsPersistence()` in console to verify all settings are properly stored.

---

## v3.6.1 (2025-10-12)

### 🐛 Bug Fixes
- **Notification Settings NOW PERSIST!** - Fixed missing event handlers causing notification settings to not save
- **Root Cause Found** - `setupNotificationsTabHandlers` function was never being called when notifications tab opened
- **All Handlers Added** - Pet hunger, ability notifications, volume, sound type, and individual ability checkboxes now all save correctly

### 🔧 Technical Fixes
- Created comprehensive `setupNotificationsTabHandlers` function with proper event listeners
- Added notifications case to all 3 switch statements (popouts, overlays, content-only)
- Fixed call to non-existent `setupNotificationSettingsHandlers` at line 6382
- All notification checkboxes now properly save to `UnifiedState.data` and persist with `MGA_saveJSON`

---

## v3.6.0 (2025-10-12)

### 🐛 Bug Fixes
- **Notification Settings Not Persisting** - Fixed race condition where notification settings wouldn't save on refresh
- **Vibrant Purple Indicator** - Changed outdated Live Beta color from subtle purple to BRIGHT MAGENTA (#ff00ff) - impossible to miss!

### 🔧 Technical Fixes
- Removed duplicate `MGA_loadJSON` call that caused settings race condition
- Notification settings now use already-loaded `UnifiedState.data` directly
- Purple indicator now vibrant magenta (#a855f7 → #ff00ff) for maximum visibility

---

## v3.5.9 (2025-10-12)

### ✨ Features
- **Smart Version Indicator Colors** - Live Beta now shows different colors based on update status:
  - 🔵 BLUE - Up-to-date on Live Beta
  - 🟣 PURPLE - Update available on Live Beta (needs update)
  - 🔷 CYAN - Development version on Live Beta (local > remote)
  - 🟢 GREEN - Up-to-date on Stable (unchanged)
  - 🔴 RED - Update available on Stable (unchanged)
  - 🟡 YELLOW - Development version on Stable (unchanged)

### 🎨 Improvements
- Version indicator now provides instant visual feedback for Live Beta users
- No more confusion about whether you're on the latest Live Beta version
- Seamless experience across both Stable and Live Beta branches

---

## v3.5.8 (2025-10-12)

### 🚨 EMERGENCY FIX
- **Auto-Favorite Unfavoriting Everything** - Fixed critical bug where auto-favorite was removing ALL favorited items (pets, eggs, crops, seeds) when checkboxes were unchecked

### 🐛 Bug Fixes
- **Crop-Only Filter Added** - Auto-favorite now only affects crops (itemType === 'Produce'), not pets or eggs
- **Unfavorite Functions Disabled** - Script now ONLY adds favorites, never removes them
- **User Favorites Protected** - Manually-favorited items (pets, eggs, etc.) are now completely safe
- **Checkbox Behavior Fixed** - Unchecking stops auto-favorite but preserves all existing favorites

### 🔒 Security
- Script never unfavorites anything - only adds favorites
- Only operates on crops, never on pets/eggs/seeds/decor
- All existing user favorites are preserved when changing settings

---

## v3.5.7 (2025-10-11)

### ✨ Features
- **Live Beta Version System** - Version checker now supports both Stable and Live Beta branches
- **Blue Beta Indicator** - Users on Live Beta see a blue version indicator instead of green/yellow/red
- **Dual Download Options** - Shift+Click for Stable version, Shift+Alt+Click for Live Beta version
- **Branch Display** - Version checker shows which branch you're on (Stable or Live Beta)
- **Custom Sounds Notifications** - Now choose you custom sounds for each notification, add whatever you'd like.
- **Auto Favoriting** - Automatically favorite your choice of crop by type.

### 🐛 Bug Fixes
- **Fixed Grey Flip-Toggle Button** - Dock flip button now has proper subtle appearance instead of grey
- **Fixed Bright Input Fields** - Input and select fields now have subtle backgrounds for better readability
- **Fixed Drag Blinking** - Eliminated flickering/blinking when dragging the dock
- **Fixed Discord Check** - Version checker in Discord now supports both stable and beta downloads

### 🎨 Improvements
- Version checker tooltips now show all download options clearly
- Beta users see consistent blue indicator across all version states (up-to-date, dev, update, error)
- Improved drag smoothness by disabling transitions during drag operations

---

## How to Switch Versions

### To Try Live Beta:
1. Click the version indicator in the dock
2. Hold **Shift+Alt** and click
3. Install the Live Beta version

### To Return to Stable:
1. Click the version indicator in the dock
2. Hold **Shift** and click
3. Install the Stable version

---

**Note**: Live Beta changes may contain bugs. Always backup your settings (Settings → Export) before switching versions.
