# SONNET EXECUTION PROMPT - MagicGardenUnified UI Migration

## CRITICAL CONTEXT
You are migrating the UI of `magicgardenunified.user.js` to the Hybrid Dock style from `mgtools-hybrid-final-v2.user.js`. This is a UI-only migration - ALL business logic, state management, and functionality must be preserved exactly.

## PRIMARY DIRECTIVE
1. Read `CLAUDE.MD` first if it exists - it contains critical persistent context
2. Check `parity.json` for progress tracking
3. Never alter UnifiedState structure or key names
4. Preserve 100% functionality - UI changes only
5. If session resets, re-read CLAUDE.MD and continue from last checkpoint

## SOURCE FILES
- **SOURCE**: `magicgardenunified.user.js` - The fully functional script (DO NOT alter logic)
- **TARGET STYLE**: `mgtools-hybrid-final-v2.user.js` - The hybrid dock UI to implement
- **CARD UI**: `mgtools-lite.user.js` - Card layout for MGTools/Master tabs
- **WIDGET STYLE**: `mgtools-widgets.user.js` - Popout widget appearance

## PHASE-BY-PHASE EXECUTION

### PHASE 0: Setup & Verification
```javascript
// 1. Create backup
// Copy magicgardenunified.user.js → backup/magicgardenunified.user.js

// 2. Create working file
// Copy magicgardenunified.user.js → magicgardenunified.hybrid.user.js

// 3. Verify state structure remains unchanged
// UnifiedState must keep exact same shape
```

### PHASE 1: Feature Inventory & Parity Tracking
Create `parity.json` with complete feature checklist:

```json
{
  "core_systems": {
    "unified_state": { "status": "pending", "notes": "No structural changes allowed" },
    "timer_manager": { "status": "pending", "notes": "Heartbeat must remain unchanged" },
    "values_manager": { "status": "pending", "notes": "Tile/inventory/garden calculations" },
    "storage_system": { "status": "pending", "notes": "localStorage + GM storage" }
  },
  "ui_components": {
    "tabs": {
      "pets": { "status": "pending", "presets": true, "active_display": true },
      "abilities": { "status": "pending", "logs": true, "notifications": true },
      "seeds": { "status": "pending", "auto_delete": true, "watched_list": true },
      "values": { "status": "pending", "live_updates": true },
      "timers": { "status": "pending", "turtle_specific": true },
      "rooms": { "status": "pending", "firebase": true },
      "shop": { "status": "pending", "quick_shop": true, "alt_b_hotkey": true },
      "tools": { "status": "pending", "tail_group": true },
      "settings": { "status": "pending", "tail_group": true },
      "hotkeys": { "status": "pending", "customization": true, "tail_group": true },
      "notifications": { "status": "pending", "batching": true, "tail_group": true },
      "help": { "status": "pending", "tail_group": true }
    }
  },
  "special_features": {
    "turtle_timers": {
      "countdown": { "status": "pending" },
      "pause_resume": { "status": "pending" },
      "dock_badge": { "status": "pending" },
      "notifications": { "status": "pending" }
    },
    "crop_hover_tooltip": {
      "value_injection": { "status": "pending" },
      "theme_aware": { "status": "pending" },
      "compact_safe": { "status": "pending" }
    }
  },
  "interactions": {
    "hotkeys": {
      "alt_b_shop": { "status": "pending" },
      "quick_tabs": { "status": "pending" },
      "ctrl_h_clear": { "status": "pending" },
      "ctrl_c_highlight": { "status": "pending" }
    },
    "drag_operations": { "status": "pending" },
    "shift_click_popouts": { "status": "pending" }
  }
}
```

### PHASE 2: New UI Shell Implementation

#### 2.1 Remove old UI initialization
Find and comment out (don't delete):
- Old panel creation code
- Old toggle button
- Auto-opening logic

#### 2.2 Create Hybrid Dock
```javascript
// Add to initialization
const hybridUI = {
    dock: null,
    sidebar: null,
    isVertical: false,
    tailGroupExpanded: false,

    createDock() {
        const dock = document.createElement('div');
        dock.id = 'mgh-dock';
        dock.className = 'horizontal'; // Start horizontal

        // Primary tabs (always visible)
        const primaryTabs = ['pets', 'abilities', 'seeds', 'values', 'timers', 'rooms', 'shop'];

        // Tail group (collapsible)
        const tailTabs = ['tools', 'settings', 'hotkeys', 'notifications', 'help'];

        primaryTabs.forEach(tab => {
            const item = this.createDockItem(tab);
            dock.appendChild(item);
        });

        // Add tail group container
        const tailGroup = document.createElement('div');
        tailGroup.className = 'mgh-tail-group';
        tailGroup.style.display = 'none'; // Hidden by default

        tailTabs.forEach(tab => {
            const item = this.createDockItem(tab);
            tailGroup.appendChild(item);
        });

        // Tail group trigger
        const tailTrigger = document.createElement('div');
        tailTrigger.className = 'mgh-dock-item tail-trigger';
        tailTrigger.innerHTML = '⋯';
        tailTrigger.onmouseenter = () => tailGroup.style.display = 'flex';
        tailGroup.onmouseleave = () => tailGroup.style.display = 'none';

        dock.appendChild(tailTrigger);
        dock.appendChild(tailGroup);

        // Orientation toggle
        const flipToggle = document.createElement('div');
        flipToggle.className = 'mgh-dock-item flip-toggle';
        flipToggle.innerHTML = '↔';
        flipToggle.onclick = () => this.toggleOrientation();
        dock.appendChild(flipToggle);

        // Make draggable
        this.makeDraggable(dock);

        return dock;
    },

    createDockItem(tabName) {
        const item = document.createElement('div');
        item.className = 'mgh-dock-item';
        item.dataset.tab = tabName;

        // Icon mapping (preserve from original)
        const icons = {
            pets: '🐾',
            abilities: '✨',
            seeds: '🌱',
            values: '💎',
            timers: '⏱️',
            rooms: '🏠',
            shop: '🛒',
            tools: '🔧',
            settings: '⚙️',
            hotkeys: '⌨️',
            notifications: '🔔',
            help: '❓'
        };

        item.innerHTML = icons[tabName] || '📌';

        // Tooltip
        const tooltip = document.createElement('div');
        tooltip.className = 'mgh-tooltip';
        tooltip.textContent = tabName.charAt(0).toUpperCase() + tabName.slice(1);

        // Add shift-click hint on first hover
        if (!localStorage.getItem('mga_shift_hint_shown')) {
            tooltip.textContent += ' (Shift+Click for popout)';
            localStorage.setItem('mga_shift_hint_shown', 'true');
        }

        item.appendChild(tooltip);

        // Click handlers
        item.onclick = (e) => {
            if (e.shiftKey) {
                this.openPopoutWidget(tabName);
            } else {
                this.openSidebarTab(tabName);
            }
        };

        // Special handling for buy icon
        if (tabName === 'shop') {
            // Preserve Alt+B hotkey
            document.addEventListener('keydown', (e) => {
                if (e.altKey && e.key === 'b') {
                    e.preventDefault();
                    // Call original shop handler
                    openAlternateShop();
                }
            });
        }

        return item;
    }
};
```

#### 2.3 Create Sidebar Panel
```javascript
hybridUI.createSidebar = function() {
    const sidebar = document.createElement('div');
    sidebar.id = 'mgh-sidebar';
    sidebar.style.display = 'none'; // Hidden by default

    // Header
    const header = document.createElement('div');
    header.className = 'mgh-sidebar-header';

    // Tab content area
    const content = document.createElement('div');
    content.className = 'mgh-sidebar-content';

    sidebar.appendChild(header);
    sidebar.appendChild(content);

    return sidebar;
};

hybridUI.openSidebarTab = function(tabName) {
    const sidebar = this.sidebar;
    const content = sidebar.querySelector('.mgh-sidebar-content');

    // Special handling for MGTools tab
    if (tabName === 'tools') {
        content.innerHTML = this.renderMGToolsCard();
    }
    // Special handling for Master tab
    else if (tabName === 'master') {
        content.innerHTML = this.renderMasterOverview();
    }
    // Use existing tab renderers
    else {
        // Call original render function (preserve all logic)
        const originalContent = renderTabContent(tabName);
        content.innerHTML = '';
        content.appendChild(originalContent);

        // Re-attach all event handlers for this tab
        setupTabHandlers(tabName);
    }

    // Show sidebar
    sidebar.style.display = 'block';
    sidebar.classList.add('open');

    // Update active state
    document.querySelectorAll('.mgh-dock-item').forEach(item => {
        item.classList.toggle('active', item.dataset.tab === tabName);
    });
};
```

### PHASE 3: Wire Existing Systems

#### 3.1 Map Tab Renderers
```javascript
// Find existing tab render logic and map to new UI
function renderTabContent(tabName) {
    // This should call the EXISTING render logic
    // DO NOT recreate - just rewire

    const content = document.createElement('div');
    content.className = `mga-tab-content mga-${tabName}-tab`;

    // Call original renderer based on tab
    switch(tabName) {
        case 'pets':
            // Use existing pets tab logic
            content.innerHTML = generatePetsTabContent();
            break;
        case 'abilities':
            // Use existing abilities tab logic
            content.innerHTML = generateAbilitiesTabContent();
            break;
        // ... etc for all tabs
    }

    return content;
}

function setupTabHandlers(tabName) {
    // Re-attach all event handlers for the tab
    // This is CRITICAL - must preserve all original handlers

    switch(tabName) {
        case 'pets':
            setupPetPresetHandlers();
            setupActivePetsDisplay();
            break;
        case 'notifications':
            setupNotificationHandlers();
            break;
        // ... etc
    }
}
```

#### 3.2 Preserve Critical Systems
```javascript
// These must continue to work unchanged:
// - TimerManager heartbeat
// - Firebase room status
// - Value calculations
// - Storage operations
// - Notification loops
// - Weather event throttling
```

### PHASE 4: Critical Feature Validation

#### 4.1 Turtle Timer Verification
```javascript
// Turtle timer must:
// 1. Show countdown in dock badge
// 2. Update every second (no more frequent)
// 3. Pause/resume correctly
// 4. Trigger notifications at correct times
// 5. Format time identically to source
```

#### 4.2 Crop Hover Tooltip
```javascript
// Must preserve exact tooltip injection:
// 1. Same container selector
// 2. Same value calculation
// 3. Same formatting
// 4. Theme-aware styling
// 5. No layout shift
```

### PHASE 5: Testing & Validation

Create automated test suite:
```javascript
const parityTests = {
    runAll() {
        const results = {};

        // Test each tab renders
        ['pets', 'abilities', 'seeds', 'values', 'timers', 'rooms', 'shop', 'tools', 'settings', 'hotkeys', 'notifications', 'help'].forEach(tab => {
            results[`tab_${tab}`] = this.testTabRender(tab);
        });

        // Test turtle timer
        results.turtleTimer = this.testTurtleTimer();

        // Test crop tooltip
        results.cropTooltip = this.testCropTooltip();

        // Test hotkeys
        results.hotkeys = this.testHotkeys();

        // Test storage
        results.storage = this.testStorage();

        // Update parity.json
        this.updateParityStatus(results);

        return results;
    },

    testTabRender(tabName) {
        try {
            hybridUI.openSidebarTab(tabName);
            const content = document.querySelector('.mgh-sidebar-content');
            return content && content.children.length > 0;
        } catch(e) {
            console.error(`Tab ${tabName} render failed:`, e);
            return false;
        }
    }
    // ... more tests
};
```

## CRITICAL CONSTRAINTS

1. **NO LOGIC CHANGES**: Only UI shell changes. All calculations, timers, state management must remain identical
2. **NO AUTO-OPEN**: Nothing opens automatically on page load
3. **PRESERVE ALL HOTKEYS**: Including Alt+B for shop
4. **MAINTAIN PERFORMANCE**: Keep 60 FPS, throttle during weather
5. **EXACT TIMER BEHAVIOR**: Turtle timers must be pixel-perfect match
6. **THEME SYNC**: Ultra-compact and theme must work across all views

## DELIVERABLES CHECKLIST

- [ ] `magicgardenunified.hybrid.user.js` - Working migrated script
- [ ] `CLAUDE.MD` - Context keeper document
- [ ] `parity.json` - Feature parity tracking (all green)
- [ ] `MIGRATION-NOTES.md` - What changed in UI layer
- [ ] All tests passing
- [ ] No console errors
- [ ] Performance validated

## ERROR RECOVERY

If you encounter issues:
1. Check CLAUDE.MD for context
2. Review parity.json for progress
3. Never guess at business logic
4. Preserve original code commented out
5. Test incrementally

## COMPLETION CRITERIA

✅ All features work identically to source
✅ Dock is draggable and scales properly
✅ No auto-opening windows
✅ MGTools/Master tabs show card UI
✅ Shift+click opens popout widgets
✅ Tail group hides/shows on hover
✅ All hotkeys work
✅ Performance is smooth
✅ No console errors