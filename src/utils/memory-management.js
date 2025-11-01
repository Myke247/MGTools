/**
 * Memory Management Module
 * =========================
 * Advanced memory management and cleanup system for optimal performance.
 *
 * Systems included:
 * - Cleanup Handlers - Register and execute cleanup functions
 * - Interval/Timeout Tracking - Track and cleanup timers
 * - Debounced Save - Reduce I/O with smart debouncing
 * - Log Memory Management - Archive old logs to reduce memory footprint
 * - DOM Element Pooling - Reuse DOM elements for performance
 *
 * @module utils/memory-management
 */
import { productionLog, productionError, productionWarn, debugLog } from '../core/logging.js';

/* ============================================================================
 * CLEANUP HANDLER SYSTEM
 * ============================================================================ */

/**
 * Initialize the memory management system
 *
 * @param {object} dependencies - Injected dependencies
 * @returns {object} Memory management API
 *
 * @example
 * const memoryMgmt = initializeMemoryManagement({ productionLog, UnifiedState });
 */
export function initializeMemoryManagement(dependencies = {}) {
  const {
    productionLog = console.log,
    productionWarn = console.warn,
    MGA_saveJSON,
    MGA_loadJSON,
    UnifiedState,
    targetDocument = typeof document !== 'undefined' ? document : null,
    targetWindow = typeof window !== 'undefined' ? window : null
  } = dependencies;

  // Internal state
  const mgaCleanupHandlers = [];
  let mgaIntervals = [];
  let mgaTimeouts = [];
  const saveTimeouts = new Map();

  // Configuration for memory limits
  const MGA_MemoryConfig = {
    maxLogsInMemory: 1000, // Keep latest 1000 logs in memory
    maxLogsInStorage: 10000, // Archive up to 10000 logs in storage
    saveDebounceMs: 2000, // Debounce saves by 2 seconds
    domPoolSize: 50 // Pool size for DOM elements
  };

  /**
   * Register cleanup handler
   *
   * @param {Function} handler - Cleanup function to register
   *
   * @example
   * MGA_addCleanupHandler(() => productionLog('Cleaning up...'));
   */
  function MGA_addCleanupHandler(handler) {
    if (typeof handler === 'function') {
      mgaCleanupHandlers.push(handler);
    }
  }

  /**
   * Register interval for automatic cleanup
   *
   * @param {number} interval - Interval ID
   * @returns {number} Interval ID
   *
   * @example
   * const id = setInterval(() => {}, 1000);
   * MGA_addInterval(id);
   */
  function MGA_addInterval(interval) {
    mgaIntervals.push(interval);
    return interval;
  }

  /**
   * Register timeout for automatic cleanup
   *
   * @param {number} timeout - Timeout ID
   * @returns {number} Timeout ID
   *
   * @example
   * const id = setTimeout(() => {}, 1000);
   * MGA_addTimeout(id);
   */
  function MGA_addTimeout(timeout) {
    mgaTimeouts.push(timeout);
    return timeout;
  }

  /**
   * Clean up all MGA resources
   *
   * @example
   * MGA_cleanup();
   */
  function MGA_cleanup() {
    productionLog('🧹 [MEMORY] Starting MGA cleanup...');

    try {
      // Clear all intervals
      mgaIntervals.forEach(interval => {
        if (interval) {
          clearInterval(interval);
        }
      });
      productionLog(`🧹 [MEMORY] Cleared ${mgaIntervals.length} intervals`);
      mgaIntervals = [];

      // Clear all timeouts
      mgaTimeouts.forEach(timeout => {
        if (timeout) {
          clearTimeout(timeout);
        }
      });
      productionLog(`🧹 [MEMORY] Cleared ${mgaTimeouts.length} timeouts`);
      mgaTimeouts = [];

      // Run custom cleanup handlers
      mgaCleanupHandlers.forEach((handler, index) => {
        try {
          handler();
          productionLog(`🧹 [MEMORY] Executed cleanup handler ${index + 1}`);
        } catch (error) {
          productionError(`❌ [MEMORY] Cleanup handler ${index + 1} failed:`, error);
        }
      });

      // Clear event listeners
      if (targetWindow && targetWindow.MGA_Internal && targetWindow.MGA_Internal.eventListeners) {
        targetWindow.MGA_Internal.eventListeners.forEach(({ element, event, handler }) => {
          try {
            element.removeEventListener(event, handler);
          } catch (error) {
            productionWarn(`⚠️ [MEMORY] Failed to remove event listener:`, error);
          }
        });
        productionLog(`🧹 [MEMORY] Removed ${targetWindow.MGA_Internal.eventListeners.length} event listeners`);
        targetWindow.MGA_Internal.eventListeners = [];
      }

      // Clear large data structures
      if (targetWindow && targetWindow.UnifiedState && MGA_saveJSON) {
        // Save critical data before cleanup
        const criticalData = {
          petPresets: targetWindow.UnifiedState.data?.petPresets,
          seedsToDelete: targetWindow.UnifiedState.data?.seedsToDelete,
          settings: targetWindow.UnifiedState.data?.settings
        };

        // Save critical data
        Object.keys(criticalData).forEach(key => {
          if (criticalData[key] !== undefined) {
            MGA_saveJSON(`MGA_${key}`, criticalData[key]);
          }
        });

        // BUGFIX v3.7.7: Don't clear ability logs during cleanup - they're persisted to storage
        // The logs are automatically saved via debounced save system when new logs are added
        // Clearing them here causes loss of logs on page refresh
        // (Removed: window.UnifiedState.data.petAbilityLogs = [])
      }

      productionLog('✅ [MEMORY] MGA cleanup completed successfully');
    } catch (error) {
      productionError('❌ [MEMORY] MGA cleanup failed:', error);
    }
  }

  /* ============================================================================
   * DEBOUNCED SAVE SYSTEM
   * ============================================================================ */

  /**
   * Debounced save system to reduce I/O operations
   *
   * @param {string} key - Storage key
   * @param {*} data - Data to save
   *
   * @example
   * MGA_debouncedSave('myKey', { value: 123 });
   */
  function MGA_debouncedSave(key, data) {
    // Clear existing timeout for this key
    if (saveTimeouts.has(key)) {
      clearTimeout(saveTimeouts.get(key));
    }

    // Set new debounced timeout
    const timeout = setTimeout(() => {
      try {
        if (MGA_saveJSON) {
          MGA_saveJSON(key, data);
          productionLog(`💾 [MEMORY] Debounced save completed for ${key}`);
        }
      } catch (error) {
        productionError(`❌ [MEMORY] Debounced save failed for ${key}:`, error);
      }
      saveTimeouts.delete(key);
    }, MGA_MemoryConfig.saveDebounceMs);

    saveTimeouts.set(key, timeout);
  }

  /* ============================================================================
   * LOG MEMORY MANAGEMENT
   * ============================================================================ */

  /**
   * Smart log management system - archives old logs to reduce memory footprint
   *
   * @param {Array} logs - Array of log entries
   * @returns {Array} Managed logs (recent only)
   *
   * @example
   * const managedLogs = MGA_manageLogMemory(allLogs);
   */
  function MGA_manageLogMemory(logs) {
    if (!Array.isArray(logs) || logs.length <= MGA_MemoryConfig.maxLogsInMemory) {
      return logs; // No management needed
    }

    productionLog(
      `🧠 [MEMORY] Managing log memory: ${logs.length} logs, keeping ${MGA_MemoryConfig.maxLogsInMemory} in memory`
    );

    // Keep the most recent logs in memory
    const recentLogs = logs.slice(0, MGA_MemoryConfig.maxLogsInMemory);

    // Archive older logs to separate storage
    const archivedLogs = logs.slice(MGA_MemoryConfig.maxLogsInMemory);
    if (archivedLogs.length > 0 && MGA_loadJSON && MGA_saveJSON) {
      // Save archived logs to separate storage key
      const existingArchive = MGA_loadJSON('MGA_petAbilityLogs_archive', []);
      const combinedArchive = [...archivedLogs, ...existingArchive].slice(0, MGA_MemoryConfig.maxLogsInStorage);
      MGA_debouncedSave('MGA_petAbilityLogs_archive', combinedArchive);
      productionLog(`📦 [MEMORY] Archived ${archivedLogs.length} logs to storage`);
    }

    // Wrap logs if wrapLogsArray is available
    const wrapLogsArray = dependencies.wrapLogsArray;
    return typeof wrapLogsArray === 'function' ? wrapLogsArray(recentLogs) : recentLogs;
  }

  /**
   * Retrieve all logs (memory + archived) when needed
   *
   * @returns {Array} Combined logs from memory and archive
   *
   * @example
   * const allLogs = MGA_getAllLogs();
   */
  function MGA_getAllLogs() {
    const memoryLogs = UnifiedState?.data?.petAbilityLogs || [];
    const archivedLogs = MGA_loadJSON ? MGA_loadJSON('MGA_petAbilityLogs_archive', []) : [];

    // Combine and sort by timestamp (newest first)
    const allLogs = [...memoryLogs, ...archivedLogs];
    allLogs.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

    productionLog(
      `📜 [MEMORY] Retrieved ${memoryLogs.length} memory logs + ${archivedLogs.length} archived logs = ${allLogs.length} total`
    );
    return allLogs;
  }

  /* ============================================================================
   * DOM ELEMENT POOLING
   * ============================================================================ */

  /**
   * DOM element pooling for performance
   */
  const MGA_DOMPool = {
    pools: new Map(),

    /**
     * Get element from pool or create new one
     *
     * @param {string} tagName - HTML tag name
     * @param {string} className - CSS class name
     * @returns {HTMLElement} DOM element
     *
     * @example
     * const div = MGA_DOMPool.getElement('div', 'my-class');
     */
    getElement: function (tagName, className = '') {
      const key = `${tagName}:${className}`;
      if (!this.pools.has(key)) {
        this.pools.set(key, []);
      }

      const pool = this.pools.get(key);
      if (pool.length > 0) {
        const element = pool.pop();
        // Reset element state
        element.innerHTML = '';
        element.removeAttribute('style');
        element.className = className;
        return element;
      }

      // Create new element if pool is empty (using target context)
      if (!targetDocument) return null;
      const element = targetDocument.createElement(tagName);
      if (className) element.className = className;
      return element;
    },

    /**
     * Return element to pool for reuse
     *
     * @param {HTMLElement} element - Element to return
     *
     * @example
     * MGA_DOMPool.returnElement(myDiv);
     */
    returnElement: function (element) {
      if (!element || !element.tagName) return;

      const key = `${element.tagName.toLowerCase()}:${element.className || ''}`;
      if (!this.pools.has(key)) {
        this.pools.set(key, []);
      }

      const pool = this.pools.get(key);
      if (pool.length < MGA_MemoryConfig.domPoolSize) {
        // Clean element before returning to pool
        element.innerHTML = '';
        element.removeAttribute('style');
        element.onclick = null;
        element.onmouseover = null;
        element.onmouseout = null;
        pool.push(element);
      }
    },

    /**
     * Clean up DOM element pools
     *
     * @example
     * MGA_DOMPool.cleanup();
     */
    cleanup: function () {
      productionLog('🧹 [MEMORY] Cleaning DOM element pools');
      this.pools.clear();
    }
  };

  // Add DOM pool cleanup to main cleanup handler
  MGA_addCleanupHandler(() => {
    MGA_DOMPool.cleanup();
    // Clear save timeouts
    saveTimeouts.forEach(timeout => clearTimeout(timeout));
    saveTimeouts.clear();
  });

  /* ============================================================================
   * EVENT LISTENERS SETUP
   * ============================================================================ */

  /**
   * Setup automatic cleanup event listeners
   *
   * @example
   * setupCleanupListeners();
   */
  function setupCleanupListeners() {
    if (!targetWindow) return;

    // Set up automatic cleanup on page unload
    targetWindow.addEventListener('beforeunload', () => {
      productionLog('🔄 [MEMORY] Page unloading, starting cleanup...');
      MGA_cleanup();
    });

    // Set up cleanup on page hide (for mobile/tab switching)
    targetWindow.addEventListener('pagehide', () => {
      productionLog('🔄 [MEMORY] Page hiding, starting cleanup...');
      MGA_cleanup();
    });
  }

  /* ============================================================================
   * PUBLIC API
   * ============================================================================ */

  return {
    // Cleanup handlers
    MGA_addCleanupHandler,
    MGA_addInterval,
    MGA_addTimeout,
    MGA_cleanup,

    // Debounced save
    MGA_debouncedSave,

    // Log management
    MGA_manageLogMemory,
    MGA_getAllLogs,

    // DOM pooling
    MGA_DOMPool,

    // Configuration
    MGA_MemoryConfig,

    // Setup
    setupCleanupListeners
  };
}

/* ============================================================================
 * EXPORTS
 * ============================================================================ */

export const MemoryManagement = {
  initializeMemoryManagement
};
