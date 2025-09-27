# MGTools
Magic Garden Quality of Life Tools
🌱 MGTools - Magic Garden Unified Assistant

  The ultimate all-in-one tool for Magic Garden by Magic Circle

  MGTools is a comprehensive userscript that enhances your Magic Garden
  experience with powerful automation, management tools, and
  quality-of-life improvements.

  ---
  📥 Installation

  Method 1: Tampermonkey (Recommended)

  1. Install Tampermonkey browser extension
  2. Click "Create New Script"
  3. Replace all content with the MGTools script
  4. Save (Ctrl+S) and refresh Magic Garden
  5. Look for the floating icon in the top-right corner

  Method 2: Browser Console (Temporary)

  1. Open Magic Garden in your browser
  2. Press F12 to open Developer Tools
  3. Go to Console tab
  4. Paste the entire script and press Enter
  5. The tool will activate immediately

  Note: Console method resets when you refresh the page

  ---
  🎮 Getting Started

  First Launch

  - Floating Icon: Look for a draggable circular icon in the top-right
  corner
  - Drag & Drop: Click and drag the icon anywhere on screen for better
  positioning
  - Click to Open: Click the icon to open the main control panel
  - Keyboard Shortcut: Press Alt+H to toggle the panel visibility

  ---
  🛠️ Core Features

  🐾 Pet Loadout Management

  Quickly save and switch between different pet configurations

  - Save Loadouts: Create up to 5 custom pet loadout presets
  - One-Click Switching: Instantly change your entire pet lineup
  - Popup Windows: Open pet management in separate, resizable windows
  - Keyboard Shortcuts: Alt+1 through Alt+5 for quick preset loading

  How to Use:
  1. Set up your pets in Magic Garden normally
  2. Open MGTools → Pets tab
  3. Click "Save Current Loadout" and give it a name
  4. Repeat for different configurations
  5. Click preset buttons to instantly switch between setups

  ---
  📊 Values & Calculator

  Real-time tracking of your resources and calculations

  - Live Inventory: Monitor seeds, items, and resources
  - Friend Bonus: Track multiplier effects
  - Crop Values: Calculate optimal planting strategies
  - Auto-Update: Values refresh automatically as you play

  Features:
  - Current crop status and growth timers
  - Resource calculations with friend bonuses
  - Compact mode for minimal screen space
  - Export data for external analysis

  ---
  🎯 Ability Log Tracker

  Never miss another pet ability activation

  - Real-Time Logging: Tracks all pet ability uses automatically
  - Timestamped Records: See exactly when abilities were used
  - Filterable History: Search and filter by pet or ability type
  - Popup Window: View logs in a separate window while playing

  Abilities Tracked:
  - Seed Finder activations
  - Growth accelerators
  - Resource multipliers
  - Special pet effects

  ---
  🌱 Crop Highlighting System

  Visually highlight specific crops in your garden

  The crop highlighting system helps you focus on specific crops by
  making your target species stand out while shrinking others.

  🚀 Quick Start (Automatic Mode)

  Press Ctrl+C while in your garden:
  - Automatically highlights whatever crop you currently have selected
  - Press Ctrl+C again on the same crop to clear highlights
  - Press Ctrl+C with different crops to switch highlighting
  - Works instantly without any setup!

  🎛️ Manual Mode (Advanced Control)

  1. Open MGTools → Settings tab
  2. Scroll to "🌱 Crop Highlighting" section
  3. Configure your settings:

  Settings Explained:
  - Highlight Species: The crop you want to stand out (stays normal)
  - Slot Index: Which growth slot to check (usually 0)
  - Hidden Species: What other crops appear as (recommend "Carrot")
  - Hidden Scale: How small other crops become (0.1 = 10% size)

  Example Settings:
  Highlight Species: "Aloe"     ← Aloe stays normal size
  Slot Index: 0                 ← Check first growth slot
  Hidden Species: "Carrot"      ← Others appear as tiny carrots
  Hidden Scale: 0.1             ← Others shrink to 10% size

  4. Click "Apply Highlighting"

  👀 What You'll See

  - ✅ Target crops (e.g., Aloe): Normal size, original appearance
  - ❌ Other crops: Tiny carrots at 10% size
  - Result: Your target species dominates the visual landscape

  🧹 Clearing Highlights

  - Press Ctrl+H to clear all highlights
  - Use console: MGA_CropDebug.clear()
  - Settings UI: Click "Clear Highlighting" button

  🔧 Troubleshooting

  If highlighting isn't working, try these console commands:
  // Check if everything is working
  MGA_CropDebug.checkFunctions()

  // See what crops you have
  MGA_CropDebug.listAvailableSpecies()

  // Test highlighting a specific species
  MGA_CropDebug.testHighlight("Aloe")

  // Force refresh if needed
  MGA_CropDebug.strongRefresh()

  // Enable detailed logging
  MGA_CropDebug.enableDebugMode()

  ---
  🚀 Teleportation System

  Instantly travel to other players in multiplayer

  - Alt+1 through Alt+6: Teleport to player slots 1-6
  - Dual Method: Updates both your local position and server sync
  - Console Feedback: Shows success/failure for each teleport attempt
  - Automatic Detection: Finds available player positions dynamically

  How to Use:
  1. Join a multiplayer room with other players
  2. Press Alt+1 to teleport to player slot 1
  3. Press Alt+2 for player slot 2, etc.
  4. Check console for teleport status messages

  ---
  ⏱️ Timer System

  Track important game timers and events

  - Restock Timers: Monitor shop restocks
  - Event Timers: Track special events and bonuses
  - Growth Timers: See when crops will be ready
  - Custom Timers: Set your own reminders

  ---
  🗂️ Seed Management

  Organize and bulk-delete unwanted seeds

  - Bulk Operations: Select multiple seeds for deletion
  - Filter System: Find specific seed types quickly
  - Auto-Delete: Set rules for automatic seed cleanup
  - Undo Protection: Confirmation dialogs prevent accidents

  ---
  ⌨️ Keyboard Shortcuts

  | Shortcut     | Function                        |
  |--------------|---------------------------------|
  | Alt+H        | Toggle main panel visibility    |
  | Alt+V        | Switch to Values tab            |
  | Alt+P        | Switch to Pets tab              |
  | Alt+A        | Switch to Ability Logs tab      |
  | Alt+T        | Switch to Timers tab            |
  | Alt+1-5      | Load pet loadout presets 1-5    |
  | Alt+1-6      | Teleport to player slots 1-6    |
  | Ctrl+C       | Auto-highlight current crop     |
  | Ctrl+H       | Clear all crop highlights       |
  | Ctrl+Shift+H | Open crop highlighting settings |
  | Escape       | Close current popup/panel       |

  ---
  🎨 Customization

  Themes & Appearance

  - Multiple Themes: Dark, light, and custom color schemes
  - Compact Mode: Minimal UI for small screens
  - Opacity Control: Adjust transparency for gameplay visibility
  - Position Saving: Panel positions remember between sessions

  UI Layout

  - Draggable Panels: Move any window to your preferred position
  - Resizable Windows: Adjust popup window sizes
  - Tab System: Organized feature categories
  - Responsive Design: Adapts to different screen sizes

  ---
  🔧 Advanced Features

  Debug Mode

  Enable detailed logging for troubleshooting:
  MGA_CropDebug.enableDebugMode()

  Data Export

  Export your game data for analysis:
  - Pet configurations
  - Ability logs
  - Resource tracking
  - Timer history

  API Access

  Advanced users can access MGTools functions directly:
  // Main API object
  window.MGA

  // Crop highlighting tools
  window.MGA_CropDebug

  // Direct function access
  window.debugCropHighlighting()
  window.applyCropHighlighting()

  ---
  🎯 Pro Tips

  Efficiency Workflows

  1. Set up pet loadouts for different activities (farming, exploring,
  idle)
  2. Use crop highlighting when managing specific crop types
  3. Monitor ability logs to optimize pet ability timing
  4. Pin the panel in a corner for quick access
  5. Use keyboard shortcuts for rapid switching

  Multiplayer Tips

  - Teleport hotkeys make following other players effortless
  - Share loadout configurations with your team
  - Coordinate crop highlighting for group farming strategies

  Resource Management

  - Watch restock timers to never miss shop updates
  - Track friend bonuses for optimal trading windows
  - Use value calculator for investment decisions

  ---
  🐛 Troubleshooting

  Common Issues

  Panel Not Appearing:
  - Press Alt+H to toggle visibility
  - Check console for error messages
  - Refresh page and reload script

  Crop Highlighting Not Working:
  - Run MGA_CropDebug.checkFunctions() in console
  - Enable debug mode with MGA_CropDebug.enableDebugMode()
  - Try force refresh with MGA_CropDebug.strongRefresh()

  Teleportation Failing:
  - Ensure you're in a multiplayer room
  - Check console for specific error messages
  - Try different player slots (some may be empty)

  Pet Loadouts Not Saving:
  - Verify you have pets equipped before saving
  - Check browser storage permissions
  - Try clearing and re-creating loadouts

  Getting Help

  1. Check console messages (F12 → Console tab)
  2. Enable debug mode for detailed logging
  3. Report issues with console output and steps to reproduce

  ---
  🔄 Updates & Compatibility

  Game Compatibility

  - Domains: Works on all Magic Garden domains
    - magicgarden.gg/r/
    - magiccircle.gg/r/
    - starweaver.org/r/
  - Browser Support: Chrome, Firefox, Edge, Safari
  - Mobile: Limited support on mobile browsers

  Auto-Updates

  - Tampermonkey: Check for updates in Tampermonkey dashboard
  - Manual: Replace script content with newer versions
  - Backwards Compatible: Settings preserved across updates

  ---
  ⚠️ Important Notes

  Fair Play

  - No Automation: MGTools enhances gameplay but doesn't automate actions
  - Client-Side Only: All processing happens in your browser
  - No Cheating: Follows game rules and doesn't exploit mechanics

  Privacy & Security

  - Local Storage: All data stays on your device
  - No External Requests: No data sent to external servers
  - Open Source: Code is fully visible and auditable

  Performance

  - Lightweight: Minimal impact on game performance
  - Efficient: Smart updating reduces resource usage
  - Optional Features: Disable unused features to optimize

  ---
  🎉 Conclusion

  MGTools transforms your Magic Garden experience with powerful
  management tools, automation helpers, and quality-of-life improvements.
   Whether you're a casual player or hardcore optimizer, MGTools adapts
  to your playstyle and helps you get the most out of your magical
  gardening adventure!

  Happy Gardening! 🌱✨

  ---
  MGTools is an independent project not affiliated with Magic Circle. Use
   responsibly and respect the game's terms of service.
