/**
 * Abilities Tab Event Handlers
 *
 * Sets up all event listeners for the Abilities tab:
 * - Filter mode switching (Categories, By Pet, Custom)
 * - All/None filter buttons
 * - Category filter checkboxes
 * - Clear logs button (comprehensive clear across all storage)
 * - Export CSV button
 * - Diagnose storage button (debug mode only)
 * - Detailed timestamps toggle
 *
 * Uses data-handler-setup attribute to prevent duplicate handlers.
 *
 * @module features/abilities/abilities-handlers
 */

import {
  switchFilterMode,
  selectAllFilters,
  selectNoneFilters,
  updateAllLogVisibility,
  updateAllAbilityLogDisplays,
  updateAbilityLogDisplay,
  populateFilterModeContent,
  MGA_AbilityCache
} from './abilities-display.js';

/**
 * Setup Abilities tab event handlers
 *
 * Attaches event listeners to all interactive elements in the Abilities tab.
 * Handlers are idempotent - uses data-handler-setup attribute to prevent duplicates.
 *
 * Event Handlers:
 * - Filter mode buttons (Categories, By Pet, Custom)
 * - Select All/None buttons
 * - Category filter checkboxes
 * - Clear logs button (clears all storage locations)
 * - Export CSV button
 * - Diagnose storage button (debug mode)
 * - Detailed timestamps checkbox
 *
 * Clear Logs Behavior:
 * - Clears UnifiedState memory
 * - Clears GM storage (main + archive)
 * - Clears window.localStorage
 * - Clears targetWindow.localStorage
 * - Clears compatibility array
 * - Sets clear flags with timestamp
 * - Verifies complete deletion
 * - Logs before/after comparison
 *
 * @param {Document|Element} context - DOM context for querySelector
 * @param {object} dependencies - Injected dependencies
 * @param {object} [dependencies.UnifiedState] - State object
 * @param {Function} [dependencies.MGA_saveJSON] - Save function
 * @param {Function} [dependencies.MGA_loadJSON] - Load function
 * @param {Function} [dependencies.debugLog] - Debug logging
 * @param {Function} [dependencies.logDebug] - Log debug function
 * @param {Function} [dependencies.logWarn] - Log warn function
 * @param {Function} [dependencies.productionLog] - Production logging
 * @param {Function} [dependencies.productionWarn] - Production warnings
 * @param {Function} [dependencies.updateTabContent] - Tab content updater
 * @param {Function} [dependencies.showNotificationToast] - Toast notification
 * @param {Function} [dependencies.exportAbilityLogs] - CSV export function
 * @param {Function} [dependencies.MGA_diagnoseAbilityLogStorage] - Diagnostic function
 * @param {Function} [dependencies.GM_getValue] - Tampermonkey GM function
 * @param {Function} [dependencies.GM_setValue] - Tampermonkey GM function
 * @param {Window} [dependencies.window] - Window object
 * @param {Window} [dependencies.targetWindow] - Target window
 * @param {Storage} [dependencies.localStorage] - localStorage
 * @param {Console} [dependencies.console] - Console
 * @param {object} [dependencies.Date] - Date constructor
 * @param {Function} [dependencies.setTimeout] - setTimeout function
 *
 * @example
 * setupAbilitiesTabHandlers(document, { UnifiedState, MGA_saveJSON, debugLog });
 */
export function setupAbilitiesTabHandlers(context = null, dependencies = {}) {
  const {
    UnifiedState = typeof window !== 'undefined' && window.UnifiedState,
    MGA_saveJSON = typeof window !== 'undefined' && window.MGA_saveJSON,
    MGA_loadJSON = typeof window !== 'undefined' && window.MGA_loadJSON,
    debugLog = typeof window !== 'undefined' && window.debugLog ? window.debugLog : () => {},
    logDebug = typeof window !== 'undefined' && window.logDebug ? window.logDebug : () => {},
    logWarn = typeof window !== 'undefined' && window.logWarn ? window.logWarn : () => {},
    productionLog = typeof window !== 'undefined' && window.productionLog ? window.productionLog : () => {},
    productionWarn = typeof window !== 'undefined' && window.productionWarn ? window.productionWarn : () => {},
    updateTabContent = typeof window !== 'undefined' && window.updateTabContent,
    showNotificationToast = typeof window !== 'undefined' && window.showNotificationToast,
    exportAbilityLogs = typeof window !== 'undefined' && window.exportAbilityLogs,
    MGA_diagnoseAbilityLogStorage = typeof window !== 'undefined' && window.MGA_diagnoseAbilityLogStorage,
    GM_getValue, // Passed via dependencies - no default to avoid circular reference
    GM_setValue, // Passed via dependencies - no default to avoid circular reference
    window: win = typeof window !== 'undefined' ? window : null,
    targetWindow = typeof window !== 'undefined' && window.targetWindow ? window.targetWindow : null,
    localStorage: storage = typeof localStorage !== 'undefined' ? localStorage : null,
    console: consoleFn = typeof console !== 'undefined' ? console : { log: () => {} },
    Date: DateClass = typeof Date !== 'undefined' ? Date : null,
    setTimeout: setTimeoutFn = typeof setTimeout !== 'undefined' ? setTimeout : null
  } = dependencies;

  const ctx = context || (typeof document !== 'undefined' ? document : null);

  debugLog('ABILITY_LOGS', 'Setting up abilities tab handlers with context', {
    isDocument: ctx === (typeof document !== 'undefined' ? document : null),
    className: ctx.className || 'document'
  });

  // Filter mode switching
  const categoriesBtn = ctx.querySelector('#filter-mode-categories');
  const byPetBtn = ctx.querySelector('#filter-mode-bypet');
  const customBtn = ctx.querySelector('#filter-mode-custom');

  if (categoriesBtn && !categoriesBtn.hasAttribute('data-handler-setup')) {
    categoriesBtn.setAttribute('data-handler-setup', 'true');
    categoriesBtn.addEventListener('click', () => switchFilterMode('categories', dependencies));
  }
  if (byPetBtn && !byPetBtn.hasAttribute('data-handler-setup')) {
    byPetBtn.setAttribute('data-handler-setup', 'true');
    byPetBtn.addEventListener('click', () => switchFilterMode('byPet', dependencies));
  }
  if (customBtn && !customBtn.hasAttribute('data-handler-setup')) {
    customBtn.setAttribute('data-handler-setup', 'true');
    customBtn.addEventListener('click', () => switchFilterMode('custom', dependencies));
  }

  // All/None filter buttons (context-aware)
  const selectAllBtn = ctx.querySelector('#select-all-filters');
  const selectNoneBtn = ctx.querySelector('#select-none-filters');

  if (selectAllBtn && !selectAllBtn.hasAttribute('data-handler-setup')) {
    selectAllBtn.setAttribute('data-handler-setup', 'true');
    selectAllBtn.addEventListener('click', () => {
      const mode = UnifiedState?.data?.filterMode || 'categories';
      selectAllFilters(mode, dependencies);
    });
  }

  if (selectNoneBtn && !selectNoneBtn.hasAttribute('data-handler-setup')) {
    selectNoneBtn.setAttribute('data-handler-setup', 'true');
    selectNoneBtn.addEventListener('click', () => {
      const mode = UnifiedState?.data?.filterMode || 'categories';
      selectNoneFilters(mode, dependencies);
    });
  }

  // Category filter checkboxes - USE CONTEXT-AWARE SELECTORS
  ctx.querySelectorAll('#category-filters .mga-checkbox[data-filter]').forEach(checkbox => {
    if (!checkbox.hasAttribute('data-handler-setup')) {
      checkbox.setAttribute('data-handler-setup', 'true');
      checkbox.addEventListener('change', e => {
        const filterKey = e.target.dataset.filter;
        if (UnifiedState?.data?.abilityFilters) {
          UnifiedState.data.abilityFilters[filterKey] = e.target.checked;
        }
        if (MGA_saveJSON) {
          MGA_saveJSON('MGA_abilityFilters', UnifiedState?.data?.abilityFilters);
        }

        // PERFORMANCE: Use CSS visibility toggle instead of DOM rebuild
        updateAllLogVisibility(dependencies);
        debugLog('ABILITY_LOGS', `Filter ${filterKey} changed to ${e.target.checked}, updated visibility via CSS`);
      });
    }
  });

  // Clear logs button - comprehensive clear across all storage
  const clearLogsBtn = ctx.querySelector('#clear-logs-btn');
  if (clearLogsBtn && !clearLogsBtn.hasAttribute('data-handler-setup')) {
    clearLogsBtn.setAttribute('data-handler-setup', 'true');
    clearLogsBtn.addEventListener('click', () => {
      logDebug('ABILITY-LOGS', 'Starting comprehensive ability log clear...');

      // BEFORE CLEAR: Show what exists in each storage
      const beforeClear = {
        memory: UnifiedState?.data?.petAbilityLogs?.length || 0,
        gmMain: (() => {
          try {
            const v = GM_getValue ? GM_getValue('MGA_petAbilityLogs', null) : null;
            return v ? JSON.parse(v).length : 0;
          } catch (_e) {
            return 0;
          }
        })(),
        gmArchive: (() => {
          try {
            const v = GM_getValue ? GM_getValue('MGA_petAbilityLogs_archive', null) : null;
            return v ? JSON.parse(v).length : 0;
          } catch (_e) {
            return 0;
          }
        })(),
        lsMain: (() => {
          try {
            const v = win?.localStorage?.getItem('MGA_petAbilityLogs');
            return v ? JSON.parse(v).length : 0;
          } catch (_e) {
            return 0;
          }
        })(),
        lsArchive: (() => {
          try {
            const v = win?.localStorage?.getItem('MGA_petAbilityLogs_archive');
            return v ? JSON.parse(v).length : 0;
          } catch (_e) {
            return 0;
          }
        })()
      };

      logDebug('ABILITY-LOGS', '📊 BEFORE CLEAR - Log counts:', beforeClear);

      // Show individual logs from memory (to identify which one won't delete)
      if (UnifiedState?.data?.petAbilityLogs?.length > 0) {
        logDebug('ABILITY-LOGS', '📋 Current logs in memory:');
        UnifiedState.data.petAbilityLogs.forEach((log, i) => {
          logDebug(
            'ABILITY-LOGS',
            `  ${i + 1}. ${log.abilityType} - ${log.petName} - ${new DateClass(log.timestamp).toLocaleString()}`
          );
        });
      }

      // 1. Clear memory
      if (UnifiedState?.data) {
        UnifiedState.data.petAbilityLogs = [];
      }
      logDebug('ABILITY-LOGS', '  ✓ Cleared UnifiedState memory');

      // 2. Clear GM storage (Tampermonkey)
      if (MGA_saveJSON) {
        MGA_saveJSON('MGA_petAbilityLogs', []);
        MGA_saveJSON('MGA_petAbilityLogs_archive', []);
      }
      logDebug('ABILITY-LOGS', '  ✓ Cleared GM storage (main + archive)');

      // 3. Clear window.localStorage directly (bypass sync logic)
      try {
        win?.localStorage?.removeItem('MGA_petAbilityLogs');
        win?.localStorage?.removeItem('MGA_petAbilityLogs_archive');
        logDebug('ABILITY-LOGS', '  ✓ Cleared window.localStorage');
      } catch (e) {
        logWarn('ABILITY-LOGS', '  ⚠️ Could not clear window.localStorage:', e.message);
      }

      // 4. Clear targetWindow.localStorage (if different from window)
      try {
        if (targetWindow && targetWindow !== win) {
          targetWindow.localStorage?.removeItem('MGA_petAbilityLogs');
          targetWindow.localStorage?.removeItem('MGA_petAbilityLogs_archive');
          logDebug('ABILITY-LOGS', '  ✓ Cleared targetWindow.localStorage');
        }
      } catch (e) {
        logWarn('ABILITY-LOGS', '  ⚠️ Could not clear targetWindow.localStorage:', e.message);
      }

      // 5. Clear compatibility array
      try {
        if (typeof win?.petAbilityLogs !== 'undefined') {
          win.petAbilityLogs = [];
          logDebug('ABILITY-LOGS', '  ✓ Cleared window.petAbilityLogs compatibility array');
        }
      } catch (e) {
        logWarn('ABILITY-LOGS', '  ⚠️ Could not clear compatibility array:', e.message);
      }

      // 6. Set comprehensive clear flags with timestamp-based session lock
      const clearTimestamp = DateClass.now();
      storage?.setItem('MGA_logs_manually_cleared', clearTimestamp.toString());
      storage?.setItem('MGA_logs_clear_session', clearTimestamp.toString());
      try {
        if (GM_setValue) {
          GM_setValue('MGA_logs_manually_cleared', clearTimestamp.toString());
        }
      } catch (e) {
        logWarn('ABILITY-LOGS', '  ⚠️ Could not set GM clear flag:', e.message);
      }
      logDebug('ABILITY-LOGS', '  ✓ Set manual clear flags (session + GM + timestamp)');

      // 7. AFTER CLEAR: Comprehensive verification
      const verifyMain = MGA_loadJSON ? MGA_loadJSON('MGA_petAbilityLogs', null) : null;
      const verifyArchive = MGA_loadJSON ? MGA_loadJSON('MGA_petAbilityLogs_archive', null) : null;
      const verifyLS = win?.localStorage?.getItem('MGA_petAbilityLogs');
      const verifyCompat = typeof win?.petAbilityLogs !== 'undefined' ? win.petAbilityLogs?.length : 'N/A';

      // Recount all sources after clear
      const afterClear = {
        memory: UnifiedState?.data?.petAbilityLogs?.length || 0,
        gmMain: verifyMain?.length || 0,
        gmArchive: verifyArchive?.length || 0,
        lsMain: verifyLS
          ? (() => {
              try {
                return JSON.parse(verifyLS).length;
              } catch (_e) {
                return 'parse-error';
              }
            })()
          : 0,
        lsArchive: (() => {
          try {
            const v = win?.localStorage?.getItem('MGA_petAbilityLogs_archive');
            return v ? JSON.parse(v).length : 0;
          } catch (_e) {
            return 0;
          }
        })(),
        compatArray: verifyCompat
      };

      logDebug('ABILITY-LOGS', '📊 AFTER CLEAR - Log counts:', afterClear);
      logDebug('ABILITY-LOGS', '📊 COMPARISON:', {
        before: beforeClear,
        after: afterClear,
        clearedFlag: storage?.getItem('MGA_logs_manually_cleared')
      });

      // If ANY logs remain, show which ones
      const totalRemaining = Object.values(afterClear).reduce(
        (sum, val) => sum + (typeof val === 'number' ? val : 0),
        0
      );

      if (totalRemaining > 0) {
        productionWarn(`⚠️ [ABILITIES] ${totalRemaining} log(s) persist after clear!`);
        logDebug('ABILITY-LOGS', '🔍 Logs that persisted - check these sources:', afterClear);

        // Show which specific logs remain (if any)
        if (verifyMain && verifyMain.length > 0) {
          logDebug('ABILITY-LOGS', '❌ PERSISTENT LOGS IN GM STORAGE:');
          verifyMain.forEach((log, i) => {
            logDebug(
              'ABILITY-LOGS',
              `  ${i + 1}. ${log.abilityType} - ${log.petName} - ${new DateClass(log.timestamp).toLocaleString()}`
            );
          });
        }
      } else {
        productionLog('✅ [ABILITIES] Successfully cleared all ability logs from all storage locations');
      }

      // Reset log count tracker
      if (typeof win?.lastLogCount !== 'undefined') {
        win.lastLogCount = 0;
      }

      // Update displays
      if (updateTabContent) updateTabContent();
      updateAllAbilityLogDisplays(false, dependencies);
    });
  }

  // Export CSV button
  const exportLogsBtn = ctx.querySelector('#export-logs-btn');
  if (exportLogsBtn && !exportLogsBtn.hasAttribute('data-handler-setup')) {
    exportLogsBtn.setAttribute('data-handler-setup', 'true');
    exportLogsBtn.addEventListener('click', () => {
      if (exportAbilityLogs) {
        exportAbilityLogs();
      }
    });
  }

  // Diagnose logs button (only visible when debug mode is enabled)
  const diagnoseLogsBtn = ctx.querySelector('#diagnose-logs-btn');
  if (diagnoseLogsBtn && !diagnoseLogsBtn.hasAttribute('data-handler-setup')) {
    diagnoseLogsBtn.setAttribute('data-handler-setup', 'true');
    diagnoseLogsBtn.addEventListener('click', () => {
      consoleFn.log('🔍 Running ability logs storage diagnostic...');
      const report = MGA_diagnoseAbilityLogStorage ? MGA_diagnoseAbilityLogStorage() : null;

      if (report) {
        // Show a user-friendly notification
        const totalWithLogs = report.summary?.totalLocationsWithLogs || 0;
        if (totalWithLogs === 0) {
          if (showNotificationToast) {
            showNotificationToast('✅ No ability logs found in any storage location', 'success');
          }
        } else {
          if (showNotificationToast) {
            showNotificationToast(
              `📊 Found logs in ${totalWithLogs} storage location(s). Check console for details.`,
              'info'
            );
          }
        }
      }
    });
  }

  // Detailed timestamps checkbox
  const detailedTimestampsCheckbox = ctx.querySelector('#detailed-timestamps-checkbox');
  if (detailedTimestampsCheckbox && !detailedTimestampsCheckbox.hasAttribute('data-handler-setup')) {
    detailedTimestampsCheckbox.setAttribute('data-handler-setup', 'true');
    detailedTimestampsCheckbox.addEventListener('change', e => {
      if (UnifiedState?.data?.settings) {
        UnifiedState.data.settings.detailedTimestamps = e.target.checked;
      }
      if (MGA_saveJSON) {
        MGA_saveJSON('MGA_data', UnifiedState?.data);
      }

      // Clear timestamp cache and force full rebuild for timestamp format change
      if (MGA_AbilityCache) {
        MGA_AbilityCache.timestamps.clear();
      }

      // BUGFIX: Force overlay refresh to show new timestamp format
      // Update all overlays first to ensure they show the new format
      if (UnifiedState?.data?.popouts?.overlays) {
        UnifiedState.data.popouts.overlays.forEach((overlay, tabName) => {
          if (tabName === 'abilities' && overlay && overlay.offsetParent !== null) {
            updateAbilityLogDisplay(overlay, dependencies);
            debugLog('ABILITY_LOGS', 'Updated overlay with new timestamp format');
          }
        });
      }

      // Then update main displays
      updateAllAbilityLogDisplays(true, dependencies);
      productionLog(`🕐 [ABILITIES] Detailed timestamps: ${e.target.checked ? 'enabled' : 'disabled'}`);
    });
  }

  // Initialize the current filter mode display
  const currentMode = UnifiedState?.data?.filterMode || 'categories';
  if (setTimeoutFn) {
    setTimeoutFn(() => populateFilterModeContent(currentMode, dependencies), 100);
  }
}
