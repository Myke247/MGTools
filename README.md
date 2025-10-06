# MGTools - Magic Garden Assistant

**Version 2.1.7** | All-in-one assistant for Magic Garden with a beautiful hybrid dock UI

![MGTools](https://img.shields.io/badge/version-2.1.7-blue) ![Status](https://img.shields.io/badge/status-stable-green)

---

## 🎯 What is MGTools?

MGTools is a powerful userscript that enhances your Magic Garden experience with advanced features like pet management, ability tracking, seed automation, value calculators, timers, and much more - all in a sleek, customizable interface.

---

## ✨ Key Features

- 🐾 **Pet Management** - Save unlimited pet loadout presets, quick-swap with hotkeys (Shift+1-5)
- ⚡ **Ability Tracking** - Real-time ability logs, notifications, and custom filters
- 🌱 **Seed Manager** - Auto-delete unwanted seeds, track valuable mutations, bulk actions
- 💎 **Value Calculator** - Live tile value, inventory value, and garden value tracking
- ⏱️ **Smart Timers** - Turtle timer with countdown badge, shop refresh tracker
- 🏠 **Room Monitor** - Firebase integration for real-time room status
- 🛒 **Quick Shop** - Alt+B hotkey for instant seed/egg/decor browsing
- 🔒 **Crop Protection** - Lock crops by species or mutation to prevent accidental harvest
- 🎨 **Theme System** - 8 preset themes plus full customization
- 🔔 **Notifications** - Pet hunger alerts, shop updates, ability events
- ⌨️ **Hotkeys** - Customizable keyboard shortcuts for everything

---

## 📦 Installation

### Method 1: Quick Install (Recommended)

**For Chrome, Edge, Brave, Opera:**

1. Install **[Tampermonkey](https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo)** from Chrome Web Store
2. Click **[Install MGTools](https://github.com/Myke247/MGTools/raw/main/MGTools.user.js)**
3. Tampermonkey will open showing the script - click **Install**
4. Visit **[Magic Garden](https://magiccircle.gg/r/)** - MGTools loads automatically!

**For Firefox:**

1. Install **[Tampermonkey](https://addons.mozilla.org/en-US/firefox/addon/tampermonkey/)** from Firefox Add-ons
2. Click **[Install MGTools](https://github.com/Myke247/MGTools/raw/main/MGTools.user.js)**
3. Tampermonkey will open showing the script - click **Install**
4. Visit **[Magic Garden](https://magiccircle.gg/r/)** - MGTools loads automatically!

**For Safari:**

1. Install **[Tampermonkey](https://apps.apple.com/us/app/tampermonkey/id1482490089)** from App Store
2. Enable the extension in Safari preferences
3. Click **[Install MGTools](https://github.com/Myke247/MGTools/raw/main/MGTools.user.js)**
4. Tampermonkey will open showing the script - click **Install**
5. Visit **[Magic Garden](https://magiccircle.gg/r/)** - MGTools loads automatically!

---

### Method 2: Manual Install (Advanced)

If you're installing from this repository directly:

1. **Install Tampermonkey** (see links above for your browser)

2. **Get the script file:**
   - Download `magicgardenunified.hybrid.user.js` from this repo
   - OR copy the entire script contents

3. **Create new userscript:**
   - Click the **Tampermonkey icon** in your browser toolbar
   - Click **Create a new script**
   - Delete all the example code
   - Paste the MGTools script
   - Press **Ctrl+S** (or Cmd+S on Mac) to save

4. **Verify installation:**
   - Click Tampermonkey icon
   - You should see **"MGTools"** in the list
   - Make sure the toggle is **ON** (green)

5. **Test it:**
   - Visit **[Magic Garden](https://magiccircle.gg/r/)**
   - The dock should appear at the bottom of the screen
   - If not, try refreshing (Ctrl+R or Cmd+R)

---

### Verification Checklist

After installation, verify everything works:

- [ ] Tampermonkey extension is installed and enabled
- [ ] MGTools appears in your Tampermonkey dashboard
- [ ] MGTools is toggled ON (green switch)
- [ ] Dock appears at bottom of screen when you load Magic Garden
- [ ] Clicking dock tabs opens sidebar panels
- [ ] No errors in browser console (F12 → Console tab)

---

### First Time Setup

When you first load Magic Garden with MGTools:

1. **The dock appears** at the bottom of your screen (horizontal layout)
2. **Nothing opens automatically** - the interface stays minimal
3. **Click any tab** to explore features (try 🐾 Pets first!)
4. **Go to ⚙️ Settings** to customize your theme and preferences
5. **Try Shift+Click** on any tab to open a floating widget

**Pro Tip:** Press `Ctrl+H` to see all available hotkeys!

---

## 🎮 How to Use

### The Dock

The **Hybrid Dock** appears at the bottom (horizontal) or left side (vertical) of your screen.

**Primary Tabs** (always visible):
- 🐾 Pets | ✨ Abilities | 🌱 Seeds | 💎 Values | ⏱️ Timers | 🏠 Rooms | 🛒 Shop

**Tail Group** (hover ⋯ to reveal):
- 🔧 Tools | ⚙️ Settings | ⌨️ Hotkeys | 🔒 Protect | 🔔 Notifications | ❓ Help

**Dock Controls:**
- Click **↔️/↕️** button to flip between horizontal/vertical orientation
- **Drag** the dock to move it anywhere on screen
- **Click** any tab to open the sidebar with that feature
- **Shift+Click** any tab to open a floating widget window

### Quick Actions

- **Save Pet Preset**: Go to Pets tab, arrange your pets, click "Save to Slot 1-5"
- **Load Pet Preset**: Click "Load Slot 1-5" or use hotkey **Shift+1** through **Shift+5**
- **Open Shop**: Press **Alt+B** to toggle seed/egg shop sidebars
- **Lock Crops**: Go to Protect tab, check species/mutations you want protected
- **View Values**: Click Values tab to see live tile/inventory/garden worth
- **Set Timers**: Click Timers tab to start turtle timer or add custom timers

### Customization

1. Click **⚙️ Settings** in the tail group
2. Choose from **8 preset themes** (Gaming, Minimal, Vibrant, Dark, Luxury, Steel, Chrome, Titanium)
3. Adjust **opacity sliders** for main HUD and popup windows
4. Toggle **compact mode**, **weather effects**, and other preferences
5. **Export/Import** your data to backup or transfer between browsers

---

## ⌨️ Keyboard Shortcuts

### Tab Navigation
- `Ctrl+1` - Pets tab
- `Ctrl+2` - Abilities tab
- `Ctrl+3` - Seeds tab
- `Ctrl+4` - Values tab
- `Ctrl+5` - Timers tab
- `Ctrl+6` - Rooms tab
- `Ctrl+7` - Shop tab

### Widget Popouts
- `Shift+Ctrl+1-7` - Open floating widget for respective tab

### Quick Actions
- `Alt+B` - Toggle shop sidebars
- `Escape` - Close shop/modals
- `Shift+1-5` - Load pet preset 1-5

### Custom Hotkeys
Configure your own shortcuts in the **⌨️ Hotkeys** tab!

---

## 🎨 Themes

MGTools includes **8 beautiful preset themes**:

1. **Gaming** - Purple/pink gradients with vibrant accents
2. **Minimal** - Clean blue/cyan with subtle effects
3. **Vibrant** - Bold magenta/purple energy
4. **Dark** - Sleek dark mode with blue highlights
5. **Luxury** - Gold/amber elegance
6. **Steel** - Industrial gray/blue
7. **Chrome** - Bright silver/white
8. **Titanium** - Warm metallic tones

**Custom Theme Editor**: Modify colors, gradients, opacity, effects, and more in Settings!

---

## 🔒 Crop Protection

Prevent accidental harvesting of valuable crops:

1. Go to **🔒 Protect** tab
2. **Lock by Species**: Check boxes for Pepper, Starweaver, etc.
3. **Lock by Mutation**: Check boxes for Rainbow, Frozen, Shiny, etc.
4. **Friend Bonus Protection**: Set minimum % before selling is allowed

Locked crops will be highlighted in your garden and cannot be harvested/sold until unlocked.

---

## 🐢 Turtle Timer

The **Turtle Timer** helps you track crop growth:

1. Click **⏱️ Timers** tab
2. Click **Start Turtle Timer** when you plant
3. **Countdown badge** appears on Timers dock icon
4. Get **notifications** at key milestones (100%, 50%, ready)
5. **Pause/Resume** anytime

---

## 💡 Tips & Tricks

- **Start Minimal**: Keep the sidebar closed, only open what you need
- **Use Hotkeys**: Much faster than clicking for frequent actions
- **Save Presets**: Create pet loadouts for farming, PvP, exploration, etc.
- **Watch Seeds**: Mark rare seeds as "watched" to track collection progress
- **Check Version**: Click the version indicator to check for updates

---

## 🎮 Discord Compatibility

MGTools works when playing Magic Garden through **Discord's activity embed**, but with limitations:

**Recommended Setup:**
1. Right-click the game in Discord
2. Click **"Open in Browser"** or **"Pop Out"**
3. MGTools will work perfectly in the new window/tab

**Why?**: Discord's iframe has security restrictions (CORS) that prevent some features from working correctly.

---

## 🆘 Troubleshooting

### UI Not Appearing?
- Make sure your userscript manager is enabled
- Check that the script is active for `magiccircle.gg` or `magicgarden.gg`
- Try refreshing the page (Ctrl+R or Cmd+R)
- Check browser console (F12) for errors

### Features Not Working?
- Ensure you're on the latest version (check Settings tab)
- Try exporting your data, then reinstalling the script
- Clear browser cache and reload

### Shop Not Refreshing?
- Click the **🔄 Refresh** button in the shop sidebar header
- Check notifications are enabled in **🔔 Notifications** tab

### Performance Issues?
- Enable **Production Mode** in Settings (already on by default)
- Reduce opacity to 95%+ to enable auto-compact mode
- Disable weather effects if needed

---

## 📊 Data Export/Import

**Backup Your Data:**
1. Go to **⚙️ Settings** tab
2. Click **Export Settings**
3. Save the `.json` file somewhere safe

**Restore Your Data:**
1. Go to **⚙️ Settings** tab
2. Click **Import Settings**
3. Select your `.json` file
4. All presets, watch lists, and settings restored!

**What's Included:**
- Pet presets (all saved loadouts)
- Seed watch lists
- Auto-delete seed lists
- Custom hotkeys
- Theme settings
- All preferences

---

## 🛠️ Support & Issues

**Found a bug?** Report it here: [GitHub Issues](https://github.com/Myke247/MGTools/issues)

**Need help?** Check the **❓ Help** tab in MGTools for quick tips and guides.

**Want to contribute?** Fork the repo and submit a pull request!

---

## 📝 Changelog

See [CHANGELOG.md](CHANGELOG.md) for detailed version history.

### Latest (v2.1.7)
- Fixed egg shop restock detection
- Added manual refresh button to shops
- Improved settings export/import (now includes all data)
- Enhanced Discord compatibility notes

---

## 📜 License

Open Source - Free to use, modify, and share!

---

## 🎉 Enjoy!

Thanks for using MGTools! May your gardens flourish and your pets stay fed! 🌱✨

**Happy gardening!** 🌻

---

*Made with ❤️ for the Magic Garden community*
