/**
 * @fileoverview Public API Module
 * @module init/public-api
 * @description
 * Provides the window.MGA public API and ability log persistence workarounds.
 * This module contains all external interfaces and debugging utilities for MGTools,
 * plus critical patches to handle ability log persistence across localStorage and GM storage.
 *
 * Key Components:
 * - Ability Log Persistence Workarounds (GM_getValue/GM_setValue proxy patches)
 * - Hard Clear Functions (tombstone-based clear flag system)
 * - Public API Factory (window.MGA object with all debug/control functions)
 * - Utility APIs (Loading states, error recovery, performance, tooltips)
 *
 * @version 1.3.2
 * @since 2024-10-07
 */

// ============================================================================
// SECTION 1: ABILITY LOG PERSISTENCE WORKAROUNDS
// ============================================================================
// These patches ensure ability logs stay cleared when user clicks clear button
// and don't resurrect from localStorage or GM storage on next page load.

/**
 * Creates a sticky clear flag system for ability logs.
 * When logs are cleared, a flag is set in localStorage that tombstones
 * any ghost entries trying to resurrect from storage.
 *
 * @param {Object} dependencies - Injected dependencies
 * @param {Object} dependencies.localStorage - Browser localStorage API
 * @param {Object} dependencies.console - Console logging API
 * @param {Function} [dependencies.GM_getValue] - Greasemonkey getValue function
 * @param {Function} [dependencies.GM_setValue] - Greasemonkey setValue function
 * @returns {Object} Persistence workaround utilities
 *
 * @example
 * const persistence = createAbilityLogPersistence({
 *   localStorage: window.localStorage,
 *   console: console,
 *   GM_getValue: typeof GM_getValue !== 'undefined' ? GM_getValue : null,
 *   GM_setValue: typeof GM_setValue !== 'undefined' ? GM_setValue : null
 * });
 * persistence.hardClear();
 */
export function createAbilityLogPersistence(dependencies) {
  const {
    localStorage: storage,
    console: logger,
    GM_getValue: gmGetValue = null,
    GM_setValue: gmSetValue = null
  } = dependencies;

  // Storage keys
  const LOG_MAIN = 'MGA_petAbilityLogs';
  const LOG_ARCH = 'MGA_petAbilityLogs_archive';
  const FLAG = 'MGA_logs_manually_cleared';

  /**
   * Safe GM_getValue wrapper with JSON parsing
   * @private
   * @param {string} key - Storage key
   * @param {*} defaultValue - Default value if not found
   * @returns {*} Parsed value or default
   */
  function gmGet(key, defaultValue = null) {
    try {
      const raw = typeof gmGetValue === 'function' ? gmGetValue(key, null) : null;
      if (raw == null) return defaultValue;
      return typeof raw === 'string' ? JSON.parse(raw) : raw;
    } catch {
      return defaultValue;
    }
  }

  /**
   * Safe GM_setValue wrapper with JSON stringification
   * @private
   * @param {string} key - Storage key
   * @param {*} value - Value to store
   */
  function gmSet(key, value) {
    try {
      if (typeof gmSetValue === 'function') {
        gmSetValue(key, JSON.stringify(value));
      }
    } catch {
      // Silently fail - GM storage may not be available
    }
  }

  /**
   * Hard clear ability logs with tombstone flag.
   * Sets a persistent flag that prevents logs from resurrecting
   * from localStorage or GM storage on next page load.
   *
   * @returns {void}
   *
   * @example
   * persistence.hardClear();
   * // All logs cleared, flag set to prevent resurrection
   */
  function hardClear() {
    try {
      // Set tombstone flag
      storage.setItem(FLAG, 'true');

      // Clear GM storage
      gmSet(LOG_MAIN, []);
      gmSet(LOG_ARCH, []);

      // Clear localStorage (may fail if flag check prevents it)
      try {
        storage.removeItem(LOG_MAIN);
        storage.removeItem(LOG_ARCH);
      } catch {
        // Expected - flag may prevent removal
      }

      // Clear in-memory state if available
      if (window.UnifiedState?.data) {
        window.UnifiedState.data.petAbilityLogs = [];
      }
      if (Array.isArray(window.petAbilityLogs)) {
        window.petAbilityLogs.length = 0;
      }
    } catch (error) {
      logger.error('[MGTools] hardClear logs failed', error);
    }
  }

  /**
   * Clears the tombstone flag when new logs are added.
   * This allows logs to persist again after user starts logging new abilities.
   *
   * @returns {void}
   * @private
   */
  function clearFlagIfNeeded() {
    if (storage.getItem(FLAG) === 'true') {
      try {
        storage.removeItem(FLAG);
      } catch {
        // Silent fail - flag may be locked
      }
    }
  }

  return {
    hardClear,
    clearFlagIfNeeded,
    LOG_MAIN,
    LOG_ARCH,
    FLAG,
    gmGet,
    gmSet
  };
}

/**
 * Installs localStorage.getItem proxy to enforce tombstone on read paths.
 * When clear flag is set, returns empty array for log keys regardless of
 * what's actually stored in localStorage.
 *
 * @param {Object} dependencies - Injected dependencies
 * @param {Object} dependencies.Storage - Storage.prototype reference
 * @param {Object} dependencies.localStorage - localStorage instance
 * @param {string} dependencies.LOG_MAIN - Main log storage key
 * @param {string} dependencies.LOG_ARCH - Archive log storage key
 * @param {string} dependencies.FLAG - Clear flag key
 * @returns {void}
 *
 * @example
 * installLocalStorageProxy({
 *   Storage: Storage,
 *   localStorage: window.localStorage,
 *   LOG_MAIN: 'MGA_petAbilityLogs',
 *   LOG_ARCH: 'MGA_petAbilityLogs_archive',
 *   FLAG: 'MGA_logs_manually_cleared'
 * });
 */
export function installLocalStorageProxy(dependencies) {
  const { Storage: StoragePrototype, localStorage: storage, LOG_MAIN, LOG_ARCH, FLAG } = dependencies;

  try {
    const originalGetItem = StoragePrototype.prototype.getItem;

    // Only patch if not already patched
    if (!originalGetItem.__mgtoolsPatched) {
      StoragePrototype.prototype.getItem = function (key) {
        // Enforce tombstone: return empty array if clear flag is set
        if ((key === LOG_MAIN || key === LOG_ARCH) && storage.getItem(FLAG) === 'true') {
          return '[]';
        }
        return originalGetItem.apply(this, arguments);
      };

      // Mark as patched to prevent double-patching
      StoragePrototype.prototype.getItem.__mgtoolsPatched = true;
    }
  } catch (error) {
    // Patching may fail in restricted environments - continue anyway
  }
}

/**
 * Installs GM_getValue proxy to enforce tombstone on GM storage reads.
 * When clear flag is set, returns empty array for log keys regardless of
 * what's actually stored in GM storage.
 *
 * @param {Object} dependencies - Injected dependencies
 * @param {Object} dependencies.window - Window object
 * @param {Object} dependencies.localStorage - localStorage instance
 * @param {Function} dependencies.GM_getValue - Original GM_getValue function
 * @param {string} dependencies.LOG_MAIN - Main log storage key
 * @param {string} dependencies.LOG_ARCH - Archive log storage key
 * @param {string} dependencies.FLAG - Clear flag key
 * @returns {void}
 *
 * @example
 * installGMGetValueProxy({
 *   window: window,
 *   localStorage: window.localStorage,
 *   GM_getValue: GM_getValue,
 *   LOG_MAIN: 'MGA_petAbilityLogs',
 *   LOG_ARCH: 'MGA_petAbilityLogs_archive',
 *   FLAG: 'MGA_logs_manually_cleared'
 * });
 */
export function installGMGetValueProxy(dependencies) {
  const { window: win, localStorage: storage, GM_getValue: gmGetValue, LOG_MAIN, LOG_ARCH, FLAG } = dependencies;

  try {
    if (typeof gmGetValue === 'function' && !gmGetValue.__mgtoolsPatched) {
      const originalGMGetValue = gmGetValue;

      win.GM_getValue = function (key, defaultValue) {
        // Enforce tombstone: return empty array if clear flag is set
        if ((key === LOG_MAIN || key === LOG_ARCH) && storage.getItem(FLAG) === 'true') {
          return '[]';
        }
        return originalGMGetValue.apply(this, arguments);
      };

      // Mark as patched to prevent double-patching
      win.GM_getValue.__mgtoolsPatched = true;
    }
  } catch (error) {
    // Patching may fail in restricted environments - continue anyway
  }
}

/**
 * Installs GM_setValue proxy to auto-clear tombstone flag when logs are written.
 * When new logs are written to GM storage, automatically removes the clear flag
 * so logs can persist normally again.
 *
 * @param {Object} dependencies - Injected dependencies
 * @param {Object} dependencies.window - Window object
 * @param {Object} dependencies.localStorage - localStorage instance
 * @param {Function} dependencies.GM_setValue - Original GM_setValue function
 * @param {string} dependencies.LOG_MAIN - Main log storage key
 * @param {string} dependencies.FLAG - Clear flag key
 * @returns {void}
 *
 * @example
 * installGMSetValueProxy({
 *   window: window,
 *   localStorage: window.localStorage,
 *   GM_setValue: GM_setValue,
 *   LOG_MAIN: 'MGA_petAbilityLogs',
 *   FLAG: 'MGA_logs_manually_cleared'
 * });
 */
export function installGMSetValueProxy(dependencies) {
  const { window: win, localStorage: storage, GM_setValue: gmSetValue, LOG_MAIN, FLAG } = dependencies;

  try {
    if (typeof gmSetValue === 'function' && !gmSetValue.__mgtoolsPatched) {
      const originalGMSetValue = gmSetValue;

      win.GM_setValue = function (key, value) {
        // If writing to main log key, clear the tombstone flag if array has data
        if (key === LOG_MAIN) {
          try {
            const arr = Array.isArray(value) ? value : typeof value === 'string' ? JSON.parse(value) : [];
            if (arr && arr.length) {
              storage.removeItem(FLAG);
            }
          } catch {
            // Parse error - continue anyway
          }
        }
        return originalGMSetValue.apply(this, arguments);
      };

      // Mark as patched to prevent double-patching
      win.GM_setValue.__mgtoolsPatched = true;
    }
  } catch (error) {
    // Patching may fail in restricted environments - continue anyway
  }
}

/**
 * Installs click event handler to intercept clear button clicks.
 * Listens for clicks on clear ability logs buttons and triggers hard clear.
 *
 * @param {Object} dependencies - Injected dependencies
 * @param {Object} dependencies.document - Document object
 * @param {Function} dependencies.hardClear - Hard clear function
 * @returns {void}
 *
 * @example
 * installClearButtonHandler({
 *   document: document,
 *   hardClear: persistence.hardClear
 * });
 */
export function installClearButtonHandler(dependencies) {
  const { document: doc, hardClear } = dependencies;

  doc.addEventListener(
    'click',
    event => {
      // Check if click target is a clear logs button (multiple selector support)
      const target =
        event.target &&
        event.target.closest(
          '#clear-ability-logs,' +
            '[data-role="clear-ability-logs"],' +
            '[data-action="clear-ability-logs"],' +
            '[data-mga-clear-logs],' +
            '#mga-clear-logs'
        );

      if (target) {
        hardClear();
      }
    },
    true // Use capture phase to intercept before other handlers
  );
}

// ============================================================================
// SECTION 2: PROXY ARRAY WRAPPER FOR DEDUPLICATION
// ============================================================================
// Wraps ability log arrays with a deduplication proxy to prevent duplicate entries.

/**
 * Creates a fingerprint hash for an ability log entry.
 * Uses FNV-1a hash algorithm for fast, deterministic hashing.
 *
 * @private
 * @param {Object} logEntry - Ability log entry
 * @param {string} logEntry.abilityType - Type of ability
 * @param {string} logEntry.petName - Name of pet
 * @param {number} logEntry.timestamp - Entry timestamp
 * @returns {string} Fingerprint hash in base36
 */
function createLogFingerprint(logEntry) {
  const abilityType = (logEntry && logEntry.abilityType) || '';
  const petName = (logEntry && logEntry.petName) || '';
  const timestamp = String((logEntry && logEntry.timestamp) || 0);

  // FNV-1a hash
  let hash = 2166136261 >>> 0;
  const str = abilityType + '|' + petName + '|' + timestamp;

  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }

  return (hash >>> 0).toString(36);
}

/**
 * Wraps an ability log array with deduplication proxy.
 * Prevents duplicate entries from being added via push, unshift, splice, etc.
 * Also clears tombstone flag when new entries are added.
 *
 * @param {Array} array - Array to wrap (modified in place)
 * @param {Function} clearFlagCallback - Function to call when new logs added
 * @returns {Proxy} Proxied array with deduplication
 *
 * @example
 * const logs = [];
 * const wrappedLogs = wrapLogsArray(logs, () => {
 *   localStorage.removeItem('MGA_logs_manually_cleared');
 * });
 * wrappedLogs.push(newLog); // Deduplication applied automatically
 */
export function wrapLogsArray(array, clearFlagCallback) {
  let arrayLocal = array;
  if (!Array.isArray(arrayLocal)) {
    arrayLocal = [];
  }

  const seen = new Set();

  /**
   * Deduplication push - adds item only if not already seen
   * @private
   * @param {Object} item - Log entry to add
   * @returns {number} 1 if added, 0 if duplicate
   */
  const dedupePush = item => {
    const id = item.id || createLogFingerprint(item);
    if (seen.has(id)) {
      return 0; // Duplicate - don't add
    }
    seen.add(id);
    arrayLocal.push({ ...item, id });
    return 1; // Added
  };

  // Seed the seen set with existing entries
  for (const item of arrayLocal) {
    seen.add(item.id || createLogFingerprint(item));
  }

  // Return proxied array with deduplication
  return new Proxy(arrayLocal, {
    get(target, prop, receiver) {
      // Intercept array mutation methods
      if (['push', 'unshift', 'splice', 'concat'].includes(prop)) {
        return function (...args) {
          let added = 0;

          if (prop === 'push' || prop === 'unshift') {
            // Dedupe each item being added
            for (const item of args) {
              added += dedupePush(item);
            }
            if (added > 0 && clearFlagCallback) {
              clearFlagCallback();
            }
            return target.length;
          }

          if (prop === 'splice') {
            // Splice with new items - rebuild array with deduplication
            if (args.length > 2) {
              const start = args[0] >>> 0;
              const deleteCount = args[1] >>> 0;
              const newItems = args.slice(2);

              const before = target.slice(0, start);
              const after = target.slice(start + deleteCount);
              const rebuilt = wrapLogsArray(before, clearFlagCallback);

              for (const item of newItems) {
                dedupePush.call({ arr: rebuilt }, item);
              }
              for (const item of after) {
                dedupePush.call({ arr: rebuilt }, item);
              }

              // Replace target array contents
              while (target.length) target.pop();
              for (const item of rebuilt) target.push(item);

              if (clearFlagCallback) {
                clearFlagCallback();
              }

              return [];
            }
          }

          return Array.prototype[prop].apply(target, args);
        };
      }

      return Reflect.get(target, prop, receiver);
    },

    set(target, key, value) {
      // Direct index sets count as add
      if (!isNaN(key)) {
        const added = dedupePush(value);
        if (added > 0 && clearFlagCallback) {
          clearFlagCallback();
        }
        return true;
      }
      return Reflect.set(target, key, value);
    }
  });
}

// ============================================================================
// SECTION 3: PUBLIC API FACTORY
// ============================================================================
// Creates the window.MGA public API object with all debug/control functions.

/**
 * Creates the MGA public API object.
 * Provides external interfaces for debugging, manual controls, data export/import,
 * and various utility functions for working with MGTools.
 *
 * @param {Object} dependencies - Injected dependencies
 * @param {Object} dependencies.UnifiedState - Unified state object
 * @param {Function} dependencies.productionLog - Production logging function
 * @param {Function} dependencies.initializeScript - Script initialization function
 * @param {Object} dependencies.targetWindow - Target window object
 * @param {Object} dependencies.targetDocument - Target document object
 * @param {Function} dependencies.updateTabContent - Tab content update function
 * @param {Function} dependencies.updateTimerDisplay - Timer display update function
 * @param {Function} dependencies.updateValues - Values update function
 * @param {Function} dependencies.updateTimers - Timers update function
 * @param {Function} dependencies.openTabInPopout - Open tab in popout function
 * @param {Function} dependencies.openTabInSeparateWindow - Open separate window function
 * @param {Function} dependencies.createInGameOverlay - Create overlay function
 * @param {Function} dependencies.closeInGameOverlay - Close overlay function
 * @param {Function} dependencies.refreshOverlayContent - Refresh overlay function
 * @param {Function} dependencies.applyTheme - Apply theme function
 * @param {Function} dependencies.safeSendMessage - Safe send message function
 * @param {Function} dependencies.MGA_saveJSON - Save JSON to storage function
 * @param {Function} dependencies.MGA_manageLogMemory - Manage log memory function
 * @param {Function} dependencies.MGA_debouncedSave - Debounced save function
 * @param {Function} dependencies.updateAbilityLogDisplay - Update ability log display
 * @param {Function} dependencies.updatePureOverlayContent - Update pure overlay content
 * @param {Function} dependencies.addResizeHandleToOverlay - Add resize handle function
 * @param {Function} dependencies.getAbilitiesTabContent - Get abilities tab HTML
 * @param {Function} dependencies.updatePetPresetDropdown - Update pet preset dropdown
 * @param {Function} dependencies.refreshSeparateWindowPopouts - Refresh separate windows
 * @param {Function} dependencies.exportAbilityLogs - Export ability logs function
 * @param {Function} dependencies.getActivePetsFromRoomState - Get active pets function
 * @param {Function} dependencies.updateActivePetsFromRoomState - Update active pets function
 * @returns {Object} MGA public API object
 *
 * @example
 * const MGA = createPublicAPI({
 *   UnifiedState: window.UnifiedState,
 *   productionLog: productionLog,
 *   initializeScript: initializeScript,
 *   // ... other dependencies
 * });
 * window.MGA = MGA;
 */
export function createPublicAPI(dependencies) {
  const {
    UnifiedState,
    productionLog,
    initializeScript,
    targetWindow,
    targetDocument,
    updateTabContent,
    updateTimerDisplay,
    updateValues,
    updateTimers,
    openTabInPopout,
    openTabInSeparateWindow,
    createInGameOverlay,
    closeInGameOverlay,
    refreshOverlayContent,
    applyTheme,
    safeSendMessage,
    MGA_saveJSON,
    MGA_manageLogMemory,
    MGA_debouncedSave,
    updateAbilityLogDisplay,
    updatePureOverlayContent,
    addResizeHandleToOverlay,
    getAbilitiesTabContent,
    updatePetPresetDropdown,
    refreshSeparateWindowPopouts,
    exportAbilityLogs,
    getActivePetsFromRoomState,
    updateActivePetsFromRoomState
  } = dependencies;

  return {
    // Direct state access
    state: UnifiedState,

    // ==================== MANUAL CONTROLS ====================

    /**
     * Shows the main MGA panel.
     * @returns {void}
     * @example
     * MGA.showPanel(); // Panel becomes visible
     */
    showPanel: () => {
      if (UnifiedState.panels.main) {
        UnifiedState.panels.main.style.display = 'block';
      }
    },

    /**
     * Hides the main MGA panel.
     * @returns {void}
     * @example
     * MGA.hidePanel(); // Panel becomes hidden
     */
    hidePanel: () => {
      if (UnifiedState.panels.main) {
        UnifiedState.panels.main.style.display = 'none';
      }
    },

    /**
     * Manually initializes the script.
     * Use if script doesn't auto-initialize.
     * @returns {void}
     * @example
     * MGA.init(); // Manually start initialization
     */
    init: () => {
      productionLog('🔄 Manual initialization requested...');
      UnifiedState.initialized = false; // Reset flag
      initializeScript();
    },

    /**
     * Force reinitialization by clearing all flags and reloading.
     * Recovery function for stuck initialization.
     * @returns {void}
     * @example
     * MGA.forceReinit(); // Clear flags and reload page
     */
    forceReinit: () => {
      productionLog('🔄 Force reinitialization requested...');
      try {
        delete targetWindow._MGA_INITIALIZING;
      } catch (e) {
        targetWindow._MGA_INITIALIZING = undefined;
      }
      try {
        delete targetWindow._MGA_INITIALIZED;
      } catch (e) {
        targetWindow._MGA_INITIALIZED = undefined;
      }
      try {
        delete targetWindow._MGA_TIMESTAMP;
      } catch (e) {
        targetWindow._MGA_TIMESTAMP = undefined;
      }
      targetWindow._MGA_FORCE_INIT = true;
      location.reload();
    },

    /**
     * Checks data persistence status.
     * Logs current state of petPresets, seeds, and raw storage values.
     * @returns {void}
     * @example
     * MGA.checkPersistence();
     * // Logs:
     * // Pet Presets in State: 3
     * // Pet Presets in Storage: EXISTS
     * // Seeds in State: 5
     * // ...
     */
    checkPersistence: () => {
      productionLog('📊 Data Persistence Check:');
      productionLog('  Pet Presets in State:', Object.keys(UnifiedState.data.petPresets).length);
      productionLog('  Pet Presets in Storage:', localStorage.getItem('MGA_petPresets') ? 'EXISTS' : 'MISSING');
      productionLog('  Seeds in State:', UnifiedState.data.seedsToDelete.length);
      productionLog('  Seeds in Storage:', localStorage.getItem('MGA_seedsToDelete') ? 'EXISTS' : 'MISSING');

      if (localStorage.getItem('MGA_petPresets')) {
        productionLog('  Raw Presets:', localStorage.getItem('MGA_petPresets'));
      }
      if (localStorage.getItem('MGA_seedsToDelete')) {
        productionLog('  Raw Seeds:', localStorage.getItem('MGA_seedsToDelete'));
      }
    },

    // ==================== POP-OUT FUNCTIONALITY ====================

    /**
     * Pop-out window controls.
     * @namespace
     */
    popout: {
      /**
       * Opens a tab in a new browser tab (popout mode).
       * @param {string} tabName - Tab name to open
       * @returns {void}
       * @example
       * MGA.popout.openTab('abilities'); // Opens abilities in new tab
       */
      openTab: tabName => openTabInPopout(tabName),

      /**
       * Opens a tab in a separate browser window.
       * @param {string} tabName - Tab name to open
       * @returns {void}
       * @example
       * MGA.popout.openSeparateWindow('pets'); // Opens pets in new window
       */
      openSeparateWindow: tabName => openTabInSeparateWindow(tabName),

      /**
       * Creates an in-game overlay for a tab.
       * @param {string} tabName - Tab name to overlay
       * @returns {void}
       * @example
       * MGA.popout.createOverlay('timers'); // Creates overlay for timers
       */
      createOverlay: tabName => createInGameOverlay(tabName),

      /**
       * Closes an in-game overlay.
       * @param {string} tabName - Tab name to close
       * @returns {void}
       * @example
       * MGA.popout.closeOverlay('timers'); // Closes timers overlay
       */
      closeOverlay: tabName => closeInGameOverlay(tabName),

      /**
       * Refreshes overlay content.
       * @param {string} tabName - Tab name to refresh
       * @returns {void}
       * @example
       * MGA.popout.refreshOverlay('abilities'); // Refreshes abilities overlay
       */
      refreshOverlay: tabName => refreshOverlayContent(tabName)
    },

    // ==================== DEBUG FUNCTIONS ====================

    /**
     * Debug utilities for development and testing.
     * @namespace
     */
    debug: {
      /**
       * Logs the entire UnifiedState object.
       * @returns {void}
       * @example
       * MGA.debug.logState(); // Logs UnifiedState to console
       */
      logState: () => productionLog('MGA State:', UnifiedState),

      /**
       * Logs all atom values.
       * @returns {void}
       * @example
       * MGA.debug.logAtoms(); // Logs atoms to console
       */
      logAtoms: () => productionLog('Atoms:', UnifiedState.atoms),

      /**
       * Logs all data values.
       * @returns {void}
       * @example
       * MGA.debug.logData(); // Logs data to console
       */
      logData: () => productionLog('Data:', UnifiedState.data),

      /**
       * Tests the universal theming system.
       * Temporarily applies rainbow theme for 5 seconds.
       * @returns {void}
       * @example
       * MGA.debug.testTheming();
       * // Applies rainbow theme for 5s, then restores original
       */
      testTheming: () => {
        productionLog('🎨 Testing universal theming system...');
        productionLog('Current theme:', UnifiedState.currentTheme);
        productionLog('Active overlays:', UnifiedState.data.popouts.overlays.size);
        productionLog('Theme sync working:', !!UnifiedState.currentTheme);

        // Apply test theme
        const originalStyle = UnifiedState.data.settings.gradientStyle;
        UnifiedState.data.settings.gradientStyle = 'rainbow-burst';
        UnifiedState.data.settings.opacity = 75;
        applyTheme();

        productionLog('✅ Test theme applied! Check all windows for rainbow theme.');
        productionLog('💡 Open a pop-out or overlay to see the theme in action!');

        // Restore original after 5 seconds
        setTimeout(() => {
          UnifiedState.data.settings.gradientStyle = originalStyle;
          UnifiedState.data.settings.opacity = 95;
          applyTheme();
          productionLog('🔄 Original theme restored.');
        }, 5000);
      },

      /**
       * Checks if game connection is available.
       * @returns {boolean} True if connection available
       * @example
       * if (MGA.debug.checkConnection()) {
       *   console.log('Connected to game');
       * }
       */
      checkConnection: () => {
        const hasConnection =
          targetWindow.MagicCircle_RoomConnection &&
          typeof targetWindow.MagicCircle_RoomConnection.sendMessage === 'function';
        productionLog('🔌 Connection Status:', hasConnection ? '✅ Available' : '❌ Not Available');
        productionLog('📡 RoomConnection Object:', targetWindow.MagicCircle_RoomConnection);
        return hasConnection;
      },

      /**
       * Tests the safeSendMessage function.
       * @returns {boolean} True if send succeeded
       * @example
       * if (MGA.debug.testSendMessage()) {
       *   console.log('Send message works');
       * }
       */
      testSendMessage: () => {
        productionLog('🧪 Testing safeSendMessage...');
        const result = safeSendMessage({
          scopePath: ['Room'],
          type: 'Ping'
        });
        productionLog('Result:', result ? '✅ Success' : '❌ Failed');
        return result;
      },

      /**
       * Debugs storage state.
       * @returns {void}
       * @example
       * MGA.debug.debugStorage(); // Logs all storage keys/values
       */
      debugStorage: () => targetWindow.MGA_debugStorage(),

      /**
       * Adds a test ability log entry.
       * @returns {void}
       * @example
       * MGA.debug.testAbilityLog();
       * // Adds test log and updates UI
       */
      testAbilityLog: () => {
        UnifiedState.data.petAbilityLogs.unshift({
          petName: 'Test Pet',
          abilityType: 'Test Ability',
          timestamp: Date.now(),
          timeString: new Date().toLocaleTimeString(),
          data: { test: true }
        });

        // Apply memory management
        UnifiedState.data.petAbilityLogs = MGA_manageLogMemory(UnifiedState.data.petAbilityLogs);
        MGA_debouncedSave('MGA_petAbilityLogs', UnifiedState.data.petAbilityLogs);

        // Update main tab if visible
        if (UnifiedState.activeTab === 'abilities') {
          updateTabContent();
        }

        // Update all overlay windows showing abilities tab
        UnifiedState.data.popouts.overlays.forEach((overlay, tabName) => {
          if (overlay && document.contains(overlay) && tabName === 'abilities') {
            if (overlay.className.includes('mga-overlay-content-only')) {
              // NEW: Pure content overlays
              updatePureOverlayContent(overlay, tabName);
              debugLog('OVERLAY_LIFECYCLE', 'Updated pure abilities overlay after test ability');
            } else {
              // LEGACY: Old overlay structure
              const overlayContent = overlay.querySelector('.mga-overlay-content > div');
              if (overlayContent) {
                overlayContent.innerHTML = getAbilitiesTabContent();
                setTimeout(() => updateAbilityLogDisplay(overlay), 10);

                // Re-add resize handle after content update
                setTimeout(() => {
                  if (!overlay.querySelector('.mga-resize-handle')) {
                    addResizeHandleToOverlay(overlay);
                    productionLog('🔧 [RESIZE] Re-added missing resize handle to ability logs overlay');
                  }
                }, 50);
              }
            }
          }
        });
      },

      /**
       * Sets test timer values.
       * @returns {void}
       * @example
       * MGA.debug.testTimer();
       * // Sets seed=120, egg=240, tool=180, lunar=3600
       */
      testTimer: () => {
        UnifiedState.data.timers = {
          seed: 120,
          egg: 240,
          tool: 180,
          lunar: 3600
        };
        if (UnifiedState.activeTab === 'timers') {
          updateTimerDisplay();
        }
      },

      /**
       * Sets test value amounts.
       * @returns {void}
       * @example
       * MGA.debug.testValues();
       * // Sets test values for inventory/tile/garden
       */
      testValues: () => {
        UnifiedState.data.inventoryValue = 123456;
        UnifiedState.data.tileValue = 78900;
        UnifiedState.data.gardenValue = 456789;
        if (UnifiedState.activeTab === 'values') {
          updateTabContent();
        }
      }
    },

    // ==================== MANUAL REFRESH FUNCTIONS ====================

    /**
     * Manual refresh controls for each tab.
     * @namespace
     */
    refresh: {
      /**
       * Refreshes pets tab (targeted update to prevent UI interruption).
       * @returns {void}
       * @example
       * MGA.refresh.pets(); // Updates pet preset dropdown
       */
      pets: () => {
        if (UnifiedState.activeTab === 'pets') {
          const context = targetDocument.getElementById('mga-tab-content');
          if (context) {
            updatePetPresetDropdown(context);
            refreshSeparateWindowPopouts('pets');
            UnifiedState.data.popouts.overlays.forEach((overlay, tabName) => {
              if (overlay && document.contains(overlay) && tabName === 'pets') {
                if (overlay.className.includes('mga-overlay-content-only')) {
                  updatePureOverlayContent(overlay, tabName);
                }
              }
            });
          }
        }
      },

      /**
       * Refreshes abilities tab.
       * @returns {void}
       * @example
       * MGA.refresh.abilities(); // Reloads ability log display
       */
      abilities: () => {
        if (UnifiedState.activeTab === 'abilities') updateTabContent();
      },

      /**
       * Refreshes seeds tab.
       * @returns {void}
       * @example
       * MGA.refresh.seeds(); // Reloads seed deletion list
       */
      seeds: () => {
        if (UnifiedState.activeTab === 'seeds') updateTabContent();
      },

      /**
       * Refreshes values tab.
       * @returns {void}
       * @example
       * MGA.refresh.values(); // Recalculates all values
       */
      values: () => {
        updateValues();
        if (UnifiedState.activeTab === 'values') updateTabContent();
      },

      /**
       * Refreshes timers tab.
       * @returns {void}
       * @example
       * MGA.refresh.timers(); // Updates all timer displays
       */
      timers: () => {
        updateTimers();
        if (UnifiedState.activeTab === 'timers') updateTimerDisplay();
      },

      /**
       * Refreshes all tabs.
       * @returns {void}
       * @example
       * MGA.refresh.all(); // Full refresh of all data
       */
      all: () => {
        updateTabContent();
        updateValues();
        updateTimers();
      }
    },

    // ==================== EXPORT FUNCTIONS ====================

    /**
     * Data export controls.
     * @namespace
     */
    export: {
      /**
       * Exports pet presets to JSON file.
       * @returns {void}
       * @example
       * MGA.export.petPresets();
       * // Downloads: MGA_PetPresets.json
       */
      petPresets: () => {
        const data = JSON.stringify(UnifiedState.data.petPresets, null, 2);
        const blob = new Blob([data], { type: 'application/json' });
        const link = targetDocument.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'MGA_PetPresets.json';
        link.click();
      },

      /**
       * Exports ability logs to JSON file.
       * @returns {void}
       * @example
       * MGA.export.abilityLogs();
       * // Downloads: MGA_AbilityLogs_YYYY-MM-DD.json
       */
      abilityLogs: () => exportAbilityLogs(),

      /**
       * Exports all data (presets, logs, settings) to JSON file.
       * @returns {void}
       * @example
       * MGA.export.allData();
       * // Downloads: MGA_AllData_YYYY-MM-DD.json
       */
      allData: () => {
        const data = JSON.stringify(
          {
            petPresets: UnifiedState.data.petPresets,
            petAbilityLogs: UnifiedState.data.petAbilityLogs,
            settings: {
              seedsToDelete: UnifiedState.data.seedsToDelete,
              autoDeleteEnabled: UnifiedState.data.autoDeleteEnabled
            }
          },
          null,
          2
        );
        const blob = new Blob([data], { type: 'application/json' });
        const link = targetDocument.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `MGA_AllData_${new Date().toISOString().split('T')[0]}.json`;
        link.click();
      }
    },

    // ==================== IMPORT FUNCTIONS ====================

    /**
     * Data import controls.
     * @namespace
     */
    import: {
      /**
       * Imports pet presets from JSON string.
       * @param {string} jsonString - JSON string to import
       * @returns {void}
       * @example
       * MGA.import.petPresets('{"preset1": {...}}');
       * // Imports and saves presets
       */
      petPresets: jsonString => {
        try {
          const data = JSON.parse(jsonString);
          UnifiedState.data.petPresets = data;
          MGA_saveJSON('MGA_petPresets', data);

          if (UnifiedState.activeTab === 'pets') {
            const context = targetDocument.getElementById('mga-tab-content');
            if (context) {
              updatePetPresetDropdown(context);
              refreshSeparateWindowPopouts('pets');
            }
          }
          productionLog('✅ Pet presets imported successfully');
        } catch (e) {
          console.error('❌ Failed to import pet presets:', e);
        }
      },

      /**
       * Imports all data from JSON string.
       * @param {string} jsonString - JSON string to import
       * @returns {void}
       * @example
       * MGA.import.allData('{"petPresets": {...}, "petAbilityLogs": [...]}');
       * // Imports all data and updates UI
       */
      allData: jsonString => {
        try {
          const data = JSON.parse(jsonString);

          if (data.petPresets) {
            UnifiedState.data.petPresets = data.petPresets;
            MGA_saveJSON('MGA_petPresets', data.petPresets);
          }
          if (data.petAbilityLogs) {
            UnifiedState.data.petAbilityLogs = data.petAbilityLogs;
            MGA_saveJSON('MGA_petAbilityLogs', data.petAbilityLogs);
          }
          if (data.settings) {
            if (data.settings.seedsToDelete) {
              UnifiedState.data.seedsToDelete = data.settings.seedsToDelete;
            }
            if (typeof data.settings.autoDeleteEnabled === 'boolean') {
              UnifiedState.data.autoDeleteEnabled = data.settings.autoDeleteEnabled;
            }
          }

          updateTabContent();
          productionLog('✅ All data imported successfully');
        } catch (e) {
          console.error('❌ Failed to import data:', e);
        }
      }
    },

    // ==================== CLEAR FUNCTIONS ====================

    /**
     * Data clearing controls.
     * @namespace
     */
    clear: {
      /**
       * Clears all pet presets (with confirmation).
       * @returns {void}
       * @example
       * MGA.clear.petPresets();
       * // Prompts user, then clears if confirmed
       */
      petPresets: () => {
        if (confirm('Clear all pet presets?')) {
          UnifiedState.data.petPresets = {};
          MGA_saveJSON('MGA_petPresets', {});

          if (UnifiedState.activeTab === 'pets') {
            const context = targetDocument.getElementById('mga-tab-content');
            if (context) {
              updatePetPresetDropdown(context);
              refreshSeparateWindowPopouts('pets');
            }
          }
        }
      },

      /**
       * Clears all ability logs (with confirmation).
       * @returns {void}
       * @example
       * MGA.clear.abilityLogs();
       * // Prompts user, then clears if confirmed
       */
      abilityLogs: () => {
        if (confirm('Clear all ability logs?')) {
          UnifiedState.data.petAbilityLogs = [];
          MGA_saveJSON('MGA_petAbilityLogs', []);

          if (UnifiedState.activeTab === 'abilities') {
            updateTabContent();
          }

          // Update ability overlays
          UnifiedState.data.popouts.overlays.forEach((overlay, tabName) => {
            if (overlay && document.contains(overlay) && tabName === 'abilities') {
              if (overlay.className.includes('mga-overlay-content-only')) {
                updatePureOverlayContent(overlay, tabName);
                debugLog('OVERLAY_LIFECYCLE', 'Updated pure abilities overlay after clearing logs');
              } else {
                const overlayContent = overlay.querySelector('.mga-overlay-content > div');
                if (overlayContent) {
                  overlayContent.innerHTML = getAbilitiesTabContent();
                  setTimeout(() => updateAbilityLogDisplay(overlay), 10);

                  // Re-add resize handle
                  setTimeout(() => {
                    if (!overlay.querySelector('.mga-resize-handle')) {
                      addResizeHandleToOverlay(overlay);
                      productionLog('🔧 [RESIZE] Re-added missing resize handle to ability logs overlay');
                    }
                  }, 50);
                }
              }
            }
          });
        }
      },

      /**
       * Clears ALL saved data (with confirmation).
       * @returns {void}
       * @example
       * MGA.clear.allData();
       * // Prompts user, then clears everything if confirmed
       */
      allData: () => {
        if (confirm('Clear ALL saved data? This cannot be undone!')) {
          UnifiedState.data.petPresets = {};
          UnifiedState.data.petAbilityLogs = [];
          UnifiedState.data.seedsToDelete = [];
          UnifiedState.data.autoDeleteEnabled = false;
          MGA_saveJSON('MGA_petPresets', {});
          MGA_saveJSON('MGA_petAbilityLogs', []);
          updateTabContent();
        }
      }
    },

    // ==================== DEBUG CONTROLS ====================

    /**
     * Debug controls for development and testing.
     * @namespace
     */
    debugControls: {
      /**
       * Forces re-initialization by setting force flag and reloading.
       * @returns {void}
       * @example
       * MGA.debugControls.forceInit();
       * // Sets _MGA_FORCE_INIT=true and reloads
       */
      forceInit: () => {
        productionLog('🔄 [DEBUG] Force re-initialization requested');
        targetWindow._MGA_FORCE_INIT = true;
        location.reload();
      },

      /**
       * Resets initialization flags without reloading.
       * @returns {void}
       * @example
       * MGA.debugControls.resetFlags();
       * // Clears all init flags
       */
      resetFlags: () => {
        productionLog('🔄 [DEBUG] Resetting initialization flags');
        targetWindow._MGA_INITIALIZED = false;
        try {
          delete targetWindow._MGA_INITIALIZING;
        } catch (e) {
          targetWindow._MGA_INITIALIZING = false;
        }
        targetWindow._MGA_FORCE_INIT = false;
        productionLog('✅ [DEBUG] Flags reset - you can now re-run the script');
      },

      /**
       * Checks current pet state from multiple sources.
       * @returns {Object} Pet state from UnifiedState, window, and Room
       * @example
       * const pets = MGA.debugControls.checkPets();
       * console.log('Active pets:', pets.unifiedState);
       */
      checkPets: () => {
        productionLog('🐾 [DEBUG] Current pet state:');
        productionLog('• UnifiedState.atoms.activePets:', UnifiedState.atoms.activePets);
        productionLog('• window.activePets:', targetWindow.activePets);
        productionLog('• Room state pets:', getActivePetsFromRoomState());
        return {
          unifiedState: UnifiedState.atoms.activePets,
          windowPets: targetWindow.activePets,
          roomState: getActivePetsFromRoomState()
        };
      },

      /**
       * Manually refreshes pets from room state.
       * @returns {Array} Updated pet list
       * @example
       * const pets = MGA.debugControls.refreshPets();
       * console.log('Refreshed pets:', pets);
       */
      refreshPets: () => {
        productionLog('🔄 [DEBUG] Manually refreshing pets from room state');
        const pets = updateActivePetsFromRoomState();
        productionLog('✅ [DEBUG] Pets refreshed:', pets);
        return pets;
      },

      /**
       * Lists all active managed intervals.
       * @returns {Object} Interval status object
       * @example
       * const intervals = MGA.debugControls.listIntervals();
       * console.log('Active intervals:', intervals);
       */
      listIntervals: () => {
        productionLog('⏰ [DEBUG] Active managed intervals:');
        Object.entries(UnifiedState.intervals).forEach(([name, interval]) => {
          productionLog(`• ${name}: ${interval ? 'Running' : 'Stopped'}`);
        });
        return UnifiedState.intervals;
      }
    }
  };
}

// ============================================================================
// SECTION 4: UTILITY API FACTORIES
// ============================================================================
// Additional utility APIs exposed on window (loading states, error recovery, etc.)

/**
 * Creates loading state utilities.
 * Provides functions for showing/hiding loading spinners and skeletons.
 *
 * @param {Object} dependencies - Injected dependencies
 * @param {Object} dependencies.Array - Array constructor
 * @returns {Object} Loading state utilities
 *
 * @example
 * const loadingStates = createLoadingStates({ Array: Array });
 * loadingStates.show(element, 'Loading data...');
 */
export function createLoadingStates(dependencies) {
  const { Array: ArrayConstructor } = dependencies;

  return {
    /**
     * Shows loading spinner in element.
     * @param {HTMLElement} element - Element to show loading in
     * @param {string} [text='Loading...'] - Loading text
     * @returns {void}
     */
    show: (element, text = 'Loading...') => {
      if (!element) return;
      const loadingHtml = `
        <div class="mga-loading">
          <div class="mga-loading-spinner"></div>
          <span>${text}</span>
        </div>
      `;
      element.innerHTML = loadingHtml;
    },

    /**
     * Shows skeleton loading animation.
     * @param {HTMLElement} element - Element to show skeleton in
     * @param {number} [lines=3] - Number of skeleton lines
     * @returns {void}
     */
    showSkeleton: (element, lines = 3) => {
      if (!element) return;
      const skeletonLines = ArrayConstructor(lines)
        .fill(0)
        .map(
          () =>
            `<div class="mga-skeleton" style="height: 20px; margin-bottom: 8px; width: ${Math.floor(Math.random() * 40 + 60)}%;"></div>`
        )
        .join('');
      element.innerHTML = `<div style="padding: 20px;">${skeletonLines}</div>`;
    },

    /**
     * Hides loading and shows content.
     * @param {HTMLElement} element - Element to update
     * @param {string} content - Content HTML to show
     * @param {boolean} [fadeIn=true] - Whether to fade in
     * @returns {void}
     */
    hide: (element, content, fadeIn = true) => {
      if (!element) return;
      element.innerHTML = content;
      if (fadeIn) {
        element.classList.add('mga-fade-in');
        setTimeout(() => element.classList.remove('mga-fade-in'), 300);
      }
    },

    /**
     * Adds loading spinner to button.
     * @param {HTMLElement} button - Button element
     * @param {string} originalText - Original button text (unused, for API compatibility)
     * @returns {void}
     */
    addToButton: (button, originalText) => {
      if (!button) return;
      button.disabled = true;
      button.innerHTML = `<div class="mga-loading-spinner" style="margin-right: 4px; width: 16px; height: 16px;"></div>Loading...`;
    },

    /**
     * Removes loading spinner from button.
     * @param {HTMLElement} button - Button element
     * @param {string} originalText - Original button text to restore
     * @returns {void}
     */
    removeFromButton: (button, originalText) => {
      if (!button) return;
      button.disabled = false;
      button.innerHTML = originalText;
    }
  };
}

/**
 * Creates error recovery utilities.
 * Provides function wrappers with error handling and user feedback.
 *
 * @param {Object} dependencies - Injected dependencies
 * @param {Object} dependencies.targetDocument - Target document object
 * @param {Function} dependencies.debugError - Debug error logging function
 * @param {Function} dependencies.debugLog - Debug log function
 * @returns {Object} Error recovery utilities
 *
 * @example
 * const errorRecovery = createErrorRecovery({
 *   targetDocument: document,
 *   debugError: console.error,
 *   debugLog: console.log
 * });
 * const safeFn = errorRecovery.wrapFunction(riskyFn, fallbackFn, 'MyFunction');
 */
export function createErrorRecovery(dependencies) {
  const { targetDocument, debugError, debugLog } = dependencies;

  return {
    /**
     * Wraps a function with error handling.
     * @param {Function} fn - Function to wrap
     * @param {Function|null} fallback - Fallback function on error
     * @param {string} [context='Unknown'] - Context name for logging
     * @returns {Function} Wrapped function
     */
    wrapFunction: (fn, fallback = null, context = 'Unknown') => {
      return function (...args) {
        try {
          return fn.apply(this, args);
        } catch (error) {
          debugError('ERROR_RECOVERY', `Error in ${context}`, error);

          // Show user-friendly error toast
          const errorToast = targetDocument.createElement('div');
          errorToast.style.cssText = `
            position: fixed; top: 20px; right: 20px; z-index: 20000;
            background: rgba(220, 38, 38, 0.95); color: white;
            padding: 12px 20px; border-radius: 8px;
            font-family: Arial, sans-serif; font-size: 13px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
            animation: mga-fade-in 0.3s ease-out;
          `;
          errorToast.innerHTML = `⚠️ Something went wrong in ${context}. Please try again.`;
          targetDocument.body.appendChild(errorToast);

          setTimeout(() => {
            errorToast.style.animation = 'mga-fade-out 0.3s ease-in forwards';
            setTimeout(() => targetDocument.body.removeChild(errorToast), 300);
          }, 4000);

          return fallback ? fallback.apply(this, args) : null;
        }
      };
    },

    /**
     * Wraps async function with error handling.
     * @param {Function} asyncFn - Async function to wrap
     * @param {*} fallback - Fallback value on error
     * @param {string} [context='Async Operation'] - Context name for logging
     * @returns {Promise<*>} Promise resolving to result or fallback
     */
    safeAsync: async (asyncFn, fallback = null, context = 'Async Operation') => {
      try {
        return await asyncFn();
      } catch (error) {
        debugError('ERROR_RECOVERY', `Async error in ${context}`, error);
        return fallback;
      }
    },

    /**
     * Retries operation with exponential backoff.
     * @param {Function} operation - Async operation to retry
     * @param {number} [maxRetries=3] - Maximum retry attempts
     * @param {number} [delay=1000] - Base delay in ms
     * @param {string} [context='Operation'] - Context name for logging
     * @returns {Promise<*>} Promise resolving to operation result
     * @throws {Error} If all retries fail
     */
    retryOperation: async (operation, maxRetries = 3, delay = 1000, context = 'Operation') => {
      for (let i = 0; i < maxRetries; i++) {
        try {
          return await operation();
        } catch (error) {
          if (i === maxRetries - 1) {
            debugError('ERROR_RECOVERY', `Final retry failed for ${context}`, error);
            throw error;
          }
          debugLog('ERROR_RECOVERY', `Retry ${i + 1}/${maxRetries} for ${context}`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
  };
}

/**
 * Creates performance optimization utilities.
 * Provides debounce, throttle, and DOM optimization helpers.
 *
 * @param {Object} dependencies - Injected dependencies
 * @param {Object} dependencies.document - Document object
 * @param {Function} dependencies.requestAnimationFrame - requestAnimationFrame function
 * @param {Function} dependencies.setTimeout - setTimeout function
 * @param {Function} dependencies.clearTimeout - clearTimeout function
 * @returns {Object} Performance utilities
 *
 * @example
 * const perf = createPerformanceUtils({
 *   document: document,
 *   requestAnimationFrame: window.requestAnimationFrame,
 *   setTimeout: window.setTimeout,
 *   clearTimeout: window.clearTimeout
 * });
 * const debouncedFn = perf.debounce(myFn, 300);
 */
export function createPerformanceUtils(dependencies) {
  const { document: doc, requestAnimationFrame, setTimeout, clearTimeout } = dependencies;

  return {
    /**
     * Debounces a function.
     * @param {Function} func - Function to debounce
     * @param {number} wait - Wait time in ms
     * @returns {Function} Debounced function
     */
    debounce: (func, wait) => {
      let timeout;
      return function executedFunction(...args) {
        const later = () => {
          clearTimeout(timeout);
          func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
      };
    },

    /**
     * Throttles a function.
     * @param {Function} func - Function to throttle
     * @param {number} limit - Throttle limit in ms
     * @returns {Function} Throttled function
     */
    throttle: (func, limit) => {
      let inThrottle;
      return function () {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
          func.apply(context, args);
          inThrottle = true;
          setTimeout(() => (inThrottle = false), limit);
        }
      };
    },

    /**
     * Batches DOM updates using requestAnimationFrame.
     * @param {Array<Function>} updates - Array of update functions
     * @returns {void}
     */
    batchDOMUpdates: updates => {
      requestAnimationFrame(() => {
        const fragment = doc.createDocumentFragment();
        updates.forEach(update => {
          if (typeof update === 'function') {
            update(fragment);
          }
        });
      });
    },

    /**
     * Optimizes element for scrolling performance.
     * @param {HTMLElement} element - Element to optimize
     * @returns {void}
     */
    optimizeScrolling: element => {
      if (!element) return;
      element.style.willChange = 'scroll-position';
      element.style.transform = 'translateZ(0)';
    }
  };
}

/**
 * Creates tooltip system utilities.
 * Provides comprehensive tooltip management with smart positioning.
 *
 * @param {Object} dependencies - Injected dependencies
 * @param {Object} dependencies.targetDocument - Target document object
 * @param {Object} dependencies.document - Main document object
 * @param {Object} dependencies.window - Window object
 * @param {Function} dependencies.isMGAEvent - Function to check if event is MGA-related
 * @returns {Object} Tooltip utilities
 *
 * @example
 * const tooltips = createTooltips({
 *   targetDocument: document,
 *   document: document,
 *   window: window,
 *   isMGAEvent: (e) => e.target.closest('.mga-panel')
 * });
 * tooltips.init();
 */
export function createTooltips(dependencies) {
  const { targetDocument, document: doc, window: win, isMGAEvent } = dependencies;

  let tooltip = null;
  let showTimeout = null;
  const hideTimeout = null; // Declared but unused - kept for API compatibility
  let currentEvent = null;

  // Define helper functions first (before handlers that use them)
  // Note: position must be defined before show since show calls it
  const position = e => {
    const rect = tooltip.getBoundingClientRect();
    const padding = 10;

    let x = e.clientX + padding;
    let y = e.clientY - rect.height - padding;

    // Adjust if tooltip goes off screen
    if (x + rect.width > win.innerWidth) {
      x = e.clientX - rect.width - padding;
    }
    if (y < 0) {
      y = e.clientY + padding;
    }

    tooltip.style.left = x + 'px';
    tooltip.style.top = y + 'px';
  };

  const show = (element, text) => {
    tooltip.textContent = text;

    // Position immediately before showing to prevent flash
    if (currentEvent) {
      position(currentEvent);
    }

    tooltip.classList.add('show');
  };

  const hide = () => {
    tooltip.classList.remove('show');

    // Reset position to prevent stuck tooltips
    tooltip.style.left = '-9999px';
    tooltip.style.top = '-9999px';
    currentEvent = null;
  };

  // Event handlers (use the functions defined above)
  const handleMouseEnter = e => {
    const element = e.target?.closest?.('[data-tooltip]');
    if (!element) return;

    // Don't interfere with button interactions
    if (
      e.target &&
      typeof e.target.matches === 'function' &&
      (e.target.matches('button, input, select, .mga-btn') || e.target.closest('button, .mga-btn'))
    ) {
      return;
    }

    const text = element.dataset.tooltip;
    const delay = element.dataset.tooltipDelay || 500;

    currentEvent = e;

    showTimeout = setTimeout(() => {
      show(element, text);
    }, parseInt(delay));
  };

  const handleMouseLeave = e => {
    const element = e.target?.closest?.('[data-tooltip]');
    if (!element) return;

    clearTimeout(showTimeout);
    hide();
  };

  const handleMouseMove = e => {
    // Only handle MGA-related tooltip events
    if (!isMGAEvent(e)) {
      return;
    }

    // Don't interfere with button hover states
    if (
      e.target &&
      typeof e.target.matches === 'function' &&
      (e.target.matches('button, input, select, .mga-btn') || e.target.closest('button, .mga-btn'))
    ) {
      return;
    }

    currentEvent = e;

    if (tooltip && tooltip.classList.contains('show')) {
      const tooltipElement = e.target?.closest?.('[data-tooltip]');
      if (!tooltipElement) {
        hide();
        return;
      }
      position(e);
    }
  };

  return {
    /**
     * Initializes tooltip system.
     * @returns {void}
     */
    init: () => {
      // Create tooltip element
      if (!tooltip) {
        tooltip = targetDocument.createElement('div');
        tooltip.className = 'mga-tooltip';
        targetDocument.body.appendChild(tooltip);
      }

      // Add event listeners
      doc.addEventListener('mouseenter', handleMouseEnter, true);
      doc.addEventListener('mouseleave', handleMouseLeave, true);
      doc.addEventListener('mousemove', handleMouseMove, true);
    },

    /**
     * Adds tooltip to element.
     * @param {HTMLElement} element - Element to add tooltip to
     * @param {string} text - Tooltip text
     * @param {Object} [options={}] - Tooltip options
     * @param {number} [options.delay] - Delay before showing (ms)
     * @returns {void}
     */
    addToElement: (element, text, options = {}) => {
      if (!element) return;
      element.setAttribute('data-tooltip', text);
      if (options.delay) element.setAttribute('data-tooltip-delay', options.delay);
    },

    /**
     * Removes tooltip from element.
     * @param {HTMLElement} element - Element to remove tooltip from
     * @returns {void}
     */
    removeFromElement: element => {
      if (!element) return;
      element.removeAttribute('data-tooltip');
      element.removeAttribute('data-tooltip-delay');
    }
  };
}

// ============================================================================
// SECTION 5: INSTALLATION FUNCTION
// ============================================================================
// Main installation function to attach API to window.

/**
 * Installs the public API on window object.
 * Sets up all APIs, patches, and event handlers.
 *
 * @param {Object} dependencies - All required dependencies
 * @returns {void}
 *
 * @example
 * installPublicAPI({
 *   window: window,
 *   document: document,
 *   localStorage: window.localStorage,
 *   console: console,
 *   UnifiedState: UnifiedState,
 *   // ... all other dependencies
 * });
 */
export function installPublicAPI(dependencies) {
  const { window: win, document: doc, localStorage: storage } = dependencies;

  // 1. Create ability log persistence system
  const persistence = createAbilityLogPersistence({
    localStorage: storage,
    console: console,
    GM_getValue: typeof GM_getValue !== 'undefined' ? GM_getValue : null,
    GM_setValue: typeof GM_setValue !== 'undefined' ? GM_setValue : null
  });

  // 2. Install storage proxies
  installLocalStorageProxy({
    Storage: Storage,
    localStorage: storage,
    LOG_MAIN: persistence.LOG_MAIN,
    LOG_ARCH: persistence.LOG_ARCH,
    FLAG: persistence.FLAG
  });

  if (typeof GM_getValue !== 'undefined') {
    installGMGetValueProxy({
      window: win,
      localStorage: storage,
      GM_getValue: GM_getValue,
      LOG_MAIN: persistence.LOG_MAIN,
      LOG_ARCH: persistence.LOG_ARCH,
      FLAG: persistence.FLAG
    });
  }

  if (typeof GM_setValue !== 'undefined') {
    installGMSetValueProxy({
      window: win,
      localStorage: storage,
      GM_setValue: GM_setValue,
      LOG_MAIN: persistence.LOG_MAIN,
      FLAG: persistence.FLAG
    });
  }

  // 3. Install clear button handler
  installClearButtonHandler({
    document: doc,
    hardClear: persistence.hardClear
  });

  // 4. Expose hard clear on window
  win.MGTOOLS_hardClearAbilityLogs = persistence.hardClear;

  // 5. Create and install main API
  win.MGA = createPublicAPI(dependencies);

  // 6. Create and install utility APIs
  win.MGA_LoadingStates = createLoadingStates({
    Array: Array
  });

  win.MGA_ErrorRecovery = createErrorRecovery({
    targetDocument: dependencies.targetDocument,
    debugError: dependencies.debugError,
    debugLog: dependencies.debugLog
  });

  win.MGA_Performance = createPerformanceUtils({
    document: doc,
    requestAnimationFrame: win.requestAnimationFrame.bind(win),
    setTimeout: win.setTimeout.bind(win),
    clearTimeout: win.clearTimeout.bind(win)
  });

  win.MGA_Tooltips = createTooltips({
    targetDocument: dependencies.targetDocument,
    document: doc,
    window: win,
    isMGAEvent: dependencies.isMGAEvent
  });
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  // Persistence workarounds
  createAbilityLogPersistence,
  installLocalStorageProxy,
  installGMGetValueProxy,
  installGMSetValueProxy,
  installClearButtonHandler,
  wrapLogsArray,

  // Public API
  createPublicAPI,

  // Utility APIs
  createLoadingStates,
  createErrorRecovery,
  createPerformanceUtils,
  createTooltips,

  // Installation
  installPublicAPI
};
