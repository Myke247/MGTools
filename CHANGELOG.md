# Changelog - MGTools

## Version 3.2.8 (2025-10-08)

### 🐛 Bug Fixes
- Fixed Chilled mutation crop protection - crops with Chilled mutation now properly protected from harvesting
- Corrected mutation name from "Chill" to "Chilled" to match game data

---

## Version 3.2.7 (2025-10-08)

### 🐛 Bug Fixes
- Internal version bump (skipped)

---

## Version 3.2.6 (2025-10-08)

### 🐛 Bug Fixes
- Fixed crop cycling values - turtle timers and crop values now display correctly when cycling through multiple crops on same tile
- Fixed slot index tracking for multi-harvest crops
- Improved X/C key detection for crop cycling

---

## Version 3.2.5 (2025-10-08)

### ✨ Improvements
- Updated slot value tile icon

---

## Version 3.2.4 (2025-10-08)

### 🐛 Bug Fixes
- Fixed crop protection unlock not releasing crops

---

## Version 3.2.3 (2025-10-08)

### 🐛 Bug Fixes
- Fixed tooltip coin icon visibility

---

## Version 3.2.2 (2025-10-08)

### 🐛 Bug Fixes
- Fixed coin emoji visibility using Discord CDN image

---

## Version 3.2.1 (2025-10-08)

### 🐛 Bug Fixes
- Removed debug console spam from rooms system

---

## Version 3.1.9 (2025-10-07)

### 🐛 Critical Bug Fixes
- **Ability Logs**: Fixed ghost logs reappearing after clear/refresh
  - Logs now stay cleared after refresh for 24 hours
  - Tile Value no longer displayed on the pets status
  - Gold added back as crop lock option
  - Clear action persists across page reloads

- **WebSocket Disconnects (Error 4710)**: Auto-reconnect with visual feedback
  - Automatic reconnection with exponential backoff
  - Toast notifications showing reconnection progress
  - Manual reload button after max retry attempts
  - Network status detection (online/offline awareness)

- **Room Player Counts**: Fixed rooms showing "0/6" instead of actual counts
  - Removed duplicate room panel appearing outside Rooms tab
  - Automatic updates every 5 seconds

### ✨ New Features
- **Enhanced Room System**: Improved reliability and performance
  - Multiple fallback methods for fetching room data
  - CORS bypass for compatibility
  - Better error handling and timeout management

### 🎨 UI/UX Improvements
- Touch-optimized buttons on mobile devices
- Smooth scrolling with overscroll prevention
- Accessibility: Reduced motion support

---

## Version 3.1.8 (2025-10-07)

### ✨ New Features
- Added Wet and Chill mutations to crop protection locking

---

## Version 3.1.7 (2025-10-07)

### ✨ New Features
- Added "Import Your Garden" calculator tool in Tools tab

---

## Version 3.1.6 (2025-10-07)

### 🐛 Bug Fixes
- Fixed mature crop slot values not displaying centered in tooltips
- Fixed slot value positioning when pet status panel is open

---

## Version 3.0.1 (2025-10-07)

### ✨ Improvements
- Upgraded all dock icons to HD cartoon-style versions

---

## Version 2.2.9 (2025-10-06)

### 🐛 Bug Fixes
- Fixed turtle timers not displaying correctly
- Fixed tile value display not showing on crop tooltips
- Fixed duplicate ability log entries
- Fixed ability logs not clearing properly

---

## Version 2.2.5 (2025-10-06)

### 🐛 Bug Fixes
- Fixed color presets appearing too dark at 95% opacity
- Fixed tile value positioning
- Fixed turtle timer not displaying with turtles equipped

---

## Version 2.2.4 (2025-10-06)

### 🐛 Bug Fixes
- Fixed slot tile value positioning in crop tooltips
- Fixed turtle timer display issues
- Fixed ability trigger false positives on page refresh
- Fixed theme colors not applying correctly on page load

---

## Version 2.2.1 (2025-10-06)

### 🐛 Bug Fixes
- Fixed shop quantity tracking for both UI and in-game purchases
- Fixed tooltip alignment issues for slot values and turtle timers

### ✨ Improvements
- Shop purchase counts now persist across page refreshes

---

## Version 2.2.0 (2025-10-06)

### 🐛 Bug Fixes
- Fixed widget popout resize issue - content now scales properly
- Fixed tile value display centering

### ✨ Improvements
- Improved shop restock detection using pattern-based monitoring
- Shop UI now displays stock correctly using game inventory data

---

## Version 2.1.9 (2025-10-05)

### 🐛 Bug Fixes
- Fixed widget dragging issue
- Fixed widget theme rendering
- Fixed widget body transparency

### ✨ New Features
- Shift+Click widgets now support all 28 themes
- Added widget resizing - drag bottom-right corner to resize
- Smart constraints: min 320x200, max 800x900
- All widgets update instantly when changing themes

---

## Version 2.1.7 (2025-10-05)

### 🎨 Major: Ultimate Theme Overhaul
- Added 10 new black accent themes with unique glow colors
- Total of 28 professional themes across 4 categories
- Enhanced global theme application to all UI elements
- Improved dock styling with accent-colored borders and glows

### 🐛 Bug Fixes
- Fixed theme colors not applying to dock and sidebar
- Fixed crop protection settings not persisting
- Fixed opacity sliders in all window contexts

---

## Version 2.1.6 (2025-10-05)

### ✨ Improvements
- Improved data export/import - now includes all user data
- Optimized weather effects toggle for better performance
- Enhanced settings persistence across browser sessions
- Improved icon display reliability

---

## Version 2.1.0 (2025-10-05)

### 🎨 Major: New Hybrid Dock UI
- Beautiful dock system with horizontal and vertical modes
- Primary tabs always visible, tail group reveals on hover
- Flip toggle to switch orientations
- Smart scrolling in vertical mode with gradient indicators
- Sidebar panels with full features for each tab
- Widget popouts with Shift+Click
- Draggable dock positioning

### ✨ New Features
- **Decor Shop Notifications** - Auto-detect new decor items
- **Enhanced Tile Value Display** - Hover over crops to see values
- **Improved Turtle Timer** - Countdown badge on dock
- **Auto-Compact Mode** - Activates at 95% opacity
- **Smart Version Checker** - Color-coded status indicator

### 🐾 Complete Feature List
- Pet loadout presets (unlimited saves)
- Ability filtering and activity logging
- Seed management with auto-delete
- Real-time value calculations
- Multiple timer systems
- Room status monitoring (Firebase)
- Quick shop access (Alt+B)
- Crop protection (lock by species/mutation)
- Harvest & sell blocking
- Custom hotkey binding
- Theme customization (28 presets)
- Notification system
- Ultra-compact mode
- Widget popouts
- Dual orientation dock

---

## Key Features

### 🐾 Pet Management
- Save unlimited pet loadout presets
- Quick-swap with custom hotkeys
- Real-time hunger timers with color-coded alerts

### ⚡ Ability Tracking
- Real-time ability logs with timestamps
- Notifications for important abilities
- Custom filters and search

### 🌱 Seed Manager
- Auto-delete unwanted seeds
- Track valuable mutations (Rainbow, Frozen, Wet, Chill)
- Watched seed list for collection tracking

### 💎 Value Calculators
- Live crop slot values when hovering
- Turtle timer estimates on growing crops
- Inventory and garden value tracking

### ⏱️ Smart Timers
- Turtle timer with countdown badge
- Shop refresh tracker
- Custom timers with pause/resume

### 🛒 Quick Shop
- Alt+B hotkey for instant access
- Auto-refresh detection
- Stock tracking

### 🔒 Crop Protection
- Lock by species (Pepper, Starweaver, etc.)
- Lock by mutation (Rainbow, Frozen, Wet, Chill)
- Friend bonus protection threshold

### 🔧 Tools & Calculators
- Sell Price Calculator
- Weight Probability Calculator
- Pet Appearance Probability Calculator
- Ability Trigger Time Calculator
- Import Your Garden tool
- Wiki resources

### 🎨 Theme System
- 28 professional themes
- Full custom theme editor
- Adjustable opacity
- 12 gradient styles

---

**Happy Gardening!** 🌱✨
