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
  getContentForTab,
  getPetsPopoutContent,
  openSidebarTab as openSidebarTabFn,
  openPopoutWidget as openPopoutWidgetFn,
  makePopoutDraggable,
  getCachedTabContent
} from '../ui/overlay.js';
import { makeDraggable, makeElementResizable } from '../ui/draggable.js';
import {
  generateThemeStyles,
  applyThemeToDock,
  applyThemeToSidebar,
  applyAccentToDock,
  applyAccentToSidebar,
  applyThemeToPopoutWidget
} from '../ui/theme-system.js';

// Tab Content Getters
import { getPetsTabContent } from '../features/pets.js';
import { getAbilitiesTabContent } from '../features/abilities/abilities-ui.js';
import { getSettingsTabContent } from '../features/settings-ui.js';
import { getNotificationsTabContent } from '../features/notifications.js';
import { getShopTabContent, toggleShopWindows as toggleShopWindowsFn, createShopSidebars, stopInventoryCounter } from '../features/shop.js';
import { checkVersion as checkVersionFn } from '../features/version-checker.js';
import {
  getSeedsTabContent,
  getValuesTabContent,
  getTimersTabContent,
  getRoomStatusTabContent,
  getToolsTabContent,
  getProtectTabContent,
  getHelpTabContent,
  getHotkeysTabContent
} from '../ui/tab-content.js';

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

    // Content getters object for updateTabContent
    const contentGetters = {
      getPetsTabContent: () => getPetsTabContent({ UnifiedState, targetDocument }),
      getPetsPopoutContent: () => getPetsPopoutContent(),
      getAbilitiesTabContent: () => getAbilitiesTabContent({ UnifiedState, targetDocument }),
      getSeedsTabContent: () => getSeedsTabContent({ UnifiedState, targetDocument }),
      getShopTabContent: () => getShopTabContent({ UnifiedState, targetDocument }),
      getValuesTabContent: () => getValuesTabContent({ UnifiedState, targetDocument }),
      getTimersTabContent: () => getTimersTabContent(),
      getRoomStatusTabContent: () => getRoomStatusTabContent({ UnifiedState, targetDocument }),
      getToolsTabContent: () => getToolsTabContent(),
      getSettingsTabContent: () => getSettingsTabContent({ UnifiedState, targetDocument }),
      getHotkeysTabContent: () => getHotkeysTabContent({ UnifiedState, targetDocument }),
      getNotificationsTabContent: () => getNotificationsTabContent({ UnifiedState, targetDocument }),
      getProtectTabContent: () => getProtectTabContent({ UnifiedState, targetDocument }),
      getHelpTabContent: () => getHelpTabContent()
    };

    // updateTabContent - updates the active tab's content
    const updateTabContent = () => {
      const contentEl = targetDocument.querySelector('#mga-tab-content');
      if (!contentEl) return;

      const tabName = UnifiedState.activeTab;
      if (!tabName) return;

      try {
        const content = getContentForTab({ contentGetters }, tabName, false);
        contentEl.innerHTML = content;
      } catch (error) {
        debugError('[MGTools] Failed to update tab content:', error);
        contentEl.innerHTML = '<div style="padding: 20px; color: #ff6b6b;">Error loading content</div>';
      }
    };

    const minimalUIConfig = {
      targetDocument,
      productionLog,
      UnifiedState,

      // Simple wrapper for drag functionality
      makeDockDraggable: dock => {
        makeDraggable(dock, dock, {
          targetDocument,
          debugLog,
          saveMainHUDPosition: pos => saveDockPosition(pos)
        });
      },

      // WIRED: openSidebarTab - now functional with updateTabContent
      openSidebarTab: tabName => {
        openSidebarTabFn({ targetDocument, UnifiedState, updateTabContent }, tabName);
      },

      // WIRED: Shop windows toggle
      toggleShopWindows: () => {
        toggleShopWindowsFn({ targetDocument, UnifiedState, createShopSidebars });
      },

      // WIRED: openPopoutWidget - shift+click popout windows
      openPopoutWidget: tabName => {
        // Stub handler setups - popout will work but interactive handlers not wired yet
        const handlerSetups = {
          setupPetsTabHandlers: () => {},
          setupAbilitiesTabHandlers: () => {},
          updateAbilityLogDisplay: () => {},
          setupSeedsTabHandlers: () => {},
          setupShopTabHandlers: () => {},
          setupValuesTabHandlers: () => {},
          setupRoomJoinButtons: () => {},
          setupSettingsTabHandlers: () => {},
          setupHotkeysTabHandlers: () => {},
          setupNotificationsTabHandlers: () => {},
          setupProtectTabHandlers: () => {},
          setupPetPopoutHandlers: () => {}
        };

        openPopoutWidgetFn(
          {
            targetDocument,
            UnifiedState,
            makePopoutDraggable,
            makeElementResizable,
            generateThemeStyles: theme => generateThemeStyles(theme),
            applyThemeToPopoutWidget: (popout, themeStyles) =>
              applyThemeToPopoutWidget({ targetDocument }, popout, themeStyles),
            stopInventoryCounter: () => stopInventoryCounter({ targetDocument, UnifiedState }),
            getCachedTabContent,
            contentGetters,
            handlerSetups
          },
          tabName
        );
      },

      // WIRED: Version checker
      checkVersion: indicatorElement => {
        checkVersionFn(indicatorElement, {
          CURRENT_VERSION: CONFIG.CURRENT_VERSION,
          IS_LIVE_BETA: CONFIG.IS_LIVE_BETA,
          isDiscordPage: targetWindow.location.href?.includes('discordsays.com') || false,
          window: targetWindow,
          console: console
        });
      },

      // Dock orientation management - uses localStorage to match overlay.js expectations
      saveDockOrientation: orientation => {
        try {
          localStorage.setItem('mgh_dock_orientation', orientation);
        } catch (e) {
          debugError('[MGTools] Failed to save dock orientation:', e);
        }
      },
      loadDockOrientation: () => {
        try {
          return localStorage.getItem('mgh_dock_orientation') || 'horizontal';
        } catch (e) {
          return 'horizontal';
        }
      },
      // Dock position loading - uses localStorage and returns {left, top} object
      // Note: saving is handled by saveDockPosition from overlay.js (called via makeDraggable)
      loadDockPosition: () => {
        try {
          const saved = localStorage.getItem('mgh_dock_position');
          if (saved) {
            const position = JSON.parse(saved);
            // Position should have {left, top} properties as numbers
            if (position && typeof position.left === 'number' && typeof position.top === 'number') {
              return position;
            }
          }
          return null;
        } catch (e) {
          debugError('[MGTools] Failed to load dock position:', e);
          return null;
        }
      },

      // Theme system (wired)
      generateThemeStyles: theme => generateThemeStyles(theme),
      applyAccentToDock: gradient => applyAccentToDock(gradient, { targetDocument }),
      applyAccentToSidebar: gradient => applyAccentToSidebar(gradient, { targetDocument }),
      applyThemeToDock: theme => applyThemeToDock(theme, { targetDocument }),
      applyThemeToSidebar: theme => applyThemeToSidebar(theme, { targetDocument }),

      // Environment detection
      isDiscordEnv: targetWindow.location.href?.includes('discordsays.com') || false,

      // Constants
      UNIFIED_STYLES,
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
