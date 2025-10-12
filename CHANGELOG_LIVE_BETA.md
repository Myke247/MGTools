# Live Beta Changelog

This is the **Live Beta** branch of MGTools. Changes here are experimental and may be unstable.

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
