/**
 * Event Handlers Module
 * =======================
 * Runtime event handlers for auto-save and cleanup.
 *
 * Systems included:
 * - Auto-Save Interval - Periodic data persistence
 * - Cleanup Handler - beforeunload cleanup and save
 *
 * @module init/event-handlers
 */

/* ============================================================================
 * AUTO-SAVE INTERVAL
 * ============================================================================ */

/**
 * Setup auto-save interval for periodic data persistence
 *
 * @param {object} dependencies - Injected dependencies
 * @param {object} [dependencies.UnifiedState] - Unified state object
 * @param {Function} [dependencies.MGA_saveJSON] - Save function
 * @param {Function} [dependencies.setManagedInterval] - Managed interval creator
 * @param {Window} [dependencies.targetWindow] - Target window object
 * @param {number} [dependencies.interval] - Save interval in milliseconds (default: 30000)
 *
 * @example
 * setupAutoSave({ UnifiedState, MGA_saveJSON, setManagedInterval });
 */
export function setupAutoSave(dependencies = {}) {
  const {
    UnifiedState = typeof window !== 'undefined' && window.UnifiedState,
    MGA_saveJSON = typeof window !== 'undefined' && window.MGA_saveJSON,
    setManagedInterval,
    targetWindow = typeof window !== 'undefined' ? window : null,
    interval = 30000 // 30 seconds default
  } = dependencies;

  if (!setManagedInterval) {
    console.warn('⚠️ setManagedInterval not provided, auto-save cannot be setup');
    return;
  }

  // Auto-save data every 30 seconds using managed interval
  setManagedInterval(
    'autoSave',
    () => {
      if (!UnifiedState || !MGA_saveJSON) {
        console.warn('⚠️ UnifiedState or MGA_saveJSON not available for auto-save');
        return;
      }

      MGA_saveJSON('MGA_petPresets', UnifiedState.data.petPresets);

      // Only save ability logs if not in clear session
      const clearSession = (typeof localStorage !== 'undefined' && localStorage.getItem('MGA_logs_clear_session')) || null;
      if (!clearSession || Date.now() - parseInt(clearSession, 10) > 86400000) {
        MGA_saveJSON('MGA_petAbilityLogs', UnifiedState.data.petAbilityLogs);
      }

      MGA_saveJSON('MGA_seedsToDelete', UnifiedState.data.seedsToDelete);
      MGA_saveJSON('MGA_autoDeleteEnabled', UnifiedState.data.autoDeleteEnabled);

      // Update resource tracking if available
      if (targetWindow && targetWindow.resourceDashboard) {
        targetWindow.resourceDashboard.updateResourceHistory();
      }
    },
    interval,
    { UnifiedState }
  );
}

/* ============================================================================
 * CLEANUP HANDLER
 * ============================================================================ */

/**
 * Setup beforeunload cleanup handler
 *
 * @param {object} dependencies - Injected dependencies
 * @param {object} [dependencies.UnifiedState] - Unified state object
 * @param {Function} [dependencies.MGA_saveJSON] - Save function
 * @param {Function} [dependencies.clearAllManagedIntervals] - Interval cleanup function
 * @param {Function} [dependencies.closeAllPopoutWindows] - Popout cleanup function
 * @param {Function} [dependencies.debugLog] - Debug logger
 * @param {Window} [dependencies.targetWindow] - Target window object
 *
 * @example
 * setupCleanupHandler({ UnifiedState, MGA_saveJSON, clearAllManagedIntervals });
 */
export function setupCleanupHandler(dependencies = {}) {
  const {
    UnifiedState = typeof window !== 'undefined' && window.UnifiedState,
    MGA_saveJSON = typeof window !== 'undefined' && window.MGA_saveJSON,
    clearAllManagedIntervals,
    closeAllPopoutWindows,
    debugLog = console.log,
    targetWindow = typeof window !== 'undefined' ? window : null
  } = dependencies;

  if (!targetWindow) {
    console.warn('⚠️ targetWindow not available, cleanup handler cannot be setup');
    return;
  }

  targetWindow.addEventListener('beforeunload', () => {
    // Save all data before leaving - CRITICAL: Use immediate saves, not debounced!
    if (UnifiedState && MGA_saveJSON) {
      MGA_saveJSON('MGA_petPresets', UnifiedState.data.petPresets);

      // Only save ability logs if not in clear session
      const clearSession = (typeof localStorage !== 'undefined' && localStorage.getItem('MGA_logs_clear_session')) || null;
      if (!clearSession || Date.now() - parseInt(clearSession, 10) > 86400000) {
        MGA_saveJSON('MGA_petAbilityLogs', UnifiedState.data.petAbilityLogs);
      }

      MGA_saveJSON('MGA_seedsToDelete', UnifiedState.data.seedsToDelete);
      MGA_saveJSON('MGA_autoDeleteEnabled', UnifiedState.data.autoDeleteEnabled);
    }

    // Clean up all managed intervals
    if (clearAllManagedIntervals) {
      clearAllManagedIntervals({ UnifiedState });
    }

    // Close all popout windows
    if (closeAllPopoutWindows) {
      closeAllPopoutWindows({ UnifiedState });
    }

    debugLog('PERFORMANCE', 'Cleanup completed on window unload');
  });
}

/**
 * Setup all event handlers (auto-save + cleanup)
 *
 * @param {object} dependencies - Injected dependencies
 *
 * @example
 * setupEventHandlers({
 *   UnifiedState,
 *   MGA_saveJSON,
 *   setManagedInterval,
 *   clearAllManagedIntervals,
 *   closeAllPopoutWindows
 * });
 */
export function setupEventHandlers(dependencies = {}) {
  setupAutoSave(dependencies);
  setupCleanupHandler(dependencies);
}

/* ============================================================================
 * EXPORTS
 * ============================================================================ */

export const EventHandlers = {
  setupAutoSave,
  setupCleanupHandler,
  setupEventHandlers
};
