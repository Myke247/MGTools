/**
 * STORAGE MODULE
 * ============================================================================
 * Unified storage abstraction with multiple fallback mechanisms
 * Provides consistent storage API with automatic fallback chain:
 * GM Storage → localStorage → sessionStorage → memory
 *
 * @module core/storage
 */
import { productionLog, productionError, productionWarn, debugLog } from '../core/logging.js';


/* ============================================================================
 * DEPENDENCIES
 * ============================================================================
 * These will be provided by the main bundle context:
 * - GM_setValue, GM_getValue, GM_deleteValue (Tampermonkey API)
 * - window, targetWindow, targetDocument (global context)
 * - productionLog, productionWarn (logging functions)
 * - UnifiedState (global state object)
 */

/* ============================================================================
 * STORAGE MODULE - Unified Storage Object
 * ============================================================================
 */

/**
 * Unified Storage Module
 * Provides consistent storage API with automatic fallback chain:
 * GM Storage → localStorage → sessionStorage → memory
 *
 * @namespace Storage
 */
export const Storage = (() => {
  // Private state
  let initialized = false;
  let storageType = null;
  let gmApiAvailable = null;
  const _gmApiWarningShown = false; // Reserved for future warning system
  const memoryStore = {};
  const storageTypes = {
    GM: 'gm',
    LOCAL: 'local',
    SESSION: 'session',
    MEMORY: 'memory'
  };

  // Storage references
  let localStorageRef = null;
  let sessionStorageRef = null;

  /**
   * Test if GM storage API is available and working
   * @private
   * @returns {boolean}
   */
  function testGMStorage() {
    if (gmApiAvailable !== null) return gmApiAvailable;

    try {
      if (typeof GM_setValue === 'undefined' || typeof GM_getValue === 'undefined') {
        gmApiAvailable = false;
        return false;
      }

      // Test actual functionality
      const testKey = '__mgtools_gm_test__';
      const testValue = 'test_' + Date.now();
      GM_setValue(testKey, testValue);
      const retrieved = GM_getValue(testKey, null);

      // Clean up
      if (typeof GM_deleteValue !== 'undefined') {
        try {
          GM_deleteValue(testKey);
        } catch (e) {
          // Ignore GM_deleteValue errors during cleanup
        }
      }

      gmApiAvailable = retrieved === testValue;
      return gmApiAvailable;
    } catch (e) {
      gmApiAvailable = false;
      return false;
    }
  }

  /**
   * Get localStorage reference (with Discord iframe workaround)
   * @private
   * @returns {Storage|null}
   */
  function getLocalStorage() {
    if (localStorageRef) return localStorageRef;

    try {
      // Try direct access
      if (window.localStorage && typeof window.localStorage !== 'undefined') {
        const test = '__localStorage_test__';
        window.localStorage.setItem(test, test);
        window.localStorage.removeItem(test);
        localStorageRef = window.localStorage;
        return localStorageRef;
      }
    } catch (e) {
      // Discord iframe workaround
      try {
        const iframe = document.createElement('iframe');
        iframe.style.display = 'none';
        iframe.style.position = 'absolute';
        iframe.style.width = '0';
        iframe.style.height = '0';

        if (document.body) {
          document.body.appendChild(iframe);
        } else {
          document.documentElement.appendChild(iframe);
        }

        const iframeStorage = iframe.contentWindow.localStorage;
        const test = '__mgtools_iframe_test__';
        iframeStorage.setItem(test, test);
        iframeStorage.removeItem(test);

        localStorageRef = iframeStorage;
        productionLog('✅ [STORAGE] Using iframe localStorage workaround');
        return localStorageRef;
      } catch (iframeError) {
        // Fallback failed
      }
    }

    return null;
  }

  /**
   * Get sessionStorage reference
   * @private
   * @returns {Storage|null}
   */
  function getSessionStorage() {
    if (sessionStorageRef) return sessionStorageRef;

    try {
      if (window.sessionStorage && typeof window.sessionStorage !== 'undefined') {
        const test = '__sessionStorage_test__';
        window.sessionStorage.setItem(test, test);
        window.sessionStorage.removeItem(test);
        sessionStorageRef = window.sessionStorage;
        return sessionStorageRef;
      }
    } catch (e) {
      // sessionStorage not available or blocked
    }

    return null;
  }

  /**
   * Initialize storage system and determine best available type
   * @private
   */
  function initialize() {
    if (initialized) return;

    // Test storage types in order of preference
    if (testGMStorage()) {
      storageType = storageTypes.GM;
      productionLog('✅ [STORAGE] Using GM storage (persistent across domains)');
    } else if (getLocalStorage()) {
      storageType = storageTypes.LOCAL;
      productionLog('✅ [STORAGE] Using localStorage');
    } else if (getSessionStorage()) {
      storageType = storageTypes.SESSION;
      productionWarn('⚠️ [STORAGE] Using sessionStorage (data lost on tab close)');
    } else {
      storageType = storageTypes.MEMORY;
      productionWarn('⚠️ [STORAGE] Using memory storage (data lost on refresh)');
    }

    initialized = true;
  }

  /**
   * Get item from storage
   * @param {string} key - Storage key
   * @param {*} [defaultValue=null] - Default value if not found
   * @returns {*} Value or default
   */
  function getItem(key, defaultValue = null) {
    initialize();

    try {
      let value = null;

      switch (storageType) {
        case storageTypes.GM:
          value = GM_getValue(key, null);
          break;
        case storageTypes.LOCAL:
          value = localStorageRef.getItem(key);
          break;
        case storageTypes.SESSION:
          value = sessionStorageRef.getItem(key);
          break;
        case storageTypes.MEMORY:
          value = memoryStore[key] || null;
          break;
      }

      // Try to parse JSON if applicable
      if (value && typeof value === 'string') {
        try {
          return JSON.parse(value);
        } catch (e) {
          return value;
        }
      }

      return value !== null ? value : defaultValue;
    } catch (e) {
      productionError('[STORAGE] getItem error:', e);
      return defaultValue;
    }
  }

  /**
   * Set item in storage
   * @param {string} key - Storage key
   * @param {*} value - Value to store
   * @returns {boolean} Success status
   */
  function setItem(key, value) {
    initialize();

    try {
      // Convert objects to JSON
      const stringValue = typeof value === 'object' ? JSON.stringify(value) : String(value);

      switch (storageType) {
        case storageTypes.GM:
          GM_setValue(key, stringValue);
          break;
        case storageTypes.LOCAL:
          localStorageRef.setItem(key, stringValue);
          break;
        case storageTypes.SESSION:
          sessionStorageRef.setItem(key, stringValue);
          break;
        case storageTypes.MEMORY:
          memoryStore[key] = stringValue;
          break;
      }

      return true;
    } catch (e) {
      productionError('[STORAGE] setItem error:', e);

      // Try fallback to memory if other storage fails
      if (storageType !== storageTypes.MEMORY) {
        try {
          memoryStore[key] = typeof value === 'object' ? JSON.stringify(value) : String(value);
          productionWarn('[STORAGE] Fallback to memory for key:', key);
          return true;
        } catch (e2) {}
      }

      return false;
    }
  }

  /**
   * Remove item from storage
   * @param {string} key - Storage key
   * @returns {boolean} Success status
   */
  function removeItem(key) {
    initialize();

    try {
      switch (storageType) {
        case storageTypes.GM:
          if (typeof GM_deleteValue !== 'undefined') {
            GM_deleteValue(key);
          } else {
            GM_setValue(key, undefined);
          }
          break;
        case storageTypes.LOCAL:
          localStorageRef.removeItem(key);
          break;
        case storageTypes.SESSION:
          sessionStorageRef.removeItem(key);
          break;
        case storageTypes.MEMORY:
          delete memoryStore[key];
          break;
      }

      return true;
    } catch (e) {
      productionError('[STORAGE] removeItem error:', e);
      return false;
    }
  }

  /**
   * Clear all storage (use with caution)
   * @returns {boolean} Success status
   */
  function clear() {
    initialize();

    try {
      switch (storageType) {
        case storageTypes.GM:
          // GM storage doesn't have a clear method, would need to track keys
          productionWarn('[STORAGE] GM storage clear not implemented');
          break;
        case storageTypes.LOCAL:
          localStorageRef.clear();
          break;
        case storageTypes.SESSION:
          sessionStorageRef.clear();
          break;
        case storageTypes.MEMORY:
          Object.keys(memoryStore).forEach(key => delete memoryStore[key]);
          break;
      }

      return true;
    } catch (e) {
      productionError('[STORAGE] clear error:', e);
      return false;
    }
  }

  /**
   * Get current storage type
   * @returns {string|null} Current storage type
   */
  function getStorageType() {
    initialize();
    return storageType;
  }

  /**
   * Get storage info for debugging
   * @returns {Object} Storage information
   */
  function getInfo() {
    initialize();
    return {
      type: storageType,
      gmAvailable: gmApiAvailable,
      localStorageAvailable: localStorageRef !== null,
      sessionStorageAvailable: sessionStorageRef !== null,
      memoryKeys: Object.keys(memoryStore).length
    };
  }

  // Public API
  return {
    get: getItem,
    set: setItem,
    remove: removeItem,
    clear,
    getType: getStorageType,
    getInfo,

    // Legacy compatibility
    getItem,
    setItem,
    removeItem,

    // Storage type constants
    TYPES: storageTypes
  };
})();

// Legacy compatibility - maintain old references
export const _safeStorage = Storage; // Kept for backwards compatibility
export const localStorage = {
  getItem: key => Storage.get(key),
  setItem: (key, value) => Storage.set(key, value),
  removeItem: key => Storage.remove(key),
  clear: () => Storage.clear(),
  get length() {
    productionWarn('[STORAGE] localStorage.length not supported in unified storage');
    return 0;
  },
  key: _index => {
    productionWarn('[STORAGE] localStorage.key() not supported in unified storage');
    return null;
  }
};

// Export StorageManager as alias
export const StorageManager = Storage;

/* ============================================================================
 * GM API AVAILABILITY CHECK
 * ============================================================================
 */

// Cache GM API check results
let gmApiCheckResult = null;
let gmApiWarningShown = false;

/**
 * Check if GM API is available and functional
 * @returns {boolean} True if GM API is available
 */
export function isGMApiAvailable() {
  // CRITICAL: Wrap entire function in try-catch to prevent script failure on managed devices
  try {
    // Return cached result if already tested
    if (gmApiCheckResult !== null) {
      return gmApiCheckResult;
    }

    // Check if functions exist
    if (typeof GM_setValue === 'undefined' || typeof GM_getValue === 'undefined') {
      gmApiCheckResult = false;
      if (!gmApiWarningShown) {
        try {
          // Note: logWarn will be available in main bundle context
          if (typeof logWarn === 'function') {
            logWarn('GM-STORAGE', 'GM API functions not defined - using localStorage fallback');
          } else {
            productionWarn('⚠️ [GM-STORAGE] GM API not available - using localStorage fallback');
          }
        } catch (e) {
          productionWarn('⚠️ [GM-STORAGE] GM API not available - using localStorage fallback');
        }
        gmApiWarningShown = true;
      }
      return false;
    }

    // Try to actually USE the functions (managed devices may block them)
    try {
      const testKey = '__mgtools_gm_test__';
      const testValue = 'test_' + Date.now();
      GM_setValue(testKey, testValue);
      const retrieved = GM_getValue(testKey, null);

      // Clean up test
      try {
        if (typeof GM_deleteValue !== 'undefined') {
          GM_deleteValue(testKey);
        }
      } catch (e) {
        // Ignore cleanup errors
      }

      // Check if it actually worked
      if (retrieved === testValue) {
        gmApiCheckResult = true;
        try {
          if (typeof logInfo === 'function') {
            logInfo('GM-STORAGE', 'GM API fully functional');
          } else {
            productionLog('✅ [GM-STORAGE] GM API fully functional');
          }
        } catch (e) {
          productionLog('✅ [GM-STORAGE] GM API fully functional');
        }
        return true;
      } else {
        throw new Error('GM_getValue returned incorrect value');
      }
    } catch (e) {
      gmApiCheckResult = false;
      if (!gmApiWarningShown) {
        try {
          if (typeof logWarn === 'function') {
            logWarn('GM-STORAGE', 'GM API blocked by security policy - using localStorage fallback');
          } else {
            productionWarn('⚠️ [GM-STORAGE] GM API blocked - using localStorage fallback');
          }
        } catch (e2) {
          productionWarn('⚠️ [GM-STORAGE] GM API blocked - using localStorage fallback');
        }
        gmApiWarningShown = true;
      }
      return false;
    }
  } catch (outerError) {
    // Absolute last resort - assume GM API is not available and continue
    gmApiCheckResult = false;
    gmApiWarningShown = true;
    try {
      productionWarn('⚠️ [GM-STORAGE] Unexpected error testing GM API - using localStorage fallback');
    } catch (e) {
      // Even console might fail on heavily locked down devices
    }
    return false;
  }
}

/* ============================================================================
 * MGA_loadJSON - Advanced Multi-Source JSON Loading
 * ============================================================================
 */

/**
 * Load JSON data from storage with multi-source fallback
 * Searches GM storage, window.localStorage, and targetWindow.localStorage
 * Returns the best (most populated) non-empty data found
 *
 * @param {string} key - Storage key (automatically prefixed with MGA_ if needed)
 * @param {*} [fallback=null] - Fallback value if not found
 * @returns {*} Parsed data or fallback
 */
export function MGA_loadJSON(key, fallback = null) {
  let keyLocal = key;
  // Enforce MGA_ namespace
  if (keyLocal && !String(keyLocal).startsWith('MGA_')) {
    productionError(`❌ [MGA-ISOLATION] CRITICAL: Attempted to load with non-MGA key: ${keyLocal}`);
    try {
      console.trace();
    } catch (_) {}
    keyLocal = 'MGA_' + keyLocal;
  }
  try {
    const gmAvailable = typeof GM_getValue === 'function' && typeof GM_setValue === 'function';

    // Collect ALL accessible localStorage contexts
    const lsMain = typeof window !== 'undefined' && window && window.localStorage ? window.localStorage : null;
    const lsTarg =
      typeof targetWindow !== 'undefined' && targetWindow && targetWindow.localStorage
        ? targetWindow.localStorage
        : null;

    const readLS = (ls, k) => {
      if (!ls) return null;
      try {
        return ls.getItem(k);
      } catch (e) {
        return null;
      }
    };

    const toStr = val => (val == null ? null : typeof val === 'string' ? val : JSON.stringify(val));
    const tryParseDeep = val => {
      if (val == null) return null;
      if (typeof val === 'string') {
        const s = val;
        if (s === '' || s === 'null' || s === 'undefined') return null;
        try {
          let first = JSON.parse(s);
          if (typeof first === 'string') {
            try {
              first = JSON.parse(first);
            } catch (e) {
              /* keep as string */
            }
          }
          return first;
        } catch (e) {
          return null;
        }
      }
      if (typeof val === 'object') return val;
      return null;
    };
    const score = obj => {
      if (!obj) return -1;
      if (Array.isArray(obj)) return obj.length;
      if (typeof obj === 'object') return Object.keys(obj).length;
      return 0;
    };
    const isEmpty = obj => {
      if (!obj) return true;
      if (Array.isArray(obj)) return obj.length === 0;
      if (typeof obj === 'object') return Object.keys(obj).length === 0;
      return false;
    };

    // Read raw values
    let gmRaw = null;
    try {
      gmRaw = gmAvailable ? GM_getValue(keyLocal, null) : null;
    } catch (e) {}

    const mainRaw = readLS(lsMain, keyLocal);
    const targRaw = readLS(lsTarg, keyLocal);

    // Parse candidates
    const gmParsed = typeof gmRaw === 'string' ? tryParseDeep(gmRaw) : tryParseDeep(toStr(gmRaw));
    const mainParsed = tryParseDeep(mainRaw) || tryParseDeep(toStr(mainRaw));
    const targParsed = tryParseDeep(targRaw) || tryParseDeep(toStr(targRaw));

    // Choose the best non-empty candidate
    const gmScore = score(gmParsed);
    const mnScore = score(mainParsed);
    const tgScore = score(targParsed);

    let best = null;
    let bestSrc = 'none';
    // Prioritize GM storage, then window.localStorage, then targetWindow.localStorage
    // Reject empty objects and arrays explicitly
    if (gmParsed && !isEmpty(gmParsed)) {
      best = gmParsed;
      bestSrc = 'GM';
    } else if (mainParsed && !isEmpty(mainParsed)) {
      best = mainParsed;
      bestSrc = 'WIN';
    } else if (targParsed && !isEmpty(targParsed)) {
      best = targParsed;
      bestSrc = 'TGT';
    }

    try {
      if (typeof productionLog === 'function') {
        productionLog(`[STORAGE-CHOICE] ${keyLocal}: gm=${gmScore} win=${mnScore} tgt=${tgScore} chosen=${bestSrc}`);
      }
    } catch (_) {}

    if (best && (typeof best === 'object' || Array.isArray(best))) {
      // Do NOT write during load - only read and return
      // Writing during load was overwriting newer data with older data from other storage locations
      return best;
    }

    // Nothing usable, honor fallback
    return typeof fallback === 'undefined' ? null : fallback;
  } catch (err) {
    productionError('[MGA_loadJSON] Unexpected failure for key', keyLocal, err);
    return typeof fallback === 'undefined' ? null : fallback;
  }
}

/* ============================================================================
 * MGA_saveJSON - Advanced Multi-Strategy JSON Saving
 * ============================================================================
 */

/**
 * Save JSON data to storage with retry logic and verification
 * Uses GM storage as primary with localStorage sync
 *
 * @param {string} key - Storage key (automatically prefixed with MGA_ if needed)
 * @param {*} value - Value to save
 * @param {number} [retryCount=0] - Current retry attempt
 * @returns {boolean|Promise<boolean>} Success status
 */
export function MGA_saveJSON(key, value, retryCount = 0) {
  let keyLocal = key;
  let valueLocal = value;
  // Dedupe guard for ability logs (same pet, ability, timestamp)
  try {
    if (keyLocal === 'MGA_petAbilityLogs' && Array.isArray(valueLocal)) {
      const fp = l => {
        const t = (l && l.abilityType) || '',
          p = (l && l.petName) || '',
          ts = (l && l.timestamp) || 0;
        return t + '|' + p + '|' + String(ts);
      };
      const map = new Map();
      for (const l of valueLocal) {
        const id = l.id || fp(l);
        if (!map.has(id)) map.set(id, Object.assign({ id }, l));
      }
      valueLocal = Array.from(map.values()).sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
    }
  } catch {}

  // CRITICAL: Ensure we never use MainScript keys
  if (keyLocal && !keyLocal.startsWith('MGA_')) {
    productionError(`❌ [MGA-ISOLATION] CRITICAL: Attempted to save with non-MGA key: ${keyLocal}`);
    productionError(`❌ [MGA-ISOLATION] This would conflict with MainScript! Adding MGA_ prefix.`);
    console.trace();
    keyLocal = 'MGA_' + keyLocal;
  }

  // PERSISTENCE GUARD v3.8.6: BLOCK premature saves during initialization (prevents data loss)
  if (
    typeof window !== 'undefined' &&
    window.MGA_PERSISTENCE_GUARD?.initializationSavesBlocked &&
    keyLocal === 'MGA_data'
  ) {
    const stack = new Error().stack;
    if (stack && stack.includes('loadSavedData')) {
      if (typeof productionLog === 'function') {
        productionLog('[PERSISTENCE-GUARD] Blocked premature save during initialization');
        productionLog('[PERSISTENCE-GUARD] This protects user data from being overwritten');
        productionLog('[PERSISTENCE-GUARD] Save will execute after initialization completes');
      }
      if (typeof UnifiedState !== 'undefined' && UnifiedState?.data?.settings?.debugMode) {
        console.trace('Blocked save location:');
      }
      return false; // BLOCK THE SAVE
    }
  }

  const MAX_RETRIES = 3;
  const RETRY_DELAY = 100;

  try {
    // Enhanced GM API availability check
    if (!isGMApiAvailable()) {
      // Warning already shown by isGMApiAvailable(), just use fallback silently
      return MGA_saveJSON_localStorage_fallback(keyLocal, valueLocal);
    }

    // Enhanced logging for critical operations
    if (keyLocal === 'MGA_petPresets' || keyLocal === 'MGA_seedsToDelete') {
      if (typeof productionLog === 'function') {
        productionLog(
          `[GM-STORAGE] Attempting to save critical data: ${keyLocal} (attempt ${retryCount + 1}/${MAX_RETRIES})`
        );
        productionLog(`[GM-STORAGE] Data type:`, typeof valueLocal);
        productionLog(`[GM-STORAGE] Data content:`, valueLocal);
      }
    }

    // GM can store objects directly, but let's use JSON for consistency and debugging
    const jsonString = JSON.stringify(valueLocal);

    // Save using GM_setValue for reliable persistence
    GM_setValue(keyLocal, jsonString);
    if (typeof productionLog === 'function') {
      productionLog(`[GM-STORAGE] GM_setValue executed for ${keyLocal}`);
    }

    // Also write to localStorage to keep in sync
    // This prevents stale localStorage data from overriding newer GM data on load
    try {
      if (typeof localStorage !== 'undefined' && localStorage) {
        localStorage.setItem(keyLocal, jsonString);
        if (typeof productionLog === 'function') {
          productionLog(`[GM-STORAGE] Also synced to localStorage for consistency`);
        }
      }
    } catch (lsErr) {
      // Non-fatal - GM storage is source of truth
      if (typeof productionWarn === 'function') {
        productionWarn(`⚠️ [GM-STORAGE] Could not sync to localStorage (non-fatal):`, lsErr.message);
      }
    }

    // Enhanced verification with deep check
    const verification = GM_getValue(keyLocal, null);
    if (!verification) {
      productionError(`❌ [GM-STORAGE] Save verification failed for ${keyLocal} - no data retrieved!`);

      // Retry logic
      if (retryCount < MAX_RETRIES - 1) {
        if (typeof productionLog === 'function') {
          productionLog(`🔄 [GM-STORAGE] Retrying save for ${keyLocal} in ${RETRY_DELAY}ms...`);
        }
        return new Promise(resolve => {
          setTimeout(() => {
            resolve(MGA_saveJSON(key, value, retryCount + 1));
          }, RETRY_DELAY);
        });
      }

      // Final attempt failed - show user alert
      productionError(`❌ [GM-STORAGE] All retry attempts failed for ${keyLocal}`);
      if (keyLocal === 'MGA_petPresets' || keyLocal === 'MGA_seedsToDelete') {
        alert(`⚠️ Failed to save ${keyLocal.replace('MGA_', '')}! Your changes may not persist.`);
      }
      return false;
    }

    // Deep verification for critical data
    if (keyLocal === 'MGA_petPresets' || keyLocal === 'MGA_seedsToDelete') {
      try {
        const parsedVerification = JSON.parse(verification);
        const originalKeys = Object.keys(valueLocal || {}).sort();
        const savedKeys = Object.keys(parsedVerification || {}).sort();

        if (JSON.stringify(originalKeys) !== JSON.stringify(savedKeys)) {
          if (typeof productionWarn === 'function') {
            productionWarn(`⚠️ [GM-STORAGE] Data structure mismatch for ${keyLocal}, but save likely succeeded`);
          }
        }

        if (typeof productionLog === 'function') {
          productionLog(`✅ [GM-STORAGE] Critical data verification passed for ${keyLocal}`);
        }
      } catch (e) {
        if (typeof productionWarn === 'function') {
          productionWarn(`⚠️ [GM-STORAGE] Could not deep verify ${keyLocal}, but data exists`);
        }
      }
    }

    // Success logging
    if (typeof productionLog === 'function') {
      if (keyLocal === 'MGA_petPresets') {
        productionLog('[GM-STORAGE] Pet presets saved successfully');
      } else if (keyLocal.startsWith('MGA_')) {
        productionLog(`[GM-STORAGE] Saved ${keyLocal}`);
      }
    }

    return true;
  } catch (error) {
    productionError(`❌ [GM-STORAGE] Failed to save ${keyLocal}:`, error);
    productionError(`❌ [GM-STORAGE] Error details:`, {
      name: error.name,
      message: error.message,
      gmApiAvailable: typeof GM_setValue !== 'undefined',
      retryCount: retryCount
    });

    // BUGFIX: Auto-cleanup on storage quota errors (from v1.11.3)
    const errorString = ('' + error).toLowerCase();
    if (errorString.indexOf('quota') >= 0 || errorString.indexOf('exceeded') >= 0) {
      if (typeof productionLog === 'function') {
        productionLog('🧹 [STORAGE-CLEANUP] Quota exceeded - auto-cleaning debug caches...');
      }
      const dropKeys = ['console-history', 'mga-debug-cache', 'mga-temp-cache'];
      for (let i = 0; i < dropKeys.length; i++) {
        try {
          localStorage.removeItem(dropKeys[i]);
          if (typeof productionLog === 'function') {
            productionLog(`🧹 [STORAGE-CLEANUP] Removed: ${dropKeys[i]}`);
          }
        } catch (_e) {}
      }
      // Retry save after cleanup (one time only)
      if (retryCount === 0) {
        if (typeof productionLog === 'function') {
          productionLog(`🔄 [STORAGE-CLEANUP] Retrying save after cleanup...`);
        }
        return MGA_saveJSON(key, value, 1);
      }
    }

    // Retry on error
    if (retryCount < MAX_RETRIES - 1) {
      if (typeof productionLog === 'function') {
        productionLog(`🔄 [GM-STORAGE] Retrying save for ${keyLocal} after error...`);
      }
      return new Promise(resolve => {
        setTimeout(() => {
          resolve(MGA_saveJSON(key, value, retryCount + 1));
        }, RETRY_DELAY);
      });
    }

    return false;
  }
}

/**
 * Fallback save function when GM API is not available
 * @param {string} key - Storage key
 * @param {*} value - Value to save
 * @returns {boolean} Success status
 */
export function MGA_saveJSON_localStorage_fallback(key, value) {
  let valueLocal = value;
  // Dedupe for ability logs in fallback path too
  try {
    if (key === 'MGA_petAbilityLogs' && Array.isArray(valueLocal)) {
      const fp = l => {
        const t = (l && l.abilityType) || '',
          p = (l && l.petName) || '',
          ts = (l && l.timestamp) || 0;
        return t + '|' + p + '|' + String(ts);
      };
      const map = new Map();
      for (const l of valueLocal) {
        const id = l.id || fp(l);
        if (!map.has(id)) map.set(id, Object.assign({ id }, l));
      }
      valueLocal = Array.from(map.values()).sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
    }
  } catch {}

  try {
    const jsonString = JSON.stringify(valueLocal);
    StorageManager.setItem(key, jsonString);

    // Simple verification
    const verification = StorageManager.getItem(key);
    if (verification === jsonString) {
      if (typeof productionLog === 'function') {
        productionLog(`[FALLBACK] Successfully saved ${key} to ${StorageManager.storageType}`);
      }
      return true;
    } else {
      productionError(`[FALLBACK] ${StorageManager.storageType} save verification failed for ${key}`);
      return false;
    }
  } catch (error) {
    // Check if it's a quota exceeded error
    const isQuotaError =
      error.name === 'QuotaExceededError' || error.message.includes('quota') || error.message.includes('exceeded');

    if (isQuotaError) {
      productionError(`[FALLBACK] localStorage quota exceeded for ${key}!`);
      productionError(`[FALLBACK] Try clearing browser console history or other localStorage data`);
      productionError(`[FALLBACK] In Chrome DevTools: Application > Storage > Clear site data`);

      // Alert user for critical data
      if (key === 'MGA_petPresets' || key === 'MGA_seedsToDelete' || key === 'MGA_data') {
        alert(
          `⚠️ localStorage quota exceeded!\n\nYour ${key.replace('MGA_', '')} cannot be saved.\n\nFix:\n1. Open DevTools (F12)\n2. Go to Application tab\n3. Click "Clear site data"\n4. Reload the page`
        );
      }
    } else {
      productionError(`[FALLBACK] localStorage save failed for ${key}:`, error);
    }
    return false;
  }
}

/* ============================================================================
 * STORAGE SYNC FUNCTION
 * ============================================================================
 */

/**
 * Sync storage across GM and localStorage contexts
 * Chooses the best (most populated) data and canonicalizes it everywhere
 * @private
 */
export function _MGA_syncStorageBothWays() {
  try {
    const keys = [
      'MGA_data',
      'MGA_petPresets',
      'MGA_petPresetsOrder',
      'MGA_petAbilityLogs',
      'MGA_petAbilityLogs_archive',
      'MGA_seedsToDelete',
      'MGA_autoDeleteEnabled',
      'MGA_filterMode',
      'MGA_abilityFilters',
      'MGA_customMode',
      'MGA_petFilters',
      'MGA_petPresetHotkeys',
      'MGA_hotkeys'
    ];

    const gmAvailable = typeof GM_getValue === 'function' && typeof GM_setValue === 'function';

    const lsMain = typeof window !== 'undefined' && window && window.localStorage ? window.localStorage : null;
    const lsTarg =
      typeof targetWindow !== 'undefined' && targetWindow && targetWindow.localStorage
        ? targetWindow.localStorage
        : null;

    const readLS = (ls, k) => {
      if (!ls) return null;
      try {
        return ls.getItem(k);
      } catch (e) {
        return null;
      }
    };
    const writeLS = (ls, k, v) => {
      try {
        if (ls) ls.setItem(k, v);
      } catch (e) {}
    };

    const toStr = val => (val == null ? null : typeof val === 'string' ? val : JSON.stringify(val));
    const tryParse = s => {
      if (s == null) return null;
      try {
        const first = JSON.parse(s);
        if (typeof first === 'string') {
          try {
            return JSON.parse(first);
          } catch (e) {
            return first;
          }
        }
        return first;
      } catch (e) {
        return null;
      }
    };
    const score = obj => {
      if (!obj) return -1;
      if (Array.isArray(obj)) return obj.length;
      if (typeof obj === 'object') return Object.keys(obj).length;
      return 0;
    };
    const isEmpty = obj => {
      if (!obj) return true;
      if (Array.isArray(obj)) return obj.length === 0;
      if (typeof obj === 'object') return Object.keys(obj).length === 0;
      return false;
    };

    keys.forEach(key => {
      try {
        const gmRaw = gmAvailable ? GM_getValue(key, null) : null;
        const mainRaw = readLS(lsMain, key);
        const targRaw = readLS(lsTarg, key);

        const gmParsed = (typeof gmRaw === 'string' ? tryParse(gmRaw) : gmRaw) || tryParse(toStr(gmRaw));
        const mainParsed = tryParse(mainRaw) || tryParse(toStr(mainRaw));
        const targParsed = tryParse(targRaw) || tryParse(toStr(targRaw));

        let best = null;
        // Prioritize GM storage, reject empty data
        if (gmParsed && !isEmpty(gmParsed)) best = gmParsed;
        else if (mainParsed && !isEmpty(mainParsed)) best = mainParsed;
        else if (targParsed && !isEmpty(targParsed)) best = targParsed;

        if (best && (typeof best === 'object' || Array.isArray(best))) {
          const stable = JSON.stringify(best);
          try {
            if (gmAvailable) GM_setValue(key, stable);
          } catch (e) {}
          writeLS(lsMain, key, stable);
          writeLS(lsTarg, key, stable);
          if (typeof productionLog === 'function') {
            productionLog(`[STORAGE-SYNC] ${key}: canonicalized across GM/WIN/TGT`);
          }
        }
      } catch (innerErr) {
        productionError('[STORAGE-SYNC] Error while syncing key', key, innerErr);
      }
    });
  } catch (err) {
    productionError('[STORAGE-SYNC] Sync failed:', err);
  }
}
