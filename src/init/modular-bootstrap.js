/**
 * Modular Bootstrap for v2.1 (Simplified Approach)
 * =================================================
 *
 * This replaces LegacyBootstrap with a simpler initialization that:
 * - Imports functions directly from modules
 * - Calls them in correct order
 * - No complex dependency object wiring needed
 *
 * @module init/modular-bootstrap
 * @version 2.1.0
 */

// Core Infrastructure
import { UnifiedState } from '../state/unified-state.js';
import { MGA_loadJSON, MGA_saveJSON } from '../core/storage.js';
import { productionLog, debugLog, debugError } from '../core/logging.js';
import { CONFIG } from '../utils/constants.js';
import { targetDocument } from '../core/compat.js';

// UI Functions
import {
  createUnifiedUI,
  UNIFIED_STYLES,
  saveDockPosition,
  openSidebarTab,
  openPopoutWidget
} from '../ui/overlay.js';
import { makeDraggable } from '../ui/draggable.js';
import {
  generateThemeStyles,
  applyThemeToDock,
  applyThemeToSidebar,
  applyAccentToDock,
  applyAccentToSidebar
} from '../ui/theme-system.js';

/**
 * Initialize MGTools with simplified modular approach
 *
 * Phase 1: Minimal UI (loadSavedData + createUnifiedUI)
 *
 * @param {Object} deps - Dependencies
 * @param {Document} deps.targetDocument - Target document
 * @param {Window} deps.targetWindow - Target window
 * @returns {boolean} Success
 */
export function initializeModular({ targetDocument, targetWindow }) {
  productionLog('[MGTools v2.1] 🚀 Starting Simplified Modular Bootstrap...');

  try {
    // Step 1: Load Saved Data
    productionLog('[MGTools] Step 1: Loading saved data...');
    const savedData = MGA_loadJSON('MGA_data', null);
    if (savedData && typeof savedData === 'object') {
      Object.assign(UnifiedState.data, savedData);
      productionLog('[MGTools] ✅ Loaded saved data from storage');
    } else {
      productionLog('[MGTools] Using default settings (no saved data found)');
    }

    // Step 2: Create UI (MINIMAL VERSION - just get UI to appear)
    productionLog('[MGTools] Step 2: Creating UI...');

    // For now, we'll call createUnifiedUI with MINIMAL dependencies
    // This is Phase 4.1: Just get the UI to appear
    // We'll wire more features incrementally after this works

    // TODO: createUnifiedUI needs many dependencies
    // For minimal version, we'll need to either:
    // A) Pass stub functions, OR
    // B) Modify createUnifiedUI to accept optional dependencies
    //
    // Let's try approach A first - minimal stubs to make UI appear

    const minimalUIConfig = {
      targetDocument,
      productionLog,
      UnifiedState,

      // Wired features
      makeDockDraggable: dock => {
        // Dock is draggable by itself (element is also the handle)
        makeDraggable(dock, dock, {
          targetDocument,
          debugLog,
          saveMainHUDPosition: pos => saveDockPosition(pos, { MGA_saveJSON, debugLog, debugError })
        });
      },
      openSidebarTab: (tabName) =>
        openSidebarTab({ UnifiedState, targetDocument, productionLog, debugLog }, tabName),
      toggleShopWindows: () => {},
      openPopoutWidget: (tabName) => openPopoutWidget({ targetDocument, UnifiedState }, tabName),
      checkVersion: () => {},
      saveDockOrientation: (orientation) => {
        try {
          MGA_saveJSON('MGA_dockOrientation', orientation);
        } catch (e) {
          debugError('[MGTools] Failed to save dock orientation:', e);
        }
      },
      loadDockOrientation: () => {
        try {
          return MGA_loadJSON('MGA_dockOrientation', 'horizontal');
        } catch (e) {
          return 'horizontal';
        }
      },
      loadDockPosition: (dock) => {
        try {
          const saved = MGA_loadJSON('MGA_dockPosition', null);
          if (saved && saved.bottom && saved.right) {
            dock.style.bottom = saved.bottom;
            dock.style.right = saved.right;
          }
        } catch (e) {
          debugError('[MGTools] Failed to load dock position:', e);
        }
      },
      generateThemeStyles: (theme) => generateThemeStyles(theme),
      applyAccentToDock: (gradient) => applyAccentToDock(gradient, { targetDocument }),
      applyAccentToSidebar: (gradient) => applyAccentToSidebar(gradient, { targetDocument }),
      applyThemeToDock: (theme) => applyThemeToDock(theme, { targetDocument }),
      applyThemeToSidebar: (theme) => applyThemeToSidebar(theme, { targetDocument }),
      isDiscordEnv: targetWindow.location.href?.includes('discordsays.com') || false,
      UNIFIED_STYLES, // Imported from overlay.js
      CURRENT_VERSION: CONFIG.CURRENT_VERSION || '2.1.0',
      IS_LIVE_BETA: CONFIG.IS_LIVE_BETA || false
    };

    createUnifiedUI(minimalUIConfig);
    productionLog('[MGTools] ✅ UI created (minimal version)');

    // Step 3: More features will be added in Phase 4.2+
    productionLog('[MGTools] ✅ Initialization complete (minimal)');
    productionLog('[MGTools] ⚠️ Note: Many features are stubbed - will wire incrementally');

    return true;
  } catch (error) {
    debugError('[MGTools] ❌ Initialization failed:', error);
    debugError('[MGTools] Stack:', error.stack);
    return false;
  }
}

/**
 * TODO for Phase 4.2+:
 *
 * Features to wire incrementally:
 * - makeDockDraggable (from ui/draggable.js)
 * - Theme system (from ui/theme-system.js)
 * - Toolbar controls (setupToolbarToggle, setupDockSizeControl)
 * - Atoms initialization
 * - Turtle timer
 * - Tab content handlers
 * - Pet presets
 * - Crop highlighting
 * - Shop monitoring
 * - Hotkeys
 * - Protection system
 * - Notifications
 */
