# CLAUDE.MD - Persistent Context Keeper

## ⚠️ BEFORE WE END ANY SESSION - ALWAYS REMIND USER:

**📋 Read `HOW_TO_UPDATE.md` for push instructions!**

The user needs to know how to push updates to GitHub so users get automatic updates. Even if we compact or clear context, ALWAYS show the user these quick steps before ending:

```bash
# Quick Update Steps:
1. Edit MGTools.user.js
2. Change @version number (line 4)
3. Run: git add . && git commit -m "v2.1.9 - description" && git push
4. Done - users get updates automatically!
```

---

## YOUR MISSION
You are working on `MGTools.user.js` (previously `magicgardenunified.hybrid.user.js`). This is the production userscript with theme system, dock UI, and all features.

## CRITICAL RULES (NEVER VIOLATE)

### Rule 1: State Preservation
- **NEVER** change UnifiedState structure or key names
- **NEVER** modify data flow or calculations
- **NEVER** alter timer logic or intervals
- Only change how things are displayed, not what they do

### Rule 2: No Auto-Open
- **NEVER** auto-open panels or windows on page load
- User must explicitly click or use hotkey to open anything
- The dock should appear, but sidebar stays hidden until activated

### Rule 3: Complete Feature Parity
- Every single feature from source must work identically
- If it worked before, it must work after
- Check `parity.json` for feature tracking

### Rule 4: On Session Reset
1. Read this file (CLAUDE.MD) first
2. Check `parity.json` for progress
3. Continue from the first unchecked item
4. Never redo completed work

## CURRENT PROJECT STATE

### Files
- **MAIN FILE**: `MGTools.user.js` - The production userscript (edit this one!)
- **UPDATE GUIDE**: `HOW_TO_UPDATE.md` - Instructions for pushing updates to users
- **CHANGELOG**: `CHANGELOG.md` - Document all changes here
- **TRACKING**: `parity.json` - Feature completion tracking (if exists)

### Key Components to Preserve

#### Core Systems (DO NOT CHANGE LOGIC)
- `UnifiedState` - State management object
- `TimerManager` - Timer heartbeat system
- `globalTimerManager` - Timer instance
- `initializeTurtleTimer()` - Turtle-specific timers
- Value calculation functions
- Firebase room status system
- Storage save/load functions

#### UI Components (CHANGE DISPLAY ONLY)
All tab content generators and handlers:
- Pets (with presets, active display)
- Abilities (with logs, notifications)
- Seeds (with auto-delete, watched list)
- Values (live updates)
- Timers (especially Turtle timers)
- Rooms (Firebase integration)
- Shop (quick shop, Alt+B hotkey)
- Tools, Settings, Hotkeys, Notifications, Help

#### Critical Features

**Turtle Timers MUST**:
- Show countdown in dock badge
- Update max once per second
- Pause/resume correctly
- Match exact time formatting from source
- Trigger notifications at right times

**Crop Hover Tooltips MUST**:
- Inject into same game tooltip container
- Use identical value calculations
- Apply theme-aware styling
- Work in ultra-compact mode
- Not cause layout shift

**Hotkeys MUST**:
- Alt+B opens alternate shop
- All quick-tab shortcuts work
- Ctrl+H clears highlights
- Ctrl+C highlights current crop
- Custom bindings save/load

## NEW UI STRUCTURE

### Dock
- Draggable (horizontal/vertical)
- Primary tabs always visible
- Tail group (Tools/Help/Alerts/Hotkeys/Settings) hidden until hover
- Never overflows viewport
- Scales down when constrained
- Shift+click opens widget popouts

### Sidebar
- Hidden by default (no auto-open)
- Opens when dock item clicked
- Contains tab content
- MGTools tab → shows mgtools-lite card UI
- Master tab → shows full card-style overview

### Widget Popouts
- Triggered by Shift+click on dock items
- Styled like mgtools-widgets.user.js
- Floating, draggable windows
- Compact layout

## QUICK REBUILD RECIPE (After Reset)

1. **Check Progress**
   ```javascript
   // Read parity.json
   const parity = JSON.parse(readFile('parity.json'));
   // Find first pending item
   ```

2. **Restore UI Shell**
   ```javascript
   // Dock creation
   hybridUI.createDock();
   // Sidebar creation
   hybridUI.createSidebar();
   // Wire tab renderers
   ```

3. **Re-attach Handlers**
   ```javascript
   // For each completed tab in parity.json
   setupTabHandlers(tabName);
   ```

4. **Verify Critical Systems**
   - Timer heartbeat running?
   - Firebase connected?
   - Storage working?
   - Hotkeys registered?

## TESTING CHECKLIST

Before marking any feature complete in `parity.json`:

- [ ] Feature works exactly as in source
- [ ] No console errors
- [ ] Event handlers attached
- [ ] Hotkeys work
- [ ] Settings persist
- [ ] Theme/compact mode applies
- [ ] Performance acceptable

## COMMIT DISCIPLINE

Make commits per subsystem:
- "Dock implementation"
- "Sidebar wiring"
- "Pets tab migration"
- "Timer system preservation"
- "Hotkey registration"

Reference parity.json items in commit messages.

## IF STUCK

1. **Selector not binding?**
   - Check if UI context changed
   - Use new panel root for queries
   - Don't modify the selector logic

2. **Feature not working?**
   - Compare with source file
   - Check if handler was attached
   - Verify state is connected

3. **Timer/notification issues?**
   - Never modify timing logic
   - Check if intervals are running
   - Verify dock badge updates

## DONE MEANS

✅ Every checkbox in `parity.json` is checked
✅ All automated tests pass
✅ No console errors in production mode
✅ User can access every feature
✅ Performance is smooth (60 FPS)
✅ Dock never overflows viewport
✅ Nothing auto-opens
✅ All hotkeys work

## REMEMBER

You are changing the clothes, not the person. The UI is new, but everything underneath works exactly the same. When in doubt, preserve the original behavior.