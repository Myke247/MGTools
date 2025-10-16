# Changelog - MGTools

## Version 3.8.2 (2025-10-16)

**Bug Fixes:**
- Fixed first feed button click not working after page load
  - Feed buttons now wait for game state to be ready
  - Visual indicator shows when buttons are loading
- Fixed shop UI decrementing when purchases fail
  - Added validation for item stack caps (WateringCan max: 99)
  - Shop UI now only updates after successful purchases
  - Proper error messages for inventory full and at-cap scenarios

**New Features:**
- Added "Hide feed buttons" setting
  - Toggle visibility of instant feed buttons in Settings > Pet Interface
  - Changes apply immediately without page reload
- Added Sort Inventory button
  - Appears next to "CLEAR FILTERS" in inventory
  - Click to sort items (pets first by rarity, then alphabetically)
  - Shift+Click to sort pets by XP instead of rarity
  - First 9 hotbar items stay fixed

**Improvements:**
- Better error handling for shop purchases
- Enhanced feed button initialization reliability
- Clearer visual feedback for button states

---

## Version 3.8.1 (2025-10-14)

**New Features:**
- Enhanced room tracking for better connectivity monitoring
- Improved pet feeding system reliability
- Smart performance optimizations

**Improvements:**
- Better status polling efficiency
- Optimized bandwidth usage
- Enhanced game connection detection

---

## Version 3.8.0 (2025-10-13)

**New Features:**
- Instant pet feed buttons for quick feeding
- Smart crop selection system
- One-click feeding integration

**Quality of Life:**
- Visual feedback for actions
- Automatic button positioning
- Seamless inventory integration

---

## Version 3.9.0 (2025-10-13)

**Advanced Protection Systems:**
- Decor Protection - Lock decor items to prevent accidental pickup
  - Supports all 20 decor types (benches, arches, lamp posts, etc.)
  - Works for both Garden and Boardwalk tiles
  - All decor unlocked by default

- Pet Protection - Lock valuable pets with rare abilities
  - Lock pets with Gold Granter ability
  - Lock pets with Rainbow Granter ability
  - Protection persists across sessions

**Enhanced Mutation Support:**
- Added 4 new mutation types to protection systems:
  - Dawnlit - Dawn celestial mutation
  - Amberlit - Amber celestial mutation
  - Dawnbound - Dawn charged mutation
  - Amberbound - Amber charged mutation
- Now supports all 9 crop mutations in the game

**How Protection Works:**
- Access Protect tab in MGTools
- Select items or abilities you want to protect
- Locked items cannot be picked up or sold until unlocked
- Settings automatically save and persist

---

## Version 3.7.8 (2025-10-13)

**New Features:**
- Pet preset cycling hotkey
- Automatic game update detection

**Improvements:**
- Enhanced ability log reliability
- Improved ability detection system
- Better data persistence

---

## Version 3.7.6 (2025-10-12)

**Improvements:**
- Enhanced room management features
- Better search functionality
- UI polish and bug fixes

---

For installation and full feature list, see [README](README.md)
