# Changelog - MGTools

## Version 2.2.4 (2025-10-06)

### 🐛 **Bug Fixes**
- **Fixed slot tile value positioning** - Values now display properly centered in crop tooltips
  - Changed from CSS attribute selectors to inline styles for reliable positioning
  - Added explicit styles: display:block, marginTop:2px, fontWeight:600, fontSize:12px
  - Color: #FFD700 (gold) for slot values, lime for turtle timer
  - Fixed both slot value and turtle timer estimate positioning
- **Enhanced turtle timer debugging** - Better error handling and diagnostic logging
  - Added try-catch error handling with detailed logging
  - Added validation checks for crops, pets, and turtle expectations
  - Debug mode logging for troubleshooting timer display issues
  - Handles edge cases where crops are mature (returns null correctly)
- **Fixed ability trigger false positives** - Reduced duplicate ability logs on page refresh
  - Added 10-second time buffer to prevent rapid duplicate triggers
  - Better validation to prevent false triggers on page reload
  - Improved timestamp comparison logic with debug logging
- **Fixed theme color initialization** - All theme presets now apply correctly on page load
  - Fixed bug where non-black themes weren't applied to dock on creation
  - Added gradient theme application for all theme types (not just black themes)
  - Themes now properly applied 100ms after dock creation
  - All gradient presets (blue-purple, red-orange, etc.) work correctly

### ✨ **Improvements**
- **Better positioning consistency** - Inline styles ensure tooltips render correctly across all scenarios
- **Enhanced error handling** - Turtle timer won't break if data is missing
- **Reduced false triggers** - Ability notifications more accurate with time-based validation
- **Complete theme support** - All 30+ theme options now work properly

---

## Version 2.2.1 (2025-10-06)

### 🐛 **Critical Bug Fixes**
- **Fixed shop quantity tracking** - Stock counts now update correctly for both shop UI and in-game purchases
  - Added purchase message interception via `sendMessage` hook
  - Tracks all purchases (shop UI and in-game) in real-time
  - Purchase tracker persists across page refreshes using localStorage
  - Quantities stay synchronized between shop UI and in-game shop
  - Resets properly on shop restock
- **Fixed tooltip alignment issues** - Slot values and turtle timers now display centered
  - Removed emoji from slot value display (clean numbers only)
  - Simplified tooltip styling to inherit from game's native tooltips
  - Fixed CSS rules for proper centering

### ✨ **Improvements**
- **Shop purchase persistence** - Purchase counts survive page refresh
  - Uses `MGA_purchaseTracker` storage key
  - Automatically saves after each purchase
  - Clears on shop restock for fresh cycle

## Version 2.2.0 (2025-10-06)

### 🐛 **Critical Bug Fixes**
- **Fixed widget popout resize issue** - Content now properly scales when resizing widgets
  - Changed `.mgh-popout` to use flexbox layout with height control
  - Changed `.mgh-popout-body` to use `flex: 1` instead of fixed height
  - Added `min-height: 0` for proper flexbox overflow behavior
  - Widgets now resize smoothly without cutting off content
- **Fixed tile value display centering (Final Fix - 7th Attempt)** - Using CSS with attribute selector
  - Inline styles with !important weren't working - game CSS still overrode them
  - Solution: Injected CSS rule with `[data-slot-value="true"]` attribute selector
  - CSS has all properties with !important and high specificity
  - Removed inline styles entirely - CSS handles all styling
  - No emoji - clean number display (e.g. "8,889,052,188")

### ✨ **Improvements**
- **Shop UI display fixed** - Now shows stock using initialStock
  - Uses `item.initialStock` from game's inventory to display stock
  - Stock displays correctly and refreshes on restock
  - Note: Stock counts reset on restock but don't sync with individual purchases
  - Both seed shop and egg shop display stock properly
- **Improved shop restock detection (Major Upgrade)** - Pattern-based detection method
  - Changed from `initialStock` comparison to pattern-based `secondsUntilRestock` monitoring
  - Detects restock by timer pattern: decreasing → suddenly increasing (+2s threshold)
  - More intuitive logic: countdown reverses direction = restock happened
  - No arbitrary constants - uses natural pattern recognition
  - Reduced delay from 1500ms to 500ms for faster UI response
  - Reduced polling interval from 5000ms to 2000ms for better responsiveness
  - Works universally regardless of timer duration (future-proof)
  - Eliminates rare reports of missing eggs after restock

### 🔧 **Technical Details**
- Modified CSS at lines 876-915 for flexbox-based widget layout
- Updated `insertTurtleEstimate()` at lines 18395-18403 - minimal element creation
  - Only sets `data-slot-value="true"` attribute and text content
  - All styling handled by CSS rule at lines 21197-21208
  - Attribute selector `[data-slot-value="true"]` with !important forces centering
- Added CSS injection at lines 21190-21212
  - Injects `[data-slot-value="true"]` selector with all styling properties
  - Uses !important on all properties to override game CSS
- Fixed shop stock display at lines 8447-8474 (`getItemStock` function)
  - Uses `item.initialStock` to display stock
  - Shows available items correctly
  - Limitation: doesn't track individual purchases, only shows initial stock until restock
- Replaced shop restock detection at lines 8279-8332 with pattern-based method
  - Tracks `timerWasDecreasing` state to detect countdown reversal
  - Uses simple +2 second threshold to filter network jitter
  - No arbitrary constants - pure pattern logic
- All fixes are isolated to presentation layer - no changes to core logic or state management

---

## Version 2.1.9 (2025-10-05)

### 🐛 **Bug Fixes**
- **Fixed widget dragging issue** - Widgets now drag properly with content attached
- **Fixed widget theme rendering** - Reordered operations so theme applies after content renders
- **Fixed widget body transparency** - Content background now shows widget theme correctly

### ✨ **NEW: Widget Theme Support & Resizing**

#### 🎨 **Shift+Click Widgets Now Themed**
- **All 28 themes** now apply to shift+click popout widgets
- **Black accent themes** show vibrant borders and glows on widgets
- **Regular themes** apply full gradient backgrounds to widgets
- **Effect styles** (Neon, Metallic, Crystal, etc.) enhance widget appearance
- **Dynamic updates** - Change theme and all open widgets update instantly

#### 📏 **Widget Resizing**
- **Drag to resize** - Grab bottom-right corner to resize any widget
- **Smart constraints**:
  - Minimum: 320x200 (keeps content readable)
  - Maximum: 800x900 (prevents screen overflow)
- **Visual feedback** - Resize handle appears on hover
- **Smooth performance** - Hardware-accelerated with requestAnimationFrame

#### 🔧 **Technical Improvements**
- Added widget tracking system to `UnifiedState.data.popouts.widgets`
- Created `applyThemeToPopoutWidget()` for widget-specific theming
- Integrated widgets into `syncThemeToAllWindows()` theme sync
- Widgets use existing `makeElementResizable()` system
- Proper cleanup when widgets close (no memory leaks)

### 🎯 **How to Use**
1. **Shift+Click** any dock icon to open a floating widget
2. **Hover bottom-right corner** to see resize handle
3. **Drag corner** to resize widget to your preferred size
4. **Change themes** in Settings - all widgets update automatically!

---

## Version 2.1.7 (2025-10-05)

### 🎨 **MAJOR: Ultimate Theme Overhaul**

#### ⚫ **10 New Black Accent Themes**
- **Midnight Crimson** - Pure black with blood red accents
- **Shadow Emerald** - Deep black with emerald green glow
- **Void Royal** - Black with royal purple highlights
- **Obsidian Gold** - Black with golden accents
- **Carbon Ice** - Black with icy blue cyan
- **Inferno Black** - Black with orange flame
- **Toxic Shadow** - Shadow black with toxic green
- **Noir Pink** - Jet black with hot pink
- **Matrix Black** - Hacker black with matrix green
- **Eclipse Sunset** - Night black with sunset gradient

#### ✨ **Enhanced Theme System**
- **Accent Color System**: Each black theme has unique accent colors for borders, glows, and UI elements
- **Global Theme Application**: Themes now apply to dock, sidebar, overlays, and all windows
- **Organized Theme Categories**:
  - ⚫ Black Accent Themes (10)
  - 🌈 Classic Themes (5)
  - ✨ Vibrant Themes (9)
  - 🛡️ Metallic Themes (4)
- **28 Total Professional Themes** to choose from!

#### 🎯 **Component-Specific Styling**
- **Dock**: Accent-colored borders and glows for black themes
  - Interactive hover effects with accent highlights
  - Active state indicators
  - Smooth transitions on all elements

- **Sidebar**: Solid black backgrounds with vibrant accents
  - Accent gradient headers
  - Styled sections with subtle accent backgrounds
  - Accent-colored buttons with glow effects
  - Accent borders on inputs (glow on focus)
  - Accent-colored scrollbars

- **Overlays**: Enhanced with accent borders and glows

#### 🔧 **Technical Improvements**
- Accent color mapping system for all black themes
- Dynamic style injection for scrollbars
- Improved event handling with named functions
- Conditional styling (only applies to black themes)
- Hardware-accelerated transitions

### 🐛 **Bug Fixes**
- **Fixed theme colors not applying to dock and sidebar** - Removed early return in `applyTheme()` that prevented themes from being applied
- **Fixed CSS specificity issues** - Removed all `!important` flags that were breaking game elements
- **Fixed selector scope** - Changed from broad selectors to specific `.mga-` prefixed classes to avoid affecting game UI
- **Fixed hardcoded backgrounds** - Themes now properly override default CSS with dynamic inline styles
- **Fixed performance issues** - Replaced hundreds of event listeners with single CSS injection for better FPS
- **Fixed crop protection settings** - Protection settings now persist correctly on reload
- **Fixed opacity sliders** - Opacity controls now work in all window contexts
- **Improved theme synchronization** - All components (dock, sidebar, overlays) update instantly when theme changes

---

## Version 2.1.6 (2025-10-05)

### 🎯 Enhancements

- **Improved Data Export/Import System**
  - Export and import now includes all user data (pet presets, seed watch lists, and custom settings)
  - Full data portability across different browsers or installations
  - Preserves complete user configuration and preferences in a single file

- **Optimized Weather Effects Toggle**
  - Streamlined weather hiding system for better performance
  - Removed heavy background monitoring overhead
  - Smoother experience when toggling weather effects on/off

- **Enhanced Settings Persistence**
  - Weather effects setting now properly reflects saved state on page load
  - Improved setting synchronization across browser sessions
  - More reliable state restoration when script initializes

- **Icon Display Reliability**
  - Added automatic fallback for dock icons
  - Ensures shop and pet icons always display correctly
  - Better cross-browser compatibility for icon rendering

### 🔧 Technical Improvements

- Simplified weather canvas management
- Reduced DOM observation overhead for better FPS
- Improved data structure handling in import/export operations

---

## Version 2.1.0

## 🎨 New Hybrid Dock UI

### Modern Interface Design
- **Sleek Dock System**: Beautiful hybrid dock that can flip between horizontal (bottom) and vertical (left side) modes
- **Smart Layout**:
  - Primary tabs always visible: Pets 🐾 | Abilities ✨ | Seeds 🌱 | Values 💎 | Timers ⏱️ | Rooms 🏠 | Shop 🛒
  - Tail group (hover to reveal): Tools 🔧 | Settings ⚙️ | Hotkeys ⌨️ | Protect 🔒 | Notifications 🔔 | Help ❓
- **Flip Toggle**: Click the ↔️/↕️ button to switch between horizontal and vertical orientations
- **Position Memory**: Remembers your preferred orientation and position

### Vertical Mode Enhancements
- **Smart Scrolling**: Dock automatically scrolls when content exceeds screen height
- **Gradient Indicators**: Subtle shadows show when there's more content to scroll
- **Optimized Size**: Compact 40px items with 24px icons for maximum screen space
- **Custom Scrollbar**: Slim, elegant scrollbar that appears only when needed

### Interactive Features
- **Sidebar Panels**: Click any dock item to open detailed sidebar with full features
- **Widget Popouts**: Shift+Click any dock item to open floating widget window
- **Drag & Drop**: Drag the dock anywhere on screen (avoid clicking on tab icons)
- **No Auto-Open**: Clean start - nothing opens until you click (sidebar stays hidden on load)

---

## 🆕 New Features

### 📦 Decor Shop Notifications
- **Auto-Detection**: Instantly notified when new decor items appear in shop
- **Real-Time Monitoring**: Watches shop inventory changes automatically
- **Toast Alerts**: Clean notification popups with item details

### 💰 Enhanced Tile Value Display
- **Hover Values**: See exact crop value when hovering over plants in your garden
- **Live Calculations**: Real-time updates based on:
  - Species and mutations
  - Friend bonus multiplier
  - Crop scale
- **Theme-Matched**: Tooltip styling matches your current MGTools theme

### 🐢 Improved Turtle Timer
- **Dock Badge**: Countdown timer displayed right on the dock
- **Smart Notifications**: Alerts at key growth milestones
- **Accurate Tracking**: Precise time-to-harvest calculations
- **Pause/Resume**: Proper state management for timer controls

### 🎯 Auto-Compact Mode
- **Smart Activation**: Automatically enables compact mode when opacity reaches 95%
- **Clean UI**: Helps maintain crisp interface at high opacity levels
- **Seamless**: Activates/deactivates automatically based on opacity slider

### 🔄 Smart Version Checker
- **Visual Status Indicator**: Color-coded version dot shows update status
  - 🟢 **Green**: You're up to date!
  - 🟡 **Yellow**: Development version (you're ahead of releases)
  - 🔴 **Red**: Update available on GitHub
  - 🟠 **Orange**: Version check failed (network issue)
- **Click to Refresh**: Manual check anytime
- **Shift+Click**: Opens GitHub release page
- **Tooltip Info**: Hover for detailed version information

---

## ✨ All Features (Fully Functional)

### 🐾 Pet Management
- **Loadout Presets**: Save unlimited pet configurations
- **Quick Load**: Shift+1 through Shift+5 for instant preset loading
- **Active Display**: See current pets with hunger timers
- **Easy Swapping**: Click to save/load presets with visual interface

### ⚡ Ability System
- **Smart Filtering**: Filter by category, pet species, or individual abilities
- **Activity Logs**: Real-time ability activation tracking
- **Notifications**: Alert system for important ability events
- **Custom Rules**: Configure which abilities to monitor

### 🌱 Seed Manager
- **Auto-Delete**: Mark seeds for automatic deletion
- **Value Calculator**: See total value of selected seeds
- **Watched List**: Track specific seeds you're collecting
- **Bulk Actions**: Select multiple seeds at once

### 💎 Value Tracking
- **Three Metrics**:
  - Tile Value: Worth of crops currently growing
  - Inventory Value: All produce in your inventory
  - Garden Value: Ready-to-harvest crops
- **Live Updates**: Values refresh automatically as you play
- **Friend Bonus**: Calculations include current multiplier

### ⏱️ Timers
- **Turtle Timer**: Crop growth countdown with notifications
- **Shop Refresh**: Track when shops update
- **Ability Cooldowns**: Monitor ability timers
- **Custom Timers**: Add your own tracked events

### 🏠 Room Status
- **Firebase Integration**: Real-time room state monitoring
- **Quick Join**: Easy access to active rooms
- **Status Display**: See room activity at a glance

### 🛒 Quick Shop
- **Alt+B Hotkey**: Instant shop toggle
- **Seed Browser**: View all available seeds
- **Egg Browser**: Browse pet eggs
- **Decor Browser**: Check decoration items
- **Stock Status**: See what's in inventory

### 🔒 Crop Protection
- **Lock by Species**: Protect specific crop types (e.g., Pepper, Starweaver)
- **Lock by Mutation**: Protect valuable mutations (Rainbow, Frozen)
- **Harvest Blocking**: Prevents accidental harvesting of locked crops
- **Sell Protection**: Set minimum friend bonus threshold before selling
- **Easy Toggle**: Checkbox interface for quick lock/unlock

### 🎨 Theme Customization
- **8 Preset Themes**: Gaming, Minimal, Vibrant, Dark, Luxury, Steel, Chrome, Titanium
- **Dual Opacity**: Separate opacity for main HUD and popout windows
- **Gradient Styles**: Multiple gradient options
- **Effect Styles**: Glass, Neon, Metallic, Steel, Chrome, Titanium
- **Custom Colors**: Full theme personalization

### 🔔 Notification System
- **Pet Hunger Alerts**: Warning before pets get hungry
- **Ability Notifications**: Track ability activations
- **Shop Updates**: New item alerts
- **Timer Alerts**: Countdown completion notices
- **Customizable**: Choose which notifications to enable

---

## ⌨️ Keyboard Shortcuts

### Tab Navigation
- `Ctrl+1`: Pets tab
- `Ctrl+2`: Abilities tab
- `Ctrl+3`: Seeds tab
- `Ctrl+4`: Values tab
- `Ctrl+5`: Timers tab
- `Ctrl+6`: Rooms tab
- `Ctrl+7`: Shop tab

### Widget Popouts
- `Shift+Ctrl+1-7`: Open floating widget for respective tab
- Press again to close widget

### Quick Actions
- `Alt+B`: Toggle shop sidebars
- `Escape`: Close shop/modals
- `Shift+1-5`: Load pet preset 1-5

### Custom Hotkeys
- Configure your own keyboard shortcuts in the Hotkeys tab
- Bind any action to any key combination

---

## 🎮 How to Use the New UI

### Getting Started
1. **Load the Script**: MGTools dock appears at bottom of screen (horizontal mode)
2. **Explore Tabs**: Click any icon to open sidebar with that feature
3. **Try Widgets**: Shift+Click any tab for floating widget window
4. **Flip Orientation**: Click ↔️/↕️ to switch horizontal/vertical layout
5. **Customize**: Access Settings tab for themes, opacity, and preferences

### Tips & Tricks
- **Drag to Move**: Click empty space on dock to drag it around
- **Tail Group**: Hover over ⋯ icon to reveal Tools/Settings/Help tabs
- **Close Sidebar**: Click × button or click outside sidebar to close
- **Widget Freedom**: Popout widgets are draggable and can be minimized
- **Screen Space**: Use vertical mode on wide monitors, horizontal on tall screens

### Best Practices
- **Start Minimal**: Begin with sidebar closed, open only what you need
- **Use Hotkeys**: Faster than clicking for frequent actions
- **Save Presets**: Create pet loadouts for different activities
- **Lock Valuable Crops**: Protect rare mutations from accidental harvest
- **Check Notifications**: Enable alerts for events you care about

---

## 📊 Feature Highlights

### Complete Feature List
✅ Pet loadout presets (unlimited saves)
✅ Ability filtering and activity logging
✅ Seed management with auto-delete
✅ Real-time value calculations
✅ Multiple timer systems
✅ Room status monitoring (Firebase)
✅ Quick shop access (Alt+B)
✅ Crop protection (lock/unlock)
✅ Harvest & sell blocking
✅ Custom hotkey binding
✅ Theme customization (8 presets)
✅ Notification system
✅ Ultra-compact mode
✅ Widget popouts
✅ Dual orientation dock

### Performance
- **Optimized**: Production mode enabled for maximum FPS
- **Efficient**: Smart updates only when data changes
- **Responsive**: Works smoothly even with all features active
- **Compatible**: Discord overlay, all userscript managers

---

## 🚀 Installation & Compatibility

### Requirements
- **Browser**: Chrome, Firefox, Edge, or any Chromium-based browser
- **Extension**: Tampermonkey, Violentmonkey, or Greasemonkey
- **Game**: Magic Garden (magiccircle.gg/magicgarden.gg)

### First Time Setup
1. Install userscript manager extension
2. Install MGTools script
3. Visit Magic Garden
4. Dock appears automatically at bottom of screen
5. Click any tab to begin!

### Discord Compatibility
- ✅ Works in Discord game overlay
- ✅ All features functional
- ✅ Optimized for overlay performance

---

**Version**: 2.1.6
**Release**: 2025
**Platform**: Magic Garden / Magic Circle
**Support**: GitHub Issues
**License**: Open Source

---

*Enjoy the new UI! All your previous data, presets, and settings are preserved.* 🎉